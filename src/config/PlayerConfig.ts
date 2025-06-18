/**
 * Player-specific configuration constants
 * Centralizes all player-related magic numbers and configuration values
 */

// Player ability configuration
export const PLAYER_ABILITIES = {
  heal: {
    amount: 20,
    cooldown: 8000, // 8 seconds
    lowHealthThreshold: 0.25, // 25% health
    criticalHealthThreshold: 0.1 // 10% health
  },
  regeneration: {
    baseRate: 1, // HP per second
    levelBonus: 1.5, // Additional HP/s per level
    cooldownAfterDamage: 3000 // 3 seconds
  }
} as const;

// Player upgrade configuration
export const PLAYER_UPGRADES = {
  maxLevel: 5,
  costMultiplier: 1.5,
  baseCosts: {
    DAMAGE: 25,
    SPEED: 20,
    FIRE_RATE: 30,
    HEALTH: 35,
    REGENERATION: 40
  },
  bonusMultipliers: {
    DAMAGE: 0.4,      // 40% increase per level
    SPEED: 0.3,       // 30% increase per level
    FIRE_RATE: 0.25,  // 25% increase per level
    HEALTH: 0.5,      // 50% increase per level
  }
} as const;

// Power-up configuration
export const POWER_UP_CONFIG = {
  durations: {
    SPEED_BOOST: 6000,      // 6 seconds
    DAMAGE_BOOST: 5000,      // 5 seconds
    INVINCIBILITY: 7000,    // 7 seconds
    RAPID_FIRE: 9000        // 9 seconds
  },
  effects: {
    SPEED_BOOST_MULTIPLIER: 1.5,
    DAMAGE_BOOST_MULTIPLIER: 2.0,
    RAPID_FIRE_MULTIPLIER: 3.0
  }
} as const;

// Player visuals
export const PLAYER_VISUALS = {
  aimerLength: 100,
  aimerColor: 'rgba(255, 255, 255, 0.5)',
  aimerWidth: 2,
  healthBarOffset: 20,
  upgradeIndicatorSize: 8
} as const;