// render/gradientRenderer.js
function _syncCanvas(canvas) {
  const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
  const w = Math.max(1, (canvas.clientWidth * dpr) | 0);
  const h = Math.max(1, (canvas.clientHeight * dpr) | 0);
  if ((canvas.width | 0) !== w) canvas.width = w;
  if ((canvas.height | 0) !== h) canvas.height = h;
  return { w, h };
}

export function createGradientRenderer(canvas) {
  const ctx2d = canvas.getContext("2d", { alpha: false, desynchronized: true });

  const gradRes = 512;
  const gradCanvas = document.createElement("canvas");
  gradCanvas.width = gradRes;
  gradCanvas.height = 1;

  const gradCtx = gradCanvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  });
  const gradImg = gradCtx.createImageData(gradRes, 1);
  const gradPix = gradImg.data;

  let dirty = false;

  function updateRGBA(rgba512x4) {
    if (!rgba512x4 || rgba512x4.length !== gradPix.length) return;
    gradPix.set(rgba512x4);
    dirty = true;
  }

  function draw() {
    if (!ctx2d) return;

    const { w: W, h: H } = _syncCanvas(canvas);

    if (dirty) {
      gradCtx.putImageData(gradImg, 0, 0);
      dirty = false;
    }

    ctx2d.clearRect(0, 0, W, H);
    ctx2d.drawImage(gradCanvas, 0, 0, gradRes, 1, 0, 0, W, H);
  }

  return { updateRGBA, draw };
}