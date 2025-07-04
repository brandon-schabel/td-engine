import { MapData } from '@/types/MapData';
import { GameMode } from '@/types/GameMode';

export interface PresetMapMetadata {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  playerCount: {
    min: number;
    max: number;
  };
  supportedModes: GameMode[];
  thumbnail?: string;
  author?: string;
  version: string;
}

export interface PresetMap {
  metadata: PresetMapMetadata;
  data: MapData;
}

export interface SimplifiedMapData {
  width: number;
  height: number;
  tiles: TileData[][];
  paths: PathNode[][];
  spawnZones: SpawnZone[];
  decorations?: Decoration[];
  startingResources?: number;
  waveCount?: number;
}

export interface TileData {
  type: TerrainType;
  isPath: boolean;
  canPlaceTower: boolean;
}

export enum TerrainType {
  GRASS = 'GRASS',
  WATER = 'WATER',
  ROUGH = 'ROUGH',
  STONE = 'STONE'
}

export interface PathNode {
  x: number;
  y: number;
}

export interface SpawnZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  playerId?: number;
  enemyTypes?: string[];
  spawnRate?: number;
  waveMultiplier?: number;
}

export interface Decoration {
  type: string;
  x: number;
  y: number;
  variant?: number;
}

export interface MapRegistryEntry {
  id: string;
  name: string;
  description: string;
  difficulty: PresetMapMetadata['difficulty'];
  playerCount: PresetMapMetadata['playerCount'];
  supportedModes: GameMode[];
  thumbnail?: string;
  loadMap: () => Promise<PresetMap>;
}