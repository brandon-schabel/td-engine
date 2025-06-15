/**
 * Example showing how to migrate verbose tests to the new structure
 * This file demonstrates before/after patterns for test refactoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { TowerType } from '@/entities/Tower';
import { 
  createGameWithState,
  QuickScenarios,
  TestScenarios,
  assertGameState,
  when,
  then,
  WaveConfigs,
  TowerPatterns
} from '../helpers';

// ============================================
// BEFORE: Verbose traditional test structure
// ============================================

describe('Traditional Tower Placement Test (BEFORE)', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Manual canvas creation
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Mock all canvas methods
    if (ctx) {
      ctx.fillRect = vi.fn();
      ctx.strokeRect = vi.fn();
      ctx.beginPath = vi.fn();
      ctx.arc = vi.fn();
      ctx.fill = vi.fn();
      ctx.stroke = vi.fn();
      // ... many more mocks
    }

    // Create game
    game = new Game(canvas);
    
    // Set up initial state manually
    (game as any).currency = 500;
    (game as any).lives = 20;
    (game as any).score = 0;
  });

  afterEach(() => {
    if (game) {
      game.stop();
    }
  });

  it('should place multiple towers and update resources', () => {
    // Verbose tower placement
    const tower1Success = game.placeTower(TowerType.BASIC, { x: 100, y: 100 });
    expect(tower1Success).toBe(true);
    expect(game.getCurrency()).toBe(480); // 500 - 20
    expect(game.getTowers().length).toBe(1);

    const tower2Success = game.placeTower(TowerType.SNIPER, { x: 200, y: 200 });
    expect(tower2Success).toBe(true);
    expect(game.getCurrency()).toBe(430); // 480 - 50
    expect(game.getTowers().length).toBe(2);

    const tower3Success = game.placeTower(TowerType.RAPID, { x: 300, y: 300 });
    expect(tower3Success).toBe(true);
    expect(game.getCurrency()).toBe(400); // 430 - 30
    expect(game.getTowers().length).toBe(3);

    // Check each tower individually
    const towers = game.getTowers();
    expect(towers[0].towerType).toBe(TowerType.BASIC);
    expect(towers[1].towerType).toBe(TowerType.SNIPER);
    expect(towers[2].towerType).toBe(TowerType.RAPID);
  });

  it('should handle wave spawning', () => {
    // Manual wave configuration
    const waveConfig = {
      waveNumber: 1,
      enemies: [
        { type: 'BASIC' as any, count: 10, spawnDelay: 1000 },
        { type: 'FAST' as any, count: 5, spawnDelay: 1500 }
      ],
      startDelay: 2000
    };

    (game as any).waveManager.loadWaves([waveConfig]);
    
    // Start wave
    const started = game.startNextWave();
    expect(started).toBe(true);
    expect(game.getCurrentWave()).toBe(1);

    // Simulate time passing
    for (let i = 0; i < 300; i++) {
      game.update(16);
    }

    // Check enemies spawned
    expect(game.getEnemies().length).toBeGreaterThan(0);
  });
});

// ============================================
// AFTER: Clean test structure with new utilities
// ============================================

describe('Improved Tower Placement Test (AFTER)', () => {
  // Single line setup with preset
  const getGame = () => createGameWithState({ 
    currency: 500, 
    lives: 20, 
    score: 0,
    towers: [],
    enemies: [],
    wave: 0
  });

  when('placing multiple towers', () => {
    then('should update resources correctly', () => {
      const game = getGame();
      
      // Use tower patterns
      const placements = [
        { type: TowerType.BASIC, pos: { x: 100, y: 100 }, cost: 20 },
        { type: TowerType.SNIPER, pos: { x: 200, y: 200 }, cost: 50 },
        { type: TowerType.RAPID, pos: { x: 300, y: 300 }, cost: 30 }
      ];

      placements.forEach(({ type, pos }) => {
        expect(game.placeTower(type, pos)).toBe(true);
      });

      // Single composite assertion
      assertGameState(game, {
        currency: 400,  // 500 - 100 total
        towerCount: 3
      });
    });

    // Use TestScenarios for resource tracking
    TestScenarios.resourceChanges(
      getGame(),
      () => {
        const game = getGame();
        TowerPatterns.defensive.forEach(({ type, gridX, gridY }) => {
          game.placeTower(type, { x: gridX * 32, y: gridY * 32 });
        });
      },
      { currency: -100 } // Total cost of defensive pattern
    );
  });

  when('handling waves', () => {
    then('should spawn enemies correctly', () => {
      // Use predefined wave configs
      const game = QuickScenarios.gameInProgress();
      
      // Wave is already configured and started
      assertGameState(game, {
        wave: 1,
        isPlaying: true
      });

      // Enemies spawn automatically in gameInProgress scenario
      expect(game.getEnemies().length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// SIDE BY SIDE: Complex scenario comparison
// ============================================

describe('Complex Game Scenario Comparison', () => {
  describe('BEFORE: Manual complex setup', () => {
    it('should handle full game scenario', () => {
      // Tons of manual setup
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      // ... canvas mock setup (20+ lines)

      const game = new Game(canvas);
      (game as any).currency = 2000;
      (game as any).lives = 10;
      (game as any).score = 5000;
      
      // NOTE: In real tests, make sure to stop the game in afterEach
      // This example shows the old pattern - avoid this!

      // Manual tower placement
      game.placeTower(TowerType.BASIC, { x: 160, y: 160 });
      const tower1 = game.getTowers()[0];
      (tower1 as any).level = 3;
      
      game.placeTower(TowerType.SNIPER, { x: 320, y: 320 });
      const tower2 = game.getTowers()[1];
      (tower2 as any).level = 2;

      // Manual wave setup
      const waves = [
        {
          waveNumber: 5,
          enemies: [
            { type: 'BASIC' as any, count: 20, spawnDelay: 500 },
            { type: 'FAST' as any, count: 10, spawnDelay: 800 },
            { type: 'TANK' as any, count: 5, spawnDelay: 1500 }
          ],
          startDelay: 1000
        }
      ];
      (game as any).waveManager.loadWaves(waves);
      (game as any).waveManager.currentWave = 5;

      // Assertions
      expect(game.getCurrency()).toBe(2000);
      expect(game.getLives()).toBe(10);
      expect(game.getScore()).toBe(5000);
      expect(game.getTowers().length).toBe(2);
      expect(game.getCurrentWave()).toBe(5);
    });
  });

  describe('AFTER: Clean complex setup', () => {
    it('should handle full game scenario', () => {
      // One-liner setup with all state
      const game = createGameWithState('LATE_GAME');

      // Single assertion for all state
      assertGameState(game, {
        currency: 2000,
        lives: 5,
        score: 10000,
        towerCount: 3,
        wave: 15,
        isPlaying: false
      });
    });
  });
});

// ============================================
// Summary: Key improvements demonstrated
// ============================================

/**
 * Key Improvements Shown:
 * 
 * 1. Setup Reduction:
 *    - BEFORE: 30+ lines of canvas mocking and game setup
 *    - AFTER: Single line with createGameWithState()
 * 
 * 2. Assertions:
 *    - BEFORE: Multiple individual expect() calls
 *    - AFTER: Single assertGameState() with all checks
 * 
 * 3. Test Data:
 *    - BEFORE: Inline wave/tower configurations
 *    - AFTER: Reusable fixtures (WaveConfigs, TowerPatterns)
 * 
 * 4. Readability:
 *    - BEFORE: Implementation-focused tests
 *    - AFTER: Behavior-focused with when/then
 * 
 * 5. Reusability:
 *    - BEFORE: Duplicate setup across tests
 *    - AFTER: Shared scenarios and templates
 */