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

export class Pipeline {
  constructor(gl, vertexShaderSource, fragmentShaderSource) {
    this.gl = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = createProgram(gl, vertexShader, fragmentShader);

    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
    this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    this.colorLocation = gl.getUniformLocation(this.program, "u_color");
  }

  clear(r, g, b, a = 1) {
    const gl = this.gl;

    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  drawMesh(mesh, matrix, color) {
    const gl = this.gl;

    gl.useProgram(this.program);

    mesh.bind(this.positionLocation);

    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);
    gl.uniform4fv(this.colorLocation, color);

    gl.drawArrays(mesh.mode, 0, mesh.vertexCount);
  }
}