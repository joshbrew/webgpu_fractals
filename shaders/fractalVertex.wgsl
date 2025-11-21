// ── camera & sampler (group 0) ───────────────────────────────────────────────
struct Camera { viewProj : mat4x4<f32> };
@group(0) @binding(3) var<uniform> camera : Camera;

@group(0) @binding(1) var mySamp : sampler;

// ── render‐wide parameters (group 0 / binding 2) ─────────────────────────────
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
    worldOffset : f32, // base world offset per layer
    worldStart  : f32,
};
@group(0) @binding(2) var<uniform> render : RenderParams;

// ── group 1: per‐tile model + precomputed textures + sampler ───────────────
struct Model {
    world         : mat4x4<f32>,
    uvOffsetScale : vec4<f32>,
};
@group(1) @binding(0) var<uniform> model : Model;

@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;
@group(1) @binding(2) var flagTex : texture_2d_array<u32>;
@group(1) @binding(3) var samp : sampler;

// ── vertex I/O ─────────────────────────────────────────────────────────────
struct VertexIn {
    @location(0) position : vec3<f32>,
    @location(1) uv       : vec2<f32>,
};

struct VSOut {
    @builtin(position)              pos    : vec4<f32>,
    @location(0)                    uv     : vec2<f32>,   
    @location(1)                    wPos   : vec3<f32>,
    @location(2)                    s      : vec4<f32>,    // sdf-derived data (and normals)
    @location(3) @interpolate(flat) flag   : u32,
};

// helper – returns integer pixel coords inside *this* texture view
fn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {
    let dims = vec2<i32>(textureDimensions(sdfTex).xy);   // (tileW , tileH)
    // NB:   tileH == gridSize because we only split horizontally
    let ix  = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);
    let iy  = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);
    return vec2<i32>(ix, iy);
}

// ────────────────────────────────────────────────────────────────────────────
@vertex
fn vs_main(in: VertexIn) -> VSOut {
    var out: VSOut;

    // 1. model‐space → world‐space (XY plane)
    var worldPos = model.world * vec4<f32>(in.position, 1.0);

    // 2. optional bowl deformation
    if (render.bowlOn != 0u && render.bowlDepth > 0.00001) {
        let globalUV = model.uvOffsetScale.xy + in.uv * model.uvOffsetScale.zw;
        let offset   = globalUV - vec2<f32>(0.5, 0.5);
        let r2       = dot(offset, offset);
        let maxR2    = 0.5;
        let t        = 1.0 - clamp(r2 / maxR2, 0.0, 1.0);
        worldPos.z += -render.bowlDepth * t * render.quadScale;
    }

    // 3. sample precomputed SDF (height + normal)
    var s : vec4<f32> = vec4<f32>(0.0);    // default: no height/normal
    var maskVal : u32 = 0u;               // default mask

    if (render.dispMode != 0u || render.lightingOn != 0u) {
        // safe to call texelIJ() and sample textures
        let ij = texelIJ(in.uv);
        s = textureLoad(sdfTex, ij, i32(render.layerIndex), 0);
        worldPos.z += s.r;                 // apply height displacement only when computed

        // connectivity mask lookup (only when SDF/flags are expected)
        maskVal = textureLoad(flagTex, ij, i32(render.layerIndex), 0).r;
    }

    // 4. Apply world offset based on layerIndex (accumulating across layers)
    worldPos.z += render.worldStart + render.worldOffset * f32(render.layerIndex);

    // 5. write outputs
    out.pos  = camera.viewProj * worldPos;
    out.uv   = in.uv;
    out.wPos = worldPos.xyz;
    out.s    = s;
    out.flag = maskVal;
    return out;
}
