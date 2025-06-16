/**
 * Mock data factory functions for tests
 * Provides consistent test data generation
 */

import type { Vector2 } from '@/utils/Vector2';
import { Grid, CellType } from '@/systems/Grid';
import type { InventoryItem } from '@/systems/Inventory';
import { ItemType, ItemRarity, EquipmentSlot } from '@/systems/Inventory';
import type { GameStats } from '@/systems/ScoreManager';
import { BiomeType } from '@/types/MapData';

export function createMockVector2(x: number = 0, y: number = 0): Vector2 {
  return { x, y };
}

export function createMockGrid(width: number = 10, height: number = 10, cellSize: number = 32): Grid {
  return new Grid(width, height, cellSize);
}

export function createMockGridWithPath(width: number = 10, height: number = 10): Grid {
  const grid = new Grid(width, height, 32);
  
  // Create a simple L-shaped path
  const path: Vector2[] = [
    { x: 0, y: 5 },
    { x: 1, y: 5 },
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 5, y: 4 },
    { x: 5, y: 3 },
    { x: 5, y: 2 },
    { x: 5, y: 1 },
    { x: 5, y: 0 },
  ];
  
  grid.setPath(path);
  return grid;
}

export function createMockInventoryItem(overrides?: Partial<InventoryItem>): InventoryItem {
  return {
    id: 'item-' + Math.random().toString(36).substr(2, 9),
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    name: 'Test Item',
    description: 'A test item for unit tests',
    iconType: 'box',
    quantity: 1,
    maxStack: 99,
    metadata: {},
    acquiredAt: Date.now(),
    ...overrides,
  };
}

export function createMockConsumableItem(overrides?: Partial<InventoryItem>): InventoryItem {
  return createMockInventoryItem({
    type: ItemType.CONSUMABLE,
    name: 'Health Potion',
    description: 'Restores 50 HP',
    iconType: 'heart',
    metadata: {
      healAmount: 50,
      effect: 'heal',
    },
    ...overrides,
  });
}

export function createMockEquipmentItem(overrides?: Partial<InventoryItem>): InventoryItem {
  return createMockInventoryItem({
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.RARE,
    name: 'Iron Sword',
    description: 'A basic iron sword',
    iconType: 'sword',
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.WEAPON,
      damageBonus: 10,
    },
    ...overrides,
  });
}

export function createMockGameStats(overrides?: Partial<GameStats>): GameStats {
  return {
    score: 1000,
    wave: 5,
    currency: 250,
    enemiesKilled: 50,
    towersBuilt: 10,
    playerLevel: 3,
    gameTime: 300, // 5 minutes
    date: Date.now(),
    mapBiome: BiomeType.GRASSLAND,
    mapDifficulty: 'normal',
    ...overrides,
  };
}

export function createMockCooldownEntity(cooldownTime: number = 1000) {
  return {
    cooldownTime,
    currentCooldown: 0,
    canPerformAction: function() { return this.currentCooldown <= 0; },
    startCooldown: function() { this.currentCooldown = this.cooldownTime; },
  };
}

export function createPathGrid(): { grid: Grid; start: Vector2; end: Vector2 } {
  const grid = new Grid(10, 10, 32);
  
  // Set up a simple maze-like structure
  const obstacles = [
    { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
    { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
    { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 }, { x: 7, y: 8 },
  ];
  
  obstacles.forEach(pos => grid.setCellType(pos.x, pos.y, CellType.OBSTACLE));
  
  return {
    grid,
    start: { x: 0, y: 0 },
    end: { x: 9, y: 9 },
  };
}

export function createMockEventEmitter<T extends Record<string, any>>() {
  const listeners = new Map<keyof T, Set<Function>>();
  const emitHistory: Array<{ event: keyof T; data: any }> = [];
  
  return {
    on: vi.fn((event: keyof T, listener: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener);
    }),
    
    off: vi.fn((event: keyof T, listener: Function) => {
      listeners.get(event)?.delete(listener);
    }),
    
    emit: vi.fn((event: keyof T, data: any) => {
      emitHistory.push({ event, data });
      listeners.get(event)?.forEach(listener => listener(data));
    }),
    
    removeAllListeners: vi.fn((event?: keyof T) => {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }),
    
    getEmitHistory: () => emitHistory,
    getListenerCount: (event: keyof T) => listeners.get(event)?.size || 0,
  };
}