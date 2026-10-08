import { Node } from "./node.js";
import { Mesh } from "../gl/mesh.js";
import { makeQuadData, makeCircleData, makePolygonData, makeLineData } from "../gl/shapes.js";
import { makeDigitData } from "./digits.js";
import { ASPECT, placed } from "./helpers.js";

// The clock is built in "screen-square" units (1 unit = 400 px on both axes).
// The root node squashes X by 1/ASPECT so circles stay circular and a rotated
// hand keeps its shape instead of being sheared by the 3:2 canvas.
const CX     = 0.0;    // clock-face centre, x
const CY     = 0.15;   // clock-face centre, y
const FACE_R = 0.16;   // radius of the yellow face
const NUM_R  = 0.148;  // distance of the numbers from the centre
const DIGIT  = 0.022;  // digit size (digit cell is 1 x 2 units)

export class Clock {
  constructor(gl) {
    this.gl = gl;
    this.root = new Node({});
    this.space = this.root.add(new Node({ transform: { scaleX: 1 / ASPECT } }));
    this._build(gl);
  }

  _build(gl) {
    const root = this.space;

    const quad   = new Mesh(gl, { data: makeQuadData(), components: 2 });
    const circle = new Mesh(gl, { data: makeCircleData(48), components: 2 });
    const line   = new Mesh(gl, { data: makeLineData(), components: 2 });

    const pink        = [0.98, 0.65, 0.75, 1];
    const red         = [0.90, 0.20, 0.20, 1];
    const darkBrown = [0.45, 0.22, 0.10, 1];
    const trunkBrown = [0.72, 0.36, 0.20, 1];
    const clockYellow = [1.00, 0.92, 0.35, 1];
    const black       = [0.05, 0.05, 0.05, 1];

    // --- Tower base (pink rectangle) ---
    root.add(placed({
      mesh: quad, color: pink,
      x: 0, y: -0.17, scaleX: 0.40 * ASPECT, scaleY: 1.1
    }));

    // --- Cornice just under the roof ---
    root.add(placed({
      mesh: quad, color: red,
      x: 0, y: -0.12, scaleX: 0.50 * ASPECT, scaleY: 0.12
    }));

    // --- Top roof (triangle) ---
    const roof = new Mesh(gl, {
      data: makePolygonData([[-0.35, 0.36], [0.35, 0.36], [0, 0.90]]),
      components: 2
    });
    root.add(new Node({ mesh: roof, color: red }));

    // --- Door (rectangle + arch top) ---
    root.add(placed({
      mesh: quad, color: trunkBrown,
      x: 0, y: -0.56, scaleX: 0.21, scaleY: 0.30
    }));
    root.add(placed({
      mesh: circle, color: trunkBrown,
      x: 0, y: -0.41, scaleX: 0.21, scaleY: 0.21
    }));

    // Left Door Window
    root.add(placed({
      mesh: quad, color: darkBrown,
      x: -0.20, y: -0.46, scaleX: 0.06 + 0.01, scaleY: 0.06 + 0.01
    }));
    root.add(placed({
      mesh: quad, color: trunkBrown,
      x: -0.20, y: -0.46, scaleX: 0.06, scaleY: 0.06
    }));
    
    // Right Door Window
    root.add(placed({
      mesh: quad, color: darkBrown,
      x:  0.20, y: -0.46, scaleX: 0.06 + 0.01, scaleY: 0.06 + 0.01
    }));
    root.add(placed({
      mesh: quad, color: trunkBrown,
      x:  0.20, y: -0.46, scaleX: 0.06, scaleY: 0.06
    }));

    // Line In Door
    root.add(placed({
      mesh: line, color: darkBrown,
      x: -0.105, y: -0.40,          // left end of the line
      scaleX: 0.21, scaleY: 0.015   // length, thickness
    }));

    const doorVLinePivot = root.add(new Node({
      transform: { x: -0.71, y: 0, rotation: 90 }
    }));
    doorVLinePivot.add(new Node({
      mesh: line, color: darkBrown,
      transform: { scaleX: 0.30, scaleY: 0.015 }   // length, thickness
    }));

    // --- Clock face: red ring + yellow disk, both on (CX, CY) ---
    root.add(placed({ mesh: circle, color: red,
                      x: CX, y: CY, scaleX: (FACE_R + 0.01) * 2.3, scaleY: (FACE_R + 0.01) * 2.3 }));
    root.add(placed({ mesh: circle, color: clockYellow,
                      x: CX, y: CY, scaleX: FACE_R * 2.3, scaleY: FACE_R * 2.3 }));

    // --- Numbers 1..12 ---
    const digitMeshes = [];
    for (let d = 0; d <= 9; d++) {
      digitMeshes[d] = new Mesh(gl, { data: makeDigitData(d), components: 2 });
    }

    for (let n = 1; n <= 12; n++) {
      const rad = (n / 12) * Math.PI * 2;   // clockwise from 12 o'clock
      const cx = Math.sin(rad) * NUM_R;
      const cy = Math.cos(rad) * NUM_R;
      const label = String(n);

      for (let i = 0; i < label.length; i++) {
        root.add(placed({
          mesh: digitMeshes[Number(label[i])],
          color: black,
          // centre the whole label around (cx, cy)
          x: CX + cx + (i - (label.length - 1) / 2) * DIGIT,
          y: CY + cy,
          scaleX: DIGIT,
          scaleY: DIGIT
        }));
      }
    }

    // --- Hands ---
    // pivot = position + rotation (sits exactly on the clock centre)
    // hand  = scale only, so the hand is scaled in its own frame *before*
    //         it is rotated and therefore never shears.
    const hands = root.add(new Node({ transform: { x: CX, y: CY } }));

    this.hourPivot = hands.add(new Node({}));
    this.hourPivot.add(new Node({
      mesh: line, color: black,
      transform: { scaleX: 0.095, scaleY: 0.024 }
    }));

    this.minutePivot = hands.add(new Node({}));
    this.minutePivot.add(new Node({
      mesh: line, color: black,
      transform: { scaleX: 0.140, scaleY: 0.014 }
    }));

    // --- Centre cap ---
    root.add(placed({
      mesh: circle, color: black,
      x: CX, y: CY, scaleX: 0.024, scaleY: 0.024
    }));
  }

  // totalHours is continuous (12 = noon).
  setTime(totalHours) {
    // wrap into [0, 12) so negative / >24 h values still behave
    const t = ((totalHours % 12) + 12) % 12;

    const hourDeg = (t / 12) * 360;   // one turn per 12 h
    const minuteDeg = (t % 1) * 360;    // one turn per hour

    // The line mesh points along +X, so 90 deg = 12 o'clock and
    // clockwise = decreasing angle.
    this.hourPivot.transform.rotation   = 90 - hourDeg;
    this.minutePivot.transform.rotation = 90 - minuteDeg;
  }
}