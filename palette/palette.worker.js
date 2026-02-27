// palette.worker.js
let N = 512;

let bins = null;
let out = null;
let st = null;

let metrics = null; // Float32Array(16) when SAB mode
let noSAB = 0;

let outSeqLocal = 0;

let fps = 30;

let reactToSound = 1;

let baseStyle = 0;
let soundMode = 1;

let baseHueShift = 0.0;
let soundStrength = 1.0;

let hueWiggle = 0.25;
let shimmer = 0.22;
let warp = 0.22;

let colorPop = 0.25;
let brightnessBounce = 0.22;

let autoHueDrift = 0.10;

let beatFlash = 0.35;
let beatFade = 0.90;
let beatStep = 0.08;

let smoothUp = 0.35;
let smoothDown = 0.08;
let freqSmooth = 2;

let contrast = 9.0;
let boost = 1.0;
let noiseGate = 0.0;
let bassVsTreble = 0.0;

let lastBinsSeq = -1;
let timer = null;

let sm = null;
let tmp = null;
let prev = null;

let driftPhase = 0.0;
let flash = 0.0;

let fluxAvg = 0.0;
let fluxVar = 0.0;

let tNow = 0.0;
let lastBeatT = -1.0;
let bpm = 0.0;
let beatConfidence = 0.0;
let peak = 0.0;

function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
function fract(x) { return x - Math.floor(x); }

function hsl2rgb(h, s, l) {
  h = fract(h);
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);

  const C = (1 - Math.abs(2*l - 1)) * s;
  const Hp = h * 6;
  const t = Hp - 2 * Math.floor(Hp * 0.5);
  const X = C * (1 - Math.abs(t - 1));

  let r = 0, g = 0, b = 0;
  if (Hp < 1) { r = C; g = X; b = 0; }
  else if (Hp < 2) { r = X; g = C; b = 0; }
  else if (Hp < 3) { r = 0; g = C; b = X; }
  else if (Hp < 4) { r = 0; g = X; b = C; }
  else if (Hp < 5) { r = X; g = 0; b = C; }
  else { r = C; g = 0; b = X; }

  const m = l - 0.5*C;
  r = clamp(r + m, 0, 1);
  g = clamp(g + m, 0, 1);
  b = clamp(b + m, 0, 1);
  return [r, g, b];
}

function _ensureScratch() {
  if (!sm || sm.length !== N) sm = new Float32Array(N);
  if (!tmp || tmp.length !== N) tmp = new Float32Array(N);
  if (!prev || prev.length !== N) prev = new Float32Array(N);
}

function _compress(u) {
  const x = clamp(u, 0, 1);
  const k = Math.max(0.0001, contrast);
  return Math.log1p(k * x) / Math.log1p(k);
}

function smoothBinsInto(dst) {
  peak = 0.0;

  for (let i = 0; i < N; i++) {
    const bi = bins[i] | 0;
    if (bi > peak) peak = bi;

    let u = bi / 255.0;
    u = Math.max(0.0, u - noiseGate);
    u = clamp(u * boost, 0.0, 1.0);
    u = _compress(u);

    if (bassVsTreble !== 0.0) {
      const t = (i / Math.max(1, (N - 1))) * 2.0 - 1.0;
      const w = clamp(1.0 + bassVsTreble * t, 0.0, 3.0);
      u = clamp(u * w, 0.0, 1.0);
    }

    const prevV = dst[i];
    const k = u > prevV ? smoothUp : smoothDown;
    dst[i] = prevV + (u - prevV) * k;
  }
}

function blur(src, dst, r) {
  const rad = r | 0;
  if (rad <= 0) {
    dst.set(src);
    return;
  }

  for (let i = 0; i < N; i++) {
    let s = 0.0;
    let w = 0.0;
    for (let k = -rad; k <= rad; k++) {
      const j = i + k;
      if (j < 0 || j >= N) continue;
      const ww = (rad + 1) - Math.abs(k);
      s += src[j] * ww;
      w += ww;
    }
    dst[i] = w > 0 ? (s / w) : src[i];
  }
}

function metricsFrom(curve) {
  let mean = 0.0;
  let ss = 0.0;
  let num = 0.0;
  let den = 1e-9;

  for (let i = 0; i < N; i++) {
    const v = curve[i];
    mean += v;
    ss += v * v;
    num += (i / Math.max(1, (N - 1))) * v;
    den += v;
  }

  mean /= Math.max(1, N);
  const rms = Math.sqrt(ss / Math.max(1, N));
  const centroid = clamp(num / den, 0.0, 1.0);

  let flux = 0.0;
  for (let i = 0; i < N; i++) {
    const d = curve[i] - prev[i];
    if (d > 0) flux += d;
  }
  flux /= Math.max(1, N);

  const bassHi = 24;
  const midHi = 160;
  let bass = 0.0, mid = 0.0, treble = 0.0;

  for (let i = 1; i < bassHi; i++) bass += curve[i];
  for (let i = bassHi; i < midHi; i++) mid += curve[i];
  for (let i = midHi; i < N; i++) treble += curve[i];

  bass /= Math.max(1, bassHi - 1);
  mid /= Math.max(1, midHi - bassHi);
  treble /= Math.max(1, N - midHi);

  return { mean, rms, centroid, bass, mid, treble, flux };
}

function updateBeat(m, dt) {
  const flux = m.flux;

  const d = flux - fluxAvg;
  fluxAvg = fluxAvg + d * 0.05;
  fluxVar = fluxVar + ((d * d) - fluxVar) * 0.05;

  const thr = fluxAvg + Math.sqrt(Math.max(0.0, fluxVar)) * 1.35;

  let beatNow = 0.0;
  if (flux > thr && m.bass > 0.05) {
    beatNow = clamp((flux - thr) / Math.max(1e-6, thr), 0.0, 1.0);
    flash = 1.0;
    driftPhase += beatStep;

    if (lastBeatT >= 0.0) {
      const period = tNow - lastBeatT;
      if (period > 0.20 && period < 2.00) {
        const bpmNew = 60.0 / period;
        bpm = bpm <= 0.0 ? bpmNew : (bpm * 0.85 + bpmNew * 0.15);
      }
    }
    lastBeatT = tNow;
  }

  flash *= beatFade;
  flash = clamp(flash, 0.0, 1.0);

  driftPhase += autoHueDrift * dt;
  beatConfidence = beatConfidence * 0.92 + beatNow * 0.08;

  return beatNow;
}

function schemeHSL(r) {
  let H = 0.0;
  let S = 1.0;
  let L = 0.5;
  let monoL = -1.0;

  const rr = clamp(r, 0, 1);
  const fract = (x) => x - Math.floor(x);
  const PI = 3.14159;
  const TAU = 6.28318;

  switch (baseStyle | 0) {
    case 0:  { H = (260.0 - 260.0 * Math.pow(rr, 0.9)) / 360.0; L = (10.0  + 65.0  * Math.pow(rr, 1.2)) / 100.0; } break;
    case 1:  { H = (0.0 + 60.0 * rr) / 360.0;                  L = 0.50 + 0.50 * rr; } break;
    case 2:  { H = (200.0 - 100.0 * rr) / 360.0;               L = 0.30 + 0.70 * rr; } break;
    case 3:  { H = (30.0 + 270.0 * rr) / 360.0;                L = 0.30 + 0.40 * rr; } break;
    case 4:  { H = (120.0 -  90.0 * rr) / 360.0;               L = 0.20 + 0.50 * rr; } break;
    case 5:  { H = (300.0 - 240.0 * rr) / 360.0;               L = 0.55 + 0.20 * Math.sin(rr * PI); } break;

    case 6:  { monoL = rr; } break;

    case 7:  { H = (10.0 + 60.0 * Math.pow(rr, 1.2)) / 360.0;  L = 0.15 + 0.75 * Math.pow(rr, 1.5); } break;
    case 8:  { H = rr;                                          L = 0.45 + 0.25 * (1.0 - rr); } break;
    case 9:  { H = fract(2.0 * rr);                              L = 0.50; } break;
    case 10: { H = fract(3.0 * rr + 0.1);                        L = 0.65; } break;
    case 11: { H = 0.75 - 0.55 * rr;                             L = 0.25 + 0.55 * rr * rr; } break;
    case 12: { H = (5.0 + 70.0 * rr) / 360.0;                    L = 0.10 + 0.80 * Math.pow(rr, 1.4); } break;
    case 13: { H = (260.0 - 260.0 * rr) / 360.0;                 L = 0.30 + 0.60 * Math.pow(rr, 0.8); } break;
    case 14: { H = (230.0 - 160.0 * rr) / 360.0;                 L = 0.25 + 0.60 * rr; } break;
    case 15: { H = (200.0 + 40.0 * rr) / 360.0;                  L = 0.20 + 0.50 * rr; } break;
    case 16: { H = 0.60;                                         L = 0.15 + 0.35 * rr; } break;

    case 17: {
      if (rr < 0.5) { H = 0.55 + (0.75 - 0.55) * (rr * 2.0); }
      else         { H = 0.02 + (0.11 - 0.02) * ((rr - 0.5) * 2.0); }
      L = 0.25 + 0.55 * Math.abs(rr - 0.5);
    } break;

    case 18: { H = fract(3.0 * rr);                              L = 0.50 + 0.25 * (1.0 - rr); } break;
    case 19: { H = fract(4.0 * rr);                              L = 0.50; } break;
    case 20: { H = fract(5.0 * rr + 0.2);                        L = 0.65; } break;
    case 21: { H = (240.0 - 240.0 * rr) / 360.0;                 L = 0.30 + 0.40 * rr; } break;
    case 22: { H = fract(rr * 6.0 + Math.sin(rr * 10.0));        L = 0.40 + 0.30 * Math.sin(rr * 20.0); } break;
    case 23: { H = (30.0 + 50.0 * rr) / 360.0;                   L = 0.45 + 0.30 * rr; } break;
    case 24: { H = (90.0 - 80.0 * rr) / 360.0;                   L = 0.50 + 0.40 * rr; } break;
    case 25: { H = (100.0 - 100.0 * rr) / 360.0;                 L = 0.40 + 0.50 * rr; } break;

    case 26: {
      const loopVal = fract(rr * 10.0);
      monoL = loopVal * 0.8;
    } break;

    case 27: {
      if (rr < 0.5) { H = 0.80 + (0.40 - 0.80) * (rr * 2.0); }
      else         { H = 0.10 + (0.00 - 0.10) * ((rr - 0.5) * 2.0); }
      L = 0.20 + 0.60 * Math.abs(rr - 0.5);
    } break;

    case 28: { H = fract(Math.sin(rr * TAU) * 0.5 + 0.5);        L = 0.50; } break;
    case 29: { H = fract(rr * 3.0);                              L = fract(rr * 3.0); } break;
    case 30: { H = fract(rr * 6.0);                              L = 0.45 + 0.40 * Math.abs(Math.sin(rr * 6.0 * PI)); } break;

    case 31: {
      const t = fract(rr * 8.0);
      H = t < 0.5 ? (t * 2.0) : ((1.0 - t) * 2.0);
      L = 0.60 - 0.30 * Math.abs(t - 0.5);
    } break;

    case 32: { H = fract(Math.pow(rr, 0.7) * 12.0);              L = 0.50 + 0.30 * Math.pow(rr, 1.2); } break;
    case 33: { H = fract(rr * 10.0 + 0.3);                       L = 0.40 + 0.50 * rr; } break;

    default: { H = (40.0 + 310.0 * Math.pow(rr, 1.3)) / 360.0;   L = 0.20 + 0.50 * Math.pow(rr, 0.8); } break;
  }

  return { H, S, L, monoL };
}

function buildRGBA(curve, m, beatNow) {
  const g = reactToSound ? soundStrength : 0.0;
  const drift = driftPhase;

  for (let i = 0; i < N; i++) {
    const r0 = i / Math.max(1, (N - 1));
    const a = curve[i];
    const centered = a - m.mean;

    let rr = r0;
    if ((soundMode | 0) === 2) rr = clamp(r0 + (warp * g) * centered * 0.55, 0.0, 1.0);
    if ((soundMode | 0) === 4) rr = clamp(r0 + (warp * g) * (m.centroid - 0.5) * 0.9, 0.0, 1.0);

    const base = schemeHSL(rr);

    if (base.monoL >= 0.0) {
      const ll = clamp(base.monoL, 0.0, 1.0);
      const tintH = fract(baseHueShift + drift + (hueWiggle * g) * (0.60 * m.bass + 0.25 * m.mid + 0.15 * m.treble));
      const tint = hsl2rgb(tintH, 1.0, 0.5);

      let r = ll, g2 = ll, b = ll;
      r = clamp(tint[0] * ll, 0.0, 1.0);
      g2 = clamp(tint[1] * ll, 0.0, 1.0);
      b = clamp(tint[2] * ll, 0.0, 1.0);

      const add = clamp(flash * beatFlash * 0.35 * g, 0.0, 1.0);
      r = clamp(r + add, 0.0, 1.0);
      g2 = clamp(g2 + add, 0.0, 1.0);
      b = clamp(b + add, 0.0, 1.0);

      const o = (i * 4) | 0;
      out[o] = (r * 255) | 0;
      out[o + 1] = (g2 * 255) | 0;
      out[o + 2] = (b * 255) | 0;
      out[o + 3] = 255;
      continue;
    }

    let H = fract(base.H + baseHueShift + drift);
    let S = base.S;
    let L = base.L;

    const global = (0.55 * m.bass + 0.30 * m.mid + 0.15 * m.treble);
    const dH = (hueWiggle * g) * global + (shimmer * g) * centered;
    H = fract(H + dH);

    const dS = (colorPop * g) * (m.mid - 0.25) + (colorPop * g) * centered * 0.35;
    S = clamp(S + dS, 0.0, 1.0);

    const dL = (brightnessBounce * g) * (m.treble - 0.20) * 0.45 + (brightnessBounce * g) * centered * 0.25;
    L = clamp(L + dL + flash * beatFlash * 0.40 * g, 0.0, 1.0);

    if ((soundMode | 0) === 4) {
      H = fract(H + (m.centroid - 0.5) * 0.35 * g);
      L = clamp(L + (m.rms - 0.08) * 0.35 * g, 0.0, 1.0);
    }

    if ((soundMode | 0) === 3) {
      const lowW = (1.0 - r0);
      const highW = r0;

      const dH2 = (hueWiggle * g) * (m.bass * 0.9 * lowW + m.treble * 0.7 * highW) + (shimmer * g) * centered * 0.35;
      H = fract(H + dH2);

      const dL2 = (brightnessBounce * g) * (m.bass * 0.55 * lowW + m.treble * 0.45 * highW);
      L = clamp(L + dL2 + flash * beatFlash * 0.55 * g, 0.0, 1.0);

      const dS2 = (colorPop * g) * (m.mid - 0.25) + (colorPop * g) * (m.treble - 0.18) * 0.25;
      S = clamp(S + dS2, 0.0, 1.0);
    }

    const rgb = hsl2rgb(H, S, L);
    const o = (i * 4) | 0;
    out[o] = (rgb[0] * 255) | 0;
    out[o + 1] = (rgb[1] * 255) | 0;
    out[o + 2] = (rgb[2] * 255) | 0;
    out[o + 3] = 255;
  }

  if (metrics) {
    metrics[0] = m.mean;
    metrics[1] = m.rms;
    metrics[2] = m.centroid;
    metrics[3] = m.bass;
    metrics[4] = m.mid;
    metrics[5] = m.treble;
    metrics[6] = m.flux;
    metrics[7] = beatNow;
    metrics[8] = driftPhase;
    metrics[9] = fract(baseHueShift + driftPhase);
    metrics[10] = bpm;
    metrics[11] = beatConfidence;
    metrics[12] = peak / 255.0;
  }
}

function _publishFallback(m, beatNow) {
  outSeqLocal = (outSeqLocal + 1) | 0;
  self.postMessage({
    type: "rgba",
    rgba: out,
    seq: outSeqLocal,
    metrics: {
      mean: m.mean,
      rms: m.rms,
      centroid: m.centroid,
      bass: m.bass,
      mid: m.mid,
      treble: m.treble,
      flux: m.flux,
      beat: beatNow,
      driftPhase,
      hueDriver: fract(baseHueShift + driftPhase),
      bpm,
      beatConfidence,
      peak: peak / 255.0,
    },
  });
}

function tick() {
  if (!bins || !out) return;

  if (!noSAB) {
    if (!st) return;
    const seq = Atomics.load(st, 0) | 0;
    if (seq === lastBinsSeq) return;
    lastBinsSeq = seq;
  }

  _ensureScratch();

  smoothBinsInto(sm);
  blur(sm, tmp, freqSmooth);

  const m = metricsFrom(tmp);
  const dt = 1.0 / Math.max(5, fps);

  tNow += dt;
  const beatNow = updateBeat(m, dt);

  buildRGBA(tmp, m, beatNow);
  prev.set(tmp);

  if (!noSAB) {
    Atomics.add(st, 1, 1);
  } else {
    _publishFallback(m, beatNow);
  }
}

function startTimer() {
  stopTimer();
  const ms = Math.max(10, Math.floor(1000 / Math.max(1, fps)));
  timer = setInterval(tick, ms);
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

function resetState() {
  lastBinsSeq = -1;

  driftPhase = 0.0;
  flash = 0.0;

  fluxAvg = 0.0;
  fluxVar = 0.0;

  tNow = 0.0;
  lastBeatT = -1.0;
  bpm = 0.0;
  beatConfidence = 0.0;
  peak = 0.0;

  if (sm) sm.fill(0);
  if (tmp) tmp.fill(0);
  if (prev) prev.fill(0);
  if (out) out.fill(0);
  if (bins) bins.fill(0);

  if (metrics) {
    for (let i = 0; i < metrics.length; i++) metrics[i] = 0.0;
  }

  if (!noSAB && st) Atomics.add(st, 1, 1);
}

function applyConfig(m) {
  if (typeof m.fps === "number" && isFinite(m.fps)) fps = Math.max(5, m.fps | 0);

  if (typeof m.reactToSound === "number" && isFinite(m.reactToSound)) reactToSound = (m.reactToSound | 0) ? 1 : 0;
  if (typeof m.baseStyle === "number" && isFinite(m.baseStyle)) baseStyle = m.baseStyle | 0;
  if (typeof m.soundMode === "number" && isFinite(m.soundMode)) soundMode = m.soundMode | 0;

  if (typeof m.baseHueShift === "number" && isFinite(m.baseHueShift)) baseHueShift = fract(+m.baseHueShift);
  if (typeof m.soundStrength === "number" && isFinite(m.soundStrength)) soundStrength = clamp(+m.soundStrength, 0.0, 3.0);

  if (typeof m.hueWiggle === "number" && isFinite(m.hueWiggle)) hueWiggle = clamp(+m.hueWiggle, 0.0, 2.0);
  if (typeof m.shimmer === "number" && isFinite(m.shimmer)) shimmer = clamp(+m.shimmer, 0.0, 2.0);
  if (typeof m.warp === "number" && isFinite(m.warp)) warp = clamp(+m.warp, 0.0, 2.0);

  if (typeof m.colorPop === "number" && isFinite(m.colorPop)) colorPop = clamp(+m.colorPop, 0.0, 2.0);
  if (typeof m.brightnessBounce === "number" && isFinite(m.brightnessBounce)) brightnessBounce = clamp(+m.brightnessBounce, 0.0, 2.0);

  if (typeof m.autoHueDrift === "number" && isFinite(m.autoHueDrift)) autoHueDrift = clamp(+m.autoHueDrift, 0.0, 2.0);

  if (typeof m.beatFlash === "number" && isFinite(m.beatFlash)) beatFlash = clamp(+m.beatFlash, 0.0, 3.0);
  if (typeof m.beatFade === "number" && isFinite(m.beatFade)) beatFade = clamp(+m.beatFade, 0.70, 0.999);
  if (typeof m.beatStep === "number" && isFinite(m.beatStep)) beatStep = clamp(+m.beatStep, 0.0, 0.5);

  if (typeof m.smoothUp === "number" && isFinite(m.smoothUp)) smoothUp = clamp(+m.smoothUp, 0.01, 1.0);
  if (typeof m.smoothDown === "number" && isFinite(m.smoothDown)) smoothDown = clamp(+m.smoothDown, 0.001, 1.0);
  if (typeof m.freqSmooth === "number" && isFinite(m.freqSmooth)) freqSmooth = clamp(m.freqSmooth | 0, 0, 16);

  if (typeof m.contrast === "number" && isFinite(m.contrast)) contrast = clamp(+m.contrast, 0.1, 64.0);
  if (typeof m.boost === "number" && isFinite(m.boost)) boost = clamp(+m.boost, 0.0, 8.0);
  if (typeof m.noiseGate === "number" && isFinite(m.noiseGate)) noiseGate = clamp(+m.noiseGate, 0.0, 0.5);
  if (typeof m.bassVsTreble === "number" && isFinite(m.bassVsTreble)) bassVsTreble = clamp(+m.bassVsTreble, -1.0, 1.0);
}

self.onmessage = (e) => {
  const m = e && e.data;
  if (!m || typeof m !== "object") return;

  if (m.type === "init") {
    N = (m.N | 0) || 512;
    noSAB = (m.noSAB | 0) ? 1 : 0;

    if (!noSAB) {
      const binsSAB = m.binsSAB || null;
      const outSAB = m.outSAB || null;
      const stateSAB = m.stateSAB || null;
      const metricsSAB = m.metricsSAB || null;

      if (!binsSAB || !outSAB || !stateSAB || !metricsSAB) {
        self.postMessage({ type: "error", message: "SAB inputs missing" });
        return;
      }

      bins = new Uint8Array(binsSAB);
      out = new Uint8Array(outSAB);
      st = new Int32Array(stateSAB);
      metrics = new Float32Array(metricsSAB);
    } else {
      bins = new Uint8Array(N);
      out = new Uint8Array(N * 4);
      st = null;
      metrics = null;
    }

    applyConfig(m);

    _ensureScratch();
    resetState();
    startTimer();

    self.postMessage({ type: "ready", N, fps, noSAB });
    return;
  }

  if (m.type === "bins") {
    if (!noSAB) return;
    const b = m.bins;
    if (b && b.length === N) bins.set(b);
    return;
  }

  if (m.type === "config") {
    applyConfig(m);
    startTimer();
    return;
  }

  if (m.type === "reset") {
    resetState();
    return;
  }

  if (m.type === "stop") {
    stopTimer();
    try { self.close(); } catch (e) {console.error(e);}
  }
};
