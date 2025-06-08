import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveManager } from '../../src/systems/WaveManager';
import type { WaveConfig } from '../../src/systems/WaveManager';
import { EnemyType } from '../../src/entities/Enemy';
import type { Vector2 } from '../../src/utils/Vector2';

describe('WaveManager', () => {
  let waveManager: WaveManager;
  const spawnPoint: Vector2 = { x: 0, y: 0 };

  beforeEach(() => {
    waveManager = new WaveManager(spawnPoint);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(waveManager.currentWave).toBe(0);
      expect(waveManager.isWaveActive()).toBe(false);
      expect(waveManager.isSpawning()).toBe(false);
      expect(waveManager.getEnemiesInWave()).toEqual([]);
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
      allEnemies.push(...waveManager.update(500));
      allEnemies.push(...waveManager.update(500));
      
      const basicEnemies = allEnemies.filter(e => e.enemyType === EnemyType.BASIC);
      const fastEnemies = allEnemies.filter(e => e.enemyType === EnemyType.FAST);
      
      expect(basicEnemies).toHaveLength(2);
      expect(fastEnemies).toHaveLength(1);
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
      expect(enemies1).toHaveLength(0);
      expect(waveManager.isSpawning()).toBe(true);
      
      // Update after start delay - spawn enemy
      const enemies2 = waveManager.update(1000);
      expect(enemies2).toHaveLength(1);
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
});