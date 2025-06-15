import { expect } from 'vitest';
import type { Tower } from '@/entities/Tower';
import { TowerType } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import { EnemyType } from '@/entities/Enemy';
import type { Player } from '@/entities/Player';
import type { Game } from '@/core/Game';
import type { Inventory } from '@/systems/InventorySystem';
import { EntityType } from '@/entities/Entity';
import { ItemType } from '@/systems/Inventory';
import type { Vector2 } from '@/utils/Vector2';

/**
 * Tower-specific assertions
 */
export function assertTowerStats(
  tower: Tower,
  expected: {
    type?: TowerType;
    damage?: number;
    range?: number;
    fireRate?: number;
    level?: number;
    position?: { x: number; y: number };
  }
): void {
  expect(tower.type).toBe(EntityType.TOWER);
  
  if (expected.type !== undefined) {
    expect(tower.towerType).toBe(expected.type);
  }
  if (expected.damage !== undefined) {
    expect(tower.damage).toBe(expected.damage);
  }
  if (expected.range !== undefined) {
    expect(tower.range).toBe(expected.range);
  }
  if (expected.fireRate !== undefined) {
    expect(tower.fireRate).toBe(expected.fireRate);
  }
  if (expected.level !== undefined) {
    expect(tower.level).toBe(expected.level);
  }
  if (expected.position !== undefined) {
    expect(tower.position).toEqual(expected.position);
  }
}

/**
 * Enemy-specific assertions
 */
export function assertEnemyState(
  enemy: Enemy,
  expected: {
    type?: EnemyType;
    health?: number;
    maxHealth?: number;
    speed?: number;
    position?: { x: number; y: number };
    isDead?: boolean;
  }
): void {
  expect(enemy.type).toBe(EntityType.ENEMY);
  
  if (expected.type !== undefined) {
    expect(enemy.enemyType).toBe(expected.type);
  }
  if (expected.health !== undefined) {
    expect(enemy.health).toBe(expected.health);
  }
  if (expected.maxHealth !== undefined) {
    expect(enemy.maxHealth).toBe(expected.maxHealth);
  }
  if (expected.speed !== undefined) {
    expect(enemy.speed).toBe(expected.speed);
  }
  if (expected.position !== undefined) {
    expect(enemy.position.x).toBeCloseTo(expected.position.x, 1);
    expect(enemy.position.y).toBeCloseTo(expected.position.y, 1);
  }
  if (expected.isDead !== undefined) {
    expect(enemy.isDead()).toBe(expected.isDead);
  }
}

/**
 * Player-specific assertions
 */
export function assertPlayerState(
  player: Player,
  expected: {
    health?: number;
    maxHealth?: number;
    damage?: number;
    speed?: number;
    position?: { x: number; y: number };
    isDead?: boolean;
    level?: number;
  }
): void {
  expect(player.type).toBe(EntityType.PLAYER);
  
  if (expected.health !== undefined) {
    expect(player.health).toBe(expected.health);
  }
  if (expected.maxHealth !== undefined) {
    expect(player.maxHealth).toBe(expected.maxHealth);
  }
  if (expected.damage !== undefined) {
    expect(player.damage).toBe(expected.damage);
  }
  if (expected.speed !== undefined) {
    expect(player.speed).toBe(expected.speed);
  }
  if (expected.position !== undefined) {
    expect(player.position.x).toBeCloseTo(expected.position.x, 1);
    expect(player.position.y).toBeCloseTo(expected.position.y, 1);
  }
  if (expected.isDead !== undefined) {
    expect(player.isDead()).toBe(expected.isDead);
  }
  if (expected.level !== undefined) {
    expect(player.level).toBe(expected.level);
  }
}

/**
 * Game resource assertions
 */
export function assertGameResources(
  game: Game,
  expected: {
    currency?: number;
    lives?: number;
    score?: number;
    wave?: number;
  }
): void {
  if (expected.currency !== undefined) {
    expect(game.getCurrency()).toBe(expected.currency);
  }
  if (expected.lives !== undefined) {
    expect(game.getLives()).toBe(expected.lives);
  }
  if (expected.score !== undefined) {
    expect(game.getScore()).toBe(expected.score);
  }
  if (expected.wave !== undefined) {
    expect(game.getCurrentWave()).toBe(expected.wave);
  }
}

/**
 * Entity count assertions
 */
export function assertEntityCounts(
  game: Game,
  expected: {
    enemies?: number;
    towers?: number;
    projectiles?: number;
    collectibles?: number;
  }
): void {
  if (expected.enemies !== undefined) {
    expect(game.getEnemies().length).toBe(expected.enemies);
  }
  if (expected.towers !== undefined) {
    expect(game.getTowers().length).toBe(expected.towers);
  }
  if (expected.projectiles !== undefined) {
    expect(game.getProjectiles().length).toBe(expected.projectiles);
  }
  if (expected.collectibles !== undefined) {
    expect(game.getCollectibles().length).toBe(expected.collectibles);
  }
}

/**
 * Inventory assertions
 */
export function assertInventoryContents(
  inventory: Inventory,
  expected: {
    itemCount?: number;
    emptySlots?: number;
    hasItem?: string;
    itemQuantity?: { itemId: string; quantity: number };
    equipment?: { [slot: string]: string | null };
  }
): void {
  if (expected.itemCount !== undefined) {
    const actualCount = inventory.getItems().reduce((sum, item) => 
      sum + (item ? item.quantity : 0), 0
    );
    expect(actualCount).toBe(expected.itemCount);
  }
  
  if (expected.emptySlots !== undefined) {
    const emptyCount = inventory.getItems().filter(item => !item).length;
    expect(emptyCount).toBe(expected.emptySlots);
  }
  
  if (expected.hasItem !== undefined) {
    const hasItem = inventory.getItems().some(item => 
      item && item.id === expected.hasItem
    );
    expect(hasItem).toBe(true);
  }
  
  if (expected.itemQuantity !== undefined) {
    const item = inventory.getItems().find(item => 
      item && item.id === expected.itemQuantity!.itemId
    );
    expect(item?.quantity).toBe(expected.itemQuantity.quantity);
  }
  
  if (expected.equipment !== undefined) {
    Object.entries(expected.equipment).forEach(([slot, itemId]) => {
      const equipped = inventory.getEquippedItem(slot as any);
      if (itemId === null) {
        expect(equipped).toBeNull();
      } else {
        expect(equipped?.id).toBe(itemId);
      }
    });
  }
}

/**
 * Position assertions with tolerance
 */
export function assertPosition(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
  tolerance = 1
): void {
  expect(actual.x).toBeCloseTo(expected.x, tolerance);
  expect(actual.y).toBeCloseTo(expected.y, tolerance);
}

/**
 * Array contains assertion
 */
export function assertArrayContains<T>(
  array: T[],
  predicate: (item: T) => boolean,
  expectedCount = 1
): void {
  const matches = array.filter(predicate);
  expect(matches.length).toBe(expectedCount);
}

/**
 * Game state composite assertion
 */
export function assertGameInState(
  game: Game,
  state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'
): void {
  expect(game.getState()).toBe(state);
}

/**
 * Performance assertion
 */
export function assertPerformance(
  fn: () => void,
  maxDuration: number,
  iterations = 100
): void {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const duration = performance.now() - start;
  const avgDuration = duration / iterations;
  
  expect(avgDuration).toBeLessThan(maxDuration);
}

/**
 * Upgrade assertion helper
 */
export function assertCanUpgrade(
  entity: Tower | Player,
  upgradeType: string,
  expected: boolean
): void {
  const canUpgrade = entity.canUpgrade(upgradeType as any);
  expect(canUpgrade).toBe(expected);
}

/**
 * Batch assertion helper
 */
export function assertAll<T>(
  items: T[],
  assertion: (item: T) => void
): void {
  items.forEach((item, index) => {
    try {
      assertion(item);
    } catch (error) {
      throw new Error(`Assertion failed for item at index ${index}: ${error}`);
    }
  });
}

/**
 * Entity health assertion
 */
export function assertEntityHealth(entity: { health: number }, expectedHealth: number): void {
  expect(entity.health).toBe(expectedHealth);
}

/**
 * Entity position assertion with tolerance
 */
export function assertEntityPosition(entity: { position: Vector2 }, expectedPosition: Vector2, tolerance: number = 0): void {
  const distance = Math.hypot(
    entity.position.x - expectedPosition.x,
    entity.position.y - expectedPosition.y
  );
  expect(distance).toBeLessThanOrEqual(tolerance);
}