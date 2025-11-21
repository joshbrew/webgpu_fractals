// RenderPipelineGPU.js
import * as glmath from "./helpers/gl-math";
import { buildPlaneGridChunks } from "../workers/buildPlaneGrid";
import frag from "./fractalFragment.wgsl";
import vert from "./fractalVertex.wgsl";
import fBlit from "./fBlitFragment.wgsl";
import vBlit from "./fBlitVertex.wgsl";

export class RenderPipelineGPU {
  /**
   * opts:
   *  - renderUniformStride (default 256)
   *  - initialGridDivs (default 256)
   *  - quadScale (default 1.0)
   *  - canvasAlphaMode (default "premultiplied") -> used by resize()
   */
  constructor(device, context, vsCode = vert, fsCode = frag, opts = {}) {
    this.device = device;
    this.context = context;
    this.vsCode = vsCode;
    this.fsCode = fsCode;

    this.renderUniformStride = opts.renderUniformStride ?? 256;
    this.gridDivs = opts.initialGridDivs ?? 256;
    this.quadScale = opts.quadScale ?? 1.0;
    this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";

    this.format = navigator.gpu.getPreferredCanvasFormat();

    this._createSharedLayouts();
    this._createRenderPipelines();
    this._createBlitPipelines();

    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    this.renderUniformBuffer = device.createBuffer({
      size: this.renderUniformStride,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.threshBuf = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.cameraBuffer = device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.gridStripes = null;
    this.chunks = [];
    this.modelBuffers = [];
    this.depthTexture = null;

    this._createFallbackTextures();

    this._lastCanvasSize = [0, 0];
  }

  _createFallbackTextures() {
    try {
      this._fallbackSdfTex = this.device.createTexture({
        size: [1, 1, 1],
        format: "rgba16float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this._fallbackSdfView = this._fallbackSdfTex.createView({
        dimension: "2d-array",
        baseArrayLayer: 0,
        arrayLayerCount: 1,
      });
    } catch (e) {
      this._fallbackSdfTex = null;
      this._fallbackSdfView = null;
      console.warn("Could not create fallback SDF texture:", e);
    }

    try {
      this._fallbackFlagTex = this.device.createTexture({
        size: [1, 1, 1],
        format: "r32uint",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this._fallbackFlagView = this._fallbackFlagTex.createView({
        dimension: "2d-array",
        baseArrayLayer: 0,
        arrayLayerCount: 1,
      });
    } catch (e) {
      this._fallbackFlagTex = null;
      this._fallbackFlagView = null;
      console.warn("Could not create fallback Flag texture:", e);
    }
  }

  _createSharedLayouts() {
    this._bgLayout0 = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d-array" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });

    this._bgLayout1 = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d-array" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: { sampleType: "uint", viewDimension: "2d-array" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    this._pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this._bgLayout0, this._bgLayout1],
    });
  }

  _createRenderPipelines() {
    const vsModule = this.device.createShaderModule({ code: this.vsCode });
    const fsModule = this.device.createShaderModule({ code: this.fsCode });

    this.renderPipelineDepth = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: {
        module: vsModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: fsModule,
        entryPoint: "fs_prepass",
        targets: [{ format: this.format, writeMask: 0 }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    this.renderPipelineOpaque = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: {
        module: vsModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: fsModule,
        entryPoint: "fs_main",
        targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    this.renderPipelineTransparent = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: {
        module: vsModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: fsModule,
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
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "less-equal",
      },
    });
  }

  _createBlitPipelines() {
    const vsBlitModule = this.device.createShaderModule({ code: vBlit });
    const fsBlitModule = this.device.createShaderModule({ code: fBlit });

    this.renderPipelineBlitOpaque = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: {
        module: vsBlitModule,
        entryPoint: "vs_blit",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: fsBlitModule,
        entryPoint: "fs_blit",
        targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: undefined,
    });
  }

  resize(clientWidth, clientHeight) {
    const pw = Math.floor(clientWidth * (window.devicePixelRatio || 1));
    const ph = Math.floor(clientHeight * (window.devicePixelRatio || 1));

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: this.canvasAlphaMode,
      size: [pw, ph],
    });

    try {
      if (this.depthTexture) this.depthTexture.destroy();
    } catch (e) {}
    this.depthTexture = this.device.createTexture({
      size: [pw, ph, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._lastCanvasSize = [pw, ph];
    this.gridStripes = null;
  }

  _makeArrayLayerViews(tex, maxLayers) {
    if (!tex) return null;
    const views = [];
    for (let L = 0; L < maxLayers; ++L) {
      try {
        const v = tex.createView({
          dimension: "2d-array",
          baseArrayLayer: L,
          arrayLayerCount: 1,
        });
        views.push(v);
      } catch (e) {
        if (L === 0) {
          try {
            const v2 = tex.createView({ dimension: "2d" });
            views.push(v2);
            break;
          } catch (e2) {
            console.warn(
              "_makeArrayLayerViews: texture.createView failed for 2d fallback:",
              e2
            );
            return null;
          }
        } else {
          break;
        }
      }
    }
    return views.length > 0 ? views : null;
  }

  _normalizeChunkViews(info, layers) {
    info.fractalLayerViews = info.fractalLayerViews || [];

    if (
      (!info.fractalLayerViews || info.fractalLayerViews.length === 0) &&
      Array.isArray(info.layerViews) &&
      info.layerViews.length > 0
    ) {
      info.fractalLayerViews = info.layerViews.slice();
    }

    if (
      (!info.fractalLayerViews || info.fractalLayerViews.length < layers) &&
      info.fractalTex
    ) {
      try {
        const made = this._makeArrayLayerViews(info.fractalTex, layers);
        if (made && made.length > 0) {
          info.fractalLayerViews = made;
          info.fractalView = info.fractalLayerViews[0];
        }
      } catch (e) {
        console.warn(
          "normalizeChunkViews: fractalTex -> per-layer createView failed:",
          e,
          info
        );
      }
    }

    if (
      (!info.fractalLayerViews || info.fractalLayerViews.length === 0) &&
      info.fractalView
    ) {
      info.fractalLayerViews = [info.fractalView];
    }

    info.sdfLayerViews = info.sdfLayerViews || [];
    if (
      (!info.sdfLayerViews || info.sdfLayerViews.length === 0) &&
      info.sdfView
    ) {
      info.sdfLayerViews = [info.sdfView];
    }
    if (
      (!info.sdfLayerViews || info.sdfLayerViews.length < layers) &&
      info.sdfTex
    ) {
      try {
        const made = this._makeArrayLayerViews(info.sdfTex, layers);
        if (made && made.length > 0) {
          info.sdfLayerViews = made;
          info.sdfView = info.sdfLayerViews[0];
        }
      } catch (e) {
        console.warn(
          "normalizeChunkViews: sdfTex -> per-layer createView failed:",
          e,
          info
        );
      }
    }

    info.flagLayerViews = info.flagLayerViews || [];
    if (
      (!info.flagLayerViews || info.flagLayerViews.length === 0) &&
      info.flagView
    ) {
      info.flagLayerViews = [info.flagView];
    }
    if (
      (!info.flagLayerViews || info.flagLayerViews.length < layers) &&
      info.flagTex
    ) {
      try {
        const made = this._makeArrayLayerViews(info.flagTex, layers);
        if (made && made.length > 0) {
          info.flagLayerViews = made;
          info.flagView = info.flagLayerViews[0];
        }
      } catch (e) {
        console.warn(
          "normalizeChunkViews: flagTex -> per-layer createView failed:",
          e,
          info
        );
      }
    }
  }

  _getLayerView(info, candidateNames, layerIndex = 0, opts = {}) {
    const preferArrayView = !!opts.preferArrayView;
    for (const name of candidateNames) {
      const v = info[name];
      if (v == null) continue;

      if (Array.isArray(v)) {
        if (v[layerIndex]) {
          const x = v[layerIndex];
          if (x && typeof x.createView === "function") {
            try {
              return x.createView({
                dimension: "2d-array",
                baseArrayLayer: layerIndex,
                arrayLayerCount: 1,
              });
            } catch (e) {
              try {
                return x.createView({ dimension: "2d" });
              } catch (e2) {}
            }
          } else {
            return x;
          }
        }

        if (v.length > 0 && v[0]) {
          const first = v[0];
          if (first && typeof first.createView !== "function") return first;
          if (first && typeof first.createView === "function") {
            try {
              if (preferArrayView) {
                try {
                  return first.createView({ dimension: "2d-array" });
                } catch (e3) {}
              }
              return first.createView({
                dimension: "2d-array",
                baseArrayLayer: layerIndex,
                arrayLayerCount: 1,
              });
            } catch (e) {
              try {
                return first.createView({ dimension: "2d" });
              } catch (e2) {}
            }
          }
        }
        continue;
      }

      if (typeof v.createView !== "function") {
        return v;
      }

      if (preferArrayView) {
        try {
          return v.createView({ dimension: "2d-array" });
        } catch (e) {}
      }

      try {
        return v.createView({
          dimension: "2d-array",
          baseArrayLayer: layerIndex,
          arrayLayerCount: 1,
        });
      } catch (e) {
        try {
          return v.createView({ dimension: "2d" });
        } catch (e2) {}
      }
    }

    return null;
  }

  async setChunks(chunks = [], layers = 1, opts = {}) {
    const { layerIndex = 0, requireSdf = false } = opts;

    for (const c of this.chunks) {
      if (c._renderBg1PerLayer) {
        c._renderBg1PerLayer.clear();
        c._renderBg1PerLayer = null;
      }
      if (c._renderBg0PerLayer) {
        c._renderBg0PerLayer.clear();
        c._renderBg0PerLayer = null;
      }
      delete c._renderBg0;
      delete c._renderBg1;
      delete c._modelBufIdx;
    }

    this.chunks = chunks || [];

    for (const b of this.modelBuffers) {
      try {
        b.destroy();
      } catch (e) {}
    }

    this.modelBuffers = this.chunks.map(() =>
      this.device.createBuffer({
        size: 4 * 20,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
    );

    const fractalNames = [
      "fractalView",
      "fractalViews",
      "fractalLayerViews",
      "fractalTex",
      "fractalTexture",
      "fractalTextureView",
      "fractal",
    ];
    const sdfNames = [
      "sdfView",
      "sdfLayerViews",
      "sdfViews",
      "sdfTex",
      "sdfTexture",
      "sdf",
    ];
    const flagNames = [
      "flagView",
      "flagLayerViews",
      "flagViews",
      "flagTex",
      "flagTexture",
      "flag",
    ];

    const bgLayout0 = this._bgLayout0;
    const bgLayout1 = this._bgLayout1;

    const layersCount = Math.max(1, Math.floor(layers || 1));

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];

      info._renderBg0PerLayer = null;
      info._renderBg0 = null;

      const desiredLayerIndex = layerIndex >>> 0;

      try {
        this._normalizeChunkViews(info, layersCount);
      } catch (e) {
        console.warn("setChunks: _normalizeChunkViews failed for chunk", i, e);
      }

      const hasPerLayerColor =
        (Array.isArray(info.fractalLayerViews) &&
          info.fractalLayerViews.length > 1) ||
        (Array.isArray(info.layerViews) && info.layerViews.length > 1);

      if (layersCount > 1 && hasPerLayerColor) {
        info._renderBg0PerLayer = new Map();
        let anyFail = false;
        for (let L = 0; L < layersCount; ++L) {
          const fractalViewForL =
            this._getLayerView(info, fractalNames, L, {
              preferArrayView: true,
            }) ||
            this._getLayerView(info, fractalNames, 0, {
              preferArrayView: true,
            });

          if (!fractalViewForL) continue;

          try {
            const perBg0 = this.device.createBindGroup({
              layout: bgLayout0,
              entries: [
                { binding: 0, resource: fractalViewForL },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.renderUniformBuffer } },
                { binding: 3, resource: { buffer: this.cameraBuffer } },
                { binding: 4, resource: { buffer: this.threshBuf } },
              ],
            });
            info._renderBg0PerLayer.set(L, perBg0);
          } catch (e) {
            console.warn(
              "setChunks: per-layer bg0 creation failed for chunk",
              i,
              "layer",
              L,
              e
            );
            info._renderBg0PerLayer.clear();
            info._renderBg0PerLayer = null;
            anyFail = true;
            break;
          }
        }
        if (anyFail) {
          info._renderBg0PerLayer = null;
        }
      }

      if (!info._renderBg0PerLayer) {
        const fractalView = this._getLayerView(
          info,
          fractalNames,
          desiredLayerIndex,
          { preferArrayView: true }
        );
        if (!fractalView) {
          const keys = Object.keys(info);
          const msg = `RenderPipelineGPU.setChunks: chunk[${i}] missing fractal view (tried: ${fractalNames.join(
            ", "
          )}). chunk keys: ${keys.join(",")}`;
          console.error(msg, info);
          throw new Error(msg);
        }
        try {
          const bg0 = this.device.createBindGroup({
            layout: bgLayout0,
            entries: [
              { binding: 0, resource: fractalView },
              { binding: 1, resource: this.sampler },
              { binding: 2, resource: { buffer: this.renderUniformBuffer } },
              { binding: 3, resource: { buffer: this.cameraBuffer } },
              { binding: 4, resource: { buffer: this.threshBuf } },
            ],
          });
          info._renderBg0 = bg0;
        } catch (e) {
          console.error(
            "setChunks: createBindGroup(bg0) failed for chunk",
            i,
            e
          );
          throw e;
        }
      }

      let sdfView0 = this._getLayerView(info, sdfNames, desiredLayerIndex);
      let flagView0 = this._getLayerView(info, flagNames, desiredLayerIndex);

      if (requireSdf && (!sdfView0 || !flagView0)) {
        throw new Error(
          `RenderPipelineGPU.setChunks: chunk[${i}] missing SDF or flag view and requireSdf=true.`
        );
      }

      if (!sdfView0) {
        sdfView0 = this._fallbackSdfView;
        info._usingFallbackSdf = Boolean(sdfView0);
      } else {
        info._usingFallbackSdf = false;
      }

      if (!flagView0) {
        flagView0 = this._fallbackFlagView;
        info._usingFallbackFlag = Boolean(flagView0);
      } else {
        info._usingFallbackFlag = false;
      }

      try {
        const bg1 = this.device.createBindGroup({
          layout: bgLayout1,
          entries: [
            { binding: 0, resource: { buffer: this.modelBuffers[i] } },
            { binding: 1, resource: sdfView0 },
            { binding: 2, resource: flagView0 },
            { binding: 3, resource: this.sampler },
          ],
        });
        info._renderBg1 = bg1;
      } catch (e) {
        console.error("setChunks: createBindGroup(bg1) failed for chunk", i, e);
        info._renderBg1 = null;
      }

      info._modelBufIdx = i;
      info._renderBg1PerLayer = new Map();
    }
  }

  updateCamera(cam, aspect) {
    const proj = glmath.perspective(cam.fov, aspect, 0.01, 10000.0);
    const view = glmath.lookAt(cam.cameraPos, cam.lookTarget, cam.upDir);
    const viewProj = glmath.mulMat(proj, view);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
  }

  writeRenderUniform(paramsState = {}) {
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
      worldOffset: 0.0,
      worldStart: 0.0,
    };

    const p = Object.assign({}, defaults, paramsState);
    const lp = Array.isArray(p.lightPos) ? p.lightPos : defaults.lightPos;

    const buf = new ArrayBuffer(96);
    const dv = new DataView(buf);
    let off = 0;

    dv.setUint32(off, p.layerIndex >>> 0, true);
    off += 4;
    dv.setUint32(off, p.scheme >>> 0, true);
    off += 4;
    dv.setUint32(off, p.dispMode >>> 0, true);
    off += 4;
    dv.setUint32(off, p.bowlOn ? 1 : 0, true);
    off += 4;

    dv.setFloat32(off, p.hueOffset, true);
    off += 4;
    dv.setFloat32(off, p.dispAmp, true);
    off += 4;
    dv.setFloat32(off, p.dispCurve, true);
    off += 4;
    dv.setFloat32(off, p.bowlDepth, true);
    off += 4;

    dv.setFloat32(off, p.quadScale, true);
    off += 4;
    dv.setFloat32(off, p.gridSize, true);
    off += 4;
    dv.setUint32(off, p.lightingOn ? 1 : 0, true);
    off += 4;
    dv.setUint32(off, p.dispLimitOn ? 1 : 0, true);
    off += 4;

    dv.setFloat32(off, lp[0] ?? 0.0, true);
    off += 4;
    dv.setFloat32(off, lp[1] ?? 0.0, true);
    off += 4;
    dv.setFloat32(off, lp[2] ?? 0.0, true);
    off += 4;
    dv.setFloat32(off, p.specPower, true);
    off += 4;

    dv.setFloat32(off, p.slopeLimit, true);
    off += 4;
    dv.setFloat32(off, p.wallJump, true);
    off += 4;
    dv.setUint32(off, p.alphaMode >>> 0, true);
    off += 4;

    dv.setFloat32(off, p.worldOffset, true);
    off += 4;
    dv.setFloat32(off, p.worldStart, true);
    off += 4;

    dv.setUint32(off, 0, true);
    off += 4;
    dv.setUint32(off, 0, true);
    off += 4;
    dv.setUint32(off, 0, true);
    off += 4;

    this.device.queue.writeBuffer(this.renderUniformBuffer, 0, buf);
  }

  writeThreshUniform(paramsState = {}) {
    const defaults = { lowT: 0.0, highT: 1.0, basis: 0.0 };
    const p = Object.assign({}, defaults, paramsState);
    this.device.queue.writeBuffer(
      this.threshBuf,
      0,
      new Float32Array([p.lowT, p.highT, p.basis, 0])
    );
  }

  async render(paramsState, camState) {
    const aspect =
      this._lastCanvasSize[0] && this._lastCanvasSize[1]
        ? this._lastCanvasSize[0] / this._lastCanvasSize[1]
        : 1;

    this.updateCamera(camState, aspect);

    const nLayers = Math.max(
      1,
      Math.floor(paramsState.nLayers ?? paramsState.layers ?? 1)
    );

    const LOG_BINDINGS = false;

    this.writeThreshUniform(paramsState);

    if (!this.gridStripes) {
      this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
    }

    const encoder = this.device.createCommandEncoder();
    const viewTex = this.context.getCurrentTexture().createView();

    const alphaMode = paramsState.alphaMode ?? 0;
    const texelWorld = (2 * paramsState.quadScale) / paramsState.gridSize;

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];
      const modelBuf = this.modelBuffers[i];

      const w = info.width * texelWorld;
      const h = info.height * texelWorld;
      const x = -paramsState.quadScale + info.offsetX * texelWorld;
      const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;

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
      const u0 = info.offsetX / paramsState.gridSize;
      const v0 = 0;
      const su = info.width / paramsState.gridSize;
      const sv = 1;
      const uvOS = new Float32Array([u0, v0, su, sv]);

      this.device.queue.writeBuffer(modelBuf, 0, modelMat);
      this.device.queue.writeBuffer(modelBuf, 64, uvOS);
    }

    const getBg0ForLayer = (info, layer) => {
      if (info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)) {
        return info._renderBg0PerLayer.get(layer);
      }
      return info._renderBg0;
    };

    const getBg1 = (info) => info._renderBg1;

    const orderedLayers = (() => {
      const arr = [];
      for (let l = nLayers - 1; l >= 0; --l) arr.push(l);
      return arr;
    })();

    if (alphaMode === 1 || alphaMode === 2) {
      const prepass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: viewTex,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
        depthStencilAttachment: {
          view: this.depthTexture.createView(),
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1,
        },
      });

      prepass.setPipeline(this.renderPipelineDepth);

      for (const layer of orderedLayers) {
        this.writeRenderUniform(
          Object.assign({}, paramsState, { layerIndex: layer })
        );

        for (let i = 0; i < this.chunks.length; ++i) {
          const info = this.chunks[i];

          const bg0 = getBg0ForLayer(info, layer);
          if (!bg0) continue;
          prepass.setBindGroup(0, bg0);

          const bg1 = getBg1(info);
          if (!bg1) continue;
          prepass.setBindGroup(1, bg1);

          if (LOG_BINDINGS) {
            console.log(
              `prepass L${layer} C${i} bg0PerLayer=${Boolean(
                info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)
              )}`
            );
          }

          for (const stripe of this.gridStripes) {
            prepass.setVertexBuffer(0, stripe.vbuf);
            prepass.setIndexBuffer(stripe.ibuf, "uint32");
            prepass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
          }
        }
      }

      prepass.end();

      const blendPass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: viewTex,
            loadOp: "load",
            storeOp: "store",
          },
        ],
        depthStencilAttachment: {
          view: this.depthTexture.createView(),
          depthLoadOp: "load",
          depthStoreOp: "store",
        },
      });

      blendPass.setPipeline(this.renderPipelineTransparent);

      for (const layer of orderedLayers) {
        this.writeRenderUniform(
          Object.assign({}, paramsState, { layerIndex: layer })
        );

        for (let i = 0; i < this.chunks.length; ++i) {
          const info = this.chunks[i];

          const bg0 = getBg0ForLayer(info, layer);
          if (!bg0) continue;
          blendPass.setBindGroup(0, bg0);

          const bg1 = getBg1(info);
          if (!bg1) continue;
          blendPass.setBindGroup(1, bg1);

          if (LOG_BINDINGS) {
            console.log(
              `blend L${layer} C${i} bg0PerLayer=${Boolean(
                info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)
              )}`
            );
          }

          for (const stripe of this.gridStripes) {
            blendPass.setVertexBuffer(0, stripe.vbuf);
            blendPass.setIndexBuffer(stripe.ibuf, "uint32");
            blendPass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
          }
        }
      }

      blendPass.end();
    } else {
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
          view: this.depthTexture.createView(),
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1,
        },
      });

      rpass.setPipeline(this.renderPipelineOpaque);

      for (const layer of orderedLayers) {
        this.writeRenderUniform(
          Object.assign({}, paramsState, { layerIndex: layer })
        );

        for (let i = 0; i < this.chunks.length; ++i) {
          const info = this.chunks[i];

          const bg0 = getBg0ForLayer(info, layer);
          if (!bg0) continue;
          rpass.setBindGroup(0, bg0);

          const bg1 = getBg1(info);
          if (!bg1) continue;
          rpass.setBindGroup(1, bg1);

          for (const stripe of this.gridStripes) {
            rpass.setVertexBuffer(0, stripe.vbuf);
            rpass.setIndexBuffer(stripe.ibuf, "uint32");
            rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
          }
        }
      }

      rpass.end();
    }

    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async renderBlitToView(paramsState, colorView) {
    const texelWorld = (2 * paramsState.quadScale) / paramsState.gridSize;

    this.writeRenderUniform(paramsState);
    this.writeThreshUniform(paramsState);

    if (!this.gridStripes) {
      this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
    }

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];
      const modelBuf = this.modelBuffers[i];

      const w = info.width * texelWorld;
      const h = info.height * texelWorld;
      const x = -paramsState.quadScale + info.offsetX * texelWorld;
      const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;

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
      const u0 = info.offsetX / paramsState.gridSize;
      const v0 = 0;
      const su = info.width / paramsState.gridSize;
      const sv = 1;
      const uvOS = new Float32Array([u0, v0, su, sv]);

      this.device.queue.writeBuffer(modelBuf, 0, modelMat);
      this.device.queue.writeBuffer(modelBuf, 64, uvOS);
    }

    const encoder = this.device.createCommandEncoder();

    const rpass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: colorView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    const getBg0 = (info) =>
      info._renderBg0PerLayer && info._renderBg0PerLayer.size
        ? info._renderBg0PerLayer.get(paramsState.layerIndex >>> 0) ||
          info._renderBg0
        : info._renderBg0;

    const getBg1 = (info) => info._renderBg1;

    rpass.setPipeline(this.renderPipelineBlitOpaque);

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];

      const bg0 = getBg0(info);
      if (!bg0) continue;
      rpass.setBindGroup(0, bg0);

      const bg1 = getBg1(info);
      if (!bg1) continue;
      rpass.setBindGroup(1, bg1);

      for (const stripe of this.gridStripes) {
        rpass.setVertexBuffer(0, stripe.vbuf);
        rpass.setIndexBuffer(stripe.ibuf, "uint32");
        rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
      }
    }

    rpass.end();

    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async renderBlitToTexture(paramsState, targetTexture) {
    const view = targetTexture.createView();
    await this.renderBlitToView(paramsState, view);
  }

  idxForWorldX(worldX, paramsState) {
    const half = paramsState.quadScale;
    const uGlobal = (worldX + half) / (2 * half);
    const pixelX = Math.floor(uGlobal * paramsState.gridSize);
    for (let i = 0; i < this.chunks.length; ++i) {
      const c = this.chunks[i];
      if (pixelX >= c.offsetX && pixelX < c.offsetX + c.width) return i;
    }
    return 0;
  }

  destroy() {
    for (const b of this.modelBuffers) {
      try {
        b.destroy();
      } catch (e) {}
    }
    this.modelBuffers.length = 0;

    if (this.gridStripes) {
      for (const s of this.gridStripes) {
        try {
          s.vbuf.destroy();
        } catch (e) {}
        try {
          s.ibuf.destroy();
        } catch (e) {}
      }
      this.gridStripes = null;
    }

    try {
      if (this.depthTexture) this.depthTexture.destroy();
    } catch (e) {}
    this.depthTexture = null;

    try {
      if (this._fallbackSdfTex) this._fallbackSdfTex.destroy();
    } catch (e) {}
    this._fallbackSdfTex = null;
    this._fallbackSdfView = null;

    try {
      if (this._fallbackFlagTex) this._fallbackFlagTex.destroy();
    } catch (e) {}
    this._fallbackFlagTex = null;
    this._fallbackFlagView = null;
  }
}

export default RenderPipelineGPU;
