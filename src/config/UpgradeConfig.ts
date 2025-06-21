/**
 * Centralized Upgrade Configuration
 * Consolidates all upgrade-related constants and settings
 * 
 * Recent changes:
 * - Initial creation to centralize upgrade configurations
 * - Added shared upgrade constants
 * - Added upgrade prerequisites system
 * - Added cost scaling options
 * - Added synergy bonuses configuration
 */

// Shared upgrade constants
export const UPGRADE_CONSTANTS = {
  // Universal settings
  maxLevel: 30, // Keep at 99 for player upgrades
  maxLevelTower: 10, // 10 levels for tower upgrades
  defaultCostMultiplier: 1.08, // 8% increase per level for player
  towerCostMultiplier: 1.25, // 25% increase per level for towers

  // Visual settings
  visualIntensityMultiplier: 1.8,
  visualUpgradeMultiplier: 0.2,
  levelCalculationDivisor: {
    player: 2, // Every 2 upgrades = 1 visual level (5 visual levels total with 10 max)
    tower: 2   // Every 2 upgrades = 1 visual level (5 visual levels total with 10 max)
  },

  // Cost scaling options
  costScaling: {
    exponential: 1.08,    // Standard 8% growth for 99 levels
    moderate: 1.06,       // Gentler 6% increase
    aggressive: 1.10,     // Steeper 10% curve
    linear: 1.0           // For testing/special modes
  },

  // Discount settings
  bulkDiscounts: {
    fiveLevels: 0.95,    // 5% discount for 5 levels at once
    tenLevels: 0.90,     // 10% discount for 10 levels at once
    twentyLevels: 0.85,  // 15% discount for 20 levels at once
    maxLevels: 0.80      // 20% discount for maxing an upgrade
  },

  // Milestone bonuses (additional boost at certain levels)
  milestones: {
    levels: [10, 25, 50, 75, 99],
    bonusMultiplier: 1.1  // 10% extra effect at milestone levels
  },

  // Bulk upgrade increments
  bulkIncrements: [1, 5, 10, 25, 'MAX'] as const,

  // Refund settings
  refundRates: {
    immediate: 0.9,      // 90% refund within 30 seconds
    recent: 0.7,         // 70% refund within 2 minutes
    standard: 0.5,       // 50% refund anytime
    penalty: 0.3         // 30% refund with penalty
  }
} as const;

// Tower-specific upgrade configuration
export const TOWER_UPGRADE_CONFIG = {
  // Base costs for each upgrade type (adjusted for 10 levels)
  baseCosts: {
    DAMAGE: 50,
    RANGE: 60,
    FIRE_RATE: 70
  },

  // Cost multipliers for towers (higher due to fewer levels)
  costMultipliers: {
    DAMAGE: 1.25,
    RANGE: 1.25,
    FIRE_RATE: 1.25
  },

  // Effect multipliers per level (adjusted for 10 levels)
  bonusMultipliers: {
    DAMAGE: 0.15,      // 15% increase per level (150% total at max)
    RANGE: 0.12,       // 12% increase per level (120% total at max)
    FIRE_RATE: 0.13    // 13% increase per level (130% total at max)
  },

  // Tower type specific modifiers
  towerTypeModifiers: {
    BASIC: { costModifier: 1.0, effectModifier: 1.0 },
    SNIPER: { costModifier: 1.2, effectModifier: 1.1 },
    RAPID: { costModifier: 0.9, effectModifier: 0.95 },
    WALL: { costModifier: 0.5, effectModifier: 0 } // Walls can't be upgraded
  }
} as const;

// Player-specific upgrade configuration
export const PLAYER_UPGRADE_CONFIG = {
  // Base costs for each upgrade type (adjusted for 10 levels)
  baseCosts: {
    DAMAGE: 80,
    SPEED: 70,
    FIRE_RATE: 90,
    HEALTH: 100,
    REGENERATION: 120
  },

  // Cost multipliers (can override default)
  costMultipliers: {
    DAMAGE: UPGRADE_CONSTANTS.costScaling.exponential,
    SPEED: UPGRADE_CONSTANTS.costScaling.moderate,
    FIRE_RATE: UPGRADE_CONSTANTS.costScaling.exponential,
    HEALTH: UPGRADE_CONSTANTS.costScaling.moderate,
    REGENERATION: UPGRADE_CONSTANTS.costScaling.aggressive
  },

  // Effect multipliers per level (adjusted for 10 levels - player upgrades remain at 99)
  bonusMultipliers: {
    DAMAGE: 0.025,     // 2.5% increase per level (247.5% total at max)
    SPEED: 0.02,       // 2% increase per level (198% total at max)
    FIRE_RATE: 0.018,  // 1.8% increase per level (178.2% total at max)
    HEALTH: 0.03,      // 3% increase per level (297% total at max)
    REGENERATION: 0.15 // +0.15 HP/s per level (14.85 HP/s at max)
  }
} as const;

// Upgrade prerequisites system
export const UPGRADE_PREREQUISITES = {
  // Tower prerequisites (upgrade type -> required upgrades)
  tower: {
    // No prerequisites for towers currently
  },

  // Player prerequisites
  player: {
    // Regeneration requires at least level 2 health
    REGENERATION: [
      { type: 'HEALTH', minLevel: 2 }
    ]
  }
} as const;

// Upgrade synergies configuration
export const UPGRADE_SYNERGIES = {
  // Player synergies
  player: [
    {
      name: 'Tank Build',
      requires: [
        { type: 'HEALTH', minLevel: 3 },
        { type: 'REGENERATION', minLevel: 3 }
      ],
      bonus: {
        type: 'EFFECTIVE_HEALTH',
        multiplier: 1.15 // 15% bonus
      }
    },
    {
      name: 'Glass Cannon',
      requires: [
        { type: 'DAMAGE', minLevel: 3 },
        { type: 'FIRE_RATE', minLevel: 3 }
      ],
      bonus: {
        type: 'DPS',
        multiplier: 1.2 // 20% DPS bonus
      }
    },
    {
      name: 'Mobile Gunner',
      requires: [
        { type: 'SPEED', minLevel: 3 },
        { type: 'FIRE_RATE', minLevel: 3 }
      ],
      bonus: {
        type: 'ACCURACY_WHILE_MOVING',
        multiplier: 1.1 // 10% accuracy bonus
      }
    },
    {
      name: 'Balanced Fighter',
      requires: [
        { type: 'DAMAGE', minLevel: 2 },
        { type: 'HEALTH', minLevel: 2 },
        { type: 'SPEED', minLevel: 2 }
      ],
      bonus: {
        type: 'ALL_STATS',
        multiplier: 1.05 // 5% to all stats
      }
    }
  ],

  // Tower synergies (could be expanded)
  tower: [
    {
      name: 'Long Range Specialist',
      requires: [
        { type: 'RANGE', minLevel: 4 },
        { type: 'DAMAGE', minLevel: 3 }
      ],
      bonus: {
        type: 'CRIT_CHANCE',
        value: 0.15 // 15% crit chance
      }
    }
  ]
} as const;

// Upgrade recommendations based on game state
export const UPGRADE_RECOMMENDATIONS = {
  // Priority weights for different scenarios
  priorities: {
    earlyGame: {
      player: {
        DAMAGE: 1.2,
        HEALTH: 1.0,
        SPEED: 0.8,
        FIRE_RATE: 1.1,
        REGENERATION: 0.7
      },
      tower: {
        DAMAGE: 1.1,
        RANGE: 1.0,
        FIRE_RATE: 0.9
      }
    },
    midGame: {
      player: {
        DAMAGE: 1.0,
        HEALTH: 1.1,
        SPEED: 1.0,
        FIRE_RATE: 1.0,
        REGENERATION: 1.2
      },
      tower: {
        DAMAGE: 1.0,
        RANGE: 1.1,
        FIRE_RATE: 1.2
      }
    },
    lateGame: {
      player: {
        DAMAGE: 1.3,
        HEALTH: 0.9,
        SPEED: 0.8,
        FIRE_RATE: 1.3,
        REGENERATION: 0.8
      },
      tower: {
        DAMAGE: 1.3,
        RANGE: 0.9,
        FIRE_RATE: 1.1
      }
    }
  }
} as const;

// Export type helpers
export type TowerUpgradeKey = keyof typeof TOWER_UPGRADE_CONFIG.baseCosts;
export type PlayerUpgradeKey = keyof typeof PLAYER_UPGRADE_CONFIG.baseCosts;
export type GamePhase = keyof typeof UPGRADE_RECOMMENDATIONS.priorities;