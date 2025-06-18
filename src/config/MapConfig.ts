/**
 * Map generation and terrain configuration constants
 * Centralizes all map-related settings and generation parameters
 */

import type { TerrainType, BiomeType } from '@/types/Terrain';

// Map size presets
export const MAP_SIZES = {
  SMALL: {
    width: 30,
    height: 22,
    cellSize: 32,
    minPaths: 1,
    maxPaths: 2
  },
  MEDIUM: {
    width: 45,
    height: 33,
    cellSize: 32,
    minPaths: 2,
    maxPaths: 3
  },
  LARGE: {
    width: 60,
    height: 45,
    cellSize: 32,
    minPaths: 3,
    maxPaths: 4
  }
} as const;

// Default map generation config
export const DEFAULT_MAP_CONFIG = {
  width: 25,
  height: 19,
  cellSize: 32,
  defaultComplexity: 3,
  defaultPathCount: 2,
  minPathLength: 10,
  spawnZoneCount: {
    easy: 5,
    medium: 4,
    hard: 3
  }
} as const;

// Biome-specific configuration
export const BIOME_CONFIG = {
  FOREST: {
    obstacleChance: 0.25,
    roughTerrainChance: 0.15,
    preferredObstacles: ['tree', 'rock'],
    pathColor: '#654321',
    backgroundColor: '#1a3a1a'
  },
  DESERT: {
    obstacleChance: 0.15,
    roughTerrainChance: 0.3,
    preferredObstacles: ['cactus', 'dune'],
    pathColor: '#c2976a',
    backgroundColor: '#d4a574'
  },
  ARCTIC: {
    obstacleChance: 0.2,
    roughTerrainChance: 0.25,
    preferredObstacles: ['ice', 'snow'],
    pathColor: '#e0e0e0',
    backgroundColor: '#f0f8ff'
  },
  VOLCANIC: {
    obstacleChance: 0.3,
    roughTerrainChance: 0.35,
    preferredObstacles: ['lava', 'obsidian'],
    pathColor: '#8b0000',
    backgroundColor: '#2f1f1f'
  }
} as const;

// Terrain type properties
export const TERRAIN_PROPERTIES = {
  EMPTY: {
    walkable: true,
    buildable: true,
    speedMultiplier: 1.0,
    color: '#1a1a1a'
  },
  PATH: {
    walkable: true,
    buildable: false,
    speedMultiplier: 1.2,
    color: '#654321'
  },
  ROUGH_TERRAIN: {
    walkable: true,
    buildable: true,
    speedMultiplier: 0.5,
    color: '#8B4513'
  },
  OBSTACLE: {
    walkable: false,
    buildable: false,
    speedMultiplier: 0,
    color: '#666666'
  },
  SPAWN: {
    walkable: true,
    buildable: false,
    speedMultiplier: 1.0,
    color: '#4a4a00'
  },
  DESTINATION: {
    walkable: true,
    buildable: false,
    speedMultiplier: 1.0,
    color: '#004a00'
  }
} as const;

// Path generation configuration
export const PATH_GENERATION = {
  minSegmentLength: 3,
  maxSegmentLength: 8,
  turnProbability: 0.3,
  branchProbability: 0.2,
  minPathWidth: 1,
  maxPathWidth: 2,
  smoothingIterations: 2
} as const;

// Obstacle generation configuration
export const OBSTACLE_GENERATION = {
  minSize: 1,
  maxSize: 3,
  clusterProbability: 0.4,
  minDistanceFromPath: 1,
  maxObstaclesPerChunk: 5
} as const;

// Map validation rules
export const MAP_VALIDATION = {
  minSpawnZones: 1,
  maxSpawnZones: 10,
  minDestinationZones: 1,
  maxDestinationZones: 5,
  minPathCoverage: 0.1, // 10% of map should be paths
  maxPathCoverage: 0.4, // 40% max
  requiredEmptySpaceRatio: 0.3 // At least 30% buildable space
} as const;

// Map generation complexity presets
export const COMPLEXITY_PRESETS = {
  SIMPLE: {
    pathComplexity: 1,
    obstacleComplexity: 1,
    terrainVariation: 'low'
  },
  MODERATE: {
    pathComplexity: 3,
    obstacleComplexity: 3,
    terrainVariation: 'medium'
  },
  COMPLEX: {
    pathComplexity: 5,
    obstacleComplexity: 5,
    terrainVariation: 'high'
  }
} as const;