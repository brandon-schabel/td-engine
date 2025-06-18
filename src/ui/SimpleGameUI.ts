import { Game } from '../core/Game';
import { TowerType, UpgradeType, Tower } from '@/entities/Tower';
import { PlayerUpgradeType } from '@/entities/Player';
import { createSvgIcon, IconType } from './icons/SvgIcons';
import { AudioManager, SoundType } from '../audio/AudioManager';
import { PowerUpDisplay } from './components/game/SimplePowerUpDisplay';
import { CameraControls } from './components/game/SimpleCameraControls';
import { MobileControls } from './components/game/MobileControls';
import { DialogManager } from './systems/DialogManager';
import { 
  BuildMenuDialogAdapter,
  UpgradeDialogAdapter,
  InventoryDialogAdapter,
  SettingsDialog,
  PauseDialog,
  TowerInfoDialogAdapter
} from './components/dialogs';
import { DebugDialogWrapper } from './DebugDialogWrapper';
import { DialogShowFix } from './DialogShowFix';

export function setupSimpleGameUI(game: Game, audioManager: AudioManager) {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) {
    console.error('[SimpleGameUI] ERROR: game-container element not found!');
    return;
  }

  console.log('[SimpleGameUI] Setting up game UI...');
  console.log('[SimpleGameUI] Game object:', game);
  console.log('[SimpleGameUI] AudioManager:', audioManager);

  // Dialog management
  const dialogManager = DialogManager.getInstance();
  
  // Dialog instances
  let buildMenuDialog: BuildMenuDialogAdapter;
  let towerInfoDialog: TowerInfoDialogAdapter | null = null;
  let inventoryDialog: InventoryDialogAdapter;
  let settingsDialog: SettingsDialog;
  let pauseDialog: PauseDialog;

  // Initialize dialogs
  const initializeDialogs = () => {
    console.log('[SimpleGameUI] Initializing dialogs...');
    try {
    
    // Check if dialogs are already registered from main.ts
    // If they are, just get references to them
    
    // Build Menu Dialog - should already be registered
    const existingBuildMenu = dialogManager.getDialog('buildMenu');
    if (existingBuildMenu) {
      buildMenuDialog = existingBuildMenu as BuildMenuDialogAdapter;
      console.log('[SimpleGameUI] Using existing buildMenu dialog');
    } else {
      console.log('[SimpleGameUI] buildMenu dialog not found - this should not happen');
      // Fallback: create it here
      buildMenuDialog = new BuildMenuDialogAdapter({
        game,
        audioManager,
        onTowerSelected: (type) => {
          updateTowerPlacementIndicator();
        },
        onClosed: () => {
          updateTowerPlacementIndicator();
        }
      });
      dialogManager.register('buildMenu', buildMenuDialog);
    }

    // Inventory Dialog - should already be registered
    const existingInventory = dialogManager.getDialog('inventory');
    if (existingInventory) {
      inventoryDialog = existingInventory as InventoryDialogAdapter;
      console.log('[SimpleGameUI] Using existing inventory dialog');
    } else {
      console.log('[SimpleGameUI] inventory dialog not found - this should not happen');
      // Fallback: create it here
      inventoryDialog = new InventoryDialogAdapter({
        game,
        audioManager,
        onItemSelected: (item, slot) => {
          // Additional item selection logic if needed
        }
      });
      dialogManager.register('inventory', inventoryDialog);
    }

    // Settings Dialog - may use gameSettings instead of settings
    const existingSettings = dialogManager.getDialog('gameSettings') || dialogManager.getDialog('settings');
    if (existingSettings) {
      settingsDialog = existingSettings as SettingsDialog;
      console.log('[SimpleGameUI] Using existing settings dialog');
    } else {
      console.log('[SimpleGameUI] Settings dialog not found - creating new one');
      settingsDialog = new SettingsDialog({
        audioManager,
        onVolumeChange: (volume) => {
          audioManager.setMasterVolume(volume);
        },
        onMuteToggle: (muted) => {
          audioManager.setMuted(muted);
        }
      });
      dialogManager.register('gameSettings', settingsDialog);
    }

    // Pause Dialog - should already be registered
    const existingPause = dialogManager.getDialog('pause');
    if (existingPause) {
      pauseDialog = existingPause as PauseDialog;
      console.log('[SimpleGameUI] Using existing pause dialog');
    } else {
      console.log('[SimpleGameUI] pause dialog not found - creating new one');
      pauseDialog = new PauseDialog({
        audioManager,
        onResume: () => {
          game.resume();
        },
        onSettings: () => {
          // Always show gameSettings dialog (it should exist from early initialization)
          dialogManager.show('gameSettings');
        },
        onRestart: () => {
          if (confirm('Are you sure you want to restart the game?')) {
            window.location.reload();
          }
        },
        onQuit: () => {
          if (confirm('Are you sure you want to quit to main menu?')) {
            window.location.reload();
          }
        }
      });
      dialogManager.register('pause', pauseDialog);
    }
    
    console.log('[SimpleGameUI] Dialog initialization complete');
    // Note: We can't directly access private dialogs Map, but we know what should be registered
    } catch (error) {
      console.error('[SimpleGameUI] Error initializing dialogs:', error);
    }
  };

  // Use the existing bottom UI container if available, otherwise create control bar
  let controlBar = document.getElementById('bottom-ui-container');
  if (!controlBar) {
    console.log('[SimpleGameUI] Creating new control bar (bottom-ui-container not found)');
    controlBar = document.createElement('div');
    controlBar.className = 'control-bar';
    controlBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: clamp(50px, 10vh, 60px);
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
      border-top: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(8px, 2vw, 12px);
      padding: 0 clamp(10px, 2vw, 20px);
      z-index: 1000;
    `;
    gameContainer.appendChild(controlBar);
  } else {
    console.log('[SimpleGameUI] Using existing bottom-ui-container');
    // Clear existing content
    controlBar.innerHTML = '';
    // Ensure it has the right styles
    controlBar.style.display = 'flex';
    controlBar.style.alignItems = 'center';
    controlBar.style.justifyContent = 'center';
    controlBar.style.gap = 'clamp(8px, 2vw, 12px)';
  }

  // Create control buttons
  const createControlButton = (iconType: IconType, title: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.className = 'ui-button control-button icon-only';
    button.style.cssText = `
      width: clamp(40px, 8vw, 48px);
      height: clamp(40px, 8vw, 48px);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #FFD700;
      color: #FFD700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    const iconSize = Math.max(20, Math.min(24, window.innerWidth * 0.05));
    const icon = createSvgIcon(iconType, { size: iconSize });
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
  };

  // Control bar buttons
  const buildButton = createControlButton(IconType.BUILD, 'Build Menu (B)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (!game) {
      console.warn('[SimpleGameUI] Game not initialized yet');
      return;
    }
    // Check if build menu dialog exists, create if needed
    if (!dialogManager.getDialog('buildMenu')) {
      console.warn('[SimpleGameUI] Build menu dialog not found, creating...');
      const tempBuildDialog = new BuildMenuDialogAdapter({
        game,
        audioManager,
        onTowerSelected: (type) => {
          updateTowerPlacementIndicator();
        },
        onClosed: () => {
          updateTowerPlacementIndicator();
        }
      });
      dialogManager.register('buildMenu', tempBuildDialog);
    }
    dialogManager.toggle('buildMenu');
  });

  const playerUpgradeButton = createControlButton(IconType.PLAYER, 'Player Upgrades (U)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    showPlayerUpgradeDialog();
  });

  const inventoryButton = createControlButton(IconType.INVENTORY, 'Inventory (E)', () => {
    console.log('[SimpleGameUI] Inventory button clicked - using DialogShowFix');
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (!game) {
      console.warn('[SimpleGameUI] Game not initialized yet');
      return;
    }
    DialogShowFix.ensureInventoryDialog(game, audioManager);
  });

  const startWaveButton = createControlButton(IconType.PLAY, 'Start Next Wave (Enter)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (game.isWaveComplete() && !game.isGameOver()) {
      game.startNextWave();
    }
  });

  const pauseButton = createControlButton(IconType.PAUSE, 'Pause/Resume (Space)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (game.isPaused()) {
      game.resume();
      dialogManager.hide('pause');
    } else {
      game.pause();
      dialogManager.show('pause');
    }
  });

  const settingsButton = createControlButton(IconType.SETTINGS, 'Settings', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    // Always use gameSettings for consistency
    dialogManager.toggle('gameSettings');
  });

  // Add buttons to control bar
  controlBar.appendChild(buildButton);
  controlBar.appendChild(playerUpgradeButton);
  controlBar.appendChild(inventoryButton);
  controlBar.appendChild(startWaveButton);
  controlBar.appendChild(pauseButton);
  controlBar.appendChild(settingsButton);
  
  // Only append if we created a new control bar
  if (!document.getElementById('bottom-ui-container')) {
    console.log('[SimpleGameUI] Appending control bar to game container...');
    gameContainer.appendChild(controlBar);
    console.log('[SimpleGameUI] Control bar added to DOM');
  }

  // Create mobile tower placement indicator
  const towerPlacementIndicator = document.createElement('div');
  towerPlacementIndicator.id = 'tower-placement-indicator';
  towerPlacementIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    display: none;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: opacity 0.3s ease;
  `;
  gameContainer.appendChild(towerPlacementIndicator);

  // Update tower placement indicator when tower type changes
  const updateTowerPlacementIndicator = () => {
    const selectedType = game.getSelectedTowerType();
    const isMobile = 'ontouchstart' in window;
    
    if (selectedType && isMobile) {
      const towerNames: Record<string, string> = {
        'BASIC': 'Basic Tower',
        'SNIPER': 'Sniper Tower',
        'RAPID': 'Rapid Tower',
        'WALL': 'Wall'
      };
      const towerName = towerNames[selectedType] || selectedType;
      towerPlacementIndicator.innerHTML = `📍 Tap to place ${towerName}`;
      towerPlacementIndicator.style.display = 'block';
    } else {
      towerPlacementIndicator.style.display = 'none';
    }
  };

  // Listen for tower placed event to clear selection
  document.addEventListener('towerPlaced', () => {
    updateTowerPlacementIndicator();
  });

  // Show tower info dialog when a tower is selected
  const showTowerInfoDialog = (tower: Tower) => {
    // Close existing tower info dialog if any
    if (towerInfoDialog) {
      dialogManager.unregister('towerInfo');
      towerInfoDialog = null;
    }

    // Create new tower info dialog for the selected tower
    towerInfoDialog = new TowerInfoDialogAdapter({
      game,
      tower,
      audioManager,
      onClosed: () => {
        dialogManager.unregister('towerInfo');
        towerInfoDialog = null;
      }
    });

    dialogManager.register('towerInfo', towerInfoDialog);
    dialogManager.show('towerInfo');
  };

  // Show player upgrade dialog
  const showPlayerUpgradeDialog = () => {
    console.log('[SimpleGameUI] showPlayerUpgradeDialog called - using DialogShowFix');
    DialogShowFix.ensurePlayerUpgradeDialog(game, audioManager);
  };

  // Listen for tower selection events
  const handleTowerSelected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log('[SimpleGameUI] Tower selected:', tower.towerType, 'at', tower.position);
    showTowerInfoDialog(tower);
  };

  const handleTowerDeselected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log('[SimpleGameUI] Tower deselected:', tower.towerType);
    
    // Close tower info dialog if it's for this tower
    if (towerInfoDialog && game.isTowerSelected(tower) === false) {
      dialogManager.hide('towerInfo');
      dialogManager.unregister('towerInfo');
      towerInfoDialog = null;
    }
  };

  // Add event listeners for tower selection
  document.addEventListener('towerSelected', handleTowerSelected as EventListener);
  document.addEventListener('towerDeselected', handleTowerDeselected as EventListener);

  // Keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Don't handle shortcuts when dialogs are open (except for ESC)
    if (dialogManager.getIsInputBlocked && dialogManager.getIsInputBlocked() && e.key !== 'Escape') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'b':
        if (!game) {
          console.warn('[SimpleGameUI] Game not initialized yet');
          return;
        }
        // Check if build menu dialog exists, create if needed
        if (!dialogManager.getDialog('buildMenu')) {
          console.warn('[SimpleGameUI] Build menu dialog not found, creating...');
          const tempBuildDialog = new BuildMenuDialogAdapter({
            game,
            audioManager,
            onTowerSelected: (type) => {
              updateTowerPlacementIndicator();
            },
            onClosed: () => {
              updateTowerPlacementIndicator();
            }
          });
          dialogManager.register('buildMenu', tempBuildDialog);
        }
        dialogManager.toggle('buildMenu');
        break;
      case 'u':
        showPlayerUpgradeDialog();
        break;
      case 'e':
        if (!game) {
          console.warn('[SimpleGameUI] Game not initialized yet');
          return;
        }
        DialogShowFix.ensureInventoryDialog(game, audioManager);
        break;
      case ' ':
        e.preventDefault();
        if (game.isPaused()) {
          game.resume();
          dialogManager.hide('pause');
        } else {
          game.pause();
          dialogManager.show('pause');
        }
        break;
      case 'enter':
        if (game.isWaveComplete() && !game.isGameOver()) {
          game.startNextWave();
        }
        break;
      case 'escape':
        // Cancel tower placement
        if (game.getSelectedTowerType()) {
          game.setSelectedTowerType(null);
          audioManager.playUISound(SoundType.DESELECT);
          updateTowerPlacementIndicator();
        }
        // Close top dialog
        else if (dialogManager.isAnyDialogOpen()) {
          dialogManager.closeTopDialog();
        }
        break;
      case '1':
        game.setSelectedTowerType(TowerType.BASIC);
        dialogManager.hide('buildMenu');
        updateTowerPlacementIndicator();
        break;
      case '2':
        game.setSelectedTowerType(TowerType.SNIPER);
        dialogManager.hide('buildMenu');
        updateTowerPlacementIndicator();
        break;
      case '3':
        game.setSelectedTowerType(TowerType.RAPID);
        dialogManager.hide('buildMenu');
        updateTowerPlacementIndicator();
        break;
      case '4':
        game.setSelectedTowerType(TowerType.WALL);
        dialogManager.hide('buildMenu');
        updateTowerPlacementIndicator();
        break;
    }
  };

  document.addEventListener('keydown', handleKeyPress);

  // Click outside to close panels (handled by DialogManager now)
  
  // Helper function to update button states
  const updateButtonStates = () => {
    // Update start wave button state
    if (game.isWaveComplete() && !game.isGameOver()) {
      startWaveButton.style.opacity = '1';
      startWaveButton.style.pointerEvents = 'auto';
    } else {
      startWaveButton.style.opacity = '0.5';
      startWaveButton.style.pointerEvents = 'none';
    }

    // Update currency display in build menu - add null check
    if (buildMenuDialog) {
      buildMenuDialog.updateCurrency(game.getCurrency());
    }
  };

  // Removed duplicate setInterval - it's now after initializeDialogs()

  // Create resource display
  const resourceDisplay = document.createElement('div');
  resourceDisplay.id = 'resource-display';
  resourceDisplay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #FFD700;
    border-radius: 8px;
    padding: 8px 12px;
    color: #FFD700;
    font-weight: bold;
    font-size: clamp(14px, 3vw, 18px);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const currencyIcon = createSvgIcon(IconType.COINS, { size: 20 });
  const updateResourceDisplay = () => {
    const currency = game.getCurrency();
    resourceDisplay.innerHTML = `${currencyIcon}<span>$${currency}</span>`;
  };

  setInterval(updateResourceDisplay, 100);
  gameContainer.appendChild(resourceDisplay);

  // Create wave display
  const waveDisplay = document.createElement('div');
  waveDisplay.id = 'wave-display';
  waveDisplay.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #4CAF50;
    border-radius: 8px;
    padding: 8px 12px;
    color: #4CAF50;
    font-weight: bold;
    font-size: clamp(14px, 3vw, 18px);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const waveIcon = createSvgIcon(IconType.WAVE, { size: 20 });
  const updateWaveDisplay = () => {
    const waveNumber = game.getCurrentWave();
    const enemiesRemaining = game.getEnemies().length;
    let waveText = `Wave ${waveNumber}`;
    if (enemiesRemaining > 0) {
      waveText += ` - ${enemiesRemaining} enemies`;
    } else if (game.isWaveComplete()) {
      waveText += ' - Complete!';
    }
    waveDisplay.innerHTML = `${waveIcon}<span>${waveText}</span>`;
  };

  setInterval(updateWaveDisplay, 100);
  gameContainer.appendChild(waveDisplay);
  
  // Create camera controls right after wave display - they should appear directly below it
  const cameraControlsDisplay = document.createElement('div');
  cameraControlsDisplay.id = 'camera-controls-display';
  cameraControlsDisplay.style.cssText = `
    position: absolute;
    top: 60px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #00BCD4;
    border-radius: 8px;
    padding: 8px 12px;
    color: #00BCD4;
    font-weight: bold;
    font-size: clamp(14px, 3vw, 18px);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Camera icon and controls
  const cameraIcon = createSvgIcon(IconType.CAMERA, { size: 20 });
  const zoomInIcon = createSvgIcon(IconType.ZOOM_IN, { size: 18 });
  const zoomOutIcon = createSvgIcon(IconType.ZOOM_OUT, { size: 18 });
  const resetIcon = createSvgIcon(IconType.RESET_ZOOM, { size: 18 });
  
  cameraControlsDisplay.innerHTML = `
    <span>${cameraIcon}</span>
    <span style="display: flex; align-items: center; gap: 6px;">
      <button class="zoom-btn zoom-in" style="background: none; border: none; color: #00BCD4; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" title="Zoom In">${zoomInIcon}</button>
      <button class="zoom-btn zoom-out" style="background: none; border: none; color: #00BCD4; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" title="Zoom Out">${zoomOutIcon}</button>
      <button class="zoom-btn reset" style="background: none; border: none; color: #00BCD4; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" title="Reset">${resetIcon}</button>
      <span class="zoom-level" style="margin-left: 4px; font-size: clamp(12px, 2.5vw, 16px);">100%</span>
    </span>
  `;

  const updateCameraZoomLevel = () => {
    const camera = game.getCamera();
    const zoomLevel = Math.round(camera.getZoom() * 100);
    const zoomDisplay = cameraControlsDisplay.querySelector('.zoom-level');
    if (zoomDisplay) {
      zoomDisplay.textContent = `${zoomLevel}%`;
    }
  };

  // Add click handlers and hover effects
  setTimeout(() => {
    const buttons = cameraControlsDisplay.querySelectorAll('button');
    
    // Add hover effects to all buttons
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(0, 188, 212, 0.2)';
        button.style.transform = 'scale(1.1)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = 'none';
        button.style.transform = 'scale(1)';
      });
    });
    
    // Add click handlers
    buttons[0].addEventListener('click', () => {
      game.getCamera().zoomIn();
      updateCameraZoomLevel();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    });
    buttons[1].addEventListener('click', () => {
      game.getCamera().zoomOut();
      updateCameraZoomLevel();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    });
    buttons[2].addEventListener('click', () => {
      game.getCamera().reset();
      updateCameraZoomLevel();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    });
    
    // Initialize zoom level display
    updateCameraZoomLevel();
  }, 100);

  gameContainer.appendChild(cameraControlsDisplay);

  // Create player health display
  const healthDisplay = document.createElement('div');
  healthDisplay.id = 'health-display';
  healthDisplay.style.cssText = `
    position: absolute;
    top: 55px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #FF4444;
    border-radius: 8px;
    padding: 8px 12px;
    color: #FF4444;
    font-weight: bold;
    font-size: clamp(14px, 3vw, 18px);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const healthIcon = createSvgIcon(IconType.HEART, { size: 20 });
  const updateHealthDisplay = () => {
    const player = game.getPlayer();
    if (player) {
      const health = Math.max(0, player.health);
      const maxHealth = player.maxHealth;
      const healthPercent = (health / maxHealth) * 100;
      
      // Update color based on health percentage
      let color = '#4CAF50'; // Green
      if (healthPercent <= 25) {
        color = '#FF4444'; // Red
      } else if (healthPercent <= 50) {
        color = '#FF9800'; // Orange
      }
      
      healthDisplay.style.borderColor = color;
      healthDisplay.style.color = color;
      healthDisplay.innerHTML = `${healthIcon}<span>${health}/${maxHealth}</span>`;
    }
  };

  setInterval(updateHealthDisplay, 100);
  gameContainer.appendChild(healthDisplay);

  // Create power-up display
  const powerUpDisplay = new PowerUpDisplay({ game });
  powerUpDisplay.mount(gameContainer);

  // Camera controls are now created right after wave display

  // Initialize all dialogs FIRST before setting up any UI that depends on them
  initializeDialogs();
  
  // Now that dialogs are initialized, we can set up the interval for button updates
  // Update button states periodically AFTER dialogs are initialized
  setInterval(updateButtonStates, 100);

  // Mobile controls - use multiple detection methods
  const isMobile = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log('[SimpleGameUI] Mobile detection:', {
    isMobile,
    ontouchstart: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent
  });
  
  if (isMobile || window.location.hostname === 'localhost') { // Also enable on localhost for testing
    console.log('[SimpleGameUI] Creating mobile controls...');
    // Use document.body instead of gameContainer to ensure controls are on top
    const mobileControls = new MobileControls({
      game,
      container: document.body,
      onShootStart: () => {
        // Shooting is handled by the player entity
      },
      onShootEnd: () => {
        // Shooting is handled by the player entity
      },
      enableHaptic: true
    });
    // MobileControls appends itself to the container, so we don't need to do anything else
    // Also call show() to ensure it's visible
    mobileControls.show();
    console.log('[SimpleGameUI] Mobile controls created and shown');
    
    // Force visibility after a short delay to ensure DOM is ready
    setTimeout(() => {
      const controlsEl = document.querySelector('.mobile-controls');
      if (controlsEl) {
        (controlsEl as HTMLElement).style.display = 'block';
        (controlsEl as HTMLElement).style.visibility = 'visible';
        console.log('[SimpleGameUI] Forced mobile controls visibility');
      } else {
        console.log('[SimpleGameUI] Mobile controls element not found in DOM!');
      }
    }, 100);
  }

  // Game event listeners
  // Note: These events may not be implemented in the current Game class
  // If the game has an event system, uncomment these:
  /*
  game.on('gameOver', () => {
    // Game over is handled by main.ts with GameOverDialog
  });

  game.on('waveComplete', () => {
    audioManager.playUISound(SoundType.WAVE_COMPLETE);
  });

  game.on('enemyKilled', () => {
    updateResourceDisplay();
  });

  game.on('towerPlaced', () => {
    updateResourceDisplay();
    updateTowerPlacementIndicator();
  });

  game.on('towerSold', () => {
    updateResourceDisplay();
  });
  */

  // Add debug test command
  (window as any).testDialogs = () => {
    DebugDialogWrapper.testDialogSystem();
  };
  
  // Add specific dialog test
  (window as any).testPlayerUpgrade = () => {
    console.log('[Debug] Testing player upgrade dialog...');
    showPlayerUpgradeDialog();
  };
  
  // Add inventory dialog test
  (window as any).testInventory = () => {
    console.log('[Debug] Testing inventory dialog...');
    DialogShowFix.ensureInventoryDialog(game, audioManager);
  };
  
  // Add force fix command
  (window as any).fixDialogs = () => {
    console.log('[Debug] Forcing dialog fixes...');
    // Re-initialize dialogs
    initializeDialogs();
    console.log('[Debug] Dialogs re-initialized');
  };
  
  // Add debug command to toggle mobile controls
  (window as any).toggleMobileControls = () => {
    const controlsEl = document.querySelector('.mobile-controls') as HTMLElement;
    if (controlsEl) {
      const currentDisplay = window.getComputedStyle(controlsEl).display;
      controlsEl.style.display = currentDisplay === 'none' ? 'block' : 'none';
      console.log('[Debug] Mobile controls display:', controlsEl.style.display);
      
      // Log all joystick elements
      const moveJoystick = controlsEl.querySelector('.move-joystick');
      const aimJoystick = controlsEl.querySelector('.aim-joystick');
      console.log('[Debug] Move joystick:', moveJoystick);
      console.log('[Debug] Aim joystick:', aimJoystick);
      console.log('[Debug] Controls rect:', controlsEl.getBoundingClientRect());
      
      // Log computed styles
      if (moveJoystick) {
        const moveStyles = window.getComputedStyle(moveJoystick as HTMLElement);
        console.log('[Debug] Move joystick computed styles:', {
          display: moveStyles.display,
          visibility: moveStyles.visibility,
          width: moveStyles.width,
          height: moveStyles.height,
          position: moveStyles.position,
          bottom: moveStyles.bottom,
          left: moveStyles.left
        });
      }
    } else {
      console.log('[Debug] Mobile controls element not found!');
    }
  };

  // Cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('towerPlaced', updateTowerPlacementIndicator);
    document.removeEventListener('towerSelected', handleTowerSelected as EventListener);
    document.removeEventListener('towerDeselected', handleTowerDeselected as EventListener);
    dialogManager.destroy();
  };
}