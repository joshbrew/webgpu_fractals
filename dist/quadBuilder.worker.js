(() => {
  // workers/smartBuffers.js
  var hasSAB = typeof SharedArrayBuffer !== "undefined";
  function allocTyped(Type, length) {
    const buf = hasSAB ? new SharedArrayBuffer(Type.BYTES_PER_ELEMENT * length) : new ArrayBuffer(Type.BYTES_PER_ELEMENT * length);
    return new Type(buf);
  }
  function transferList(buffers) {
    const filtered = hasSAB ? buffers.filter((b) => !(b instanceof SharedArrayBuffer)) : buffers;
    if (filtered.length > 0) return filtered;
    return void 0;
  }

  // workers/quadBuilder.worker.js
  self.onmessage = (e) => {
    const { id, payload } = e.data;
    const {
      divs,
      y0,
      quadRows,
      ownFirstRow,
      vBuf: incomingVBuf,
      iBuf: incomingIBuf
    } = payload;
    const useShared = hasSAB && incomingVBuf && incomingIBuf;
    const vertsPerRow = divs + 1;
    const vertRows = quadRows + (ownFirstRow ? 1 : 2);
    const localVerts = vertRows * vertsPerRow;
    const localIdx = quadRows * divs * 6;
    const vData = useShared ? new Float32Array(incomingVBuf) : allocTyped(Float32Array, localVerts * 5);
    const iData = useShared ? new Uint32Array(incomingIBuf) : allocTyped(Uint32Array, localIdx);
    let vPtr = 0, iPtr = 0;
    let prevRowStart = null;
    let skipFirstRow = !ownFirstRow;
    const firstGlobalRow = ownFirstRow ? y0 : y0 - 1;
    for (let gr = 0; gr < vertRows; gr++) {
      const gy = firstGlobalRow + gr;
      const v = gy / divs;
      const rowStart = vPtr / 5;
      for (let x = 0; x <= divs; x++) {
        const u = x / divs;
        vData[vPtr++] = u;
        vData[vPtr++] = v;
        vData[vPtr++] = 0;
        vData[vPtr++] = u;
        vData[vPtr++] = v;
        if (prevRowStart !== null && !skipFirstRow && x < divs) {
          const i0 = prevRowStart + x;
          const i1 = i0 + 1;
          const i2 = rowStart + x;
          const i3 = i2 + 1;
          iData[iPtr++] = i0;
          iData[iPtr++] = i1;
          iData[iPtr++] = i2;
          iData[iPtr++] = i1;
          iData[iPtr++] = i3;
          iData[iPtr++] = i2;
        }
      }
      prevRowStart = rowStart;
      if (skipFirstRow) skipFirstRow = false;
    }
    if (useShared) {
      self.postMessage({
        id,
        result: {
          indexCount: iData.length,
          y0,
          y1: y0 + quadRows,
          shared: true
        }
      });
    } else {
      self.postMessage({
        id,
        result: {
          vArray: vData.buffer,
          iArray: iData.buffer,
          indexCount: iData.length,
          y0,
          y1: y0 + quadRows,
          shared: false
        }
      }, transferList([vData.buffer, iData.buffer]));
    }
  };
;if(typeof import_meta !== 'undefined')import_meta.url=location.origin+"/dist/";})();
