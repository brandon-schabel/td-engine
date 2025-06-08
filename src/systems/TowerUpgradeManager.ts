import { Tower, TowerType } from '../entities/Tower';

export enum UpgradeType {
  DAMAGE = 'DAMAGE',
  RANGE = 'RANGE',
  FIRE_RATE = 'FIRE_RATE'
}

interface UpgradeConfig {
  baseCost: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
}

const UPGRADE_CONFIGS: Record<UpgradeType, UpgradeConfig> = {
  [UpgradeType.DAMAGE]: {
    baseCost: 15,
    costMultiplier: 1.5,
    effectMultiplier: 0.3, // 30% increase per level
    maxLevel: 5
  },
  [UpgradeType.RANGE]: {
    baseCost: 20,
    costMultiplier: 1.5,
    effectMultiplier: 0.25, // 25% increase per level
    maxLevel: 5
  },
  [UpgradeType.FIRE_RATE]: {
    baseCost: 25,
    costMultiplier: 1.5,
    effectMultiplier: 0.2, // 20% increase per level
    maxLevel: 5
  }
};

export class TowerUpgradeManager {
  getUpgradeCost(tower: Tower, upgradeType: UpgradeType): number {
    const config = UPGRADE_CONFIGS[upgradeType];
    const currentLevel = tower.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= config.maxLevel) {
      return 0; // Cannot upgrade further
    }
    
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
  }

  canAffordUpgrade(tower: Tower, upgradeType: UpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(tower, upgradeType);
    return cost > 0 && availableCurrency >= cost;
  }

  applyUpgrade(tower: Tower, upgradeType: UpgradeType): number {
    if (!tower.canUpgrade(upgradeType)) {
      return 0;
    }
    
    const cost = this.getUpgradeCost(tower, upgradeType);
    tower.upgrade(upgradeType);
    
    return cost;
  }

  getMaxLevel(upgradeType: UpgradeType): number {
    return UPGRADE_CONFIGS[upgradeType].maxLevel;
  }

  getUpgradeEffect(upgradeType: UpgradeType, level: number): number {
    const config = UPGRADE_CONFIGS[upgradeType];
    return 1 + (config.effectMultiplier * level);
  }
}