// render/alphaMode.js
export function parseAlphaModeToNumeric(mode, fallback = 0) {
  if (mode === undefined || mode === null) return Number(fallback || 0);

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

  return Number(fallback || 0);
}

export function canvasAlphaStringForNumeric(numericMode) {
  return numericMode === 0 ? "opaque" : "premultiplied";
}

export function slabAlphaBitsFromParams(params) {
  let bits = 0;
  if (params && params.contourOn) bits |= 1;
  if (params && params.contourOnly) bits |= 2;
  if (params && params.contourFront) bits |= 4;
  return bits >>> 0;
}