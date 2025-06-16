/**
 * Unit tests for CooldownManager
 * Tests cooldown timing utilities and base class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CooldownManager, CooldownEntity } from '@/utils/CooldownManager';
import { createMockCooldownEntity } from '../helpers/mockData';

// Concrete implementation of CooldownEntity for testing
class TestCooldownEntity extends CooldownEntity {
  readonly cooldownTime: number;
  
  constructor(cooldownTime: number) {
    super();
    this.cooldownTime = cooldownTime;
  }
}

describe('CooldownManager', () => {
  describe('updateCooldown', () => {
    it('should reduce cooldown by delta time', () => {
      const result = CooldownManager.updateCooldown(1000, 100);
      expect(result).toBe(900);
    });

    it('should not go below 0', () => {
      const result = CooldownManager.updateCooldown(100, 200);
      expect(result).toBe(0);
    });

    it('should handle 0 cooldown', () => {
      const result = CooldownManager.updateCooldown(0, 100);
      expect(result).toBe(0);
    });

    it('should handle negative delta time', () => {
      const result = CooldownManager.updateCooldown(500, -100);
      expect(result).toBe(600);
    });

    it('should handle fractional values', () => {
      const result = CooldownManager.updateCooldown(1000.5, 100.3);
      expect(result).toBeCloseTo(900.2, 5);
    });
  });

  describe('isReady', () => {
    it('should return true when cooldown is 0', () => {
      expect(CooldownManager.isReady(0)).toBe(true);
    });

    it('should return true when cooldown is negative', () => {
      expect(CooldownManager.isReady(-1)).toBe(true);
    });

    it('should return false when cooldown is positive', () => {
      expect(CooldownManager.isReady(0.1)).toBe(false);
      expect(CooldownManager.isReady(1000)).toBe(false);
    });
  });

  describe('startCooldown', () => {
    it('should return the cooldown time', () => {
      expect(CooldownManager.startCooldown(1000)).toBe(1000);
    });

    it('should handle 0 cooldown', () => {
      expect(CooldownManager.startCooldown(0)).toBe(0);
    });

    it('should not allow negative cooldown', () => {
      expect(CooldownManager.startCooldown(-100)).toBe(0);
    });

    it('should handle fractional cooldowns', () => {
      expect(CooldownManager.startCooldown(500.5)).toBe(500.5);
    });
  });

  describe('getCooldownPercentage', () => {
    it('should return correct percentage', () => {
      expect(CooldownManager.getCooldownPercentage(500, 1000)).toBe(0.5);
      expect(CooldownManager.getCooldownPercentage(250, 1000)).toBe(0.25);
      expect(CooldownManager.getCooldownPercentage(750, 1000)).toBe(0.75);
    });

    it('should return 0 when current is 0', () => {
      expect(CooldownManager.getCooldownPercentage(0, 1000)).toBe(0);
    });

    it('should return 1 when current equals max', () => {
      expect(CooldownManager.getCooldownPercentage(1000, 1000)).toBe(1);
    });

    it('should cap at 1 when current exceeds max', () => {
      expect(CooldownManager.getCooldownPercentage(1500, 1000)).toBe(1);
    });

    it('should return 0 when max is 0', () => {
      expect(CooldownManager.getCooldownPercentage(500, 0)).toBe(0);
    });

    it('should return 0 when max is negative', () => {
      expect(CooldownManager.getCooldownPercentage(500, -1000)).toBe(0);
    });

    it('should clamp negative current to 0', () => {
      expect(CooldownManager.getCooldownPercentage(-500, 1000)).toBe(0);
    });
  });

  describe('getCooldownSeconds', () => {
    it('should convert milliseconds to seconds', () => {
      expect(CooldownManager.getCooldownSeconds(1000)).toBe(1);
      expect(CooldownManager.getCooldownSeconds(2500)).toBe(2.5);
      expect(CooldownManager.getCooldownSeconds(500)).toBe(0.5);
    });

    it('should round to 1 decimal place', () => {
      expect(CooldownManager.getCooldownSeconds(1234)).toBe(1.2);
      expect(CooldownManager.getCooldownSeconds(1567)).toBe(1.6);
      expect(CooldownManager.getCooldownSeconds(999)).toBe(1);
    });

    it('should handle 0', () => {
      expect(CooldownManager.getCooldownSeconds(0)).toBe(0);
    });

    it('should not return negative values', () => {
      expect(CooldownManager.getCooldownSeconds(-1000)).toBe(0);
    });

    it('should handle very small values', () => {
      expect(CooldownManager.getCooldownSeconds(49)).toBe(0);
      expect(CooldownManager.getCooldownSeconds(50)).toBe(0.1);
    });
  });
});

describe('CooldownEntity', () => {
  let entity: TestCooldownEntity;

  beforeEach(() => {
    entity = new TestCooldownEntity(1000);
  });

  describe('canPerformAction', () => {
    it('should return true when cooldown is 0', () => {
      expect(entity.canPerformAction()).toBe(true);
    });

    it('should return false when cooldown is active', () => {
      entity.startCooldown();
      expect(entity.canPerformAction()).toBe(false);
    });

    it('should return true after cooldown expires', () => {
      entity.startCooldown();
      entity.updateCooldown(1000);
      expect(entity.canPerformAction()).toBe(true);
    });
  });

  describe('startCooldown', () => {
    it('should set current cooldown to cooldown time', () => {
      entity.startCooldown();
      expect(entity.currentCooldown).toBe(1000);
    });

    it('should prevent action after starting', () => {
      expect(entity.canPerformAction()).toBe(true);
      entity.startCooldown();
      expect(entity.canPerformAction()).toBe(false);
    });
  });

  describe('updateCooldown', () => {
    it('should reduce cooldown over time', () => {
      entity.startCooldown();
      entity.updateCooldown(100);
      expect(entity.currentCooldown).toBe(900);
      
      entity.updateCooldown(400);
      expect(entity.currentCooldown).toBe(500);
    });

    it('should not go below 0', () => {
      entity.startCooldown();
      entity.updateCooldown(2000);
      expect(entity.currentCooldown).toBe(0);
    });

    it('should handle multiple updates', () => {
      entity.startCooldown();
      
      for (let i = 0; i < 10; i++) {
        entity.updateCooldown(100);
      }
      
      expect(entity.currentCooldown).toBe(0);
      expect(entity.canPerformAction()).toBe(true);
    });
  });

  describe('getCooldownProgress', () => {
    it('should return 0 when ready', () => {
      expect(entity.getCooldownProgress()).toBe(0);
    });

    it('should return 1 when just started', () => {
      entity.startCooldown();
      expect(entity.getCooldownProgress()).toBe(1);
    });

    it('should return correct progress', () => {
      entity.startCooldown();
      entity.updateCooldown(250); // 25% complete
      expect(entity.getCooldownProgress()).toBe(0.75);
      
      entity.updateCooldown(250); // 50% complete
      expect(entity.getCooldownProgress()).toBe(0.5);
    });
  });

  describe('getCooldownDisplayTime', () => {
    it('should return remaining time in seconds', () => {
      entity.startCooldown();
      expect(entity.getCooldownDisplayTime()).toBe(1);
      
      entity.updateCooldown(500);
      expect(entity.getCooldownDisplayTime()).toBe(0.5);
    });

    it('should return 0 when ready', () => {
      expect(entity.getCooldownDisplayTime()).toBe(0);
    });
  });

  describe('different cooldown times', () => {
    it('should handle very short cooldowns', () => {
      const shortEntity = new TestCooldownEntity(100);
      shortEntity.startCooldown();
      expect(shortEntity.currentCooldown).toBe(100);
      
      shortEntity.updateCooldown(50);
      expect(shortEntity.getCooldownProgress()).toBe(0.5);
    });

    it('should handle very long cooldowns', () => {
      const longEntity = new TestCooldownEntity(60000); // 1 minute
      longEntity.startCooldown();
      expect(longEntity.getCooldownDisplayTime()).toBe(60);
      
      longEntity.updateCooldown(30000);
      expect(longEntity.getCooldownDisplayTime()).toBe(30);
    });

    it('should handle 0 cooldown time', () => {
      const instantEntity = new TestCooldownEntity(0);
      instantEntity.startCooldown();
      expect(instantEntity.canPerformAction()).toBe(true);
    });
  });
});