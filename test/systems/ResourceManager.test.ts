/**
 * Unit tests for ResourceManager
 * Tests resource tracking, spending, and callbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceManager, ResourceType } from '@/systems/ResourceManager';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;
  let consoleLogSpy: any;
  let consoleTraceSpy: any;

  beforeEach(() => {
    resourceManager = new ResourceManager();
    // Mock console methods for debug logging tests
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleTraceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleTraceSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(0);
    });

    it('should accept custom starting resources', () => {
      const customManager = new ResourceManager({
        [ResourceType.CURRENCY]: 500,
        [ResourceType.LIVES]: 20,
        [ResourceType.SCORE]: 1000,
      });

      expect(customManager.getResource(ResourceType.CURRENCY)).toBe(500);
      expect(customManager.getResource(ResourceType.LIVES)).toBe(20);
      expect(customManager.getResource(ResourceType.SCORE)).toBe(1000);
    });

    it('should handle partial custom resources', () => {
      const customManager = new ResourceManager({
        [ResourceType.CURRENCY]: 250,
      });

      expect(customManager.getResource(ResourceType.CURRENCY)).toBe(250);
      expect(customManager.getResource(ResourceType.LIVES)).toBe(10); // Default
      expect(customManager.getResource(ResourceType.SCORE)).toBe(0); // Default
    });
  });

  describe('getResource', () => {
    it('should return resource values', () => {
      resourceManager.setResource(ResourceType.CURRENCY, 42);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(42);
    });

    it('should return 0 for uninitialized resources', () => {
      const emptyManager = new ResourceManager({});
      // Clear the defaults for this test
      emptyManager.setResource(ResourceType.CURRENCY, 0);
      emptyManager.setResource(ResourceType.LIVES, 0);
      emptyManager.setResource(ResourceType.SCORE, 0);
      
      expect(emptyManager.getResource(ResourceType.SCORE)).toBe(0);
    });
  });

  describe('setResource', () => {
    it('should set resource values', () => {
      resourceManager.setResource(ResourceType.CURRENCY, 500);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(500);
    });

    it('should not allow negative values', () => {
      resourceManager.setResource(ResourceType.LIVES, -5);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });

    it('should trigger callbacks on change', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);

      resourceManager.setResource(ResourceType.CURRENCY, 200);

      expect(callback).toHaveBeenCalledWith(
        ResourceType.CURRENCY,
        100, // old value
        200  // new value
      );
    });

    it('should not trigger callbacks when value unchanged', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);

      resourceManager.setResource(ResourceType.CURRENCY, 100); // Same as default

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('addResource', () => {
    it('should add to existing resources', () => {
      resourceManager.addResource(ResourceType.CURRENCY, 50);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(150);
    });

    it('should handle negative additions', () => {
      resourceManager.addResource(ResourceType.CURRENCY, -30);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
    });

    it('should log currency gains', () => {
      resourceManager.addResource(ResourceType.CURRENCY, 25);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '💰 GAINING 25 currency. 100 -> 125'
      );
      expect(consoleTraceSpy).toHaveBeenCalled();
    });

    it('should not go below 0', () => {
      resourceManager.setResource(ResourceType.LIVES, 5);
      resourceManager.addResource(ResourceType.LIVES, -10);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });
  });

  describe('spendResource', () => {
    it('should spend resources when affordable', () => {
      const result = resourceManager.spendResource(ResourceType.CURRENCY, 30);
      
      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
    });

    it('should not spend when unaffordable', () => {
      const result = resourceManager.spendResource(ResourceType.CURRENCY, 150);
      
      expect(result).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
    });

    it('should log currency spending', () => {
      resourceManager.spendResource(ResourceType.CURRENCY, 20);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '💰 SPENDING 20 currency. 100 -> 80'
      );
      expect(consoleTraceSpy).toHaveBeenCalled();
    });

    it('should handle exact amount', () => {
      resourceManager.setResource(ResourceType.LIVES, 5);
      const result = resourceManager.spendResource(ResourceType.LIVES, 5);
      
      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });
  });

  describe('canAfford', () => {
    it('should check affordability', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 50)).toBe(true);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 100)).toBe(true);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 101)).toBe(false);
    });

    it('should handle 0 cost', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 0)).toBe(true);
    });
  });

  describe('canAffordMultiple and spendMultiple', () => {
    it('should check multiple resource costs', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 2,
      };

      expect(resourceManager.canAffordMultiple(costs)).toBe(true);
    });

    it('should fail if any resource is unaffordable', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 20, // Too expensive
      };

      expect(resourceManager.canAffordMultiple(costs)).toBe(false);
    });

    it('should spend multiple resources atomically', () => {
      const costs = {
        [ResourceType.CURRENCY]: 30,
        [ResourceType.LIVES]: 2,
      };

      const result = resourceManager.spendMultiple(costs);

      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(8);
    });

    it('should not spend any if unaffordable', () => {
      const costs = {
        [ResourceType.CURRENCY]: 30,
        [ResourceType.LIVES]: 20, // Too expensive
      };

      const result = resourceManager.spendMultiple(costs);

      expect(result).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100); // Unchanged
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10); // Unchanged
    });

    it('should handle empty costs', () => {
      expect(resourceManager.canAffordMultiple({})).toBe(true);
      expect(resourceManager.spendMultiple({})).toBe(true);
    });

    it('should skip undefined costs', () => {
      const costs = {
        [ResourceType.CURRENCY]: 30,
        [ResourceType.LIVES]: undefined,
      } as any;

      expect(resourceManager.spendMultiple(costs)).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
    });
  });

  describe('game state methods', () => {
    it('should check game over state', () => {
      expect(resourceManager.isGameOver()).toBe(false);

      resourceManager.setResource(ResourceType.LIVES, 0);
      expect(resourceManager.isGameOver()).toBe(true);

      resourceManager.setResource(ResourceType.LIVES, -5);
      expect(resourceManager.isGameOver()).toBe(true);
    });

    it('should handle enemy reaching end', () => {
      resourceManager.enemyReachedEnd(3);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(7);
    });

    it('should not go negative on enemy reach', () => {
      resourceManager.setResource(ResourceType.LIVES, 2);
      resourceManager.enemyReachedEnd(5);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });

    it('should handle enemy killed rewards', () => {
      resourceManager.enemyKilled(25, 100);

      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(125);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
    });
  });

  describe('callbacks', () => {
    it('should register and call callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      resourceManager.onResourceChange(callback1);
      resourceManager.onResourceChange(callback2);

      resourceManager.setResource(ResourceType.SCORE, 500);

      expect(callback1).toHaveBeenCalledWith(ResourceType.SCORE, 0, 500);
      expect(callback2).toHaveBeenCalledWith(ResourceType.SCORE, 0, 500);
    });

    it('should unregister callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = resourceManager.onResourceChange(callback);

      unsubscribe();
      resourceManager.setResource(ResourceType.SCORE, 500);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callbacks for all resource types', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);

      resourceManager.setResource(ResourceType.CURRENCY, 200);
      resourceManager.setResource(ResourceType.LIVES, 5);
      resourceManager.setResource(ResourceType.SCORE, 1000);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, ResourceType.CURRENCY, 100, 200);
      expect(callback).toHaveBeenNthCalledWith(2, ResourceType.LIVES, 10, 5);
      expect(callback).toHaveBeenNthCalledWith(3, ResourceType.SCORE, 0, 1000);
    });
  });

  describe('utility methods', () => {
    it('should provide currency shortcuts', () => {
      expect(resourceManager.getCurrency()).toBe(100);

      resourceManager.addCurrency(50);
      expect(resourceManager.getCurrency()).toBe(150);

      const spent = resourceManager.spendCurrency(30);
      expect(spent).toBe(true);
      expect(resourceManager.getCurrency()).toBe(120);
    });

    it('should provide lives shortcuts', () => {
      expect(resourceManager.getLives()).toBe(10);
      
      resourceManager.setResource(ResourceType.LIVES, 5);
      expect(resourceManager.getLives()).toBe(5);
    });

    it('should provide score shortcuts', () => {
      expect(resourceManager.getScore()).toBe(0);

      resourceManager.addScore(500);
      expect(resourceManager.getScore()).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      resourceManager.setResource(ResourceType.SCORE, Number.MAX_SAFE_INTEGER);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle rapid resource changes', () => {
      for (let i = 0; i < 100; i++) {
        resourceManager.addResource(ResourceType.SCORE, 1);
      }
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
    });

    it('should maintain consistency with concurrent operations', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);

      // Simulate concurrent-like operations
      resourceManager.addCurrency(50);
      resourceManager.spendCurrency(30);
      resourceManager.addCurrency(20);

      expect(resourceManager.getCurrency()).toBe(140);
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });
});