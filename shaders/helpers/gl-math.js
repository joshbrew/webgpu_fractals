// 4×4 matrices are Float32Array(16), column-major.
// Vectors are simple [x, y, z] or Float32Array(3).
// All functions that allocate have `Into` variants where it makes sense,
// so you can avoid GC in hot paths.

// -----------------------------------------------------------------------------
// Core constructors
// -----------------------------------------------------------------------------

export function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function identityInto(out) {
  out[0] = 1; out[4] = 0; out[8]  = 0; out[12] = 0;
  out[1] = 0; out[5] = 1; out[9]  = 0; out[13] = 0;
  out[2] = 0; out[6] = 0; out[10] = 1; out[14] = 0;
  out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
  return out;
}

// -----------------------------------------------------------------------------
// Projection matrices
// -----------------------------------------------------------------------------

// GL style perspective: clip-space z in [-1, 1], right handed.
export function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0,          f, 0, 0,
    0,          0, (far + near) * nf, -1,
    0,          0, (2 * far * near) * nf, 0,
  ]);
}

// WebGPU / D3D style perspective: clip-space z in [0, 1], right handed.
export function perspectiveZO(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const a = far * nf;
  const b = far * near * nf;
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0,          f, 0, 0,
    0,          0, a, -1,
    0,          0, b, 0,
  ]);
}

// Left handed perspective, clip-space z in [-1, 1].
export function perspectiveLH(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (far - near);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0,          f, 0, 0,
    0,          0, (far + near) * nf, 1,
    0,          0, (-2 * near * far) * nf, 0,
  ]);
}

// Left handed perspective, clip-space z in [0, 1].
export function perspectiveLHZO(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (far - near);
  const a = far * nf;
  const b = -near * a;
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0,          f, 0, 0,
    0,          0, a, 1,
    0,          0, b, 0,
  ]);
}

// GL style orthographic: clip-space z in [-1, 1], right handed.
export function ortho(left, right, bottom, top, near, far) {
  const lr = 1 / (right - left);
  const bt = 1 / (top - bottom);
  const nf = 1 / (near - far);
  return new Float32Array([
    2 * lr, 0,      0,      0,
    0,      2 * bt, 0,      0,
    0,      0,      2 * nf, 0,
    -(right + left) * lr,
    -(top + bottom) * bt,
    (far + near) * nf,
    1,
  ]);
}

// WebGPU / D3D style orthographic: clip-space z in [0, 1], right handed.
export function orthoZO(left, right, bottom, top, near, far) {
  const lr = 1 / (right - left);
  const bt = 1 / (top - bottom);
  const nf = 1 / (near - far);
  return new Float32Array([
    2 * lr, 0,      0,   0,
    0,      2 * bt, 0,   0,
    0,      0,      nf,  0,
    -(right + left) * lr,
    -(top + bottom) * bt,
    near * nf,
    1,
  ]);
}

// -----------------------------------------------------------------------------
// Camera lookAt
// -----------------------------------------------------------------------------

// Right handed lookAt: camera looks toward -Z.
export function lookAt(eye, center, up) {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  const [ux, uy, uz] = up;

  // forward = normalize(eye - center)
  let fx = ex - cx;
  let fy = ey - cy;
  let fz = ez - cz;
  let rlf = 1 / Math.hypot(fx, fy, fz);
  fx *= rlf; fy *= rlf; fz *= rlf;

  // right = normalize(cross(up, forward))
  let rx = uy * fz - uz * fy;
  let ry = uz * fx - ux * fz;
  let rz = ux * fy - uy * fx;
  let rlr = 1 / Math.hypot(rx, ry, rz);
  rx *= rlr; ry *= rlr; rz *= rlr;

  // true up = cross(forward, right)
  const ux2 = fy * rz - fz * ry;
  const uy2 = fz * rx - fx * rz;
  const uz2 = fx * ry - fy * rx;

  return new Float32Array([
    rx, ux2, fx, 0,
    ry, uy2, fy, 0,
    rz, uz2, fz, 0,
    -(rx * ex + ry * ey + rz * ez),
    -(ux2 * ex + uy2 * ey + uz2 * ez),
    -(fx * ex + fy * ey + fz * ez),
    1,
  ]);
}

// Left handed lookAt: camera looks toward +Z.
export function lookAtLH(eye, center, up) {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  const [ux, uy, uz] = up;

  // forward = normalize(center - eye)
  let zx = cx - ex;
  let zy = cy - ey;
  let zz = cz - ez;
  let rlz = 1 / Math.hypot(zx, zy, zz);
  zx *= rlz; zy *= rlz; zz *= rlz;

  // right = normalize(cross(up, forward))
  let xx = uy * zz - uz * zy;
  let xy = uz * zx - ux * zz;
  let xz = ux * zy - uy * zx;
  let rlx = 1 / Math.hypot(xx, xy, xz);
  xx *= rlx; xy *= rlx; xz *= rlx;

  // true up = cross(forward, right)
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * ex + xy * ey + xz * ez),
    -(yx * ex + yy * ey + yz * ez),
    -(zx * ex + zy * ey + zz * ez),
    1,
  ]);
}

// Handy factory: builds view, proj, viewProj.
export function makeCameraMatrices(opts) {
  const {
    eye,
    center,
    up = [0, 1, 0],
    fovY,
    aspect,
    near,
    far,
    useZO = true,
    leftHanded = false,
  } = opts;

  const view = leftHanded ? lookAtLH(eye, center, up) : lookAt(eye, center, up);
  const proj = leftHanded
    ? (useZO ? perspectiveLHZO(fovY, aspect, near, far) : perspectiveLH(fovY, aspect, near, far))
    : (useZO ? perspectiveZO(fovY, aspect, near, far) : perspective(fovY, aspect, near, far));

  const viewProj = mulMat(proj, view);
  return { view, proj, viewProj };
}

// -----------------------------------------------------------------------------
// Transforms (T, R, S) and basic builders
// -----------------------------------------------------------------------------

/** 4×4 translation, column-major */
export function translation(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

export function translationInto(out, x, y, z) {
  out[0] = 1; out[4] = 0; out[8]  = 0; out[12] = x;
  out[1] = 0; out[5] = 1; out[9]  = 0; out[13] = y;
  out[2] = 0; out[6] = 0; out[10] = 1; out[14] = z;
  out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
  return out;
}

export function setTranslation(out, x, y, z) {
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

export function getTranslation(out, m) {
  out[0] = m[12];
  out[1] = m[13];
  out[2] = m[14];
  return out;
}

/** 4×4 scale, column-major */
export function scale(x, y, z) {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ]);
}

export function scaleInto(out, x, y, z) {
  out[0] = x; out[4] = 0; out[8]  = 0; out[12] = 0;
  out[1] = 0; out[5] = y; out[9]  = 0; out[13] = 0;
  out[2] = 0; out[6] = 0; out[10] = z; out[14] = 0;
  out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
  return out;
}

export function getScale(out, m) {
  const x0 = m[0], x1 = m[1], x2 = m[2];
  const y0 = m[4], y1 = m[5], y2 = m[6];
  const z0 = m[8], z1 = m[9], z2 = m[10];
  out[0] = Math.hypot(x0, x1, x2);
  out[1] = Math.hypot(y0, y1, y2);
  out[2] = Math.hypot(z0, z1, z2);
  return out;
}

// Axis rotations, right handed.

export function rotationX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([
    c, 0, 0, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationZ(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationAxis(rad, axis) {
  let [x, y, z] = axis;
  const len = Math.hypot(x, y, z);
  if (!len) {
    return identity();
  }
  x /= len; y /= len; z /= len;

  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const t = 1 - c;

  const tx = t * x;
  const ty = t * y;

  return new Float32Array([
    tx * x + c,     tx * y + s * z, tx * z - s * y, 0,
    tx * y - s * z, ty * y + c,     ty * z + s * x, 0,
    tx * z + s * y, ty * z - s * x, t * z * z + c,  0,
    0,              0,              0,              1,
  ]);
}

// -----------------------------------------------------------------------------
// Quaternions and TRS composition / decomposition
// Quaternion layout: [x, y, z, w]
// -----------------------------------------------------------------------------

export function quatIdentity() {
  return new Float32Array([0, 0, 0, 1]);
}

export function quatNormalize(out, q) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const len = Math.hypot(x, y, z, w) || 1;
  const inv = 1 / len;
  out[0] = x * inv;
  out[1] = y * inv;
  out[2] = z * inv;
  out[3] = w * inv;
  return out;
}

export function quatFromAxisAngle(out, axis, angle) {
  let [x, y, z] = axis;
  const len = Math.hypot(x, y, z) || 1;
  x /= len; y /= len; z /= len;
  const half = angle * 0.5;
  const s = Math.sin(half);
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = Math.cos(half);
  return out;
}

// Compose T * R(q) * S into a 4×4 matrix.
export function composeTRS(position, rotationQuat, scaleVec) {
  const m = new Float32Array(16);
  return composeTRSInto(m, position, rotationQuat, scaleVec);
}

export function composeTRSInto(out, position, rotationQuat, scaleVec) {
  const px = position[0], py = position[1], pz = position[2];
  const sx = scaleVec[0], sy = scaleVec[1], sz = scaleVec[2];

  const x = rotationQuat[0], y = rotationQuat[1], z = rotationQuat[2], w = rotationQuat[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, yy = y * y2, zz = z * z2;
  const xy = x * y2, xz = x * z2, yz = y * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  const r00 = 1 - (yy + zz);
  const r01 = xy + wz;
  const r02 = xz - wy;
  const r10 = xy - wz;
  const r11 = 1 - (xx + zz);
  const r12 = yz + wx;
  const r20 = xz + wy;
  const r21 = yz - wx;
  const r22 = 1 - (xx + yy);

  out[0]  = r00 * sx;
  out[1]  = r01 * sx;
  out[2]  = r02 * sx;
  out[3]  = 0;

  out[4]  = r10 * sy;
  out[5]  = r11 * sy;
  out[6]  = r12 * sy;
  out[7]  = 0;

  out[8]  = r20 * sz;
  out[9]  = r21 * sz;
  out[10] = r22 * sz;
  out[11] = 0;

  out[12] = px;
  out[13] = py;
  out[14] = pz;
  out[15] = 1;
  return out;
}

// Decompose matrix into T, R, S.
// Returns { translation, rotation, scale } where rotation is a quaternion.
export function decomposeTRS(m) {
  const translation = new Float32Array(3);
  const scale = new Float32Array(3);
  const rotation = new Float32Array(4);

  getTranslation(translation, m);
  getScale(scale, m);

  let sx = scale[0] || 1;
  let sy = scale[1] || 1;
  let sz = scale[2] || 1;

  // Handle possible negative scale via determinant sign.
  const det =
    m[0] * (m[5] * m[10] - m[6] * m[9]) -
    m[4] * (m[1] * m[10] - m[2] * m[9]) +
    m[8] * (m[1] * m[6] - m[2] * m[5]);
  if (det < 0) {
    sx = -sx;
    scale[0] = sx;
  }

  const rm00 = m[0] / sx;
  const rm01 = m[1] / sx;
  const rm02 = m[2] / sx;
  const rm10 = m[4] / sy;
  const rm11 = m[5] / sy;
  const rm12 = m[6] / sy;
  const rm20 = m[8] / sz;
  const rm21 = m[9] / sz;
  const rm22 = m[10] / sz;

  const trace = rm00 + rm11 + rm22;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    rotation[3] = 0.25 * s;
    rotation[0] = (rm21 - rm12) / s;
    rotation[1] = (rm02 - rm20) / s;
    rotation[2] = (rm10 - rm01) / s;
  } else if (rm00 > rm11 && rm00 > rm22) {
    const s = Math.sqrt(1 + rm00 - rm11 - rm22) * 2;
    rotation[3] = (rm21 - rm12) / s;
    rotation[0] = 0.25 * s;
    rotation[1] = (rm01 + rm10) / s;
    rotation[2] = (rm02 + rm20) / s;
  } else if (rm11 > rm22) {
    const s = Math.sqrt(1 + rm11 - rm00 - rm22) * 2;
    rotation[3] = (rm02 - rm20) / s;
    rotation[0] = (rm01 + rm10) / s;
    rotation[1] = 0.25 * s;
    rotation[2] = (rm12 + rm21) / s;
  } else {
    const s = Math.sqrt(1 + rm22 - rm00 - rm11) * 2;
    rotation[3] = (rm10 - rm01) / s;
    rotation[0] = (rm02 + rm20) / s;
    rotation[1] = (rm12 + rm21) / s;
    rotation[2] = 0.25 * s;
  }

  quatNormalize(rotation, rotation);
  return { translation, rotation, scale };
}

// -----------------------------------------------------------------------------
// Multiplication and basic ops
// -----------------------------------------------------------------------------

/** multiply A * B (each is column-major Float32Array[16]) */
export function mulMat(A, B, out) {
  const dst = out || new Float32Array(16);

  for (let col = 0; col < 4; col++) {
    const cOff = col * 4;
    const b0 = B[cOff + 0];
    const b1 = B[cOff + 1];
    const b2 = B[cOff + 2];
    const b3 = B[cOff + 3];

    dst[cOff + 0] = A[0] * b0 + A[4] * b1 + A[8]  * b2 + A[12] * b3;
    dst[cOff + 1] = A[1] * b0 + A[5] * b1 + A[9]  * b2 + A[13] * b3;
    dst[cOff + 2] = A[2] * b0 + A[6] * b1 + A[10] * b2 + A[14] * b3;
    dst[cOff + 3] = A[3] * b0 + A[7] * b1 + A[11] * b2 + A[15] * b3;
  }
  return dst;
}

// Multiply many matrices in order: M = A * B * C * ...
export function mulMatMany(...mats) {
  const n = mats.length;
  if (n === 0) return identity();
  if (n === 1) return mats[0];
  let acc = mulMat(mats[0], mats[1]);
  for (let i = 2; i < n; i++) {
    acc = mulMat(acc, mats[i]);
  }
  return acc;
}

export function transpose(m) {
  const out = new Float32Array(16);
  return transposeInto(out, m);
}

export function transposeInto(out, m) {
  out[0]  = m[0];  out[4]  = m[1];  out[8]  = m[2];  out[12] = m[3];
  out[1]  = m[4];  out[5]  = m[5];  out[9]  = m[6];  out[13] = m[7];
  out[2]  = m[8];  out[6]  = m[9];  out[10] = m[10]; out[14] = m[11];
  out[3]  = m[12]; out[7]  = m[13]; out[11] = m[14]; out[15] = m[15];
  return out;
}

export function copyMat(out, m) {
  out.set(m);
  return out;
}

export function determinant(m) {
  const m00 = m[0],  m01 = m[1],  m02 = m[2],  m03 = m[3];
  const m10 = m[4],  m11 = m[5],  m12 = m[6],  m13 = m[7];
  const m20 = m[8],  m21 = m[9],  m22 = m[10], m23 = m[11];
  const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

  const s0 = m00 * m11 - m01 * m10;
  const s1 = m00 * m12 - m02 * m10;
  const s2 = m00 * m13 - m03 * m10;
  const s3 = m01 * m12 - m02 * m11;
  const s4 = m01 * m13 - m03 * m11;
  const s5 = m02 * m13 - m03 * m12;

  const c5 = m22 * m33 - m23 * m32;
  const c4 = m21 * m33 - m23 * m31;
  const c3 = m21 * m32 - m22 * m31;
  const c2 = m20 * m33 - m23 * m30;
  const c1 = m20 * m32 - m22 * m30;
  const c0 = m20 * m31 - m21 * m30;

  return s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0;
}

export function invert(m) {
  const out = new Float32Array(16);
  return invertInto(out, m);
}

export function invertInto(out, m) {
  const m00 = m[0],  m01 = m[1],  m02 = m[2],  m03 = m[3];
  const m10 = m[4],  m11 = m[5],  m12 = m[6],  m13 = m[7];
  const m20 = m[8],  m21 = m[9],  m22 = m[10], m23 = m[11];
  const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

  const s0 = m00 * m11 - m01 * m10;
  const s1 = m00 * m12 - m02 * m10;
  const s2 = m00 * m13 - m03 * m10;
  const s3 = m01 * m12 - m02 * m11;
  const s4 = m01 * m13 - m03 * m11;
  const s5 = m02 * m13 - m03 * m12;

  const c5 = m22 * m33 - m23 * m32;
  const c4 = m21 * m33 - m23 * m31;
  const c3 = m21 * m32 - m22 * m31;
  const c2 = m20 * m33 - m23 * m30;
  const c1 = m20 * m32 - m22 * m30;
  const c0 = m20 * m31 - m21 * m30;

  const det = s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0;
  if (!det) {
    return null;
  }
  const invDet = 1 / det;

  out[0]  = ( m11 * c5 - m12 * c4 + m13 * c3) * invDet;
  out[1]  = (-m01 * c5 + m02 * c4 - m03 * c3) * invDet;
  out[2]  = ( m31 * s5 - m32 * s4 + m33 * s3) * invDet;
  out[3]  = (-m21 * s5 + m22 * s4 - m23 * s3) * invDet;

  out[4]  = (-m10 * c5 + m12 * c2 - m13 * c1) * invDet;
  out[5]  = ( m00 * c5 - m02 * c2 + m03 * c1) * invDet;
  out[6]  = (-m30 * s5 + m32 * s2 - m33 * s1) * invDet;
  out[7]  = ( m20 * s5 - m22 * s2 + m23 * s1) * invDet;

  out[8]  = ( m10 * c4 - m11 * c2 + m13 * c0) * invDet;
  out[9]  = (-m00 * c4 + m01 * c2 - m03 * c0) * invDet;
  out[10] = ( m30 * s4 - m31 * s2 + m33 * s0) * invDet;
  out[11] = (-m20 * s4 + m21 * s2 - m23 * s0) * invDet;

  out[12] = (-m10 * c3 + m11 * c1 - m12 * c0) * invDet;
  out[13] = ( m00 * c3 - m01 * c1 + m02 * c0) * invDet;
  out[14] = (-m30 * s3 + m31 * s1 - m32 * s0) * invDet;
  out[15] = ( m20 * s3 - m21 * s1 + m22 * s0) * invDet;

  return out;
}

// -----------------------------------------------------------------------------
// CPU-side vector transforms
// -----------------------------------------------------------------------------

export function transformPoint(m, v, out) {
  const x = v[0], y = v[1], z = v[2];
  const dst = out || new Float32Array(3);
  dst[0] = m[0] * x + m[4] * y + m[8]  * z + m[12];
  dst[1] = m[1] * x + m[5] * y + m[9]  * z + m[13];
  dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  return dst;
}

export function transformDirection(m, v, out) {
  const x = v[0], y = v[1], z = v[2];
  const dst = out || new Float32Array(3);
  dst[0] = m[0] * x + m[4] * y + m[8]  * z;
  dst[1] = m[1] * x + m[5] * y + m[9]  * z;
  dst[2] = m[2] * x + m[6] * y + m[10] * z;
  return dst;
}

// Project a world-space point with a matrix that includes projection.
// Returns [x_ndc, y_ndc, z_ndc, w_clip].
export function projectPoint(m, v, out) {
  const x = v[0], y = v[1], z = v[2];
  const dst = out || new Float32Array(4);
  const cx = m[0] * x + m[4] * y + m[8]  * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9]  * z + m[13];
  const cz = m[2] * x + m[6] * y + m[10] * z + m[14];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  const invW = cw !== 0 ? 1 / cw : 1;
  dst[0] = cx * invW;
  dst[1] = cy * invW;
  dst[2] = cz * invW;
  dst[3] = cw;
  return dst;
}

// Unproject from clip or NDC space into world space, given inverse matrix.
export function unprojectPoint(invViewProj, v, out) {
  const x = v[0], y = v[1], z = v[2];
  const dst = out || new Float32Array(3);

  const cx = x;
  const cy = y;
  const cz = z;
  const cw = 1;

  const wx = invViewProj[0] * cx + invViewProj[4] * cy + invViewProj[8]  * cz + invViewProj[12] * cw;
  const wy = invViewProj[1] * cx + invViewProj[5] * cy + invViewProj[9]  * cz + invViewProj[13] * cw;
  const wz = invViewProj[2] * cx + invViewProj[6] * cy + invViewProj[10] * cz + invViewProj[14] * cw;
  const ww = invViewProj[3] * cx + invViewProj[7] * cy + invViewProj[11] * cz + invViewProj[15] * cw;

  const invW = ww !== 0 ? 1 / ww : 1;
  dst[0] = wx * invW;
  dst[1] = wy * invW;
  dst[2] = wz * invW;

  return dst;
}

// -----------------------------------------------------------------------------
// Normal matrix (3×3) from model matrix
// -----------------------------------------------------------------------------

const _tmp4x4 = new Float32Array(16);

export function normalFromMat4(out3x3, modelMat4) {
  const inv = invert(modelMat4);
  if (!inv) {
    out3x3[0] = 1; out3x3[3] = 0; out3x3[6] = 0;
    out3x3[1] = 0; out3x3[4] = 1; out3x3[7] = 0;
    out3x3[2] = 0; out3x3[5] = 0; out3x3[8] = 1;
    return out3x3;
  }

  transposeInto(_tmp4x4, inv);

  out3x3[0] = _tmp4x4[0];
  out3x3[1] = _tmp4x4[1];
  out3x3[2] = _tmp4x4[2];

  out3x3[3] = _tmp4x4[4];
  out3x3[4] = _tmp4x4[5];
  out3x3[5] = _tmp4x4[6];

  out3x3[6] = _tmp4x4[8];
  out3x3[7] = _tmp4x4[9];
  out3x3[8] = _tmp4x4[10];

  return out3x3;
}
