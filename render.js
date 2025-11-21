// initRender.js
// SDF compute only when needed: displacement OR lighting; auto-free SDF/flag textures when SDFs are not required
// nLayers support: compute multi-layer fractal arrays; no per-layer SDFs when nLayers > 1

import { FractalTileComputeGPU } from "./shaders/fractalCompute.js";
import { SdfComputeGPU } from "./shaders/fsdfCompute.js";
import { RenderPipelineGPU } from "./shaders/fractalRender.js";
import { QueryComputeGPU } from "./shaders/fheightQueryCompute.js";

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
    nLayers: undefined,
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
    lightingOn: false,
    lightPos: [0, 0, 5],
    specPower: 32.0,
    lowT: 0.0,
    highT: 1.0,
    alphaMode: 0,
    basis: 0,
    normalMode: 2,
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
  gamma: F.C,
  epsilon: F.C,
  convergenceTest: F.C,
  escapeMode: F.C,

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

  hueOffset: F.R,
  scheme: F.R,
  colorScheme: F.R,
  lightingOn: F.R | F.D,
  lightPos: F.R,
  specPower: F.R,
  dispLimitOn: F.R,
  gridDivs: F.R | F.G,

  lowT: F.R,
  highT: F.R,
  basis: F.R,
};

const pending = { paramsState: {} };
let dirtyBits = 0;

export function setState(partial) {
  Object.assign(pending.paramsState, partial);
  for (const k in partial) dirtyBits |= DIRTY_MAP[k] || 0;
}

function flushPending() {
  if (!dirtyBits) return;
  Object.assign(renderGlobals.paramsState, pending.paramsState);
  pending.paramsState = {};
  renderGlobals.computeDirty ||= !!(dirtyBits & F.C);
  renderGlobals.displacementDirty ||= !!(dirtyBits & F.D);
  renderGlobals.cameraDirty ||= !!(dirtyBits & F.R);
  renderGlobals.gridDirty ||= !!(dirtyBits & F.G);
  dirtyBits = 0;
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

/* ======================================================================
   Main initRender
   ====================================================================== */
export async function initRender() {
  const canvas = document.getElementById("gpu-canvas");
  const device = await initWebGPU();
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();

  function parseAlphaModeToNumeric(mode) {
    if (mode === undefined || mode === null) {
      return Number(renderGlobals.paramsState.alphaMode || 0);
    }
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

  const initialNumeric =
    typeof window !== "undefined" && window.__pendingAlphaMode !== undefined
      ? parseAlphaModeToNumeric(window.__pendingAlphaMode)
      : parseAlphaModeToNumeric(renderGlobals.paramsState.alphaMode);
  renderGlobals.paramsState.alphaMode = initialNumeric;
  let currentAlphaMode = canvasAlphaStringForNumeric(initialNumeric);

  window.setAlphaMode = function setAlphaMode(mode) {
    const numeric = parseAlphaModeToNumeric(mode);
    renderGlobals.paramsState.alphaMode = numeric;
    const newCanvasMode = canvasAlphaStringForNumeric(numeric);
    if (newCanvasMode !== currentAlphaMode) {
      currentAlphaMode = newCanvasMode;
      window.__currentCanvasAlphaMode = currentAlphaMode;
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
    }
    renderGlobals.cameraDirty = true;
    renderGlobals.gridDirty = true;
  };

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

  const fractalCompute = new FractalTileComputeGPU(
    device,
    undefined,
    undefined,
    uniformStride,
  );
  const sdfCompute = new SdfComputeGPU(device, uniformStride);
  const renderPipeline = new RenderPipelineGPU(
    device,
    context,
    undefined,
    undefined,
    {
      renderUniformStride: 256,
      initialGridDivs: renderGlobals.paramsState.gridDivs,
      quadScale: renderGlobals.paramsState.quadScale,
    },
  );

  const queryCompute = new QueryComputeGPU(
    device,
    undefined,
    renderPipeline.sampler,
    renderPipeline.renderUniformBuffer,
    {
      uniformQuerySize: 16,
      queryResultBytes: 280,
    },
  );

  let chunkInfos = [];
  let sdfReady = false;
  let resizeTimer = 0;
  let frameHandle = 0;
  let exporting = false;

  function requestedLayers() {
    return Math.max(
      1,
      Math.floor(
        renderGlobals.paramsState.nLayers ??
          renderGlobals.paramsState.layers ??
          1,
      ),
    );
  }

  function availableFractalLayers(chunks = []) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 1;
    let maxLayers = 1;
    for (const c of chunks) {
      if (Array.isArray(c.fractalLayerViews) && c.fractalLayerViews.length) {
        maxLayers = Math.max(maxLayers, c.fractalLayerViews.length);
      } else if (Array.isArray(c.layerViews) && c.layerViews.length) {
        maxLayers = Math.max(maxLayers, c.layerViews.length);
      } else if (c.fractalView) {
        maxLayers = Math.max(maxLayers, 1);
      }
    }
    return Math.max(1, maxLayers);
  }

  function effectiveSplitCount(requestedSplit) {
    const req = Math.max(1, Math.floor(requestedSplit || 0));
    const eff = Math.min(req, MAX_PIXELS_PER_CHUNK);
    if (eff !== req) {
      console.debug(
        "splitCount clamped: requested=" + req + ", effective=" + eff,
      );
    }
    return eff;
  }

  async function computeFractalLayer(layerIndex, aspect = 1) {
    let requested = Math.max(
      1,
      Math.floor(renderGlobals.paramsState.splitCount || 0),
    );
    let eff = Math.min(requested, MAX_PIXELS_PER_CHUNK);
    eff = Math.max(eff, MIN_SPLIT);
    while (true) {
      try {
        const params = Object.assign({}, renderGlobals.paramsState, {
          splitCount: eff,
        });
        const chunks = await fractalCompute.compute(params, layerIndex, aspect);
        chunkInfos = chunks || [];
        for (const c of chunkInfos) {
          if (!c.fractalView && c.layerViews && c.layerViews[0]) {
            c.fractalView = c.layerViews[0];
          }
        }
        sdfReady = false;
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
                  usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST,
                }),
              },
            ];
            chunkInfos[0].fractalView = chunkInfos[0].fractalTex.createView({
              dimension: "2d",
            });
          }
          return chunkInfos;
        }
        const next = Math.max(MIN_SPLIT, Math.floor(eff / 2));
        eff = next === eff ? MIN_SPLIT : next;
      }
    }
  }

  async function computeFractalLayerSeries(count, aspect = 1) {
    count = Math.max(1, count >>> 0);
    const params = Object.assign({}, renderGlobals.paramsState, {
      splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
    });

    let seriesChunks;
    if (typeof fractalCompute.computeLayerSeries === "function") {
      const gammaStart = 1.0;
      const gammaRange = 0.0;
      seriesChunks = await fractalCompute.computeLayerSeries(
        params,
        gammaStart,
        gammaRange,
        count,
        aspect,
        "main",
      );
    } else {
      const merged = new Map();
      for (let li = 0; li < count; ++li) {
        const chunks = await fractalCompute.compute(
          params,
          li,
          aspect,
          "main",
          count,
        );
        for (const c of chunks) {
          const key = `${c.offsetX}|${c.offsetY}|${c.width}|${c.height}`;
          let dst = merged.get(key);
          if (!dst) {
            dst = Object.assign({}, c);
            dst.fractalLayerViews = [];
            merged.set(key, dst);
          }
          const view =
            c.fractalView || (c.layerViews && c.layerViews[0]) || null;
          dst.fractalLayerViews[li] = view;
        }
      }
      seriesChunks = Array.from(merged.values());
    }

    chunkInfos = (seriesChunks || []).map((c) => {
      const out = Object.assign({}, c);
      out.fractalLayerViews = out.fractalLayerViews || out.layerViews || [];
      if (!out.fractalView) out.fractalView = out.fractalLayerViews[0] || null;
      return out;
    });

    sdfReady = false;
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
      });
      await sdfCompute.compute(chunkInfos, params, layerIndex, aspect);
      await device.queue.onSubmittedWorkDone();
      sdfReady = true;
      if (queryCompute._bgCache) queryCompute._bgCache.clear();
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;

      const req = requestedLayers();
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      await renderPipeline.setChunks(chunkInfos, layersToUse);
      return chunkInfos;
    } catch (err) {
      sdfReady = false;
      console.warn("computeSdfLayer: SDF compute failed:", err);
      for (const c of chunkInfos) {
        try {
          if (
            (c.sdfView ||
              (c.sdfLayerViews && c.sdfLayerViews[layerIndex])) &&
            (c.flagView ||
              (c.flagLayerViews && c.flagLayerViews[layerIndex]))
          ) {
            continue;
          }
          if (!c._tmpSdfTex) {
            c._tmpSdfTex = device.createTexture({
              size: [1, 1, 1],
              format: "rgba16float",
              usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST,
            });
          }
          if (!c._tmpFlagTex) {
            c._tmpFlagTex = device.createTexture({
              size: [1, 1, 1],
              format: "r32uint",
              usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST,
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
          console.warn(
            "computeSdfLayer: temporary fallback creation failed for chunk:",
            c,
            e2,
          );
        }
      }
      try {
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const req = requestedLayers();
        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
        await renderPipeline.setChunks(chunkInfos, layersToUse);
      } catch (ebg) {
        console.warn(
          "computeSdfLayer: renderPipeline.setChunks failed even with fallbacks:",
          ebg,
        );
      }
      return chunkInfos;
    }
  }

  function cleanupTempFallbacks(chunks = []) {
    for (const c of chunks) {
      if (c._tmpSdfTex) {
        try {
          c._tmpSdfTex.destroy();
        } catch (e) {}
        delete c._tmpSdfTex;
      }
      if (c._tmpFlagTex) {
        try {
          c._tmpFlagTex.destroy();
        } catch (e) {}
        delete c._tmpFlagTex;
      }
      if (c._usingTmpSdfFallback) delete c._usingTmpSdfFallback;
    }
  }

  function needsSdf(params = renderGlobals.paramsState) {
    return !!(params.dispMode && params.dispMode !== 0) || !!params.lightingOn;
  }

  function chunksWithoutSdf(chunks = []) {
    return (chunks || []).map((c) => {
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
  }

  function freeSdfData(chunks = []) {
    for (const c of chunks) {
      try {
        if (c.sdfTex) {
          try {
            c.sdfTex.destroy();
          } catch (e) {}
        }
      } catch (e) {}
      try {
        if (c.flagTex) {
          try {
            c.flagTex.destroy();
          } catch (e) {}
        }
      } catch (e) {}
      try {
        if (c._tmpSdfTex) {
          try {
            c._tmpSdfTex.destroy();
          } catch (e) {}
        }
      } catch (e) {}
      try {
        if (c._tmpFlagTex) {
          try {
            c._tmpFlagTex.destroy();
          } catch (e) {}
        }
      } catch (e) {}

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
  }

  async function handleResizeImmediate() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const pw = Math.floor(cw * (window.devicePixelRatio || 1));
    const ph = Math.floor(ch * (window.devicePixelRatio || 1));
    canvas.width = pw;
    canvas.height = ph;
    context.configure({
      device,
      format,
      alphaMode: currentAlphaMode,
      size: [pw, ph],
    });
    renderPipeline.resize(cw, ch);
    renderGlobals.computeDirty = true;
    renderGlobals.displacementDirty = true;
    renderGlobals.cameraDirty = true;
    renderGlobals.gridDirty = true;
    const aspect = pw / ph || 1;

    try {
      const req = requestedLayers();
      if (req > 1) {
        await computeFractalLayerSeries(req, aspect);
        freeSdfData(chunkInfos);
        const layersToUse = Math.min(
          req,
          availableFractalLayers(chunkInfos),
        );
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const chunksToUse = chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(chunksToUse, layersToUse);
        sdfReady = false;
        renderGlobals.displacementDirty = false;
      } else {
        await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
        if (needsSdf(renderGlobals.paramsState)) {
          await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
        } else {
          freeSdfData(chunkInfos);
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const noSdfChunks = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(noSdfChunks, 1);
          sdfReady = false;
        }
      }

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
      handleResizeImmediate().catch((e) =>
        console.error("debounced resize failed:", e),
      );
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
    pitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, pitch - e.movementY * 0.002),
    );
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

  async function renderFrame() {
    const req = requestedLayers();
    const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
    const localParams = Object.assign({}, renderGlobals.paramsState, {
      nLayers: layersToUse,
    });

    renderPipeline.writeRenderUniform(localParams);
    renderPipeline.writeThreshUniform(localParams);

    if (renderGlobals.gridDirty) {
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
      renderPipeline.gridStripes = null;
      renderGlobals.gridDirty = false;
    }

    const chunksToUse = sdfReady ? chunkInfos : chunksWithoutSdf(chunkInfos);
    await renderPipeline.setChunks(chunksToUse, layersToUse);

    const camState = { cameraPos, lookTarget, upDir, fov };
    await renderPipeline.render(localParams, camState);
    await device.queue.onSubmittedWorkDone();
  }

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
  }

  async function updateComputeAndDisplacement(aspect) {
    if (renderGlobals.computeDirty) {
      const req = requestedLayers();

      if (req > 1) {
        await computeFractalLayerSeries(req, aspect);
        freeSdfData(chunkInfos);
        const layersToUse = Math.min(
          req,
          availableFractalLayers(chunkInfos),
        );
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const chunksToUse = chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(chunksToUse, layersToUse);
        sdfReady = false;
      } else {
        await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
        if (needsSdf(renderGlobals.paramsState)) {
          await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
        } else {
          freeSdfData(chunkInfos);
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const noSdfChunks = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(noSdfChunks, 1);
          sdfReady = false;
        }
      }

      renderGlobals.computeDirty = false;
      renderGlobals.displacementDirty = false;
      renderGlobals.cameraDirty = true;
    } else if (renderGlobals.displacementDirty) {
      const req = requestedLayers();

      if (req > 1) {
        freeSdfData(chunkInfos);
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const layersToUse = Math.min(
          req,
          availableFractalLayers(chunkInfos),
        );
        const chunksToUse = chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(chunksToUse, layersToUse);
        sdfReady = false;
      } else {
        if (needsSdf(renderGlobals.paramsState)) {
          await computeSdfLayer(
            renderGlobals.paramsState.layerIndex,
            aspect,
          );
        } else {
          freeSdfData(chunkInfos);
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const noSdfChunks = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(noSdfChunks, 1);
          sdfReady = false;
        }
      }
      renderGlobals.displacementDirty = false;
      renderGlobals.cameraDirty = true;
    }
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

    const aspect =
      canvas.width > 0 && canvas.height > 0
        ? canvas.width / canvas.height
        : 1.0;

    await updateComputeAndDisplacement(aspect);

    if (await updateMovement(dt)) renderGlobals.cameraDirty = true;
    if (renderGlobals.cameraDirty) {
      await renderFrame();
      renderGlobals.cameraDirty = false;
    }
    frameHandle = requestAnimationFrame(frame);
  }

  // --------------------------------------------------------------------
  // PNG export helpers
  // --------------------------------------------------------------------
  function downloadBlob(blob, filename) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function canvasToPngBlob(canvasEl) {
    return new Promise((resolve, reject) => {
      try {
        canvasEl.toBlob((blob) => {
          if (!blob) {
            reject(new Error("canvas.toBlob returned null"));
          } else {
            resolve(blob);
          }
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

  // Full-res render into an offscreen texture using the same chunk layout
  // and a blit-style vertex shader that maps the atlas to clip space.
  async function renderFullResToTexture(targetTexture, paramsState, targetSize) {
    await device.queue.onSubmittedWorkDone();

    const camState = { cameraPos, lookTarget, upDir, fov };
    const aspect = 1.0;
    if (typeof renderPipeline.updateCamera === "function") {
      renderPipeline.updateCamera(camState, aspect);
    }

    const nLayers = Math.max(
      1,
      Math.floor(paramsState.nLayers ?? paramsState.layers ?? 1),
    );

    if (!renderPipeline.gridStripes) {
      const req = requestedLayers();
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      const localParams = Object.assign({}, renderGlobals.paramsState, {
        nLayers: layersToUse,
      });
      renderPipeline.writeRenderUniform(localParams);
      renderPipeline.writeThreshUniform(localParams);
      const chunksToUse = sdfReady ? chunkInfos : chunksWithoutSdf(chunkInfos);
      await renderPipeline.setChunks(chunksToUse, layersToUse);
      await renderPipeline.render(localParams, camState);
      await device.queue.onSubmittedWorkDone();
    }

    const encoder = device.createCommandEncoder();
    const viewTex = targetTexture.createView();

    const depthTex = device.createTexture({
      size: [targetSize, targetSize, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const depthView = depthTex.createView();

    const texelWorld = (2 * paramsState.quadScale) / paramsState.gridSize;

    for (let i = 0; i < renderPipeline.chunks.length; ++i) {
      const info = renderPipeline.chunks[i];
      const modelBuf = renderPipeline.modelBuffers[i];
      if (!info || !modelBuf) continue;

      const w = info.width * texelWorld;
      const h = info.height * texelWorld;
      const x = -paramsState.quadScale + info.offsetX * texelWorld;
      const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;

      const modelMat = new Float32Array([
        w, 0, 0, 0,
        0, h, 0, 0,
        0, 0, 1, 0,
        x, y, 0, 1,
      ]);
      const u0 = info.offsetX / paramsState.gridSize;
      const v0 = 0;
      const su = info.width / paramsState.gridSize;
      const sv = 1;
      const uvOS = new Float32Array([u0, v0, su, sv]);

      device.queue.writeBuffer(modelBuf, 0, modelMat);
      device.queue.writeBuffer(modelBuf, 64, uvOS);
    }

    const getBg0ForLayer = (info, layer) => {
      if (info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)) {
        return info._renderBg0PerLayer.get(layer);
      }
      return info._renderBg0;
    };
    const getBg1 = (info) => info._renderBg1;

    const orderedLayers = [];
    for (let l = nLayers - 1; l >= 0; --l) orderedLayers.push(l);

    renderPipeline.writeThreshUniform(paramsState);

    const alphaMode = paramsState.alphaMode ?? 0;

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
          view: depthView,
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1,
        },
      });

      prepass.setPipeline(renderPipeline.renderPipelineDepth);

      for (const layer of orderedLayers) {
        const layerParams = Object.assign({}, paramsState, {
          layerIndex: layer,
        });
        renderPipeline.writeRenderUniform(layerParams);

        for (let i = 0; i < renderPipeline.chunks.length; ++i) {
          const info = renderPipeline.chunks[i];
          const bg0 = getBg0ForLayer(info, layer);
          const bg1 = getBg1(info);
          if (!bg0 || !bg1) continue;

          prepass.setBindGroup(0, bg0);
          prepass.setBindGroup(1, bg1);

          for (const stripe of renderPipeline.gridStripes) {
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
          view: depthView,
          depthLoadOp: "load",
          depthStoreOp: "store",
        },
      });

      blendPass.setPipeline(renderPipeline.renderPipelineTransparent);

      for (const layer of orderedLayers) {
        const layerParams = Object.assign({}, paramsState, {
          layerIndex: layer,
        });
        renderPipeline.writeRenderUniform(layerParams);

        for (let i = 0; i < renderPipeline.chunks.length; ++i) {
          const info = renderPipeline.chunks[i];
          const bg0 = getBg0ForLayer(info, layer);
          const bg1 = getBg1(info);
          if (!bg0 || !bg1) continue;

          blendPass.setBindGroup(0, bg0);
          blendPass.setBindGroup(1, bg1);

          for (const stripe of renderPipeline.gridStripes) {
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
          view: depthView,
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1,
        },
      });

      rpass.setPipeline(renderPipeline.renderPipelineOpaque);

      for (const layer of orderedLayers) {
        const layerParams = Object.assign({}, paramsState, {
          layerIndex: layer,
        });
        renderPipeline.writeRenderUniform(layerParams);

        for (let i = 0; i < renderPipeline.chunks.length; ++i) {
          const info = renderPipeline.chunks[i];
          const bg0 = getBg0ForLayer(info, layer);
          const bg1 = getBg1(info);
          if (!bg0 || !bg1) continue;

          rpass.setBindGroup(0, bg0);
          rpass.setBindGroup(1, bg1);

          for (const stripe of renderPipeline.gridStripes) {
            rpass.setVertexBuffer(0, stripe.vbuf);
            rpass.setIndexBuffer(stripe.ibuf, "uint32");
            rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
          }
        }
      }

      rpass.end();
    }

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    try {
      depthTex.destroy();
    } catch (e) {}
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

      const targetRes = Math.max(
        64,
        Math.floor(renderGlobals.paramsState.gridSize || 1024),
      );

      const exportAspect = 1.0;
      await updateComputeAndDisplacement(exportAspect);

      const captureTexture = device.createTexture({
        size: [targetRes, targetRes, 1],
        format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });

      const reqLayers = requestedLayers();
      const layersToUse = Math.min(
        reqLayers,
        availableFractalLayers(chunkInfos),
      );

      const paramsForExport = Object.assign({}, renderGlobals.paramsState, {
        nLayers: layersToUse,
      });

      await renderFullResToTexture(captureTexture, paramsForExport, targetRes);

      const bytesPerPixel = 4;
      const bytesPerRow = ((targetRes * bytesPerPixel + 255) & ~255);
      const bufferSize = bytesPerRow * targetRes;

      const readBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      const encoder = device.createCommandEncoder();
      encoder.copyTextureToBuffer(
        { texture: captureTexture },
        {
          buffer: readBuffer,
          bytesPerRow,
          rowsPerImage: targetRes,
        },
        { width: targetRes, height: targetRes, depthOrArrayLayers: 1 },
      );
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();

      await readBuffer.mapAsync(GPUMapMode.READ);
      const mapped = readBuffer.getMappedRange();
      const src = new Uint8Array(mapped);
      const pixels = new Uint8ClampedArray(
        targetRes * targetRes * bytesPerPixel,
      );

      const isBGRA = format === "bgra8unorm";

      let dst = 0;
      for (let y = 0; y < targetRes; y++) {
        const rowStart = y * bytesPerRow;
        for (let x = 0; x < targetRes; x++) {
          const si = rowStart + x * 4;
          if (isBGRA) {
            pixels[dst++] = src[si + 2];
            pixels[dst++] = src[si + 1];
            pixels[dst++] = src[si + 0];
            pixels[dst++] = src[si + 3];
          } else {
            pixels[dst++] = src[si + 0];
            pixels[dst++] = src[si + 1];
            pixels[dst++] = src[si + 2];
            pixels[dst++] = src[si + 3];
          }
        }
      }

      readBuffer.unmap();
      readBuffer.destroy();
      captureTexture.destroy();

      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = targetRes;
      tmpCanvas.height = targetRes;
      const ctx2d = tmpCanvas.getContext("2d");
      if (!ctx2d) throw new Error("No 2D context for full-res capture");
      const imageData = new ImageData(pixels, targetRes, targetRes);
      ctx2d.putImageData(imageData, 0, 0);

      const blob = await canvasToPngBlob(tmpCanvas);
      const tag = randomTag();
      downloadBlob(blob, "fractal-" + targetRes + "-" + tag + ".png");
    } catch (e) {
      console.error("exportFractalFullRes failed:", e);
    } finally {
      exporting = false;
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
    context.configure({
      device,
      format,
      alphaMode: currentAlphaMode,
      size: [pw, ph],
    });
    renderPipeline.resize(cw, ch);
    renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
    renderPipeline.gridStripes = null;
    const aspect = pw / ph || 1;

    const req = requestedLayers();
    if (req > 1) {
      await computeFractalLayerSeries(req, aspect);
      freeSdfData(chunkInfos);
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
      const chunksToUse = chunksWithoutSdf(chunkInfos);
      await renderPipeline.setChunks(chunksToUse, layersToUse);
      sdfReady = false;
      renderGlobals.displacementDirty = false;
    } else {
      await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
      if (needsSdf(renderGlobals.paramsState)) {
        await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
        renderGlobals.displacementDirty = false;
      } else {
        freeSdfData(chunkInfos);
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const noSdfChunks = chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(noSdfChunks, 1);
        sdfReady = false;
      }
    }

    cleanupTempFallbacks(chunkInfos);
    await renderFrame();

    renderGlobals.computeDirty = false;
    renderGlobals.cameraDirty = false;
    renderGlobals.displacementDirty = false;
  }

  if (typeof window !== "undefined") {
    window.exportFractalCanvas = exportFractalCanvas;
    window.exportFractalFullRes = exportFractalFullRes;
    window.__fractalRuntime = {
      device,
      context,
      renderPipeline,
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
    renderPipeline,
    queryCompute,
    destroy: () => {
      try {
        cancelAnimationFrame(frameHandle);
      } catch (e) {}
      try {
        fractalCompute.destroy();
      } catch (e) {}
      try {
        sdfCompute.destroy(chunkInfos || []);
      } catch (e) {}
      try {
        renderPipeline.destroy();
      } catch (e) {}
      try {
        if (chunkInfos && chunkInfos.forEach) {
          chunkInfos.forEach((c) => {
            try {
              if (c.fractalTex) c.fractalTex.destroy();
            } catch (e) {}
            try {
              if (c.sdfTex) c.sdfTex.destroy();
            } catch (e) {}
            try {
              if (c.flagTex) c.flagTex.destroy();
            } catch (e) {}
            try {
              if (c._tmpSdfTex) c._tmpSdfTex.destroy();
            } catch (e) {}
            try {
              if (c._tmpFlagTex) c._tmpFlagTex.destroy();
            } catch (e) {}
          });
        }
      } catch (e) {}
    },
  };
}
