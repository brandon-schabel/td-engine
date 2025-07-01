/**
 * Save Game Types
 * Defines the structure for serializing and deserializing game state
 */

import type { Vector2 } from '@/utils/Vector2';
import type { TowerType, UpgradeType } from '@/entities/Tower';
import type { EnemyType } from '@/entities/Enemy';
import type { PlayerUpgradeType } from '@/entities/Player';
import type { InventoryItem } from '@/systems/Inventory';
import type { BiomeType, MapDifficulty, MapSize } from '@/types/MapData';
import type { gameStore } from '@/stores/gameStore';
type GameStore = ReturnType<typeof gameStore.getState>;

export interface SerializedVector2 {
  x: number;
  y: number;
}

export interface SerializedTower {
  id: string;
  type: TowerType;
  position: SerializedVector2;
  upgradeLevels: Record<UpgradeType, number>;
  health: number;
  maxHealth: number;
  totalInvestment: number;
}

export interface SerializedEnemy {
  id: string;
  type: EnemyType;
  position: SerializedVector2;
  health: number;
  maxHealth: number;
  pathIndex: number;
  distanceTraveled: number;
  speedMultiplier: number;
  isBoss: boolean;
}

export interface SerializedPlayer {
  id: string;
  position: SerializedVector2;
  health: number;
  maxHealth: number;
  level: number;
  experience: number;
  nextLevelExperience: number;
  upgrades: Record<PlayerUpgradeType, number>;
  availableUpgradePoints: number;
  movementSpeed: number;
  armor: number;
}

export interface SerializedInventory {
  items: InventoryItem[];
  maxSlots: number;
  itemsCollected: number;
  itemsUsed: number;
}

export interface SerializedMapConfig {
  seed: number;
  width: number;
  height: number;
  cellSize: number;
  biome: BiomeType;
  difficulty: MapDifficulty;
  decorationLevel: string;
}

export interface SerializedWaveState {
  currentWave: number;
  isWaveActive: boolean;
  waveInProgress: boolean;
  enemiesRemaining: number;
  nextWaveTime: number;
  infiniteWavesEnabled: boolean;
  enemyHealthMultiplier: number;
  enemySpeedMultiplier: number;
}

export interface SaveGameMetadata {
  saveVersion: number;
  timestamp: number;
  gameTime: number;
  realTimePlayed: number;
  mapChecksum?: string;
  gameVersion?: string;
}

export interface SerializedGameState {
  // Version for migration support
  version: number;
  
  // Core game state from store
  gameStore: Partial<GameStore>;
  
  // Entity states
  towers: SerializedTower[];
  enemies: SerializedEnemy[];
  player: SerializedPlayer;
  
  // Systems state
  inventory: SerializedInventory;
  waveState: SerializedWaveState;
  
  // Map configuration
  mapConfig: SerializedMapConfig;
  
  // Camera state
  camera: {
    position: SerializedVector2;
    zoom: number;
  };
  
  // Game metadata
  metadata: SaveGameMetadata;
}

// Current save format version
export const SAVE_VERSION = 1;

// Helper functions for serialization
export function serializeVector2(vec: Vector2): SerializedVector2 {
  return { x: vec.x, y: vec.y };
}

export function deserializeVector2(vec: SerializedVector2): Vector2 {
  return { x: vec.x, y: vec.y };
}

// Validation functions
export function isValidSaveGame(data: any): data is SerializedGameState {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.version === 'number' &&
    data.version <= SAVE_VERSION &&
    data.gameStore &&
    Array.isArray(data.towers) &&
    Array.isArray(data.enemies) &&
    data.player &&
    data.inventory &&
    data.waveState &&
    data.mapConfig &&
    data.metadata
  );
}

export function getSaveGameMetadata(): SaveGameMetadata | null {
  try {
    const saved = localStorage.getItem('gameSave');
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    if (isValidSaveGame(data)) {
      return data.metadata;
    }
  } catch (error) {
    console.error('Failed to get save game metadata:', error);
  }
  return null;
}