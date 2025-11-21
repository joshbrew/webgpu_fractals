// ——————————————————————————————————————————————————————
//  SDF + Normal + Connectivity   (compute entry: main)
//  – works with horizontal strip tiling –
// ——————————————————————————————————————————————————————

struct SDFParams {
    gridSize        : u32,   // full fractal resolution (square)
    layerIndex      : u32,
    tileOffsetX     : u32,   // unused once we switch to local coords
    tileOffsetY     : u32,
    tileWidth       : u32,   // local X range of this texture view
    tileHeight      : u32,   // = gridSize in current layout (full height)
    dispAmp         : f32,
    quadScale       : f32,
    slopeLimit      : f32,
    wallJump        : f32,
    connectivityMode: u32,   // 0=2-way , 1=4-way , 2=8-way
    dispMode        : u32,
    dispCurve       : f32,
    normalMode      : u32,   // 0=2-sample , 1=4-sample , 2=8-sample
};

@group(0) @binding(0) var<uniform> sdfParams : SDFParams;

@group(1) @binding(0) var fractalTex : texture_storage_2d_array<rgba8unorm , read >;
@group(1) @binding(1) var sdfTex     : texture_storage_2d_array<rgba16float, write>;
@group(1) @binding(2) var flagTex    : texture_storage_2d_array<r32uint   , write>;


// ───────────────── helper functions ────────────────────────────
fn computeHnorm(v: f32) -> f32 {
    switch (sdfParams.dispMode) {
        case 1u  { return v; }
        case 2u  { return 1.0 - v; }
        case 3u, 4u {
            let k = sdfParams.dispCurve;
            let x = select(v, 1.0 - v, sdfParams.dispMode == 4u);
            return log(1.0 + k * x) / log(1.0 + k);
        }
        case 5u, 6u {
            let p = max(sdfParams.dispCurve, 1e-4);
            let x = select(v, 1.0 - v, sdfParams.dispMode == 6u);
            return pow(x, p);
        }
        default  { return 0.0; }
    }
}

/*  Clamp X to tile-width (local) and Y to full grid (global). */
fn clampLocal(px: i32, py: i32, w: i32, h: i32) -> vec2<i32> {
    return vec2<i32>(clamp(px, 0, w - 1),
                     clamp(py, 0, h - 1));
}

/*  4-sample normal (cross) */
fn normal4(px: i32, py: i32, L: i32,
           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {

    let uvL = clampLocal(px - 1, py,     w, h);
    let uvR = clampLocal(px + 1, py,     w, h);
    let uvD = clampLocal(px,     py - 1, w, h);
    let uvU = clampLocal(px,     py + 1, w, h);

    let hL = computeHnorm(textureLoad(fractalTex, uvL, L).r) * dScalar;
    let hR = computeHnorm(textureLoad(fractalTex, uvR, L).r) * dScalar;
    let hD = computeHnorm(textureLoad(fractalTex, uvD, L).r) * dScalar;
    let hU = computeHnorm(textureLoad(fractalTex, uvU, L).r) * dScalar;

    let dx = (hR - hL) * 0.5;
    let dy = (hU - hD) * 0.5;
    return normalize(vec3<f32>(dx, dy, ws));
}

/*  8-sample normal (cross + diagonals) */
fn normal8(px: i32, py: i32, L: i32,
           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {

    let uv  = array<vec2<i32>, 8>(
        clampLocal(px + 1, py,     w, h), // R
        clampLocal(px - 1, py,     w, h), // L
        clampLocal(px,     py + 1, w, h), // U
        clampLocal(px,     py - 1, w, h), // D
        clampLocal(px + 1, py + 1, w, h), // UR
        clampLocal(px - 1, py + 1, w, h), // UL
        clampLocal(px + 1, py - 1, w, h), // DR
        clampLocal(px - 1, py - 1, w, h)  // DL
    );

    let hVal = array<f32, 8>(
        computeHnorm(textureLoad(fractalTex, uv[0], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[1], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[2], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[3], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[4], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[5], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[6], L).r) * dScalar,
        computeHnorm(textureLoad(fractalTex, uv[7], L).r) * dScalar
    );

    let dx = ((hVal[0] + 0.5 * (hVal[4] + hVal[6])) -
              (hVal[1] + 0.5 * (hVal[5] + hVal[7]))) * 0.5;
    let dy = ((hVal[2] + 0.5 * (hVal[4] + hVal[5])) -
              (hVal[3] + 0.5 * (hVal[6] + hVal[7]))) * 0.5;

    return normalize(vec3<f32>(dx, dy, ws));
}


// ───────────────────────── compute entry ─────────────────────────
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {

    /* 1) guard: stay inside this tile view */
    if (gid.x >= sdfParams.tileWidth || gid.y >= sdfParams.tileHeight) {
        return;
    }

    /* 2) constants */
    let px = i32(gid.x);
    let py = i32(gid.y);
    let w  = i32(sdfParams.tileWidth);   // local clamp (X)
    let h  = i32(sdfParams.gridSize);    // global clamp (Y)
    let L  = i32(sdfParams.layerIndex);
    let ws = 2.0 * sdfParams.quadScale / f32(sdfParams.gridSize);

    /* 3) height at centre */
    let vC     = textureLoad(fractalTex, clampLocal(px, py, w, h), L).r;
    let hNormC = computeHnorm(vC);
    let dScalar = sdfParams.dispAmp * sdfParams.quadScale;
    let hC     = hNormC * dScalar;
    let wallJump = sdfParams.wallJump * dScalar;
 
    /* ── 4) decide once which neighbours we need ──────────────────── */
    let needLDU  = (sdfParams.normalMode >= 1u) ||
                (sdfParams.connectivityMode >= 1u);

    let needDiag = (sdfParams.normalMode == 2u) ||
                (sdfParams.connectivityMode == 2u);

    /* always R + U -------------------------------------------------- */
    let hR = computeHnorm(textureLoad(
            fractalTex, clampLocal(px + 1, py    , w, h), L).r)
            * dScalar;

    let hU = computeHnorm(textureLoad(
            fractalTex, clampLocal(px    , py + 1, w, h), L).r)
            * dScalar;

    /* optional L + D ------------------------------------------------ */
    var hL : f32 = 0.0;
    var hD : f32 = 0.0;

    if (needLDU) {
        hL = computeHnorm(textureLoad(
                fractalTex, clampLocal(px - 1, py    , w, h), L).r)
            * dScalar;

        hD = computeHnorm(textureLoad(
                fractalTex, clampLocal(px    , py - 1, w, h), L).r)
            * dScalar;
    }

    /* optional diagonals ------------------------------------------- */
    var hUR : f32 = 0.0;
    var hUL : f32 = 0.0;
    var hDR : f32 = 0.0;
    var hDL : f32 = 0.0;

    if (needDiag) {
        hUR = computeHnorm(textureLoad(
                fractalTex, clampLocal(px + 1, py + 1, w, h), L).r)
            * dScalar;
        hUL = computeHnorm(textureLoad(
                fractalTex, clampLocal(px - 1, py + 1, w, h), L).r)
            * dScalar;
        hDR = computeHnorm(textureLoad(
                fractalTex, clampLocal(px + 1, py - 1, w, h), L).r)
            * dScalar;
        hDL = computeHnorm(textureLoad(
                fractalTex, clampLocal(px - 1, py - 1, w, h), L).r)
            * dScalar;
    }

   
    /* 5) normal + gradient ----------------------------------------- */
    var n      : vec3<f32>;
    var grad2  : f32;          // (rise)²  =  dx² + dy²

    switch (sdfParams.normalMode) {
        // ---------- 2-sample ---------------------------------------
        case 0u {
            let dx =  hR - hC;
            let dy =  hU - hC;
            grad2 = dx*dx + dy*dy;
            n     = normalize(vec3<f32>(dx, dy, ws));
        }

        // ---------- 4-sample ---------------------------------------
        case 1u {
            let dx = (hR - hL) * 0.5;
            let dy = (hU - hD) * 0.5;
            grad2 = dx*dx + dy*dy;
            n     = normalize(vec3<f32>(dx, dy, ws));
        }

        // ---------- 8-sample ---------------------------------------
        default {
            let dx = ((hR + 0.5*(hUR+hDR)) -
                    (hL + 0.5*(hUL+hDL))) * 0.5;
            let dy = ((hU + 0.5*(hUR+hUL)) -
                    (hD + 0.5*(hDR+hDL))) * 0.5;
            grad2 = dx*dx + dy*dy;
            n     = normalize(vec3<f32>(dx, dy, ws));
        }
    }

    /* ---- 6) wall flags ------------------------------------------- */
    /* bit layout: 0 R,1 U,2 L,3 D,4-7 diagonals, 8 = steep slope   */
    var flags : u32 = 0u;

    /* always test R & U ------------------------------------------- */
    if (abs(hR - hC) > wallJump) { flags |= 1u << 0; }   // R
    if (abs(hU - hC) > wallJump) { flags |= 1u << 1; }   // U

    /* 4-way adds L & D -------------------------------------------- */
    if (sdfParams.connectivityMode >= 1u) {
        if (abs(hL - hC) > wallJump) { flags |= 1u << 2; } // L
        if (abs(hD - hC) > wallJump) { flags |= 1u << 3; } // D
    }

    /* 8-way adds diagonals ---------------------------------------- */
    if (sdfParams.connectivityMode == 2u) {
        if (abs(hUR - hC) > wallJump) { flags |= 1u << 4; } // UR
        if (abs(hUL - hC) > wallJump) { flags |= 1u << 5; } // UL
        if (abs(hDR - hC) > wallJump) { flags |= 1u << 6; } // DR
        if (abs(hDL - hC) > wallJump) { flags |= 1u << 7; } // DL
    }

    let invRun2 =            // ( gridSize / 2·quadScale )²
        (f32(sdfParams.gridSize) *
        f32(sdfParams.gridSize)) /
        (4.0 * sdfParams.quadScale * sdfParams.quadScale);

    // (rise / run)²   =   grad2 · invRun2
    if (grad2 * invRun2 > sdfParams.slopeLimit) {
        flags |= 1u << 8;
    }

    /* ── 7) store height, normal & flags ---------------- */
    textureStore(sdfTex , vec2<i32>(px, py), L,
                vec4<f32>(hC, n.x, n.y, n.z));

    textureStore(flagTex, vec2<i32>(px, py), L,
                vec4<u32>(flags, 0u, 0u, 0u));
}
