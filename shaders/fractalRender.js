// shaders/fractalRender.js
import * as glmath from "./helpers/gl-math";
import { buildPlaneGridChunks } from "../workers/buildPlaneGrid";
import frag from "./fractalFragment.wgsl";
import vert from "./fractalVertex.wgsl";
import fBlit from "./fBlitFragment.wgsl";
import vBlit from "./fBlitVertex.wgsl";

function _clamp01(x) {
  x = +x;
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

function _alignUp(v, a) {
  v = v | 0;
  a = a | 0;
  return (v + (a - 1)) & ~(a - 1);
}

function _isFiniteNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function _u32(v, d) {
  const n = v == null ? d : v;
  return (n >>> 0) | 0;
}

function _f32(v, d) {
  const n = v == null ? d : v;
  const x = +n;
  return Number.isFinite(x) ? x : d;
}

function _v3(a, d0, d1, d2) {
  if (!Array.isArray(a)) return [d0, d1, d2];
  return [
    Number.isFinite(+a[0]) ? +a[0] : d0,
    Number.isFinite(+a[1]) ? +a[1] : d1,
    Number.isFinite(+a[2]) ? +a[2] : d2,
  ];
}

const _OIT_COMPOSITE_WGSL = `
// group(0): accum/reveal + sampler
@group(0) @binding(0) var accumTex : texture_2d<f32>;
@group(0) @binding(1) var revealTex : texture_2d<f32>;
@group(0) @binding(2) var samp : sampler;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi : u32) -> VSOut {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );

  // Flip V so the offscreen render-target samples match the onscreen orientation.
  var uv = array<vec2<f32>, 3>(
    vec2<f32>(0.0,  1.0),
    vec2<f32>(2.0,  1.0),
    vec2<f32>(0.0, -1.0)
  );

  var o : VSOut;
  o.pos = vec4<f32>(pos[vi], 0.0, 1.0);
  o.uv = uv[vi];
  return o;
}

fn safeDiv(a: vec3<f32>, b: f32) -> vec3<f32> {
  let d = max(b, 1e-6);
  return a / d;
}

@fragment
fn fs_composite_premul(i: VSOut) -> @location(0) vec4<f32> {
  let acc = textureSampleLevel(accumTex, samp, i.uv, 0.0);
  let rev = textureSampleLevel(revealTex, samp, i.uv, 0.0);

  let rgb = safeDiv(acc.rgb, acc.a);
  let revealage = clamp(rev.a, 0.0, 1.0);
  let a = clamp(1.0 - revealage, 0.0, 1.0);

  return vec4<f32>(rgb * a, a);
}

@fragment
fn fs_composite_opaque(i: VSOut) -> @location(0) vec4<f32> {
  let acc = textureSampleLevel(accumTex, samp, i.uv, 0.0);
  let rgb = safeDiv(acc.rgb, acc.a);
  return vec4<f32>(rgb, 1.0);
}
`;

export class RenderPipelineGPU {
  constructor(device, context, vsCode = vert, fsCode = frag, opts = {}) {
    this.device = device;
    this.context = context;
    this.vsCode = vsCode;
    this.fsCode = fsCode;

    this.renderUniformStride = _alignUp(opts.renderUniformStride ?? 256, 256);
    this.gridDivs = opts.initialGridDivs ?? 256;
    this.quadScale = opts.quadScale ?? 1.0;
    this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";

    this.invertCameraY =
      opts.invertCameraY != null ? !!opts.invertCameraY : true;

    this.format = navigator.gpu.getPreferredCanvasFormat();

    this._gradientSize = Math.max(
      2,
      Math.min(4096, (opts.gradientSize ?? 512) | 0),
    );
    this._gradientTex = null;
    this._gradientView = null;
    this._fallbackGradTex = null;
    this._fallbackGradView = null;

    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    this._renderUBOCapLayers = 0;
    this.renderUniformBuffer = null;

    this._renderUBOTmp = new ArrayBuffer(96);
    this._renderUBODV = new DataView(this._renderUBOTmp);
    this._threshTmp = new Float32Array(4);

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
    this._depthView = null;
    this.depthTexture = null;
    this._lastCanvasSize = [0, 0];

    this._fallbackSdfTex = null;
    this._fallbackSdfView = null;
    this._fallbackFlagTex = null;
    this._fallbackFlagView = null;

    this._oitAccumTex = null;
    this._oitAccumView = null;
    this._oitRevealTex = null;
    this._oitRevealView = null;
    this._oitW = 0;
    this._oitH = 0;
    this._oitBg = null;

    this._modelKey = "";
    this._lastSetChunksState = {
      chunksRef: null,
      layersCount: 0,
      requireSdf: false,
    };

    this._tmpLookTarget = [0, 0, 0];

    this._rpDescOpaque = {
      colorAttachments: [
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      depthStencilAttachment: {
        view: null,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    };

    this._rpDescOIT = {
      colorAttachments: [
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        },
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };

    this._rpDescCompositePremul = {
      colorAttachments: [
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        },
      ],
    };

    this._rpDescCompositeOpaque = {
      colorAttachments: [
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };

    this._rpDescBlitOpaque = {
      colorAttachments: [
        {
          view: null,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };

    this._gradOverrideTex = null;
    this._gradOverrideView = null;
    this._gradOverrideSampler = null;
    this._gradientBindStamp = 1;

    this._createFallbackTextures();
    this._ensureGradientTexture(this._gradientSize);
    this.setHueGradientWheel({ count: this._gradientSize });

    this._createSharedLayouts();
    this._createRenderPipelines();
    this._createOITCompositePipeline();
    this._createBlitPipelines();

    this._ensureRenderUniformCapacity(1);

    this.writeThresholdUniform = (p) => this.writeThreshUniform(p);
    this.renderFrame = (p, c) => this.render(p, c);
    this.draw = (p, c) => this.render(p, c);
    this.blitToView = (p, v) => this.renderBlitToView(p, v);
  }

  setInvertCameraY(v) {
    this.invertCameraY = !!v;
  }

  static generateHueWheelRGBA8(count = 512, opts = {}) {
    const K = Math.max(2, Math.min(4096, count | 0));
    const hueOffset = _isFiniteNum(opts.hueOffset) ? +opts.hueOffset : 0;
    const cycles = _isFiniteNum(opts.cycles) ? +opts.cycles : 1;
    const s = _isFiniteNum(opts.sat) ? +opts.sat : 1;
    const v = _isFiniteNum(opts.val) ? +opts.val : 1;
    const a = _isFiniteNum(opts.alpha) ? +opts.alpha : 1;

    const out = new Uint8Array(K * 4);
    const denom = K === 1 ? 1 : K - 1;

    for (let i = 0; i < K; ++i) {
      const u = denom ? i / denom : 0;
      const h = hueOffset + u * cycles;

      const hh = ((h % 1) + 1) % 1;
      const ii = Math.floor(hh * 6);
      const ff = hh * 6 - ii;
      const p = v * (1 - s);
      const q = v * (1 - ff * s);
      const t = v * (1 - (1 - ff) * s);

      let r = v,
        g = t,
        b = p;
      switch (ii % 6) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        default:
          r = v;
          g = p;
          b = q;
          break;
      }

      const o = i * 4;
      out[o + 0] = (r * 255 + 0.5) | 0;
      out[o + 1] = (g * 255 + 0.5) | 0;
      out[o + 2] = (b * 255 + 0.5) | 0;
      out[o + 3] = (_clamp01(a) * 255 + 0.5) | 0;
    }

    return out;
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

    this._ensureFallbackGradientTexture();
  }

  _ensureGradientTexture(count) {
    const W = Math.max(2, Math.min(4096, count | 0));
    if (this._gradientTex && this._gradientSize === W && this._gradientView)
      return true;

    try {
      if (this._gradientTex) this._gradientTex.destroy();
    } catch {}

    this._gradientTex = null;
    this._gradientView = null;

    try {
      this._gradientTex = this.device.createTexture({
        size: [W, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this._gradientView = this._gradientTex.createView({ dimension: "2d" });
      this._gradientSize = W;
      return true;
    } catch (e) {
      console.warn("Could not create gradient texture:", e);
      this._gradientTex = null;
      this._gradientView = null;
      return false;
    }
  }

  _uploadGradientRGBA8(dataRGBA8, count) {
    const W = Math.max(2, Math.min(4096, count | 0));
    if (!this._ensureGradientTexture(W)) return false;

    const tex = this._gradientTex;
    if (!tex) return false;

    const rawBpr = W * 4;
    const bpr = _alignUp(rawBpr, 256);
    let bytes = dataRGBA8;

    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (bytes.byteLength < rawBpr) return false;

    if (bpr !== rawBpr) {
      const padded = new Uint8Array(bpr);
      padded.set(bytes.subarray(0, rawBpr), 0);
      bytes = padded;
    }

    try {
      this.device.queue.writeTexture(
        { texture: tex },
        bytes,
        { bytesPerRow: bpr, rowsPerImage: 1 },
        { width: W, height: 1, depthOrArrayLayers: 1 },
      );
      return true;
    } catch (e) {
      console.warn("Gradient upload failed:", e);
      return false;
    }
  }

  setHueGradientWheel(opts = {}) {
    const W = Math.max(
      2,
      Math.min(4096, opts.count | 0 || this._gradientSize || 512),
    );
    const rgba = RenderPipelineGPU.generateHueWheelRGBA8(W, opts);
    const ok = this._uploadGradientRGBA8(rgba, W);
    if (ok) this._rebuildBg0ForGradientIfNeeded();
    return ok;
  }

  _ensureFallbackGradientTexture() {
    if (this._fallbackGradTex && this._fallbackGradView) return true;

    try {
      if (this._fallbackGradTex) this._fallbackGradTex.destroy();
    } catch {}
    this._fallbackGradTex = null;
    this._fallbackGradView = null;

    try {
      this._fallbackGradTex = this.device.createTexture({
        size: [1, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this._fallbackGradView = this._fallbackGradTex.createView({
        dimension: "2d",
      });
      this.device.queue.writeTexture(
        { texture: this._fallbackGradTex },
        new Uint8Array([255, 255, 255, 255]),
        { bytesPerRow: 256, rowsPerImage: 1 },
        { width: 1, height: 1, depthOrArrayLayers: 1 },
      );
      return true;
    } catch (e) {
      this._fallbackGradTex = null;
      this._fallbackGradView = null;
      console.warn("Could not create fallback Gradient texture:", e);
      return false;
    }
  }

  _getGradientView() {
    if (this._gradOverrideView) return this._gradOverrideView;
    if (this._gradientView) return this._gradientView;
    if (this._fallbackGradView) return this._fallbackGradView;
    if (this._ensureFallbackGradientTexture()) return this._fallbackGradView;
    return null;
  }

  setGradientOverride(tex, view, sampler = null) {
    const v =
      view ||
      (tex && typeof tex.createView === "function"
        ? (() => {
            try {
              return tex.createView({ dimension: "2d" });
            } catch {}
            try {
              return tex.createView();
            } catch {}
            return null;
          })()
        : null);

    this._gradOverrideTex = tex || null;
    this._gradOverrideView = v || null;
    this._gradOverrideSampler = sampler || null;

    this._gradientBindStamp = ((this._gradientBindStamp | 0) + 1) | 0;

    this._rebuildBg0ForGradientIfNeeded();
  }

  clearGradientOverride() {
    this._gradOverrideTex = null;
    this._gradOverrideView = null;
    this._gradOverrideSampler = null;

    this._gradientBindStamp = ((this._gradientBindStamp | 0) + 1) | 0;

    this._rebuildBg0ForGradientIfNeeded();
  }

  _ensureArrayViewFromTexture(tex, layersCount) {
    if (!tex || typeof tex.createView !== "function") return null;

    const L = Math.max(1, layersCount | 0);

    try {
      return tex.createView({
        dimension: "2d-array",
        baseArrayLayer: 0,
        arrayLayerCount: L,
      });
    } catch {}

    try {
      return tex.createView({ dimension: "2d-array" });
    } catch {}

    return null;
  }

  _pickChunkArrayView(info, names) {
    for (const n of names) {
      const v = info[n];
      if (!v) continue;
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; ++i) {
          if (v[i]) return v[i];
        }
        continue;
      }
      return v;
    }
    return null;
  }

  _rebuildBg0ForGradientIfNeeded() {
    if (!this.chunks || this.chunks.length === 0) return;

    const bgLayout0 = this._bgLayout0;
    const gradView = this._getGradientView();
    if (!gradView) return;

    const sharedSampler = this._gradOverrideSampler || this.sampler;

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];
      const fractalView =
        info._fractalArrayView || info.storageView || info.fractalView || null;
      if (!fractalView) continue;

      try {
        info._renderBg0 = this.device.createBindGroup({
          layout: bgLayout0,
          entries: [
            { binding: 0, resource: fractalView },
            { binding: 1, resource: sharedSampler },
            {
              binding: 2,
              resource: {
                buffer: this.renderUniformBuffer,
                offset: 0,
                size: this.renderUniformStride,
              },
            },
            { binding: 3, resource: { buffer: this.cameraBuffer } },
            { binding: 4, resource: { buffer: this.threshBuf } },
            { binding: 5, resource: gradView },
          ],
        });
      } catch (e) {
        console.warn("_rebuildBg0ForGradientIfNeeded failed for chunk", i, e);
      }
    }
  }

  _ensureRenderUniformCapacity(layers) {
    const need = Math.max(1, layers | 0);
    if (this.renderUniformBuffer && (this._renderUBOCapLayers | 0) >= need)
      return;

    let cap = 1;
    while (cap < need) cap <<= 1;

    try {
      if (this.renderUniformBuffer) this.renderUniformBuffer.destroy();
    } catch {}

    this.renderUniformBuffer = this.device.createBuffer({
      size: this.renderUniformStride * cap,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._renderUBOCapLayers = cap;
    this._rebuildBg0ForGradientIfNeeded();
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
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: this.renderUniformStride,
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" },
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

    const vstate = {
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
    };

    this.renderPipelineOpaque = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
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

    this._oitAccumFormat = "rgba16float";
    this._oitRevealFormat = "rgba16float";

    this.renderPipelineOIT = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
      fragment: {
        module: fsModule,
        entryPoint: "fs_oit",
        targets: [
          {
            format: this._oitAccumFormat,
            blend: {
              color: { srcFactor: "one", dstFactor: "one", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one", operation: "add" },
            },
            writeMask: GPUColorWrite.ALL,
          },
          {
            format: this._oitRevealFormat,
            blend: {
              color: {
                srcFactor: "zero",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "zero",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
            writeMask: GPUColorWrite.ALPHA,
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
  }

  _createOITCompositePipeline() {
    this._oitCompositeLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    this._oitCompositePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this._oitCompositeLayout],
    });

    const mod = this.device.createShaderModule({ code: _OIT_COMPOSITE_WGSL });

    this._oitCompositePipelinePremul = this.device.createRenderPipeline({
      layout: this._oitCompositePipelineLayout,
      vertex: { module: mod, entryPoint: "vs_fullscreen" },
      fragment: {
        module: mod,
        entryPoint: "fs_composite_premul",
        targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }],
      },
      primitive: { topology: "triangle-list" },
    });

    this._oitCompositePipelineOpaque = this.device.createRenderPipeline({
      layout: this._oitCompositePipelineLayout,
      vertex: { module: mod, entryPoint: "vs_fullscreen" },
      fragment: {
        module: mod,
        entryPoint: "fs_composite_opaque",
        targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }],
      },
      primitive: { topology: "triangle-list" },
    });
  }

  _createBlitPipelines() {
    const vsBlitModule = this.device.createShaderModule({ code: vBlit });
    const fsBlitModule = this.device.createShaderModule({ code: fBlit });

    const vstate = {
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
    };

    this.renderPipelineBlitOpaque = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
      fragment: {
        module: fsBlitModule,
        entryPoint: "fs_blit",
        targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: undefined,
    });

    this.renderPipelineBlitTransparent = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
      fragment: {
        module: fsBlitModule,
        entryPoint: "fs_blit",
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
      depthStencil: undefined,
    });
  }

  _destroyOITTargets() {
    try {
      if (this._oitAccumTex) this._oitAccumTex.destroy();
    } catch {}
    try {
      if (this._oitRevealTex) this._oitRevealTex.destroy();
    } catch {}
    this._oitAccumTex = null;
    this._oitAccumView = null;
    this._oitRevealTex = null;
    this._oitRevealView = null;
    this._oitBg = null;
    this._oitW = 0;
    this._oitH = 0;
  }

  _ensureOITTargets(w, h) {
    const W = Math.max(1, w | 0);
    const H = Math.max(1, h | 0);

    if (
      this._oitAccumTex &&
      this._oitRevealTex &&
      this._oitW === W &&
      this._oitH === H
    ) {
      if (this._oitBg) return true;
      if (this._oitAccumView && this._oitRevealView) {
        try {
          this._oitBg = this.device.createBindGroup({
            layout: this._oitCompositeLayout,
            entries: [
              { binding: 0, resource: this._oitAccumView },
              { binding: 1, resource: this._oitRevealView },
              { binding: 2, resource: this.sampler },
            ],
          });
          return true;
        } catch {
          this._oitBg = null;
          return false;
        }
      }
    }

    this._destroyOITTargets();

    try {
      this._oitAccumTex = this.device.createTexture({
        size: [W, H, 1],
        format: this._oitAccumFormat,
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      this._oitAccumView = this._oitAccumTex.createView({ dimension: "2d" });

      this._oitRevealTex = this.device.createTexture({
        size: [W, H, 1],
        format: this._oitRevealFormat,
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      this._oitRevealView = this._oitRevealTex.createView({ dimension: "2d" });

      this._oitBg = this.device.createBindGroup({
        layout: this._oitCompositeLayout,
        entries: [
          { binding: 0, resource: this._oitAccumView },
          { binding: 1, resource: this._oitRevealView },
          { binding: 2, resource: this.sampler },
        ],
      });

      this._oitW = W;
      this._oitH = H;
      return true;
    } catch (e) {
      console.warn("Could not create OIT targets:", e);
      this._destroyOITTargets();
      return false;
    }
  }

  resize(clientWidth, clientHeight) {
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.floor(clientWidth * dpr);
    const ph = Math.floor(clientHeight * dpr);

    const lastW = this._lastCanvasSize[0] | 0;
    const lastH = this._lastCanvasSize[1] | 0;

    if (pw === lastW && ph === lastH && pw > 0 && ph > 0) return;

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: this.canvasAlphaMode,
      size: [pw, ph],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    try {
      if (this.depthTexture) this.depthTexture.destroy();
    } catch {}

    this.depthTexture = this.device.createTexture({
      size: [pw, ph, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._depthView = null;
    this._lastCanvasSize = [pw, ph];
    this.gridStripes = null;

    this._destroyOITTargets();
  }

  async setChunks(chunks = [], layers = 1, opts = {}) {
    const layersCount = Math.max(1, Math.floor(layers || 1));
    const requireSdf = !!opts.requireSdf;

    if (
      this._lastSetChunksState.chunksRef === chunks &&
      this._lastSetChunksState.layersCount === layersCount &&
      this._lastSetChunksState.requireSdf === requireSdf
    ) {
      return;
    }

    this._ensureRenderUniformCapacity(layersCount);

    const gradView = this._getGradientView();
    if (!gradView) {
      throw new Error(
        "RenderPipelineGPU.setChunks: missing gradient view for binding(0,5).",
      );
    }

    const sharedSampler = this._gradOverrideSampler || this.sampler;
    const gradStamp = this._gradientBindStamp | 0 || 0;

    const nextChunks = chunks || [];
    const nextCount = nextChunks.length | 0;

    if (this.chunks !== nextChunks) this.chunks = nextChunks;

    if (this.modelBuffers.length !== nextCount) {
      const old = this.modelBuffers;
      for (let i = nextCount; i < old.length; ++i) {
        try {
          old[i].destroy();
        } catch {}
      }
      old.length = nextCount;

      for (let i = 0; i < nextCount; ++i) {
        if (!old[i]) {
          old[i] = this.device.createBuffer({
            size: 4 * 20,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
        }
      }
      this.modelBuffers = old;
    }

    const bgLayout0 = this._bgLayout0;
    const bgLayout1 = this._bgLayout1;

    for (let i = 0; i < nextCount; ++i) {
      const info = nextChunks[i];
      if (!info) continue;

      if (!info._modelData) info._modelData = new Float32Array(20);

      const fractalTex =
        info.fractalTex || info.fractalTexture || info.fractal || null;
      const sdfTex = info.sdfTex || info.sdfTexture || info.sdf || null;
      const flagTex = info.flagTex || info.flagTexture || info.flag || null;

      const fractalArrayView =
        this._ensureArrayViewFromTexture(fractalTex, layersCount) ||
        info.storageView ||
        info.fractalView ||
        this._pickChunkArrayView(info, [
          "fractalViews",
          "fractalLayerViews",
          "layerViews",
        ]);

      if (!fractalArrayView) {
        const keys = Object.keys(info);
        const msg = `RenderPipelineGPU.setChunks: chunk[${i}] missing fractal array view. chunk keys: ${keys.join(",")}`;
        console.error(msg, info);
        throw new Error(msg);
      }

      const sdfArrayView =
        this._ensureArrayViewFromTexture(sdfTex, layersCount) ||
        info.sdfView ||
        this._fallbackSdfView;

      const flagArrayView =
        this._ensureArrayViewFromTexture(flagTex, layersCount) ||
        info.flagView ||
        this._fallbackFlagView;

      if (requireSdf && (!sdfArrayView || !flagArrayView)) {
        throw new Error(
          `RenderPipelineGPU.setChunks: chunk[${i}] missing SDF or flag view and requireSdf=true.`,
        );
      }

      const key = `${layersCount}|${requireSdf ? 1 : 0}|g${gradStamp}`;
      const prevKey = info._bindKey || "";

      info._fractalArrayView = fractalArrayView;
      info._sdfArrayView = sdfArrayView;
      info._flagArrayView = flagArrayView;

      if (prevKey !== key || !info._renderBg0) {
        info._renderBg0 = this.device.createBindGroup({
          layout: bgLayout0,
          entries: [
            { binding: 0, resource: fractalArrayView },
            { binding: 1, resource: sharedSampler },
            {
              binding: 2,
              resource: {
                buffer: this.renderUniformBuffer,
                offset: 0,
                size: this.renderUniformStride,
              },
            },
            { binding: 3, resource: { buffer: this.cameraBuffer } },
            { binding: 4, resource: { buffer: this.threshBuf } },
            { binding: 5, resource: gradView },
          ],
        });

        try {
          info._renderBg1 = this.device.createBindGroup({
            layout: bgLayout1,
            entries: [
              { binding: 0, resource: { buffer: this.modelBuffers[i] } },
              { binding: 1, resource: sdfArrayView },
              { binding: 2, resource: flagArrayView },
              { binding: 3, resource: this.sampler },
            ],
          });
        } catch (e) {
          console.error(
            "setChunks: createBindGroup(bg1) failed for chunk",
            i,
            e,
          );
          info._renderBg1 = null;
        }

        info._modelBufIdx = i;
        info._bindKey = key;
      } else {
        info._modelBufIdx = i;
      }
    }

    this._modelKey = "";
    this._lastSetChunksState = { chunksRef: chunks, layersCount, requireSdf };
  }

  updateCamera(cam, aspect) {
    const proj = glmath.perspective(cam.fov, aspect, 0.01, 10000.0);

    let target = cam.lookTarget;
    if (this.invertCameraY && target && cam.cameraPos) {
      const cp = cam.cameraPos;
      const cx = +cp[0],
        cy = +cp[1],
        cz = +cp[2];
      const tx = +target[0],
        ty = +target[1],
        tz = +target[2];

      const dy = ty - cy;
      const tmp = this._tmpLookTarget;
      tmp[0] = tx;
      tmp[1] = cy - dy;
      tmp[2] = tz;
      target = tmp;
    }

    const view = glmath.lookAt(cam.cameraPos, target, cam.upDir);
    const viewProj = glmath.mulMat(proj, view);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
  }

  writeRenderUniform(paramsState = {}, dstByteOffset = 0) {
    const dv = this._renderUBODV;

    const layerIndex = _u32(paramsState.layerIndex, 0);
    const scheme = _u32(paramsState.scheme, 0);

    const wantGradMode = _u32(paramsState.gradTexMode, 0) === 1;

    let useHueGradient;
    if (paramsState.useHueGradient != null) {
      useHueGradient = !!paramsState.useHueGradient;
    } else if (paramsState.hueGradientOn != null) {
      useHueGradient = !!paramsState.hueGradientOn;
    } else if (paramsState.hueGradient != null) {
      useHueGradient = !!paramsState.hueGradient;
    } else {
      useHueGradient = wantGradMode;
    }

    const sdfDispMode = _u32(paramsState.dispMode, 0);

    let dispSource;
    if (paramsState.dispSource != null) {
      dispSource = _u32(paramsState.dispSource, 0);
    } else if (paramsState.dispSourceMode != null) {
      dispSource = _u32(paramsState.dispSourceMode, 0);
    } else {
      dispSource = sdfDispMode !== 0 ? 1 : 0;
    }

    let dispBits = 0;
    if ((dispSource & 1) !== 0 && sdfDispMode !== 0) dispBits |= 1;
    if ((dispSource & 2) !== 0) dispBits |= 2;

    const bowlOn = !!paramsState.bowlOn;
    const lightingOn = !!paramsState.lightingOn;
    const dispLimitOn = !!paramsState.dispLimitOn;

    const alphaMode = _u32(paramsState.alphaMode, 0);

    const hueOffset = _f32(paramsState.hueOffset, 0.0);
    const dispAmp = _f32(paramsState.dispAmp, 0.15);
    const dispCurve = _f32(paramsState.dispCurve, 3.0);
    const bowlDepth = _f32(paramsState.bowlDepth, 0.25);

    const quadScale = _f32(
      paramsState.quadScale,
      _isFiniteNum(this.quadScale) ? +this.quadScale : 1.0,
    );
    const gridSize = _f32(paramsState.gridSize, 512.0);
    const slopeLimit = _f32(paramsState.slopeLimit, 0.5);
    const wallJump = _f32(paramsState.wallJump, 0.05);

    const lp = _v3(paramsState.lightPos, 0.0, 0.0, 5.0);
    const specPower = _f32(paramsState.specPower, 32.0);

    const worldOffset =
      paramsState.worldOffset != null
        ? _f32(paramsState.worldOffset, 0.0)
        : paramsState.layerSeparation != null
          ? _f32(paramsState.layerSeparation, 0.0)
          : paramsState.layerSpacing != null
            ? _f32(paramsState.layerSpacing, 0.0)
            : paramsState.layerStep != null
              ? _f32(paramsState.layerStep, 0.0)
              : paramsState.layerOffset != null
                ? _f32(paramsState.layerOffset, 0.0)
                : 0.0;

    const worldStart =
      paramsState.worldStart != null
        ? _f32(paramsState.worldStart, 0.0)
        : paramsState.layerStart != null
          ? _f32(paramsState.layerStart, 0.0)
          : paramsState.layerBase != null
            ? _f32(paramsState.layerBase, 0.0)
            : 0.0;

    dv.setUint32(0, layerIndex >>> 0, true);
    dv.setUint32(4, scheme >>> 0, true);
    dv.setUint32(8, useHueGradient ? 1 : 0, true);
    dv.setUint32(12, dispBits >>> 0, true);

    dv.setUint32(16, bowlOn ? 1 : 0, true);
    dv.setUint32(20, lightingOn ? 1 : 0, true);
    dv.setUint32(24, dispLimitOn ? 1 : 0, true);
    dv.setUint32(28, alphaMode >>> 0, true);

    dv.setFloat32(32, hueOffset, true);
    dv.setFloat32(36, dispAmp, true);
    dv.setFloat32(40, dispCurve, true);
    dv.setFloat32(44, bowlDepth, true);

    dv.setFloat32(48, quadScale, true);
    dv.setFloat32(52, gridSize, true);
    dv.setFloat32(56, slopeLimit, true);
    dv.setFloat32(60, wallJump, true);

    dv.setFloat32(64, lp[0], true);
    dv.setFloat32(68, lp[1], true);
    dv.setFloat32(72, lp[2], true);
    dv.setFloat32(76, specPower, true);

    dv.setFloat32(80, worldOffset, true);
    dv.setFloat32(84, worldStart, true);

    const timeSec =
      paramsState.timeSec != null
        ? _f32(paramsState.timeSec, 0.0)
        : paramsState.iTime != null
          ? _f32(paramsState.iTime, 0.0)
          : paramsState.time != null
            ? _f32(paramsState.time, 0.0)
            : 0.0;

    const wantHueDisp = (dispBits & 2) !== 0;

    const kickRaw =
      paramsState.dispHueKick01 != null
        ? _f32(paramsState.dispHueKick01, 0.0)
        : paramsState.dispHueKick != null
          ? _f32(paramsState.dispHueKick, 0.0)
          : wantHueDisp
            ? 1.0
            : 0.0;

    const kick01 = kickRaw <= 0 ? 0 : kickRaw >= 1 ? 1 : kickRaw;

    dv.setFloat32(88, timeSec, true);
    dv.setFloat32(92, kick01, true);

    this.device.queue.writeBuffer(
      this.renderUniformBuffer,
      dstByteOffset >>> 0,
      this._renderUBOTmp,
    );
  }

  writeThreshUniform(paramsState = {}) {
    const lowT = _f32(paramsState.lowT, 0.0);
    const highT = _f32(paramsState.highT, 1.0);
    const basis = _f32(paramsState.basis, 0.0);
    this._threshTmp[0] = lowT;
    this._threshTmp[1] = highT;
    this._threshTmp[2] = basis;
    this._threshTmp[3] = 0.0;
    this.device.queue.writeBuffer(this.threshBuf, 0, this._threshTmp);
  }

  _updateModelBuffersIfNeeded(paramsState) {
    const gridSize = _isFiniteNum(paramsState.gridSize)
      ? +paramsState.gridSize
      : 512;
    const quadScale = _isFiniteNum(paramsState.quadScale)
      ? +paramsState.quadScale
      : this.quadScale;

    const key = `${gridSize}|${quadScale}|${this.chunks.length}`;
    if (key === this._modelKey) return;

    const texelWorld = (2 * quadScale) / gridSize;

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];
      const modelBuf = this.modelBuffers[i];
      const data = info._modelData || (info._modelData = new Float32Array(20));

      const w = info.width * texelWorld;
      const h = info.height * texelWorld;
      const x = -quadScale + info.offsetX * texelWorld;
      const y = -quadScale + (info.offsetY ?? 0) * texelWorld;

      data[0] = w;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0;
      data[4] = 0;
      data[5] = h;
      data[6] = 0;
      data[7] = 0;
      data[8] = 0;
      data[9] = 0;
      data[10] = 1;
      data[11] = 0;
      data[12] = x;
      data[13] = y;
      data[14] = 0;
      data[15] = 1;

      const u0 = info.offsetX / gridSize;
      const v0 = (info.offsetY ?? 0) / gridSize;
      const su = info.width / gridSize;
      const sv = info.height / gridSize;

      data[16] = u0;
      data[17] = v0;
      data[18] = su;
      data[19] = sv;

      this.device.queue.writeBuffer(modelBuf, 0, data);
    }

    this._modelKey = key;
  }

  _drawAll(pass, paramsState, nLayers) {
    const chunks = this.chunks;
    const stripes = this.gridStripes;
    const stride = this.renderUniformStride;

    const chunkCount = chunks.length | 0;
    const stripeCount = stripes.length | 0;

    const savedLayer = paramsState.layerIndex;

    for (let s = 0; s < stripeCount; ++s) {
      const stripe = stripes[s];
      pass.setVertexBuffer(0, stripe.vbuf);
      pass.setIndexBuffer(stripe.ibuf, "uint32");

      for (let layer = 0; layer < nLayers; ++layer) {
        const dyn = (layer * stride) >>> 0;
        paramsState.layerIndex = layer;
        this.writeRenderUniform(paramsState, dyn);

        for (let i = 0; i < chunkCount; ++i) {
          const info = chunks[i];
          const bg0 = info && info._renderBg0;
          const bg1 = info && info._renderBg1;
          if (!bg0 || !bg1) continue;

          pass.setBindGroup(0, bg0, [dyn]);
          pass.setBindGroup(1, bg1);
          pass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
        }
      }
    }

    paramsState.layerIndex = savedLayer;
  }

  async _ensureGrid() {
    if (!this.gridStripes) {
      this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
    }
  }

  async render(paramsState, camState) {
    const p = paramsState || {};
    const w = this._lastCanvasSize[0] | 0;
    const h = this._lastCanvasSize[1] | 0;
    const aspect = w > 0 && h > 0 ? w / h : 1;

    this.updateCamera(camState, aspect);

    const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
    const alphaMode = _u32(p.alphaMode, 0);
    const useOIT = alphaMode === 1 || alphaMode === 2;

    this._ensureRenderUniformCapacity(nLayers);
    this.writeThreshUniform(p);
    await this._ensureGrid();
    this._updateModelBuffersIfNeeded(p);

    const encoder = this.device.createCommandEncoder();
    const outView = this.context.getCurrentTexture().createView();

    if (useOIT) {
      if (!this._ensureOITTargets(w || 1, h || 1)) return;

      const oitDesc = this._rpDescOIT;
      oitDesc.colorAttachments[0].view = this._oitAccumView;
      oitDesc.colorAttachments[1].view = this._oitRevealView;

      const oitPass = encoder.beginRenderPass(oitDesc);
      oitPass.setPipeline(this.renderPipelineOIT);
      this._drawAll(oitPass, p, nLayers);
      oitPass.end();

      const compositePipeline =
        this.canvasAlphaMode === "opaque"
          ? this._oitCompositePipelineOpaque
          : this._oitCompositePipelinePremul;

      const compDesc =
        this.canvasAlphaMode === "opaque"
          ? this._rpDescCompositeOpaque
          : this._rpDescCompositePremul;

      compDesc.colorAttachments[0].view = outView;

      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      compPass.setBindGroup(0, this._oitBg);
      compPass.draw(3, 1, 0, 0);
      compPass.end();
    } else {
      if (!this.depthTexture) {
        this.depthTexture = this.device.createTexture({
          size: [Math.max(1, w), Math.max(1, h), 1],
          format: "depth24plus",
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this._depthView = null;
      }
      if (!this._depthView) this._depthView = this.depthTexture.createView();

      const desc = this._rpDescOpaque;
      desc.colorAttachments[0].view = outView;
      desc.depthStencilAttachment.view = this._depthView;

      const pass = encoder.beginRenderPass(desc);
      pass.setPipeline(this.renderPipelineOpaque);
      this._drawAll(pass, p, nLayers);
      pass.end();
    }

    this.device.queue.submit([encoder.finish()]);

    if (p && p.waitGPU) {
      await this.device.queue.onSubmittedWorkDone();
    }
  }

  async renderBlitToView(paramsState, colorView) {
    const p = paramsState || {};
    const w = this._lastCanvasSize[0] | 0;
    const h = this._lastCanvasSize[1] | 0;

    const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
    const alphaMode = _u32(p.alphaMode, 0);
    const useOIT = alphaMode === 1 || alphaMode === 2;

    this._ensureRenderUniformCapacity(nLayers);
    this.writeThreshUniform(p);
    await this._ensureGrid();
    this._updateModelBuffersIfNeeded(p);

    const encoder = this.device.createCommandEncoder();

    if (useOIT) {
      if (!this._ensureOITTargets(w || 1, h || 1)) return;

      const oitDesc = this._rpDescOIT;
      oitDesc.colorAttachments[0].view = this._oitAccumView;
      oitDesc.colorAttachments[1].view = this._oitRevealView;

      const oitPass = encoder.beginRenderPass(oitDesc);
      oitPass.setPipeline(this.renderPipelineOIT);
      this._drawAll(oitPass, p, nLayers);
      oitPass.end();

      const compositePipeline =
        this.canvasAlphaMode === "opaque"
          ? this._oitCompositePipelineOpaque
          : this._oitCompositePipelinePremul;

      const compDesc =
        this.canvasAlphaMode === "opaque"
          ? this._rpDescCompositeOpaque
          : this._rpDescCompositePremul;

      compDesc.colorAttachments[0].view = colorView;

      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      compPass.setBindGroup(0, this._oitBg);
      compPass.draw(3, 1, 0, 0);
      compPass.end();
    } else {
      const desc = this._rpDescBlitOpaque;
      desc.colorAttachments[0].view = colorView;

      const rpass = encoder.beginRenderPass(desc);
      rpass.setPipeline(this.renderPipelineBlitOpaque);
      this._drawAll(rpass, p, nLayers);
      rpass.end();
    }

    this.device.queue.submit([encoder.finish()]);

    if (p && p.waitGPU) {
      await this.device.queue.onSubmittedWorkDone();
    }
  }

  async renderBlitToTexture(paramsState, targetTexture) {
    const view = targetTexture.createView();
    await this.renderBlitToView(paramsState, view);
  }

  destroy() {
    for (const b of this.modelBuffers) {
      try {
        b.destroy();
      } catch {}
    }
    this.modelBuffers.length = 0;

    if (this.gridStripes) {
      for (const s of this.gridStripes) {
        try {
          s.vbuf.destroy();
        } catch {}
        try {
          s.ibuf.destroy();
        } catch {}
      }
      this.gridStripes = null;
    }

    try {
      if (this.depthTexture) this.depthTexture.destroy();
    } catch {}
    this.depthTexture = null;
    this._depthView = null;

    this._destroyOffscreenDepth();

    try {
      if (this._fallbackSdfTex) this._fallbackSdfTex.destroy();
    } catch {}
    this._fallbackSdfTex = null;
    this._fallbackSdfView = null;

    try {
      if (this._fallbackFlagTex) this._fallbackFlagTex.destroy();
    } catch {}
    this._fallbackFlagTex = null;
    this._fallbackFlagView = null;

    try {
      if (this._gradientTex) this._gradientTex.destroy();
    } catch {}
    this._gradientTex = null;
    this._gradientView = null;

    try {
      if (this._fallbackGradTex) this._fallbackGradTex.destroy();
    } catch {}
    this._fallbackGradTex = null;
    this._fallbackGradView = null;

    try {
      if (this.renderUniformBuffer) this.renderUniformBuffer.destroy();
    } catch {}
    this.renderUniformBuffer = null;
    this._renderUBOCapLayers = 0;

    this._destroyOITTargets();
  }

  _destroyOffscreenDepth() {
    try {
      if (this._offDepthTex) this._offDepthTex.destroy();
    } catch {}
    this._offDepthTex = null;
    this._offDepthView = null;
    this._offDepthW = 0;
    this._offDepthH = 0;
  }

  _ensureOffscreenDepth(w, h) {
    const W = Math.max(1, w | 0);
    const H = Math.max(1, h | 0);

    if (
      this._offDepthTex &&
      this._offDepthView &&
      (this._offDepthW | 0) === W &&
      (this._offDepthH | 0) === H
    ) {
      return this._offDepthView;
    }

    this._destroyOffscreenDepth();

    this._offDepthTex = this.device.createTexture({
      size: [W, H, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this._offDepthView = this._offDepthTex.createView();
    this._offDepthW = W;
    this._offDepthH = H;
    return this._offDepthView;
  }

  async renderToView(paramsState, camState, colorView, width, height) {
    const p = paramsState || {};
    const w = Math.max(1, width | 0);
    const h = Math.max(1, height | 0);
    const aspect = w > 0 && h > 0 ? w / h : 1;

    this.updateCamera(camState, aspect);

    const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
    const alphaMode = _u32(p.alphaMode, 0);
    const useOIT = alphaMode === 1 || alphaMode === 2;

    this._ensureRenderUniformCapacity(nLayers);
    this.writeThreshUniform(p);
    await this._ensureGrid();
    this._updateModelBuffersIfNeeded(p);

    const encoder = this.device.createCommandEncoder();

    if (useOIT) {
      if (!this._ensureOITTargets(w, h)) return;

      const oitDesc = this._rpDescOIT;
      oitDesc.colorAttachments[0].view = this._oitAccumView;
      oitDesc.colorAttachments[1].view = this._oitRevealView;

      const oitPass = encoder.beginRenderPass(oitDesc);
      oitPass.setPipeline(this.renderPipelineOIT);
      this._drawAll(oitPass, p, nLayers);
      oitPass.end();

      const compositePipeline =
        this.canvasAlphaMode === "opaque"
          ? this._oitCompositePipelineOpaque
          : this._oitCompositePipelinePremul;

      const compDesc =
        this.canvasAlphaMode === "opaque"
          ? this._rpDescCompositeOpaque
          : this._rpDescCompositePremul;

      compDesc.colorAttachments[0].view = colorView;

      const compPass = encoder.beginRenderPass(compDesc);
      compPass.setPipeline(compositePipeline);
      compPass.setBindGroup(0, this._oitBg);
      compPass.draw(3, 1, 0, 0);
      compPass.end();
    } else {
      const dview = this._ensureOffscreenDepth(w, h);

      const desc = this._rpDescOpaque;
      desc.colorAttachments[0].view = colorView;
      desc.depthStencilAttachment.view = dview;

      const pass = encoder.beginRenderPass(desc);
      pass.setPipeline(this.renderPipelineOpaque);
      this._drawAll(pass, p, nLayers);
      pass.end();
    }

    this.device.queue.submit([encoder.finish()]);

    if (p && p.waitGPU) {
      await this.device.queue.onSubmittedWorkDone();
    }
  }

  async renderToTexture(paramsState, camState, targetTexture) {
    const tex = targetTexture;
    const w = (tex && tex.width) | 0;
    const h = (tex && tex.height) | 0;
    const view = tex.createView();
    await this.renderToView(paramsState, camState, view, w, h);
  }
}

export default RenderPipelineGPU;
