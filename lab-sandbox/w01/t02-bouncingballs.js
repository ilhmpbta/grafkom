const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Circle's starting position
let x = 100;
let y = 200;

let speedX = 6;
let speedY = 12;

const update = () => {
  x += speedX;
  y += speedY;

  // Bounce off the left-right walls
  if (x + 50 >= canvas.width || x - 50 <= 0) {
    speedX *= -1;
  }

  // Bounce off the top-bottom walls
  if (y + 50 >= canvas.height || y - 50 <= 0) {
    speedY *= -1;
  }
}

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(animate);
}

const draw = () => {
  ctx.beginPath();
  ctx.arc(x, y, 50, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
}

animate();
