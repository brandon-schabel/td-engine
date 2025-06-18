# Infinite Wave System Implementation Guide

## Overview

This guide shows how to integrate the infinite wave system with the existing codebase.

## 1. Create InfiniteWaveGenerator Class

```typescript
// src/systems/InfiniteWaveGenerator.ts

import type { WaveConfig, EnemySpawn } from '@/types/wave';
import { EnemyType } from '@/types/enemies';
import { SpawnPattern } from '@/types/wave';

export class InfiniteWaveGenerator {
  private config = {
    healthScalingRate: 0.5,
    damageScalingRate: 0.3,
    enemyCountScalingRate: 12,
    spawnDelayScalingRate: 0.1,
    maxEnemyCount: 80,
    minSpawnDelay: 0.5,
    baseRewardPerWave: 5,
    rewardScalingBonus: 10,
    milestoneMultiplier: 2,
    primaryPlateau: 50,
    secondaryPlateau: 100,
  };

  generateWave(waveNumber: number): WaveConfig {
    const difficultyScore = this.calculateDifficultyScore(waveNumber);
    const enemyCount = this.calculateEnemyCount(waveNumber);
    const enemyMix = this.getEnemyMix(waveNumber);
    const enemies = this.generateEnemies(enemyCount, enemyMix, waveNumber);
    const spawnPattern = this.getSpawnPattern(waveNumber);
    const spawnDelay = this.calculateSpawnDelay(waveNumber);
    
    return {
      enemies,
      spawnPattern,
      spawnDelay,
      specialBehavior: this.getSpecialBehavior(waveNumber),
    };
  }

  private calculateDifficultyScore(waveNumber: number): number {
    return 10 + (20 * Math.log10(waveNumber + 9));
  }

  private calculateEnemyCount(waveNumber: number): number {
    const baseCount = 8 + Math.floor(this.config.enemyCountScalingRate * Math.log10(waveNumber + 1));
    return Math.min(baseCount, this.config.maxEnemyCount);
  }

  private calculateSpawnDelay(waveNumber: number): number {
    const delay = 2.0 - (this.config.spawnDelayScalingRate * Math.log10(waveNumber));
    return Math.max(delay, this.config.minSpawnDelay);
  }

  getEnemyHealthMultiplier(waveNumber: number): number {
    const baseMultiplier = 1 + (this.config.healthScalingRate * Math.log10(waveNumber));
    return this.applyDifficultyPlateau(baseMultiplier, waveNumber);
  }

  getEnemyDamageMultiplier(waveNumber: number): number {
    const baseMultiplier = 1 + (this.config.damageScalingRate * Math.log10(waveNumber));
    return this.applyDifficultyPlateau(baseMultiplier, waveNumber);
  }

  calculateWaveReward(waveNumber: number): number {
    const baseReward = this.config.baseRewardPerWave * waveNumber;
    const scalingBonus = Math.floor(this.config.rewardScalingBonus * Math.log10(waveNumber + 1));
    let reward = baseReward + scalingBonus;
    
    if (waveNumber % 10 === 0) {
      reward *= this.config.milestoneMultiplier;
    }
    
    return reward;
  }

  private applyDifficultyPlateau(value: number, waveNumber: number): number {
    if (waveNumber <= this.config.primaryPlateau) {
      return value;
    } else if (waveNumber <= this.config.secondaryPlateau) {
      return value * 0.5;
    } else {
      return value * 0.25;
    }
  }

  private getEnemyMix(waveNumber: number): Record<EnemyType, number> {
    // Implementation as shown in plan
  }

  private generateEnemies(count: number, mix: Record<EnemyType, number>, waveNumber: number): EnemySpawn[] {
    // Generate enemy list based on mix ratios
  }

  private getSpawnPattern(waveNumber: number): SpawnPattern {
    // Implementation as shown in plan
  }

  private getSpecialBehavior(waveNumber: number): string | undefined {
    if (waveNumber % 10 === 0) return 'boss_wave';
    if (waveNumber % 10 === 5) return 'swarm_wave';
    if (waveNumber % 10 === 7) return 'elite_wave';
    if (waveNumber % 10 === 3) return 'speed_wave';
    return undefined;
  }
}
```

## 2. Modify WaveManager

```typescript
// In src/systems/WaveManager.ts

import { InfiniteWaveGenerator } from './InfiniteWaveGenerator';

export class WaveManager {
  private infiniteWaveGenerator?: InfiniteWaveGenerator;
  
  constructor(private game: Game) {
    super();
    // After wave 10, use infinite generator
    if (this.game.gameConfig.enableInfiniteWaves) {
      this.infiniteWaveGenerator = new InfiniteWaveGenerator();
    }
  }

  getWaveConfig(waveNumber: number): WaveConfig | null {
    // Use predefined waves for 1-10
    if (waveNumber <= 10) {
      return this.waves[waveNumber - 1] || null;
    }
    
    // Use infinite generator for 11+
    if (this.infiniteWaveGenerator) {
      return this.infiniteWaveGenerator.generateWave(waveNumber);
    }
    
    return null;
  }

  // Modify spawnEnemy to apply scaling
  private spawnEnemy(enemySpawn: EnemySpawn): void {
    const position = this.getSpawnPosition(enemySpawn.spawnPoint);
    if (!position) return;

    const enemy = this.createEnemy(enemySpawn.type, position);
    
    // Apply infinite wave scaling
    if (this.currentWave > 10 && this.infiniteWaveGenerator) {
      const healthMultiplier = this.infiniteWaveGenerator.getEnemyHealthMultiplier(this.currentWave);
      const damageMultiplier = this.infiniteWaveGenerator.getEnemyDamageMultiplier(this.currentWave);
      
      enemy.maxHealth *= healthMultiplier;
      enemy.health *= healthMultiplier;
      enemy.damage *= damageMultiplier;
    }
    
    this.game.addEntity(enemy);
  }
}
```

## 3. Update Game Configuration

```typescript
// In src/config/GameConfig.ts

export interface GameConfig {
  // ... existing config
  enableInfiniteWaves: boolean;
  infiniteWaveStartAt: number; // Default: 11
}

// In src/config/ConfigurationPresets.ts

export const WAVE_PRESETS = {
  CLASSIC: {
    enableInfiniteWaves: false,
    infiniteWaveStartAt: 11,
  },
  INFINITE: {
    enableInfiniteWaves: true,
    infiniteWaveStartAt: 11,
  },
  INFINITE_ONLY: {
    enableInfiniteWaves: true,
    infiniteWaveStartAt: 1,
  },
};
```

## 4. Update Game Class

```typescript
// In src/core/Game.ts

private completeWave(): void {
  const waveReward = this.calculateWaveReward();
  this.player.addCurrency(waveReward);
  
  // Show wave complete notification
  this.ui.showNotification(`Wave ${this.currentWave} Complete! +${waveReward} credits`);
  
  // Check for infinite waves
  if (this.currentWave >= 10 && !this.gameConfig.enableInfiniteWaves) {
    this.gameOver(true); // Victory
  } else {
    this.currentWave++;
    this.startNextWave();
  }
}

private calculateWaveReward(): number {
  if (this.currentWave > 10 && this.waveManager.infiniteWaveGenerator) {
    return this.waveManager.infiniteWaveGenerator.calculateWaveReward(this.currentWave);
  }
  
  // Default rewards for waves 1-10
  return this.currentWave * 10;
}
```

## 5. Create Tests

```typescript
// test/systems/InfiniteWaveGenerator.test.ts

describe('InfiniteWaveGenerator', () => {
  let generator: InfiniteWaveGenerator;
  
  beforeEach(() => {
    generator = new InfiniteWaveGenerator();
  });
  
  describe('scaling formulas', () => {
    it('should scale health logarithmically', () => {
      expect(generator.getEnemyHealthMultiplier(1)).toBeCloseTo(1.0);
      expect(generator.getEnemyHealthMultiplier(10)).toBeCloseTo(1.5);
      expect(generator.getEnemyHealthMultiplier(30)).toBeCloseTo(1.74);
      expect(generator.getEnemyHealthMultiplier(50)).toBeCloseTo(1.85);
    });
    
    it('should apply difficulty plateaus', () => {
      const mult50 = generator.getEnemyHealthMultiplier(50);
      const mult51 = generator.getEnemyHealthMultiplier(51);
      expect(mult51).toBeLessThan(mult50 * 1.01); // Very slow growth after 50
    });
  });
  
  describe('wave generation', () => {
    it('should generate valid waves', () => {
      const wave = generator.generateWave(25);
      expect(wave.enemies.length).toBeGreaterThan(0);
      expect(wave.enemies.length).toBeLessThanOrEqual(80);
      expect(wave.spawnDelay).toBeGreaterThanOrEqual(0.5);
    });
    
    it('should include boss enemies every 10 waves', () => {
      const wave = generator.generateWave(30);
      const hasBoss = wave.enemies.some(e => e.type === EnemyType.BOSS);
      expect(hasBoss).toBe(true);
    });
  });
});
```

## 6. UI Updates

```typescript
// Add wave preview for infinite waves
interface WavePreview {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: EnemyType[];
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Extreme';
  reward: number;
  specialEvent?: string;
}

// In UI system, show upcoming wave info
class UI {
  showWavePreview(preview: WavePreview): void {
    // Display wave information before it starts
  }
}
```

## Testing Checklist

1. ✓ Unit test all scaling formulas
2. ✓ Integration test wave generation
3. ✓ Performance test with 200+ waves
4. ✓ Balance test key checkpoints (1, 10, 30, 50, 100)
5. ✓ UI test wave preview and rewards
6. ✓ Regression test existing waves 1-10

## Configuration Tuning

After implementation, these values can be adjusted in `InfiniteWaveConfig`:

- `healthScalingRate`: Lower = enemies stay weaker longer
- `enemyCountScalingRate`: Lower = fewer enemies per wave  
- `maxEnemyCount`: Prevent performance issues
- `rewardScalingBonus`: Higher = more currency in late game

Monitor player progression and adjust these values to ensure wave 50 remains achievable for skilled players.