// Game state
const gameState = {
  selectedCharacter: null,
  score: 0,
  isPaused: false,
  isGameOver: false,
};

// Screen elements
const characterSelection = document.getElementById("characterSelection");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 100));

// CHARACTER SELECTION
document.querySelectorAll(".character-card").forEach((card) => {
  card.addEventListener("click", () => {
    gameState.selectedCharacter = card.dataset.character;
    startGame();
  });
});

// GAME VARIABLES
let playerImage;
let gameRunning = false;
let gameLoopActive = false;

// Player object
const player = {
  x: canvas.width * 0.2,
  y: canvas.height * 0.5,
  width: 40,
  height: 40,
  velocity: 0,
  gravity: 0.25,
  jumpStrength: -6.5,
  maxVelocity: 8,
};

// Now that player exists, update resizeCanvas to scale player
const _origResize = resizeCanvas;
resizeCanvas = function() {
  _origResize();
  const scale = Math.min(canvas.width, canvas.height) / 700;
  player.width = Math.max(30, 40 * scale);
  player.height = Math.max(30, 40 * scale);
};

// Game variables
let pipes = [];
let pipeGap = 150;
let pipeWidth = 70;
let pipeSpacing = 450;
let lastPipeX = canvas.width;
let gameSpeed = 2.5;
let epsteinBg = new Image();
epsteinBg.src = 'img/epstein.png';
let epsteinActive = false;
let godMode = false;
let cheatBuffer = '';
const CHEAT_CODE = 'fearlessmotorischeenheid';
let efnAudio = new Audio('img/EFN.mp3');
efnAudio.loop = true;
efnAudio.playbackRate = 1.5;
let efnPlaying = false;

// Listen for cheat code input
document.addEventListener('keypress', (e) => {
  cheatBuffer += e.key.toLowerCase();
  if (cheatBuffer.length > CHEAT_CODE.length) {
    cheatBuffer = cheatBuffer.slice(-CHEAT_CODE.length);
  }
  if (cheatBuffer === CHEAT_CODE) {
    godMode = !godMode;
    cheatBuffer = '';
    const hud = document.getElementById('score');
    if (godMode) {
      hud.textContent = 'GOD MODE ON';
      setTimeout(() => { hud.textContent = 'Score: ' + gameState.score; }, 1500);
    } else {
      hud.textContent = 'GOD MODE OFF';
      setTimeout(() => { hud.textContent = 'Score: ' + gameState.score; }, 1500);
    }
  }
});

// Initialize game
function startGame() {
  // Load character image
  playerImage = new Image();
  playerImage.src = `img/fearless-${gameState.selectedCharacter}.png`;

  // Reset game state
  gameState.score = 0;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameRunning = true;
  epsteinActive = false;
  efnAudio.pause();
  efnAudio.currentTime = 0;
  efnPlaying = false;
  
  // Update score display immediately
  document.getElementById("score").textContent = "Score: 0";

  // Reset player position
  player.x = canvas.width * 0.2;
  player.y = canvas.height * 0.5;
  player.velocity = 0;

  // Reset pipes
  pipes = [];
  lastPipeX = canvas.width + 200;
  gameSpeed = 2.5;

  // Generate initial pipes
  for (let i = 0; i < 3; i++) {
    createPipe();
  }

  // Switch screens
  characterSelection.classList.remove("active");
  gameScreen.classList.add("active");

  // Remove old listeners first
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleClick);
  document.removeEventListener("touchstart", handleTouchStart);

  // Add event listeners
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleClick);
  document.addEventListener("touchstart", handleTouchStart, false);

  document.getElementById("pauseBtn").addEventListener("click", togglePause);

  // Start game loop only if not already running
  if (!gameLoopActive) {
    gameLoopActive = true;
    gameLoop();
  }
}

// Game loop
function gameLoop() {
  if (!gameLoopActive) return;
  
  resizeCanvas();

  // Clear canvas
  if (epsteinActive && epsteinBg.complete) {
    ctx.drawImage(epsteinBg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "rgba(135, 206, 235, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameRunning && !gameState.isGameOver) {
    if (!gameState.isPaused) {
      // Update physics
      player.velocity += player.gravity;
      // Limit falling speed (terminal velocity)
      if (player.velocity > player.maxVelocity) {
        player.velocity = player.maxVelocity;
      }
      player.y += player.velocity;

      // Ceiling: clamp position, don't die
      if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
      }

      // Generate pipes endlessly
      while (lastPipeX < canvas.width + pipeSpacing) {
        createPipe();
      }

      // Update pipes
      pipes.forEach((pipe, index) => {
        pipe.x -= gameSpeed;

        // Check if pipe passed player
        if (pipe.x + pipeWidth < player.x && !pipe.scored) {
          pipe.scored = true;
          gameState.score++;
          document.getElementById("score").textContent =
            "Score: " + gameState.score;
          
          // Easter egg at score 15
          if (gameState.score >= 15 && !efnPlaying) {
            epsteinActive = true;
            efnAudio.currentTime = 0;
            efnAudio.play();
            efnPlaying = true;
          }
          
          // Stop music at score 100
          if (gameState.score >= 100 && efnPlaying) {
            efnAudio.pause();
            efnAudio.currentTime = 0;
            efnPlaying = false;
            epsteinActive = false;
          }
        }

        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
          pipes.splice(index, 1);
        }
      });

      // Track lastPipeX movement with game speed
      lastPipeX -= gameSpeed;

      // Collision detection
      if (!godMode && (checkCollision() || player.y + player.height > canvas.height)) {
        endGame();
      }
    }

    // Draw pipes
    pipes.forEach((pipe) => {
      drawPipe(pipe.x, 0, pipe.topHeight, true);
      drawPipe(pipe.x, pipe.bottomStart, canvas.height - pipe.bottomStart, false);
    });

    // Draw player
    if (playerImage.complete) {
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      ctx.rotate((player.velocity * 0.05)); // Tilt based on velocity
      ctx.drawImage(
        playerImage,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
      ctx.restore();
    } else {
      // Fallback circle if image not loaded
      ctx.fillStyle = "#ff00cc";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Create pipe
function createPipe() {
  const minGap = 200;
  const maxGap = 280;
  const randomGap = minGap + Math.random() * (maxGap - minGap);
  const minTopHeight = 50;
  const maxTopHeight = canvas.height - randomGap - 100;
  const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;

  pipes.push({
    x: lastPipeX,
    topHeight: topHeight,
    bottomStart: topHeight + randomGap,
    scored: false,
  });

  lastPipeX += pipeSpacing;
}

// Collision detection
function checkCollision() {
  for (let pipe of pipes) {
    // Check if player is within pipe's x range
    if (
      player.x < pipe.x + pipeWidth &&
      player.x + player.width > pipe.x
    ) {
      // Check if player hits top or bottom pipe
      if (
        player.y < pipe.topHeight ||
        player.y + player.height > pipe.bottomStart
      ) {
        return true;
      }
    }
  }
  return false;
}

// Draw realistic pipe (flappy bird style)
function drawPipe(x, y, height, isTop) {
  // Main pipe body
  ctx.fillStyle = "#52c552";
  ctx.fillRect(x, y, pipeWidth, height);
  
  // Pipe cap/connector (small part that sticks out)
  const capHeight = 12;
  const capWidth = pipeWidth + 8;
  ctx.fillStyle = "#62d962";
  if (isTop) {
    // Top pipe cap at bottom
    ctx.fillRect(x - 4, y + height - capHeight, capWidth, capHeight);
  } else {
    // Bottom pipe cap at top
    ctx.fillRect(x - 4, y, capWidth, capHeight);
  }
  
  // Darker shading for depth on left side
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(x, y, 3, height);
  
  // Slight highlight on right side
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(x + pipeWidth - 3, y, 3, height);
}

// Handle input
function handleKeyDown(e) {
  if ((e.key === " " || e.key === "w" || e.key === "ArrowUp") && gameRunning && !gameState.isPaused) {
    e.preventDefault();
    player.velocity = player.jumpStrength;
  }
}

function handleClick(e) {
  if (!gameRunning || gameState.isPaused || !gameScreen.classList.contains("active")) return;
  // Don't trigger jump when clicking HUD buttons
  if (e.target.closest('#hud')) return;
  player.velocity = player.jumpStrength;
}

// Mobile touch handler for better UX
function handleTouchStart(e) {
  if (!gameRunning || gameState.isPaused || !gameScreen.classList.contains("active")) return;
  if (e.target.closest('#hud')) return;
  e.preventDefault();
  player.velocity = player.jumpStrength;
}

// Pause/Resume
function togglePause() {
  if (!gameState.isGameOver) {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById("pauseBtn").textContent = gameState.isPaused
      ? "▶ Resume"
      : "⏸ Pause";
  }
}

// End game
// End game
function endGame() {
  gameState.isGameOver = true;
  gameRunning = false;
  gameLoopActive = false;
  efnAudio.pause();
  efnAudio.currentTime = 0;
  efnPlaying = false;
  document.getElementById("finalScore").textContent =
    "Final Score: " + gameState.score;

  // Remove event listeners
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleClick);
  document.removeEventListener("touchstart", handleTouchStart);

  // Show game over screen
  setTimeout(() => {
    gameScreen.classList.remove("active");
    gameOverScreen.classList.add("active");
  }, 500);
}

// Game over buttons
document.getElementById("restartBtn").addEventListener("click", () => {
  gameOverScreen.classList.remove("active");
  startGame();
});

document.getElementById("backBtn").addEventListener("click", () => {
  gameOverScreen.classList.remove("active");
  characterSelection.classList.add("active");
  gameState.selectedCharacter = null;
});
