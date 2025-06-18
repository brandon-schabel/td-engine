/**
 * Item system configuration constants
 * Centralizes all item-related drop rates, generation, and mechanics
 */

// Item drop configuration
export const ITEM_DROP_CONFIG = {
  baseDropChance: 0.30, // 30% chance for items to drop from enemies
  bossDropMultiplier: 2.0, // Bosses have 2x drop chance
  eliteDropMultiplier: 1.5, // Elite enemies have 1.5x drop chance
  rareDropBonus: 0.05, // Extra 5% chance for rare+ items from special enemies
  qualityScaling: true, // Higher level enemies drop better items
  contextualDrops: true, // Enemies drop thematically appropriate items
  guaranteedDropWaves: [5, 10, 15, 20], // Waves that guarantee item drops
  specialEventDrops: true // Enable special event-based drops
} as const;

// Collectible drop chances (for backward compatibility)
export const COLLECTIBLE_DROP_CHANCES = {
  healthPickup: 0.1, // 10% chance from enemies
  powerUp: 0.15, // 15% chance from enemies
  extraCurrencyDrop: 0.05, // 5% chance for extra currency
} as const;

// Rarity-based drop weights for random generation
export const RARITY_DROP_WEIGHTS = {
  COMMON: 0.60,     // 60%
  RARE: 0.25,       // 25%
  EPIC: 0.12,       // 12%
  LEGENDARY: 0.03   // 3%
} as const;

// Type-based drop weights
export const TYPE_DROP_WEIGHTS = {
  CONSUMABLE: 0.50,   // 50%
  EQUIPMENT: 0.20,    // 20%
  MATERIAL: 0.25,     // 25%
  SPECIAL: 0.05       // 5%
} as const;

// Item value configuration (for selling/currency)
export const ITEM_VALUE_CONFIG = {
  baseValues: {
    COMMON: 10,
    RARE: 25,
    EPIC: 60,
    LEGENDARY: 150
  },
  typeMultipliers: {
    CONSUMABLE: 0.8,
    EQUIPMENT: 1.5,
    MATERIAL: 0.6,
    SPECIAL: 2.0
  },
  conditionMultipliers: {
    damaged: 0.5,
    normal: 1.0,
    enhanced: 1.3,
    perfect: 1.5
  }
} as const;

// Item effect durations and multipliers
export const ITEM_EFFECTS = {
  consumables: {
    healPotionSmall: { healAmount: 25, instant: true },
    healPotionLarge: { healAmount: 50, instant: true },
    damageElixir: { duration: 15000, damageBonus: 0.5 },
    speedPotion: { duration: 12000, speedBonus: 0.4 },
    shieldScroll: { duration: 20000, damageReduction: 0.5 },
    rapidFireSerum: { duration: 10000, fireRateBonus: 1.0 }
  },
  equipment: {
    statScaling: {
      perLevel: 0.1, // 10% increase per item level
      perRarity: 0.25 // 25% increase per rarity tier
    }
  }
} as const;

// Item stack limits
export const ITEM_STACK_LIMITS = {
  default: 99,
  consumable: 10,
  material: 50,
  special: 5,
  equipment: 1, // Equipment doesn't stack
  currency: 9999
} as const;

// Item generation configuration
export const ITEM_GENERATION = {
  levelRange: {
    min: -2, // Item can be 2 levels below enemy
    max: 3   // Item can be 3 levels above enemy
  },
  rarityUpgradeChance: 0.1, // 10% chance to upgrade rarity
  prefixSuffixChance: {
    COMMON: 0,
    RARE: 0.3,
    EPIC: 0.6,
    LEGENDARY: 1.0
  },
  maxAffixes: {
    COMMON: 0,
    RARE: 1,
    EPIC: 2,
    LEGENDARY: 3
  }
} as const;

// Item tooltip configuration
export const ITEM_TOOLTIP = {
  showDelay: 500, // ms
  hideDelay: 100, // ms
  fadeInDuration: 200, // ms
  maxWidth: 300,
  compareMode: true, // Show comparison with equipped items
  showDropChance: false, // Show where item can be found
  showValue: true // Show sell value
} as const;