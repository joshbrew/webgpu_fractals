// audio/howlerAudio.js
function _isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

async function _decodeAudioData(ctx, ab) {
  return await new Promise((resolve, reject) => {
    try {
      const p = ctx.decodeAudioData(ab, resolve, reject);
      if (p && typeof p.then === "function") p.then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

function _coerceFile(fileLike) {
  if (!fileLike) return null;
  if (typeof File !== "undefined" && fileLike instanceof File) return fileLike;

  const files = fileLike && fileLike.files;
  if (files && typeof files.length === "number") return files[0] || null;

  if (Array.isArray(fileLike)) return fileLike[0] || null;

  if (typeof FileList !== "undefined" && fileLike instanceof FileList) return fileLike[0] || null;

  return fileLike;
}

async function _fileToArrayBuffer(file) {
  if (file && typeof file.arrayBuffer === "function") return await file.arrayBuffer();

  return await new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error("FileReader failed."));
      fr.onload = () => resolve(fr.result);
      fr.readAsArrayBuffer(file);
    } catch (e) {
      reject(e);
    }
  });
}

async function _fetchArrayBufferDefault(url) {
  const res = await fetch(String(url), { mode: "cors", credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText || ""}`.trim());
  return await res.arrayBuffer();
}

export function createHowlerAudioController({ ensureHowlerWorklet, Howler, fetchArrayBuffer } = {}) {
  if (!_isBrowser()) throw new Error("Browser environment required.");
  if (typeof ensureHowlerWorklet !== "function") throw new Error("ensureHowlerWorklet required.");
  if (!Howler) throw new Error("Howler required. Import it and pass it in.");

  const state = {
    ctx: null,
    api: null,
    analyser: null,

    osc: null,
    oscGain: null,
    bufSrc: null,

    fetchArrayBuffer: typeof fetchArrayBuffer === "function" ? fetchArrayBuffer : null,
  };

  function _stopNodes() {
    if (state.osc) {
      try {
        state.osc.stop();
      } catch (e) {console.error(e);}
      try {
        state.osc.disconnect();
      } catch (e) {console.error(e);}
      state.osc = null;
    }
    if (state.oscGain) {
      try {
        state.oscGain.disconnect();
      } catch (e) {console.error(e);}
      state.oscGain = null;
    }
    if (state.bufSrc) {
      try {
        state.bufSrc.stop();
      } catch (e) {console.error(e);}
      try {
        state.bufSrc.disconnect();
      } catch (e) {console.error(e);}
      state.bufSrc = null;
    }
  }

  async function init({ analyser, outputGain, fxGain } = {}) {
    if (state.api) return;

    state.api = await ensureHowlerWorklet(null, {
      Howler,
      useAnalyser: true,
      meterEnabled: false,
      analyser: analyser || { fftSize: 1024, smoothingTimeConstant: 0.0 },
    });

    state.ctx = state.api.ctx;
    state.analyser = state.api.analyser;

    try {
      if (state.ctx && typeof state.ctx.resume === "function") await state.ctx.resume();
    } catch (e) {console.error(e);}

    setOutputGain(outputGain);
    setFxGain(fxGain);
  }

  async function playOsc({ hz, gain, outputGain, fxGain } = {}) {
    if (!state.api || !state.ctx) throw new Error("init() first");

    _stopNodes();

    setOutputGain(outputGain);
    setFxGain(fxGain);

    const ctx = state.ctx;

    const freq = Number.isFinite(hz) ? Math.max(10, Math.min(24000, hz)) : 440;
    const g = Number.isFinite(gain) ? Math.max(0, Math.min(1, gain)) : 0.12;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(g, ctx.currentTime);

    const inG = state.api.createInputGain(1);
    osc.connect(gn);
    gn.connect(inG);

    osc.start();

    state.osc = osc;
    state.oscGain = gn;
  }

  async function playMp3({ url, loop, outputGain, fxGain } = {}) {
    if (!state.api || !state.ctx) throw new Error("init() first");

    _stopNodes();

    setOutputGain(outputGain);
    setFxGain(fxGain);

    const ctx = state.ctx;

    const fetchAB = state.fetchArrayBuffer || _fetchArrayBufferDefault;
    const ab = await fetchAB(String(url), { method: "GET" });

    const buf = await _decodeAudioData(ctx, ab.slice(0));

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!loop;

    const inG = state.api.createInputGain(1);
    src.connect(inG);

    src.start();

    state.bufSrc = src;
    src.onended = () => {
      if (state.bufSrc === src) state.bufSrc = null;
    };
  }

  async function playUrl({ url, loop, outputGain, fxGain } = {}) {
    return await playMp3({ url, loop, outputGain, fxGain });
  }

  async function playFile({ file, loop, outputGain, fxGain } = {}) {
    if (!state.api || !state.ctx) throw new Error("init() first");

    const f = _coerceFile(file);
    if (!f) throw new Error("file required.");

    _stopNodes();

    setOutputGain(outputGain);
    setFxGain(fxGain);

    const ctx = state.ctx;

    const ab = await _fileToArrayBuffer(f);
    const buf = await _decodeAudioData(ctx, ab.slice(0));

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!loop;

    const inG = state.api.createInputGain(1);
    src.connect(inG);

    src.start();

    state.bufSrc = src;
    src.onended = () => {
      if (state.bufSrc === src) state.bufSrc = null;
    };
  }

  function stop() {
    _stopNodes();
  }

  function shutdown() {
    _stopNodes();
  }

  function setOutputGain(v) {
    const x = Number(v);
    try {
      if (state.api && Number.isFinite(x)) state.api.setOutputGain(x);
    } catch (e) {console.error(e);}
  }

  function setFxGain(v) {
    const x = Number(v);
    try {
      if (state.api && Number.isFinite(x)) state.api.setFxGain(x);
    } catch (e) {console.error(e);}
  }

  function setFetchArrayBuffer(fn) {
    state.fetchArrayBuffer = typeof fn === "function" ? fn : null;
  }

  function getAnalyser() {
    return state.analyser;
  }

  function getCtxState() {
    return state.ctx ? String(state.ctx.state || "unknown") : "none";
  }

  function getSampleRate() {
    return state.ctx ? state.ctx.sampleRate || 0 : 0;
  }

  return {
    init,
    playOsc,
    playMp3,
    playUrl,
    playFile,
    stop,
    shutdown,
    setOutputGain,
    setFxGain,
    setFetchArrayBuffer,
    getAnalyser,
    getCtxState,
    getSampleRate,
  };
}