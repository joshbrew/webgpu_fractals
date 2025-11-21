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

  const LIVE_IDS = new Set([
    "epsilon",
    "dispAmp",
    "zoom",
    "dx",
    "dy",
    "gamma",
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
    "worldOffset",
    "worldStart",
    "gridDivs",
  ]);

  const FORMATTERS = {
    epsilon: (v) => v.toExponential(),
    dispAmp: (v) => v.toFixed(2),
    zoom: (v) => v.toFixed(2),
    dx: (v) => v.toFixed(2),
    dy: (v) => v.toFixed(2),
    gamma: (v) => v.toFixed(2),
    hueOffset: (v) => v.toFixed(2),
    dispCurve: (v) => v.toFixed(2),
    bowlDepth: (v) => v.toFixed(2),
    lowThresh: (v) => v.toFixed(2),
    highThresh: (v) => v.toFixed(2),
    thresholdBasis: (v) => String(v),
    wallJump: (v) => v.toFixed(2),
    nLayers: (v) => v.toFixed(0),
    worldOffset: (v) => v.toFixed(2),
    worldStart: (v) => v.toFixed(2),
    gridDivs: (v) => String(Math.round(v)),
  };

  const DEFAULT_FORMATTER = (v) => String(Math.round(v));

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
    hueOffset: "hueOffset",
    epsilon: "epsilon",
    gridDivs: "gridDivs",
    nLayers: "nLayers",
    worldOffset: "worldOffset",
    worldStart: "worldStart",
    scaleMode: "scaleMode",
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
      const rad = Math.asin(Math.sqrt(Math.min(Math.max(rnorm, 0), 1)));
      return (rad * 180) / Math.PI;
    }
    return params[p];
  }

  function setupSlider(id, onChange) {
    const slider = document.getElementById(id);
    if (!slider) {
      console.warn("No slider element for id:", id);
      return null;
    }
    const out = document.getElementById(id + "Out");

    const initVal = getParamValueForControl(id);
    if (typeof initVal === "number") {
      try {
        slider.value = String(initVal);
        if (out) out.value = (FORMATTERS[id] || DEFAULT_FORMATTER)(initVal);
      } catch (e) {}
    }

    const evtName = LIVE_IDS.has(id) ? "input" : "change";
    const formatFn = FORMATTERS[id] || DEFAULT_FORMATTER;

    function handle() {
      const num = parseFloat(slider.value);
      if (!Number.isNaN(num)) {
        if (out) out.value = formatFn(num);
        onChange(num);
      }
    }

    slider.addEventListener(evtName, handle);

    if (out) {
      const outEvt = LIVE_IDS.has(id) ? "input" : "change";
      const handleOut = () => {
        const num = parseFloat(out.value);
        if (Number.isNaN(num)) return;
        onChange(num);
      };
      out.addEventListener(outEvt, handleOut);
    }

    handle();
    return slider;
  }

  function setupSelect(id, onChange) {
    const sel = document.getElementById(id);
    if (!sel) {
      console.warn("No select element for id:", id);
      return null;
    }
    const out = document.getElementById(id + "Out");

    const initVal = getParamValueForControl(id);
    if (initVal !== undefined && initVal !== null) {
      try {
        sel.value = String(initVal);
      } catch (e) {}
    }

    function updateOutput() {
      if (out) out.value = sel.value;
    }

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
      const outEvt = "change";
      out.addEventListener(outEvt, handleOut);
    }

    updateOutput();
    onChange(sel.value);
    return sel;
  }

  function setupCheckbox(id, onChange) {
    const cb = document.getElementById(id);
    if (!cb) {
      console.warn("No checkbox element for id:", id);
      return null;
    }

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
  setupSlider("hueOffset", (v) => S({ hueOffset: v }));
  setupSlider("nLayers", (v) =>
    S({ nLayers: Math.max(1, Math.floor(v)) }),
  );
  // setupSlider("worldOffset", (v) => S({ worldOffset: v }));
  // setupSlider("worldStart", (v) => S({ worldStart: v }));

  setupSlider("gridDivs", (v) => {
    const val = Math.max(1, Math.floor(v));
    S({ gridDivs: val });
  });

  const layerModeEl = document.getElementById("layerMode");

  function applyLayerModeUI(isLayerMode) {
    const disable = !!isLayerMode;
    const idsToToggle = [
      "dispMode",
      "dispAmp",
      "dispCurve",
      "dispLimitOn",
      "lightingOn",
      "lightX",
      "lightY",
      "lightZ",
      "specPower",
    ];
    for (const id of idsToToggle) {
      const el = document.getElementById(id);
      if (el) el.disabled = disable;
    }
    if (isLayerMode) {
      S({ layerMode: true, dispMode: 0, lightingOn: false });
    } else {
      S({ layerMode: false });
    }
  }

  if (layerModeEl) {
    const initialLayerMode = Boolean(renderGlobals.paramsState.layerMode);
    layerModeEl.checked = initialLayerMode;
    applyLayerModeUI(initialLayerMode);
    layerModeEl.addEventListener("change", () => {
      const v = !!layerModeEl.checked;
      applyLayerModeUI(v);
    });
    setupCheckbox("layerMode", (v) => applyLayerModeUI(v));
  } else {
    setupCheckbox("layerMode", (v) => applyLayerModeUI(v));
  }

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

  setupCheckbox("bowlOn", (v) => S({ bowlOn: v }));
  setupSlider("bowlDepth", (v) => S({ bowlDepth: v }));
  setupSlider("quadScale", (v) => S({ quadScale: v }));

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

  setupMaskGroup(
    "scaleMode",
    renderGlobals.paramsState.scaleMode ?? 0,
    (mask) => {
      S({ scaleMode: mask >>> 0 });
    },
  );
};
