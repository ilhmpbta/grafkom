import { Node } from "./node.js";
import { makePolygonData } from "../gl/shapes.js";

// Canvas is 1200x800, so 1 NDC unit is wider on X than on Y.
// A parent node with scaleX = 1 / ASPECT makes its children "pixel-square".
export const ASPECT = 1200 / 800;

// createTRSMatrix builds S * R * T, which means the translation gets scaled
// and rotated too. `placed` avoids that: an outer node only translates,
// an inner node only rotates/scales, so the shape sits exactly at (x, y).
export function placed({
  mesh = null, color, x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1
}) {
  const outer = new Node({ transform: { x, y } });
  outer.inner = outer.add(new Node({
    mesh, color, transform: { rotation, scaleX, scaleY }
  }));
  return outer;
}

// A tapered strip from (x0,y0) to (x1,y1), width w0 at the start and w1 at the end.
export function makeBranchData(x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  return makePolygonData([
    [x0 + nx * w0 / 2, y0 + ny * w0 / 2],
    [x0 - nx * w0 / 2, y0 - ny * w0 / 2],
    [x1 - nx * w1 / 2, y1 - ny * w1 / 2],
    [x1 + nx * w1 / 2, y1 + ny * w1 / 2]
  ]);
}