import { Game } from './core/Game';
import { TowerType } from './entities/Tower';
import { UpgradeType } from './entities/Tower';
import { PlayerUpgradeType } from './entities/Player';
import { AudioManager, SoundType } from './audio/AudioManager';
import { ConfigurationMenu } from './ui/ConfigurationMenu';
import { TouchInputSystem } from './ui/core/TouchInputSystem';
import type { GameConfiguration, MapConfiguration } from './config/GameConfiguration';
import { MAP_SIZE_PRESETS, type MapGenerationConfig, BiomeType, MapDifficulty } from './types/MapData';

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Set canvas size - viewport window into larger world
canvas.width = 1200;
canvas.height = 800;

// Global variables for game initialization
let game: Game;
let gameInitialized = false;
let touchInputSystem: TouchInputSystem | null = null;
const audioManager = new AudioManager();

// Convert MapConfiguration to MapGenerationConfig
function convertMapConfiguration(mapConfig: MapConfiguration): MapGenerationConfig {
  const preset = MAP_SIZE_PRESETS[mapConfig.size];
  if (!preset) {
    throw new Error(`Invalid map size: ${mapConfig.size}`);
  }

  // Use custom size if provided, otherwise use preset
  const width = mapConfig.customSize?.width ?? preset.width;
  const height = mapConfig.customSize?.height ?? preset.height;

  // Convert biome (handle 'RANDOM' case)
  let biome: BiomeType;
  if (mapConfig.biome === 'RANDOM') {
    const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
    biome = biomes[Math.floor(Math.random() * biomes.length)] ?? BiomeType.FOREST;
  } else {
    biome = mapConfig.biome;
  }

  return {
    width,
    height,
    cellSize: 20, // Standard cell size
    biome,
    difficulty: MapDifficulty.MEDIUM, // Default difficulty
    seed: mapConfig.seed,
    pathComplexity: mapConfig.pathComplexity,
    obstacleCount: Math.floor(width * height * mapConfig.obstacleCountMultiplier * 0.1),
    decorationLevel: mapConfig.decorationLevel,
    enableWater: mapConfig.enableWater,
    enableAnimations: mapConfig.enableAnimations,
    chokePointCount: Math.floor(mapConfig.chokePointMultiplier * 3),
    openAreaCount: Math.floor(mapConfig.openAreaMultiplier * 2),
    playerAdvantageSpots: Math.floor(mapConfig.advantageSpotMultiplier * 2)
  };
}

// Initialize configuration menu first
function initializeGame(config: GameConfiguration) {
  // Convert MapConfiguration to MapGenerationConfig
  const mapGenConfig = convertMapConfiguration(config.mapSettings);
  
  // Create game instance with configuration
  game = new Game(canvas, mapGenConfig);
  gameInitialized = true;
  
  // Start the main game setup
  setupGameUI();
}

// Show configuration menu on startup
const configMenu = new ConfigurationMenu(initializeGame);
configMenu.show();

// Global variables for UI state
let selectedTowerButton: HTMLButtonElement | null = null;
let playerUpgradeContainer: HTMLDivElement;
let updatePlayerUpgradePanel: () => void;

function setupGameHandlers() {
  // Detect if device supports touch
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    // Initialize TouchInputSystem for touch devices
    touchInputSystem = new TouchInputSystem({
      canvas,
      game,
      enableVirtualControls: true,
      enableGestures: true,
      hapticFeedback: true
    });
    
    // Handle virtual control events
    touchInputSystem.on('virtualcontrol', (event) => {
      handleVirtualControlEvent(event);
    });
    
    // Handle touch gestures
    touchInputSystem.on('tap', (event) => {
      audioManager.playUISound(SoundType.SELECT);
    });
    
    touchInputSystem.on('doubletap', (event) => {
      // Double tap to pause/resume
      if (game.isPaused()) {
        game.resume();
      } else {
        game.pause();
      }
    });
    
    touchInputSystem.on('press', (event) => {
      // Long press for special actions (e.g., tower info)
      audioManager.playUISound(SoundType.HOVER);
    });
    
    // Add touch-friendly UI indicators
    addTouchUIIndicators();
    
  } else {
    // Fallback to traditional mouse events for desktop
    canvas.addEventListener('mousedown', (e) => {
      if (gameInitialized) game.handleMouseDown(e);
    });

    canvas.addEventListener('mouseup', (e) => {
      if (gameInitialized) game.handleMouseUp(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (gameInitialized) game.handleMouseMove(e);
    });
  }
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
  touchHints.innerHTML = `
    <div>📱 Touch Controls Active</div>
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
  }
});

document.addEventListener('keyup', (e) => {
  if (!gameInitialized) return;
  
  // Forward movement keys to game
  game.handleKeyUp(e.key);
});

// Listen for player clicks (temporarily disabled)
// document.addEventListener('playerClicked', () => {
//   playerUpgradeContainer.style.display = 'block';
//   updatePlayerUpgradePanel();
// });

function setupGameUI() {
  // Setup game handlers
  setupGameHandlers();
  
  // Create UI elements
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
  instructions.innerHTML = `
    <div><strong>Controls:</strong></div>
    <div>WASD/Arrows - Move Player</div>
    <div>U - Toggle Player Upgrades</div>
    <div>1 - Basic Tower ($20)</div>
    <div>2 - Sniper Tower ($50)</div>
    <div>3 - Rapid Tower ($30)</div>
    <div>Enter - Start Next Wave</div>
    <div>Space - Pause/Resume</div>
    <div>ESC - Cancel Selection</div>
    <div>Q - Stop All Audio</div>
    <div style="margin-top: 8px; font-size: 12px; color: #FFD700;">
      <strong>🔊 Click audio icon for settings</strong>
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

  // Tower building section
  const towerSectionTitle = document.createElement('div');
  towerSectionTitle.textContent = 'Build Towers';
  towerSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #4CAF50;';
  mainMenuPanel.appendChild(towerSectionTitle);

  const towerButtonRow = document.createElement('div');
  towerButtonRow.className = 'button-row';

  const createTowerButton = (name: string, type: TowerType, cost: number) => {
    const button = document.createElement('button');
    button.className = 'ui-button tower-button';
    button.textContent = `${name}\n$${cost}`;
    button.style.minWidth = '60px';
    button.style.height = '45px';
    button.style.whiteSpace = 'pre-line';
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
  mainMenuPanel.appendChild(towerButtonRow);

  // Cancel selection button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'ui-button close-button';
  cancelButton.textContent = 'Cancel (ESC)';
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
  mainMenuPanel.appendChild(cancelButton);

  // Game actions section
  const actionSectionTitle = document.createElement('div');
  actionSectionTitle.textContent = 'Game Actions';
  actionSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #2196F3; margin-top: 12px;';
  mainMenuPanel.appendChild(actionSectionTitle);

  const actionButtonRow = document.createElement('div');
  actionButtonRow.className = 'button-row';

  // Start wave button
  const startWaveButton = document.createElement('button');
  startWaveButton.className = 'ui-button action-button';
  startWaveButton.textContent = 'Start\nWave';
  startWaveButton.style.flex = '1';
  startWaveButton.style.whiteSpace = 'pre-line';
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
  playerUpgradeButton.className = 'ui-button upgrade-button';
  playerUpgradeButton.textContent = 'Player\nUpgrades';
  playerUpgradeButton.style.flex = '1';
  playerUpgradeButton.style.whiteSpace = 'pre-line';
  playerUpgradeButton.style.height = '45px';
  playerUpgradeButton.style.fontSize = '10px';
  playerUpgradeButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    playerUpgradeContainer.style.display = 'block';
    updatePlayerUpgradePanel();
  });
  actionButtonRow.appendChild(playerUpgradeButton);

  mainMenuPanel.appendChild(actionButtonRow);

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
    button.className = 'ui-button tower-button';
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
  closeUpgradeBtn.className = 'ui-button close-button';
  closeUpgradeBtn.textContent = 'Close';
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
    button.className = 'ui-button action-button';
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
  closePlayerUpgradeBtn.className = 'ui-button close-button';
  closePlayerUpgradeBtn.textContent = 'Close';
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
  audioButton.className = 'ui-button';
  audioButton.style.cssText = `
    position: absolute;
    top: 12px;
    left: 12px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 16px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #FFD700;
    color: #FFD700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
  `;
  audioButton.textContent = '🔊';
  audioButton.title = 'Audio Settings';

  // Create expandable audio panel (initially hidden)
  const audioControlsPanel = document.createElement('div');
  audioControlsPanel.className = 'ui-panel';
  audioControlsPanel.style.cssText = `
    top: 60px;
    left: 12px;
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
    audioButton.textContent = isMuted ? '🔇' : '🔊';
  });

  // Close button for audio panel
  const closeAudioPanelButton = document.createElement('button');
  closeAudioPanelButton.className = 'ui-button close-button';
  closeAudioPanelButton.textContent = 'Close';
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
      
      damageUpgradeBtn.textContent = `Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})`;
      damageUpgradeBtn.style.background = canUpgradeDamage ? '#4CAF50' : '#666';
      damageUpgradeBtn.disabled = !canUpgradeDamage;
      
      // Update range button
      const rangeCost = game.getUpgradeCost(selectedTower, UpgradeType.RANGE);
      const rangeLevel = selectedTower.getUpgradeLevel(UpgradeType.RANGE);
      const canUpgradeRange = selectedTower.canUpgrade(UpgradeType.RANGE) && game.canAffordUpgrade(selectedTower, UpgradeType.RANGE);
      
      rangeUpgradeBtn.textContent = `Range Lv.${rangeLevel}/5 (${rangeCost > 0 ? `$${rangeCost}` : 'MAX'})`;
      rangeUpgradeBtn.style.background = canUpgradeRange ? '#4CAF50' : '#666';
      rangeUpgradeBtn.disabled = !canUpgradeRange;
      
      // Update fire rate button
      const fireRateCost = game.getUpgradeCost(selectedTower, UpgradeType.FIRE_RATE);
      const fireRateLevel = selectedTower.getUpgradeLevel(UpgradeType.FIRE_RATE);
      const canUpgradeFireRate = selectedTower.canUpgrade(UpgradeType.FIRE_RATE) && game.canAffordUpgrade(selectedTower, UpgradeType.FIRE_RATE);
      
      fireRateUpgradeBtn.textContent = `Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})`;
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
    
    playerDamageUpgradeBtn.textContent = `Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})`;
    playerDamageUpgradeBtn.style.background = canUpgradeDamage ? '#2196F3' : '#666';
    playerDamageUpgradeBtn.disabled = !canUpgradeDamage;
    
    // Update speed button
    const speedCost = game.getPlayerUpgradeCost(PlayerUpgradeType.SPEED);
    const speedLevel = player.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const canUpgradeSpeed = player.canUpgrade(PlayerUpgradeType.SPEED) && game.canAffordPlayerUpgrade(PlayerUpgradeType.SPEED);
    
    playerSpeedUpgradeBtn.textContent = `Speed Lv.${speedLevel}/5 (${speedCost > 0 ? `$${speedCost}` : 'MAX'})`;
    playerSpeedUpgradeBtn.style.background = canUpgradeSpeed ? '#2196F3' : '#666';
    playerSpeedUpgradeBtn.disabled = !canUpgradeSpeed;
    
    // Update fire rate button
    const fireRateCost = game.getPlayerUpgradeCost(PlayerUpgradeType.FIRE_RATE);
    const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const canUpgradeFireRate = player.canUpgrade(PlayerUpgradeType.FIRE_RATE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.FIRE_RATE);
    
    playerFireRateUpgradeBtn.textContent = `Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})`;
    playerFireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#2196F3' : '#666';
    playerFireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    
    // Update health button
    const healthCost = game.getPlayerUpgradeCost(PlayerUpgradeType.HEALTH);
    const healthLevel = player.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const canUpgradeHealth = player.canUpgrade(PlayerUpgradeType.HEALTH) && game.canAffordPlayerUpgrade(PlayerUpgradeType.HEALTH);
    
    playerHealthUpgradeBtn.textContent = `Health Lv.${healthLevel}/5 (${healthCost > 0 ? `$${healthCost}` : 'MAX'})`;
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
  
  console.log('Tower Defense Game Loaded!');
  console.log('Use WASD or Arrow keys to move your character.');
  console.log('Press U or click on your character to open player upgrades.');
  console.log('Press 1, 2, or 3 to select towers, then click to place them.');
  console.log('Click on towers to upgrade them.');
  console.log('Your character automatically shoots at nearby enemies!');
  console.log('Press Enter to start the first wave.');
}