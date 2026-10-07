import { Mat4 } from "./math3d.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

// Shader
const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec3 a_color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_color;

void main() {
  gl_Position =
    u_projection *
    u_view *
    u_model *
    vec4(a_position, 1.0);

  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;

// Shader Helpers

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);

    throw new Error("Shader compile error:\n" + info);
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);

    throw new Error("Program link error:\n" + info);
  }

  return program;
}

const vertexShader = createShader(
  gl,
  gl.VERTEX_SHADER,
  vertexShaderSource
);

const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

const program = createProgram(gl, vertexShader, fragmentShader);

// Cube Geometry
const cubePositions = new Float32Array([
  // Front
  -0.5, -0.5, 0.5,
   0.5, -0.5, 0.5,
   0.5,  0.5, 0.5,

  -0.5, -0.5, 0.5,
   0.5,  0.5, 0.5,
  -0.5,  0.5, 0.5,

  // Back
   0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,

   0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,

  // Left
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,

  -0.5, -0.5, -0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,

  // Right
   0.5, -0.5,  0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,

   0.5, -0.5,  0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,

  // Top
  -0.5, 0.5,  0.5,
   0.5, 0.5,  0.5,
   0.5, 0.5, -0.5,

  -0.5, 0.5,  0.5,
   0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5,

  // Bottom
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,

  -0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5
]);

const cubeColors = new Float32Array([
  // Front - cyan
  0.0, 0.8, 1.0,
  0.0, 0.8, 1.0,
  0.0, 0.8, 1.0,
  0.0, 0.8, 1.0,
  0.0, 0.8, 1.0,
  0.0, 0.8, 1.0,

  // Back - blue
  0.2, 0.3, 1.0,
  0.2, 0.3, 1.0,
  0.2, 0.3, 1.0,
  0.2, 0.3, 1.0,
  0.2, 0.3, 1.0,
  0.2, 0.3, 1.0,

  // Left - orange
  1.0, 0.5, 0.1,
  1.0, 0.5, 0.1,
  1.0, 0.5, 0.1,
  1.0, 0.5, 0.1,
  1.0, 0.5, 0.1,
  1.0, 0.5, 0.1,

  // Right - green
  0.2, 1.0, 0.4,
  0.2, 1.0, 0.4,
  0.2, 1.0, 0.4,
  0.2, 1.0, 0.4,
  0.2, 1.0, 0.4,
  0.2, 1.0, 0.4,

  // Top - magenta
  1.0, 0.2, 0.8,
  1.0, 0.2, 0.8,
  1.0, 0.2, 0.8,
  1.0, 0.2, 0.8,
  1.0, 0.2, 0.8,
  1.0, 0.2, 0.8,

  // Bottom - yellow
  1.0, 0.9, 0.1,
  1.0, 0.9, 0.1,
  1.0, 0.9, 0.1,
  1.0, 0.9, 0.1,
  1.0, 0.9, 0.1,
  1.0, 0.9, 0.1
]);

// Buffers

const positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  cubePositions,
  gl.STATIC_DRAW
);

const colorBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  cubeColors,
  gl.STATIC_DRAW
);

// Attributes

const positionLocation = gl.getAttribLocation(
  program,
  "a_position"
);

const colorLocation = gl.getAttribLocation(
  program,
  "a_color"
);

// Position
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
  positionLocation,
  3,
  gl.FLOAT,
  false,
  0,
  0
);

// Color
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

gl.enableVertexAttribArray(colorLocation);

gl.vertexAttribPointer(
  colorLocation,
  3,
  gl.FLOAT,
  false,
  0,
  0
);

// Uniforms

const modelLocation = gl.getUniformLocation(
  program,
  "u_model"
);

const viewLocation = gl.getUniformLocation(
  program,
  "u_view"
);

const projectionLocation = gl.getUniformLocation(
  program,
  "u_projection"
);

// Utility

function degToRad(degree) {
  return degree * Math.PI / 180;
}

// Cube State

const cube = {
  rotationX: 20,
  rotationY: 30
};

function createModelMatrix() {
  const rx = Mat4.rotationX(
    degToRad(cube.rotationX)
  );

  const ry = Mat4.rotationY(
    degToRad(cube.rotationY)
  );

  let model = Mat4.identity();

  model = Mat4.multiply(model, rx);
  model = Mat4.multiply(model, ry);

  return model;
}

// Camera

const camera = {
  position: [0.0, 1.5, 4.0],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0]
};

const camera_preset1 = {
  position: [0.0, 0.0, 4.0],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0]
};

const camera_preset2 = {
  position: [0.0, 0.0, 4.0],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0]
};
const camera_preset3 = {
  position: [0.0, 0.0, 4.0],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0]
};

// Projection
const projectionState = {
  mode: "perspective",
  fov: 60,
  near: 0.1,
  far: 100.0
};

const clipPresets = [
  {
    near: 0.1,
    far: 100
  },
  {
    near: 1.0,
    far: 20
  },
  {
    near: 2.5,
    far: 8
  }
];

let clipPresetIndex = 0;

function createProjectionMatrix() {
  const aspect = canvas.width / canvas.height;

  if (projectionState.mode === "perspective") {
    return Mat4.perspective(
      degToRad(projectionState.fov),
      aspect,
      projectionState.near,
      projectionState.far
    );
  }

  const size = 2.0;

  return Mat4.orthographic(
    -size * aspect,
    size * aspect,
    -size,
    size,
    projectionState.near,
    projectionState.far
  );
}

// Input

const keys = {};

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === "p" && !event.repeat) {
    projectionState.mode =
      projectionState.mode === "perspective"
        ? "orthographic"
        : "perspective";
  }

  if (event.key.toLowerCase() === "n" && !event.repeat) {
    nextClipPreset();
  }

  if (event.key.toLowerCase() === "d" && !event.repeat) {
    depthEnabled = !depthEnabled;
  }

  if (event.key.toLowerCase() === "r" && !event.repeat) {
    resetScene();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

// Camera Control

const cameraSpeed = 2.0;

function updateCamera(dt) {
  if (keys["arrowleft"]) {
    camera.position[0] -= cameraSpeed * dt;
  }

  if (keys["arrowright"]) {
    camera.position[0] += cameraSpeed * dt;
  }

  if (keys["arrowup"]) {
    camera.position[1] += cameraSpeed * dt;
  }

  if (keys["arrowdown"]) {
    camera.position[1] -= cameraSpeed * dt;
  }

  if (keys["w"]) {
    camera.position[2] -= cameraSpeed * dt;
  }

  if (keys["s"]) {
    camera.position[2] += cameraSpeed * dt;
  }
}

// FOV

const fovSpeed = 35.0;

function updateFOV(dt) {
  if (keys["["]) {
    projectionState.fov -= fovSpeed * dt;
  }

  if (keys["]"]) {
    projectionState.fov += fovSpeed * dt;
  }

  projectionState.fov = Math.max(
    30,
    Math.min(100, projectionState.fov)
  );
}

// Near / Far Preset

function nextClipPreset() {
  clipPresetIndex =
    (clipPresetIndex + 1) % clipPresets.length;

  const preset = clipPresets[clipPresetIndex];

  projectionState.near = preset.near;
  projectionState.far = preset.far;
}

// Depth Test

let depthEnabled = true;

// Reset

function resetScene() {
  camera.position[0] = 0.0;
  camera.position[1] = 1.5;
  camera.position[2] = 4.0;

  camera.target[0] = 0.0;
  camera.target[1] = 0.0;
  camera.target[2] = 0.0;

  projectionState.mode = "perspective";
  projectionState.fov = 60;
  projectionState.near = 0.1;
  projectionState.far = 100.0;

  clipPresetIndex = 0;
  depthEnabled = true;
}

// Animation

function updateCube(dt) {
  cube.rotationX += 25 * dt;
  cube.rotationY += 40 * dt;
}

// HUD

const projectionInfo = document.getElementById(
  "projectionInfo"
);

const cameraInfo = document.getElementById(
  "cameraInfo"
);

const fovInfo = document.getElementById(
  "fovInfo"
);

const clipInfo = document.getElementById(
  "clipInfo"
);

const depthInfo = document.getElementById(
  "depthInfo"
);

function updateHUD() {
  projectionInfo.textContent = projectionState.mode;

  cameraInfo.textContent =
    `(${camera.position[0].toFixed(2)}, ` +
    `${camera.position[1].toFixed(2)}, ` +
    `${camera.position[2].toFixed(2)})`;

  fovInfo.textContent =
    `${projectionState.fov.toFixed(1)}°`;

  clipInfo.textContent =
    `${projectionState.near} / ${projectionState.far}`;

  depthInfo.textContent = depthEnabled ? "ON" : "OFF";
}

// Draw

function drawCube(model, view, projection) {
  gl.uniformMatrix4fv(
    modelLocation,
    false,
    model
  );

  gl.uniformMatrix4fv(
    viewLocation,
    false,
    view
  );

  gl.uniformMatrix4fv(
    projectionLocation,
    false,
    projection
  );

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    36
  );
}

// WebGL Setup

gl.viewport(
  0,
  0,
  canvas.width,
  canvas.height
);

gl.enable(gl.DEPTH_TEST);

// Render Loop

let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;

  lastTime = time;

  dt = Math.min(dt, 0.05);

  updateCube(dt);
  updateCamera(dt);
  updateFOV(dt);

  if (depthEnabled) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
  );

  gl.clearColor(
    0.03,
    0.05,
    0.10,
    1.0
  );

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  gl.useProgram(program);

  const model = createModelMatrix();

  const view = Mat4.lookAt(
    camera.position,
    camera.target,
    camera.up
  );

  const projection = createProjectionMatrix();

  drawCube(
    model,
    view,
    projection
  );

  updateHUD();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
