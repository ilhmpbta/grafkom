export function makeQuadData() {
  return new Float32Array([
    -0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5, -0.5,  0.5,  0.5
  ]);
}

// Circle as a triangle fan, radius 0.5, centred at (0,0).
export function makeCircleData(segments = 64) {
  const d = [];
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    d.push(0, 0);
    d.push(Math.cos(a0) * 0.5, Math.sin(a0) * 0.5);
    d.push(Math.cos(a1) * 0.5, Math.sin(a1) * 0.5);
  }
  return new Float32Array(d);
}

// Pie slice from startAngle to endAngle, radius in local units.
export function makePieSliceData(startAngle, endAngle, radius = 1, segments = 32) {
  const d = [];
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = startAngle + (endAngle - startAngle) * t0;
    const a1 = startAngle + (endAngle - startAngle) * t1;
    d.push(0, 0);
    d.push(Math.cos(a0) * radius, Math.sin(a0) * radius);
    d.push(Math.cos(a1) * radius, Math.sin(a1) * radius);
  }
  return new Float32Array(d);
}

// Line from (0,0) to (1,0), thickness 1 in Y. Pivot at left-center.
export function makeLineData() {
  return new Float32Array([
    0, -0.5,  1, -0.5,  0,  0.5,
    0,  0.5,  1, -0.5,  1,  0.5
  ]);
}

// Convex polygon as a triangle fan. points = [[x,y], ...]
export function makePolygonData(points) {
  const d = [];
  for (let i = 1; i < points.length - 1; i++) {
    d.push(points[0][0], points[0][1]);
    d.push(points[i][0], points[i][1]);
    d.push(points[i + 1][0], points[i + 1][1]);
  }
  return new Float32Array(d);
}