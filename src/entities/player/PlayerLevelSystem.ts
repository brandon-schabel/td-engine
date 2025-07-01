/**
 * Player Level System
 * Manages player progression through 50 levels with experience and upgrade points
 */

import { UpgradeType } from '@/config/PlayerUpgradeConfig';

export interface LevelSystemState {
  level: number;
  experience: number;
  totalExperience: number;
  availableUpgradePoints: number;
  totalUpgradePointsEarned: number;
  upgradeDistribution: Record<UpgradeType, number>;
}

export interface LevelStatistics {
  currentLevel: number;
  totalExperience: number;
  experienceToNext: number;
  levelProgress: number;
  availablePoints: number;
  spentPoints: number;
  totalPointsEarned: number;
}

export class PlayerLevelSystem {
  private static readonly MAX_LEVEL = 50;
  private static readonly BASE_XP = 100; // Base XP for level 2
  private static readonly XP_MULTIPLIER = 1.15; // 15% increase per level
  private static readonly MILESTONE_LEVELS = [10, 20, 30, 40, 50];
  
  // Stat bonuses per level (multiplicative)
  private static readonly LEVEL_BONUSES = {
    damage: 0.01,      // 1% per level (50% at max)
    health: 0.015,     // 1.5% per level (75% at max)
    speed: 0.008,      // 0.8% per level (40% at max)
    fireRate: 0.01,    // 1% per level (50% at max)
    regeneration: 0.02 // 2% per level (100% at max)
  };

  private level: number = 1;
  private experience: number = 0;
  private totalExperience: number = 0;
  private availableUpgradePoints: number = 0;
  private totalUpgradePointsEarned: number = 0;
  private upgradeDistribution: Map<UpgradeType, number> = new Map();
  private experienceRequirements: Map<number, number> = new Map();

  constructor() {
    this.initializeUpgradeDistribution();
    this.calculateExperienceRequirements();
  }

  private initializeUpgradeDistribution(): void {
    Object.values(UpgradeType).forEach(type => {
      this.upgradeDistribution.set(type, 0);
    });
  }

  private calculateExperienceRequirements(): void {
    for (let level = 1; level < PlayerLevelSystem.MAX_LEVEL; level++) {
      // Exponential curve: BASE_XP * (MULTIPLIER ^ (level - 1))
      const xpRequired = Math.floor(
        PlayerLevelSystem.BASE_XP * Math.pow(PlayerLevelSystem.XP_MULTIPLIER, level - 1)
      );
      this.experienceRequirements.set(level, xpRequired);
    }
  }

  /**
   * Add experience and handle level ups
   */
  addExperience(amount: number): boolean {
    if (this.level >= PlayerLevelSystem.MAX_LEVEL) {
      return false; // Max level reached - don't add any experience
    }

    this.experience += amount;
    this.totalExperience += amount;
    
    let leveledUp = false;
    
    while (this.canLevelUp() && this.experience >= this.getExperienceToNextLevel()) {
      const xpToNext = this.getExperienceToNextLevel();
      this.experience -= xpToNext;
      this.levelUp();
      leveledUp = true;
      
      // Stop if we reached max level
      if (this.level >= PlayerLevelSystem.MAX_LEVEL) {
        this.experience = 0; // Clear any remaining experience
        break;
      }
    }
    
    return leveledUp;
  }

  /**
   * Directly set the level system state (used for save/load)
   */
  setLevelData(level: number, experience: number, totalExperience: number, availableUpgradePoints: number): void {
    this.level = Math.max(1, Math.min(level, PlayerLevelSystem.MAX_LEVEL));
    this.experience = Math.max(0, experience);
    this.totalExperience = Math.max(0, totalExperience);
    this.availableUpgradePoints = Math.max(0, availableUpgradePoints);
    this.totalUpgradePointsEarned = Math.max(this.availableUpgradePoints, this.totalUpgradePointsEarned);
  }

  private levelUp(): void {
    this.level++;
    
    // Grant upgrade points
    let pointsToAdd = 1;
    
    // Bonus point at milestone levels (check the new level)
    if (PlayerLevelSystem.MILESTONE_LEVELS.includes(this.level)) {
      pointsToAdd = 2;
    }
    
    this.availableUpgradePoints += pointsToAdd;
    this.totalUpgradePointsEarned += pointsToAdd;
  }

  /**
   * Spend an upgrade point
   */
  spendUpgradePoint(upgradeType?: UpgradeType): boolean {
    if (this.availableUpgradePoints <= 0) {
      return false;
    }
    
    this.availableUpgradePoints--;
    
    if (upgradeType) {
      const current = this.upgradeDistribution.get(upgradeType) || 0;
      this.upgradeDistribution.set(upgradeType, current + 1);
    }
    
    return true;
  }

  /**
   * Get level bonus for a specific stat
   */
  getLevelBonus(stat: keyof typeof PlayerLevelSystem.LEVEL_BONUSES): number {
    const bonusPerLevel = PlayerLevelSystem.LEVEL_BONUSES[stat] || 0;
    return bonusPerLevel * (this.level - 1); // -1 because level 1 has no bonus
  }

  /**
   * Get experience required for next level
   */
  getExperienceToNextLevel(): number {
    if (this.level >= PlayerLevelSystem.MAX_LEVEL) {
      return 0;
    }
    return this.experienceRequirements.get(this.level) || 0;
  }

  /**
   * Get all experience requirements
   */
  getExperienceRequirements(): Record<number, number> {
    const requirements: Record<number, number> = {};
    this.experienceRequirements.forEach((xp, level) => {
      requirements[level] = xp;
    });
    return requirements;
  }

  /**
   * Check if can level up
   */
  canLevelUp(): boolean {
    return this.level < PlayerLevelSystem.MAX_LEVEL;
  }

  /**
   * Get level progress as percentage (0-1)
   */
  getLevelProgress(): number {
    const required = this.getExperienceToNextLevel();
    if (required === 0) return 1; // Max level
    return this.experience / required;
  }

  /**
   * Get estimated time to next level in seconds
   */
  getEstimatedTimeToNextLevel(xpPerSecond: number): number {
    if (xpPerSecond <= 0 || !this.canLevelUp()) {
      return Infinity;
    }
    
    const xpNeeded = this.getExperienceToNextLevel() - this.experience;
    return Math.ceil(xpNeeded / xpPerSecond);
  }

  /**
   * Get upgrade distribution
   */
  getUpgradeDistribution(): Record<UpgradeType, number> {
    const distribution: Record<string, number> = {};
    this.upgradeDistribution.forEach((count, type) => {
      distribution[type] = count;
    });
    return distribution as Record<UpgradeType, number>;
  }

  /**
   * Get total experience (including spent on previous levels)
   */
  getTotalExperience(): number {
    return this.totalExperience;
  }

  /**
   * Get statistics
   */
  getStatistics(): LevelStatistics {
    return {
      currentLevel: this.level,
      totalExperience: this.totalExperience,
      experienceToNext: this.getExperienceToNextLevel(),
      levelProgress: this.getLevelProgress(),
      availablePoints: this.availableUpgradePoints,
      spentPoints: this.totalUpgradePointsEarned - this.availableUpgradePoints,
      totalPointsEarned: this.totalUpgradePointsEarned
    };
  }

  // Getters
  getLevel(): number {
    return this.level;
  }

  getExperience(): number {
    return this.experience;
  }

  getAvailableUpgradePoints(): number {
    return this.availableUpgradePoints;
  }

  getTotalUpgradePointsEarned(): number {
    return this.totalUpgradePointsEarned;
  }

  /**
   * Save/Load state
   */
  getState(): LevelSystemState {
    return {
      level: this.level,
      experience: this.experience,
      totalExperience: this.totalExperience,
      availableUpgradePoints: this.availableUpgradePoints,
      totalUpgradePointsEarned: this.totalUpgradePointsEarned,
      upgradeDistribution: this.getUpgradeDistribution()
    };
  }

  setState(state: LevelSystemState): void {
    this.level = state.level;
    this.experience = state.experience;
    this.totalExperience = state.totalExperience;
    this.availableUpgradePoints = state.availableUpgradePoints;
    this.totalUpgradePointsEarned = state.totalUpgradePointsEarned;
    
    this.upgradeDistribution.clear();
    Object.entries(state.upgradeDistribution).forEach(([type, count]) => {
      this.upgradeDistribution.set(type as UpgradeType, count);
    });
  }
}