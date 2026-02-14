// shaders/fSlabCapsRender.wgsl

struct Camera {
  viewProj : mat4x4<f32>,
  camPos   : vec4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct RenderParams {
  layerIndex  : u32,
  scheme      : u32,
  dispMode    : u32,
  bowlOn      : u32,

  hueOffset   : f32,
  dispAmp     : f32,
  dispCurve   : f32,
  bowlDepth   : f32,

  quadScale   : f32,
  gridSize    : f32,
  lightingOn  : u32,
  dispLimitOn : u32,

  lightPos    : vec3<f32>,
  specPower   : f32,

  slopeLimit  : f32,
  wallJump    : f32,
  alphaMode   : u32,
  _pad0       : u32,

  worldOffset : f32,
  worldStart  : f32,
  thickness   : f32,
  feather     : f32,
};
@group(0) @binding(1) var<uniform> render : RenderParams;

struct SlabParams {
  layerIndex : u32,
  fieldMode  : u32,
  useBand    : u32,
  meshStep   : u32,

  iso        : f32,
  bandLow    : f32,
  bandHigh   : f32,
  capBias    : f32,

  quadScale  : f32,
  dispAmp    : f32,
  dispCurve  : f32,
  dispMode   : u32,

  gradScale  : f32,
  _pad0_f    : vec3<f32>,
};
@group(0) @binding(2) var<uniform> slab : SlabParams;

@group(0) @binding(3) var myTex : texture_2d_array<f32>;
@group(0) @binding(4) var mySamp : sampler;

struct Model {
  world         : mat4x4<f32>,
  uvOffsetScale : vec4<f32>,
};
@group(1) @binding(0) var<uniform> model : Model;

struct VSOut {
  @builtin(position) pos  : vec4<f32>,
  @location(0)       uv   : vec2<f32>,
  @location(1)       wPos : vec3<f32>,
  @location(2)       nWS  : vec3<f32>,
  @location(3)       side : f32,
};

const CONTOUR_ON_BIT    : u32 = 1u;
const CONTOUR_ONLY_BIT  : u32 = 2u;
const CONTOUR_FRONT_BIT : u32 = 4u;

fn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {
  let H = hsl.x;
  let S = hsl.y;
  let L = hsl.z;

  let C  = (1.0 - abs(2.0 * L - 1.0)) * S;
  let Hp = H * 6.0;
  let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));

  var rgb = vec3<f32>(0.0);

  if (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }
  else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }
  else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }
  else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }
  else if (Hp < 5.0) { rgb = vec3<f32>(X, 0.0, C); }
  else { rgb = vec3<f32>(C, 0.0, X); }

  let m = L - 0.5 * C;
  return rgb + m;
}

fn palette(r: f32) -> vec3<f32> {
  var H: f32;
  var L: f32;

  switch (render.scheme) {
    case 0u:  { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }
    case 1u:  { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }
    case 2u:  { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }
    case 3u:  { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }
    case 4u:  { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }
    case 6u:  { return vec3<f32>(r); }
    default:  { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }
  }

  H = fract(H + render.hueOffset);
  return hsl2rgb(vec3<f32>(H, 1.0, L));
}

fn dispHeight(r: f32) -> f32 {
  if (render.dispMode == 0u) { return 0.0; }
  let rr = clamp(r, 0.0, 1.0);
  switch (render.dispMode) {
    case 1u: { return pow(rr, render.dispCurve) * render.dispAmp; }
    case 2u: { return (pow(rr, render.dispCurve) - 0.5) * (2.0 * render.dispAmp); }
    case 3u: {
      let t = 1.0 - abs(2.0 * rr - 1.0);
      return pow(clamp(t, 0.0, 1.0), render.dispCurve) * render.dispAmp;
    }
    default: { return pow(rr, render.dispCurve) * render.dispAmp; }
  }
}

fn bowlHeight(worldXY: vec2<f32>) -> f32 {
  if (render.bowlOn == 0u) { return 0.0; }
  let q = max(1e-6, render.quadScale);
  let n = worldXY / q;
  let r2 = dot(n, n);
  return -render.bowlDepth * r2 * q;
}

fn maxGradFromSlopeLimit(s2: f32) -> f32 {
  let x = clamp(s2, 0.0, 0.9999);
  return sqrt(x / max(1e-6, 1.0 - x));
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

fn signedFromField(f: f32) -> f32 {
  if (slab.useBand != 0u) {
    return max(slab.bandLow - f, f - slab.bandHigh) - slab.capBias;
  }
  return (slab.iso - f) - slab.capBias;
}

fn insideAmountFromSigned(s: f32) -> f32 {
  return -s;
}

fn coverageAlphaFromInside(insideAmount: f32) -> f32 {
  let feather = max(0.0, render.feather);
  if (feather > 0.0) {
    return smoothstep(0.0, feather, insideAmount);
  }
  return select(0.0, 1.0, insideAmount >= 0.0);
}

fn contourMaskFromSigned(s: f32) -> f32 {
  let fw = max(1e-6, fwidth(s));
  let feather = max(0.0, render.feather);
  let lw = max(fw * 1.5, max(1e-6, feather) * 0.25);
  return 1.0 - smoothstep(0.0, lw, abs(s));
}

fn loadR(ix: i32, iy: i32) -> f32 {
  let dims = textureDimensions(myTex);
  let maxX = max(0, i32(dims.x) - 1);
  let maxY = max(0, i32(dims.y) - 1);

  let x = clamp(ix, 0, maxX);
  let y = clamp(iy, 0, maxY);

  return textureLoad(myTex, vec2<i32>(x, y), i32(render.layerIndex), 0).r;
}

fn sampleRGridFromUv(uvT: vec2<f32>) -> f32 {
  let dims = textureDimensions(myTex);
  let denomX = max(1, i32(dims.x) - 1);
  let denomY = max(1, i32(dims.y) - 1);

  let xf = clamp(uvT.x, 0.0, 1.0) * f32(denomX);
  let yf = clamp(uvT.y, 0.0, 1.0) * f32(denomY);

  let ix = clamp(i32(round(xf)), 0, denomX);
  let iy = clamp(i32(round(yf)), 0, denomY);

  return loadR(ix, iy);
}

fn evalFieldAtGrid(ix: i32, iy: i32) -> f32 {
  let rC = loadR(ix, iy);

  switch (slab.fieldMode) {
    case 0u: {
      return rC;
    }
    case 1u: {
      let hL = computeHnorm(loadR(ix - 1, iy));
      let hR = computeHnorm(loadR(ix + 1, iy));
      let hD = computeHnorm(loadR(ix, iy - 1));
      let hU = computeHnorm(loadR(ix, iy + 1));

      let gx = 0.5 * (hR - hL);
      let gy = 0.5 * (hU - hD);

      return slab.gradScale * length(vec2<f32>(gx, gy));
    }
    default: {
      return computeHnorm(rC);
    }
  }
}

fn cellFromUv(uvT: vec2<f32>) -> vec4<f32> {
  let dims = textureDimensions(myTex);
  let denomX = max(1, i32(dims.x) - 1);
  let denomY = max(1, i32(dims.y) - 1);

  let xF = clamp(uvT.x, 0.0, 1.0) * f32(denomX);
  let yF = clamp(uvT.y, 0.0, 1.0) * f32(denomY);

  let x0 = clamp(i32(floor(xF)), 0, max(0, denomX - 1));
  let y0 = clamp(i32(floor(yF)), 0, max(0, denomY - 1));

  let fx = clamp(xF - f32(x0), 0.0, 1.0);
  let fy = clamp(yF - f32(y0), 0.0, 1.0);

  return vec4<f32>(f32(x0), f32(y0), fx, fy);
}
@vertex
fn vs_main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VSOut {
  var out: VSOut;

  var uvLocal: vec2<f32>;
  switch (vid) {
    case 0u: { uvLocal = vec2<f32>(0.0, 0.0); }
    case 1u: { uvLocal = vec2<f32>(1.0, 0.0); }
    case 2u: { uvLocal = vec2<f32>(1.0, 1.0); }
    case 3u: { uvLocal = vec2<f32>(0.0, 0.0); }
    case 4u: { uvLocal = vec2<f32>(1.0, 1.0); }
    default: { uvLocal = vec2<f32>(0.0, 1.0); }
  }

  let side = select(-1.0, 1.0, iid == 1u);

  let uvMin = model.uvOffsetScale.xy;
  let uvT = uvMin + uvLocal * model.uvOffsetScale.zw;

  var wp = model.world * vec4<f32>(uvLocal.x, uvLocal.y, 0.0, 1.0);

  let q = max(1e-6, render.quadScale);

  let dimsU = textureDimensions(myTex);
  let denomX = max(1u, dimsU.x - 1u);
  let denomY = max(1u, dimsU.y - 1u);
  let duT = 1.0 / max(1.0, f32(denomX));
  let dvT = 1.0 / max(1.0, f32(denomY));

  let rC = sampleRGridFromUv(uvT);

  let wLocalX = abs(model.world[0].x);
  let wLocalY = abs(model.world[1].y);
  let su = max(1e-6, model.uvOffsetScale.z);
  let sv = max(1e-6, model.uvOffsetScale.w);

  let dxW = duT * (wLocalX / su);
  let dyW = dvT * (wLocalY / sv);

  let uvTL = uvT + vec2<f32>(-duT, 0.0);
  let uvTR = uvT + vec2<f32>( duT, 0.0);
  let uvTD = uvT + vec2<f32>(0.0, -dvT);
  let uvTU = uvT + vec2<f32>(0.0,  dvT);

  let hC = dispHeight(rC) * q;
  let hL = dispHeight(sampleRGridFromUv(uvTL)) * q;
  let hR = dispHeight(sampleRGridFromUv(uvTR)) * q;
  let hD = dispHeight(sampleRGridFromUv(uvTD)) * q;
  let hU = dispHeight(sampleRGridFromUv(uvTU)) * q;

  var dHx = (hR - hL) / max(1e-6, dxW);
  var dHy = (hU - hD) / max(1e-6, dyW);

  if (render.bowlOn != 0u) {
    dHx = dHx + (-2.0 * render.bowlDepth * wp.x) / q;
    dHy = dHy + (-2.0 * render.bowlDepth * wp.y) / q;
  }

  let maxG = maxGradFromSlopeLimit(render.slopeLimit);
  let gLen = length(vec2<f32>(dHx, dHy));
  if (gLen > maxG) {
    let s = maxG / max(1e-6, gLen);
    dHx = dHx * s;
    dHy = dHy * s;
  }

  var n = normalize(vec3<f32>(-dHx, -dHy, 1.0));
  n = n * side;

  let baseZ = (render.worldStart + render.worldOffset * f32(render.layerIndex)) * q;
  let bowl = bowlHeight(wp.xy);
  let halfThick = 0.5 * render.thickness * q;
  let z = baseZ + bowl + hC + side * halfThick;

  wp.z = z;

  out.pos = camera.viewProj * wp;

  if ((render.alphaMode & CONTOUR_FRONT_BIT) != 0u) {
    out.pos.z = out.pos.z - 0.002 * out.pos.w;
  }

  out.uv = uvT;
  out.wPos = wp.xyz;
  out.nWS = n;
  out.side = side;

  return out;
}


@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
  let cp = cellFromUv(input.uv);
  let x0 = i32(cp.x);
  let y0 = i32(cp.y);
  let fx = cp.z;
  let fy = cp.w;

  let r00 = loadR(x0,     y0);
  let r10 = loadR(x0 + 1, y0);
  let r01 = loadR(x0,     y0 + 1);
  let r11 = loadR(x0 + 1, y0 + 1);

  let rx0 = mix(r00, r10, fx);
  let rx1 = mix(r01, r11, fx);
  let rRaw = mix(rx0, rx1, fy);
  let r = clamp(rRaw, 0.0, 1.0);

  var s00: f32;
  var s10: f32;
  var s01: f32;
  var s11: f32;

  if (slab.fieldMode == 0u) {
    s00 = signedFromField(r00);
    s10 = signedFromField(r10);
    s01 = signedFromField(r01);
    s11 = signedFromField(r11);
  } else {
    s00 = signedFromField(evalFieldAtGrid(x0,     y0));
    s10 = signedFromField(evalFieldAtGrid(x0 + 1, y0));
    s01 = signedFromField(evalFieldAtGrid(x0,     y0 + 1));
    s11 = signedFromField(evalFieldAtGrid(x0 + 1, y0 + 1));
  }

  let sx0 = mix(s00, s10, fx);
  let sx1 = mix(s01, s11, fx);
  let s = mix(sx0, sx1, fy);

  let contour = contourMaskFromSigned(s);

  if ((render.alphaMode & CONTOUR_ONLY_BIT) != 0u) {
    if (contour <= 0.0) { discard; }
    return vec4<f32>(vec3<f32>(1.0, 1.0, 1.0), contour);
  }

  let insideAmount = insideAmountFromSigned(s);
  let a = coverageAlphaFromInside(insideAmount);
  if (a <= 0.0) { discard; }

  var rgb = palette(r);

  if (render.lightingOn != 0u) {
    let lightWS = render.lightPos * render.quadScale;
    let Ldir = normalize(lightWS - input.wPos);
    let Vdir = normalize(camera.camPos.xyz - input.wPos);
    let hVec = normalize(Ldir + Vdir);

    let diff = max(dot(input.nWS, Ldir), 0.0);
    let spec = pow(max(dot(input.nWS, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);

    let ambient = 0.15;
    rgb = clamp(rgb * (ambient + diff) + 1.25 * spec, vec3<f32>(0.0), vec3<f32>(1.0));
  }

  if ((render.alphaMode & CONTOUR_ON_BIT) != 0u) {
    rgb = clamp(rgb * (1.0 - 0.65 * contour), vec3<f32>(0.0), vec3<f32>(1.0));
  }

  return vec4<f32>(rgb, a);
}
