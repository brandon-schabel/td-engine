/**
 * Inventory system configuration constants
 * Centralizes all inventory-related settings and parameters
 */

// Core inventory configuration
export const INVENTORY_CONFIG = {
  defaultSlots: 20,
  maxSlots: 60,
  minSlots: 10,
  autoSortEnabled: false,
  stackingEnabled: true,
  quickSlots: 6, // Number of quick-use slots
  tooltipDelay: 500, // ms
  dragSensitivity: 5, // pixels
  dropOnDeath: false,
  saveToLocalStorage: true
} as const;

// Inventory upgrade configuration
export const INVENTORY_UPGRADES = {
  baseCost: 50, // Base cost for first upgrade
  costMultiplier: 1.5, // Cost increases by 50% each upgrade
  slotsPerUpgrade: 5, // How many slots each upgrade adds
  maxUpgrades: 8, // Maximum number of upgrades (20 + 8*5 = 60 max slots)
  upgradeRequirements: {
    minWave: 0, // Can upgrade from the start
    minPlayerLevel: 0 // No level requirement
  }
} as const;

