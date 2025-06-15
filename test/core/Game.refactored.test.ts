import { describe, it, expect } from 'vitest';
import { Game } from '@/core/Game';
import { withTestContext, createGameWithState, GameStatePresets, TestScenarios } from '../helpers/setup';
import { assertGameResources, assertEntityCounts, assertTowerStats } from '../helpers/assertions';
import { when, then } from '../helpers/templates';
import { TestTowers, TestEnemies } from '../fixtures/testData';

describe('Game', () => {
  withTestContext();
  
  describe('initialization', () => {
    it('initializes with default state', () => {
      const game = createGameWithState('EMPTY');
      assertGameResources(game, GameStatePresets.EMPTY);
    });
    
    it('initializes with custom resources', () => {
      const game = createGameWithState('RICH');
      assertGameResources(game, GameStatePresets.RICH);
    });
  });
  
  describe('tower placement', () => {
    it(when('placing tower with sufficient funds'), () => {
      const game = createGameWithState('MID_GAME');
      
      const result = game.placeTower('BASIC', { x: 100, y: 100 });
      
      expect(result).toBe(true);
      assertGameResources(game, { currency: 480 }); // 500 - 20
      assertEntityCounts(game, { towers: 1 });
    });
    
    it(then('tower has correct stats'), () => {
      const game = createGameWithState('MID_GAME');
      game.placeTower('BASIC', { x: 100, y: 100 });
      
      assertTowerStats(game.getTowers()[0], TestTowers.basic);
    });
    
    it(when('placing tower without funds'), () => {
      const game = createGameWithState('NEAR_DEFEAT');
      
      const result = game.placeTower('SNIPER', { x: 100, y: 100 });
      
      expect(result).toBe(false);
      assertEntityCounts(game, { towers: 0 });
    });
  });
  
  describe('combat', () => {
    it(when('enemies reach goal'), () => {
      const game = TestScenarios.withCombat(3);
      const initialLives = game.getLives();
      
      // Simulate enemy reaching goal
      game.handleEnemyReachGoal(game.getEnemies()[0]);
      
      assertGameResources(game, { lives: initialLives - 1 });
      assertEntityCounts(game, { enemies: 2 });
    });
    
    it(when('tower defeats enemy'), () => {
      const game = TestScenarios.withTowers([
        { x: 100, y: 100, type: 'BASIC' }
      ]);
      const initialCurrency = game.getCurrency();
      
      // Add enemy and defeat it
      const enemy = game.spawnEnemy(TestEnemies.basic.type);
      game.handleEnemyDefeated(enemy);
      
      assertGameResources(game, { 
        currency: initialCurrency + TestEnemies.basic.reward 
      });
    });
  });
  
  describe('game states', () => {
    it(when('lives reach zero'), () => {
      const game = createGameWithState('NEAR_DEFEAT');
      
      game.handleEnemyReachGoal(game.spawnEnemy(TestEnemies.basic.type));
      
      expect(game.getState()).toBe('GAME_OVER');
    });
    
    it(when('all waves completed'), () => {
      const game = createGameWithState('LATE_GAME');
      game.completeAllWaves();
      
      expect(game.getState()).toBe('VICTORY');
    });
  });
  
  describe('resource drops', () => {
    it(when('enemy drops extra currency'), () => {
      const game = createGameWithState('MID_GAME');
      const initialCurrency = game.getCurrency();
      
      // Force a currency drop
      withRandomValues([0.05], () => {
        game.handleEnemyDefeated(game.spawnEnemy(TestEnemies.basic.type));
      });
      
      expect(game.getCurrency()).toBeGreaterThan(
        initialCurrency + TestEnemies.basic.reward
      );
    });
  });
});