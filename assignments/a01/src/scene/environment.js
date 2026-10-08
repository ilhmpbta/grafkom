import { Node } from "./node.js";
import { Mesh } from "../gl/mesh.js";
import { makeCircleData, makePolygonData, makeLineData } from "../gl/shapes.js";
import { ASPECT, placed, makeBranchData } from "./helpers.js";

const darker = (c, k) => [c[0] * k, c[1] * k, c[2] * k, 1];

// Leaf puffs in tree-local units: [x, y, diameter]. Tree base is (0,0), ~1.36 tall.
const CANOPY = [
  [ 0.00, 0.92, 0.50],
  [-0.30, 0.78, 0.42], [ 0.30, 0.78, 0.42],
  [-0.22, 0.68, 0.34], [ 0.22, 0.68, 0.34],
  [-0.40, 1.04, 0.38], [ 0.40, 1.04, 0.38],
  [-0.20, 1.22, 0.42], [ 0.20, 1.22, 0.42],
  [ 0.00, 1.28, 0.40]
];

// Cloud puffs in cloud-local units: [x, y, diameter].
const PUFFS = [
  [-0.38, 0.00, 0.32], [-0.22, 0.13, 0.36], [-0.02, 0.19, 0.42],
  [ 0.20, 0.14, 0.38], [ 0.38, 0.02, 0.32],
  [-0.12, -0.03, 0.40], [ 0.14, -0.03, 0.40]
];

const TREES = [
  { x: -0.80, y: -0.50, s: 0.50, leaf: [0.9, 0.9, 0.45, 1] },
  { x: -0.48, y: -0.45, s: 0.42, leaf: [0.35, 0.75, 0.65, 1] },
  { x:  0.48, y: -0.45, s: 0.42, leaf: [0.35, 0.75, 0.65, 1] },
  { x:  0.80, y: -0.50, s: 0.50, leaf: [0.9, 0.9, 0.45, 1] }
];

const CLOUDS = [
  { x: -0.72, y: 0.62, s: 0.36, speed: 0.06 },
  { x: -0.47, y: 0.50, s: 0.28, speed: 0.10 },
  { x:  0.50, y: 0.66, s: 0.36, speed: 0.05 },
  { x:  0.83, y: 0.56, s: 0.36, speed: 0.13 }
];

export class Environment {
  constructor(gl) {
    this.gl = gl;
    this.root = new Node({});
    this.clouds = [];

    this._buildTrees(gl);
    this._buildGround(gl);
    this._buildRoad(gl);
    this._buildClouds(gl);
    this._buildBirds(gl);
  }

  _buildGround(gl) {
    // Three triangles that tile the whole area under the "V" exactly,
    // so nothing behind them (the sky) can show through.
    const green = [0.35, 0.78, 0.35, 1];
    const tris = [
      [[-1.0, -0.55], [0.0, -0.45], [-1.0, -1.0]],   // left hill
      [[ 1.0, -0.55], [0.0, -0.45], [ 1.0, -1.0]],   // right hill
      [[-1.0, -1.00], [1.0, -1.00], [ 0.0, -0.45]]   // middle, down to the bottom edge
    ];
    for (const t of tris) {
      this.root.add(new Node({
        mesh: new Mesh(gl, { data: makePolygonData(t), components: 2 }),
        color: green
      }));
    }
  }

  _buildRoad(gl) {
    const roadOutline = new Mesh(gl, {
      data: makePolygonData([
        [-0.51, -1.00], [ 0.51, -1.00],
        [ 0.08, -0.56], [-0.08, -0.56]
      ]),
      components: 2
    });

    const road = new Mesh(gl, {
      data: makePolygonData([
        [-0.50, -1.00], [ 0.50, -1.00],
        [ 0.07, -0.55], [-0.07, -0.55]
      ]),
      components: 2
    });
    
    this.root.add(new Node({ mesh: roadOutline, color: [0, 0, 0, 1] }));
    this.root.add(new Node({ mesh: road, color: [0.85, 0.60, 0.40, 1] }));
  }

  _buildTrees(gl) {
    const circle = new Mesh(gl, { data: makeCircleData(32), components: 2 });
    // Y-shaped trunk: one stem that forks into two tapered branches.
    const stem   = new Mesh(gl, { data: makeBranchData(0, -0.30,  0.00, 0.80, 0.32, 0.26), components: 2 });
    const left   = new Mesh(gl, { data: makeBranchData(0, 0.44, -0.12, 0.90, 0.23, 0.12), components: 2 });
    const right  = new Mesh(gl, { data: makeBranchData(0, 0.44,  0.12, 0.90, 0.25, 0.12), components: 2 });
    const trunkColor = [0.72, 0.36, 0.20, 1];

    for (const t of TREES) {
      const anchor = new Node({ transform: { x: t.x, y: t.y } });
      // scaleX = s / ASPECT keeps the puffs round on the 3:2 canvas
      const tree = anchor.add(new Node({ transform: { scaleX: t.s / ASPECT, scaleY: t.s } }));

      // Outline pass (all slightly bigger, darker), then fill pass on top.
      const outline = darker(t.leaf, 0.60);
      for (const [x, y, d] of CANOPY) {
        tree.add(placed({ mesh: circle, color: outline, x, y, scaleX: d + 0.07, scaleY: d + 0.07 }));
      }
      for (const [x, y, d] of CANOPY) {
        tree.add(placed({ mesh: circle, color: t.leaf, x, y, scaleX: d, scaleY: d }));
      }

      // Trunk and branches drawn over the leaves, so the Y stays visible.
      for (const m of [stem, left, right]) {
        tree.add(new Node({ mesh: m, color: trunkColor }));
      }
      this.root.add(anchor);
    }
  }

  _buildClouds(gl) {
    const circle = new Mesh(gl, { data: makeCircleData(32), components: 2 });
    const fill = [0.62, 0.86, 0.98, 1];
    const edge = [0.35, 0.60, 0.90, 1];

    for (const c of CLOUDS) {
      const anchor = new Node({ transform: { x: c.x, y: c.y } });   // this is what drifts
      const cloud = anchor.add(new Node({ transform: { scaleX: c.s / ASPECT, scaleY: c.s } }));
      for (const [x, y, d] of PUFFS) {
        cloud.add(placed({ mesh: circle, color: edge, x, y, scaleX: d + 0.06, scaleY: d + 0.06 }));
      }
      for (const [x, y, d] of PUFFS) {
        cloud.add(placed({ mesh: circle, color: fill, x, y, scaleX: d, scaleY: d }));
      }
      this.root.add(anchor);
      this.clouds.push({ node: anchor, speed: c.speed });
    }
  }

  _buildBirds(gl) {
    const wing = new Mesh(gl, { data: makeLineData(), components: 2 });
    const birdColor = [0.15, 0.15, 0.15, 1];
    const birds = [
      [-0.50, 0.88], [-0.40, 0.92], [-0.30, 0.96],
      [-0.35, 0.80], [-0.25, 0.84], [-0.15, 0.88],
      [-0.30, 0.72], [-0.20, 0.76]
      
    ];
    for (const [bx, by] of birds) {
      const g = new Node({ transform: { x: bx, y: by } });
      g.add(new Node({
        mesh: wing, color: birdColor,
        transform: { rotation:  95, scaleX: 0.05, scaleY: 0.025 }
      }));
      g.add(new Node({
        mesh: wing, color: birdColor,
        transform: { rotation: 205, scaleX: 0.05, scaleY: 0.025 }
      }));
      this.root.add(g);
    }
  }

  update(dt) {
    for (const c of this.clouds) {
      c.node.transform.x += c.speed * dt;
      if (c.node.transform.x > 1.4) c.node.transform.x = -1.4;
    }
  }
}