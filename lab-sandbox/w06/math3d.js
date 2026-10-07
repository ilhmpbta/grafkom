export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export const Mat4 = {
  identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },

  multiply(a, b) {
    const result = new Float32Array(16);

    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        result[column * 4 + row] =
          a[0 * 4 + row] * b[column * 4 + 0] +
          a[1 * 4 + row] * b[column * 4 + 1] +
          a[2 * 4 + row] * b[column * 4 + 2] +
          a[3 * 4 + row] * b[column * 4 + 3];
      }
    }

    return result;
  },

  translation(x, y, z) {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  },

  scaling(x, y, z) {
    return new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]);
  },

  rotationX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ]);
  },

  rotationY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ]);
  },

  rotationZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },

  perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * 2 * rangeInv, 0
    ]);
  },

  lookAt(eye, target, up) {
    let zx = eye[0] - target[0];
    let zy = eye[1] - target[1];
    let zz = eye[2] - target[2];

    let length = Math.hypot(zx, zy, zz);

    zx /= length;
    zy /= length;
    zz /= length;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;

    length = Math.hypot(xx, xy, xz);

    xx /= length;
    xy /= length;
    xz /= length;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }
};

export function normalMatrixFromMat4(m) {
  const a00 = m[0];
  const a01 = m[1];
  const a02 = m[2];

  const a10 = m[4];
  const a11 = m[5];
  const a12 = m[6];

  const a20 = m[8];
  const a21 = m[9];
  const a22 = m[10];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;

  if (Math.abs(det) < 0.000001) {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  det = 1 / det;

  const inv00 = b01 * det;
  const inv01 = (-a22 * a01 + a02 * a21) * det;
  const inv02 = (a12 * a01 - a02 * a11) * det;

  const inv10 = b11 * det;
  const inv11 = (a22 * a00 - a02 * a20) * det;
  const inv12 = (-a12 * a00 + a02 * a10) * det;

  const inv20 = b21 * det;
  const inv21 = (-a21 * a00 + a01 * a20) * det;
  const inv22 = (a11 * a00 - a01 * a10) * det;

  return new Float32Array([
    inv00, inv10, inv20,
    inv01, inv11, inv21,
    inv02, inv12, inv22
  ]);
}
