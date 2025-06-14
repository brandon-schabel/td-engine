import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TowerType, UpgradeType } from '@/entities/Tower';
import { EnemyType } from '@/entities/Enemy';
import {
  GameScenarioBuilder,
  TowerBuilder,
  EnemyBuilder,
  WaveBuilder,
  TimeController,
  expectTowerCanTarget,
  expectTowerCannotTarget,
  expectGameStateValid,
  expectTowerUpgraded,
  expectProjectileValid,
  expectWaveActive,
  expectEntityCount,
  expectResourcesChanged,
  TEST_POSITIONS,
  TEST_RESOURCES,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  WAVE_CONFIGS,
  UPGRADE_SEQUENCES,
  TIME_CONSTANTS
} from '../helpers';

/**
 * This test file demonstrates the optimized testing patterns using:
 * - Builder patterns for complex entity creation
 * - Custom assertions for domain-specific validations
 * - Reusable constants for common test data
 * - Utility functions for common operations
 * 
 * Compare this with older test files to see the reduction in boilerplate!
 */
describe('Optimized Test Patterns Demo', () => {
  let timeController: TimeController;

  beforeEach(() => {
    timeController = new TimeController();
  });

  afterEach(() => {
    timeController.reset();
  });

  describe('Advanced Tower Combat Scenario', () => {
    it('should create a complex battlefield with multiple towers and enemies', () => {
      // Before: Required 30+ lines of manual setup
      // After: 8 lines with builder pattern
      const game = new GameScenarioBuilder()
        .withCurrency(TEST_RESOURCES.RICH.currency)
        .withLives(TEST_RESOURCES.RICH.lives)
        .withTower(TowerType.SNIPER, 5, 5, [])
        .withTower(TowerType.RAPID, 8, 8, [])
        .withTower(TowerType.BASIC, 12, 12, [])
        .withSimplePath()
        .build();

      // Before: Manual validation with multiple expect statements
      // After: Single comprehensive assertion
      expectGameStateValid(game);
      expectEntityCount(game.getTowers(), 3);
      
      const towers = game.getTowers();
      expect(towers[0].towerType).toBe(TowerType.SNIPER);
      expect(towers[1].towerType).toBe(TowerType.RAPID);
      expect(towers[2].towerType).toBe(TowerType.BASIC);
    });

    it('should test tower upgrade progression efficiently', () => {
      // Before: Complex tower creation and manual upgrade loops
      // After: Builder pattern with predefined upgrade sequence
      const tower = new TowerBuilder()
        .ofType(TowerType.BASIC)
        .at(TEST_POSITIONS.CENTER.x, TEST_POSITIONS.CENTER.y)
        .withUpgrades(...UPGRADE_SEQUENCES.DAMAGE_FOCUS.slice(0, 3))
        .build();

      // Before: Manual level checking and stat validation
      // After: Custom assertion handles all validation
      expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
      expect(tower.damage).toBeGreaterThan(0);
    });

    it('should validate targeting behavior with custom assertions', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.SNIPER)
        .at(TEST_POSITIONS.CENTER.x, TEST_POSITIONS.CENTER.y)
        .build();

      // Before: Manual enemy creation with position calculations
      // After: Use predefined enemy configs and builders
      const inRangeEnemy = new EnemyBuilder()
        .ofType(ENEMY_CONFIGS.NORMAL_BASIC.type)
        .at(TEST_POSITIONS.CENTER.x + 50, TEST_POSITIONS.CENTER.y)
        .withHealth(ENEMY_CONFIGS.NORMAL_BASIC.health)
        .build();

      const outOfRangeEnemy = new EnemyBuilder()
        .ofType(ENEMY_CONFIGS.FAST_SCOUT.type)
        .at(TEST_POSITIONS.CENTER.x + 300, TEST_POSITIONS.CENTER.y)
        .withHealth(ENEMY_CONFIGS.FAST_SCOUT.health)
        .build();

      // Before: Manual distance calculations and targeting logic
      // After: Declarative assertions that express intent clearly
      expectTowerCanTarget(tower, inRangeEnemy);
      expectTowerCannotTarget(tower, outOfRangeEnemy, 'range');
    });

    it('should test projectile creation and validation', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.RAPID)
        .at(TEST_POSITIONS.CENTER.x, TEST_POSITIONS.CENTER.y)
        .build();

      const enemy = new EnemyBuilder()
        .ofType(EnemyType.BASIC)
        .at(TEST_POSITIONS.CENTER.x + 30, TEST_POSITIONS.CENTER.y)
        .build();

      const projectile = tower.shoot(enemy);

      // Before: Multiple manual checks for projectile properties
      // After: Single assertion that validates all projectile properties
      expectProjectileValid(projectile, tower.damage, enemy);
    });
  });

  describe('Wave Management Scenarios', () => {
    it('should create and validate complex wave progression', () => {
      const game = new GameScenarioBuilder()
        .withCurrency(TEST_RESOURCES.UNLIMITED.currency)
        .withSimplePath()
        .build();

      // Before: Manual wave config object creation
      // After: Fluent builder pattern
      const waves = [
        new WaveBuilder()
          .number(1)
          .withEnemies(EnemyType.BASIC, 5, 1000)
          .withStartDelay(1000)
          .build(),
        new WaveBuilder()
          .number(2)
          .withEnemies(EnemyType.BASIC, 3, 800)
          .withEnemies(EnemyType.FAST, 2, 600)
          .withStartDelay(2000)
          .build()
      ];

      const gameAny = game as any;
      gameAny.waveManager.loadWaves(waves);
      game.startNextWave();

      // Before: Manual wave state checking
      // After: Custom assertion for wave validation
      expectWaveActive(gameAny.waveManager, 1);
    });

    it('should use predefined wave configurations', () => {
      const game = new GameScenarioBuilder()
        .withCurrency(TEST_RESOURCES.NORMAL.currency)
        .withSimplePath()
        .build();

      // Before: Duplicated wave configuration in each test
      // After: Reuse predefined configurations
      const gameAny = game as any;
      gameAny.waveManager.loadWaves(WAVE_CONFIGS.BASIC_PROGRESSION);
      
      expect(gameAny.waveManager.getTotalWaves()).toBe(3);
    });
  });

  describe('Resource Management Scenarios', () => {
    it('should test different economic scenarios efficiently', () => {
      // Before: Manual resource setup in each test
      // After: Predefined resource configurations
      const scenarios = [
        { config: TEST_RESOURCES.POOR, canAffordBasic: false },
        { config: TEST_RESOURCES.NORMAL, canAffordBasic: true },
        { config: TEST_RESOURCES.RICH, canAffordBasic: true }
      ];

      scenarios.forEach(({ config, canAffordBasic }) => {
        const game = new GameScenarioBuilder()
          .withCurrency(config.currency)
          .withLives(config.lives)
          .withScore(config.score)
          .build();

        expect(game.canAffordTower('BASIC')).toBe(canAffordBasic);
      });
    });

    it('should validate resource changes with custom assertions', () => {
      const game = new GameScenarioBuilder()
        .withCurrency(TEST_RESOURCES.NORMAL.currency)
        .build();

      const initialResources = {
        currency: game.getCurrency(),
        lives: game.getLives(),
        score: game.getScore()
      };

      // Simulate tower purchase
      const towerCost = TOWER_CONFIGS.BASIC_L1.cost;
      game.placeTower(TowerType.BASIC, TEST_POSITIONS.CENTER);

      const finalResources = {
        currency: game.getCurrency(),
        lives: game.getLives(),
        score: game.getScore()
      };

      // Before: Manual resource difference calculations
      // After: Declarative assertion for resource changes
      expectResourcesChanged(initialResources, finalResources, {
        currency: -towerCost
      });
    });
  });

  describe('Performance and Timing Scenarios', () => {
    it('should test timing behavior with predefined constants', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.BASIC)
        .at(TEST_POSITIONS.CENTER.x, TEST_POSITIONS.CENTER.y)
        .build();

      const enemy = new EnemyBuilder()
        .at(TEST_POSITIONS.CENTER.x + 50, TEST_POSITIONS.CENTER.y)
        .build();

      // Before: Magic numbers scattered throughout tests
      // After: Named constants that express intent
      tower.shoot(enemy);
      expect(tower.canShoot()).toBe(false);

      tower.update(TIME_CONSTANTS.TOWER_COOLDOWN_BASIC + 1);
      expect(tower.canShoot()).toBe(true);
    });
  });
});