import type { WaveConfig } from '@/systems/WaveManager';

// Game initialization constants
export const GAME_INIT = {
  startingCurrency: 100,
  startingLives: 10,
  startingScore: 0,
  startingWave: 1,
  maxLives: 20,
  difficultyMultipliers: {
    easy: { currency: 1.5, lives: 1.5 },
    normal: { currency: 1.0, lives: 1.0 },
    hard: { currency: 0.7, lives: 0.7 }
  }
} as const;

// Tower costs - avoid circular dependency by using string keys
export const TOWER_COSTS = {
  'BASIC': 30,
  'SNIPER': 75,
  'RAPID': 45,
  'WALL': 15
} as const;

// Player stats
export const BASE_PLAYER_STATS = {
  damage: 11,
  speed: 120, // pixels per second
  fireRate: 1.5, // shots per second
  health: 75,
  radius: 12
} as const;

// Game mechanics constants
export const GAME_MECHANICS = {
  projectileSpeed: 400,
  towerProjectileSpeed: 300,
  healAbilityCooldown: 20000, // 20 seconds
  damageRegenCooldown: 3000, // 3 seconds before regeneration
  regenInterval: 1000, // Regenerate every second
  
  // Score mechanics
  scoreMultipliers: {
    baseKill: 10,
    comboMultiplier: 1.5,
    perfectWaveBonus: 500,
    speedBonus: 100,
  },
  
  // Game loop and timing
  targetFPS: 60,
  maxDeltaTime: 100, // Max ms between frames
  pauseTransitionTime: 200,
  
  // Difficulty progression
  difficultyScaling: {
    waveInterval: 5, // Difficulty increases every 5 waves
    healthIncrease: 1.2,
    speedIncrease: 1.1,
    rewardIncrease: 1.15,
  }
} as const;

// NOTE: Inventory configuration has been moved to InventoryConfig.ts

// Infinite wave configuration
export const INFINITE_WAVE_CONFIG = {
  enabled: true, // Enable infinite waves
  startAt: 11, // Start infinite waves after wave 10
  scaling: {
    healthScalingRate: 0.5,
    damageScalingRate: 0.3,
    enemyCountScalingRate: 12,
    spawnDelayScalingRate: 0.1,
    maxEnemyCount: 80,
    minSpawnDelay: 500,
  },
  rewards: {
    baseRewardPerWave: 5,
    rewardScalingBonus: 10,
    milestoneMultiplier: 2,
  },
  difficulty: {
    primaryPlateau: 50, // First difficulty plateau
    secondaryPlateau: 100, // Second difficulty plateau
  },
  specialWaves: {
    bossWaveInterval: 10,
    swarmWaveInterval: 5,
    eliteWaveInterval: 7,
  }
} as const;


// Audio positioning and effects
export const AUDIO_CONFIG = {
  listenerOffset: { x: 600, y: 400 },
  spatialFalloff: 1.0,
  defaultVolume: 0.7
} as const;

// Currency and rewards
export const CURRENCY_CONFIG = {
  powerUpBonus: 50,
  extraDropMultiplier: 2,
  baseRewardMultiplier: 5 // For score calculation
} as const;

// Visual and color constants
export const COLOR_CONFIG = {
  health: {
    high: '#4CAF50',    // >60% health
    medium: '#FF9800',  // 30-60% health
    low: '#F44336'      // <30% health
  },
  towers: {
    basic: { hue: 120, saturation: 60 },    // Green
    sniper: { hue: 210, saturation: 60 },   // Blue
    rapid: { hue: 35, saturation: 60 }      // Orange
  },
  upgradeDots: ['#FF4444', '#44FF44', '#4444FF'], // Red, Green, Blue
  ui: {
    currency: '#FFD700',
    lives: '#FF4444',
    score: '#4CAF50',
    wave: '#2196F3'
  }
} as const;
