/**
 * Player-specific configuration constants
 * Centralizes all player-related magic numbers and configuration values
 */

// Player ability configuration
export const PLAYER_ABILITIES = {
  heal: {
    amount: 30, // Amount of health restored by heal ability
    cooldown: 8000, // 8 seconds
    initialCooldown: 5000, // Start on cooldown for 5 seconds
    lowHealthThreshold: 0.25, // 25% health
    criticalHealthThreshold: 0.1 // 10% health
  },
  regeneration: {
    baseRate: 1, // HP per second
    levelBonus: 1.5, // Additional HP/s per level
    cooldownAfterDamage: 3000 // 3 seconds
  }
} as const;

// Player upgrade configuration - imports from UpgradeConfig
import { PLAYER_UPGRADE_CONFIG, UPGRADE_CONSTANTS } from './UpgradeConfig';

export const PLAYER_UPGRADES = {
  maxLevel: UPGRADE_CONSTANTS.maxLevel,
  costMultiplier: UPGRADE_CONSTANTS.defaultCostMultiplier,
  baseCosts: PLAYER_UPGRADE_CONFIG.baseCosts,
  bonusMultipliers: PLAYER_UPGRADE_CONFIG.bonusMultipliers
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