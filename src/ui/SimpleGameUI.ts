import { Game } from "../core/Game";
import { TowerType, Tower, UpgradeType } from "@/entities/Tower";
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
  container.style.cssText = 'width: 100%;';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Build Tower';
  title.style.cssText = `
    margin: 0 0 20px 0;
    color: ${COLOR_THEME.ui.text.primary};
    text-align: center;
    font-size: 24px;
  `;
  container.appendChild(title);

  // Tower options grid
  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  `;

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
    button.style.cssText = `
      padding: 16px;
      background: ${canAfford ? COLOR_THEME.ui.background.primary : 'rgba(100, 100, 100, 0.3)'};
      border: 2px solid ${canAfford ? tower.color : 'rgba(100, 100, 100, 0.5)'};
      border-radius: 8px;
      cursor: ${canAfford ? 'pointer' : 'not-allowed'};
      opacity: ${canAfford ? '1' : '0.5'};
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    `;

    if (canAfford) {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.borderColor = COLOR_THEME.ui.text.success;
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.borderColor = tower.color;
      });
      button.addEventListener('click', () => {
        audioManager.playUISound(SoundType.BUTTON_CLICK);
        onTowerSelect(tower.type);
      });
    }

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = `color: ${tower.color}; width: 48px; height: 48px;`;
    iconDiv.innerHTML = createSvgIcon(tower.icon, { size: 48 });
    button.appendChild(iconDiv);

    // Name
    const nameDiv = document.createElement('div');
    nameDiv.textContent = tower.name;
    nameDiv.style.cssText = `
      color: ${COLOR_THEME.ui.text.primary};
      font-weight: bold;
      font-size: 14px;
    `;
    button.appendChild(nameDiv);

    // Cost
    const costDiv = document.createElement('div');
    costDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      color: ${canAfford ? COLOR_THEME.ui.currency : COLOR_THEME.ui.text.danger};
      font-size: 12px;
    `;
    costDiv.innerHTML = `${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(tower.cost)}`;
    button.appendChild(costDiv);

    grid.appendChild(button);
  });

  container.appendChild(grid);

  // Currency display
  const currencyDiv = document.createElement('div');
  currencyDiv.style.cssText = `
    text-align: center;
    padding: 12px;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 6px;
    border: 1px solid rgba(255, 215, 0, 0.3);
  `;
  currencyDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      ${createSvgIcon(IconType.COINS, { size: 20 })}
      <span style="font-size: 18px; font-weight: bold; color: #FFD700;">${formatNumber(currency)}</span>
      <span style="color: #ccc; font-size: 14px;">Available</span>
    </div>
  `;
  container.appendChild(currencyDiv);

  return container;
}

// Helper function to create tower upgrade content
function createTowerUpgradeContent(tower: Tower, game: Game, audioManager: AudioManager, callbacks: {
  onUpgrade?: (tower: Tower) => void;
  onSell?: (tower: Tower) => void;
}): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    background: ${COLOR_THEME.ui.background.secondary}f0;
    border: 2px solid ${COLOR_THEME.ui.border.default};
    border-radius: 8px;
    padding: 16px;
    min-width: 280px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${COLOR_THEME.ui.border.default}44;
  `;

  const towerNames: Record<string, string> = {
    [TowerType.BASIC]: 'Basic Tower',
    [TowerType.SNIPER]: 'Sniper Tower',
    [TowerType.RAPID]: 'Rapid Tower',
    [TowerType.WALL]: 'Wall'
  };

  const towerIcons: Record<string, IconType> = {
    [TowerType.BASIC]: IconType.BASIC_TOWER,
    [TowerType.SNIPER]: IconType.SNIPER_TOWER,
    [TowerType.RAPID]: IconType.RAPID_TOWER,
    [TowerType.WALL]: IconType.WALL
  };

  const towerColors: Record<string, string> = {
    [TowerType.BASIC]: COLOR_THEME.towers.basic,
    [TowerType.SNIPER]: COLOR_THEME.towers.frost,
    [TowerType.RAPID]: COLOR_THEME.towers.artillery,
    [TowerType.WALL]: COLOR_THEME.towers.wall
  };

  const iconDiv = document.createElement('div');
  iconDiv.style.cssText = `color: ${towerColors[tower.towerType]}; width: 32px; height: 32px;`;
  iconDiv.innerHTML = createSvgIcon(towerIcons[tower.towerType], { size: 32 });
  header.appendChild(iconDiv);

  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'flex: 1;';
  titleDiv.innerHTML = `
    <div style="font-weight: bold; font-size: 16px; color: ${COLOR_THEME.ui.text.primary};">
      ${towerNames[tower.towerType]}
    </div>
    <div style="font-size: 12px; color: ${COLOR_THEME.ui.text.secondary};">
      Level ${tower.getLevel()}
    </div>
  `;
  header.appendChild(titleDiv);

  container.appendChild(header);

  // Current stats
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = `
    margin-bottom: 16px;
    padding: 10px;
    background: ${COLOR_THEME.ui.background.primary}66;
    border-radius: 6px;
  `;

  const stats = [
    { label: 'Damage', value: tower.damage, icon: IconType.DAMAGE },
    { label: 'Range', value: tower.range, icon: IconType.RANGE },
    { label: 'Fire Rate', value: `${(1000 / tower.fireRate).toFixed(1)}/s`, icon: IconType.SPEED }
  ];

  stats.forEach(stat => {
    const statRow = document.createElement('div');
    statRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    `;
    statRow.innerHTML = `
      <span style="width: 16px; height: 16px; color: ${COLOR_THEME.ui.text.secondary};">
        ${createSvgIcon(stat.icon, { size: 16 })}
      </span>
      <span style="font-size: 12px; color: ${COLOR_THEME.ui.text.secondary}; flex: 1;">
        ${stat.label}
      </span>
      <span style="font-size: 13px; font-weight: bold; color: ${COLOR_THEME.ui.text.primary};">
        ${stat.value}
      </span>
    `;
    statsDiv.appendChild(statRow);
  });

  container.appendChild(statsDiv);

  // Upgrade options
  const currency = game.getCurrency();
  const upgradeTypes = [
    { type: UpgradeType.DAMAGE, name: 'Damage', icon: IconType.DAMAGE, effect: '+25% damage' },
    { type: UpgradeType.RANGE, name: 'Range', icon: IconType.RANGE, effect: '+20% range' },
    { type: UpgradeType.FIRE_RATE, name: 'Fire Rate', icon: IconType.SPEED, effect: '+30% speed' }
  ];

  const hasUpgrades = tower.getLevel() < tower.getMaxUpgradeLevel();

  if (hasUpgrades) {
    const upgradesDiv = document.createElement('div');
    upgradesDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    `;

    upgradeTypes.forEach(upgrade => {
      const level = tower.getUpgradeLevel(upgrade.type);
      const maxLevel = tower.getMaxUpgradeLevel();
      const cost = tower.getUpgradeCost(upgrade.type);
      const canAfford = currency >= cost && level < maxLevel;
      const isMaxed = level >= maxLevel;

      const upgradeButton = document.createElement('button');
      upgradeButton.disabled = !canAfford || isMaxed;
      upgradeButton.style.cssText = `
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid ${isMaxed ? 'rgba(255, 215, 0, 0.5)' : 'rgba(76, 175, 80, 0.5)'};
        border-radius: 6px;
        cursor: ${canAfford && !isMaxed ? 'pointer' : 'not-allowed'};
        opacity: ${!isMaxed ? '1' : '0.7'};
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      if (canAfford && !isMaxed) {
        upgradeButton.addEventListener('click', () => {
          if (game.upgradeTower(tower, upgrade.type)) {
            audioManager.playUISound(SoundType.UPGRADE);
            callbacks.onUpgrade?.(tower);
            // Re-render the content
            container.innerHTML = '';
            const newContent = createTowerUpgradeContent(tower, game, audioManager, callbacks);
            Array.from(newContent.children).forEach(child => container.appendChild(child));
          }
        });
      }

      upgradeButton.innerHTML = `
        <div style="width: 24px; height: 24px; color: ${COLOR_THEME.ui.text.success};">
          ${createSvgIcon(upgrade.icon, { size: 24 })}
        </div>
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: bold; color: ${isMaxed ? '#FFD700' : '#4CAF50'}; font-size: 14px;">
            ${upgrade.name} ${isMaxed ? '(MAX)' : `(Lvl ${level}/${maxLevel})`}
          </div>
          <div style="color: #999; font-size: 11px;">${upgrade.effect}</div>
        </div>
        ${!isMaxed ? `
          <div style="display: flex; align-items: center; gap: 4px; color: ${canAfford ? '#FFD700' : '#999'}; font-size: 12px;">
            ${createSvgIcon(IconType.COINS, { size: 16 })}
            ${formatNumber(cost)}
          </div>
        ` : ''}
      `;

      upgradesDiv.appendChild(upgradeButton);
    });

    container.appendChild(upgradesDiv);
  }

  // Sell button
  const sellValue = tower.getSellValue();
  const sellButton = document.createElement('button');
  sellButton.style.cssText = `
    width: 100%;
    padding: 10px;
    background: ${COLOR_THEME.ui.background.secondary}88;
    border: 1px solid ${COLOR_THEME.ui.text.danger}66;
    border-radius: 6px;
    color: ${COLOR_THEME.ui.text.danger};
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  sellButton.innerHTML = `
    Sell for ${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(sellValue)}
  `;

  sellButton.addEventListener('mouseenter', () => {
    sellButton.style.background = `${COLOR_THEME.ui.text.danger}22`;
  });

  sellButton.addEventListener('mouseleave', () => {
    sellButton.style.background = `${COLOR_THEME.ui.background.secondary}88`;
  });

  sellButton.addEventListener('click', () => {
    if (game.sellTower(tower)) {
      audioManager.playUISound(SoundType.SELL);
      callbacks.onSell?.(tower);
    }
  });

  container.appendChild(sellButton);

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
      className: 'build-menu-dialog',
      zIndex: 500
    });

    // Create build menu content using BuildMenuDialog logic
    const content = createBuildMenuContent(game, audioManager, (towerType) => {
      game.setSelectedTowerType(towerType);
      updateTowerPlacementIndicator();
      floatingUI.remove('build-menu');
    });

    // Style the dialog
    buildMenuDialog.getElement().style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${COLOR_THEME.ui.background.secondary}f0;
      border: 2px solid ${COLOR_THEME.ui.border.default};
      border-radius: 12px;
      padding: 24px;
      min-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: ${COLOR_THEME.ui.text.secondary};
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
    `;
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

  // Listen for tower selection events and create upgrade popup
  const handleTowerSelected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log("[SimpleGameUI] Tower selected:", tower.towerType);

    // Create tower upgrade popup using FloatingUIManager
    const upgradePopup = floatingUI.create(`tower-upgrade-${tower.id}`, 'popup', {
      offset: { x: 0, y: -30 },
      anchor: 'top',
      smoothing: 0.2,
      autoHide: false,
      className: 'tower-upgrade-popup'
    });

    // Create upgrade content
    const upgradeContent = createTowerUpgradeContent(tower, game, audioManager, {
      onUpgrade: () => {
        console.log('[SimpleGameUI] Tower upgraded');
      },
      onSell: () => {
        console.log('[SimpleGameUI] Tower sold');
        floatingUI.remove(`tower-upgrade-${tower.id}`);
      }
    });

    upgradePopup.setContent(upgradeContent)
      .setTarget(tower)
      .enable();

    // Store reference on tower for cleanup
    (tower as any)._upgradePopupId = `tower-upgrade-${tower.id}`;
  };

  const handleTowerDeselected = (event: CustomEvent) => {
    const tower = event.detail.tower;
    console.log("[SimpleGameUI] Tower deselected:", tower.towerType);

    // Remove the upgrade popup if it exists
    const popupId = (tower as any)._upgradePopupId;
    if (popupId) {
      floatingUI.remove(popupId);
      delete (tower as any)._upgradePopupId;
    }
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
    className: 'static-hud currency-hud'
  });

  // Set currency HUD content and position
  currencyHUD.setContent(`
    <div style="position: fixed; top: 60px; left: 10px; background: ${COLOR_THEME.ui.background.overlay}; 
         border: 2px solid ${COLOR_THEME.ui.currency}; border-radius: ${UI_CONSTANTS.floatingUI.borderRadius}px;
         padding: ${UI_CONSTANTS.floatingUI.padding}px; color: ${COLOR_THEME.ui.currency};
         font-weight: bold; font-size: clamp(14px, 3vw, 18px); display: flex; align-items: center; gap: ${UI_CONSTANTS.spacing.sm}px;">
      <span>💰</span>
      <span id="currency-value">$${game.getCurrency()}</span>
    </div>
  `);
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
    className: 'static-hud wave-hud'
  });

  // Set wave HUD content and position
  waveHUD.setContent(`
    <div style="position: fixed; top: 60px; right: 10px; background: ${COLOR_THEME.ui.background.overlay};
         border: 2px solid ${COLOR_THEME.ui.wave}; border-radius: ${UI_CONSTANTS.floatingUI.borderRadius}px;
         padding: ${UI_CONSTANTS.floatingUI.padding}px; color: ${COLOR_THEME.ui.wave};
         font-weight: bold; font-size: clamp(14px, 3vw, 18px); display: flex; align-items: center; gap: ${UI_CONSTANTS.spacing.sm}px;">
      <span>🌊</span>
      <span id="wave-value">Wave 1</span>
    </div>
  `);
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
    className: 'static-hud health-hud'
  });

  // Set player health HUD content and position
  playerHealthHUD.setContent(`
    <div style="position: fixed; top: 120px; left: 10px; background: ${COLOR_THEME.ui.background.overlay};
         border: 2px solid ${COLOR_THEME.ui.health.high}; border-radius: ${UI_CONSTANTS.floatingUI.borderRadius}px;
         padding: ${UI_CONSTANTS.floatingUI.padding}px; font-weight: bold; font-size: clamp(14px, 3vw, 18px);
         display: flex; align-items: center; gap: ${UI_CONSTANTS.spacing.sm}px;" id="player-health-container">
      <span>❤️</span>
      <span id="player-health-value" style="color: ${COLOR_THEME.ui.health.high}">${player.health}/${player.getMaxHealth()}</span>
    </div>
  `);
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
      let color = COLOR_THEME.ui.health.high;
      if (healthPercent <= 0.25) {
        color = '#ff0000' as any; // Critical - red
      } else if (healthPercent <= 0.5) {
        color = '#F44336' as any; // Low - red
      } else if (healthPercent <= 0.75) {
        color = '#FF9800' as any; // Medium - orange
      }

      valueElement.textContent = `${currentHealth}/${maxHealth}`;
      valueElement.style.color = color;
      containerElement.style.borderColor = color;
    }
  }, 100);

  // Create camera controls using FloatingUIManager
  const cameraControls = floatingUI.create('camera-controls', 'custom', {
    persistent: true,
    autoHide: false,
    className: 'camera-controls-container'
  });

  // Position camera controls fixed at top right
  cameraControls.getElement().style.cssText = `
    position: fixed;
    top: 120px;
    right: 10px;
    background: ${COLOR_THEME.ui.background.secondary}f0;
    border: 2px solid #00BCD4;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
  `;

  // Create camera control buttons
  const createCameraButton = (text: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 8px 12px;
      background: ${COLOR_THEME.ui.background.primary};
      border: 1px solid ${COLOR_THEME.ui.border.default};
      border-radius: 4px;
      color: ${COLOR_THEME.ui.text.primary};
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.background = COLOR_THEME.ui.button.primary;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = COLOR_THEME.ui.background.primary;
    });
    button.addEventListener('click', onClick);
    return button;
  };

  // Create zoom display
  const zoomDisplay = document.createElement('div');
  zoomDisplay.style.cssText = `
    text-align: center;
    color: ${COLOR_THEME.ui.text.primary};
    font-size: 12px;
    margin-bottom: 8px;
  `;

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
  buttonRow.style.cssText = 'display: flex; gap: 4px;';
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
    document.removeEventListener(
      "towerSelected",
      handleTowerSelected as EventListener
    );
    document.removeEventListener(
      "towerDeselected",
      handleTowerDeselected as EventListener
    );

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
