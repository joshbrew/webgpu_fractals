// shaders/fBlitVertex.wgsl

struct RenderParams {
  layerIndex      : u32,
  scheme          : u32,
  useHueGradient  : u32,
  dispMode        : u32,

  bowlOn          : u32,
  lightingOn      : u32,
  dispLimitOn     : u32,
  alphaMode       : u32,

  hueOffset       : f32,
  dispAmp         : f32,
  dispCurve       : f32,
  bowlDepth       : f32,

  quadScale       : f32,
  gridSize        : f32,
  slopeLimit      : f32,
  wallJump        : f32,

  lightPos        : vec3<f32>,
  specPower       : f32,

  worldOffset     : f32,
  worldStart      : f32,
  _pad0           : vec2<f32>,
};
@group(0) @binding(2) var<uniform> render : RenderParams;

struct Model {
  world         : mat4x4<f32>,
  uvOffsetScale : vec4<f32>,
};
@group(1) @binding(0) var<uniform> model : Model;

@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;
@group(1) @binding(2) var flagTex : texture_2d_array<u32>;
@group(1) @binding(3) var samp : sampler;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position)              pos  : vec4<f32>,
  @location(0)                    uv   : vec2<f32>,
  @location(1)                    wPos : vec3<f32>,
  @location(2)                    s    : vec4<f32>,
  @location(3) @interpolate(flat) flag : u32,
};

fn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {
  let dims = vec2<i32>(textureDimensions(sdfTex).xy);
  let ix = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);
  let iy = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);
  return vec2<i32>(ix, iy);
}

@vertex
fn vs_blit(input : VSIn) -> VSOut {
  var out : VSOut;

  let globalUV = model.uvOffsetScale.xy + input.uv * model.uvOffsetScale.zw;

  let clipX = globalUV.x * 2.0 - 1.0;
  let clipY = 1.0 - globalUV.y * 2.0;

  var s : vec4<f32> = vec4<f32>(0.0);
  var maskVal : u32 = 0u;

  if (render.dispMode != 0u || render.lightingOn != 0u || render.dispLimitOn != 0u) {
    let ij = texelIJ(input.uv);

    let sdfL = max(1u, textureNumLayers(sdfTex));
    let li = i32(render.layerIndex % sdfL);
    s = textureLoad(sdfTex, ij, li, 0);

    let flagL = max(1u, textureNumLayers(flagTex));
    let liF = i32(render.layerIndex % flagL);
    maskVal = textureLoad(flagTex, ij, liF, 0).r;
  }

  var wz = render.worldStart + render.worldOffset * f32(render.layerIndex);

  if (render.bowlOn != 0u && render.bowlDepth > 0.00001) {
    let offset = globalUV - vec2<f32>(0.5, 0.5);
    let r2 = dot(offset, offset);
    let maxR2 = 0.5;
    let t = 1.0 - clamp(r2 / maxR2, 0.0, 1.0);
    wz += -render.bowlDepth * t * render.quadScale;
  }

  if (render.dispMode != 0u && render.dispAmp != 0.0) {
    let h0 = s.r;
    let curve = max(render.dispCurve, 0.0001);
    let h = sign(h0) * pow(abs(h0), curve) * render.dispAmp;
    wz += h;
  }

  out.pos  = vec4<f32>(clipX, clipY, 0.0, 1.0);
  out.uv   = input.uv;
  out.wPos = vec3<f32>(clipX * render.quadScale, clipY * render.quadScale, wz);
  out.s    = s;
  out.flag = maskVal;
  return out;
}
