import { describe, it, expect, beforeEach } from 'vitest';
import { Tower, TowerType } from '../../src/entities/Tower';
import { UpgradeType, TowerUpgradeManager } from '../../src/systems/TowerUpgradeManager';

describe('Tower Upgrades', () => {
  let tower: Tower;
  let upgradeManager: TowerUpgradeManager;

  beforeEach(() => {
    tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
    upgradeManager = new TowerUpgradeManager();
  });

  describe('upgrade system', () => {
    it('should initialize tower with level 1', () => {
      expect(tower.getLevel()).toBe(1);
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
      expect(tower.getUpgradeLevel(UpgradeType.RANGE)).toBe(0);
      expect(tower.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(0);
    });

    it('should calculate upgrade costs correctly', () => {
      const damageCost = upgradeManager.getUpgradeCost(tower, UpgradeType.DAMAGE);
      const rangeCost = upgradeManager.getUpgradeCost(tower, UpgradeType.RANGE);
      const fireRateCost = upgradeManager.getUpgradeCost(tower, UpgradeType.FIRE_RATE);

      expect(damageCost).toBe(15); // Base cost for level 1 damage upgrade
      expect(rangeCost).toBe(20); // Base cost for level 1 range upgrade
      expect(fireRateCost).toBe(25); // Base cost for level 1 fire rate upgrade
    });

    it('should increase upgrade costs with each level', () => {
      const initialCost = upgradeManager.getUpgradeCost(tower, UpgradeType.DAMAGE);
      
      // Upgrade once
      tower.upgrade(UpgradeType.DAMAGE);
      const secondCost = upgradeManager.getUpgradeCost(tower, UpgradeType.DAMAGE);
      
      expect(secondCost).toBeGreaterThan(initialCost);
      expect(secondCost).toBe(Math.floor(initialCost * 1.5)); // 50% increase
    });

    it('should limit upgrade levels', () => {
      const maxLevel = 5;
      
      // Upgrade to max level
      for (let i = 0; i < maxLevel; i++) {
        expect(tower.canUpgrade(UpgradeType.DAMAGE)).toBe(true);
        tower.upgrade(UpgradeType.DAMAGE);
      }
      
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(maxLevel);
      expect(tower.canUpgrade(UpgradeType.DAMAGE)).toBe(false);
    });
  });

  describe('damage upgrades', () => {
    it('should increase damage when upgraded', () => {
      const initialDamage = tower.damage;
      
      tower.upgrade(UpgradeType.DAMAGE);
      
      expect(tower.damage).toBeGreaterThan(initialDamage);
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
    });

    it('should stack damage upgrades', () => {
      const initialDamage = tower.damage;
      
      tower.upgrade(UpgradeType.DAMAGE);
      const firstUpgradeDamage = tower.damage;
      
      tower.upgrade(UpgradeType.DAMAGE);
      const secondUpgradeDamage = tower.damage;
      
      expect(firstUpgradeDamage).toBeGreaterThan(initialDamage);
      expect(secondUpgradeDamage).toBeGreaterThan(firstUpgradeDamage);
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(2);
    });
  });

  describe('range upgrades', () => {
    it('should increase range when upgraded', () => {
      const initialRange = tower.range;
      
      tower.upgrade(UpgradeType.RANGE);
      
      expect(tower.range).toBeGreaterThan(initialRange);
      expect(tower.getUpgradeLevel(UpgradeType.RANGE)).toBe(1);
    });

    it('should affect tower targeting', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const distantEnemy = { position: { x: 250, y: 100 }, isAlive: true } as any;
      
      // Enemy should be out of range initially (150 units away, tower range is 100)
      expect(tower.isInRange(distantEnemy.position, tower.range)).toBe(false);
      
      // Upgrade range twice (should increase range to 100 * 1.5 = 150+)
      tower.upgrade(UpgradeType.RANGE);
      tower.upgrade(UpgradeType.RANGE);
      
      // Enemy should now be in range
      expect(tower.isInRange(distantEnemy.position, tower.range)).toBe(true);
    });
  });

  describe('fire rate upgrades', () => {
    it('should increase fire rate when upgraded', () => {
      const initialFireRate = tower.fireRate;
      
      tower.upgrade(UpgradeType.FIRE_RATE);
      
      expect(tower.fireRate).toBeGreaterThan(initialFireRate);
      expect(tower.getUpgradeLevel(UpgradeType.FIRE_RATE)).toBe(1);
    });

    it('should reduce cooldown time', () => {
      const initialCooldown = tower.getCooldownTime();
      
      tower.upgrade(UpgradeType.FIRE_RATE);
      
      expect(tower.getCooldownTime()).toBeLessThan(initialCooldown);
    });
  });

  describe('visual upgrades', () => {
    it('should change tower appearance based on upgrades', () => {
      expect(tower.getVisualLevel()).toBe(1);
      
      // Upgrade multiple stats
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.RANGE);
      
      expect(tower.getVisualLevel()).toBeGreaterThan(1);
    });

    it('should increase tower size with upgrades', () => {
      const initialRadius = tower.radius;
      
      // Multiple upgrades should increase visual level
      for (let i = 0; i < 6; i++) {
        if (tower.canUpgrade(UpgradeType.DAMAGE)) {
          tower.upgrade(UpgradeType.DAMAGE);
        } else if (tower.canUpgrade(UpgradeType.RANGE)) {
          tower.upgrade(UpgradeType.RANGE);
        } else if (tower.canUpgrade(UpgradeType.FIRE_RATE)) {
          tower.upgrade(UpgradeType.FIRE_RATE);
        }
      }
      
      expect(tower.radius).toBeGreaterThanOrEqual(initialRadius);
    });
  });

  describe('upgrade manager', () => {
    it('should check if upgrade is affordable', () => {
      const cost = upgradeManager.getUpgradeCost(tower, UpgradeType.DAMAGE);
      
      expect(upgradeManager.canAffordUpgrade(tower, UpgradeType.DAMAGE, cost)).toBe(true);
      expect(upgradeManager.canAffordUpgrade(tower, UpgradeType.DAMAGE, cost - 1)).toBe(false);
    });

    it('should apply upgrade and return cost', () => {
      const initialDamage = tower.damage;
      const cost = upgradeManager.applyUpgrade(tower, UpgradeType.DAMAGE);
      
      expect(tower.damage).toBeGreaterThan(initialDamage);
      expect(cost).toBeGreaterThan(0);
    });

    it('should not apply upgrade if at max level', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        upgradeManager.applyUpgrade(tower, UpgradeType.DAMAGE);
      }
      
      const cost = upgradeManager.applyUpgrade(tower, UpgradeType.DAMAGE);
      expect(cost).toBe(0); // No cost if upgrade failed
    });
  });
});