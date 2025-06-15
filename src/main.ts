import { GameWithEvents } from './core/GameWithEvents';
import { TowerType } from './entities/Tower';
import { UpgradeType } from './entities/Tower';
import { PlayerUpgradeType } from './entities/Player';
import { AudioManager, SoundType } from './audio/AudioManager';
import { SimpleSettingsMenu } from './ui/SimpleSettingsMenu';
// Touch input is handled within SimpleGameUI now
import { applySettingsToGame } from './config/SettingsIntegration';
import { MAP_SIZE_PRESETS, type MapGenerationConfig, BiomeType, MapDifficulty, DecorationLevel } from './types/MapData';
import { createSvgIcon, IconType } from './ui/icons/SvgIcons';
import { setupGameUI } from './ui/setupGameUI';
import { GameOverScreen } from './ui/components/GameOverScreen';

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
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
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Scale the drawing context for sharp rendering
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
    }
    
    // Update camera viewport if game exists
    if (gameInitialized && game) {
      const camera = game.getCamera();
      camera.updateViewport(width, height);
      
      // Adjust zoom based on screen size
      const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
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
window.addEventListener('resize', () => {
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
  const gameConfig = applySettingsToGame((window as any).gameSettings || {
    difficulty: 'NORMAL',
    masterVolume: 0.7,
    soundEnabled: true,
    visualQuality: 'MEDIUM',
    showFPS: false,
    mapSize: 'MEDIUM',
    terrain: 'FOREST',
    pathComplexity: 'SIMPLE'
  });
  
  // Convert to map generation config
  const mapGenConfig: MapGenerationConfig = {
    width: gameConfig.mapConfig.width,
    height: gameConfig.mapConfig.height,
    cellSize: gameConfig.mapConfig.cellSize,
    biome: gameConfig.mapConfig.biome.toUpperCase() as BiomeType,
    difficulty: MapDifficulty.MEDIUM,
    seed: Date.now(),
    pathComplexity: gameConfig.mapConfig.pathComplexity,
    obstacleCount: Math.floor(gameConfig.mapConfig.width * gameConfig.mapConfig.height * 0.1),
    decorationLevel: DecorationLevel.DENSE,
    enableWater: true,
    enableAnimations: true,
    chokePointCount: 3,
    openAreaCount: 2,
    playerAdvantageSpots: 2
  };
  
  // Create game instance with configuration
  game = new GameWithEvents(canvas, mapGenConfig);
  gameInitialized = true;
  
  // Create game over screen if not exists
  if (!gameOverScreen) {
    gameOverScreen = new GameOverScreen();
  }
  
  // Setup game end event listener
  document.addEventListener('gameEnd', handleGameEnd);
  
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
    onMainMenu: showMainMenu
  });
}

function showMainMenu() {
  // Clean up current game
  if (gameInitialized) {
    game.stop();
    gameInitialized = false;
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
  // Setup mouse event handlers for both desktop and touch
  canvas.addEventListener('mousedown', (e) => {
    if (gameInitialized) game.handleMouseDown(e);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (gameInitialized) game.handleMouseUp(e);
  });
  
  // Touch events are handled by the canvas natively
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameInitialized && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      game.handleMouseDown(mouseEvent);
    }
  });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameInitialized) {
      const mouseEvent = new MouseEvent('mouseup', { button: 0 });
      game.handleMouseUp(mouseEvent);
    }
  });
  
  // Detect if device supports touch and add indicators
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    addTouchUIIndicators();
  }

  canvas.addEventListener('mousemove', (e) => {
    if (gameInitialized) game.handleMouseMove(e);
  });

  canvas.addEventListener('wheel', (e) => {
    if (gameInitialized) game.handleMouseWheel(e);
  });
}

function handleVirtualControlEvent(event: any) {
  if (!gameInitialized) return;
  
  switch (event.type) {
    case 'joystick':
      if (event.action === 'move') {
        // Convert joystick input to WASD keys
        const { direction, magnitude } = event.data;
        if (magnitude > 0.1) {
          const angle = direction;
          const threshold = Math.PI / 4; // 45 degrees
          
          // Determine primary direction
          if (angle >= -threshold && angle <= threshold) {
            game.handleKeyDown('d'); // Right
          } else if (angle >= threshold && angle <= 3 * threshold) {
            game.handleKeyDown('s'); // Down
          } else if (angle >= 3 * threshold || angle <= -3 * threshold) {
            game.handleKeyDown('a'); // Left
          } else {
            game.handleKeyDown('w'); // Up
          }
        }
      }
      break;
      
    case 'button':
      switch (event.data.button) {
        case 'shoot':
          // Handle shooting button
          if (event.action === 'start') {
            // Simulate mouse down at center of screen for shooting
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: centerX,
              clientY: centerY,
              button: 0
            });
            Object.defineProperty(mouseEvent, 'offsetX', { value: centerX });
            Object.defineProperty(mouseEvent, 'offsetY', { value: centerY });
            game.handleMouseDown(mouseEvent);
          } else if (event.action === 'end') {
            const mouseEvent = new MouseEvent('mouseup', { button: 0 });
            game.handleMouseUp(mouseEvent);
          }
          break;
          
        case 'pause':
          if (game.isPaused()) {
            game.resume();
          } else {
            game.pause();
          }
          break;
      }
      break;
  }
}

function addTouchUIIndicators() {
  // Add visual indicators for touch interactions
  const touchHints = document.createElement('div');
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
      Tap: Select • Double Tap: Pause • Long Press: Info
    </div>
  `;
  document.body.appendChild(touchHints);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (touchHints.parentNode) {
      touchHints.style.opacity = '0';
      touchHints.style.transition = 'opacity 1s ease';
      setTimeout(() => touchHints.remove(), 1000);
    }
  }, 5000);
}

// Add keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameInitialized) return;
  
  // Forward movement keys to game
  game.handleKeyDown(e.key);
  
  switch (e.key) {
    case ' ':
      e.preventDefault();
      // Toggle pause/resume
      if (game.isPaused()) {
        game.resume();
      } else {
        game.pause();
      }
      break;
    case 'Enter':
      e.preventDefault();
      if (game.isWaveComplete() && !game.isGameOver()) {
        game.startNextWave();
      }
      break;
    case '1':
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.BASIC);
      break;
    case '2':
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.SNIPER);
      break;
    case '3':
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.RAPID);
      break;
    case '4':
      audioManager.playUISound(SoundType.SELECT);
      game.setSelectedTowerType(TowerType.WALL);
      break;
    case 'Escape':
      audioManager.playUISound(SoundType.DESELECT);
      if (selectedTowerButton) {
        selectedTowerButton.classList.remove('selected');
        selectedTowerButton = null;
      }
      game.setSelectedTowerType(null);
      break;
    case 'q':
    case 'Q':
      // Emergency audio stop
      audioManager.stopAllSounds();
      game.getAudioManager().stopAllSounds();
      break;
    case 'u':
    case 'U':
      // Toggle player upgrade panel
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (playerUpgradeContainer.style.display === 'block') {
        playerUpgradeContainer.style.display = 'none';
      } else {
        playerUpgradeContainer.style.display = 'block';
        updatePlayerUpgradePanel();
      }
      break;
    case 'e':
    case 'E':
      // Toggle inventory
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      // Access inventory through the UI
      const inventoryPanel = (window as any).gameUI?.inventoryPanel;
      if (inventoryPanel) {
        inventoryPanel.toggle();
      }
      break;
    case 'm':
    case 'M':
      // Main menu (only when paused)
      if (game.isPaused()) {
        audioManager.playUISound(SoundType.BUTTON_CLICK);
        showMainMenu();
      }
      break;
  }
});

document.addEventListener('keyup', (e) => {
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
    enableTouch: 'ontouchstart' in window,
    enableHapticFeedback: true,
    debugMode: false
  });
  
  // UI reference is stored globally by setupGameUI
  
  // Legacy UI code below (disabled)
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
  // Add control instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 1000;
    pointer-events: none;
  `;
  const keyboardIcon = createSvgIcon(IconType.KEYBOARD, { size: 16 });
  const mouseIcon = createSvgIcon(IconType.MOUSE, { size: 16 });
  instructions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
      ${keyboardIcon}
      <strong>Controls:</strong>
    </div>
    <div>WASD/Arrows - Move Player</div>
    <div>U - Toggle Player Upgrades</div>
    <div>1 - Basic Tower ($20)</div>
    <div>2 - Sniper Tower ($50)</div>
    <div>3 - Rapid Tower ($30)</div>
    <div>4 - Wall ($10)</div>
    <div>Enter - Start Next Wave</div>
    <div>Space - Pause/Resume</div>
    <div>ESC - Cancel Selection</div>
    <div>Q - Stop All Audio</div>
    <div style="margin-top: 6px; color: #4CAF50;">
      <strong>Camera/Zoom:</strong>
    </div>
    <div>+/- - Zoom In/Out</div>
    <div>0 - Reset Zoom</div>
    <div>F - Fit to Screen</div>
    <div>C - Toggle Follow Player</div>
    <div style="margin-top: 8px; font-size: 12px; color: #FFD700; display: flex; align-items: center; gap: 6px;">
      ${mouseIcon}
      <strong>Mouse wheel to zoom • Click audio icon for settings</strong>
    </div>
  `;
  gameContainer.appendChild(instructions);

  // Create main menu panel
  const mainMenuPanel = document.createElement('div');
  mainMenuPanel.className = 'ui-panel';
  mainMenuPanel.style.cssText = `
    bottom: 12px;
    left: 12px;
    min-width: 200px;
  `;

  // Create collapsible header
  const menuHeader = document.createElement('div');
  menuHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
  `;

  const menuTitle = document.createElement('div');
  menuTitle.textContent = 'Build Menu';
  menuTitle.style.cssText = 'font-weight: bold; color: #4CAF50;';

  const collapseButton = document.createElement('button');
  collapseButton.className = 'ui-button icon-only';
  collapseButton.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #4CAF50;
    color: #4CAF50;
  `;
  const collapseIcon = createSvgIcon(IconType.COLLAPSE, { size: 16 });
  collapseButton.innerHTML = collapseIcon;

  menuHeader.appendChild(menuTitle);
  menuHeader.appendChild(collapseButton);
  mainMenuPanel.appendChild(menuHeader);

  // Create collapsible content container
  const menuContent = document.createElement('div');
  menuContent.style.cssText = 'overflow: hidden; transition: max-height 0.3s ease-out;';
  menuContent.style.maxHeight = '500px';

  // Tower building section
  const towerSectionTitle = document.createElement('div');
  towerSectionTitle.textContent = 'Build Towers';
  towerSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #4CAF50;';
  menuContent.appendChild(towerSectionTitle);

  const towerButtonRow = document.createElement('div');
  towerButtonRow.className = 'button-row';

  const createTowerButton = (name: string, type: TowerType, cost: number) => {
    const button = document.createElement('button');
    button.className = 'ui-button tower-button has-icon';
    
    // Map tower types to icons
    const iconMap: Record<TowerType, IconType> = {
      [TowerType.BASIC]: IconType.BASIC_TOWER,
      [TowerType.SNIPER]: IconType.SNIPER_TOWER,
      [TowerType.RAPID]: IconType.RAPID_TOWER,
      [TowerType.WALL]: IconType.WALL
    };
    
    const icon = createSvgIcon(iconMap[type], { size: 20 });
    button.innerHTML = `${icon}<span class="button-text">${name}<br>$${cost}</span>`;
    button.style.minWidth = '60px';
    button.style.height = '45px';
    button.style.fontSize = '10px';
    
    button.addEventListener('click', () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      // Update selection state
      if (selectedTowerButton) {
        selectedTowerButton.classList.remove('selected');
      }
      
      if (selectedTowerButton === button) {
        // Deselect if clicking the same button
        selectedTowerButton = null;
        game.setSelectedTowerType(null);
        audioManager.playUISound(SoundType.DESELECT);
      } else {
        // Select new tower type
        selectedTowerButton = button;
        button.classList.add('selected');
        game.setSelectedTowerType(type);
        audioManager.playUISound(SoundType.SELECT);
      }
    });
    
    return button;
  };

  const basicTowerBtn = createTowerButton('Basic', TowerType.BASIC, 20);
  const sniperTowerBtn = createTowerButton('Sniper', TowerType.SNIPER, 50);
  const rapidTowerBtn = createTowerButton('Rapid', TowerType.RAPID, 30);

  towerButtonRow.appendChild(basicTowerBtn);
  towerButtonRow.appendChild(sniperTowerBtn);
  towerButtonRow.appendChild(rapidTowerBtn);
  menuContent.appendChild(towerButtonRow);

  // Cancel selection button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'ui-button close-button has-icon';
  const cancelIcon = createSvgIcon(IconType.CANCEL, { size: 16 });
  cancelButton.innerHTML = `${cancelIcon}<span class="button-text">Cancel (ESC)</span>`;
  cancelButton.style.width = '100%';
  cancelButton.style.marginBottom = '8px';
  cancelButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (selectedTowerButton) {
      selectedTowerButton.classList.remove('selected');
      selectedTowerButton = null;
    }
    game.setSelectedTowerType(null);
    audioManager.playUISound(SoundType.DESELECT);
  });
  menuContent.appendChild(cancelButton);

  // Game actions section
  const actionSectionTitle = document.createElement('div');
  actionSectionTitle.textContent = 'Game Actions';
  actionSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #2196F3; margin-top: 12px;';
  menuContent.appendChild(actionSectionTitle);

  const actionButtonRow = document.createElement('div');
  actionButtonRow.className = 'button-row';

  // Start wave button
  const startWaveButton = document.createElement('button');
  startWaveButton.className = 'ui-button action-button has-icon';
  const playIcon = createSvgIcon(IconType.PLAY, { size: 20 });
  startWaveButton.innerHTML = `${playIcon}<span class="button-text">Start<br>Wave</span>`;
  startWaveButton.style.flex = '1';
  startWaveButton.style.height = '45px';
  startWaveButton.style.fontSize = '10px';
  startWaveButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (game.isWaveComplete() && !game.isGameOver()) {
      game.startNextWave();
    }
  });
  actionButtonRow.appendChild(startWaveButton);

  // Player upgrades button
  const playerUpgradeButton = document.createElement('button');
  playerUpgradeButton.className = 'ui-button upgrade-button has-icon';
  const playerIcon = createSvgIcon(IconType.PLAYER, { size: 20 });
  playerUpgradeButton.innerHTML = `${playerIcon}<span class="button-text">Player<br>Upgrades</span>`;
  playerUpgradeButton.style.flex = '1';
  playerUpgradeButton.style.height = '45px';
  playerUpgradeButton.style.fontSize = '10px';
  playerUpgradeButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    playerUpgradeContainer.style.display = 'block';
    updatePlayerUpgradePanel();
  });
  actionButtonRow.appendChild(playerUpgradeButton);

  menuContent.appendChild(actionButtonRow);
  mainMenuPanel.appendChild(menuContent);

  // Toggle collapse functionality
  let isCollapsed = false;
  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      menuContent.style.maxHeight = '0';
      const expandIcon = createSvgIcon(IconType.EXPAND, { size: 16 });
      collapseButton.innerHTML = expandIcon;
      mainMenuPanel.style.minWidth = '120px';
    } else {
      menuContent.style.maxHeight = '500px';
      const collapseIcon = createSvgIcon(IconType.COLLAPSE, { size: 16 });
      collapseButton.innerHTML = collapseIcon;
      mainMenuPanel.style.minWidth = '200px';
    }
  };

  menuHeader.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    toggleCollapse();
  });

  gameContainer.appendChild(mainMenuPanel);

  // Update tower button affordability
  const updateTowerButtons = () => {
    basicTowerBtn.disabled = !game.canAffordTower(TowerType.BASIC);
    sniperTowerBtn.disabled = !game.canAffordTower(TowerType.SNIPER);
    rapidTowerBtn.disabled = !game.canAffordTower(TowerType.RAPID);
    
    startWaveButton.disabled = !game.isWaveComplete() || game.isGameOver();
  };

  // Add upgrade panel
  const upgradeContainer = document.createElement('div');
  upgradeContainer.className = 'ui-panel';
  upgradeContainer.style.cssText = `
    top: 150px;
    right: 12px;
    display: none;
    min-width: 200px;
  `;
  upgradeContainer.id = 'upgrade-panel';

  const createUpgradeButton = (_name: string, type: UpgradeType) => {
    const button = document.createElement('button');
    button.className = 'ui-button tower-button has-icon';
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 5px 0;
      font-size: 11px;
    `;
    
    let upgrading = false; // Prevent double-clicks
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      if (upgrading || button.disabled) {
        audioManager.playUISound(SoundType.ERROR);
        return;
      }
      
      const selectedTower = game.getSelectedTower();
      if (selectedTower) {
        upgrading = true;
        const success = game.upgradeTower(selectedTower, type);
        
        if (success) {
          updateUpgradePanel(); // Refresh the panel
        } else {
          audioManager.playUISound(SoundType.ERROR);
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          upgrading = false;
        }, 100);
      }
    });
    return button;
  };

  const damageUpgradeBtn = createUpgradeButton('Upgrade Damage', UpgradeType.DAMAGE);
  const rangeUpgradeBtn = createUpgradeButton('Upgrade Range', UpgradeType.RANGE);
  const fireRateUpgradeBtn = createUpgradeButton('Upgrade Fire Rate', UpgradeType.FIRE_RATE);

  upgradeContainer.appendChild(damageUpgradeBtn);
  upgradeContainer.appendChild(rangeUpgradeBtn);
  upgradeContainer.appendChild(fireRateUpgradeBtn);

  const closeUpgradeBtn = document.createElement('button');
  closeUpgradeBtn.className = 'ui-button close-button has-icon';
  const closeIcon = createSvgIcon(IconType.CLOSE, { size: 14 });
  closeUpgradeBtn.innerHTML = `${closeIcon}<span class="button-text">Close</span>`;
  closeUpgradeBtn.style.cssText = `
    display: block;
    width: 100%;
    margin: 10px 0 5px 0;
    font-size: 11px;
  `;
  closeUpgradeBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    upgradeContainer.style.display = 'none';
  });
  upgradeContainer.appendChild(closeUpgradeBtn);

  gameContainer.appendChild(upgradeContainer);

  // Add player upgrade panel (initially hidden)
  playerUpgradeContainer = document.createElement('div');
  playerUpgradeContainer.className = 'ui-panel';
  playerUpgradeContainer.style.cssText = `
    top: 200px;
    left: 12px;
    display: none;
    min-width: 180px;
  `;
  playerUpgradeContainer.id = 'player-upgrade-panel';

  const createPlayerUpgradeButton = (_name: string, type: PlayerUpgradeType) => {
    const button = document.createElement('button');
    button.className = 'ui-button action-button has-icon';
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 3px 0;
      font-size: 10px;
    `;
    
    let upgrading = false; // Prevent double-clicks
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      if (upgrading || button.disabled) {
        audioManager.playUISound(SoundType.ERROR);
        return;
      }
      
      upgrading = true;
      const success = game.upgradePlayer(type);
      
      if (success) {
        updatePlayerUpgradePanel(); // Refresh the panel
      } else {
        audioManager.playUISound(SoundType.ERROR);
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        upgrading = false;
      }, 100);
    });
    return button;
  };

  const playerDamageUpgradeBtn = createPlayerUpgradeButton('Damage', PlayerUpgradeType.DAMAGE);
  const playerSpeedUpgradeBtn = createPlayerUpgradeButton('Speed', PlayerUpgradeType.SPEED);
  const playerFireRateUpgradeBtn = createPlayerUpgradeButton('Fire Rate', PlayerUpgradeType.FIRE_RATE);
  const playerHealthUpgradeBtn = createPlayerUpgradeButton('Health', PlayerUpgradeType.HEALTH);

  const playerTitle = document.createElement('div');
  playerTitle.textContent = 'Player Upgrades';
  playerTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #4CAF50;';

  const closePlayerUpgradeBtn = document.createElement('button');
  closePlayerUpgradeBtn.className = 'ui-button close-button has-icon';
  const closePlayerIcon = createSvgIcon(IconType.CLOSE, { size: 14 });
  closePlayerUpgradeBtn.innerHTML = `${closePlayerIcon}<span class="button-text">Close</span>`;
  closePlayerUpgradeBtn.style.cssText = `
    display: block;
    width: 100%;
    margin: 10px 0 5px 0;
    font-size: 10px;
  `;
  closePlayerUpgradeBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    playerUpgradeContainer.style.display = 'none';
  });

  playerUpgradeContainer.appendChild(playerTitle);
  playerUpgradeContainer.appendChild(playerDamageUpgradeBtn);
  playerUpgradeContainer.appendChild(playerSpeedUpgradeBtn);
  playerUpgradeContainer.appendChild(playerFireRateUpgradeBtn);
  playerUpgradeContainer.appendChild(playerHealthUpgradeBtn);
  playerUpgradeContainer.appendChild(closePlayerUpgradeBtn);

  gameContainer.appendChild(playerUpgradeContainer);

  // Add compact audio button
  const audioButton = document.createElement('button');
  audioButton.className = 'ui-button icon-only';
  audioButton.style.cssText = `
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #FFD700;
    color: #FFD700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
  `;
  const audioIcon = createSvgIcon(IconType.AUDIO_ON, { size: 20 });
  audioButton.innerHTML = audioIcon;
  audioButton.title = 'Audio Settings';

  // Create expandable audio panel (initially hidden)
  const audioControlsPanel = document.createElement('div');
  audioControlsPanel.className = 'ui-panel';
  audioControlsPanel.style.cssText = `
    bottom: 60px;
    right: 12px;
    min-width: 150px;
    font-size: 12px;
    display: none;
    z-index: 1000;
  `;

  const audioTitle = document.createElement('div');
  audioTitle.textContent = 'Audio Settings';
  audioTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #FFD700;';
  audioControlsPanel.appendChild(audioTitle);

  // Volume slider
  const volumeContainer = document.createElement('div');
  volumeContainer.style.marginBottom = '8px';
  
  const volumeLabel = document.createElement('label');
  volumeLabel.textContent = 'Volume: ';
  volumeLabel.style.display = 'block';
  volumeLabel.style.marginBottom = '4px';

  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.value = '30';
  volumeSlider.style.width = '100%';
  
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseInt((e.target as HTMLInputElement).value) / 100;
    audioManager.setMasterVolume(volume);
    game.getAudioManager().setMasterVolume(volume);
  });

  volumeContainer.appendChild(volumeLabel);
  volumeContainer.appendChild(volumeSlider);
  audioControlsPanel.appendChild(volumeContainer);

  // Mute toggle
  const muteButton = document.createElement('button');
  muteButton.className = 'ui-button close-button';
  muteButton.textContent = 'Mute';
  muteButton.style.width = '100%';
  muteButton.style.fontSize = '10px';
  
  let isMuted = false;
  muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    audioManager.setEnabled(!isMuted);
    game.getAudioManager().setEnabled(!isMuted);
    muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    volumeSlider.disabled = isMuted;
    // Update audio button icon
    const newIcon = createSvgIcon(isMuted ? IconType.AUDIO_OFF : IconType.AUDIO_ON, { size: 20 });
    audioButton.innerHTML = newIcon;
  });

  // Close button for audio panel
  const closeAudioPanelButton = document.createElement('button');
  closeAudioPanelButton.className = 'ui-button close-button has-icon';
  const closeAudioIcon = createSvgIcon(IconType.CLOSE, { size: 14 });
  closeAudioPanelButton.innerHTML = `${closeAudioIcon}<span class="button-text">Close</span>`;
  closeAudioPanelButton.style.cssText = `
    width: 100%;
    margin-top: 8px;
    font-size: 10px;
  `;
  closeAudioPanelButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    audioControlsPanel.style.display = 'none';
  });

  audioControlsPanel.appendChild(muteButton);
  audioControlsPanel.appendChild(closeAudioPanelButton);

  // Toggle audio panel when button is clicked
  audioButton.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    const isVisible = audioControlsPanel.style.display === 'block';
    audioControlsPanel.style.display = isVisible ? 'none' : 'block';
  });

  // Close audio panel when clicking outside
  document.addEventListener('click', (e) => {
    if (audioControlsPanel.style.display === 'block' && 
        !audioControlsPanel.contains(e.target as Node) && 
        !audioButton.contains(e.target as Node)) {
      audioControlsPanel.style.display = 'none';
    }
  });

  // Prevent clicks inside the panel from closing it
  audioControlsPanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  gameContainer.appendChild(audioButton);
  gameContainer.appendChild(audioControlsPanel);

  // Function to update upgrade panel
  function updateUpgradePanel() {
    const selectedTower = game.getSelectedTower();
    if (selectedTower) {
      upgradeContainer.style.display = 'block';
      
      // Update damage button
      const damageCost = game.getUpgradeCost(selectedTower, UpgradeType.DAMAGE);
      const damageLevel = selectedTower.getUpgradeLevel(UpgradeType.DAMAGE);
      const canUpgradeDamage = selectedTower.canUpgrade(UpgradeType.DAMAGE) && game.canAffordUpgrade(selectedTower, UpgradeType.DAMAGE);
      
      const damageIcon = createSvgIcon(IconType.DAMAGE, { size: 16 });
      damageUpgradeBtn.innerHTML = `${damageIcon}<span class="button-text">Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})</span>`;
      damageUpgradeBtn.style.background = canUpgradeDamage ? '#4CAF50' : '#666';
      damageUpgradeBtn.disabled = !canUpgradeDamage;
      
      // Update range button
      const rangeCost = game.getUpgradeCost(selectedTower, UpgradeType.RANGE);
      const rangeLevel = selectedTower.getUpgradeLevel(UpgradeType.RANGE);
      const canUpgradeRange = selectedTower.canUpgrade(UpgradeType.RANGE) && game.canAffordUpgrade(selectedTower, UpgradeType.RANGE);
      
      const rangeIcon = createSvgIcon(IconType.RANGE, { size: 16 });
      rangeUpgradeBtn.innerHTML = `${rangeIcon}<span class="button-text">Range Lv.${rangeLevel}/5 (${rangeCost > 0 ? `$${rangeCost}` : 'MAX'})</span>`;
      rangeUpgradeBtn.style.background = canUpgradeRange ? '#4CAF50' : '#666';
      rangeUpgradeBtn.disabled = !canUpgradeRange;
      
      // Update fire rate button
      const fireRateCost = game.getUpgradeCost(selectedTower, UpgradeType.FIRE_RATE);
      const fireRateLevel = selectedTower.getUpgradeLevel(UpgradeType.FIRE_RATE);
      const canUpgradeFireRate = selectedTower.canUpgrade(UpgradeType.FIRE_RATE) && game.canAffordUpgrade(selectedTower, UpgradeType.FIRE_RATE);
      
      const fireRateIcon = createSvgIcon(IconType.FIRE_RATE, { size: 16 });
      fireRateUpgradeBtn.innerHTML = `${fireRateIcon}<span class="button-text">Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})</span>`;
      fireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#4CAF50' : '#666';
      fireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    } else {
      upgradeContainer.style.display = 'none';
    }
  }

  // Function to update player upgrade panel
  updatePlayerUpgradePanel = function() {
    // Only update if panel is visible
    if (playerUpgradeContainer.style.display !== 'block') {
      return;
    }
    
    const player = game.getPlayer();
    
    // Update damage button
    const damageCost = game.getPlayerUpgradeCost(PlayerUpgradeType.DAMAGE);
    const damageLevel = player.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const canUpgradeDamage = player.canUpgrade(PlayerUpgradeType.DAMAGE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.DAMAGE);
    
    const playerDamageIcon = createSvgIcon(IconType.DAMAGE, { size: 16 });
    playerDamageUpgradeBtn.innerHTML = `${playerDamageIcon}<span class="button-text">Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})</span>`;
    playerDamageUpgradeBtn.style.background = canUpgradeDamage ? '#2196F3' : '#666';
    playerDamageUpgradeBtn.disabled = !canUpgradeDamage;
    
    // Update speed button
    const speedCost = game.getPlayerUpgradeCost(PlayerUpgradeType.SPEED);
    const speedLevel = player.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const canUpgradeSpeed = player.canUpgrade(PlayerUpgradeType.SPEED) && game.canAffordPlayerUpgrade(PlayerUpgradeType.SPEED);
    
    const speedIcon = createSvgIcon(IconType.SPEED, { size: 16 });
    playerSpeedUpgradeBtn.innerHTML = `${speedIcon}<span class="button-text">Speed Lv.${speedLevel}/5 (${speedCost > 0 ? `$${speedCost}` : 'MAX'})</span>`;
    playerSpeedUpgradeBtn.style.background = canUpgradeSpeed ? '#2196F3' : '#666';
    playerSpeedUpgradeBtn.disabled = !canUpgradeSpeed;
    
    // Update fire rate button
    const fireRateCost = game.getPlayerUpgradeCost(PlayerUpgradeType.FIRE_RATE);
    const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const canUpgradeFireRate = player.canUpgrade(PlayerUpgradeType.FIRE_RATE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.FIRE_RATE);
    
    const playerFireRateIcon = createSvgIcon(IconType.FIRE_RATE, { size: 16 });
    playerFireRateUpgradeBtn.innerHTML = `${playerFireRateIcon}<span class="button-text">Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})</span>`;
    playerFireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#2196F3' : '#666';
    playerFireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    
    // Update health button
    const healthCost = game.getPlayerUpgradeCost(PlayerUpgradeType.HEALTH);
    const healthLevel = player.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const canUpgradeHealth = player.canUpgrade(PlayerUpgradeType.HEALTH) && game.canAffordPlayerUpgrade(PlayerUpgradeType.HEALTH);
    
    const healthIcon = createSvgIcon(IconType.HEALTH, { size: 16 });
    playerHealthUpgradeBtn.innerHTML = `${healthIcon}<span class="button-text">Health Lv.${healthLevel}/5 (${healthCost > 0 ? `$${healthCost}` : 'MAX'})</span>`;
    playerHealthUpgradeBtn.style.background = canUpgradeHealth ? '#2196F3' : '#666';
    playerHealthUpgradeBtn.disabled = !canUpgradeHealth;
  };

  // Update upgrade panels and buttons periodically
  setInterval(() => {
    updateUpgradePanel();
    updatePlayerUpgradePanel();
    updateTowerButtons();
  }, 100);
  }
  
}