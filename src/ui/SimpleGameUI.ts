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
  PauseDialog
} from './components/dialogs';

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
  let towerUpgradeDialog: UpgradeDialogAdapter | null = null;
  let playerUpgradeDialog: UpgradeDialogAdapter | null = null;
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
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (!game) {
      console.warn('[SimpleGameUI] Game not initialized yet');
      return;
    }
    // Check if inventory dialog exists, create if needed
    if (!dialogManager.getDialog('inventory')) {
      console.warn('[SimpleGameUI] Inventory dialog not found, creating...');
      try {
        const tempInventoryDialog = new InventoryDialogAdapter({
          game,
          audioManager,
          onItemSelected: (item, slot) => {
            // Additional item selection logic if needed
          }
        });
        dialogManager.register('inventory', tempInventoryDialog);
      } catch (error) {
        console.error('[SimpleGameUI] Failed to create inventory dialog:', error);
        return;
      }
    }
    dialogManager.toggle('inventory');
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

  // Show tower upgrade dialog when a tower is selected
  const showTowerUpgradeDialog = (tower: Tower) => {
    // Close existing tower upgrade dialog if any
    if (towerUpgradeDialog) {
      dialogManager.unregister('towerUpgrade');
      towerUpgradeDialog = null;
    }

    // Create new upgrade dialog for the selected tower
    towerUpgradeDialog = new UpgradeDialogAdapter({
      game,
      target: tower,
      audioManager,
      onUpgraded: (type, cost) => {
        // Additional upgrade logic if needed
      },
      onSold: () => {
        dialogManager.hide('towerUpgrade');
        dialogManager.unregister('towerUpgrade');
        towerUpgradeDialog = null;
      },
      onClosed: () => {
        dialogManager.unregister('towerUpgrade');
        towerUpgradeDialog = null;
      }
    });

    dialogManager.register('towerUpgrade', towerUpgradeDialog);
    dialogManager.show('towerUpgrade');
  };

  // Show player upgrade dialog
  const showPlayerUpgradeDialog = () => {
    const player = game.getPlayer();
    if (!player) return;

    // Create or update player upgrade dialog
    if (!playerUpgradeDialog) {
      playerUpgradeDialog = new UpgradeDialogAdapter({
        game,
        target: player,
        audioManager,
        onUpgraded: (type, cost) => {
          // Additional upgrade logic if needed
        },
        onClosed: () => {
          // Keep the dialog instance for reuse
        }
      });
      dialogManager.register('playerUpgrade', playerUpgradeDialog);
    }

    dialogManager.toggle('playerUpgrade');
  };

  // Listen for tower selection events
  let currentSelectedTower: Tower | null = null;
  
  const handleTowerSelection = () => {
    const selectedTower = game.getSelectedTower();
    
    if (selectedTower !== currentSelectedTower) {
      // Close current tower upgrade dialog if open
      if (currentSelectedTower && towerUpgradeDialog) {
        dialogManager.hide('towerUpgrade');
      }
      
      currentSelectedTower = selectedTower;
      
      // Open new dialog for selected tower
      if (selectedTower) {
        showTowerUpgradeDialog(selectedTower);
      }
    }
  };

  // Check for tower selection changes periodically
  setInterval(handleTowerSelection, 100);

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
        // Check if inventory dialog exists, create if needed
        if (!dialogManager.getDialog('inventory')) {
          console.warn('[SimpleGameUI] Inventory dialog not found, creating...');
          const tempInventoryDialog = new InventoryDialogAdapter({
            game,
            audioManager,
            onItemSelected: (item, slot) => {
              // Additional item selection logic if needed
            }
          });
          dialogManager.register('inventory', tempInventoryDialog);
        }
        dialogManager.toggle('inventory');
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

  // Create player health display
  const healthDisplay = document.createElement('div');
  healthDisplay.id = 'health-display';
  healthDisplay.style.cssText = `
    position: absolute;
    top: 50px;
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
  const powerUpDisplay = new PowerUpDisplay(game, audioManager);
  gameContainer.appendChild(powerUpDisplay.getElement());

  // Create camera controls
  const cameraControls = new CameraControls(game, audioManager);
  gameContainer.appendChild(cameraControls.getElement());

  // Initialize all dialogs FIRST before setting up any UI that depends on them
  initializeDialogs();
  
  // Now that dialogs are initialized, we can set up the interval for button updates
  // Update button states periodically AFTER dialogs are initialized
  setInterval(updateButtonStates, 100);

  // Mobile controls
  const isMobile = 'ontouchstart' in window;
  if (isMobile) {
    const mobileControls = new MobileControls(game, audioManager);
    gameContainer.appendChild(mobileControls.getElement());
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

  // Cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('towerPlaced', updateTowerPlacementIndicator);
    dialogManager.destroy();
  };
}