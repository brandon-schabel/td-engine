/**
 * Tower Upgrade Manager
 * Manages upgrade logic for towers
 * 
 * Recent changes:
 * - Initial creation extending BaseUpgradeManager
 * - Implemented tower-specific upgrade configurations
 * - Added optimal upgrade path calculation
 * - Added batch upgrade support
 * - Added upgrade effect calculations
 */

import { BaseUpgradeManager } from './BaseUpgradeManager';
import { Tower, UpgradeType } from '@/entities/Tower';
import { TOWER_UPGRADES } from '@/config/TowerConfig';

// Define the interface locally to avoid import issues
interface UpgradeConfig {
  baseCost: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
}

export { UpgradeType } from '@/entities/Tower';

interface UpgradePathItem {
  type: UpgradeType;
  cost: number;
  efficiency: number;
  currentLevel: number;
  effectIncrease: number;
}

export class TowerUpgradeManager extends BaseUpgradeManager<UpgradeType, Tower> {
  /**
   * Get upgrade configurations for all tower upgrade types
   */
  protected getUpgradeConfigs(): Record<string, UpgradeConfig> {
    return {
      [UpgradeType.DAMAGE]: {
        baseCost: TOWER_UPGRADES.baseCosts.DAMAGE,
        costMultiplier: TOWER_UPGRADES.costMultiplier,
        effectMultiplier: TOWER_UPGRADES.bonusMultipliers.DAMAGE,
        maxLevel: TOWER_UPGRADES.maxLevel
      },
      [UpgradeType.RANGE]: {
        baseCost: TOWER_UPGRADES.baseCosts.RANGE,
        costMultiplier: TOWER_UPGRADES.costMultiplier,
        effectMultiplier: TOWER_UPGRADES.bonusMultipliers.RANGE,
        maxLevel: TOWER_UPGRADES.maxLevel
      },
      [UpgradeType.FIRE_RATE]: {
        baseCost: TOWER_UPGRADES.baseCosts.FIRE_RATE,
        costMultiplier: TOWER_UPGRADES.costMultiplier,
        effectMultiplier: TOWER_UPGRADES.bonusMultipliers.FIRE_RATE,
        maxLevel: TOWER_UPGRADES.maxLevel
      }
    };
  }

  /**
   * Get the optimal upgrade path for a tower given available currency
   */
  getOptimalUpgradePath(tower: Tower, availableCurrency: number): UpgradePathItem[] {
    const upgradePath: UpgradePathItem[] = [];
    const upgradeTypes = Object.values(UpgradeType);
    
    // Calculate efficiency for each possible upgrade
    const possibleUpgrades = upgradeTypes
      .map(type => {
        const cost = this.getUpgradeCost(tower, type);
        const currentLevel = tower.getUpgradeLevel(type);
        
        if (cost === 0 || cost > availableCurrency || !tower.canUpgrade(type)) {
          return null;
        }
        
        // Calculate effect increase
        const currentEffect = this.getUpgradeEffect(type, currentLevel);
        const nextEffect = this.getUpgradeEffect(type, currentLevel + 1);
        const effectIncrease = nextEffect - currentEffect;
        
        // Calculate efficiency (effect increase per currency spent)
        const efficiency = effectIncrease / cost;
        
        return {
          type,
          cost,
          efficiency,
          currentLevel,
          effectIncrease
        };
      })
      .filter((item): item is UpgradePathItem => item !== null)
      .sort((a, b) => b.efficiency - a.efficiency);
    
    // Build upgrade path within budget
    let remainingCurrency = availableCurrency;
    for (const upgrade of possibleUpgrades) {
      if (upgrade.cost <= remainingCurrency) {
        upgradePath.push(upgrade);
        remainingCurrency -= upgrade.cost;
      }
    }
    
    return upgradePath;
  }

  /**
   * Apply multiple upgrades to a tower
   */
  applyMultipleUpgrades(
    tower: Tower, 
    upgrades: Array<{ type: UpgradeType; levels: number }>,
    availableCurrency: number
  ): {
    totalCost: number;
    successfulUpgrades: UpgradeType[];
    failedUpgrades: UpgradeType[];
  } {
    let totalCost = 0;
    const successfulUpgrades: UpgradeType[] = [];
    const failedUpgrades: UpgradeType[] = [];
    let remainingCurrency = availableCurrency;
    
    for (const { type, levels } of upgrades) {
      let upgradesApplied = 0;
      
      for (let i = 0; i < levels; i++) {
        const cost = this.getUpgradeCost(tower, type);
        
        if (cost === 0 || cost > remainingCurrency || !tower.canUpgrade(type)) {
          if (upgradesApplied === 0) {
            failedUpgrades.push(type);
          }
          break;
        }
        
        const success = tower.upgrade(type);
        if (success) {
          totalCost += cost;
          remainingCurrency -= cost;
          upgradesApplied++;
        } else {
          if (upgradesApplied === 0) {
            failedUpgrades.push(type);
          }
          break;
        }
      }
      
      if (upgradesApplied > 0) {
        successfulUpgrades.push(type);
      }
    }
    
    return { totalCost, successfulUpgrades, failedUpgrades };
  }

  /**
   * Get all upgrade information for a tower
   */
  getAllUpgradeInfo(tower: Tower): Array<{
    type: UpgradeType;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    effect: number;
    nextEffect: number;
  }> {
    const baseInfo = this.getUpgradeInfo(tower);
    
    return baseInfo.map(info => ({
      ...info,
      effect: this.getUpgradeEffect(info.type, info.level),
      nextEffect: info.canUpgrade ? this.getUpgradeEffect(info.type, info.level + 1) : this.getUpgradeEffect(info.type, info.level)
    }));
  }

  /**
   * Calculate the damage output of a tower (DPS)
   */
  calculateDPS(tower: Tower): number {
    const damage = tower.damage;
    const fireRate = tower.fireRate;
    return damage * fireRate;
  }

  /**
   * Get upgrade recommendations for a specific tower
   */
  getUpgradeRecommendation(tower: Tower, enemyTypes: string[]): UpgradeType | null {
    // If tower has low fire rate and facing many enemies, prioritize fire rate
    if (tower.fireRate < 2 && enemyTypes.length > 5) {
      if (tower.canUpgrade(UpgradeType.FIRE_RATE)) {
        return UpgradeType.FIRE_RATE;
      }
    }
    
    // If tower has short range, prioritize range
    if (tower.range < 100) {
      if (tower.canUpgrade(UpgradeType.RANGE)) {
        return UpgradeType.RANGE;
      }
    }
    
    // Otherwise, prioritize damage
    if (tower.canUpgrade(UpgradeType.DAMAGE)) {
      return UpgradeType.DAMAGE;
    }
    
    // Return any available upgrade
    const upgradeTypes = Object.values(UpgradeType);
    for (const type of upgradeTypes) {
      if (tower.canUpgrade(type)) {
        return type;
      }
    }
    
    return null;
  }
}