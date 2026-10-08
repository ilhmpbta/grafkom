import { Pipeline } from "./gl/pipeline.js";
import { Scene } from "./scene/scene.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 unavailable.");

gl.viewport(0, 0, canvas.width, canvas.height);

const vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;
void main() {
  vec3 p = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() { outColor = u_color; }
`;

const pipeline = new Pipeline(gl, vertexShaderSource, fragmentShaderSource);
const scene = new Scene(gl);

// ---- Time state ----
let totalHours = 12.0;       // noon
const HOURS_PER_SECOND = 6.0; // how fast arrows advance time

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

function update(dt, seconds) {
  if (keys.ArrowUp    || keys.ArrowRight) totalHours += HOURS_PER_SECOND * dt;
  if (keys.ArrowDown  || keys.ArrowLeft)  totalHours -= HOURS_PER_SECOND * dt;
  scene.setTime(totalHours);
  scene.update(dt);
}

let lastTime = 0;
function render(time) {
  const seconds = time * 0.001;
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  update(dt);
  scene.draw(pipeline, seconds);

  requestAnimationFrame(render);
}

scene.setTime(totalHours);
requestAnimationFrame(render);