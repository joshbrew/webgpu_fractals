// Compute WGSL (entry point: main)
struct Params {
  gridSize: u32,
  maxIter: u32,
  fractalType: u32,
  scaleMode: u32,
  zoom: f32,
  dx: f32,
  dy: f32,
  escapeR: f32,
  gamma: f32,
  layerIndex: u32,
  epsilon: f32,
  convergenceTest: u32,
  escapeMode: u32,
  tileOffsetX: u32,
  tileOffsetY: u32,
  tileWidth: u32,
  tileHeight: u32,
  aspect: f32,       
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,        // adjust so struct size remains multiple of 16 (or fits your uniformBufferSize)
};
@group(0) @binding(0) var<uniform> params: Params;
@group(1) @binding(0) var storageTex: texture_storage_2d_array<rgba8unorm, write>;

// Helpers:
fn shipPower(ax: f32, ay: f32, p: f32) -> vec2<f32> {
  // r = sqrt(ax^2 + ay^2)^p ; θ = atan2(ay,ax)*p
  let r2 = ax*ax + ay*ay;
  // avoid negative or zero? r2>=0
  let r = pow(r2, 0.5 * p);
  let theta = atan2(ay, ax) * p;
  return vec2<f32>(r * cos(theta), r * sin(theta));
}

fn invPower(qx: f32, qy: f32, p: f32) -> vec2<f32> {
  // 1/(qx+ i qy)^p via polar
  let r2 = qx*qx + qy*qy + 1e-9;
  let rp = pow(r2, 0.5 * p);
  let th = atan2(qy, qx) * p;
  let inv = 1.0 / rp;
  return vec2<f32>(inv * cos(th), -inv * sin(th));
}

struct InitialZ { qx: f32, qy: f32, px: f32, py: f32 };

fn getInitialZ(typ: u32, x0: f32, y0: f32) -> InitialZ {
  // Newton-typ indices: 26,40-46
  let isNewton =
      (typ == 26u) || (typ == 40u) || (typ == 41u) || (typ == 42u)
      || (typ == 43u) || (typ == 44u) || (typ == 45u) || (typ == 46u);
  if (isNewton) {
    return InitialZ(1.0, 0.0, 0.0, 0.0);
  }
  // inverse families 30-39 start at c
  if (typ >= 30u && typ <= 39u) {
    return InitialZ(x0, y0, 0.0, 0.0);
  }

  // Basic Julia starts at the pixel's complex coordinate c = (x0,y0)
  if (typ == 71u) {
    return InitialZ(x0, y0, 0.0, 0.0);
  }

  // default start at 0
  return InitialZ(0.0, 0.0, 0.0, 0.0);
}

// Main fractal step returning new z and new px,py:
struct FractalResult { nx: f32, ny: f32, npx: f32, npy: f32 };

fn computeFractal(typ: u32, qx: f32, qy: f32, px: f32, py: f32,
                  cx: f32, cy: f32, gamma: f32, iter: u32, scaleMode: u32) -> FractalResult {
                    
  let s = 1.0 + f32(iter) * (gamma - 1.0);
  var ccx = cx;
  var ccy = cy;
  let mask = scaleMode;

// bit 0 → Multiply
if ((mask & 1u) != 0u) {
    ccx = ccx * s;
    ccy = ccy * s;
}

// bit 1 → Divide
if ((mask & 2u) != 0u) {
    ccx = ccx / s;
    ccy = ccy / s;
}

// bit 2 → Sine warp
if ((mask & 4u) != 0u) {
    let m = sin(s);
    ccx = ccx * m;
    ccy = ccy * m;
}

// bit 3 → Tangent warp
if ((mask & 8u) != 0u) {
    let m = tan(s);
    ccx = ccx * m;
    ccy = ccy * m;
}

// bit 4 → Cosine warp
if ((mask & 16u) != 0u) {
    let m = cos(s);
    ccx = ccx * m;
    ccy = ccy * m;
}

// bit 5 → Exponential zoom
if ((mask & 32u) != 0u) {
    let m = exp(s);
    ccx = ccx * m;
    ccy = ccy * m;
}

// bit 6 → Logarithmic shrink
if ((mask & 64u) != 0u) {
    let m = log(s + 1e-3);
    ccx = ccx * m;
    ccy = ccy * m;
}

// bit 7 → Anisotropic warp (x·s, y÷s)
if ((mask & 128u) != 0u) {
    ccx = ccx * s;
    ccy = ccy / s;
}

// bit 8 → Rotate by s radians
if ((mask & 256u) != 0u) {
    let θ = s;
    let x0 = ccx * cos(θ) - ccy * sin(θ);
    let y0 = ccx * sin(θ) + ccy * cos(θ);
    ccx = x0;
    ccy = y0;
}

// bit 9 → Radial twist (r^s, θ·s)
if ((mask & 512u) != 0u) {
    let r0  = sqrt(ccx*ccx + ccy*ccy);
    let θ0  = atan2(ccy, ccx);
    let rp  = pow(r0, s);
    let θp  = θ0 * s;
    ccx = rp * cos(θp);
    ccy = rp * sin(θp);
}

// bit 10 → Hyperbolic warp (sinh, cosh)
if ((mask & 1024u) != 0u) {
    ccx = ccx * sinh(s);
    ccy = ccy * cosh(s);
}

// bit 11 → Radial hyperbolic (sinh(r*s))
if ((mask & 2048u) != 0u) {
    let r0  = sqrt(ccx*ccx + ccy*ccy);
    let θ0  = atan2(ccy, ccx);
    let rp  = sinh(r0 * s);
    ccx = rp * cos(θ0);
    ccy = rp * sin(θ0);
}

// bit 12 → Swirl (θ + r*s)
if ((mask & 4096u) != 0u) {
    let r0  = sqrt(ccx*ccx + ccy*ccy);
    let θ0  = atan2(ccy, ccx);
    let θp  = θ0 + r0 * s;
    ccx = r0 * cos(θp);
    ccy = r0 * sin(θp);
}

// bit 13 → Modular wrap
if ((mask & 8192u) != 0u) {
    let m0 = fract(s * 0.5) * 2.0;      // s mod 2
    let ux = ccx * m0 + 1.0;
    let uy = ccy * m0 + 1.0;
    ccx = fract(ux * 0.5) * 2.0 - 1.0;
    ccy = fract(uy * 0.5) * 2.0 - 1.0;
}

// bit 14 → Axis swap & scale
if ((mask & 16384u) != 0u) {
    let tx = ccy * s;
    let ty = ccx * s;
    ccx = tx;
    ccy = ty;
}

// bit 15 → Mixed warp (blend multiply & sine)
if ((mask & 32768u) != 0u) {
    let α   = fract(s * 0.1);
    let m1x = ccx * s;
    let m2x = ccx * sin(s);
    let m1y = ccy * s;
    let m2y = ccy * sin(s);
    ccx = mix(m1x, m2x, α);
    ccy = mix(m1y, m2y, α);
}

// bit 16 → Jitter noise
if ((mask & 65536u) != 0u) {
    let jx = fract(sin(ccx * s) * 43758.5453) - 0.5;
    let jy = fract(sin(ccy * s) * 97531.2468) - 0.5;
    ccx = ccx + jx * s * 0.2;
    ccy = ccy + jy * s * 0.2;
}

// bit 17 → Signed power warp
if ((mask & 131072u) != 0u) {
    ccx = sign(ccx) * pow(abs(ccx), s);
    ccy = sign(ccy) * pow(abs(ccy), s);
}

// bit 18 → Smoothstep fade
if ((mask & 262144u) != 0u) {
    let t0 = smoothstep(0.0, 1.0, s);
    ccx = ccx * t0;
    ccy = ccy * t0;
}
  let a = abs(qx);
  let b = abs(qy);
  var nx: f32 = 0.0;
  var ny: f32 = 0.0;
  var npx = px;
  var npy = py;

  switch(typ) {
    case 1u: { // Tricorn
      nx = qx*qx - qy*qy + ccx;
      ny = -2.0*qx*qy + ccy;
    }
    case 2u: { // Burning Ship
      nx = a*a - b*b + ccx;
      ny = 2.0*a*b + ccy;
    }
    case 3u: { // Perpendicular Mandelbrot
      nx = qx*qx - qy*qy + ccx;
      ny = -2.0*a*qy + ccy;
    }
    case 4u: { // Celtic
      nx = abs(qx*qx - qy*qy) + ccx;
      ny = 2.0*qx*qy + ccy;
    }
    case 5u: { // Buffalo
      nx = abs(qx*qx - qy*qy) + ccx;
      ny = -2.0*qx*qy + ccy;
    }
    case 6u: { // Phoenix (λ = -0.5)
      nx = qx*qx - qy*qy + ccx - 0.5*px;
      ny = 2.0*qx*qy + ccy - 0.5*py;
      npx = qx;
      npy = qy;
    }
    case 7u: { // Cubic Multibrot z^3 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r3 = pow(r2, 1.5);
      nx = r3 * cos(3.0 * theta) + ccx;
      ny = r3 * sin(3.0 * theta) + ccy;
    }
    case 8u: { // Quartic Multibrot z^4 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r4 = r2*r2;
      nx = r4 * cos(4.0 * theta) + ccx;
      ny = r4 * sin(4.0 * theta) + ccy;
    }
    case 9u: { // Cosine
      nx = cos(qx)*cosh(qy) + ccx;
      ny = -sin(qx)*sinh(qy) + ccy;
    }
    case 10u: { // Sine
      nx = sin(qx)*cosh(qy) + ccx;
      ny = cos(qx)*sinh(qy) + ccy;
    }
    case 11u: { // Heart
      let rx = abs(qx);
      nx = rx*rx - qy*qy + ccx;
      ny = 2.0*rx*qy + ccy;
    }
    case 12u: { // Perpendicular Buffalo
      nx = abs(qx*qx - qy*qy) + ccx;
      ny = -2.0*a*qy + ccy;
    }
    case 13u: { // Spiral Mandelbrot with twist
      let THETA = 0.35 + 2.0*gamma;
      let wRe = cos(THETA);
      let wIm = sin(THETA);
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let tx = wRe*zx2 - wIm*zy2;
      let ty = wRe*zy2 + wIm*zx2;
      nx = tx + ccx;
      ny = ty + ccy;
    }
    case 14u: { // Quintic z^5 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r5 = pow(r2, 2.5);
      nx = r5*cos(5.0*theta) + ccx;
      ny = r5*sin(5.0*theta) + ccy;
    }
    case 15u: { // Sextic z^6 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r6 = r2*r2*r2;
      nx = r6*cos(6.0*theta) + ccx;
      ny = r6*sin(6.0*theta) + ccy;
    }
    case 16u: { // Tangent fractal tan(z)+c
      let sin2x = sin(2.0*qx);
      let sinh2y = sinh(2.0*qy);
      let denom = cos(2.0*qx) + cosh(2.0*qy) + 1e-9;
      nx = sin2x/denom + ccx;
      ny = sinh2y/denom + ccy;
    }
    case 17u: { // Exponential fractal exp(z)+c
      let ex = exp(qx);
      nx = ex*cos(qy) + ccx;
      ny = ex*sin(qy) + ccy;
    }
    case 18u: { // Septic z^7 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r7 = pow(r2, 3.5);
      nx = r7*cos(7.0*theta) + ccx;
      ny = r7*sin(7.0*theta) + ccy;
    }
    case 19u: { // Octic z^8 + c
      let r2 = qx*qx + qy*qy;
      let theta = atan2(qy, qx);
      let r8 = r2*r2*r2*r2;
      nx = r8*cos(8.0*theta) + ccx;
      ny = r8*sin(8.0*theta) + ccy;
    }
    case 20u: { // Inverse Mandelbrot 1/z^2 + c
      let r2 = qx*qx + qy*qy + 1e-9;
      let invv = 1.0/(r2*r2);
      nx = (qx*qx - qy*qy)*invv + ccx;
      ny = (2.0*qx*qy)*invv + ccy;
    }
    case 21u: { // Burning Ship deep zoom
      // specific centre and sub; here we replicate JS: but needs cx,cy or ccx,ccy
      // Example:
      let centerRe = -1.7443359375;
      let centerIm = -0.017451171875;
      let sub = 0.04;
      let dx2 = ccx*sub + centerRe;
      let dy2 = ccy*sub + centerIm;
      nx = a*a - b*b + dx2;
      ny = 2.0*a*b + dy2;
    }
    case 22u: { // Cubic Burning Ship |z|^3 + c
      let pr = shipPower(a, b, 3.0);
      nx = pr.x + ccx;
      ny = pr.y + ccy;
    }
    case 23u: { // Quartic Burning Ship |z|^4 + c
      let pr = shipPower(a, b, 4.0);
      nx = pr.x + ccx;
      ny = pr.y + ccy;
    }
    case 24u: { // Quintic Burning Ship |z|^5 + c
      let pr = shipPower(a, b, 5.0);
      nx = pr.x + ccx;
      ny = pr.y + ccy;
    }
    case 25u: { // Hexic Burning Ship |z|^6 + c
      let pr = shipPower(a, b, 6.0);
      nx = pr.x + ccx;
      ny = pr.y + ccy;
    }
    case 26u: { // Nova: z - (z^3-1)/(3 z^2) + c
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let zx3 = zx2*qx - zy2*qy;
      let zy3 = zx2*qy + zy2*qx;
      let numx = zx3 - 1.0;
      let numy = zy3;
      let denx = 3.0*zx2;
      let deny = 3.0*zy2;
      let den2 = denx*denx + deny*deny + 1e-9;
      let qxDiv = (numx*denx + numy*deny)/den2;
      let qyDiv = (numy*denx - numx*deny)/den2;
      nx = qx - qxDiv + ccx;
      ny = qy - qyDiv + ccy;
    }
    case 27u: { // Man-o-War: z^2 + c + prev
      nx = qx*qx - qy*qy + ccx + px;
      ny = 2.0*qx*qy + ccy + py;
      npx = qx;
      npy = qy;
    }
    /* =============================================================== */
    /* 28 –  Stretched‑Celtic‑Spiral                                   */
    /*     A perpendicular‑Celtic variant with an anisotropic          */
    /*     stretch and an iteration‑driven spiral twist.               */
    /* =============================================================== */
    case 28u: {
        let k = 1.5;                    /* stretch factor              */
        let sx = qx * k;
        let sy = qy / k;

        /* perpendicular‑Celtic core                                   */
        var tx = abs(sx*sx - sy*sy);
        var ty = -2.0*abs(sx)*sy;

        /* gentle spiral twist using gamma & iteration #               */
        let ρ   = length(vec2<f32>(tx, ty));
        let θ   = atan2(ty, tx)
                + gamma * 6.2831853 * 0.1
                + f32(iter) * 0.03;

        nx = ρ * cos(θ) + cx;
        ny = ρ * sin(θ) + cy;
    }

    /* =============================================================== */
    /* 29 –  Polar‑Flame fractal                                       */
    /*     A simple “flame”‑style map in polar coordinates:            */
    /*         r  ← r² + c₀,   θ ← 2θ + c₁                             */
    /* =============================================================== */
    case 29u: {
        let r      = length(vec2<f32>(qx, qy)) + 1e-9;
        let theta  = atan2(qy, qx);

        /* flame parameters modulated by gamma                         */
        let c0 = 0.25 + 0.15*gamma;
        let c1 = 0.5  + 0.5 *gamma;

        let r2    = r*r + c0;
        let theta2= 2.0*theta + c1;

        nx = r2 * cos(theta2) + cx;
        ny = r2 * sin(theta2) + cy;
    }
    case 30u, 31u, 32u, 33u, 34u, 35u: { // inv 3..8
      // p = type-27 maybe? but in JS they had invPowerP
      // Here assume mapping typ->p: e.g. 30->3,31->4,... so p = f32(typ-27)?
      let p = f32(typ - 27u); // 30->3, 31->4, ..., 35->8
      let pr = invPower(qx, qy, p);
      nx = pr.x + ccx;
      ny = pr.y + ccy;
    }
    case 36u: { // Inverse Burning-Ship
      let a2 = abs(qx);
      let b2 = abs(qy);
      let r2 = qx*qx + qy*qy + 1e-9;
      let invv = 1.0/(r2*r2);
      nx = (a2*a2 - b2*b2)*invv + ccx;
      ny = (2.0*a2*b2)*invv + ccy;
    }
    case 37u: { // Inverse Tricorn
      let r2 = qx*qx + qy*qy + 1e-9;
      let invv = 1.0/(r2*r2);
      nx = (qx*qx - qy*qy)*invv + ccx;
      ny = (-2.0*qx*qy)*invv + ccy;
    }
    case 38u: { // Inverse Celtic
      let r2 = qx*qx + qy*qy + 1e-9;
      let invv = 1.0/(r2*r2);
      let rx = abs(qx*qx - qy*qy);
      nx = rx*invv + ccx;
      ny = (2.0*qx*qy)*invv + ccy;
    }
    case 39u: { // Inverse Phoenix
      let r2 = qx*qx + qy*qy + 1e-9;
      let invv = 1.0/(r2*r2);
      let zx2 = (qx*qx - qy*qy)*invv;
      let zy2 = (2.0*qx*qy)*invv;
      nx = zx2 + ccx - 0.5*px;
      ny = zy2 + ccy - 0.5*py;
      npx = qx;
      npy = qy;
    }
    case 40u: { // Tri-Nova
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let zx4 = zx2*zx2 - zy2*zy2;
      let zy4 = 2.0*zx2*zy2;
      nx = 1.3333333*qx - 0.3333333*zx4 + ccx;
      ny = 1.3333333*qy - 0.3333333*zy4 + ccy;
    }
    case 41u: { // Nova-Mandelbrot
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let zx3 = zx2*qx - zy2*qy;
      let zy3 = zx2*qy + zy2*qx;
      let denx = 3.0*zx2;
      let deny = 3.0*zy2;
      let den2 = denx*denx + deny*deny + 1e-9;
      let numx = zx3 - 1.0;
      let numy = zy3;
      let divx = (numx*denx + numy*deny)/den2;
      let divy = (numy*denx - numx*deny)/den2;
      nx = qx - divx + ccx;
      ny = qy - divy + ccy;
    }
    case 42u: { // Nova 2 (inverse variant)
      // 1) 1/z
      let r2_inv = 1.0/(qx*qx + qy*qy + 1e-9);
      let izRe = qx * r2_inv;
      let izIm = -qy * r2_inv;
      // 2) (1/z)^2, (1/z)^4
      let zx2 = izRe*izRe - izIm*izIm;
      let zy2 = 2.0*izRe*izIm;
      let zx4 = zx2*zx2 - zy2*zy2;
      let zy4 = 2.0*zx2*zy2;
      // 3) forward Quad-Nova step on 1/z
      let fRe = 1.3333333*izRe - 0.3333333*zx4 + ccx;
      let fIm = 1.3333333*izIm - 0.3333333*zy4 + ccy;
      // 4) invert back
      let den = 1.0/(fRe*fRe + fIm*fIm + 1e-9);
      nx = fRe*den;
      ny = -fIm*den;
    }
    case 43u: { // Nova 2 variant
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let zx4 = zx2*zx2 - zy2*zy2;
      let zy4 = 2.0*zx2*zy2;
      let fRe = 1.3333333*qx - 0.3333333*zx4 + ccx;
      let fIm = 1.3333333*qy - 0.3333333*zy4 + ccy;
      let invR2 = 1.0/(fRe*fRe + fIm*fIm + 1e-9);
      nx = fRe*invR2;
      ny = -fIm*invR2;
    }
    case 44u: { // Quartic-Nova
      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;
      let zx3 = zx2*qx - zy2*qy;
      let zy3 = zx2*qy + zy2*qx;
      let zx4 = zx3*qx - zy3*qy;
      let zy4 = zx3*qy + zy3*qx;
      let numx = zx4 - 1.0;
      let numy = zy4;
      let denx = 4.0*(zx2*qx - zy2*qy);
      let deny = 4.0*(zx2*qy + zy2*qx);
      let den2 = denx*denx + deny*deny + 1e-9;
      let divx = (numx*denx + numy*deny)/den2;
      let divy = (numy*denx - numx*deny)/den2;
      nx = qx - divx + ccx;
      ny = qy - divy + ccy;
    }
case 45u: { // Flower Nova
  // seed z0 = c on first iteration
  var zx0 = qx;
  var zy0 = qy;
  if (iter == 0u) {
    zx0 = cx;
    zy0 = cy;
  }
  // build z^2
  let zx2 = zx0*zx0 - zy0*zy0;
  let zy2 = 2.0*zx0*zy0;
  // build z^3 and z^4
  let zx3 = zx2*zx0 - zy2*zy0;
  let zy3 = zx2*zy0 + zy2*zx0;
  let zx4 = zx3*zx0 - zy3*zy0;
  let zy4 = zx3*zy0 + zy3*zx0;
  // Newton-style divisor = 4*z^3
  let denx = 4.0*zx3;
  let deny = 4.0*zy3;
  let den2 = denx*denx + deny*deny + 1e-9;
  // numerator = z^4 – 1
  let numx = zx4 - 1.0;
  let numy = zy4;
  // (z^4–1)/(4z^3)
  let divx = (numx*denx + numy*deny) / den2;
  let divy = (numy*denx - numx*deny) / den2;
  // forward candidate: z – (...) + c·s
  let fx = zx0 - divx + ccx;
  let fy = zy0 - divy + ccy;
  // NEGATE the result
  nx = -fx;
  ny = -fy;
  break;
}
case 46u: { // Scatter-Nova
  // seed z0 = c on first iteration
  var zx0 = qx;
  var zy0 = qy;
  if (iter == 0u) {
    zx0 = cx;
    zy0 = cy;
  }
  // build z^2
  let zx2 = zx0*zx0 - zy0*zy0;
  let zy2 = 2.0*zx0*zy0;
  // build z^3 and z^4
  let zx3 = zx2*zx0 - zy2*zy0;
  let zy3 = zx2*zy0 + zy2*zx0;
  let zx4 = zx3*zx0 - zy3*zy0;
  let zy4 = zx3*zy0 + zy3*zx0;
  // denominator = 4*z^3
  let denx = 4.0*zx3;
  let deny = 4.0*zy3;
  let den2 = denx*denx + deny*deny + 1e-9;
  // numerator = z^4 – 1
  let numx = zx4 - 1.0;
  let numy = zy4;
  // (z^4–1)/(4z^3)
  let divx = (numx*denx + numy*deny) / den2;
  let divy = (numy*denx - numx*deny) / den2;
  // forward Newton candidate: z – (...) + c·s
  let fx = zx0 - divx + ccx;
  let fy = zy0 - divy + ccy;
  // invert: z_{n+1} = 1 / f
  let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);
  nx = fx * invR2;
  ny = -fy * invR2;
  break;
}


// 47: Twisted-Flower Nova — flower nova with an iteration-dependent angular twist
case 47u: {
    // seed exactly like Flower-Nova
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx; zy0 = cy;
    }
    // compute z^2, z^3, z^4
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    // Newton-style divisor and numerator
    let denx = 4.0*zx3;
    let deny = 4.0*zy3;
    let den2 = denx*denx + deny*deny + 1e-9;
    let numx = zx4 - 1.0;
    let numy = zy4;
    let divx = (numx*denx + numy*deny) / den2;
    let divy = (numy*denx - numx*deny) / den2;
    // forward candidate
    let fx = zx0 - divx + ccx;
    let fy = zy0 - divy + ccy;
    // twist it: convert to polar, add a sin-based perturbation
    let r = length(vec2<f32>(fx, fy));
    let theta = atan2(fy, fx);
    let twist = theta + gamma * 2.0 * 3.14159265 * sin(f32(iter) * 0.2);
    nx = r * cos(twist);
    ny = r * sin(twist);
    npx = qx;
    npy = qy;
    break;
}

// 48: Lobed-Scatter Nova — scatter nova with petal-like lobes
case 48u: {
    // seed like Scatter-Nova
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }
    // same numerator/denominator as case 46
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numx = zx4 - 1.0;
    let numy = zy4;
    let denx = 4.0*zx3;
    let deny = 4.0*zy3;
    let den2 = denx*denx + deny*deny + 1e-9;
    let divx = (numx*denx + numy*deny) / den2;
    let divy = (numy*denx - numx*deny) / den2;
    let fx = zx0 - divx + ccx;
    let fy = zy0 - divy + ccy;
    // invert (scatter nova core)
    let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);
    var sx = fx * invR2;
    var sy = -fy * invR2;
    // petal lobes: modulate radius by cos(lobes*angle)
    let ang = atan2(sy, sx);
    let r0  = length(vec2<f32>(sx, sy));
    let lobes = 5.0 + sin(gamma * 10.0);  // 5–15 lobes
    let petal = 1.0 + 0.3 * cos(ang * lobes + f32(iter) * 0.15);
    nx = sx * petal;
    ny = sy * petal;
    npx = qx;
    npy = qy;
    break;
}
// 49: Hybrid-FlScatter Nova
case 49u: {
    // seed exactly like Flower/Scatter
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // Flower part
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDenF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fxF = zx0 - ((numxF*denxF + numyF*denyF) * invDenF) + ccx;
    let fyF = zy0 - ((numyF*denxF - numxF*denyF) * invDenF) + ccy;
    // Scatter part
    let invR2 = 1.0 / (fxF*fxF + fyF*fyF + 1e-9);
    let sx    = fxF * invR2;
    let sy    = -fyF * invR2;
    // blend
    let blend = 0.5 + 0.5 * sin(gamma * 3.14159265 + f32(iter) * 0.05);
    nx = mix(fxF, sx, blend);
    ny = mix(fyF, sy, blend);
    npx = qx; npy = qy;
    break;
}

// 50: Fractional-Nova (p ≈ 3.7)
case 50u: {
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    let p   = 3.7;
    let r0  = length(vec2<f32>(zx0, zy0));
    let theta0 = atan2(zy0, zx0);
    // z^p
    let rp  = pow(r0, p);
    let xp  = rp * cos(p * theta0);
    let yp  = rp * sin(p * theta0);
    // z^(p-1)
    let rm1 = pow(r0, p - 1.0);
    let xm1 = rm1 * cos((p - 1.0) * theta0);
    let ym1 = rm1 * sin((p - 1.0) * theta0);
    // Newton step
    let denx = p * xm1;
    let deny = p * ym1;
    let d2   = denx*denx + deny*deny + 1e-9;
    let divx = ((xp - 1.0) * denx + yp * deny) / d2;
    let divy = ( yp * denx - (xp - 1.0) * deny) / d2;
    nx = zx0 - divx + ccx;
    ny = zy0 - divy + ccy;
    npx = qx; npy = qy;
    break;
}

// 51: Kaleido-Nova (n-fold mirrored petals)
case 51u: {
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDen = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invDen) + ccx;
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invDen) + ccy;

    // kaleidoscope mirror
    let sect   = 7.0;
    let slice  = 2.0 * 3.14159265 / sect;
    let angle  = atan2(fy, fx);
    // manual mod: a2 = angle % slice
    let aDiv  = floor(angle / slice);
    let a2    = angle - aDiv * slice;
    // reflect
    var aMir: f32;
    if (a2 < slice * 0.5) {
        aMir = a2;
    } else {
        aMir = slice - a2;
    }
    let angK  = aDiv * slice + aMir;
    let rad0  = length(vec2<f32>(fx, fy));
    nx = rad0 * cos(angK);
    ny = rad0 * sin(angK);
    npx = qx; npy = qy;
    break;
}

// 52: Cross-Nova (alternate seeds between c and dx,dy)
case 52u: {
    // seed exactly like the others
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // pick sx, sy without select
    var sx = cx;
    var sy = cy;
    if ((iter & 1u) == 1u) {
        sx = params.dx;
        sy = params.dy;
    }
    // shift z by the difference
    let ux0 = zx0 + (sx - cx);
    let uy0 = zy0 + (sy - cy);
    // build powers
    let ux2 = ux0*ux0 - uy0*uy0;
    let uy2 = 2.0*ux0*uy0;
    let ux3 = ux2*ux0 - uy2*uy0;
    let uy3 = ux2*uy0 + uy2*ux0;
    let ux4 = ux3*ux0 - uy3*uy0;
    let uy4 = ux3*uy0 + uy3*ux0;
    // Newton numerator/denominator
    let numx = ux4 - 1.0;
    let numy = uy4;
    let denx = 4.0*ux3;
    let deny = 4.0*uy3;
    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);
    let divx = (numx*denx + numy*deny) * invD;
    let divy = (numy*denx - numx*deny) * invD;
    // next z
    let fx = ux0 - divx + ccx;
    let fy = uy0 - divy + ccy;
    nx = fx;
    ny = fy;
    npx = qx;
    npy = qy;
    break;
}

// 53: Mirror-Nova (flip axes each step)
case 53u: {
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;

    if ((iter & 1u) == 0u) {
        nx = -fx; ny = fy;
    } else {
        nx = fx;  ny = -fy;
    }
    npx = qx; npy = qy;
    break;
}

// 54: Spiro-Nova (Lissajous perturb)
case 54u: {
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;

    // spiro perturb
    let theta   = atan2(fy, fx);
    let r0      = length(vec2<f32>(fx, fy));
    // manual "mod" for gamma*5.0 % 4.0
    let tmpA    = gamma * 5.0;
    let aDiv    = floor(tmpA / 4.0);
    let freqA   = tmpA - aDiv * 4.0;
    let aFreq   = 3.0 + freqA;
    // manual "mod" for gamma*7.0 % 5.0
    let tmpB    = gamma * 7.0;
    let bDiv    = floor(tmpB / 5.0);
    let freqB   = tmpB - bDiv * 5.0;
    let bFreq   = 4.0 + freqB;
    let amp     = 0.2 + 0.1 * sin(f32(iter) * 0.1);

    nx = (r0 + amp * sin(aFreq * theta)) * cos(theta + amp * cos(bFreq * theta));
    ny = (r0 + amp * sin(aFreq * theta)) * sin(theta + amp * cos(bFreq * theta));
    npx = qx; npy = qy;
    break;
}

// 55: Vibrant-Nova (radial wave bloom)
case 55u: {
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invD   = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx     = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;
    let fy     = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;

    let r0      = length(vec2<f32>(fx, fy));
    let theta   = atan2(fy, fx);
    let wave    = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);

    nx = r0 * wave * cos(theta);
    ny = r0 * wave * sin(theta);
    npx = qx; npy = qy;
    break;
}
// 56: Julia-Nova Hybrid — blends a fixed Julia seed with Newton steps
case 56u: {
    // julia constant from pan (dx,dy)
    let jx = params.dx;
    let jy = params.dy;
    // seed z₀ = c for iter 0, else previous z
    var zx0 = qx;
    var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx;
        zy0 = cy;
    }
    // apply Newton on z, then add julia twist
    // build z^2, z^3
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    // numerator/denominator for z^3−1 / (3·z²)
    let numx = zx3 - 1.0;
    let numy = zy3;
    let denx = 3.0*zx2;
    let deny = 3.0*zy2;
    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);
    let divx = (numx*denx + numy*deny) * invD;
    let divy = (numy*denx - numx*deny) * invD;
    let fx = zx0 - divx + ccx;
    let fy = zy0 - divy + ccy;
    // julia twist: z ← z + α·(z₀ - j)
    let alpha = 0.3 + 0.2 * sin(gamma * 6.28);
    nx = fx + alpha * (fx - jx);
    ny = fy + alpha * (fy - jy);
    npx = qx; npy = qy;
    break;
}

// 57: Inverse-Spiral Nova — scatter-nova with a logarithmic spiral warp
case 57u: {
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }
    // do scatter-nova core (case 46)
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numx = zx4 - 1.0; let numy = zy4;
    let denx = 4.0*zx3; let deny = 4.0*zy3;
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);
    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;
    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;
    let invR2= 1.0/(fx*fx + fy*fy + 1e-9);
    var sx   = fx * invR2; var sy = -fy * invR2;
    // warp into logarithmic spiral: radius ← r·exp(β·θ)
    let θ = atan2(sy, sx);
    let r = length(vec2<f32>(sx, sy));
    let beta = 0.1 + 0.05*sin(f32(iter)*0.2);
    let rw = r * exp(beta * θ);
    nx = rw * cos(θ);
    ny = rw * sin(θ);
    npx = qx; npy = qy;
    break;
}

// 58: Wavefront Nova — introduces a radial sine-wave front each few iterations
case 58u: {
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }
    // build z^2, z^3, z^4
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    // Newton step divisor/numerator
    let denx = 4.0*zx3; let deny = 4.0*zy3;
    let numx = zx4 - 1.0; let numy = zy4;
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);
    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;
    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;
    // apply a circular wavefront that pulses every N steps
    let r0    = length(vec2<f32>(fx, fy));
    let phase = sin(f32(iter) * 0.3 + gamma * 12.0);
    let offset= 0.2 * phase * sin(8.0 * r0);
    let r1    = max(0.0, r0 + offset);
    let θ     = atan2(fy, fx);
    nx = r1 * cos(θ);
    ny = r1 * sin(θ);
    npx = qx; npy = qy;
    break;
}

// 59: Vortex-Nova — a smooth swirl after a Flower-Nova iteration
case 59u: {
    // seed like Flower-Nova
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx; zy0 = cy;
    }
    // Flower-Nova forward step
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invD = 1.0/(denxF*denxF + denyF*denyF + 1e-9);
    let fx = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;
    let fy = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;

    // apply a vortex swirl: rotate by angle ∝ exp(-r)
    let r   = length(vec2<f32>(fx, fy));
    let baseAngle = atan2(fy, fx);
    let swirlAmt  = 1.5 * exp(-r * 2.0);      // adjust decay
    let angle2    = baseAngle + swirlAmt;
    nx = r * cos(angle2);
    ny = r * sin(angle2);

    npx = qx; npy = qy;
    break;
}

// 60: Sine-Ring Nova — Flower-Nova + smooth sinusoidal rings
case 60u: {
    // seed like Flower-Nova
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx; zy0 = cy;
    }
    // Flower-Nova forward step
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invD   = 1.0/(denxF*denxF + denyF*denyF + 1e-9);
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;

    // radial sine rings
    let r0    = length(vec2<f32>(fx0, fy0));
    let θ     = atan2(fy0, fx0);
    let freq  = 10.0 + 5.0 * sin(gamma * 6.2831853);  // 5–15 rings
    let amp   = 0.1 + 0.05 * cos(f32(iter) * 0.1);
    let ring  = r0 + amp * sin(freq * r0);
    nx = ring * cos(θ);
    ny = ring * sin(θ);

    npx = qx; npy = qy;
    break;
}

// 57: Inverse-Spiral Nova — less jumpy, gentler spiral warp
case 61u: {
    // seed
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) {
        zx0 = cx; zy0 = cy;
    }
    // do the “scatter” core (same as case 46) to get sx, sy:
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numx = zx4 - 1.0;   let numy = zy4;
    let denx = 4.0*zx3;     let deny = 4.0*zy3;
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);
    let fx0  = zx0 - (numx*denx + numy*deny)*invD + ccx;
    let fy0  = zy0 - (numy*denx - numx*deny)*invD + ccy;
    let invR2= 1.0/(fx0*fx0 + fy0*fy0 + 1e-9);
    let sx   = fx0 * invR2;
    let sy   = -fy0 * invR2;

    // smooth spiral warp
    let θ    = atan2(sy, sx);
    let r    = length(vec2<f32>(sx, sy));
    // normalize θ to [–1,1]
    let t    = θ / 3.14159265;
    // gentle exponent factor in [0.8,1.2]
    let beta = 1.0 + 0.2 * t;
    let rw   = pow(r, beta);

    nx = rw * cos(θ);
    ny = rw * sin(θ);
    npx = qx; npy = qy;
    break;
}
// 62: Inverse-Vortex Nova — swirl first, then invert
case 62u: {
    // same seed + Flower‐Nova forward as case 59
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }
    // Flower‐Nova step
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;

    // swirl warp
    let r   = length(vec2<f32>(fx0, fy0));
    let θ   = atan2(fy0, fx0);
    let swirlAmt = 1.5 * exp(-r * 2.0);
    let θ2  = θ + swirlAmt;
    var vx  = r * cos(θ2);
    var vy  = r * sin(θ2);

    // inverse 1/z
    let invR2 = 1.0 / (vx*vx + vy*vy + 1e-9);
    nx = vx * invR2;
    ny = -vy * invR2;
    npx = qx; npy = qy;
    break;
}

// 63: Inverse‐Sine‐Ring Nova — ring warp then invert
case 63u: {
    // seed + Flower‐Nova forward as case 60
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }
    let zx2 = zx0*zx0 - zy0*zy0;
    let zy2 = 2.0*zx0*zy0;
    let zx3 = zx2*zx0 - zy2*zy0;
    let zy3 = zx2*zy0 + zy2*zx0;
    let zx4 = zx3*zx0 - zy3*zy0;
    let zy4 = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;

    // sine‐ring warp
    let r0   = length(vec2<f32>(fx0, fy0));
    let θ    = atan2(fy0, fx0);
    let freq = 10.0 + 5.0 * sin(gamma * 6.2831853);
    let amp  = 0.1 + 0.05 * cos(f32(iter) * 0.1);
    var rx  = r0 + amp * sin(freq * r0);
    var ry  = θ;

    let sx = rx * cos(ry);
    let sy = rx * sin(ry);

    // inverse 1/z
    let invR2 = 1.0 / (sx*sx + sy*sy + 1e-9);
    nx = sx * invR2;
    ny = -sy * invR2;
    npx = qx; npy = qy;
    break;
}

// 64: Inverse-Mirror Nova — flip axes then 1/z
case 64u: {
    // seed like Mirror-Nova
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }

    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;
    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;

    // mirror flip
    var mx: f32; var my: f32;
    if ((iter & 1u) == 0u) {
        mx = -fx0; my = fy0;
    } else {
        mx =  fx0; my = -fy0;
    }

    // invert
    let invR2 = 1.0 / (mx*mx + my*my + 1e-9);
    nx = mx * invR2;
    ny = -my * invR2;
    npx = qx; npy = qy;
    break;
}

// 65: Inverse-Vibrant Nova — wave bloom then 1/z
case 65u: {
    // seed like Vibrant-Nova
    var zx0 = qx; var zy0 = qy;
    if (iter == 0u) { zx0 = cx; zy0 = cy; }

    // Flower-Nova base
    let zx2   = zx0*zx0 - zy0*zy0;
    let zy2   = 2.0*zx0*zy0;
    let zx3   = zx2*zx0 - zy2*zy0;
    let zy3   = zx2*zy0 + zy2*zx0;
    let zx4   = zx3*zx0 - zy3*zy0;
    let zy4   = zx3*zy0 + zy3*zx0;
    let numxF = zx4 - 1.0;
    let numyF = zy4;
    let denxF = 4.0*zx3;
    let denyF = 4.0*zy3;
    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);
    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;
    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;

    // radial wave bloom
    let r0     = length(vec2<f32>(fx0, fy0));
    let theta  = atan2(fy0, fx0);
    let wave   = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);
    let vx     = r0 * wave * cos(theta);
    let vy     = r0 * wave * sin(theta);

    // invert
    let invR2  = 1.0 / (vx*vx + vy*vy + 1e-9);
    nx = vx * invR2;
    ny = -vy * invR2;
    npx = qx; npy = qy;
    break;
}
case 66u: {                // Golden‑Ratio Rational
    let phi  = 1.61803398875;
    //  c_repulsive  = (−φ  ,  +φ)
    //  c_attractive = ( φ−1,  0.5 φ)
    let crx = -phi;
    let cry =  phi;
    let cax =  phi - 1.0;
    let cay =  0.5 * phi;

    // z² = (qx² − qy²)  +  i(2 qx qy)
    let zx2 = qx*qx - qy*qy;
    let zy2 = 2.0 * qx * qy;

    // (z² + c_rep) / (z² + c_att)
    let numx = zx2 + crx;
    let numy = zy2 + cry;
    let denx = zx2 + cax;
    let deny = zy2 + cay;
    let den2 = denx*denx + deny*deny + 1e-9;

    let divx = (numx*denx + numy*deny) / den2;
    let divy = (numy*denx - numx*deny) / den2;

    nx = divx + ccx;
    ny = divy + ccy;
}

case 67u: {                // SinCos‑Kernel
    /* sin(z) = sin(x)cosh(y)  +  i cos(x)sinh(y)
       cos(z) = cos(x)cosh(y)  −  i sin(x)sinh(y)                        */
    let sinx = sin(qx) * cosh(qy);
    let siny =  cos(qx) * sinh(qy);
    let cosx = cos(qx) * cosh(qy);
    let cosy = -sin(qx) * sinh(qy);

    // product: sin(z) * cos(z)
    let prodx = sinx*cosx - siny*cosy;
    let prody = sinx*cosy + siny*cosx;

    nx = prodx + ccx;
    ny = prody + ccy;
}
/* 68 : Golden‑Push‑Pull  (blend of attractive & repulsive constants)
         zᵢ₊₁ =  (z² + c_rep) / (z² + c_att)  +  mix(c_att , c_rep , β)
         where  β = 0.5 + 0.5·sin(iter·0.25) gives a gentle breathing  */
case 68u: {
    let phi  = 1.61803398875;
    let crex = -phi;  let crey =  phi;           // c_repulsive
    let caex =  phi-1.0; let caey = 0.5*phi;      // c_attractive

    /* z² */
    let zx2 = qx*qx - qy*qy;
    let zy2 = 2.0*qx*qy;

    /* (z² + c_rep) / (z² + c_att) */
    let numx = zx2 + crex;
    let numy = zy2 + crey;
    let denx = zx2 + caex;
    let deny = zy2 + caey;
    let den2 = denx*denx + deny*deny + 1e-9;
    let divx = (numx*denx + numy*deny) / den2;
    let divy = (numy*denx - numx*deny) / den2;

    /* breathing blend between constants */
    let beta = 0.5 + 0.5 * sin(f32(iter) * 0.25);
    let mixx = caex * (1.0-beta) + crex * beta;
    let mixy = caey * (1.0-beta) + crey * beta;

    nx = divx + mixx + ccx;
    ny = divy + mixy + ccy;
}

/* 69 : Sinc‑Kernel   zᵢ₊₁ = sinc(π·z) + c   (sinc z = sin z / z)      */
case 69u: {
    let pi  = 3.14159265359;
    /* sin(π z)  → (a,b) */
    let sinX =  sin(pi*qx) * cosh(pi*qy);
    let sinY =  cos(pi*qx) * sinh(pi*qy);

    /* denominator  π z  = (c,d) */
    let denX = pi * qx;
    let denY = pi * qy;
    let den2 = denX*denX + denY*denY + 1e-9;

    /* (a+ib)/(c+id) */
    let sincX = ( sinX*denX + sinY*denY) / den2;
    let sincY = ( sinY*denX - sinX*denY) / den2;

    nx = sincX + ccx;
    ny = sincY + ccy;
  }
   
    // 70: Bizarre Grid
    case 70u: {
      var zx = qx;
      var zy = qy;
      if (iter == 0u) {
        zx = cx;
        zy = cy;
      }

      if (zx > 1.0) {
        zx = 2.0 - zx;
      }
      if (zx < -1.0) {
        zx = -2.0 - zx;
      }
      if (zy > 1.0) {
        zy = 2.0 - zy;
      }
      if (zy < -1.0) {
        zy = -2.0 - zy;
      }

      let r2 = zx*zx + zy*zy;
      var scale = 1.0;
      let Rmin2 = 0.25;
      let Rmax2 = 2.25;

      if (r2 < Rmin2) {
        scale = Rmax2 / Rmin2;
      } else if (r2 < Rmax2) {
        scale = Rmax2 / r2;
      }

      zx = zx * scale * 1.5;
      zy = zy * scale * 1.5;

      let kx = params.dx;
      let ky = params.dy;

      nx = zx + kx;
      ny = zy + ky;
    }

    // 71: Julia (z² + k, z₀ = c, k = dx + i dy)
    case 71u: {
      let kx = params.dx;
      let ky = params.dy;

      let zx2 = qx*qx - qy*qy;
      let zy2 = 2.0*qx*qy;

      nx = zx2 + kx + 0.3; //offset to not get a perfect circle
      ny = zy2 + ky + 0.5;
    }




    default: { // Mandelbrot
      nx = qx*qx - qy*qy + ccx;
      ny = 2.0*qx*qy + ccy;
    }
  }
  return FractalResult(nx, ny, npx, npy);
}

@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  // Local index within this strip texture
  let lx = gid.x;
  let ly = gid.y;

  // Skip threads that fall outside the strip bounds for this dispatch
  if (lx >= params.tileWidth || ly >= params.tileHeight) {
    return;
  }

  // Global index within the *full* fractal grid (e.g. 8192×8192)
  let gx = params.tileOffsetX + lx;
  let gy = params.tileOffsetY + ly;

  // Skip anything that lies outside the global grid
  if (gx >= params.gridSize || gy >= params.gridSize) {
    return;
  }

  // Normalized coordinates across the full grid [0,1]
  // gridSize should be the full resolution (8192), not the strip size.
  let invF = 1.0 / f32(params.gridSize - 1u);
  let nxFull = f32(gx) * invF;
  let nyFull = f32(gy) * invF;

  // Center at zero, maintain aspect so it is not stretched
  let centeredX = (nxFull - 0.5) * params.aspect;
  let centeredY = (nyFull - 0.5);

  // Zoom + pan – zoom is the size of the window in complex space
  let cx = centeredX * params.zoom + params.dx;
  let cy = centeredY * params.zoom + params.dy;

  var init = getInitialZ(params.fractalType, cx, cy);
  var qx = init.qx;
  var qy = init.qy;
  var px = init.px;
  var py = init.py;

  var iter: u32 = 0u;
  let escapeR2 = params.escapeR * params.escapeR;

  loop {
    if (iter >= params.maxIter) {
      break;
    }
    if (qx*qx + qy*qy > escapeR2) {
      break;
    }

    let res = computeFractal(
      params.fractalType, qx, qy, px, py,
      cx, cy, params.gamma, iter, params.scaleMode
    );

    let nxz = res.nx;
    let nyz = res.ny;
    let npx = res.npx;
    let npy = res.npy;

    if (params.convergenceTest == 1u) {
      if (params.escapeMode == 1u) {
        if (nxz*nxz + nyz*nyz > escapeR2) {
          iter = iter + 1u;
          break;
        }
      } else {
        let dx_ = nxz - qx;
        let dy_ = nyz - qy;
        if (dx_*dx_ + dy_*dy_ < params.epsilon * params.epsilon) {
          iter = iter + 1u;
          break;
        }
      }
    } else {
      if (nxz*nxz + nyz*nyz > escapeR2) {
        iter = iter + 1u;
        break;
      }
    }

    px = npx; py = npy;
    qx = nxz; qy = nyz;
    iter = iter + 1u;
  }

  let ratio = f32(iter) / f32(params.maxIter);
  let col = vec4<f32>(ratio, ratio, ratio, 1.0);

  // IMPORTANT: write into the strip texture at local coords
  textureStore(
    storageTex,
    vec2<i32>(i32(lx), i32(ly)),
    i32(params.layerIndex),
    col
  );
}


