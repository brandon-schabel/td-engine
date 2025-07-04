/**
 * Item system configuration constants
 * Centralizes all item-related drop rates, generation, and mechanics
 */



// Collectible drop chances (for backward compatibility)
export const COLLECTIBLE_DROP_CHANCES = {
  healthPickup: 0.1, // 10% chance from enemies
  powerUp: 0.15, // 15% chance from enemies
  extraCurrencyDrop: 0.05, // 5% chance for extra currency
} as const;

