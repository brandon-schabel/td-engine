import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ResourceManager, ResourceType } from '@/systems/ResourceManager';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('constructor', () => {
    test('initializes with default values', () => {
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(0);
    });

    test('accepts custom starting resources', () => {
      const custom = new ResourceManager({
        [ResourceType.CURRENCY]: 200,
        [ResourceType.LIVES]: 5,
        [ResourceType.SCORE]: 1000
      });
      
      expect(custom.getResource(ResourceType.CURRENCY)).toBe(200);
      expect(custom.getResource(ResourceType.LIVES)).toBe(5);
      expect(custom.getResource(ResourceType.SCORE)).toBe(1000);
    });

    test('partially overrides defaults', () => {
      const custom = new ResourceManager({
        [ResourceType.CURRENCY]: 50
      });
      
      expect(custom.getResource(ResourceType.CURRENCY)).toBe(50);
      expect(custom.getResource(ResourceType.LIVES)).toBe(10); // Default
      expect(custom.getResource(ResourceType.SCORE)).toBe(0); // Default
    });
  });

  describe('getResource and setResource', () => {
    test('gets and sets resources correctly', () => {
      resourceManager.setResource(ResourceType.CURRENCY, 500);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(500);
    });

    test('prevents negative values', () => {
      resourceManager.setResource(ResourceType.LIVES, -10);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });

    test('returns 0 for non-existent resource types', () => {
      expect(resourceManager.getResource('UNKNOWN' as ResourceType)).toBe(0);
    });
  });

  describe('addResource', () => {
    test('adds positive amounts', () => {
      resourceManager.addResource(ResourceType.CURRENCY, 50);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(150);
    });

    test('handles negative amounts (subtraction)', () => {
      resourceManager.addResource(ResourceType.CURRENCY, -30);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
    });

    test('does not go below zero', () => {
      resourceManager.setResource(ResourceType.LIVES, 5);
      resourceManager.addResource(ResourceType.LIVES, -10);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });
  });

  describe('spendResource', () => {
    test('spends resources when affordable', () => {
      const result = resourceManager.spendResource(ResourceType.CURRENCY, 50);
      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(50);
    });

    test('fails when not affordable', () => {
      const result = resourceManager.spendResource(ResourceType.CURRENCY, 150);
      expect(result).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100); // Unchanged
    });

    test('can spend exact amount', () => {
      const result = resourceManager.spendResource(ResourceType.CURRENCY, 100);
      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(0);
    });
  });

  describe('canAfford', () => {
    test('returns true when affordable', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 50)).toBe(true);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 100)).toBe(true);
    });

    test('returns false when not affordable', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 101)).toBe(false);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 200)).toBe(false);
    });

    test('returns true for zero cost', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 0)).toBe(true);
    });
  });

  describe('canAffordMultiple and spendMultiple', () => {
    test('checks multiple resource costs', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 2
      };
      
      expect(resourceManager.canAffordMultiple(costs)).toBe(true);
    });

    test('fails if any resource is insufficient', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 20 // Not enough
      };
      
      expect(resourceManager.canAffordMultiple(costs)).toBe(false);
    });

    test('spends multiple resources atomically', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 2
      };
      
      const result = resourceManager.spendMultiple(costs);
      expect(result).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(50);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(8);
    });

    test('does not spend if any resource is insufficient', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 20
      };
      
      const result = resourceManager.spendMultiple(costs);
      expect(result).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100); // Unchanged
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10); // Unchanged
    });

    test('handles empty cost object', () => {
      expect(resourceManager.canAffordMultiple({})).toBe(true);
      expect(resourceManager.spendMultiple({})).toBe(true);
    });
  });

  describe('game-specific methods', () => {
    test('isGameOver checks lives', () => {
      expect(resourceManager.isGameOver()).toBe(false);
      
      resourceManager.setResource(ResourceType.LIVES, 0);
      expect(resourceManager.isGameOver()).toBe(true);
    });

    test('enemyReachedEnd reduces lives', () => {
      resourceManager.enemyReachedEnd(1);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(9);
      
      resourceManager.enemyReachedEnd(3);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(6);
    });

    test('enemyReachedEnd caps at zero lives', () => {
      resourceManager.setResource(ResourceType.LIVES, 2);
      resourceManager.enemyReachedEnd(5);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
    });

    test('enemyKilled adds rewards', () => {
      resourceManager.enemyKilled(10, 5);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(110);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(5);
    });
  });

  describe('utility methods', () => {
    test('getCurrency returns currency', () => {
      expect(resourceManager.getCurrency()).toBe(100);
    });

    test('getLives returns lives', () => {
      expect(resourceManager.getLives()).toBe(10);
    });

    test('getScore returns score', () => {
      expect(resourceManager.getScore()).toBe(0);
    });

    test('addCurrency adds currency', () => {
      resourceManager.addCurrency(50);
      expect(resourceManager.getCurrency()).toBe(150);
    });

    test('spendCurrency spends currency', () => {
      const result = resourceManager.spendCurrency(30);
      expect(result).toBe(true);
      expect(resourceManager.getCurrency()).toBe(70);
    });

    test('addScore adds score', () => {
      resourceManager.addScore(100);
      expect(resourceManager.getScore()).toBe(100);
    });
  });

  describe('change notifications', () => {
    test('notifies on resource change', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);
      
      resourceManager.setResource(ResourceType.CURRENCY, 200);
      
      expect(callback).toHaveBeenCalledWith(
        ResourceType.CURRENCY,
        100, // old value
        200  // new value
      );
    });

    test('does not notify if value unchanged', () => {
      const callback = vi.fn();
      resourceManager.onResourceChange(callback);
      
      resourceManager.setResource(ResourceType.CURRENCY, 100); // Same as current
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('notifies multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      resourceManager.onResourceChange(callback1);
      resourceManager.onResourceChange(callback2);
      
      resourceManager.addResource(ResourceType.SCORE, 50);
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('unsubscribe removes callback', () => {
      const callback = vi.fn();
      const unsubscribe = resourceManager.onResourceChange(callback);
      
      unsubscribe();
      resourceManager.setResource(ResourceType.CURRENCY, 200);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    test('tower purchase scenario', () => {
      // Check if can afford tower
      const towerCost = 50;
      expect(resourceManager.canAfford(ResourceType.CURRENCY, towerCost)).toBe(true);
      
      // Purchase tower
      const purchased = resourceManager.spendCurrency(towerCost);
      expect(purchased).toBe(true);
      expect(resourceManager.getCurrency()).toBe(50);
      
      // Try to purchase another
      expect(resourceManager.canAfford(ResourceType.CURRENCY, towerCost)).toBe(true);
      resourceManager.spendCurrency(towerCost);
      expect(resourceManager.getCurrency()).toBe(0);
      
      // Cannot afford third tower
      expect(resourceManager.canAfford(ResourceType.CURRENCY, towerCost)).toBe(false);
    });

    test('wave completion scenario', () => {
      const initialScore = resourceManager.getScore();
      const initialCurrency = resourceManager.getCurrency();
      
      // Kill 5 enemies
      for (let i = 0; i < 5; i++) {
        resourceManager.enemyKilled(10, 5);
      }
      
      expect(resourceManager.getCurrency()).toBe(initialCurrency + 50);
      expect(resourceManager.getScore()).toBe(initialScore + 25);
    });

    test('game over scenario', () => {
      expect(resourceManager.isGameOver()).toBe(false);
      
      // Enemies reach end
      for (let i = 0; i < 10; i++) {
        resourceManager.enemyReachedEnd(1);
      }
      
      expect(resourceManager.getLives()).toBe(0);
      expect(resourceManager.isGameOver()).toBe(true);
    });
  });
});