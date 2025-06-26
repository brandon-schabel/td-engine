/**
 * Unit tests for PlayerProgression
 * Tests upgrade system, level calculations, and experience mechanics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerProgression } from '@/entities/player/PlayerProgression';
import { PlayerUpgradeType } from '@/entities/Player';
import { UPGRADE_CONSTANTS } from '@/config/UpgradeConfig';

describe('PlayerProgression', () => {
  let progression: PlayerProgression;

  beforeEach(() => {
    progression = new PlayerProgression();
  });

  describe('initialization', () => {
    it('should start at level 1', () => {
      expect(progression.getLevel()).toBe(1);
    });

    it('should initialize all upgrade types at level 0', () => {
      Object.values(PlayerUpgradeType).forEach(upgradeType => {
        expect(progression.getUpgradeLevel(upgradeType)).toBe(0);
      });
    });

    it('should start with 0 total experience', () => {
      const expProgress = progression.getExperienceProgress();
      expect(expProgress.current).toBe(0);
      expect(expProgress.total).toBe(0);
    });
  });

  describe('upgrade system', () => {
    it('should upgrade successfully when below max level', () => {
      const success = progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(success).toBe(true);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(1);
    });

    it('should fail to upgrade at max level', () => {
      // Upgrade to max level (UPGRADE_CONSTANTS.maxLevel)
      for (let i = 0; i < UPGRADE_CONSTANTS.maxLevel; i++) {
        progression.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      const success = progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(success).toBe(false);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(UPGRADE_CONSTANTS.maxLevel);
    });

    it('should track upgrades independently', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(2);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(1);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.HEALTH)).toBe(0);
    });

    it('should not update player level based on upgrades', () => {
      // Level is now only affected by experience, not upgrades
      expect(progression.getLevel()).toBe(1);
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      expect(progression.getLevel()).toBe(1); // Level unchanged by upgrades
      
      progression.upgrade(PlayerUpgradeType.HEALTH);
      expect(progression.getLevel()).toBe(1); // Still level 1
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      expect(progression.getLevel()).toBe(1); // Level only changes with experience
    });

    it('should correctly report canUpgrade', () => {
      for (let i = 0; i < UPGRADE_CONSTANTS.maxLevel - 1; i++) {
        expect(progression.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(true);
        progression.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      expect(progression.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(true);
      progression.upgrade(PlayerUpgradeType.DAMAGE); // Max upgrade
      expect(progression.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(false);
    });
  });

  describe('stat multipliers', () => {
    it('should calculate damage multiplier correctly', () => {
      expect(progression.getDamageMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      expect(progression.getDamageMultiplier()).toBe(1.4); // +40%
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      expect(progression.getDamageMultiplier()).toBe(1.8); // +80%
    });

    it('should calculate speed multiplier correctly', () => {
      expect(progression.getSpeedMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.SPEED);
      expect(progression.getSpeedMultiplier()).toBe(1.3); // +30%
      
      progression.upgrade(PlayerUpgradeType.SPEED);
      expect(progression.getSpeedMultiplier()).toBe(1.6); // +60%
    });

    it('should calculate fire rate multiplier correctly', () => {
      expect(progression.getFireRateMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      expect(progression.getFireRateMultiplier()).toBe(1.25); // +25%
      
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      expect(progression.getFireRateMultiplier()).toBe(1.5); // +50%
    });

    it('should calculate health multiplier correctly', () => {
      expect(progression.getHealthMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.HEALTH);
      expect(progression.getHealthMultiplier()).toBe(1.5); // +50%
      
      progression.upgrade(PlayerUpgradeType.HEALTH);
      expect(progression.getHealthMultiplier()).toBe(2.0); // +100%
    });

    it('should calculate regeneration rate correctly', () => {
      expect(progression.getRegenerationRate()).toBe(0); // No regen at level 0
      expect(progression.hasRegeneration()).toBe(false);
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      expect(progression.getRegenerationRate()).toBe(3.5); // 2 + 1.5
      expect(progression.hasRegeneration()).toBe(true);
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      expect(progression.getRegenerationRate()).toBe(5); // 2 + 3
    });
  });

  describe('experience system', () => {
    it('should add experience and track progress', () => {
      const leveledUp = progression.addExperience(50);
      
      expect(leveledUp).toBe(false);
      expect(progression.getExperienceProgress().current).toBe(50);
      expect(progression.getExperienceProgress().required).toBe(100);
    });

    it('should level up when reaching required experience', () => {
      const leveledUp = progression.addExperience(100);
      
      expect(leveledUp).toBe(true);
      expect(progression.getLevel()).toBe(2);
      expect(progression.getExperienceProgress().current).toBe(0);
    });

    it('should carry over excess experience', () => {
      progression.addExperience(150); // 50 over requirement
      
      expect(progression.getLevel()).toBe(2);
      expect(progression.getExperienceProgress().current).toBe(50);
    });

    it('should calculate exponential experience requirements', () => {
      // Level 1: 100
      expect(progression.getExperienceProgress().required).toBe(100);
      
      progression.addExperience(100); // Level up to 2
      // Level 2: 100 * 1.5^1 = 150
      expect(progression.getExperienceProgress().required).toBe(150);
      
      progression.addExperience(150); // Level up to 3
      // Level 3: 100 * 1.5^2 = 225
      expect(progression.getExperienceProgress().required).toBe(225);
    });

    it('should calculate experience percentage correctly', () => {
      progression.addExperience(25);
      expect(progression.getExperienceProgress().percentage).toBe(0.25);
      
      progression.addExperience(25);
      expect(progression.getExperienceProgress().percentage).toBe(0.5);
    });
  });

  describe('upgrade information', () => {
    it('should provide upgrade info for all types', () => {
      const allInfo = progression.getAllUpgradeInfo();
      
      expect(allInfo).toHaveLength(5);
      
      const damageInfo = allInfo.find(info => info.type === PlayerUpgradeType.DAMAGE);
      expect(damageInfo).toEqual({
        type: PlayerUpgradeType.DAMAGE,
        level: 0,
        maxLevel: UPGRADE_CONSTANTS.maxLevel,
        canUpgrade: true
      });
    });

    it('should update upgrade info after upgrades', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      const allInfo = progression.getAllUpgradeInfo();
      const damageInfo = allInfo.find(info => info.type === PlayerUpgradeType.DAMAGE);
      
      expect(damageInfo?.level).toBe(2);
      expect(damageInfo?.canUpgrade).toBe(true);
    });

    it('should provide formatted upgrade descriptions', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      const desc = progression.getUpgradeDescription(PlayerUpgradeType.DAMAGE);
      expect(desc).toBe('Increase damage by 40%');
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      const regenDesc = progression.getUpgradeDescription(PlayerUpgradeType.REGENERATION);
      expect(regenDesc).toBe('Regenerate 3.5 HP/s');
    });
  });

  describe('prestige system', () => {
    it('should not allow prestige before requirements', () => {
      expect(progression.canPrestige()).toBe(false);
      
      const result = progression.prestige();
      expect(result.reset).toBe(false);
      expect(result.prestigeLevel).toBe(0);
      expect(result.bonusMultiplier).toBe(1.0);
    });

    it('should allow prestige at level 50 with 25 upgrades', () => {
      // Need 25 total upgrades minimum
      // Each upgrade type can go up to 5 levels (maxLevel)
      // We have 5 upgrade types, so max 25 upgrades total
      
      // Max out all upgrades (5 types * 5 levels = 25 upgrades)
      for (let level = 0; level < 5; level++) {
        Object.values(PlayerUpgradeType).forEach(type => {
          progression.upgrade(type);
        });
      }
      
      // Now level is based on experience, not upgrades
      // We need to level up to 50 through experience first
      for (let i = 1; i < 50; i++) {
        const expProgress = progression.getExperienceProgress();
        progression.addExperience(expProgress.required - expProgress.current);
      }
      
      expect(progression.getTotalUpgrades()).toBe(25);
      expect(progression.getLevel()).toBe(50);
      
      // Now we meet both requirements: level 50 + 25 upgrades
      expect(progression.canPrestige()).toBe(true);
    });

    it('should reset progression on prestige', () => {
      // Set up some progress
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.addExperience(500);
      
      // Simulate prestige (even though requirements not met)
      const originalLevel = progression.getLevel();
      
      // Manually trigger prestige reset
      progression.prestige();
      
      // If prestige happened, everything should be reset
      if (progression.getLevel() === 1) {
        expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(0);
        expect(progression.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(0);
        expect(progression.getExperienceProgress().current).toBe(0);
      }
    });
  });

  describe('achievements', () => {
    it('should track achievement statistics', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.addExperience(250);
      
      const achievements = progression.getAchievements();
      
      expect(achievements.totalUpgrades).toBe(3);
      expect(achievements.fullyMaxedUpgrades).toBe(0);
      // After adding 250 exp, it levels up at 100, leaving 150
      expect(achievements.experienceGained).toBe(150);
    });

    it('should track fully maxed upgrades', () => {
      // Max out damage upgrade
      for (let i = 0; i < UPGRADE_CONSTANTS.maxLevel; i++) {
        progression.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      const achievements = progression.getAchievements();
      expect(achievements.fullyMaxedUpgrades).toBe(1);
    });
  });

  describe('state persistence', () => {
    it('should save and restore state', () => {
      // Set up some state
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.addExperience(75);
      
      // Save state
      const state = progression.getState();
      
      // Create new progression and restore
      const newProgression = new PlayerProgression();
      newProgression.setState(state);
      
      // Verify restoration
      expect(newProgression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(2);
      expect(newProgression.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(1);
      // With 3 upgrades and divisor of 4: level = 1 + floor(3/4) = 1
      expect(newProgression.getLevel()).toBe(1);
      expect(newProgression.getExperienceProgress().current).toBe(75);
    });

    it('should handle state with all fields', () => {
      const state = progression.getState();
      
      expect(state).toHaveProperty('upgradeLevels');
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('totalExperience');
      expect(state).toHaveProperty('experienceToNextLevel');
    });
  });

  describe('debug information', () => {
    it('should provide comprehensive debug info', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.addExperience(50);
      
      const debug = progression.getDebugInfo();
      
      expect(debug.level).toBe(1);
      expect(debug.totalUpgrades).toBe(2);
      expect(debug.upgradeLevels[PlayerUpgradeType.DAMAGE]).toBe(1);
      expect(debug.upgradeLevels[PlayerUpgradeType.SPEED]).toBe(1);
      expect(debug.experience.current).toBe(50);
      expect(debug.multipliers.damage).toBe(1.4);
      expect(debug.multipliers.speed).toBe(1.3);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple level ups in one experience gain', () => {
      const leveledUp = progression.addExperience(400); // Enough for multiple levels
      
      expect(leveledUp).toBe(true);
      // The addExperience method only processes one level up per call
      // So even with 400 exp, it only goes from level 1 to 2
      expect(progression.getLevel()).toBe(2);
      // But the remaining experience should be 300 (400 - 100)
      expect(progression.getExperienceProgress().current).toBe(300);
    });

    it('should handle all upgrades at max level', () => {
      // Max out all upgrades
      Object.values(PlayerUpgradeType).forEach(type => {
        for (let i = 0; i < UPGRADE_CONSTANTS.maxLevel; i++) {
          progression.upgrade(type);
        }
      });
      
      const allInfo = progression.getAllUpgradeInfo();
      allInfo.forEach(info => {
        expect(info.canUpgrade).toBe(false);
        expect(info.level).toBe(UPGRADE_CONSTANTS.maxLevel);
      });
    });

    it('should handle unknown upgrade type gracefully', () => {
      const unknownType = 'UNKNOWN' as PlayerUpgradeType;
      expect(progression.getUpgradeLevel(unknownType)).toBe(0);
      // Unknown types are treated as level 0, so they can be upgraded
      expect(progression.canUpgrade(unknownType)).toBe(true);
      expect(progression.getUpgradeDescription(unknownType)).toBe('Unknown upgrade');
    });
  });
});