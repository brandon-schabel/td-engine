/**
 * Player Upgrade Manager
 * Manages upgrade logic for the player
 * 
 * Recent changes:
 * - Initial creation extending BaseUpgradeManager
 * - Implemented player-specific upgrade configurations
 * - Added optimal upgrade path calculation
 * - Added batch upgrade support
 * - Added upgrade synergy calculations
 */

import { BaseUpgradeManager } from './BaseUpgradeManager';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { PLAYER_UPGRADES } from '@/config/PlayerConfig';

// Define the interface locally to avoid import issues
interface UpgradeConfig {
  baseCost: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
}

interface UpgradePathItem {
  type: PlayerUpgradeType;
  cost: number;
  efficiency: number;
  currentLevel: number;
  effectIncrease: number;
}

export class PlayerUpgradeManager extends BaseUpgradeManager<PlayerUpgradeType, Player> {
  /**
   * Get upgrade configurations for all player upgrade types
   */
  protected getUpgradeConfigs(): Record<string, UpgradeConfig> {
    return {
      [PlayerUpgradeType.DAMAGE]: {
        baseCost: PLAYER_UPGRADES.baseCosts.DAMAGE,
        costMultiplier: PLAYER_UPGRADES.costMultiplier,
        effectMultiplier: PLAYER_UPGRADES.bonusMultipliers.DAMAGE,
        maxLevel: PLAYER_UPGRADES.maxLevel
      },
      [PlayerUpgradeType.SPEED]: {
        baseCost: PLAYER_UPGRADES.baseCosts.SPEED,
        costMultiplier: PLAYER_UPGRADES.costMultiplier,
        effectMultiplier: PLAYER_UPGRADES.bonusMultipliers.SPEED,
        maxLevel: PLAYER_UPGRADES.maxLevel
      },
      [PlayerUpgradeType.FIRE_RATE]: {
        baseCost: PLAYER_UPGRADES.baseCosts.FIRE_RATE,
        costMultiplier: PLAYER_UPGRADES.costMultiplier,
        effectMultiplier: PLAYER_UPGRADES.bonusMultipliers.FIRE_RATE,
        maxLevel: PLAYER_UPGRADES.maxLevel
      },
      [PlayerUpgradeType.HEALTH]: {
        baseCost: PLAYER_UPGRADES.baseCosts.HEALTH,
        costMultiplier: PLAYER_UPGRADES.costMultiplier,
        effectMultiplier: PLAYER_UPGRADES.bonusMultipliers.HEALTH,
        maxLevel: PLAYER_UPGRADES.maxLevel
      },
      [PlayerUpgradeType.REGENERATION]: {
        baseCost: PLAYER_UPGRADES.baseCosts.REGENERATION,
        costMultiplier: PLAYER_UPGRADES.costMultiplier,
        effectMultiplier: 1.5, // HP per second increase
        maxLevel: PLAYER_UPGRADES.maxLevel
      }
    };
  }

  /**
   * Get the optimal upgrade path for a player given available currency
   */
  getOptimalUpgradePath(player: Player, availableCurrency: number): UpgradePathItem[] {
    const upgradePath: UpgradePathItem[] = [];
    const upgradeTypes = Object.values(PlayerUpgradeType);
    
    // Calculate efficiency for each possible upgrade
    const possibleUpgrades = upgradeTypes
      .map(type => {
        const cost = this.getUpgradeCost(player, type);
        const currentLevel = player.getUpgradeLevel(type);
        
        if (cost === 0 || cost > availableCurrency || !player.canUpgrade(type)) {
          return null;
        }
        
        // Calculate effect increase based on upgrade type
        let effectIncrease: number;
        if (type === PlayerUpgradeType.REGENERATION) {
          // Regeneration has fixed increase per level
          effectIncrease = 1.5;
        } else {
          const currentEffect = this.getUpgradeEffect(type, currentLevel);
          const nextEffect = this.getUpgradeEffect(type, currentLevel + 1);
          effectIncrease = nextEffect - currentEffect;
        }
        
        // Apply priority weights based on player state
        let priorityMultiplier = 1;
        
        // Prioritize health if player has low health
        if (type === PlayerUpgradeType.HEALTH && player.health < player.maxHealth * 0.5) {
          priorityMultiplier = 1.5;
        }
        
        // Prioritize regeneration if player has taken damage recently
        if (type === PlayerUpgradeType.REGENERATION && player.health < player.maxHealth) {
          priorityMultiplier = 1.3;
        }
        
        // Calculate efficiency (effect increase per currency spent)
        const efficiency = (effectIncrease * priorityMultiplier) / cost;
        
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
   * Apply multiple upgrades to a player
   */
  applyMultipleUpgrades(
    player: Player, 
    upgrades: Array<{ type: PlayerUpgradeType; levels: number }>,
    availableCurrency: number
  ): {
    totalCost: number;
    successfulUpgrades: PlayerUpgradeType[];
    failedUpgrades: PlayerUpgradeType[];
  } {
    let totalCost = 0;
    const successfulUpgrades: PlayerUpgradeType[] = [];
    const failedUpgrades: PlayerUpgradeType[] = [];
    let remainingCurrency = availableCurrency;
    
    for (const { type, levels } of upgrades) {
      let upgradesApplied = 0;
      
      for (let i = 0; i < levels; i++) {
        const cost = this.getUpgradeCost(player, type);
        
        if (cost === 0 || cost > remainingCurrency || !player.canUpgrade(type)) {
          if (upgradesApplied === 0) {
            failedUpgrades.push(type);
          }
          break;
        }
        
        const success = player.upgrade(type);
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
   * Get all upgrade information for a player
   */
  getAllUpgradeInfo(player: Player): Array<{
    type: PlayerUpgradeType;
    cost: number;
    level: number;
    maxLevel: number;
    canUpgrade: boolean;
    effect: number;
    nextEffect: number;
    description: string;
  }> {
    const baseInfo = this.getUpgradeInfo(player);
    
    return baseInfo.map(info => {
      let effect: number;
      let nextEffect: number;
      
      if (info.type === PlayerUpgradeType.REGENERATION) {
        // Regeneration shows HP/s
        effect = info.level * 1.5;
        nextEffect = (info.level + 1) * 1.5;
      } else {
        effect = this.getUpgradeEffect(info.type, info.level);
        nextEffect = info.canUpgrade ? this.getUpgradeEffect(info.type, info.level + 1) : effect;
      }
      
      return {
        ...info,
        effect,
        nextEffect,
        description: player.getUpgradeDescription(info.type)
      };
    });
  }

  /**
   * Calculate player's effective DPS
   */
  calculateDPS(player: Player): number {
    const damage = player.damage;
    const fireRate = player.fireRate;
    return damage * fireRate;
  }

  /**
   * Calculate player's survivability score
   */
  calculateSurvivability(player: Player): number {
    const healthScore = player.maxHealth;
    const regenScore = player.getRegenerationRate() * 10; // Weight regen
    const speedScore = player.speed * 0.5; // Speed helps avoid damage
    
    return healthScore + regenScore + speedScore;
  }

  /**
   * Get upgrade recommendation based on playstyle
   */
  getUpgradeRecommendation(player: Player, recentDamageTaken: number): PlayerUpgradeType | null {
    // If player has taken significant damage, prioritize survivability
    if (recentDamageTaken > player.maxHealth * 0.3) {
      if (player.canUpgrade(PlayerUpgradeType.HEALTH)) {
        return PlayerUpgradeType.HEALTH;
      }
      if (player.canUpgrade(PlayerUpgradeType.REGENERATION)) {
        return PlayerUpgradeType.REGENERATION;
      }
      if (player.canUpgrade(PlayerUpgradeType.SPEED)) {
        return PlayerUpgradeType.SPEED;
      }
    }
    
    // Otherwise, focus on offense
    const dps = this.calculateDPS(player);
    
    // If DPS is low, alternate between damage and fire rate
    if (dps < 50) {
      const damageLevel = player.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
      const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
      
      if (damageLevel <= fireRateLevel && player.canUpgrade(PlayerUpgradeType.DAMAGE)) {
        return PlayerUpgradeType.DAMAGE;
      }
      if (player.canUpgrade(PlayerUpgradeType.FIRE_RATE)) {
        return PlayerUpgradeType.FIRE_RATE;
      }
    }
    
    // Return any available upgrade
    const upgradeTypes = Object.values(PlayerUpgradeType);
    for (const type of upgradeTypes) {
      if (player.canUpgrade(type)) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Check for upgrade synergies
   */
  getUpgradeSynergies(player: Player): Array<{
    types: PlayerUpgradeType[];
    bonus: number;
    description: string;
  }> {
    const synergies: Array<{
      types: PlayerUpgradeType[];
      bonus: number;
      description: string;
    }> = [];
    
    // Health + Regeneration synergy
    const healthLevel = player.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const regenLevel = player.getUpgradeLevel(PlayerUpgradeType.REGENERATION);
    if (healthLevel >= 3 && regenLevel >= 3) {
      synergies.push({
        types: [PlayerUpgradeType.HEALTH, PlayerUpgradeType.REGENERATION],
        bonus: 0.15,
        description: 'Tank Build: +15% effective health'
      });
    }
    
    // Damage + Fire Rate synergy
    const damageLevel = player.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    if (damageLevel >= 3 && fireRateLevel >= 3) {
      synergies.push({
        types: [PlayerUpgradeType.DAMAGE, PlayerUpgradeType.FIRE_RATE],
        bonus: 0.2,
        description: 'Glass Cannon: +20% DPS'
      });
    }
    
    // Speed + Fire Rate synergy
    const speedLevel = player.getUpgradeLevel(PlayerUpgradeType.SPEED);
    if (speedLevel >= 3 && fireRateLevel >= 3) {
      synergies.push({
        types: [PlayerUpgradeType.SPEED, PlayerUpgradeType.FIRE_RATE],
        bonus: 0.1,
        description: 'Mobile Gunner: +10% accuracy while moving'
      });
    }
    
    return synergies;
  }
}