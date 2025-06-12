import type { MapGenerationConfig, BiomeType, MapSize, MapDifficulty, DecorationLevel } from '../types/MapData';
import type { EnemyType, EnemyBehavior } from '../entities/Enemy';
import type { TowerType } from '../entities/Tower';
import type { PlayerUpgradeType } from '../entities/Player';

// Core game configuration that contains all customizable settings
export interface GameConfiguration {
  // Map Settings
  mapSettings: MapConfiguration;
  
  // Gameplay Settings  
  gameplaySettings: GameplayConfiguration;
  
  // Enemy & Wave Settings
  enemySettings: EnemyConfiguration;
  
  // Player & Economy Settings
  playerSettings: PlayerConfiguration;
  
  // Audio & Visual Settings
  audioVisualSettings: AudioVisualConfiguration;
  
  // Advanced Settings
  advancedSettings: AdvancedConfiguration;
  
  // Metadata
  metadata: ConfigurationMetadata;
}

export interface MapConfiguration {
  // Basic Map Properties
  size: MapSize;
  customSize?: { width: number; height: number };
  biome: BiomeType | 'RANDOM';
  seed?: number;
  
  // Generation Parameters
  pathComplexity: number;        // 0-1
  decorationLevel: DecorationLevel;
  obstacleCountMultiplier: number; // 0.5-2.0
  
  // Strategic Features
  chokePointMultiplier: number;  // 0.5-2.0
  openAreaMultiplier: number;    // 0.5-2.0
  advantageSpotMultiplier: number; // 0.5-2.0
  
  // Visual Features
  enableWater: boolean;
  enableAnimations: boolean;
  heightVariation: number;       // 0-1
  
  // Preview Settings
  generatePreview: boolean;
  previewCount: number;          // Number of preview variants to generate
}

export interface GameplayConfiguration {
  // Core Difficulty
  overallDifficulty: GameDifficulty;
  
  // Starting Resources
  startingLives: number;         // 1-50
  startingCurrency: number;      // 50-500
  startingScore: number;         // Usually 0
  
  // Economic Settings
  resourceGenerationRate: number; // 0.5-3.0 multiplier
  towerCostMultiplier: number;   // 0.5-2.0
  upgradeCostMultiplier: number; // 0.5-2.0
  enemyRewardMultiplier: number; // 0.5-3.0
  
  // Game Rules
  enableFriendlyFire: boolean;
  autoPauseOnLowLives: boolean;
  lowLivesThreshold: number;     // Lives remaining to trigger auto-pause
  
  // Victory/Defeat Conditions
  victoryCondition: VictoryCondition;
  defeatCondition: DefeatCondition;
  customVictoryValue?: number;   // For score/time based victory
  customDefeatValue?: number;    // For time limit defeat
}

export interface EnemyConfiguration {
  // Wave Settings
  waveCount: number;            // 5-20
  waveIntensityScaling: WaveScaling;
  betweenWaveDelay: number;     // 1-10 seconds
  autoStartWaves: boolean;
  
  // Enemy Behavior
  aiDifficulty: AIDifficulty;
  enemySpeedMultiplier: number; // 0.5-2.0
  enemyHealthMultiplier: number; // 0.5-3.0
  enemyDamageMultiplier: number; // 0.5-2.0
  spawnRateMultiplier: number;  // 0.5-2.0
  
  // Boss Settings
  enableBossEnemies: boolean;
  bossFrequency: number;        // Every N waves
  bossHealthMultiplier: number; // 2.0-5.0
  
  // Enemy Types
  enabledEnemyTypes: EnemyType[];
  customEnemyStats: Partial<Record<EnemyType, CustomEnemyStats>>;
  
  // Special Abilities
  enableEnemyAbilities: boolean;
  abilityFrequency: number;     // 0-1 chance per enemy
}

export interface PlayerConfiguration {
  // Starting Stats
  startingHealth: number;       // 50-200
  startingSpeed: number;        // 50-200% of default
  startingDamage: number;       // 50-150% of default
  startingFireRate: number;     // 50-150% of default
  
  // Progression Settings
  upgradePointsPerLevel: number; // 1-5
  maxUpgradeLevels: Record<PlayerUpgradeType, number>; // 3-10 per stat
  experienceGainRate: number;   // 0.5-3.0
  
  // Special Abilities
  enableDashAbility: boolean;
  dashCooldown: number;         // milliseconds
  enableShieldAbility: boolean;
  shieldDuration: number;       // milliseconds
  enableAutoRegeneration: boolean;
  regenRate: number;           // HP per second
  regenDelay: number;          // Delay after taking damage
  
  // Movement & Controls
  movementAcceleration: number; // 0.5-2.0
  mouseControlSensitivity: number; // 0.5-2.0
}

export interface AudioVisualConfiguration {
  // Audio Settings
  masterVolume: number;         // 0-100
  musicVolume: number;          // 0-100
  sfxVolume: number;           // 0-100
  voiceVolume: number;         // 0-100
  audioQuality: AudioQuality;
  
  // Visual Effects
  particleDensity: VisualQuality;
  enableScreenShake: boolean;
  screenShakeIntensity: number; // 0-100
  enableDamageNumbers: boolean;
  enableProjectileTrails: boolean;
  enableUIAnimations: boolean;
  
  // Performance Settings
  targetFPS: number;           // 30/60/120/0 (unlimited)
  qualityPreset: VisualQuality;
  textureQuality: VisualQuality;
  enableVSync: boolean;
}

export interface AdvancedConfiguration {
  // Debug Options
  showFPSCounter: boolean;
  showDebugGrid: boolean;
  showPerformanceMetrics: boolean;
  enableDeveloperConsole: boolean;
  showCollisionBoxes: boolean;
  showPathfinding: boolean;
  
  // Experimental Features
  enableExperimentalFeatures: boolean;
  enableAdvancedAI: boolean;
  enablePhysicsEnhancements: boolean;
  enableNewGameModes: boolean;
  
  // Technical Settings
  enableMultithreading: boolean;
  memoryOptimization: boolean;
  precisionMode: boolean;       // Higher precision calculations
  customSeed: string;          // Global random seed override
}

export interface ConfigurationMetadata {
  name: string;
  description: string;
  author: string;
  version: string;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  isDefault: boolean;
  difficulty: 'Beginner' | 'Standard' | 'Veteran' | 'Chaos' | 'Custom';
}

// Supporting Types and Enums

export enum GameDifficulty {
  BEGINNER = 'BEGINNER',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXTREME = 'EXTREME',
  NIGHTMARE = 'NIGHTMARE',
  CUSTOM = 'CUSTOM'
}

export enum VictoryCondition {
  SURVIVE_ALL_WAVES = 'SURVIVE_ALL_WAVES',
  REACH_SCORE = 'REACH_SCORE',
  SURVIVE_TIME = 'SURVIVE_TIME',
  KILL_COUNT = 'KILL_COUNT'
}

export enum DefeatCondition {
  LOSE_ALL_LIVES = 'LOSE_ALL_LIVES',
  TIME_LIMIT = 'TIME_LIMIT',
  PLAYER_DEATH = 'PLAYER_DEATH'
}

export enum WaveScaling {
  LINEAR = 'LINEAR',
  EXPONENTIAL = 'EXPONENTIAL',
  LOGARITHMIC = 'LOGARITHMIC',
  CUSTOM = 'CUSTOM'
}

export enum AIDifficulty {
  PASSIVE = 'PASSIVE',
  NORMAL = 'NORMAL',
  AGGRESSIVE = 'AGGRESSIVE',
  ADAPTIVE = 'ADAPTIVE',
  PREDICTIVE = 'PREDICTIVE'
}

export enum AudioQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA'
}

export enum VisualQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA'
}

export interface CustomEnemyStats {
  healthMultiplier: number;     // 0.5-3.0
  speedMultiplier: number;      // 0.5-2.0
  damageMultiplier: number;     // 0.5-2.0
  rewardMultiplier: number;     // 0.5-3.0
  behaviorOverride?: EnemyBehavior;
}

// Configuration Preset Categories
export type ConfigurationPreset = 'BEGINNER' | 'STANDARD' | 'VETERAN' | 'CHAOS' | 'PERFORMANCE' | 'CUSTOM';

// Validation Result for configuration
export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  balanceScore: number;         // 0-1, how balanced the configuration is
  difficultyRating: number;     // 0-10, estimated difficulty
  performanceImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

// Export utility type for partial configuration updates
export type PartialGameConfiguration = {
  [K in keyof GameConfiguration]?: Partial<GameConfiguration[K]>;
} & { metadata?: Partial<ConfigurationMetadata> };