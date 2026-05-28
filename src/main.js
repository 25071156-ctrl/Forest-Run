// DOM Elements
const uiLayer = document.getElementById('ui-layer');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const hud = document.getElementById('hud');
const distanceVal = document.getElementById('distance-val');
const levelVal = document.getElementById('level-val');
const levelUpText = document.getElementById('level-up-text');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const levelUpMsg = document.getElementById('level-up-msg');

// Game State
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let distance = 0;
let level = 1;
let lastLevelMilestone = 0;
let defaultSpeed = 0.5;
let currentSpeed = defaultSpeed;
let reqId;
let lastTime = performance.now();

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2d4c1e); // Forest green background

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera positioned behind and slightly above the player
camera.position.set(0, 4, 8);
camera.lookAt(0, 0, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// Load Game Objects
const environment = new Environment(scene);
const player = new Player(scene);
const obstacleManager = new ObstacleManager(scene);

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Controls Map
const keys = { Left: false, Right: false, Jump: false };

window.addEventListener('keydown', (e) => {
  if (gameState !== 'PLAYING') return;

  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    if (!keys.Left) {
      player.moveLeft();
      keys.Left = true;
    }
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    if (!keys.Right) {
      player.moveRight();
      keys.Right = true;
    }
  }
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
    if (!keys.Jump) {
      player.jump();
      keys.Jump = true;
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.Left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.Right = false;
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.Jump = false;
});

// Touch controls for mobile / swipe support
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

window.addEventListener('touchend', (e) => {
  if (gameState !== 'PLAYING') return;
  
  let touchEndX = e.changedTouches[0].screenX;
  let touchEndY = e.changedTouches[0].screenY;
  
  let diffX = touchEndX - touchStartX;
  let diffY = touchEndY - touchStartY;
  
  // Need a minimum threshold to count as swipe
  if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal
      if (diffX > 0) player.moveRight();
      else player.moveLeft();
    } else {
      // Vertical
      if (diffY < 0) player.jump(); // Swipe up
    }
  }
}, {passive: true});


// UI Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
  gameState = 'PLAYING';
  
  // Reset Variables
  distance = 0;
  level = 1;
  lastLevelMilestone = 0;
  environment.isTransitioning = false; // reset color transition
  
  // Reset colors back to Level 1 theme (Forest Green)
  scene.fog.color.setHex(0x2d4c1e);
  scene.background.setHex(0x2d4c1e);
  environment.ground.material.color.setHex(0x1e4a21);
  document.body.style.backgroundColor = '#2d4c1e';
  
  currentSpeed = defaultSpeed;
  distanceVal.innerText = '0';
  levelVal.innerText = '1';
  
  // Reset Objects
  player.reset();
  obstacleManager.reset();
  
  // Toggle UI
  startMenu.classList.add('hidden');
  gameOverMenu.classList.add('hidden');
  hud.classList.remove('hidden');
  uiLayer.style.pointerEvents = 'none'; // allow clicks/touches on canvas

  lastTime = performance.now();
  if (!reqId) {
    reqId = requestAnimationFrame(gameLoop);
  }
}

function gameOver() {
  gameState = 'GAMEOVER';
  
  // Show UI
  finalScore.innerText = Math.floor(distance);
  hud.classList.add('hidden');
  gameOverMenu.classList.remove('hidden');
  uiLayer.style.pointerEvents = 'auto'; // allow clicking buttons again
}

// Main Game Loop
function gameLoop(time) {
  reqId = requestAnimationFrame(gameLoop);
  
  const deltaTime = time - lastTime;
  lastTime = time;

  if (gameState === 'PLAYING') {
    // Increase speed slowly
    currentSpeed += 0.0001;

    // Update distance (meters)
    distance += currentSpeed * 0.05;
    distanceVal.innerText = Math.floor(distance);

    // Update Entities
    environment.update(deltaTime, currentSpeed);
    player.update(deltaTime);
    obstacleManager.update(deltaTime, currentSpeed);

    // Check Collisions
    if (obstacleManager.checkCollision(player.box)) {
      gameOver();
    }

    // Check for level up every 50 meters
    const expectedLevel = Math.floor(distance / 50) + 1;
    if (expectedLevel > level) {
      level = expectedLevel;
      levelVal.innerText = level;
      
      // Speed boosts on level up
      currentSpeed += 0.15;
      
      // Transition environment colors
      environment.transitionToLevel(level);
      
      // Flash level up text
      levelUpText.innerText = `LEVEL ${level}`;
      levelUpMsg.classList.remove('hidden');
      
      const currentLevelCheck = level;
      setTimeout(() => {
        if (level === currentLevelCheck) {
          levelUpMsg.classList.add('hidden');
        }
      }, 2000);
    }
  }

  // Render everything
  renderer.render(scene, camera);
}

// Initial Render so screen isn't black before start
renderer.render(scene, camera);
