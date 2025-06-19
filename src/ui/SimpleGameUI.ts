import { Game } from '../core/Game';
import { TowerType, Tower } from '@/entities/Tower';
import { createSvgIcon, IconType } from './icons/SvgIcons';
import { AudioManager, SoundType } from '../audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { PowerUpDisplay } from './components/game/SimplePowerUpDisplay';
import { MobileControls } from './components/game/MobileControls';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';
import {  isMobile as checkIsMobile } from '@/config/ResponsiveConfig';
import { 
  CurrencyDisplay,
  WaveDisplay,
  HealthDisplay,
  FloatingCameraControls
} from './components/floating';
import { DialogManager } from './systems/DialogManager';
import { 
  BuildMenuDialogAdapter,
  UpgradeDialogAdapter,
  InventoryDialogAdapter,
  SettingsDialog,
  PauseDialog,
  BaseDialog,
} from './components/dialogs';
import { DebugDialogWrapper } from './DebugDialogWrapper';
import { DialogShowFix } from './DialogShowFix';
import { SimpleTowerInfo } from './components/SimpleTowerInfo';

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
    
    // Test: Create a simple test dialog to verify dialog system works
    console.log('[SimpleGameUI] Testing dialog system...');
    try {
      const testDialog = new BaseDialog({
        title: 'Test Dialog',
        width: '300px',
        closeable: true,
        modal: true,
        audioManager: audioManager,
        className: 'test-dialog'
      });
      
      // Override buildContent for test
      (testDialog as any).buildContent = function() {
        this.content.innerHTML = '<p style="color: white;">If you see this, dialogs work!</p>';
      };
      (testDialog as any).buildContent();
      
      dialogManager.register('test', testDialog);
      // Don't show it automatically, just verify it can be created
      dialogManager.unregister('test');
      console.log('[SimpleGameUI] Dialog system test passed');
    } catch (error) {
      console.error('[SimpleGameUI] Dialog system test failed:', error);
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
      background: linear-gradient(to top, ${COLOR_THEME.ui.background.overlay}e6, ${COLOR_THEME.ui.background.overlay}b3);
      border-top: 2px solid ${COLOR_THEME.ui.text.primary}1a;
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
      background: ${COLOR_THEME.ui.background.overlay};
      border: 2px solid ${COLOR_THEME.ui.currency};
      color: ${COLOR_THEME.ui.currency};
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
  
  // Ensure control bar is in the DOM
  if (!controlBar.parentNode) {
    console.log('[SimpleGameUI] Appending control bar to game container...');
    gameContainer.appendChild(controlBar);
    console.log('[SimpleGameUI] Control bar added to DOM');
  }

  // Create mobile tower placement indicator
  const towerPlacementIndicator = document.createElement('div');
  towerPlacementIndicator.id = 'tower-placement-indicator';
  towerPlacementIndicator.style.cssText = `
    position: fixed;
    top: ${UI_CONSTANTS.towerPlacementIndicator.top}px;
    left: 50%;
    transform: translateX(-50%);
    background: ${UI_CONSTANTS.towerPlacementIndicator.background};
    color: white;
    padding: ${UI_CONSTANTS.towerPlacementIndicator.padding.vertical}px ${UI_CONSTANTS.towerPlacementIndicator.padding.horizontal}px;
    border-radius: ${UI_CONSTANTS.towerPlacementIndicator.borderRadius}px;
    font-size: ${UI_CONSTANTS.towerPlacementIndicator.fontSize}px;
    font-weight: bold;
    display: none;
    pointer-events: none;
    z-index: ${UI_CONSTANTS.zIndex.ui};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: opacity 0.3s ease;
  `;
  gameContainer.appendChild(towerPlacementIndicator);

  // Update tower placement indicator when tower type changes
  const updateTowerPlacementIndicator = () => {
    const selectedType = game.getSelectedTowerType();
    const isMobile = 'ontouchstart' in window || checkIsMobile(window.innerWidth);
    
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

  // Keep track of current tower info
  let currentTowerInfo: SimpleTowerInfo | null = null;
  
  // Show tower info dialog when a tower is selected
  const showTowerInfoDialog = (tower: Tower) => {
    console.log('[SimpleGameUI] showTowerInfoDialog called for tower:', tower.towerType);
    
    // Close any existing tower info
    if (currentTowerInfo) {
      currentTowerInfo.close();
      currentTowerInfo = null;
    }
    
    try {
      // Create and show the simple tower info
      currentTowerInfo = new SimpleTowerInfo(tower, game, audioManager);
      currentTowerInfo.show();
      console.log('[SimpleGameUI] SimpleTowerInfo shown successfully');
    } catch (error) {
      console.error('[SimpleGameUI] Error creating/showing tower info:', error);
      console.error('[SimpleGameUI] Stack trace:', error.stack);
    }
  };

  // Show player upgrade dialog
  const showPlayerUpgradeDialog = () => {
    console.log('[SimpleGameUI] showPlayerUpgradeDialog called - using DialogShowFix');
    DialogShowFix.ensurePlayerUpgradeDialog(game, audioManager);
  };

  // Listen for tower selection events
  const handleTowerSelected = (event: CustomEvent) => {
    console.log('[SimpleGameUI] handleTowerSelected called');
    console.log('[SimpleGameUI] Event:', event);
    console.log('[SimpleGameUI] Event detail:', event.detail);
    
    const tower = event.detail.tower;
    console.log('[SimpleGameUI] Tower selected event received');
    console.log('[SimpleGameUI] Tower details:', {
      type: tower.towerType || tower.type,
      position: tower.position,
      level: tower.getLevel ? tower.getLevel() : 'N/A'
    });
    
    console.log('[SimpleGameUI] Calling showTowerInfoDialog');
    showTowerInfoDialog(tower);
  };

  const handleTowerDeselected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log('[SimpleGameUI] Tower deselected:', tower.towerType);
    
    // Close simple tower info
    if (currentTowerInfo) {
      currentTowerInfo.close();
      currentTowerInfo = null;
    }
  };

  // Add event listeners for tower selection
  document.addEventListener('towerSelected', handleTowerSelected as EventListener);
  document.addEventListener('towerDeselected', handleTowerDeselected as EventListener);
  
  // Handle tower upgrade request from SimpleTowerInfo
  document.addEventListener('showTowerUpgrade', ((event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log('[SimpleGameUI] showTowerUpgrade event received for tower:', tower.towerType);
    
    // Create and show upgrade dialog
    const upgradeDialog = new UpgradeDialogAdapter({
      game,
      target: tower,
      audioManager,
      onUpgraded: (type, cost) => {
        console.log('[SimpleGameUI] Tower upgraded');
      },
      onSold: () => {
        console.log('[SimpleGameUI] Tower sold from upgrade dialog');
      },
      onClosed: () => {
        dialogManager.unregister('towerUpgrade');
      }
    });
    
    dialogManager.register('towerUpgrade', upgradeDialog);
    dialogManager.show('towerUpgrade');
  }) as EventListener);

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

  // Create resource display using CurrencyDisplay
  console.log('[SimpleGameUI] Creating CurrencyDisplay...');
  const currencyDisplay = new CurrencyDisplay(game);
  currencyDisplay.mount(gameContainer);
  console.log('[SimpleGameUI] CurrencyDisplay mounted');

  // Create wave display using WaveDisplay
  console.log('[SimpleGameUI] Creating WaveDisplay...');
  const waveDisplay = new WaveDisplay(game);
  waveDisplay.mount(gameContainer);
  console.log('[SimpleGameUI] WaveDisplay mounted');
  
  // Create camera controls using FloatingCameraControls
  console.log('[SimpleGameUI] Creating FloatingCameraControls...');
  const cameraControls = new FloatingCameraControls({
    position: { top: 120, right: 10 },
    game,
    audioManager
  });
  cameraControls.mount(gameContainer);
  console.log('[SimpleGameUI] FloatingCameraControls mounted');

  // Create player health display using HealthDisplay
  console.log('[SimpleGameUI] Creating HealthDisplay...');
  const healthDisplay = new HealthDisplay(game);
  healthDisplay.mount(gameContainer);
  console.log('[SimpleGameUI] HealthDisplay mounted');

  // Create power-up display
  const powerUpDisplay = new PowerUpDisplay({ game });
  powerUpDisplay.mount(gameContainer);

  // All floating displays are now created using their respective components

  // Initialize all dialogs FIRST before setting up any UI that depends on them
  initializeDialogs();
  
  // Now that dialogs are initialized, we can set up the interval for button updates
  // Update button states periodically AFTER dialogs are initialized
  setInterval(updateButtonStates, ANIMATION_CONFIG.durations.fast);

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
  
  // Check saved settings for touch joystick preference
  const savedSettings = localStorage.getItem('gameSettings');
  let showTouchJoysticks = true; // Default to true
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      showTouchJoysticks = settings.showTouchJoysticks !== false; // Default to true if not set
    } catch (e) {
      console.warn('[SimpleGameUI] Failed to parse saved settings:', e);
    }
  }
  
  let mobileControls: MobileControls | null = null;
  
  if (isMobile || window.location.hostname === 'localhost') { // Also enable on localhost for testing
    console.log('[SimpleGameUI] Creating mobile controls...');
    // Use document.body instead of gameContainer to ensure controls are on top
    mobileControls = new MobileControls({
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
    // Show or hide based on saved settings
    if (showTouchJoysticks) {
      mobileControls.show();
      console.log('[SimpleGameUI] Mobile controls created and shown');
    } else {
      mobileControls.hide();
      console.log('[SimpleGameUI] Mobile controls created but hidden (per settings)');
    }
    
    // Force visibility after a short delay to ensure DOM is ready
    if (showTouchJoysticks) {
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
  }
  
  // Listen for touch joystick toggle events
  window.addEventListener('touchJoysticksToggled', (event: Event) => {
    const customEvent = event as CustomEvent;
    const enabled = customEvent.detail.enabled;
    console.log('[SimpleGameUI] Touch joysticks toggled:', enabled);
    
    if (mobileControls) {
      if (enabled) {
        mobileControls.show();
      } else {
        mobileControls.hide();
      }
    }
  });

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
  
  // Add debug command to test tower info dialog
  (window as any).testTowerInfo = () => {
    console.log('[Debug] Testing tower info dialog...');
    const towers = game.getTowers();
    if (towers.length > 0) {
      console.log('[Debug] Found', towers.length, 'towers, selecting first one');
      const tower = towers[0];
      console.log('[Debug] Tower details:', {
        towerType: tower.towerType,
        position: tower.position,
        level: tower.getLevel()
      });
      showTowerInfoDialog(tower);
    } else {
      console.log('[Debug] No towers found! Place a tower first.');
    }
  };
  
  // Add direct selection test
  (window as any).selectFirstTower = () => {
    const towers = game.getTowers();
    if (towers.length > 0) {
      console.log('[Debug] Selecting first tower via game.selectTower()');
      game.selectTower(towers[0]);
    } else {
      console.log('[Debug] No towers to select');
    }
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
    
    // Clean up floating UI elements
    currencyDisplay.destroy();
    waveDisplay.destroy();
    healthDisplay.destroy();
    cameraControls.destroy();
    powerUpDisplay.cleanup();
    
    dialogManager.destroy();
  };
}