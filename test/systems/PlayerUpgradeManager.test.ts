import { describe, it, expect, beforeEach } from 'vitest';
import { Player, PlayerUpgradeType } from '../../src/entities/Player';
import { PlayerUpgradeManager } from '../../src/systems/PlayerUpgradeManager';

describe('PlayerUpgradeManager', () => {
  let player: Player;
  let upgradeManager: PlayerUpgradeManager;

  beforeEach(() => {
    player = new Player({ x: 100, y: 100 });
    upgradeManager = new PlayerUpgradeManager();
  });

  describe('upgrade costs', () => {
    it('should return correct base costs for level 0 upgrades', () => {
      expect(upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE)).toBe(25);
      expect(upgradeManager.getUpgradeCost(player, PlayerUpgradeType.SPEED)).toBe(20);
      expect(upgradeManager.getUpgradeCost(player, PlayerUpgradeType.FIRE_RATE)).toBe(30);
      expect(upgradeManager.getUpgradeCost(player, PlayerUpgradeType.HEALTH)).toBe(35);
    });

    it('should increase costs with each upgrade level', () => {
      const initialCost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      // Upgrade once
      player.upgrade(PlayerUpgradeType.DAMAGE);
      const secondCost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      expect(secondCost).toBeGreaterThan(initialCost);
      expect(secondCost).toBe(Math.floor(initialCost * 1.5)); // 50% increase
    });

    it('should return 0 cost for max level upgrades', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        player.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      expect(upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE)).toBe(0);
    });

    it('should calculate exponential cost increases correctly', () => {
      const baseCost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      player.upgrade(PlayerUpgradeType.DAMAGE); // Level 1
      const level1Cost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      player.upgrade(PlayerUpgradeType.DAMAGE); // Level 2
      const level2Cost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      expect(level1Cost).toBe(Math.floor(baseCost * 1.5));
      expect(level2Cost).toBe(Math.floor(baseCost * 1.5 * 1.5));
    });
  });

  describe('apply upgrade', () => {
    it('should apply upgrade and return cost', () => {
      const expectedCost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      const initialDamage = player.damage;
      
      const actualCost = upgradeManager.applyUpgrade(player, PlayerUpgradeType.DAMAGE);
      
      expect(actualCost).toBe(expectedCost);
      expect(player.damage).toBeGreaterThan(initialDamage);
      expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(1);
    });

    it('should return 0 if upgrade fails (max level)', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        player.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      const cost = upgradeManager.applyUpgrade(player, PlayerUpgradeType.DAMAGE);
      expect(cost).toBe(0);
    });

    it('should handle all upgrade types', () => {
      const upgradeTypes = [
        PlayerUpgradeType.DAMAGE,
        PlayerUpgradeType.SPEED,
        PlayerUpgradeType.FIRE_RATE,
        PlayerUpgradeType.HEALTH
      ];
      
      upgradeTypes.forEach(upgradeType => {
        const cost = upgradeManager.applyUpgrade(player, upgradeType);
        expect(cost).toBeGreaterThan(0);
        expect(player.getUpgradeLevel(upgradeType)).toBe(1);
      });
    });
  });

  describe('affordability checks', () => {
    it('should check if upgrade is affordable', () => {
      const cost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, cost)).toBe(true);
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, cost - 1)).toBe(false);
    });

    it('should return false if at max level even with enough currency', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        player.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, 1000)).toBe(false);
    });

    it('should check both affordability and upgrade availability', () => {
      const cost = upgradeManager.getUpgradeCost(player, PlayerUpgradeType.DAMAGE);
      
      // Sufficient currency and can upgrade
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, cost)).toBe(true);
      
      // Insufficient currency but can upgrade
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, cost - 1)).toBe(false);
    });
  });

  describe('upgrade descriptions', () => {
    it('should provide descriptions for all upgrade types', () => {
      expect(upgradeManager.getUpgradeDescription(PlayerUpgradeType.DAMAGE)).toContain('damage');
      expect(upgradeManager.getUpgradeDescription(PlayerUpgradeType.SPEED)).toContain('speed');
      expect(upgradeManager.getUpgradeDescription(PlayerUpgradeType.FIRE_RATE)).toContain('fire rate');
      expect(upgradeManager.getUpgradeDescription(PlayerUpgradeType.HEALTH)).toContain('health');
    });

    it('should return meaningful descriptions', () => {
      const damageDesc = upgradeManager.getUpgradeDescription(PlayerUpgradeType.DAMAGE);
      expect(damageDesc).toBe('Increase damage by 40%');
      
      const speedDesc = upgradeManager.getUpgradeDescription(PlayerUpgradeType.SPEED);
      expect(speedDesc).toBe('Increase movement speed by 30%');
    });
  });

  describe('upgrade info aggregation', () => {
    it('should return complete upgrade info for all types', () => {
      const upgradeInfo = upgradeManager.getAllUpgradeInfo(player);
      
      expect(upgradeInfo).toHaveLength(5); // 5 upgrade types (DAMAGE, SPEED, FIRE_RATE, HEALTH, REGENERATION)
      
      upgradeInfo.forEach(info => {
        expect(info).toHaveProperty('type');
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('cost');
        expect(info).toHaveProperty('level');
        expect(info).toHaveProperty('maxLevel');
        expect(info).toHaveProperty('canUpgrade');
        expect(info).toHaveProperty('description');
        
        expect(info.maxLevel).toBe(5);
        expect(info.level).toBe(0); // Initial level
        expect(info.canUpgrade).toBe(true); // Can upgrade initially
      });
    });

    it('should update upgrade info after upgrades', () => {
      player.upgrade(PlayerUpgradeType.DAMAGE);
      
      const upgradeInfo = upgradeManager.getAllUpgradeInfo(player);
      const damageInfo = upgradeInfo.find(info => info.type === PlayerUpgradeType.DAMAGE);
      
      expect(damageInfo?.level).toBe(1);
      expect(damageInfo?.cost).toBeGreaterThan(25); // Should be higher than base cost
    });

    it('should show correct upgrade names', () => {
      const upgradeInfo = upgradeManager.getAllUpgradeInfo(player);
      
      const names = upgradeInfo.map(info => info.name);
      expect(names).toContain('Damage');
      expect(names).toContain('Speed');
      expect(names).toContain('Fire Rate');
      expect(names).toContain('Health');
    });

    it('should indicate when upgrades cannot be performed', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        player.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      const upgradeInfo = upgradeManager.getAllUpgradeInfo(player);
      const damageInfo = upgradeInfo.find(info => info.type === PlayerUpgradeType.DAMAGE);
      
      expect(damageInfo?.level).toBe(5);
      expect(damageInfo?.canUpgrade).toBe(false);
      expect(damageInfo?.cost).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle unknown upgrade types gracefully', () => {
      const unknownType = 'UNKNOWN' as PlayerUpgradeType;
      expect(() => upgradeManager.getUpgradeDescription(unknownType)).not.toThrow();
    });

    it('should handle negative currency amounts', () => {
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, -100)).toBe(false);
    });

    it('should handle zero currency amounts', () => {
      expect(upgradeManager.canAffordUpgrade(player, PlayerUpgradeType.DAMAGE, 0)).toBe(false);
    });
  });
});