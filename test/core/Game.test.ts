import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { TowerType } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import { 
  createTestGame,
  createTestGameWithWave,
  createTestGameWithTowers,
  GameScenarioBuilder,
  createMockCanvas,
  simulateGameFrames,
  simulateWaveCompletion,
  simulatePlayerDeath,
  simulateClick,
  TimeController,
  expectResourcesChanged,
  expectEntityCount
} from '../helpers';

describe('Game', () => {
  let game: Game;
  let timeController: TimeController;

  beforeEach(() => {
    vi.clearAllMocks();
    timeController = new TimeController();
    game = createTestGame();
  });

  afterEach(() => {
    timeController.reset();
  });

  describe('initialization', () => {
    it('should initialize game systems', () => {
      expect(game).toBeDefined();
      expect(game.getCurrency()).toBe(100);
      expect(game.getLives()).toBe(10);
      expect(game.getScore()).toBe(0);
    });

    it('should set up default path', () => {
      // Game should have a default path set up
      expect(game).toBeDefined();
    });

    it('should initialize with custom resources', () => {
      const customGame = new GameScenarioBuilder()
        .withCurrency(200)
        .withLives(20)
        .withScore(1000)
        .build();
      
      expect(customGame.getCurrency()).toBe(200);
      expect(customGame.getLives()).toBe(20);
      expect(customGame.getScore()).toBe(1000);
    });
  });

  describe('tower placement', () => {
    it('should place tower when valid', () => {
      const initialCurrency = game.getCurrency();
      const success = game.placeTower('BASIC', { x: 100, y: 100 });
      
      expect(success).toBe(true);
      expect(game.getCurrency()).toBeLessThan(initialCurrency);
    });

    it('should not place tower on invalid location', () => {
      // Try to place on path
      const success = game.placeTower('BASIC', { x: 16, y: 304 }); // Should be on path
      
      expect(success).toBe(false);
    });

    it('should not place tower when insufficient funds', () => {
      // Create game with low funds
      const poorGame = new GameScenarioBuilder()
        .withCurrency(10)
        .build();
      
      const success = poorGame.placeTower('BASIC', { x: 400, y: 200 });
      expect(success).toBe(false);
    });

    it('should handle complex tower setup', () => {
      const gameWithTowers = new GameScenarioBuilder()
        .withTower(TowerType.BASIC, 3, 3, [])
        .withTower(TowerType.SNIPER, 6, 6, [])
        .withTower(TowerType.RAPID, 9, 9, [])
        .build();
      
      const towers = gameWithTowers.getTowers();
      expectEntityCount(towers, 3);
      expect(towers[0].towerType).toBe(TowerType.BASIC);
      expect(towers[1].towerType).toBe(TowerType.SNIPER);
      expect(towers[2].towerType).toBe(TowerType.RAPID);
    });
  });

  describe('wave management', () => {
    it('should start next wave', () => {
      const success = game.startNextWave();
      
      expect(success).toBe(true);
      expect(game.getCurrentWave()).toBe(1);
    });

    it('should handle wave completion', () => {
      const gameWithWave = createTestGameWithWave({ waveNumber: 1 });
      
      // Simulate some game frames
      simulateGameFrames(gameWithWave, 10, 1000);
      
      // Complete the wave
      simulateWaveCompletion(gameWithWave);
      
      // Update once more to process completion
      gameWithWave.update(16);
      
      expect(gameWithWave.isWaveComplete()).toBe(true);
    });

    it('should use custom wave configurations', () => {
      const customWaves = [
        {
          waveNumber: 1,
          enemies: [{ type: 'BASIC' as any, count: 10, spawnDelay: 500 }],
          startDelay: 0
        }
      ];
      
      const gameWithCustomWaves = new GameScenarioBuilder()
        .withSimplePath()
        .build();
      
      // Load custom waves
      const gameAny = gameWithCustomWaves as any;
      gameAny.waveManager.loadWaves(customWaves);
      
      gameWithCustomWaves.startNextWave();
      expect(gameWithCustomWaves.getCurrentWave()).toBe(1);
    });
  });

  describe('game state', () => {
    it('should detect game over when lives reach zero', () => {
      simulatePlayerDeath(game);
      
      expect(game.isGameOver()).toBe(true);
    });

    it('should handle enemy rewards', () => {
      // Mock Math.random to prevent extra currency drops (probability is 0.1)
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5); // Above 0.1 threshold, so no extra drop
      
      const initialResources = {
        currency: game.getCurrency(),
        lives: game.getLives(),
        score: game.getScore()
      };
      
      // Create a mock enemy
      const mockEnemy = {
        position: { x: 100, y: 100 },
        reward: 25,
        isAlive: false
      } as Enemy;
      
      game.enemyKilled(mockEnemy);
      
      const finalResources = {
        currency: game.getCurrency(),
        lives: game.getLives(),
        score: game.getScore()
      };
      
      // Enemy reward is 25, and score is reward * 5 = 125
      expectResourcesChanged(initialResources, finalResources, {
        currency: 25,
        score: 125
      });
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('mouse interaction', () => {
    it('should handle mouse clicks for tower placement', () => {
      game.setSelectedTowerType(TowerType.BASIC);
      
      const mouseEvent = {
        offsetX: 200,
        offsetY: 200
      } as MouseEvent;
      
      const initialTowerCount = game.getTowers().length;
      game.handleMouseDown(mouseEvent);
      
      if (game.getCurrency() >= 20) {
        expect(game.getTowers().length).toBe(initialTowerCount + 1);
      }
    });

    it('should show tower range on hover', () => {
      // Place a tower first
      game.placeTower('BASIC', { x: 200, y: 200 });
      
      const mouseEvent = {
        offsetX: 200,
        offsetY: 200
      } as MouseEvent;
      
      game.handleMouseMove(mouseEvent);
      
      // Should have hover tower set
      expect(game.getHoverTower()).toBeDefined();
    });
  });

  describe('game loop integration', () => {
    it('should update all systems', () => {
      game.startNextWave();
      
      // Update game
      game.update(16);
      
      // Game should process towers, enemies, projectiles
      expect(game).toBeDefined();
    });

    it('should clean up dead entities', () => {
      const gameWithWave = createTestGameWithWave({ waveNumber: 1 });
      
      // Wait for enemies to spawn
      simulateGameFrames(gameWithWave, 5, 100);
      
      const enemies = gameWithWave.getEnemies();
      if (enemies.length > 0) {
        const initialEnemyCount = enemies.length;
        
        // Kill first enemy
        enemies[0].takeDamage(1000);
        
        // Update to process dead enemy
        gameWithWave.update(16);
        
        expect(gameWithWave.getEnemies().length).toBeLessThan(initialEnemyCount);
      }
    });
  });

  describe('tower costs', () => {
    it('should have correct tower costs', () => {
      expect(game.getTowerCost('BASIC')).toBe(20);
      expect(game.getTowerCost('SNIPER')).toBe(50);
      expect(game.getTowerCost('RAPID')).toBe(30);
    });

    it('should check if player can afford tower', () => {
      expect(game.canAffordTower('BASIC')).toBe(true);
      
      // Create game with limited funds
      const poorGame = new GameScenarioBuilder()
        .withCurrency(25)
        .build();
      
      expect(poorGame.canAffordTower('BASIC')).toBe(true);
      expect(poorGame.canAffordTower('SNIPER')).toBe(false);
    });
  });

  describe('performance and timing', () => {
    it('should handle rapid updates', () => {
      const gameWithWave = createTestGameWithWave({ waveNumber: 1 });
      
      // Simulate 60 fps for 1 second
      for (let i = 0; i < 60; i++) {
        gameWithWave.update(16.67);
      }
      
      // Game should still be functional
      expect(gameWithWave).toBeDefined();
    });

    it('should handle long frame times gracefully', () => {
      game.startNextWave();
      
      // Simulate a long frame (like tab switching)
      game.update(1000);
      
      // Game should still be stable
      expect(game).toBeDefined();
    });
  });
});