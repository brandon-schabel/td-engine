import { TowerType, UpgradeType } from '@/entities/Tower';
import { EnemyType } from '@/entities/Enemy';
import { ItemType, EquipmentSlot } from '@/systems/Inventory';
import type { WaveConfig } from '@/systems/WaveManager';

/**
 * Common enemy configurations for testing
 */
export const TestEnemies = {
  basic: {
    type: EnemyType.SOLDIER,
    health: 50,
    speed: 50,
    reward: 10
  },
  tank: {
    type: EnemyType.TANK,
    health: 200,
    speed: 30,
    reward: 25
  },
  fast: {
    type: EnemyType.SCOUT,
    health: 30,
    speed: 100,
    reward: 15
  },
  boss: {
    type: EnemyType.BOSS,
    health: 1000,
    speed: 25,
    reward: 100
  }
} as const;

/**
 * Common tower configurations for testing
 */
export const TestTowers = {
  basic: {
    type: TowerType.BASIC,
    cost: 20,
    damage: 10,
    range: 100,
    fireRate: 1
  },
  sniper: {
    type: TowerType.SNIPER,
    cost: 50,
    damage: 50,
    range: 200,
    fireRate: 0.5
  },
  rapid: {
    type: TowerType.RAPID,
    cost: 30,
    damage: 5,
    range: 80,
    fireRate: 4
  },
  wall: {
    type: TowerType.WALL,
    cost: 10,
    damage: 0,
    range: 0,
    fireRate: 0
  }
} as const;

/**
 * Common wave configurations for testing
 */
export const TestWaves: WaveConfig[] = [
  {
    waveNumber: 1,
    enemies: [
      { type: EnemyType.SOLDIER, count: 5, spawnDelay: 1000 }
    ],
    startDelay: 0
  },
  {
    waveNumber: 2,
    enemies: [
      { type: EnemyType.SOLDIER, count: 3, spawnDelay: 800 },
      { type: EnemyType.SCOUT, count: 2, spawnDelay: 600 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 3,
    enemies: [
      { type: EnemyType.TANK, count: 2, spawnDelay: 2000 },
      { type: EnemyType.SOLDIER, count: 5, spawnDelay: 500 }
    ],
    startDelay: 1000
  },
  {
    waveNumber: 4,
    enemies: [
      { type: EnemyType.BOSS, count: 1, spawnDelay: 0 }
    ],
    startDelay: 5000
  }
];

/**
 * Common item configurations for testing
 */
export const TestItems = {
  consumables: {
    health_potion: {
      id: 'health_potion',
      name: 'Health Potion',
      type: ItemType.CONSUMABLE,
      stackable: true,
      maxStack: 10,
      rarity: 'common' as const
    },
    speed_boost: {
      id: 'speed_boost',
      name: 'Speed Boost',
      type: ItemType.CONSUMABLE,
      stackable: true,
      maxStack: 5,
      rarity: 'uncommon' as const
    }
  },
  equipment: {
    iron_sword: {
      id: 'iron_sword',
      name: 'Iron Sword',
      type: ItemType.EQUIPMENT,
      equipmentSlot: EquipmentSlot.WEAPON,
      stackable: false,
      rarity: 'common' as const,
      stats: { damage: 5 }
    },
    leather_armor: {
      id: 'leather_armor',
      name: 'Leather Armor',
      type: ItemType.EQUIPMENT,
      equipmentSlot: EquipmentSlot.ARMOR,
      stackable: false,
      rarity: 'common' as const,
      stats: { defense: 3 }
    },
    speed_boots: {
      id: 'speed_boots',
      name: 'Speed Boots',
      type: ItemType.EQUIPMENT,
      equipmentSlot: EquipmentSlot.BOOTS,
      stackable: false,
      rarity: 'uncommon' as const,
      stats: { speed: 10 }
    }
  },
  crafting: {
    iron_ore: {
      id: 'iron_ore',
      name: 'Iron Ore',
      type: ItemType.CRAFTING,
      stackable: true,
      maxStack: 50,
      rarity: 'common' as const
    },
    magic_essence: {
      id: 'magic_essence',
      name: 'Magic Essence',
      type: ItemType.CRAFTING,
      stackable: true,
      maxStack: 20,
      rarity: 'rare' as const
    }
  }
};

/**
 * Common map configurations for testing
 */
export const TestMaps = {
  small: {
    width: 10,
    height: 10,
    cellSize: 32,
    spawnPoints: [{ x: 0, y: 5 }],
    goal: { x: 9, y: 5 }
  },
  medium: {
    width: 20,
    height: 15,
    cellSize: 32,
    spawnPoints: [{ x: 0, y: 7 }, { x: 10, y: 0 }],
    goal: { x: 19, y: 7 }
  },
  large: {
    width: 30,
    height: 20,
    cellSize: 32,
    spawnPoints: [{ x: 0, y: 10 }, { x: 15, y: 0 }, { x: 29, y: 10 }],
    goal: { x: 15, y: 19 }
  }
} as const;

/**
 * Common game state configurations for testing
 */
export const TestGameStates = {
  starting: {
    currency: 100,
    lives: 20,
    score: 0,
    wave: 0,
    towers: [],
    enemies: []
  },
  midGame: {
    currency: 500,
    lives: 15,
    score: 1000,
    wave: 5,
    towers: [
      { type: TowerType.BASIC, position: { x: 100, y: 100 } },
      { type: TowerType.SNIPER, position: { x: 200, y: 200 } }
    ],
    enemies: [
      { type: EnemyType.SOLDIER, position: { x: 50, y: 150 } },
      { type: EnemyType.SCOUT, position: { x: 100, y: 150 } }
    ]
  },
  endGame: {
    currency: 2000,
    lives: 5,
    score: 10000,
    wave: 15,
    towers: [
      { type: TowerType.BASIC, position: { x: 100, y: 100 }, level: 3 },
      { type: TowerType.SNIPER, position: { x: 200, y: 200 }, level: 2 },
      { type: TowerType.RAPID, position: { x: 300, y: 100 }, level: 2 }
    ],
    enemies: [
      { type: EnemyType.TANK, position: { x: 50, y: 150 } },
      { type: EnemyType.BOSS, position: { x: 400, y: 300 } }
    ]
  }
} as const;

/**
 * Common upgrade paths for testing
 */
export const TestUpgrades = {
  tower: {
    damage: [
      { level: 1, value: 10 },
      { level: 2, value: 15 },
      { level: 3, value: 22 },
      { level: 4, value: 30 },
      { level: 5, value: 40 }
    ],
    range: [
      { level: 1, value: 100 },
      { level: 2, value: 120 },
      { level: 3, value: 140 },
      { level: 4, value: 165 },
      { level: 5, value: 190 }
    ],
    fireRate: [
      { level: 1, value: 1 },
      { level: 2, value: 1.2 },
      { level: 3, value: 1.5 },
      { level: 4, value: 1.8 },
      { level: 5, value: 2.2 }
    ]
  },
  player: {
    health: [
      { level: 1, value: 100 },
      { level: 2, value: 120 },
      { level: 3, value: 145 },
      { level: 4, value: 175 },
      { level: 5, value: 210 }
    ],
    damage: [
      { level: 1, value: 15 },
      { level: 2, value: 20 },
      { level: 3, value: 26 },
      { level: 4, value: 33 },
      { level: 5, value: 42 }
    ],
    speed: [
      { level: 1, value: 150 },
      { level: 2, value: 165 },
      { level: 3, value: 180 },
      { level: 4, value: 200 },
      { level: 5, value: 220 }
    ]
  }
} as const;

/**
 * Common resource drop configurations
 */
export const TestResourceDrops = {
  currency: {
    small: { amount: 5, probability: 0.3 },
    medium: { amount: 10, probability: 0.2 },
    large: { amount: 25, probability: 0.1 }
  },
  items: {
    common: { probability: 0.2, items: ['health_potion', 'iron_ore'] },
    uncommon: { probability: 0.1, items: ['speed_boost', 'speed_boots'] },
    rare: { probability: 0.05, items: ['magic_essence'] }
  }
} as const;

/**
 * Pre-configured test scenarios
 */
export const TestScenarioData = {
  towerDefense: {
    description: 'Basic tower defense scenario',
    towers: [
      { type: TowerType.BASIC, position: { x: 100, y: 100 } },
      { type: TowerType.SNIPER, position: { x: 200, y: 100 } },
      { type: TowerType.RAPID, position: { x: 150, y: 200 } }
    ],
    enemies: [
      { type: EnemyType.SOLDIER, path: [{ x: 0, y: 150 }, { x: 300, y: 150 }] },
      { type: EnemyType.SCOUT, path: [{ x: 0, y: 150 }, { x: 300, y: 150 }], delay: 1000 }
    ]
  },
  bossEncounter: {
    description: 'Boss fight scenario',
    towers: [
      { type: TowerType.SNIPER, position: { x: 100, y: 100 }, level: 3 },
      { type: TowerType.SNIPER, position: { x: 200, y: 100 }, level: 3 },
      { type: TowerType.RAPID, position: { x: 150, y: 200 }, level: 4 }
    ],
    enemies: [
      { type: EnemyType.BOSS, path: [{ x: 0, y: 150 }, { x: 300, y: 150 }] }
    ],
    playerUpgrades: {
      damage: 3,
      health: 2,
      speed: 1
    }
  },
  survivalMode: {
    description: 'Endless wave survival',
    initialResources: {
      currency: 1000,
      lives: 10
    },
    waveInterval: 5000,
    waveScaling: {
      enemyHealth: 1.1,
      enemySpeed: 1.05,
      enemyCount: 1.2
    }
  }
} as const;