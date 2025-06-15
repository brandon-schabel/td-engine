import { describe, it, expect } from 'vitest';
import { WaveManager, SpawnPattern } from '@/systems/WaveManager';
import type { WaveConfig } from '@/systems/WaveManager';
import { EnemyType } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import { describeSystem, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { assertEntityCounts } from '../helpers/assertions';
import { WaveBuilder } from '../helpers/builders';
import { TestWaves } from '../fixtures/testData';

describeSystem('WaveManager', 
  () => new WaveManager({ x: 0, y: 0 }),
  (getWaveManager, context) => {

    describe('initialization', () => {
      it('initializes with defaults', () => {
        const waveManager = getWaveManager();
        expect(waveManager.currentWave).toBe(0);
        expect(waveManager.isWaveActive()).toBe(false);
        expect(waveManager.isSpawning()).toBe(false);
        expect(waveManager.getEnemiesInWave()).toEqual([]);
      });

      it('supports single spawn point', () => {
        const manager = new WaveManager({ x: 10, y: 20 });
        expect(manager.getSpawnPoints()).toHaveLength(1);
        expect(manager.getSpawnPoints()[0]).toEqual({ x: 10, y: 20 });
      });

      it('supports multiple spawn points', () => {
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
      it(when('loading wave configs'), () => {
        const waveManager = getWaveManager();
        const waves = [
          new WaveBuilder()
            .number(1)
            .withEnemies(EnemyType.BASIC, 5, 1000)
            .withStartDelay(2000)
            .build(),
          new WaveBuilder()
            .number(2)
            .withEnemies(EnemyType.BASIC, 3, 800)
            .withEnemies(EnemyType.FAST, 2, 600)
            .withStartDelay(3000)
            .build()
        ];

        waveManager.loadWaves(waves);
        expect(waveManager.getTotalWaves()).toBe(2);
      });
    });

    describe('wave spawning', () => {
      const setupWaves = (waveManager: WaveManager) => {
        const waves = [
          new WaveBuilder()
            .number(1)
            .withEnemies(EnemyType.BASIC, 3, 1000)
            .withStartDelay(0)
            .build()
        ];
        waveManager.loadWaves(waves);
      };

      it(when('starting a wave'), () => {
        const waveManager = getWaveManager();
        setupWaves(waveManager);
        waveManager.startWave(1);
        
        expect(waveManager.currentWave).toBe(1);
        expect(waveManager.isWaveActive()).toBe(true);
        expect(waveManager.isSpawning()).toBe(true);
      });

      it(then('spawns enemies over time'), () => {
        const waveManager = getWaveManager();
        setupWaves(waveManager);
        waveManager.startWave(1);
        
        // First update - spawn first enemy immediately
        const enemies1 = waveManager.update(0);
        expect(enemies1).toHaveLength(1);
        expect(enemies1[0].enemyType).toBe(EnemyType.BASIC);
        
        // Update after 500ms - no new enemy yet
        const enemies2 = waveManager.update(500);
        expect(enemies2).toHaveLength(0);
        
        // Update after another 500ms (total 1000ms) - spawn second enemy
        const enemies3 = waveManager.update(500);
        expect(enemies3).toHaveLength(1);
        
        // Update after another 1000ms - spawn third enemy
        const enemies4 = waveManager.update(1000);
        expect(enemies4).toHaveLength(1);
        
        // No more enemies to spawn
        expect(waveManager.isSpawning()).toBe(false);
      });

      it('handles multiple enemy types', () => {
        const waveManager = getWaveManager();
        const waves = [
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
        allEnemies.push(...waveManager.update(500));
        allEnemies.push(...waveManager.update(500));
        
        const basicEnemies = allEnemies.filter(e => e.enemyType === EnemyType.BASIC);
        const fastEnemies = allEnemies.filter(e => e.enemyType === EnemyType.FAST);
        
        expect(basicEnemies).toHaveLength(2);
        expect(fastEnemies).toHaveLength(1);
      });

      it(when('wave has start delay'), () => {
        const waveManager = getWaveManager();
        const waves = [
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
        expect(enemies1).toHaveLength(0);
        expect(waveManager.isSpawning()).toBe(true);
        
        // Update after start delay - spawn enemy
        const enemies2 = waveManager.update(1000);
        expect(enemies2).toHaveLength(1);
      });
    });

    describe('spawn patterns', () => {
      const multiSpawnPoints = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 }
      ];
      
      const createMultiSpawnManager = () => new WaveManager(multiSpawnPoints);

      it(when('using SINGLE_POINT pattern'), () => {
        const waveManager = createMultiSpawnManager();
        const waves = [
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
        }

        // All enemies should spawn from the same point
        const firstPosition = enemies[0].position;
        expect(enemies.every(e => 
          e.position.x === firstPosition.x && e.position.y === firstPosition.y
        )).toBe(true);
      });

      it(when('using DISTRIBUTED pattern'), () => {
        const waveManager = createMultiSpawnManager();
        const waves = [
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
        }

        // Each spawn point should be used once
        const spawnPositions = enemies.map(e => `${e.position.x},${e.position.y}`);
        const uniquePositions = new Set(spawnPositions);
        expect(uniquePositions.size).toBe(4);
      });

      it(when('using ROUND_ROBIN pattern'), () => {
        const waveManager = createMultiSpawnManager();
        const waves = [
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
        }

        // Should cycle through spawn points (0,1,2,3,0,1,2,3)
        for (let i = 0; i < 8; i++) {
          const expectedPoint = multiSpawnPoints[i % 4];
          expect(enemies[i].position).toEqual(expectedPoint);
        }
      });

      it(then('respects enemy-specific patterns'), () => {
        const waveManager = createMultiSpawnManager();
        const waves = [
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
      it(when('tracking enemies'), () => {
        const waveManager = getWaveManager();
        const waves = [
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
        const enemy2 = waveManager.update(100)[0];
        
        expect(waveManager.getEnemiesInWave()).toHaveLength(2);
        
        // Kill an enemy
        enemy1.takeDamage(1000);
        waveManager.update(0);
        
        expect(waveManager.getEnemiesInWave()).toHaveLength(1);
        
        // Kill the last enemy
        enemy2.takeDamage(1000);
        waveManager.update(0);
        
        expect(waveManager.getEnemiesInWave()).toHaveLength(0);
        expect(waveManager.isWaveComplete()).toBe(true);
      });

      it(then('not complete with alive enemies'), () => {
        const waveManager = getWaveManager();
        const waves = [
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
      it('tracks remaining waves', () => {
        const waveManager = getWaveManager();
        const waves = [
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

      it(when('starting invalid wave'), () => {
        const waveManager = getWaveManager();
        const waves = [
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
      it(when('updating spawn points'), () => {
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
  }
);