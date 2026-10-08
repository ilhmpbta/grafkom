import { Node } from "./node.js";
import { Mesh } from "../gl/mesh.js";
import { Pipeline } from "../gl/pipeline.js";
import { makePieSliceData, makeCircleData, makeLineData } from "../gl/shapes.js";
import { ASPECT, placed } from "./helpers.js";

const SKY_RADIUS   = 4;      // larger than the screen diagonal
const PIVOT_Y      = -0.40;  // where the sky disk rotates around (was 0.0)
const ORBIT_RADIUS = 1.45;   // sun/moon distance from the pivot

// ---- Sky shader: the disk is ONE mesh, colors are blended per pixel ----
const SKY_VS = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;
out vec2 v_local;
void main() {
  v_local = a_position;                       // position on the (unrotated) disk
  vec3 p = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}
`;

const SKY_FS = `#version 300 es
precision highp float;
in vec2 v_local;
out vec4 outColor;

// One color per quarter of the disk, going counter-clockwise from local angle 0.
const vec3 PALETTE[4] = vec3[4](
  vec3(1.00, 0.65, 0.45),   // dawn   (angle 0)
  vec3(0.45, 0.75, 1.00),   // day    (angle 90 deg, where the sun sits)
  vec3(0.85, 0.45, 0.55),   // dusk   (angle 180 deg)
  vec3(0.08, 0.10, 0.28)    // night  (angle 270 deg, where the moon sits)
);

void main() {
  float angle = mod(atan(v_local.y, v_local.x), 6.28318530718);
  float t = angle / 1.57079632679;            // 0..4, one unit per color
  int i = int(floor(t)) % 4;
  int j = (i + 1) % 4;
  // Keep each color pure near its center and blend in the middle of the gap.
  // Widen (0.15, 0.85) toward (0.0, 1.0) for an even softer blend.
  float f = smoothstep(0.15, 0.85, fract(t));
  outColor = vec4(mix(PALETTE[i], PALETTE[j], f), 1.0);
}
`;

export class Sky {
  constructor(gl) {
    this.gl = gl;
    this.pipeline = new Pipeline(gl, SKY_VS, SKY_FS);

    // group   : moves the pivot down to PIVOT_Y (translation only)
    //  space  : squares up the aspect ratio so the sun/moon travel in a true circle
    //   rotor : the node that actually rotates with time
    this.group = new Node({ transform: { y: PIVOT_Y } });
    const space = this.group.add(new Node({ transform: { scaleX: 1 / ASPECT } }));
    this.rotor = space.add(new Node({}));

    const disk = new Mesh(gl, {
      data: makePieSliceData(0, Math.PI * 2, SKY_RADIUS, 96),
      components: 2
    });
    this.rotor.add(new Node({ mesh: disk, pipeline: this.pipeline }));

    // Sun at local angle 90 deg (top of the disk), moon opposite.
    this.rotor.add(this._buildSun(gl));
    this.rotor.add(this._buildMoon(gl));
  }

  _buildSun(gl) {
    const sun = new Node({ transform: { y: ORBIT_RADIUS } });
    const body = new Mesh(gl, { data: makeCircleData(40), components: 2 });
    const ray  = new Mesh(gl, { data: makeLineData(), components: 2 });
    const gold = [1.0, 0.85, 0.25, 1];

    for (let i = 0; i < 8; i++) {
      const deg = i * 45;
      const rad = (deg * Math.PI) / 180;
      sun.add(placed({
        mesh: ray, color: gold,
        x: Math.cos(rad) * 0.20, y: Math.sin(rad) * 0.20,
        rotation: deg, scaleX: 0.14, scaleY: 0.035
      }));
    }
    sun.add(placed({ mesh: body, color: gold, scaleX: 0.36, scaleY: 0.36 }));
    return sun;
  }

  _buildMoon(gl) {
    const moon = new Node({ transform: { y: -ORBIT_RADIUS } });
    const body = new Mesh(gl, { data: makeCircleData(40), components: 2 });
    moon.add(placed({ mesh: body, color: [0.95, 0.95, 0.85, 1], scaleX: 0.30, scaleY: 0.30 }));
    return moon;
  }

  setTime(totalHours) {
    // Sky rotates once per 24 h. At noon (t=12) rotation = 0.
    this.rotor.transform.rotation = ((12 - totalHours) / 24) * 360;
  }
}