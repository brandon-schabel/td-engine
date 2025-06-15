import { describe, it, expect } from 'vitest';
import { ResourceManager, ResourceType } from '@/systems/ResourceManager';
import { describeSystem, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';

describe.skip('ResourceManager',
  () => new ResourceManager(),
  (getResourceManager, context) => {

    describe('initialization', () => {
      it('starts with default resources', () => {
        const resourceManager = getResourceManager();
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10);
        expect(resourceManager.getResource(ResourceType.SCORE)).toBe(0);
      });

      it('accepts custom starting resources', () => {
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
      it(when('adding resources'), () => {
        const resourceManager = getResourceManager();
        resourceManager.addResource(ResourceType.CURRENCY, 50);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(150);

        resourceManager.addResource(ResourceType.SCORE, 100);
        expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
      });

      it(when('spending with sufficient funds'), () => {
        const resourceManager = getResourceManager();
        const success = resourceManager.spendResource(ResourceType.CURRENCY, 30);
        
        expect(success).toBe(true);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(70);
      });

      it(then('fails with insufficient funds'), () => {
        const resourceManager = getResourceManager();
        const success = resourceManager.spendResource(ResourceType.CURRENCY, 150);
        
        expect(success).toBe(false);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
      });

      it(then('prevents negative resources'), () => {
        const resourceManager = getResourceManager();
        resourceManager.addResource(ResourceType.CURRENCY, -150);
        
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(0);
      });

      it('sets resources directly', () => {
        const resourceManager = getResourceManager();
        resourceManager.setResource(ResourceType.CURRENCY, 500);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(500);

        resourceManager.setResource(ResourceType.LIVES, 1);
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(1);
      });
    });

    describe('resource checking', () => {
      it(when('checking affordability'), () => {
        const resourceManager = getResourceManager();
        expect(resourceManager.canAfford(ResourceType.CURRENCY, 50)).toBe(true);
        expect(resourceManager.canAfford(ResourceType.CURRENCY, 100)).toBe(true);
        expect(resourceManager.canAfford(ResourceType.CURRENCY, 101)).toBe(false);
      });

      it('checks multiple resources', () => {
        const resourceManager = getResourceManager();
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

      it(when('spending multiple resources'), () => {
        const resourceManager = getResourceManager();
        const costs = {
          [ResourceType.CURRENCY]: 50,
          [ResourceType.LIVES]: 2
        };

        const success = resourceManager.spendMultiple(costs);
        
        expect(success).toBe(true);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(50);
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(8);
      });

      it(then('atomically fails if any insufficient'), () => {
        const resourceManager = getResourceManager();
        const costs = {
          [ResourceType.CURRENCY]: 50,
          [ResourceType.LIVES]: 15 // More than available
        };

        const success = resourceManager.spendMultiple(costs);
        
        expect(success).toBe(false);
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(100);
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(10);
      });
    });

    describe('game state checks', () => {
      it(when('lives reach zero'), () => {
        const resourceManager = getResourceManager();
        expect(resourceManager.isGameOver()).toBe(false);
        
        resourceManager.setResource(ResourceType.LIVES, 0);
        expect(resourceManager.isGameOver()).toBe(true);
      });

      it(when('enemy reaches end'), () => {
        const resourceManager = getResourceManager();
        resourceManager.enemyReachedEnd();
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(9);
        
        resourceManager.enemyReachedEnd(3);
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(6);
      });

      it(then('clamps lives at zero'), () => {
        const resourceManager = getResourceManager();
        resourceManager.setResource(ResourceType.LIVES, 1);
        resourceManager.enemyReachedEnd(5);
        
        expect(resourceManager.getResource(ResourceType.LIVES)).toBe(0);
        expect(resourceManager.isGameOver()).toBe(true);
      });
    });

    describe('enemy rewards', () => {
      it(when('enemy killed'), () => {
        const resourceManager = getResourceManager();
        resourceManager.enemyKilled(25, 100); // 25 currency, 100 score
        
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(125);
        expect(resourceManager.getResource(ResourceType.SCORE)).toBe(100);
      });

      it('accumulates multiple kills', () => {
        const resourceManager = getResourceManager();
        resourceManager.enemyKilled(10, 50);
        resourceManager.enemyKilled(15, 75);
        
        expect(resourceManager.getResource(ResourceType.CURRENCY)).toBe(125);
        expect(resourceManager.getResource(ResourceType.SCORE)).toBe(125);
      });
    });

    describe('events', () => {
      it(when('resources change'), () => {
        const resourceManager = getResourceManager();
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
  }
);