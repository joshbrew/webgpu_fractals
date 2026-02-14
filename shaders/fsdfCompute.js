// SdfComputeGPU.js
import sdfWGSL from "./fsdfCompute.wgsl";

/**
 * SdfComputeGPU (single-layer)
 *
 * Allocates per-chunk SDF (rgba16float) and flag (r32uint) textures with one array layer.
 * We recompute layer 0 whenever `layerIndex` changes, keeping memory bounded and avoiding
 * massive N-layer allocations. All storage bindings are 2d-array views with arrayLayerCount=1.
 */
export class SdfComputeGPU {
  constructor(device, uniformStride = 256, group0 = null, group1 = null) {
    this.device = device;
    this.uniformStride = uniformStride;

    this._allocEpoch = 0;

    // group0: dynamic uniform buffer (one block per chunk, dynamic offset)
    this._group0 =
      group0 ??
      device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: uniformStride,
            },
          },
        ],
      });

    // group1: storage textures
    //  - binding 0: fractal source (read-only storage, rgba8unorm), 2d-array
    //  - binding 1: sdf out (write-only storage, rgba16float), 2d-array
    //  - binding 2: flag out (write-only storage, r32uint), 2d-array
    this._group1 =
      group1 ??
      device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "read-only",
              format: "rgba8unorm",
              viewDimension: "2d-array",
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "rgba16float",
              viewDimension: "2d-array",
            },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "r32uint",
              viewDimension: "2d-array",
            },
          },
        ],
      });

    this._pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this._group0, this._group1],
    });
    this._module = device.createShaderModule({ code: sdfWGSL });
    this._pipeCache = new Map();
  }

  _pipeline(entryPoint = "main") {
    let p = this._pipeCache.get(entryPoint);
    if (!p) {
      p = this.device.createComputePipeline({
        layout: this._pipelineLayout,
        compute: { module: this._module, entryPoint },
      });
      this._pipeCache.set(entryPoint, p);
    }
    return p;
  }

  /**
   * Ensure SDF & Flag textures + layer-0 views exist for every chunk.
   * Always allocates 1 layer (arrayLayerCount=1).
   *
   * Note: GPUTexture has no readable `.size`, so we track allocation dimensions on the chunk.
   */
  ensureSdfForChunks(chunks) {
    if (!Array.isArray(chunks)) {
      throw new Error("ensureSdfForChunks: chunks must be an array");
    }

    for (const c of chunks) {
      const w = c && Number.isFinite(+c.width) ? (c.width | 0) : 0;
      const h = c && Number.isFinite(+c.height) ? (c.height | 0) : 0;
      if (w <= 0 || h <= 0) {
        throw new Error(
          "ensureSdfForChunks: each chunk must have numeric width and height"
        );
      }

      const needRecreate =
        !c.sdfTex ||
        !c.flagTex ||
        (c._sdfW | 0) !== w ||
        (c._sdfH | 0) !== h ||
        (c._sdfLayers | 0) !== 1;

      if (needRecreate) {
        try {
          if (c.sdfTex) c.sdfTex.destroy();
        } catch (_) {}
        try {
          if (c.flagTex) c.flagTex.destroy();
        } catch (_) {}

        const sdfTex = this.device.createTexture({
          size: [w, h, 1],
          format: "rgba16float",
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        const flagTex = this.device.createTexture({
          size: [w, h, 1],
          format: "r32uint",
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        const sdfLayerView0 = sdfTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1,
        });
        const flagLayerView0 = flagTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1,
        });

        const sdfView = sdfTex.createView({
          dimension: "2d-array",
          arrayLayerCount: 1,
        });
        const flagView = flagTex.createView({
          dimension: "2d-array",
          arrayLayerCount: 1,
        });

        c.sdfTex = sdfTex;
        c.flagTex = flagTex;

        c.sdfLayerViews = [sdfLayerView0];
        c.flagLayerViews = [flagLayerView0];

        c.sdfView = sdfView;
        c.flagView = flagView;

        c._sdfW = w;
        c._sdfH = h;
        c._sdfLayers = 1;

        c._sdfLayerBgs = new Map();
        c._sdfFractalView = null;

        this._allocEpoch = (this._allocEpoch + 1) | 0;
      } else {
        if (!Array.isArray(c.sdfLayerViews) || !c.sdfLayerViews[0]) {
          c.sdfLayerViews = [
            c.sdfTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1,
            }),
          ];
        }
        if (!Array.isArray(c.flagLayerViews) || !c.flagLayerViews[0]) {
          c.flagLayerViews = [
            c.flagTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1,
            }),
          ];
        }

        if (!c.sdfView) {
          try {
            c.sdfView = c.sdfTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1,
            });
          } catch (_) {}
        }
        if (!c.flagView) {
          try {
            c.flagView = c.flagTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1,
            });
          } catch (_) {}
        }

        if (!c._sdfLayerBgs) c._sdfLayerBgs = new Map();
      }
    }
  }

  /**
   * Resolve a fractal source view for a chunk.
   * Prefer layer 0; fall back to whatever the chunk carries.
   */
  _getFractalView(chunk) {
    if (Array.isArray(chunk.layerViews)) {
      if (chunk.layerViews[0]) return chunk.layerViews[0];
      const first = chunk.layerViews.find(Boolean);
      if (first) return first;
    }
    if (chunk.fractalView) return chunk.fractalView;

    if (chunk.fractalTex) {
      try {
        return chunk.fractalTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1,
        });
      } catch (_) {
        return chunk.fractalTex.createView({ dimension: "2d" });
      }
    }

    throw new Error("SdfComputeGPU: chunk has no fractal view/texture to read");
  }

  /**
   * Pack one dynamic UBO block for a tile. Matches WGSL layout.
   * We always write to array-layer 0 (single-layer outputs).
   */
  _pack(paramsState, chunk) {
    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let off = 0;

    dv.setUint32(off, paramsState.gridSize >>> 0, true);
    off += 4;

    dv.setUint32(off, 0, true);
    off += 4;

    dv.setUint32(off, chunk.offsetX >>> 0, true);
    off += 4;
    dv.setUint32(off, (chunk.offsetY ?? 0) >>> 0, true);
    off += 4;
    dv.setUint32(off, chunk.width >>> 0, true);
    off += 4;

    dv.setUint32(off, paramsState.gridSize >>> 0, true);
    off += 4;

    dv.setFloat32(off, paramsState.dispAmp ?? 0.15, true);
    off += 4;
    dv.setFloat32(off, paramsState.quadScale ?? 1.0, true);
    off += 4;

    dv.setFloat32(off, paramsState.slopeLimit ?? 0.5, true);
    off += 4;
    dv.setFloat32(off, paramsState.wallJump ?? 0.05, true);
    off += 4;

    dv.setUint32(off, (paramsState.connectivityMode ?? 0) >>> 0, true);
    off += 4;
    dv.setUint32(off, (paramsState.dispMode ?? 0) >>> 0, true);
    off += 4;

    dv.setFloat32(off, paramsState.dispCurve ?? 0.0, true);
    off += 4;

    dv.setUint32(off, (paramsState.normalMode ?? 2) >>> 0, true);
    off += 4;

    return buf;
  }

  /**
   * Compute SDFs for chunks into layer 0.
   */
  async compute(
    chunks,
    paramsState,
    layerIndex = 0,
    aspect = 1,
    entryPoint = "main"
  ) {
    if (!chunks || !chunks.length) return chunks;

    this.ensureSdfForChunks(chunks);

    const N = chunks.length;
    const bigBuf = this.device.createBuffer({
      size: this.uniformStride * N,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < N; ++i) {
      const blk = this._pack(paramsState, chunks[i], layerIndex, aspect);
      this.device.queue.writeBuffer(bigBuf, i * this.uniformStride, blk);
    }

    const uBG = this.device.createBindGroup({
      layout: this._group0,
      entries: [
        { binding: 0, resource: { buffer: bigBuf, size: this.uniformStride } },
      ],
    });

    const sBgs = new Array(N);
    for (let i = 0; i < N; ++i) {
      const c = chunks[i];

      const fractalView = this._getFractalView(c);
      if (c._sdfFractalView !== fractalView) {
        if (c._sdfLayerBgs) c._sdfLayerBgs.clear();
        c._sdfFractalView = fractalView;
      }

      const cacheKey = 0;
      let bg = c._sdfLayerBgs.get(cacheKey);
      if (!bg) {
        const sdfView = c.sdfLayerViews && c.sdfLayerViews[0];
        const flagView = c.flagLayerViews && c.flagLayerViews[0];

        if (!sdfView || !flagView) {
          throw new Error(
            "SdfComputeGPU.compute: missing sdf/flag layer-0 views for chunk " +
              i
          );
        }

        bg = this.device.createBindGroup({
          layout: this._group1,
          entries: [
            { binding: 0, resource: fractalView },
            { binding: 1, resource: sdfView },
            { binding: 2, resource: flagView },
          ],
        });

        c._sdfLayerBgs.set(cacheKey, bg);
      }

      sBgs[i] = bg;
    }

    const pipe = this._pipeline(entryPoint);
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipe);

    for (let i = 0; i < N; ++i) {
      const c = chunks[i];
      pass.setBindGroup(0, uBG, [i * this.uniformStride]);
      pass.setBindGroup(1, sBgs[i]);
      pass.dispatchWorkgroups(
        Math.ceil(c.width / 8),
        Math.ceil(c.height / 8),
        1
      );
    }

    pass.end();
    this.device.queue.submit([enc.finish()]);
    await this.device.queue.onSubmittedWorkDone();

    return chunks;
  }

  destroy(chunks = []) {
    for (const c of chunks) {
      try {
        if (c.sdfTex) c.sdfTex.destroy();
      } catch (_) {}
      try {
        if (c.flagTex) c.flagTex.destroy();
      } catch (_) {}

      if (c._sdfLayerBgs) c._sdfLayerBgs.clear();

      c.sdfLayerViews = null;
      c.flagLayerViews = null;
      c.sdfView = null;
      c.flagView = null;
      c._sdfLayerBgs = null;
      c._sdfFractalView = null;

      c._sdfW = 0;
      c._sdfH = 0;
      c._sdfLayers = 0;
    }

    this._pipeCache.clear();
  }

  clearPipelineCache() {
    this._pipeCache.clear();
  }
}
