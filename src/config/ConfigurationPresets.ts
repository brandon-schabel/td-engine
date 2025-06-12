import type { GameConfiguration } from './GameConfiguration';
import { GameDifficulty, VictoryCondition, DefeatCondition, WaveScaling, AIDifficulty, AudioQuality, VisualQuality } from './GameConfiguration';
import { BiomeType, MapSize, MapDifficulty, DecorationLevel } from '../types/MapData';
import { EnemyType } from '../entities/Enemy';
import { PlayerUpgradeType } from '../entities/Player';

// Smart default configuration generator
export function createDefaultConfiguration(): GameConfiguration {
  return {
    mapSettings: {
      size: MapSize.MEDIUM,
      biome: 'RANDOM',
      seed: undefined,
      pathComplexity: 0.75,
      decorationLevel: DecorationLevel.DENSE,
      obstacleCountMultiplier: 1.0,
      chokePointMultiplier: 1.0,
      openAreaMultiplier: 1.0,
      advantageSpotMultiplier: 1.0,
      enableWater: true,
      enableAnimations: true,
      heightVariation: 0.3,
      generatePreview: true,
      previewCount: 3
    },
    
    gameplaySettings: {
      overallDifficulty: GameDifficulty.MEDIUM,
      startingLives: 10,
      startingCurrency: 100,
      startingScore: 0,
      resourceGenerationRate: 1.0,
      towerCostMultiplier: 1.0,
      upgradeCostMultiplier: 1.0,
      enemyRewardMultiplier: 1.0,
      enableFriendlyFire: false,
      autoPauseOnLowLives: true,
      lowLivesThreshold: 3,
      victoryCondition: VictoryCondition.SURVIVE_ALL_WAVES,
      defeatCondition: DefeatCondition.LOSE_ALL_LIVES
    },
    
    enemySettings: {
      waveCount: 10,
      waveIntensityScaling: WaveScaling.LINEAR,
      betweenWaveDelay: 3,
      autoStartWaves: false,
      aiDifficulty: AIDifficulty.NORMAL,
      enemySpeedMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      enableBossEnemies: true,
      bossFrequency: 5,
      bossHealthMultiplier: 3.0,
      enabledEnemyTypes: [EnemyType.BASIC, EnemyType.FAST, EnemyType.TANK],
      customEnemyStats: {},
      enableEnemyAbilities: true,
      abilityFrequency: 0.2
    },
    
    playerSettings: {
      startingHealth: 100,
      startingSpeed: 100,
      startingDamage: 100,
      startingFireRate: 100,
      upgradePointsPerLevel: 2,
      maxUpgradeLevels: {
        [PlayerUpgradeType.DAMAGE]: 5,
        [PlayerUpgradeType.SPEED]: 5,
        [PlayerUpgradeType.FIRE_RATE]: 5,
        [PlayerUpgradeType.HEALTH]: 5,
        [PlayerUpgradeType.REGENERATION]: 5
      },
      experienceGainRate: 1.0,
      enableDashAbility: true,
      dashCooldown: 3000,
      enableShieldAbility: false,
      shieldDuration: 2000,
      enableAutoRegeneration: true,
      regenRate: 2,
      regenDelay: 5000,
      movementAcceleration: 1.0,
      mouseControlSensitivity: 1.0
    },
    
    audioVisualSettings: {
      masterVolume: 70,
      musicVolume: 60,
      sfxVolume: 80,
      voiceVolume: 70,
      audioQuality: AudioQuality.HIGH,
      particleDensity: VisualQuality.HIGH,
      enableScreenShake: true,
      screenShakeIntensity: 50,
      enableDamageNumbers: true,
      enableProjectileTrails: true,
      enableUIAnimations: true,
      targetFPS: 60,
      qualityPreset: VisualQuality.HIGH,
      textureQuality: VisualQuality.HIGH,
      enableVSync: true
    },
    
    advancedSettings: {
      showFPSCounter: false,
      showDebugGrid: false,
      showPerformanceMetrics: false,
      enableDeveloperConsole: false,
      showCollisionBoxes: false,
      showPathfinding: false,
      enableExperimentalFeatures: false,
      enableAdvancedAI: false,
      enablePhysicsEnhancements: false,
      enableNewGameModes: false,
      enableMultithreading: true,
      memoryOptimization: true,
      precisionMode: false,
      customSeed: ''
    },
    
    metadata: {
      name: 'Standard Configuration',
      description: 'Balanced settings for an enjoyable tower defense experience',
      author: 'System',
      version: '1.0.0',
      createdAt: new Date(),
      lastModified: new Date(),
      tags: ['default', 'balanced', 'standard'],
      isDefault: true,
      difficulty: 'Standard'
    }
  };
}

// Beginner-friendly preset
export function createBeginnerConfiguration(): GameConfiguration {
  const config = createDefaultConfiguration();
  
  // Make it easier for beginners
  config.mapSettings.size = MapSize.SMALL;
  config.mapSettings.pathComplexity = 0.5;
  config.mapSettings.decorationLevel = DecorationLevel.MODERATE;
  config.mapSettings.chokePointMultiplier = 0.7;
  
  config.gameplaySettings.overallDifficulty = GameDifficulty.EASY;
  config.gameplaySettings.startingLives = 15;
  config.gameplaySettings.startingCurrency = 150;
  config.gameplaySettings.towerCostMultiplier = 0.8;
  config.gameplaySettings.enemyRewardMultiplier = 1.3;
  
  config.enemySettings.waveCount = 8;
  config.enemySettings.enemySpeedMultiplier = 0.8;
  config.enemySettings.enemyHealthMultiplier = 0.8;
  config.enemySettings.spawnRateMultiplier = 0.8;
  config.enemySettings.enableBossEnemies = false;
  config.enemySettings.enableEnemyAbilities = false;
  
  config.playerSettings.startingHealth = 120;
  config.playerSettings.upgradePointsPerLevel = 3;
  config.playerSettings.experienceGainRate = 1.5;
  
  config.metadata = {
    ...config.metadata,
    name: 'Beginner Configuration',
    description: 'Easy settings perfect for learning the game mechanics',
    difficulty: 'Beginner',
    tags: ['beginner', 'easy', 'learning']
  };
  
  return config;
}

// Veteran player preset
export function createVeteranConfiguration(): GameConfiguration {
  const config = createDefaultConfiguration();
  
  // Make it challenging for experienced players
  config.mapSettings.size = MapSize.LARGE;
  config.mapSettings.pathComplexity = 0.9;
  config.mapSettings.decorationLevel = DecorationLevel.DENSE;
  config.mapSettings.chokePointMultiplier = 1.3;
  config.mapSettings.obstacleCountMultiplier = 1.2;
  
  config.gameplaySettings.overallDifficulty = GameDifficulty.HARD;
  config.gameplaySettings.startingLives = 7;
  config.gameplaySettings.startingCurrency = 80;
  config.gameplaySettings.towerCostMultiplier = 1.2;
  config.gameplaySettings.upgradeCostMultiplier = 1.3;
  config.gameplaySettings.enemyRewardMultiplier = 0.9;
  
  config.enemySettings.waveCount = 15;
  config.enemySettings.waveIntensityScaling = WaveScaling.EXPONENTIAL;
  config.enemySettings.aiDifficulty = AIDifficulty.AGGRESSIVE;
  config.enemySettings.enemySpeedMultiplier = 1.2;
  config.enemySettings.enemyHealthMultiplier = 1.3;
  config.enemySettings.enemyDamageMultiplier = 1.2;
  config.enemySettings.spawnRateMultiplier = 1.2;
  config.enemySettings.bossFrequency = 3;
  config.enemySettings.bossHealthMultiplier = 4.0;
  config.enemySettings.abilityFrequency = 0.4;
  
  config.playerSettings.startingHealth = 80;
  config.playerSettings.upgradePointsPerLevel = 1;
  config.playerSettings.experienceGainRate = 0.8;
  config.playerSettings.regenRate = 1;
  config.playerSettings.regenDelay = 8000;
  
  config.metadata = {
    ...config.metadata,
    name: 'Veteran Configuration',
    description: 'Challenging settings for experienced tower defense players',
    difficulty: 'Veteran',
    tags: ['veteran', 'hard', 'challenging']
  };
  
  return config;
}

// Chaos mode - randomized extreme settings
export function createChaosConfiguration(): GameConfiguration {
  const config = createDefaultConfiguration();
  
  // Randomize many settings for unpredictable gameplay
  const random = Math.random;
  
  const mapSizes = [MapSize.SMALL, MapSize.MEDIUM, MapSize.LARGE, MapSize.HUGE];
  config.mapSettings.size = mapSizes[Math.floor(random() * mapSizes.length)] || MapSize.MEDIUM;
  config.mapSettings.biome = 'RANDOM';
  config.mapSettings.pathComplexity = 0.3 + random() * 0.7;
  const decorationLevels = [DecorationLevel.MINIMAL, DecorationLevel.MODERATE, DecorationLevel.DENSE];
  config.mapSettings.decorationLevel = decorationLevels[Math.floor(random() * decorationLevels.length)] || DecorationLevel.MODERATE;
  config.mapSettings.obstacleCountMultiplier = 0.5 + random() * 1.5;
  config.mapSettings.chokePointMultiplier = 0.5 + random() * 1.5;
  
  config.gameplaySettings.overallDifficulty = GameDifficulty.CUSTOM;
  config.gameplaySettings.startingLives = 5 + Math.floor(random() * 15);
  config.gameplaySettings.startingCurrency = 60 + Math.floor(random() * 200);
  config.gameplaySettings.towerCostMultiplier = 0.6 + random() * 1.4;
  config.gameplaySettings.enemyRewardMultiplier = 0.7 + random() * 1.6;
  
  config.enemySettings.waveCount = 8 + Math.floor(random() * 12);
  const waveScalings = [WaveScaling.LINEAR, WaveScaling.EXPONENTIAL, WaveScaling.LOGARITHMIC];
  config.enemySettings.waveIntensityScaling = waveScalings[Math.floor(random() * waveScalings.length)] || WaveScaling.LINEAR;
  config.enemySettings.enemySpeedMultiplier = 0.7 + random() * 1.3;
  config.enemySettings.enemyHealthMultiplier = 0.7 + random() * 2.3;
  config.enemySettings.spawnRateMultiplier = 0.7 + random() * 1.3;
  config.enemySettings.enableBossEnemies = random() > 0.3;
  config.enemySettings.bossFrequency = 3 + Math.floor(random() * 5);
  
  config.playerSettings.startingHealth = 60 + Math.floor(random() * 100);
  config.playerSettings.startingSpeed = 70 + Math.floor(random() * 80);
  config.playerSettings.upgradePointsPerLevel = 1 + Math.floor(random() * 4);
  config.playerSettings.enableDashAbility = random() > 0.4;
  config.playerSettings.enableShieldAbility = random() > 0.6;
  
  config.metadata = {
    ...config.metadata,
    name: 'Chaos Configuration',
    description: 'Randomized extreme settings for unpredictable gameplay',
    difficulty: 'Chaos',
    tags: ['chaos', 'random', 'extreme', 'unpredictable']
  };
  
  return config;
}

// Performance-optimized preset for lower-end devices
export function createPerformanceConfiguration(): GameConfiguration {
  const config = createDefaultConfiguration();
  
  // Optimize for performance
  config.mapSettings.size = MapSize.SMALL;
  config.mapSettings.decorationLevel = DecorationLevel.MINIMAL;
  config.mapSettings.enableAnimations = false;
  config.mapSettings.heightVariation = 0.1;
  
  config.audioVisualSettings.particleDensity = VisualQuality.LOW;
  config.audioVisualSettings.enableScreenShake = false;
  config.audioVisualSettings.enableProjectileTrails = false;
  config.audioVisualSettings.enableUIAnimations = false;
  config.audioVisualSettings.targetFPS = 30;
  config.audioVisualSettings.qualityPreset = VisualQuality.LOW;
  config.audioVisualSettings.textureQuality = VisualQuality.LOW;
  config.audioVisualSettings.enableVSync = false;
  
  config.enemySettings.enableEnemyAbilities = false;
  config.enemySettings.spawnRateMultiplier = 0.8;
  
  config.advancedSettings.memoryOptimization = true;
  config.advancedSettings.enableMultithreading = false;
  
  config.metadata = {
    ...config.metadata,
    name: 'Performance Configuration',
    description: 'Optimized settings for smooth gameplay on lower-end devices',
    difficulty: 'Standard',
    tags: ['performance', 'optimized', 'low-end']
  };
  
  return config;
}

// All preset configurations
export const CONFIGURATION_PRESETS = {
  BEGINNER: createBeginnerConfiguration,
  STANDARD: createDefaultConfiguration,
  VETERAN: createVeteranConfiguration,
  CHAOS: createChaosConfiguration,
  PERFORMANCE: createPerformanceConfiguration
} as const;

// Preset metadata for UI display
export const PRESET_METADATA = {
  BEGINNER: {
    name: 'Beginner',
    description: 'Perfect for learning the game',
    difficulty: 1,
    icon: '🌱',
    color: '#4CAF50'
  },
  STANDARD: {
    name: 'Standard',
    description: 'Balanced gameplay experience',
    difficulty: 3,
    icon: '⚖️',
    color: '#2196F3'
  },
  VETERAN: {
    name: 'Veteran',
    description: 'Challenging for experienced players',
    difficulty: 5,
    icon: '🏆',
    color: '#FF9800'
  },
  CHAOS: {
    name: 'Chaos',
    description: 'Randomized extreme settings',
    difficulty: 4,
    icon: '🎲',
    color: '#9C27B0'
  },
  PERFORMANCE: {
    name: 'Performance',
    description: 'Optimized for smooth gameplay',
    difficulty: 2,
    icon: '⚡',
    color: '#607D8B'
  }
} as const;