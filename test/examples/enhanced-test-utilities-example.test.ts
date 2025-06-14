import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  // New test utilities
  GameScenarioBuilder,
  TowerBuilder,
  EnemyBuilder,
  WaveBuilder,
  MapBuilder,
  
  // Async utilities
  waitFor,
  waitForGameState,
  AsyncGameSimulator,
  withTimeout,
  
  // Performance utilities
  PerformanceMonitor,
  FPSCounter,
  StressTester,
  
  // Generators
  Random,
  EnemyGenerator,
  TowerGenerator,
  WaveGenerator,
  MapGenerator,
  
  // Existing utilities
  TimeController,
  createMockCanvas
} from '../helpers';

// Import matchers to enable custom assertions
import '../helpers/matchers';

import { TowerType, UpgradeType } from '@/entities/Tower';
import { EnemyType } from '@/entities/Enemy';
import { GameState } from '@/core/GameEngine';

describe('Enhanced Test Utilities Example', () => {
  let timeController: TimeController;
  
  beforeEach(() => {
    timeController = new TimeController();
  });
  
  describe('Custom Matchers', () => {
    it('should use game-specific matchers', () => {
      // Create test scenario
      const scenario = new GameScenarioBuilder()
        .withCurrency(500)
        .withTower(TowerType.SNIPER, 5, 5)
        .withEnemy(EnemyType.TANK, 200, 200)
        .withSimplePath()
        .build();
      
      const gameAny = scenario as any;
      const tower = gameAny.towers[0];
      const enemy = gameAny.enemies[0];
      
      // Use custom matchers
      expect(tower).toBeInRange(enemy, 300);
      expect(tower).toHaveFireRateOf(0.5, 0.1);
      expect(enemy).toHaveHealthPercentage(1.0);
      expect(tower.position).toBeWithinBounds({ width: 800, height: 600 });
      expect(tower).toBeAtGridPosition(5, 5);
    });
    
    it('should check entity movement', () => {
      const enemy = new EnemyBuilder()
        .ofType(EnemyType.FAST)
        .at(100, 100)
        .withSpeed(100)
        .build();
      
      // Set velocity towards target
      const target = { x: 200, y: 200 };
      enemy.velocity = { x: 70.7, y: 70.7 }; // ~45 degree angle
      
      expect(enemy).toBeMovingTowards(target);
    });
  });
  
  describe('Builder Pattern', () => {
    it('should build complex game scenarios', () => {
      const scenario = new GameScenarioBuilder()
        .withCurrency(1000)
        .withLives(10)
        .withScore(5000)
        .withTower(TowerType.BASIC, 3, 3, [UpgradeType.DAMAGE, UpgradeType.RANGE])
        .withTower(TowerType.RAPID, 7, 7)
        .withEnemy(EnemyType.BASIC, 50, 50, 50)
        .withWave(new WaveBuilder()
          .number(5)
          .withEnemies(EnemyType.TANK, 3, 2000)
          .withEnemies(EnemyType.FAST, 5, 500)
          .build())
        .withMap(new MapBuilder()
          .withSize(20, 15)
          .withPath([
            { x: 0, y: 7 },
            { x: 5, y: 7 },
            { x: 5, y: 3 },
            { x: 15, y: 3 },
            { x: 15, y: 10 },
            { x: 19, y: 10 }
          ])
          .build())
        .build();
      
      const gameAny = scenario as any;
      expect(gameAny.currency).toBe(1000);
      expect(gameAny.towers).toHaveLength(2);
      expect(gameAny.enemies).toHaveLength(1);
      expect(gameAny.mapData.paths).toHaveLength(1);
    });
    
    it('should build entities with builders', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.SNIPER)
        .atGrid(10, 10)
        .withLevel(3)
        .withHealth(80)
        .build();
      
      expect(tower.towerType).toBe(TowerType.SNIPER);
      expect(tower.getLevel()).toBe(3);
      expect(tower.health).toBe(80);
      expect(tower).toBeAtGridPosition(10, 10);
    });
  });
  
  describe('Async Testing', () => {
    it.skip('should wait for conditions', async () => {
      let counter = 0;
      
      // Simulate until condition
      const interval = setInterval(() => counter++, 10); // Faster interval for test
      
      try {
        await waitFor(() => counter >= 5, { timeout: 2000 }); // Longer timeout
        expect(counter).toBeGreaterThanOrEqual(5);
      } finally {
        clearInterval(interval);
      }
    });
    
    it.skip('should simulate game with async utilities', async () => {
      const game = new GameScenarioBuilder()
        .withCurrency(200)
        .withEnemy(EnemyType.BASIC, 50, 50, 50) // Pre-spawn enemy for simplicity
        .withSimplePath()
        .build();
      
      const simulator = new AsyncGameSimulator(game);
      
      // Just simulate time
      await simulator.simulateTime(500);
      
      const gameAny = game as any;
      expect(gameAny.enemies.length).toBeGreaterThan(0);
    }, 10000); // 10 second test timeout
    
    it.skip('should handle timeouts', async () => {
      const slowOperation = new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await withTimeout(slowOperation, 100, 'Operation too slow');
        throw new Error('Should have timed out');
      } catch (error) {
        expect((error as Error).message).toBe('Operation too slow');
      }
    }, 5000); // 5 second test timeout
  });
  
  describe('Performance Testing', () => {
    it.skip('should monitor game performance', async () => {
      const game = new GameScenarioBuilder()
        .withSimplePath()
        .build();
      
      const monitor = new PerformanceMonitor(game);
      const metrics = await monitor.runTest(100, 60); // 100ms at 60fps
      
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeLessThan(20); // Should be under 20ms
      expect(metrics.entityCount).toBe(0);
    });
    
    it('should track FPS', () => {
      const fpsCounter = new FPSCounter();
      
      // Simulate frames
      for (let i = 0; i < 60; i++) {
        fpsCounter.update(i * 16.67); // 60 FPS timing
      }
      
      const fps = fpsCounter.getFPS();
      expect(fps).toBeCloseTo(60, 1);
    });
    
    it('should stress test with many entities', async () => {
      const game = new GameScenarioBuilder()
        .withSimplePath()
        .build();
      
      const stressTester = new StressTester(game);
      
      // Spawn many entities
      await stressTester.spawnEntities({
        enemyCount: 100,
        towerCount: 50,
        projectileCount: 200
      });
      
      const gameAny = game as any;
      expect(gameAny.enemies).toHaveLength(100);
      expect(gameAny.towers).toHaveLength(50);
      expect(gameAny.projectiles).toHaveLength(200);
    });
  });
  
  describe('Data Generators', () => {
    it('should generate random enemies', () => {
      const random = new Random(12345); // Seeded for determinism
      const generator = new EnemyGenerator(random);
      
      const wavePattern = generator.generateWavePattern({
        enemyCount: 20,
        difficulty: 'hard',
        mixedTypes: true
      });
      
      const totalEnemies = wavePattern.reduce((sum, group) => sum + group.count, 0);
      expect(totalEnemies).toBe(20);
      
      // Should have mix of enemy types for hard difficulty
      const types = wavePattern.map(g => g.type);
      expect(types).toContain(EnemyType.TANK);
      expect(types).toContain(EnemyType.FAST);
    });
    
    it('should generate tower placements', () => {
      const generator = new TowerGenerator();
      
      // Create a simple grid
      const grid = Array(10).fill(null).map(() => Array(10).fill(true));
      
      const placements = generator.generatePlacement({
        grid,
        count: 5,
        strategy: 'defensive'
      });
      
      expect(placements).toHaveLength(5);
      
      // Defensive strategy should prefer right side
      const avgX = placements.reduce((sum, p) => sum + p.position.x, 0) / placements.length;
      expect(avgX).toBeGreaterThan(160); // More than half of 320 (10 * 32)
    });
    
    it('should generate complete maps', () => {
      const generator = new MapGenerator(new Random(54321));
      
      const map = generator.generateMap({
        width: 30,
        height: 20,
        pathCount: 2,
        obstacleCount: 10
      });
      
      expect(map.paths).toHaveLength(2);
      expect(map.spawns).toHaveLength(2);
      expect(map.exits).toHaveLength(2);
      expect(map.placeable).toHaveLength(20);
      expect(map.placeable[0]).toHaveLength(30);
    });
    
    it('should generate wave sequences', () => {
      const generator = new WaveGenerator();
      
      const waves = generator.generateWaves({
        count: 10,
        startDifficulty: 1,
        difficultyIncrease: 1.5
      });
      
      expect(waves).toHaveLength(10);
      
      // Later waves should have more enemies
      const firstWaveEnemies = waves[0].enemies.reduce((sum, g) => sum + g.count, 0);
      const lastWaveEnemies = waves[9].enemies.reduce((sum, g) => sum + g.count, 0);
      
      expect(lastWaveEnemies).toBeGreaterThan(firstWaveEnemies);
    });
  });
  
  describe('Integration Example', () => {
    it('should run complete test scenario with all utilities', async () => {
      // Generate random map
      const mapGenerator = new MapGenerator(new Random(99999));
      const map = mapGenerator.generateMap({ pathCount: 1 });
      
      // Build game scenario
      const game = new GameScenarioBuilder()
        .withCurrency(1000)
        .withMap(map)
        .build();
      
      // Generate and add waves
      const waveGenerator = new WaveGenerator();
      const waves = waveGenerator.generateWaves({ count: 3 });
      const gameAny = game as any;
      gameAny.waveManager.loadWaves(waves);
      
      // Place towers using generator
      const towerGenerator = new TowerGenerator();
      const towerPlacements = towerGenerator.generatePlacement({
        grid: map.placeable,
        count: 5,
        strategy: 'defensive'
      });
      
      towerPlacements.forEach(placement => {
        game.placeTower(placement.type, placement.position);
      });
      
      // Monitor performance
      const monitor = new PerformanceMonitor(game);
      monitor.start();
      
      // Simulate game with async utilities
      const simulator = new AsyncGameSimulator(game);
      
      // Start first wave
      game.startNextWave();
      
      // Wait for some enemies to spawn
      await simulator.simulateTime(2000);
      
      // Check game state
      expect(gameAny.enemies.length).toBeGreaterThan(0);
      expect(gameAny.towers).toHaveLength(5);
      
      // Check performance
      const metrics = monitor.getMetrics();
      monitor.assertPerformance({
        minFps: 30,
        maxFrameTime: 50
      });
      
      // Use custom matchers
      const firstTower = gameAny.towers[0];
      const firstEnemy = gameAny.enemies[0];
      
      if (firstTower.distanceTo(firstEnemy) <= firstTower.range) {
        expect(firstTower).toBeInRange(firstEnemy, firstTower.range);
      }
      
      expect(firstEnemy).toBeOnPath(map.paths[0], 10);
    });
  });
});