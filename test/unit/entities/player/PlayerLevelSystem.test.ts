import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerLevelSystem } from '@/entities/player/PlayerLevelSystem';
import { PlayerUpgradeType } from '@/entities/Player';

describe('PlayerLevelSystem', () => {
  let levelSystem: PlayerLevelSystem;

  beforeEach(() => {
    levelSystem = new PlayerLevelSystem();
  });

  describe('Level Progression', () => {
    it('should start at level 1', () => {
      expect(levelSystem.getLevel()).toBe(1);
      expect(levelSystem.getExperience()).toBe(0);
    });

    it('should level up when gaining enough experience', () => {
      // Level 1 -> 2 requires 100 XP
      levelSystem.addExperience(100);
      expect(levelSystem.getLevel()).toBe(2);
      expect(levelSystem.getExperience()).toBe(0);
    });

    it('should carry over excess experience', () => {
      // Give 150 XP (50 more than needed for level 2)
      levelSystem.addExperience(150);
      expect(levelSystem.getLevel()).toBe(2);
      expect(levelSystem.getExperience()).toBe(50);
    });

    it('should reach max level 50', () => {
      // Add a lot of experience at once to ensure we reach max level
      levelSystem.addExperience(10000000); // 10 million XP should be enough
      expect(levelSystem.getLevel()).toBe(50);
      expect(levelSystem.canLevelUp()).toBe(false);
    });

    it('should calculate correct XP requirements for each level', () => {
      const requirements = levelSystem.getExperienceRequirements();
      expect(requirements[1]).toBe(100); // Level 1->2
      expect(requirements[2]).toBe(114); // Level 2->3 (floor(100 * 1.15))
      expect(requirements[10]).toBeGreaterThan(requirements[9]);
      expect(requirements[49]).toBeDefined(); // Level 49->50
      expect(requirements[50]).toBeUndefined(); // No level 51
    });
  });

  describe('Level Rewards', () => {
    it('should grant upgrade points on level up', () => {
      expect(levelSystem.getAvailableUpgradePoints()).toBe(0);
      
      levelSystem.addExperience(100); // Level up to 2
      expect(levelSystem.getAvailableUpgradePoints()).toBe(1);
      
      levelSystem.addExperience(150); // Level up to 3
      expect(levelSystem.getAvailableUpgradePoints()).toBe(2);
    });

    it('should grant bonus points at milestone levels', () => {
      // Milestone levels: 10, 20, 30, 40, 50
      // Simulate leveling to 9
      for (let i = 1; i < 9; i++) {
        const xpNeeded = levelSystem.getExperienceToNextLevel();
        levelSystem.addExperience(xpNeeded);
      }
      
      expect(levelSystem.getLevel()).toBe(9);
      const pointsBefore = levelSystem.getAvailableUpgradePoints();
      
      // Level up to 10 (milestone)
      levelSystem.addExperience(levelSystem.getExperienceToNextLevel());
      expect(levelSystem.getLevel()).toBe(10);
      
      const pointsAfter = levelSystem.getAvailableUpgradePoints();
      
      // Should get 2 points at milestone level (1 regular + 1 bonus)
      expect(pointsAfter - pointsBefore).toBe(2);
    });

    it('should track total upgrade points earned', () => {
      expect(levelSystem.getTotalUpgradePointsEarned()).toBe(0);
      
      levelSystem.addExperience(100); // Level 2
      expect(levelSystem.getTotalUpgradePointsEarned()).toBe(1);
      
      levelSystem.spendUpgradePoint();
      expect(levelSystem.getAvailableUpgradePoints()).toBe(0);
      expect(levelSystem.getTotalUpgradePointsEarned()).toBe(1); // Total doesn't decrease
    });
  });

  describe('Upgrade Point Management', () => {
    it('should spend upgrade points correctly', () => {
      levelSystem.addExperience(100); // Get 1 point
      expect(levelSystem.getAvailableUpgradePoints()).toBe(1);
      
      const spent = levelSystem.spendUpgradePoint();
      expect(spent).toBe(true);
      expect(levelSystem.getAvailableUpgradePoints()).toBe(0);
    });

    it('should not spend points when none available', () => {
      expect(levelSystem.getAvailableUpgradePoints()).toBe(0);
      const spent = levelSystem.spendUpgradePoint();
      expect(spent).toBe(false);
    });

    it('should track spent upgrade points by type', () => {
      levelSystem.addExperience(500); // Get some points
      
      levelSystem.spendUpgradePoint(PlayerUpgradeType.DAMAGE);
      levelSystem.spendUpgradePoint(PlayerUpgradeType.DAMAGE);
      levelSystem.spendUpgradePoint(PlayerUpgradeType.HEALTH);
      
      const distribution = levelSystem.getUpgradeDistribution();
      expect(distribution[PlayerUpgradeType.DAMAGE]).toBe(2);
      expect(distribution[PlayerUpgradeType.HEALTH]).toBe(1);
      expect(distribution[PlayerUpgradeType.SPEED]).toBe(0);
    });
  });

  describe('Level Bonuses', () => {
    it('should provide stat bonuses based on level', () => {
      expect(levelSystem.getLevelBonus('damage')).toBe(0);
      
      levelSystem.addExperience(100); // Level 2
      expect(levelSystem.getLevelBonus('damage')).toBeGreaterThan(0);
      
      // Higher levels = higher bonuses
      for (let i = 0; i < 15; i++) {
        levelSystem.addExperience(1000);
      }
      const higherLevelBonus = levelSystem.getLevelBonus('damage');
      expect(higherLevelBonus).toBeGreaterThan(0.09); // Should be around 10%+ at level 11+
    });

    it('should provide different bonuses for different stats', () => {
      for (let i = 0; i < 5; i++) {
        levelSystem.addExperience(500);
      }
      
      const damageBonus = levelSystem.getLevelBonus('damage');
      const healthBonus = levelSystem.getLevelBonus('health');
      const speedBonus = levelSystem.getLevelBonus('speed');
      
      expect(damageBonus).toBeGreaterThan(0);
      expect(healthBonus).toBeGreaterThan(0);
      expect(speedBonus).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track level progress percentage', () => {
      expect(levelSystem.getLevelProgress()).toBe(0);
      
      levelSystem.addExperience(50);
      expect(levelSystem.getLevelProgress()).toBe(0.5); // 50/100
      
      levelSystem.addExperience(25);
      expect(levelSystem.getLevelProgress()).toBe(0.75); // 75/100
    });

    it('should provide level statistics', () => {
      const stats = levelSystem.getStatistics();
      expect(stats.currentLevel).toBe(1);
      expect(stats.totalExperience).toBe(0);
      expect(stats.experienceToNext).toBe(100);
      expect(stats.availablePoints).toBe(0);
      expect(stats.spentPoints).toBe(0);
    });

    it('should calculate time to next level', () => {
      // Add experience over time
      levelSystem.addExperience(25);
      const timeEstimate = levelSystem.getEstimatedTimeToNextLevel(25); // 25 XP per second
      expect(timeEstimate).toBe(3); // 75 XP needed / 25 XP per second = 3 seconds
    });
  });

  describe('Save/Load State', () => {
    it('should save and restore state', () => {
      levelSystem.addExperience(250);
      levelSystem.spendUpgradePoint(PlayerUpgradeType.DAMAGE);
      
      const state = levelSystem.getState();
      
      const newSystem = new PlayerLevelSystem();
      newSystem.setState(state);
      
      expect(newSystem.getLevel()).toBe(levelSystem.getLevel());
      expect(newSystem.getExperience()).toBe(levelSystem.getExperience());
      expect(newSystem.getAvailableUpgradePoints()).toBe(levelSystem.getAvailableUpgradePoints());
      expect(newSystem.getUpgradeDistribution()).toEqual(levelSystem.getUpgradeDistribution());
    });
  });

  describe('Level Scaling', () => {
    it('should have exponential XP curve', () => {
      const req1 = levelSystem.getExperienceRequirements()[1];
      const req10 = levelSystem.getExperienceRequirements()[10];
      const req25 = levelSystem.getExperienceRequirements()[25];
      const req49 = levelSystem.getExperienceRequirements()[49];
      
      // Each should be significantly higher than the previous
      expect(req10).toBeGreaterThan(req1 * 2);
      expect(req25).toBeGreaterThan(req10 * 2);
      expect(req49).toBeGreaterThan(req25 * 2);
    });

    it('should cap experience gain at max level', () => {
      // Force to max level
      levelSystem.addExperience(10000000); // Get to max level
      expect(levelSystem.getLevel()).toBe(50);
      
      const expBefore = levelSystem.getTotalExperience();
      const result = levelSystem.addExperience(1000);
      const expAfter = levelSystem.getTotalExperience();
      
      expect(result).toBe(false); // Should return false at max level
      expect(expAfter).toBe(expBefore); // No more XP gained at max level
    });
  });
});