// render/state.js

/* ======================================================================
   Shared UI/param state + dirty tracking
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

    // scaleOps is the ordered ops list (duplicates allowed). scaleMode is the legacy bitmask union.
    // Default keeps old behavior: Multiply only.
    scaleOps: [1],
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

    // 0 = default internal hue-wheel gradient
    // 1 = SoundPaletteSystem palette texture
    gradTexMode: 0,

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

  // new ordered list (duplicates allowed)
  scaleOps: F.C,
  // legacy union bitmask (still supported for backward compat)
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

  // gradient source toggle
  gradTexMode: F.R,

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

/* ======================================================================
   Scale-ops normalization
   ====================================================================== */

const MAX_SCALE_OPS = 16;

// opCode -> legacy bit value union (kept so old scaleMode continues to work)
const _SCALE_OP_BITS = [
  1, // 1 Multiply
  2, // 2 Divide
  4, // 3 Sine
  8, // 4 Tangent
  16, // 5 Cosine
  32, // 6 Exp-Zoom
  64, // 7 Log-Shrink
  128, // 8 Aniso Warp
  256, // 9 Rotate
  512, // 10 Radial Twist
  1024, // 11 HyperWarp
  2048, // 12 RadialHyper
  4096, // 13 Swirl
  8192, // 14 Modular
  16384, // 15 AxisSwap
  32768, // 16 MixedWarp
  65536, // 17 Jitter
  131072, // 18 PowerWarp
  262144, // 19 SmoothFade
];

function _isValidScaleOpCode(n) {
  n = n | 0;
  return n >= 1 && n <= _SCALE_OP_BITS.length;
}

function _normScaleOps(raw) {
  if (!raw) return [];

  let a = raw;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    a = s.split(",").map((x) => x.trim());
  }

  if (!Array.isArray(a)) return [];

  const out = [];
  for (let i = 0; i < a.length && out.length < MAX_SCALE_OPS; ++i) {
    const v = a[i];
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) continue;
    const c = n | 0;
    if (_isValidScaleOpCode(c)) out.push(c);
  }
  return out;
}

function _scaleModeMaskFromOps(ops) {
  let m = 0;
  for (let i = 0; i < ops.length; ++i) {
    const c = ops[i] | 0;
    if (_isValidScaleOpCode(c)) m |= _SCALE_OP_BITS[c - 1] | 0;
  }
  return m >>> 0;
}

function _opsFromScaleModeMask(mask) {
  const m = (Number(mask) >>> 0) | 0;
  if (!m) return [];

  const out = [];
  for (
    let code = 1;
    code <= _SCALE_OP_BITS.length && out.length < MAX_SCALE_OPS;
    ++code
  ) {
    const bit = _SCALE_OP_BITS[code - 1] | 0;
    if (m & bit) out.push(code);
  }
  return out;
}

export function normalizeScaleArgsInParams(ps) {
  if (!ps || typeof ps !== "object") return;

  const hasOps = Array.isArray(ps.scaleOps) || typeof ps.scaleOps === "string";
  const hasMask = ps.scaleMode !== undefined && ps.scaleMode !== null;

  if (hasOps) {
    const ops = _normScaleOps(ps.scaleOps);
    ps.scaleOps = ops;
    ps.scaleMode = _scaleModeMaskFromOps(ops);
    return;
  }

  if (hasMask) {
    const ops = _opsFromScaleModeMask(ps.scaleMode);
    ps.scaleOps = ops;
    ps.scaleMode = _scaleModeMaskFromOps(ops);
    return;
  }

  ps.scaleOps = [];
  ps.scaleMode = 0;
}

export function cloneParamsForCompute(baseParams, overrides) {
  const p = Object.assign({}, baseParams || null, overrides || null);

  if (Array.isArray(p.lightPos))
    p.lightPos = [p.lightPos[0] || 0, p.lightPos[1] || 0, p.lightPos[2] || 0];
  normalizeScaleArgsInParams(p);

  if (Array.isArray(p.scaleOps)) p.scaleOps = p.scaleOps.slice(0);

  return p;
}

export function flushPending() {
  if (!hasPending) return;

  const ps = renderGlobals.paramsState;
  const prevLayerMode = !!ps.layerMode;

  Object.assign(ps, pending.paramsState);
  pending.paramsState = {};
  hasPending = false;

  normalizeScaleArgsInParams(ps);

  const nextLayerMode = !!ps.layerMode;

  if (nextLayerMode && !prevLayerMode) {
    ps.dispMode = 0;
    ps.lightingOn = false;

    const rm = (ps.renderMode == null ? "" : String(ps.renderMode))
      .trim()
      .toLowerCase();
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
  const x = Number.isFinite(+g) ? +g : 1.0;
  return x;
}

export function requestedLayersFromParams(params = renderGlobals.paramsState) {
  const p = params;
  if (!p || !p.layerMode) return 1;

  const raw = p.nLayers ?? p.layers ?? 1;
  const n = Math.floor(Number(raw) || 0);
  return Math.max(1, n);
}

export function resolveGammaSeries(params, count) {
  const p = params || {};
  const baseGamma = _safeGamma(Number.isFinite(+p.gamma) ? +p.gamma : 1.0);

  if (count <= 1) return { gammaStart: baseGamma, gammaRange: 0.0 };

  const step = Number.isFinite(+p.layerGammaStep) ? +p.layerGammaStep : 0.0;
  const rangeExplicit = Number.isFinite(+p.layerGammaRange)
    ? +p.layerGammaRange
    : 0.0;
  const gStartRaw = Number.isFinite(+p.layerGammaStart)
    ? +p.layerGammaStart
    : baseGamma;

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

export function gammaForLayerIndex(gammaStart, gammaRange, li, count) {
  if (count <= 1) return _safeGamma(gammaStart);
  const denom = count - 1;
  const t = denom > 0 ? li / denom : 0;
  return _safeGamma(gammaStart + t * gammaRange);
}

export function needsSdf(params = renderGlobals.paramsState) {
  const p = params;
  return !!(p.dispMode && p.dispMode !== 0) || !!p.lightingOn;
}

/* ======================================================================
   Chunk/layer view helpers
   ====================================================================== */

export function availableFractalLayers(chunks = []) {
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

export function clampLayerIndex(li, n) {
  const nn = Math.max(1, n | 0);
  const x = Number.isFinite(+li) ? (+li | 0) : 0;
  if (x < 0) return 0;
  if (x >= nn) return nn - 1;
  return x;
}

export function normalizeFractalChunkLayers(chunks, count) {
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

export function normRenderMode(v) {
  const s = (v == null ? "" : String(v)).trim().toLowerCase();
  if (s === "slab" || s === "1") return "slab";
  if (s === "raw" || s === "blit" || s === "debug" || s === "2") return "raw";
  return "fractal";
}

export function modeNeedsSdf(mode, params = renderGlobals.paramsState) {
  return mode === "fractal" && needsSdf(params);
}