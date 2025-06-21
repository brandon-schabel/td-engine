import { Game } from "../core/Game";
import { TowerType } from "@/entities/Tower";
import { createSvgIcon, IconType } from "./icons/SvgIcons";
import { AudioManager, SoundType } from "../audio/AudioManager";
import { UI_CONSTANTS } from "@/config/UIConstants";
import { COLOR_THEME } from "@/config/ColorTheme";
import { PowerUpDisplay } from "./components/game/SimplePowerUpDisplay";
import { MobileControls } from "./components/game/MobileControls";
import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { isMobile as checkIsMobile } from "@/config/ResponsiveConfig";
import { DialogManager } from "./systems/DialogManager";
import {
  BuildMenuDialogAdapter,
  SettingsDialog,
  PauseDialog,
} from "./components/dialogs";
import { TOWER_COSTS } from "@/config/GameConfig";
import { formatNumber } from "@/utils/formatters";

// Helper function to create build menu content
function createBuildMenuContent(game: Game, audioManager: AudioManager, onTowerSelect: (type: TowerType) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'build-menu-simple';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Build Tower';
  title.className = 'build-menu-simple-title';
  container.appendChild(title);

  // Tower options grid
  const grid = document.createElement('div');
  grid.className = 'build-menu-simple-grid';

  const towers = [
    { type: TowerType.BASIC, name: 'Basic Tower', cost: TOWER_COSTS.BASIC, icon: IconType.BASIC_TOWER, color: COLOR_THEME.towers.basic },
    { type: TowerType.SNIPER, name: 'Sniper Tower', cost: TOWER_COSTS.SNIPER, icon: IconType.SNIPER_TOWER, color: COLOR_THEME.towers.frost },
    { type: TowerType.RAPID, name: 'Rapid Tower', cost: TOWER_COSTS.RAPID, icon: IconType.RAPID_TOWER, color: COLOR_THEME.towers.artillery },
    { type: TowerType.WALL, name: 'Wall', cost: TOWER_COSTS.WALL, icon: IconType.WALL, color: COLOR_THEME.towers.wall }
  ];

  const currency = game.getCurrency();

  towers.forEach(tower => {
    const button = document.createElement('button');
    const canAfford = currency >= tower.cost;
    button.disabled = !canAfford;
    button.className = `tower-card ${!canAfford ? 'disabled' : ''}`;
    button.dataset.towerType = tower.type.toLowerCase();

    if (canAfford) {
      button.addEventListener('click', () => {
        audioManager.playUISound(SoundType.BUTTON_CLICK);
        onTowerSelect(tower.type);
      });
    }

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'tower-card-icon';
    iconDiv.dataset.towerType = tower.type.toLowerCase();
    iconDiv.innerHTML = createSvgIcon(tower.icon, { size: 48 });
    button.appendChild(iconDiv);

    // Name
    const nameDiv = document.createElement('div');
    nameDiv.textContent = tower.name;
    nameDiv.className = 'tower-card-name';
    button.appendChild(nameDiv);

    // Cost
    const costDiv = document.createElement('div');
    costDiv.className = 'tower-card-cost';
    costDiv.innerHTML = `${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(tower.cost)}`;
    button.appendChild(costDiv);

    grid.appendChild(button);
  });

  container.appendChild(grid);

  // Currency display
  const currencyDiv = document.createElement('div');
  currencyDiv.className = 'build-menu-simple-footer';
  currencyDiv.innerHTML = `
    ${createSvgIcon(IconType.COINS, { size: 20 })}
    <span class="resource-value">${formatNumber(currency)}</span>
    <span>Available</span>
  `;
  container.appendChild(currencyDiv);

  return container;
}




export async function setupSimpleGameUI(game: Game, audioManager: AudioManager) {
  const gameContainer = document.getElementById("game-container");
  if (!gameContainer) {
    console.error("[SimpleGameUI] ERROR: game-container element not found!");
    return;
  }
  // Dialog management
  const dialogManager = DialogManager.getInstance();

  // Dialog instances
  let buildMenuDialog: BuildMenuDialogAdapter;
  let settingsDialog: SettingsDialog;
  let pauseDialog: PauseDialog;
  
  // Floating UI instances
  let currentInventoryUI: any = null;

  // Initialize dialogs
  const initializeDialogs = () => {
    try {
      // Check if dialogs are already registered from main.ts
      // If they are, just get references to them

      // Build Menu Dialog - should already be registered
      const existingBuildMenu = dialogManager.getDialog("buildMenu");
      if (existingBuildMenu) {
        buildMenuDialog = existingBuildMenu as BuildMenuDialogAdapter;
      } else {
        // Fallback: create it here
        buildMenuDialog = new BuildMenuDialogAdapter({
          game,
          audioManager,
          onTowerSelected: () => {
            updateTowerPlacementIndicator();
          },
          onClosed: () => {
            updateTowerPlacementIndicator();
          },
        });
        dialogManager.register("buildMenu", buildMenuDialog);
      }

      // Dialog system is initialized elsewhere, no test needed here

      // Inventory now uses FloatingUIManager directly

      // Settings Dialog - may use gameSettings instead of settings
      const existingSettings =
        dialogManager.getDialog("gameSettings") ||
        dialogManager.getDialog("settings");
      if (existingSettings) {
        settingsDialog = existingSettings as SettingsDialog;
      } else {
        settingsDialog = new SettingsDialog({
          audioManager
        });
        dialogManager.register("gameSettings", settingsDialog);
      }

      // Pause Dialog - should already be registered
      const existingPause = dialogManager.getDialog("pause");
      if (existingPause) {
        pauseDialog = existingPause as PauseDialog;
      } else {
        pauseDialog = new PauseDialog({
          audioManager,
          onResume: () => {
            game.resume();
          },
          onSettings: () => {
            // Always show gameSettings dialog (it should exist from early initialization)
            dialogManager.show("gameSettings");
          },
          onRestart: () => {
            if (confirm("Are you sure you want to restart the game?")) {
              window.location.reload();
            }
          },
          onQuit: () => {
            if (confirm("Are you sure you want to quit to main menu?")) {
              window.location.reload();
            }
          },
        });
        dialogManager.register("pause", pauseDialog);
      }

      // Note: We can't directly access private dialogs Map, but we know what should be registered
    } catch (error) {
      console.error("[SimpleGameUI] Error initializing dialogs:", error);
    }
  };

  // Use the existing bottom UI container if available, otherwise create control bar
  let controlBar = document.getElementById("bottom-ui-container");
  if (!controlBar) {
    controlBar = document.createElement("div");
    controlBar.className = "ui-control-bar";
    gameContainer.appendChild(controlBar);
  } else {
    console.log("[SimpleGameUI] Using existing bottom-ui-container");
    // Clear existing content
    controlBar.innerHTML = "";
    // Add the appropriate class
    controlBar.className = "ui-control-bar";
  }

  // Create control buttons
  const createControlButton = (
    iconType: IconType,
    title: string,
    onClick: () => void
  ) => {
    const button = document.createElement("button");
    button.className = "ui-button ui-button-icon-only ui-button-control";
    const iconSize = Math.max(20, Math.min(24, window.innerWidth * 0.05));
    const icon = createSvgIcon(iconType, { size: iconSize });
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener("click", onClick);
    return button;
  };

  // Control bar buttons
  const buildButton = createControlButton(
    IconType.BUILD,
    "Build Menu (B)",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (!game) {
        console.warn("[SimpleGameUI] Game not initialized yet");
        return;
      }
      // Use new floating UI build menu
      showBuildMenu();
    }
  );

  const playerUpgradeButton = createControlButton(
    IconType.PLAYER,
    "Player Upgrades (U)",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      showPlayerUpgradeDialog();
    }
  );

  const inventoryButton = createControlButton(
    IconType.INVENTORY,
    "Inventory (E)",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (!game) {
        console.warn("[SimpleGameUI] Game not initialized yet");
        return;
      }
      showInventoryUI();
    }
  );

  const startWaveButton = createControlButton(
    IconType.PLAY,
    "Start Next Wave (Enter)",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (game.isWaveComplete() && !game.isGameOverPublic()) {
        game.startNextWave();
      }
    }
  );

  const pauseButton = createControlButton(
    IconType.PAUSE,
    "Pause/Resume (Space)",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (game.isPaused()) {
        game.resume();
        dialogManager.hide("pause");
      } else {
        game.pause();
        dialogManager.show("pause");
      }
    }
  );

  const settingsButton = createControlButton(
    IconType.SETTINGS,
    "Settings",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      // Always use gameSettings for consistency
      dialogManager.toggle("gameSettings");
    }
  );

  // Add buttons to control bar
  controlBar.appendChild(buildButton);
  controlBar.appendChild(playerUpgradeButton);
  controlBar.appendChild(inventoryButton);
  controlBar.appendChild(startWaveButton);
  controlBar.appendChild(pauseButton);
  controlBar.appendChild(settingsButton);

  // Ensure control bar is in the DOM
  if (!controlBar.parentNode) {
    console.log("[SimpleGameUI] Appending control bar to game container...");
    gameContainer.appendChild(controlBar);
    console.log("[SimpleGameUI] Control bar added to DOM");
  }

  // Create mobile tower placement indicator
  const towerPlacementIndicator = document.createElement("div");
  towerPlacementIndicator.id = "tower-placement-indicator";
  towerPlacementIndicator.className = "ui-placement-indicator";
  gameContainer.appendChild(towerPlacementIndicator);

  // Update tower placement indicator when tower type changes
  const updateTowerPlacementIndicator = () => {
    const selectedType = game.getSelectedTowerType();
    const isMobile =
      "ontouchstart" in window || checkIsMobile(window.innerWidth);

    if (selectedType && isMobile) {
      const towerNames: Record<string, string> = {
        BASIC: "Basic Tower",
        SNIPER: "Sniper Tower",
        RAPID: "Rapid Tower",
        WALL: "Wall",
      };
      const towerName = towerNames[selectedType] || selectedType;
      towerPlacementIndicator.innerHTML = `📍 Tap to place ${towerName}`;
      towerPlacementIndicator.style.display = "block";
    } else {
      towerPlacementIndicator.style.display = "none";
    }
  };

  // Listen for tower placed event to clear selection
  document.addEventListener("towerPlaced", () => {
    updateTowerPlacementIndicator();
  });

  // Keep track of current tower info - removed SimpleTowerInfo usage
  // Tower selection is now handled directly by Game.ts with TowerUpgradeUI

  // Current player upgrade UI instance
  let currentPlayerUpgradeUI: any = null;

  // Show player upgrade dialog using FloatingUIManager
  const showPlayerUpgradeDialog = () => {
    console.log("[SimpleGameUI] showPlayerUpgradeDialog called - using FloatingUIManager");
    
    // Import PlayerUpgradeUI dynamically to avoid circular dependencies
    import('@/ui/floating/PlayerUpgradeUI').then(({ PlayerUpgradeUI }) => {
      // Close existing UI if any
      if (currentPlayerUpgradeUI) {
        currentPlayerUpgradeUI.destroy();
        currentPlayerUpgradeUI = null;
      }
      
      const player = game.getPlayer();
      if (player) {
        currentPlayerUpgradeUI = new PlayerUpgradeUI(player, game);
      }
    }).catch(error => {
      console.error('[SimpleGameUI] Failed to load PlayerUpgradeUI:', error);
    });
  };

  // Show inventory UI using FloatingUIManager
  const showInventoryUI = () => {
    console.log("[SimpleGameUI] showInventoryUI called - using FloatingUIManager");
    
    // Import InventoryUI dynamically to avoid circular dependencies
    import('@/ui/floating/InventoryUI').then(({ InventoryUI }) => {
      // Close existing UI if any
      if (currentInventoryUI) {
        currentInventoryUI.destroy();
        currentInventoryUI = null;
      }
      
      currentInventoryUI = new InventoryUI(game);
    }).catch(error => {
      console.error('[SimpleGameUI] Failed to load InventoryUI:', error);
    });
  };

  // Show build menu using FloatingUIManager
  const showBuildMenu = () => {
    const buildMenuDialog = floatingUI.create('build-menu', 'dialog', {
      persistent: true,
      autoHide: false,
      className: 'ui-dialog ui-dialog-build-menu',
      zIndex: 500
    });

    // Create build menu content using BuildMenuDialog logic
    const content = createBuildMenuContent(game, audioManager, (towerType) => {
      game.setSelectedTowerType(towerType);
      updateTowerPlacementIndicator();
      floatingUI.remove('build-menu');
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ui-dialog-close';
    closeButton.innerHTML = createSvgIcon(IconType.CLOSE, { size: 20 });
    closeButton.addEventListener('click', () => {
      game.setSelectedTowerType(null);
      floatingUI.remove('build-menu');
    });
    buildMenuDialog.getElement().appendChild(closeButton);

    buildMenuDialog.setContent(content).enable();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        game.setSelectedTowerType(null);
        floatingUI.remove('build-menu');
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  // Tower selection/deselection handlers removed - Game.ts directly creates TowerUpgradeUI

  // Tower selection event listeners removed - Game.ts handles tower upgrades directly

  // Remove the showTowerUpgrade event listener since Game.ts handles this directly now

  // Keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Don't handle shortcuts when dialogs are open (except for ESC)
    if (
      dialogManager.getIsInputBlocked &&
      dialogManager.getIsInputBlocked() &&
      e.key !== "Escape"
    ) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case "b":
        if (!game) {
          console.warn("[SimpleGameUI] Game not initialized yet");
          return;
        }
        // Use new floating UI build menu
        showBuildMenu();
        break;
      case "u":
        showPlayerUpgradeDialog();
        break;
      case "e":
        if (!game) {
          console.warn("[SimpleGameUI] Game not initialized yet");
          return;
        }
        showInventoryUI();
        break;
      case " ":
        e.preventDefault();
        if (game.isPaused()) {
          game.resume();
          dialogManager.hide("pause");
        } else {
          game.pause();
          dialogManager.show("pause");
        }
        break;
      case "enter":
        if (game.isWaveComplete() && !game.isGameOverPublic()) {
          game.startNextWave();
        }
        break;
      case "escape":
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
      case "1":
        game.setSelectedTowerType(TowerType.BASIC);
        dialogManager.hide("buildMenu");
        updateTowerPlacementIndicator();
        break;
      case "2":
        game.setSelectedTowerType(TowerType.SNIPER);
        dialogManager.hide("buildMenu");
        updateTowerPlacementIndicator();
        break;
      case "3":
        game.setSelectedTowerType(TowerType.RAPID);
        dialogManager.hide("buildMenu");
        updateTowerPlacementIndicator();
        break;
      case "4":
        game.setSelectedTowerType(TowerType.WALL);
        dialogManager.hide("buildMenu");
        updateTowerPlacementIndicator();
        break;
    }
  };

  document.addEventListener("keydown", handleKeyPress);

  // Click outside to close panels (handled by DialogManager now)

  // Helper function to update button states
  const updateButtonStates = () => {
    // Update start wave button state
    if (game.isWaveComplete() && !game.isGameOverPublic()) {
      startWaveButton.style.opacity = "1";
      startWaveButton.style.pointerEvents = "auto";
    } else {
      startWaveButton.style.opacity = "0.5";
      startWaveButton.style.pointerEvents = "none";
    }

    // Update currency display in build menu - add null check
    if (buildMenuDialog) {
      buildMenuDialog.updateCurrency(game.getCurrency());
    }
  };

  // Get FloatingUIManager instance
  const floatingUI = game.getFloatingUIManager();
  const player = game.getPlayer();

  // Create Currency HUD using FloatingUIManager
  const currencyHUD = floatingUI.create('currency', 'custom', {
    persistent: true,
    autoHide: false,
    smoothing: 0,
    className: 'static-hud resource-item'
  });

  // Set currency HUD content and position
  const currencyElement = document.createElement('div');
  currencyElement.className = 'resource-item';
  currencyElement.style.cssText = 'position: fixed; top: 60px; left: 10px;';
  currencyElement.innerHTML = `
    <span class="resource-icon">💰</span>
    <span id="currency-value" class="resource-value">$${game.getCurrency()}</span>
  `;
  currencyHUD.setContent(currencyElement);
  currencyHUD.enable();

  // Update currency value every 100ms
  const currencyUpdateInterval = setInterval(() => {
    const valueElement = document.getElementById('currency-value');
    if (valueElement) {
      valueElement.textContent = `$${game.getCurrency()}`;
    }
  }, 100);

  // Create Wave HUD using FloatingUIManager
  const waveHUD = floatingUI.create('wave', 'custom', {
    persistent: true,
    autoHide: false,
    smoothing: 0,
    className: 'static-hud resource-item'
  });

  // Set wave HUD content and position
  const waveElement = document.createElement('div');
  waveElement.className = 'resource-item wave-info';
  waveElement.style.cssText = 'position: fixed; top: 60px; right: 10px;';
  waveElement.innerHTML = `
    <span class="resource-icon">🌊</span>
    <span id="wave-value" class="resource-value">Wave 1</span>
  `;
  waveHUD.setContent(waveElement);
  waveHUD.enable();

  // Update wave value every 100ms
  const waveUpdateInterval = setInterval(() => {
    const valueElement = document.getElementById('wave-value');
    if (valueElement) {
      const currentWave = game.getCurrentWave();
      const enemiesRemaining = game.getEnemiesRemaining();
      const isWaveActive = game.isWaveActive();

      if (isWaveActive && enemiesRemaining > 0) {
        valueElement.textContent = `Wave ${currentWave} - ${enemiesRemaining} enemies`;
      } else {
        valueElement.textContent = `Wave ${currentWave}`;
      }
    }
  }, 100);

  // Create Player Health HUD using FloatingUIManager
  const playerHealthHUD = floatingUI.create('player-health-hud', 'custom', {
    persistent: true,
    autoHide: false,
    smoothing: 0,
    className: 'static-hud resource-item'
  });

  // Set player health HUD content and position
  const healthElement = document.createElement('div');
  healthElement.className = 'resource-item';
  healthElement.id = 'player-health-container';
  healthElement.style.cssText = 'position: fixed; top: 120px; left: 10px;';
  healthElement.innerHTML = `
    <span class="resource-icon">❤️</span>
    <span id="player-health-value" class="resource-value">${player.health}/${player.getMaxHealth()}</span>
  `;
  playerHealthHUD.setContent(healthElement);
  playerHealthHUD.enable();

  // Update player health value every 100ms
  const healthUpdateInterval = setInterval(() => {
    const valueElement = document.getElementById('player-health-value');
    const containerElement = document.getElementById('player-health-container');
    if (valueElement && containerElement) {
      const currentHealth = player.health;
      const maxHealth = player.getMaxHealth();
      const healthPercent = currentHealth / maxHealth;

      // Determine color based on health percentage
      let colorClass = '';
      if (healthPercent <= 0.25) {
        colorClass = 'critical';
      } else if (healthPercent <= 0.5) {
        colorClass = 'low';
      } else if (healthPercent <= 0.75) {
        colorClass = 'medium';
      }

      valueElement.textContent = `${currentHealth}/${maxHealth}`;
      containerElement.className = `resource-item ${colorClass}`;
    }
  }, 100);

  // Create camera controls using FloatingUIManager
  const cameraControls = floatingUI.create('camera-controls', 'custom', {
    persistent: true,
    autoHide: false,
    className: 'ui-card camera-controls-container'
  });

  // Position camera controls fixed at top right
  const cameraControlsElement = cameraControls.getElement();
  cameraControlsElement.style.cssText = 'position: fixed; top: 120px; right: 10px;';
  cameraControlsElement.classList.add('ui-card');

  // Create camera control buttons
  const createCameraButton = (text: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'ui-button small';
    button.addEventListener('click', onClick);
    return button;
  };

  // Create zoom display
  const zoomDisplay = document.createElement('div');
  zoomDisplay.className = 'ui-text-center ui-text-secondary ui-mb-sm';
  zoomDisplay.style.fontSize = 'var(--font-xs)';

  // Create control buttons
  const zoomInButton = createCameraButton('+', () => {
    game.getCamera().zoomIn();
    audioManager.playUISound(SoundType.BUTTON_CLICK);
  });

  const zoomOutButton = createCameraButton('-', () => {
    game.getCamera().zoomOut();
    audioManager.playUISound(SoundType.BUTTON_CLICK);
  });

  const resetButton = createCameraButton('⟲', () => {
    game.getCamera().reset();
    audioManager.playUISound(SoundType.BUTTON_CLICK);
  });

  // Add controls to container
  const controlsContainer = document.createElement('div');
  controlsContainer.appendChild(zoomDisplay);
  const buttonRow = document.createElement('div');
  buttonRow.className = 'ui-flex ui-gap-xs';
  buttonRow.appendChild(zoomInButton);
  buttonRow.appendChild(zoomOutButton);
  buttonRow.appendChild(resetButton);
  controlsContainer.appendChild(buttonRow);

  cameraControls.setContent(controlsContainer).enable();

  // Update zoom display every 100ms
  const updateZoomDisplay = () => {
    const zoom = game.getCamera().getZoom();
    zoomDisplay.textContent = `Zoom: ${(zoom * 100).toFixed(0)}%`;
  };
  const zoomUpdateInterval = setInterval(updateZoomDisplay, 100);
  updateZoomDisplay();

  // Create power-up display
  const powerUpDisplay = new PowerUpDisplay({ game });
  powerUpDisplay.mount(gameContainer);

  // Set reference on game for notifications
  game.setPowerUpDisplay(powerUpDisplay);

  // All floating displays are now created using their respective components

  // Initialize all dialogs FIRST before setting up any UI that depends on them
  initializeDialogs();

  // Now that dialogs are initialized, we can set up the interval for button updates
  // Update button states periodically AFTER dialogs are initialized
  setInterval(updateButtonStates, ANIMATION_CONFIG.durations.fast);

  // Mobile controls - use multiple detection methods
  const isMobile =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  console.log("[SimpleGameUI] Mobile detection:", {
    isMobile,
    ontouchstart: "ontouchstart" in window,
    maxTouchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
  });

  // Check saved settings for touch joystick preference
  const savedSettings = localStorage.getItem("gameSettings");
  let showTouchJoysticks = true; // Default to true
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      showTouchJoysticks = settings.showTouchJoysticks !== false; // Default to true if not set
    } catch (e) {
      console.warn("[SimpleGameUI] Failed to parse saved settings:", e);
    }
  }

  let mobileControls: MobileControls | null = null;

  if (isMobile || window.location.hostname === "localhost") {
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
      enableHaptic: true,
    });
    // MobileControls appends itself to the container, so we don't need to do anything else
    // Show or hide based on saved settings
    if (showTouchJoysticks) {
      mobileControls.show();
    } else {
      mobileControls.hide();
      console.log(
        "[SimpleGameUI] Mobile controls created but hidden (per settings)"
      );
    }

    // Force visibility after a short delay to ensure DOM is ready
    if (showTouchJoysticks) {
      setTimeout(() => {
        const controlsEl = document.querySelector(".mobile-controls");
        if (controlsEl) {
          (controlsEl as HTMLElement).style.display = "block";
          (controlsEl as HTMLElement).style.visibility = "visible";
          console.log("[SimpleGameUI] Forced mobile controls visibility");
        } else {
          console.log(
            "[SimpleGameUI] Mobile controls element not found in DOM!"
          );
        }
      }, 100);
    }
  }

  // Listen for touch joystick toggle events
  window.addEventListener("touchJoysticksToggled", (event: Event) => {
    const customEvent = event as CustomEvent;
    const enabled = customEvent.detail.enabled;

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
    // Debug dialog tests disabled
  };

  // Add specific dialog test
  (window as any).testPlayerUpgrade = () => {
    console.log("[Debug] Testing player upgrade dialog...");
    showPlayerUpgradeDialog();
  };

  // Add inventory dialog test
  (window as any).testInventory = () => {
    console.log("[Debug] Testing inventory UI...");
    showInventoryUI();
  };

  // Add force fix command
  (window as any).fixDialogs = () => {
    console.log("[Debug] Forcing dialog fixes...");
    // Re-initialize dialogs
    initializeDialogs();
    console.log("[Debug] Dialogs re-initialized");
  };

  // Add debug command to test tower info dialog
  (window as any).testTowerInfo = () => {
    console.log("[Debug] Testing tower info dialog...");
    const towers = game.getTowers();
    if (towers.length > 0) {
      console.log(
        "[Debug] Found",
        towers.length,
        "towers, selecting first one"
      );
      const tower = towers[0];
      console.log("[Debug] Tower details:", {
        towerType: tower.towerType,
        position: tower.position,
        level: tower.getLevel(),
      });
      // Game.ts will automatically show TowerUpgradePopup
    } else {
      console.log("[Debug] No towers found! Place a tower first.");
    }
  };

  // Add direct selection test
  (window as any).selectFirstTower = () => {
    const towers = game.getTowers();
    if (towers.length > 0) {
      game.selectTower(towers[0]);
    }
  };

  // Add debug command to toggle mobile controls
  (window as any).toggleMobileControls = () => {
    const controlsEl = document.querySelector(
      ".mobile-controls"
    ) as HTMLElement;
    if (controlsEl) {
      const currentDisplay = window.getComputedStyle(controlsEl).display;
      controlsEl.style.display = currentDisplay === "none" ? "block" : "none";
      console.log("[Debug] Mobile controls display:", controlsEl.style.display);

      // Log all joystick elements
      // Joysticks are initialized elsewhere
    }
  };

  // Debug command to test damage on player
  (window as any).testPlayerDamage = () => {
    const damage = 10;
    player.takeDamage(damage);
    console.log(`[Debug] Applied ${damage} damage to player. Health: ${player.health}/${player.getMaxHealth()}`);
  };

  // Debug command to heal player
  (window as any).healPlayer = () => {
    player.heal(20);
    console.log(`[Debug] Healed player. Health: ${player.health}/${player.getMaxHealth()}`);
  };

  // Debug command to test power-up notifications
  (window as any).testPowerUpNotifications = () => {
    console.log('[Debug] Testing power-up notifications...');
    if (powerUpDisplay && powerUpDisplay.testNotifications) {
      powerUpDisplay.testNotifications();
    } else {
      console.warn('[Debug] PowerUpDisplay not available or missing testNotifications method');
    }
  };

  // Cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyPress);
    document.removeEventListener("towerPlaced", updateTowerPlacementIndicator);
    // Tower event listeners removed - Game.ts handles tower upgrades directly

    // Clean up floating UI elements
    cameraControls.destroy();
    powerUpDisplay.cleanup();

    // Clean up new floating UI system HUD elements
    clearInterval(currencyUpdateInterval);
    clearInterval(waveUpdateInterval);
    clearInterval(healthUpdateInterval);
    clearInterval(zoomUpdateInterval);
    floatingUI.remove('currency');
    floatingUI.remove('wave');
    floatingUI.remove('player-health-hud');
    floatingUI.remove('player-health');
    floatingUI.remove('camera-controls');

    dialogManager.destroy();
  };
}
