import { Game } from "../core/Game";
import { TowerType } from "@/entities/Tower";
import { createSvgIcon, IconType } from "./icons/SvgIcons";
import { AudioManager, SoundType } from "../audio/AudioManager";

import { PowerUpDisplay } from "./components/game/SimplePowerUpDisplay";
import { MobileControls } from "./components/game/MobileControls";
import { IconButton } from "./components/game/IconButton";
import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { isMobile as checkIsMobile } from "@/config/ResponsiveConfig";



export async function setupSimpleGameUI(game: Game, audioManager: AudioManager) {
  const gameContainer = document.getElementById("game-container");
  if (!gameContainer) {
    console.error("[SimpleGameUI] ERROR: game-container element not found!");
    return;
  }
  // Get UIController reference
  const uiController = game.getUIController();

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
        uiController.close('pause-menu');
      } else {
        game.pause();
        uiController.showPauseMenu({
          onResume: () => {
            game.resume();
            uiController.close('pause-menu');
          },
          onSettings: () => {
            uiController.showSettings();
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
          }
        });
      }
    }
  );

  const settingsButton = createControlButton(
    IconType.SETTINGS,
    "Settings",
    () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      // Use UIController to show settings with anchor element
      const uiController = game.getUIController();
      uiController.showSettings(settingsButton);
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
      towerPlacementIndicator.classList.add('visible');
    } else {
      towerPlacementIndicator.classList.remove('visible');
    }
  };

  // Listen for tower placed event to clear selection
  document.addEventListener("towerPlaced", () => {
    updateTowerPlacementIndicator();
  });

  // Keep track of current tower info - removed SimpleTowerInfo usage
  // Tower selection is now handled directly by Game.ts with TowerUpgradeUI

  // Player upgrade UI is now managed by UIController

  // Show player upgrade dialog using FloatingUIManager
  const showPlayerUpgradeDialog = () => {
    console.log("[SimpleGameUI] showPlayerUpgradeDialog called - using UIController");

    // Get the player upgrade button element
    const playerUpgradeBtnElement = document.querySelector('.ui-button-control[title*="Player Upgrades"]') as HTMLElement;
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    if (playerUpgradeBtnElement) {
      const rect = playerUpgradeBtnElement.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the button
      };
    }

    // Use UIController to show the player upgrade menu with anchor element
    const uiController = game.getUIController();
    const player = game.getPlayer();
    if (player) {
      uiController.showPlayerUpgrade(player, screenPos, playerUpgradeBtnElement || undefined);
    }
  };

  // Show inventory UI using FloatingUIManager
  const showInventoryUI = () => {
    console.log("[SimpleGameUI] showInventoryUI called - using UIController");

    // Get the inventory button element
    const inventoryBtnElement = document.querySelector('.ui-button-control[title*="Inventory"]') as HTMLElement;
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    if (inventoryBtnElement) {
      const rect = inventoryBtnElement.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the button
      };
    }

    // Use UIController to show the inventory with anchor element
    const uiController = game.getUIController();
    uiController.showInventory(screenPos, inventoryBtnElement || undefined);
  };

  // Show build menu using UIController
  const showBuildMenu = () => {
    // Get the build button element
    const buildButtonElement = document.querySelector('.ui-button-control[title*="Build"]') as HTMLElement;
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    if (buildButtonElement) {
      const rect = buildButtonElement.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the button
      };
    }

    // Use UIController to show the build menu with anchor element
    const uiController = game.getUIController();
    uiController.showBuildMenu(screenPos.x, screenPos.y, (towerType) => {
      game.setSelectedTowerType(towerType);
      updateTowerPlacementIndicator();
    }, buildButtonElement || undefined);
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
    // UIController handles escape key globally

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
          uiController.close('pause-menu');
        } else {
          game.pause();
          uiController.showPauseMenu({
            onResume: () => {
              game.resume();
              uiController.close('pause-menu');
            },
            onSettings: () => {
              uiController.showSettings();
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
            }
          });
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
        // Close tower upgrade UI if open
        else if (game.getSelectedTower()) {
          game.deselectTower();
        }
        // UIController handles closing dialogs on escape
        break;
      case "1":
        game.setSelectedTowerType(TowerType.BASIC);
        uiController.close('build-menu');
        updateTowerPlacementIndicator();
        break;
      case "2":
        game.setSelectedTowerType(TowerType.SNIPER);
        uiController.close('build-menu');
        updateTowerPlacementIndicator();
        break;
      case "3":
        game.setSelectedTowerType(TowerType.RAPID);
        uiController.close('build-menu');
        updateTowerPlacementIndicator();
        break;
      case "4":
        game.setSelectedTowerType(TowerType.WALL);
        uiController.close('build-menu');
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
      startWaveButton.classList.remove('disabled');
      startWaveButton.disabled = false;
    } else {
      startWaveButton.classList.add('disabled');
      startWaveButton.disabled = true;
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
    className: 'static-hud resource-item',
    screenSpace: true,
    anchor: 'top',
    offset: { x: 0, y: 0 }
  });

  // Set currency HUD content and position
  const currencyElement = document.createElement('div');
  currencyElement.className = 'resource-item';
  currencyElement.innerHTML = `
    <span class="resource-icon">💰</span>
    <span id="currency-value" class="resource-value">$${game.getCurrency()}</span>
  `;
  currencyHUD.setContent(currencyElement);

  // Position at top-left of screen
  const currencyPosition = {
    position: { x: 60, y: 60 },
    getPosition: () => ({ x: 60, y: 60 })
  };
  currencyHUD.setTarget(currencyPosition as any);
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
    className: 'static-hud resource-item',
    screenSpace: true,
    anchor: 'top',
    offset: { x: 0, y: 0 }
  });

  // Set wave HUD content and position
  const waveElement = document.createElement('div');
  waveElement.className = 'resource-item wave-info';
  waveElement.innerHTML = `
    <span class="resource-icon">🌊</span>
    <span id="wave-value" class="resource-value">Wave 1</span>
  `;
  waveHUD.setContent(waveElement);

  // Position at top-right of screen
  const wavePosition = {
    position: { x: window.innerWidth - 120, y: 60 },
    getPosition: () => ({ x: window.innerWidth - 120, y: 60 })
  };
  waveHUD.setTarget(wavePosition as any);
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

  // Player health bar is now created in Game.ts to follow the player in world space

  // Create camera controls using FloatingUIManager
  const cameraControls = floatingUI.create('camera-controls', 'custom', {
    persistent: true,
    autoHide: false,
    className: 'camera-controls-container'
  });

  // Position camera controls fixed at top right
  const cameraControlsElement = cameraControls.getElement();
  cameraControlsElement.classList.add('camera-controls-positioned');

  // Create zoom display
  const zoomDisplay = document.createElement('div');
  zoomDisplay.className = 'camera-zoom-display';

  // Create control buttons using IconButton
  const zoomInButton = new IconButton({
    iconType: IconType.ZOOM_IN,
    iconSize: 22,
    title: 'Zoom In',
    className: 'camera-control-button zoom-in',
    onClick: () => {
      game.getCamera().zoomIn();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    }
  });

  const zoomOutButton = new IconButton({
    iconType: IconType.ZOOM_OUT,
    iconSize: 22,
    title: 'Zoom Out',
    className: 'camera-control-button zoom-out',
    onClick: () => {
      game.getCamera().zoomOut();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    }
  });

  const resetButton = new IconButton({
    iconType: IconType.RESET_ZOOM,
    iconSize: 20,
    title: 'Reset Zoom',
    className: 'camera-control-button reset-zoom',
    onClick: () => {
      game.getCamera().reset();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
    }
  });

  // Add controls to container
  const controlsContainer = document.createElement('div');
  controlsContainer.appendChild(zoomDisplay);
  const buttonRow = document.createElement('div');
  buttonRow.className = 'camera-controls-buttons';
  buttonRow.appendChild(zoomInButton.getElement());
  buttonRow.appendChild(zoomOutButton.getElement());
  buttonRow.appendChild(resetButton.getElement());
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

  // Update button states periodically
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
          (controlsEl as HTMLElement).classList.add('visible');
          (controlsEl as HTMLElement).classList.remove('hidden');
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
    const detail = (event as CustomEvent).detail;
    const enabled = detail.enabled;

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
      const isVisible = controlsEl.classList.contains('visible');
      if (isVisible) {
        controlsEl.classList.remove('visible');
        controlsEl.classList.add('hidden');
      } else {
        controlsEl.classList.add('visible');
        controlsEl.classList.remove('hidden');
      }
      console.log("[Debug] Mobile controls visible:", !isVisible);

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

  // Setup game end event listener
  const handleGameEnd = (_event: Event) => {
    // Game end event received, show game over UI
    // Event details available in (event as CustomEvent).detail if needed

    // Show game over UI
    import('@/ui/floating/GameOverUI').then(({ GameOverUI }) => {
      const gameOverUI = new GameOverUI(game);
      gameOverUI.show({
        onRestart: () => {
          // Restart the game
          window.location.reload();
        },
        onMainMenu: () => {
          // Go to main menu
          window.location.reload();
        }
      });
    }).catch(error => {
      console.error('[SimpleGameUI] Failed to load GameOverUI:', error);
    });
  };

  document.addEventListener('gameEnd', handleGameEnd);

  // Cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyPress);
    document.removeEventListener("towerPlaced", updateTowerPlacementIndicator);
    document.removeEventListener('gameEnd', handleGameEnd);
    // Tower event listeners removed - Game.ts handles tower upgrades directly

    // Clean up floating UI elements
    cameraControls.destroy();
    powerUpDisplay.cleanup();

    // Clean up new floating UI system HUD elements
    clearInterval(currencyUpdateInterval);
    clearInterval(waveUpdateInterval);
    clearInterval(zoomUpdateInterval);
    floatingUI.remove('currency');
    floatingUI.remove('wave');
    floatingUI.remove('camera-controls');
  };
}
