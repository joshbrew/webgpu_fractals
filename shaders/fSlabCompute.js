// slabMeshPipelineGPU.js
import * as glmath from "./helpers/gl-math";

import wallsComputeWGSL from "./fSlabWallsCompute.wgsl";
import wallsRenderWGSL from "./fSlabWallsRender.wgsl";
import capsRenderWGSL from "./fSlabCapsRender.wgsl";

/**
 * Slab pipeline: marching-squares walls (compute) + caps (render) per fractal tile chunk.
 *
 * Expected chunk shape:
 *  - width, height, offsetX, offsetY
 *  - fractalTex: GPUTexture (2d-array)
 */
export class SlabMeshPipelineGPU {
  /**
   * @param {GPUDevice} device
   * @param {GPUCanvasContext} context
   * @param {object} [opts]
   * @param {number} [opts.uniformStride=256]
   * @param {number} [opts.maxWallsPerChunk=524288]
   * @param {string} [opts.canvasAlphaMode="premultiplied"]
   */
  constructor(device, context, opts = {}) {
    this.device = device;
    this.context = context;

    this.uniformStride = (opts.uniformStride ?? 256) >>> 0;
    this.maxWallsPerChunk = (opts.maxWallsPerChunk ?? 524288) >>> 0;
    this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";

    this.format = navigator.gpu.getPreferredCanvasFormat();

    this._pipeCache = new Map();
    this._chunks = [];
    this._layers = 1;

    this._lastCanvasSize = [0, 0];
    this.depthTexture = null;

    this._rendering = false;
    this._pendingResize = null;
    this._deferredDestroy = [];

    this._renderUBO = null;
    this._slabRenderUBO = null;

    this._createSharedBuffers();
    this._createLayouts();
    this._createPipelines();

    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
  }

  /* -------------------------------------------------------------- */
  /*  Shared GPU buffers                                            */
  /* -------------------------------------------------------------- */

  _createSharedBuffers() {
    // viewProj (64 bytes) + camPos vec4 (16 bytes) = 80 bytes
    this.cameraBuffer = this.device.createBuffer({
      size: 20 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._slabComputeUBO = null;
  }

  _ensureLayerUniforms(nLayers) {
    const n = Math.max(1, nLayers | 0);
    const bytes = this.uniformStride * n;

    if (!this._renderUBO || this._renderUBO.size < bytes) {
      try {
        if (this._renderUBO) this._renderUBO.destroy();
      } catch (e) {}
      this._renderUBO = this.device.createBuffer({
        size: bytes,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }

    if (!this._slabRenderUBO || this._slabRenderUBO.size < bytes) {
      try {
        if (this._slabRenderUBO) this._slabRenderUBO.destroy();
      } catch (e) {}
      this._slabRenderUBO = this.device.createBuffer({
        size: bytes,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
  }

  /* -------------------------------------------------------------- */
  /*  Layouts                                                       */
  /* -------------------------------------------------------------- */

  _createLayouts() {
    // Compute: group(0) => texture + slab uniform (dynamic) + instances + counter + drawArgs
    this._computeLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "float", viewDimension: "2d-array" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: this.uniformStride,
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    this._computePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this._computeLayout],
    });

    // Walls render: group(0) camera + render(dynamic) + myTex + sampler
    this._wallsBg0Layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: this.uniformStride,
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d-array" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    // Walls render: group(1) model + wallInstances
    this._wallsBg1Layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });

    this._wallsPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this._wallsBg0Layout, this._wallsBg1Layout],
    });

    // Caps render: group(0) camera + render(dynamic) + slab(dynamic) + myTex + sampler
    this._capsBg0Layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: this.uniformStride,
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: this.uniformStride,
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d-array" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    // Caps render: group(1) model
    this._capsBg1Layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });

    this._capsPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this._capsBg0Layout, this._capsBg1Layout],
    });
  }

  /* -------------------------------------------------------------- */
  /*  Pipelines                                                     */
  /* -------------------------------------------------------------- */

  _pipeline(key, creator) {
    let p = this._pipeCache.get(key);
    if (p) return p;
    p = creator();
    this._pipeCache.set(key, p);
    return p;
  }

  _createPipelines() {
    this._wallsComputeModule = this.device.createShaderModule({
      code: wallsComputeWGSL,
    });
    this._wallsRenderModule = this.device.createShaderModule({
      code: wallsRenderWGSL,
    });
    this._capsRenderModule = this.device.createShaderModule({
      code: capsRenderWGSL,
    });

    this._computeBuild = this._pipeline("slab_compute_build", () =>
      this.device.createComputePipeline({
        layout: this._computePipelineLayout,
        compute: { module: this._wallsComputeModule, entryPoint: "build" },
      }),
    );

    this._computeFinalize = this._pipeline("slab_compute_finalize", () =>
      this.device.createComputePipeline({
        layout: this._computePipelineLayout,
        compute: { module: this._wallsComputeModule, entryPoint: "finalize" },
      }),
    );

    this._wallsPipeline = this._pipeline("slab_walls_render", () =>
      this.device.createRenderPipeline({
        layout: this._wallsPipelineLayout,
        vertex: {
          module: this._wallsRenderModule,
          entryPoint: "vs_main",
          buffers: [],
        },
        fragment: {
          module: this._wallsRenderModule,
          entryPoint: "fs_main",
          targets: [{ format: this.format }],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less",
        },
      }),
    );

    this._capsPipelineOpaque = this._pipeline("slab_caps_opaque", () =>
      this.device.createRenderPipeline({
        layout: this._capsPipelineLayout,
        vertex: {
          module: this._capsRenderModule,
          entryPoint: "vs_main",
          buffers: [],
        },
        fragment: {
          module: this._capsRenderModule,
          entryPoint: "fs_main",
          targets: [{ format: this.format }],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less-equal",
        },
      }),
    );

    this._capsPipelineBlend = this._pipeline("slab_caps_blend", () =>
      this.device.createRenderPipeline({
        layout: this._capsPipelineLayout,
        vertex: {
          module: this._capsRenderModule,
          entryPoint: "vs_main",
          buffers: [],
        },
        fragment: {
          module: this._capsRenderModule,
          entryPoint: "fs_main",
          targets: [
            {
              format: this.format,
              blend: {
                color: {
                  srcFactor: "src-alpha",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
              },
              writeMask: GPUColorWrite.ALL,
            },
          ],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: false,
          depthCompare: "less-equal",
        },
      }),
    );
  }

  /* -------------------------------------------------------------- */
  /*  Canvas resize                                                 */
  /* -------------------------------------------------------------- */

  resize(clientWidth, clientHeight) {
    if (this._rendering) {
      this._pendingResize = [clientWidth, clientHeight];
      return;
    }
    this._applyResize(clientWidth, clientHeight);
  }

  _applyResize(clientWidth, clientHeight) {
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.max(1, Math.floor(clientWidth * dpr));
    const ph = Math.max(1, Math.floor(clientHeight * dpr));

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: this.canvasAlphaMode,
      size: [pw, ph],
    });

    if (this.depthTexture) this._deferredDestroy.push(this.depthTexture);
    this.depthTexture = this.device.createTexture({
      size: [pw, ph, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._lastCanvasSize = [pw, ph];
  }

  _flushDeferredDestroy() {
    const list = this._deferredDestroy;
    if (!list.length) return;
    this._deferredDestroy = [];
    for (const tex of list) {
      try {
        tex.destroy();
      } catch (e) {}
    }
  }

  /* -------------------------------------------------------------- */
  /*  Camera                                                        */
  /* -------------------------------------------------------------- */

  updateCamera(cam, aspect) {
    const proj = glmath.perspective(cam.fov, aspect, 0.01, 10000.0);
    const view = glmath.lookAt(cam.cameraPos, cam.lookTarget, cam.upDir);
    const viewProj = glmath.mulMat(proj, view);

    // mat4x4<f32>
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);

    // vec4<f32> camPos at byte offset 64
    const cp = cam.cameraPos || [0, 0, 0];
    this.device.queue.writeBuffer(
      this.cameraBuffer,
      64,
      new Float32Array([cp[0] || 0, cp[1] || 0, cp[2] || 0, 1]),
    );
  }

  /* -------------------------------------------------------------- */
  /*  Chunks                                                        */
  /* -------------------------------------------------------------- */

  _destroyChunkResources(c) {
    try {
      if (c._modelBuf) c._modelBuf.destroy();
    } catch (e) {}
    try {
      if (c._wallInstances) c._wallInstances.destroy();
    } catch (e) {}
    try {
      if (c._wallCount) c._wallCount.destroy();
    } catch (e) {}
    try {
      if (c._wallDrawArgs) c._wallDrawArgs.destroy();
    } catch (e) {}

    delete c._slabTexViewAll;
    delete c._modelBuf;
    delete c._wallInstances;
    delete c._wallCount;
    delete c._wallDrawArgs;

    delete c._bgCompute;
    delete c._bgWalls0;
    delete c._bgWalls1;
    delete c._bgCaps0;
    delete c._bgCaps1;

    delete c._slabMaxWalls;
  }

  _destroyAllChunks() {
    for (const c of this._chunks) this._destroyChunkResources(c);
    this._chunks.length = 0;
  }

  /**
   * @param {Array<object>} chunks
   * @param {number} layers
   */
  async setChunks(chunks = [], layers = 1) {
    this._destroyAllChunks();

    this._chunks = chunks || [];
    this._layers = Math.max(1, layers | 0);

    this._ensureLayerUniforms(this._layers);

    const N = this._chunks.length;

    try {
      if (this._slabComputeUBO) this._slabComputeUBO.destroy();
    } catch (e) {}
    this._slabComputeUBO = this.device.createBuffer({
      size: this.uniformStride * Math.max(1, N),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < this._chunks.length; ++i) {
      const c = this._chunks[i];
      if (!c || !c.fractalTex) continue;

      c._slabTexViewAll = c.fractalTex.createView({
        dimension: "2d-array",
        baseArrayLayer: 0,
        arrayLayerCount: this._layers,
      });

      c._modelBuf = this.device.createBuffer({
        size: 4 * 20,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const step = 1;
      const approxCells =
        Math.max(0, (c.width - 1) / step) * Math.max(0, (c.height - 1) / step);
      const approxSegs = Math.min(
        this.maxWallsPerChunk,
        Math.max(1024, Math.floor(approxCells * 0.6)),
      );
      c._slabMaxWalls = approxSegs >>> 0;

      c._wallInstances = this.device.createBuffer({
        size: c._slabMaxWalls * 32,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      c._wallCount = this.device.createBuffer({
        size: 4,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC,
      });

      c._wallDrawArgs = this.device.createBuffer({
        size: 16,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.INDIRECT |
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC,
      });

      c._bgCompute = this.device.createBindGroup({
        layout: this._computeLayout,
        entries: [
          { binding: 0, resource: c._slabTexViewAll },
          {
            binding: 1,
            resource: {
              buffer: this._slabComputeUBO,
              size: this.uniformStride,
            },
          },
          { binding: 2, resource: { buffer: c._wallInstances } },
          { binding: 3, resource: { buffer: c._wallCount } },
          { binding: 4, resource: { buffer: c._wallDrawArgs } },
        ],
      });

      c._bgWalls0 = this.device.createBindGroup({
        layout: this._wallsBg0Layout,
        entries: [
          { binding: 0, resource: { buffer: this.cameraBuffer } },
          {
            binding: 1,
            resource: { buffer: this._renderUBO, size: this.uniformStride },
          },
          { binding: 2, resource: c._slabTexViewAll },
          { binding: 3, resource: this.sampler },
        ],
      });

      c._bgWalls1 = this.device.createBindGroup({
        layout: this._wallsBg1Layout,
        entries: [
          { binding: 0, resource: { buffer: c._modelBuf } },
          { binding: 1, resource: { buffer: c._wallInstances } },
        ],
      });

      c._bgCaps0 = this.device.createBindGroup({
        layout: this._capsBg0Layout,
        entries: [
          { binding: 0, resource: { buffer: this.cameraBuffer } },
          {
            binding: 1,
            resource: { buffer: this._renderUBO, size: this.uniformStride },
          },
          {
            binding: 2,
            resource: { buffer: this._slabRenderUBO, size: this.uniformStride },
          },
          { binding: 3, resource: c._slabTexViewAll },
          { binding: 4, resource: this.sampler },
        ],
      });

      c._bgCaps1 = this.device.createBindGroup({
        layout: this._capsBg1Layout,
        entries: [{ binding: 0, resource: { buffer: c._modelBuf } }],
      });
    }
  }

  /* -------------------------------------------------------------- */
  /*  Uniform writers                                               */
  /* -------------------------------------------------------------- */

  _writeRenderUniformAt(offsetBytes, paramsState = {}) {
    const defaults = {
      layerIndex: 0,
      scheme: 0,

      dispMode: 0,
      bowlOn: false,

      hueOffset: 0.0,
      dispAmp: 0.15,
      dispCurve: 3.0,
      bowlDepth: 0.25,

      quadScale: 1.0,
      gridSize: 512,

      lightingOn: false,
      dispLimitOn: false,

      lightPos: [0.0, 0.0, 5.0],
      specPower: 32.0,

      slopeLimit: 0.5,
      wallJump: 0.05,

      alphaMode: 0,

      contourOn: false,
      contourOnly: false,
      contourFront: false,

      worldOffset: 0.0,
      worldStart: 0.0,

      thickness: 0.25,
      feather: 0.0,
    };

    const p = Object.assign({}, defaults, paramsState);
    const lp = Array.isArray(p.lightPos) ? p.lightPos : defaults.lightPos;

    let alphaMode = (p.alphaMode ?? 0) >>> 0;
    if (p.contourOn) alphaMode |= 1;
    if (p.contourOnly) alphaMode |= 2;
    if (p.contourFront) alphaMode |= 4;

    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let o = 0;

    dv.setUint32(o, p.layerIndex >>> 0, true);
    o += 4;
    dv.setUint32(o, p.scheme >>> 0, true);
    o += 4;
    dv.setUint32(o, p.dispMode >>> 0, true);
    o += 4;
    dv.setUint32(o, p.bowlOn ? 1 : 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.hueOffset) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispAmp) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispCurve) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.bowlDepth) || 0.0, true);
    o += 4;

    dv.setFloat32(o, Number(p.quadScale) || 1.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.gridSize) || 512.0, true);
    o += 4;
    dv.setUint32(o, p.lightingOn ? 1 : 0, true);
    o += 4;
    dv.setUint32(o, p.dispLimitOn ? 1 : 0, true);
    o += 4;

    dv.setFloat32(o, Number(lp[0] ?? 0.0), true);
    o += 4;
    dv.setFloat32(o, Number(lp[1] ?? 0.0), true);
    o += 4;
    dv.setFloat32(o, Number(lp[2] ?? 0.0), true);
    o += 4;
    dv.setFloat32(o, Number(p.specPower) || 32.0, true);
    o += 4;

    dv.setFloat32(o, Number(p.slopeLimit) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.wallJump) || 0.0, true);
    o += 4;
    dv.setUint32(o, alphaMode >>> 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.worldOffset) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.worldStart) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.thickness) || 0.25, true);
    o += 4;
    dv.setFloat32(o, Number(p.feather) || 0.0, true);
    o += 4;

    this.device.queue.writeBuffer(this._renderUBO, offsetBytes >>> 0, buf);
  }

  _writeSlabRenderUniformAt(offsetBytes, paramsState = {}) {
    const defaults = {
      layerIndex: 0,
      fieldMode: 0,
      useBand: 0,
      meshStep: 1,
      iso: 0.5,
      bandLow: 0.25,
      bandHigh: 0.75,
      capBias: 0.0,
      quadScale: 1.0,
      dispAmp: 0.15,
      dispCurve: 3.0,
      dispMode: 1,
      gradScale: 1.0,
    };

    const p = Object.assign({}, defaults, paramsState);

    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let o = 0;

    dv.setUint32(o, p.layerIndex >>> 0, true);
    o += 4;
    dv.setUint32(o, p.fieldMode >>> 0, true);
    o += 4;
    dv.setUint32(o, p.useBand ? 1 : 0, true);
    o += 4;
    dv.setUint32(o, p.meshStep >>> 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.iso) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.bandLow) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.bandHigh) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.capBias) || 0.0, true);
    o += 4;

    dv.setFloat32(o, Number(p.quadScale) || 1.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispAmp) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispCurve) || 0.0, true);
    o += 4;
    dv.setUint32(o, p.dispMode >>> 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.gradScale) || 0.0, true);
    o += 4;

    this.device.queue.writeBuffer(this._slabRenderUBO, offsetBytes >>> 0, buf);
  }

  _writeSlabComputeUniformAt(
    offsetBytes,
    paramsState,
    layerIndex,
    maxWalls,
    offX,
    offY,
    chunkW,
    chunkH,
  ) {
    const defaults = {
      fieldMode: 0,
      useBand: 0,
      meshStep: 1,
      iso: 0.5,
      bandLow: 0.25,
      bandHigh: 0.75,
      capBias: 0.0,
      quadScale: 1.0,
      dispAmp: 0.15,
      dispCurve: 3.0,
      dispMode: 1,
      gradScale: 1.0,
    };

    const p = Object.assign({}, defaults, paramsState);

    const buf = new ArrayBuffer(this.uniformStride);
    const dv = new DataView(buf);
    let o = 0;

    dv.setUint32(o, layerIndex >>> 0, true);
    o += 4;
    dv.setUint32(o, p.fieldMode >>> 0, true);
    o += 4;
    dv.setUint32(o, p.useBand ? 1 : 0, true);
    o += 4;
    dv.setUint32(o, (p.meshStep ?? 1) >>> 0, true);
    o += 4;

    dv.setUint32(o, (offX ?? 0) >>> 0, true);
    o += 4;
    dv.setUint32(o, (offY ?? 0) >>> 0, true);
    o += 4;
    dv.setUint32(o, (chunkW ?? 0) >>> 0, true);
    o += 4;
    dv.setUint32(o, (chunkH ?? 0) >>> 0, true);
    o += 4;

    dv.setUint32(o, maxWalls >>> 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;
    dv.setUint32(o, 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.iso) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.bandLow) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.bandHigh) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.capBias) || 0.0, true);
    o += 4;

    dv.setFloat32(o, Number(p.quadScale) || 1.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispAmp) || 0.0, true);
    o += 4;
    dv.setFloat32(o, Number(p.dispCurve) || 0.0, true);
    o += 4;
    dv.setUint32(o, p.dispMode >>> 0, true);
    o += 4;

    dv.setFloat32(o, Number(p.gradScale) || 0.0, true);
    o += 4;

    this.device.queue.writeBuffer(this._slabComputeUBO, offsetBytes >>> 0, buf);
  }

  /* -------------------------------------------------------------- */
  /*  Model buffers                                                 */
  /* -------------------------------------------------------------- */

  _updateModels(paramsState) {
    const quadScale = Number(paramsState.quadScale ?? 1.0);

    let atlasW = 0;
    let atlasH = 0;

    if (paramsState.atlasW != null || paramsState.atlasH != null) {
      atlasW = Math.max(0, (paramsState.atlasW ?? 0) | 0);
      atlasH = Math.max(0, (paramsState.atlasH ?? 0) | 0);
    } else {
      for (let i = 0; i < this._chunks.length; ++i) {
        const c = this._chunks[i];
        if (!c) continue;
        const offX = (c.offsetX ?? 0) | 0;
        const offY = (c.offsetY ?? 0) | 0;
        const w = (c.width ?? 0) | 0;
        const h = (c.height ?? 0) | 0;
        atlasW = Math.max(atlasW, offX + w);
        atlasH = Math.max(atlasH, offY + h);
      }
    }

    atlasW = Math.max(2, atlasW | 0);
    atlasH = Math.max(2, atlasH | 0);

    const denomX = Math.max(1, atlasW - 1);
    const denomY = Math.max(1, atlasH - 1);

    const texelWorldX = (2 * quadScale) / denomX;
    const texelWorldY = (2 * quadScale) / denomY;

    for (let i = 0; i < this._chunks.length; ++i) {
      const info = this._chunks[i];
      if (!info || !info._modelBuf) continue;

      const offX = (info.offsetX ?? 0) | 0;
      const offY = (info.offsetY ?? 0) | 0;

      const wPts = Math.max(1, (info.width ?? 0) | 0);
      const hPts = Math.max(1, (info.height ?? 0) | 0);

      const wSpan = Math.max(0, wPts - 1);
      const hSpan = Math.max(0, hPts - 1);

      const w = wSpan * texelWorldX;
      const h = hSpan * texelWorldY;

      const x = -quadScale + offX * texelWorldX;
      const y = -quadScale + offY * texelWorldY;

      const modelMat = new Float32Array([
        w,
        0,
        0,
        0,
        0,
        h,
        0,
        0,
        0,
        0,
        1,
        0,
        x,
        y,
        0,
        1,
      ]);

      const u0 = offX / denomX;
      const v0 = offY / denomY;

      const su = wSpan / denomX;
      const sv = hSpan / denomY;

      const uvOS = new Float32Array([u0, v0, su, sv]);

      this.device.queue.writeBuffer(info._modelBuf, 0, modelMat);
      this.device.queue.writeBuffer(info._modelBuf, 64, uvOS);
    }
  }

  /* -------------------------------------------------------------- */
  /*  Compute walls                                                 */
  /* -------------------------------------------------------------- */

  _prepareWallsForLayer(layerIndex, slabParams) {
    const N = this._chunks.length;
    if (!N || !this._slabComputeUBO) return 1;

    const step = Math.max(1, (slabParams.meshStep ?? 1) | 0);

    for (let i = 0; i < N; ++i) {
      const c = this._chunks[i];
      if (!c || !c._bgCompute) continue;

      const offX = (c.offsetX ?? 0) | 0;
      const offY = (c.offsetY ?? 0) | 0;
      const chunkW = (c.width ?? 0) | 0;
      const chunkH = (c.height ?? 0) | 0;

      this._writeSlabComputeUniformAt(
        i * this.uniformStride,
        slabParams,
        layerIndex >>> 0,
        (c._slabMaxWalls ?? 0) >>> 0,
        offX >>> 0,
        offY >>> 0,
        chunkW >>> 0,
        chunkH >>> 0,
      );

      this.device.queue.writeBuffer(c._wallCount, 0, new Uint32Array([0]));
      this.device.queue.writeBuffer(
        c._wallDrawArgs,
        0,
        new Uint32Array([6, 0, 0, 0]),
      );
    }

    return step;
  }


  _encodeComputeWallsPass(encoder, step) {
    const N = this._chunks.length;
    if (!N) return;

    const pass = encoder.beginComputePass();

    pass.setPipeline(this._computeBuild);

    for (let i = 0; i < N; ++i) {
      const c = this._chunks[i];
      if (!c || !c._bgCompute) continue;

      const w = c.width | 0;
      const h = c.height | 0;

      const cellsX = Math.max(0, Math.floor((w - 1) / step));
      const cellsY = Math.max(0, Math.floor((h - 1) / step));
      if (cellsX <= 0 || cellsY <= 0) continue;

      pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
      pass.dispatchWorkgroups(Math.ceil(cellsX / 8), Math.ceil(cellsY / 8), 1);
    }

    pass.setPipeline(this._computeFinalize);

    for (let i = 0; i < N; ++i) {
      const c = this._chunks[i];
      if (!c || !c._bgCompute) continue;

      pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
      pass.dispatchWorkgroups(1, 1, 1);
    }

    pass.end();
  }

  /**
   * @param {number} layerIndex
   * @param {object} slabParams
   */
  async computeWallsForLayer(layerIndex, slabParams = {}) {
    const N = this._chunks.length;
    if (!N) return;

    const step = this._prepareWallsForLayer(layerIndex, slabParams);

    const encoder = this.device.createCommandEncoder();
    this._encodeComputeWallsPass(encoder, step);
    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async compute(layerIndex, slabParams = {}) {
    await this.computeWallsForLayer(layerIndex, slabParams);
  }

  /* -------------------------------------------------------------- */
  /*  Render                                                        */
  /* -------------------------------------------------------------- */

  /**
   * @param {object} paramsState
   * @param {object} camState
   * @param {object} [opts]
   * @param {boolean} [opts.runCompute=true]
   * @param {number} [opts.layers]
   */
  async render(paramsState, camState, opts = {}) {
    this._rendering = true;
    try {
      if (this._pendingResize) {
        const [cw, ch] = this._pendingResize;
        this._pendingResize = null;
        this._applyResize(cw, ch);
      }

      const cw = this._lastCanvasSize[0] | 0;
      const ch = this._lastCanvasSize[1] | 0;
      const aspect = cw > 0 && ch > 0 ? cw / ch : 1;

      this.updateCamera(camState, aspect);

      const nLayers = Math.max(
        1,
        Math.floor(
          opts.layers ??
            paramsState.nLayers ??
            paramsState.layers ??
            this._layers ??
            1,
        ),
      );

      this._ensureLayerUniforms(nLayers);
      this._updateModels(paramsState);

      const orderedLayers = [];
      for (let l = nLayers - 1; l >= 0; --l) orderedLayers.push(l);

      if (opts.runCompute !== false) {
        for (const layer of orderedLayers) {
          await this.computeWallsForLayer(layer, paramsState);
        }
      }

      for (const layer of orderedLayers) {
        const off = layer * this.uniformStride;
        this._writeRenderUniformAt(
          off,
          Object.assign({}, paramsState, { layerIndex: layer }),
        );
        this._writeSlabRenderUniformAt(
          off,
          Object.assign({}, paramsState, { layerIndex: layer }),
        );
      }

      const viewTex = this.context.getCurrentTexture().createView();
      const depthView = this.depthTexture.createView();

      const encoder = this.device.createCommandEncoder();

      const rpass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: viewTex,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
        depthStencilAttachment: {
          view: depthView,
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1,
        },
      });

      for (const layer of orderedLayers) {
        const off = layer * this.uniformStride;
        const feather = Number(paramsState.feather ?? 0.0);
        const capPipe =
          feather > 0.0 ? this._capsPipelineBlend : this._capsPipelineOpaque;

        rpass.setPipeline(capPipe);

        for (let i = 0; i < this._chunks.length; ++i) {
          const c = this._chunks[i];
          if (!c || !c._bgCaps0) continue;
          rpass.setBindGroup(0, c._bgCaps0, [off, off]);
          rpass.setBindGroup(1, c._bgCaps1);
          rpass.draw(6, 2, 0, 0);
        }

        rpass.setPipeline(this._wallsPipeline);

        for (let i = 0; i < this._chunks.length; ++i) {
          const c = this._chunks[i];
          if (!c || !c._bgWalls0) continue;
          rpass.setBindGroup(0, c._bgWalls0, [off]);
          rpass.setBindGroup(1, c._bgWalls1);
          rpass.drawIndirect(c._wallDrawArgs, 0);
        }
      }

      rpass.end();

      this.device.queue.submit([encoder.finish()]);
      await this.device.queue.onSubmittedWorkDone();

      this._flushDeferredDestroy();
    } finally {
      this._rendering = false;
    }
  }

  /* -------------------------------------------------------------- */
  /*  Cleanup                                                       */
  /* -------------------------------------------------------------- */

  destroy() {
    try {
      if (this.depthTexture) this.depthTexture.destroy();
    } catch (e) {}
    this.depthTexture = null;

    for (const t of this._deferredDestroy) {
      try {
        t.destroy();
      } catch (e) {}
    }
    this._deferredDestroy = [];

    try {
      if (this._slabComputeUBO) this._slabComputeUBO.destroy();
    } catch (e) {}
    this._slabComputeUBO = null;

    try {
      if (this._renderUBO) this._renderUBO.destroy();
    } catch (e) {}
    this._renderUBO = null;

    try {
      if (this._slabRenderUBO) this._slabRenderUBO.destroy();
    } catch (e) {}
    this._slabRenderUBO = null;

    try {
      if (this.cameraBuffer) this.cameraBuffer.destroy();
    } catch (e) {}

    this._destroyAllChunks();
    this._pipeCache.clear();
  }
}

export default SlabMeshPipelineGPU;
