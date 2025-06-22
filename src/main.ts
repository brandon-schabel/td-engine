import { GameWithEvents } from "./core/GameWithEvents";
import { TowerType } from "./entities/Tower";
import { AudioManager, SoundType } from "./audio/AudioManager";
import { ANIMATION_CONFIG } from "./config/AnimationConfig";
import { RESPONSIVE_CONFIG, isMobile } from "./config/ResponsiveConfig";
import { injectResponsiveStyles } from "./ui/styles/generateResponsiveStyles";
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
import { TouchIndicator } from "./ui/components/game/TouchIndicator";
// Dialog components removed - using FloatingUIManager instead
// Dialog styles removed - using FloatingUIManager instead

// Inject responsive styles
injectResponsiveStyles();

// Get canvas element
let canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element not found");
}

// Global variables for game initialization
let game: GameWithEvents;
let gameInitialized = false;

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
      const isMobileDevice = isMobile(window.innerWidth) || "ontouchstart" in window;
      if (isMobileDevice) {
        const baseZoom = Math.min(width / 1200, height / 800) * RESPONSIVE_CONFIG.scaling.ui.mobile;
        camera.setZoom(Math.max(RESPONSIVE_CONFIG.scaling.game.minZoom, baseZoom));
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
  resizeTimeout = window.setTimeout(resizeCanvas, ANIMATION_CONFIG.durations.fast);
});
// Touch input is now handled within the SimpleGameUI
const audioManager = new AudioManager();

// Initialize game with settings
function initializeGame(preGameConfig?: any) {
  console.log('[initializeGame] Called with config:', preGameConfig);
  
  // Clear the game container and restore the original structure
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.innerHTML = `
      <div id="canvas-container">
        <canvas id="game-canvas"></canvas>
      </div>
      <div id="ui-container"></div>
      <div id="bottom-ui-container"></div>
    `;
  }

  // Get the newly created canvas element
  const newCanvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  if (!newCanvas) {
    throw new Error("Failed to create game canvas");
  }

  // Update the global canvas reference
  canvas = newCanvas;

  // Resize the new canvas
  resizeCanvas();

  // Use pre-game config if provided, otherwise use default settings
  let mapGenConfig: MapGenerationConfig;
  
  if (preGameConfig) {
    // Use the configuration from the pre-game dialog
    const sizePresets = {
      SMALL: { width: 20, height: 20 },
      MEDIUM: { width: 30, height: 30 },
      LARGE: { width: 40, height: 40 },
      HUGE: { width: 50, height: 50 }
    };
    
    const preset = sizePresets[preGameConfig.mapSize as keyof typeof sizePresets] || sizePresets.MEDIUM;
    
    mapGenConfig = {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: preGameConfig.biome,
      difficulty: preGameConfig.difficulty,
      seed: Date.now(),
      pathComplexity: 0.7,
      obstacleCount: Math.floor(preset.width * preset.height * 0.1),
      decorationLevel: DecorationLevel.DENSE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: 3,
      openAreaCount: 2,
      playerAdvantageSpots: 2,
    };
  } else {
    // Fallback to settings-based configuration
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

    mapGenConfig = {
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
  }

  // Create game instance with configuration
  console.log('[Main] Creating game with config:', mapGenConfig);
  game = new GameWithEvents(canvas, mapGenConfig);
  gameInitialized = true;

  //  @ts-ignore
  if (typeof window !== "undefined") {
    // Store game instance globally for debugging
    (window as any).game = game;
  }

  // Dialogs now use FloatingUIManager

  // Setup game end event listener
  document.addEventListener("gameEnd", handleGameEnd as EventListener);

  // Start the main game setup
  console.log('[initializeGame] Starting setupModernGameUI...');
  setupModernGameUI();
  console.log('[initializeGame] Complete');
}

function handleGameEnd(_event: Event) {
  // Game over UI is now handled by SimpleGameUI using FloatingUIManager
  // The SimpleGameUI listens for the gameEnd event and shows the GameOverUI
  // Event details (stats, victory, scoreEntry) are handled by SimpleGameUI
}

function showMainMenu() {
  // Clean up current game
  if (gameInitialized) {
    game.stop();
    gameInitialized = false;

    // Touch controls are cleaned up automatically by SimpleGameUI
  }

  // Clear the game container
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.innerHTML = '';
  }

  // Create a temporary canvas for the main menu background
  const menuCanvas = document.createElement('canvas');
  menuCanvas.width = window.innerWidth;
  menuCanvas.height = window.innerHeight;
  menuCanvas.style.position = 'absolute';
  menuCanvas.style.top = '0';
  menuCanvas.style.left = '0';
  menuCanvas.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
  gameContainer?.appendChild(menuCanvas);

  // Create temporary FloatingUIManager for main menu
  const camera = {
    worldToScreen: (pos: any) => pos,
    screenToWorld: (pos: any) => pos
  };

  import('@/ui/floating').then(({ FloatingUIManager }) => {
    const floatingUI = new FloatingUIManager(menuCanvas, camera as any);

    import('@/ui/floating/MainMenuUI').then(({ MainMenuUI }) => {
      const mainMenuUI = new MainMenuUI(floatingUI, audioManager);
      mainMenuUI.show({
        onStart: (config?: any) => {
          console.log('[Main] MainMenu onStart called with config:', config);
          
          try {
            // Clean up menu UI
            mainMenuUI.destroy();
            floatingUI.destroy();

            // Start the game with config if provided
            initializeGame(config);
          } catch (error) {
            console.error('[Main] Error starting game:', error);
          }
        },
        onSettings: () => {
          // Settings are handled in-game
          console.log('[Main] Settings requested from main menu');
        },
        onLeaderboard: () => {
          // Leaderboard not implemented yet
          console.log('[Main] Leaderboard requested from main menu');
        }
      });
    }).catch(error => {
      console.error('[Main] Failed to load MainMenuUI:', error);
      // Fallback to direct game start
      initializeGame();
    });
  }).catch(error => {
    console.error('[Main] Failed to load FloatingUIManager:', error);
    // Fallback to direct game start
    initializeGame();
  });

  // Settings are now handled in-game
}

// Show main menu on startup
showMainMenu();

// Debug: Make initializeGame available globally for testing
(window as any).initializeGame = initializeGame;

// Debug: Add keyboard shortcut to start game
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    (window as any).gameSettings = {
      difficulty: "NORMAL",
      masterVolume: 0.7,
      soundEnabled: true,
      visualQuality: "MEDIUM",
      showFPS: false,
      mapSize: "MEDIUM",
      terrain: "FOREST",
      pathComplexity: "SIMPLE"
    };
    initializeGame();
  }
});

// Global variables for UI state
let selectedTowerButton: HTMLButtonElement | null = null;
let playerUpgradeContainer: HTMLDivElement;
let updatePlayerUpgradePanel: () => void;

function setupGameHandlers() {
  // Create touch indicator for visual feedback
  new TouchIndicator(document.body);

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

  // Add touch event handlers for tower placement on mobile
  if (isTouchDevice) {
    let touchHandled = false;

    canvas.addEventListener("touchstart", (e) => {
      if (!gameInitialized) return;

      // Check if touch is in joystick area (bottom portion of screen)
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchY = touch.clientY - rect.top;
      const canvasHeight = rect.height;

      // If touch is in top 70% of screen and we have a selected tower, handle tower placement
      if (touchY < canvasHeight * 0.7 && game.getSelectedTowerType()) {
        e.preventDefault();
        touchHandled = true;

        // Convert touch to mouse event for tower placement
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });

        game.handleMouseDown(mouseEvent);

        // Haptic feedback on tower placement attempt
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      if (!gameInitialized || !touchHandled) return;

      e.preventDefault();
      touchHandled = false;

      // Convert to mouse up event
      const touch = e.changedTouches[0];
      const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
      });

      game.handleMouseUp(mouseEvent);
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      if (!gameInitialized || !game.getSelectedTowerType()) return;

      // Update tower ghost position during touch move
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchY = touch.clientY - rect.top;
      const canvasHeight = rect.height;

      // Only handle if in tower placement area
      if (touchY < canvasHeight * 0.7) {
        e.preventDefault();

        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });

        game.handleMouseMove(mouseEvent);
      }
    }, { passive: false });
  }

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
      Tap to place towers • Joysticks: Move & Aim
    </div>
  `;
  document.body.appendChild(touchHints);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (touchHints.parentNode) {
      touchHints.style.opacity = "0";
      touchHints.style.transition = "opacity 1s ease";
      setTimeout(() => touchHints.remove(), ANIMATION_CONFIG.durations.slowest);
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
      if (game.isWaveComplete() && !game.isGameOverPublic()) {
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
  console.log('[setupModernGameUI] Called, game:', game);
  
  // Setup game handlers
  setupGameHandlers();

  // Use the simple UI system
  await setupGameUI({
    game,
    container: document.body,
    canvas,
    audioManager,
    showInstructions: true,
    enableTouch: "ontouchstart" in window || isMobile(window.innerWidth),
    enableHapticFeedback: true,
    debugMode: false,
  });


  // Start the game
  console.log('[setupModernGameUI] Starting game.start()...');
  game.start();
  console.log('[setupModernGameUI] game.start() called');
}
