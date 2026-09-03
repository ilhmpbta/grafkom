const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mouseX = 0;
let mouseY = 0;

const update = () => {
  // Tracking mouse movement
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });
}

const draw = () => {
  ctx.beginPath();
  ctx.arc(
    mouseX,
    mouseY,
    50,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "orange";
  ctx.fill();
}

const animate = () => {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  update();
  draw();
  requestAnimationFrame(animate);
}

animate();
