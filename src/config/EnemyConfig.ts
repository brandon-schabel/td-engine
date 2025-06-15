/**
 * Enemy-specific configuration constants
 * Centralizes all enemy statistics and behavior values
 */

// Enemy behavior types
export enum EnemyBehavior {
  PLAYER_FOCUSED = 'PLAYER_FOCUSED',    // Goes for player
  TOWER_FOCUSED = 'TOWER_FOCUSED',      // Prioritizes towers
  OPPORTUNIST = 'OPPORTUNIST'           // Attacks whatever is closer
}

// Enemy base statistics
export const ENEMY_STATS = {
  BASIC: {
    health: 50,
    speed: 50,
    radius: 8,
    reward: 10,
    damage: 10,
    attackRange: 20,
    attackCooldown: 1000, // 1 attack per second
    towerDetectionRange: 60,
    behavior: EnemyBehavior.OPPORTUNIST,
    color: '#FF5252'  // Red
  },
  FAST: {
    health: 30,
    speed: 100,
    radius: 6,
    reward: 15,
    damage: 5,
    attackRange: 15,
    attackCooldown: 500, // 2 attacks per second
    towerDetectionRange: 40,
    behavior: EnemyBehavior.PLAYER_FOCUSED,
    color: '#FFC107'  // Amber
  },
  TANK: {
    health: 200,
    speed: 25,
    radius: 12,
    reward: 50,
    damage: 20,
    attackRange: 25,
    attackCooldown: 2000, // 0.5 attacks per second
    towerDetectionRange: 80,
    behavior: EnemyBehavior.TOWER_FOCUSED,
    color: '#9C27B0'  // Purple
  },
  FLYING: {
    health: 40,
    speed: 75,
    radius: 10,
    reward: 25,
    damage: 15,
    attackRange: 20,
    attackCooldown: 750,
    towerDetectionRange: 50,
    behavior: EnemyBehavior.PLAYER_FOCUSED,
    color: '#03A9F4'  // Light Blue
  },
  BOSS: {
    health: 1000,
    speed: 20,
    radius: 20,
    reward: 100,
    damage: 50,
    attackRange: 30,
    attackCooldown: 1500,
    towerDetectionRange: 100,
    behavior: EnemyBehavior.OPPORTUNIST,
    color: '#F44336'  // Deep Red
  }
} as const;

// Enemy behavior configuration
export const ENEMY_BEHAVIOR = {
  waypointReachedThreshold: 5, // pixels
  towerAttackPriorityMultiplier: 1.2, // Prioritize enemies within tower range * this multiplier
  pathfindingUpdateInterval: 500, // milliseconds
  stuckDetectionThreshold: 2, // pixels moved in update interval
  stuckRetryAttempts: 3
} as const;

// Enemy visual configuration
export const ENEMY_VISUALS = {
  healthBarOffset: 15,
  healthBarWidth: 28,
  healthBarHeight: 5,
  damageFlashDuration: 100, // milliseconds
  damageFlashColor: '#FFFFFF',
  deathAnimationDuration: 300, // milliseconds
  bossGlowRadius: 10,
  bossGlowColor: 'rgba(255, 0, 0, 0.5)'
} as const;

// Enemy spawn configuration
export const ENEMY_SPAWN = {
  spawnAnimationDuration: 500, // milliseconds
  spawnOffset: 20, // pixels from spawn point
  formationSpacing: 30, // pixels between enemies in formation
  waveSpawnDelay: 1000 // milliseconds between enemy spawns in a wave
} as const;