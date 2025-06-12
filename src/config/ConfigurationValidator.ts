import type { GameConfiguration, ConfigurationValidation, GameDifficulty } from './GameConfiguration';
import { MapSize, MAP_SIZE_PRESETS } from '../types/MapData';

export class ConfigurationValidator {
  
  validate(config: GameConfiguration): ConfigurationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Validate map settings
    this.validateMapSettings(config, errors, warnings, recommendations);
    
    // Validate gameplay settings
    this.validateGameplaySettings(config, errors, warnings, recommendations);
    
    // Validate enemy settings
    this.validateEnemySettings(config, errors, warnings, recommendations);
    
    // Validate player settings
    this.validatePlayerSettings(config, errors, warnings, recommendations);
    
    // Validate audio/visual settings
    this.validateAudioVisualSettings(config, errors, warnings, recommendations);
    
    // Calculate balance and difficulty scores
    const balanceScore = this.calculateBalanceScore(config);
    const difficultyRating = this.calculateDifficultyRating(config);
    const performanceImpact = this.calculatePerformanceImpact(config);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
      balanceScore,
      difficultyRating,
      performanceImpact
    };
  }
  
  private validateMapSettings(config: GameConfiguration, errors: string[], warnings: string[], recommendations: string[]): void {
    const map = config.mapSettings;
    
    // Validate custom size if specified
    if (map.size === MapSize.MEDIUM && map.customSize) {
      if (map.customSize.width < 10 || map.customSize.width > 100) {
        errors.push('Custom map width must be between 10 and 100 cells');
      }
      if (map.customSize.height < 8 || map.customSize.height > 80) {
        errors.push('Custom map height must be between 8 and 80 cells');
      }
    }
    
    // Validate ranges
    if (map.pathComplexity < 0 || map.pathComplexity > 1) {
      errors.push('Path complexity must be between 0 and 1');
    }
    
    if (map.obstacleCountMultiplier < 0.1 || map.obstacleCountMultiplier > 3.0) {
      errors.push('Obstacle count multiplier must be between 0.1 and 3.0');
    }
    
    if (map.heightVariation < 0 || map.heightVariation > 1) {
      errors.push('Height variation must be between 0 and 1');
    }
    
    // Performance warnings
    if (map.size === MapSize.HUGE && map.decorationLevel === 'DENSE') {
      warnings.push('Huge maps with dense decorations may impact performance');
    }
    
    // Recommendations
    if (map.pathComplexity > 0.8 && map.chokePointMultiplier > 1.5) {
      recommendations.push('Very complex paths with many choke points may be frustrating for new players');
    }
    
    if (map.pathComplexity < 0.3) {
      recommendations.push('Consider increasing path complexity for more strategic gameplay');
    }
  }
  
  private validateGameplaySettings(config: GameConfiguration, errors: string[], warnings: string[], recommendations: string[]): void {
    const gameplay = config.gameplaySettings;
    
    // Validate ranges
    if (gameplay.startingLives < 1 || gameplay.startingLives > 50) {
      errors.push('Starting lives must be between 1 and 50');
    }
    
    if (gameplay.startingCurrency < 10 || gameplay.startingCurrency > 1000) {
      errors.push('Starting currency must be between 10 and 1000');
    }
    
    if (gameplay.resourceGenerationRate < 0.1 || gameplay.resourceGenerationRate > 5.0) {
      errors.push('Resource generation rate must be between 0.1 and 5.0');
    }
    
    if (gameplay.towerCostMultiplier < 0.1 || gameplay.towerCostMultiplier > 3.0) {
      errors.push('Tower cost multiplier must be between 0.1 and 3.0');
    }
    
    // Balance warnings
    if (gameplay.startingLives > 20 && gameplay.towerCostMultiplier < 0.8) {
      warnings.push('High starting lives with cheap towers may make the game too easy');
    }
    
    if (gameplay.startingLives < 5 && gameplay.towerCostMultiplier > 1.5) {
      warnings.push('Low starting lives with expensive towers may make the game too difficult');
    }
    
    // Recommendations
    if (gameplay.lowLivesThreshold >= gameplay.startingLives) {
      recommendations.push('Low lives threshold should be less than starting lives');
    }
  }
  
  private validateEnemySettings(config: GameConfiguration, errors: string[], warnings: string[], recommendations: string[]): void {
    const enemy = config.enemySettings;
    
    // Validate ranges
    if (enemy.waveCount < 3 || enemy.waveCount > 50) {
      errors.push('Wave count must be between 3 and 50');
    }
    
    if (enemy.betweenWaveDelay < 0.5 || enemy.betweenWaveDelay > 30) {
      errors.push('Between wave delay must be between 0.5 and 30 seconds');
    }
    
    if (enemy.enemySpeedMultiplier < 0.1 || enemy.enemySpeedMultiplier > 3.0) {
      errors.push('Enemy speed multiplier must be between 0.1 and 3.0');
    }
    
    if (enemy.enemyHealthMultiplier < 0.1 || enemy.enemyHealthMultiplier > 5.0) {
      errors.push('Enemy health multiplier must be between 0.1 and 5.0');
    }
    
    if (enemy.enabledEnemyTypes.length === 0) {
      errors.push('At least one enemy type must be enabled');
    }
    
    // Balance warnings
    const totalEnemyMultiplier = enemy.enemySpeedMultiplier * enemy.enemyHealthMultiplier * enemy.spawnRateMultiplier;
    if (totalEnemyMultiplier > 6.0) {
      warnings.push('Combined enemy multipliers are very high - gameplay may be extremely difficult');
    }
    
    if (totalEnemyMultiplier < 0.5) {
      warnings.push('Combined enemy multipliers are very low - gameplay may be too easy');
    }
    
    // Boss settings validation
    if (enemy.enableBossEnemies && enemy.bossFrequency > enemy.waveCount) {
      warnings.push('Boss frequency is higher than wave count - no bosses will appear');
    }
  }
  
  private validatePlayerSettings(config: GameConfiguration, errors: string[], warnings: string[], recommendations: string[]): void {
    const player = config.playerSettings;
    
    // Validate ranges
    if (player.startingHealth < 25 || player.startingHealth > 500) {
      errors.push('Starting health must be between 25 and 500');
    }
    
    if (player.startingSpeed < 25 || player.startingSpeed > 300) {
      errors.push('Starting speed must be between 25% and 300%');
    }
    
    if (player.experienceGainRate < 0.1 || player.experienceGainRate > 5.0) {
      errors.push('Experience gain rate must be between 0.1 and 5.0');
    }
    
    // Validate upgrade levels
    Object.values(player.maxUpgradeLevels).forEach(level => {
      if (level < 1 || level > 20) {
        errors.push('Max upgrade levels must be between 1 and 20');
      }
    });
    
    // Balance recommendations
    if (player.startingHealth > 200 && player.enableAutoRegeneration && player.regenRate > 3) {
      recommendations.push('High health with fast regeneration may make the game too easy');
    }
    
    if (player.upgradePointsPerLevel > 3 && player.experienceGainRate > 2.0) {
      recommendations.push('High upgrade points with fast experience gain may cause rapid power progression');
    }
  }
  
  private validateAudioVisualSettings(config: GameConfiguration, errors: string[], warnings: string[], recommendations: string[]): void {
    const av = config.audioVisualSettings;
    
    // Validate volume ranges
    [av.masterVolume, av.musicVolume, av.sfxVolume, av.voiceVolume].forEach((volume, index) => {
      if (volume < 0 || volume > 100) {
        const volumeTypes = ['Master', 'Music', 'SFX', 'Voice'];
        errors.push(`${volumeTypes[index]} volume must be between 0 and 100`);
      }
    });
    
    // Performance warnings
    if (av.targetFPS > 60 && av.qualityPreset === 'ULTRA') {
      warnings.push('High FPS target with ultra quality may impact performance');
    }
    
    if (av.particleDensity === 'ULTRA' && config.mapSettings.size === MapSize.HUGE) {
      warnings.push('Ultra particle density on huge maps may cause performance issues');
    }
    
    // Recommendations
    if (av.targetFPS === 30 && av.qualityPreset === 'HIGH') {
      recommendations.push('Consider increasing FPS target to 60 for smoother gameplay');
    }
  }
  
  private calculateBalanceScore(config: GameConfiguration): number {
    let score = 1.0;
    
    // Penalize extreme settings
    const gameplay = config.gameplaySettings;
    const enemy = config.enemySettings;
    const player = config.playerSettings;
    
    // Check resource balance
    const resourceRatio = gameplay.startingCurrency / (gameplay.towerCostMultiplier * 100);
    if (resourceRatio > 3.0 || resourceRatio < 0.5) {
      score -= 0.2;
    }
    
    // Check enemy-player balance
    const enemyPower = enemy.enemyHealthMultiplier * enemy.enemySpeedMultiplier * enemy.enemyDamageMultiplier;
    const playerPower = (player.startingHealth / 100) * (player.startingDamage / 100) * (player.startingSpeed / 100);
    const powerRatio = enemyPower / playerPower;
    
    if (powerRatio > 2.5 || powerRatio < 0.4) {
      score -= 0.3;
    }
    
    // Check progression balance
    if (player.experienceGainRate > 2.0 && player.upgradePointsPerLevel > 2) {
      score -= 0.1;
    }
    
    return Math.max(0, score);
  }
  
  private calculateDifficultyRating(config: GameConfiguration): number {
    let difficulty = 5; // Base difficulty
    
    const gameplay = config.gameplaySettings;
    const enemy = config.enemySettings;
    const player = config.playerSettings;
    const map = config.mapSettings;
    
    // Adjust based on starting resources
    difficulty += (10 - gameplay.startingLives) * 0.2;
    difficulty += (100 - gameplay.startingCurrency) * 0.01;
    
    // Adjust based on enemy strength
    const enemyMultiplier = enemy.enemyHealthMultiplier * enemy.enemySpeedMultiplier * enemy.enemyDamageMultiplier;
    difficulty += (enemyMultiplier - 1) * 2;
    
    // Adjust based on map complexity
    difficulty += map.pathComplexity * 2;
    difficulty += (map.chokePointMultiplier - 1) * 1.5;
    
    // Adjust based on player power
    const playerPower = (player.startingHealth + player.startingDamage + player.startingSpeed) / 300;
    difficulty -= (playerPower - 1) * 2;
    
    return Math.max(0, Math.min(10, difficulty));
  }
  
  private calculatePerformanceImpact(config: GameConfiguration): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    let score = 0;
    
    const map = config.mapSettings;
    const av = config.audioVisualSettings;
    const enemy = config.enemySettings;
    
    // Map size impact
    if (map.size === MapSize.HUGE) score += 3;
    else if (map.size === MapSize.LARGE) score += 2;
    else if (map.size === MapSize.MEDIUM) score += 1;
    
    // Visual quality impact
    if (av.qualityPreset === 'ULTRA') score += 3;
    else if (av.qualityPreset === 'HIGH') score += 2;
    else if (av.qualityPreset === 'MEDIUM') score += 1;
    
    if (av.particleDensity === 'ULTRA') score += 2;
    else if (av.particleDensity === 'HIGH') score += 1;
    
    // Animation and effects impact
    if (map.enableAnimations) score += 1;
    if (av.enableProjectileTrails) score += 1;
    if (av.enableScreenShake) score += 0.5;
    
    // Enemy count impact
    if (enemy.spawnRateMultiplier > 1.5) score += 2;
    else if (enemy.spawnRateMultiplier > 1.2) score += 1;
    
    // FPS target impact (inverse)
    if (av.targetFPS > 60) score += 1;
    
    if (score >= 8) return 'EXTREME';
    if (score >= 6) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }
  
  // Quick validation for specific settings
  validateMapSize(size: MapSize, customSize?: { width: number; height: number }): string[] {
    const errors: string[] = [];
    
    if (size === MapSize.MEDIUM && customSize) {
      if (customSize.width < 10 || customSize.width > 100) {
        errors.push('Custom width must be between 10 and 100');
      }
      if (customSize.height < 8 || customSize.height > 80) {
        errors.push('Custom height must be between 8 and 80');
      }
    }
    
    return errors;
  }
  
  validateRange(value: number, min: number, max: number, name: string): string[] {
    const errors: string[] = [];
    
    if (value < min || value > max) {
      errors.push(`${name} must be between ${min} and ${max}`);
    }
    
    return errors;
  }
}

// Singleton instance
export const configurationValidator = new ConfigurationValidator();