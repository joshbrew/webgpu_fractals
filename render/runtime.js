// render/runtime.js
// SDF compute only when needed: displacement OR lighting; auto-free SDF/flag textures when SDFs are not required
// nLayers support: compute multi-layer fractal arrays; no per-layer SDFs when nLayers > 1
// layerMode: disables SDF/displacement and enables multi-layer fractal stacks with stepped gamma

import { FractalTileComputeGPU } from "../shaders/fractalCompute.js";
import { SdfComputeGPU } from "../shaders/fsdfCompute.js";
import RenderPipelineGPUDefault, {
  RenderPipelineGPU as RenderPipelineGPUNamed,
} from "../shaders/fractalRender.js";
import { QueryComputeGPU } from "../shaders/fheightQueryCompute.js";

import SlabMeshPipelineGPU from "../shaders/fSlabCompute.js";

import {
  parseAlphaModeToNumeric,
  canvasAlphaStringForNumeric,
  slabAlphaBitsFromParams,
} from "./alphaMode.js";
import { createCameraController } from "./cameraController.js";
import {
  createChunkViewCache,
  cleanupTempFallbacks,
  destroySdfAttachments,
} from "./chunkViews.js";

import {
  renderGlobals,
  flushPending,
  cloneParamsForCompute,
  requestedLayersFromParams,
  resolveGammaSeries,
  gammaForLayerIndex,
  availableFractalLayers,
  clampLayerIndex,
  normalizeFractalChunkLayers,
  normRenderMode,
  modeNeedsSdf,
} from "./state.js";

const RenderPipelineGPU = RenderPipelineGPUNamed || RenderPipelineGPUDefault;

/* ======================================================================
   WebGPU init helper
   ====================================================================== */
export async function initWebGPU() {
  if (!navigator.gpu) {
    alert("WebGPU not supported");
    throw new Error("WebGPU not supported");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    alert("No GPU adapter found");
    throw new Error("No GPU adapter");
  }
  const device = await adapter.requestDevice();
  return device;
}

function randomTag() {
  return Math.random().toString(36).slice(2, 8);
}

function _pickFn(obj, names) {
  for (let i = 0; i < names.length; i++) {
    const k = names[i];
    const fn = obj && obj[k];
    if (typeof fn === "function") return fn.bind(obj);
  }
  return null;
}

function _pickMethod(obj, names) {
  for (let i = 0; i < names.length; i++) {
    const k = names[i];
    const fn = obj && obj[k];
    if (typeof fn === "function") return fn.bind(obj);
  }
  return null;
}

function _assertPipelineApi(renderPipeline) {
  if (!renderPipeline) throw new Error("Render pipeline missing");

  const hasSetChunks = typeof renderPipeline.setChunks === "function";
  if (!hasSetChunks) {
    throw new TypeError("renderPipeline.setChunks is not a function");
  }

  const hasRender =
    typeof renderPipeline.render === "function" ||
    typeof renderPipeline.renderFrame === "function" ||
    typeof renderPipeline.draw === "function";

  if (!hasRender && typeof renderPipeline.renderBlitToView !== "function") {
    throw new TypeError(
      "renderPipeline has no render/renderFrame/draw/renderBlitToView",
    );
  }
}

function _clampGradTexMode(v) {
  const n = Number.isFinite(+v) ? +v | 0 : 0;
  return n === 1 ? 1 : 0;
}

function _ensure2DViewFromTexture(tex) {
  if (!tex || typeof tex.createView !== "function") return null;
  try {
    return tex.createView({ dimension: "2d" });
  } catch {}
  try {
    return tex.createView();
  } catch {}
  return null;
}

function _clearGradientOverride(renderPipeline) {
  const clear = _pickMethod(renderPipeline, ["clearGradientOverride"]);
  if (clear) {
    try {
      clear();
      return true;
    } catch {}
  }

  try {
    renderPipeline._gradOverrideTex = null;
    renderPipeline._gradOverrideView = null;
    renderPipeline._gradOverrideSampler = null;
  } catch {}

  const rebuild =
    renderPipeline._rebuildBg0ForGradientIfNeeded ||
    renderPipeline.rebuildBg0ForGradientIfNeeded;
  if (typeof rebuild === "function") {
    try {
      rebuild.call(renderPipeline);
      return true;
    } catch {}
  }

  return true;
}

function _setGradientOverride(renderPipeline, tex, view, sampler = null) {
  const set = _pickMethod(renderPipeline, ["setGradientOverride"]);
  if (set) {
    try {
      set(tex, view, sampler);
      return true;
    } catch {}
    try {
      set(tex, view);
      return true;
    } catch {}
  }

  try {
    renderPipeline._gradOverrideTex = tex;
    renderPipeline._gradOverrideView = view;
    if (sampler) renderPipeline._gradOverrideSampler = sampler;
  } catch {}

  const rebuild =
    renderPipeline._rebuildBg0ForGradientIfNeeded ||
    renderPipeline.rebuildBg0ForGradientIfNeeded;
  if (typeof rebuild === "function") {
    try {
      rebuild.call(renderPipeline);
      return true;
    } catch {}
  }

  return !!(tex && view);
}

function _clamp01(x) {
  x = +x;
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

function _fract(x) {
  return x - Math.floor(x);
}

function _hsl2rgb01(outRGB, h, s, l) {
  h = _fract(h);
  s = _clamp01(s);
  l = _clamp01(l);

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
  outRGB[0] = _clamp01(r + m);
  outRGB[1] = _clamp01(g + m);
  outRGB[2] = _clamp01(b + m);
}

function _buildDefaultPaletteRGBA(N, hueShift = 0) {
  const n = Math.max(1, N | 0);
  const out = new Uint8Array(n * 4);
  const rgb = new Float32Array(3);
  const n1 = Math.max(1, n - 1);

  for (let i = 0; i < n; i++) {
    const t = i / n1;
    const h = _fract(t + hueShift);
    _hsl2rgb01(rgb, h, 1.0, 0.5);

    const o = (i * 4) | 0;
    out[o + 0] = (rgb[0] * 255) | 0;
    out[o + 1] = (rgb[1] * 255) | 0;
    out[o + 2] = (rgb[2] * 255) | 0;
    out[o + 3] = 255;
  }

  return out;
}

function _num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function _isGpuTextureLike(v) {
  return !!(v && typeof v.createView === "function");
}

function _extractHueDriver(metrics) {
  const m = metrics && typeof metrics === "object" ? metrics : null;
  if (!m) return null;

  const keys = [
    "hueDriver",
    "hue",
    "hueOffset",
    "hueShift",
    "driverHue",
    "hueValue",
    "driveHue",
  ];

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (m[k] == null) continue;
    const n = Number(m[k]);
    if (!Number.isFinite(n)) continue;

    if (n >= 0 && n <= 1) return n * 2 - 1;
    return n;
  }

  const bass = Number(m.bass);
  const treble = Number(m.treble);
  if (Number.isFinite(bass) && Number.isFinite(treble)) {
    const v = bass - treble;
    if (Number.isFinite(v)) return v;
  }

  const level = Number(m.level ?? m.energy ?? m.rms ?? m.amp);
  if (Number.isFinite(level)) {
    const v = level >= 0 && level <= 1 ? level * 2 - 1 : level;
    if (Number.isFinite(v)) return v;
  }

  return null;
}

function createUiSoundGradientAdapter({
  device,
  renderPipeline,
  renderGlobals,
  onDirty,
}) {
  let _applied = 0;
  let _appliedKind = "none";
  let _appliedKey = "";

  let _localTex = null;
  let _localView = null;
  let _localN = 0;

  let _lastLocalSeq = -1;
  let _pendingSeq = -1;
  let _pendingRGBA = null;

  let _metrics = null;
  let _hadAnyEvent = false;

  let _uiAudioEnabled = null;

  let _extTex = null;
  let _extView = null;
  let _extSampler = null;
  let _extWidth = 0;
  let _extSeq = -1;

  let _sidebarAttachTried = false;
  let _sidebarAttachOk = false;

  let _gammaActive = false;
  let _gammaBase = 1.0;
  let _gammaLastApplied = 1.0;
  let _gammaNextAllowedT = 0.0;

  let _gammaTarget = 1.0;
  let _gammaSmoothed = 1.0;

  let _gammaWanderNextPickT = 0.0;
  let _gammaWanderPickT = 0.0;
  let _gammaWanderPrevCenter = 1.0;
  let _gammaWanderPrevAmp = 0.0;
  let _gammaWanderPrevSpeed = 1.0;
  let _gammaWanderCenter = 1.0;
  let _gammaWanderAmp = 0.0;
  let _gammaWanderSpeed = 1.0;
  let _gammaWanderPhase = 0.0;
  let _gammaAutoPhase01 = 0.0;
  let _gammaBeatPhase01 = 0.0;
  let _gammaBeatPrev = 0.0;
  let _gammaBeatCount = 0;
  let _gammaBeatWithin01 = 0.0;
  let _gammaBeatLastBeatT = 0.0;
  let _gammaBeatPeriodSec = 0.5;

  function _notifyDirty() {
    if (typeof onDirty === "function") {
      try {
        onDirty();
      } catch {}
    }
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _smooth01(t) {
    t = t <= 0 ? 0 : t >= 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  function _expSmooth(current, target, dt, tau) {
    if (!(dt > 0) || !(tau > 0)) return target;
    const a = 1.0 - Math.exp(-dt / tau);
    return current + (target - current) * a;
  }

  function _slew(current, target, dt, ratePerSec) {
    if (!(dt > 0) || !(ratePerSec > 0)) return target;
    const maxDelta = ratePerSec * dt;
    const d = target - current;
    if (d > maxDelta) return current + maxDelta;
    if (d < -maxDelta) return current - maxDelta;
    return target;
  }

  function _clampPos(x, minV) {
    x = +x;
    if (!Number.isFinite(x)) return minV;
    return x < minV ? minV : x;
  }

  function _readGammaDriver01(metrics) {
    const v = metrics ? Number(metrics.hueDriver) : NaN;
    if (!Number.isFinite(v)) return NaN;
    if (v >= 0 && v <= 1) return v;
    const u = (v + 1) * 0.5;
    return u >= 0 && u <= 1 ? u : NaN;
  }

  function _readDriftPhase(metrics) {
    const v = metrics ? Number(metrics.driftPhase) : NaN;
    return Number.isFinite(v) ? v : 0.0;
  }

  function _fract01(x) {
    return x - Math.floor(x);
  }

  function _updateGammaBeatClock(metrics, tNow, dt) {
    const beat = _readBeatValue01(metrics);
    const bpm = _readBpm(metrics);

    const thresh = 0.5;
    if (beat > thresh && _gammaBeatPrev <= thresh) {
      _gammaBeatCount = (_gammaBeatCount + 1) | 0;
      _gammaBeatLastBeatT = tNow;
    }
    _gammaBeatPrev = beat;

    if (bpm > 0.0 && dt > 0.0) {
      const targetPeriod = 60.0 / bpm;
      _gammaBeatPeriodSec = _expSmooth(
        _gammaBeatPeriodSec,
        targetPeriod,
        dt,
        0.25,
      );
      if (!(_gammaBeatPeriodSec > 0.00001)) _gammaBeatPeriodSec = targetPeriod;
    }

    const p = _gammaBeatPeriodSec;
    if (p > 0.00001) {
      let u = (tNow - _gammaBeatLastBeatT) / p;
      _gammaBeatWithin01 = u <= 0 ? 0 : u >= 1 ? 1 : u;
    } else {
      _gammaBeatWithin01 = 0.0;
    }
  }

  function _readBeatPhaseFromMetrics01(metrics) {
    if (!metrics || typeof metrics !== "object") return NaN;

    const keys = ["gammaPhase", "beatPhase", "beatPhase01", "phase", "phase01"];
    for (let i = 0; i < keys.length; i++) {
      const v = Number(metrics[keys[i]]);
      if (!Number.isFinite(v)) continue;
      if (v >= 0 && v <= 1) return v;
    }

    return NaN;
  }

  function _readBeatValue01(metrics) {
    const v = metrics ? Number(metrics.beat) : NaN;
    if (!Number.isFinite(v)) return 0.0;
    return v <= 0 ? 0.0 : v >= 1 ? 1.0 : v;
  }

  function _readBpm(metrics) {
    const v = metrics ? Number(metrics.bpm) : NaN;
    if (!Number.isFinite(v) || !(v > 0)) return 0.0;
    return v > 480 ? 480 : v;
  }

  function _readGammaPhase01(metrics, dt, speed) {
    const explicit = _readBeatPhaseFromMetrics01(metrics);
    if (Number.isFinite(explicit)) {
      _gammaBeatPhase01 = explicit;
      _gammaBeatPrev = _readBeatValue01(metrics);
      return _gammaBeatPhase01;
    }

    const beat = _readBeatValue01(metrics);
    const bpm = _readBpm(metrics);

    const thresh = 0.5;
    if (beat > thresh && _gammaBeatPrev <= thresh) {
      _gammaBeatPhase01 = 0.0;
    }
    _gammaBeatPrev = beat;

    if (bpm > 0.0 && dt > 0.0) {
      const adv = dt * (bpm / 60.0) * (speed > 0.0 ? speed : 1.0);
      _gammaBeatPhase01 = _gammaBeatPhase01 + adv;
      _gammaBeatPhase01 = _gammaBeatPhase01 - Math.floor(_gammaBeatPhase01);
    }

    return _gammaBeatPhase01;
  }

  function _ensureLocalTexForN(N) {
    N = Math.max(1, N | 0);
    if (_localTex && _localView && _localN === N) return true;

    try {
      if (_localTex) _localTex.destroy();
    } catch {}
    _localTex = null;
    _localView = null;

    try {
      _localTex = device.createTexture({
        size: [N, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      _localView = _ensure2DViewFromTexture(_localTex);
      _localN = N | 0;
      _lastLocalSeq = -1;
      return !!_localView;
    } catch {
      _localTex = null;
      _localView = null;
      _localN = 0;
      return false;
    }
  }

  function _uploadLocalRGBA(rgba) {
    if (!rgba) return false;

    let src = rgba;
    if (!(src instanceof Uint8Array)) {
      try {
        src = new Uint8Array(src);
      } catch {
        return false;
      }
    }

    const wantN = (src.length / 4) | 0;
    if (wantN <= 0 || wantN * 4 !== src.length) return false;

    if (!_ensureLocalTexForN(wantN)) return false;

    try {
      device.queue.writeTexture(
        { texture: _localTex },
        src,
        { bytesPerRow: wantN * 4, rowsPerImage: 1 },
        { width: wantN, height: 1, depthOrArrayLayers: 1 },
      );
      return true;
    } catch (e) {
      console.warn("_uploadLocalRGBA failed:", e);
      return false;
    }
  }

  function _readLegacySoundPaletteState() {
    if (typeof window === "undefined") return null;
    const getState = window.soundPaletteGetState;
    if (typeof getState !== "function") return null;
    try {
      return getState();
    } catch {
      return null;
    }
  }

  function _readSidebarApiState() {
    if (typeof window === "undefined") return null;
    const api = window.FractalSoundPaletteSidebar;
    if (!api || typeof api.getState !== "function") return null;
    try {
      return api.getState();
    } catch {
      return null;
    }
  }

  function _readEnableCheckboxFallback() {
    if (typeof document === "undefined") return null;
    const el = document.getElementById("sndEnable");
    if (!el) return null;
    if (typeof el.checked !== "boolean") return null;
    return !!el.checked;
  }

  function _readUiState() {
    const st = _readSidebarApiState() || _readLegacySoundPaletteState();
    if (st) return st;

    const enabled = _readEnableCheckboxFallback();
    if (enabled == null) return null;

    return {
      enabled,
      cfg: { enabled },
    };
  }

  function _readUiCfgSnapshot() {
    const st = _readUiState();
    if (!st || typeof st !== "object") return null;

    if (st.cfg && typeof st.cfg === "object") {
      return Object.assign({}, st.cfg);
    }

    if (st.mix && typeof st.mix === "object") {
      return {
        enabled: !!st.mix.enabled,
        mixMode: st.mix.mixMode ?? "blend",
        blend: st.mix.blend ?? 1,
        soundStrength: st.soundStrength,
        baseHueShift: st.baseHueShift,
      };
    }

    if ("enabled" in st) {
      return { enabled: !!st.enabled };
    }

    return null;
  }

  function _refreshUiAudioEnabledFromState() {
    const st = _readUiState();
    if (st && typeof st === "object") {
      if (st.mix && typeof st.mix === "object" && "enabled" in st.mix) {
        _uiAudioEnabled = !!st.mix.enabled;
        return;
      }

      if (st.cfg && typeof st.cfg === "object" && "enabled" in st.cfg) {
        _uiAudioEnabled = !!st.cfg.enabled;
        return;
      }

      if ("enabled" in st) {
        _uiAudioEnabled = !!st.enabled;
        return;
      }
    }

    const fallback = _readEnableCheckboxFallback();
    if (fallback != null) {
      _uiAudioEnabled = !!fallback;
    }
  }

  function _audioPaletteEnabled() {
    _refreshUiAudioEnabledFromState();
    return _uiAudioEnabled === true;
  }

  function _clearExternalRefs() {
    _extTex = null;
    _extView = null;
    _extSampler = null;
    _extWidth = 0;
    _extSeq = -1;
  }

  function _cacheExternalRefsFromDetail(d) {
    const tex = d && d.texture ? d.texture : null;
    const view = d && d.view ? d.view : null;
    const sampler = d && d.sampler ? d.sampler : null;
    const width = Number.isFinite(+d?.width) ? +d.width | 0 : 0;
    const seq = Number.isFinite(+d?.seq) ? +d.seq | 0 : -1;

    if (tex && view && _isGpuTextureLike(tex)) {
      _extTex = tex;
      _extView = view;
      _extSampler = sampler || null;
      _extWidth = width > 0 ? width : 0;
      _extSeq = seq;
      return true;
    }

    return false;
  }

  function _maybeAttachSidebarDevice() {
    if (typeof window === "undefined") return false;

    const api = window.FractalSoundPaletteSidebar;
    if (!api || typeof api.attachGpuDevice !== "function") return false;

    if (_sidebarAttachOk) return true;

    try {
      const ok = !!api.attachGpuDevice(device);
      _sidebarAttachTried = true;
      _sidebarAttachOk = ok;
      return ok;
    } catch {
      _sidebarAttachTried = true;
      return false;
    }
  }

  function _onPaletteUpdate(ev) {
    const d = ev && ev.detail ? ev.detail : null;
    if (!d) return;

    const seq = Number.isFinite(+d.seq) ? +d.seq | 0 : -1;
    const rgba = d.rgba || null;
    const metrics = d.metrics || null;

    _hadAnyEvent = true;
    _metrics = metrics || _metrics;

    if (typeof d.enabled === "boolean") {
      _uiAudioEnabled = !!d.enabled;
      if (!_uiAudioEnabled) {
        _clearExternalRefs();
      }
    }

    _cacheExternalRefsFromDetail(d);

    if (rgba) {
      _pendingRGBA = rgba;
      _pendingSeq = seq;
    }

    if ((renderGlobals.paramsState.gradTexMode | 0) === 1) {
      _notifyDirty();
    }
  }

  if (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function"
  ) {
    window.addEventListener("palette-gradient:update", _onPaletteUpdate);
    window.addEventListener("fractal-sound-palette:update", _onPaletteUpdate);
  }

  function _applyNoneOverride() {
    if (_applied !== 0 || _appliedKind !== "none") {
      _clearGradientOverride(renderPipeline);
      _applied = 0;
      _appliedKind = "none";
      _appliedKey = "";
      _notifyDirty();
    }
  }

  function _applyExternalOverride() {
    if (!_extTex || !_extView) return false;

    const key =
      "ext|" +
      String(_extSeq) +
      "|" +
      String(_extWidth || 0) +
      "|" +
      String(!!_extSampler);

    if (_appliedKind === "external" && _appliedKey === key && _applied === 1) {
      return true;
    }

    const ok = _setGradientOverride(
      renderPipeline,
      _extTex,
      _extView,
      _extSampler,
    );
    if (!ok) return false;

    _applied = 1;
    _appliedKind = "external";
    _appliedKey = key;
    _notifyDirty();
    return true;
  }

  function _applyLocalOverride() {
    if (!_localTex || !_localView) return false;

    const key = "local|" + String(_localN) + "|" + String(_lastLocalSeq);
    if (_appliedKind === "local" && _appliedKey === key && _applied === 1) {
      return true;
    }

    const ok = _setGradientOverride(
      renderPipeline,
      _localTex,
      _localView,
      null,
    );
    if (!ok) return false;

    _applied = 1;
    _appliedKind = "local";
    _appliedKey = key;
    _notifyDirty();
    return true;
  }

  function _ensureDefaultLocalPalette() {
    if (_localTex && _localView) return;

    const defN = 512;
    if (_ensureLocalTexForN(defN)) {
      const def = _buildDefaultPaletteRGBA(defN, 0);
      _uploadLocalRGBA(def);
      _lastLocalSeq = -1;
    }
  }

  function _flushPendingLocalUploadIfNeeded() {
    if (!_pendingRGBA) return false;
    if (_pendingSeq === _lastLocalSeq) return false;

    const ok = _uploadLocalRGBA(_pendingRGBA);
    if (ok) {
      _lastLocalSeq = _pendingSeq;
      return true;
    }
    return false;
  }

  function applyGradTexModeMaybeRefresh() {
    const ps = renderGlobals.paramsState;
    const wantGradTexMode = (Number(ps.gradTexMode) | 0) === 1;

    if (!wantGradTexMode) {
      _applyNoneOverride();
      return;
    }

    _maybeAttachSidebarDevice();

    const wantAudioPalette = _audioPaletteEnabled();

    if (!wantAudioPalette) {
      _applyNoneOverride();
      return;
    }

    _ensureDefaultLocalPalette();

    const uploadedNewLocal = _flushPendingLocalUploadIfNeeded();

    if (_extTex && _extView) {
      const ok = _applyExternalOverride();
      if (ok) return;
      _clearExternalRefs();
    }

    const okLocal = _applyLocalOverride();
    if (okLocal && uploadedNewLocal) {
      _notifyDirty();
    }
  }

  function applySoundHueToLocalParams(localParams) {
    const ps = renderGlobals.paramsState;
    if (!ps || (ps.gradTexMode | 0) !== 1) return;
    if (!_audioPaletteEnabled()) return;

    const cfg = _readUiCfgSnapshot() || null;
    const mix = cfg && cfg.mixMode != null ? String(cfg.mixMode) : "hue";
    if (mix === "off") return;

    const driver = _extractHueDriver(_metrics);
    if (driver == null) return;

    const strength = cfg ? _num(cfg.soundStrength, 1) : 1;
    const baseShift = cfg ? _num(cfg.baseHueShift, 0) : 0;

    const blend =
      mix === "blend"
        ? Math.max(0, Math.min(1, cfg ? _num(cfg.blend, 1) : 1))
        : 1;

    const base = _num(localParams.hueOffset, 0);
    localParams.hueOffset = base + baseShift + driver * strength * blend;
  }

  function applySoundGammaToGlobalParams(ps, nowSec, dt) {
    if (!ps || typeof ps !== "object") return false;

    const mode = Number(ps.gammaAudioMode) | 0 || 0;
    const wantEnabled = mode !== 0 && _audioPaletteEnabled();

    const tNow = Number.isFinite(+nowSec) ? +nowSec : 0.0;
    const stepDt = Number.isFinite(+dt) ? Math.max(0.0, +dt) : 0.0;

    const maxHzRaw = Number(ps.gammaAudioMaxHz);
    const maxHz = Number.isFinite(maxHzRaw)
      ? Math.max(0.1, Math.min(240, maxHzRaw))
      : 2.0;

    const smoothSecRaw = Number(ps.gammaAudioSmoothSec);
    const smoothSec = Number.isFinite(smoothSecRaw)
      ? Math.max(0.0, Math.min(4.0, smoothSecRaw))
      : Math.max(0.02, 0.5 / maxHz);

    const slewRaw = Number(ps.gammaAudioSlewPerSec);
    const slewPerSec = Number.isFinite(slewRaw)
      ? Math.max(0.0, Math.min(50.0, slewRaw))
      : 0.0;

    const epsRaw = Number(ps.gammaAudioEps);
    const eps = Number.isFinite(epsRaw) ? Math.max(0.000001, epsRaw) : 0.0005;

    const baseDetectEps = 0.0002;

    const observedGamma = Number(ps.gamma);
    const observedFinite = Number.isFinite(observedGamma);

    if (!_gammaActive) {
      if (!wantEnabled) return false;

      const baseNow = observedFinite ? observedGamma : 1.0;

      _gammaActive = true;
      _gammaBase = baseNow;

      _gammaTarget = baseNow;
      _gammaSmoothed = baseNow;
      _gammaLastApplied = baseNow;
      _gammaNextAllowedT = 0.0;

      _gammaWanderPrevCenter = baseNow;
      _gammaWanderPrevAmp = 0.0;
      _gammaWanderPrevSpeed = 1.0;

      _gammaWanderCenter = baseNow;
      _gammaWanderAmp = 0.0;
      _gammaWanderSpeed = 1.0;
      _gammaWanderPhase = 0.0;

      _gammaWanderPickT = tNow;
      _gammaWanderNextPickT = 0.0;

      _gammaAutoPhase01 = 0.0;

      _gammaBeatPrev = 0.0;
      _gammaBeatCount = 0;
      _gammaBeatWithin01 = 0.0;
      _gammaBeatLastBeatT = tNow;
      _gammaBeatPeriodSec = 0.5;
    } else {
      if (
        observedFinite &&
        Math.abs(observedGamma - _gammaLastApplied) > baseDetectEps
      ) {
        _gammaBase = observedGamma;

        _gammaTarget = observedGamma;
        _gammaSmoothed = observedGamma;
        _gammaLastApplied = observedGamma;

        _gammaWanderPrevCenter = observedGamma;
        _gammaWanderCenter = observedGamma;

        _gammaNextAllowedT = 0.0;

        _gammaAutoPhase01 = 0.0;

        _gammaBeatPrev = 0.0;
        _gammaBeatCount = 0;
        _gammaBeatWithin01 = 0.0;
        _gammaBeatLastBeatT = tNow;

        if (!wantEnabled) {
          _gammaActive = false;
          return false;
        }
      }
    }

    if (!wantEnabled) {
      _gammaTarget = _gammaBase;

      let g0 = _gammaSmoothed;
      g0 = _slew(g0, _gammaTarget, stepDt, slewPerSec);
      g0 = _expSmooth(g0, _gammaTarget, stepDt, smoothSec);

      g0 = Math.round(g0 * 1000000) / 1000000;

      if (Math.abs(g0 - _gammaLastApplied) < eps) {
        _gammaSmoothed = g0;
        return false;
      }

      ps.gamma = g0;
      _gammaSmoothed = g0;
      _gammaLastApplied = g0;

      if (Math.abs(g0 - _gammaBase) <= 0.0005) {
        ps.gamma = _gammaBase;
        _gammaSmoothed = _gammaBase;
        _gammaLastApplied = _gammaBase;
        _gammaActive = false;
        _gammaNextAllowedT = 0.0;
      }

      return true;
    }

    const speedRaw = Number(ps.gammaAudioSpeed);
    const speed = Number.isFinite(speedRaw)
      ? Math.max(0.0, Math.min(16.0, speedRaw))
      : 1.0;

    const amtRaw = Number(ps.gammaAudioAmount);
    const amount = Number.isFinite(amtRaw) ? Math.max(0.0, amtRaw) : 0.15;

    const minRaw = Number(ps.gammaAudioMin);
    const maxRaw = Number(ps.gammaAudioMax);

    const minMul = Number.isFinite(minRaw) ? minRaw : -0.5;
    const maxMul = Number.isFinite(maxRaw) ? maxRaw : 0.5;

    let gMin = _gammaBase + minMul * amount;
    let gMax = _gammaBase + maxMul * amount;

    if (gMax < gMin) {
      const tmp = gMin;
      gMin = gMax;
      gMax = tmp;
    }

    gMin = _clampPos(gMin, 0.05);
    gMax = _clampPos(gMax, gMin + 0.000001);

    // Auto drift is now: "add this much to the drive each gamma tick"
    const driftStepRaw = Number(ps.gammaAudioAutoDrift);
    const driftStep = Number.isFinite(driftStepRaw) ? driftStepRaw : 0.0;

    // Beat clock always updates (independent of drift)
    _updateGammaBeatClock(_metrics, tNow, stepDt);

    // Only update target at Max Hz
    if (tNow < _gammaNextAllowedT) return false;
    _gammaNextAllowedT = tNow + 1.0 / maxHz;

    // One drift increment per tick, not a frequency
    _gammaAutoPhase01 = _fract(_gammaAutoPhase01 + driftStep);

    const beatsPerCycle = 4.0;

    let target = _gammaTarget;

    if (mode === 1) {
      const baseDrive01 = _fract((_gammaBeatCount * speed) / beatsPerCycle);
      const drive01 = _fract(baseDrive01 + _gammaAutoPhase01);

      const u = _smooth01(drive01);
      target = gMin + (gMax - gMin) * u;
      _gammaTarget = target;
    } else if (mode === 2) {
      const basePh01 = _fract(
        ((_gammaBeatCount + _gammaBeatWithin01) * speed) / beatsPerCycle,
      );
      const ph01 = _fract(basePh01 + _gammaAutoPhase01);

      let u = 0.5 + 0.5 * Math.sin(ph01 * (Math.PI * 2.0));
      u = _smooth01(u);

      target = gMin + (gMax - gMin) * u;
      _gammaTarget = target;
    } else if (mode === 3) {
      const durRaw = Number(ps.gammaAudioWanderSec);
      const dur = Number.isFinite(durRaw)
        ? Math.max(0.5, Math.min(30.0, durRaw))
        : 4.0;

      const blendRaw = Number(ps.gammaAudioWanderBlendSec);
      let blendSec = Number.isFinite(blendRaw)
        ? Math.max(0.05, Math.min(10.0, blendRaw))
        : 0.6;

      if (blendSec > dur) blendSec = dur;

      if (!(tNow < _gammaWanderNextPickT)) {
        _gammaWanderPrevCenter = _gammaWanderCenter;
        _gammaWanderPrevAmp = _gammaWanderAmp;
        _gammaWanderPrevSpeed = _gammaWanderSpeed;

        const span = Math.max(0.000001, gMax - gMin);

        const ampMax = span * 0.45;
        let a = Math.random() * ampMax;

        let cMin = gMin + a;
        let cMax = gMax - a;
        let c = 0.5 * (gMin + gMax);

        if (cMax >= cMin) {
          c = cMin + Math.random() * (cMax - cMin);
        } else {
          a = span * 0.25;
          cMin = gMin + a;
          cMax = gMax - a;
          c =
            cMax >= cMin
              ? cMin + Math.random() * (cMax - cMin)
              : 0.5 * (gMin + gMax);
        }

        _gammaWanderCenter = c;
        _gammaWanderAmp = a;
        _gammaWanderSpeed = speed * (0.35 + Math.random() * 1.35);

        _gammaWanderPickT = tNow;
        _gammaWanderNextPickT = tNow + dur;
      }

      const uu = _smooth01(
        (tNow - _gammaWanderPickT) / Math.max(0.000001, blendSec),
      );

      const center = _lerp(_gammaWanderPrevCenter, _gammaWanderCenter, uu);
      const amp = _lerp(_gammaWanderPrevAmp, _gammaWanderAmp, uu);
      const wSpeed = _lerp(_gammaWanderPrevSpeed, _gammaWanderSpeed, uu);

      _gammaWanderPhase += stepDt * wSpeed * (Math.PI * 2.0);
      if (_gammaWanderPhase > 1e9)
        _gammaWanderPhase = _gammaWanderPhase % (Math.PI * 2.0);

      target = center + amp * Math.sin(_gammaWanderPhase);
      _gammaTarget = target;
    }

    if (target < gMin) target = gMin;
    if (target > gMax) target = gMax;

    let g = _gammaSmoothed;
    g = _slew(g, target, stepDt, slewPerSec);
    g = _expSmooth(g, target, stepDt, smoothSec);

    if (g < gMin) g = gMin;
    if (g > gMax) g = gMax;

    g = Math.round(g * 1000000) / 1000000;

    if (Math.abs(g - _gammaLastApplied) < eps) {
      _gammaSmoothed = g;
      return false;
    }

    ps.gamma = g;
    _gammaSmoothed = g;
    _gammaLastApplied = g;
    return true;
  }

  function isAudioPaletteEnabled() {
    return _audioPaletteEnabled();
  }

  function tick() {
    _maybeAttachSidebarDevice();

    if ((renderGlobals.paramsState.gradTexMode | 0) !== 1) return;
    applyGradTexModeMaybeRefresh();
  }

  function getSystem() {
    return _readUiState();
  }

  function getDebugState() {
    return {
      applied: _applied,
      appliedKind: _appliedKind,
      uiAudioEnabled: _uiAudioEnabled,
      effectiveEnabled: isAudioPaletteEnabled(),
      hasExternal: !!(_extTex && _extView),
      externalWidth: _extWidth | 0,
      localWidth: _localN | 0,
      lastLocalSeq: _lastLocalSeq | 0,
      pendingSeq: _pendingSeq | 0,
      sidebarAttachTried: !!_sidebarAttachTried,
      sidebarAttachOk: !!_sidebarAttachOk,

      gammaActive: !!_gammaActive,
      gammaBase: +_gammaBase || 0,
      gammaTarget: +_gammaTarget || 0,
      gammaSmoothed: +_gammaSmoothed || 0,
      gammaLastApplied: +_gammaLastApplied || 0,
    };
  }

  function destroy() {
    if (
      typeof window !== "undefined" &&
      typeof window.removeEventListener === "function"
    ) {
      try {
        window.removeEventListener("palette-gradient:update", _onPaletteUpdate);
      } catch {}
      try {
        window.removeEventListener(
          "fractal-sound-palette:update",
          _onPaletteUpdate,
        );
      } catch {}
    }

    _applyNoneOverride();

    try {
      if (_localTex) _localTex.destroy();
    } catch {}

    _localTex = null;
    _localView = null;
    _localN = 0;

    _pendingRGBA = null;
    _pendingSeq = -1;
    _lastLocalSeq = -1;

    _metrics = null;
    _uiAudioEnabled = null;
    _clearExternalRefs();

    _applied = 0;
    _appliedKind = "none";
    _appliedKey = "";

    _gammaActive = false;
    _gammaBase = 1.0;
    _gammaTarget = 1.0;
    _gammaSmoothed = 1.0;
    _gammaLastApplied = 1.0;
    _gammaNextAllowedT = 0.0;
  }

  _maybeAttachSidebarDevice();

  return {
    tick,
    applyGradTexModeMaybeRefresh,
    applySoundHueToLocalParams,
    applySoundGammaToGlobalParams,
    isAudioPaletteEnabled,
    getSystem,
    getDebugState,
    destroy,
  };
}

/* ======================================================================
   Main initRender
   ====================================================================== */
export async function initRender() {
  const canvas = document.getElementById("gpu-canvas");
  const device = await initWebGPU();
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();

  function useHueGradientFlag() {
    if ((renderGlobals.paramsState.gradTexMode | 0) !== 1) return 0;

    if (soundGrad && typeof soundGrad.isAudioPaletteEnabled === "function") {
      return soundGrad.isAudioPaletteEnabled() ? 1 : 0;
    }

    return 1;
  }

  const initialNumeric =
    typeof window !== "undefined" && window.__pendingAlphaMode !== undefined
      ? parseAlphaModeToNumeric(
          window.__pendingAlphaMode,
          renderGlobals.paramsState.alphaMode || 0,
        )
      : parseAlphaModeToNumeric(
          renderGlobals.paramsState.alphaMode,
          renderGlobals.paramsState.alphaMode || 0,
        );

  renderGlobals.paramsState.alphaMode = initialNumeric;
  renderGlobals.paramsState.gradTexMode = _clampGradTexMode(
    renderGlobals.paramsState.gradTexMode,
  );

  let currentAlphaMode = canvasAlphaStringForNumeric(initialNumeric);
  if (typeof window !== "undefined") {
    window.__currentCanvasAlphaMode = currentAlphaMode;
  }

  const uniformStride = 256;
  const MAX_PIXELS_PER_CHUNK = 8000000;
  const MIN_SPLIT = 1024;

  const camera = createCameraController({
    canvas,
    invertMouseY: true,
    mouseSens: 0.002,
    onDirty: () => {
      renderGlobals.cameraDirty = true;
    },
  });

  camera.attach();

  window.setInvertMouseY = function setInvertMouseY(v) {
    camera.setInvertMouseY(v);
  };

  window.resetViewCamera = () => {
    camera.reset();
  };

  const fractalCompute = new FractalTileComputeGPU(
    device,
    undefined,
    undefined,
    uniformStride,
  );
  const sdfCompute = new SdfComputeGPU(device, uniformStride);

  const renderPipeline = new RenderPipelineGPU(
    device,
    context,
    undefined,
    undefined,
    {
      renderUniformStride: 256,
      initialGridDivs: renderGlobals.paramsState.gridDivs,
      quadScale: renderGlobals.paramsState.quadScale,
      canvasAlphaMode: currentAlphaMode,
      invertCameraY: false,
    },
  );

  _assertPipelineApi(renderPipeline);

  const slabPipeline = new SlabMeshPipelineGPU(device, context, {
    uniformStride,
    canvasAlphaMode: currentAlphaMode,
  });

  const queryCompute = new QueryComputeGPU(
    device,
    undefined,
    renderPipeline.sampler,
    renderPipeline.renderUniformBuffer,
    { uniformQuerySize: 16, queryResultBytes: 280 },
  );

  const rpWriteRenderUniform = _pickFn(renderPipeline, [
    "writeRenderUniform",
    "writeRenderUniforms",
    "writeUniforms",
  ]);
  const rpWriteThreshUniform = _pickFn(renderPipeline, [
    "writeThreshUniform",
    "writeThresholdUniform",
    "writeThresh",
    "writeThreshold",
  ]);
  const rpRenderFn = _pickFn(renderPipeline, ["render", "renderFrame", "draw"]);
  const rpBlitFn = _pickFn(renderPipeline, ["renderBlitToView"]);
  const rpRenderToView = _pickFn(renderPipeline, ["renderToView"]);

  const chunkViewCache = createChunkViewCache();

  let chunkInfos = [];
  let sdfReady = false;

  let slabWallsDirty = true;
  let _slabSetChunksSrc = null;
  let _slabSetChunksLayers = 0;

  let resizeTimer = 0;
  let frameHandle = 0;
  let exporting = false;

  let _sdfAllocEpoch = 0;

  const soundGrad = createUiSoundGradientAdapter({
    device,
    renderPipeline,
    renderGlobals,
    onDirty: () => {
      renderGlobals.cameraDirty = true;
    },
  });

  // Edge-triggered debug log for checking whether gradTex override reaches the fractal renderer path.
  let _lastGradTexFractalLogKey = "";

  function logGradTexFractalRoute(tag, extra = null) {
    const ps = renderGlobals.paramsState || {};
    const gradTexMode = (ps.gradTexMode | 0) === 1 ? 1 : 0;

    if (!gradTexMode) return;

    const adapterState =
      soundGrad && typeof soundGrad.getDebugState === "function"
        ? soundGrad.getDebugState()
        : null;

    const rpHasOverride = !!(
      renderPipeline &&
      renderPipeline._gradOverrideTex &&
      renderPipeline._gradOverrideView
    );

    const useHueGradient = useHueGradientFlag() | 0;

    const key = [
      tag,
      gradTexMode,
      useHueGradient,
      adapterState?.applied || 0,
      adapterState?.appliedKind || "none",
      adapterState?.effectiveEnabled ? 1 : 0,
      rpHasOverride ? 1 : 0,
      adapterState?.externalWidth || 0,
      adapterState?.localWidth || 0,
      String(ps.renderMode || ""),
      String(ps.layerIndex || 0),
    ].join("|");

    // Log only when the state changes so the console stays readable.
    if (key === _lastGradTexFractalLogKey) return;
    _lastGradTexFractalLogKey = key;

    console.debug("[gradTex -> fractalRenderer]", {
      tag,
      gradTexMode,
      useHueGradient,
      renderMode: ps.renderMode,
      layerIndex: ps.layerIndex,
      rpHasOverride,
      adapterState,
      extra: extra || undefined,
    });
  }

  function wantSdfForMode(mode, ps) {
    const m = normRenderMode(mode);

    if (m === "slab" || m === "raw") return false;
    if (ps && ps.layerMode) return false;

    if (ps && ps.lightingOn) return true;
    if (ps && ps.dispLimitOn) return true;
    if (((ps && ps.basis) | 0) === 2) return true;

    const sdfDispMode = (ps && ps.dispMode) | 0;
    const dispAmp = Number(ps && ps.dispAmp);

    let dispSource;
    if (ps && ps.dispSource != null) {
      dispSource = (Number(ps.dispSource) | 0) >>> 0;
    } else {
      dispSource = sdfDispMode !== 0 ? 1 : 0;
    }

    if ((dispSource & 1) !== 0 && sdfDispMode !== 0 && dispAmp !== 0)
      return true;

    return false;
  }

  function requestedLayers() {
    return requestedLayersFromParams(renderGlobals.paramsState);
  }

  function effectiveSplitCount(requestedSplit) {
    const req = Math.max(1, Math.floor(requestedSplit || 0));
    const eff = Math.min(req, MAX_PIXELS_PER_CHUNK);
    if (eff !== req) {
      console.debug(
        "splitCount clamped: requested=" + req + ", effective=" + eff,
      );
    }
    return eff;
  }

  async function ensureSlabChunks(layersToUse) {
    if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) return;
    layersToUse = Math.max(1, layersToUse | 0);

    if (
      _slabSetChunksSrc === chunkInfos &&
      _slabSetChunksLayers === layersToUse
    ) {
      return;
    }

    await slabPipeline.setChunks(chunkInfos, layersToUse);
    _slabSetChunksSrc = chunkInfos;
    _slabSetChunksLayers = layersToUse;
  }

  function freeSdfData(chunks = []) {
    destroySdfAttachments(chunks);
    sdfReady = false;
    _sdfAllocEpoch = 0;
    chunkViewCache.invalidate();
  }

  async function computeFractalLayer(layerIndex, aspect = 1) {
    let requested = Math.max(
      1,
      Math.floor(renderGlobals.paramsState.splitCount || 0),
    );
    let eff = Math.min(requested, MAX_PIXELS_PER_CHUNK);
    eff = Math.max(eff, MIN_SPLIT);

    while (true) {
      try {
        const params = cloneParamsForCompute(renderGlobals.paramsState, {
          splitCount: eff,
          nLayers: 1,
          layers: 1,
          layerIndex: 0,
        });

        const chunks = await fractalCompute.compute(
          params,
          layerIndex,
          aspect,
          "main",
          1,
          params.scaleOps,
        );
        chunkInfos = chunks || [];

        for (const c of chunkInfos) {
          if (!c.fractalView && c.layerViews && c.layerViews[0]) {
            c.fractalView = c.layerViews[0];
          }
          if (!c.layerViews && c.fractalView) {
            c.layerViews = [c.fractalView];
          }
        }

        sdfReady = false;
        slabWallsDirty = true;
        chunkViewCache.invalidate();

        if (queryCompute._bgCache) queryCompute._bgCache.clear();

        let bad = false;
        for (const c of chunkInfos) {
          if (typeof c.width === "number" && typeof c.height === "number") {
            const pixels = c.width * c.height;
            if (pixels > MAX_PIXELS_PER_CHUNK) {
              bad = true;
              break;
            }
          }
        }
        if (bad) throw new Error("chunk slice too large");

        _slabSetChunksSrc = null;
        _slabSetChunksLayers = 0;

        return chunkInfos;
      } catch (err) {
        console.warn("computeFractalLayer failed:", err);

        if (eff <= MIN_SPLIT) {
          if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) {
            chunkInfos = [
              {
                offsetX: 0,
                offsetY: 0,
                width: 1,
                height: 1,
                fractalTex: device.createTexture({
                  size: [1, 1, 1],
                  format: "rgba8unorm",
                  usage:
                    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                }),
              },
            ];
            chunkInfos[0].fractalView = chunkInfos[0].fractalTex.createView({
              dimension: "2d",
            });
            chunkInfos[0].layerViews = [chunkInfos[0].fractalView];
          }

          sdfReady = false;
          slabWallsDirty = true;
          chunkViewCache.invalidate();

          _slabSetChunksSrc = null;
          _slabSetChunksLayers = 0;

          return chunkInfos;
        }

        const next = Math.max(MIN_SPLIT, Math.floor(eff / 2));
        eff = next === eff ? MIN_SPLIT : next;
      }
    }
  }

  async function computeFractalLayerSeries(count, aspect = 1) {
    count = Math.max(1, count >>> 0);

    const base = cloneParamsForCompute(renderGlobals.paramsState, {
      splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
      nLayers: count,
      layers: count,
    });

    const { gammaStart, gammaRange } = resolveGammaSeries(base, count);
    const baseParams = cloneParamsForCompute(base, { gamma: gammaStart });

    let seriesChunks;
    if (typeof fractalCompute.computeLayerSeries === "function") {
      seriesChunks = await fractalCompute.computeLayerSeries(
        baseParams,
        gammaStart,
        gammaRange,
        count,
        aspect,
        "main",
        baseParams.scaleOps,
      );
    } else {
      const merged = new Map();

      for (let li = 0; li < count; ++li) {
        const g = gammaForLayerIndex(gammaStart, gammaRange, li, count);
        const paramsLi =
          g === baseParams.gamma
            ? baseParams
            : cloneParamsForCompute(baseParams, { gamma: g });

        const chunks = await fractalCompute.compute(
          paramsLi,
          li,
          aspect,
          "main",
          count,
          paramsLi.scaleOps,
        );

        for (const c of chunks) {
          const key = `${c.offsetX}|${c.offsetY}|${c.width}|${c.height}`;
          let dst = merged.get(key);
          if (!dst) {
            dst = Object.assign({}, c);
            dst.fractalLayerViews = new Array(count);
            merged.set(key, dst);
          }
          const view =
            c.fractalView || (c.layerViews && c.layerViews[0]) || null;
          dst.fractalLayerViews[li] = view;
        }
      }

      seriesChunks = Array.from(merged.values());
    }

    chunkInfos = (seriesChunks || []).map((c) => Object.assign({}, c));
    normalizeFractalChunkLayers(chunkInfos, count);

    sdfReady = false;
    slabWallsDirty = true;
    chunkViewCache.invalidate();

    _slabSetChunksSrc = null;
    _slabSetChunksLayers = 0;

    if (queryCompute._bgCache) queryCompute._bgCache.clear();
    return chunkInfos;
  }

  async function computeSdfLayer(layerIndex, aspect = 1) {
    if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) {
      sdfReady = false;
      return chunkInfos;
    }

    cleanupTempFallbacks(chunkInfos);

    try {
      const params = cloneParamsForCompute(renderGlobals.paramsState, {
        splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
        nLayers: 1,
        layers: 1,
        layerIndex: 0,
      });

      const wasReady = sdfReady;

      await sdfCompute.compute(
        chunkInfos,
        params,
        layerIndex,
        aspect,
        params.scaleOps,
      );
      await device.queue.onSubmittedWorkDone();

      sdfReady = true;

      const epochNow = (sdfCompute && sdfCompute._allocEpoch) | 0;
      const realloc = epochNow !== (_sdfAllocEpoch | 0);
      _sdfAllocEpoch = epochNow;

      if (!wasReady || realloc) chunkViewCache.invalidate();

      if (queryCompute._bgCache) queryCompute._bgCache.clear();
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;

      soundGrad.applyGradTexModeMaybeRefresh();

      await renderPipeline.setChunks(chunkViewCache.withSdf(chunkInfos), 1, {
        layerIndex: layerIndex >>> 0,
        requireSdf: true,
      });

      return chunkInfos;
    } catch (err) {
      sdfReady = false;
      chunkViewCache.invalidate();

      console.warn("computeSdfLayer: SDF compute failed:", err);

      for (const c of chunkInfos) {
        try {
          if (
            (c.sdfView || (c.sdfLayerViews && c.sdfLayerViews[layerIndex])) &&
            (c.flagView || (c.flagLayerViews && c.flagLayerViews[layerIndex]))
          ) {
            continue;
          }

          if (!c._tmpSdfTex) {
            c._tmpSdfTex = device.createTexture({
              size: [1, 1, 1],
              format: "rgba16float",
              usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
          }
          if (!c._tmpFlagTex) {
            c._tmpFlagTex = device.createTexture({
              size: [1, 1, 1],
              format: "r32uint",
              usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
          }

          c.sdfView = c._tmpSdfTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1,
          });
          c.sdfLayerViews = c.sdfLayerViews || [];
          c.sdfLayerViews[layerIndex] = c.sdfView;

          c.flagView = c._tmpFlagTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1,
          });
          c.flagLayerViews = c.flagLayerViews || [];
          c.flagLayerViews[layerIndex] = c.flagView;

          c._usingTmpSdfFallback = true;
        } catch (e2) {
          console.warn(
            "computeSdfLayer: temporary fallback creation failed for chunk:",
            c,
            e2,
          );
        }
      }

      try {
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        soundGrad.applyGradTexModeMaybeRefresh();

        await renderPipeline.setChunks(
          chunkViewCache.withoutSdf(chunkInfos),
          1,
          {
            layerIndex: layerIndex >>> 0,
            requireSdf: false,
          },
        );
      } catch (ebg) {
        console.warn(
          "computeSdfLayer: renderPipeline.setChunks failed even with fallbacks:",
          ebg,
        );
      }

      return chunkInfos;
    }
  }

  function _configureContextForCanvasSize() {
    try {
      context.configure({
        device,
        format,
        alphaMode: currentAlphaMode,
        size: [canvas.width, canvas.height],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
    } catch (e) {
      console.warn("context.configure failed:", e);
    }
  }

  window.setAlphaMode = function setAlphaMode(mode) {
    const numeric = parseAlphaModeToNumeric(
      mode,
      renderGlobals.paramsState.alphaMode || 0,
    );
    renderGlobals.paramsState.alphaMode = numeric;

    const newCanvasMode = canvasAlphaStringForNumeric(numeric);
    if (newCanvasMode !== currentAlphaMode) {
      currentAlphaMode = newCanvasMode;
      window.__currentCanvasAlphaMode = currentAlphaMode;

      slabPipeline.canvasAlphaMode = currentAlphaMode;
      renderPipeline.canvasAlphaMode = currentAlphaMode;

      _configureContextForCanvasSize();

      try {
        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;
        slabPipeline.resize(cw, ch);
        renderPipeline.resize(cw, ch);
      } catch {}
    }

    renderGlobals.cameraDirty = true;
    renderGlobals.gridDirty = true;
  };

  async function rebuildForCurrentState(aspect, forceFractalRecompute) {
    const ps = renderGlobals.paramsState;
    const mode = normRenderMode(ps.renderMode);

    const req = requestedLayers();
    ps.layerIndex = clampLayerIndex(ps.layerIndex, req);

    const wantSdf = wantSdfForMode(mode, ps);
    const sdfSrcLayer = req > 1 ? 0 : ps.layerIndex;

    soundGrad.applyGradTexModeMaybeRefresh();

    if (forceFractalRecompute) {
      if (req > 1) {
        await computeFractalLayerSeries(req, aspect);

        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));

        if (mode === "slab") {
          freeSdfData(chunkInfos);
          sdfReady = false;

          await ensureSlabChunks(layersToUse);
          slabWallsDirty = true;
          return;
        }

        if (wantSdf) {
          freeSdfData(chunkInfos);
          sdfReady = false;
          await computeSdfLayer(sdfSrcLayer, aspect);
        } else {
          freeSdfData(chunkInfos);
          sdfReady = false;
        }

        renderPipeline.gridDivs = ps.gridDivs;

        const requireSdf = wantSdf && sdfReady;
        await renderPipeline.setChunks(
          requireSdf
            ? chunkViewCache.withSdf(chunkInfos)
            : chunkViewCache.withoutSdf(chunkInfos),
          layersToUse,
          {
            layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
            requireSdf,
          },
        );

        return;
      }

      await computeFractalLayer(ps.layerIndex, aspect);

      if (mode === "slab") {
        freeSdfData(chunkInfos);
        sdfReady = false;

        await ensureSlabChunks(1);
        slabWallsDirty = true;
        return;
      }

      if (wantSdf) {
        await computeSdfLayer(ps.layerIndex, aspect);
      } else {
        freeSdfData(chunkInfos);
        sdfReady = false;
      }

      renderPipeline.gridDivs = ps.gridDivs;

      const requireSdf = wantSdf && sdfReady;
      await renderPipeline.setChunks(
        requireSdf
          ? chunkViewCache.withSdf(chunkInfos)
          : chunkViewCache.withoutSdf(chunkInfos),
        1,
        {
          layerIndex: clampLayerIndex(ps.layerIndex, 1),
          requireSdf,
        },
      );

      return;
    }

    if (req > 1) {
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));

      if (mode === "slab") {
        freeSdfData(chunkInfos);
        sdfReady = false;

        await ensureSlabChunks(layersToUse);
        slabWallsDirty = true;
        return;
      }

      if (wantSdf) {
        await computeSdfLayer(sdfSrcLayer, aspect);
      } else {
        freeSdfData(chunkInfos);
        sdfReady = false;
      }

      renderPipeline.gridDivs = ps.gridDivs;

      const requireSdf = wantSdf && sdfReady;
      await renderPipeline.setChunks(
        requireSdf
          ? chunkViewCache.withSdf(chunkInfos)
          : chunkViewCache.withoutSdf(chunkInfos),
        layersToUse,
        {
          layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
          requireSdf,
        },
      );

      return;
    }

    if (mode === "slab") {
      freeSdfData(chunkInfos);
      sdfReady = false;

      await ensureSlabChunks(1);
      slabWallsDirty = true;
      return;
    }

    if (wantSdf) {
      await computeSdfLayer(ps.layerIndex, aspect);
    } else {
      freeSdfData(chunkInfos);
      sdfReady = false;
    }

    renderPipeline.gridDivs = ps.gridDivs;

    const requireSdf = wantSdf && sdfReady;
    await renderPipeline.setChunks(
      requireSdf
        ? chunkViewCache.withSdf(chunkInfos)
        : chunkViewCache.withoutSdf(chunkInfos),
      1,
      {
        layerIndex: clampLayerIndex(ps.layerIndex, 1),
        requireSdf,
      },
    );
  }

  async function renderFrame() {
    const ps = renderGlobals.paramsState;
    const req = requestedLayers();
    ps.layerIndex = clampLayerIndex(ps.layerIndex, req);

    const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
    const mode = normRenderMode(ps.renderMode);

    const camState = camera.camState;

    soundGrad.applyGradTexModeMaybeRefresh();

    if (mode === "slab") {
      const slabBits = slabAlphaBitsFromParams(ps);

      const localParams = Object.assign({}, ps, {
        nLayers: layersToUse,
        layers: layersToUse,
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
        waitGPU: true,
        useHueGradient: useHueGradientFlag(),
        timeSec: performance.now() * 0.001,
      });

      soundGrad.applySoundHueToLocalParams(localParams);

      await ensureSlabChunks(layersToUse);

      await slabPipeline.render(localParams, camState, {
        runCompute: slabWallsDirty,
        layers: layersToUse,
      });

      slabWallsDirty = false;
      return;
    }

    const localParams = Object.assign({}, ps, {
      useHueGradient: useHueGradientFlag(),
      nLayers: layersToUse,
      layers: layersToUse,
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
    });

    soundGrad.applySoundHueToLocalParams(localParams);

    if (rpWriteRenderUniform) rpWriteRenderUniform(localParams);
    if (rpWriteThreshUniform) rpWriteThreshUniform(localParams);

    if (renderGlobals.gridDirty) {
      renderPipeline.gridDivs = ps.gridDivs;
      renderPipeline.gridStripes = null;
      renderGlobals.gridDirty = false;
    }

    const requireSdf = wantSdfForMode(mode, ps) && sdfReady;
    const chunksToUse = requireSdf
      ? chunkViewCache.withSdf(chunkInfos)
      : chunkViewCache.withoutSdf(chunkInfos);

    await renderPipeline.setChunks(chunksToUse, layersToUse, {
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
      requireSdf,
    });

    // Debug log to confirm gradTex state is active on the fractal renderer path.
    logGradTexFractalRoute("renderFrame:setChunks", {
      layersToUse,
      requireSdf,
      drawPath:
        mode === "raw" && rpBlitFn
          ? "raw-blit"
          : rpRenderFn
            ? "render"
            : rpBlitFn
              ? "blit"
              : "none",
    });

    if (mode === "raw" && rpBlitFn) {
      const viewTex = context.getCurrentTexture().createView();
      const aspect =
        canvas.width > 0 && canvas.height > 0
          ? canvas.width / canvas.height
          : 1.0;

      if (typeof renderPipeline.updateCamera === "function") {
        renderPipeline.updateCamera(camState, aspect);
      }

      await rpBlitFn(localParams, viewTex);
    } else if (rpRenderFn) {
      await rpRenderFn(localParams, camState);
    } else if (rpBlitFn) {
      const viewTex = context.getCurrentTexture().createView();
      const aspect =
        canvas.width > 0 && canvas.height > 0
          ? canvas.width / canvas.height
          : 1.0;

      if (typeof renderPipeline.updateCamera === "function") {
        renderPipeline.updateCamera(camState, aspect);
      }

      await rpBlitFn(localParams, viewTex);
    }
  }

  async function handleResizeImmediate() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const pw = Math.floor(cw * dpr);
    const ph = Math.floor(ch * dpr);

    canvas.width = pw;
    canvas.height = ph;

    slabPipeline.canvasAlphaMode = currentAlphaMode;
    renderPipeline.canvasAlphaMode = currentAlphaMode;

    _configureContextForCanvasSize();

    slabPipeline.resize(cw, ch);
    renderPipeline.resize(cw, ch);

    renderGlobals.computeDirty = true;
    renderGlobals.displacementDirty = true;
    renderGlobals.cameraDirty = true;
    renderGlobals.gridDirty = true;

    slabWallsDirty = true;
    _slabSetChunksSrc = null;
    _slabSetChunksLayers = 0;

    const aspect = pw / ph || 1;

    try {
      soundGrad.applyGradTexModeMaybeRefresh();
      await rebuildForCurrentState(aspect, true);
      cleanupTempFallbacks(chunkInfos);
      await renderFrame();

      renderGlobals.computeDirty = false;
      renderGlobals.displacementDirty = false;
      renderGlobals.cameraDirty = false;
      renderGlobals.gridDirty = false;
    } catch (e) {
      console.error("handleResizeImmediate failed:", e);
      renderGlobals.cameraDirty = true;
    }
  }

  function scheduleResizeDebounced() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = 0;
      handleResizeImmediate().catch((e) =>
        console.error("debounced resize failed:", e),
      );
    }, 150);
  }

  window.addEventListener("resize", scheduleResizeDebounced);

  async function updateComputeAndDisplacement(aspect) {
    if (renderGlobals.computeDirty) {
      await rebuildForCurrentState(aspect, true);
      renderGlobals.computeDirty = false;
      renderGlobals.displacementDirty = false;
      renderGlobals.cameraDirty = true;
      return;
    }

    if (renderGlobals.displacementDirty) {
      await rebuildForCurrentState(aspect, false);
      renderGlobals.displacementDirty = false;
      renderGlobals.cameraDirty = true;
    }
  }

  function downloadBlob(blob, filename) {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename || "download";
    a.rel = "noopener";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 1000);
  }

  function canvasToPngBlob(canvasEl) {
    return new Promise((resolve, reject) => {
      try {
        canvasEl.toBlob((blob) => {
          if (!blob) reject(new Error("canvas.toBlob returned null"));
          else resolve(blob);
        }, "image/png");
      } catch (e) {
        reject(e);
      }
    });
  }

  function _alignUp(v, a) {
    v = v | 0;
    a = a | 0;
    return (v + (a - 1)) & ~(a - 1);
  }

  let _exportTex = null;
  let _exportTexW = 0;
  let _exportTexH = 0;
  let _exportTexFormat = "";
  let _exportReadback = null;
  let _exportReadbackBytes = 0;
  let _exportBpr = 0;

  let _export2dCanvas = null;
  let _export2dCtx = null;

  function _ensureExport2dCanvas(w, h) {
    if (!_export2dCanvas) {
      _export2dCanvas = document.createElement("canvas");
      _export2dCtx = _export2dCanvas.getContext("2d");
      if (!_export2dCtx) throw new Error("2D context unavailable for export");
    }
    if (_export2dCanvas.width !== w) _export2dCanvas.width = w;
    if (_export2dCanvas.height !== h) _export2dCanvas.height = h;
    return _export2dCtx;
  }

  function _ensureExportGpuTargets(w, h) {
    w = Math.max(1, w | 0);
    h = Math.max(1, h | 0);

    const fmt =
      (renderPipeline && renderPipeline.format) ||
      navigator.gpu.getPreferredCanvasFormat();

    const rawBpr = w * 4;
    const bpr = _alignUp(rawBpr, 256);
    const needBytes = bpr * h;

    if (
      !_exportTex ||
      _exportTexW !== w ||
      _exportTexH !== h ||
      _exportTexFormat !== fmt
    ) {
      try {
        if (_exportTex) _exportTex.destroy();
      } catch {}

      _exportTex = device.createTexture({
        size: [w, h, 1],
        format: fmt,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      _exportTexW = w;
      _exportTexH = h;
      _exportTexFormat = fmt;
    }

    if (!_exportReadback || _exportReadbackBytes < needBytes) {
      try {
        if (_exportReadback) _exportReadback.destroy();
      } catch {}

      _exportReadback = device.createBuffer({
        size: needBytes,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      _exportReadbackBytes = needBytes;
    }

    _exportBpr = bpr;
    return { texture: _exportTex, format: fmt, bytesPerRow: bpr };
  }

  async function _renderFractalToExportTexture(w, h) {
    const ps = renderGlobals.paramsState;

    const req = requestedLayers();
    ps.layerIndex = clampLayerIndex(ps.layerIndex, req);

    const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
    const mode = normRenderMode(ps.renderMode);
    if (mode === "slab") {
      throw new Error("Offscreen export not implemented for slab mode.");
    }

    const aspect = w > 0 && h > 0 ? w / h : 1.0;

    if (renderGlobals.gridDirty) {
      renderPipeline.gridDivs = ps.gridDivs;
      renderPipeline.gridStripes = null;
      renderGlobals.gridDirty = false;
    }

    soundGrad.applyGradTexModeMaybeRefresh();

    const requireSdf = wantSdfForMode(mode, ps) && sdfReady;
    const chunksToUse = requireSdf
      ? chunkViewCache.withSdf(chunkInfos)
      : chunkViewCache.withoutSdf(chunkInfos);

    await renderPipeline.setChunks(chunksToUse, layersToUse, {
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
      requireSdf,
    });

    const { texture } = _ensureExportGpuTargets(w, h);
    const view = texture.createView();

    const camState = camera.camState;

    const localParams = Object.assign({}, ps, {
      nLayers: layersToUse,
      layers: layersToUse,
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
      waitGPU: true,
      useHueGradient: useHueGradientFlag(),
    });

    soundGrad.applySoundHueToLocalParams(localParams);

    if (rpRenderToView) {
      await rpRenderToView(localParams, camState, view, w, h);
      return;
    }

    if (!rpBlitFn) throw new Error("renderPipeline.renderBlitToView missing");

    if (typeof renderPipeline.updateCamera === "function") {
      renderPipeline.updateCamera(camState, aspect);
    }
    await rpBlitFn(localParams, view);
  }

  async function _exportCurrentExportTextureToPngBlob(w, h) {
    const { texture, format, bytesPerRow } = _ensureExportGpuTargets(w, h);

    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture },
      { buffer: _exportReadback, bytesPerRow, rowsPerImage: h },
      { width: w, height: h, depthOrArrayLayers: 1 },
    );

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    await _exportReadback.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(_exportReadback.getMappedRange());

    const ctx2d = _ensureExport2dCanvas(w, h);
    const img = ctx2d.createImageData(w, h);
    const dst = img.data;

    const isBGRA = String(format).toLowerCase().startsWith("bgra");

    let dstOff = 0;
    let srcRowOff = 0;

    if (!isBGRA) {
      for (let y = 0; y < h; y++) {
        dst.set(src.subarray(srcRowOff, srcRowOff + w * 4), dstOff);
        srcRowOff += bytesPerRow;
        dstOff += w * 4;
      }
    } else {
      for (let y = 0; y < h; y++) {
        let s = srcRowOff;
        for (let x = 0; x < w; x++) {
          const b = src[s + 0];
          const g = src[s + 1];
          const r = src[s + 2];
          const a = src[s + 3];
          dst[dstOff + 0] = r;
          dst[dstOff + 1] = g;
          dst[dstOff + 2] = b;
          dst[dstOff + 3] = a;
          s += 4;
          dstOff += 4;
        }
        srcRowOff += bytesPerRow;
      }
    }

    _exportReadback.unmap();

    ctx2d.putImageData(img, 0, 0);
    return canvasToPngBlob(_export2dCanvas);
  }

  async function exportFractalCanvas() {
    if (exporting) return;

    exporting = true;
    try {
      flushPending();

      const w = canvas.width | 0;
      const h = canvas.height | 0;
      const aspect = w > 0 && h > 0 ? w / h : 1.0;

      await updateComputeAndDisplacement(aspect);
      await _renderFractalToExportTexture(w, h);

      const blob = await _exportCurrentExportTextureToPngBlob(w, h);
      const tag = randomTag();
      downloadBlob(blob, "fractal-canvas-" + tag + ".png");
    } catch (e) {
      console.error("exportFractalCanvas failed:", e);
    } finally {
      exporting = false;
      renderGlobals.cameraDirty = true;
    }
  }

  async function exportFractalFullRes() {
    if (exporting) return;

    exporting = true;
    try {
      flushPending();

      const targetRes = Math.max(
        64,
        Math.floor(renderGlobals.paramsState.gridSize || 1024),
      );

      const exportAspect = 1.0;

      await rebuildForCurrentState(exportAspect, true);
      renderGlobals.computeDirty = false;
      renderGlobals.displacementDirty = false;

      await _renderFractalToExportTexture(targetRes, targetRes);

      const blob = await _exportCurrentExportTextureToPngBlob(
        targetRes,
        targetRes,
      );

      const tag = randomTag();
      downloadBlob(blob, "fractal-" + targetRes + "-" + tag + ".png");
    } catch (e) {
      console.error("exportFractalFullRes failed:", e);
    } finally {
      exporting = false;
      renderGlobals.cameraDirty = true;
    }
  }

  {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const pw = Math.floor(cw * (window.devicePixelRatio || 1));
    const ph = Math.floor(ch * (window.devicePixelRatio || 1));

    canvas.width = pw;
    canvas.height = ph;

    slabPipeline.canvasAlphaMode = currentAlphaMode;
    renderPipeline.canvasAlphaMode = currentAlphaMode;

    _configureContextForCanvasSize();

    slabPipeline.resize(cw, ch);
    renderPipeline.resize(cw, ch);

    renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
    renderPipeline.gridStripes = null;

    const aspect = pw / ph || 1;

    soundGrad.applyGradTexModeMaybeRefresh();

    await rebuildForCurrentState(aspect, true);
    cleanupTempFallbacks(chunkInfos);
    await renderFrame();

    renderGlobals.computeDirty = false;
    renderGlobals.cameraDirty = false;
    renderGlobals.displacementDirty = false;
    renderGlobals.gridDirty = false;
  }

  let lastTime = performance.now();

  async function frame(now) {
    const dt = (now - lastTime) * 0.001;
    lastTime = now;

    flushPending();

    if (exporting) {
      frameHandle = requestAnimationFrame(frame);
      return;
    }

    const aspect =
      canvas.width > 0 && canvas.height > 0
        ? canvas.width / canvas.height
        : 1.0;

    const nowSec = now * 0.001;
    renderGlobals.paramsState.timeSec = nowSec;

    soundGrad.tick(nowSec, dt);

    if (
      soundGrad &&
      typeof soundGrad.applySoundGammaToGlobalParams === "function" &&
      soundGrad.applySoundGammaToGlobalParams(
        renderGlobals.paramsState,
        nowSec,
        dt,
      )
    ) {
      renderGlobals.computeDirty = true;
    }

    await updateComputeAndDisplacement(aspect);

    if (camera.updateMovement(dt, renderGlobals.paramsState.quadScale)) {
      renderGlobals.cameraDirty = true;
    }

    if (renderGlobals.cameraDirty) {
      await renderFrame();
      renderGlobals.cameraDirty = false;
    }

    frameHandle = requestAnimationFrame(frame);
  }

  if (typeof window !== "undefined") {
    window.exportFractalCanvas = exportFractalCanvas;
    window.exportFractalFullRes = exportFractalFullRes;

    window.__fractalRuntime = {
      device,
      context,
      renderPipeline,
      slabPipeline,
      fractalCompute,
      sdfCompute,
      queryCompute,
      renderGlobals,
      camera,
      soundPaletteSystem: soundGrad.getSystem(),
      soundPaletteAdapter: soundGrad.getDebugState(),
    };
  }

  frameHandle = requestAnimationFrame(frame);

  return {
    device,
    fractalCompute,
    sdfCompute,
    slabPipeline,
    renderPipeline,
    queryCompute,
    destroy: () => {
      try {
        cancelAnimationFrame(frameHandle);
      } catch {}

      try {
        window.removeEventListener("resize", scheduleResizeDebounced);
      } catch {}

      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {}
      resizeTimer = 0;

      try {
        camera.dispose();
      } catch {}

      try {
        fractalCompute.destroy();
      } catch {}

      try {
        sdfCompute.destroy(chunkInfos || []);
      } catch {}

      try {
        slabPipeline.destroy();
      } catch {}

      try {
        renderPipeline.destroy();
      } catch {}

      try {
        soundGrad.destroy();
      } catch {}

      try {
        if (_exportTex) _exportTex.destroy();
      } catch {}
      _exportTex = null;

      try {
        if (_exportReadback) _exportReadback.destroy();
      } catch {}
      _exportReadback = null;

      try {
        if (chunkInfos && chunkInfos.forEach) {
          chunkInfos.forEach((c) => {
            try {
              if (c.fractalTex) c.fractalTex.destroy();
            } catch {}
            try {
              if (c.sdfTex) c.sdfTex.destroy();
            } catch {}
            try {
              if (c.flagTex) c.flagTex.destroy();
            } catch {}
            try {
              if (c._tmpSdfTex) c._tmpSdfTex.destroy();
            } catch {}
            try {
              if (c._tmpFlagTex) c._tmpFlagTex.destroy();
            } catch {}
          });
        }
      } catch {}
    },
  };
}
