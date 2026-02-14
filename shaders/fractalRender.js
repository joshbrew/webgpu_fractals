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

function _hexToRGBA01(hex) {
  const s = String(hex || "").trim();
  const h = s.startsWith("#") ? s.slice(1) : s;
  if (!(h.length === 3 || h.length === 4 || h.length === 6 || h.length === 8))
    return null;

  const toNib = (c) => {
    const v = parseInt(c, 16);
    return Number.isFinite(v) ? v : null;
  };

  const toByte2 = (a, b) => {
    const v = parseInt(a + b, 16);
    return Number.isFinite(v) ? v : null;
  };

  let r = 255,
    g = 255,
    b = 255,
    a = 255;

  if (h.length === 3 || h.length === 4) {
    const r0 = toNib(h[0]);
    const g0 = toNib(h[1]);
    const b0 = toNib(h[2]);
    const a0 = h.length === 4 ? toNib(h[3]) : 15;
    if (r0 == null || g0 == null || b0 == null || a0 == null) return null;
    r = r0 * 17;
    g = g0 * 17;
    b = b0 * 17;
    a = a0 * 17;
  } else {
    const r0 = toByte2(h[0], h[1]);
    const g0 = toByte2(h[2], h[3]);
    const b0 = toByte2(h[4], h[5]);
    const a0 = h.length === 8 ? toByte2(h[6], h[7]) : 255;
    if (r0 == null || g0 == null || b0 == null || a0 == null) return null;
    r = r0;
    g = g0;
    b = b0;
    a = a0;
  }

  return [r / 255, g / 255, b / 255, a / 255];
}

function _parseColorStop(c) {
  if (c == null) return [1, 1, 1, 1];

  if (typeof c === "string") {
    const x = _hexToRGBA01(c);
    return x || [1, 1, 1, 1];
  }

  if (Array.isArray(c)) {
    const r0 = +c[0];
    const g0 = +c[1];
    const b0 = +c[2];
    const a0 = c.length > 3 ? +c[3] : 1;
    const maxv = Math.max(r0, g0, b0, a0);
    const scale = maxv > 1.5 ? 1 / 255 : 1;
    return [
      _clamp01(r0 * scale),
      _clamp01(g0 * scale),
      _clamp01(b0 * scale),
      _clamp01(a0 * scale),
    ];
  }

  if (typeof c === "object") {
    const r0 = +c.r;
    const g0 = +c.g;
    const b0 = +c.b;
    const a0 = "a" in c ? +c.a : 1;
    const maxv = Math.max(r0, g0, b0, a0);
    const scale = maxv > 1.5 ? 1 / 255 : 1;
    return [
      _clamp01(r0 * scale),
      _clamp01(g0 * scale),
      _clamp01(b0 * scale),
      _clamp01(a0 * scale),
    ];
  }

  return [1, 1, 1, 1];
}

function _rgbToHsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;

  let h = 0;
  if (d > 1e-12) {
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  const s = mx <= 1e-12 ? 0 : d / mx;
  const v = mx;
  return [h, s, v];
}

function _hsvToRgb(h, s, v) {
  h = ((h % 1) + 1) % 1;
  s = _clamp01(s);
  v = _clamp01(v);

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    default:
      return [v, p, q];
  }
}

function _lerp(a, b, t) {
  return a + (b - a) * t;
}

export class RenderPipelineGPU {
  /**
   * opts:
   *  - renderUniformStride (default 256)
   *  - initialGridDivs (default 256)
   *  - quadScale (default 1.0)
   *  - canvasAlphaMode (default "premultiplied") -> used by resize()
   *  - gradientSize (default 512)
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

    this._gradientSize = Math.max(2, Math.min(4096, (opts.gradientSize ?? 512) | 0));
    this._gradientTex = null;
    this._gradientView = null;
    this._fallbackGradTex = null;
    this._fallbackGradView = null;

    this._createSharedLayouts();
    this._createRenderPipelines();
    this._createBlitPipelines();

    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    this._renderUBOCapLayers = 0;
    this.renderUniformBuffer = null;
    this._ensureRenderUniformCapacity(1);

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
    this._ensureGradientTexture(this._gradientSize);
    this.setHueGradientWheel({ count: this._gradientSize });

    this._lastCanvasSize = [0, 0];
    this._modelKey = "";
    this._depthView = null;

    this._lastSetChunks = { layersCount: 1, requireSdf: false };

    this.writeThresholdUniform = (p) => this.writeThreshUniform(p);
    this.renderFrame = (p, c) => this.render(p, c);
    this.draw = (p, c) => this.render(p, c);
    this.blitToView = (p, v) => this.renderBlitToView(p, v);
  }

  static generateGradientRGBA8(stops, count = 512, opts = {}) {
    const n = Array.isArray(stops) ? stops.length : 0;
    const K = Math.max(2, Math.min(4096, count | 0));

    if (n < 2) {
      const out = new Uint8Array(K * 4);
      for (let i = 0; i < K; ++i) {
        out[i * 4 + 0] = 255;
        out[i * 4 + 1] = 255;
        out[i * 4 + 2] = 255;
        out[i * 4 + 3] = 255;
      }
      return out;
    }

    const space = String(opts.space || "rgb").toLowerCase();
    const cols = new Array(n);
    for (let i = 0; i < n; ++i) cols[i] = _parseColorStop(stops[i]);

    let colsHSV = null;
    if (space === "hsv") {
      colsHSV = new Array(n);
      for (let i = 0; i < n; ++i) {
        const c = cols[i];
        const hsv = _rgbToHsv(c[0], c[1], c[2]);
        colsHSV[i] = [hsv[0], hsv[1], hsv[2], c[3]];
      }
    }

    const out = new Uint8Array(K * 4);
    const denom = K === 1 ? 1 : K - 1;

    for (let i = 0; i < K; ++i) {
      const u = denom ? i / denom : 0;
      const s = u * (n - 1);
      let j = Math.floor(s);
      if (j < 0) j = 0;
      if (j > n - 2) j = n - 2;
      const t = s - j;

      let r = 1,
        g = 1,
        b = 1,
        a = 1;

      if (colsHSV) {
        const c0 = colsHSV[j];
        const c1 = colsHSV[j + 1];

        let h0 = c0[0];
        let h1 = c1[0];
        let dh = h1 - h0;
        if (dh > 0.5) dh -= 1;
        else if (dh < -0.5) dh += 1;

        const h = h0 + dh * t;
        const s2 = _lerp(c0[1], c1[1], t);
        const v2 = _lerp(c0[2], c1[2], t);
        const rgb = _hsvToRgb(h, s2, v2);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
        a = _lerp(c0[3], c1[3], t);
      } else {
        const c0 = cols[j];
        const c1 = cols[j + 1];
        r = _lerp(c0[0], c1[0], t);
        g = _lerp(c0[1], c1[1], t);
        b = _lerp(c0[2], c1[2], t);
        a = _lerp(c0[3], c1[3], t);
      }

      const o = i * 4;
      out[o + 0] = (Math.max(0, Math.min(1, r)) * 255 + 0.5) | 0;
      out[o + 1] = (Math.max(0, Math.min(1, g)) * 255 + 0.5) | 0;
      out[o + 2] = (Math.max(0, Math.min(1, b)) * 255 + 0.5) | 0;
      out[o + 3] = (Math.max(0, Math.min(1, a)) * 255 + 0.5) | 0;
    }

    return out;
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
      const rgb = _hsvToRgb(h, s, v);

      const o = i * 4;
      out[o + 0] = (rgb[0] * 255 + 0.5) | 0;
      out[o + 1] = (rgb[1] * 255 + 0.5) | 0;
      out[o + 2] = (rgb[2] * 255 + 0.5) | 0;
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
    if (this._gradientTex && this._gradientSize === W && this._gradientView) return true;

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

  setHueGradientOverride(stops, count = 512, opts = {}) {
    const n = Array.isArray(stops) ? stops.length : 0;
    const k = Math.max(2, Math.min(10, n | 0));
    if (k < 2) return false;

    const W = Math.max(2, Math.min(4096, count | 0 || 512));
    const rgba = RenderPipelineGPU.generateGradientRGBA8(stops.slice(0, k), W, opts);
    const ok = this._uploadGradientRGBA8(rgba, W);

    if (ok) this._rebuildBg0ForGradientIfNeeded();
    return ok;
  }

  setHueGradientWheel(opts = {}) {
    const W = Math.max(2, Math.min(4096, opts.count | 0 || this._gradientSize || 512));
    const rgba = RenderPipelineGPU.generateHueWheelRGBA8(W, opts);
    const ok = this._uploadGradientRGBA8(rgba, W);

    if (ok) this._rebuildBg0ForGradientIfNeeded();
    return ok;
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

  _pickChunkTex(info, names) {
    for (const n of names) {
      const v = info[n];
      if (v && typeof v.createView === "function") return v;
    }
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

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];

      const fractalView = info._fractalArrayView || info.storageView || info.fractalView || null;
      if (!fractalView) continue;

      try {
        info._renderBg0 = this.device.createBindGroup({
          layout: bgLayout0,
          entries: [
            { binding: 0, resource: fractalView },
            { binding: 1, resource: this.sampler },
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
      } catch {}
    }
  }

  _ensureRenderUniformCapacity(layers) {
    const need = Math.max(1, layers | 0);

    if (this.renderUniformBuffer && (this._renderUBOCapLayers | 0) >= need) return;

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
          visibility: GPUShaderStage.FRAGMENT,
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

    this.renderPipelineDepth = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
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

    this.renderPipelineTransparent = this.device.createRenderPipeline({
      layout: this._pipelineLayout,
      vertex: vstate,
      fragment: {
        module: fsModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
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
    } catch {}

    this.depthTexture = this.device.createTexture({
      size: [pw, ph, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._depthView = null;
    this._lastCanvasSize = [pw, ph];
    this.gridStripes = null;
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
      this._fallbackGradView = this._fallbackGradTex.createView({ dimension: "2d" });
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
    if (this._gradientView) return this._gradientView;
    if (this._fallbackGradView) return this._fallbackGradView;
    if (this._ensureFallbackGradientTexture()) return this._fallbackGradView;
    return null;
  }

  async setChunks(chunks = [], layers = 1, opts = {}) {
    const { requireSdf = false } = opts;

    for (const c of this.chunks) {
      delete c._renderBg0;
      delete c._renderBg1;
      delete c._modelBufIdx;
      delete c._modelData;
      delete c._fractalArrayView;
      delete c._sdfArrayView;
      delete c._flagArrayView;
    }

    this.chunks = chunks || [];

    for (const b of this.modelBuffers) {
      try {
        b.destroy();
      } catch {}
    }

    this.modelBuffers = this.chunks.map(() =>
      this.device.createBuffer({ size: 4 * 20, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
    );

    const bgLayout0 = this._bgLayout0;
    const bgLayout1 = this._bgLayout1;

    const layersCount = Math.max(1, Math.floor(layers || 1));

    this._lastSetChunks = { layersCount, requireSdf: !!requireSdf };

    const gradView = this._getGradientView();
    if (!gradView) {
      throw new Error("RenderPipelineGPU.setChunks: missing gradient view for binding(0,5).");
    }

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];

      info._modelData = new Float32Array(20);

      const fractalTex = info.fractalTex || info.fractalTexture || info.fractal || null;
      const sdfTex = info.sdfTex || info.sdfTexture || info.sdf || null;
      const flagTex = info.flagTex || info.flagTexture || info.flag || null;

      const fractalArrayView =
        this._ensureArrayViewFromTexture(fractalTex, layersCount) ||
        info.storageView ||
        info.fractalView ||
        this._pickChunkArrayView(info, ["fractalViews", "fractalLayerViews", "layerViews"]);

      if (!fractalArrayView) {
        const keys = Object.keys(info);
        const msg = `RenderPipelineGPU.setChunks: chunk[${i}] missing fractal array view. chunk keys: ${keys.join(",")}`;
        console.error(msg, info);
        throw new Error(msg);
      }

      const sdfArrayView = this._ensureArrayViewFromTexture(sdfTex, layersCount) || info.sdfView || this._fallbackSdfView;
      const flagArrayView = this._ensureArrayViewFromTexture(flagTex, layersCount) || info.flagView || this._fallbackFlagView;

      if (requireSdf && (!sdfArrayView || !flagArrayView)) {
        throw new Error(`RenderPipelineGPU.setChunks: chunk[${i}] missing SDF or flag view and requireSdf=true.`);
      }

      info._fractalArrayView = fractalArrayView;
      info._sdfArrayView = sdfArrayView;
      info._flagArrayView = flagArrayView;

      info._renderBg0 = this.device.createBindGroup({
        layout: bgLayout0,
        entries: [
          { binding: 0, resource: fractalArrayView },
          { binding: 1, resource: this.sampler },
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
        console.error("setChunks: createBindGroup(bg1) failed for chunk", i, e);
        info._renderBg1 = null;
      }

      info._modelBufIdx = i;
    }

    this._modelKey = "";
  }

  updateCamera(cam, aspect) {
    const proj = glmath.perspective(cam.fov, aspect, 0.01, 10000.0);
    const view = glmath.lookAt(cam.cameraPos, cam.lookTarget, cam.upDir);
    const viewProj = glmath.mulMat(proj, view);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
  }

  writeRenderUniform(paramsState = {}, dstByteOffset = 0) {
    const defaults = {
      layerIndex: 0,
      scheme: 0,
      useHueGradient: false,
      dispMode: 0,

      bowlOn: false,
      lightingOn: false,
      dispLimitOn: false,
      alphaMode: 0,

      hueOffset: 0.0,
      dispAmp: 0.15,
      dispCurve: 3.0,
      bowlDepth: 0.25,

      quadScale: 1.0,
      gridSize: 512,
      slopeLimit: 0.5,
      wallJump: 0.05,

      lightPos: [0.0, 0.0, 5.0],
      specPower: 32.0,

      worldOffset: 0.0,
      worldStart: 0.0,
    };

    const p = Object.assign({}, defaults, paramsState);
    const lp = Array.isArray(p.lightPos) ? p.lightPos : defaults.lightPos;

    const useHueGradient =
      p.useHueGradient != null
        ? !!p.useHueGradient
        : p.hueGradientOn != null
          ? !!p.hueGradientOn
          : p.hueGradient != null
            ? !!p.hueGradient
            : false;

    const worldOffset =
      p.worldOffset != null
        ? +p.worldOffset
        : p.layerSeparation != null
          ? +p.layerSeparation
          : p.layerSpacing != null
            ? +p.layerSpacing
            : p.layerStep != null
              ? +p.layerStep
              : p.layerOffset != null
                ? +p.layerOffset
                : 0.0;

    const worldStart =
      p.worldStart != null
        ? +p.worldStart
        : p.layerStart != null
          ? +p.layerStart
          : p.layerBase != null
            ? +p.layerBase
            : 0.0;

    const buf = new ArrayBuffer(96);
    const dv = new DataView(buf);

    dv.setUint32(0, p.layerIndex >>> 0, true);
    dv.setUint32(4, p.scheme >>> 0, true);
    dv.setUint32(8, useHueGradient ? 1 : 0, true);
    dv.setUint32(12, p.dispMode >>> 0, true);

    dv.setUint32(16, p.bowlOn ? 1 : 0, true);
    dv.setUint32(20, p.lightingOn ? 1 : 0, true);
    dv.setUint32(24, p.dispLimitOn ? 1 : 0, true);
    dv.setUint32(28, p.alphaMode >>> 0, true);

    dv.setFloat32(32, +p.hueOffset || 0.0, true);
    dv.setFloat32(36, +p.dispAmp || 0.0, true);
    dv.setFloat32(40, +p.dispCurve || 0.0, true);
    dv.setFloat32(44, +p.bowlDepth || 0.0, true);

    dv.setFloat32(48, +p.quadScale || 0.0, true);
    dv.setFloat32(52, +p.gridSize || 0.0, true);
    dv.setFloat32(56, +p.slopeLimit || 0.0, true);
    dv.setFloat32(60, +p.wallJump || 0.0, true);

    dv.setFloat32(64, +(lp[0] ?? 0.0), true);
    dv.setFloat32(68, +(lp[1] ?? 0.0), true);
    dv.setFloat32(72, +(lp[2] ?? 0.0), true);
    dv.setFloat32(76, +p.specPower || 0.0, true);

    dv.setFloat32(80, Number.isFinite(worldOffset) ? worldOffset : 0.0, true);
    dv.setFloat32(84, Number.isFinite(worldStart) ? worldStart : 0.0, true);
    dv.setFloat32(88, 0.0, true);
    dv.setFloat32(92, 0.0, true);

    this.device.queue.writeBuffer(this.renderUniformBuffer, dstByteOffset >>> 0, buf);
  }

  writeThreshUniform(paramsState = {}) {
    const defaults = { lowT: 0.0, highT: 1.0, basis: 0.0 };
    const p = Object.assign({}, defaults, paramsState);
    this.device.queue.writeBuffer(this.threshBuf, 0, new Float32Array([p.lowT, p.highT, p.basis, 0]));
  }

  _updateModelBuffersIfNeeded(paramsState) {
    const gridSize = _isFiniteNum(paramsState.gridSize) ? +paramsState.gridSize : 512;
    const quadScale = _isFiniteNum(paramsState.quadScale) ? +paramsState.quadScale : this.quadScale;

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

      data[0] = w; data[1] = 0; data[2] = 0; data[3] = 0;
      data[4] = 0; data[5] = h; data[6] = 0; data[7] = 0;
      data[8] = 0; data[9] = 0; data[10] = 1; data[11] = 0;
      data[12] = x; data[13] = y; data[14] = 0; data[15] = 1;

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

  async render(paramsState, camState) {
    const aspect =
      this._lastCanvasSize[0] && this._lastCanvasSize[1]
        ? this._lastCanvasSize[0] / this._lastCanvasSize[1]
        : 1;

    this.updateCamera(camState, aspect);

    const nLayers = Math.max(1, Math.floor(paramsState.nLayers ?? paramsState.layers ?? 1));
    const alphaMode = paramsState.alphaMode ?? 0;

    this._ensureRenderUniformCapacity(nLayers);

    this.writeThreshUniform(paramsState);

    if (!this.gridStripes) {
      this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
    }

    this._updateModelBuffersIfNeeded(paramsState);

    const encoder = this.device.createCommandEncoder();
    const viewTex = this.context.getCurrentTexture().createView();

    if (!this._depthView) this._depthView = this.depthTexture.createView();

    const useTransparent = alphaMode === 1 || alphaMode === 2;

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: viewTex,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      depthStencilAttachment: {
        view: this._depthView,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    });

    pass.setPipeline(useTransparent ? this.renderPipelineTransparent : this.renderPipelineOpaque);

    for (let layer = nLayers - 1; layer >= 0; --layer) {
      const dyn = (layer * this.renderUniformStride) >>> 0;

      this.writeRenderUniform(Object.assign({}, paramsState, { layerIndex: layer }), dyn);

      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];

        const bg0 = info._renderBg0;
        if (!bg0) continue;
        pass.setBindGroup(0, bg0, [dyn]);

        const bg1 = info._renderBg1;
        if (!bg1) continue;
        pass.setBindGroup(1, bg1);

        for (const stripe of this.gridStripes) {
          pass.setVertexBuffer(0, stripe.vbuf);
          pass.setIndexBuffer(stripe.ibuf, "uint32");
          pass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
        }
      }
    }

    pass.end();

    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async renderBlitToView(paramsState, colorView) {
    this._ensureRenderUniformCapacity(1);

    this.writeRenderUniform(paramsState, 0);
    this.writeThreshUniform(paramsState);

    if (!this.gridStripes) {
      this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
    }

    this._updateModelBuffersIfNeeded(paramsState);

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

    rpass.setPipeline(this.renderPipelineBlitOpaque);

    for (let i = 0; i < this.chunks.length; ++i) {
      const info = this.chunks[i];

      const bg0 = info._renderBg0;
      if (!bg0) continue;
      rpass.setBindGroup(0, bg0, [0]);

      const bg1 = info._renderBg1;
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
  }
}

export default RenderPipelineGPU;
