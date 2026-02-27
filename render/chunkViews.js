// render/chunkViews.js
function _cloneWithoutSdf(c) {
  const clone = Object.assign({}, c);

  delete clone.sdfView;
  delete clone.sdfLayerViews;
  delete clone.sdfViews;
  delete clone.sdfTex;
  delete clone.sdfTexture;

  delete clone.flagView;
  delete clone.flagLayerViews;
  delete clone.flagViews;
  delete clone.flagTex;
  delete clone.flagTexture;

  delete clone._tmpSdfTex;
  delete clone._tmpFlagTex;
  delete clone._usingTmpSdfFallback;

  return clone;
}

export function createChunkViewCache() {
  let _noSdfCacheSrc = null;
  let _noSdfCache = null;

  let _withSdfCacheSrc = null;
  let _withSdfCache = null;

  function invalidate() {
    _noSdfCacheSrc = null;
    _noSdfCache = null;
    _withSdfCacheSrc = null;
    _withSdfCache = null;
  }

  function withoutSdf(chunks = []) {
    if (_noSdfCacheSrc === chunks && _noSdfCache) return _noSdfCache;
    const out = (chunks || []).map(_cloneWithoutSdf);
    _noSdfCacheSrc = chunks;
    _noSdfCache = out;
    return out;
  }

  function withSdf(chunks = []) {
    if (_withSdfCacheSrc === chunks && _withSdfCache) return _withSdfCache;
    const out = (chunks || []).map((c) => Object.assign({}, c));
    _withSdfCacheSrc = chunks;
    _withSdfCache = out;
    return out;
  }

  return { invalidate, withoutSdf, withSdf };
}

export function cleanupTempFallbacks(chunks = []) {
  for (const c of chunks) {
    if (c._tmpSdfTex) {
      try {
        c._tmpSdfTex.destroy();
      } catch {}
      delete c._tmpSdfTex;
    }
    if (c._tmpFlagTex) {
      try {
        c._tmpFlagTex.destroy();
      } catch {}
      delete c._tmpFlagTex;
    }
    if (c._usingTmpSdfFallback) delete c._usingTmpSdfFallback;
  }
}

export function destroySdfAttachments(chunks = []) {
  for (const c of chunks) {
    try {
      if (c.sdfTex) {
        try {
          c.sdfTex.destroy();
        } catch {}
      }
    } catch {}

    try {
      if (c.flagTex) {
        try {
          c.flagTex.destroy();
        } catch {}
      }
    } catch {}

    try {
      if (c._tmpSdfTex) {
        try {
          c._tmpSdfTex.destroy();
        } catch {}
      }
    } catch {}

    try {
      if (c._tmpFlagTex) {
        try {
          c._tmpFlagTex.destroy();
        } catch {}
      }
    } catch {}

    delete c.sdfView;
    delete c.sdfLayerViews;
    delete c.sdfViews;
    delete c.sdfTex;
    delete c.sdfTexture;

    delete c.flagView;
    delete c.flagLayerViews;
    delete c.flagViews;
    delete c.flagTex;
    delete c.flagTexture;

    delete c._tmpSdfTex;
    delete c._tmpFlagTex;
    delete c._usingTmpSdfFallback;
  }
}