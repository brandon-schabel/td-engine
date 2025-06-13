import { Tower, UpgradeType } from '../entities/Tower';

// Re-export UpgradeType for convenience
export { UpgradeType };

/**
 * TowerUpgradeManager provides a centralized interface for managing tower upgrades.
 * This class acts as a wrapper around the Tower entity's built-in upgrade system,
 * providing additional utilities for cost calculation, affordability checks, and
 * upgrade information aggregation for UI systems.
 */
export class TowerUpgradeManager {
  /**
   * Get the cost to upgrade a specific tower attribute
   */
  getUpgradeCost(tower: Tower, upgradeType: UpgradeType): number {
    return tower.getUpgradeCost(upgradeType);
  }

  /**
   * Apply an upgrade to the tower and return the cost
   * Returns 0 if the upgrade failed (e.g., max level reached)
   */
  applyUpgrade(tower: Tower, upgradeType: UpgradeType): number {
    const cost = this.getUpgradeCost(tower, upgradeType);
    
    if (cost === 0) {
      return 0; // Cannot upgrade (max level reached)
    }
    
    const success = tower.upgrade(upgradeType);
    return success ? cost : 0;
  }

  /**
   * Check if a tower can afford and perform an upgrade
   */
  canAffordUpgrade(tower: Tower, upgradeType: UpgradeType, availableCurrency: number): boolean {
    return tower.canAffordUpgrade(upgradeType, availableCurrency);
  }

  /**
   * Get a human-readable description of what an upgrade does
   */
  getUpgradeDescription(upgradeType: UpgradeType): string {
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return 'Increase damage by 30%';
      case UpgradeType.RANGE:
        return 'Increase range by 25%';
      case UpgradeType.FIRE_RATE:
        return 'Increase fire rate by 20%';
      default:
        return 'Unknown upgrade';
    }
  }

  /**
   * Get comprehensive upgrade information for all upgrade types
   * Useful for displaying upgrade UI with all relevant information
   */
  getAllUpgradeInfo(tower: Tower): Array<{
    type: UpgradeType;
    name: string;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    description: string;
  }> {
    const upgradeTypes = [
      UpgradeType.DAMAGE,
      UpgradeType.RANGE,
      UpgradeType.FIRE_RATE
    ];

    return upgradeTypes.map(upgradeType => ({
      type: upgradeType,
      name: this.getUpgradeName(upgradeType),
      cost: this.getUpgradeCost(tower, upgradeType),
      level: tower.getUpgradeLevel(upgradeType),
      maxLevel: 5, // From UPGRADE_CONFIG.maxLevel
      canUpgrade: tower.canUpgrade(upgradeType),
      description: this.getUpgradeDescription(upgradeType)
    }));
  }

  /**
   * Get a friendly name for an upgrade type
   */
  private getUpgradeName(upgradeType: UpgradeType): string {
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return 'Damage';
      case UpgradeType.RANGE:
        return 'Range';
      case UpgradeType.FIRE_RATE:
        return 'Fire Rate';
      default:
        return 'Unknown';
    }
  }
}