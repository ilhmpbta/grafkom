import { Mat4, degToRad, normalMatrixFromMat4 } from "./math3d.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

gl.enable(gl.DEPTH_TEST);

const vertexShaderSource = `#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform float u_uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  vec4 worldPosition = u_model * vec4(a_position, 1.0);

  v_worldPosition = worldPosition.xyz;
  v_normal = u_normalMatrix * a_normal;
  v_texCoord = a_texCoord * u_uvScale;

  gl_Position = u_projection * u_view * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

uniform float u_ambientStrength;
uniform float u_shininess;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightPosition - v_worldPosition);
  vec3 V = normalize(u_cameraPosition - v_worldPosition);

  float diff = max(dot(N, L), 0.0);

  vec3 R = reflect(-L, N);

  float spec = 0.0;

  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), u_shininess);
  }

  vec3 texColor = texture(u_texture, v_texCoord).rgb;

  vec3 ambient = u_ambientStrength * texColor;
  vec3 diffuse = diff * u_lightColor * texColor;
  vec3 specular = spec * u_lightColor;

  vec3 finalColor = ambient + diffuse + specular;

  outColor = vec4(finalColor, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error:\n${info}`);
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error:\n${info}`);
  }

  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

/* ------------------------------------------------------------------ */
/* Sphere geometry                                                     */
/* ------------------------------------------------------------------ */

/**
 * Build a UV sphere.
 *
 * Returns non-indexed arrays (each triangle owns its own 3 vertices) so
 * that flat and smooth normals can share the same position/UV layout and
 * we can keep using gl.drawArrays.
 */
function createSphereGeometry(radius, latBands, lonBands) {
  // --- First build an indexed sphere (fewer duplicated vertices) ---
  const indexedPositions = [];
  const indexedSmoothNormals = [];
  const indexedTexCoords = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonBands; lon++) {
      const phi = (lon * 2 * Math.PI) / lonBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      // Unit-sphere direction = smooth normal
      const nx = cosPhi * sinTheta;
      const ny = cosTheta;
      const nz = sinPhi * sinTheta;

      indexedPositions.push(radius * nx, radius * ny, radius * nz);
      indexedSmoothNormals.push(nx, ny, nz);

      // u wraps around, v goes from 1 (north pole) to 0 (south pole)
      indexedTexCoords.push(lon / lonBands, 1 - lat / latBands);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const a = lat * (lonBands + 1) + lon;
      const b = a + lonBands + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  // --- Expand to non-indexed, computing per-face flat normals ---
  const triCount = indices.length / 3;

  const positions = new Float32Array(indices.length * 3);
  const smoothNormals = new Float32Array(indices.length * 3);
  const flatNormals = new Float32Array(indices.length * 3);
  const texCoords = new Float32Array(indices.length * 2);

  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3];
    const i1 = indices[t * 3 + 1];
    const i2 = indices[t * 3 + 2];
    const tri = [i0, i1, i2];

    const p0x = indexedPositions[i0 * 3];
    const p0y = indexedPositions[i0 * 3 + 1];
    const p0z = indexedPositions[i0 * 3 + 2];

    const p1x = indexedPositions[i1 * 3];
    const p1y = indexedPositions[i1 * 3 + 1];
    const p1z = indexedPositions[i1 * 3 + 2];

    const p2x = indexedPositions[i2 * 3];
    const p2y = indexedPositions[i2 * 3 + 1];
    const p2z = indexedPositions[i2 * 3 + 2];

    // Face normal via cross product
    const ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
    const vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

    let fnx = uy * vz - uz * vy;
    let fny = uz * vx - ux * vz;
    let fnz = ux * vy - uy * vx;

    const flen = Math.hypot(fnx, fny, fnz) || 1;
    fnx /= flen;
    fny /= flen;
    fnz /= flen;

    for (let k = 0; k < 3; k++) {
      const src = tri[k];
      const dst3 = (t * 3 + k) * 3;
      const dst2 = (t * 3 + k) * 2;

      positions[dst3] = indexedPositions[src * 3];
      positions[dst3 + 1] = indexedPositions[src * 3 + 1];
      positions[dst3 + 2] = indexedPositions[src * 3 + 2];

      smoothNormals[dst3] = indexedSmoothNormals[src * 3];
      smoothNormals[dst3 + 1] = indexedSmoothNormals[src * 3 + 1];
      smoothNormals[dst3 + 2] = indexedSmoothNormals[src * 3 + 2];

      flatNormals[dst3] = fnx;
      flatNormals[dst3 + 1] = fny;
      flatNormals[dst3 + 2] = fnz;

      texCoords[dst2] = indexedTexCoords[src * 2];
      texCoords[dst2 + 1] = indexedTexCoords[src * 2 + 1];
    }
  }

  return {
    positions,
    smoothNormals,
    flatNormals,
    texCoords,
    vertexCount: indices.length
  };
}

const SPHERE_RADIUS = 0.7;
const SPHERE_LAT_BANDS = 32;
const SPHERE_LON_BANDS = 48;

const sphere = createSphereGeometry(
  SPHERE_RADIUS,
  SPHERE_LAT_BANDS,
  SPHERE_LON_BANDS
);

const vertexCount = sphere.vertexCount;

/* ------------------------------------------------------------------ */
/* Locations                                                           */
/* ------------------------------------------------------------------ */

const positionLocation = gl.getAttribLocation(program, "a_position");
const normalLocation = gl.getAttribLocation(program, "a_normal");
const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

const modelLocation = gl.getUniformLocation(program, "u_model");
const viewLocation = gl.getUniformLocation(program, "u_view");
const projectionLocation = gl.getUniformLocation(program, "u_projection");
const normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");
const lightPositionLocation = gl.getUniformLocation(program, "u_lightPosition");
const lightColorLocation = gl.getUniformLocation(program, "u_lightColor");
const cameraPositionLocation = gl.getUniformLocation(program, "u_cameraPosition");
const ambientLocation = gl.getUniformLocation(program, "u_ambientStrength");
const shininessLocation = gl.getUniformLocation(program, "u_shininess");
const textureLocation = gl.getUniformLocation(program, "u_texture");
const uvScaleLocation = gl.getUniformLocation(program, "u_uvScale");

/* ------------------------------------------------------------------ */
/* Buffers                                                             */
/* ------------------------------------------------------------------ */

function createArrayBuffer(data) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buffer;
}

function setupAttribute(buffer, location, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

const positionBuffer = createArrayBuffer(sphere.positions);
const flatNormalBuffer = createArrayBuffer(sphere.flatNormals);
const smoothNormalBuffer = createArrayBuffer(sphere.smoothNormals);
const texCoordBuffer = createArrayBuffer(sphere.texCoords);

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

function createCheckerTexture() {
  const size = 64;
  const source = document.createElement("canvas");

  source.width = size;
  source.height = size;

  const ctx = source.getContext("2d");
  const cells = 8;
  const cellSize = size / cells;

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const even = (x + y) % 2 === 0;

      ctx.fillStyle = even ? "#f8fafc" : "#0ea5e9";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);

  return texture;
}

function createImageTexture(url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
    gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 255, 255]) // magenta placeholder
  );

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = url;

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    applyFiltering();
    applyWrapping();
  };

  image.onerror = () => console.error("Failed to load texture:", url);

  return texture;
}

const texture = createImageTexture("./textures/diamonds.jpg");
// const texture = createCheckerTexture();

/* ------------------------------------------------------------------ */
/* Scene state                                                         */
/* ------------------------------------------------------------------ */

const sphereState = {
  rotationX: 20,
  rotationY: 30,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1
};

const camera = {
  position: [0, 1.4, 4],
  target: [0, 0, 0],
  up: [0, 1, 0]
};

const light = {
  position: [2, 2, 2],
  color: [1, 1, 1]
};

let ambientStrength = 0.18;
let shininess = 32;
let uvScale = 1;
let shadingMode = "FLAT";
let filterMode = "LINEAR";
let wrapIndex = 0;

const wrapModes = [
  "REPEAT",
  "CLAMP_TO_EDGE",
  "MIRRORED_REPEAT"
];

const keys = {};

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }

  if (event.repeat) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "f") {
    shadingMode = shadingMode === "FLAT" ? "SMOOTH" : "FLAT";
  }

  if (key === "t") {
    filterMode = filterMode === "LINEAR" ? "NEAREST" : "LINEAR";
    applyFiltering();
  }

  if (key === "g") {
    wrapIndex = (wrapIndex + 1) % wrapModes.length;
    applyWrapping();
  }

  if (key === "r") {
    resetScene();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

/* ------------------------------------------------------------------ */
/* Texture state helpers                                               */
/* ------------------------------------------------------------------ */

function applyFiltering() {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (filterMode === "NEAREST") {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
}

function applyWrapping() {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const modeName = wrapModes[wrapIndex];
  let mode = gl.REPEAT;

  if (modeName === "CLAMP_TO_EDGE") {
    mode = gl.CLAMP_TO_EDGE;
  }

  if (modeName === "MIRRORED_REPEAT") {
    mode = gl.MIRRORED_REPEAT;
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode);
}

/* ------------------------------------------------------------------ */
/* Transforms & animation                                              */
/* ------------------------------------------------------------------ */

function createModelMatrix() {
  const rx = Mat4.rotationX(degToRad(sphereState.rotationX));
  const ry = Mat4.rotationY(degToRad(sphereState.rotationY));
  const scale = Mat4.scaling(
    sphereState.scaleX,
    sphereState.scaleY,
    sphereState.scaleZ
  );

  let model = Mat4.identity();

  model = Mat4.multiply(model, scale);
  model = Mat4.multiply(model, rx);
  model = Mat4.multiply(model, ry);

  return model;
}

function updateSphere(dt) {
  sphereState.rotationX += 24 * dt;
  // sphereState.rotationY += 24 * dt;
}

function updateLight(dt) {
  const lightSpeed = 2;

  if (keys["arrowleft"]) {
    light.position[0] -= lightSpeed * dt;
  }

  if (keys["arrowright"]) {
    light.position[0] += lightSpeed * dt;
  }

  if (keys["arrowup"]) {
    light.position[1] += lightSpeed * dt;
  }

  if (keys["arrowdown"]) {
    light.position[1] -= lightSpeed * dt;
  }

  if (keys["w"]) {
    light.position[2] -= lightSpeed * dt;
  }

  if (keys["s"]) {
    light.position[2] += lightSpeed * dt;
  }
}

function updateUVScale(dt) {
  const speed = 1.5;

  if (keys["["]) {
    uvScale -= speed * dt;
  }

  if (keys["]"]) {
    uvScale += speed * dt;
  }

  uvScale = Math.max(0.25, Math.min(5, uvScale));
}

function updateShininess(dt) {
  const speed = 50;

  if (keys["-"] || keys["_"]) {
    shininess -= speed * dt;
  }

  if (keys["+"] || keys["="]) {
    shininess += speed * dt;
  }

  shininess = Math.max(2, Math.min(128, shininess));
}

function resetScene() {
  light.position = [2, 2, 2];

  shininess = 32;
  uvScale = 1;
  shadingMode = "FLAT";
  filterMode = "LINEAR";
  wrapIndex = 0;

  sphereState.rotationX = 20;
  sphereState.rotationY = 30;
  sphereState.scaleX = 1;
  sphereState.scaleY = 1;
  sphereState.scaleZ = 1;

  applyFiltering();
  applyWrapping();
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

const shadingInfo = document.getElementById("shadingInfo");
const filterInfo = document.getElementById("filterInfo");
const wrapInfo = document.getElementById("wrapInfo");
const uvInfo = document.getElementById("uvInfo");
const shininessInfo = document.getElementById("shininessInfo");
const lightInfo = document.getElementById("lightInfo");

function updateHUD() {
  shadingInfo.textContent = shadingMode;
  filterInfo.textContent = filterMode;
  wrapInfo.textContent = wrapModes[wrapIndex];
  uvInfo.textContent = uvScale.toFixed(2);
  shininessInfo.textContent = shininess.toFixed(1);

  lightInfo.textContent =
    `(${light.position[0].toFixed(2)}, ${light.position[1].toFixed(2)}, ${light.position[2].toFixed(2)})`;
}

/* ------------------------------------------------------------------ */
/* Draw                                                                */
/* ------------------------------------------------------------------ */

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.025, 0.04, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  setupAttribute(positionBuffer, positionLocation, 3);
  setupAttribute(texCoordBuffer, texCoordLocation, 2);

  const activeNormalBuffer =
    shadingMode === "FLAT" ? flatNormalBuffer : smoothNormalBuffer;

  setupAttribute(activeNormalBuffer, normalLocation, 3);

  const model = createModelMatrix();

  const view = Mat4.lookAt(
    camera.position,
    camera.target,
    camera.up
  );

  const projection = Mat4.perspective(
    degToRad(60),
    canvas.width / canvas.height,
    0.1,
    100
  );

  const normalMatrix = normalMatrixFromMat4(model);

  gl.uniformMatrix4fv(modelLocation, false, model);
  gl.uniformMatrix4fv(viewLocation, false, view);
  gl.uniformMatrix4fv(projectionLocation, false, projection);
  gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

  gl.uniform3fv(lightPositionLocation, light.position);
  gl.uniform3fv(lightColorLocation, light.color);
  gl.uniform3fv(cameraPositionLocation, camera.position);

  gl.uniform1f(ambientLocation, ambientStrength);
  gl.uniform1f(shininessLocation, shininess);
  gl.uniform1f(uvScaleLocation, uvScale);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocation, 0);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */

let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;

  dt = Math.min(dt, 0.05);

  updateSphere(dt);
  updateLight(dt);
  updateUVScale(dt);
  updateShininess(dt);

  drawScene();
  updateHUD();

  requestAnimationFrame(render);
}

applyFiltering();
applyWrapping();
updateHUD();

requestAnimationFrame(render);