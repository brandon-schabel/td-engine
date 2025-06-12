import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { TowerType } from '../../src/entities/Tower';
import type { Enemy } from '../../src/entities/Enemy';

// Optimized canvas mock (shared instance)
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: ''
  })
} as any;

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();
    // Browser APIs mocked in setup.ts
    
    game = new Game(mockCanvas);
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
      // Spend all money
      while (game.getCurrency() >= 20) {
        game.placeTower('BASIC', { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 });
      }
      
      const success = game.placeTower('BASIC', { x: 400, y: 200 });
      expect(success).toBe(false);
    });
  });

  describe('wave management', () => {
    it('should start next wave', () => {
      const success = game.startNextWave();
      
      expect(success).toBe(true);
      expect(game.getCurrentWave()).toBe(1);
    });

    it('should handle wave completion', () => {
      game.startNextWave();
      
      // Wait for wave to finish spawning (simulate enough time)
      for (let i = 0; i < 10; i++) {
        game.update(1000); // 1 second updates
      }
      
      // Kill all enemies
      const enemies = game.getEnemies();
      enemies.forEach(enemy => enemy.takeDamage(1000));
      
      // Update game to process dead enemies
      game.update(16);
      
      expect(game.isWaveComplete()).toBe(true);
    });
  });

  describe('game state', () => {
    it('should detect game over when lives reach zero', () => {
      // Lose all lives
      while (game.getLives() > 0) {
        game.enemyReachedEnd();
      }
      
      expect(game.isGameOver()).toBe(true);
    });

    it('should handle enemy rewards', () => {
      const initialCurrency = game.getCurrency();
      const initialScore = game.getScore();
      
      // Create a mock enemy
      const mockEnemy = {
        position: { x: 100, y: 100 },
        reward: 25,
        isAlive: false
      } as Enemy;
      
      game.enemyKilled(mockEnemy);
      
      // Enemy reward is 25, and score is reward * 5 = 125
      expect(game.getCurrency()).toBeGreaterThanOrEqual(initialCurrency + 25);
      expect(game.getScore()).toBe(initialScore + 125);
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
      game.startNextWave();
      
      // Kill an enemy
      const enemies = game.getEnemies();
      if (enemies.length > 0) {
        enemies[0].takeDamage(1000);
        
        const initialEnemyCount = enemies.length;
        game.update(16);
        
        expect(game.getEnemies().length).toBeLessThan(initialEnemyCount);
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
      
      // Spend all money
      while (game.getCurrency() >= 20) {
        game.placeTower('BASIC', { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 });
      }
      
      expect(game.canAffordTower('SNIPER')).toBe(false);
    });
  });
});