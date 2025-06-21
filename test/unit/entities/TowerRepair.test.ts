import { describe, it, expect, beforeEach } from 'vitest';
import { Tower, TowerType } from '@/entities/Tower';
import { TOWER_COSTS } from '@/config/GameConfig';

describe('Tower Repair Ability', () => {
  let tower: Tower;
  const towerPosition = { x: 100, y: 100 };

  beforeEach(() => {
    tower = new Tower(TowerType.BASIC, towerPosition);
  });

  describe('Damage and Repair', () => {
    it('should track damage taken', () => {
      const maxHealth = tower.maxHealth;
      expect(tower.health).toBe(maxHealth);
      expect(tower.getDamageTaken()).toBe(0);
      
      tower.takeDamage(30);
      expect(tower.health).toBe(maxHealth - 30);
      expect(tower.getDamageTaken()).toBe(30);
    });

    it('should calculate repair cost based on damage', () => {
      const towerCost = TOWER_COSTS[TowerType.BASIC];
      const maxRepairCost = towerCost * 0.2; // Max 20% of tower value
      
      // No damage = no repair cost
      expect(tower.getRepairCost()).toBe(0);
      
      // Take 50% damage
      tower.takeDamage(tower.maxHealth * 0.5);
      const halfHealthRepairCost = tower.getRepairCost();
      expect(halfHealthRepairCost).toBeGreaterThan(0);
      expect(halfHealthRepairCost).toBeLessThanOrEqual(maxRepairCost);
      
      // Take more damage (total 90%)
      tower.takeDamage(tower.maxHealth * 0.4);
      const lowHealthRepairCost = tower.getRepairCost();
      expect(lowHealthRepairCost).toBeGreaterThan(halfHealthRepairCost);
      expect(lowHealthRepairCost).toBeLessThanOrEqual(maxRepairCost);
    });

    it('should cap repair cost at 20% of tower value', () => {
      const towerCost = TOWER_COSTS[TowerType.BASIC];
      const maxRepairCost = towerCost * 0.2;
      
      // Take 99% damage
      tower.takeDamage(tower.maxHealth * 0.99);
      const repairCost = tower.getRepairCost();
      
      // Should be close to 20% of tower value (99% damage * 20%)
      expect(repairCost).toBe(5); // floor(30 * 0.2 * 0.99) = floor(5.94) = 5
    });

    it('should repair tower to full health', () => {
      const maxHealth = tower.maxHealth;
      tower.takeDamage(50);
      
      expect(tower.canRepair()).toBe(true);
      const repaired = tower.repair();
      
      expect(repaired).toBe(true);
      expect(tower.health).toBe(maxHealth);
      expect(tower.getDamageTaken()).toBe(0);
    });

    it('should not repair if already at full health', () => {
      expect(tower.canRepair()).toBe(false);
      expect(tower.repair()).toBe(false);
    });

    it('should not repair if tower is destroyed', () => {
      tower.takeDamage(tower.maxHealth);
      expect(tower.isAlive).toBe(false);
      expect(tower.canRepair()).toBe(false);
      expect(tower.repair()).toBe(false);
    });
  });

  describe('Repair Cost Calculation', () => {
    it('should scale repair cost with upgrade level', () => {
      // Upgrade tower to increase its value
      tower.upgrade('DAMAGE');
      tower.upgrade('DAMAGE');
      tower.upgrade('RANGE');
      
      // Take damage
      tower.takeDamage(50);
      
      const upgradedRepairCost = tower.getRepairCost();
      
      // Create a new basic tower for comparison
      const basicTower = new Tower(TowerType.BASIC, towerPosition);
      basicTower.takeDamage(50);
      const basicRepairCost = basicTower.getRepairCost();
      
      // Upgraded tower should cost more to repair
      expect(upgradedRepairCost).toBeGreaterThan(basicRepairCost);
    });

    it('should calculate repair cost correctly for different tower types', () => {
      const towerTypes = [TowerType.BASIC, TowerType.SNIPER, TowerType.RAPID];
      const repairCosts: Record<string, number> = {};
      
      towerTypes.forEach(type => {
        const tower = new Tower(type, towerPosition);
        tower.takeDamage(tower.maxHealth * 0.5);
        repairCosts[type] = tower.getRepairCost();
      });
      
      // Different tower types should have different repair costs
      // based on their initial cost
      expect(repairCosts[TowerType.SNIPER]).toBeGreaterThan(repairCosts[TowerType.BASIC]);
      expect(repairCosts[TowerType.RAPID]).toBeGreaterThan(repairCosts[TowerType.BASIC]);
    });

    it('should not allow repairing walls', () => {
      const wall = new Tower(TowerType.WALL, towerPosition);
      wall.takeDamage(50);
      
      expect(wall.canRepair()).toBe(false);
      expect(wall.getRepairCost()).toBe(0);
      expect(wall.repair()).toBe(false);
    });
  });

  describe('Repair Integration', () => {
    it('should provide repair info for UI', () => {
      tower.takeDamage(40);
      
      const repairInfo = tower.getRepairInfo();
      expect(repairInfo).toEqual({
        canRepair: true,
        cost: tower.getRepairCost(),
        healthMissing: 40,
        healthPercentage: 0.6,
        isDestroyed: false
      });
    });

    it('should emit repair event when repaired', () => {
      let repairEventFired = false;
      let repairedTower: Tower | null = null;
      
      // Mock event listener
      const originalDispatch = tower.dispatchEvent;
      tower.dispatchEvent = (event: any) => {
        if (event.type === 'towerRepaired') {
          repairEventFired = true;
          repairedTower = event.detail.tower;
        }
        return originalDispatch?.call(tower, event) ?? true;
      };
      
      tower.takeDamage(50);
      tower.repair();
      
      expect(repairEventFired).toBe(true);
      expect(repairedTower).toBe(tower);
    });

    it('should calculate total value including upgrades', () => {
      const baseCost = TOWER_COSTS[TowerType.BASIC];
      
      // Upgrade tower
      for (let i = 0; i < 5; i++) {
        tower.upgrade('DAMAGE');
      }
      
      const totalValue = tower.getTotalValue();
      expect(totalValue).toBeGreaterThan(baseCost);
      
      // Repair cost should be based on total value
      tower.takeDamage(tower.maxHealth * 0.5);
      const repairCost = tower.getRepairCost();
      const maxRepairCost = totalValue * 0.2;
      
      expect(repairCost).toBeLessThanOrEqual(maxRepairCost);
    });
  });
});