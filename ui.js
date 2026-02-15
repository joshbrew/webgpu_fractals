// ui.js
import componentHTML from "./shaders/fractalComponent.html";
import "./style.css";
import { renderGlobals, setState } from "./render";

export const initUI = () => {
  document.body.insertAdjacentHTML("afterbegin", componentHTML);

  const ui = document.getElementById("ui");
  const button = document.getElementById("toggle-ui");
  if (button && ui) {
    const setToggleVisual = (collapsed) => {
      button.textContent = collapsed ? "▶" : "◀";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
      button.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    };

    setToggleVisual(ui.classList.contains("collapsed"));

    button.addEventListener("click", () => {
      const isCollapsed = ui.classList.toggle("collapsed");
      setToggleVisual(isCollapsed);
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

  const presetJson = document.getElementById("presetJson");
  const presetExportBtn = document.getElementById("presetExportBtn");
  const presetCopyBtn = document.getElementById("presetCopyBtn");
  const presetPasteBtn = document.getElementById("presetPasteBtn");
  const presetApplyBtn = document.getElementById("presetApplyBtn");
  const presetStatus = document.getElementById("presetStatus");

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

    "meshStep",
    "capBias",
    "gradScale",
    "thickness",
    "feather",
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

    meshStep: (v) => String(Math.max(1, Math.round(Number(v)))),
    capBias: (v) => Number(v).toFixed(3),
    gradScale: (v) => Number(v).toFixed(3),
    thickness: (v) => Number(v).toFixed(3),
    feather: (v) => Number(v).toFixed(3),
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
    } catch {}
  }

  function setupSlider(id, onChange) {
    const slider = document.getElementById(id);
    if (!slider) return null;

    const initVal = getParamValueForControl(id);
    if (typeof initVal === "number") {
      try {
        slider.value = String(initVal);
      } catch {}
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
        } catch {}
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
      } catch {}
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
    } catch {}

    const out = document.getElementById(id + "Out");
    if (out) {
      try {
        out.value = String(value);
      } catch {}
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

  const SLAB_IDS = [
    "fieldMode",
    "meshStep",
    "capBias",
    "gradScale",
    "thickness",
    "feather",
    "contourOn",
    "contourOnly",
    "contourFront",
  ];

  function setSlabControlsEnabled(enabled) {
    setDisabled(SLAB_IDS, !enabled);
  }

  function applyRenderModeUI(mode) {
    const m = normRenderMode(mode);

    if (uiLayerMode && m === "slab") {
      setControlValue("renderMode", "fractal");
      setSlabControlsEnabled(false);
      S({ renderMode: "fractal" });
      return;
    }

    setSlabControlsEnabled(m === "slab");
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

  function applyAlphaModeUI(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return;

    setControlValue("alphaMode", n);
    S({ alphaMode: n });

    const canvasMode = n === 0 ? "opaque" : "premultiplied";
    if (typeof window.setAlphaMode === "function") {
      try {
        window.setAlphaMode(n);
      } catch {
        try {
          window.setAlphaMode(canvasMode);
        } catch {}
      }
    } else {
      window.__pendingAlphaMode = canvasMode;
    }
  }

  const SCALE_OP_DEFS = [
    { code: 1, name: "Multiply", bit: 1 },
    { code: 2, name: "Divide", bit: 2 },
    { code: 3, name: "Sine", bit: 4 },
    { code: 4, name: "Tangent", bit: 8 },
    { code: 5, name: "Cosine", bit: 16 },
    { code: 6, name: "Exp-Zoom", bit: 32 },
    { code: 7, name: "Log-Shrink", bit: 64 },
    { code: 8, name: "Aniso Warp", bit: 128 },
    { code: 9, name: "Rotate", bit: 256 },
    { code: 10, name: "Radial Twist", bit: 512 },
    { code: 11, name: "HyperWarp", bit: 1024 },
    { code: 12, name: "RadialHyper", bit: 2048 },
    { code: 13, name: "Swirl", bit: 4096 },
    { code: 14, name: "Modular", bit: 8192 },
    { code: 15, name: "AxisSwap", bit: 16384 },
    { code: 16, name: "MixedWarp", bit: 32768 },
    { code: 17, name: "Jitter", bit: 65536 },
    { code: 18, name: "PowerWarp", bit: 131072 },
    { code: 19, name: "SmoothFade", bit: 262144 },
  ];

  const _SCALE_OP_BY_CODE = new Map(SCALE_OP_DEFS.map((d) => [d.code, d]));
  const _SCALE_OP_BY_KEY = new Map(
    SCALE_OP_DEFS.map((d) => [String(d.name).trim().toLowerCase(), d]),
  );

  function _normOpCode(v) {
    if (typeof v === "number" && Number.isFinite(v)) {
      const n = v | 0;
      return _SCALE_OP_BY_CODE.has(n) ? n : null;
    }

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;

      const n = Number(s);
      if (Number.isFinite(n)) {
        const nn = n | 0;
        return _SCALE_OP_BY_CODE.has(nn) ? nn : null;
      }

      const k = s.toLowerCase();
      const def = _SCALE_OP_BY_KEY.get(k);
      return def ? def.code : null;
    }

    return null;
  }

  function _maskToOps(mask) {
    const m = (mask >>> 0) | 0;
    const out = [];
    for (const d of SCALE_OP_DEFS) {
      if (m & d.bit) out.push(d.code);
    }
    return out;
  }

  function _opsToMask(ops) {
    let m = 0;
    for (let i = 0; i < ops.length; ++i) {
      const c = ops[i] | 0;
      const def = _SCALE_OP_BY_CODE.get(c);
      if (def) m |= def.bit;
    }
    return m >>> 0;
  }

  function _deriveInitialOpsFromState(ps) {
    const raw = ps?.scaleOps;
    if (Array.isArray(raw)) {
      const out = [];
      for (let i = 0; i < raw.length; ++i) {
        const c = _normOpCode(raw[i]);
        if (c != null) out.push(c);
      }
      return out;
    }

    const mask = Number(ps?.scaleMode);
    if (Number.isFinite(mask) && mask) {
      return _maskToOps(mask >>> 0);
    }

    return [];
  }

  function setupScaleOpsBuilder() {
    const picker = document.getElementById("scaleOpPicker");
    const addBtn = document.getElementById("scaleOpAdd");
    const clearBtn = document.getElementById("scaleOpClear");
    const list = document.getElementById("scaleOpsList");
    const out = document.getElementById("scaleOpsOut");
    const count = document.getElementById("scaleOpsCount");
    if (!picker || !addBtn || !list) return null;

    picker.innerHTML = "";
    for (const d of SCALE_OP_DEFS) {
      const opt = document.createElement("option");
      opt.value = String(d.code);
      opt.textContent = `${d.code} - ${d.name}`;
      picker.appendChild(opt);
    }

    let ops = _deriveInitialOpsFromState(renderGlobals.paramsState);
    const MAX_OPS = 16;

    function _clampOps(a) {
      const out = [];
      for (let i = 0; i < a.length && out.length < MAX_OPS; ++i) {
        const c = _normOpCode(a[i]);
        if (c != null) out.push(c);
      }
      return out;
    }

    function _syncOut() {
      if (out) {
        try {
          out.value = ops.join(",");
        } catch {}
      }
      if (count) {
        count.textContent = `${ops.length}/${MAX_OPS}`;
      }
      addBtn.disabled = ops.length >= MAX_OPS;
    }

    function _commit() {
      const mask = _opsToMask(ops);
      S({ scaleOps: ops.slice(), scaleMode: mask });
    }

    function _makeItem(i, code) {
      const def = _SCALE_OP_BY_CODE.get(code);
      const name = def ? def.name : `Op ${code}`;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.padding = "4px 6px";
      row.style.border = "1px solid rgba(255,255,255,0.15)";
      row.style.borderRadius = "6px";

      const label = document.createElement("div");
      label.style.flex = "1 1 auto";
      label.textContent = `${i + 1}. ${name} (${code})`;

      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "Up";
      up.dataset.act = "up";
      up.dataset.idx = String(i);
      up.disabled = i === 0;

      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "Down";
      down.dataset.act = "down";
      down.dataset.idx = String(i);
      down.disabled = i === ops.length - 1;

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Remove";
      del.dataset.act = "del";
      del.dataset.idx = String(i);

      row.appendChild(label);
      row.appendChild(up);
      row.appendChild(down);
      row.appendChild(del);

      return row;
    }

    function _render() {
      list.innerHTML = "";
      const frag = document.createDocumentFragment();
      for (let i = 0; i < ops.length; ++i) {
        frag.appendChild(_makeItem(i, ops[i]));
      }
      list.appendChild(frag);
    }

    function _setOps(nextOps, doCommit = true) {
      ops = _clampOps(nextOps || []);
      _syncOut();
      _render();
      if (doCommit) _commit();
    }

    addBtn.addEventListener("click", () => {
      const c = _normOpCode(picker.value);
      if (c == null) return;
      if (ops.length >= MAX_OPS) return;
      _setOps([...ops, c]);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        _setOps([]);
      });
    }

    list.addEventListener("click", (e) => {
      const t = e.target;
      if (!t || typeof t !== "object") return;

      const act = t.dataset?.act;
      const idx = Number(t.dataset?.idx);
      if (!act || !Number.isFinite(idx)) return;
      const i = idx | 0;
      if (i < 0 || i >= ops.length) return;

      if (act === "del") {
        const next = ops.slice();
        next.splice(i, 1);
        _setOps(next);
        return;
      }

      if (act === "up" && i > 0) {
        const next = ops.slice();
        const tmp = next[i - 1];
        next[i - 1] = next[i];
        next[i] = tmp;
        _setOps(next);
        return;
      }

      if (act === "down" && i + 1 < ops.length) {
        const next = ops.slice();
        const tmp = next[i + 1];
        next[i + 1] = next[i];
        next[i] = tmp;
        _setOps(next);
      }
    });

    _setOps(ops, true);
    return { getOps: () => ops.slice(), setOps: (a) => _setOps(a) };
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

  let _lastUiNLayers = Math.max(1, Math.floor(renderGlobals.paramsState.nLayers || 1));

  setupSlider("nLayers", (v) => {
    const n = Math.max(1, Math.floor(v));
    S({ nLayers: n });

    if (uiLayerMode && _lastUiNLayers <= 1 && n > 1) {
      autoDisableForLayerMode(false);
      ensureLayerModeVisibilityDefaults();
    }

    _lastUiNLayers = n;
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

  const scaleOpsApi = setupScaleOpsBuilder();

  setupSelect("dispMode", (v) => S({ dispMode: +v }));
  setupSlider("dispAmp", (v) => S({ dispAmp: v }));
  setupSlider("dispCurve", (v) => S({ dispCurve: v }));
  setupCheckbox("dispLimitOn", (v) => S({ dispLimitOn: v }));

  setupCheckbox("bowlOn", (v) => S({ bowlOn: v }));
  setupSlider("bowlDepth", (v) => S({ bowlDepth: v }));

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

  setupSelect("alphaMode", (v) => applyAlphaModeUI(v));

  setupSelect("renderMode", (v) => {
    applyRenderModeUI(v);
  });

  setupSelect("fieldMode", (v) => S({ fieldMode: +v }));

  setupSlider("meshStep", (v) => {
    const n = Math.max(1, Math.floor(v));
    S({ meshStep: n });
  });

  setupSlider("capBias", (v) => S({ capBias: v }));
  setupSlider("gradScale", (v) => S({ gradScale: v }));
  setupSlider("thickness", (v) => S({ thickness: v }));
  setupSlider("feather", (v) => S({ feather: v }));

  setupCheckbox("contourOn", (v) => S({ contourOn: v }));
  setupCheckbox("contourOnly", (v) => S({ contourOnly: v }));
  setupCheckbox("contourFront", (v) => S({ contourFront: v }));

  function setPresetStatus(msg) {
    if (!presetStatus) return;
    try {
      presetStatus.textContent = msg || "";
    } catch {}
  }

  const PRESET_CONTROL_IDS = [
    "gridSize",
    "renderMode",
    "alphaMode",

    "fractalType",
    "zoom",
    "dx",
    "dy",
    "maxIter",
    "escapeR",
    "convergenceTest",
    "escapeMode",
    "epsilon",

    "colorScheme",
    "hueOffset",

    "gamma",
    "lowThresh",
    "highThresh",
    "thresholdBasis",

    "layerMode",
    "nLayers",
    "layerGammaStep",
    "layerSeparation",

    "dispMode",
    "gridDivs",
    "dispAmp",
    "dispCurve",
    "dispLimitOn",

    "bowlOn",
    "bowlDepth",
    "quadScale",

    "slopeLimit",
    "wallJump",

    "lightingOn",
    "lightX",
    "lightY",
    "lightZ",
    "specPower",

    "fieldMode",
    "meshStep",
    "capBias",
    "gradScale",
    "thickness",
    "feather",
    "contourOn",
    "contourOnly",
    "contourFront",
  ];

  const PRESET_TYPES = {
    gridSize: "int",
    maxIter: "int",
    nLayers: "int",
    gridDivs: "int",
    fractalType: "int",
    escapeMode: "int",
    colorScheme: "int",
    dispMode: "int",
    thresholdBasis: "int",
    alphaMode: "int",

    renderMode: "string",

    convergenceTest: "bool",
    layerMode: "bool",
    dispLimitOn: "bool",
    bowlOn: "bool",
    lightingOn: "bool",
    contourOn: "bool",
    contourOnly: "bool",
    contourFront: "bool",

    zoom: "num",
    dx: "num",
    dy: "num",
    escapeR: "num",
    epsilon: "num",
    hueOffset: "num",
    gamma: "num",
    layerGammaStep: "num",
    layerSeparation: "num",
    dispAmp: "num",
    dispCurve: "num",
    bowlDepth: "num",
    quadScale: "num",
    slopeLimit: "num",
    wallJump: "num",
    lightX: "num",
    lightY: "num",
    lightZ: "num",
    specPower: "num",

    meshStep: "int",
    capBias: "num",
    gradScale: "num",
    thickness: "num",
    feather: "num",
    fieldMode: "int",
  };

  function readPresetValueFromControl(id) {
    const el = document.getElementById(id);
    if (!el) return undefined;

    if (el.type === "checkbox") return !!el.checked;

    const raw = el.value;
    const t = PRESET_TYPES[id] || "num";

    if (t === "string") return String(raw);

    if (t === "bool") return !!raw;

    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;

    if (t === "int") return Math.round(n) | 0;
    return n;
  }

  function buildPresetObject() {
    const controls = {};
    for (let i = 0; i < PRESET_CONTROL_IDS.length; ++i) {
      const id = PRESET_CONTROL_IDS[i];
      const v = readPresetValueFromControl(id);
      if (v !== undefined) controls[id] = v;
    }

    if (scaleOpsApi && typeof scaleOpsApi.getOps === "function") {
      const ops = scaleOpsApi.getOps();
      if (Array.isArray(ops)) controls.scaleOps = ops.slice();
    } else {
      const rawOps = renderGlobals.paramsState?.scaleOps;
      if (Array.isArray(rawOps)) controls.scaleOps = rawOps.slice();
    }

    return { version: 1, controls };
  }

  function _toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function _applyNumericControl(id, v) {
    const n = _toNum(v);
    if (n == null) return false;
    setControlValue(id, n);
    setControlOutput(id, n);
    return true;
  }

  function _applyIntControl(id, v) {
    const n = _toNum(v);
    if (n == null) return false;
    const i = Math.round(n) | 0;
    setControlValue(id, i);
    setControlOutput(id, i);
    return true;
  }

  function _applyBoolControl(id, v) {
    const b = !!v;
    setControlValue(id, b);
    return true;
  }

  function applyPresetObject(obj) {
    const root = obj && typeof obj === "object" ? obj : null;
    if (!root) return { ok: false, err: "Preset is not an object" };

    const controls = root.controls && typeof root.controls === "object" ? root.controls : root;
    if (!controls || typeof controls !== "object") return { ok: false, err: "Missing controls" };

    if ("layerMode" in controls) {
      _applyBoolControl("layerMode", controls.layerMode);
      applyLayerModeUI(!!controls.layerMode);
    }

    if ("alphaMode" in controls) {
      applyAlphaModeUI(controls.alphaMode);
    }

    if ("renderMode" in controls) {
      setControlValue("renderMode", controls.renderMode);
      applyRenderModeUI(controls.renderMode);
    }

    const patch = {};

    if ("gridSize" in controls && _applyIntControl("gridSize", controls.gridSize)) {
      patch.gridSize = Math.max(1, Math.floor(_toNum(controls.gridSize) || 1));
    }

    if ("maxIter" in controls && _applyIntControl("maxIter", controls.maxIter)) {
      patch.maxIter = Math.max(1, Math.floor(_toNum(controls.maxIter) || 1));
    }

    if ("fractalType" in controls && _applyIntControl("fractalType", controls.fractalType)) {
      patch.fractalType = Math.max(0, Math.floor(_toNum(controls.fractalType) || 0));
    }

    if ("zoom" in controls && _applyNumericControl("zoom", controls.zoom)) patch.zoom = _toNum(controls.zoom);
    if ("dx" in controls && _applyNumericControl("dx", controls.dx)) patch.dx = _toNum(controls.dx);
    if ("dy" in controls && _applyNumericControl("dy", controls.dy)) patch.dy = _toNum(controls.dy);
    if ("escapeR" in controls && _applyNumericControl("escapeR", controls.escapeR)) patch.escapeR = _toNum(controls.escapeR);
    if ("epsilon" in controls && _applyNumericControl("epsilon", controls.epsilon)) patch.epsilon = _toNum(controls.epsilon);
    if ("gamma" in controls && _applyNumericControl("gamma", controls.gamma)) patch.gamma = _toNum(controls.gamma);
    if ("layerGammaStep" in controls && _applyNumericControl("layerGammaStep", controls.layerGammaStep)) {
      patch.layerGammaStep = _toNum(controls.layerGammaStep);
    }
    if ("layerSeparation" in controls && _applyNumericControl("layerSeparation", controls.layerSeparation)) {
      patch.worldOffset = _toNum(controls.layerSeparation);
    }

    if ("hueOffset" in controls && _applyNumericControl("hueOffset", controls.hueOffset)) patch.hueOffset = _toNum(controls.hueOffset);

    if ("nLayers" in controls && _applyIntControl("nLayers", controls.nLayers)) {
      patch.nLayers = Math.max(1, Math.floor(_toNum(controls.nLayers) || 1));
    }

    if ("gridDivs" in controls && _applyIntControl("gridDivs", controls.gridDivs)) {
      patch.gridDivs = Math.max(1, Math.floor(_toNum(controls.gridDivs) || 1));
    }

    if ("escapeMode" in controls) {
      const n = _toNum(controls.escapeMode);
      if (n != null) {
        setControlValue("escapeMode", Math.round(n) | 0);
        patch.escapeMode = Math.round(n) | 0;
      }
    }

    if ("convergenceTest" in controls) {
      _applyBoolControl("convergenceTest", controls.convergenceTest);
      patch.convergenceTest = !!controls.convergenceTest;
    }

    if ("colorScheme" in controls) {
      const n = _toNum(controls.colorScheme);
      if (n != null) {
        setControlValue("colorScheme", Math.round(n) | 0);
        patch.scheme = Math.round(n) | 0;
      }
    }

    if ("lowThresh" in controls && _applyNumericControl("lowThresh", controls.lowThresh)) patch.lowT = _toNum(controls.lowThresh);
    if ("highThresh" in controls && _applyNumericControl("highThresh", controls.highThresh)) patch.highT = _toNum(controls.highThresh);

    if ("thresholdBasis" in controls) {
      const n = _toNum(controls.thresholdBasis);
      if (n != null) {
        setControlValue("thresholdBasis", Math.round(n) | 0);
        patch.basis = Math.round(n) | 0;
      }
    }

    if ("dispMode" in controls) {
      const n = _toNum(controls.dispMode);
      if (n != null) {
        setControlValue("dispMode", Math.round(n) | 0);
        patch.dispMode = Math.round(n) | 0;
      }
    }

    if ("dispAmp" in controls && _applyNumericControl("dispAmp", controls.dispAmp)) patch.dispAmp = _toNum(controls.dispAmp);
    if ("dispCurve" in controls && _applyNumericControl("dispCurve", controls.dispCurve)) patch.dispCurve = _toNum(controls.dispCurve);

    if ("dispLimitOn" in controls) {
      _applyBoolControl("dispLimitOn", controls.dispLimitOn);
      patch.dispLimitOn = !!controls.dispLimitOn;
    }

    if ("bowlOn" in controls) {
      _applyBoolControl("bowlOn", controls.bowlOn);
      patch.bowlOn = !!controls.bowlOn;
    }

    if ("bowlDepth" in controls && _applyNumericControl("bowlDepth", controls.bowlDepth)) patch.bowlDepth = _toNum(controls.bowlDepth);

    if ("quadScale" in controls && _applyNumericControl("quadScale", controls.quadScale)) patch.quadScale = _toNum(controls.quadScale);

    if ("wallJump" in controls && _applyNumericControl("wallJump", controls.wallJump)) patch.wallJump = _toNum(controls.wallJump);

    if ("slopeLimit" in controls && _applyNumericControl("slopeLimit", controls.slopeLimit)) {
      const deg = _toNum(controls.slopeLimit);
      if (deg != null) {
        const rad = (deg * Math.PI) / 180;
        const rnorm = Math.sin(rad) * Math.sin(rad);
        patch.slopeLimit = rnorm;
      }
    }

    if ("lightingOn" in controls) {
      _applyBoolControl("lightingOn", controls.lightingOn);
      patch.lightingOn = !!controls.lightingOn;
    }

    const anyLight =
      "lightX" in controls || "lightY" in controls || "lightZ" in controls;

    if (anyLight) {
      const lp = [...(renderGlobals.paramsState.lightPos || [0, 0, 0])];

      if ("lightX" in controls) {
        const n = _toNum(controls.lightX);
        if (n != null) {
          _applyNumericControl("lightX", n);
          lp[0] = n;
        }
      }

      if ("lightY" in controls) {
        const n = _toNum(controls.lightY);
        if (n != null) {
          _applyNumericControl("lightY", n);
          lp[1] = n;
        }
      }

      if ("lightZ" in controls) {
        const n = _toNum(controls.lightZ);
        if (n != null) {
          _applyNumericControl("lightZ", n);
          lp[2] = n;
        }
      }

      patch.lightPos = lp;
    }

    if ("specPower" in controls && _applyNumericControl("specPower", controls.specPower)) {
      patch.specPower = _toNum(controls.specPower);
    }

    if ("fieldMode" in controls) {
      const n = _toNum(controls.fieldMode);
      if (n != null) {
        setControlValue("fieldMode", Math.round(n) | 0);
        patch.fieldMode = Math.round(n) | 0;
      }
    }

    if ("meshStep" in controls && _applyIntControl("meshStep", controls.meshStep)) {
      patch.meshStep = Math.max(1, Math.floor(_toNum(controls.meshStep) || 1));
    }

    if ("capBias" in controls && _applyNumericControl("capBias", controls.capBias)) patch.capBias = _toNum(controls.capBias);
    if ("gradScale" in controls && _applyNumericControl("gradScale", controls.gradScale)) patch.gradScale = _toNum(controls.gradScale);
    if ("thickness" in controls && _applyNumericControl("thickness", controls.thickness)) patch.thickness = _toNum(controls.thickness);
    if ("feather" in controls && _applyNumericControl("feather", controls.feather)) patch.feather = _toNum(controls.feather);

    if ("contourOn" in controls) {
      _applyBoolControl("contourOn", controls.contourOn);
      patch.contourOn = !!controls.contourOn;
    }

    if ("contourOnly" in controls) {
      _applyBoolControl("contourOnly", controls.contourOnly);
      patch.contourOnly = !!controls.contourOnly;
    }

    if ("contourFront" in controls) {
      _applyBoolControl("contourFront", controls.contourFront);
      patch.contourFront = !!controls.contourFront;
    }

    if (Object.keys(patch).length) S(patch);

    if ("scaleOps" in controls) {
      const ops = Array.isArray(controls.scaleOps) ? controls.scaleOps : null;
      if (ops) {
        if (scaleOpsApi && typeof scaleOpsApi.setOps === "function") {
          scaleOpsApi.setOps(ops);
        } else {
          const norm = [];
          for (let i = 0; i < ops.length && norm.length < 16; ++i) {
            const c = _normOpCode(ops[i]);
            if (c != null) norm.push(c);
          }
          S({ scaleOps: norm.slice(), scaleMode: _opsToMask(norm) });
        }
      }
    }

    return { ok: true };
  }

  async function copyTextToClipboard(text) {
    const s = String(text || "");
    if (!s) return false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(s);
        return true;
      } catch {}
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = s;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch {}

    return false;
  }

  async function readTextFromClipboard() {
    if (navigator?.clipboard?.readText) {
      try {
        const s = await navigator.clipboard.readText();
        return typeof s === "string" ? s : "";
      } catch {}
    }
    return "";
  }

  if (presetExportBtn && presetJson) {
    presetExportBtn.addEventListener("click", () => {
      const obj = buildPresetObject();
      try {
        presetJson.value = JSON.stringify(obj, null, 2);
        setPresetStatus("Exported");
      } catch {
        setPresetStatus("Export failed");
      }
    });
  }

  if (presetCopyBtn && presetJson) {
    presetCopyBtn.addEventListener("click", async () => {
      const ok = await copyTextToClipboard(presetJson.value);
      setPresetStatus(ok ? "Copied" : "Copy failed");
    });
  }

  if (presetPasteBtn && presetJson) {
    presetPasteBtn.addEventListener("click", async () => {
      const s = await readTextFromClipboard();
      if (!s) {
        setPresetStatus("Clipboard empty");
        return;
      }
      presetJson.value = s;
      setPresetStatus("Pasted");
    });
  }

  if (presetApplyBtn && presetJson) {
    presetApplyBtn.addEventListener("click", () => {
      const raw = String(presetJson.value || "").trim();
      if (!raw) {
        setPresetStatus("No JSON to apply");
        return;
      }

      let obj = null;
      try {
        obj = JSON.parse(raw);
      } catch {
        setPresetStatus("Invalid JSON");
        return;
      }

      const res = applyPresetObject(obj);
      setPresetStatus(res.ok ? "Applied" : `Apply failed: ${res.err || "unknown"}`);
    });
  }

  applyLayerModeUI(!!renderGlobals.paramsState.layerMode);
  setSlabControlsEnabled(normRenderMode(renderGlobals.paramsState.renderMode) === "slab");
  applyRenderModeUI(renderGlobals.paramsState.renderMode);
};
