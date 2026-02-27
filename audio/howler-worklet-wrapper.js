// audio/howler-worklet-wrapper.js
// ESM wrapper that installs a global AudioWorklet stage behind Howler.masterGain.
// Pass a Howler instance (or Howler) and it will monkey patch the master routing once per AudioContext.

const _CTX_STATE = new WeakMap();

const _WORKLET_SOURCE = `
const SHARED = {
  WRITE_INDEX: 0, // absolute sample counter
  SEQ: 1,         // increments per render quantum
  READ_INDEX: 2,  // optional: consumer-maintained absolute read counter
  DROPPED: 3,     // optional: writer-maintained dropped sample count (requires READ_INDEX)
};

class HowlerFxProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "fxGain", defaultValue: 1, minValue: 0, maxValue: 8, automationRate: "a-rate" },
      { name: "clipEnabled", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "clipDrive", defaultValue: 1, minValue: 0, maxValue: 32, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super();

    const o = (options && options.processorOptions) || {};

    this._meterEnabled = o.meterEnabled !== false;
    this._meterHz = Number.isFinite(o.meterHz) ? o.meterHz : 30;
    this._framesPerMeter = this._calcFramesPerMeter(this._meterHz);
    this._resetMeter();

    const shared = o.sharedTap || null;
    this._sharedOn = false;
    this._sharedSamples = null;
    this._sharedState = null;
    this._sharedRingSize = 0;
    this._sharedMask = 0;
    this._sharedIsPow2 = false;
    this._sharedMonoMode = 0; // 0 avg, 1 L, 2 R

    if (shared && shared.samplesSAB && shared.stateSAB && (shared.ringSize | 0) > 0) {
      const ringSize = shared.ringSize | 0;
      const isPow2 = ringSize > 0 && (ringSize & (ringSize - 1)) === 0;

      this._sharedOn = true;
      this._sharedSamples = new Float32Array(shared.samplesSAB);
      this._sharedState = new Int32Array(shared.stateSAB);
      this._sharedRingSize = ringSize | 0;
      this._sharedIsPow2 = !!isPow2;
      this._sharedMask = isPow2 ? ((ringSize - 1) | 0) : 0;

      const mm = shared.monoMode;
      if (mm === "L") this._sharedMonoMode = 1;
      else if (mm === "R") this._sharedMonoMode = 2;
      else this._sharedMonoMode = 0;
    }

    this.port.onmessage = (e) => {
      const m = e && e.data;
      if (!m || typeof m !== "object") return;

      if (m.type === "meter") {
        if (typeof m.enabled === "boolean") this._meterEnabled = m.enabled;
        if (Number.isFinite(m.hz) && m.hz > 0) {
          this._meterHz = m.hz;
          this._framesPerMeter = this._calcFramesPerMeter(this._meterHz);
          this._resetMeter();
        }
        return;
      }

      if (m.type === "sharedTap") {
        if (typeof m.enabled === "boolean") this._sharedOn = m.enabled && !!this._sharedSamples && !!this._sharedState;
        if (m.monoMode === "L") this._sharedMonoMode = 1;
        else if (m.monoMode === "R") this._sharedMonoMode = 2;
        else if (m.monoMode === "avg") this._sharedMonoMode = 0;
        return;
      }

      if (m.type === "ping") {
        this.port.postMessage({
          type: "pong",
          id: m.id | 0,
          t: currentTime,
          sr: sampleRate,
        });
        return;
      }
    };
  }

  _calcFramesPerMeter(hz) {
    const h = hz > 0 ? hz : 30;
    const frames = (sampleRate / h) | 0;
    return frames > 128 ? frames : 128;
  }

  _resetMeter() {
    this._frameCounter = 0;
    this._sumSqL = 0;
    this._sumSqR = 0;
    this._peakL = 0;
    this._peakR = 0;
  }

  _softClip(x) {
    const ax = x < 0 ? -x : x;
    return x / (1 + ax);
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0 || !output || output.length === 0) return true;

    const inL = input[0];
    const inR = input[1] || inL;
    const outL = output[0];
    const outR = output[1] || outL;

    const n = outL.length | 0;

    const fxGainArr = params.fxGain;
    const gainIsA = fxGainArr && fxGainArr.length > 1;

    const clipEnabled = (params.clipEnabled && params.clipEnabled[0]) ? 1 : 0;
    const clipDrive = (params.clipDrive && params.clipDrive[0]) || 1;

    let sumSqL = this._sumSqL;
    let sumSqR = this._sumSqR;
    let peakL = this._peakL;
    let peakR = this._peakR;

    const meterOn = this._meterEnabled;

    const sharedOn = this._sharedOn;
    const sharedSamples = this._sharedSamples;
    const sharedState = this._sharedState;

    const ringSize = this._sharedRingSize | 0;
    const isPow2 = this._sharedIsPow2;
    const mask = this._sharedMask | 0;
    const monoMode = this._sharedMonoMode | 0;

    let wAbs = 0;
    let rAbs = 0;
    let dropped = 0;

    if (sharedOn && sharedState && ringSize > 0) {
      wAbs = Atomics.load(sharedState, SHARED.WRITE_INDEX) | 0;
      rAbs = Atomics.load(sharedState, SHARED.READ_INDEX) | 0;

      const lag = (wAbs - rAbs) | 0;
      if (lag > ringSize) {
        dropped = (lag - ringSize) | 0;
      }
    }

    for (let i = 0; i < n; i++) {
      const g = gainIsA ? fxGainArr[i] : fxGainArr[0];

      let l = (inL[i] || 0) * g;
      let r = (inR[i] || 0) * g;

      if (clipEnabled) {
        l = this._softClip(l * clipDrive);
        r = this._softClip(r * clipDrive);
      }

      outL[i] = l;
      outR[i] = r;

      if (sharedOn && sharedSamples && sharedState && ringSize > 0) {
        let mono = 0;
        if (monoMode === 1) mono = l;
        else if (monoMode === 2) mono = r;
        else mono = 0.5 * (l + r);

        const idx = (wAbs + i) | 0;
        sharedSamples[isPow2 ? (idx & mask) : ((idx % ringSize) | 0)] = mono;
      }

      if (meterOn) {
        const al = l < 0 ? -l : l;
        const ar = r < 0 ? -r : r;
        if (al > peakL) peakL = al;
        if (ar > peakR) peakR = ar;
        sumSqL += l * l;
        sumSqR += r * r;
      }
    }

    if (sharedOn && sharedState && ringSize > 0) {
      const nextW = (wAbs + n) | 0;
      Atomics.store(sharedState, SHARED.WRITE_INDEX, nextW);
      Atomics.add(sharedState, SHARED.SEQ, 1);

      if (dropped > 0) {
        Atomics.add(sharedState, SHARED.DROPPED, dropped);
      }
    }

    if (meterOn) {
      this._sumSqL = sumSqL;
      this._sumSqR = sumSqR;
      this._peakL = peakL;
      this._peakR = peakR;

      this._frameCounter += n;
      if (this._frameCounter >= this._framesPerMeter) {
        const denom = this._frameCounter || 1;

        this.port.postMessage({
          type: "meter",
          peakL: this._peakL,
          peakR: this._peakR,
          rmsL: Math.sqrt(this._sumSqL / denom),
          rmsR: Math.sqrt(this._sumSqR / denom),
        });

        this._resetMeter();
      }
    }

    return true;
  }
}

registerProcessor("howler-fx", HowlerFxProcessor);
`;

function _resolveHowler(howlOrHowler, howlerMaybe) {
  if (howlerMaybe && howlerMaybe.ctx && howlerMaybe.masterGain != null) return howlerMaybe;
  if (howlOrHowler && howlOrHowler.ctx && howlOrHowler.masterGain != null) return howlOrHowler;

  const h = howlOrHowler && howlOrHowler._howler;
  if (h && h.ctx && h.masterGain != null) return h;

  return howlerMaybe || null;
}

function _ensureCtxAndMasterGain(Howler) {
  if (Howler && Howler.ctx && Howler.masterGain) return;

  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) throw new Error("No AudioContext available.");

  if (!Howler.ctx) Howler.ctx = new AC();

  if (!Howler.masterGain) {
    const ctx = Howler.ctx;
    const g = (typeof ctx.createGain === "function") ? ctx.createGain() : ctx.createGainNode();

    let muted = false;
    let vol = 1;

    if (typeof Howler._muted === "boolean") muted = Howler._muted;
    if (typeof Howler._volume === "number") vol = Howler._volume;

    if (typeof Howler.volume === "function") {
      try {
        const v = Howler.volume();
        if (typeof v === "number" && Number.isFinite(v)) vol = v;
      } catch (e) {console.error(e);}
    }

    g.gain.setValueAtTime(muted ? 0 : vol, ctx.currentTime);
    g.connect(ctx.destination);
    Howler.masterGain = g;
  }
}

function _getOrCreateCtxState(ctx) {
  let st = _CTX_STATE.get(ctx);
  if (!st) {
    st = {
      moduleURL: null,
      workletLoaded: false,
      graph: null,
      hadDestinationConnection: null,
    };
    _CTX_STATE.set(ctx, st);
  }
  return st;
}

function _getOrCreateModuleURL(ctx) {
  const st = _getOrCreateCtxState(ctx);
  if (st.moduleURL) return st.moduleURL;

  const blob = new Blob([_WORKLET_SOURCE], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  st.moduleURL = url;
  return url;
}

function _safeDisconnect(node, dest) {
  if (!node) return;
  try {
    if (dest) node.disconnect(dest);
    else node.disconnect();
  } catch (e) {console.error(e);}
}

function _safeConnect(a, b) {
  if (!a || !b) return;
  try { a.connect(b); } catch (e) {console.error(e);}
}

function _isPow2(v) {
  v = v | 0;
  return v > 0 && (v & (v - 1)) === 0;
}

function _nextPow2(v) {
  v = Math.max(1, v | 0);
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;
  return v | 0;
}

export async function ensureHowlerWorklet(howlInstance, opts = {}) {
  const Howler = _resolveHowler(howlInstance, opts.Howler);
  if (!Howler) throw new Error("Howler not provided. Pass { Howler } in opts.");

  _ensureCtxAndMasterGain(Howler);

  const ctx = Howler.ctx;
  if (!ctx || ctx.state === "closed") throw new Error("AudioContext is closed.");
  if (!ctx.audioWorklet) throw new Error("AudioWorklet not available in this browser/context.");

  const st = _getOrCreateCtxState(ctx);
  if (st.graph && st.graph.installed && !opts.forceReinstall) return st.graph.api;

  const moduleURL = opts.workletModuleURL || _getOrCreateModuleURL(ctx);

  if (!st.workletLoaded || opts.forceReloadWorklet) {
    await ctx.audioWorklet.addModule(moduleURL);
    st.workletLoaded = true;
  }

  const preMix = ctx.createGain();
  preMix.gain.value = 1;

  let sharedTapOpts = null;
  const wantShared = !!opts.sharedTap;
  const sabOk = (typeof SharedArrayBuffer !== "undefined") && !!globalThis.crossOriginIsolated;

  if (wantShared && sabOk) {
    const ringReq = (opts.sharedTap && opts.sharedTap.ringSize) ? (opts.sharedTap.ringSize | 0) : 32768;
    const ringSize = _isPow2(ringReq) ? ringReq : _nextPow2(ringReq);

    const samplesSAB = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * ringSize);

    const stateSAB = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 4);
    const state = new Int32Array(stateSAB);
    state[0] = 0;
    state[1] = 0;
    state[2] = 0;
    state[3] = 0;

    sharedTapOpts = {
      ringSize,
      samplesSAB,
      stateSAB,
      monoMode: (opts.sharedTap && opts.sharedTap.monoMode === "L") ? "L"
        : (opts.sharedTap && opts.sharedTap.monoMode === "R") ? "R"
        : "avg",
    };
  }

  const fx = new AudioWorkletNode(ctx, "howler-fx", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    processorOptions: {
      meterEnabled: opts.meterEnabled !== false,
      meterHz: Number.isFinite(opts.meterHz) ? opts.meterHz : 30,
      sharedTap: sharedTapOpts,
    },
  });

  const postGain = ctx.createGain();
  postGain.gain.value = 1;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = (opts.analyser && opts.analyser.fftSize) || 2048;
  if (opts.analyser && typeof opts.analyser.smoothingTimeConstant === "number") {
    analyser.smoothingTimeConstant = opts.analyser.smoothingTimeConstant;
  }

  const useAnalyser = opts.useAnalyser !== false;

  let hadDestConnection = null;
  try {
    Howler.masterGain.disconnect(ctx.destination);
    hadDestConnection = true;
  } catch (e) {console.error(e);
    try {
      Howler.masterGain.disconnect();
      hadDestConnection = true;
    } catch (e) {console.error(e);
      hadDestConnection = false;
    }
  }

  _safeDisconnect(preMix);
  _safeDisconnect(fx);
  _safeDisconnect(analyser);
  _safeDisconnect(postGain);

  _safeConnect(Howler.masterGain, preMix);
  _safeConnect(preMix, fx);

  if (useAnalyser) {
    _safeConnect(fx, analyser);
    _safeConnect(analyser, postGain);
  } else {
    _safeConnect(fx, postGain);
  }

  _safeConnect(postGain, ctx.destination);

  st.hadDestinationConnection = hadDestConnection;

  const meterState = { peakL: 0, peakR: 0, rmsL: 0, rmsR: 0 };
  const pingState = { lastPongAt: 0, lastPongId: 0, lastPongSr: 0 };

  fx.port.onmessage = (e) => {
    const m = e && e.data;
    if (!m || typeof m !== "object") return;

    if (m.type === "meter") {
      meterState.peakL = +m.peakL || 0;
      meterState.peakR = +m.peakR || 0;
      meterState.rmsL = +m.rmsL || 0;
      meterState.rmsR = +m.rmsR || 0;
      return;
    }

    if (m.type === "pong") {
      pingState.lastPongAt = +m.t || 0;
      pingState.lastPongId = m.id | 0;
      pingState.lastPongSr = +m.sr || 0;
    }
  };

  function attachAnalyser() {
    _safeDisconnect(fx);
    _safeDisconnect(analyser);

    _safeConnect(preMix, fx);
    _safeConnect(fx, analyser);
    _safeConnect(analyser, postGain);
  }

  function detachAnalyser() {
    _safeDisconnect(fx);
    _safeDisconnect(analyser);

    _safeConnect(preMix, fx);
    _safeConnect(fx, postGain);
  }

  function _setParam(name, v, atTime) {
    const p = fx.parameters.get(name);
    if (!p) return;
    p.setValueAtTime(v, atTime);
  }

  const api = {
    ctx,
    Howler,

    preMix,
    fx,
    analyser,
    postGain,

    attachAnalyser,
    detachAnalyser,

    sharedTap: sharedTapOpts
      ? {
          ringSize: sharedTapOpts.ringSize | 0,
          samples: new Float32Array(sharedTapOpts.samplesSAB),
          state: new Int32Array(sharedTapOpts.stateSAB),
        }
      : null,

    setFxGain(v, atTime = ctx.currentTime) {
      const x = Number(v);
      if (!Number.isFinite(x)) return;
      _setParam("fxGain", x, atTime);
    },

    rampFxGainLinear(v, endTime) {
      const x = Number(v);
      const t = Number(endTime);
      if (!Number.isFinite(x) || !Number.isFinite(t)) return;
      const p = fx.parameters.get("fxGain");
      if (!p) return;
      p.linearRampToValueAtTime(x, t);
    },

    setSoftClip(enabled, drive = 1) {
      _setParam("clipEnabled", enabled ? 1 : 0, ctx.currentTime);
      const d = Number(drive);
      if (Number.isFinite(d)) _setParam("clipDrive", d, ctx.currentTime);
    },

    setOutputGain(v, atTime = ctx.currentTime) {
      const x = Number(v);
      if (!Number.isFinite(x)) return;
      postGain.gain.setValueAtTime(x, atTime);
    },

    setMeterConfig({ enabled, hz } = {}) {
      fx.port.postMessage({ type: "meter", enabled, hz });
    },

    setSharedTapConfig({ enabled, monoMode } = {}) {
      fx.port.postMessage({ type: "sharedTap", enabled: enabled == null ? undefined : !!enabled, monoMode });
    },

    ping(id = 1) {
      fx.port.postMessage({ type: "ping", id: id | 0 });
    },

    getPingState() {
      return { ...pingState };
    },

    getMeter() {
      return { ...meterState };
    },

    getFrequencyData(outU8) {
      const buf = outU8 || new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      return buf;
    },

    getTimeDomainData(outU8) {
      const buf = outU8 || new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      return buf;
    },

    createInputGain(value = 1) {
      const g = ctx.createGain();
      g.gain.value = Number.isFinite(+value) ? +value : 1;
      _safeConnect(g, preMix);
      return g;
    },

    createBus(value = 1) {
      const bus = ctx.createGain();
      bus.gain.value = Number.isFinite(+value) ? +value : 1;
      _safeConnect(bus, preMix);
      return bus;
    },

    createOscillatorInput({
      type = "sine",
      frequency = 220,
      gain = 0.12,
      start = true,
    } = {}) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(Number.isFinite(+frequency) ? +frequency : 220, ctx.currentTime);

      const g = ctx.createGain();
      g.gain.setValueAtTime(Number.isFinite(+gain) ? +gain : 0.12, ctx.currentTime);

      osc.connect(g);
      _safeConnect(g, preMix);

      if (start) osc.start();

      return {
        osc,
        gainNode: g,
        stop(atTime = ctx.currentTime) {
          try { osc.stop(atTime); } catch (e) {console.error(e);}
        },
        disconnect() {
          _safeDisconnect(osc);
          _safeDisconnect(g);
        },
      };
    },

    disconnect({ restoreDestination = true, revokeModuleURL = false } = {}) {
      _safeDisconnect(Howler.masterGain, preMix);
      _safeDisconnect(preMix);
      _safeDisconnect(fx);
      _safeDisconnect(analyser);
      _safeDisconnect(postGain, ctx.destination);

      if (restoreDestination) {
        _safeConnect(Howler.masterGain, ctx.destination);
      }

      if (revokeModuleURL) {
        const st2 = _getOrCreateCtxState(ctx);
        if (st2.moduleURL) {
          try { URL.revokeObjectURL(st2.moduleURL); } catch (e) {console.error(e);}
          st2.moduleURL = null;
          st2.workletLoaded = false;
        }
      }

      const st2 = _getOrCreateCtxState(ctx);
      st2.graph = null;
    },
  };

  st.graph = { installed: true, api };
  _CTX_STATE.set(ctx, st);

  if (opts.autoReinstallOnUnload && typeof Howler.unload === "function" && !Howler.__workletUnloadPatched) {
    const prevUnload = Howler.unload.bind(Howler);
    Howler.unload = function (...args) {
      const r = prevUnload(...args);
      Promise.resolve().then(() => ensureHowlerWorklet(howlInstance, opts)).catch(() => {});
      return r;
    };
    Howler.__workletUnloadPatched = true;
  }

  return api;
}
