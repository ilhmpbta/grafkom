const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  alert("WebGL2 tidak tersedia.");
  throw new Error("WebGL2 tidak tersedia.");
}

// --------------------------------------------------
// Shader source
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 a_position;
in vec3 a_color;

out vec3 v_color;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = 12.0;
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

// --------------------------------------------------
// Helper: shader
// --------------------------------------------------

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

// --------------------------------------------------
// Helper: program
// --------------------------------------------------

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

// --------------------------------------------------
// Helper: buffer
// --------------------------------------------------

function createBuffer(gl, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);

  return buffer;
}

// --------------------------------------------------
// Helper: attribute
// --------------------------------------------------

function setupAttribute(gl, buffer, location, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

// --------------------------------------------------
// Compile + link
// --------------------------------------------------

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

const program = createProgram(
  gl,
  vertexShader,
  fragmentShader
);

// --------------------------------------------------
// Attribute locations
// --------------------------------------------------

const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");

// --------------------------------------------------
// Vertex data
// --------------------------------------------------

const basePositions = new Float32Array([
  // Triangle: 0-2
  -0.75, -0.35,
  -0.15, -0.35,
  -0.45,  0.35,

  // Line: 3-4
   0.05, -0.25,
   0.75,  0.35,

  // Points: 5-7
   0.15,  0.55,
   0.45,  0.65,
   0.75,  0.55,

  // Line Strip: 8-11
  -0.9,  0.9,
  -0.9,  0.8,
  -0.8,  0.8,
  -0.75, 0.8,

  // Line Loop: 12-15
  -0.05, 0.7,
  -0.15, 0.7,
  -0.45, 0.6,
  -0.75, 0.6,
]);

const positions = new Float32Array(basePositions);

const colors = new Float32Array([
  // Triangle
  1.0, 0.2, 0.1,
  0.2, 1.0, 0.3,
  0.2, 0.5, 1.0,

  // Line
  1.0, 0.8, 0.1,
  1.0, 0.3, 0.8,

  // Points
  0.2, 1.0, 1.0,
  1.0, 0.5, 0.1,
  0.8, 0.4, 1.0,

  // Line Strip
  1.0, 0.2, 0.2,
  0.2, 0.5, 1.0,
  0.2, 1.0, 0.3,
  0.2, 0.5, 1.0,

  // Line Loop
  1.0, 0.2, 0.2,
  0.2, 1.0, 0.3,
  0.2, 0.5, 1.0,
  0.2, 0.5, 1.0,
]);

// --------------------------------------------------
// Buffers
// --------------------------------------------------

const positionBuffer = createBuffer(
  gl,
  positions,
  gl.DYNAMIC_DRAW
);

const colorBuffer = createBuffer(
  gl,
  colors,
  gl.STATIC_DRAW
);

// --------------------------------------------------
// Animation state
// --------------------------------------------------

let offsetX = 0.0;
let direction = 1.0;
let isPaused = false;

const speed = 0.45;
const keyboardMoveSpeed = 0.8;

// Menyimpan status tombol untuk state-based input.
const keys = {};

// --------------------------------------------------
// Update
// --------------------------------------------------

function clampOffset() {
  offsetX = Math.max(-0.20, Math.min(0.35, offsetX));
}

function handleInput(deltaTime) {
  if (keys["ArrowLeft"]) {
    offsetX -= keyboardMoveSpeed * deltaTime;
  }

  if (keys["ArrowRight"]) {
    offsetX += keyboardMoveSpeed * deltaTime;
  }

  clampOffset();
}

function updateTriangle(deltaTime) {
  offsetX += direction * speed * deltaTime;

  if (offsetX >= 0.35) {
    offsetX = 0.35;
    direction = -1.0;
  }

  if (offsetX <= -0.20) {
    offsetX = -0.20;
    direction = 1.0;
  }

  for (let i = 0; i < 3; i++) {
    const xIndex = i * 2;

    positions[xIndex] = basePositions[xIndex] + offsetX;
    positions[xIndex + 1] = basePositions[xIndex + 1];
  }
}

function updateLine(deltaTime) {
  offsetX += direction * speed * deltaTime;

  if (offsetX >= 0.35) {
    offsetX = 0.35;
    direction = -1.0;
  }

  if (offsetX <= -0.20) {
    offsetX = -0.20;
    direction = 1.0;
  }

  for (let i = 3; i < 5; i++) {
    const xIndex = i * 2;

    positions[xIndex] = basePositions[xIndex] + offsetX;
    positions[xIndex + 1] = basePositions[xIndex + 1];
  }
}

function uploadPositions() {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
}

// --------------------------------------------------
// Draw
// --------------------------------------------------

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.05, 0.08, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  setupAttribute(gl, positionBuffer, positionLocation, 2);
  setupAttribute(gl, colorBuffer, colorLocation, 3);

  // Triangle
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Line
  gl.drawArrays(gl.LINES, 3, 2);

  // Points
  gl.drawArrays(gl.POINTS, 5, 3);

  // LINE STRIP
  gl.drawArrays(gl.LINE_STRIP, 8, 4);

  // Line Loop
  gl.drawArrays(gl.LINE_LOOP, 12, 4);
}

// --------------------------------------------------
// Keyboard: hybrid event-based + state-based
// --------------------------------------------------

window.addEventListener("keydown", (event) => {
  // State-based
  keys[event.code] = true;

  // Event-based
  if (event.code === "Space") {
    event.preventDefault();

    if (!event.repeat) {
      isPaused = !isPaused;
    }
  }

  if (event.code === "KeyR" && !event.repeat) {
    offsetX = 0.0;
    direction = 1.0;
    isPaused = false;
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// --------------------------------------------------
// Mouse coordinate display
// --------------------------------------------------

function mouseToNDC(event) {
  const rect = canvas.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const x = (mouseX / rect.width) * 2.0 - 1.0;
  const y = 1.0 - (mouseY / rect.height) * 2.0;

  return { x, y };
}

canvas.addEventListener("mousemove", (event) => {
  const p = mouseToNDC(event);

  const info = document.getElementById("info");

  info.textContent = `Mouse NDC: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
});

// --------------------------------------------------
// Rendering loop
// --------------------------------------------------

let previousTime = 0;

function render(currentTime) {
  const timeInSeconds = currentTime * 0.001;

  const deltaTime = Math.min(
    timeInSeconds - previousTime,
    0.05
  );

  previousTime = timeInSeconds;

  // State-based input dibaca setiap frame.
  handleInput(deltaTime);

  if (!isPaused) {
    updateTriangle(deltaTime);
    updateLine(deltaTime);
  }

  uploadPositions();
  drawScene();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);