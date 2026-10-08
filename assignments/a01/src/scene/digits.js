// Digit cell is [-0.5, 0.5] × [-1, 1]  (width 1, height 2)
const SEGMENTS = {
  A: [-0.40,  0.90,  0.40,  1.00],
  B: [ 0.40,  0.10,  0.50,  0.90],
  C: [ 0.40, -0.90,  0.50, -0.10],
  D: [-0.40, -1.00,  0.40, -0.90],
  E: [-0.50, -0.90, -0.40, -0.10],
  F: [-0.50,  0.10, -0.40,  0.90],
  G: [-0.40, -0.05, 0.40, 0.05]
};

const DIGIT_SEGMENTS = {
  0: "ABCDEF",
  1: "BC",
  2: "ABGED",
  3: "ABGCD",
  4: "FGBC",
  5: "AFGCD",
  6: "AFGECD",
  7: "ABC",
  8: "ABCDEFG",
  9: "ABCDFG"
};

export function makeDigitData(digit) {
  const segs = DIGIT_SEGMENTS[digit] || "";
  const verts = [];
  for (const s of segs) {
    const [x0, y0, x1, y1] = SEGMENTS[s];
    verts.push(
      x0, y0,  x1, y0,  x0, y1,
      x0, y1,  x1, y0,  x1, y1
    );
  }
  return new Float32Array(verts);
}