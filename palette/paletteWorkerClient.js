// palette/paletteWorkerClient.js
import paletteWorkerURL from "./palette.worker.js";

function _hasSAB() {
  return typeof SharedArrayBuffer !== "undefined" && !!globalThis.crossOriginIsolated;
}

export function createPaletteWorkerClient(analyser, initialConfig = {}) {
  const N = 512;

  const sabOk = _hasSAB();
  const w = new Worker(paletteWorkerURL);

  let ready = false;
  let error = null;

  const binsTmp = new Uint8Array(N);

  let binsSAB = null;
  let outSAB = null;
  let stateSAB = null;
  let metricsSAB = null;

  let binsView = null;
  let outView = null;
  let st = null;
  let met = null;

  let outFallback = new Uint8Array(N * 4);
  let metFallback = {
    mean: 0, rms: 0, centroid: 0,
    bass: 0, mid: 0, treble: 0,
    flux: 0, beat: 0,
    driftPhase: 0, hueDriver: 0,
    bpm: 0, beatConfidence: 0,
    peak: 0,
  };
  let outSeqFallback = 0;

  w.onmessage = (e) => {
    const m = e && e.data;
    if (!m || typeof m !== "object") return;

    if (m.type === "ready") {
      ready = true;
      return;
    }

    if (m.type === "error") {
      error = String(m.message || "worker error");
      return;
    }

    if (m.type === "rgba") {
      const rgba = m.rgba;
      if (rgba && rgba.length === outFallback.length) outFallback.set(rgba);
      outSeqFallback = (m.seq | 0) || (outSeqFallback + 1);

      if (m.metrics && typeof m.metrics === "object") {
        metFallback = { ...metFallback, ...m.metrics };
      }
    }
  };

  w.onerror = (e) => {
    error = (e && e.message) ? e.message : "worker error";
  };

  if (sabOk) {
    binsSAB = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * N);
    outSAB = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * (N * 4));
    stateSAB = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    metricsSAB = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 16);

    binsView = new Uint8Array(binsSAB);
    outView = new Uint8Array(outSAB);
    st = new Int32Array(stateSAB);
    met = new Float32Array(metricsSAB);

    Atomics.store(st, 0, 0);
    Atomics.store(st, 1, 0);

    w.postMessage({
      type: "init",
      N,
      binsSAB,
      outSAB,
      stateSAB,
      metricsSAB,
      ...initialConfig,
    });
  } else {
    w.postMessage({
      type: "init",
      N,
      noSAB: 1,
      ...initialConfig,
    });
  }

  function pumpBins() {
    if (!analyser || typeof analyser.getByteFrequencyData !== "function") return;

    analyser.getByteFrequencyData(binsTmp);

    if (sabOk && binsView && st) {
      binsView.set(binsTmp);
      Atomics.add(st, 0, 1);
    } else {
      try { w.postMessage({ type: "bins", bins: binsTmp }); } catch (e) {console.error(e);}
    }
  }

  function getRGBA() {
    return sabOk && outView ? outView : outFallback;
  }

  function getOutSeq() {
    return sabOk && st ? (Atomics.load(st, 1) | 0) : (outSeqFallback | 0);
  }

  function readMetrics() {
    if (sabOk && met) {
      return {
        mean: met[0] || 0,
        rms: met[1] || 0,
        centroid: met[2] || 0,
        bass: met[3] || 0,
        mid: met[4] || 0,
        treble: met[5] || 0,
        flux: met[6] || 0,
        beat: met[7] || 0,
        driftPhase: met[8] || 0,
        hueDriver: met[9] || 0,
        bpm: met[10] || 0,
        beatConfidence: met[11] || 0,
        peak: met[12] || 0,
      };
    }
    return metFallback;
  }

  function config(c) {
    try { w.postMessage({ type: "config", ...(c || {}) }); } catch (e) {console.error(e);}
  }

  function reset() {
    binsTmp.fill(0);
    if (sabOk && binsView && st) {
      binsView.fill(0);
      Atomics.add(st, 0, 1);
    } else {
      try { w.postMessage({ type: "bins", bins: binsTmp }); } catch (e) {console.error(e);}
    }
    try { w.postMessage({ type: "reset" }); } catch (e) {console.error(e);}
  }

  function stop() {
    try { w.postMessage({ type: "stop" }); } catch (e) {console.error(e);}
    try { w.terminate(); } catch (e) {console.error(e);}
  }

  function getState() {
    return { ready, error, sabOk };
  }

  return {
    pumpBins,
    getRGBA,
    getOutSeq,
    readMetrics,
    config,
    reset,
    stop,
    getState,
  };
}
