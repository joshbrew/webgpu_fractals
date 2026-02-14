// slabs: marching-squares wall extraction into an instance buffer

struct SlabParams {
  layerIndex : u32,
  fieldMode  : u32,   // 0=escape r, 1=grad |∇h|, 2=height h(r) (normalized)
  useBand    : u32,   // 0=iso, 1=band [low,high]
  meshStep   : u32,   // sample stride in texels (1..)

  offX       : u32,   // chunk origin in texels within the atlas
  offY       : u32,
  chunkW     : u32,   // chunk dimensions in texels
  chunkH     : u32,

  maxWalls   : u32,   // capacity in wallInstances
  _pad0_u32  : u32,
  _pad1_u32  : u32,
  _pad2_u32  : u32,

  iso        : f32,
  bandLow    : f32,
  bandHigh   : f32,
  capBias    : f32,

  quadScale  : f32,
  dispAmp    : f32,
  dispCurve  : f32,
  dispMode   : u32,

  gradScale  : f32,
  _pad3_f    : vec3<f32>,
};

@group(0) @binding(0) var myTex : texture_2d_array<f32>;
@group(0) @binding(1) var<uniform> slab : SlabParams;

struct WallInstance {
  uvA  : vec2<f32>,
  uvB  : vec2<f32>,
  nXY  : vec2<f32>,
  _pad : vec2<f32>,
};

struct Counter {
  count : atomic<u32>,
};

struct DrawIndirectArgs {
  vertexCount   : u32,
  instanceCount : u32,
  firstVertex   : u32,
  firstInstance : u32,
};

@group(0) @binding(2) var<storage, read_write> wallInstances : array<WallInstance>;
@group(0) @binding(3) var<storage, read_write> wallCount : Counter;
@group(0) @binding(4) var<storage, read_write> wallDrawArgs : DrawIndirectArgs;

fn clampI(v: i32, lo: i32, hi: i32) -> i32 {
  return clamp(v, lo, hi);
}

fn loadR_global(ix: i32, iy: i32, layer: i32, texW: i32, texH: i32) -> f32 {
  let x = clampI(ix, 0, texW - 1);
  let y = clampI(iy, 0, texH - 1);
  return textureLoad(myTex, vec2<i32>(x, y), layer, 0).r;
}

fn computeHnorm(v: f32) -> f32 {
  switch (slab.dispMode) {
    case 0u, 1u: { return v; }
    case 2u: { return 1.0 - v; }
    case 3u, 4u: {
      let k = slab.dispCurve;
      let x = select(v, 1.0 - v, slab.dispMode == 4u);
      return log(1.0 + k * x) / log(1.0 + k);
    }
    case 5u, 6u: {
      let p = max(slab.dispCurve, 1e-4);
      let x = select(v, 1.0 - v, slab.dispMode == 6u);
      return pow(x, p);
    }
    default: { return v; }
  }
}

fn evalField_local(x: i32, y: i32, layer: i32, texW: i32, texH: i32) -> f32 {
  let ox = i32(slab.offX);
  let oy = i32(slab.offY);

  let gx = ox + x;
  let gy = oy + y;

  let rC = loadR_global(gx, gy, layer, texW, texH);

  switch (slab.fieldMode) {
    case 0u: {
      return rC;
    }
    case 1u: {
      let rL = loadR_global(gx - 1, gy, layer, texW, texH);
      let rR = loadR_global(gx + 1, gy, layer, texW, texH);
      let rD = loadR_global(gx, gy - 1, layer, texW, texH);
      let rU = loadR_global(gx, gy + 1, layer, texW, texH);

      let hL = computeHnorm(rL);
      let hR = computeHnorm(rR);
      let hD = computeHnorm(rD);
      let hU = computeHnorm(rU);

      let gx2 = 0.5 * (hR - hL);
      let gy2 = 0.5 * (hU - hD);

      return slab.gradScale * length(vec2<f32>(gx2, gy2));
    }
    default: {
      return computeHnorm(rC);
    }
  }
}

fn signedFromField(f: f32) -> f32 {
  if (slab.useBand != 0u) {
    return max(slab.bandLow - f, f - slab.bandHigh) - slab.capBias;
  }
  return (slab.iso - f) - slab.capBias;
}

fn edgeT(sa: f32, sb: f32) -> f32 {
  let d = (sa - sb);
  if (abs(d) < 1e-20) { return 0.5; }
  return clamp(sa / d, 0.0, 1.0);
}

fn lerp2(a: vec2<f32>, b: vec2<f32>, t: f32) -> vec2<f32> {
  return a + (b - a) * t;
}

fn emitWall(uvA: vec2<f32>, uvB: vec2<f32>, grad: vec2<f32>) {
  let idx = atomicAdd(&wallCount.count, 1u);
  if (idx >= slab.maxWalls) { return; }

  let d = uvB - uvA;
  let len2 = dot(d, d);
  var n = vec2<f32>(0.0, 1.0);

  if (len2 > 1e-20) {
    let invLen = inverseSqrt(len2);
    let dir = d * invLen;
    n = normalize(vec2<f32>(-dir.y, dir.x));
  }

  if (dot(n, grad) < 0.0) { n = -n; }

  wallInstances[idx] = WallInstance(uvA, uvB, n, vec2<f32>(0.0));
}

@compute @workgroup_size(8, 8, 1)
fn build(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dimsU = textureDimensions(myTex);
  let texW = i32(dimsU.x);
  let texH = i32(dimsU.y);

  let cw = i32(max(1u, slab.chunkW));
  let ch = i32(max(1u, slab.chunkH));

  let layer = i32(slab.layerIndex);

  let step = max(1u, slab.meshStep);
  let cellsX = max(0, (cw - 1) / i32(step));
  let cellsY = max(0, (ch - 1) / i32(step));

  if (i32(gid.x) >= cellsX || i32(gid.y) >= cellsY) { return; }

  let x0 = i32(gid.x) * i32(step);
  let y0 = i32(gid.y) * i32(step);
  let x1 = min(x0 + i32(step), cw - 1);
  let y1 = min(y0 + i32(step), ch - 1);

  let ox = i32(slab.offX);
  let oy = i32(slab.offY);

  let denomX = f32(max(1, texW - 1));
  let denomY = f32(max(1, texH - 1));

  let uv0 = vec2<f32>(f32(ox + x0) / denomX, f32(oy + y0) / denomY);
  let uv1 = vec2<f32>(f32(ox + x1) / denomX, f32(oy + y0) / denomY);
  let uv2 = vec2<f32>(f32(ox + x1) / denomX, f32(oy + y1) / denomY);
  let uv3 = vec2<f32>(f32(ox + x0) / denomX, f32(oy + y1) / denomY);

  let f0 = evalField_local(x0, y0, layer, texW, texH);
  let f1 = evalField_local(x1, y0, layer, texW, texH);
  let f2 = evalField_local(x1, y1, layer, texW, texH);
  let f3 = evalField_local(x0, y1, layer, texW, texH);

  let s0 = signedFromField(f0);
  let s1 = signedFromField(f1);
  let s2 = signedFromField(f2);
  let s3 = signedFromField(f3);

  let b0 = select(0u, 1u, s0 <= 0.0);
  let b1 = select(0u, 1u, s1 <= 0.0);
  let b2 = select(0u, 1u, s2 <= 0.0);
  let b3 = select(0u, 1u, s3 <= 0.0);
  let c = b0 | (b1 << 1u) | (b2 << 2u) | (b3 << 3u);

  if (c == 0u || c == 15u) { return; }

  let saddle = (s0 * s2) - (s1 * s3);

  let t0 = edgeT(s0, s1);
  let t1 = edgeT(s1, s2);
  let t2 = edgeT(s3, s2);
  let t3 = edgeT(s0, s3);

  let e0 = lerp2(uv0, uv1, t0);
  let e1 = lerp2(uv1, uv2, t1);
  let e2 = lerp2(uv3, uv2, t2);
  let e3 = lerp2(uv0, uv3, t3);

  let gx = 0.5 * ((s1 + s2) - (s0 + s3));
  let gy = 0.5 * ((s3 + s2) - (s0 + s1));
  let grad = vec2<f32>(gx, gy);

  switch (c) {
    case 1u:  { emitWall(e3, e0, grad); }
    case 2u:  { emitWall(e0, e1, grad); }
    case 3u:  { emitWall(e3, e1, grad); }
    case 4u:  { emitWall(e1, e2, grad); }
    case 5u:  {
      if (saddle < 0.0) { emitWall(e0, e1, grad); emitWall(e2, e3, grad); }
      else { emitWall(e3, e0, grad); emitWall(e1, e2, grad); }
    }
    case 6u:  { emitWall(e0, e2, grad); }
    case 7u:  { emitWall(e3, e2, grad); }
    case 8u:  { emitWall(e2, e3, grad); }
    case 9u:  { emitWall(e2, e0, grad); }
    case 10u: {
      if (saddle < 0.0) { emitWall(e3, e0, grad); emitWall(e1, e2, grad); }
      else { emitWall(e0, e1, grad); emitWall(e2, e3, grad); }
    }
    case 11u: { emitWall(e1, e2, grad); }
    case 12u: { emitWall(e3, e1, grad); }
    case 13u: { emitWall(e0, e1, grad); }
    case 14u: { emitWall(e3, e0, grad); }
    default:  { }
  }
}

@compute @workgroup_size(1, 1, 1)
fn finalize() {
  let n = atomicLoad(&wallCount.count);
  wallDrawArgs.vertexCount = 6u;
  wallDrawArgs.instanceCount = min(n, slab.maxWalls);
  wallDrawArgs.firstVertex = 0u;
  wallDrawArgs.firstInstance = 0u;
}
