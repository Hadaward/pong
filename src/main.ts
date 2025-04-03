import { Ball } from "./entities/ball";
import { Paddle } from "./entities/paddle";
import { PowerUP } from "./entities/powerup";
import { Engine, PhysicsEntity, CollisionType, PhysicsEntityType, EntityShape } from "./live/physics";

// Set up the canvas.
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas rendering context.");

// Create the engine with Pong-specific settings: no gravity.
const engine = new Engine({ gravityX: 0, gravityY: 0, friction: 300 });

// Create paddles.
const playerPaddle = new Paddle(10, canvas.height / 2 - 50, 20, 100);
engine.addEntity(playerPaddle);

const opponentPaddle = new Paddle(canvas.width - 30, canvas.height / 2 - 50, 20, 100);
engine.addEntity(opponentPaddle);

// Create the ball in the center.
const ball = new Ball(canvas.width / 2 - 10, canvas.height / 2 - 10, 20);
// Set ball friction to 0 so its speed remains constant.
ball.friction = 0;
ball.vx = 200; // initial horizontal speed
ball.vy = 100; // initial vertical speed
engine.addEntity(ball);

// Create top and bottom walls.
const wallThickness = 20;
const topWall = new PhysicsEntity(CollisionType.DISPLACE, PhysicsEntityType.KINEMATIC);
topWall.x = 0;
topWall.y = 0;
topWall.restitution = 1;
topWall.width = canvas.width;
topWall.height = wallThickness;
topWall.restitution = 1;
topWall.updateBounds();
engine.addEntity(topWall);

const bottomWall = new PhysicsEntity(CollisionType.DISPLACE, PhysicsEntityType.KINEMATIC);
bottomWall.x = 0;
bottomWall.y = canvas.height - wallThickness;
bottomWall.restitution = 1;
bottomWall.width = canvas.width;
bottomWall.height = wallThickness;
bottomWall.restitution = 1;
bottomWall.updateBounds();
engine.addEntity(bottomWall);

engine.addEntity(new PowerUP(400, 400, () => console.log('power get')))

// Input handling for the player's paddle.
const keys = {
  up: false,
  down: false,
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowDown") keys.down = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
});

// Game loop.
let lastTime = performance.now();

function gameLoop(time: number) {
  if (!ctx) return;
  
  const elapsed = (time - lastTime) / 1000;
  lastTime = time;

  // --- Player Paddle Movement ---
  const paddleSpeed = 400; // pixels per second
  if (keys.up) {
    playerPaddle.vy = -paddleSpeed;
  } else if (keys.down) {
    playerPaddle.vy = paddleSpeed;
  } else {
    playerPaddle.vy = 0;
  }

  // --- Opponent Paddle Simple AI ---
  const diff = ball.getMidY() - opponentPaddle.getMidY();
  const aiSpeed = 300;
  if (Math.abs(diff) > 10) {
    opponentPaddle.vy = diff > 0 ? aiSpeed : -aiSpeed;
  } else {
    opponentPaddle.vy = 0;
  }

  // --- Update Physics ---
  engine.step(elapsed);

  // --- Clamp Paddles ---
  if (playerPaddle.y < wallThickness)
    playerPaddle.y = wallThickness;
  if (playerPaddle.y + playerPaddle.height > canvas.height - wallThickness)
    playerPaddle.y = canvas.height - wallThickness - playerPaddle.height;
  if (opponentPaddle.y < wallThickness)
    opponentPaddle.y = wallThickness;
  if (opponentPaddle.y + opponentPaddle.height > canvas.height - wallThickness)
    opponentPaddle.y = canvas.height - wallThickness - opponentPaddle.height;

  // --- Simple Scoring / Reset ---
  if (ball.x < 0 || ball.x + ball.width > canvas.width) {
    // Reset ball position and reverse horizontal velocity.
    ball.x = canvas.width / 2 - ball.width / 2;
    ball.y = canvas.height / 2 - ball.height / 2;
    ball.vx = -ball.vx;
  }

  // --- Render ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background.
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw walls.
  ctx.fillStyle = "white";
  ctx.fillRect(topWall.x, topWall.y, topWall.width, topWall.height);
  ctx.fillRect(bottomWall.x, bottomWall.y, bottomWall.width, bottomWall.height);

  // Draw all entities.
  engine.entities.forEach((entity) => {
    ctx.fillStyle = entity instanceof Ball
                    ? "yellow"
                    : entity instanceof PowerUP
                    ? entity.color
                    : "white";
    if (entity.shape === EntityShape.CIRCLE) {
      // Draw a circle.
      ctx.beginPath();
      ctx.arc(entity.x + entity.halfWidth, entity.y + entity.halfHeight, entity.halfWidth, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw a rectangle.
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    }
  });

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);