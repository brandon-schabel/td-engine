import type { WaveConfig } from '@/systems/WaveManager';

// Tower costs - avoid circular dependency by using string keys
export const TOWER_COSTS = {
  'BASIC': 30,
  'SNIPER': 75,
  'RAPID': 45,
  'WALL': 15
} as const;

// Player stats
export const BASE_PLAYER_STATS = {
  damage: 11,
  speed: 120, // pixels per second
  fireRate: 1.5, // shots per second
  health: 75,
  radius: 12
} as const;

// Game mechanics constants
export const GAME_MECHANICS = {
  projectileSpeed: 400,
  towerProjectileSpeed: 300,
  healAbilityCooldown: 20000, // 20 seconds
  damageRegenCooldown: 3000, // 3 seconds before regeneration
  regenInterval: 1000, // Regenerate every second
} as const;

// Inventory upgrade configuration
export const INVENTORY_UPGRADES = {
  baseCost: 50, // Base cost for first upgrade
  costMultiplier: 1.5, // Cost increases by 50% each upgrade
  slotsPerUpgrade: 5, // How many slots each upgrade adds
  maxUpgrades: 8, // Maximum number of upgrades (20 + 8*5 = 60 max slots)
} as const;

// Default wave configurations - avoid circular dependency by using string types
export const DEFAULT_WAVES: WaveConfig[] = [
  {
    waveNumber: 1,
    enemies: [
      { type: 'BASIC' as any, count: 5, spawnDelay: 1000 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 2,
    enemies: [
      { type: 'BASIC' as any, count: 8, spawnDelay: 800 }
    ],
    startDelay: 3000
  },
  {
    waveNumber: 3,
    enemies: [
      { type: 'BASIC' as any, count: 5, spawnDelay: 1000 },
      { type: 'FAST' as any, count: 3, spawnDelay: 600 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 4,
    enemies: [
      { type: 'BASIC' as any, count: 10, spawnDelay: 600 },
      { type: 'FAST' as any, count: 5, spawnDelay: 800 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 5,
    enemies: [
      { type: 'TANK' as any, count: 3, spawnDelay: 2000 },
      { type: 'FAST' as any, count: 8, spawnDelay: 400 }
    ],
    startDelay: 3000
  }
] as const;

// Entity spawn chances
export const SPAWN_CHANCES = {
  healthPickup: 0.1, // 10% chance from enemies
  powerUp: 0.15, // 15% chance from enemies
  extraCurrencyDrop: 0.05, // 5% chance for extra currency
} as const;

// Visual/Animation constants
export const ANIMATION_CONFIG = {
  bobAmount: 5,
  bobSpeed: 0.002, // radians per millisecond
  rotationSpeed: 0.001, // radians per millisecond
  pulseSpeed: 0.004,
  cameraSmoothing: 0.25,
  
  // PowerUp-specific animations (more dramatic)
  powerUp: {
    bobAmount: 8,
    bobSpeed: 0.003,
    rotationSpeed: 0.002,
  },
} as const;

// Audio positioning and effects
export const AUDIO_CONFIG = {
  listenerOffset: { x: 600, y: 400 },
  spatialFalloff: 1.0,
  defaultVolume: 0.7
} as const;

// Upgrade system constants
export const UPGRADE_CONFIG = {
  maxLevel: 5,
  visualIntensityMultiplier: 1.8,
  visualUpgradeMultiplier: 0.2,
  levelCalculationDivisor: {
    player: 4, // Every 4 upgrades = 1 level
    tower: 3   // Every 3 upgrades = 1 level
  }
} as const;

// Currency and rewards
export const CURRENCY_CONFIG = {
  powerUpBonus: 50,
  extraDropMultiplier: 2,
  baseRewardMultiplier: 5 // For score calculation
} as const;

// Visual and color constants
export const COLOR_CONFIG = {
  health: {
    high: '#4CAF50',    // >60% health
    medium: '#FF9800',  // 30-60% health
    low: '#F44336'      // <30% health
  },
  towers: {
    basic: { hue: 120, saturation: 60 },    // Green
    sniper: { hue: 210, saturation: 60 },   // Blue
    rapid: { hue: 35, saturation: 60 }      // Orange
  },
  upgradeDots: ['#FF4444', '#44FF44', '#4444FF'], // Red, Green, Blue
  ui: {
    currency: '#FFD700',
    lives: '#FF4444',
    score: '#4CAF50',
    wave: '#2196F3'
  }
} as const;

// Rendering constants
export const RENDER_CONFIG = {
  healthBarWidth: 28,
  healthBarHeight: 5,
  upgradeDotRadius: 3,
  upgradeDotSpacing: 8,
  aimerLength: 100,
  gridLineColor: '#333333',
  pathColor: '#654321',
  blockedColor: '#444444',
  obstacleColor: '#666666',
  ghostOpacity: 0.6,
  glowBlur: 10,
  dashPattern: [5, 5],
  upgradeOutlineThickness: {
    normal: 2,
    upgraded: 3
  }
} as const;

// Inventory system constants
export const INVENTORY_CONFIG = {
  defaultSlots: 20,
  maxSlots: 40,
  autoSortEnabled: false,
  stackingEnabled: true,
  quickSlots: 6, // Number of quick-use slots
  tooltipDelay: 500, // ms
  dragSensitivity: 5 // pixels
} as const;

// Item drop and generation constants
export const ITEM_CONFIG = {
  baseDropChance: 0.30, // 30% chance for items to drop from enemies
  bossDropMultiplier: 2.0, // Bosses have 2x drop chance
  rareDropBonus: 0.05, // Extra 5% chance for rare+ items from special enemies
  qualityScaling: true, // Higher level enemies drop better items
  contextualDrops: true, // Enemies drop thematically appropriate items
  guaranteedDropWaves: [5, 10, 15, 20], // Waves that guarantee item drops
  specialEventDrops: true // Enable special event-based drops
} as const;