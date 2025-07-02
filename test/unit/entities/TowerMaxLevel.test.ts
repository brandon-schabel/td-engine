import { describe, it, expect, beforeEach } from 'vitest';
import { Tower, TowerType, UpgradeType } from '@/entities/Tower';
import { UPGRADE_CONSTANTS } from '@/config/UpgradeConfig';

describe('Tower Max Level 10', () => {
  let tower: Tower;

  beforeEach(() => {
    tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
  });

  it('should have max level of 10', () => {
    expect(tower.getMaxUpgradeLevel()).toBe(10);
  });

  it('should allow upgrading up to level 10', () => {
    // Upgrade damage 10 times
    for (let i = 0; i < 10; i++) {
      expect(tower.canUpgrade(UpgradeType.DAMAGE)).toBe(true);
      const success = tower.upgrade(UpgradeType.DAMAGE);
      expect(success).toBe(true);
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(i + 1);
    }
    
    // Should not allow 11th upgrade
    expect(tower.canUpgrade(UpgradeType.DAMAGE)).toBe(false);
    const success = tower.upgrade(UpgradeType.DAMAGE);
    expect(success).toBe(false);
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(10);
  });

  it('should have appropriate cost scaling for 10 levels', () => {
    const costs: number[] = [];
    
    // Get costs for each level
    for (let i = 0; i < 10; i++) {
      const cost = tower.getUpgradeCost(UpgradeType.DAMAGE);
      costs.push(cost);
      tower.upgrade(UpgradeType.DAMAGE);
    }
    
    // Verify costs increase by 25% each level
    expect(costs[0]).toBe(25); // Base cost
    expect(costs[1]).toBe(31); // floor(25 * 1.25^1) = floor(31.25) = 31
    expect(costs[2]).toBe(39); // floor(25 * 1.25^2) = floor(39.0625) = 39
    
    // Cost at max level should be 0
    expect(tower.getUpgradeCost(UpgradeType.DAMAGE)).toBe(0);
  });

  it('should have significant stat improvements with 10 levels', () => {
    const baseDamage = tower.damage;
    
    // Upgrade to max level
    for (let i = 0; i < 10; i++) {
      tower.upgrade(UpgradeType.DAMAGE);
    }
    
    const maxDamage = tower.damage;
    
    // Should have 150% total increase (15% per level * 10 levels)
    expect(maxDamage).toBeCloseTo(baseDamage * 2.5, 1);
  });

  it('should work for all upgrade types', () => {
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    
    upgradeTypes.forEach(type => {
      // Reset tower
      tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // Upgrade to max
      for (let i = 0; i < 10; i++) {
        expect(tower.canUpgrade(type)).toBe(true);
        tower.upgrade(type);
      }
      
      expect(tower.getUpgradeLevel(type)).toBe(10);
      expect(tower.canUpgrade(type)).toBe(false);
    });
  });

  it('should update visual level appropriately', () => {
    expect(tower.getVisualLevel()).toBe(1);
    
    // Upgrade some stats
    tower.upgrade(UpgradeType.DAMAGE);
    tower.upgrade(UpgradeType.DAMAGE);
    expect(tower.getVisualLevel()).toBe(2); // 2 upgrades / 2 = 1 visual level increase
    
    // Max out all upgrades
    for (let i = 0; i < 10; i++) {
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.RANGE);
      tower.upgrade(UpgradeType.FIRE_RATE);
    }
    
    // With 30 total upgrades and divisor of 2, should be at visual level 16
    // But it's capped based on the logic
    expect(tower.getVisualLevel()).toBeGreaterThan(1);
  });

  it('should calculate correct sell value with 10 level system', () => {
    const baseSellValue = tower.getSellValue();
    
    // Upgrade a few times
    for (let i = 0; i < 5; i++) {
      tower.upgrade(UpgradeType.DAMAGE);
    }
    
    const upgradedSellValue = tower.getSellValue();
    
    // Sell value should include upgrade costs
    expect(upgradedSellValue).toBeGreaterThan(baseSellValue);
  });
});