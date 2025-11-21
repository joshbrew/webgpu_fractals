/* fheightQueryNeighbours.wgsl  – 8-way height, normal & UV lookup
   ----------------------------------------------------------- */

struct CentreQuery {
    worldXZ : vec2<f32>
};
@group(0) @binding(0) var<uniform> Q : CentreQuery;

/* RGBA16F  (R = height, GBA = normal) */
@group(0) @binding(1) var sdfTex : texture_2d_array<f32>;
@group(0) @binding(2) var samp   : sampler;

/* render-wide params */
struct RenderParams {
    layerIndex  : u32,
    scheme      : u32,        // unused here
    dispMode    : u32,        // unused here
    bowlOn      : u32,

    hueOffset   : f32,        // unused
    dispAmp     : f32,        // unused
    dispCurve   : f32,        // unused
    bowlDepth   : f32,        // needed for bowlOffset

    quadScale   : f32,
    gridSize    : f32,
    _pad0       : vec2<f32>,
};

@group(0) @binding(3) var<uniform> R : RenderParams;

/* scratch buffer: 9 × (h, n.xyz, flag, UV.xy, pad) = 72 floats */
@group(0) @binding(4) var<storage, read_write> outBuf : array<f32,72>;
@group(0) @binding(5) var<uniform> tileUV : vec4<f32>;
@group(0) @binding(6) var flagTex : texture_storage_2d_array<r32uint,read>;

/* ----------------------------------------------------------- */
fn bowlOffset(gUV: vec2<f32>) -> f32 {
    if (R.bowlOn == 0u || R.bowlDepth <= 0.00001) { return 0.0; }
    let d = gUV - vec2(0.5,0.5);
    return -R.bowlDepth * (1.0 - clamp(dot(d,d)/0.5,0.0,1.0)) * R.quadScale;
}

/* neighbour offsets: C,N,NE,E,SE,S,SW,W,NW */
const dir : array<vec2<i32>,9> = array<vec2<i32>,9>(
    vec2<i32>( 0,  0), vec2<i32>( 0,  1), vec2<i32>( 1,  1),
    vec2<i32>( 1,  0), vec2<i32>( 1, -1), vec2<i32>( 0, -1),
    vec2<i32>(-1, -1), vec2<i32>(-1,  0), vec2<i32>(-1,  1)
);

const DUMMY_H    : f32 = -3.4e38;          // FLT_MIN  sentinel
const DUMMY_FLAG : u32 = 0xffffffffu;

@compute @workgroup_size(1)
fn main() {
    /* global UV of centre */
    let half   = R.quadScale;
    let gUVc   = (Q.worldXZ + vec2(half)) / (2.0 * half);

    /* inside whole quad? */
    let inQuad = all(gUVc >= vec2(0.0)) && all(gUVc < vec2(1.0));

    /* tile dims / helpers */
    let dims   = textureDimensions(flagTex);     // (w, h)
    let invDim = 1.0 / vec2<f32>(dims);

    for (var i: u32 = 0u; i < 9u; i = i + 1u) {
        var h   : f32;
        var n   : vec3<f32>;
        var flg : u32;

        // compute neighbour global UV
        let gUV = gUVc + vec2<f32>(dir[i]) * invDim * tileUV.zw;

        if (inQuad) {
            // is neighbour still inside this tile?
            let insideTile = all(gUV >= tileUV.xy) &&
                             all(gUV <  tileUV.xy + tileUV.zw);

            if (insideTile) {
                let uv  = (gUV - tileUV.xy) / tileUV.zw;
                let sdf = textureSampleLevel(sdfTex, samp, uv, i32(R.layerIndex), 0.0);
                h   = sdf.r + bowlOffset(gUV);
                n   = sdf.gba;

                let ij  = vec2<i32>(uv * vec2<f32>(dims));
                flg = textureLoad(flagTex, ij, R.layerIndex).x;
            } else {
                h   = DUMMY_H;
                n   = vec3(0.0, 0.0, 1.0);
                flg = DUMMY_FLAG;
            }
        } else {
            h   = DUMMY_H;
            n   = vec3(0.0, 0.0, 1.0);
            flg = DUMMY_FLAG;
        }

        // write 8 floats per neighbour: height, normal.xyz, flag(->f32), pad, u, v
        let base = i * 8u;
        outBuf[base + 0u] = h;
        outBuf[base + 1u] = n.x;
        outBuf[base + 2u] = n.y;
        outBuf[base + 3u] = n.z;
        outBuf[base + 4u] = bitcast<f32>(flg);
        outBuf[base + 5u] = gUV.x;
        outBuf[base + 6u] = gUV.y;
        outBuf[base + 7u] = 0.0;
    }
}
