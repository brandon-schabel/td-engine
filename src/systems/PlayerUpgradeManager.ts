import { Player, PlayerUpgradeType } from '../entities/Player';

interface PlayerUpgradeCostMap {
  [PlayerUpgradeType.DAMAGE]: number;
  [PlayerUpgradeType.SPEED]: number;
  [PlayerUpgradeType.FIRE_RATE]: number;
  [PlayerUpgradeType.HEALTH]: number;
}

const BASE_UPGRADE_COSTS: PlayerUpgradeCostMap = {
  [PlayerUpgradeType.DAMAGE]: 25,
  [PlayerUpgradeType.SPEED]: 20,
  [PlayerUpgradeType.FIRE_RATE]: 30,
  [PlayerUpgradeType.HEALTH]: 35
};

export class PlayerUpgradeManager {
  getUpgradeCost(player: Player, upgradeType: PlayerUpgradeType): number {
    const currentLevel = player.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= 5) {
      return 0; // Max level reached
    }
    
    const baseCost = BASE_UPGRADE_COSTS[upgradeType];
    // Cost increases by 50% for each level
    return Math.floor(baseCost * Math.pow(1.5, currentLevel));
  }

  applyUpgrade(player: Player, upgradeType: PlayerUpgradeType): number {
    if (!player.canUpgrade(upgradeType)) {
      return 0; // Cannot upgrade
    }

    const cost = this.getUpgradeCost(player, upgradeType);
    
    if (player.upgrade(upgradeType)) {
      return cost;
    }
    
    return 0; // Upgrade failed
  }

  canAffordUpgrade(player: Player, upgradeType: PlayerUpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(player, upgradeType);
    return availableCurrency >= cost && player.canUpgrade(upgradeType);
  }

  getUpgradeDescription(upgradeType: PlayerUpgradeType): string {
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE:
        return 'Increase damage by 40%';
      case PlayerUpgradeType.SPEED:
        return 'Increase movement speed by 30%';
      case PlayerUpgradeType.FIRE_RATE:
        return 'Increase fire rate by 25%';
      case PlayerUpgradeType.HEALTH:
        return 'Increase max health by 50%';
      default:
        return 'Unknown upgrade';
    }
  }

  getAllUpgradeInfo(player: Player): Array<{
    type: PlayerUpgradeType;
    name: string;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    description: string;
  }> {
    return Object.values(PlayerUpgradeType).map(upgradeType => ({
      type: upgradeType,
      name: this.getUpgradeName(upgradeType),
      cost: this.getUpgradeCost(player, upgradeType),
      level: player.getUpgradeLevel(upgradeType),
      maxLevel: 5,
      canUpgrade: player.canUpgrade(upgradeType),
      description: this.getUpgradeDescription(upgradeType)
    }));
  }

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
      default:
        return 'Unknown';
    }
  }
}