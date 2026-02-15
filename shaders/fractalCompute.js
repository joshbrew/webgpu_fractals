// shaders/fractalCompute.js
// fractalTileComputeGPU.js
import computeWGSL from "./fractalCompute.wgsl";

/**
 * @typedef {Object} FractalParams
 * @property {number} gridSize
 * @property {number} splitCount
 * @property {number} maxIter
 * @property {number} fractalType
 * @property {number|string|Array<string|number>|Object<string,boolean>} [scaleOps]   // up to 16 ops, 0 ends
 * @property {number|string|Array<string|number>|Object<string,boolean>} [scaleMode] // alias for scaleOps
 * @property {number} zoom
 * @property {number} dx
 * @property {number} dy
 * @property {number} escapeR
 * @property {number} gamma
 * @property {number} epsilon
 * @property {boolean} convergenceTest
 * @property {number} escapeMode
 */

/**
 * One compute tile/chunk entry.
 * @typedef {Object} FractalChunk
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} width
 * @property {number} height
 * @property {GPUTexture} fractalTex
 * @property {GPUTextureView} storageView
 * @property {GPUTextureView[]} layerViews
 * @property {GPUBindGroup|null} storageBindGroup
 */

/* ------------------------------------------------------------------ */
/*  Fractal registry                                                  */
/* ------------------------------------------------------------------ */

export const FRACTALS = {
  Mandelbrot: 0,
  Tricorn: 1,
  BurningShip: 2,
  PerpendicularMandelbrot: 3,
  Celtic: 4,
  Buffalo: 5,
  Phoenix: 6,
  CubicMultibrot: 7,
  QuarticMultibrot: 8,
  Cosine: 9,
  Sine: 10,
  Heart: 11,
  PerpendicularBuffalo: 12,
  SpiralMandelbrot: 13,
  QuinticMultibrot: 14,
  SexticMultibrot: 15,
  Tangent: 16,
  Exponential: 17,
  SepticMultibrot: 18,
  OcticMultibrot: 19,
  InverseMandelbrot: 20,
  BurningShipDeepZoom: 21,
  CubicBurningShip: 22,
  QuarticBurningShip: 23,
  QuinticBurningShip: 24,
  HexicBurningShip: 25,
  Nova: 26,
  ManOWar: 27,
  StretchedCelticSpiral: 28,
  PolarFlame: 29,
  InverseCubic: 30,
  InverseQuartic: 31,
  InverseQuintic: 32,
  InverseSextic: 33,
  InverseSeptic: 34,
  InverseOctic: 35,
  InverseBurningShip: 36,
  InverseTricorn: 37,
  InverseCeltic: 38,
  InversePhoenix: 39,
  TriNova: 40,
  NovaMandelbrot: 41,
  Nova2: 42,
  Nova2Variant: 43,
  QuarticNova: 44,
  FlowerNova: 45,
  ScatterNova: 46,
  TwistedFlowerNova: 47,
  LobedScatterNova: 48,
  HybridFlScatterNova: 49,
  FractionalNova: 50,
  KaleidoNova: 51,
  CrossNova: 52,
  MirrorNova: 53,
  SpiroNova: 54,
  VibrantNova: 55,
  JuliaNovaHybrid: 56,
  InverseSpiralNova: 57,
  WavefrontNova: 58,
  VortexNova: 59,
  SineRingNova: 60,
  InverseSpiralNova2: 61,
  InverseVortexNova: 62,
  InverseSineRingNova: 63,
  InverseMirrorNova: 64,
  InverseVibrantNova: 65,
  GoldenRatioRational: 66,
  ConvolutionKernel: 67,
  GoldenPushPull: 68,
  SincKernel: 69,
  BizarreGrid: 70,
  Julia: 71,
};

/* ------------------------------------------------------------------ */
/*  Transform ops (ordered list, 0 ends)                              */
/* ------------------------------------------------------------------ */

export const SCALE_OPS = {
  End: 0,
  Multiply: 1,
  Divide: 2,
  Sine: 3,
  Tangent: 4,
  Cosine: 5,
  ExpZoom: 6,
  LogShrink: 7,
  AnisoWarp: 8,
  Rotate: 9,
  RadialTwist: 10,
  HyperWarp: 11,
  RadialHyper: 12,
  Swirl: 13,
  Modular: 14,
  AxisSwap: 15,
  MixedWarp: 16,
  Jitter: 17,
  PowerWarp: 18,
  SmoothFade: 19,
};

export const SCALE = SCALE_OPS;

function _pushOp(out, idxRef, v) {
  let i = idxRef.i | 0;
  if (i >= 16) return idxRef;

  const n = v == null ? 0 : (v >>> 0);
  out[i] = n >>> 0;
  idxRef.i = i + 1;
  return idxRef;
}

function _addOpsFromAny(out, idxRef, ops) {
  if (idxRef.i >= 16) return idxRef;
  if (ops == null || ops === false) return idxRef;

  if (typeof ops === "number") {
    return _pushOp(out, idxRef, ops);
  }

  if (typeof ops === "string") {
    const toks = ops.trim().split(/[|,+\s]+/);
    for (let t = 0; t < toks.length && idxRef.i < 16; ++t) {
      const tok = toks[t];
      if (!tok) continue;
      const val = SCALE_OPS[tok] ?? parseInt(tok, 10);
      if (Number.isFinite(val)) _pushOp(out, idxRef, val);
    }
    return idxRef;
  }

  if (Array.isArray(ops)) {
    for (let k = 0; k < ops.length && idxRef.i < 16; ++k) {
      idxRef = _addOpsFromAny(out, idxRef, ops[k]);
    }
    return idxRef;
  }

  if (typeof ops === "object") {
    const keys = Object.keys(ops);
    for (let k = 0; k < keys.length && idxRef.i < 16; ++k) {
      const key = keys[k];
      if (!ops[key]) continue;
      const val = SCALE_OPS[key] ?? parseInt(key, 10);
      if (Number.isFinite(val)) _pushOp(out, idxRef, val);
    }
  }

  return idxRef;
}

export function packScaleOps(ops = 0) {
  const out = new Uint32Array(16);
  const idxRef = { i: 0 };

  _addOpsFromAny(out, idxRef, ops);

  if (idxRef.i < 16) out[idxRef.i] = 0;
  for (let i = idxRef.i + 1; i < 16; ++i) out[i] = 0;

  return out;
}

/* ------------------------------------------------------------------ */
/*  FractalTileComputeGPU - chunked 2D-array textures                 */
/* ------------------------------------------------------------------ */

export class FractalTileComputeGPU {
  /**
   * @param {GPUDevice} device
   * @param {GPUBindGroupLayout} [uniformsLayout] - dynamic UBO (group 0)
   * @param {GPUBindGroupLayout} [storageLayout] - storage texture (group 1)
   * @param {number} [uniformStride=256]
   */
  constructor(
    device,
    uniformsLayout = undefined,
    storageLayout = undefined,
    uniformStride = 256,
  ) {
    this.device = device;
    this.uniformStride = uniformStride >>> 0;

    this._uniformsLayout =
      uniformsLayout ??
      device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride,
            },
          },
        ],
      });

    this._storageLayout =
      storageLayout ??
      device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "rgba8unorm",
              viewDimension: "2d-array",
            },
          },
        ],
      });

    this._layout = { gridSize: 0, splitCount: 0, layers: 0 };

    /** @type {FractalChunk[]} */
    this.chunks = [];

    this._module = device.createShaderModule({ code: computeWGSL });
    /** @type {Map<string, GPUComputePipeline>} */
    this._pipeCache = new Map();
  }

  _pipeline(entryPoint) {
    const key = entryPoint || "main";
    let p = this._pipeCache.get(key);
    if (p) return p;

    p = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this._uniformsLayout, this._storageLayout],
      }),
      compute: { module: this._module, entryPoint: key },
    });

    this._pipeCache.set(key, p);
    return p;
  }

  /**
   * Ensure chunk textures exist for (gridSize, splitCount, layers).
   * Textures are allocated as 2D-array where each array layer represents one output layer.
   *
   * IMPORTANT: storageView is created with arrayLayerCount=layers so the shader can write
   * any layerIndex. layerViews remain single-layer views for convenience elsewhere.
   *
   * @param {number} gridSize
   * @param {number} splitCount
   * @param {number} layers
   * @returns {FractalChunk[]}
   */
  _ensureTextures(gridSize, splitCount, layers = 1) {
    const L = Math.max(1, layers | 0);

    if (
      this._layout.gridSize === gridSize &&
      this._layout.splitCount === splitCount &&
      this._layout.layers === L &&
      Array.isArray(this.chunks) &&
      this.chunks.length > 0
    ) {
      return this.chunks;
    }

    for (const c of this.chunks) {
      try {
        if (c.fractalTex) c.fractalTex.destroy();
      } catch {}
    }
    this.chunks.length = 0;

    const G = gridSize | 0;
    const tileH = G;
    const tileW = Math.min(G, Math.max(1, Math.floor((splitCount | 0) / tileH)));
    const numX = Math.ceil(G / tileW);

    for (let tx = 0; tx < numX; ++tx) {
      const offX = tx * tileW;
      const w = Math.min(tileW, G - offX);
      if (!w) continue;

      const fractalTex = this.device.createTexture({
        size: [w, tileH, L],
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
      });

      const storageView = fractalTex.createView({
        dimension: "2d-array",
        baseArrayLayer: 0,
        arrayLayerCount: L,
      });

      const layerViews = new Array(L);
      for (let li = 0; li < L; ++li) {
        layerViews[li] = fractalTex.createView({
          dimension: "2d-array",
          baseArrayLayer: li,
          arrayLayerCount: 1,
        });
      }

      this.chunks.push({
        offsetX: offX,
        offsetY: 0,
        width: w,
        height: tileH,
        fractalTex,
        storageView,
        layerViews,
        storageBindGroup: null,
      });
    }

    this._layout = { gridSize, splitCount, layers: L };
    return this.chunks;
  }

  _ensureStorageBindGroup(chunk) {
    let bg = chunk.storageBindGroup;
    if (bg) return bg;

    bg = this.device.createBindGroup({
      layout: this._storageLayout,
      entries: [{ binding: 0, resource: chunk.storageView }],
    });
    chunk.storageBindGroup = bg;
    return bg;
  }

  /**
   * Pack the dynamic uniform block for a tile.
   * Field order must match the WGSL Params struct.
   *
   * @param {FractalParams} params
   * @param {FractalChunk} tileInfo
   * @param {number} layerIdx
   * @param {number} aspect
   * @returns {ArrayBuffer}
   */
  _pack(params, tileInfo, layerIdx, aspect) {
    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let o = 0;

    const gridSize = params.gridSize >>> 0;
    const maxIter = (params.maxIter ?? 0) >>> 0;
    const fractalType = (params.fractalType ?? FRACTALS.Mandelbrot) >>> 0;

    const opsInput =
      params && typeof params === "object" && "scaleOps" in params
        ? params.scaleOps
        : params.scaleMode;

    const scaleOps = packScaleOps(opsInput ?? 0);

    dv.setUint32(o, gridSize, true);
    o += 4;
    dv.setUint32(o, maxIter, true);
    o += 4;
    dv.setUint32(o, fractalType, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;

    for (let i = 0; i < 16; ++i) {
      dv.setUint32(o, scaleOps[i] >>> 0, true);
      o += 4;
    }

    dv.setFloat32(o, +params.zoom || 1.0, true);
    o += 4;
    dv.setFloat32(o, +params.dx || 0.0, true);
    o += 4;
    dv.setFloat32(o, +params.dy || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number.isFinite(+params.escapeR) ? +params.escapeR : 4.0, true);
    o += 4;

    dv.setFloat32(o, Number.isFinite(+params.gamma) ? +params.gamma : 1.0, true);
    o += 4;
    dv.setUint32(o, layerIdx >>> 0, true);
    o += 4;

    dv.setFloat32(o, Number.isFinite(+params.epsilon) ? +params.epsilon : 1e-6, true);
    o += 4;
    dv.setUint32(o, params.convergenceTest ? 1 : 0, true);
    o += 4;
    dv.setUint32(o, (params.escapeMode ?? 0) >>> 0, true);
    o += 4;

    dv.setUint32(o, tileInfo.offsetX >>> 0, true);
    o += 4;
    dv.setUint32(o, tileInfo.offsetY >>> 0, true);
    o += 4;
    dv.setUint32(o, tileInfo.width >>> 0, true);
    o += 4;
    dv.setUint32(o, tileInfo.height >>> 0, true);
    o += 4;

    dv.setFloat32(o, +aspect || 1.0, true);
    o += 4;

    dv.setUint32(o, 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;

    return buf;
  }

  /**
   * Compute a single layer (writes to the array-layer = layerIndex).
   *
   * @param {FractalParams} paramsState
   * @param {number} layerIndex
   * @param {number} [aspect=1]
   * @param {string} [entryPoint='main']
   * @param {number} [requestedLayers=1]
   * @returns {Promise<FractalChunk[]>}
   */
  async compute(
    paramsState,
    layerIndex,
    aspect = 1,
    entryPoint = "main",
    requestedLayers = 1,
  ) {
    const layers = Math.max(1, requestedLayers | 0);
    const L = layerIndex >>> 0;
    if (L >= layers) {
      throw new Error(`compute: layerIndex ${L} out of range for layers=${layers}`);
    }

    const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, layers);
    const N = chunks.length;
    if (N === 0) return chunks;

    const bigUBO = this.device.createBuffer({
      size: this.uniformStride * N,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < N; ++i) {
      const block = this._pack(paramsState, chunks[i], L, aspect);
      this.device.queue.writeBuffer(bigUBO, i * this.uniformStride, block);
    }

    const uBG = this.device.createBindGroup({
      layout: this._uniformsLayout,
      entries: [
        { binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } },
      ],
    });

    const pipeline = this._pipeline(entryPoint);
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipeline);

    for (let i = 0; i < N; ++i) {
      const c = chunks[i];
      const sBG = this._ensureStorageBindGroup(c);

      pass.setBindGroup(0, uBG, [i * this.uniformStride]);
      pass.setBindGroup(1, sBG);
      pass.dispatchWorkgroups(
        Math.ceil(c.width / 8),
        Math.ceil(c.height / 8),
        1,
      );
    }

    pass.end();

    try {
      this.device.queue.submit([enc.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    } finally {
      try {
        bigUBO.destroy();
      } catch {}
    }

    return chunks;
  }

  /**
   * Compute N layers from explicit per-layer parameter overrides.
   *
   * Each entry in layerParamsList is merged onto paramsState:
   *   finalParams = { ...paramsState, ...layerParamsList[L] }
   * and written into array-layer L.
   *
   * @param {FractalParams} paramsState
   * @param {Array<Partial<FractalParams>>} layerParamsList
   * @param {number} [aspect=1]
   * @param {string} [entryPoint='main']
   * @returns {Promise<FractalChunk[]>}
   */
  async computeLayers(paramsState, layerParamsList, aspect = 1, entryPoint = "main") {
    const layers = Math.max(1, (layerParamsList?.length ?? 0) | 0);
    const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, layers);
    const N = chunks.length;
    if (N === 0) return chunks;

    const pipeline = this._pipeline(entryPoint);

    const totalBlocks = N * layers;
    const bigUBO = this.device.createBuffer({
      size: this.uniformStride * totalBlocks,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    let blockIdx = 0;
    for (let L = 0; L < layers; ++L) {
      const ov = layerParamsList[L] || {};
      const packParams = { ...paramsState, ...ov };

      for (let i = 0; i < N; ++i) {
        const block = this._pack(packParams, chunks[i], L, aspect);
        this.device.queue.writeBuffer(
          bigUBO,
          blockIdx * this.uniformStride,
          block,
        );
        blockIdx++;
      }
    }

    const uBG = this.device.createBindGroup({
      layout: this._uniformsLayout,
      entries: [
        { binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } },
      ],
    });

    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipeline);

    for (let L = 0; L < layers; ++L) {
      for (let i = 0; i < N; ++i) {
        const c = chunks[i];
        const sBG = this._ensureStorageBindGroup(c);

        const dyn = (L * N + i) * this.uniformStride;
        pass.setBindGroup(0, uBG, [dyn]);
        pass.setBindGroup(1, sBG);
        pass.dispatchWorkgroups(
          Math.ceil(c.width / 8),
          Math.ceil(c.height / 8),
          1,
        );
      }
    }

    pass.end();

    try {
      this.device.queue.submit([enc.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    } finally {
      try {
        bigUBO.destroy();
      } catch {}
    }

    return chunks;
  }

  /**
   * Convenience: generate a layer series, with optional per-layer overrides.
   *
   * gamma is interpolated across [gammaStart .. gammaStart + gammaRange] unless
   * the override for a layer provides its own gamma.
   *
   * layerOverrides can be:
   * - Array<Partial<FractalParams>> of length count
   * - function (layerIndex, t01, layers) => Partial<FractalParams>
   *
   * @param {FractalParams} paramsState
   * @param {number} gammaStart
   * @param {number} gammaRange
   * @param {number} count
   * @param {number} [aspect=1]
   * @param {string} [entryPoint='main']
   * @param {Array<Partial<FractalParams>>|((layerIndex:number,t01:number,layers:number)=>Partial<FractalParams>)} [layerOverrides]
   * @returns {Promise<FractalChunk[]>}
   */
  async computeLayerSeries(
    paramsState,
    gammaStart,
    gammaRange,
    count,
    aspect = 1,
    entryPoint = "main",
    layerOverrides = undefined,
  ) {
    const layers = Math.max(1, count >>> 0);

    /** @type {Array<Partial<FractalParams>>} */
    const list = new Array(layers);

    for (let L = 0; L < layers; ++L) {
      const t = layers === 1 ? 0 : L / (layers - 1);
      const gamma = gammaStart + t * gammaRange;

      let ov = null;
      if (typeof layerOverrides === "function") {
        ov = layerOverrides(L, t, layers);
      } else if (Array.isArray(layerOverrides)) {
        ov = layerOverrides[L] || null;
      }

      if (ov && typeof ov === "object") {
        list[L] = ("gamma" in ov) ? ov : { ...ov, gamma };
      } else {
        list[L] = { gamma };
      }
    }

    return this.computeLayers(paramsState, list, aspect, entryPoint);
  }

  getChunks() {
    return this.chunks;
  }

  destroy() {
    for (const c of this.chunks) {
      try {
        if (c.fractalTex) c.fractalTex.destroy();
      } catch {}
      c.storageBindGroup = null;
      c.storageView = null;
      c.layerViews = null;
    }
    this.chunks.length = 0;
    this._layout = { gridSize: 0, splitCount: 0, layers: 0 };
    this._pipeCache.clear();
  }

  clearPipelineCache() {
    this._pipeCache.clear();
  }
}
