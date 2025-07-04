import { SimplifiedMapData, TerrainType } from './types';

// Helper function to generate tiles with path marked
function generateTiles(width: number, height: number, paths: {x: number, y: number}[][], waterTiles: {x: number, y: number}[] = [], roughTiles: {x: number, y: number}[] = []): any[][] {
  const tiles = Array(height).fill(null).map(() =>
    Array(width).fill(null).map(() => ({
      type: TerrainType.GRASS,
      isPath: false,
      canPlaceTower: true
    }))
  );

  // Mark path tiles
  paths.forEach(path => {
    path.forEach(node => {
      if (node.x >= 0 && node.x < width && node.y >= 0 && node.y < height) {
        tiles[node.y][node.x] = {
          type: TerrainType.GRASS,
          isPath: true,
          canPlaceTower: false
        };
      }
    });
  });

  // Add water tiles
  waterTiles.forEach(pos => {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height && !tiles[pos.y][pos.x].isPath) {
      tiles[pos.y][pos.x] = {
        type: TerrainType.WATER,
        isPath: false,
        canPlaceTower: false
      };
    }
  });

  // Add rough terrain
  roughTiles.forEach(pos => {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height && !tiles[pos.y][pos.x].isPath) {
      tiles[pos.y][pos.x] = {
        type: TerrainType.ROUGH,
        isPath: false,
        canPlaceTower: true
      };
    }
  });

  return tiles;
}

// Classic map - simple winding path
const classicPath = [
  {x: 0, y: 10}, {x: 1, y: 10}, {x: 2, y: 10}, {x: 3, y: 10}, {x: 4, y: 10},
  {x: 5, y: 10}, {x: 6, y: 10}, {x: 7, y: 10}, {x: 8, y: 10}, {x: 8, y: 9},
  {x: 8, y: 8}, {x: 8, y: 7}, {x: 8, y: 6}, {x: 8, y: 5}, {x: 9, y: 5},
  {x: 10, y: 5}, {x: 11, y: 5}, {x: 12, y: 5}, {x: 13, y: 5}, {x: 14, y: 5},
  {x: 15, y: 5}, {x: 16, y: 5}, {x: 16, y: 6}, {x: 16, y: 7}, {x: 16, y: 8},
  {x: 16, y: 9}, {x: 16, y: 10}, {x: 16, y: 11}, {x: 16, y: 12}, {x: 16, y: 13},
  {x: 16, y: 14}, {x: 16, y: 15}, {x: 17, y: 15}, {x: 18, y: 15}, {x: 19, y: 15},
  {x: 20, y: 15}, {x: 21, y: 15}, {x: 22, y: 15}, {x: 23, y: 15}, {x: 24, y: 15},
  {x: 24, y: 14}, {x: 24, y: 13}, {x: 24, y: 12}, {x: 24, y: 11}, {x: 24, y: 10},
  {x: 24, y: 9}, {x: 24, y: 8}, {x: 25, y: 8}, {x: 26, y: 8}, {x: 27, y: 8},
  {x: 28, y: 8}, {x: 29, y: 8}
];

export const CLASSIC_MAP: SimplifiedMapData = {
  width: 30,
  height: 20,
  tiles: generateTiles(30, 20, [classicPath], 
    // Water tiles
    [
      {x: 12, y: 8}, {x: 13, y: 8}, {x: 12, y: 9}, {x: 13, y: 9},
      {x: 19, y: 2}, {x: 20, y: 2}, {x: 19, y: 3}, {x: 20, y: 3},
      {x: 5, y: 17}, {x: 6, y: 17}, {x: 5, y: 18}, {x: 6, y: 18}
    ],
    // Rough terrain
    [
      {x: 3, y: 14}, {x: 4, y: 14}, {x: 3, y: 15}, {x: 4, y: 15},
      {x: 22, y: 4}, {x: 23, y: 4}, {x: 22, y: 5}, {x: 23, y: 5},
      {x: 10, y: 12}, {x: 11, y: 12}
    ]
  ),
  paths: [classicPath],
  spawnZones: [{
    id: "spawn1",
    x: -2,
    y: 9,
    width: 2,
    height: 2
  }],
  decorations: [
    {type: "tree", x: 3, y: 3, variant: 1},
    {type: "tree", x: 5, y: 2, variant: 2},
    {type: "tree", x: 12, y: 12, variant: 1},
    {type: "tree", x: 20, y: 3, variant: 3},
    {type: "rock", x: 10, y: 18, variant: 1},
    {type: "rock", x: 25, y: 2, variant: 2},
    {type: "bush", x: 7, y: 15, variant: 1},
    {type: "bush", x: 18, y: 7, variant: 2}
  ],
  startingResources: 500,
  waveCount: 30
};

// Crossroads - multiple paths converge
const crossroadsPath1 = Array.from({length: 30}, (_, i) => ({x: i, y: 10}));
const crossroadsPath2 = Array.from({length: 10}, (_, i) => ({x: 15, y: i}));
const crossroadsPath3 = Array.from({length: 10}, (_, i) => ({x: 15, y: 19 - i}));

export const CROSSROADS_MAP: SimplifiedMapData = {
  width: 30,
  height: 20,
  tiles: generateTiles(30, 20, [crossroadsPath1, crossroadsPath2, crossroadsPath3],
    // Water tiles
    [
      {x: 5, y: 3}, {x: 6, y: 3}, {x: 5, y: 4}, {x: 6, y: 4},
      {x: 23, y: 16}, {x: 24, y: 16}, {x: 23, y: 17}, {x: 24, y: 17},
      {x: 14, y: 9}, {x: 16, y: 9}, {x: 14, y: 11}, {x: 16, y: 11}
    ],
    // Rough terrain
    [
      {x: 8, y: 15}, {x: 9, y: 15}, {x: 8, y: 16}, {x: 9, y: 16},
      {x: 20, y: 4}, {x: 21, y: 4}, {x: 20, y: 5}, {x: 21, y: 5}
    ]
  ),
  paths: [crossroadsPath1, crossroadsPath2, crossroadsPath3],
  spawnZones: [
    {id: "spawn1", x: -2, y: 9, width: 2, height: 2},
    {id: "spawn2", x: 14, y: -2, width: 2, height: 2},
    {id: "spawn3", x: 14, y: 20, width: 2, height: 2}
  ],
  decorations: [
    {type: "tree", x: 3, y: 6, variant: 1},
    {type: "tree", x: 25, y: 13, variant: 2},
    {type: "rock", x: 10, y: 2, variant: 1},
    {type: "rock", x: 20, y: 18, variant: 2},
    {type: "bush", x: 7, y: 14, variant: 1},
    {type: "bush", x: 22, y: 7, variant: 2}
  ],
  startingResources: 600,
  waveCount: 40
};

// Spiral - enemies spiral inward
function generateSpiralPath(): {x: number, y: number}[] {
  const path: {x: number, y: number}[] = [];
  
  // Outer ring
  for (let x = 0; x < 29; x++) path.push({x, y: 1});
  for (let y = 1; y < 18; y++) path.push({x: 28, y});
  for (let x = 28; x > 2; x--) path.push({x, y: 18});
  for (let y = 18; y > 3; y--) path.push({x: 2, y});
  
  // Middle ring
  for (let x = 2; x < 26; x++) path.push({x, y: 3});
  for (let y = 3; y < 16; y++) path.push({x: 26, y});
  for (let x = 26; x > 4; x--) path.push({x, y: 16});
  for (let y = 16; y > 5; y--) path.push({x: 4, y});
  
  // Inner path to center
  for (let x = 4; x < 15; x++) path.push({x, y: 5});
  for (let y = 6; y <= 10; y++) path.push({x: 15, y});
  
  return path;
}

const spiralPath = generateSpiralPath();

export const SPIRAL_MAP: SimplifiedMapData = {
  width: 30,
  height: 20,
  tiles: generateTiles(30, 20, [spiralPath],
    // Water in center
    [
      {x: 13, y: 8}, {x: 14, y: 8}, {x: 16, y: 8}, {x: 17, y: 8},
      {x: 13, y: 9}, {x: 14, y: 9}, {x: 16, y: 9}, {x: 17, y: 9},
      {x: 13, y: 10}, {x: 14, y: 10}, {x: 16, y: 10}, {x: 17, y: 10},
      {x: 13, y: 11}, {x: 14, y: 11}, {x: 16, y: 11}, {x: 17, y: 11}
    ],
    // Rough terrain
    [
      {x: 7, y: 7}, {x: 8, y: 7}, {x: 7, y: 8}, {x: 8, y: 8},
      {x: 21, y: 11}, {x: 22, y: 11}, {x: 21, y: 12}, {x: 22, y: 12}
    ]
  ),
  paths: [spiralPath],
  spawnZones: [{id: "spawn1", x: -2, y: 0, width: 2, height: 2}],
  decorations: [
    {type: "tree", x: 10, y: 13, variant: 1},
    {type: "tree", x: 19, y: 6, variant: 2},
    {type: "rock", x: 6, y: 10, variant: 1},
    {type: "rock", x: 23, y: 9, variant: 2},
    {type: "bush", x: 11, y: 2, variant: 1},
    {type: "bush", x: 18, y: 15, variant: 2}
  ],
  startingResources: 700,
  waveCount: 50
};

// Arena - open map for PvP
export const ARENA_MAP: SimplifiedMapData = {
  width: 40,
  height: 30,
  tiles: generateTiles(40, 30, 
    // Four paths from corners to center
    [
      // Top-left to center
      Array.from({length: 20}, (_, i) => ({x: i, y: 5})).concat(
        Array.from({length: 10}, (_, i) => ({x: 19, y: 5 + i}))
      ),
      // Top-right to center
      Array.from({length: 20}, (_, i) => ({x: 39 - i, y: 5})).concat(
        Array.from({length: 10}, (_, i) => ({x: 20, y: 5 + i}))
      ),
      // Bottom-left to center
      Array.from({length: 20}, (_, i) => ({x: i, y: 24})).concat(
        Array.from({length: 10}, (_, i) => ({x: 19, y: 24 - i}))
      ),
      // Bottom-right to center
      Array.from({length: 20}, (_, i) => ({x: 39 - i, y: 24})).concat(
        Array.from({length: 10}, (_, i) => ({x: 20, y: 24 - i}))
      )
    ],
    // Water features
    [
      // Center area
      {x: 18, y: 13}, {x: 19, y: 13}, {x: 20, y: 13}, {x: 21, y: 13},
      {x: 18, y: 14}, {x: 21, y: 14},
      {x: 18, y: 15}, {x: 21, y: 15},
      {x: 18, y: 16}, {x: 19, y: 16}, {x: 20, y: 16}, {x: 21, y: 16}
    ],
    // Rough terrain corners
    [
      {x: 5, y: 8}, {x: 6, y: 8}, {x: 5, y: 9}, {x: 6, y: 9},
      {x: 33, y: 8}, {x: 34, y: 8}, {x: 33, y: 9}, {x: 34, y: 9},
      {x: 5, y: 20}, {x: 6, y: 20}, {x: 5, y: 21}, {x: 6, y: 21},
      {x: 33, y: 20}, {x: 34, y: 20}, {x: 33, y: 21}, {x: 34, y: 21}
    ]
  ),
  paths: [],
  spawnZones: [
    {id: "spawn1", x: -2, y: 4, width: 2, height: 2, playerId: 0},
    {id: "spawn2", x: 40, y: 4, width: 2, height: 2, playerId: 1},
    {id: "spawn3", x: -2, y: 23, width: 2, height: 2, playerId: 2},
    {id: "spawn4", x: 40, y: 23, width: 2, height: 2, playerId: 3}
  ],
  decorations: [
    {type: "tree", x: 10, y: 10, variant: 1},
    {type: "tree", x: 29, y: 10, variant: 2},
    {type: "tree", x: 10, y: 19, variant: 3},
    {type: "tree", x: 29, y: 19, variant: 1},
    {type: "rock", x: 15, y: 7, variant: 1},
    {type: "rock", x: 24, y: 22, variant: 2}
  ],
  startingResources: 800,
  waveCount: 60
};

// Tutorial - simple straight path
export const TUTORIAL_MAP: SimplifiedMapData = {
  width: 25,
  height: 15,
  tiles: generateTiles(25, 15,
    [Array.from({length: 25}, (_, i) => ({x: i, y: 7}))],
    // Small water features
    [{x: 8, y: 3}, {x: 9, y: 3}, {x: 8, y: 4}, {x: 9, y: 4},
     {x: 15, y: 10}, {x: 16, y: 10}, {x: 15, y: 11}, {x: 16, y: 11}],
    // Minimal rough terrain
    [{x: 5, y: 11}, {x: 6, y: 11}, {x: 18, y: 3}, {x: 19, y: 3}]
  ),
  paths: [Array.from({length: 25}, (_, i) => ({x: i, y: 7}))],
  spawnZones: [{id: "spawn1", x: -2, y: 6, width: 2, height: 2}],
  decorations: [
    {type: "tree", x: 3, y: 2, variant: 1},
    {type: "tree", x: 20, y: 12, variant: 2},
    {type: "rock", x: 12, y: 2, variant: 1},
    {type: "bush", x: 7, y: 12, variant: 1}
  ],
  startingResources: 1000,
  waveCount: 20
};

// Export all maps as a registry
export const PRESET_MAPS = {
  classic: CLASSIC_MAP,
  crossroads: CROSSROADS_MAP,
  spiral: SPIRAL_MAP,
  arena: ARENA_MAP,
  tutorial: TUTORIAL_MAP
} as const;

export type PresetMapId = keyof typeof PRESET_MAPS;