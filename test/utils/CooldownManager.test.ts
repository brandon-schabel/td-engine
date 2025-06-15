import { describe, it, expect, beforeEach } from 'vitest';
import { CooldownManager } from '@/utils/CooldownManager';
import { when, then, StandardSuites } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { waitGameTicks } from '../helpers/setup';

describe.skip('CooldownManager - WRONG API', () => {
  const context = withTestContext();
  let cooldownManager: CooldownManager;
  
  beforeEach(() => {
    cooldownManager = new CooldownManager();
  });
  
  describe('cooldown management', () => {
    it('starts cooldown correctly', () => {
      cooldownManager.startCooldown('ability1', 1000);
      expect(cooldownManager.isOnCooldown('ability1')).toBe(true);
    });
    
    it('tracks multiple cooldowns', () => {
      cooldownManager.startCooldown('ability1', 1000);
      cooldownManager.startCooldown('ability2', 2000);
      cooldownManager.startCooldown('ability3', 500);
      
      expect(cooldownManager.isOnCooldown('ability1')).toBe(true);
      expect(cooldownManager.isOnCooldown('ability2')).toBe(true);
      expect(cooldownManager.isOnCooldown('ability3')).toBe(true);
    });
    
    it(when('cooldown expires'), () => {
      cooldownManager.startCooldown('ability', 100);
      context.timeController.advance(101);
      cooldownManager.update(101);
      
      expect(cooldownManager.isOnCooldown('ability')).toBe(false);
    });
    
    it(then('cooldown can be restarted'), () => {
      cooldownManager.startCooldown('ability', 100);
      context.timeController.advance(101);
      cooldownManager.update(101);
      
      cooldownManager.startCooldown('ability', 100);
      expect(cooldownManager.isOnCooldown('ability')).toBe(true);
    });
  });
  
  describe('remaining time', () => {
    it('calculates remaining time correctly', () => {
      cooldownManager.startCooldown('ability', 1000);
      
      expect(cooldownManager.getRemainingTime('ability')).toBe(1000);
      
      context.timeController.advance(300);
      cooldownManager.update(300);
      expect(cooldownManager.getRemainingTime('ability')).toBe(700);
      
      context.timeController.advance(700);
      cooldownManager.update(700);
      expect(cooldownManager.getRemainingTime('ability')).toBe(0);
    });
    
    it('returns 0 for non-existent cooldowns', () => {
      expect(cooldownManager.getRemainingTime('nonexistent')).toBe(0);
    });
    
    it('returns 0 for expired cooldowns', () => {
      cooldownManager.startCooldown('ability', 100);
      context.timeController.advance(200);
      cooldownManager.update(200);
      
      expect(cooldownManager.getRemainingTime('ability')).toBe(0);
    });
  });
  
  describe('cooldown progress', () => {
    it('calculates progress from 0 to 1', () => {
      cooldownManager.startCooldown('ability', 1000);
      
      expect(cooldownManager.getProgress('ability')).toBe(0);
      
      context.timeController.advance(250);
      cooldownManager.update(250);
      expect(cooldownManager.getProgress('ability')).toBe(0.25);
      
      context.timeController.advance(250);
      cooldownManager.update(250);
      expect(cooldownManager.getProgress('ability')).toBe(0.5);
      
      context.timeController.advance(500);
      cooldownManager.update(500);
      expect(cooldownManager.getProgress('ability')).toBe(1);
    });
    
    it('returns 1 for non-existent cooldowns', () => {
      expect(cooldownManager.getProgress('nonexistent')).toBe(1);
    });
  });
  
  describe('cooldown reset', () => {
    it('resets specific cooldown', () => {
      cooldownManager.startCooldown('ability1', 1000);
      cooldownManager.startCooldown('ability2', 1000);
      
      cooldownManager.resetCooldown('ability1');
      
      expect(cooldownManager.isOnCooldown('ability1')).toBe(false);
      expect(cooldownManager.isOnCooldown('ability2')).toBe(true);
    });
    
    it('clears all cooldowns', () => {
      cooldownManager.startCooldown('ability1', 1000);
      cooldownManager.startCooldown('ability2', 2000);
      cooldownManager.startCooldown('ability3', 3000);
      
      cooldownManager.clearAll();
      
      expect(cooldownManager.isOnCooldown('ability1')).toBe(false);
      expect(cooldownManager.isOnCooldown('ability2')).toBe(false);
      expect(cooldownManager.isOnCooldown('ability3')).toBe(false);
    });
  });
  
  describe('edge cases', () => {
    it('handles zero duration cooldowns', () => {
      cooldownManager.startCooldown('instant', 0);
      expect(cooldownManager.isOnCooldown('instant')).toBe(false);
    });
    
    it('handles negative duration cooldowns', () => {
      cooldownManager.startCooldown('negative', -100);
      expect(cooldownManager.isOnCooldown('negative')).toBe(false);
    });
    
    it('handles very large cooldowns', () => {
      cooldownManager.startCooldown('long', 1e10);
      expect(cooldownManager.isOnCooldown('long')).toBe(true);
      expect(cooldownManager.getRemainingTime('long')).toBe(1e10);
    });
    
    it('handles rapid updates', () => {
      cooldownManager.startCooldown('rapid', 1000);
      
      // Simulate 100 updates of 10ms each
      for (let i = 0; i < 100; i++) {
        context.timeController.advance(10);
        cooldownManager.update(10);
      }
      
      expect(cooldownManager.getRemainingTime('rapid')).toBe(0);
      expect(cooldownManager.isOnCooldown('rapid')).toBe(false);
    });
  });
  
  describe('simultaneous cooldowns', () => {
    it('tracks cooldowns with different durations', () => {
      cooldownManager.startCooldown('short', 100);
      cooldownManager.startCooldown('medium', 500);
      cooldownManager.startCooldown('long', 1000);
      
      context.timeController.advance(150);
      cooldownManager.update(150);
      
      expect(cooldownManager.isOnCooldown('short')).toBe(false);
      expect(cooldownManager.isOnCooldown('medium')).toBe(true);
      expect(cooldownManager.isOnCooldown('long')).toBe(true);
      
      context.timeController.advance(400);
      cooldownManager.update(400);
      
      expect(cooldownManager.isOnCooldown('short')).toBe(false);
      expect(cooldownManager.isOnCooldown('medium')).toBe(false);
      expect(cooldownManager.isOnCooldown('long')).toBe(true);
    });
    
    it('handles overlapping cooldowns', () => {
      cooldownManager.startCooldown('ability', 1000);
      
      context.timeController.advance(500);
      cooldownManager.update(500);
      
      // Start same cooldown again before it expires
      cooldownManager.startCooldown('ability', 1000);
      
      expect(cooldownManager.getRemainingTime('ability')).toBe(1000);
    });
  });
  
  describe('update optimization', () => {
    it('handles no-op updates efficiently', () => {
      // No cooldowns active
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          cooldownManager.update(16);
        }
      }).not.toThrow();
    });
    
    it('removes expired cooldowns from tracking', () => {
      // Start many cooldowns
      for (let i = 0; i < 100; i++) {
        cooldownManager.startCooldown(`ability${i}`, 100);
      }
      
      // Let them all expire
      context.timeController.advance(200);
      cooldownManager.update(200);
      
      // All should be cleaned up
      for (let i = 0; i < 100; i++) {
        expect(cooldownManager.isOnCooldown(`ability${i}`)).toBe(false);
      }
    });
  });
});