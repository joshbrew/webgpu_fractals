(() => {
  // palette/palette.worker.js
  var N = 512;
  var bins = null;
  var out = null;
  var st = null;
  var metrics = null;
  var noSAB = 0;
  var outSeqLocal = 0;
  var fps = 30;
  var reactToSound = 1;
  var baseStyle = 0;
  var soundMode = 1;
  var baseHueShift = 0;
  var soundStrength = 1;
  var hueWiggle = 0.25;
  var shimmer = 0.22;
  var warp = 0.22;
  var colorPop = 0.25;
  var brightnessBounce = 0.22;
  var autoHueDrift = 0.1;
  var beatFlash = 0.35;
  var beatFade = 0.9;
  var beatStep = 0.08;
  var smoothUp = 0.35;
  var smoothDown = 0.08;
  var freqSmooth = 2;
  var contrast = 9;
  var boost = 1;
  var noiseGate = 0;
  var bassVsTreble = 0;
  var lastBinsSeq = -1;
  var timer = null;
  var sm = null;
  var tmp = null;
  var prev = null;
  var driftPhase = 0;
  var flash = 0;
  var fluxAvg = 0;
  var fluxVar = 0;
  var tNow = 0;
  var lastBeatT = -1;
  var bpm = 0;
  var beatConfidence = 0;
  var peak = 0;
  function clamp(x, a, b) {
    return x < a ? a : x > b ? b : x;
  }
  function fract(x) {
    return x - Math.floor(x);
  }
  function hsl2rgb(h, s, l) {
    h = fract(h);
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    const C = (1 - Math.abs(2 * l - 1)) * s;
    const Hp = h * 6;
    const t = Hp - 2 * Math.floor(Hp * 0.5);
    const X = C * (1 - Math.abs(t - 1));
    let r = 0, g = 0, b = 0;
    if (Hp < 1) {
      r = C;
      g = X;
      b = 0;
    } else if (Hp < 2) {
      r = X;
      g = C;
      b = 0;
    } else if (Hp < 3) {
      r = 0;
      g = C;
      b = X;
    } else if (Hp < 4) {
      r = 0;
      g = X;
      b = C;
    } else if (Hp < 5) {
      r = X;
      g = 0;
      b = C;
    } else {
      r = C;
      g = 0;
      b = X;
    }
    const m = l - 0.5 * C;
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
    const k = Math.max(1e-4, contrast);
    return Math.log1p(k * x) / Math.log1p(k);
  }
  function smoothBinsInto(dst) {
    peak = 0;
    for (let i = 0; i < N; i++) {
      const bi = bins[i] | 0;
      if (bi > peak) peak = bi;
      let u = bi / 255;
      u = Math.max(0, u - noiseGate);
      u = clamp(u * boost, 0, 1);
      u = _compress(u);
      if (bassVsTreble !== 0) {
        const t = i / Math.max(1, N - 1) * 2 - 1;
        const w = clamp(1 + bassVsTreble * t, 0, 3);
        u = clamp(u * w, 0, 1);
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
      let s = 0;
      let w = 0;
      for (let k = -rad; k <= rad; k++) {
        const j = i + k;
        if (j < 0 || j >= N) continue;
        const ww = rad + 1 - Math.abs(k);
        s += src[j] * ww;
        w += ww;
      }
      dst[i] = w > 0 ? s / w : src[i];
    }
  }
  function metricsFrom(curve) {
    let mean = 0;
    let ss = 0;
    let num = 0;
    let den = 1e-9;
    for (let i = 0; i < N; i++) {
      const v = curve[i];
      mean += v;
      ss += v * v;
      num += i / Math.max(1, N - 1) * v;
      den += v;
    }
    mean /= Math.max(1, N);
    const rms = Math.sqrt(ss / Math.max(1, N));
    const centroid = clamp(num / den, 0, 1);
    let flux = 0;
    for (let i = 0; i < N; i++) {
      const d = curve[i] - prev[i];
      if (d > 0) flux += d;
    }
    flux /= Math.max(1, N);
    const bassHi = 24;
    const midHi = 160;
    let bass = 0, mid = 0, treble = 0;
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
    fluxVar = fluxVar + (d * d - fluxVar) * 0.05;
    const thr = fluxAvg + Math.sqrt(Math.max(0, fluxVar)) * 1.35;
    let beatNow = 0;
    if (flux > thr && m.bass > 0.05) {
      beatNow = clamp((flux - thr) / Math.max(1e-6, thr), 0, 1);
      flash = 1;
      driftPhase += beatStep;
      if (lastBeatT >= 0) {
        const period = tNow - lastBeatT;
        if (period > 0.2 && period < 2) {
          const bpmNew = 60 / period;
          bpm = bpm <= 0 ? bpmNew : bpm * 0.85 + bpmNew * 0.15;
        }
      }
      lastBeatT = tNow;
    }
    flash *= beatFade;
    flash = clamp(flash, 0, 1);
    driftPhase += autoHueDrift * dt;
    beatConfidence = beatConfidence * 0.92 + beatNow * 0.08;
    return beatNow;
  }
  function schemeHSL(r) {
    let H = 0;
    let S = 1;
    let L = 0.5;
    let monoL = -1;
    const rr = clamp(r, 0, 1);
    const fract2 = (x) => x - Math.floor(x);
    const PI = 3.14159;
    const TAU = 6.28318;
    switch (baseStyle | 0) {
      case 0:
        {
          H = (260 - 260 * Math.pow(rr, 0.9)) / 360;
          L = (10 + 65 * Math.pow(rr, 1.2)) / 100;
        }
        break;
      case 1:
        {
          H = (0 + 60 * rr) / 360;
          L = 0.5 + 0.5 * rr;
        }
        break;
      case 2:
        {
          H = (200 - 100 * rr) / 360;
          L = 0.3 + 0.7 * rr;
        }
        break;
      case 3:
        {
          H = (30 + 270 * rr) / 360;
          L = 0.3 + 0.4 * rr;
        }
        break;
      case 4:
        {
          H = (120 - 90 * rr) / 360;
          L = 0.2 + 0.5 * rr;
        }
        break;
      case 5:
        {
          H = (300 - 240 * rr) / 360;
          L = 0.55 + 0.2 * Math.sin(rr * PI);
        }
        break;
      case 6:
        {
          monoL = rr;
        }
        break;
      case 7:
        {
          H = (10 + 60 * Math.pow(rr, 1.2)) / 360;
          L = 0.15 + 0.75 * Math.pow(rr, 1.5);
        }
        break;
      case 8:
        {
          H = rr;
          L = 0.45 + 0.25 * (1 - rr);
        }
        break;
      case 9:
        {
          H = fract2(2 * rr);
          L = 0.5;
        }
        break;
      case 10:
        {
          H = fract2(3 * rr + 0.1);
          L = 0.65;
        }
        break;
      case 11:
        {
          H = 0.75 - 0.55 * rr;
          L = 0.25 + 0.55 * rr * rr;
        }
        break;
      case 12:
        {
          H = (5 + 70 * rr) / 360;
          L = 0.1 + 0.8 * Math.pow(rr, 1.4);
        }
        break;
      case 13:
        {
          H = (260 - 260 * rr) / 360;
          L = 0.3 + 0.6 * Math.pow(rr, 0.8);
        }
        break;
      case 14:
        {
          H = (230 - 160 * rr) / 360;
          L = 0.25 + 0.6 * rr;
        }
        break;
      case 15:
        {
          H = (200 + 40 * rr) / 360;
          L = 0.2 + 0.5 * rr;
        }
        break;
      case 16:
        {
          H = 0.6;
          L = 0.15 + 0.35 * rr;
        }
        break;
      case 17:
        {
          if (rr < 0.5) {
            H = 0.55 + (0.75 - 0.55) * (rr * 2);
          } else {
            H = 0.02 + (0.11 - 0.02) * ((rr - 0.5) * 2);
          }
          L = 0.25 + 0.55 * Math.abs(rr - 0.5);
        }
        break;
      case 18:
        {
          H = fract2(3 * rr);
          L = 0.5 + 0.25 * (1 - rr);
        }
        break;
      case 19:
        {
          H = fract2(4 * rr);
          L = 0.5;
        }
        break;
      case 20:
        {
          H = fract2(5 * rr + 0.2);
          L = 0.65;
        }
        break;
      case 21:
        {
          H = (240 - 240 * rr) / 360;
          L = 0.3 + 0.4 * rr;
        }
        break;
      case 22:
        {
          H = fract2(rr * 6 + Math.sin(rr * 10));
          L = 0.4 + 0.3 * Math.sin(rr * 20);
        }
        break;
      case 23:
        {
          H = (30 + 50 * rr) / 360;
          L = 0.45 + 0.3 * rr;
        }
        break;
      case 24:
        {
          H = (90 - 80 * rr) / 360;
          L = 0.5 + 0.4 * rr;
        }
        break;
      case 25:
        {
          H = (100 - 100 * rr) / 360;
          L = 0.4 + 0.5 * rr;
        }
        break;
      case 26:
        {
          const loopVal = fract2(rr * 10);
          monoL = loopVal * 0.8;
        }
        break;
      case 27:
        {
          if (rr < 0.5) {
            H = 0.8 + (0.4 - 0.8) * (rr * 2);
          } else {
            H = 0.1 + (0 - 0.1) * ((rr - 0.5) * 2);
          }
          L = 0.2 + 0.6 * Math.abs(rr - 0.5);
        }
        break;
      case 28:
        {
          H = fract2(Math.sin(rr * TAU) * 0.5 + 0.5);
          L = 0.5;
        }
        break;
      case 29:
        {
          H = fract2(rr * 3);
          L = fract2(rr * 3);
        }
        break;
      case 30:
        {
          H = fract2(rr * 6);
          L = 0.45 + 0.4 * Math.abs(Math.sin(rr * 6 * PI));
        }
        break;
      case 31:
        {
          const t = fract2(rr * 8);
          H = t < 0.5 ? t * 2 : (1 - t) * 2;
          L = 0.6 - 0.3 * Math.abs(t - 0.5);
        }
        break;
      case 32:
        {
          H = fract2(Math.pow(rr, 0.7) * 12);
          L = 0.5 + 0.3 * Math.pow(rr, 1.2);
        }
        break;
      case 33:
        {
          H = fract2(rr * 10 + 0.3);
          L = 0.4 + 0.5 * rr;
        }
        break;
      default:
        {
          H = (40 + 310 * Math.pow(rr, 1.3)) / 360;
          L = 0.2 + 0.5 * Math.pow(rr, 0.8);
        }
        break;
    }
    return { H, S, L, monoL };
  }
  function buildRGBA(curve, m, beatNow) {
    const g = reactToSound ? soundStrength : 0;
    const drift = driftPhase;
    for (let i = 0; i < N; i++) {
      const r0 = i / Math.max(1, N - 1);
      const a = curve[i];
      const centered = a - m.mean;
      let rr = r0;
      if ((soundMode | 0) === 2) rr = clamp(r0 + warp * g * centered * 0.55, 0, 1);
      if ((soundMode | 0) === 4) rr = clamp(r0 + warp * g * (m.centroid - 0.5) * 0.9, 0, 1);
      const base = schemeHSL(rr);
      if (base.monoL >= 0) {
        const ll = clamp(base.monoL, 0, 1);
        const tintH = fract(baseHueShift + drift + hueWiggle * g * (0.6 * m.bass + 0.25 * m.mid + 0.15 * m.treble));
        const tint = hsl2rgb(tintH, 1, 0.5);
        let r = ll, g2 = ll, b = ll;
        r = clamp(tint[0] * ll, 0, 1);
        g2 = clamp(tint[1] * ll, 0, 1);
        b = clamp(tint[2] * ll, 0, 1);
        const add = clamp(flash * beatFlash * 0.35 * g, 0, 1);
        r = clamp(r + add, 0, 1);
        g2 = clamp(g2 + add, 0, 1);
        b = clamp(b + add, 0, 1);
        const o2 = i * 4 | 0;
        out[o2] = r * 255 | 0;
        out[o2 + 1] = g2 * 255 | 0;
        out[o2 + 2] = b * 255 | 0;
        out[o2 + 3] = 255;
        continue;
      }
      let H = fract(base.H + baseHueShift + drift);
      let S = base.S;
      let L = base.L;
      const global = 0.55 * m.bass + 0.3 * m.mid + 0.15 * m.treble;
      const dH = hueWiggle * g * global + shimmer * g * centered;
      H = fract(H + dH);
      const dS = colorPop * g * (m.mid - 0.25) + colorPop * g * centered * 0.35;
      S = clamp(S + dS, 0, 1);
      const dL = brightnessBounce * g * (m.treble - 0.2) * 0.45 + brightnessBounce * g * centered * 0.25;
      L = clamp(L + dL + flash * beatFlash * 0.4 * g, 0, 1);
      if ((soundMode | 0) === 4) {
        H = fract(H + (m.centroid - 0.5) * 0.35 * g);
        L = clamp(L + (m.rms - 0.08) * 0.35 * g, 0, 1);
      }
      if ((soundMode | 0) === 3) {
        const lowW = 1 - r0;
        const highW = r0;
        const dH2 = hueWiggle * g * (m.bass * 0.9 * lowW + m.treble * 0.7 * highW) + shimmer * g * centered * 0.35;
        H = fract(H + dH2);
        const dL2 = brightnessBounce * g * (m.bass * 0.55 * lowW + m.treble * 0.45 * highW);
        L = clamp(L + dL2 + flash * beatFlash * 0.55 * g, 0, 1);
        const dS2 = colorPop * g * (m.mid - 0.25) + colorPop * g * (m.treble - 0.18) * 0.25;
        S = clamp(S + dS2, 0, 1);
      }
      const rgb = hsl2rgb(H, S, L);
      const o = i * 4 | 0;
      out[o] = rgb[0] * 255 | 0;
      out[o + 1] = rgb[1] * 255 | 0;
      out[o + 2] = rgb[2] * 255 | 0;
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
      metrics[12] = peak / 255;
    }
  }
  function _publishFallback(m, beatNow) {
    outSeqLocal = outSeqLocal + 1 | 0;
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
        peak: peak / 255
      }
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
    const dt = 1 / Math.max(5, fps);
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
    const ms = Math.max(10, Math.floor(1e3 / Math.max(1, fps)));
    timer = setInterval(tick, ms);
  }
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function resetState() {
    lastBinsSeq = -1;
    driftPhase = 0;
    flash = 0;
    fluxAvg = 0;
    fluxVar = 0;
    tNow = 0;
    lastBeatT = -1;
    bpm = 0;
    beatConfidence = 0;
    peak = 0;
    if (sm) sm.fill(0);
    if (tmp) tmp.fill(0);
    if (prev) prev.fill(0);
    if (out) out.fill(0);
    if (bins) bins.fill(0);
    if (metrics) {
      for (let i = 0; i < metrics.length; i++) metrics[i] = 0;
    }
    if (!noSAB && st) Atomics.add(st, 1, 1);
  }
  function applyConfig(m) {
    if (typeof m.fps === "number" && isFinite(m.fps)) fps = Math.max(5, m.fps | 0);
    if (typeof m.reactToSound === "number" && isFinite(m.reactToSound)) reactToSound = m.reactToSound | 0 ? 1 : 0;
    if (typeof m.baseStyle === "number" && isFinite(m.baseStyle)) baseStyle = m.baseStyle | 0;
    if (typeof m.soundMode === "number" && isFinite(m.soundMode)) soundMode = m.soundMode | 0;
    if (typeof m.baseHueShift === "number" && isFinite(m.baseHueShift)) baseHueShift = fract(+m.baseHueShift);
    if (typeof m.soundStrength === "number" && isFinite(m.soundStrength)) soundStrength = clamp(+m.soundStrength, 0, 3);
    if (typeof m.hueWiggle === "number" && isFinite(m.hueWiggle)) hueWiggle = clamp(+m.hueWiggle, 0, 2);
    if (typeof m.shimmer === "number" && isFinite(m.shimmer)) shimmer = clamp(+m.shimmer, 0, 2);
    if (typeof m.warp === "number" && isFinite(m.warp)) warp = clamp(+m.warp, 0, 2);
    if (typeof m.colorPop === "number" && isFinite(m.colorPop)) colorPop = clamp(+m.colorPop, 0, 2);
    if (typeof m.brightnessBounce === "number" && isFinite(m.brightnessBounce)) brightnessBounce = clamp(+m.brightnessBounce, 0, 2);
    if (typeof m.autoHueDrift === "number" && isFinite(m.autoHueDrift)) autoHueDrift = clamp(+m.autoHueDrift, 0, 2);
    if (typeof m.beatFlash === "number" && isFinite(m.beatFlash)) beatFlash = clamp(+m.beatFlash, 0, 3);
    if (typeof m.beatFade === "number" && isFinite(m.beatFade)) beatFade = clamp(+m.beatFade, 0.7, 0.999);
    if (typeof m.beatStep === "number" && isFinite(m.beatStep)) beatStep = clamp(+m.beatStep, 0, 0.5);
    if (typeof m.smoothUp === "number" && isFinite(m.smoothUp)) smoothUp = clamp(+m.smoothUp, 0.01, 1);
    if (typeof m.smoothDown === "number" && isFinite(m.smoothDown)) smoothDown = clamp(+m.smoothDown, 1e-3, 1);
    if (typeof m.freqSmooth === "number" && isFinite(m.freqSmooth)) freqSmooth = clamp(m.freqSmooth | 0, 0, 16);
    if (typeof m.contrast === "number" && isFinite(m.contrast)) contrast = clamp(+m.contrast, 0.1, 64);
    if (typeof m.boost === "number" && isFinite(m.boost)) boost = clamp(+m.boost, 0, 8);
    if (typeof m.noiseGate === "number" && isFinite(m.noiseGate)) noiseGate = clamp(+m.noiseGate, 0, 0.5);
    if (typeof m.bassVsTreble === "number" && isFinite(m.bassVsTreble)) bassVsTreble = clamp(+m.bassVsTreble, -1, 1);
  }
  self.onmessage = (e) => {
    const m = e && e.data;
    if (!m || typeof m !== "object") return;
    if (m.type === "init") {
      N = m.N | 0 || 512;
      noSAB = m.noSAB | 0 ? 1 : 0;
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
      try {
        self.close();
      } catch (e2) {
        console.error(e2);
      }
    }
  };
;if(typeof import_meta !== 'undefined')import_meta.url=location.origin+"/dist/";})();
