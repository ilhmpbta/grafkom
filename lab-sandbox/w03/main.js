// ============================================================
// Interactive Transformation Playground
// WebGL2 - Pertemuan 3
// ============================================================

// ------------------------------------------------------------
// 1. CANVAS & WEBGL2
// ------------------------------------------------------------

const canvas = document.getElementById("glCanvas");

const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

gl.viewport(
  0,
  0,
  canvas.width,
  canvas.height
);


// ------------------------------------------------------------
// 2. SHADER SOURCE
// ------------------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 a_position;

uniform mat3 u_matrix;

void main() {

  vec3 p =
    u_matrix *
    vec3(
      a_position,
      1.0
    );

  gl_Position =
    vec4(
      p.xy,
      0.0,
      1.0
    );
}
`;


const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {

  outColor =
    u_color;
}
`;


// ------------------------------------------------------------
// 3. SHADER HELPER
// ------------------------------------------------------------

function createShader(
  gl,
  type,
  source
) {

  const shader =
    gl.createShader(type);

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  const success =
    gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    );

  if (!success) {

    const info =
      gl.getShaderInfoLog(
        shader
      );

    gl.deleteShader(
      shader
    );

    throw new Error(
      "Shader compile error:\n" +
      info
    );
  }

  return shader;
}


// ------------------------------------------------------------
// 4. PROGRAM HELPER
// ------------------------------------------------------------

function createProgram(
  gl,
  vertexShader,
  fragmentShader
) {

  const program =
    gl.createProgram();

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(
    program
  );

  const success =
    gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    );

  if (!success) {

    const info =
      gl.getProgramInfoLog(
        program
      );

    gl.deleteProgram(
      program
    );

    throw new Error(
      "Program link error:\n" +
      info
    );
  }

  return program;
}


// ------------------------------------------------------------
// 5. COMPILE & LINK SHADERS
// ------------------------------------------------------------

const vertexShader =
  createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
  );


const fragmentShader =
  createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );


const program =
  createProgram(
    gl,
    vertexShader,
    fragmentShader
  );


gl.useProgram(program);


// ------------------------------------------------------------
// 6. GEOMETRY
// ------------------------------------------------------------

const vertices =
  new Float32Array([

    // Triangle
    -0.18, -0.15,
     0.18, -0.15,
     0.00,  0.22

  ]);


// ------------------------------------------------------------
// 7. VERTEX BUFFER
// ------------------------------------------------------------

const positionBuffer =
  gl.createBuffer();

gl.bindBuffer(
  gl.ARRAY_BUFFER,
  positionBuffer
);

gl.bufferData(
  gl.ARRAY_BUFFER,
  vertices,
  gl.STATIC_DRAW
);


// ------------------------------------------------------------
// 8. ATTRIBUTE
// ------------------------------------------------------------

const positionLocation =
  gl.getAttribLocation(
    program,
    "a_position"
  );


gl.bindBuffer(
  gl.ARRAY_BUFFER,
  positionBuffer
);

gl.enableVertexAttribArray(
  positionLocation
);

gl.vertexAttribPointer(
  positionLocation,

  2,

  gl.FLOAT,

  false,

  0,

  0
);


// ------------------------------------------------------------
// 9. UNIFORM LOCATIONS
// ------------------------------------------------------------

const matrixLocation =
  gl.getUniformLocation(
    program,
    "u_matrix"
  );


const colorLocation =
  gl.getUniformLocation(
    program,
    "u_color"
  );


// ============================================================
// 10. MATRIX 3x3
// ============================================================

const Mat3 = {

  // ----------------------------------------------------------
  // Identity
  // ----------------------------------------------------------

  identity() {

    return new Float32Array([

      1, 0, 0,

      0, 1, 0,

      0, 0, 1

    ]);
  },


  // ----------------------------------------------------------
  // Translation
  // ----------------------------------------------------------

  translation(
    tx,
    ty
  ) {

    return new Float32Array([

      1,  0,  0,

      0,  1,  0,

      tx, ty, 1

    ]);
  },


  // ----------------------------------------------------------
  // Rotation
  // ----------------------------------------------------------

  rotation(rad) {

    const c =
      Math.cos(rad);

    const s =
      Math.sin(rad);

    return new Float32Array([

       c, s, 0,

      -s, c, 0,

       0, 0, 1

    ]);
  },


  // ----------------------------------------------------------
  // Scaling
  // ----------------------------------------------------------

  scaling(
    sx,
    sy
  ) {

    return new Float32Array([

      sx, 0,  0,

      0,  sy, 0,

      0,  0,  1

    ]);
  },


  // ----------------------------------------------------------
  // Matrix Multiplication
  // ----------------------------------------------------------

  multiply(
    a,
    b
  ) {

    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];

    const a10 = a[3];
    const a11 = a[4];
    const a12 = a[5];

    const a20 = a[6];
    const a21 = a[7];
    const a22 = a[8];


    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];

    const b10 = b[3];
    const b11 = b[4];
    const b12 = b[5];

    const b20 = b[6];
    const b21 = b[7];
    const b22 = b[8];


    return new Float32Array([

      b00 * a00 +
      b01 * a10 +
      b02 * a20,

      b00 * a01 +
      b01 * a11 +
      b02 * a21,

      b00 * a02 +
      b01 * a12 +
      b02 * a22,


      b10 * a00 +
      b11 * a10 +
      b12 * a20,

      b10 * a01 +
      b11 * a11 +
      b12 * a21,

      b10 * a02 +
      b11 * a12 +
      b12 * a22,


      b20 * a00 +
      b21 * a10 +
      b22 * a20,

      b20 * a01 +
      b21 * a11 +
      b22 * a21,

      b20 * a02 +
      b21 * a12 +
      b22 * a22

    ]);
  }

};


// ============================================================
// 11. HELPER DEGREE → RADIAN
// ============================================================

function degToRad(
  degree
) {

  return (
    degree *
    Math.PI /
    180
  );
}


// ============================================================
// 12. OBJECT A
// ============================================================

const objectA = {

  x: 0.0,

  y: 0.0,

  rotation: 0.0,

  scaleX: 1.0,

  scaleY: 1.0

};


const colorA =
  new Float32Array([

    0.10,
    0.75,
    1.00,
    1.00

  ]);


// ============================================================
// 13. OBJECT B
// ============================================================

const colorB =
  new Float32Array([

    1.00,
    0.55,
    0.10,
    1.00

  ]);


// ============================================================
// 14. CREATE TRS MATRIX
// ============================================================

function createTRSMatrix(
  transform
) {

  const t =
    Mat3.translation(
      transform.x,
      transform.y
    );


  const r =
    Mat3.rotation(
      degToRad(
        transform.rotation
      )
    );


  const s =
    Mat3.scaling(
      transform.scaleX,
      transform.scaleY
    );


  let matrix =
    Mat3.identity();


  // Scale
  matrix =
    Mat3.multiply(
      matrix,
      s
    );


  // Rotate
  matrix =
    Mat3.multiply(
      matrix,
      r
    );


  // Translate
  matrix =
    Mat3.multiply(
      matrix,
      t
    );


  return matrix;
}


// ============================================================
// 15. OBJECT B ANIMATION
// ============================================================

function createObjectBMatrix(
  seconds
) {

  const rotation =
    seconds * 100.0;


  const scale =
    1.0 +
    Math.sin(
      seconds * 2.0
    ) * 0.25;


  const transformB = {

    x: 0.42,

    y: 0.0,

    rotation: rotation,

    scaleX: scale,

    scaleY: scale

  };


  return createTRSMatrix(
    transformB
  );
}


// ============================================================
// 16. KEYBOARD STATE
// ============================================================

const keys = {};


window.addEventListener(
  "keydown",
  (event) => {

    keys[
      event.key.toLowerCase()
    ] = true;


    if (
      event.key.startsWith(
        "Arrow"
      )
    ) {

      event.preventDefault();
    }


    // Reset
    if (
      event.key.toLowerCase() === "r" &&
      !event.repeat
    ) {

      resetObjectA();
    }

    // Presets
    // Preset 1:
    // Position (-0.4, 0.2)
    // Rotation 0°
    // Scale (1,1)
    
    // Preset 2:
    // Position (0.0, 0.0)
    // Rotation 45°
    // Scale (1.5,1.5)
    
    // Preset 3:
    // Position (0.3,-0.2)
    // Rotation 90°
    // Scale (1.8,0.6)
    if (
      event.key.toLowerCase() === "1"
    ) {
      PresetsObjectA(-0.4, 0.2, 0, 1, 1);
    }

    if (
      event.key.toLowerCase() === "2"
    ) {
      PresetsObjectA(0.0, 0.0, 45, 1.5, 1.5);
    }

    if (
      event.key.toLowerCase() === "3"
    ) {
      PresetsObjectA(0.3, -0.2, 90, 1.8, 0.6);
    }

  }
);


window.addEventListener(
  "keyup",
  (event) => {

    keys[
      event.key.toLowerCase()
    ] = false;

  }
);


// ============================================================
// 17. MOVEMENT
// ============================================================

const moveSpeed =
  6.0;


function updateTranslation(
  dt
) {

  if (
    keys["arrowleft"]
  ) {

    objectA.x -=
      moveSpeed * dt;
  }


  if (
    keys["arrowright"]
  ) {

    objectA.x +=
      moveSpeed * dt;
  }


  if (
    keys["arrowup"]
  ) {

    objectA.y +=
      moveSpeed * dt;
  }


  if (
    keys["arrowdown"]
  ) {

    objectA.y -=
      moveSpeed * dt;
  }

}


// ============================================================
// 18. ROTATION
// ============================================================

const rotationSpeed =
  300.0;


function updateRotation(
  dt
) {

  if (
    keys["q"]
  ) {

    objectA.rotation -=
      rotationSpeed * dt;
  }


  if (
    keys["e"]
  ) {

    objectA.rotation +=
      rotationSpeed * dt;
  }

}


// ============================================================
// 19. UNIFORM SCALING
// ============================================================

const scaleSpeed =
  0.8;


function updateUniformScale(
  dt
) {

  if (
    keys["+"] ||
    keys["="]
  ) {

    objectA.scaleX +=
      scaleSpeed * dt;

    objectA.scaleY +=
      scaleSpeed * dt;
  }


  if (
    keys["-"] ||
    keys["_"]
  ) {

    objectA.scaleX -=
      scaleSpeed * dt;

    objectA.scaleY -=
      scaleSpeed * dt;
  }

}


// ============================================================
// 20. NON-UNIFORM SCALING
// ============================================================

function updateNonUniformScale(
  dt
) {

  // Z = scale X down

  if (
    keys["z"]
  ) {

    objectA.scaleX -=
      scaleSpeed * dt;
  }


  // X = scale X up

  if (
    keys["x"]
  ) {

    objectA.scaleX +=
      scaleSpeed * dt;
  }


  // C = scale Y down

  if (
    keys["c"]
  ) {

    objectA.scaleY -=
      scaleSpeed * dt;
  }


  // V = scale Y up

  if (
    keys["v"]
  ) {

    objectA.scaleY +=
      scaleSpeed * dt;
  }

}


// ============================================================
// 21. CLAMP VALUES
// ============================================================

function clampObjectA() {

  objectA.x =
    Math.max(
      -0.8,
      Math.min(
        0.8,
        objectA.x
      )
    );


  objectA.y =
    Math.max(
      -0.75,
      Math.min(
        0.75,
        objectA.y
      )
    );


  objectA.scaleX =
    Math.max(
      0.2,
      Math.min(
        2.5,
        objectA.scaleX
      )
    );


  objectA.scaleY =
    Math.max(
      0.2,
      Math.min(
        2.5,
        objectA.scaleY
      )
    );

}


// ============================================================
// 22. RESET
// ============================================================

function resetObjectA() {
  objectA.x = 0.0;
  objectA.y = 0.0;
  objectA.rotation = 0.0;
  objectA.scaleX = 1.0;
  objectA.scaleY = 1.0;
}

function PresetsObjectA(inX, inY, inRotation, inScaleX, inScaleY) {
  objectA.x = inX;
  objectA.y = inY;
  objectA.rotation = inRotation;
  objectA.scaleX = inScaleX;
  objectA.scaleY = inScaleY;
}


// ============================================================
// 23. UPDATE
// ============================================================

function update(
  dt
) {

  updateTranslation(
    dt
  );


  updateRotation(
    dt
  );


  updateUniformScale(
    dt
  );


  updateNonUniformScale(
    dt
  );


  clampObjectA();

}


// ============================================================
// 24. DRAW OBJECT
// ============================================================

function drawObject(
  matrix,
  color
) {

  // Send matrix to vertex shader

  gl.uniformMatrix3fv(
    matrixLocation,
    false,
    matrix
  );


  // Send color to fragment shader

  gl.uniform4fv(
    colorLocation,
    color
  );


  // Draw triangle

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    3
  );

}


// ============================================================
// 25. DRAW AXES
// ============================================================
//
// Simple axis overlay is intentionally omitted from the
// triangle shader because it would require another draw mode.
// The main transformation playground remains focused on
// object transformation.
//

// ============================================================
// 26. DRAW SCENE
// ============================================================

function drawScene(
  seconds
) {

  // Clear canvas

  gl.clearColor(
    0.03,
    0.05,
    0.10,
    1.0
  );


  gl.clear(
    gl.COLOR_BUFFER_BIT
  );


  gl.useProgram(
    program
  );


  // ----------------------------------------------------------
  // Object A
  // ----------------------------------------------------------

  const matrixA =
    createTRSMatrix(
      objectA
    );


  drawObject(
    matrixA,
    colorA
  );


  // ----------------------------------------------------------
  // Object B
  // ----------------------------------------------------------

  const matrixB =
    createObjectBMatrix(
      seconds
    );


  drawObject(
    matrixB,
    colorB
  );

}


// ============================================================
// 27. HUD
// ============================================================

const positionInfo =
  document.getElementById(
    "positionInfo"
  );


const rotationInfo =
  document.getElementById(
    "rotationInfo"
  );


const scaleInfo =
  document.getElementById(
    "scaleInfo"
  );


function updateHUD() {

  positionInfo.textContent =
    `(${objectA.x.toFixed(2)}, ` +
    `${objectA.y.toFixed(2)})`;


  rotationInfo.textContent =
    `${objectA.rotation.toFixed(1)}°`;


  scaleInfo.textContent =
    `(${objectA.scaleX.toFixed(2)}, ` +
    `${objectA.scaleY.toFixed(2)})`;

}


// ============================================================
// 28. RENDER LOOP
// ============================================================

let lastTime = 0;


function render(
  time
) {

  // Convert milliseconds to seconds

  const seconds =
    time * 0.001;


  // Delta time

  let dt =
    (time - lastTime) *
    0.001;


  lastTime =
    time;


  // Prevent huge jump after tab becomes active again

  dt =
    Math.min(
      dt,
      0.05
    );


  // Update object state

  update(
    dt
  );


  // Update HUD
  updateHUD();


  // Draw everything
  drawScene(
    seconds
  );


  // Next frame
  requestAnimationFrame(
    render
  );

}


// ============================================================
// 29. START
// ============================================================

requestAnimationFrame(
  render
);
