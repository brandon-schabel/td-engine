import { Tower, TowerType, UpgradeType } from "@/entities/Tower";
import type { Vector2 } from "@/utils/Vector2";
import type { Grid } from "@/systems/Grid";
import { CellType } from "@/systems/Grid";
import { TOWER_COSTS } from "@/config/GameConfig";
import { utilizeEntityStore } from "@/stores/entityStore";
import { gameStore } from "@/stores/gameStore";
import type { AudioManager } from "@/audio/AudioManager";
import type { GameAudioHandler } from "@/systems/GameAudioHandler";
import type { UIController } from "@/ui/UIController";
import { Tower as TowerClass } from "@/entities/Tower";
import type { Camera } from "@/systems/Camera";

/**
 * Interface for managing currency operations
 */
export interface CurrencyManager {
  canAffordCurrency(amount: number): boolean;
  spendCurrency(amount: number): void;
  addCurrency(amount: number): void;
}

/**
 * Interface for touch gesture management
 */
export interface TouchGestureManager {
  setEnabled(enabled: boolean): void;
}

/**
 * Configuration for TowerManager
 */
export interface TowerManagerConfig {
  grid: Grid;
  audioHandler: GameAudioHandler;
  uiController: UIController;
  currencyManager: CurrencyManager;
  getCamera: () => Camera;
  touchGestureManager?: TouchGestureManager | null;
}

/**
 * Manages all tower-related operations including placement, selection, upgrades, and selling
 */
export class TowerManager {
  // Tower selection state
  private selectedTower: Tower | null = null;
  private hoverTower: Tower | null = null;
  private selectedTowerType: TowerType | null = null;
  private justSelectedTower: boolean = false;
  private justSelectedTowerType: boolean = false;

  // Dependencies
  private grid: Grid;
  private audioHandler: GameAudioHandler;
  private uiController: UIController;
  private currencyManager: CurrencyManager;
  private getCamera: () => Camera;
  private touchGestureManager?: TouchGestureManager | null;

  // Statistics
  private towersBuilt: number = 0;

  constructor(config: TowerManagerConfig) {
    this.grid = config.grid;
    this.audioHandler = config.audioHandler;
    this.uiController = config.uiController;
    this.currencyManager = config.currencyManager;
    this.getCamera = config.getCamera;
    this.touchGestureManager = config.touchGestureManager;
  }

  /**
   * Place a new tower at the specified world position
   * @param towerType The type of tower to place
   * @param worldPosition The world position to place the tower
   * @returns true if the tower was successfully placed, false otherwise
   */
  placeTower(towerType: TowerType, worldPosition: Vector2): boolean {
    const cost = TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];

    if (!this.currencyManager.canAffordCurrency(cost)) {
      return false;
    }

    const gridPos = this.grid.worldToGrid(worldPosition);

    if (!this.grid.canPlaceTower(gridPos.x, gridPos.y)) {
      return false;
    }

    // Place tower
    const tower = new TowerClass(towerType, worldPosition);

    // Add damage callback for health bar display
    tower.onDamage = (_event) => {
      // Could show damage numbers or flash effect for towers
      // For now, we'll let health bars handle the visual feedback
    };

    // Add to entity store instead of local array
    const entityStore = utilizeEntityStore.getState();
    entityStore.addTower(tower);

    // Track towers built
    this.towersBuilt++;
    gameStore.getState().recordTowerBuilt(towerType);

    // Update grid - walls are obstacles, other towers are towers
    if (towerType === TowerType.WALL) {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
    } else {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.TOWER);
    }

    // Spend currency
    this.currencyManager.spendCurrency(cost);

    // Play tower placement sound
    this.audioHandler.playTowerPlace();

    return true;
  }

  /**
   * Select a tower and show its upgrade menu
   * @param tower The tower to select
   */
  selectTower(tower: Tower): void {
    const entityStore = utilizeEntityStore.getState();
    const towers = entityStore.getAllTowers();

    if (!towers.find(t => t.id === tower.id)) {
      console.warn('[TowerManager] Attempted to select a tower that is not in the game');
      return;
    }

    console.log(`[TowerManager] Selecting tower: ${tower.towerType}`);

    const previousTower = this.selectedTower;

    // Always close any existing tower upgrade UI
    this.uiController.close('tower-upgrade');

    // Deselect previous tower if different
    if (previousTower && previousTower !== tower) {
      const deselectEvent = new CustomEvent('towerDeselected', {
        detail: { tower: previousTower }
      });
      document.dispatchEvent(deselectEvent);
    }

    this.selectedTower = tower;
    entityStore.selectTower(tower);
    this.setSelectedTowerType(null); // Clear tower placement mode

    // Calculate screen position for tower
    const camera = this.getCamera();
    const screenPos = camera.worldToScreen(tower.position);

    // Check if mobile
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

    if (isMobile) {
      // On mobile, center the upgrade menu
      this.uiController.showTowerUpgrade(tower, {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
    } else {
      // On desktop, position near the tower
      this.uiController.showTowerUpgrade(tower, screenPos);
    }

    // Debug logging
    console.log(`[TowerManager] Tower upgrade UI created for ${tower.towerType} at position:`, tower.position, 'screen:', screenPos);

    // Dispatch select event
    const selectEvent = new CustomEvent('towerSelected', {
      detail: { tower }
    });
    document.dispatchEvent(selectEvent);
  }

  /**
   * Deselect the currently selected tower
   */
  deselectTower(): void {
    if (this.selectedTower) {
      const tower = this.selectedTower;
      this.selectedTower = null;

      const entityStore = utilizeEntityStore.getState();
      entityStore.selectTower(null);

      // Close upgrade UI through UIController
      this.uiController.close('tower-upgrade');

      // Dispatch deselect event
      const deselectEvent = new CustomEvent('towerDeselected', {
        detail: { tower }
      });
      document.dispatchEvent(deselectEvent);
    }
  }

  /**
   * Upgrade a tower with the specified upgrade type
   * @param tower The tower to upgrade
   * @param upgradeType The type of upgrade to apply
   * @returns true if the upgrade was successful, false otherwise
   */
  upgradeTower(tower: Tower, upgradeType: UpgradeType): boolean {
    const cost = tower.getUpgradeCost(upgradeType);

    if (!this.currencyManager.canAffordCurrency(cost)) {
      return false;
    }

    if (!tower.canUpgrade(upgradeType)) {
      return false;
    }

    if (tower.upgrade(upgradeType)) {
      this.currencyManager.spendCurrency(cost);
      this.audioHandler.playTowerUpgrade();
      return true;
    }

    return false;
  }

  /**
   * Sell a tower and return currency to the player
   * @param tower The tower to sell
   * @returns true if the tower was successfully sold, false otherwise
   */
  sellTower(tower: Tower): boolean {
    const entityStore = utilizeEntityStore.getState();
    const towers = entityStore.getAllTowers();
    const towerIndex = towers.findIndex(t => t.id === tower.id);
    
    if (towerIndex === -1) {
      console.warn('[TowerManager] Attempted to sell a tower that is not in the game');
      return false;
    }

    // Get sell value before removing
    const sellValue = tower.getSellValue();

    // Get tower grid position to clear it
    const gridPos = this.grid.worldToGrid(tower.position);

    // Remove tower from entity store
    entityStore.removeTower(tower.id);

    // Clear grid cell
    this.grid.setCellType(gridPos.x, gridPos.y, CellType.EMPTY);

    // Add currency from selling
    this.currencyManager.addCurrency(sellValue);

    // Clear selection if this was the selected tower
    if (this.selectedTower === tower) {
      this.deselectTower();
    }

    // Play tower placement sound (reusing for sell)
    this.audioHandler.playTowerPlace();

    // Dispatch tower sold event
    const towerSoldEvent = new CustomEvent('towerSold', {
      detail: { tower }
    });
    document.dispatchEvent(towerSoldEvent);

    return true;
  }

  /**
   * Check if the player can afford a specific tower type
   * @param towerType The type of tower to check
   * @returns true if the player can afford the tower, false otherwise
   */
  canAffordTower(towerType: TowerType): boolean {
    return this.currencyManager.canAffordCurrency(
      TOWER_COSTS[towerType as keyof typeof TOWER_COSTS]
    );
  }

  /**
   * Get the cost of a specific tower type
   * @param towerType The type of tower
   * @returns The cost of the tower
   */
  getTowerCost(towerType: TowerType): number {
    return TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];
  }

  /**
   * Set the currently selected tower type for placement
   * @param towerType The tower type to select, or null to clear selection
   */
  setSelectedTowerType(towerType: TowerType | null): void {
    this.selectedTowerType = towerType;

    // Enter or exit build mode based on tower selection
    if (towerType) {
      this.uiController.enterBuildMode(towerType);
      // Prevent immediate placement after selecting from build menu
      this.justSelectedTowerType = true;
      setTimeout(() => {
        this.justSelectedTowerType = false;
      }, 100);

      // Disable gestures during tower placement
      if (this.touchGestureManager) {
        this.touchGestureManager.setEnabled(false);
      }
    } else {
      this.uiController.exitBuildMode();

      // Re-enable gestures after tower placement
      if (this.touchGestureManager) {
        this.touchGestureManager.setEnabled(true);
      }
    }
  }

  /**
   * Get the currently selected tower type
   */
  getSelectedTowerType(): TowerType | null {
    return this.selectedTowerType;
  }

  /**
   * Get the currently selected tower
   */
  getSelectedTower(): Tower | null {
    return this.selectedTower;
  }

  /**
   * Set the hover tower
   * @param tower The tower to hover, or null to clear
   */
  setHoverTower(tower: Tower | null): void {
    this.hoverTower = tower;
    const entityStore = utilizeEntityStore.getState();
    entityStore.hoverTower(tower);
  }

  /**
   * Get the hover tower
   */
  getHoverTower(): Tower | null {
    return this.hoverTower;
  }

  /**
   * Set the just selected tower flag
   * @param value The flag value
   */
  setJustSelectedTower(value: boolean): void {
    this.justSelectedTower = value;
  }

  /**
   * Get the just selected tower flag
   */
  getJustSelectedTower(): boolean {
    return this.justSelectedTower;
  }

  /**
   * Get the just selected tower type flag
   */
  getJustSelectedTowerType(): boolean {
    return this.justSelectedTowerType;
  }

  /**
   * Get the number of towers built
   */
  getTowersBuilt(): number {
    return this.towersBuilt;
  }

  /**
   * Reset the tower manager state
   */
  reset(): void {
    this.selectedTower = null;
    this.hoverTower = null;
    this.selectedTowerType = null;
    this.justSelectedTower = false;
    this.justSelectedTowerType = false;
    this.towersBuilt = 0;
  }
}