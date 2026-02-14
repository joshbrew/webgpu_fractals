// ui.js
import componentHTML from "./shaders/fractalComponent.html";
import "./style.css";
import { renderGlobals, setState } from "./render";

export const initUI = () => {
  document.body.insertAdjacentHTML("afterbegin", componentHTML);

  const ui = document.getElementById("ui");
  const button = document.getElementById("toggle-ui");
  if (button && ui) {
    button.addEventListener("click", () => {
      const isCollapsed = ui.classList.toggle("collapsed");
      button.textContent = isCollapsed ? "+" : "-";
    });
    const hdr = ui.querySelector(".ui-header");
    if (hdr) {
      hdr.addEventListener("click", (e) => {
        if (e.target !== button) button.click();
      });
    }
  }

  const resetCameraBtn = document.getElementById("resetCameraBtn");
  if (resetCameraBtn) {
    resetCameraBtn.addEventListener("click", () => {
      if (typeof window.resetViewCamera === "function") {
        window.resetViewCamera();
      }
    });
  }

  const exportFullBtn = document.getElementById("exportFullBtn");
  if (exportFullBtn) {
    exportFullBtn.addEventListener("click", () => {
      if (typeof window.exportFractalFullRes === "function") {
        window.exportFractalFullRes();
      }
    });
  }

  const exportCanvasBtn = document.getElementById("exportCanvasBtn");
  if (exportCanvasBtn) {
    exportCanvasBtn.addEventListener("click", () => {
      if (typeof window.exportFractalCanvas === "function") {
        window.exportFractalCanvas();
      }
    });
  }

  const LIVE_IDS = new Set([
    "epsilon",
    "dispAmp",
    "zoom",
    "dx",
    "dy",
    "gamma",
    "layerGammaStep",
    "layerSeparation",
    "hueOffset",
    "dispCurve",
    "bowlDepth",
    "quadScale",
    "lightX",
    "lightY",
    "lightZ",
    "specPower",
    "lowThresh",
    "highThresh",
    "thresholdBasis",
    "slopeLimit",
    "wallJump",
    "nLayers",
    "gridDivs",
  ]);

  const FORMATTERS = {
    epsilon: (v) => Number(v).toExponential(),
    dispAmp: (v) => Number(v).toFixed(2),
    zoom: (v) => Number(v).toFixed(2),
    dx: (v) => Number(v).toFixed(2),
    dy: (v) => Number(v).toFixed(2),
    gamma: (v) => Number(v).toFixed(4),
    layerGammaStep: (v) => Number(v).toFixed(4),
    layerSeparation: (v) => Number(v).toFixed(3),
    hueOffset: (v) => Number(v).toFixed(2),
    dispCurve: (v) => Number(v).toFixed(2),
    bowlDepth: (v) => Number(v).toFixed(2),
    lowThresh: (v) => Number(v).toFixed(2),
    highThresh: (v) => Number(v).toFixed(2),
    thresholdBasis: (v) => String(v),
    wallJump: (v) => Number(v).toFixed(3),
    nLayers: (v) => String(Math.round(Number(v))),
    gridDivs: (v) => String(Math.round(Number(v))),
  };

  const DEFAULT_FORMATTER = (v) => String(Math.round(Number(v)));

  const ID_TO_PARAM = {
    lowThresh: "lowT",
    highThresh: "highT",
    thresholdBasis: "basis",

    lightX: "lightPos",
    lightY: "lightPos",
    lightZ: "lightPos",

    splitCount: "splitCount",
    gridSize: "gridSize",
    maxIter: "maxIter",

    specPower: "specPower",
    dispAmp: "dispAmp",
    dispCurve: "dispCurve",
    bowlDepth: "bowlDepth",
    quadScale: "quadScale",
    wallJump: "wallJump",
    slopeLimit: "slopeLimit",

    zoom: "zoom",
    dx: "dx",
    dy: "dy",
    gamma: "gamma",
    layerGammaStep: "layerGammaStep",

    hueOffset: "hueOffset",
    epsilon: "epsilon",

    gridDivs: "gridDivs",
    nLayers: "nLayers",

    layerSeparation: "worldOffset",

    scaleMode: "scaleMode",
    renderMode: "renderMode",
    colorScheme: "scheme",
    layerMode: "layerMode",
  };

  const S = setState;

  function getParamValueForControl(id) {
    const params = renderGlobals.paramsState;
    const p = ID_TO_PARAM[id] || id;

    if (p === "lightPos") {
      if (id === "lightX") return params.lightPos?.[0] ?? 0;
      if (id === "lightY") return params.lightPos?.[1] ?? 0;
      if (id === "lightZ") return params.lightPos?.[2] ?? 0;
    }

    if (p === "slopeLimit") {
      const rnorm = params.slopeLimit ?? 0;
      const clamped = Math.min(Math.max(rnorm, 0), 1);
      const rad = Math.asin(Math.sqrt(clamped));
      return (rad * 180) / Math.PI;
    }

    return params[p];
  }

  function setControlOutput(id, value) {
    const out = document.getElementById(id + "Out");
    if (!out) return;
    const fmt = FORMATTERS[id] || DEFAULT_FORMATTER;
    try {
      out.value = fmt(value);
    } catch (e) {}
  }

  function setupSlider(id, onChange) {
    const slider = document.getElementById(id);
    if (!slider) return null;

    const initVal = getParamValueForControl(id);
    if (typeof initVal === "number") {
      try {
        slider.value = String(initVal);
      } catch (e) {}
      setControlOutput(id, initVal);
    }

    const evtName = LIVE_IDS.has(id) ? "input" : "change";

    const handle = () => {
      const num = parseFloat(slider.value);
      if (Number.isNaN(num)) return;
      setControlOutput(id, num);
      onChange(num);
    };

    slider.addEventListener(evtName, handle);

    const out = document.getElementById(id + "Out");
    if (out) {
      const outEvt = LIVE_IDS.has(id) ? "input" : "change";
      const handleOut = () => {
        const num = parseFloat(out.value);
        if (Number.isNaN(num)) return;
        try {
          slider.value = String(num);
        } catch (e) {}
        setControlOutput(id, num);
        onChange(num);
      };
      out.addEventListener(outEvt, handleOut);
    }

    handle();
    return slider;
  }

  function setupSelect(id, onChange) {
    const sel = document.getElementById(id);
    if (!sel) return null;

    const out = document.getElementById(id + "Out");

    const initVal = getParamValueForControl(id);
    if (initVal !== undefined && initVal !== null) {
      try {
        sel.value = String(initVal);
      } catch (e) {}
    }

    const updateOutput = () => {
      if (out) out.value = sel.value;
    };

    sel.addEventListener("change", () => {
      updateOutput();
      onChange(sel.value);
    });

    if (out) {
      const handleOut = () => {
        const raw = out.value;
        const num = Number(raw);
        if (!Number.isFinite(num)) return;
        const newVal = String(num);
        sel.value = newVal;
        updateOutput();
        onChange(sel.value);
      };
      out.addEventListener("change", handleOut);
    }

    updateOutput();
    onChange(sel.value);
    return sel;
  }

  function setupCheckbox(id, onChange) {
    const cb = document.getElementById(id);
    if (!cb) return null;

    const paramName = ID_TO_PARAM[id] || id;
    const initVal = renderGlobals.paramsState[paramName];
    if (typeof initVal === "boolean") cb.checked = !!initVal;

    cb.addEventListener("change", () => onChange(cb.checked));
    onChange(cb.checked);
    return cb;
  }

  function setupMaskGroup(name, initialMask, onChange) {
    const boxes = Array.from(
      document.querySelectorAll(`input[name="${name}"]`),
    );
    if (!boxes.length) return null;

    function readMask() {
      let m = 0;
      for (const b of boxes) {
        if (b.checked) m |= parseInt(b.value, 10) || 0;
      }
      return m >>> 0;
    }

    function writeMask(mask) {
      for (const b of boxes) {
        const bit = parseInt(b.value, 10) || 0;
        b.checked = !!(mask & bit);
      }
    }

    writeMask(Number(initialMask) >>> 0);

    const handler = () => onChange(readMask());
    for (const b of boxes) b.addEventListener("change", handler);

    onChange(readMask());
    return { readMask, writeMask, elements: boxes };
  }

  function setDisabled(ids, disabled) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
      const out = document.getElementById(id + "Out");
      if (out) out.disabled = !!disabled;
    }
  }

  function normRenderMode(v) {
    const s = (v == null ? "" : String(v)).trim().toLowerCase();
    if (s === "slab" || s === "1") return "slab";
    if (s === "raw" || s === "blit" || s === "debug" || s === "2") return "raw";
    return "fractal";
  }

  function setControlValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") {
      el.checked = !!value;
      return;
    }

    try {
      el.value = String(value);
    } catch (e) {}

    const out = document.getElementById(id + "Out");
    if (out) {
      try {
        out.value = String(value);
      } catch (e) {}
    }
  }

  function ensureLayerModeVisibilityDefaults() {
    const ps = renderGlobals.paramsState;
    const patch = {};

    const sep = Number(ps.worldOffset || 0);
    if (!(Math.abs(sep) > 1e-9)) {
      const v = 0.03;
      setControlValue("layerSeparation", v);
      patch.worldOffset = v;
    }

    const am = Number(ps.alphaMode || 0);
    if (am === 0) {
      setControlValue("alphaMode", 1);
      patch.alphaMode = 1;

      if (typeof window.setAlphaMode === "function") {
        try {
          window.setAlphaMode(1);
        } catch {}
      } else {
        window.__pendingAlphaMode = "premultiplied";
      }
    }

    if (Object.keys(patch).length) S(patch);
  }

  let uiLayerMode = !!renderGlobals.paramsState.layerMode;

  function autoDisableForLayerMode(forceRenderMode) {
    setControlValue("dispMode", 0);
    setControlValue("lightingOn", false);

    const patch = { dispMode: 0, lightingOn: false };

    if (forceRenderMode) {
      setControlValue("renderMode", "fractal");
      patch.renderMode = "fractal";
    }

    S(patch);
  }

  function applyRenderModeUI(mode) {
    const m = normRenderMode(mode);
    S({ renderMode: m });
  }

  function applyLayerModeUI(isLayerMode) {
    const next = !!isLayerMode;
    const prev = uiLayerMode;
    uiLayerMode = next;

    setDisabled(["nLayers", "layerGammaStep", "layerSeparation"], !next);
    S({ layerMode: next });

    if (next && !prev) {
      autoDisableForLayerMode(true);
      ensureLayerModeVisibilityDefaults();
    }
  }

  setupSlider("gridSize", (v) => S({ gridSize: Math.floor(v) }));

  setupSlider("splitCount", (v) => {
    const n = Math.floor(v);
    if (n > 0) S({ splitCount: n });
  });

  setupSlider("maxIter", (v) => S({ maxIter: Math.floor(v) }));
  setupSlider("zoom", (v) => S({ zoom: v }));
  setupSlider("dx", (v) => S({ dx: v }));
  setupSlider("dy", (v) => S({ dy: v }));
  setupSlider("escapeR", (v) => S({ escapeR: v }));
  setupSlider("epsilon", (v) => S({ epsilon: v }));
  setupSlider("gamma", (v) => S({ gamma: v }));
  setupSlider("layerGammaStep", (v) => S({ layerGammaStep: v }));
  setupSlider("layerSeparation", (v) => S({ worldOffset: v }));
  setupSlider("hueOffset", (v) => S({ hueOffset: v }));

  setupSlider("nLayers", (v) => {
    const n = Math.max(1, Math.floor(v));
    S({ nLayers: n });

    if (uiLayerMode && n > 1) {
      autoDisableForLayerMode(false);
      ensureLayerModeVisibilityDefaults();
    }
  });

  setupSlider("gridDivs", (v) => {
    const val = Math.max(1, Math.floor(v));
    S({ gridDivs: val });
  });

  setupCheckbox("layerMode", (v) => applyLayerModeUI(v));

  setupSelect("fractalType", (v) => S({ fractalType: +v }));
  setupSelect("escapeMode", (v) => S({ escapeMode: +v }));
  setupCheckbox("convergenceTest", (v) => S({ convergenceTest: v }));
  setupSelect("colorScheme", (v) => S({ scheme: +v }));

  setupSelect("dispMode", (v) => S({ dispMode: +v }));
  setupSlider("dispAmp", (v) => S({ dispAmp: v }));
  setupSlider("dispCurve", (v) => S({ dispCurve: v }));
  setupCheckbox("dispLimitOn", (v) => S({ dispLimitOn: v }));

  setupSlider("slopeLimit", (deg) => {
    const rad = (deg * Math.PI) / 180;
    const rnorm = Math.sin(rad) * Math.sin(rad);
    S({ slopeLimit: rnorm });
  });

  setupSlider("wallJump", (v) => S({ wallJump: v }));

  const setLight = (idx, val) => {
    const lp = [...(renderGlobals.paramsState.lightPos || [0, 0, 0])];
    lp[idx] = val;
    S({ lightPos: lp });
  };

  setupCheckbox("lightingOn", (v) => S({ lightingOn: v }));
  setupSlider("lightX", (v) => setLight(0, v));
  setupSlider("lightY", (v) => setLight(1, v));
  setupSlider("lightZ", (v) => setLight(2, v));
  setupSlider("specPower", (v) => S({ specPower: v }));

  setupSlider("lowThresh", (v) => S({ lowT: v }));
  setupSlider("highThresh", (v) => S({ highT: v }));
  setupSelect("thresholdBasis", (v) => S({ basis: +v }));

  setupSelect("alphaMode", (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;

    S({ alphaMode: n });

    const canvasMode = n === 0 ? "opaque" : "premultiplied";
    if (typeof window.setAlphaMode === "function") {
      try {
        window.setAlphaMode(n);
      } catch (e) {
        try {
          window.setAlphaMode(canvasMode);
        } catch (e2) {}
      }
    } else {
      window.__pendingAlphaMode = canvasMode;
    }
  });

  setupSelect("renderMode", (v) => {
    applyRenderModeUI(v);
  });

  setupMaskGroup(
    "scaleMode",
    renderGlobals.paramsState.scaleMode ?? 0,
    (mask) => {
      S({ scaleMode: mask >>> 0 });
    },
  );

  applyLayerModeUI(!!renderGlobals.paramsState.layerMode);
  applyRenderModeUI(renderGlobals.paramsState.renderMode);
};
