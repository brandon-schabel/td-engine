/**
 * Unified Upgrade System
 * Consolidates upgrade management logic to reduce duplication and improve maintainability
 */

import { BaseUpgradeManager, type UpgradeConfig, type Upgradeable } from './BaseUpgradeManager';
import { Tower, TowerType } from '../entities/Tower';
import { Player, PlayerUpgradeType } from '../entities/Player';
import { UpgradeType as TowerUpgradeType } from './TowerUpgradeManager';

// Unified upgrade configuration registry
export class UpgradeConfigRegistry {
  private static configs = new Map<string, UpgradeConfig>();

  static register(category: string, upgradeType: string, config: UpgradeConfig): void {
    const key = `${category}.${upgradeType}`;
    this.configs.set(key, config);
  }

  static get(category: string, upgradeType: string): UpgradeConfig | undefined {
    const key = `${category}.${upgradeType}`;
    return this.configs.get(key);
  }

  static getAll(category: string): Map<string, UpgradeConfig> {
    const result = new Map<string, UpgradeConfig>();
    for (const [key, config] of this.configs.entries()) {
      if (key.startsWith(`${category}.`)) {
        const upgradeType = key.substring(category.length + 1);
        result.set(upgradeType, config);
      }
    }
    return result;
  }

  static initialize(): void {
    // Tower upgrade configurations
    this.register('tower', TowerUpgradeType.DAMAGE, {
      baseCost: 15,
      costMultiplier: 1.5,
      effectMultiplier: 0.3,
      maxLevel: 5
    });

    this.register('tower', TowerUpgradeType.RANGE, {
      baseCost: 20,
      costMultiplier: 1.5,
      effectMultiplier: 0.25,
      maxLevel: 5
    });

    this.register('tower', TowerUpgradeType.FIRE_RATE, {
      baseCost: 25,
      costMultiplier: 1.5,
      effectMultiplier: 0.2,
      maxLevel: 5
    });

    // Player upgrade configurations
    this.register('player', PlayerUpgradeType.DAMAGE, {
      baseCost: 25,
      costMultiplier: 1.5,
      effectMultiplier: 0.4,
      maxLevel: 5
    });

    this.register('player', PlayerUpgradeType.SPEED, {
      baseCost: 20,
      costMultiplier: 1.5,
      effectMultiplier: 0.3,
      maxLevel: 5
    });

    this.register('player', PlayerUpgradeType.FIRE_RATE, {
      baseCost: 30,
      costMultiplier: 1.5,
      effectMultiplier: 0.25,
      maxLevel: 5
    });

    this.register('player', PlayerUpgradeType.HEALTH, {
      baseCost: 35,
      costMultiplier: 1.5,
      effectMultiplier: 0.5,
      maxLevel: 5
    });

    this.register('player', PlayerUpgradeType.REGENERATION, {
      baseCost: 40,
      costMultiplier: 1.5,
      effectMultiplier: 1.5,
      maxLevel: 5
    });
  }
}

// Enhanced upgrade manager with additional features
export class EnhancedUpgradeManager<TUpgradeType, TEntity extends Upgradeable<TUpgradeType>> 
  extends BaseUpgradeManager<TUpgradeType, TEntity> {
  
  private category: string;
  private upgradeDescriptions: Map<string, string> = new Map();
  private upgradeNames: Map<string, string> = new Map();

  constructor(
    category: string,
    descriptions?: Record<string, string>,
    names?: Record<string, string>
  ) {
    super();
    this.category = category;
    
    if (descriptions) {
      Object.entries(descriptions).forEach(([key, value]) => {
        this.upgradeDescriptions.set(key, value);
      });
    }

    if (names) {
      Object.entries(names).forEach(([key, value]) => {
        this.upgradeNames.set(key, value);
      });
    }
  }

  protected getUpgradeConfigs(): Record<string, UpgradeConfig> {
    const configs = UpgradeConfigRegistry.getAll(this.category);
    const result: Record<string, UpgradeConfig> = {};
    
    for (const [upgradeType, config] of configs.entries()) {
      result[upgradeType] = config;
    }
    
    return result;
  }

  getUpgradeDescription(upgradeType: TUpgradeType): string {
    return this.upgradeDescriptions.get(upgradeType as string) || 'No description available';
  }

  getUpgradeName(upgradeType: TUpgradeType): string {
    return this.upgradeNames.get(upgradeType as string) || (upgradeType as string);
  }

  getAllUpgradeInfo(entity: TEntity): Array<{
    type: TUpgradeType;
    name: string;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    description: string;
    effectDescription: string;
  }> {
    const configs = this.getUpgradeConfigs();
    
    return Object.keys(configs).map(upgradeTypeKey => {
      const upgradeType = upgradeTypeKey as TUpgradeType;
      const config = configs[upgradeTypeKey];
      const currentLevel = entity.getUpgradeLevel(upgradeType);
      
      return {
        type: upgradeType,
        name: this.getUpgradeName(upgradeType),
        cost: this.getUpgradeCost(entity, upgradeType),
        level: currentLevel,
        maxLevel: config.maxLevel,
        canUpgrade: entity.canUpgrade(upgradeType),
        description: this.getUpgradeDescription(upgradeType),
        effectDescription: this.getEffectDescription(upgradeType, currentLevel, config)
      };
    });
  }

  private getEffectDescription(
    upgradeType: TUpgradeType, 
    currentLevel: number, 
    config: UpgradeConfig
  ): string {
    const currentEffect = this.getUpgradeEffect(upgradeType, currentLevel);
    const nextEffect = this.getUpgradeEffect(upgradeType, currentLevel + 1);
    const effectDiff = ((nextEffect - currentEffect) * 100).toFixed(0);
    
    if (currentLevel >= config.maxLevel) {
      return 'Maximum level reached';
    }
    
    return `+${effectDiff}% improvement`;
  }

  // Batch upgrade operations
  applyMultipleUpgrades(
    entity: TEntity, 
    upgrades: Array<{ type: TUpgradeType; levels: number }>,
    availableCurrency: number
  ): { totalCost: number; successfulUpgrades: TUpgradeType[]; failedUpgrades: TUpgradeType[] } {
    let totalCost = 0;
    let remainingCurrency = availableCurrency;
    const successfulUpgrades: TUpgradeType[] = [];
    const failedUpgrades: TUpgradeType[] = [];

    for (const upgrade of upgrades) {
      for (let i = 0; i < upgrade.levels; i++) {
        const cost = this.getUpgradeCost(entity, upgrade.type);
        
        if (cost === 0 || remainingCurrency < cost || !entity.canUpgrade(upgrade.type)) {
          if (!failedUpgrades.includes(upgrade.type)) {
            failedUpgrades.push(upgrade.type);
          }
          break;
        }

        if (entity.upgrade(upgrade.type)) {
          totalCost += cost;
          remainingCurrency -= cost;
          if (!successfulUpgrades.includes(upgrade.type)) {
            successfulUpgrades.push(upgrade.type);
          }
        } else {
          if (!failedUpgrades.includes(upgrade.type)) {
            failedUpgrades.push(upgrade.type);
          }
          break;
        }
      }
    }

    return { totalCost, successfulUpgrades, failedUpgrades };
  }

  // Calculate optimal upgrade path within budget
  getOptimalUpgradePath(
    entity: TEntity,
    availableCurrency: number,
    priorityWeights?: Record<string, number>
  ): Array<{ type: TUpgradeType; efficiency: number; cost: number }> {
    const configs = this.getUpgradeConfigs();
    const upgrades: Array<{ type: TUpgradeType; efficiency: number; cost: number }> = [];

    for (const upgradeTypeKey of Object.keys(configs)) {
      const upgradeType = upgradeTypeKey as TUpgradeType;
      
      if (!entity.canUpgrade(upgradeType)) continue;

      const cost = this.getUpgradeCost(entity, upgradeType);
      if (cost === 0 || cost > availableCurrency) continue;

      const config = configs[upgradeTypeKey];
      const currentLevel = entity.getUpgradeLevel(upgradeType);
      const effectGain = config.effectMultiplier;
      const priority = priorityWeights?.[upgradeTypeKey] || 1;
      
      // Calculate efficiency as effect gain per cost, weighted by priority
      const efficiency = (effectGain * priority) / cost;

      upgrades.push({ type: upgradeType, efficiency, cost });
    }

    // Sort by efficiency (highest first)
    return upgrades.sort((a, b) => b.efficiency - a.efficiency);
  }

  // Validate upgrade configuration integrity
  validateUpgradeConfig(upgradeType: TUpgradeType): boolean {
    try {
      const config = this.getUpgradeConfig(upgradeType);
      
      return (
        config.baseCost > 0 &&
        config.costMultiplier > 1 &&
        config.effectMultiplier > 0 &&
        config.maxLevel > 0 &&
        config.maxLevel <= 10 // Reasonable upper bound
      );
    } catch {
      return false;
    }
  }
}

// Specific implementations using the enhanced system
export class TowerUpgradeManager extends EnhancedUpgradeManager<TowerUpgradeType, Tower> {
  constructor() {
    super(
      'tower',
      {
        [TowerUpgradeType.DAMAGE]: 'Increase tower damage output',
        [TowerUpgradeType.RANGE]: 'Extend tower attack range',
        [TowerUpgradeType.FIRE_RATE]: 'Increase tower attack speed'
      },
      {
        [TowerUpgradeType.DAMAGE]: 'Damage',
        [TowerUpgradeType.RANGE]: 'Range',
        [TowerUpgradeType.FIRE_RATE]: 'Fire Rate'
      }
    );
  }

  // Tower-specific methods
  getTowerTypeMultiplier(tower: Tower): number {
    // Different tower types might have different upgrade efficiencies
    switch (tower.towerType) {
      case TowerType.BASIC:
        return 1.0;
      case TowerType.SNIPER:
        return 1.2; // Sniper towers benefit more from upgrades
      case TowerType.RAPID:
        return 0.9; // Rapid towers are slightly less efficient
      default:
        return 1.0;
    }
  }
}

export class PlayerUpgradeManager extends EnhancedUpgradeManager<PlayerUpgradeType, Player> {
  constructor() {
    super(
      'player',
      {
        [PlayerUpgradeType.DAMAGE]: 'Increase damage by 40%',
        [PlayerUpgradeType.SPEED]: 'Increase movement speed by 30%',
        [PlayerUpgradeType.FIRE_RATE]: 'Increase fire rate by 25%',
        [PlayerUpgradeType.HEALTH]: 'Increase max health by 50%',
        [PlayerUpgradeType.REGENERATION]: 'Regenerate health over time'
      },
      {
        [PlayerUpgradeType.DAMAGE]: 'Damage',
        [PlayerUpgradeType.SPEED]: 'Speed',
        [PlayerUpgradeType.FIRE_RATE]: 'Fire Rate',
        [PlayerUpgradeType.HEALTH]: 'Health',
        [PlayerUpgradeType.REGENERATION]: 'Regeneration'
      }
    );
  }

  // Player-specific methods
  getPlayerLevelBonus(player: Player): number {
    // Higher level players get small upgrade discounts
    const level = player.getLevel();
    return Math.max(0.05, 1 - (level * 0.02)); // 2% discount per level, min 95% cost
  }
}

// Initialize the registry when this module is loaded
UpgradeConfigRegistry.initialize();