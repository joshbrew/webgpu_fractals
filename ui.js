// ui.js
import componentHTML from "./shaders/fractalComponent.html";
import "./style.css";

import { renderGlobals, setState } from "./render.js";

import { initControlsUI } from "./ui/controlsUI.js";
import { initPresetsUI } from "./ui/presetsUI.js";
import { initSoundPaletteSidebarBridge } from "./ui/soundPaletteSidebarBridge.js";

function wireButtonClick(id, fn) {
  const el = document.getElementById(id);
  if (!el) return null;

  el.addEventListener("click", () => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });

  return el;
}

function ensureSidebarMarkup() {
  if (document.getElementById("ui")) return;
  document.body.insertAdjacentHTML("afterbegin", componentHTML);
}

function initSidebarCollapse(ui) {
  const button = document.getElementById("toggle-ui");
  if (!button || !ui) return;

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

export const initUI = () => {
  ensureSidebarMarkup();

  const ui = document.getElementById("ui");

  initSidebarCollapse(ui);

  wireButtonClick("resetCameraBtn", () => {
    if (typeof window.resetViewCamera === "function") window.resetViewCamera();
  });

  wireButtonClick("exportFullBtn", () => {
    if (typeof window.exportFractalFullRes === "function") {
      window.exportFractalFullRes();
    }
  });

  wireButtonClick("exportCanvasBtn", () => {
    if (typeof window.exportFractalCanvas === "function") {
      window.exportFractalCanvas();
    }
  });

  const controlsApi = initControlsUI({ renderGlobals, setState });

  initPresetsUI({ renderGlobals, setState, controlsApi });

  try {
    const bridgeApi = initSoundPaletteSidebarBridge({
      renderGlobals,
      setState,
      controlsApi,
      root: document,
      sidebar: ui,
    });

    if (bridgeApi && typeof bridgeApi.then === "function") {
      bridgeApi.catch(console.error);
    }

    if (renderGlobals && typeof renderGlobals === "object") {
      renderGlobals.soundPaletteSidebarBridge = bridgeApi || null;
    }
  } catch (err) {
    console.error(err);
  }
};