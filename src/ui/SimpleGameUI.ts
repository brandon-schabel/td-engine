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
import {
  CurrencyDisplay,
  WaveDisplay,
  HealthDisplay,
  FloatingCameraControls,
} from "./components/floating";
import { DialogManager } from "./systems/DialogManager";
import {
  BuildMenuDialogAdapter,
  InventoryDialogAdapter,
  SettingsDialog,
  PauseDialog,
} from "./components/dialogs";


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
  let inventoryDialog: InventoryDialogAdapter;
  let settingsDialog: SettingsDialog;
  let pauseDialog: PauseDialog;

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

      // Inventory Dialog - should already be registered
      const existingInventory = dialogManager.getDialog("inventory");
      if (existingInventory) {
        inventoryDialog = existingInventory as InventoryDialogAdapter;
      } else {
        // Fallback: create it here
        inventoryDialog = new InventoryDialogAdapter({
          game,
          audioManager,
          onItemSelected: () => {
            // Additional item selection logic if needed
          },
        });
        dialogManager.register("inventory", inventoryDialog);
      }

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
    controlBar.className = "control-bar";
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
    console.log("[SimpleGameUI] Using existing bottom-ui-container");
    // Clear existing content
    controlBar.innerHTML = "";
    // Ensure it has the right styles
    controlBar.style.display = "flex";
    controlBar.style.alignItems = "center";
    controlBar.style.justifyContent = "center";
    controlBar.style.gap = "clamp(8px, 2vw, 12px)";
  }

  // Create control buttons
  const createControlButton = (
    iconType: IconType,
    title: string,
    onClick: () => void
  ) => {
    const button = document.createElement("button");
    button.className = "ui-button control-button icon-only";
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
      // Check if build menu dialog exists, create if needed
      if (!dialogManager.getDialog("buildMenu")) {
        console.warn("[SimpleGameUI] Build menu dialog not found, creating...");
        const tempBuildDialog = new BuildMenuDialogAdapter({
          game,
          audioManager,
          onTowerSelected: () => {
            updateTowerPlacementIndicator();
          },
          onClosed: () => {
            updateTowerPlacementIndicator();
          },
        });
        dialogManager.register("buildMenu", tempBuildDialog);
      }
      dialogManager.toggle("buildMenu");
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
      dialogManager.show("inventory");
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
  // Tower selection is now handled directly by Game.ts with TowerUpgradePopup

  // Show player upgrade dialog
  const showPlayerUpgradeDialog = () => {
    console.log(
      "[SimpleGameUI] showPlayerUpgradeDialog called - using DialogShowFix"
    );
    dialogManager.show("playerUpgrade");
  };

  // Listen for tower selection events - simplified to just let Game handle it
  const handleTowerSelected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log("[SimpleGameUI] Tower selected:", tower.towerType, "- Game will handle with TowerUpgradePopup");
    // Game.ts will automatically show TowerUpgradePopup, no need to show SimpleTowerInfo
  };

  const handleTowerDeselected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log("[SimpleGameUI] Tower deselected:", tower.towerType);
    // Game.ts will automatically hide TowerUpgradePopup
  };

  // Add event listeners for tower selection
  document.addEventListener(
    "towerSelected",
    handleTowerSelected as EventListener
  );
  document.addEventListener(
    "towerDeselected",
    handleTowerDeselected as EventListener
  );

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
        // Check if build menu dialog exists, create if needed
        if (!dialogManager.getDialog("buildMenu")) {
          console.warn(
            "[SimpleGameUI] Build menu dialog not found, creating..."
          );
          const tempBuildDialog = new BuildMenuDialogAdapter({
            game,
            audioManager,
            onTowerSelected: () => {
              updateTowerPlacementIndicator();
            },
            onClosed: () => {
              updateTowerPlacementIndicator();
            },
          });
          dialogManager.register("buildMenu", tempBuildDialog);
        }
        dialogManager.toggle("buildMenu");
        break;
      case "u":
        showPlayerUpgradeDialog();
        break;
      case "e":
        if (!game) {
          console.warn("[SimpleGameUI] Game not initialized yet");
          return;
        }
        dialogManager.show("inventory");
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

  // Create resource display using CurrencyDisplay
  const currencyDisplay = new CurrencyDisplay(game);
  currencyDisplay.mount(gameContainer);

  // Create wave display using WaveDisplay
  const waveDisplay = new WaveDisplay(game);
  waveDisplay.mount(gameContainer);

  // Create camera controls using FloatingCameraControls
  const cameraControls = new FloatingCameraControls({
    position: { top: 120, right: 10 },
    game,
    audioManager,
  });
  cameraControls.mount(gameContainer);

  // Create player health display using HealthDisplay
  const healthDisplay = new HealthDisplay(game);
  healthDisplay.mount(gameContainer);

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
    console.log("[Debug] Testing inventory dialog...");
    // Use DialogManager directly
    dialogManager.show("inventory");
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

  // Test new FloatingUIManager with player health bar
  const floatingUI = game.getFloatingUIManager();
  const player = game.getPlayer();

  // Import helper to create health bar content
  const floatingHelpers = await import('@/ui/floating/helpers');
  const { createHealthBar, updateHealthBar, flashElement } = floatingHelpers;

  // Create a health bar for the player using new floating UI system
  const playerHealthBar = floatingUI.create('player-health', 'healthbar', {
    offset: { x: 0, y: -30 },
    anchor: 'top',
    smoothing: 0.2,
    autoHide: false, // Always show player health
    mobileScale: 0.9
  });

  // Set initial content and target
  const playerHealth = player.health;
  const playerMaxHealth = player.getMaxHealth();

  playerHealthBar
    .setContent(createHealthBar(playerHealth, playerMaxHealth, {
      showPercentage: true,
      width: 60,
      height: 10,
      color: '#4CAF50'
    }))
    .setTarget(player)
    .enable();

  console.log('[SimpleGameUI] Created player health bar using new FloatingUIManager');

  // Update health bar when player takes damage
  let lastHealth = playerHealth;
  const healthUpdateInterval = setInterval(() => {
    const currentHealth = player.health;
    const maxHealth = player.getMaxHealth();

    if (currentHealth !== lastHealth) {
      updateHealthBar(playerHealthBar.getElement(), currentHealth, maxHealth);

      // Flash the health bar if damaged
      if (currentHealth < lastHealth) {
        flashElement(playerHealthBar.getElement(), 'damaged');
      }

      lastHealth = currentHealth;
    }
  }, 100);

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

  // Cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyPress);
    document.removeEventListener("towerPlaced", updateTowerPlacementIndicator);
    document.removeEventListener(
      "towerSelected",
      handleTowerSelected as EventListener
    );
    document.removeEventListener(
      "towerDeselected",
      handleTowerDeselected as EventListener
    );

    // Clean up floating UI elements
    currencyDisplay.destroy();
    waveDisplay.destroy();
    healthDisplay.destroy();
    cameraControls.destroy();
    powerUpDisplay.cleanup();

    // Clean up new floating UI system
    clearInterval(healthUpdateInterval);
    floatingUI.remove('player-health');

    dialogManager.destroy();
  };
}
