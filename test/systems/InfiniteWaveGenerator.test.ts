/**
 * File: InfiniteWaveGenerator.test.ts
 * Recent Changes:
 * 1. Initial test suite for InfiniteWaveGenerator
 * 2. Added tests for logarithmic scaling formulas
 * 3. Added tests for wave generation
 * 4. Added tests for special wave behaviors
 * 5. Added tests for difficulty plateaus
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InfiniteWaveGenerator } from '@/systems/InfiniteWaveGenerator';
import { EnemyType } from '@/entities/Enemy';
import { SpawnPattern } from '@/systems/WaveManager';

describe('InfiniteWaveGenerator', () => {
  let generator: InfiniteWaveGenerator;

  beforeEach(() => {
    generator = new InfiniteWaveGenerator();
  });

  describe('scaling formulas', () => {
    it('should calculate difficulty score logarithmically', () => {
      expect(generator.calculateDifficultyScore(1)).toBeCloseTo(30, 1);
      expect(generator.calculateDifficultyScore(10)).toBeCloseTo(35.6, 1);
      expect(generator.calculateDifficultyScore(30)).toBeCloseTo(41.8, 1);
      expect(generator.calculateDifficultyScore(50)).toBeCloseTo(45.4, 1);
      expect(generator.calculateDifficultyScore(100)).toBeCloseTo(50.7, 1);
    });

    it('should scale health logarithmically', () => {
      expect(generator.getEnemyHealthMultiplier(1)).toBeCloseTo(1.0, 2);
      expect(generator.getEnemyHealthMultiplier(10)).toBeCloseTo(1.5, 1);
      expect(generator.getEnemyHealthMultiplier(30)).toBeCloseTo(1.74, 1);
      expect(generator.getEnemyHealthMultiplier(50)).toBeCloseTo(1.85, 1);
    });

    it('should scale damage more conservatively than health', () => {
      const healthMult10 = generator.getEnemyHealthMultiplier(10);
      const damageMult10 = generator.getEnemyDamageMultiplier(10);
      expect(damageMult10).toBeLessThan(healthMult10);
      
      expect(generator.getEnemyDamageMultiplier(1)).toBeCloseTo(1.0, 2);
      expect(generator.getEnemyDamageMultiplier(50)).toBeCloseTo(1.51, 1);
    });

    it('should apply difficulty plateaus', () => {
      // Test primary plateau at wave 50
      const mult49 = generator.getEnemyHealthMultiplier(49);
      const mult50 = generator.getEnemyHealthMultiplier(50);
      const mult51 = generator.getEnemyHealthMultiplier(51);
      
      // Growth should slow significantly after wave 50
      const growth49to50 = mult50 - mult49;
      const growth50to51 = mult51 - mult50;
      expect(growth50to51).toBeLessThan(growth49to50 * 0.6);
      
      // Test secondary plateau at wave 100
      const mult99 = generator.getEnemyHealthMultiplier(99);
      const mult100 = generator.getEnemyHealthMultiplier(100);
      const mult101 = generator.getEnemyHealthMultiplier(101);
      
      const growth99to100 = mult100 - mult99;
      const growth100to101 = mult101 - mult100;
      expect(growth100to101).toBeLessThan(growth99to100 * 0.6);
    });
  });

  describe('wave generation', () => {
    it('should generate valid wave configurations', () => {
      const wave = generator.generateWave(25);
      
      expect(wave.waveNumber).toBe(25);
      expect(wave.enemies).toBeInstanceOf(Array);
      expect(wave.enemies.length).toBeGreaterThan(0);
      expect(wave.startDelay).toBe(2000);
      expect(wave.spawnPattern).toBeDefined();
    });

    it('should respect enemy count limits', () => {
      const wave = generator.generateWave(200);
      const totalEnemies = wave.enemies.reduce((sum, config) => sum + config.count, 0);
      
      expect(totalEnemies).toBeLessThanOrEqual(80); // maxEnemyCount
    });

    it('should have minimum spawn delay', () => {
      const wave = generator.generateWave(100);
      
      wave.enemies.forEach(enemyConfig => {
        expect(enemyConfig.spawnDelay).toBeGreaterThanOrEqual(500); // minSpawnDelay
      });
    });

    it('should increase enemy count logarithmically', () => {
      const wave1 = generator.generateWave(1);
      const wave10 = generator.generateWave(10);
      const wave30 = generator.generateWave(30);
      const wave50 = generator.generateWave(50);
      
      const count1 = wave1.enemies.reduce((sum, e) => sum + e.count, 0);
      const count10 = wave10.enemies.reduce((sum, e) => sum + e.count, 0);
      const count30 = wave30.enemies.reduce((sum, e) => sum + e.count, 0);
      const count50 = wave50.enemies.reduce((sum, e) => sum + e.count, 0);
      
      expect(count1).toBeLessThan(count10);
      expect(count10).toBeLessThan(count30);
      expect(count30).toBeLessThan(count50);
      expect(count50).toBeLessThanOrEqual(80);
    });
  });

  describe('enemy mix', () => {
    it('should only spawn BASIC enemies in early waves', () => {
      const wave1 = generator.generateWave(1);
      const wave2 = generator.generateWave(2);
      const wave3 = generator.generateWave(3);
      
      [wave1, wave2, wave3].forEach(wave => {
        wave.enemies.forEach(config => {
          expect(config.type).toBe(EnemyType.BASIC);
        });
      });
    });

    it('should introduce FAST enemies in waves 4-7', () => {
      const wave5 = generator.generateWave(5);
      const types = wave5.enemies.map(e => e.type);
      
      expect(types).toContain(EnemyType.BASIC);
      expect(types).toContain(EnemyType.FAST);
      expect(types).not.toContain(EnemyType.TANK);
    });

    it('should include all enemy types in later waves', () => {
      const wave20 = generator.generateWave(20);
      const types = new Set(wave20.enemies.map(e => e.type));
      
      expect(types.has(EnemyType.BASIC)).toBe(true);
      expect(types.has(EnemyType.FAST)).toBe(true);
      expect(types.has(EnemyType.TANK)).toBe(true);
    });
  });

  describe('special waves', () => {
    it('should create boss waves every 10 waves', () => {
      const wave20 = generator.generateWave(20);
      const wave30 = generator.generateWave(30);
      const wave40 = generator.generateWave(40);
      
      [wave20, wave30, wave40].forEach(wave => {
        const behavior = generator.getSpecialBehavior(wave.waveNumber);
        expect(behavior).toBe('boss_wave');
        
        // Boss waves should have more tanks
        const tankCount = wave.enemies
          .filter(e => e.type === EnemyType.TANK)
          .reduce((sum, e) => sum + e.count, 0);
        const totalCount = wave.enemies.reduce((sum, e) => sum + e.count, 0);
        
        // Boss waves should have significant tank presence
        // Wave 20 is in the 16-25 range (25% tanks)
        // Wave 30+ are boss waves (60% tanks)
        const expectedTankRatio = wave.waveNumber <= 25 ? 0.25 : 0.6;
        expect(tankCount / totalCount).toBeCloseTo(expectedTankRatio, 1);
      });
    });

    it('should create swarm waves on waves ending in 5', () => {
      const wave15 = generator.generateWave(15);
      const wave25 = generator.generateWave(25);
      
      [wave15, wave25].forEach(wave => {
        const behavior = generator.getSpecialBehavior(wave.waveNumber);
        expect(behavior).toBe('swarm_wave');
        
        // Swarm waves should have more enemies
        const totalCount = wave.enemies.reduce((sum, e) => sum + e.count, 0);
        const normalWave = generator.generateWave(wave.waveNumber - 1);
        const normalCount = normalWave.enemies.reduce((sum, e) => sum + e.count, 0);
        
        expect(totalCount).toBeGreaterThan(normalCount);
      });
    });

    it('should apply health modifiers for special waves', () => {
      // Swarm wave enemies should be weaker
      const swarmMult = generator.getEnemyHealthMultiplier(15);
      const normalMult = generator.getEnemyHealthMultiplier(14);
      expect(swarmMult).toBeLessThan(normalMult);
      
      // Elite wave enemies should be stronger
      const eliteMult = generator.getEnemyHealthMultiplier(17);
      const normalMult2 = generator.getEnemyHealthMultiplier(16);
      expect(eliteMult).toBeGreaterThan(normalMult2);
    });
  });

  describe('spawn patterns', () => {
    it('should progress through spawn patterns', () => {
      const wave1 = generator.generateWave(1);
      const wave10 = generator.generateWave(10);
      const wave25 = generator.generateWave(25);
      const wave50 = generator.generateWave(50);
      
      expect(wave1.spawnPattern).toBe(SpawnPattern.SINGLE_POINT);
      expect(wave10.spawnPattern).toBe(SpawnPattern.DISTRIBUTED);
      expect(wave25.spawnPattern).toBe(SpawnPattern.ADAPTIVE_SPAWN); // Wave 25 = floor(24/3) = 8
      expect(wave50.spawnPattern).toBe(SpawnPattern.CHAOS_MODE);
    });
  });

  describe('rewards', () => {
    it('should calculate wave rewards with scaling', () => {
      const reward1 = generator.calculateWaveReward(1);
      const reward10 = generator.calculateWaveReward(10);
      const reward30 = generator.calculateWaveReward(30);
      const reward50 = generator.calculateWaveReward(50);
      
      expect(reward1).toBe(8); // 5*1 + floor(10*log10(2)) = 5 + 3 = 8
      expect(reward10).toBe(120); // (5*10 + floor(10*log10(11))) * 2 = (50 + 10) * 2 = 120
      expect(reward30).toBe(328); // (5*30 + floor(10*log10(31))) * 2 = (150 + 14) * 2 = 328
      expect(reward50).toBe(534); // (5*50 + floor(10*log10(51))) * 2 = (250 + 17) * 2 = 534
    });

    it('should double rewards on milestone waves', () => {
      const reward9 = generator.calculateWaveReward(9);
      const reward10 = generator.calculateWaveReward(10);
      const reward11 = generator.calculateWaveReward(11);
      
      expect(reward10).toBeGreaterThan(reward9 * 1.8); // Should be about double
      expect(reward10).toBeGreaterThan(reward11 * 1.8); // Milestone bonus
    });
  });

  describe('wave descriptions', () => {
    it('should provide appropriate descriptions for special waves', () => {
      expect(generator.getWaveDescription(10)).toContain('Boss');
      expect(generator.getWaveDescription(15)).toContain('Swarm');
      expect(generator.getWaveDescription(17)).toContain('Elite');
      expect(generator.getWaveDescription(13)).toContain('Speed');
      expect(generator.getWaveDescription(11)).toBe('Wave 11');
    });
  });

  describe('custom configuration', () => {
    it('should accept custom configuration', () => {
      const customGenerator = new InfiniteWaveGenerator({
        healthScalingRate: 0.3,
        maxEnemyCount: 50,
        minSpawnDelay: 1000,
      });
      
      const wave = customGenerator.generateWave(50);
      const totalEnemies = wave.enemies.reduce((sum, e) => sum + e.count, 0);
      
      expect(totalEnemies).toBeLessThanOrEqual(50);
      wave.enemies.forEach(config => {
        expect(config.spawnDelay).toBeGreaterThanOrEqual(1000);
      });
    });
  });
});