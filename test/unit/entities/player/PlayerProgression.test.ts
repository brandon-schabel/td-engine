import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PlayerProgression } from '@/entities/player/PlayerProgression';
import { PlayerUpgradeType } from '@/entities/Player';

// Mock the config import
vi.mock('@/config/GameConfig', () => ({
  UPGRADE_CONFIG: {
    maxLevel: 5,
    levelCalculationDivisor: {
      player: 3
    }
  }
}));

describe('PlayerProgression', () => {
  let progression: PlayerProgression;

  beforeEach(() => {
    progression = new PlayerProgression();
  });

  describe('initialization', () => {
    test('starts at level 1', () => {
      expect(progression.getLevel()).toBe(1);
    });

    test('initializes all upgrade types at level 0', () => {
      Object.values(PlayerUpgradeType).forEach(upgradeType => {
        expect(progression.getUpgradeLevel(upgradeType)).toBe(0);
      });
    });

    test('starts with 0 total experience', () => {
      const expProgress = progression.getExperienceProgress();
      expect(expProgress.current).toBe(0);
      expect(expProgress.required).toBe(100);
    });
  });

  describe('upgrade system', () => {
    test('upgrades increase level', () => {
      const result = progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(result).toBe(true);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(1);
    });

    test('cannot exceed max level', () => {
      // Upgrade to max level (5)
      for (let i = 0; i < 5; i++) {
        progression.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      // Try to upgrade beyond max
      const result = progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(result).toBe(false);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(5);
    });

    test('canUpgrade returns correct status', () => {
      expect(progression.canUpgrade(PlayerUpgradeType.SPEED)).toBe(true);
      
      // Max out speed upgrades
      for (let i = 0; i < 5; i++) {
        progression.upgrade(PlayerUpgradeType.SPEED);
      }
      
      expect(progression.canUpgrade(PlayerUpgradeType.SPEED)).toBe(false);
    });

    test('updates player level based on total upgrades', () => {
      expect(progression.getLevel()).toBe(1);
      
      // Add 3 upgrades (divisor is 3)
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.upgrade(PlayerUpgradeType.HEALTH);
      
      expect(progression.getLevel()).toBe(2); // 1 + floor(3/3)
      
      // Add 3 more upgrades
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(progression.getLevel()).toBe(3); // 1 + floor(6/3)
    });

    test('getTotalUpgrades counts all upgrades', () => {
      expect(progression.getTotalUpgrades()).toBe(0);
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      
      expect(progression.getTotalUpgrades()).toBe(3);
    });
  });

  describe('experience system', () => {
    test('adds experience correctly', () => {
      const leveledUp = progression.addExperience(50);
      
      expect(leveledUp).toBe(false);
      expect(progression.getExperienceProgress().current).toBe(50);
    });

    test('levels up when reaching threshold', () => {
      const leveledUp = progression.addExperience(100);
      
      expect(leveledUp).toBe(true);
      expect(progression.getLevel()).toBe(2);
      expect(progression.getExperienceProgress().current).toBe(0);
    });

    test('carries over excess experience', () => {
      progression.addExperience(120);
      
      expect(progression.getLevel()).toBe(2);
      expect(progression.getExperienceProgress().current).toBe(20);
    });

    test('experience requirement increases with level', () => {
      const firstReq = progression.getExperienceProgress().required;
      progression.addExperience(100); // Level up
      
      const secondReq = progression.getExperienceProgress().required;
      expect(secondReq).toBeGreaterThan(firstReq);
      
      // Should follow exponential growth: 100 * 1.5^(level-1)
      expect(secondReq).toBe(150); // 100 * 1.5^1
    });

    test('experience progress percentage', () => {
      progression.addExperience(25);
      
      const progress = progression.getExperienceProgress();
      expect(progress.percentage).toBe(0.25);
      
      progression.addExperience(25);
      expect(progression.getExperienceProgress().percentage).toBe(0.5);
    });
  });

  describe('stat multipliers', () => {
    test('damage multiplier increases with upgrades', () => {
      expect(progression.getDamageMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      expect(progression.getDamageMultiplier()).toBe(1.4); // 40% increase
      
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      expect(progression.getDamageMultiplier()).toBe(1.8); // 80% increase
    });

    test('speed multiplier increases with upgrades', () => {
      expect(progression.getSpeedMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.SPEED);
      expect(progression.getSpeedMultiplier()).toBe(1.3); // 30% increase
    });

    test('fire rate multiplier increases with upgrades', () => {
      expect(progression.getFireRateMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.FIRE_RATE);
      expect(progression.getFireRateMultiplier()).toBe(1.25); // 25% increase
    });

    test('health multiplier increases with upgrades', () => {
      expect(progression.getHealthMultiplier()).toBe(1.0);
      
      progression.upgrade(PlayerUpgradeType.HEALTH);
      expect(progression.getHealthMultiplier()).toBe(1.5); // 50% increase
    });

    test('regeneration rate scales with upgrades', () => {
      expect(progression.getRegenerationRate()).toBe(0);
      expect(progression.hasRegeneration()).toBe(false);
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      expect(progression.getRegenerationRate()).toBe(3.5); // 2 + 1.5
      expect(progression.hasRegeneration()).toBe(true);
      
      progression.upgrade(PlayerUpgradeType.REGENERATION);
      expect(progression.getRegenerationRate()).toBe(5); // 2 + 3
    });
  });

  describe('upgrade info and descriptions', () => {
    test('getAllUpgradeInfo returns info for all types', () => {
      const allInfo = progression.getAllUpgradeInfo();
      
      expect(allInfo).toHaveLength(5);
      expect(allInfo.every(info => info.maxLevel === 5)).toBe(true);
      expect(allInfo.every(info => info.canUpgrade === true)).toBe(true);
    });

    test('upgrade info updates after upgrades', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      const allInfo = progression.getAllUpgradeInfo();
      const damageInfo = allInfo.find(info => info.type === PlayerUpgradeType.DAMAGE);
      
      expect(damageInfo?.level).toBe(2);
      expect(damageInfo?.canUpgrade).toBe(true);
    });

    test('getUpgradeDescription returns meaningful descriptions', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      const desc = progression.getUpgradeDescription(PlayerUpgradeType.DAMAGE);
      expect(desc).toContain('40%'); // Should show 40% increase
      
      const regenDesc = progression.getUpgradeDescription(PlayerUpgradeType.REGENERATION);
      expect(regenDesc).toContain('0.0 HP/s'); // No regen at level 0
    });
  });

  describe('prestige system', () => {
    test('cannot prestige before requirements', () => {
      expect(progression.canPrestige()).toBe(false);
      
      const result = progression.prestige();
      expect(result.reset).toBe(false);
      expect(result.prestigeLevel).toBe(0);
    });

    test('can prestige at level 50 with 25 upgrades', () => {
      // Mock high level and upgrades
      for (let i = 0; i < 50; i++) {
        progression.addExperience(1000000); // Force level ups
      }
      
      // Add 25 total upgrades
      for (let i = 0; i < 5; i++) {
        Object.values(PlayerUpgradeType).forEach(type => {
          progression.upgrade(type);
        });
      }
      
      expect(progression.canPrestige()).toBe(true);
    });

    test('prestige resets progression', () => {
      // Set up some progress
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.addExperience(50);
      
      // Force prestige conditions
      const state = progression.getState();
      state.level = 50;
      state.totalExperience = 0;
      progression.setState(state);
      
      // Add required upgrades
      for (let i = 0; i < 5; i++) {
        Object.values(PlayerUpgradeType).forEach(type => {
          progression.upgrade(type);
        });
      }
      
      const result = progression.prestige();
      
      if (result.reset) {
        expect(progression.getLevel()).toBe(1);
        expect(progression.getTotalUpgrades()).toBe(0);
        expect(progression.getExperienceProgress().current).toBe(0);
      }
    });
  });

  describe('achievements', () => {
    test('tracks achievement progress', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.addExperience(50);
      
      const achievements = progression.getAchievements();
      
      expect(achievements.totalUpgrades).toBe(2);
      expect(achievements.fullyMaxedUpgrades).toBe(0);
      expect(achievements.experienceGained).toBe(50);
    });

    test('tracks fully maxed upgrades', () => {
      // Max out damage
      for (let i = 0; i < 5; i++) {
        progression.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      // Max out speed
      for (let i = 0; i < 5; i++) {
        progression.upgrade(PlayerUpgradeType.SPEED);
      }
      
      const achievements = progression.getAchievements();
      expect(achievements.fullyMaxedUpgrades).toBe(2);
    });
  });

  describe('save/load state', () => {
    test('getState returns complete state', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.SPEED);
      progression.addExperience(75);
      
      const state = progression.getState();
      
      expect(state.upgradeLevels[PlayerUpgradeType.DAMAGE]).toBe(1);
      expect(state.upgradeLevels[PlayerUpgradeType.SPEED]).toBe(1);
      expect(state.level).toBe(1);
      expect(state.totalExperience).toBe(75);
    });

    test('setState restores progression', () => {
      const state = {
        upgradeLevels: {
          [PlayerUpgradeType.DAMAGE]: 3,
          [PlayerUpgradeType.SPEED]: 2,
          [PlayerUpgradeType.FIRE_RATE]: 1,
          [PlayerUpgradeType.HEALTH]: 0,
          [PlayerUpgradeType.REGENERATION]: 0
        },
        level: 3,
        totalExperience: 45,
        experienceToNextLevel: 225
      };
      
      progression.setState(state);
      
      expect(progression.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(3);
      expect(progression.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(2);
      expect(progression.getLevel()).toBe(3);
      expect(progression.getExperienceProgress().current).toBe(45);
    });
  });

  describe('debug info', () => {
    test('provides comprehensive debug information', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.addExperience(50);
      
      const debug = progression.getDebugInfo();
      
      expect(debug.level).toBe(1);
      expect(debug.totalUpgrades).toBe(1);
      expect(debug.upgradeLevels[PlayerUpgradeType.DAMAGE]).toBe(1);
      expect(debug.experience.current).toBe(50);
      expect(debug.multipliers.damage).toBe(1.4);
    });
  });

  describe('edge cases', () => {
    test('handles multiple level ups in one experience gain', () => {
      // First level requires 100, second requires 150
      progression.addExperience(300);
      
      expect(progression.getLevel()).toBe(3);
      expect(progression.getExperienceProgress().current).toBe(50);
    });

    test('handles unknown upgrade types gracefully', () => {
      const desc = progression.getUpgradeDescription('INVALID' as PlayerUpgradeType);
      expect(desc).toBe('Unknown upgrade');
    });

    test('calculations remain consistent after state restore', () => {
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      progression.upgrade(PlayerUpgradeType.DAMAGE);
      
      const originalDamage = progression.getDamageMultiplier();
      const state = progression.getState();
      
      const newProgression = new PlayerProgression();
      newProgression.setState(state);
      
      expect(newProgression.getDamageMultiplier()).toBe(originalDamage);
    });
  });
});