import { Howler } from "howler";

import { ensureHowlerWorklet } from "../audio/howler-worklet-wrapper.js";
import { createHowlerAudioController } from "../audio/howlerAudio.js";
import { createGradientRenderer } from "../render/gradientRenderer.js";
import { createPaletteWorkerClient } from "../palette/paletteWorkerClient.js";

const SOUND_MODE_OPTIONS = [
  { value: "1", label: "Global response" },
  { value: "2", label: "Local warp" },
  { value: "3", label: "Bass/treble split" },
  { value: "4", label: "Centroid drive" },
];

function byId(root, id) {
  if (!root || !id) return null;
  if (typeof root.getElementById === "function") return root.getElementById(id);
  if (typeof root.querySelector === "function")
    return root.querySelector(`#${id}`);
  return document.getElementById(id);
}

function on(node, type, fn, opts) {
  if (!node || !type || !fn) return;
  node.addEventListener(type, fn, opts);
}

function num(node, fallback = 0) {
  if (!node) return fallback;
  const v = Number(node.value);
  return Number.isFinite(v) ? v : fallback;
}

function intNum(node, fallback = 0) {
  if (!node) return fallback | 0;
  const v = Number(node.value);
  return Number.isFinite(v) ? v | 0 : fallback | 0;
}

function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

function setText(node, s) {
  if (node) node.textContent = String(s);
}

function safeDispatch(name, detail) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch (e) {
    console.error(e);
  }
}

function fillBlackGradientRGBA(out) {
  out.fill(0);
  for (let i = 0; i < ((out.length / 4) | 0); i++) out[i * 4 + 3] = 255;
  return out;
}

function fract(x) {
  return x - Math.floor(x);
}

function clamp01(x) {
  x = +x;
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

function hsl2rgb01(outRGB, h, s, l) {
  h = fract(h);
  s = clamp01(s);
  l = clamp01(l);

  const C = (1 - Math.abs(2 * l - 1)) * s;
  const Hp = h * 6;
  const t = Hp - 2 * Math.floor(Hp * 0.5);
  const X = C * (1 - Math.abs(t - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (Hp < 1) {
    r = C;
    g = X;
    b = 0;
  } else if (Hp < 2) {
    r = X;
    g = C;
    b = 0;
  } else if (Hp < 3) {
    r = 0;
    g = C;
    b = X;
  } else if (Hp < 4) {
    r = 0;
    g = X;
    b = C;
  } else if (Hp < 5) {
    r = X;
    g = 0;
    b = C;
  } else {
    r = C;
    g = 0;
    b = X;
  }

  const m = l - 0.5 * C;
  outRGB[0] = clamp01(r + m);
  outRGB[1] = clamp01(g + m);
  outRGB[2] = clamp01(b + m);
}

export function buildDefaultPaletteRGBA(N, hueShift = 0) {
  const n = Math.max(1, N | 0);
  const out = new Uint8Array(n * 4);
  const rgb = new Float32Array(3);
  const n1 = Math.max(1, n - 1);

  for (let i = 0; i < n; i++) {
    const t = i / n1;
    const h = fract(t + hueShift);
    hsl2rgb01(rgb, h, 1.0, 0.5);

    const o = (i * 4) | 0;
    out[o + 0] = (rgb[0] * 255) | 0;
    out[o + 1] = (rgb[1] * 255) | 0;
    out[o + 2] = (rgb[2] * 255) | 0;
    out[o + 3] = 255;
  }

  return out;
}

function getGPUTextureUsage() {
  if (typeof GPUTextureUsage !== "undefined") return GPUTextureUsage;
  if (typeof globalThis !== "undefined" && globalThis.GPUTextureUsage)
    return globalThis.GPUTextureUsage;
  return null;
}

function isGpuDeviceLike(device) {
  return !!(
    device &&
    typeof device.createTexture === "function" &&
    device.queue &&
    typeof device.queue.writeTexture === "function"
  );
}

function pickGpuDevice(options = {}) {
  const direct = options.device || options.gpuDevice || null;
  if (isGpuDeviceLike(direct)) return direct;

  const rg = options.renderGlobals || null;
  if (!rg) return null;

  const candidates = [
    rg.device,
    rg.gpuDevice,
    rg.webgpuDevice,
    rg?.gpu?.device,
    rg?.engine?._device,
    rg?.engine?._webgpu?.device,
  ];

  for (const c of candidates) {
    if (isGpuDeviceLike(c)) return c;
  }

  return null;
}

export function createSoundPaletteGpuTexture(device, opts = {}) {
  if (!isGpuDeviceLike(device)) return null;

  const Nraw = Number(opts.N ?? opts.n ?? opts.width ?? opts.size ?? 512);
  let N = Number.isFinite(Nraw) ? Nraw | 0 : 512;
  if (N < 1) N = 512;
  if (N !== 256 && N !== 512 && N !== 1024) N = 512;

  const usageFlags = getGPUTextureUsage();
  if (!usageFlags) return null;

  const texture = device.createTexture({
    size: [N, 1, 1],
    format: "rgba8unorm",
    usage: usageFlags.TEXTURE_BINDING | usageFlags.COPY_DST,
  });

  const view = texture.createView({ dimension: "2d" });

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "nearest",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  const staging = new Uint8Array(N * 4);

  return {
    device,
    N,
    width: N,
    texture,
    view,
    sampler,
    gradTex: texture,
    gradView: view,
    paletteTexture: texture,
    paletteView: view,
    rgbaStaging: staging,
  };
}

export function writeSoundPaletteGpuTexture(gpu, rgba) {
  if (!gpu || !gpu.texture || !gpu.device || !gpu.device.queue || !rgba)
    return false;
  if (!(rgba instanceof Uint8Array)) return false;
  if ((rgba.length | 0) !== (gpu.N | 0) * 4) return false;

  gpu.device.queue.writeTexture(
    { texture: gpu.texture },
    rgba,
    { bytesPerRow: (gpu.N | 0) * 4, rowsPerImage: 1 },
    { width: gpu.N | 0, height: 1, depthOrArrayLayers: 1 },
  );

  return true;
}

export function destroySoundPaletteGpuTexture(gpu) {
  if (!gpu) return;
  try {
    if (gpu.texture) gpu.texture.destroy();
  } catch (e) {
    console.error(e);
  }
  gpu.texture = null;
  gpu.view = null;
  gpu.sampler = null;
  gpu.gradTex = null;
  gpu.gradView = null;
  gpu.paletteTexture = null;
  gpu.paletteView = null;
  gpu.rgbaStaging = null;
}

function populateSoundModes(selectEl) {
  if (!selectEl) return;
  if (selectEl.options && selectEl.options.length > 0) return;

  for (const opt of SOUND_MODE_OPTIONS) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    selectEl.appendChild(o);
  }

  if (!selectEl.value) selectEl.value = "1";
}

export function initSoundPaletteSidebarBridge(options = {}) {
  const root = options.root || document;

  const els = {
    canvas: byId(root, "sndMiniCanvas"),
    status: byId(root, "sndPreviewStatus"),
    metrics: byId(root, "sndPreviewMetrics"),
    log: byId(root, "sndPreviewLog"),

    enable: byId(root, "sndEnable"),

    volume: byId(root, "sndVolume"),
    volumeOut: byId(root, "sndVolumeOut"),

    btnPlay: byId(root, "sndMp3Btn"),
    btnStop: byId(root, "sndStopBtn"),
    loop: byId(root, "sndLoop"),
    upload: byId(root, "sndUpload"),
    uploadName: byId(root, "sndUploadName"),

    soundMode: byId(root, "sndSoundMode"),
    soundStrength: byId(root, "sndSoundStrength"),
    baseHueShift: byId(root, "sndBaseHueShift"),

    autoHueDrift: byId(root, "sndAutoHueDrift"),
    beatFlash: byId(root, "sndBeatFlash"),
    beatFade: byId(root, "sndBeatFade"),
    beatStep: byId(root, "sndBeatStep"),

    hueWiggle: byId(root, "sndHueWiggle"),
    shimmer: byId(root, "sndShimmer"),
    warp: byId(root, "sndWarp"),
    colorPop: byId(root, "sndColorPop"),
    brightnessBounce: byId(root, "sndBrightnessBounce"),

    smoothUp: byId(root, "sndSmoothUp"),
    smoothDown: byId(root, "sndSmoothDown"),
    freqSmooth: byId(root, "sndFreqSmooth"),

    contrast: byId(root, "sndContrast"),
    boost: byId(root, "sndBoost"),
    noiseGate: byId(root, "sndNoiseGate"),
    bassVsTreble: byId(root, "sndBassVsTreble"),

    fps: byId(root, "sndFps"),

    colorScheme: byId(root, "colorScheme"),
    colorSchemeOut: byId(root, "colorSchemeOut"),

    gammaMode: byId(root, "sndGammaMode"),
    gammaAmount: byId(root, "sndGammaAmount"),
    gammaMin: byId(root, "sndGammaMin"),
    gammaMax: byId(root, "sndGammaMax"),
    gammaMaxHz: byId(root, "sndGammaMaxHz"),
    gammaAutoDrift: byId(root, "sndGammaAutoDrift"),
    gammaSpeed: byId(root, "sndGammaSpeed"),
    gammaEps: byId(root, "sndGammaEps"),
    gammaWanderSec: byId(root, "sndGammaWanderSec"),
    gammaWanderBlendSec: byId(root, "sndGammaWanderBlendSec"),
  };

  if (!els.canvas || !els.btnPlay || !els.btnStop || !els.upload) {
    return null;
  }

  populateSoundModes(els.soundMode);

  const audio = createHowlerAudioController({
    ensureHowlerWorklet,
    Howler,
  });

  const renderer = createGradientRenderer(els.canvas);
  const blankRGBA = fillBlackGradientRGBA(new Uint8Array(512 * 4));

  const state = {
    initialized: false,
    running: true,
    raf: 0,
    pumpTimer: 0,
    worker: null,
    lastSeq: -1,
    lastStatusT: 0,
    frameRGBA: new Uint8Array(512 * 4),
    gpu: null,
    gpuEnabled: !!(options.gpuTexture ?? true),
    lastMetrics: {
      mean: 0,
      rms: 0,
      centroid: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      flux: 0,
      beat: 0,
      driftPhase: 0,
      hueDriver: 0,
      bpm: 0,
      beatConfidence: 0,
      peak: 0,
    },

    loadedFile: null,
    loadedFileName: "",
    playing: false,

    stopArmed: false,
    stopArmTimer: 0,
  };

  function isAudioPaletteEnabled() {
    return !!(els.enable && els.enable.checked);
  }

  function _setStopButtonState() {
    const hasFile = !!state.loadedFile;
    if (els.btnStop) els.btnStop.disabled = !hasFile;
  }

  function _clearStopArm() {
    state.stopArmed = false;
    if (state.stopArmTimer) {
      try {
        clearTimeout(state.stopArmTimer);
      } catch {}
      state.stopArmTimer = 0;
    }
  }

  function _armStopForUnload() {
    state.stopArmed = true;
    if (state.stopArmTimer) {
      try {
        clearTimeout(state.stopArmTimer);
      } catch {}
      state.stopArmTimer = 0;
    }
    state.stopArmTimer = setTimeout(() => {
      state.stopArmTimer = 0;
      state.stopArmed = false;
    }, 900);
  }

  function syncGradTexModeToRuntime() {
    const enabled = isAudioPaletteEnabled() ? 1 : 0;

    const ss =
      options && typeof options.setState === "function"
        ? options.setState
        : null;
    if (ss) {
      ss({ gradTexMode: enabled });
      return;
    }

    const rg = options && options.renderGlobals;
    if (rg && rg.paramsState) {
      rg.paramsState.gradTexMode = enabled;
      rg.cameraDirty = true;
    }
  }

  function _numOr(node, fallback) {
    if (!node) return fallback;
    const v = Number(node.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function _intOr(node, fallback) {
    if (!node) return fallback | 0;
    const v = Number(node.value);
    return Number.isFinite(v) ? v | 0 : fallback | 0;
  }

  function syncGammaAudioToRuntime() {
    const ss =
      options && typeof options.setState === "function"
        ? options.setState
        : null;

    const mode = _intOr(els.gammaMode, 0);

    const payload = {
      gammaAudioMode: mode,

      gammaAudioAmount: _numOr(els.gammaAmount, 0.15),
      gammaAudioMin: _numOr(els.gammaMin, -0.5),
      gammaAudioMax: _numOr(els.gammaMax, 0.5),

      gammaAudioMaxHz: _numOr(els.gammaMaxHz, 2.0),
      gammaAudioAutoDrift: _numOr(els.gammaAutoDrift, 0.0),
      gammaAudioSpeed: _numOr(els.gammaSpeed, 1.0),
      gammaAudioEps: _numOr(els.gammaEps, 0.001),

      gammaAudioWanderSec: _numOr(els.gammaWanderSec, 4.0),
      gammaAudioWanderBlendSec: _numOr(els.gammaWanderBlendSec, 0.6),
    };

    if (ss) {
      ss(payload);
      return;
    }

    const rg = options && options.renderGlobals;
    if (rg && rg.paramsState) {
      Object.assign(rg.paramsState, payload);
      rg.computeDirty = true;
      rg.cameraDirty = true;
    }
  }

  function _setGammaControlsEnabled(onFlag) {
    const nodes = [
      els.gammaMode,
      els.gammaAmount,
      els.gammaMin,
      els.gammaMax,
      els.gammaMaxHz,
      els.gammaAutoDrift,
      els.gammaSpeed,
      els.gammaEps,
      els.gammaWanderSec,
      els.gammaWanderBlendSec,
    ].filter(Boolean);

    for (const n of nodes) n.disabled = !onFlag;
  }

  function ensureGpu(width = 512) {
    if (!state.gpuEnabled) return null;
    if (state.gpu && state.gpu.texture && (state.gpu.N | 0) === (width | 0))
      return state.gpu;

    if (state.gpu) {
      destroySoundPaletteGpuTexture(state.gpu);
      state.gpu = null;
    }

    const device = pickGpuDevice(options);
    if (!device) return null;

    const gpu = createSoundPaletteGpuTexture(device, { width });
    if (!gpu) return null;

    state.gpu = gpu;

    try {
      const initRGBA =
        (blankRGBA.length | 0) === (gpu.N | 0) * 4
          ? blankRGBA
          : fillBlackGradientRGBA(new Uint8Array((gpu.N | 0) * 4));
      writeSoundPaletteGpuTexture(gpu, initRGBA);
    } catch (e) {
      console.error(e);
    }

    return state.gpu;
  }

  function uploadGpuRGBA(rgba) {
    if (!rgba || !(rgba instanceof Uint8Array)) return false;
    const width = (rgba.length / 4) | 0;
    if (width <= 0) return false;

    const gpu = ensureGpu(width);
    if (!gpu) return false;

    try {
      return writeSoundPaletteGpuTexture(gpu, rgba);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function readWorkerConfig() {
    let baseStyle = 0;

    if (els.colorScheme) {
      baseStyle = intNum(els.colorScheme, 0);
    } else if (els.colorSchemeOut) {
      baseStyle = intNum(els.colorSchemeOut, 0);
    }

    return {
      fps: clamp(intNum(els.fps, 30), 5, 120),

      reactToSound: 1,
      baseStyle: clamp(baseStyle | 0, 0, 33),
      soundMode: clamp(intNum(els.soundMode, 1), 1, 4),

      baseHueShift: num(els.baseHueShift, 0),
      soundStrength: clamp(num(els.soundStrength, 1), 0, 3),

      hueWiggle: clamp(num(els.hueWiggle, 0.25), 0, 2),
      shimmer: clamp(num(els.shimmer, 0.22), 0, 2),
      warp: clamp(num(els.warp, 0.22), 0, 2),

      colorPop: clamp(num(els.colorPop, 0.25), 0, 2),
      brightnessBounce: clamp(num(els.brightnessBounce, 0.22), 0, 2),

      autoHueDrift: clamp(num(els.autoHueDrift, 0.1), 0, 2),

      beatFlash: clamp(num(els.beatFlash, 0.35), 0, 3),
      beatFade: clamp(num(els.beatFade, 0.9), 0.7, 0.999),
      beatStep: clamp(num(els.beatStep, 0.08), 0, 0.5),

      smoothUp: clamp(num(els.smoothUp, 0.35), 0.01, 1),
      smoothDown: clamp(num(els.smoothDown, 0.08), 0.001, 1),
      freqSmooth: clamp(intNum(els.freqSmooth, 2), 0, 16),

      contrast: clamp(num(els.contrast, 9), 0.1, 64),
      boost: clamp(num(els.boost, 1), 0, 8),
      noiseGate: clamp(num(els.noiseGate, 0), 0, 0.5),
      bassVsTreble: clamp(num(els.bassVsTreble, 0), -1, 1),
    };
  }

  function readUiCfgSnapshot() {
    return {
      enabled: isAudioPaletteEnabled(),
      mixMode: "hue",
      blend: 1,
      soundStrength: clamp(num(els.soundStrength, 1), 0, 3),
      baseHueShift: num(els.baseHueShift, 0),
      soundMode: clamp(intNum(els.soundMode, 1), 1, 4),
      fps: clamp(intNum(els.fps, 30), 5, 120),
    };
  }

  function updateStatusLabel(text) {
    setText(els.status, text);
  }

  function logLine(text) {
    setText(els.log, text);
  }

  function updateMetricsText(metrics) {
    const m = metrics || state.lastMetrics;
    setText(
      els.metrics,
      `peak ${(+m.peak || 0).toFixed(3)} | bpm ${(+m.bpm || 0).toFixed(1)} | beat ${(+m.beat || 0).toFixed(3)} | hue ${(+m.hueDriver || 0).toFixed(6)}`,
    );
  }

  function dispatchUpdate(rgba, seq, metrics) {
    const enabled = isAudioPaletteEnabled();
    const gpu = state.gpu;

    const detail = {
      rgba,
      seq: seq | 0,
      metrics: { ...(metrics || state.lastMetrics) },
      enabled,
      mixMode: "hue",
      blend: 1,
      texture: enabled && gpu ? gpu.texture : null,
      view: enabled && gpu ? gpu.view : null,
      sampler: enabled && gpu ? gpu.sampler : null,
      width: gpu ? gpu.N | 0 : rgba && rgba.length ? (rgba.length / 4) | 0 : 0,
    };

    safeDispatch("palette-gradient:update", detail);
    safeDispatch("fractal-sound-palette:update", detail);

    if (typeof options.onUpdate === "function") {
      try {
        options.onUpdate(detail);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function emitCurrentFrameUpdate() {
    let rgba = null;

    if (state.worker && typeof state.worker.getRGBA === "function") {
      rgba = copyStableRGBA();
    }

    if (!rgba) {
      rgba =
        state.frameRGBA && state.frameRGBA.length ? state.frameRGBA : blankRGBA;
    }

    if (rgba) {
      uploadGpuRGBA(rgba);
      dispatchUpdate(rgba, state.lastSeq, state.lastMetrics);
    }
  }

  function clearPreview() {
    if (!state.frameRGBA || state.frameRGBA.length !== blankRGBA.length) {
      state.frameRGBA = new Uint8Array(blankRGBA.length);
    }
    state.frameRGBA.set(blankRGBA);

    renderer.updateRGBA(blankRGBA);
    renderer.draw();
    uploadGpuRGBA(blankRGBA);
    dispatchUpdate(state.frameRGBA, state.lastSeq, state.lastMetrics);
  }

  function stopPump() {
    if (!state.pumpTimer) return;
    clearInterval(state.pumpTimer);
    state.pumpTimer = 0;
  }

  function startPump() {
    stopPump();
    if (!state.worker) return;

    const fps = clamp(intNum(els.fps, 30), 5, 120);
    const ms = Math.max(10, Math.floor(1000 / fps));

    state.pumpTimer = setInterval(() => {
      if (!state.worker) return;
      state.worker.pumpBins();
    }, ms);
  }

  function applyWorkerConfig() {
    if (state.worker) {
      try {
        state.worker.config(readWorkerConfig());
      } catch (err) {
        console.error(err);
      }
      startPump();
    }

    emitCurrentFrameUpdate();
  }

  function applyGains() {
    const v = clamp(num(els.volume, 1), 0, 4);

    try {
      audio.setOutputGain(v);
    } catch (e) {
      console.error(e);
    }

    try {
      audio.setFxGain(v);
    } catch (e) {
      console.error(e);
    }

    if (els.volumeOut) setText(els.volumeOut, v.toFixed(2));
  }

  function copyStableRGBA() {
    if (!state.worker || typeof state.worker.getRGBA !== "function")
      return null;

    const rgbaSrc = state.worker.getRGBA();
    if (!rgbaSrc || !(rgbaSrc instanceof Uint8Array)) return null;

    const needed = rgbaSrc.length | 0;
    if (!needed || needed % 4 !== 0) return null;

    if (!state.frameRGBA || (state.frameRGBA.length | 0) !== needed) {
      state.frameRGBA = new Uint8Array(needed);
    }

    let tries = 0;
    while (tries < 3) {
      const s0 = state.worker.getOutSeq
        ? state.worker.getOutSeq() | 0
        : state.lastSeq | 0;
      state.frameRGBA.set(rgbaSrc);
      const s1 = state.worker.getOutSeq
        ? state.worker.getOutSeq() | 0
        : state.lastSeq | 0;
      if (s0 === s1) break;
      tries++;
    }

    return state.frameRGBA;
  }

  function drawLoop(t) {
    if (!state.running) return;

    const nowSec = (t || performance.now()) * 0.001;

    if (state.worker) {
      const seq = state.worker.getOutSeq();
      if (seq !== state.lastSeq) {
        state.lastSeq = seq;

        const frame = copyStableRGBA();
        const metrics = state.worker.readMetrics
          ? state.worker.readMetrics()
          : { ...state.lastMetrics };

        state.lastMetrics = metrics || state.lastMetrics;

        if (frame) {
          renderer.updateRGBA(frame);
          uploadGpuRGBA(frame);
          dispatchUpdate(frame, seq, state.lastMetrics);
        }

        updateMetricsText(state.lastMetrics);
      }
    }

    renderer.draw();

    if (!state.lastStatusT || nowSec - state.lastStatusT > 0.25) {
      const wst = state.worker ? state.worker.getState() : null;
      const ctxState = audio.getCtxState();
      const sampleRate = audio.getSampleRate() | 0;
      const sabMode = wst ? !!wst.sabOk : false;

      updateStatusLabel(
        `ctx:${ctxState} | sr:${sampleRate || 0} | ${sabMode ? "SAB" : "msg"}`,
      );

      state.lastStatusT = nowSec;
    }

    state.raf = requestAnimationFrame(drawLoop);
  }

  async function ensureInit() {
    if (state.initialized) return;

    updateStatusLabel("initializing...");
    logLine("Initializing audio + palette worker...");

    await audio.init({
      analyser: { fftSize: 1024, smoothingTimeConstant: 0.0 },
      outputGain: clamp(num(els.volume, 1), 0, 4),
      fxGain: clamp(num(els.volume, 1), 0, 4),
    });

    state.worker = createPaletteWorkerClient(
      audio.getAnalyser(),
      readWorkerConfig(),
    );

    state.initialized = true;
    state.lastSeq = -1;

    ensureGpu(512);
    startPump();

    if (!state.raf) state.raf = requestAnimationFrame(drawLoop);

    const wst = state.worker.getState();
    if (wst && wst.sabOk) {
      logLine("Ready. SharedArrayBuffer mode active.");
    } else {
      logLine(
        "Ready. Message mode active (no SharedArrayBuffer / no COOP+COEP).",
      );
    }

    updateStatusLabel("ready");
    applyGains();
    emitCurrentFrameUpdate();
    _setStopButtonState();
  }

  async function playSelectedFile() {
    const file = els.upload && els.upload.files ? els.upload.files[0] : null;

    if (!file) {
      try {
        els.upload.click();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    await ensureInit();
    applyGains();
    _clearStopArm();

    await audio.playFile({
      file,
      loop: !!(els.loop && els.loop.checked),
      outputGain: clamp(num(els.volume, 1), 0, 4),
      fxGain: clamp(num(els.volume, 1), 0, 4),
    });

    state.loadedFile = file;
    state.loadedFileName = file.name || "audio file";
    state.playing = true;

    setText(els.uploadName, state.loadedFileName);
    logLine(`Playing: ${state.loadedFileName}`);
    emitCurrentFrameUpdate();
    _setStopButtonState();
  }

  function stop() {
    try {
      audio.stop();
    } catch (e) {
      console.error(e);
    }

    if (state.worker) {
      try {
        state.worker.reset();
      } catch (e) {
        console.error(e);
      }
    }

    state.playing = false;
    state.lastSeq = -1;
    updateMetricsText(null);
    clearPreview();
    logLine("Stopped.");
    emitCurrentFrameUpdate();
    _setStopButtonState();
  }

  function unloadSong() {
    try {
      audio.stop();
    } catch (e) {
      console.error(e);
    }

    if (state.worker) {
      try {
        state.worker.reset();
      } catch (e) {
        console.error(e);
      }
    }

    state.playing = false;
    state.loadedFile = null;
    state.loadedFileName = "";

    if (els.upload) {
      try {
        els.upload.value = "";
      } catch {}
    }

    setText(els.uploadName, "none");

    state.lastSeq = -1;
    updateMetricsText(null);
    clearPreview();
    logLine("Unloaded.");
    emitCurrentFrameUpdate();

    _clearStopArm();
    _setStopButtonState();
  }

  function stopMaybeUnload() {
    if (!state.loadedFile) return;

    if (!state.playing && state.stopArmed) {
      unloadSong();
      return;
    }

    stop();
    _armStopForUnload();
    logLine("Stopped. Click stop again to unload.");
  }

  function destroy() {
    state.running = false;

    stopPump();

    if (state.raf) {
      try {
        cancelAnimationFrame(state.raf);
      } catch (e) {
        console.error(e);
      }
      state.raf = 0;
    }

    _clearStopArm();

    try {
      audio.shutdown();
    } catch (e) {
      console.error(e);
    }

    if (state.worker) {
      try {
        state.worker.stop();
      } catch (e) {
        console.error(e);
      }
      state.worker = null;
    }

    if (state.gpu) {
      destroySoundPaletteGpuTexture(state.gpu);
      state.gpu = null;
    }

    state.loadedFile = null;
    state.loadedFileName = "";
    state.playing = false;

    state.initialized = false;
  }

  function bindConfigListeners() {
    const cfgNodes = [
      els.soundMode,
      els.soundStrength,
      els.baseHueShift,

      els.autoHueDrift,
      els.beatFlash,
      els.beatFade,
      els.beatStep,

      els.hueWiggle,
      els.shimmer,
      els.warp,
      els.colorPop,
      els.brightnessBounce,

      els.smoothUp,
      els.smoothDown,
      els.freqSmooth,

      els.contrast,
      els.boost,
      els.noiseGate,
      els.bassVsTreble,

      els.fps,

      els.colorScheme,
      els.colorSchemeOut,
    ].filter(Boolean);

    for (const n of cfgNodes) {
      on(n, "change", applyWorkerConfig);
      on(n, "input", applyWorkerConfig);
    }

    if (els.enable) {
      on(els.enable, "change", () => {
        syncGradTexModeToRuntime();
        _setGammaControlsEnabled(isAudioPaletteEnabled());
        syncGammaAudioToRuntime();
        applyWorkerConfig();
      });
      on(els.enable, "input", () => {
        syncGradTexModeToRuntime();
        _setGammaControlsEnabled(isAudioPaletteEnabled());
        syncGammaAudioToRuntime();
        applyWorkerConfig();
      });

      syncGradTexModeToRuntime();
      _setGammaControlsEnabled(isAudioPaletteEnabled());
      syncGammaAudioToRuntime();
    } else {
      _setGammaControlsEnabled(false);
      syncGammaAudioToRuntime();
    }

    const gammaNodes = [
      els.gammaMode,
      els.gammaAmount,
      els.gammaMin,
      els.gammaMax,
      els.gammaMaxHz,
      els.gammaAutoDrift,
      els.gammaSpeed,
      els.gammaEps,
      els.gammaWanderSec,
      els.gammaWanderBlendSec,
    ].filter(Boolean);

    for (const n of gammaNodes) {
      on(n, "change", () => {
        syncGammaAudioToRuntime();
        emitCurrentFrameUpdate();
      });
      on(n, "input", () => {
        syncGammaAudioToRuntime();
        emitCurrentFrameUpdate();
      });
    }

    if (els.volume) {
      on(els.volume, "change", applyGains);
      on(els.volume, "input", applyGains);
    }
  }

  function bindPlaybackListeners() {
    els.btnPlay.disabled = false;

    on(els.btnPlay, "click", () => {
      playSelectedFile().catch((e) => {
        logLine(e && e.message ? e.message : String(e));
      });
    });

    on(els.btnStop, "click", () => {
      stopMaybeUnload();
    });

    on(els.upload, "change", () => {
      const file =
        els.upload.files && els.upload.files[0] ? els.upload.files[0] : null;

      setText(els.uploadName, file ? file.name || "audio file" : "none");

      if (!file) {
        state.loadedFile = null;
        state.loadedFileName = "";
        state.playing = false;
        _clearStopArm();
        _setStopButtonState();
        emitCurrentFrameUpdate();
        return;
      }

      playSelectedFile().catch((e) => {
        logLine(e && e.message ? e.message : String(e));
      });
    });
  }

  function attachGpuDevice(device) {
    if (!isGpuDeviceLike(device)) return false;
    options.device = device;
    options.gpuDevice = device;

    const width =
      state.frameRGBA && state.frameRGBA.length
        ? (state.frameRGBA.length / 4) | 0
        : 512;

    if (state.gpu) {
      destroySoundPaletteGpuTexture(state.gpu);
      state.gpu = null;
    }

    const gpu = ensureGpu(width);
    if (!gpu) return false;

    if (state.frameRGBA && state.frameRGBA.length === gpu.N * 4) {
      uploadGpuRGBA(state.frameRGBA);
    } else {
      clearPreview();
    }

    emitCurrentFrameUpdate();
    return true;
  }

  function getRGBA() {
    if (!state.worker) return state.frameRGBA || blankRGBA;
    const frame = copyStableRGBA();
    return frame || state.frameRGBA || blankRGBA;
  }

  function readMetrics() {
    if (!state.worker) return { ...state.lastMetrics };
    return state.worker.readMetrics
      ? state.worker.readMetrics()
      : { ...state.lastMetrics };
  }

  function getState() {
    const wst = state.worker
      ? state.worker.getState()
      : { ready: false, error: null, sabOk: false };

    const enabled = isAudioPaletteEnabled();

    return {
      initialized: state.initialized,
      enabled,
      worker: wst,
      audioCtxState: audio.getCtxState(),
      sampleRate: audio.getSampleRate() | 0,
      metrics: { ...state.lastMetrics },
      seq: state.lastSeq | 0,
      cfg: readUiCfgSnapshot(),
      loaded: {
        hasFile: !!state.loadedFile,
        name: state.loadedFileName || "",
        playing: !!state.playing,
      },
      gpu: {
        enabled: !!state.gpuEnabled,
        ready: !!(state.gpu && state.gpu.texture && state.gpu.view),
        width: state.gpu ? state.gpu.N | 0 : 0,
        texture: state.gpu ? state.gpu.texture : null,
        view: state.gpu ? state.gpu.view : null,
        sampler: state.gpu ? state.gpu.sampler : null,
      },
    };
  }

  function getPaletteTexture() {
    return state.gpu ? state.gpu.texture : null;
  }

  function getPaletteView() {
    return state.gpu ? state.gpu.view : null;
  }

  function getPaletteSampler() {
    return state.gpu ? state.gpu.sampler : null;
  }

  function getGradientTexture() {
    return getPaletteTexture();
  }

  function getGradientView() {
    return getPaletteView();
  }

  function syncGpuTextureNow() {
    const frame = getRGBA();
    const ok = uploadGpuRGBA(frame);
    emitCurrentFrameUpdate();
    return ok;
  }

  bindConfigListeners();
  bindPlaybackListeners();

  ensureGpu(512);
  clearPreview();
  applyGains();
  updateMetricsText(null);
  updateStatusLabel("idle");
  logLine(
    'Choose a file with "Play song" to start the sidebar audio palette preview.',
  );

  if (!state.raf) state.raf = requestAnimationFrame(drawLoop);

  _setStopButtonState();

  const api = {
    init: ensureInit,
    stop: stopMaybeUnload,
    destroy,
    playSelectedFile,
    getRGBA,
    readMetrics,
    getState,
    applyConfig: applyWorkerConfig,

    attachGpuDevice,
    syncGpuTextureNow,

    getPaletteTexture,
    getPaletteView,
    getPaletteSampler,
    getGradientTexture,
    getGradientView,
  };

  globalThis.FractalSoundPaletteSidebar = api;
  globalThis.soundPaletteGetState = () => {
    try {
      return api.getState();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return api;
}

export const initFractalSidebarSoundPaletteDemo = initSoundPaletteSidebarBridge;