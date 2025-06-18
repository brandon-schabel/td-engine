/**
 * Gameplay Constants Configuration
 * Centralizes core gameplay values and mechanics
 */

export const GAMEPLAY_CONSTANTS = {
  // Projectile settings
  projectiles: {
    lifetime: 3000, // Maximum lifetime in ms
    defaultSpeed: 300,
    maxDistance: 1000,
    collisionRadius: 5,
    pierceReduction: 0.8, // Damage reduction per pierce
  },

  // Combat mechanics
  combat: {
    aimerLength: 100,
    attackRange: {
      melee: 50,
      ranged: 200,
      sniper: 400,
    },
    criticalHit: {
      chance: 0.1,
      multiplier: 2.0,
    },
    dodge: {
      chance: 0.05,
      invulnerabilityTime: 200,
    },
    knockback: {
      force: 100,
      duration: 200,
    },
  },

  // Wave generation
  waves: {
    startDelay: 3000,
    betweenWaveDelay: 5000,
    spawnInterval: {
      min: 500,
      max: 2000,
    },
    difficultyMultiplier: 1.2,
    enemyCountBase: 5,
    enemyCountIncrement: 2,
    bossWaveInterval: 5,
    endlessScaling: {
      healthMultiplier: 1.1,
      speedMultiplier: 1.05,
      rewardMultiplier: 1.15,
    },
  },

  // Score and rewards
  scoring: {
    enemyKillBase: 10,
    multiplierDecay: 0.95, // Per second
    multiplierMax: 10,
    comboWindow: 2000,
    perfectWaveBonus: 500,
    speedBonus: {
      threshold: 30000, // Complete wave under 30 seconds
      multiplier: 1.5,
    },
  },

  // Currency and economy
  economy: {
    startingCurrency: 100,
    currencyPerKill: {
      basic: 5,
      fast: 7,
      tank: 15,
      boss: 50,
    },
    sellRefund: 0.7, // 70% refund on tower sell
    interestRate: 0.02, // 2% interest per wave
    maxInterest: 50,
  },

  // Power-ups
  powerUps: {
    dropChance: 0.1,
    duration: {
      speedBoost: 10000,
      damageBoost: 8000,
      shield: 15000,
      freeze: 5000,
    },
    effects: {
      speedMultiplier: 1.5,
      damageMultiplier: 2.0,
      shieldAbsorption: 100,
      freezeRadius: 150,
    },
  },

  // Game states and timings
  gameStates: {
    pauseTransitionTime: 200,
    gameOverDelay: 2000,
    victoryDelay: 3000,
    autoSaveInterval: 60000, // 1 minute
    idleTimeout: 300000, // 5 minutes
  },

  // Physics and movement
  physics: {
    friction: 0.9,
    maxVelocity: 500,
    acceleration: 1000,
    gravity: 0, // Top-down game
    collisionElasticity: 0.8,
  },

  // Spawn and pathing
  spawning: {
    spawnProtectionTime: 1000,
    pathfindingUpdateInterval: 500,
    maxPathLength: 100,
    crowdSeparationForce: 50,
    crowdSeparationRadius: 30,
  },

  // Tower mechanics
  towerMechanics: {
    placementGridSnap: true,
    rangeVisualizationOpacity: 0.3,
    targetingUpdateInterval: 100,
    maxTargets: {
      basic: 1,
      laser: 3,
      frost: 999, // Area effect
      artillery: 1,
    },
  },

  // Player mechanics
  playerMechanics: {
    respawnTime: 3000,
    invulnerabilityAfterHit: 1000,
    healCooldown: 5000,
    dashCooldown: 2000,
    dashDistance: 100,
    pickupRadius: 30,
  },

  // Difficulty scaling
  difficulty: {
    easy: {
      enemyHealthMultiplier: 0.7,
      enemySpeedMultiplier: 0.8,
      towerDamageMultiplier: 1.3,
      currencyMultiplier: 1.5,
    },
    normal: {
      enemyHealthMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      towerDamageMultiplier: 1.0,
      currencyMultiplier: 1.0,
    },
    hard: {
      enemyHealthMultiplier: 1.5,
      enemySpeedMultiplier: 1.2,
      towerDamageMultiplier: 0.8,
      currencyMultiplier: 0.7,
    },
    endless: {
      enemyHealthMultiplier: 2.0,
      enemySpeedMultiplier: 1.5,
      towerDamageMultiplier: 0.7,
      currencyMultiplier: 0.5,
    },
  },

  // Performance limits
  performance: {
    maxEnemies: 200,
    maxProjectiles: 500,
    maxParticles: 1000,
    maxSounds: 20,
    cullingDistance: 1000,
    updateRadiusMultiplier: 1.5, // Update entities within screen * this multiplier
  },
} as const;

export type GameplayConstants = typeof GAMEPLAY_CONSTANTS;