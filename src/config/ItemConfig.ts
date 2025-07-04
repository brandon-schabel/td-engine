/**
 * Item system configuration constants
 * Centralizes all item-related drop rates, generation, and mechanics
 */



// Collectible drop chances with proper types
export const COLLECTIBLE_DROP_CHANCES = {
  health: 0.1, // 10% chance for health pickup
  powerUp: 0.15, // 15% chance for any power-up (will be randomly selected)
  currency: 0.05, // 5% chance for extra currency
} as const;

// Power-up types that can drop when 'powerUp' is rolled
export const POWER_UP_TYPES = [
  'EXTRA_DAMAGE',
  'FASTER_SHOOTING',
  'SHIELD',
  'SPEED_BOOST'
] as const;

