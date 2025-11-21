// fBlitVertex.wgsl

struct Model {
    world         : mat4x4<f32>,
    uvOffsetScale : vec4<f32>,
};

@group(1) @binding(0) var<uniform> model : Model;

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

@vertex
fn vs_blit(input : VSIn) -> VSOut {
    var out : VSOut;

    let globalUV = model.uvOffsetScale.xy + input.uv * model.uvOffsetScale.zw;

    let clipX = globalUV.x * 2.0 - 1.0;
    let clipY = 1.0 - globalUV.y * 2.0;

    out.pos  = vec4<f32>(clipX, clipY, 0.0, 1.0);
    out.uv   = globalUV;

    out.wPos = vec3<f32>(clipX, clipY, 0.0);
    out.s    = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    out.flag = 0u;

    return out;
}
