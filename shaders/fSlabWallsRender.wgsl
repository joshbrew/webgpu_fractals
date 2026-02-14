// shaders/fSlabWallsRender.wgsl
// renders each wall segment instance as a vertical quad, camera-aware

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

@group(0) @binding(2) var myTex : texture_2d_array<f32>;
@group(0) @binding(3) var mySamp : sampler;

struct Model {
  world         : mat4x4<f32>,
  uvOffsetScale : vec4<f32>,
};
@group(1) @binding(0) var<uniform> model : Model;

struct WallInstance {
  uvA  : vec2<f32>,
  uvB  : vec2<f32>,
  nXY  : vec2<f32>,
  _pad : vec2<f32>,
};
@group(1) @binding(1) var<storage, read> wallInstances : array<WallInstance>;

struct VSOut {
  @builtin(position) pos  : vec4<f32>,
  @location(0)       uv   : vec2<f32>,
  @location(1)       wPos : vec3<f32>,
  @location(2)       nWS  : vec3<f32>,
};

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

fn bowlHeight(worldXY: vec2<f32>) -> f32 {
  if (render.bowlOn == 0u) { return 0.0; }
  let q = max(1e-6, render.quadScale);
  let n = worldXY / q;
  let r2 = dot(n, n);
  return -render.bowlDepth * r2 * q;
}

fn localFromUv(uvT: vec2<f32>) -> vec2<f32> {
  let u0 = model.uvOffsetScale.xy;
  let su = max(vec2<f32>(1e-6), model.uvOffsetScale.zw);
  return (uvT - u0) / su;
}
@vertex
fn vs_main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VSOut {
  var out: VSOut;

  let inst = wallInstances[iid];
  let uvA = inst.uvA;
  let uvB = inst.uvB;

  let aL = localFromUv(uvA);
  let bL = localFromUv(uvB);

  var wA4 = model.world * vec4<f32>(aL.x, aL.y, 0.0, 1.0);
  var wB4 = model.world * vec4<f32>(bL.x, bL.y, 0.0, 1.0);

  let dW = wB4.xy - wA4.xy;
  let invLen = inverseSqrt(max(1e-12, dot(dW, dW)));
  var nW = vec2<f32>(-dW.y, dW.x) * invLen;

  let wLocalX = abs(model.world[0].x);
  let wLocalY = abs(model.world[1].y);
  let su = max(1e-6, model.uvOffsetScale.z);
  let sv = max(1e-6, model.uvOffsetScale.w);

  let nHint = normalize(vec2<f32>(inst.nXY.x * (wLocalX / su), inst.nXY.y * (wLocalY / sv)));
  if (dot(nW, nHint) < 0.0) { nW = -nW; }

  let dimsU = textureDimensions(myTex);
  let duT = 1.0 / max(1.0, f32(max(1u, dimsU.x - 1u)));
  let dvT = 1.0 / max(1.0, f32(max(1u, dimsU.y - 1u)));

  let texelWorldX = wLocalX * (duT / su);
  let texelWorldY = wLocalY * (dvT / sv);
  let texelWorld = 0.5 * (texelWorldX + texelWorldY);

  let contourOnly = (render.alphaMode & 2u) != 0u;
  let jumpW = select(render.wallJump * texelWorld, 0.0, contourOnly);

  wA4.x = wA4.x + nW.x * jumpW;
  wA4.y = wA4.y + nW.y * jumpW;
  wB4.x = wB4.x + nW.x * jumpW;
  wB4.y = wB4.y + nW.y * jumpW;

  let useB = (vid == 1u) || (vid == 2u) || (vid == 4u);
  let useTop = (vid == 2u) || (vid == 4u) || (vid == 5u);

  let baseZ = render.worldStart + render.worldOffset * f32(render.layerIndex);

  let pXY = select(wA4.xy, wB4.xy, useB);
  let bowl = bowlHeight(pXY);

  let halfThick = 0.5 * render.thickness;
  let zBot = baseZ + bowl - halfThick;
  let zTop = baseZ + bowl + halfThick;
  let z = select(zBot, zTop, useTop);

  let wpos = vec3<f32>(pXY.x, pXY.y, z);

  out.pos = camera.viewProj * vec4<f32>(wpos, 1.0);
  out.uv = select(uvA, uvB, useB);
  out.wPos = wpos;
  out.nWS = normalize(vec3<f32>(nW, 0.0));

  return out;
}



@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));
  let r = clamp(texel.r, 0.0, 1.0);

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

  return vec4<f32>(rgb, 1.0);
}
