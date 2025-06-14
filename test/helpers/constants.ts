import { TowerType, UpgradeType } from '@/entities/Tower';
import { EnemyType } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { WaveConfig } from '@/systems/WaveManager';

// Common test positions
export const TEST_POSITIONS = {
  CENTER: { x: 400, y: 300 },
  TOP_LEFT: { x: 50, y: 50 },
  TOP_RIGHT: { x: 750, y: 50 },
  BOTTOM_LEFT: { x: 50, y: 550 },
  BOTTOM_RIGHT: { x: 750, y: 550 },
  SPAWN_POINT: { x: 0, y: 9 },
  EXIT_POINT: { x: 24, y: 9 }
} as const;

// Grid positions for tower placement testing
export const GRID_POSITIONS = {
  SAFE_SPOTS: [
    { x: 3, y: 3 },
    { x: 6, y: 6 },
    { x: 9, y: 9 },
    { x: 12, y: 12 },
    { x: 15, y: 15 }
  ],
  PATH_SPOTS: [
    { x: 0, y: 9 },
    { x: 5, y: 9 },
    { x: 10, y: 9 },
    { x: 15, y: 9 },
    { x: 24, y: 9 }
  ]
} as const;

// Standard test game resources
export const TEST_RESOURCES = {
  POOR: { currency: 10, lives: 5, score: 0 },
  NORMAL: { currency: 100, lives: 10, score: 0 },
  RICH: { currency: 1000, lives: 20, score: 1000 },
  UNLIMITED: { currency: 999999, lives: 999, score: 0 }
} as const;

// Common tower configurations
export const TOWER_CONFIGS = {
  BASIC_L1: { type: TowerType.BASIC, level: 1, cost: 20 },
  BASIC_L3: { type: TowerType.BASIC, level: 3, cost: 20 },
  SNIPER_L1: { type: TowerType.SNIPER, level: 1, cost: 50 },
  SNIPER_L5: { type: TowerType.SNIPER, level: 5, cost: 50 },
  RAPID_L2: { type: TowerType.RAPID, level: 2, cost: 30 },
  RAPID_MAXED: { type: TowerType.RAPID, level: 5, cost: 30 }
} as const;

// Enemy test data
export const ENEMY_CONFIGS = {
  WEAK_BASIC: { type: EnemyType.BASIC, health: 25, reward: 5 },
  NORMAL_BASIC: { type: EnemyType.BASIC, health: 100, reward: 10 },
  STRONG_BASIC: { type: EnemyType.BASIC, health: 200, reward: 20 },
  FAST_SCOUT: { type: EnemyType.FAST, health: 50, reward: 15 },
  TANK_HEAVY: { type: EnemyType.TANK, health: 500, reward: 50 }
} as const;

// Pre-defined wave configurations for testing
export const WAVE_CONFIGS = {
  TUTORIAL: [
    {
      waveNumber: 1,
      enemies: [{ type: EnemyType.BASIC, count: 3, spawnDelay: 2000 }],
      startDelay: 1000
    }
  ] as WaveConfig[],
  
  BASIC_PROGRESSION: [
    {
      waveNumber: 1,
      enemies: [{ type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }],
      startDelay: 1000
    },
    {
      waveNumber: 2,
      enemies: [
        { type: EnemyType.BASIC, count: 3, spawnDelay: 800 },
        { type: EnemyType.FAST, count: 2, spawnDelay: 600 }
      ],
      startDelay: 2000
    },
    {
      waveNumber: 3,
      enemies: [
        { type: EnemyType.BASIC, count: 8, spawnDelay: 500 },
        { type: EnemyType.FAST, count: 4, spawnDelay: 400 },
        { type: EnemyType.TANK, count: 1, spawnDelay: 3000 }
      ],
      startDelay: 2000
    }
  ] as WaveConfig[],
  
  STRESS_TEST: [
    {
      waveNumber: 1,
      enemies: [
        { type: EnemyType.BASIC, count: 50, spawnDelay: 100 },
        { type: EnemyType.FAST, count: 25, spawnDelay: 80 },
        { type: EnemyType.TANK, count: 10, spawnDelay: 500 }
      ],
      startDelay: 500
    }
  ] as WaveConfig[]
} as const;

// Standard map paths for testing
export const TEST_PATHS = {
  STRAIGHT_HORIZONTAL: [
    { x: 0, y: 9 },
    { x: 24, y: 9 }
  ],
  
  SIMPLE_L_SHAPE: [
    { x: 0, y: 9 },
    { x: 12, y: 9 },
    { x: 12, y: 5 },
    { x: 24, y: 5 }
  ],
  
  ZIGZAG: [
    { x: 0, y: 9 },
    { x: 6, y: 9 },
    { x: 6, y: 5 },
    { x: 12, y: 5 },
    { x: 12, y: 13 },
    { x: 18, y: 13 },
    { x: 18, y: 9 },
    { x: 24, y: 9 }
  ],
  
  COMPLEX_SPIRAL: [
    { x: 0, y: 9 },
    { x: 8, y: 9 },
    { x: 8, y: 5 },
    { x: 16, y: 5 },
    { x: 16, y: 13 },
    { x: 6, y: 13 },
    { x: 6, y: 7 },
    { x: 14, y: 7 },
    { x: 14, y: 11 },
    { x: 24, y: 11 }
  ]
} as const;

// Common upgrade sequences for testing
export const UPGRADE_SEQUENCES = {
  DAMAGE_FOCUS: [
    UpgradeType.DAMAGE,
    UpgradeType.DAMAGE,
    UpgradeType.DAMAGE,
    UpgradeType.RANGE,
    UpgradeType.FIRE_RATE
  ],
  
  BALANCED: [
    UpgradeType.DAMAGE,
    UpgradeType.RANGE,
    UpgradeType.FIRE_RATE,
    UpgradeType.DAMAGE,
    UpgradeType.RANGE
  ],
  
  RANGE_SNIPER: [
    UpgradeType.RANGE,
    UpgradeType.RANGE,
    UpgradeType.DAMAGE,
    UpgradeType.RANGE,
    UpgradeType.DAMAGE
  ],
  
  RAPID_FIRE: [
    UpgradeType.FIRE_RATE,
    UpgradeType.FIRE_RATE,
    UpgradeType.FIRE_RATE,
    UpgradeType.DAMAGE,
    UpgradeType.DAMAGE
  ]
} as const;

// Map generation test configs
export const MAP_CONFIGS = {
  TINY: { width: 10, height: 8, cellSize: 32 },
  SMALL: { width: 15, height: 12, cellSize: 32 },
  NORMAL: { width: 25, height: 19, cellSize: 32 },
  LARGE: { width: 40, height: 30, cellSize: 32 },
  HUGE: { width: 60, height: 45, cellSize: 32 }
} as const;

// Performance test scenarios
export const PERFORMANCE_SCENARIOS = {
  LIGHT_LOAD: {
    towers: 5,
    enemies: 10,
    projectiles: 15,
    updateFrequency: 60
  },
  
  MEDIUM_LOAD: {
    towers: 20,
    enemies: 50,
    projectiles: 100,
    updateFrequency: 60
  },
  
  HEAVY_LOAD: {
    towers: 100,
    enemies: 200,
    projectiles: 500,
    updateFrequency: 60
  },
  
  STRESS_LOAD: {
    towers: 300,
    enemies: 1000,
    projectiles: 2000,
    updateFrequency: 60
  }
} as const;

// Time constants for testing
export const TIME_CONSTANTS = {
  FRAME_16MS: 16,
  FRAME_33MS: 33,
  ONE_SECOND: 1000,
  FIVE_SECONDS: 5000,
  TOWER_COOLDOWN_BASIC: 1000,
  TOWER_COOLDOWN_RAPID: 250,
  TOWER_COOLDOWN_SNIPER: 2000,
  ENEMY_ATTACK_COOLDOWN: 1000,
  HEAL_COOLDOWN: 20000
} as const;

// Distance and range constants
export const DISTANCE_CONSTANTS = {
  TOWER_RANGE_BASIC: 100,
  TOWER_RANGE_SNIPER: 200,
  TOWER_RANGE_RAPID: 80,
  ENEMY_ATTACK_RANGE: 20,
  CELL_SIZE: 32,
  TOLERANCE_POSITION: 1,
  TOLERANCE_VELOCITY: 0.1
} as const;