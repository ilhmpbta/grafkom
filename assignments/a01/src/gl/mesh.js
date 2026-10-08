export class Mesh {
  constructor(gl, { data, components = 2, mode = gl.TRIANGLES }) {
    this.gl = gl;
    this.mode = mode;
    this.components = components;
    this.vertexCount = data.length / components;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  bind(positionLocation) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      this.components,
      gl.FLOAT,
      false,
      0,
      0
    );
  }
}