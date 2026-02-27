// ui/presetsUI.js
function _toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function initPresetsUI({ renderGlobals, setState, controlsApi, soundApi }) {
  const presetJson = document.getElementById("presetJson");
  const presetExportBtn = document.getElementById("presetExportBtn");
  const presetCopyBtn = document.getElementById("presetCopyBtn");
  const presetPasteBtn = document.getElementById("presetPasteBtn");
  const presetApplyBtn = document.getElementById("presetApplyBtn");
  const presetStatus = document.getElementById("presetStatus");

  const PRESET_CONTROL_IDS = [
    "gridSize",
    "splitCount",
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

    "gradTexMode",
  ];

  const PRESET_TYPES = {
    gridSize: "int",
    splitCount: "int",
    maxIter: "int",
    nLayers: "int",
    gridDivs: "int",
    fractalType: "int",
    escapeMode: "int",
    colorScheme: "int",
    dispMode: "int",
    thresholdBasis: "int",
    alphaMode: "int",
    gradTexMode: "int",

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

  function setPresetStatus(msg) {
    if (!presetStatus) return;
    try {
      presetStatus.textContent = msg || "";
    } catch {}
  }

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

    const opsApi = controlsApi?.scaleOpsApi;
    if (opsApi && typeof opsApi.getOps === "function") {
      const ops = opsApi.getOps();
      if (Array.isArray(ops)) controls.scaleOps = ops.slice();
    } else {
      const rawOps = renderGlobals.paramsState?.scaleOps;
      if (Array.isArray(rawOps)) controls.scaleOps = rawOps.slice();
    }

    const sound = soundApi && typeof soundApi.getPresetState === "function"
      ? soundApi.getPresetState()
      : null;

    return { version: 2, controls, sound };
  }

  function _applyNumericControl(id, v) {
    const n = _toNum(v);
    if (n == null) return false;
    controlsApi.setControlValue(id, n);
    controlsApi.setControlOutput(id, n);
    return true;
  }

  function _applyIntControl(id, v) {
    const n = _toNum(v);
    if (n == null) return false;
    const i = Math.round(n) | 0;
    controlsApi.setControlValue(id, i);
    controlsApi.setControlOutput(id, i);
    return true;
  }

  function _applyBoolControl(id, v) {
    const b = !!v;
    controlsApi.setControlValue(id, b);
    return true;
  }

  function applyPresetObject(obj) {
    const root = obj && typeof obj === "object" ? obj : null;
    if (!root) return { ok: false, err: "Preset is not an object" };

    const controls =
      root.controls && typeof root.controls === "object" ? root.controls : root;
    if (!controls || typeof controls !== "object")
      return { ok: false, err: "Missing controls" };

    if ("layerMode" in controls) {
      _applyBoolControl("layerMode", controls.layerMode);
      controlsApi.applyLayerModeUI(!!controls.layerMode);
    }

    if ("alphaMode" in controls) {
      controlsApi.applyAlphaModeUI(controls.alphaMode);
    }

    if ("renderMode" in controls) {
      controlsApi.setControlValue("renderMode", controls.renderMode);
      controlsApi.applyRenderModeUI(controls.renderMode);
    }

    const patch = {};

    if ("gradTexMode" in controls) {
      const n = _toNum(controls.gradTexMode);
      if (n != null) {
        const v = (Math.round(n) | 0) === 1 ? 1 : 0;
        const el = document.getElementById("gradTexMode");
        if (el) {
          try {
            el.value = String(v);
          } catch {}
        }
        patch.gradTexMode = v;
        if (soundApi && typeof soundApi.setGradTexEnabled === "function") {
          soundApi.setGradTexEnabled(v === 1);
        }
      }
    }

    if ("gridSize" in controls && _applyIntControl("gridSize", controls.gridSize)) {
      patch.gridSize = Math.max(1, Math.floor(_toNum(controls.gridSize) || 1));
    }

    if ("splitCount" in controls && _applyIntControl("splitCount", controls.splitCount)) {
      patch.splitCount = Math.max(1, Math.floor(_toNum(controls.splitCount) || 1));
    }

    if ("maxIter" in controls && _applyIntControl("maxIter", controls.maxIter)) {
      patch.maxIter = Math.max(1, Math.floor(_toNum(controls.maxIter) || 1));
    }

    if ("fractalType" in controls && _applyIntControl("fractalType", controls.fractalType)) {
      patch.fractalType = Math.max(0, Math.floor(_toNum(controls.fractalType) || 0));
    }

    if ("zoom" in controls && _applyNumericControl("zoom", controls.zoom))
      patch.zoom = _toNum(controls.zoom);
    if ("dx" in controls && _applyNumericControl("dx", controls.dx))
      patch.dx = _toNum(controls.dx);
    if ("dy" in controls && _applyNumericControl("dy", controls.dy))
      patch.dy = _toNum(controls.dy);

    if ("escapeR" in controls && _applyNumericControl("escapeR", controls.escapeR))
      patch.escapeR = _toNum(controls.escapeR);

    if ("epsilon" in controls && _applyNumericControl("epsilon", controls.epsilon))
      patch.epsilon = _toNum(controls.epsilon);

    if ("gamma" in controls && _applyNumericControl("gamma", controls.gamma))
      patch.gamma = _toNum(controls.gamma);

    if (
      "layerGammaStep" in controls &&
      _applyNumericControl("layerGammaStep", controls.layerGammaStep)
    ) {
      patch.layerGammaStep = _toNum(controls.layerGammaStep);
    }

    if (
      "layerSeparation" in controls &&
      _applyNumericControl("layerSeparation", controls.layerSeparation)
    ) {
      patch.worldOffset = _toNum(controls.layerSeparation);
    }

    if ("hueOffset" in controls && _applyNumericControl("hueOffset", controls.hueOffset))
      patch.hueOffset = _toNum(controls.hueOffset);

    if ("nLayers" in controls && _applyIntControl("nLayers", controls.nLayers)) {
      patch.nLayers = Math.max(1, Math.floor(_toNum(controls.nLayers) || 1));
    }

    if ("gridDivs" in controls && _applyIntControl("gridDivs", controls.gridDivs)) {
      patch.gridDivs = Math.max(1, Math.floor(_toNum(controls.gridDivs) || 1));
    }

    if ("escapeMode" in controls) {
      const n = _toNum(controls.escapeMode);
      if (n != null) {
        controlsApi.setControlValue("escapeMode", Math.round(n) | 0);
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
        const v = Math.round(n) | 0;
        controlsApi.setControlValue("colorScheme", v);
        patch.scheme = v;
        if (typeof window.soundPaletteConfig === "function") {
          try {
            window.soundPaletteConfig({ baseStyle: v, react: true });
          } catch {}
        }
      }
    }

    if ("lowThresh" in controls && _applyNumericControl("lowThresh", controls.lowThresh))
      patch.lowT = _toNum(controls.lowThresh);

    if ("highThresh" in controls && _applyNumericControl("highThresh", controls.highThresh))
      patch.highT = _toNum(controls.highThresh);

    if ("thresholdBasis" in controls) {
      const n = _toNum(controls.thresholdBasis);
      if (n != null) {
        controlsApi.setControlValue("thresholdBasis", Math.round(n) | 0);
        patch.basis = Math.round(n) | 0;
      }
    }

    if ("dispMode" in controls) {
      const n = _toNum(controls.dispMode);
      if (n != null) {
        controlsApi.setControlValue("dispMode", Math.round(n) | 0);
        patch.dispMode = Math.round(n) | 0;
      }
    }

    if ("dispAmp" in controls && _applyNumericControl("dispAmp", controls.dispAmp))
      patch.dispAmp = _toNum(controls.dispAmp);

    if ("dispCurve" in controls && _applyNumericControl("dispCurve", controls.dispCurve))
      patch.dispCurve = _toNum(controls.dispCurve);

    if ("dispLimitOn" in controls) {
      _applyBoolControl("dispLimitOn", controls.dispLimitOn);
      patch.dispLimitOn = !!controls.dispLimitOn;
    }

    if ("bowlOn" in controls) {
      _applyBoolControl("bowlOn", controls.bowlOn);
      patch.bowlOn = !!controls.bowlOn;
    }

    if ("bowlDepth" in controls && _applyNumericControl("bowlDepth", controls.bowlDepth))
      patch.bowlDepth = _toNum(controls.bowlDepth);

    if ("quadScale" in controls && _applyNumericControl("quadScale", controls.quadScale))
      patch.quadScale = _toNum(controls.quadScale);

    if ("wallJump" in controls && _applyNumericControl("wallJump", controls.wallJump))
      patch.wallJump = _toNum(controls.wallJump);

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
        controlsApi.setControlValue("fieldMode", Math.round(n) | 0);
        patch.fieldMode = Math.round(n) | 0;
      }
    }

    if ("meshStep" in controls && _applyIntControl("meshStep", controls.meshStep)) {
      patch.meshStep = Math.max(1, Math.floor(_toNum(controls.meshStep) || 1));
    }

    if ("capBias" in controls && _applyNumericControl("capBias", controls.capBias))
      patch.capBias = _toNum(controls.capBias);
    if ("gradScale" in controls && _applyNumericControl("gradScale", controls.gradScale))
      patch.gradScale = _toNum(controls.gradScale);
    if ("thickness" in controls && _applyNumericControl("thickness", controls.thickness))
      patch.thickness = _toNum(controls.thickness);
    if ("feather" in controls && _applyNumericControl("feather", controls.feather))
      patch.feather = _toNum(controls.feather);

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

    if (Object.keys(patch).length) setState(patch);

    if ("scaleOps" in controls) {
      const ops = Array.isArray(controls.scaleOps) ? controls.scaleOps : null;
      if (ops) {
        const opsApi = controlsApi?.scaleOpsApi;
        if (opsApi && typeof opsApi.setOps === "function") {
          opsApi.setOps(ops);
        } else {
          const norm = [];
          for (let i = 0; i < ops.length && norm.length < 16; ++i) {
            const n = _toNum(ops[i]);
            if (n == null) continue;
            norm.push((n | 0) >>> 0);
          }
          setState({ scaleOps: norm.slice() });
        }
      }
    }

    if (root.sound && soundApi && typeof soundApi.applyPresetState === "function") {
      soundApi.applyPresetState(root.sound);
    } else if (soundApi && typeof soundApi.pushConfig === "function") {
      soundApi.pushConfig();
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
}