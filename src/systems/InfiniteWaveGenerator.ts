/**
 * File: InfiniteWaveGenerator.ts
 * Recent Changes:
 * 1. Initial implementation of infinite wave generation system
 * 2. Added logarithmic scaling formulas for difficulty progression
 * 3. Implemented enemy mix ratios and spawn patterns
 * 4. Added special wave behaviors (boss, swarm, elite, speed)
 * 5. Created reward scaling with milestone bonuses
 */

import type { WaveConfig, EnemySpawnConfig } from './WaveManager';
import { SpawnPattern } from './WaveManager';
import { EnemyType } from '@/entities/Enemy';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';

export interface InfiniteWaveGeneratorConfig {
  healthScalingRate: number;
  damageScalingRate: number;
  enemyCountScalingRate: number;
  spawnDelayScalingRate: number;
  maxEnemyCount: number;
  minSpawnDelay: number;
  baseRewardPerWave: number;
  rewardScalingBonus: number;
  milestoneMultiplier: number;
  primaryPlateau: number;
  secondaryPlateau: number;
  bossWaveInterval: number;
  swarmWaveInterval: number;
  eliteWaveInterval: number;
}

export class InfiniteWaveGenerator {
  private config: InfiniteWaveGeneratorConfig = {
    healthScalingRate: 0.5,
    damageScalingRate: 0.3,
    enemyCountScalingRate: 12,
    spawnDelayScalingRate: 0.1,
    maxEnemyCount: 80,
    minSpawnDelay: 500,
    baseRewardPerWave: 5,
    rewardScalingBonus: 10,
    milestoneMultiplier: 2,
    primaryPlateau: 50,
    secondaryPlateau: 100,
    bossWaveInterval: 10,
    swarmWaveInterval: 5,
    eliteWaveInterval: 7,
  };

  constructor(config?: Partial<InfiniteWaveGeneratorConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  generateWave(waveNumber: number): WaveConfig {
    const enemyCount = this.calculateEnemyCount(waveNumber);
    const enemyMix = this.getEnemyMix(waveNumber);
    const enemies = this.generateEnemies(enemyCount, enemyMix, waveNumber);
    const spawnPattern = this.getSpawnPattern(waveNumber);
    const startDelay = GAMEPLAY_CONSTANTS.waves.infiniteWaveDelay;

    return {
      waveNumber,
      enemies,
      startDelay,
      spawnPattern,
    };
  }

  calculateDifficultyScore(waveNumber: number): number {
    return 10 + (20 * Math.log10(waveNumber + 9));
  }

  private calculateEnemyCount(waveNumber: number): number {
    const specialBehavior = this.getSpecialBehavior(waveNumber);
    let baseCount = GAMEPLAY_CONSTANTS.waves.infinite.baseEnemyCount + Math.floor(this.config.enemyCountScalingRate * Math.log10(waveNumber + 1));
    
    // Adjust for special waves
    if (specialBehavior === 'swarm_wave') {
      baseCount = Math.floor(baseCount * GAMEPLAY_CONSTANTS.waves.infinite.swarmMultiplier);
    } else if (specialBehavior === 'elite_wave') {
      baseCount = Math.floor(baseCount * GAMEPLAY_CONSTANTS.waves.infinite.eliteReduction);
    }
    
    return Math.min(baseCount, this.config.maxEnemyCount);
  }

  private calculateSpawnDelay(waveNumber: number): number {
    const delay = 2000 - (this.config.spawnDelayScalingRate * 1000 * Math.log10(waveNumber));
    return Math.max(delay, this.config.minSpawnDelay);
  }

  getEnemyHealthMultiplier(waveNumber: number): number {
    const baseMultiplier = 1 + (this.config.healthScalingRate * Math.log10(waveNumber));
    const adjusted = this.applyDifficultyPlateau(baseMultiplier, waveNumber);
    
    // Special wave adjustments
    const specialBehavior = this.getSpecialBehavior(waveNumber);
    if (specialBehavior === 'swarm_wave') {
      return adjusted * GAMEPLAY_CONSTANTS.waves.infinite.swarmHealthMultiplier;
    } else if (specialBehavior === 'elite_wave') {
      return adjusted * GAMEPLAY_CONSTANTS.waves.infinite.eliteHealthMultiplier;
    }
    
    return adjusted;
  }

  getEnemyDamageMultiplier(waveNumber: number): number {
    const baseMultiplier = 1 + (this.config.damageScalingRate * Math.log10(waveNumber));
    return this.applyDifficultyPlateau(baseMultiplier, waveNumber);
  }

  calculateWaveReward(waveNumber: number): number {
    const baseReward = this.config.baseRewardPerWave * waveNumber;
    const scalingBonus = Math.floor(this.config.rewardScalingBonus * Math.log10(waveNumber + 1));
    let reward = baseReward + scalingBonus;
    
    // Milestone bonuses
    if (waveNumber % 10 === 0) {
      reward *= this.config.milestoneMultiplier;
    }
    
    return reward;
  }

  private applyDifficultyPlateau(value: number, waveNumber: number): number {
    if (waveNumber <= this.config.primaryPlateau) {
      return value;
    } else if (waveNumber <= this.config.secondaryPlateau) {
      // Reduce scaling rate by half after primary plateau
      const excess = value - 1;
      return 1 + (excess * 0.5);
    } else {
      // Reduce scaling rate to quarter after secondary plateau
      const excess = value - 1;
      return 1 + (excess * 0.25);
    }
  }

  private getEnemyMix(waveNumber: number): Partial<Record<EnemyType, number>> {
    const specialBehavior = this.getSpecialBehavior(waveNumber);
    
    // Special wave behaviors
    if (specialBehavior === 'speed_wave' && waveNumber > 3) {
      return { [EnemyType.FAST]: 1.0 };
    }
    
    // Progressive enemy introduction
    if (waveNumber <= 3) {
      return { [EnemyType.BASIC]: 1.0 };
    }
    
    if (waveNumber <= 7) {
      return { 
        [EnemyType.BASIC]: 0.7, 
        [EnemyType.FAST]: 0.3 
      };
    }
    
    if (waveNumber <= 15) {
      return { 
        [EnemyType.BASIC]: 0.5, 
        [EnemyType.FAST]: 0.35, 
        [EnemyType.TANK]: 0.15 
      };
    }
    
    // Note: FLYING and BOSS types are not yet implemented in the codebase
    // For now, we'll use the three available types
    if (waveNumber <= 25) {
      return { 
        [EnemyType.BASIC]: 0.4, 
        [EnemyType.FAST]: 0.35, 
        [EnemyType.TANK]: 0.25 
      };
    }
    
    // Wave 26+ with boss waves
    const bossWave = waveNumber % this.config.bossWaveInterval === 0;
    if (bossWave) {
      // Boss waves have more tanks (acting as mini-bosses)
      return { 
        [EnemyType.BASIC]: 0.2, 
        [EnemyType.FAST]: 0.2, 
        [EnemyType.TANK]: 0.6 
      };
    }
    
    // Standard late game mix
    return { 
      [EnemyType.BASIC]: 0.35, 
      [EnemyType.FAST]: 0.35, 
      [EnemyType.TANK]: 0.3 
    };
  }

  private generateEnemies(
    totalCount: number, 
    mix: Partial<Record<EnemyType, number>>, 
    waveNumber: number
  ): EnemySpawnConfig[] {
    const enemies: EnemySpawnConfig[] = [];
    const spawnDelay = this.calculateSpawnDelay(waveNumber);
    
    // Calculate count for each enemy type
    const enemyCounts: Partial<Record<EnemyType, number>> = {};
    let assignedCount = 0;
    
    const types = Object.keys(mix) as EnemyType[];
    types.forEach((type, index) => {
      const ratio = mix[type];
      if (ratio === undefined) return;
      
      const count = index === types.length - 1 
        ? totalCount - assignedCount // Assign remaining to last type
        : Math.floor(totalCount * ratio);
      
      if (count > 0) {
        enemyCounts[type] = count;
        assignedCount += count;
      }
    });
    
    // Create spawn configs
    Object.entries(enemyCounts).forEach(([type, count]) => {
      enemies.push({
        type: type as EnemyType,
        count: count as number,
        spawnDelay,
      });
    });
    
    return enemies;
  }

  private getSpawnPattern(waveNumber: number): SpawnPattern {
    const patterns: SpawnPattern[] = [
      SpawnPattern.SINGLE_POINT,      // Waves 1-2
      SpawnPattern.RANDOM,            // Waves 3-5
      SpawnPattern.ROUND_ROBIN,       // Waves 6-8
      SpawnPattern.DISTRIBUTED,       // Waves 9-12
      SpawnPattern.EDGE_FOCUSED,      // Waves 13-16
      SpawnPattern.CORNER_FOCUSED,    // Waves 17-20
      SpawnPattern.BURST_SPAWN,       // Waves 21-25
      SpawnPattern.PINCER_MOVEMENT,   // Waves 26-30
      SpawnPattern.ADAPTIVE_SPAWN,    // Waves 31-40
      SpawnPattern.CHAOS_MODE         // Waves 41+
    ];
    
    // Progress through patterns based on wave number
    const patternIndex = Math.min(
      Math.floor((waveNumber - 1) / 3), 
      patterns.length - 1
    );
    
    return patterns[patternIndex];
  }

  getSpecialBehavior(waveNumber: number): string | undefined {
    if (waveNumber % this.config.bossWaveInterval === 0) return 'boss_wave';
    if (waveNumber % 10 === 5) return 'swarm_wave';
    if (waveNumber % 10 === 7) return 'elite_wave';
    if (waveNumber % 10 === 3) return 'speed_wave';
    return undefined;
  }

  getWaveDescription(waveNumber: number): string {
    const specialBehavior = this.getSpecialBehavior(waveNumber);
    
    switch (specialBehavior) {
      case 'boss_wave':
        return 'Boss Wave - Heavily armored enemies!';
      case 'swarm_wave':
        return 'Swarm Wave - Many weak enemies!';
      case 'elite_wave':
        return 'Elite Wave - Few but powerful enemies!';
      case 'speed_wave':
        return 'Speed Wave - Fast enemies incoming!';
      default:
        return `Wave ${waveNumber}`;
    }
  }
}