/**
 * Player Progression System
 * Extracted from Player.ts to handle upgrades, levels, and progression
 */

import { PlayerUpgradeType } from '../Player';
import { UPGRADE_CONSTANTS } from '../../config/UpgradeConfig';

export interface UpgradeInfo {
  type: PlayerUpgradeType;
  level: number;
  maxLevel: number;
  canUpgrade: boolean;
}

export class PlayerProgression {
  private upgradeLevels: Map<PlayerUpgradeType, number> = new Map();
  private level: number = 1;
  private totalExperience: number = 0;
  private experienceToNextLevel: number = 100;

  constructor() {
    this.initializeUpgrades();
  }

  private initializeUpgrades(): void {
    this.upgradeLevels.set(PlayerUpgradeType.DAMAGE, 0);
    this.upgradeLevels.set(PlayerUpgradeType.SPEED, 0);
    this.upgradeLevels.set(PlayerUpgradeType.FIRE_RATE, 0);
    this.upgradeLevels.set(PlayerUpgradeType.HEALTH, 0);
    this.upgradeLevels.set(PlayerUpgradeType.REGENERATION, 0);
  }

  // Upgrade system
  upgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    const maxLevel = UPGRADE_CONSTANTS.maxLevel;
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    return true;
  }

  canUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < UPGRADE_CONSTANTS.maxLevel;
  }

  getUpgradeLevel(upgradeType: PlayerUpgradeType): number {
    return this.upgradeLevels.get(upgradeType) || 0;
  }


  getTotalUpgrades(): number {
    let total = 0;
    this.upgradeLevels.forEach(level => total += level);
    return total;
  }

  getLevel(): number {
    return this.level;
  }

  // Experience system
  addExperience(amount: number): boolean {
    this.totalExperience += amount;
    
    if (this.totalExperience >= this.experienceToNextLevel) {
      this.levelUp();
      return true; // Leveled up
    }
    
    return false; // No level up
  }

  private levelUp(): void {
    this.level++;
    this.totalExperience -= this.experienceToNextLevel;
    this.experienceToNextLevel = this.calculateExperienceForNextLevel();
  }

  private calculateExperienceForNextLevel(): number {
    // Exponential growth: base * (1.5 ^ level)
    return Math.floor(100 * Math.pow(1.5, this.level - 1));
  }

  getExperienceProgress(): {
    current: number;
    required: number;
    percentage: number;
    total: number;
  } {
    return {
      current: this.totalExperience,
      required: this.experienceToNextLevel,
      percentage: this.totalExperience / this.experienceToNextLevel,
      total: this.totalExperience + (this.level - 1) * this.experienceToNextLevel
    };
  }

  // Stat calculations based on upgrades
  getDamageMultiplier(): number {
    const damageLevel = this.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    return 1 + damageLevel * 0.4; // 40% increase per level
  }

  getSpeedMultiplier(): number {
    const speedLevel = this.getUpgradeLevel(PlayerUpgradeType.SPEED);
    return 1 + speedLevel * 0.3; // 30% increase per level
  }

  getFireRateMultiplier(): number {
    const fireRateLevel = this.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    return 1 + fireRateLevel * 0.25; // 25% increase per level
  }

  getHealthMultiplier(): number {
    const healthLevel = this.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    return 1 + healthLevel * 0.5; // 50% increase per level
  }

  getRegenerationRate(): number {
    const regenLevel = this.getUpgradeLevel(PlayerUpgradeType.REGENERATION);
    if (regenLevel === 0) return 0;
    return 2 + regenLevel * 1.5; // 2 HP/s base, +1.5 per level
  }

  hasRegeneration(): boolean {
    return this.getUpgradeLevel(PlayerUpgradeType.REGENERATION) > 0;
  }

  // Upgrade information for UI
  getAllUpgradeInfo(): UpgradeInfo[] {
    return Object.values(PlayerUpgradeType).map(upgradeType => ({
      type: upgradeType,
      level: this.getUpgradeLevel(upgradeType),
      maxLevel: UPGRADE_CONSTANTS.maxLevel,
      canUpgrade: this.canUpgrade(upgradeType)
    }));
  }

  getUpgradeDescription(upgradeType: PlayerUpgradeType): string {
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE:
        return `Increase damage by ${Math.round((this.getDamageMultiplier() - 1) * 100)}%`;
      case PlayerUpgradeType.SPEED:
        return `Increase movement speed by ${Math.round((this.getSpeedMultiplier() - 1) * 100)}%`;
      case PlayerUpgradeType.FIRE_RATE:
        return `Increase fire rate by ${Math.round((this.getFireRateMultiplier() - 1) * 100)}%`;
      case PlayerUpgradeType.HEALTH:
        return `Increase max health by ${Math.round((this.getHealthMultiplier() - 1) * 100)}%`;
      case PlayerUpgradeType.REGENERATION:
        return `Regenerate ${this.getRegenerationRate().toFixed(1)} HP/s`;
      default:
        return 'Unknown upgrade';
    }
  }

  // Prestige system (for future expansion)
  canPrestige(): boolean {
    return this.level >= 50 && this.getTotalUpgrades() >= 25;
  }

  prestige(): {
    prestigeLevel: number;
    bonusMultiplier: number;
    reset: boolean;
  } {
    if (!this.canPrestige()) {
      return { prestigeLevel: 0, bonusMultiplier: 1.0, reset: false };
    }

    const prestigeLevel = Math.floor(this.level / 50);
    const bonusMultiplier = 1 + prestigeLevel * 0.1; // 10% bonus per prestige

    // Reset progression but keep prestige bonuses
    this.initializeUpgrades();
    this.level = 1;
    this.totalExperience = 0;
    this.experienceToNextLevel = 100;

    return { prestigeLevel, bonusMultiplier, reset: true };
  }

  // Achievement tracking
  getAchievements(): {
    maxLevelReached: number;
    totalUpgrades: number;
    fullyMaxedUpgrades: number;
    experienceGained: number;
  } {
    const fullyMaxedUpgrades = Array.from(this.upgradeLevels.values())
      .filter(level => level >= UPGRADE_CONSTANTS.maxLevel).length;

    return {
      maxLevelReached: this.level,
      totalUpgrades: this.getTotalUpgrades(),
      fullyMaxedUpgrades,
      experienceGained: this.totalExperience
    };
  }

  // Save/Load state
  getState(): {
    upgradeLevels: Record<string, number>;
    level: number;
    totalExperience: number;
    experienceToNextLevel: number;
  } {
    const upgradeLevelsObj: Record<string, number> = {};
    this.upgradeLevels.forEach((level, type) => {
      upgradeLevelsObj[type] = level;
    });

    return {
      upgradeLevels: upgradeLevelsObj,
      level: this.level,
      totalExperience: this.totalExperience,
      experienceToNextLevel: this.experienceToNextLevel
    };
  }

  setState(state: {
    upgradeLevels: Record<string, number>;
    level: number;
    totalExperience: number;
    experienceToNextLevel: number;
  }): void {
    this.upgradeLevels.clear();
    Object.entries(state.upgradeLevels).forEach(([type, level]) => {
      this.upgradeLevels.set(type as PlayerUpgradeType, level);
    });

    this.level = state.level;
    this.totalExperience = state.totalExperience;
    this.experienceToNextLevel = state.experienceToNextLevel;
  }

  // Debug information
  getDebugInfo(): {
    level: number;
    totalUpgrades: number;
    upgradeLevels: Record<string, number>;
    experience: {
      current: number;
      required: number;
      total: number;
    };
    multipliers: {
      damage: number;
      speed: number;
      fireRate: number;
      health: number;
    };
  } {
    const upgradeLevelsObj: Record<string, number> = {};
    this.upgradeLevels.forEach((level, type) => {
      upgradeLevelsObj[type] = level;
    });

    return {
      level: this.level,
      totalUpgrades: this.getTotalUpgrades(),
      upgradeLevels: upgradeLevelsObj,
      experience: {
        current: this.totalExperience,
        required: this.experienceToNextLevel,
        total: this.totalExperience + (this.level - 1) * 100
      },
      multipliers: {
        damage: this.getDamageMultiplier(),
        speed: this.getSpeedMultiplier(),
        fireRate: this.getFireRateMultiplier(),
        health: this.getHealthMultiplier()
      }
    };
  }
}