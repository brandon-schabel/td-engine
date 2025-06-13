import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WaveManager, SpawnPattern } from '@/systems/WaveManager';
import type { WaveConfig } from '@/systems/WaveManager';
import { EnemyType } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import { TimeController, expectValidWaveConfig, expectEntityCount } from '../helpers';

describe('WaveManager', () => {
  let waveManager: WaveManager;
  let timeController: TimeController;
  const spawnPoint: Vector2 = { x: 0, y: 0 };

  beforeEach(() => {
    timeController = new TimeController();
    waveManager = new WaveManager(spawnPoint);
  });

  afterEach(() => {
    timeController.reset();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(waveManager.currentWave).toBe(0);
      expect(waveManager.isWaveActive()).toBe(false);
      expect(waveManager.isSpawning()).toBe(false);
      expect(waveManager.getEnemiesInWave()).toEqual([]);
    });

    it('should support single spawn point for backward compatibility', () => {
      const manager = new WaveManager({ x: 10, y: 20 });
      expect(manager.getSpawnPoints()).toHaveLength(1);
      expect(manager.getSpawnPoints()[0]).toEqual({ x: 10, y: 20 });
    });

    it('should support multiple spawn points', () => {
      const spawnPoints = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 }
      ];
      const manager = new WaveManager(spawnPoints);
      expect(manager.getSpawnPoints()).toHaveLength(4);
      expect(manager.getSpawnPoints()).toEqual(spawnPoints);
    });
  });

  describe('wave configuration', () => {
    it('should load wave configurations', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }
          ],
          startDelay: 2000
        },
        {
          waveNumber: 2,
          enemies: [
            { type: EnemyType.BASIC, count: 3, spawnDelay: 800 },
            { type: EnemyType.FAST, count: 2, spawnDelay: 600 }
          ],
          startDelay: 3000
        }
      ];

      waveManager.loadWaves(waves);
      expect(waveManager.getTotalWaves()).toBe(2);
      
      // Validate wave configs
      waves.forEach(wave => {
        expectValidWaveConfig(wave);
      });
    });
  });

  describe('wave spawning', () => {
    beforeEach(() => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 3, spawnDelay: 1000 }
          ],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
    });

    it('should start a wave', () => {
      waveManager.startWave(1);
      
      expect(waveManager.currentWave).toBe(1);
      expect(waveManager.isWaveActive()).toBe(true);
      expect(waveManager.isSpawning()).toBe(true);
    });

    it('should spawn enemies over time', () => {
      waveManager.startWave(1);
      
      // First update - should spawn first enemy immediately
      const enemies1 = waveManager.update(0);
      expectEntityCount(enemies1, 1);
      expect(enemies1[0].enemyType).toBe(EnemyType.BASIC);
      
      // Update after 500ms - no new enemy yet
      timeController.advance(500);
      const enemies2 = waveManager.update(500);
      expectEntityCount(enemies2, 0);
      
      // Update after another 500ms (total 1000ms) - spawn second enemy
      timeController.advance(500);
      const enemies3 = waveManager.update(500);
      expectEntityCount(enemies3, 1);
      
      // Update after another 1000ms - spawn third enemy
      timeController.advance(1000);
      const enemies4 = waveManager.update(1000);
      expectEntityCount(enemies4, 1);
      
      // No more enemies to spawn
      expect(waveManager.isSpawning()).toBe(false);
    });

    it('should handle multiple enemy types in a wave', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 2, spawnDelay: 1000 },
            { type: EnemyType.FAST, count: 1, spawnDelay: 500 }
          ],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);
      
      const allEnemies: any[] = [];
      
      // Spawn all enemies
      allEnemies.push(...waveManager.update(0));
      timeController.advance(500);
      allEnemies.push(...waveManager.update(500));
      timeController.advance(500);
      allEnemies.push(...waveManager.update(500));
      
      const basicEnemies = allEnemies.filter(e => e.enemyType === EnemyType.BASIC);
      const fastEnemies = allEnemies.filter(e => e.enemyType === EnemyType.FAST);
      
      expectEntityCount(basicEnemies, 2);
      expectEntityCount(fastEnemies, 1);
    });

    it('should respect wave start delay', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [{ type: EnemyType.BASIC, count: 1, spawnDelay: 100 }],
          startDelay: 2000
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);
      
      // Update before start delay - no enemies
      const enemies1 = waveManager.update(1000);
      expectEntityCount(enemies1, 0);
      expect(waveManager.isSpawning()).toBe(true);
      
      // Update after start delay - spawn enemy
      timeController.advance(1000);
      const enemies2 = waveManager.update(1000);
      expectEntityCount(enemies2, 1);
    });
  });

  describe('spawn patterns', () => {
    const multiSpawnPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 }
    ];

    beforeEach(() => {
      waveManager = new WaveManager(multiSpawnPoints);
    });

    it('should use SINGLE_POINT pattern to spawn all enemies from one point', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 4, spawnDelay: 100 }
          ],
          startDelay: 0,
          spawnPattern: SpawnPattern.SINGLE_POINT
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);

      const enemies: any[] = [];
      for (let i = 0; i < 4; i++) {
        enemies.push(...waveManager.update(100));
        timeController.advance(100);
      }

      // All enemies should spawn from the same point
      const firstPosition = enemies[0].position;
      expect(enemies.every(e => 
        e.position.x === firstPosition.x && e.position.y === firstPosition.y
      )).toBe(true);
    });

    it('should use DISTRIBUTED pattern to evenly distribute enemies', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 4, spawnDelay: 100 }
          ],
          startDelay: 0,
          spawnPattern: SpawnPattern.DISTRIBUTED
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);

      const enemies: any[] = [];
      for (let i = 0; i < 4; i++) {
        enemies.push(...waveManager.update(100));
        timeController.advance(100);
      }

      // Each spawn point should be used once
      const spawnPositions = enemies.map(e => `${e.position.x},${e.position.y}`);
      const uniquePositions = new Set(spawnPositions);
      expect(uniquePositions.size).toBe(4);
    });

    it('should use ROUND_ROBIN pattern to cycle through spawn points', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 8, spawnDelay: 100 }
          ],
          startDelay: 0,
          spawnPattern: SpawnPattern.ROUND_ROBIN
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.setDefaultSpawnPattern(SpawnPattern.ROUND_ROBIN);
      waveManager.startWave(1);

      const enemies: any[] = [];
      for (let i = 0; i < 8; i++) {
        enemies.push(...waveManager.update(100));
        timeController.advance(100);
      }

      // Should cycle through spawn points (0,1,2,3,0,1,2,3)
      for (let i = 0; i < 8; i++) {
        const expectedPoint = multiSpawnPoints[i % 4];
        expect(enemies[i].position).toEqual(expectedPoint);
      }
    });

    it('should respect enemy-specific spawn patterns over wave patterns', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [
            { type: EnemyType.BASIC, count: 2, spawnDelay: 100, spawnPattern: SpawnPattern.SINGLE_POINT },
            { type: EnemyType.FAST, count: 2, spawnDelay: 100, spawnPattern: SpawnPattern.DISTRIBUTED }
          ],
          startDelay: 0,
          spawnPattern: SpawnPattern.RANDOM // This should be overridden
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);

      const enemies: any[] = [];
      for (let i = 0; i < 4; i++) {
        enemies.push(...waveManager.update(100));
        timeController.advance(100);
      }

      // First 2 BASIC enemies should be from same point
      const basicEnemies = enemies.filter(e => e.enemyType === EnemyType.BASIC);
      expect(basicEnemies[0].position).toEqual(basicEnemies[1].position);

      // Last 2 FAST enemies should be from different points
      const fastEnemies = enemies.filter(e => e.enemyType === EnemyType.FAST);
      expect(fastEnemies[0].position).not.toEqual(fastEnemies[1].position);
    });
  });

  describe('wave completion', () => {
    it('should track enemies in wave', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [{ type: EnemyType.BASIC, count: 2, spawnDelay: 100 }],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);
      
      // Spawn enemies
      const enemy1 = waveManager.update(0)[0];
      timeController.advance(100);
      const enemy2 = waveManager.update(100)[0];
      
      expectEntityCount(waveManager.getEnemiesInWave(), 2);
      
      // Kill an enemy
      enemy1.takeDamage(1000);
      waveManager.update(0);
      
      expectEntityCount(waveManager.getEnemiesInWave(), 1);
      
      // Kill the last enemy
      enemy2.takeDamage(1000);
      waveManager.update(0);
      
      expectEntityCount(waveManager.getEnemiesInWave(), 0);
      expect(waveManager.isWaveComplete()).toBe(true);
    });

    it('should not be complete if enemies are still alive', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [{ type: EnemyType.BASIC, count: 1, spawnDelay: 100 }],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
      waveManager.startWave(1);
      
      waveManager.update(0); // Spawn enemy
      
      expect(waveManager.isWaveComplete()).toBe(false);
    });
  });

  describe('wave progression', () => {
    it('should track if there are more waves', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [{ type: EnemyType.BASIC, count: 1, spawnDelay: 100 }],
          startDelay: 0
        },
        {
          waveNumber: 2,
          enemies: [{ type: EnemyType.FAST, count: 1, spawnDelay: 100 }],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
      
      expect(waveManager.hasNextWave()).toBe(true);
      
      waveManager.startWave(1);
      expect(waveManager.hasNextWave()).toBe(true);
      
      waveManager.startWave(2);
      expect(waveManager.hasNextWave()).toBe(false);
    });

    it('should not start invalid wave numbers', () => {
      const waves: WaveConfig[] = [
        {
          waveNumber: 1,
          enemies: [{ type: EnemyType.BASIC, count: 1, spawnDelay: 100 }],
          startDelay: 0
        }
      ];
      waveManager.loadWaves(waves);
      
      const started = waveManager.startWave(5);
      expect(started).toBe(false);
      expect(waveManager.currentWave).toBe(0);
    });
  });

  describe('spawn point management', () => {
    it('should allow updating spawn points', () => {
      const initialPoints = [{ x: 0, y: 0 }];
      const manager = new WaveManager(initialPoints);
      
      const newPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { x: 30, y: 30 }
      ];
      
      manager.setSpawnPoints(newPoints);
      expect(manager.getSpawnPoints()).toHaveLength(3);
      expect(manager.getSpawnPoints()).toEqual(newPoints);
    });
  });
});