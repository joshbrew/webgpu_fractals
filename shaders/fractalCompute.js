// fractalTileComputeGPU.js
import computeWGSL from './fractalCompute.wgsl';

/**
 * @typedef {Object} FractalParams
 * (fields consumed by the WGSL compute; documented for clarity)
 * @property {number} gridSize
 * @property {number} splitCount
 * @property {number} maxIter
 * @property {number} fractalType
 * @property {number} scaleMode
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
 * @property {GPUTextureView[]} layerViews
 * @property {Map<number, GPUBindGroup>} layerBindGroups
 */

/* ------------------------------------------------------------------ */
/*  Fractal registry & SCALE helpers (copied from your list)         */
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


export const SCALE = {
  Multiply: 1, Divide: 2, Sine: 4, Tangent: 8, Cosine: 16, ExpZoom: 32, LogShrink: 64,
  AnisoWarp: 128, Rotate: 256, RadialTwist: 512, HyperWarp: 1024, RadialHyper: 2048,
  Swirl: 4096, Modular: 8192, AxisSwap: 16384, MixedWarp: 32768, Jitter: 65536,
  PowerWarp: 131072, SmoothFade: 262144
};

export function packScaleMask(mask = 0) {
  if (typeof mask === 'number') return mask >>> 0;
  let bits = 0;
  if (typeof mask === 'string') {
    mask.trim().split(/[|,+\s]+/).forEach(tok => {
      if (!tok) return;
      const val = SCALE[tok] ?? parseInt(tok, 10);
      if (Number.isFinite(val)) bits |= val;
    });
    return bits >>> 0;
  }
  if (Array.isArray(mask)) {
    for (const m of mask) bits |= packScaleMask(m);
    return bits >>> 0;
  }
  if (mask && typeof mask === 'object') {
    for (const k in mask) {
      if (mask[k]) bits |= packScaleMask(k);
    }
  }
  return bits >>> 0;
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
  constructor(device, uniformsLayout = undefined, storageLayout = undefined, uniformStride = 256) {
    this.device = device;
    this.uniformStride = uniformStride >>> 0;

    this._uniformsLayout = uniformsLayout ?? device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: this.uniformStride }
      }]
    });

    this._storageLayout = storageLayout ?? device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: { access: 'write-only', format: 'rgba8unorm', viewDimension: '2d-array' }
      }]
    });

    // internal layout tracking so we only reallocate when necessary
    this._layout = { gridSize: 0, splitCount: 0, layers: 0 };

    /** @type {FractalChunk[]} */
    this.chunks = [];

    // WGSL module + pipeline cache
    this._module = device.createShaderModule({ code: computeWGSL });
    /** @type {Map<string, GPUComputePipeline>} */
    this._pipeCache = new Map();
  }

  _pipeline(entryPoint) {
    const key = entryPoint || 'main';
    let p = this._pipeCache.get(key);
    if (p) return p;
    p = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this._uniformsLayout, this._storageLayout]
      }),
      compute: { module: this._module, entryPoint: key }
    });
    this._pipeCache.set(key, p);
    return p;
  }

  /**
   * Ensure chunk textures exist for (gridSize, splitCount, layers).
   * Textures are allocated as 2D-array where each array layer represents a fractal 'layer'.
   *
   * @param {number} gridSize
   * @param {number} splitCount
   * @param {number} layers
   * @returns {FractalChunk[]}
   */
  _ensureTextures(gridSize, splitCount, layers = 1) {
    // If nothing changed, reuse
    if (this._layout.gridSize === gridSize &&
        this._layout.splitCount === splitCount &&
        this._layout.layers === layers &&
        Array.isArray(this.chunks) && this.chunks.length > 0) {
      return this.chunks;
    }

    // destroy previous textures
    for (const c of this.chunks) {
      try { if (c.fractalTex) c.fractalTex.destroy(); } catch (e) { /* ignore */ }
    }
    this.chunks.length = 0;

    const G = gridSize;
    const tileH = G;
    const tileW = Math.min(G, Math.max(1, Math.floor(splitCount / tileH)));
    const numX = Math.ceil(G / tileW);

    for (let tx = 0; tx < numX; ++tx) {
      const offX = tx * tileW;
      const w = Math.min(tileW, G - offX);
      if (!w) continue;

      // allocate texture with 'layers' array-layers
      const fractalTex = this.device.createTexture({
        size: [w, tileH, layers],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
      });

      // create per-layer single-layer views for easy bindGroup creation
      const layerViews = new Array(layers);
      for (let L = 0; L < layers; ++L) {
        layerViews[L] = fractalTex.createView({
          dimension: '2d-array',
          baseArrayLayer: L,
          arrayLayerCount: 1
        });
      }

      this.chunks.push({
        offsetX: offX,
        offsetY: 0,
        width: w,
        height: tileH,
        fractalTex,
        layerViews,
        layerBindGroups: new Map()
      });
    }

    this._layout = { gridSize, splitCount, layers };
    return this.chunks;
  }

  /**
   * Pack the dynamic uniform block for a tile.
   * Field order must match the WGSL struct.
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

    dv.setUint32(o, params.gridSize, true); o += 4;
    dv.setUint32(o, params.maxIter, true); o += 4;
    dv.setUint32(o, params.fractalType ?? FRACTALS.Mandelbrot, true); o += 4;
    dv.setUint32(o, params.scaleMode ?? 0, true); o += 4;
    dv.setFloat32(o, params.zoom ?? 1.0, true); o += 4;
    dv.setFloat32(o, params.dx ?? 0.0, true); o += 4;
    dv.setFloat32(o, params.dy ?? 0.0, true); o += 4;
    dv.setFloat32(o, params.escapeR ?? 4.0, true); o += 4;
    dv.setFloat32(o, params.gamma ?? 1.0, true); o += 4;
    dv.setUint32(o, layerIdx >>> 0, true); o += 4;

    dv.setFloat32(o, params.epsilon ?? 1e-6, true); o += 4;
    dv.setUint32(o, params.convergenceTest ? 1 : 0, true); o += 4;
    dv.setUint32(o, params.escapeMode ?? 0, true); o += 4;
    dv.setUint32(o, tileInfo.offsetX >>> 0, true); o += 4;
    dv.setUint32(o, tileInfo.offsetY >>> 0, true); o += 4;
    dv.setUint32(o, tileInfo.width >>> 0, true); o += 4;
    dv.setUint32(o, tileInfo.height >>> 0, true); o += 4;
    dv.setFloat32(o, aspect, true); o += 4;

    // leftover bytes stay zero (padding)
    return buf;
  }

  /**
   * Compute a single layer (writes to each chunk's corresponding array-layer).
   *
   * Note: callers can pass `requestedLayers` to ensure textures are allocated
   *       with enough array-layers before the write (useful when generating
   *       series of layers or a layered texture).
   *
   * @param {FractalParams} paramsState
   * @param {number} layerIndex
   * @param {number} [aspect=1]
   * @param {string} [entryPoint='main']
   * @param {number} [requestedLayers=1]
   * @returns {Promise<FractalChunk[]>}
   */
  async compute(paramsState, layerIndex, aspect = 1, entryPoint = 'main', requestedLayers = 1) {
    // Ensure textures exist and have requested number of layers
    const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, Math.max(1, requestedLayers|0));

    const N = chunks.length;
    if (N === 0) return chunks;

    // big UBO with dynamic offsets (one block per chunk)
    const bigUBO = this.device.createBuffer({
      size: this.uniformStride * N,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let i = 0; i < N; ++i) {
      const block = this._pack(paramsState, chunks[i], layerIndex >>> 0, aspect);
      this.device.queue.writeBuffer(bigUBO, i * this.uniformStride, block);
    }

    const uBG = this.device.createBindGroup({
      layout: this._uniformsLayout,
      entries: [{ binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } }]
    });

    const pipeline = this._pipeline(entryPoint);
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipeline);

    for (let i = 0; i < N; ++i) {
      const c = chunks[i];
      const key = layerIndex >>> 0;

      let bg = c.layerBindGroups.get(key);
      if (!bg) {
        const view = c.layerViews[key];
        bg = this.device.createBindGroup({
          layout: this._storageLayout,
          entries: [{ binding: 0, resource: view }]
        });
        c.layerBindGroups.set(key, bg);
      }

      pass.setBindGroup(0, uBG, [i * this.uniformStride]);
      pass.setBindGroup(1, bg);
      pass.dispatchWorkgroups(Math.ceil(c.width / 8), Math.ceil(c.height / 8), 1);
    }

    pass.end();

    try {
      this.device.queue.submit([enc.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    } catch (err) {
      // Surface GPU errors (OOM / device lost) so callers can handle them
      console.error('FractalTileComputeGPU.compute: GPU submit failed', err);
      throw err;
    }

    return chunks;
  }

  /**
   * Compute `count` layers consecutively into the texture array, interpolating
   * gamma across the range [gammaStart .. gammaStart+gammaRange].
   *
   * This convenience method ensures the internal textures have `count` layers.
   *
   * @param {FractalParams} paramsState
   * @param {number} gammaStart
   * @param {number} gammaRange
   * @param {number} count
   * @param {number} [aspect=1]
   * @param {string} [entryPoint='main']
   * @returns {Promise<FractalChunk[]>}
   */
  async computeLayerSeries(paramsState, gammaStart, gammaRange, count, aspect = 1, entryPoint = 'main') {
    const requestedLayers = Math.max(1, count >>> 0);
    this._ensureTextures(paramsState.gridSize, paramsState.splitCount, requestedLayers);

    const originalGamma = paramsState.gamma;
    try {
      for (let i = 0; i < requestedLayers; ++i) {
        const t = (requestedLayers === 1) ? 0 : (i / (requestedLayers - 1));
        paramsState.gamma = gammaStart + t * gammaRange;
        await this.compute(paramsState, i, aspect, entryPoint, requestedLayers);
      }
    } finally {
      paramsState.gamma = originalGamma;
    }

    return this.chunks;
  }

  /** Return chunks array (read-only-ish) */
  getChunks() { return this.chunks; }

  /** Destroy owned GPU resources */
  destroy() {
    for (const c of this.chunks) {
      try { if (c.fractalTex) c.fractalTex.destroy(); } catch (e) { /* ignore */ }
      if (c.layerBindGroups) c.layerBindGroups.clear();
      c.layerViews = null;
    }
    this.chunks.length = 0;
    this._layout = { gridSize: 0, splitCount: 0, layers: 0 };
    this._pipeCache.clear();
  }

  /** Clear pipeline cache (useful when shader module is replaced) */
  clearPipelineCache() {
    this._pipeCache.clear();
  }
}
