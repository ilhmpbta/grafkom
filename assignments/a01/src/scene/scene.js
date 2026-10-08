import { Node } from "./node.js";
import { Sky } from "./sky.js";
import { Environment } from "./environment.js";
import { Clock } from "./clock.js";

export class Scene {
  constructor(gl) {
    this.gl = gl;
    this.root = new Node({});

    this.sky = new Sky(gl);
    this.environment = new Environment(gl);
    this.clock = new Clock(gl);

    // Draw order is child order:
    this.root.add(this.sky.group);        // 1. sky + sun + moon
    this.root.add(this.environment.root); // 2. hills/road/trees/clouds/birds
    this.root.add(this.clock.root);       // 3. clock tower
  }

  setTime(totalHours) {
    this.sky.setTime(totalHours);
    this.clock.setTime(totalHours);
  }

  update(dt, seconds) {
    this.environment.update(dt);
  }

  draw(pipeline, seconds) {
    // Clear once with a neutral color (sky covers everything anyway).
    pipeline.clear(0.0, 0.0, 0.0, 1.0);
    this.root.draw(pipeline, null, seconds);
  }
}