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
    health: 75,
    speed: 30,  // Reduced from 50 (40% reduction)
    radius: 8,
    reward: 7,
    experience: 10,  // Base experience for killing this enemy
    damage: 13,
    attackRange: 20,
    attackCooldown: 1000, // 1 attack per second
    towerDetectionRange: 60,
    behavior: EnemyBehavior.OPPORTUNIST,
    color: '#FF5252'  // Red
  },
  FAST: {
    health: 45,
    speed: 60,  // Reduced from 100 (40% reduction)
    radius: 6,
    reward: 10,
    experience: 15,  // Higher experience for faster enemies
    damage: 7,
    attackRange: 15,
    attackCooldown: 500, // 2 attacks per second
    towerDetectionRange: 40,
    behavior: EnemyBehavior.PLAYER_FOCUSED,
    color: '#FFC107'  // Amber
  },
  TANK: {
    health: 300,
    speed: 15,  // Reduced from 25 (40% reduction)
    radius: 12,
    reward: 35,
    experience: 25,  // Good experience for tough enemies
    damage: 26,
    attackRange: 25,
    attackCooldown: 2000, // 0.5 attacks per second
    towerDetectionRange: 80,
    behavior: EnemyBehavior.TOWER_FOCUSED,
    color: '#9C27B0'  // Purple
  },
  FLYING: {
    health: 60,
    speed: 45,  // Reduced from 75 (40% reduction)
    radius: 10,
    reward: 17,
    experience: 20,  // Decent experience for flying enemies
    damage: 20,
    attackRange: 20,
    attackCooldown: 750,
    towerDetectionRange: 50,
    behavior: EnemyBehavior.PLAYER_FOCUSED,
    color: '#03A9F4'  // Light Blue
  },
  BOSS: {
    health: 1500,
    speed: 12,  // Reduced from 20 (40% reduction)
    radius: 20,
    reward: 70,
    experience: 50,  // High experience for boss enemies
    damage: 65,
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
  stuckRetryAttempts: 3,
  // Smooth movement parameters
  steeringRate: 5.0, // How quickly enemies adjust their velocity
  arrivalSlowingDistance: 50, // Distance at which enemies start slowing down
  maxSteeringForce: 150, // Maximum steering force for smooth movement
  wallFollowAngle: Math.PI / 4, // Angle to follow walls when stuck
  obstacleAvoidanceDistance: 40, // Distance to check for obstacles (increased from 30)
  obstacleAvoidanceAngles: 12, // Number of directions to check for obstacles (increased from 8)
  // Pathfinding obstacle avoidance
  minObstacleDistanceMultiplier: 5.0, // Multiply enemy radius by this for min distance (increased from 2.5)
  obstacleProximityPenalty: 0.98, // Cost penalty for paths near obstacles (0-1) (increased from 0.95)
  obstacleProximityRange: 8 // Range in grid cells to check for proximity (increased from 6)
} as const;
