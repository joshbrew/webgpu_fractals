// ── camera & sampler (group 0) ───────────────────────────────────────────────
struct Camera { viewProj : mat4x4<f32> };
@group(0) @binding(3) var<uniform> camera : Camera;

@group(0) @binding(1) var mySamp : sampler;

// render params (group 0 / binding 2)
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
    _pad2       : vec2<u32>,
};
@group(0) @binding(2) var<uniform> render : RenderParams;

struct Threshold {
    lowT   : f32,
    highT  : f32,
    basis  : f32,
    _pad0  : f32,
};
@group(0) @binding(4) var<uniform> thr : Threshold;

// group 0 / binding 0 -> color array texture (fractal source)
@group(0) @binding(0) var myTex : texture_2d_array<f32>;

// group 1: model + sdf + flag + sampler
struct Model {
    world         : mat4x4<f32>,
    uvOffsetScale : vec4<f32>,
};
@group(1) @binding(0) var<uniform> model : Model;

@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;
@group(1) @binding(2) var flagTex : texture_2d_array<u32>;
@group(1) @binding(3) var samp : sampler;

// vertex -> fragment IO (must match your vertex shader)
struct FSIn {
  @builtin(position)              pos    : vec4<f32>,
  @location(0)                    uv     : vec2<f32>,
  @location(1)                    wPos   : vec3<f32>,
  @location(2)                    s      : vec4<f32>,    // sdf-derived data (and normals)
  @location(3) @interpolate(flat) flag   : u32,
};

// helper – HSL → RGB
fn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {
    let H = hsl.x;
    let S = hsl.y;
    let L = hsl.z;

    let C  = (1.0 - abs(2.0 * L - 1.0)) * S;
    let Hp = H * 6.0;

    let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));
    var rgb = vec3<f32>(0.0);

    if      (Hp < 1.0) { rgb = vec3(C, X, 0.0); }
    else if (Hp < 2.0) { rgb = vec3(X, C, 0.0); }
    else if (Hp < 3.0) { rgb = vec3(0.0, C, X); }
    else if (Hp < 4.0) { rgb = vec3(0.0, X, C); }
    else if (Hp < 5.0) { rgb = vec3(X, 0.0, C); }
    else               { rgb = vec3(C, 0.0, X); }

    let m = L - 0.5 * C;
    return rgb + m;
}

// small utility to compute integer texel coords inside the tile (if you still use it)
fn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {
    let dims = vec2<i32>(textureDimensions(sdfTex).xy);
    let ix  = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);
    let iy  = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);
    return vec2<i32>(ix, iy);
}

// ────────────────────────────────────────────────────────────────────────────
// Gate result returned from gating helper
// ────────────────────────────────────────────────────────────────────────────
struct GateResult {
  passed : bool,
  alpha  : f32,
};

// Shared gating logic: compute final alpha based on alphaMode and run threshold/flag gating.
// Returns GateResult.passed==true if fragment should be shaded; GateResult.alpha contains final alpha.
// We accept a minimal set of inputs (r, a_in, s_r, flagVal) so this remains cheap.
// ────────────────────────────────────────────────────────────────────────────
fn shouldPassAndComputeAlpha(r: f32, a_in: f32, s_r: f32, flagVal: u32) -> GateResult {
  var res : GateResult;
  var a = a_in;

  // apply alphaMode
  if (render.alphaMode == 1u) {
      a = r;
  } else if (render.alphaMode == 2u) {
      a = 1.0 - r;
  }

  // threshold gating (three modes)
  if (thr.basis < 2.0) {
    let inside = (r >= thr.lowT) && (r <= thr.highT);
    if (thr.basis == 0.0 && !inside) {
      res.passed = false;
      res.alpha = a;
      return res;
    } else if (thr.basis == 1.0 && inside) {
      res.passed = false;
      res.alpha = a;
      return res;
    }
  } else {
    // basis >= 2.0 -> use SDF's channel (s.r) as gating
    let hC = s_r;
    if (hC < thr.lowT || hC > thr.highT) {
      res.passed = false;
      res.alpha = a;
      return res;
    }
  }

  // dispLimitOn / flag gating: if flag indicates "cull" then reject
  if (render.dispLimitOn != 0u && flagVal != 0u) {
      res.passed = false;
      res.alpha = a;
      return res;
  }

  // early alpha cutoff: prevent tiny-alpha fragments writing depth in prepass
  if (a < 0.01) {
    res.passed = false;
    res.alpha = a;
    return res;
  }

  res.passed = true;
  res.alpha = a;
  return res;
}

// ────────────────────────────────────────────────────────────────────────────
// Depth-only prepass – sample base texture + run gating logic.
// Returns a vec4 but color write is disabled by the pipeline (writeMask=0).
// Uses the same gating helper as fs_main so results match exactly.
// ────────────────────────────────────────────────────────────────────────────
@fragment
fn fs_prepass(input : FSIn) -> @location(0) vec4<f32> {
  // sample base texture (grayscale in .r, alpha in .a)
  // note: textureSample(array, sampler, coord, layerIndex) is used elsewhere; keep same usage
  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));
  let r = texel.r;
  let a = texel.a;

  // use SDF / flag values provided by the vertex stage (cheap — already computed in vertex)
  let s_r = input.s.r;
  let flagVal = input.flag;

  // run same gating helper; obtain computed alpha
  let g = shouldPassAndComputeAlpha(r, a, s_r, flagVal);
  if (!g.passed) {
    // discard -> no depth or color write in prepass
    discard;
  }

  // Depth-only prepass doesn't write colour (pipeline uses writeMask = 0).
  // returning any vec4 is fine; we still get the depth written because we didn't discard.
  return vec4<f32>(0.0, 0.0, 0.0, 0.0);
}

// ────────────────────────────────────────────────────────────────────────────
// Full shading pass: uses same gating helper then computes palette + lighting
// ────────────────────────────────────────────────────────────────────────────
@fragment
fn fs_main(input : FSIn) -> @location(0) vec4<f32> {

  // 1. sample greyscale & alpha
  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));
  let r     = texel.r;
  let a_in  = texel.a;

  // use the SDF/flag values provided by the vertex stage
  let s_r = input.s.r;
  let flagVal = input.flag;

  // apply the same gating helper (ensures prepass & main align), and get final alpha
  let g = shouldPassAndComputeAlpha(r, a_in, s_r, flagVal);
  if (!g.passed) {
    discard;
  }
  var a = g.alpha; // final alpha after alphaMode

  // 2. palette selection
  var H : f32;
  var L : f32;

  switch (render.scheme) {
    case 0u: { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }
    case 1u: { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }
    case 2u: { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }
    case 3u: { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }
    case 4u: { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }
    case 5u: { H = (300.0 - 240.0 * r) / 360.0; L = 0.55 + 0.20 * sin(r * 3.14159); }
    case 6u: { return vec4<f32>(vec3<f32>(r), a); }
    case 7u: { H = (10.0 + 60.0 * pow(r, 1.2)) / 360.0; L = 0.15 + 0.75 * pow(r, 1.5); }
    case 8u: { H = r; L = 0.45 + 0.25 * (1.0 - r); }
    case 9u: { H = fract(2.0 * r); L = 0.50; }
    case 10u: { H = fract(3.0 * r + 0.1); L = 0.65; }
    case 11u: { H = 0.75 - 0.55 * r; L = 0.25 + 0.55 * r * r; }
    case 12u: { H = (5.0 + 70.0 * r) / 360.0; L = 0.10 + 0.80 * pow(r, 1.4); }
    case 13u: { H = (260.0 - 260.0 * r) / 360.0; L = 0.30 + 0.60 * pow(r, 0.8); }
    case 14u: { H = (230.0 - 160.0 * r) / 360.0; L = 0.25 + 0.60 * r; }
    case 15u: { H = (200.0 + 40.0 * r) / 360.0; L = 0.20 + 0.50 * r; }
    case 16u: { H = 0.60; L = 0.15 + 0.35 * r; }
    case 17u: {
      if (r < 0.5) { H = 0.55 + (0.75 - 0.55) * (r * 2.0); }
      else { H = 0.02 + (0.11 - 0.02) * ((r - 0.5) * 2.0); }
      L = 0.25 + 0.55 * abs(r - 0.5);
    }
    case 18u: { H = fract(3.0 * r); L = 0.50 + 0.25 * (1.0 - r); }
    case 19u: { H = fract(4.0 * r); L = 0.50; }
    case 20u: { H = fract(5.0 * r + 0.2); L = 0.65; }
    case 21u: { H = (240.0 - 240.0 * r) / 360.0; L = 0.30 + 0.40 * r; }
    case 22u: { H = fract(r * 6.0 + sin(r * 10.0)); L = 0.40 + 0.30 * sin(r * 20.0); }
    case 23u: { H = (30.0 + 50.0 * r) / 360.0; L = 0.45 + 0.30 * r; }
    case 24u: { H = (90.0 - 80.0 * r) / 360.0; L = 0.50 + 0.40 * r; }
    case 25u: { H = (100.0 - 100.0 * r) / 360.0; L = 0.40 + 0.50 * r; }
    case 26u: {
      let loopVal = fract(r * 10.0);
      let Lmono   = loopVal * 0.8;
      return vec4<f32>(vec3<f32>(Lmono), a);
    }
    case 27u: {
      if (r < 0.5) { H = 0.80 + (0.40 - 0.80) * (r * 2.0); }
      else { H = 0.10 + (0.00 - 0.10) * ((r - 0.5) * 2.0); }
      L = 0.20 + 0.60 * abs(r - 0.5);
    }
    case 28u: { H = fract(sin(r * 6.28318) * 0.5 + 0.5); L = 0.50; }
    case 29u: { H = fract(r * 3.0); L = fract(r * 3.0); }
    case 30u: { H = fract(r * 6.0); L = 0.45 + 0.40 * abs(sin(r * 6.0 * 3.14159)); }
    case 31u: {
      let t = fract(r * 8.0);
      if (t < 0.5) { H = t * 2.0; } else { H = (1.0 - t) * 2.0; }
      L = 0.60 - 0.30 * abs(t - 0.5);
    }
    case 32u: { H = fract(pow(r, 0.7) * 12.0); L = 0.50 + 0.30 * pow(r, 1.2); }
    case 33u: { H = fract(r * 10.0 + 0.3); L = 0.40 + 0.50 * r; }
    default: { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }
  }

  // final colour
  H = fract(H + render.hueOffset);
  var rgb = hsl2rgb(vec3<f32>(H, 1.0, L));

  // lighting (apply if enabled)
  if (render.lightingOn != 0u) {
    let n      = normalize(input.s.gba);
    let lightWS = render.lightPos * render.quadScale;
    let Ldir    = normalize(lightWS - input.wPos);
    let Vdir    = normalize(-input.wPos);
    let hVec    = normalize(Ldir + Vdir);

    let diff    = max(dot(n, Ldir), 0.0);
    var spec    = pow(max(dot(n, hVec), 0.0), render.specPower)
                    * smoothstep(0.0, 0.1, diff);

    let ambient    = 0.15;
    let diffWeight = 1.0;
    let specWeight = 1.25;

    rgb = clamp(
        rgb * (ambient + diffWeight * diff) +
        specWeight * spec,
        vec3<f32>(0.0), vec3<f32>(1.0)
    );
  }

  // NOTE: blending expects non-premultiplied src alpha (src-alpha, one-minus-src-alpha).
  // If you switch blending or canvas alpha settings, consider premultiplying rgb by a.

  return vec4<f32>(rgb, a);
}
