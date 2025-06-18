/**
 * Base Upgrade Manager and Interfaces
 * Provides the foundation for upgrade systems across different entity types
 * 
 * Recent changes:
 * - Updated to use MathUtils for upgrade cost calculations
 */

import { calculateUpgradeCost, calculateTotalCostToLevel } from '@/utils/MathUtils';

/**
 * Configuration for upgrade mechanics
 */
export interface UpgradeConfig {
  baseCost: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
}

/**
 * Interface for entities that can be upgraded
 */
export interface Upgradeable<TUpgradeType> {
  /**
   * Apply an upgrade of the specified type
   * @param upgradeType The type of upgrade to apply
   * @returns true if the upgrade was successful, false if it failed (e.g., max level reached)
   */
  upgrade(upgradeType: TUpgradeType): boolean;

  /**
   * Check if the entity can be upgraded with the specified type
   * @param upgradeType The type of upgrade to check
   * @returns true if the upgrade is possible, false otherwise
   */
  canUpgrade(upgradeType: TUpgradeType): boolean;

  /**
   * Get the current upgrade level for the specified type
   * @param upgradeType The type of upgrade to check
   * @returns The current level (0-based)
   */
  getUpgradeLevel(upgradeType: TUpgradeType): number;
}

/**
 * Base class for upgrade managers
 * Provides common functionality for managing entity upgrades
 */
export abstract class BaseUpgradeManager<TUpgradeType, TEntity extends Upgradeable<TUpgradeType>> {
  /**
   * Get the upgrade configuration for different upgrade types
   * Must be implemented by subclasses to define their specific upgrade configs
   */
  protected abstract getUpgradeConfigs(): Record<string, UpgradeConfig>;

  /**
   * Get the upgrade configuration for a specific upgrade type
   */
  protected getUpgradeConfig(upgradeType: TUpgradeType): UpgradeConfig {
    const configs = this.getUpgradeConfigs();
    const config = configs[upgradeType as string];
    
    if (!config) {
      throw new Error(`No upgrade configuration found for type: ${upgradeType}`);
    }
    
    return config;
  }

  /**
   * Calculate the cost to upgrade an entity with a specific upgrade type
   */
  getUpgradeCost(entity: TEntity, upgradeType: TUpgradeType): number {
    const config = this.getUpgradeConfig(upgradeType);
    const currentLevel = entity.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= config.maxLevel) {
      return 0; // Max level reached, cannot upgrade
    }
    
    return calculateUpgradeCost(config.baseCost, config.costMultiplier, currentLevel);
  }

  /**
   * Get the effect multiplier for an upgrade at a specific level
   */
  getUpgradeEffect(upgradeType: TUpgradeType, level: number): number {
    const config = this.getUpgradeConfig(upgradeType);
    return 1 + (config.effectMultiplier * level);
  }

  /**
   * Check if an entity can afford a specific upgrade
   */
  canAffordUpgrade(entity: TEntity, upgradeType: TUpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(entity, upgradeType);
    return cost > 0 && availableCurrency >= cost && entity.canUpgrade(upgradeType);
  }

  /**
   * Apply an upgrade to an entity and return the cost
   * Returns 0 if the upgrade failed
   */
  applyUpgrade(entity: TEntity, upgradeType: TUpgradeType): number {
    const cost = this.getUpgradeCost(entity, upgradeType);
    
    if (cost === 0) {
      return 0; // Cannot upgrade
    }
    
    const success = entity.upgrade(upgradeType);
    return success ? cost : 0;
  }

  /**
   * Get comprehensive information about all possible upgrades for an entity
   */
  getUpgradeInfo(entity: TEntity): Array<{
    type: TUpgradeType;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
  }> {
    const configs = this.getUpgradeConfigs();
    
    return Object.keys(configs).map(upgradeTypeKey => {
      const upgradeType = upgradeTypeKey as TUpgradeType;
      const config = this.getUpgradeConfig(upgradeType);
      
      return {
        type: upgradeType,
        cost: this.getUpgradeCost(entity, upgradeType),
        level: entity.getUpgradeLevel(upgradeType),
        maxLevel: config.maxLevel,
        canUpgrade: entity.canUpgrade(upgradeType)
      };
    });
  }

  /**
   * Calculate the total cost to reach a specific level for an upgrade type
   */
  getTotalCostToLevel(upgradeType: TUpgradeType, targetLevel: number): number {
    const config = this.getUpgradeConfig(upgradeType);
    const maxLevel = Math.min(targetLevel, config.maxLevel);
    return calculateTotalCostToLevel(config.baseCost, config.costMultiplier, maxLevel);
  }

  /**
   * Get the maximum possible level for an upgrade type
   */
  getMaxLevel(upgradeType: TUpgradeType): number {
    const config = this.getUpgradeConfig(upgradeType);
    return config.maxLevel;
  }

  /**
   * Check if an upgrade type exists
   */
  isValidUpgradeType(upgradeType: TUpgradeType): boolean {
    try {
      this.getUpgradeConfig(upgradeType);
      return true;
    } catch {
      return false;
    }
  }
}
