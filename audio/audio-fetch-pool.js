// audio/audio-fetch-pool.js
export function createAudioFetchPool(workerURL, opts = {}) {
  const size = Math.max(1, (opts.size | 0) || 1);

  let nextWorker = 0;
  let nextId = 1;

  const workers = [];
  const pending = new Map();

  function _rejectPendingForWorker(w, err) {
    for (const [id, p] of pending) {
      if (p.worker !== w) continue;
      pending.delete(id);
      try {
        p.reject(err);
      } catch (e) {console.error(e);}
    }
  }

  function _serializeHeaders(h) {
    if (!h) return undefined;

    try {
      if (Array.isArray(h)) return h;
    } catch (e) {console.error(e);}

    try {
      if (typeof Headers !== "undefined" && h instanceof Headers) {
        return Array.from(h.entries());
      }
    } catch (e) {console.error(e);}

    if (typeof h === "object") {
      const out = {};
      for (const k of Object.keys(h)) {
        const v = h[k];
        if (v == null) continue;
        out[k] = String(v);
      }
      return out;
    }

    return undefined;
  }

  function _spawnWorker() {
    const w = new Worker(workerURL, { type: "module" });

    w.onmessage = (e) => {
      const m = e && e.data;
      if (!m || typeof m !== "object") return;

      const p = pending.get(m.id);
      if (!p) return;

      pending.delete(m.id);

      if (m.ok) {
        p.resolve(m.buf);
      } else {
        p.reject(Object.assign(new Error(m.statusText || "Fetch failed"), { status: m.status || 0 }));
      }
    };

    w.onerror = (err) => {
      _rejectPendingForWorker(w, Object.assign(new Error("Worker error"), { cause: err }));

      if (opts.autoRespawn !== false) {
        try {
          w.terminate();
        } catch (e) {console.error(e);}
        const idx = workers.indexOf(w);
        if (idx >= 0) workers[idx] = _spawnWorker();
      }
    };

    w.onmessageerror = (err) => {
      _rejectPendingForWorker(w, Object.assign(new Error("Worker message error"), { cause: err }));
    };

    return w;
  }

  for (let i = 0; i < size; i++) {
    workers.push(_spawnWorker());
  }

  function fetchArrayBuffer(url, xhrLike) {
    const id = nextId++;
    const w = workers[(nextWorker++ % workers.length) | 0];

    const u = typeof url === "string" ? url : String(url || "");
    const method = (xhrLike && xhrLike.method) || "GET";
    const headers = _serializeHeaders(xhrLike && xhrLike.headers);
    const withCreds = !!(xhrLike && xhrLike.withCredentials);

    const init = {
      method,
      headers,
      credentials: withCreds ? "include" : "same-origin",
      mode: opts.mode || "cors",
    };

    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, worker: w });

      try {
        w.postMessage({ type: "fetch", id, url: u, init });
      } catch (err) {
        pending.delete(id);
        reject(Object.assign(new Error("Worker postMessage failed"), { cause: err }));
      }
    });
  }

  function destroy() {
    for (const [id, p] of pending) {
      pending.delete(id);
      try {
        p.reject(new Error("Audio fetch pool destroyed"));
      } catch (e) {console.error(e);}
    }

    for (const w of workers) {
      try {
        w.terminate();
      } catch (e) {console.error(e);}
    }
  }

  return { fetchArrayBuffer, destroy };
}