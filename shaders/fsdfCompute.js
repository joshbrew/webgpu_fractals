// SdfComputeGPU.js
import sdfWGSL from "./fsdfCompute.wgsl";

/**
 * SdfComputeGPU (single-layer)
 *
 * Allocates per-chunk SDF (rgba16float) and flag (r32uint) textures with **one array layer**.
 * We recompute layer 0 whenever `layerIndex` changes, keeping memory bounded and avoiding
 * massive N-layer allocations. All storage bindings are 2d-array views with arrayLayerCount=1.
 */
export class SdfComputeGPU {
  constructor(device, uniformStride = 256, group0 = null, group1 = null) {
    this.device = device;
    this.uniformStride = uniformStride;

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
   * Always allocates **1 layer** (arrayLayerCount=1).
   */
  ensureSdfForChunks(chunks) {
    if (!Array.isArray(chunks)) {
      throw new Error("ensureSdfForChunks: chunks must be an array");
    }

    for (const c of chunks) {
      if (typeof c.width !== "number" || typeof c.height !== "number") {
        throw new Error(
          "ensureSdfForChunks: each chunk must have numeric width and height"
        );
      }

      const needRecreate =
        !c.sdfTex ||
        !c.sdfTex.size ||
        c.sdfTex.size[0] !== c.width ||
        c.sdfTex.size[1] !== c.height ||
        c.sdfTex.size[2] !== 1;

      if (needRecreate) {
        // dispose old if present
        try {
          if (c.sdfTex) c.sdfTex.destroy();
        } catch (_) {}
        try {
          if (c.flagTex) c.flagTex.destroy();
        } catch (_) {}

        // single-layer array textures
        const sdfTex = this.device.createTexture({
          size: [c.width, c.height, 1],
          format: "rgba16float",
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        const flagTex = this.device.createTexture({
          size: [c.width, c.height, 1],
          format: "r32uint",
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        // layer-0 views (2d-array with arrayLayerCount=1)
        const sdfLayerViews = [
          sdfTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1,
          }),
        ];
        const flagLayerViews = [
          flagTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1,
          }),
        ];

        // convenience full-array views (still 1 layer)
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
        c.sdfLayerViews = sdfLayerViews;
        c.flagLayerViews = flagLayerViews;
        c.sdfView = sdfView;
        c.flagView = flagView;

        c._sdfLayerBgs = new Map(); // cache for bind groups that write layer 0
      } else {
        // make sure views are present
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
        try {
          c.sdfView = c.sdfTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1,
          });
        } catch (_) {}
        try {
          c.flagView = c.flagTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1,
          });
        } catch (_) {}
        if (!c._sdfLayerBgs) c._sdfLayerBgs = new Map();
      }
    }
  }

  /**
   * Resolve a fractal source view for a chunk.
   * We *prefer* layer 0 (since fractal is also single-layer in the real-time path),
   * but fall back gracefully if chunk carries per-layer views.
   */
  _getFractalView(chunk) {
    // prefer explicit layer-0 view
    if (Array.isArray(chunk.layerViews)) {
      if (chunk.layerViews[0]) return chunk.layerViews[0];
      // otherwise try the first available entry
      const first = chunk.layerViews.find(Boolean);
      if (first) return first;
    }
    if (chunk.fractalView) return chunk.fractalView;

    if (chunk.fractalTex) {
      // try a 2d-array single-layer view at base layer 0
      try {
        return chunk.fractalTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1,
        });
      } catch (_) {
        // last resort: plain 2d (older paths)
        return chunk.fractalTex.createView({ dimension: "2d" });
      }
    }

    throw new Error(
      "SdfComputeGPU: chunk has no fractal view/texture to read from"
    );
  }

  /**
   * Pack one dynamic UBO block for a tile. Matches WGSL layout.
   * Note: we still send `layerIndex` for shader logic, but we always write to layer 0.
   */
  _pack(paramsState, chunk, layerIndex, aspect = 1) {
    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let off = 0;

    // 1) gridSize, force layerIndex -> 0 because outputs are single-layer (layer 0)
    dv.setUint32(off, paramsState.gridSize >>> 0, true);
    off += 4;
    dv.setUint32(off, 0, true);
    /* always write to array-layer 0 */ off += 4;

    // 2) tile offset & size
    dv.setUint32(off, chunk.offsetX >>> 0, true);
    off += 4;
    dv.setUint32(off, (chunk.offsetY ?? 0) >>> 0, true);
    off += 4;
    dv.setUint32(off, chunk.width >>> 0, true);
    off += 4;

    // IMPORTANT: shader expects tileHeight == gridSize (global clamp Y)
    dv.setUint32(off, paramsState.gridSize >>> 0, true);
    off += 4;

    // 3) displacement & scale
    dv.setFloat32(off, paramsState.dispAmp ?? 0.15, true);
    off += 4;
    dv.setFloat32(off, paramsState.quadScale ?? 1.0, true);
    off += 4;

    // 4) wall/jump thresholds
    dv.setFloat32(off, paramsState.slopeLimit ?? 0.5, true);
    off += 4;
    dv.setFloat32(off, paramsState.wallJump ?? 0.05, true);
    off += 4;

    // 5) connectivityMode & dispMode
    dv.setUint32(off, (paramsState.connectivityMode ?? 0) >>> 0, true);
    off += 4;
    dv.setUint32(off, (paramsState.dispMode ?? 0) >>> 0, true);
    off += 4;

    // 6) curve parameter
    dv.setFloat32(off, paramsState.dispCurve ?? 0.0, true);
    off += 4;

    // 7) normalMode (0=2-sample,1=4,2=8)
    dv.setUint32(off, (paramsState.normalMode ?? 2) >>> 0, true);
    off += 4;

    // NOTE: no 'aspect' here — shader SDFParams ends with normalMode.
    return buf;
  }

  /**
   * Compute SDFs for chunks into **layer 0**.
   * We recompute per requested `layerIndex`, but outputs are always targeted at array layer 0.
   */
  async compute(
    chunks,
    paramsState,
    layerIndex = 0,
    aspect = 1,
    entryPoint = "main"
  ) {
    if (!chunks || !chunks.length) return chunks;

    // Allocate single-layer outputs
    this.ensureSdfForChunks(chunks);

    // Build a big dynamic UBO with N blocks (one per chunk)
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

    // Per-chunk storage bind groups (cache on the chunk). We always bind layer-0 SDF/flag views.
    const sBgs = new Array(N);
    for (let i = 0; i < N; ++i) {
      const c = chunks[i];
      const cacheKey = 0; // single output layer

      let bg = c._sdfLayerBgs.get(cacheKey);
      if (!bg) {
        const fractalView = this._getFractalView(c);
        const sdfView = c.sdfLayerViews[0];
        const flagView = c.flagLayerViews[0];

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

    // Dispatch compute: one pass, N tiles, dynamic UBO offsets
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

    // Ensure completion so render/query can safely sample created views
    await this.device.queue.onSubmittedWorkDone();

    // (Views already exist; no multi-layer full views needed. Keep convenience views anyway.)
    for (const c of chunks) {
      try {
        if (!c.sdfView)
          c.sdfView = c.sdfTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1,
          });
      } catch (_) {}
      try {
        if (!c.flagView)
          c.flagView = c.flagTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1,
          });
      } catch (_) {}
    }

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
    }
    this._pipeCache.clear();
  }

  clearPipelineCache() {
    this._pipeCache.clear();
  }
}
