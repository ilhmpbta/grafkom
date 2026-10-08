const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Draw a rectangle
ctx.fillStyle = "blue";
ctx.fillRect(100, 100, 200, 120);


// Draw a line
ctx.beginPath();
ctx.moveTo(500, 100);
ctx.lineTo(350, 200);
ctx.strokeStyle = "black";
ctx.lineWidth = 3;
ctx.stroke();

// Draw a ciecle
ctx.beginPath();
ctx.arc(450, 350, 75, 0, Math.PI * 2 );
ctx.fillStyle = "red";
ctx.fill();


// Draw a triangle
ctx.beginPath();
ctx.moveTo(200, 300);
ctx.lineTo(300, 450);
ctx.lineTo(100, 450);
ctx.closePath();
ctx.fillStyle = "green";
ctx.fill();


// Draw a simple scene
function drawScene() {
  ctx.fillStyle = "blue";
  ctx.fillRect(50, 50, 150, 100);
  ctx.beginPath();
  ctx.arc(350, 150, 50, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}


// Clear the canvas
// ctx.clearRect(
//   0,
//   0,
//   canvas.width,
//   canvas.height
// );
