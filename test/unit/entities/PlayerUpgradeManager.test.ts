import { describe, expect, it, beforeEach } from 'bun:test';
import { PlayerUpgradeManager } from '@/entities/player/PlayerUpgradeManager';
import { PlayerLevelSystem } from '@/entities/player/PlayerLevelSystem';
import { UpgradeType, PLAYER_UPGRADE_DEFINITIONS } from '@/config/PlayerUpgradeConfig';

describe('PlayerUpgradeManager', () => {
  let levelSystem: PlayerLevelSystem;
  let upgradeManager: PlayerUpgradeManager;

  beforeEach(() => {
    levelSystem = new PlayerLevelSystem();
    upgradeManager = new PlayerUpgradeManager(levelSystem);
  });

  describe('initialization', () => {
    it('should initialize all upgrade types at level 0', () => {
      Object.values(UpgradeType).forEach(type => {
        expect(upgradeManager.getUpgradeLevel(type)).toBe(0);
      });
    });

    it('should have zero bonuses initially', () => {
      expect(upgradeManager.getDamageMultiplier()).toBe(1);
      expect(upgradeManager.getFireRateMultiplier()).toBe(1);
      expect(upgradeManager.getMovementSpeedMultiplier()).toBe(1);
      expect(upgradeManager.getMaxHealthMultiplier()).toBe(1);
      expect(upgradeManager.getRegenerationBonus()).toBe(0);
    });
  });

  describe('purchaseUpgrade', () => {
    it('should fail when no upgrade points available', () => {
      const result = upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      expect(result).toBe(false);
      expect(upgradeManager.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
    });

    it('should succeed when points are available', () => {
      // Give player some upgrade points
      levelSystem.addExperience(100); // Level up to get points
      const availablePoints = levelSystem.getAvailableUpgradePoints();
      expect(availablePoints).toBeGreaterThan(0);

      const result = upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      expect(result).toBe(true);
      expect(upgradeManager.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
      expect(levelSystem.getAvailableUpgradePoints()).toBe(availablePoints - 1);
    });

    it('should fail when upgrade is at max level', () => {
      // Level up to get many points
      for (let i = 0; i < 50; i++) {
        levelSystem.addExperience(10000);
      }

      // Max out damage upgrade
      const maxLevel = PLAYER_UPGRADE_DEFINITIONS[UpgradeType.DAMAGE].maxLevel;
      for (let i = 0; i < maxLevel; i++) {
        const result = upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
        expect(result).toBe(true);
      }

      // Should fail on next attempt
      const result = upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      expect(result).toBe(false);
      expect(upgradeManager.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(maxLevel);
    });

    it('should handle multi-cost upgrades correctly', () => {
      // Level up to get points
      for (let i = 0; i < 10; i++) {
        levelSystem.addExperience(1000);
      }

      const initialPoints = levelSystem.getAvailableUpgradePoints();
      const regenCost = PLAYER_UPGRADE_DEFINITIONS[UpgradeType.REGENERATION].costPerLevel;
      
      const result = upgradeManager.purchaseUpgrade(UpgradeType.REGENERATION);
      expect(result).toBe(true);
      expect(levelSystem.getAvailableUpgradePoints()).toBe(initialPoints - regenCost);
    });
  });

  describe('upgrade bonuses', () => {
    beforeEach(() => {
      // Give enough points for testing
      for (let i = 0; i < 20; i++) {
        levelSystem.addExperience(1000);
      }
    });

    it('should calculate damage multiplier correctly', () => {
      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      
      const expectedBonus = 1 + (2 * PLAYER_UPGRADE_DEFINITIONS[UpgradeType.DAMAGE].bonusPerLevel);
      expect(upgradeManager.getDamageMultiplier()).toBe(expectedBonus);
    });

    it('should calculate fire rate multiplier correctly', () => {
      upgradeManager.purchaseUpgrade(UpgradeType.FIRE_RATE);
      upgradeManager.purchaseUpgrade(UpgradeType.FIRE_RATE);
      upgradeManager.purchaseUpgrade(UpgradeType.FIRE_RATE);
      
      const expectedBonus = 1 + (3 * PLAYER_UPGRADE_DEFINITIONS[UpgradeType.FIRE_RATE].bonusPerLevel);
      expect(upgradeManager.getFireRateMultiplier()).toBe(expectedBonus);
    });

    it('should calculate movement speed multiplier correctly', () => {
      upgradeManager.purchaseUpgrade(UpgradeType.MOVEMENT_SPEED);
      
      const expectedBonus = 1 + PLAYER_UPGRADE_DEFINITIONS[UpgradeType.MOVEMENT_SPEED].bonusPerLevel;
      expect(upgradeManager.getMovementSpeedMultiplier()).toBe(expectedBonus);
    });

    it('should calculate max health multiplier correctly', () => {
      upgradeManager.purchaseUpgrade(UpgradeType.MAX_HEALTH);
      upgradeManager.purchaseUpgrade(UpgradeType.MAX_HEALTH);
      
      const expectedBonus = 1 + (2 * PLAYER_UPGRADE_DEFINITIONS[UpgradeType.MAX_HEALTH].bonusPerLevel);
      expect(upgradeManager.getMaxHealthMultiplier()).toBe(expectedBonus);
    });

    it('should calculate regeneration bonus correctly', () => {
      upgradeManager.purchaseUpgrade(UpgradeType.REGENERATION);
      
      const expectedBonus = PLAYER_UPGRADE_DEFINITIONS[UpgradeType.REGENERATION].bonusPerLevel;
      expect(upgradeManager.getRegenerationBonus()).toBe(expectedBonus);
    });
  });

  describe('canPurchaseUpgrade', () => {
    it('should return false when no points available', () => {
      expect(upgradeManager.canPurchaseUpgrade(UpgradeType.DAMAGE)).toBe(false);
    });

    it('should return true when points available and not at max', () => {
      levelSystem.addExperience(100); // Get some points
      expect(upgradeManager.canPurchaseUpgrade(UpgradeType.DAMAGE)).toBe(true);
    });

    it('should return false when at max level', () => {
      // Max out an upgrade
      for (let i = 0; i < 50; i++) {
        levelSystem.addExperience(10000);
      }

      const maxLevel = PLAYER_UPGRADE_DEFINITIONS[UpgradeType.DAMAGE].maxLevel;
      for (let i = 0; i < maxLevel; i++) {
        upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      }

      expect(upgradeManager.canPurchaseUpgrade(UpgradeType.DAMAGE)).toBe(false);
    });

    it('should check cost correctly for multi-cost upgrades', () => {
      levelSystem.addExperience(100); // Get 1 point
      
      // Regeneration costs 2 points
      expect(upgradeManager.canPurchaseUpgrade(UpgradeType.REGENERATION)).toBe(false);
      
      levelSystem.addExperience(200); // Get more XP to level up again
      // Should have at least 2 points now
      expect(levelSystem.getAvailableUpgradePoints()).toBeGreaterThanOrEqual(2);
      expect(upgradeManager.canPurchaseUpgrade(UpgradeType.REGENERATION)).toBe(true);
    });
  });

  describe('getTotalPointsSpent', () => {
    it('should calculate total points spent correctly', () => {
      for (let i = 0; i < 20; i++) {
        levelSystem.addExperience(1000);
      }

      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE); // 1 point
      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE); // 1 point
      upgradeManager.purchaseUpgrade(UpgradeType.REGENERATION); // 2 points

      expect(upgradeManager.getTotalPointsSpent()).toBe(4);
    });
  });

  describe('state management', () => {
    it('should save and restore state correctly', () => {
      for (let i = 0; i < 20; i++) {
        levelSystem.addExperience(1000);
      }

      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      upgradeManager.purchaseUpgrade(UpgradeType.FIRE_RATE);
      upgradeManager.purchaseUpgrade(UpgradeType.REGENERATION);

      const state = upgradeManager.getState();
      
      // Create new manager
      const newManager = new PlayerUpgradeManager(levelSystem);
      newManager.setState(state);

      // Verify all levels match
      Object.values(UpgradeType).forEach(type => {
        expect(newManager.getUpgradeLevel(type)).toBe(upgradeManager.getUpgradeLevel(type));
      });

      // Verify bonuses match
      expect(newManager.getDamageMultiplier()).toBe(upgradeManager.getDamageMultiplier());
      expect(newManager.getFireRateMultiplier()).toBe(upgradeManager.getFireRateMultiplier());
      expect(newManager.getRegenerationBonus()).toBe(upgradeManager.getRegenerationBonus());
    });
  });

  describe('getAllUpgradeStates', () => {
    it('should return correct upgrade states', () => {
      for (let i = 0; i < 10; i++) {
        levelSystem.addExperience(1000);
      }

      upgradeManager.purchaseUpgrade(UpgradeType.DAMAGE);
      upgradeManager.purchaseUpgrade(UpgradeType.FIRE_RATE);

      const states = upgradeManager.getAllUpgradeStates();
      
      expect(states.length).toBe(Object.values(UpgradeType).length);
      
      const damageState = states.find(s => s.type === UpgradeType.DAMAGE);
      expect(damageState).toBeDefined();
      expect(damageState!.level).toBe(1);
      expect(damageState!.maxLevel).toBe(PLAYER_UPGRADE_DEFINITIONS[UpgradeType.DAMAGE].maxLevel);
      expect(damageState!.totalBonus).toBe(PLAYER_UPGRADE_DEFINITIONS[UpgradeType.DAMAGE].bonusPerLevel);
    });
  });
});