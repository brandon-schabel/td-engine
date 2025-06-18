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

// Inventory UI configuration
export const INVENTORY_UI = {
  slotSize: 48,
  slotSpacing: 4,
  slotBorderWidth: 2,
  gridColumns: {
    mobile: 4,
    tablet: 6,
    desktop: 8
  },
  colors: {
    slotBackground: 'rgba(30, 30, 30, 0.8)',
    slotBorder: '#444444',
    slotHover: 'rgba(76, 175, 80, 0.3)',
    slotSelected: 'rgba(76, 175, 80, 0.5)',
    slotEmpty: 'rgba(0, 0, 0, 0.3)',
    rarityCommon: '#9e9e9e',
    rarityRare: '#2196f3',
    rarityEpic: '#9c27b0',
    rarityLegendary: '#ff9800'
  },
  animations: {
    pickupDuration: 300,
    dropDuration: 200,
    sortDuration: 400,
    hoverScale: 1.05
  }
} as const;

// Item interaction configuration
export const ITEM_INTERACTION = {
  doubleClickDelay: 300, // ms
  longPressDelay: 500, // ms for mobile
  dragThreshold: 5, // pixels before drag starts
  dropRange: 100, // pixels from player
  pickupRange: 50, // pixels from player
  autoPickup: {
    enabled: true,
    types: ['currency', 'material'],
    delay: 0 // ms delay before auto-pickup
  }
} as const;

// Equipment slot configuration
export const EQUIPMENT_SLOTS = {
  weapon: {
    name: 'Weapon',
    maxItems: 1,
    allowedTypes: ['weapon'],
    position: { row: 0, col: 0 }
  },
  armor: {
    name: 'Armor',
    maxItems: 1,
    allowedTypes: ['armor'],
    position: { row: 0, col: 1 }
  },
  accessory: {
    name: 'Accessory',
    maxItems: 2,
    allowedTypes: ['accessory'],
    position: { row: 0, col: 2 }
  }
} as const;

// Inventory sorting configuration
export const INVENTORY_SORTING = {
  methods: ['type', 'rarity', 'name', 'quantity', 'acquiredTime'],
  defaultMethod: 'type',
  groupSimilar: true,
  priorityOrder: {
    equipment: 1,
    consumable: 2,
    material: 3,
    special: 4
  }
} as const;

// Inventory persistence
export const INVENTORY_PERSISTENCE = {
  storageKey: 'td-engine-inventory',
  saveInterval: 30000, // Auto-save every 30 seconds
  maxSaveSlots: 3,
  compression: true
} as const;