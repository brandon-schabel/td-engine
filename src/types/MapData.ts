import type { Vector2 } from '@/utils/Vector2';

export enum BiomeType {
  FOREST = 'FOREST',
  DESERT = 'DESERT',
  ARCTIC = 'ARCTIC',
  VOLCANIC = 'VOLCANIC',
  GRASSLAND = 'GRASSLAND'
}

export enum DecorationLevel {
  MINIMAL = 'MINIMAL',
  MODERATE = 'MODERATE',
  DENSE = 'DENSE'
}

export enum MapDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXTREME = 'EXTREME'
}

export interface BiomeColors {
  primary: string;      // Main terrain color
  secondary: string;    // Secondary terrain color
  accent: string;       // Accent elements
  path: string;         // Path color
  water: string;        // Water color (if applicable)
  border: string;       // Map border color
}

export interface BiomeConfig {
  type: BiomeType;
  colors: BiomeColors;
  obstacleTypes: string[];        // Types of obstacles for this biome
  decorationDensity: number;      // 0-1 decoration density
  terrainVariation: number;       // 0-1 terrain height variation
  waterPresence: boolean;         // Whether water features exist
  animatedElements: boolean;      // Whether to include animated decorations
}

export interface MapMetadata {
  name: string;
  description: string;
  difficulty: MapDifficulty;
  biome: BiomeType;
  seed: number;
  width: number;
  height: number;
  createdAt: Date;
  version: string;
}

export interface EnvironmentalEffect {
  type: 'PARTICLES' | 'ANIMATION' | 'LIGHTING' | 'WEATHER';
  position: Vector2;
  radius: number;
  intensity: number;
  properties: Record<string, any>;
}

export interface MapDecoration {
  type: string;              // tree, rock, flower, etc.
  position: Vector2;
  rotation: number;          // 0-360 degrees
  scale: number;             // size multiplier
  variant: number;           // which variant of the decoration
  animated: boolean;         // whether this decoration animates
  blocking: boolean;         // whether it blocks movement
}

export interface MapPath {
  waypoints: Vector2[];      // Grid coordinates of path
  width: number;             // Width in grid cells
  type: 'MAIN' | 'BRANCH';   // Path type
  connections: number[];     // Indices of connected paths
}

export interface SpawnZoneMetadata {
  position: Vector2;         // Grid position
  edgeType: string;         // EdgeType from SpawnZoneManager
  priority: number;         // Base priority for this spawn zone
  conditional?: {
    minWave?: number;       // Only active after this wave
    maxWave?: number;       // Only active until this wave
    lowLivesThreshold?: number; // Activate when lives drop below this
  };
}

export interface MapData {
  metadata: MapMetadata;
  biomeConfig: BiomeConfig;
  paths: MapPath[];
  decorations: MapDecoration[];
  effects: EnvironmentalEffect[];
  spawnZones: Vector2[];     // Enemy spawn locations (backward compatibility)
  spawnZonesWithMetadata?: SpawnZoneMetadata[]; // Enhanced spawn zones
  playerStart: Vector2;      // Player starting position
  
  // Terrain height map for 3D-like effects (optional)
  heightMap?: number[][];
  
  // Custom properties for specific map features
  customProperties: Record<string, any>;
}

export enum MapSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM', 
  LARGE = 'LARGE',
  HUGE = 'HUGE'
}

export interface MapSizePreset {
  width: number;
  height: number;
  baseObstacles: number;
  baseChokePoints: number;
  baseOpenAreas: number;
  baseAdvantageSpots: number;
}

export interface MapGenerationConfig {
  width: number;
  height: number;
  cellSize: number;
  biome: BiomeType;
  difficulty: MapDifficulty;
  seed?: number;
  
  // Generation parameters
  pathComplexity: number;     // 0-1, how winding paths are
  obstacleCount: number;      // Number of obstacles to place
  decorationLevel: DecorationLevel;
  enableWater: boolean;
  enableAnimations: boolean;
  
  // Strategic parameters
  chokePointCount: number;    // Number of strategic narrow points
  openAreaCount: number;      // Number of large open areas
  playerAdvantageSpots: number; // Number of elevated/advantageous positions
}

export interface MapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pathReachability: boolean;
  towerPlacementSpaces: number;
  strategicBalance: number;    // 0-1 rating of strategic balance
}

// Utility type for map generation algorithms
export interface GenerationAlgorithm {
  name: string;
  description: string;
  generate: (config: MapGenerationConfig) => MapData;
  validate: (mapData: MapData) => MapValidationResult;
}

// Biome presets for quick map generation
export const BIOME_PRESETS: Record<BiomeType, BiomeConfig> = {
  [BiomeType.FOREST]: {
    type: BiomeType.FOREST,
    colors: {
      primary: '#2D5016',
      secondary: '#3D6B1C',
      accent: '#8FBC8F',
      path: '#8B4513',
      water: '#4682B4',
      border: '#1C3A0D'
    },
    obstacleTypes: ['tree_oak', 'tree_pine', 'boulder', 'bush'],
    decorationDensity: 0.3,
    terrainVariation: 0.3,
    waterPresence: true,
    animatedElements: true
  },
  
  [BiomeType.DESERT]: {
    type: BiomeType.DESERT,
    colors: {
      primary: '#F4A460',
      secondary: '#D2B48C',
      accent: '#CD853F',
      path: '#8B4513',
      water: '#4682B4',
      border: '#A0522D'
    },
    obstacleTypes: ['cactus', 'rock_formation', 'dead_tree', 'sand_dune'],
    decorationDensity: 0.15,
    terrainVariation: 0.4,
    waterPresence: false,
    animatedElements: true
  },
  
  [BiomeType.ARCTIC]: {
    type: BiomeType.ARCTIC,
    colors: {
      primary: '#E6F3FF',
      secondary: '#B3D9FF',
      accent: '#87CEEB',
      path: '#708090',
      water: '#4682B4',
      border: '#4F94CD'
    },
    obstacleTypes: ['ice_formation', 'snow_pile', 'frozen_tree', 'ice_boulder'],
    decorationDensity: 0.2,
    terrainVariation: 0.2,
    waterPresence: true,
    animatedElements: true
  },
  
  [BiomeType.VOLCANIC]: {
    type: BiomeType.VOLCANIC,
    colors: {
      primary: '#2F1B14',
      secondary: '#8B0000',
      accent: '#FF4500',
      path: '#696969',
      water: '#FF6347',
      border: '#800000'
    },
    obstacleTypes: ['lava_rock', 'volcanic_boulder', 'ash_pile', 'lava_flow'],
    decorationDensity: 0.25,
    terrainVariation: 0.6,
    waterPresence: false,
    animatedElements: true
  },
  
  [BiomeType.GRASSLAND]: {
    type: BiomeType.GRASSLAND,
    colors: {
      primary: '#9ACD32',
      secondary: '#7CFC00',
      accent: '#32CD32',
      path: '#8B4513',
      water: '#4682B4',
      border: '#228B22'
    },
    obstacleTypes: ['small_tree', 'rock', 'flower_patch', 'tall_grass'],
    decorationDensity: 0.25,
    terrainVariation: 0.1,
    waterPresence: true,
    animatedElements: true
  }
};

// Map size presets for different gameplay experiences
export const MAP_SIZE_PRESETS: Record<MapSize, MapSizePreset> = {
  [MapSize.SMALL]: {
    width: 40,
    height: 30,
    baseObstacles: 40,
    baseChokePoints: 4,
    baseOpenAreas: 6,
    baseAdvantageSpots: 4
  },
  
  [MapSize.MEDIUM]: {
    width: 60,
    height: 44,
    baseObstacles: 70,
    baseChokePoints: 8,
    baseOpenAreas: 10,
    baseAdvantageSpots: 6
  },
  
  [MapSize.LARGE]: {
    width: 80,
    height: 60,
    baseObstacles: 110,
    baseChokePoints: 12,
    baseOpenAreas: 14,
    baseAdvantageSpots: 10
  },
  
  [MapSize.HUGE]: {
    width: 100,
    height: 70,
    baseObstacles: 150,
    baseChokePoints: 16,
    baseOpenAreas: 20,
    baseAdvantageSpots: 14
  }
};