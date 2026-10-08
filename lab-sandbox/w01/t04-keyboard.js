const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let playerX = 50;
let playerY = 50;
let movement = 25;
let playerRadius = 50;

// Tracking keyboard input + border checking
window.addEventListener("keydown", (event) => {    
  if (event.key === "ArrowLeft" && (playerX - movement - playerRadius) >= 0) {
    playerX -= movement;
  } else if (event.key === "ArrowRight" && (playerX + movement + playerRadius) <= canvas.width) {
    playerX += movement;
  } else if (event.key === "ArrowUp" && (playerY - movement - playerRadius) >= 0) {
    playerY -= movement;
  } else if (event.key === "ArrowDown" && (playerY + movement + playerRadius) <= canvas.height) {
    playerY += movement;
  }
});

const draw = () => {
  ctx.beginPath();
  ctx.arc(
    playerX,
    playerY,
    playerRadius,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "orange";
  ctx.fill();
}

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  requestAnimationFrame(animate);
}

animate();
