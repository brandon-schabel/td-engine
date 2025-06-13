import { Player, PlayerUpgradeType } from '../entities/Player';

/**
 * PlayerUpgradeManager provides a centralized interface for managing player upgrades.
 * This class acts as a wrapper around the Player entity's built-in upgrade system,
 * providing additional utilities for cost calculation, affordability checks, and
 * upgrade information aggregation for UI systems.
 */
export class PlayerUpgradeManager {
  /**
   * Get the cost to upgrade a specific player attribute
   */
  getUpgradeCost(player: Player, upgradeType: PlayerUpgradeType): number {
    return player.getUpgradeCost(upgradeType);
  }

  /**
   * Apply an upgrade to the player and return the cost
   * Returns 0 if the upgrade failed (e.g., max level reached)
   */
  applyUpgrade(player: Player, upgradeType: PlayerUpgradeType): number {
    const cost = this.getUpgradeCost(player, upgradeType);
    
    if (cost === 0) {
      return 0; // Cannot upgrade (max level reached)
    }
    
    const success = player.upgrade(upgradeType);
    return success ? cost : 0;
  }

  /**
   * Check if a player can afford and perform an upgrade
   */
  canAffordUpgrade(player: Player, upgradeType: PlayerUpgradeType, availableCurrency: number): boolean {
    return player.canAffordUpgrade(upgradeType, availableCurrency);
  }

  /**
   * Get a human-readable description of what an upgrade does
   */
  getUpgradeDescription(upgradeType: PlayerUpgradeType): string {
    return new Player({ x: 0, y: 0 }).getUpgradeDescription(upgradeType);
  }

  /**
   * Get comprehensive upgrade information for all upgrade types
   * Useful for displaying upgrade UI with all relevant information
   */
  getAllUpgradeInfo(player: Player): Array<{
    type: PlayerUpgradeType;
    name: string;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    description: string;
  }> {
    const upgradeTypes = [
      PlayerUpgradeType.DAMAGE,
      PlayerUpgradeType.SPEED,
      PlayerUpgradeType.FIRE_RATE,
      PlayerUpgradeType.HEALTH,
      PlayerUpgradeType.REGENERATION
    ];

    return upgradeTypes.map(upgradeType => ({
      type: upgradeType,
      name: this.getUpgradeName(upgradeType),
      cost: this.getUpgradeCost(player, upgradeType),
      level: player.getUpgradeLevel(upgradeType),
      maxLevel: 5, // From UPGRADE_CONFIG.maxLevel
      canUpgrade: player.canUpgrade(upgradeType),
      description: this.getUpgradeDescription(upgradeType)
    }));
  }

  /**
   * Get a friendly name for an upgrade type
   */
  private getUpgradeName(upgradeType: PlayerUpgradeType): string {
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE:
        return 'Damage';
      case PlayerUpgradeType.SPEED:
        return 'Speed';
      case PlayerUpgradeType.FIRE_RATE:
        return 'Fire Rate';
      case PlayerUpgradeType.HEALTH:
        return 'Health';
      case PlayerUpgradeType.REGENERATION:
        return 'Regeneration';
      default:
        return 'Unknown';
    }
  }
}