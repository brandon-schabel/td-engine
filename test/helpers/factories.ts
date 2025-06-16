import type { Entity } from '@/entities/Entity';
import { EntityType } from '@/entities/Entity';
import type { Enemy } from '@/entities/Enemy';
import { EnemyType } from '@/entities/Enemy';
import type { Tower } from '@/entities/Tower';
import { TowerType } from '@/entities/Tower';
import type { InventoryItem as Item } from '@/systems/Inventory';
import { ItemType, ItemRarity } from '@/systems/Inventory';

/**
 * Factory functions for creating test data
 * These provide consistent, minimal mock objects for unit testing
 */

export function createMockEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    health: 100,
    maxHealth: 100,
    radius: 10,
    type: EntityType.ENEMY,
    update: vi.fn(),
    render: vi.fn(),
    takeDamage: vi.fn(),
    isAlive: vi.fn(() => true),
    getHealthPercentage: vi.fn(() => 1),
    ...overrides
  } as unknown as Entity;
}

export function createMockEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    ...createMockEntity({ type: EntityType.ENEMY }),
    enemyType: EnemyType.BASIC,
    speed: 0.05,
    damage: 10,
    goldValue: 10,
    experienceValue: 5,
    path: [],
    pathIndex: 0,
    distanceTraveled: 0,
    reachedEnd: false,
    ...overrides
  } as unknown as Enemy;
}

export function createMockTower(overrides: Partial<Tower> = {}): Tower {
  return {
    ...createMockEntity({ type: EntityType.TOWER }),
    towerType: TowerType.BASIC,
    damage: 20,
    range: 100,
    fireRate: 2,
    cooldown: 0,
    level: 1,
    target: null,
    canUpgrade: vi.fn(() => true),
    getUpgradeCost: vi.fn(() => 50),
    upgrade: vi.fn(() => ({ success: true })),
    findTarget: vi.fn(),
    createProjectile: vi.fn(),
    ...overrides
  } as unknown as Tower;
}

export function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    name: 'Test Item',
    description: 'A test item',
    iconType: 'item',
    quantity: 1,
    maxStack: 10,
    metadata: {},
    acquiredAt: Date.now(),
    ...overrides
  } as Item;
}

export function createMockPosition(x: number = 0, y: number = 0): { x: number; y: number } {
  return { x, y };
}

export function createMockGrid(width: number, height: number, obstacles: Array<{ x: number; y: number }> = []) {
  const grid = Array(height).fill(null).map(() => Array(width).fill(0));
  obstacles.forEach(({ x, y }) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = 1;
    }
  });
  return {
    width,
    height,
    cellSize: 32,
    isWalkable: (x: number, y: number) => {
      return x >= 0 && x < width && y >= 0 && y < height && grid[y][x] === 0;
    },
    getCell: (x: number, y: number) => grid[y]?.[x] ?? 1,
    setCell: (x: number, y: number, value: number) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = value;
      }
    }
  };
}

export function createMockWaveConfig() {
  return {
    waveNumber: 1,
    enemies: [
      { type: EnemyType.BASIC, count: 5, delay: 1000 }
    ],
    spawnPattern: 'SINGLE_POINT' as const,
    duration: 10000
  };
}

export function createMockPlayerStats() {
  return {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    damage: 10,
    fireRate: 2,
    moveSpeed: 0.2,
    critChance: 0.1,
    critDamage: 2
  };
}