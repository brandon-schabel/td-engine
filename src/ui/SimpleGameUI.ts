import { Game } from "../core/Game";
import { IconType } from "./icons/SvgIcons";
import { AudioManager, SoundType } from "../audio/AudioManager";

import { PowerUpDisplay } from "./components/game/SimplePowerUpDisplay";
import { PlayerLevelDisplay } from "./components/game/PlayerLevelDisplay";
import { MobileControls } from "./components/game/MobileControls";

import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { isMobile as checkIsMobile } from "@/config/ResponsiveConfig";
import { createIconButton, createResourceDisplay, cn } from "@/ui/elements";
import { PersistentPositionManager } from "@/ui/utils/PersistentPositionManager";



export async function setupSimpleGameUI(game: Game, audioManager: AudioManager) {
  const gameContainer = document.getElementById("app-container");
  if (!gameContainer) {
    console.error("[SimpleGameUI] ERROR: app-container element not found!");
    return;
  }
  // Get UIController reference
  const uiController = game.getUIController();

  // Use the existing bottom UI container if available, otherwise create control bar
  let controlBar = document.getElementById("bottom-ui-container");
  if (!controlBar) {
    controlBar = document.createElement("div");
    controlBar.className = cn('ui-control-bar');
    gameContainer.appendChild(controlBar);
  } else {
    console.log("[SimpleGameUI] Using existing bottom-ui-container");
    // Ensure it has the proper styling
    controlBar.className = cn(
      'absolute',
      'bottom-0',
      'left-0',
      'right-0',
      'h-[60px]',
      'bg-surface-secondary/80',
      'backdrop-blur-sm',
      'border-t',
      'border-border-primary',
      'flex',
      'items-center',
      'justify-center',
      'gap-2',
      'px-4',
      'z-20'
    );
  }

  console.log(
    "[SimpleGameUI] Setting up control bar. Control bar element:",
    controlBar
  );

  // Helper to create control buttons
  const createControlButton = (icon: IconType, title: string, onClick: () => void) => {
    const button = createIconButton(icon, {
      size: 'md',
      onClick,
      ariaLabel: title,
      variant: 'primary',
      customClasses: [
        'ui-button-control',
        'border-2',
        'hover:scale-105',
        'transition-transform'
      ]
    });
    button.setAttribute('title', title);
    return button;
  };

  // Function to update tower placement indicator
  const updateTowerPlacementIndicator = () => {
    const selectedType = game.getSelectedTowerType();
    const isMobile =
      "ontouchstart" in window || checkIsMobile(window.innerWidth);
    const indicator = document.getElementById("tower-placement-indicator");

    if (selectedType && isMobile && indicator) {
      const towerNames: Record<string, string> = {
        BASIC: "Basic Tower",
        SNIPER: "Sniper Tower",
        RAPID: "Rapid Tower",
        WALL: "Wall",
      };
      const towerName = towerNames[selectedType] || selectedType;
      indicator.innerHTML = `📍 Tap to place ${towerName}`;
      indicator.classList.remove('opacity-0');
      indicator.classList.add('opacity-100');
    } else if (indicator) {
      indicator.classList.remove('opacity-100');
      indicator.classList.add('opacity-0');
    }
  };

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
    uiController.showBuildMenu(screenPos.x, screenPos.y, (towerType) => {
      game.setSelectedTowerType(towerType);
      updateTowerPlacementIndicator();
    }, buildButtonElement || undefined);
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
      console.log("[SimpleGameUI] Start wave button clicked");
      console.log("[SimpleGameUI] Wave complete:", game.isWaveComplete());
      console.log("[SimpleGameUI] Game over:", game.isGameOverPublic());
      console.log("[SimpleGameUI] Current wave:", game.getCurrentWave());
      console.log("[SimpleGameUI] Game paused:", game.isPaused());
      console.log("[SimpleGameUI] Button disabled:", startWaveButton.disabled);
      audioManager.playUISound(SoundType.BUTTON_CLICK);

      if (game.isWaveComplete() && !game.isGameOverPublic()) {
        console.log("[SimpleGameUI] Starting next wave...");
        const started = game.startNextWave();
        console.log("[SimpleGameUI] Wave started:", started);
      } else {
        console.log("[SimpleGameUI] Cannot start wave - conditions not met");
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
            console.log('[SimpleGameUI] Settings requested from pause menu');
            // Get scene manager from global window object
            const sceneManager = (window as any).sceneManager;
            if (sceneManager) {
              // Store the return scene globally
              (window as any).__settingsReturnScene = 'game';
              // Close pause menu and switch to settings scene
              uiController.close('pause-menu');
              sceneManager.switchTo('settings');
            }
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
      console.log("[SimpleGameUI] Settings button clicked");
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      // Pause the game and show pause menu
      if (!game.isPaused()) {
        game.pause();
        uiController.showPauseMenu({
          onResume: () => {
            game.resume();
            uiController.close('pause-menu');
          },
          onSettings: () => {
            console.log('[SimpleGameUI] Settings requested from pause menu');
            // Get scene manager from global window object
            const sceneManager = (window as any).sceneManager;
            if (sceneManager) {
              // Store the return scene globally
              (window as any).__settingsReturnScene = 'game';
              // Close pause menu and switch to settings scene
              uiController.close('pause-menu');
              sceneManager.switchTo('settings');
            }
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
  const towerPlacementIndicator = document.createElement('div');
  towerPlacementIndicator.id = "tower-placement-indicator";
  towerPlacementIndicator.className = cn(
    'fixed',
    'top-1/2',
    'left-1/2',
    'transform',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'bg-surface-secondary',
    'text-primary',
    'px-4',
    'py-2',
    'rounded-lg',
    'shadow-lg',
    'pointer-events-none',
    'opacity-0',
    'transition-opacity',
    'z-20'
  );
  gameContainer.appendChild(towerPlacementIndicator);

  // Listen for tower placed event to clear selection
  document.addEventListener("towerPlaced", () => {
    updateTowerPlacementIndicator();
  });

  // Keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case "b":
        buildButton.click();
        break;
      case "u":
        playerUpgradeButton.click();
        break;
      case "e":
        inventoryButton.click();
        break;
      case "enter":
        if (game.isWaveComplete() && !game.isGameOverPublic()) {
          startWaveButton.click();
        }
        break;
      case " ":
        e.preventDefault();
        pauseButton.click();
        break;
    }
  };

  document.addEventListener("keydown", handleKeyPress);

  // Game pause/resume handling
  document.addEventListener("gamePaused", () => {
    // Visual feedback when paused
    gameContainer.classList.add("game-paused");
  });

  document.addEventListener("gameResumed", () => {
    gameContainer.classList.remove("game-paused");
  });

  // Create currency display
  let currencyDisplay = createResourceDisplay({
    value: game.getCurrency(),
    icon: IconType.COINS,
    id: 'currency-display',
    variant: 'compact',
    showIcon: true
  });

  // Create floating currency display with draggable functionality
  const floatingUI = game.getFloatingUIManager();
  const currencyFloatingElement = floatingUI.create('currency-display-floating', 'custom', {
    className: cn('pointer-events-auto'),
    screenSpace: true,
    draggable: true,
    persistPosition: true,
    positionKey: 'currency-display-position',
    zIndex: 500,
    smoothing: 0,
    autoHide: false,
    persistent: true
  });
  
  currencyFloatingElement.setContent(currencyDisplay);
  
  // Load saved position or use default
  const savedCurrencyPos = PersistentPositionManager.loadPosition('currency-display', 'currency-display-position');
  if (savedCurrencyPos) {
    // Position will be set by FloatingUIElement's loadStoredPosition
    currencyFloatingElement.enable();
  } else {
    // Set default position in top-left
    const defaultPos = PersistentPositionManager.getDefaultPosition(150, 50, 'top-left', 10);
    currencyFloatingElement.setTarget({ x: defaultPos.x, y: defaultPos.y });
    currencyFloatingElement.enable();
  }

  // Create a container for right-side resources (used by player level display)
  const rightResources = document.createElement('div');
  rightResources.className = cn('fixed', 'top-2', 'right-2', 'pointer-events-none', 'z-40');
  gameContainer.appendChild(rightResources);

  // Setup power-up display
  const powerUpDisplay = new PowerUpDisplay({
    game
  });
  powerUpDisplay.mount(gameContainer);

  // Player level display setup
  // Clean up any existing instances first
  (PlayerLevelDisplay as any).cleanupAll?.();
  
  const playerLevelDisplay = new PlayerLevelDisplay({ game });
  playerLevelDisplay.mount(rightResources);
  
  // Connect to game instance for level up notifications
  game.setPlayerLevelDisplay(playerLevelDisplay);

  // Mobile controls setup
  if ("ontouchstart" in window || checkIsMobile(window.innerWidth)) {
    new MobileControls({
      game,
      container: gameContainer
    });
  }

  // Handle window resize
  const handleResize = () => {
    const isMobile = checkIsMobile(window.innerWidth);
    const mobileControlsContainer = document.querySelector(".mobile-controls");
    if (mobileControlsContainer) {
      if (isMobile && "ontouchstart" in window) {
        mobileControlsContainer.classList.add("visible");
        mobileControlsContainer.classList.remove("hidden");
      } else {
        mobileControlsContainer.classList.remove("visible");
        mobileControlsContainer.classList.add("hidden");
      }
    }
  };

  window.addEventListener("resize", handleResize);
  handleResize();

  // Wave completion handling
  const waveButton = startWaveButton as HTMLButtonElement;
  const originalStartText = "Start Next Wave (Enter)";
  const startingText = "Starting...";

  console.log("[SimpleGameUI] Wave button element:", waveButton);
  console.log("[SimpleGameUI] Initial wave complete status:", game.isWaveComplete());

  const handleWaveComplete = () => {
    console.log("[SimpleGameUI] handleWaveComplete - enabling wave button");
    waveButton.disabled = false;
    waveButton.setAttribute("title", originalStartText);
    waveButton.setAttribute("aria-label", originalStartText);

    // Animate the button to draw attention
    waveButton.classList.add("animate-pulse");
    setTimeout(() => {
      waveButton.classList.remove("animate-pulse");
    }, ANIMATION_CONFIG.durations.slow);
  };

  const handleWaveStart = () => {
    waveButton.disabled = true;
    waveButton.setAttribute("title", startingText);
    waveButton.setAttribute("aria-label", startingText);
  };

  // Listen for wave events
  document.addEventListener("waveComplete", handleWaveComplete);
  document.addEventListener("waveStarted", handleWaveStart);

  // Currency update handling
  const updateCurrency = () => {
    if ((currencyDisplay as any).updateValue) {
      (currencyDisplay as any).updateValue(game.getCurrency());
    }
  };

  document.addEventListener("currencyChanged", updateCurrency);
  document.addEventListener("towerBuilt", updateCurrency);
  document.addEventListener("towerUpgraded", updateCurrency);
  document.addEventListener("towerSold", updateCurrency);

  // Upgrade management handled by UIController

  // Initial states
  // Check if we should enable the wave button at start
  if (game.isWaveComplete()) {
    handleWaveComplete(); // Enable the wave button if wave is complete
  } else {
    handleWaveStart(); // Disable the wave button if wave is active
  }
  updateCurrency();

  console.log("[SimpleGameUI] Simple game UI setup complete!");

  // Simple health bar setup
  // const healthBar = new SimpleHealthBarUI(game);
  // healthBar.initialize();

  // Camera UI setup
  // const cameraUI = new CameraControlsUI(game);
  // cameraUI.initialize();

  // // Player upgrade UI setup
  // const upgradeUI = new PlayerUpgradeUI(game);
  // await upgradeUI.initialize();
}

export function setupControlBar(
  _game: Game,
  gameContainer: HTMLElement
): HTMLElement {
  // Check if control bar already exists
  let controlBar = document.getElementById("control-bar");
  if (!controlBar) {
    controlBar = document.createElement("div");
    controlBar.id = "control-bar";
    controlBar.className = cn('ui-control-bar');
    gameContainer.appendChild(controlBar);
  }
  return controlBar;
}