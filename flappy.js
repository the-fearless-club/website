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
window.addEventListener("resize", () => {
  resizeCanvas();
  scaleGameElements();
});
window.addEventListener("orientationchange", () => setTimeout(() => {
  resizeCanvas();
  scaleGameElements();
}, 100));

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

// Game variables
let pipes = [];
let pipeGap = 150;
let pipeWidth = 70;
let basePipeSpacing = 450;
let lastPipeX = canvas.width;
let gameSpeed = 2.5;
let baseGameSpeed = 2.5;

let epsteinBg = new Image();
epsteinBg.src = 'img/epstein.png';
let epsteinGifBg = new Image();
epsteinGifBg.src = 'img/epstein-jeffrey-epstein.gif';
let epsteinActive = false;
let epsteinGifActive = false;
let godMode = false;
let cheatBuffer = '';
const CHEAT_LENGTH = 24;

// Simple hash function
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to hex string
  const hex = (hash >>> 0).toString(16);
  // Create a longer hash by combining multiple operations
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += ((str.charCodeAt(i) * 7 + i * 13) % 256).toString(16).padStart(2, '0');
  }
  return result.substring(0, 32);
}

const VALID_HASH = 'cad0c14528047380637eae98ba88db78';
let efnAudio = new Audio('img/EFN.mp3');
efnAudio.loop = true;
efnAudio.playbackRate = 1.5;
let efnPlaying = false;
let efn2Audio = new Audio('img/EFN2.mp3');
efn2Audio.loop = true;
let efn2Playing = false;
let impressedBg = new Image();
impressedBg.src = 'img/impressed.png';
let impressedActive = false;
let hardtekkAudio = new Audio('img/hardtekk.mp3');
hardtekkAudio.loop = true;
let hardtekkPlaying = false;

// Scale game elements based on screen size
function scaleGameElements() {
  const scale = Math.min(canvas.width, canvas.height) / 700;
  
  // Scale player size based on screen
  player.width = Math.max(35, Math.min(70, 45 * scale));
  player.height = Math.max(35, Math.min(70, 45 * scale));
  
  // Original Flappy Bird physics - balanced
  player.gravity = 0.35;
  player.jumpStrength = -6;
  player.maxVelocity = 8;
  
  // Pipe width - consistent across devices
  pipeWidth = 70;
  
  // Horizontal spacing between pipes - different per device type
  if (canvas.width < 600) {
    // Mobile - need much more space
    basePipeSpacing = 400;
  } else if (canvas.width < 1200) {
    // Tablet/iPad
    basePipeSpacing = 500;
  } else if (canvas.width >= 2560) {
    // 1440p+
    basePipeSpacing = 700;
  } else {
    // Desktop 1080p
    basePipeSpacing = 550;
  }
  
  // Game speed - balanced
  baseGameSpeed = canvas.width >= 2560 ? 3 : 2;
}

// Initial scale call
scaleGameElements();

// Listen for cheat code input
document.addEventListener('keypress', (e) => {
  cheatBuffer += e.key.toLowerCase();
  if (cheatBuffer.length > CHEAT_LENGTH) {
    cheatBuffer = cheatBuffer.slice(-CHEAT_LENGTH);
  }
  if (cheatBuffer.length === CHEAT_LENGTH && hashCode(cheatBuffer) === VALID_HASH) {
    godMode = !godMode;
    cheatBuffer = '';
    showCheatNotification();
  }
});

// Enter Code button handler
document.getElementById('enterCodeBtn').addEventListener('click', () => {
  const code = prompt('Enter cheat code:');
  if (code && hashCode(code.toLowerCase()) === VALID_HASH) {
    godMode = !godMode;
    showCheatNotification();
  } else if (code) {
    alert('Invalid code!');
  }
});

// Show cheat notification
function showCheatNotification() {
  const message = godMode ? 'GOD MODE ON' : 'GOD MODE OFF';
  
  if (gameScreen.classList.contains('active')) {
    const hud = document.getElementById('score');
    hud.textContent = message;
    setTimeout(() => { hud.textContent = 'Score: ' + gameState.score; }, 1500);
  } else {
    alert(message);
  }
}

// Initialize game
function startGame() {
  // Ensure canvas is correctly sized first
  resizeCanvas();
  scaleGameElements();
  
  // Load character image
  playerImage = new Image();
  playerImage.src = `img/fearless-${gameState.selectedCharacter}.png`;

  // Reset game state
  gameState.score = 0;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameRunning = true;
  epsteinActive = false;
  epsteinGifActive = false;
  impressedActive = false;
  document.getElementById('gifBackground').classList.remove('active');
  // Reload and reset EFN audio
  efnAudio.src = 'img/EFN.mp3';
  efnAudio.loop = true;
  efnAudio.playbackRate = 1.5;
  efnAudio.pause();
  efnAudio.currentTime = 0;
  efnPlaying = false;
  efn2Audio.pause();
  efn2Audio.currentTime = 0;
  efn2Playing = false;
  hardtekkAudio.pause();
  hardtekkAudio.currentTime = 0;
  hardtekkPlaying = false;

  // Update score display immediately
  document.getElementById("score").textContent = "Score: 0";

  // Reset player position - ensure we use fresh canvas dimensions
  player.x = canvas.width * 0.15;
  player.y = canvas.height * 0.5;
  player.velocity = 0;

  // Reset pipes - first pipe spawns off screen to the right
  pipes = [];
  lastPipeX = canvas.width + 100;
  
  // Scale already done above
  gameSpeed = baseGameSpeed;

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

  // Always clear and draw background first
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  if (impressedActive && impressedBg.complete) {
    ctx.drawImage(impressedBg, 0, 0, canvas.width, canvas.height);
  } else if (epsteinGifActive) {
    // Canvas is transparent, HTML gif element shows through
  } else if (epsteinActive && epsteinBg.complete) {
    ctx.drawImage(epsteinBg, 0, 0, canvas.width, canvas.height);
  } else {
    // Draw sky background
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameRunning && !gameState.isGameOver) {
    if (!gameState.isPaused) {
      // Update physics - original Flappy Bird style
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
      while (lastPipeX < canvas.width + basePipeSpacing) {
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
          if (gameState.score >= 15 && gameState.score < 100 && !efnPlaying) {
            epsteinActive = true;
            efnAudio.currentTime = 0;
            efnAudio.play();
            efnPlaying = true;
          }
          
          // At score 100: switch to EFN2 and gif background
          if (gameState.score >= 100 && gameState.score < 1000 && !efn2Playing) {
            // Force stop EFN.mp3
            efnAudio.pause();
            efnAudio.currentTime = 0;
            efnAudio.src = '';
            efnPlaying = false;
            epsteinActive = false;
            epsteinGifActive = true;
            document.getElementById('gifBackground').classList.add('active');
            efn2Audio.currentTime = 0;
            efn2Audio.play();
            efn2Playing = true;
          }
          
          // At score 1000: switch to impressed background and hardtekk
          if (gameState.score >= 1000 && !hardtekkPlaying) {
            // Stop EFN2
            efn2Audio.pause();
            efn2Audio.currentTime = 0;
            efn2Audio.src = '';
            efn2Playing = false;
            // Disable gif background
            epsteinGifActive = false;
            document.getElementById('gifBackground').classList.remove('active');
            // Enable impressed background
            impressedActive = true;
            // Start hardtekk at 30 seconds
            hardtekkAudio.currentTime = 30;
            hardtekkAudio.play();
            hardtekkPlaying = true;
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
  // Vertical gap between top and bottom pipe - random size
  const minGap = 150;
  const maxGap = 250;
  const randomGap = minGap + Math.random() * (maxGap - minGap);
  
  // Pipe position constraints
  const minTopHeight = 80; // Minimum height of top pipe
  const minBottomPipeHeight = 80; // Minimum height of bottom pipe
  const maxTopHeight = canvas.height - randomGap - minBottomPipeHeight;
  
  // Ensure valid range
  const safeMaxTopHeight = Math.max(minTopHeight + 30, maxTopHeight);
  const topHeight = Math.random() * (safeMaxTopHeight - minTopHeight) + minTopHeight;
  
  // Bottom pipe starts after the gap
  const bottomStart = topHeight + randomGap;

  pipes.push({
    x: lastPipeX,
    topHeight: topHeight,
    bottomStart: bottomStart,
    scored: false,
  });

  lastPipeX += basePipeSpacing;
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
  efn2Audio.pause();
  efn2Audio.currentTime = 0;
  efn2Playing = false;
  hardtekkAudio.pause();
  hardtekkAudio.currentTime = 0;
  hardtekkPlaying = false;
  impressedActive = false;
  epsteinGifActive = false;
  document.getElementById('gifBackground').classList.remove('active');
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
