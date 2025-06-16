import { describe, test, expect, beforeEach } from 'vitest';
import { CooldownManager, CooldownEntity } from '@/utils/CooldownManager';

// Concrete implementation for testing
class TestCooldownEntity extends CooldownEntity {
  readonly cooldownTime: number = 1000; // 1 second cooldown
}

describe('CooldownManager', () => {
  describe('updateCooldown', () => {
    test('reduces cooldown by deltaTime', () => {
      const result = CooldownManager.updateCooldown(1000, 100);
      expect(result).toBe(900);
    });

    test('never goes below zero', () => {
      const result = CooldownManager.updateCooldown(100, 200);
      expect(result).toBe(0);
    });

    test('handles zero cooldown', () => {
      const result = CooldownManager.updateCooldown(0, 100);
      expect(result).toBe(0);
    });

    test('handles negative input gracefully', () => {
      const result = CooldownManager.updateCooldown(-100, 50);
      expect(result).toBe(0);
    });

    test('handles zero deltaTime', () => {
      const result = CooldownManager.updateCooldown(500, 0);
      expect(result).toBe(500);
    });
  });

  describe('isReady', () => {
    test('returns true when cooldown is zero', () => {
      expect(CooldownManager.isReady(0)).toBe(true);
    });

    test('returns true when cooldown is negative', () => {
      expect(CooldownManager.isReady(-100)).toBe(true);
    });

    test('returns false when cooldown is positive', () => {
      expect(CooldownManager.isReady(100)).toBe(false);
      expect(CooldownManager.isReady(0.001)).toBe(false);
    });
  });

  describe('startCooldown', () => {
    test('returns the provided cooldown time', () => {
      expect(CooldownManager.startCooldown(1000)).toBe(1000);
    });

    test('returns zero for negative input', () => {
      expect(CooldownManager.startCooldown(-500)).toBe(0);
    });

    test('returns zero for zero input', () => {
      expect(CooldownManager.startCooldown(0)).toBe(0);
    });
  });

  describe('getCooldownPercentage', () => {
    test('returns correct percentage', () => {
      expect(CooldownManager.getCooldownPercentage(500, 1000)).toBe(0.5);
      expect(CooldownManager.getCooldownPercentage(250, 1000)).toBe(0.25);
      expect(CooldownManager.getCooldownPercentage(750, 1000)).toBe(0.75);
    });

    test('returns 0 when cooldown is complete', () => {
      expect(CooldownManager.getCooldownPercentage(0, 1000)).toBe(0);
    });

    test('returns 1 when cooldown is at maximum', () => {
      expect(CooldownManager.getCooldownPercentage(1000, 1000)).toBe(1);
    });

    test('clamps values above 1', () => {
      expect(CooldownManager.getCooldownPercentage(1500, 1000)).toBe(1);
    });

    test('returns 0 for zero max cooldown', () => {
      expect(CooldownManager.getCooldownPercentage(500, 0)).toBe(0);
    });

    test('returns 0 for negative max cooldown', () => {
      expect(CooldownManager.getCooldownPercentage(500, -1000)).toBe(0);
    });

    test('handles negative current cooldown', () => {
      expect(CooldownManager.getCooldownPercentage(-500, 1000)).toBe(0);
    });
  });

  describe('getCooldownSeconds', () => {
    test('converts milliseconds to seconds', () => {
      expect(CooldownManager.getCooldownSeconds(1000)).toBe(1.0);
      expect(CooldownManager.getCooldownSeconds(1500)).toBe(1.5);
      expect(CooldownManager.getCooldownSeconds(2250)).toBe(2.3);
    });

    test('rounds to one decimal place', () => {
      expect(CooldownManager.getCooldownSeconds(1234)).toBe(1.2);
      expect(CooldownManager.getCooldownSeconds(1567)).toBe(1.6);
      expect(CooldownManager.getCooldownSeconds(999)).toBe(1.0);
    });

    test('returns 0 for zero cooldown', () => {
      expect(CooldownManager.getCooldownSeconds(0)).toBe(0);
    });

    test('returns 0 for negative cooldown', () => {
      expect(CooldownManager.getCooldownSeconds(-1000)).toBe(0);
    });

    test('handles small values', () => {
      expect(CooldownManager.getCooldownSeconds(50)).toBe(0.1);
      expect(CooldownManager.getCooldownSeconds(49)).toBe(0);
    });
  });
});

describe('CooldownEntity', () => {
  let entity: TestCooldownEntity;

  beforeEach(() => {
    entity = new TestCooldownEntity();
  });

  describe('canPerformAction', () => {
    test('returns true when cooldown is ready', () => {
      entity.currentCooldown = 0;
      expect(entity.canPerformAction()).toBe(true);
    });

    test('returns false when cooldown is active', () => {
      entity.currentCooldown = 500;
      expect(entity.canPerformAction()).toBe(false);
    });
  });

  describe('startCooldown', () => {
    test('sets cooldown to cooldownTime', () => {
      entity.startCooldown();
      expect(entity.currentCooldown).toBe(1000);
    });
  });

  describe('updateCooldown', () => {
    test('reduces cooldown by deltaTime', () => {
      entity.currentCooldown = 1000;
      entity.updateCooldown(100);
      expect(entity.currentCooldown).toBe(900);
    });

    test('cooldown cannot go below zero', () => {
      entity.currentCooldown = 50;
      entity.updateCooldown(100);
      expect(entity.currentCooldown).toBe(0);
    });
  });

  describe('getCooldownProgress', () => {
    test('returns correct progress percentage', () => {
      entity.currentCooldown = 500;
      expect(entity.getCooldownProgress()).toBe(0.5);
    });

    test('returns 0 when ready', () => {
      entity.currentCooldown = 0;
      expect(entity.getCooldownProgress()).toBe(0);
    });

    test('returns 1 when just started', () => {
      entity.startCooldown();
      expect(entity.getCooldownProgress()).toBe(1);
    });
  });

  describe('getCooldownDisplayTime', () => {
    test('returns time in seconds', () => {
      entity.currentCooldown = 1500;
      expect(entity.getCooldownDisplayTime()).toBe(1.5);
    });

    test('returns 0 when ready', () => {
      entity.currentCooldown = 0;
      expect(entity.getCooldownDisplayTime()).toBe(0);
    });
  });

  describe('integration test', () => {
    test('full cooldown cycle', () => {
      // Initially ready
      expect(entity.canPerformAction()).toBe(true);
      
      // Start cooldown
      entity.startCooldown();
      expect(entity.canPerformAction()).toBe(false);
      expect(entity.getCooldownProgress()).toBe(1);
      
      // Update halfway
      entity.updateCooldown(500);
      expect(entity.canPerformAction()).toBe(false);
      expect(entity.getCooldownProgress()).toBe(0.5);
      expect(entity.getCooldownDisplayTime()).toBe(0.5);
      
      // Complete cooldown
      entity.updateCooldown(500);
      expect(entity.canPerformAction()).toBe(true);
      expect(entity.getCooldownProgress()).toBe(0);
      expect(entity.getCooldownDisplayTime()).toBe(0);
    });
  });
});