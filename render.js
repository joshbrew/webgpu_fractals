// render.js
// SDF compute only when needed: displacement OR lighting; auto-free SDF/flag textures when SDFs are not required
// nLayers support: compute multi-layer fractal arrays; no per-layer SDFs when nLayers > 1
// layerMode: disables SDF/displacement and enables multi-layer fractal stacks with stepped gamma

import { FractalTileComputeGPU } from "./shaders/fractalCompute.js";
import { SdfComputeGPU } from "./shaders/fsdfCompute.js";
import RenderPipelineGPUDefault, {
  RenderPipelineGPU as RenderPipelineGPUNamed,
} from "./shaders/fractalRender.js";
import { QueryComputeGPU } from "./shaders/fheightQueryCompute.js";

import SlabMeshPipelineGPU from "./shaders/fSlabCompute.js";

const RenderPipelineGPU = RenderPipelineGPUNamed || RenderPipelineGPUDefault;

/* ======================================================================
   Shared UI/param state
   ====================================================================== */
export const renderGlobals = {
  computeDirty: true,
  cameraDirty: true,
  displacementDirty: true,
  gridDirty: true,
  paramsState: {
    gridSize: 1542,
    splitCount: 8000000,
    layerIndex: 0,

    layers: 100,
    nLayers: 1,

    renderMode: "fractal",
    layerMode: false,

    maxIter: 150,
    fractalType: 0,
    scaleMode: 1,
    zoom: 4.0,
    dx: 0.0,
    dy: 0.0,
    escapeR: 4.0,
    zMin: 0.0,
    dz: 0.01,
    gamma: 1.0,

    // stepped gamma across layers
    // - if layerGammaStep != 0: gamma(li) steps across layers; base gamma is treated as the floor
    // - else if layerGammaRange != 0: gamma ramps by range; base gamma is treated as the floor
    // - else: optional ramp toward layerGammaStart but clamped so base gamma remains the floor
    layerGammaStart: 1.0,
    layerGammaStep: 0.001,
    layerGammaRange: 0.0,

    epsilon: 1e-6,
    convergenceTest: false,
    escapeMode: 0,
    scheme: 0,
    hueOffset: 0.0,
    gridDivs: 256,
    dispMode: 0,
    dispAmp: 0.15,
    dispCurve: 3.0,
    dispLimitOn: false,
    slopeLimit: 0.5,
    wallJump: 0.05,
    bowlOn: false,
    bowlDepth: 0.25,
    quadScale: 1.0,

    worldOffset: 0.0,
    worldStart: 0.0,

    lightingOn: false,
    lightPos: [0, 0, 5],
    specPower: 32.0,
    lowT: 0.0,
    highT: 1.0,
    alphaMode: 0,
    basis: 0,
    normalMode: 2,

    // slab renderer knobs (optional, safe defaults)
    fieldMode: 0,
    meshStep: 1,
    capBias: 0.0,
    gradScale: 1.0,
    thickness: 0.25,
    feather: 0.0,

    // slab contour debug toggles (packed into slab alphaMode bits)
    contourOn: true,
    contourOnly: true,
    contourFront: true,
  },
};

const F = { C: 1, D: 2, R: 4, G: 8 };
const DIRTY_MAP = {
  gridSize: F.C | F.D,
  splitCount: F.C | F.D,

  layers: F.C,
  nLayers: F.C,
  layerIndex: F.C,

  maxIter: F.C,
  fractalType: F.C,
  scaleMode: F.C,
  zoom: F.C,
  dx: F.C,
  dy: F.C,
  escapeR: F.C,
  zMin: F.C,
  dz: F.C,

  gamma: F.C,
  layerGammaStart: F.C,
  layerGammaStep: F.C,
  layerGammaRange: F.C,

  epsilon: F.C,
  convergenceTest: F.C,
  escapeMode: F.C,

  renderMode: F.R | F.D,

  // toggling layerMode must force: recompute (layer count changes), SDF teardown, and render rebind
  layerMode: F.C | F.D | F.R,

  dispAmp: F.D,
  dispMode: F.D,
  dispCurve: F.D,
  wallJump: F.D,
  quadScale: F.D | F.R,
  bowlOn: F.D | F.R,
  bowlDepth: F.D | F.R,
  connectivityMode: F.D,
  normalMode: F.D,
  slopeLimit: F.D,

  // these affect the layer-space sampling and must trigger fractal compute as well
  worldOffset: F.C | F.D | F.R,
  worldStart: F.C | F.D | F.R,

  hueOffset: F.R,
  scheme: F.R,
  colorScheme: F.R,
  lightingOn: F.R | F.D,
  lightPos: F.R,
  specPower: F.R,
  dispLimitOn: F.R,
  gridDivs: F.R | F.G,

  lowT: F.R | F.D,
  highT: F.R | F.D,
  basis: F.R | F.D,

  alphaMode: F.R | F.G,

  // slab renderer knobs
  fieldMode: F.D,
  meshStep: F.D,
  capBias: F.D,
  gradScale: F.D,
  thickness: F.R,
  feather: F.R,

  // slab contour debug toggles
  contourOn: F.R,
  contourOnly: F.R,
  contourFront: F.R,
};

const pending = { paramsState: {} };
let dirtyBits = 0;
let hasPending = false;

export function setState(partial) {
  if (!partial || typeof partial !== "object") return;

  Object.assign(pending.paramsState, partial);
  hasPending = true;

  for (const k in partial) {
    const bits = DIRTY_MAP[k];
    dirtyBits |= bits != null ? bits : F.R;
  }
}

function flushPending() {
  if (!hasPending) return;

  const ps = renderGlobals.paramsState;
  const prevLayerMode = !!ps.layerMode;

  Object.assign(ps, pending.paramsState);
  pending.paramsState = {};
  hasPending = false;

  const nextLayerMode = !!ps.layerMode;

  if (nextLayerMode && !prevLayerMode) {
    ps.dispMode = 0;
    ps.lightingOn = false;

    const rm = (ps.renderMode == null ? "" : String(ps.renderMode)).trim().toLowerCase();
    if (rm === "slab" || rm === "1") ps.renderMode = "fractal";

    renderGlobals.computeDirty = true;
    renderGlobals.displacementDirty = true;
    renderGlobals.cameraDirty = true;
  }

  renderGlobals.computeDirty ||= !!(dirtyBits & F.C);
  renderGlobals.displacementDirty ||= !!(dirtyBits & F.D);
  renderGlobals.cameraDirty ||= !!(dirtyBits & F.R);
  renderGlobals.gridDirty ||= !!(dirtyBits & F.G);

  dirtyBits = 0;
}

/* ======================================================================
   Layer helpers
   ====================================================================== */
function _safeGamma(g) {
  const x = Number.isFinite(g) ? g : 1.0;
  return x <= 0 ? 1e-6 : x;
}

function requestedLayersFromParams(params) {
  const p = params || renderGlobals.paramsState;
  if (!p || !p.layerMode) return 1;

  const raw = p.nLayers ?? p.layers ?? 1;
  const n = Math.floor(Number(raw) || 0);
  return Math.max(1, n);
}

function resolveGammaSeries(params, count) {
  const p = params || {};
  const baseGamma = _safeGamma(Number.isFinite(+p.gamma) ? +p.gamma : 1.0);

  if (count <= 1) return { gammaStart: baseGamma, gammaRange: 0.0 };

  const step = Number.isFinite(+p.layerGammaStep) ? +p.layerGammaStep : 0.0;
  const rangeExplicit = Number.isFinite(+p.layerGammaRange) ? +p.layerGammaRange : 0.0;
  const gStartRaw = Number.isFinite(+p.layerGammaStart) ? +p.layerGammaStart : baseGamma;

  if (step !== 0) {
    const total = step * (count - 1);
    const gammaStart = total >= 0 ? baseGamma : baseGamma - total;
    return { gammaStart, gammaRange: total };
  }

  if (rangeExplicit !== 0) {
    const total = rangeExplicit;
    const gammaStart = total >= 0 ? baseGamma : baseGamma - total;
    return { gammaStart, gammaRange: total };
  }

  const target = _safeGamma(gStartRaw);
  const clampedTarget = target >= baseGamma ? target : baseGamma;
  const total = clampedTarget - baseGamma;
  return { gammaStart: baseGamma, gammaRange: total };
}

function gammaForLayerIndex(gammaStart, gammaRange, li, count) {
  if (count <= 1) return _safeGamma(gammaStart);
  const denom = count - 1;
  const t = denom > 0 ? li / denom : 0;
  return _safeGamma(gammaStart + t * gammaRange);
}

function needsSdf(params) {
  const p = params || renderGlobals.paramsState;
  const req = requestedLayersFromParams(p);
  if (req > 1) return false;
  return !!(p.dispMode && p.dispMode !== 0) || !!p.lightingOn;
}

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

function _assertPipelineApi(renderPipeline) {
  if (!renderPipeline) throw new Error("Render pipeline missing");

  const hasSetChunks = typeof renderPipeline.setChunks === "function";
  if (!hasSetChunks) throw new TypeError("renderPipeline.setChunks is not a function");

  const hasRender =
    typeof renderPipeline.render === "function" ||
    typeof renderPipeline.renderFrame === "function" ||
    typeof renderPipeline.draw === "function";

  if (!hasRender && typeof renderPipeline.renderBlitToView !== "function") {
    throw new TypeError("renderPipeline has no render/renderFrame/draw/renderBlitToView");
  }
}

/* ======================================================================
   Main initRender
   ====================================================================== */
export async function initRender() {
  const canvas = document.getElementById("gpu-canvas");
  const device = await initWebGPU();
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();

  function parseAlphaModeToNumeric(mode) {
    if (mode === undefined || mode === null) return Number(renderGlobals.paramsState.alphaMode || 0);

    if (typeof mode === "number" && Number.isFinite(mode)) {
      const n = Math.floor(mode);
      if (n === 0) return 0;
      if (n === 2) return 2;
      return 1;
    }

    if (typeof mode === "string") {
      const t = mode.trim().toLowerCase();
      if (t === "0" || t === "opaque") return 0;
      if (t === "2") return 2;
      if (t === "1" || t === "fade" || t === "premultiplied") return 1;

      const maybe = parseInt(t, 10);
      if (!Number.isNaN(maybe)) {
        if (maybe === 0) return 0;
        if (maybe === 2) return 2;
        return 1;
      }
      return 1;
    }

    return Number(renderGlobals.paramsState.alphaMode || 0);
  }

  function canvasAlphaStringForNumeric(numericMode) {
    return numericMode === 0 ? "opaque" : "premultiplied";
  }

  function slabAlphaBitsFromParams(params) {
    let bits = 0;
    if (params && params.contourOn) bits |= 1;
    if (params && params.contourOnly) bits |= 2;
    if (params && params.contourFront) bits |= 4;
    return bits >>> 0;
  }

  const initialNumeric =
    typeof window !== "undefined" && window.__pendingAlphaMode !== undefined
      ? parseAlphaModeToNumeric(window.__pendingAlphaMode)
      : parseAlphaModeToNumeric(renderGlobals.paramsState.alphaMode);

  renderGlobals.paramsState.alphaMode = initialNumeric;
  let currentAlphaMode = canvasAlphaStringForNumeric(initialNumeric);

  const uniformStride = 256;
  const MAX_PIXELS_PER_CHUNK = 8000000;
  const MIN_SPLIT = 1024;

  let yaw = 0;
  let pitch = 0;
  const cameraPos = [0, 0, 2.4];
  const lookTarget = [0, 0, 0];
  const upDir = [0, 1, 0];
  let fov = (45 * Math.PI) / 180;

  function updateLookTarget() {
    const dx = Math.cos(pitch) * Math.sin(yaw);
    const dy = Math.sin(pitch);
    const dz = -Math.cos(pitch) * Math.cos(yaw);
    lookTarget[0] = cameraPos[0] + dx;
    lookTarget[1] = cameraPos[1] + dy;
    lookTarget[2] = cameraPos[2] + dz;
    renderGlobals.cameraDirty = true;
  }

  const fractalCompute = new FractalTileComputeGPU(device, undefined, undefined, uniformStride);
  const sdfCompute = new SdfComputeGPU(device, uniformStride);

  const renderPipeline = new RenderPipelineGPU(device, context, undefined, undefined, {
    renderUniformStride: 256,
    initialGridDivs: renderGlobals.paramsState.gridDivs,
    quadScale: renderGlobals.paramsState.quadScale,
    canvasAlphaMode: currentAlphaMode,
  });

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

  let chunkInfos = [];
  let sdfReady = false;

  let slabWallsDirty = true;
  let _slabSetChunksSrc = null;
  let _slabSetChunksLayers = 0;

  let resizeTimer = 0;
  let frameHandle = 0;
  let exporting = false;

  let _noSdfCacheSrc = null;
  let _noSdfCache = null;

  function invalidateChunkCaches() {
    _noSdfCacheSrc = null;
    _noSdfCache = null;
  }

  function requestedLayers() {
    return requestedLayersFromParams(renderGlobals.paramsState);
  }

  function availableFractalLayers(chunks = []) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 1;

    let maxLayers = 1;
    for (const c of chunks) {
      const a =
        (Array.isArray(c.fractalLayerViews) && c.fractalLayerViews) ||
        (Array.isArray(c.layerViews) && c.layerViews) ||
        (Array.isArray(c.fractalViews) && c.fractalViews) ||
        null;

      if (a && a.length) maxLayers = Math.max(maxLayers, a.length);
      else if (c.fractalView) maxLayers = Math.max(maxLayers, 1);
    }
    return Math.max(1, maxLayers);
  }

  function clampLayerIndex(li, n) {
    const nn = Math.max(1, n | 0);
    const x = Number.isFinite(+li) ? (+li | 0) : 0;
    if (x < 0) return 0;
    if (x >= nn) return nn - 1;
    return x;
  }

  function normalizeFractalChunkLayers(chunks, count) {
    if (!Array.isArray(chunks) || chunks.length === 0) return;

    const n = Math.max(1, count | 0);

    for (const c of chunks) {
      let views =
        (Array.isArray(c.fractalLayerViews) && c.fractalLayerViews) ||
        (Array.isArray(c.layerViews) && c.layerViews) ||
        (Array.isArray(c.fractalViews) && c.fractalViews) ||
        null;

      if (!views && c.fractalView) views = [c.fractalView];
      if (!Array.isArray(views)) views = views ? [views] : [];

      if (n > 1) {
        const base = views[0] || c.fractalView || null;
        const arr = new Array(n);
        for (let i = 0; i < n; i++) arr[i] = views[i] || base;
        c.fractalLayerViews = arr;
        c.layerViews = arr;
        c.fractalView = c.fractalView || arr[0] || null;
      } else {
        const one = views[0] || c.fractalView || null;
        c.fractalLayerViews = [one].filter((v) => v != null);
        c.layerViews = c.fractalLayerViews;
        c.fractalView = one;
      }
    }
  }

  function effectiveSplitCount(requestedSplit) {
    const req = Math.max(1, Math.floor(requestedSplit || 0));
    const eff = Math.min(req, MAX_PIXELS_PER_CHUNK);
    if (eff !== req) console.debug("splitCount clamped: requested=" + req + ", effective=" + eff);
    return eff;
  }

  function normRenderMode(v) {
    const s = (v == null ? "" : String(v)).trim().toLowerCase();
    if (s === "slab" || s === "1") return "slab";
    if (s === "raw" || s === "blit" || s === "debug" || s === "2") return "raw";
    return "fractal";
  }

  function modeNeedsSdf(mode, params = renderGlobals.paramsState) {
    return mode === "fractal" && needsSdf(params);
  }

  async function ensureSlabChunks(layersToUse) {
    if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) return;
    layersToUse = Math.max(1, layersToUse | 0);

    if (_slabSetChunksSrc === chunkInfos && _slabSetChunksLayers === layersToUse) return;

    await slabPipeline.setChunks(chunkInfos, layersToUse);
    _slabSetChunksSrc = chunkInfos;
    _slabSetChunksLayers = layersToUse;
  }

  function cleanupTempFallbacks(chunks = []) {
    for (const c of chunks) {
      if (c._tmpSdfTex) {
        try {
          c._tmpSdfTex.destroy();
        } catch {}
        delete c._tmpSdfTex;
      }
      if (c._tmpFlagTex) {
        try {
          c._tmpFlagTex.destroy();
        } catch {}
        delete c._tmpFlagTex;
      }
      if (c._usingTmpSdfFallback) delete c._usingTmpSdfFallback;
    }
  }

  function chunksWithoutSdf(chunks = []) {
    if (_noSdfCacheSrc === chunks && _noSdfCache) return _noSdfCache;

    const out = (chunks || []).map((c) => {
      const clone = Object.assign({}, c);

      delete clone.sdfView;
      delete clone.sdfLayerViews;
      delete clone.sdfViews;
      delete clone.sdfTex;
      delete clone.sdfTexture;

      delete clone.flagView;
      delete clone.flagLayerViews;
      delete clone.flagViews;
      delete clone.flagTex;
      delete clone.flagTexture;

      delete clone._tmpSdfTex;
      delete clone._tmpFlagTex;
      delete clone._usingTmpSdfFallback;

      return clone;
    });

    _noSdfCacheSrc = chunks;
    _noSdfCache = out;
    return out;
  }

  function freeSdfData(chunks = []) {
    for (const c of chunks) {
      try {
        if (c.sdfTex) {
          try {
            c.sdfTex.destroy();
          } catch {}
        }
      } catch {}

      try {
        if (c.flagTex) {
          try {
            c.flagTex.destroy();
          } catch {}
        }
      } catch {}

      try {
        if (c._tmpSdfTex) {
          try {
            c._tmpSdfTex.destroy();
          } catch {}
        }
      } catch {}

      try {
        if (c._tmpFlagTex) {
          try {
            c._tmpFlagTex.destroy();
          } catch {}
        }
      } catch {}

      delete c.sdfView;
      delete c.sdfLayerViews;
      delete c.sdfViews;
      delete c.sdfTex;
      delete c.sdfTexture;

      delete c.flagView;
      delete c.flagLayerViews;
      delete c.flagViews;
      delete c.flagTex;
      delete c.flagTexture;

      delete c._tmpSdfTex;
      delete c._tmpFlagTex;
      delete c._usingTmpSdfFallback;
    }

    sdfReady = false;
    invalidateChunkCaches();
  }

  async function computeFractalLayer(layerIndex, aspect = 1) {
    let requested = Math.max(1, Math.floor(renderGlobals.paramsState.splitCount || 0));
    let eff = Math.min(requested, MAX_PIXELS_PER_CHUNK);
    eff = Math.max(eff, MIN_SPLIT);

    while (true) {
      try {
        const params = Object.assign({}, renderGlobals.paramsState, {
          splitCount: eff,
          nLayers: 1,
          layers: 1,
          layerIndex: 0,
        });

        const chunks = await fractalCompute.compute(params, layerIndex, aspect, "main", 1);
        chunkInfos = chunks || [];

        for (const c of chunkInfos) {
          if (!c.fractalView && c.layerViews && c.layerViews[0]) c.fractalView = c.layerViews[0];
          if (!c.layerViews && c.fractalView) c.layerViews = [c.fractalView];
        }

        sdfReady = false;
        slabWallsDirty = true;
        invalidateChunkCaches();

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
                  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                }),
              },
            ];
            chunkInfos[0].fractalView = chunkInfos[0].fractalTex.createView({ dimension: "2d" });
            chunkInfos[0].layerViews = [chunkInfos[0].fractalView];
          }

          sdfReady = false;
          slabWallsDirty = true;
          invalidateChunkCaches();

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

    const base = Object.assign({}, renderGlobals.paramsState, {
      splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
      nLayers: count,
      layers: count,
    });

    const { gammaStart, gammaRange } = resolveGammaSeries(base, count);
    const baseParams = Object.assign({}, base, { gamma: gammaStart });

    let seriesChunks;
    if (typeof fractalCompute.computeLayerSeries === "function") {
      seriesChunks = await fractalCompute.computeLayerSeries(
        baseParams,
        gammaStart,
        gammaRange,
        count,
        aspect,
        "main",
      );
    } else {
      const merged = new Map();

      for (let li = 0; li < count; ++li) {
        const g = gammaForLayerIndex(gammaStart, gammaRange, li, count);
        const paramsLi = g === baseParams.gamma ? baseParams : Object.assign({}, baseParams, { gamma: g });

        const chunks = await fractalCompute.compute(paramsLi, li, aspect, "main", count);

        for (const c of chunks) {
          const key = `${c.offsetX}|${c.offsetY}|${c.width}|${c.height}`;
          let dst = merged.get(key);
          if (!dst) {
            dst = Object.assign({}, c);
            dst.fractalLayerViews = new Array(count);
            merged.set(key, dst);
          }
          const view = c.fractalView || (c.layerViews && c.layerViews[0]) || null;
          dst.fractalLayerViews[li] = view;
        }
      }

      seriesChunks = Array.from(merged.values());
    }

    chunkInfos = (seriesChunks || []).map((c) => Object.assign({}, c));
    normalizeFractalChunkLayers(chunkInfos, count);

    sdfReady = false;
    slabWallsDirty = true;
    invalidateChunkCaches();

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
      const params = Object.assign({}, renderGlobals.paramsState, {
        splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
        nLayers: 1,
        layers: 1,
        layerIndex: 0,
      });

      await sdfCompute.compute(chunkInfos, params, layerIndex, aspect);
      await device.queue.onSubmittedWorkDone();

      sdfReady = true;
      invalidateChunkCaches();

      if (queryCompute._bgCache) queryCompute._bgCache.clear();
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;

      await renderPipeline.setChunks(sdfReady ? chunkInfos : chunksWithoutSdf(chunkInfos), 1, {
        layerIndex: layerIndex >>> 0,
        requireSdf: true,
      });

      return chunkInfos;
    } catch (err) {
      sdfReady = false;
      invalidateChunkCaches();

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
          console.warn("computeSdfLayer: temporary fallback creation failed for chunk:", c, e2);
        }
      }

      try {
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        await renderPipeline.setChunks(chunksWithoutSdf(chunkInfos), 1, {
          layerIndex: layerIndex >>> 0,
          requireSdf: false,
        });
      } catch (ebg) {
        console.warn("computeSdfLayer: renderPipeline.setChunks failed even with fallbacks:", ebg);
      }

      return chunkInfos;
    }
  }

  window.setAlphaMode = function setAlphaMode(mode) {
    const numeric = parseAlphaModeToNumeric(mode);
    renderGlobals.paramsState.alphaMode = numeric;

    const newCanvasMode = canvasAlphaStringForNumeric(numeric);
    if (newCanvasMode !== currentAlphaMode) {
      currentAlphaMode = newCanvasMode;
      window.__currentCanvasAlphaMode = currentAlphaMode;

      slabPipeline.canvasAlphaMode = currentAlphaMode;
      renderPipeline.canvasAlphaMode = currentAlphaMode;

      try {
        context.configure({
          device,
          format,
          alphaMode: currentAlphaMode,
          size: [canvas.width, canvas.height],
        });
      } catch (e) {
        console.warn("setAlphaMode: context.configure failed:", e);
      }

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

    if (forceFractalRecompute) {
      if (req > 1) {
        await computeFractalLayerSeries(req, aspect);
        freeSdfData(chunkInfos);
        sdfReady = false;

        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));

        if (mode === "slab") {
          await ensureSlabChunks(layersToUse);
          slabWallsDirty = true;
        } else {
          renderPipeline.gridDivs = ps.gridDivs;
          await renderPipeline.setChunks(chunksWithoutSdf(chunkInfos), layersToUse, {
            layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
            requireSdf: false,
          });
        }

        return;
      }

      await computeFractalLayer(ps.layerIndex, aspect);

      if (mode === "slab") {
        freeSdfData(chunkInfos);
        sdfReady = false;

        await ensureSlabChunks(1);
        slabWallsDirty = true;
      } else if (modeNeedsSdf(mode, ps)) {
        await computeSdfLayer(ps.layerIndex, aspect);
      } else {
        freeSdfData(chunkInfos);
        sdfReady = false;
      }

      if (mode !== "slab") {
        renderPipeline.gridDivs = ps.gridDivs;
        const requireSdf = modeNeedsSdf(mode, ps) && sdfReady;
        await renderPipeline.setChunks(requireSdf ? chunkInfos : chunksWithoutSdf(chunkInfos), 1, {
          layerIndex: clampLayerIndex(ps.layerIndex, 1),
          requireSdf,
        });
      }

      return;
    }

    if (req > 1) {
      freeSdfData(chunkInfos);
      sdfReady = false;

      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));

      if (mode === "slab") {
        await ensureSlabChunks(layersToUse);
        slabWallsDirty = true;
      } else {
        renderPipeline.gridDivs = ps.gridDivs;
        await renderPipeline.setChunks(chunksWithoutSdf(chunkInfos), layersToUse, {
          layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
          requireSdf: false,
        });
      }

      return;
    }

    if (mode === "slab") {
      freeSdfData(chunkInfos);
      sdfReady = false;

      await ensureSlabChunks(1);
      slabWallsDirty = true;
    } else if (modeNeedsSdf(mode, ps)) {
      await computeSdfLayer(ps.layerIndex, aspect);
    } else {
      freeSdfData(chunkInfos);
      sdfReady = false;
    }

    if (mode !== "slab") {
      renderPipeline.gridDivs = ps.gridDivs;
      const requireSdf = modeNeedsSdf(mode, ps) && sdfReady;
      await renderPipeline.setChunks(requireSdf ? chunkInfos : chunksWithoutSdf(chunkInfos), 1, {
        layerIndex: clampLayerIndex(ps.layerIndex, 1),
        requireSdf,
      });
    }
  }

  async function renderFrame() {
    const ps = renderGlobals.paramsState;
    const req = requestedLayers();
    ps.layerIndex = clampLayerIndex(ps.layerIndex, req);

    const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
    const mode = normRenderMode(ps.renderMode);

    const camState = { cameraPos, lookTarget, upDir, fov };

    if (mode === "slab") {
      const slabBits = slabAlphaBitsFromParams(ps);

      const localParams = Object.assign({}, ps, {
        nLayers: layersToUse,
        layers: layersToUse,
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
        alphaMode: slabBits,
      });

      await ensureSlabChunks(layersToUse);

      await slabPipeline.render(localParams, camState, {
        runCompute: slabWallsDirty,
        layers: layersToUse,
      });

      slabWallsDirty = false;
      await device.queue.onSubmittedWorkDone();
      return;
    }

    const localParams = Object.assign({}, ps, {
      nLayers: layersToUse,
      layers: layersToUse,
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
    });

    const writeRenderUniform = _pickFn(renderPipeline, ["writeRenderUniform", "writeRenderUniforms", "writeUniforms"]);
    if (writeRenderUniform) writeRenderUniform(localParams);

    const writeThreshUniform = _pickFn(renderPipeline, ["writeThreshUniform", "writeThresholdUniform", "writeThresh", "writeThreshold"]);
    if (writeThreshUniform) writeThreshUniform(localParams);

    if (renderGlobals.gridDirty) {
      renderPipeline.gridDivs = ps.gridDivs;
      renderPipeline.gridStripes = null;
      renderGlobals.gridDirty = false;
    }

    const requireSdf = modeNeedsSdf(mode, ps) && sdfReady;
    const chunksToUse = requireSdf ? chunkInfos : chunksWithoutSdf(chunkInfos);
    await renderPipeline.setChunks(chunksToUse, layersToUse, {
      layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
      requireSdf,
    });

    const renderFn = _pickFn(renderPipeline, ["render", "renderFrame", "draw"]);
    const blitFn = _pickFn(renderPipeline, ["renderBlitToView"]);

    if (mode === "raw" && blitFn) {
      const viewTex = context.getCurrentTexture().createView();
      await blitFn(localParams, viewTex);
    } else if (renderFn) {
      await renderFn(localParams, camState);
    } else if (blitFn) {
      const viewTex = context.getCurrentTexture().createView();
      await blitFn(localParams, viewTex);
    }

    await device.queue.onSubmittedWorkDone();
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
      handleResizeImmediate().catch((e) => console.error("debounced resize failed:", e));
    }, 150);
  }

  window.addEventListener("resize", scheduleResizeDebounced);

  const keys = {};
  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === "Escape") document.exitPointerLock();
  }
  function onKeyUp(e) {
    keys[e.code] = false;
  }
  function onMouseMove(e) {
    yaw += e.movementX * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch - e.movementY * 0.002));
    updateLookTarget();
  }

  canvas.addEventListener("click", () => {
    try {
      canvas.requestPointerLock();
    } catch (e) {
      console.warn("requestPointerLock failed:", e);
    }
  });

  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === canvas;
    if (locked) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    }
  });

  async function updateMovement(dt) {
    const ps = renderGlobals.paramsState;
    const speed = 2.0 * dt * ps.quadScale;

    const fx = lookTarget[0] - cameraPos[0];
    const fy = lookTarget[1] - cameraPos[1];
    const fz = lookTarget[2] - cameraPos[2];
    const fl = Math.hypot(fx, fy, fz) || 1;
    const forward = [fx / fl, fy / fl, fz / fl];

    const right = [
      forward[1] * upDir[2] - forward[2] * upDir[1],
      forward[2] * upDir[0] - forward[0] * upDir[2],
      forward[0] * upDir[1] - forward[1] * upDir[0],
    ];
    const rl = Math.hypot(...right) || 1;
    right[0] /= rl;
    right[1] /= rl;
    right[2] /= rl;

    let dx = 0;
    let dy = 0;
    let dz = 0;
    let moved = false;

    if (keys["KeyW"]) {
      dx += forward[0] * speed;
      dy += forward[1] * speed;
      dz += forward[2] * speed;
      moved = true;
    }
    if (keys["KeyS"]) {
      dx -= forward[0] * speed;
      dy -= forward[1] * speed;
      dz -= forward[2] * speed;
      moved = true;
    }
    if (keys["KeyA"]) {
      dx -= right[0] * speed;
      dy -= right[1] * speed;
      dz -= right[2] * speed;
      moved = true;
    }
    if (keys["KeyD"]) {
      dx += right[0] * speed;
      dy += right[1] * speed;
      dz += right[2] * speed;
      moved = true;
    }
    if (keys["Space"]) {
      dz += speed;
      moved = true;
    }
    if (keys["ShiftLeft"] || keys["ShiftRight"]) {
      dz -= speed;
      moved = true;
    }
    if (!moved) return false;

    cameraPos[0] += dx;
    cameraPos[1] += dy;
    cameraPos[2] += dz;

    updateLookTarget();
    return true;
  }

  window.resetViewCamera = () => {
    cameraPos[0] = 0;
    cameraPos[1] = 0;
    cameraPos[2] = 2.4;
    lookTarget[0] = 0;
    lookTarget[1] = 0;
    lookTarget[2] = 0;
    pitch = 0;
    yaw = 0;
    fov = (45 * Math.PI) / 180;
    updateLookTarget();
  };

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
    a.href = url;
    a.download = filename;
    document.body.insertAdjacentHTML("beforeend", "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  function copyWebGPUTo2D(canvasEl) {
    return (async () => {
      await device.queue.onSubmittedWorkDone();
      const w = canvasEl.width;
      const h = canvasEl.height;
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const ctx2d = tmp.getContext("2d");
      if (!ctx2d) throw new Error("2D context unavailable for export");
      ctx2d.drawImage(canvasEl, 0, 0, w, h);
      return canvasToPngBlob(tmp);
    })();
  }

  async function exportFractalCanvas() {
    try {
      const canvasEl = document.getElementById("gpu-canvas");
      if (!canvasEl) return;
      const blob = await copyWebGPUTo2D(canvasEl);
      const tag = randomTag();
      downloadBlob(blob, "fractal-canvas-" + tag + ".png");
    } catch (e) {
      console.error("exportFractalCanvas failed:", e);
    }
  }

  async function exportFractalFullRes() {
    try {
      exporting = true;

      await device.queue.onSubmittedWorkDone();
      flushPending();

      const targetRes = Math.max(64, Math.floor(renderGlobals.paramsState.gridSize || 1024));
      const dpr = window.devicePixelRatio || 1;

      const oldW = canvas.width;
      const oldH = canvas.height;

      const oldCW = oldW / dpr;
      const oldCH = oldH / dpr;

      canvas.width = targetRes;
      canvas.height = targetRes;

      slabPipeline.canvasAlphaMode = currentAlphaMode;
      renderPipeline.canvasAlphaMode = currentAlphaMode;

      slabPipeline.resize(targetRes / dpr, targetRes / dpr);
      renderPipeline.resize(targetRes / dpr, targetRes / dpr);

      const exportAspect = 1.0;
      await updateComputeAndDisplacement(exportAspect);
      await renderFrame();

      const blob = await copyWebGPUTo2D(canvas);

      canvas.width = oldW;
      canvas.height = oldH;

      slabPipeline.resize(oldCW, oldCH);
      renderPipeline.resize(oldCW, oldCH);

      const tag = randomTag();
      downloadBlob(blob, "fractal-" + targetRes + "-" + tag + ".png");
    } catch (e) {
      console.error("exportFractalFullRes failed:", e);
    } finally {
      exporting = false;
      renderGlobals.cameraDirty = true;
    }
  }

  updateLookTarget();

  {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const pw = Math.floor(cw * (window.devicePixelRatio || 1));
    const ph = Math.floor(ch * (window.devicePixelRatio || 1));

    canvas.width = pw;
    canvas.height = ph;

    slabPipeline.canvasAlphaMode = currentAlphaMode;
    renderPipeline.canvasAlphaMode = currentAlphaMode;

    slabPipeline.resize(cw, ch);
    renderPipeline.resize(cw, ch);

    renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
    renderPipeline.gridStripes = null;

    const aspect = pw / ph || 1;

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

    await device.queue.onSubmittedWorkDone();
    flushPending();

    if (exporting) {
      frameHandle = requestAnimationFrame(frame);
      return;
    }

    const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1.0;

    await updateComputeAndDisplacement(aspect);

    if (await updateMovement(dt)) renderGlobals.cameraDirty = true;
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
