/**
 * Player Upgrade Manager
 * Manages permanent upgrades purchased with upgrade points
 */

import { UpgradeType, PLAYER_UPGRADE_DEFINITIONS, type UpgradeDefinition } from '@/config/PlayerUpgradeConfig';
import type { PlayerLevelSystem } from './PlayerLevelSystem';

export interface UpgradeState {
  type: UpgradeType;
  level: number;
  maxLevel: number;
  totalBonus: number;
}

export class PlayerUpgradeManager {
  private upgradeLevels: Map<UpgradeType, number> = new Map();
  private levelSystem: PlayerLevelSystem;

  constructor(levelSystem: PlayerLevelSystem) {
    this.levelSystem = levelSystem;
    this.initializeUpgrades();
  }

  private initializeUpgrades(): void {
    Object.values(UpgradeType).forEach(type => {
      this.upgradeLevels.set(type, 0);
    });
  }

  /**
   * Purchase an upgrade with points
   */
  purchaseUpgrade(type: UpgradeType): boolean {
    const definition = PLAYER_UPGRADE_DEFINITIONS[type];
    const currentLevel = this.getUpgradeLevel(type);
    
    // Check if can upgrade
    if (currentLevel >= definition.maxLevel) {
      return false; // Max level reached
    }
    
    // Check if have enough points
    const availablePoints = this.levelSystem.getAvailableUpgradePoints();
    if (availablePoints < definition.costPerLevel) {
      return false; // Not enough points
    }
    
    // Spend points and upgrade
    const spent = this.levelSystem.spendUpgradePoint(type);
    if (!spent) {
      return false;
    }
    
    // If cost is 2, spend another point
    if (definition.costPerLevel > 1) {
      for (let i = 1; i < definition.costPerLevel; i++) {
        if (!this.levelSystem.spendUpgradePoint(type)) {
          // Rollback if we can't spend all required points
          // This shouldn't happen if we checked properly, but just in case
          return false;
        }
      }
    }
    
    // Increase upgrade level
    this.upgradeLevels.set(type, currentLevel + 1);
    return true;
  }

  /**
   * Get current level of an upgrade
   */
  getUpgradeLevel(type: UpgradeType): number {
    return this.upgradeLevels.get(type) || 0;
  }

  /**
   * Get total bonus for an upgrade type
   */
  getUpgradeBonus(type: UpgradeType): number {
    const level = this.getUpgradeLevel(type);
    const definition = PLAYER_UPGRADE_DEFINITIONS[type];
    return level * definition.bonusPerLevel;
  }

  /**
   * Check if can purchase an upgrade
   */
  canPurchaseUpgrade(type: UpgradeType): boolean {
    const definition = PLAYER_UPGRADE_DEFINITIONS[type];
    const currentLevel = this.getUpgradeLevel(type);
    const availablePoints = this.levelSystem.getAvailableUpgradePoints();
    
    return currentLevel < definition.maxLevel && availablePoints >= definition.costPerLevel;
  }

  /**
   * Get all upgrade states
   */
  getAllUpgradeStates(): UpgradeState[] {
    const states: UpgradeState[] = [];
    
    Object.values(UpgradeType).forEach(type => {
      const definition = PLAYER_UPGRADE_DEFINITIONS[type];
      const level = this.getUpgradeLevel(type);
      
      states.push({
        type,
        level,
        maxLevel: definition.maxLevel,
        totalBonus: this.getUpgradeBonus(type)
      });
    });
    
    return states;
  }

  /**
   * Get upgrade definition
   */
  getUpgradeDefinition(type: UpgradeType): UpgradeDefinition {
    return PLAYER_UPGRADE_DEFINITIONS[type];
  }

  /**
   * Calculate damage multiplier from upgrades
   */
  getDamageMultiplier(): number {
    return 1 + this.getUpgradeBonus(UpgradeType.DAMAGE);
  }

  /**
   * Calculate fire rate multiplier from upgrades
   */
  getFireRateMultiplier(): number {
    return 1 + this.getUpgradeBonus(UpgradeType.FIRE_RATE);
  }

  /**
   * Calculate movement speed multiplier from upgrades
   */
  getMovementSpeedMultiplier(): number {
    return 1 + this.getUpgradeBonus(UpgradeType.MOVEMENT_SPEED);
  }

  /**
   * Calculate max health multiplier from upgrades
   */
  getMaxHealthMultiplier(): number {
    return 1 + this.getUpgradeBonus(UpgradeType.MAX_HEALTH);
  }

  /**
   * Get flat regeneration bonus
   */
  getRegenerationBonus(): number {
    return this.getUpgradeBonus(UpgradeType.REGENERATION);
  }

  /**
   * Get total points spent on upgrades
   */
  getTotalPointsSpent(): number {
    let total = 0;
    
    Object.values(UpgradeType).forEach(type => {
      const level = this.getUpgradeLevel(type);
      const definition = PLAYER_UPGRADE_DEFINITIONS[type];
      total += level * definition.costPerLevel;
    });
    
    return total;
  }

  /**
   * Save/Load state
   */
  getState(): Record<UpgradeType, number> {
    const state: Record<string, number> = {};
    this.upgradeLevels.forEach((level, type) => {
      state[type] = level;
    });
    return state as Record<UpgradeType, number>;
  }

  setState(state: Record<UpgradeType, number>): void {
    this.upgradeLevels.clear();
    Object.entries(state).forEach(([type, level]) => {
      this.upgradeLevels.set(type as UpgradeType, level);
    });
  }
}