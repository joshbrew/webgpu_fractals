// QueryComputeGPU.js
// Small, self-contained wrapper around a WGSL "height query" compute shader.
// Responsibilities:
//  - manage small GPU buffers used to ask "what's the height/normal/flag at this world X,Y"
//  - build per-chunk bind-groups (cached) that bind the chunk's SDF / flag textures
//  - dispatch the compute shader and return a Float32Array with the shader's results
//
// Usage:
//   const q = new QueryComputeGPU(device, queryWGSL, sampler, renderUniformBuffer, { uniformQuerySize:16, queryResultBytes:288 });
//   const result = await q.query(worldX, worldY, chunkInfos, paramsState, layerIndex);
//   q.destroy();
import computeWGSL from './fheightQueryCompute.wgsl';

export class QueryComputeGPU {
  /**
   * @param {GPUDevice} device
   * @param {string} [queryWGSL=computeWGSL] - WGSL source
   * @param {GPUSampler} sampler - sampler used to sample SDF textures
   * @param {GPUBuffer} renderUniformBuffer - UBO used by the shader for render params (binding 3)
   * @param {object} [opts]
   * @param {number} [opts.uniformQuerySize=16] - size in bytes for cam query UBO (rounded up to 16)
   * @param {number} [opts.queryResultBytes=288] - bytes the shader will write to the storage buffer (rounded to 16)
   */
  constructor(device, queryWGSL = computeWGSL, sampler, renderUniformBuffer, opts = {}) {
    this.device = device;
    this.sampler = sampler;
    this.renderUniformBuffer = renderUniformBuffer;

    // uniformQuerySize must be >= 16 and 16-aligned
    const requestedQuerySize = opts.uniformQuerySize ?? 16;
    this.uniformQuerySize = Math.max(16, Math.ceil(requestedQuerySize / 16) * 16);

    // Result bytes (what shader writes). Default 288 (72 floats * 4). Force minimum & 16-align.
    const requestedResult = opts.queryResultBytes ?? 288;
    this.QUERY_RESULT_BYTES = Math.max(288, Math.ceil(requestedResult / 16) * 16);

    // Compile module + pipeline + bind-group-layout
    this._module = device.createShaderModule({ code: queryWGSL });

    this._bgl = device.createBindGroupLayout({
      entries: [
        // 0: camQuery (uniform)
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform', minBindingSize: this.uniformQuerySize } },
        // 1: sdf texture (2d-array)
        { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { viewDimension: '2d-array' } },
        // 2: sampler
        { binding: 2, visibility: GPUShaderStage.COMPUTE, sampler: {} },
        // 3: render params UBO (reuse external buffer)
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        // 4: result storage buffer (shader writes into this)
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage', minBindingSize: this.QUERY_RESULT_BYTES } },
        // 5: tile UBO (vec4) describing this chunk's UV offset/scale
        { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform', minBindingSize: 16 } },
        // 6: flag storage texture (r32uint 2d-array)
        { binding: 6, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-only', format: 'r32uint', viewDimension: '2d-array' } }
      ]
    });

    this._pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this._bgl] }),
      compute: { module: this._module, entryPoint: 'main' }
    });

    // Small GPU buffers we control
    this._camQueryBuf = device.createBuffer({
      size: this.uniformQuerySize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this._tileUBuf = device.createBuffer({
      size: 16, // vec4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Storage buffer where the compute shader writes its output
    this._resultBuf = device.createBuffer({
      size: this.QUERY_RESULT_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    // Bind-group cache keyed by `${chunk.offsetX}:${layerIndex}`
    this._bgCache = new Map();

    // convenience noop - can be called to clear cached bind groups when textures are recreated
    this.clearCache = () => { this._bgCache.clear(); };
  }

  /**
   * Find the chunk index that contains worldX.
   * @param {number} worldX
   * @param {Array} chunks
   * @param {object} paramsState
   * @returns {number}
   */
  idxForWorldX(worldX, chunks, paramsState) {
    const half = paramsState.quadScale;
    const uGlobal = (worldX + half) / (2 * half);
    const pixelX = Math.floor(uGlobal * paramsState.gridSize);
    for (let i = 0; i < chunks.length; ++i) {
      const c = chunks[i];
      if (pixelX >= c.offsetX && pixelX < c.offsetX + c.width) return i;
    }
    return 0;
  }

  _chooseSdfView(chunk, layerIndex = 0) {
    if (Array.isArray(chunk.sdfLayerViews) && chunk.sdfLayerViews[layerIndex]) return chunk.sdfLayerViews[layerIndex];
    if (chunk.sdfView) return chunk.sdfView;
    if (chunk.sdfTex) {
      // try to create a single-layer 2d-array view; fall back to 2d view if not supported
      try { return chunk.sdfTex.createView({ dimension: '2d-array', baseArrayLayer: layerIndex, arrayLayerCount: 1 }); }
      catch (e) { try { return chunk.sdfTex.createView({ dimension: '2d' }); } catch (e2) { return null; } }
    }
    return null;
  }

  _chooseFlagView(chunk, layerIndex = 0) {
    if (Array.isArray(chunk.flagLayerViews) && chunk.flagLayerViews[layerIndex]) return chunk.flagLayerViews[layerIndex];
    if (chunk.flagView) return chunk.flagView;
    if (chunk.flagTex) {
      try { return chunk.flagTex.createView({ dimension: '2d-array', baseArrayLayer: layerIndex, arrayLayerCount: 1 }); }
      catch (e) { try { return chunk.flagTex.createView({ dimension: '2d' }); } catch (e2) { return null; } }
    }
    return null;
  }

  /**
   * Query the compute shader for the 3x3 neighbourhood + centre at worldX,worldY.
   * Returns Float32Array or null.
   *
   * @param {number} worldX
   * @param {number} worldY
   * @param {Array} chunks - chunkInfos produced by fractal compute
   * @param {object} paramsState - renderGlobals.paramsState
   * @param {number} [layerIndex=0]
   * @returns {Promise<Float32Array|null>}
   */
  async query(worldX, worldY, chunks, paramsState, layerIndex = 0) {
    if (!Array.isArray(chunks) || chunks.length === 0) return null;

    // Which chunk covers worldX?
    const tileIdx = this.idxForWorldX(worldX, chunks, paramsState);
    const t = chunks[tileIdx];

    // Prepare tile UBO: [tileOffsetX / gridSize, 0, tileWidth / gridSize, 1]
    const gs = paramsState.gridSize;
    this.device.queue.writeBuffer(this._tileUBuf, 0, new Float32Array([t.offsetX / gs, 0, t.width / gs, 1]));

    // Build (or reuse) per-chunk bind group
    const cacheKey = `${t.offsetX}:${layerIndex}`;
    let bg = this._bgCache.get(cacheKey);
    if (!bg) {
      const sdfView = this._chooseSdfView(t, layerIndex);
      const flagView = this._chooseFlagView(t, layerIndex);
      if (!sdfView || !flagView) {
        // The caller should ensure sdf/flag views exist (or used computeSdfLayer fallback). Return null instead of throwing
        // to allow fallback behavior upstream.
        throw new Error('QueryComputeGPU: missing sdf/flag view for chunk; make sure SDF compute succeeded or fallbacks exist.');
      }

      bg = this.device.createBindGroup({
        layout: this._bgl,
        entries: [
          { binding: 0, resource: { buffer: this._camQueryBuf, offset: 0, size: this.uniformQuerySize } },
          { binding: 1, resource: sdfView },
          { binding: 2, resource: this.sampler },
          { binding: 3, resource: { buffer: this.renderUniformBuffer } },
          { binding: 4, resource: { buffer: this._resultBuf, offset: 0, size: this.QUERY_RESULT_BYTES } },
          { binding: 5, resource: { buffer: this._tileUBuf, offset: 0, size: 16 } },
          { binding: 6, resource: flagView }
        ]
      });

      this._bgCache.set(cacheKey, bg);
    }

    // Write camera query (worldX, worldY) padded to vec4
    const camArr = new Float32Array([worldX, worldY, 0.0, 0.0]);
    this.device.queue.writeBuffer(this._camQueryBuf, 0, camArr);

    // Dispatch compute pass
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(this._pipeline);
    pass.setBindGroup(0, bg);
    pass.dispatchWorkgroups(1);
    pass.end();

    // Copy result into a mappable buffer and read back
    const readBuf = this.device.createBuffer({
      size: this.QUERY_RESULT_BYTES,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    enc.copyBufferToBuffer(this._resultBuf, 0, readBuf, 0, this.QUERY_RESULT_BYTES);

    this.device.queue.submit([enc.finish()]);

    await readBuf.mapAsync(GPUMapMode.READ);
    const mapped = readBuf.getMappedRange();
    const out = new Float32Array(mapped).slice(); // copy out
    readBuf.unmap();

    return out;
  }

  destroy() {
    try { this._camQueryBuf.destroy(); } catch (e) {}
    try { this._tileUBuf.destroy(); } catch (e) {}
    try { this._resultBuf.destroy(); } catch (e) {}
    this._bgCache.clear();
  }
}
