import { GameWithEvents } from "./core/GameWithEvents";
import { TowerType } from "./entities/Tower";
import { AudioManager, SoundType } from "./audio/AudioManager";
import { SimpleSettingsMenu } from "./ui/SimpleSettingsMenu";
// Touch input is handled within SimpleGameUI now
import { applySettingsToGame } from "./config/SettingsIntegration";
import {
  type MapGenerationConfig,
  BiomeType,
  MapDifficulty,
  DecorationLevel,
} from "./types/MapData";
import { createSvgIcon, IconType } from "./ui/icons/SvgIcons";
import { setupGameUI } from "./ui/setupGameUI";
import { GameOverScreen } from "./ui/components/GameOverScreen";
import { TouchIndicator } from "./ui/components/game/TouchIndicator";
import { TouchInputManager } from "./input/TouchInputManager";
import { VirtualJoystick } from "./ui/components/VirtualJoystick";

// Get canvas element
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element not found");
}

// Global variables for game initialization
let game: GameWithEvents;
let gameInitialized = false;
let touchInputManager: TouchInputManager | null = null;
let virtualJoystick: VirtualJoystick | null = null;

// Set initial canvas size - will be updated to fill container
function resizeCanvas() {
  const container = canvas.parentElement;
  if (container) {
    const rect = container.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Use actual container size
    const width = rect.width;
    const height = rect.height;

    // Set canvas resolution (actual pixels)
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    // Set canvas display size (CSS pixels)
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Scale the drawing context for sharp rendering
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
    }

    // Update camera viewport if game exists
    if (gameInitialized && game) {
      const camera = game.getCamera();
      // Use CSS dimensions since context is scaled by pixelRatio
      camera.updateViewport(width, height);

      // Adjust zoom based on screen size
      const isMobile = window.innerWidth <= 768 || "ontouchstart" in window;
      if (isMobile) {
        const baseZoom = Math.min(width / 1200, height / 800) * 0.9;
        camera.setZoom(Math.max(0.5, baseZoom));
      }
    }
  }
}

// Initial size
resizeCanvas();

// Add window resize listener with debouncing
let resizeTimeout: number;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resizeCanvas, 100);
});
// Touch input is now handled within the SimpleGameUI
const audioManager = new AudioManager();
let gameOverScreen: GameOverScreen;
let settingsMenu: SimpleSettingsMenu;

// Initialize game with settings
function initializeGame() {
  // Get applied game configuration from settings
  const gameConfig = applySettingsToGame(
    (window as any).gameSettings || {
      difficulty: "NORMAL",
      masterVolume: 0.7,
      soundEnabled: true,
      visualQuality: "MEDIUM",
      showFPS: false,
      mapSize: "MEDIUM",
      terrain: "FOREST",
      pathComplexity: "SIMPLE",
    }
  );

  // Convert to map generation config
  const mapGenConfig: MapGenerationConfig = {
    width: gameConfig.mapConfig.width,
    height: gameConfig.mapConfig.height,
    cellSize: gameConfig.mapConfig.cellSize,
    biome: gameConfig.mapConfig.biome.toUpperCase() as BiomeType,
    difficulty: MapDifficulty.MEDIUM,
    seed: Date.now(),
    pathComplexity: gameConfig.mapConfig.pathComplexity,
    obstacleCount: Math.floor(
      gameConfig.mapConfig.width * gameConfig.mapConfig.height * 0.1
    ),
    decorationLevel: DecorationLevel.DENSE,
    enableWater: true,
    enableAnimations: true,
    chokePointCount: 3,
    openAreaCount: 2,
    playerAdvantageSpots: 2,
  };

  // Create game instance with configuration
  game = new GameWithEvents(canvas, mapGenConfig);
  gameInitialized = true;

  //  @ts-ignore
  if (typeof window !== "undefined") {
    // Store game instance globally for debugging
    (window as any).game = game;
  }

  // Create game over screen if not exists
  if (!gameOverScreen) {
    gameOverScreen = new GameOverScreen();
  }

  // Setup game end event listener
  document.addEventListener("gameEnd", handleGameEnd);

  // Start the main game setup
  setupModernGameUI();
}

function handleGameEnd(event: CustomEvent) {
  const { stats, victory, scoreEntry } = event.detail;

  gameOverScreen.show({
    victory,
    stats,
    scoreEntry,
    onRestart: () => {
      // Restart with same settings
      initializeGame();
    },
    onMainMenu: showMainMenu,
  });
}

function showMainMenu() {
  // Clean up current game
  if (gameInitialized) {
    game.stop();
    gameInitialized = false;
    
    // Clean up touch controls
    if (touchInputManager) {
      touchInputManager.destroy();
      touchInputManager = null;
    }
    if (virtualJoystick) {
      virtualJoystick.destroy();
      virtualJoystick = null;
    }
  }

  // Hide game over screen if visible
  if (gameOverScreen?.isVisible()) {
    gameOverScreen.hide();
  }

  // Show settings menu
  if (settingsMenu) {
    settingsMenu = new SimpleSettingsMenu(document.body, () => {
      const settings = settingsMenu.getSettings();
      (window as any).gameSettings = settings;
      initializeGame();
    });
  }
}

// Show settings menu on startup
settingsMenu = new SimpleSettingsMenu(document.body, () => {
  const settings = settingsMenu.getSettings();
  (window as any).gameSettings = settings;
  initializeGame();
});

// Global variables for UI state
let selectedTowerButton: HTMLButtonElement | null = null;
let playerUpgradeContainer: HTMLDivElement;
let updatePlayerUpgradePanel: () => void;

function setupGameHandlers() {
  // Create touch indicator for visual feedback
  const touchIndicator = new TouchIndicator(document.body);
  
  // Detect if device supports touch
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  
  // Skip TouchInputManager initialization - MobileControls in SimpleGameUI handles all touch input
  // This prevents conflicts between the two touch handling systems
  
  // Setup mouse event handlers for both desktop and touch
  canvas.addEventListener("mousedown", (e) => {
    if (gameInitialized) game.handleMouseDown(e);
  });

  canvas.addEventListener("mouseup", (e) => {
    if (gameInitialized) game.handleMouseUp(e);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (gameInitialized) game.handleMouseMove(e);
  });

  // Add touch UI indicators if on mobile
  if (isTouchDevice) {
    addTouchUIIndicators();
  }

  canvas.addEventListener("wheel", (e) => {
    if (gameInitialized) game.handleMouseWheel(e);
  });
}

function addTouchUIIndicators() {
  // Add visual indicators for touch interactions
  const touchHints = document.createElement("div");
  touchHints.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    text-align: center;
  `;
  const touchIcon = createSvgIcon(IconType.TOUCH, { size: 20 });
  touchHints.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px;">
      ${touchIcon}
      <span>Touch Controls Active</span>
    </div>
    <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
      Tap: Shoot • Hold & Drag: Continuous Shooting • Move: Virtual Joystick
    </div>
  `;
  document.body.appendChild(touchHints);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (touchHints.parentNode) {
      touchHints.style.opacity = "0";
      touchHints.style.transition = "opacity 1s ease";
      setTimeout(() => touchHints.remove(), 1000);
    }
  }, 5000);
}

// Add keyboard controls
document.addEventListener("keydown", (e) => {
  if (!gameInitialized) return;

  // Forward movement keys to game
  game.handleKeyDown(e.key);

  switch (e.key) {
    case " ":
      e.preventDefault();
      // Toggle pause/resume
      if (game.isPaused()) {
        game.resume();
      } else {
        game.pause();
      }
      break;
    case "Enter":
      e.preventDefault();
      if (game.isWaveComplete() && !game.isGameOver()) {
        game.startNextWave();
      }
      break;
    case "1":
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.BASIC);
      break;
    case "2":
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.SNIPER);
      break;
    case "3":
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.RAPID);
      break;
    case "4":
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.WALL);
      break;
    case "Escape":
      audioManager.playUISound(SoundType.DESELECT);
      if (selectedTowerButton) {
        selectedTowerButton.classList.remove("selected");
        selectedTowerButton = null;
      }
      game.setSelectedTowerType(null);
      break;
    case "q":
    case "Q":
      // Emergency audio stop
      audioManager.stopAllSounds();
      game.getAudioManager().stopAllSounds();
      break;
    case "u":
    case "U":
      // Toggle player upgrade panel
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (playerUpgradeContainer.style.display === "block") {
        playerUpgradeContainer.style.display = "none";
      } else {
        playerUpgradeContainer.style.display = "block";
        updatePlayerUpgradePanel();
      }
      break;
    case "e":
    case "E":
      // Toggle inventory
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      // Access inventory through the UI
      const inventoryPanel = (window as any).gameUI?.inventoryPanel;
      if (inventoryPanel) {
        inventoryPanel.toggle();
      }
      break;
    case "m":
    case "M":
      // Main menu (only when paused)
      if (game.isPaused()) {
        audioManager.playUISound(SoundType.BUTTON_CLICK);
        showMainMenu();
      }
      break;
    
    // Camera diagnostic shortcuts
    case "b":
    case "B":
      // Check camera status
      game.checkCamera();
      break;
      
    case "n":
    case "N":
      // Fix camera (enable following and center)
      game.fixCamera();
      break;
      
    case "v":
    case "V":
      // Toggle visual debug (only with Shift)
      if (e.shiftKey) {
        game.toggleVisualDebug();
      }
      break;
      
    case "d":
    case "D":
      // Debug camera (only with Shift)
      if (e.shiftKey) {
        game.debugCamera();
      }
      break;
  }
});

document.addEventListener("keyup", (e) => {
  if (!gameInitialized) return;

  // Forward movement keys to game
  game.handleKeyUp(e.key);
});

async function setupModernGameUI() {
  // Setup game handlers
  setupGameHandlers();

  // Use the simple UI system
  const ui = await setupGameUI({
    game,
    container: document.body,
    canvas,
    audioManager,
    showInstructions: true,
    enableTouch: "ontouchstart" in window,
    enableHapticFeedback: true,
    debugMode: false,
  });
}
