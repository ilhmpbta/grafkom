import { Mat3, createTRSMatrix } from "../math/mat3.js";

export class Node {
  constructor({
    mesh = null,
    color = [1, 1, 1, 1],
    transform = {},
    children = [],
    pipeline = null          // optional: draw this node's mesh with its own shader
  } = {}) {
    this.mesh = mesh;
    this.pipeline = pipeline;
    this.color = color instanceof Float32Array ? color : new Float32Array(color);
    this.transform = {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
      ...transform
    };
    this.children = children;
    for (const c of children) c.parent = this;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  update(dt, seconds) { /* override */ }

  getLocalMatrix(seconds) {
    return createTRSMatrix(this.transform);
  }

  draw(pipeline, parentMatrix, seconds) {
    const local = this.getLocalMatrix(seconds);
    const world = parentMatrix ? Mat3.multiply(parentMatrix, local) : local;

    if (this.mesh) (this.pipeline || pipeline).drawMesh(this.mesh, world, this.color);
    for (const child of this.children) child.draw(pipeline, world, seconds);
  }
}