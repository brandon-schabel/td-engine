import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceManager, ResourceType } from '../../src/systems/ResourceManager';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('initialization', () => {
    it('should initialize with default starting resources', () => {
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(0);
    });

    it('should initialize with custom starting resources', () => {
      const customManager = new ResourceManager({
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 5,
        [ResourceType.SCORE]: 1000
      });

      expect(customManager.getResource(ResourceType.CURRENCY)).toBe(50);
      expect(customManager.getResource(ResourceType.LIVES)).toBe(5);
      expect(customManager.getResource(ResourceType.SCORE)).toBe(1000);
    });
  });

  describe('resource operations', () => {
    it('should add resources correctly', () => {
      resourceManager.addResource(ResourceType.CURRENCY, 50);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(150);

      resourceManager.addResource(ResourceType.SCORE, 100);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
    });

    it('should spend resources when sufficient funds available', () => {
      const success = resourceManager.spendResource(ResourceType.CURRENCY, 30);
      
      expect(success).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
    });

    it('should not spend resources when insufficient funds', () => {
      const success = resourceManager.spendResource(ResourceType.CURRENCY, 150);
      
      expect(success).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100); // Unchanged
    });

    it('should not allow negative resources', () => {
      resourceManager.addResource(ResourceType.CURRENCY, -150);
      
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(0);
    });

    it('should set resources to specific values', () => {
      resourceManager.setResource(ResourceType.CURRENCY, 500);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(500);

      resourceManager.setResource(ResourceType.LIVES, 1);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(1);
    });
  });

  describe('resource checking', () => {
    it('should check if player can afford cost', () => {
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 50)).toBe(true);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 100)).toBe(true);
      expect(resourceManager.canAfford(ResourceType.CURRENCY, 101)).toBe(false);
    });

    it('should check multiple resource costs', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 1
      };

      expect(resourceManager.canAffordMultiple(costs)).toBe(true);

      const expensiveCosts = {
        [ResourceType.CURRENCY]: 150,
        [ResourceType.LIVES]: 1
      };

      expect(resourceManager.canAffordMultiple(expensiveCosts)).toBe(false);
    });

    it('should spend multiple resources atomically', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 2
      };

      const success = resourceManager.spendMultiple(costs);
      
      expect(success).toBe(true);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(50);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(8);
    });

    it('should not spend any resources if one is insufficient', () => {
      const costs = {
        [ResourceType.CURRENCY]: 50,
        [ResourceType.LIVES]: 15 // More than available
      };

      const success = resourceManager.spendMultiple(costs);
      
      expect(success).toBe(false);
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100); // Unchanged
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10); // Unchanged
    });
  });

  describe('game state checks', () => {
    it('should detect game over when lives reach zero', () => {
      expect(resourceManager.isGameOver()).toBe(false);
      
      resourceManager.setResource(ResourceType.LIVES, 0);
      expect(resourceManager.isGameOver()).toBe(true);
    });

    it('should lose life when enemy reaches end', () => {
      resourceManager.enemyReachedEnd();
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(9);
      
      resourceManager.enemyReachedEnd(3);
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(6);
    });

    it('should not go below zero lives', () => {
      resourceManager.setResource(ResourceType.LIVES, 1);
      resourceManager.enemyReachedEnd(5);
      
      expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
      expect(resourceManager.isGameOver()).toBe(true);
    });
  });

  describe('enemy rewards', () => {
    it('should give currency and score for killing enemies', () => {
      resourceManager.enemyKilled(25, 100); // 25 currency, 100 score
      
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(125);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
    });

    it('should handle multiple enemy kills', () => {
      resourceManager.enemyKilled(10, 50);
      resourceManager.enemyKilled(15, 75);
      
      expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(125);
      expect(resourceManager.getResource(ResourceType.SCORE)).toBe(125);
    });
  });

  describe('events', () => {
    it('should emit events when resources change', () => {
      const events: any[] = [];
      
      resourceManager.onResourceChange((type, oldValue, newValue) => {
        events.push({ type, oldValue, newValue });
      });

      resourceManager.addResource(ResourceType.CURRENCY, 50);
      resourceManager.spendResource(ResourceType.LIVES, 1);

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        type: ResourceType.CURRENCY,
        oldValue: 100,
        newValue: 150
      });
      expect(events[1]).toEqual({
        type: ResourceType.LIVES,
        oldValue: 10,
        newValue: 9
      });
    });
  });
});