import { describe, test, expect, beforeEach } from 'vitest';
import { Grid, CellType } from '@/systems/Grid';
import { BiomeType } from '@/types/MapData';
import { assertVector2Equal } from '../../helpers/assertions';

describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(10, 10, 32);
  });

  describe('constructor', () => {
    test('initializes with correct dimensions', () => {
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(10);
      expect(grid.cellSize).toBe(32);
    });

    test('initializes all cells as empty', () => {
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(grid.getCellType(x, y)).toBe(CellType.EMPTY);
        }
      }
    });

    test('uses default cell size when not provided', () => {
      const defaultGrid = new Grid(5, 5);
      expect(defaultGrid.cellSize).toBeDefined();
      expect(defaultGrid.cellSize).toBeGreaterThan(0);
    });
  });

  describe('isInBounds', () => {
    test('returns true for valid coordinates', () => {
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(5, 5)).toBe(true);
      expect(grid.isInBounds(9, 9)).toBe(true);
    });

    test('returns false for out of bounds coordinates', () => {
      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(0, -1)).toBe(false);
      expect(grid.isInBounds(10, 0)).toBe(false);
      expect(grid.isInBounds(0, 10)).toBe(false);
      expect(grid.isInBounds(100, 100)).toBe(false);
    });
  });

  describe('getCellType and setCellType', () => {
    test('gets and sets cell types correctly', () => {
      grid.setCellType(5, 5, CellType.PATH);
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
      
      grid.setCellType(3, 3, CellType.TOWER);
      expect(grid.getCellType(3, 3)).toBe(CellType.TOWER);
    });

    test('returns BLOCKED for out of bounds cells', () => {
      expect(grid.getCellType(-1, 0)).toBe(CellType.BLOCKED);
      expect(grid.getCellType(10, 10)).toBe(CellType.BLOCKED);
    });

    test('ignores setCellType for out of bounds', () => {
      grid.setCellType(-1, 0, CellType.PATH);
      grid.setCellType(10, 10, CellType.TOWER);
      // Should not throw
    });
  });

  describe('getCellData and setCellData', () => {
    test('gets and sets cell data correctly', () => {
      const cellData = {
        type: CellType.ROUGH_TERRAIN,
        movementSpeed: 0.5,
        height: 0.3
      };
      
      grid.setCellData(4, 4, cellData);
      const retrieved = grid.getCellData(4, 4);
      
      expect(retrieved).toEqual(cellData);
    });

    test('returns blocked cell data for out of bounds', () => {
      const data = grid.getCellData(-1, 0);
      expect(data).toEqual({ type: CellType.BLOCKED });
    });
  });

  describe('biome management', () => {
    test('sets and gets biome', () => {
      grid.setBiome(BiomeType.DESERT);
      expect(grid.getBiome()).toBe(BiomeType.DESERT);
      
      grid.setBiome(BiomeType.FOREST);
      expect(grid.getBiome()).toBe(BiomeType.FOREST);
    });
  });

  describe('movement speed', () => {
    test('returns correct movement speeds for different cell types', () => {
      grid.setCellType(0, 0, CellType.PATH);
      grid.setCellType(1, 0, CellType.BLOCKED);
      grid.setCellType(2, 0, CellType.ROUGH_TERRAIN);
      
      expect(grid.getMovementSpeed(0, 0)).toBeGreaterThan(1); // PATH is faster
      expect(grid.getMovementSpeed(1, 0)).toBe(0); // BLOCKED
      expect(grid.getMovementSpeed(2, 0)).toBeLessThan(1); // ROUGH_TERRAIN is slower
    });

    test('uses custom movement speed for rough terrain', () => {
      grid.setCellData(3, 3, {
        type: CellType.ROUGH_TERRAIN,
        movementSpeed: 0.3
      });
      
      expect(grid.getMovementSpeed(3, 3)).toBe(0.3);
    });

    test('returns 1.0 for normal empty cells', () => {
      expect(grid.getMovementSpeed(5, 5)).toBe(1.0);
    });
  });

  describe('coordinate conversion', () => {
    test('worldToGrid converts correctly', () => {
      // Cell size is 32
      assertVector2Equal(grid.worldToGrid({ x: 0, y: 0 }), { x: 0, y: 0 });
      assertVector2Equal(grid.worldToGrid({ x: 32, y: 32 }), { x: 1, y: 1 });
      assertVector2Equal(grid.worldToGrid({ x: 31, y: 31 }), { x: 0, y: 0 });
      assertVector2Equal(grid.worldToGrid({ x: 64, y: 96 }), { x: 2, y: 3 });
    });

    test('gridToWorld returns cell center', () => {
      // Cell size is 32, so center is at +16
      assertVector2Equal(grid.gridToWorld(0, 0), { x: 16, y: 16 });
      assertVector2Equal(grid.gridToWorld(1, 1), { x: 48, y: 48 });
      assertVector2Equal(grid.gridToWorld(2, 3), { x: 80, y: 112 });
    });
  });

  describe('placement and walkability checks', () => {
    test('canPlaceTower checks correctly', () => {
      expect(grid.canPlaceTower(5, 5)).toBe(true); // EMPTY
      
      grid.setCellType(5, 5, CellType.PATH);
      expect(grid.canPlaceTower(5, 5)).toBe(false);
      
      grid.setCellType(5, 5, CellType.DECORATIVE);
      expect(grid.canPlaceTower(5, 5)).toBe(true);
      
      expect(grid.canPlaceTower(-1, 0)).toBe(false); // Out of bounds
    });

    test('isWalkable checks correctly', () => {
      expect(grid.isWalkable(0, 0)).toBe(true); // EMPTY
      
      grid.setCellType(0, 0, CellType.PATH);
      expect(grid.isWalkable(0, 0)).toBe(true);
      
      grid.setCellType(0, 0, CellType.TOWER);
      expect(grid.isWalkable(0, 0)).toBe(false);
      
      grid.setCellType(0, 0, CellType.BRIDGE);
      expect(grid.isWalkable(0, 0)).toBe(true);
    });
  });

  describe('path management', () => {
    test('setPath sets path cells and clears old path', () => {
      const path1 = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
      grid.setPath(path1);
      
      path1.forEach(pos => {
        expect(grid.getCellType(pos.x, pos.y)).toBe(CellType.PATH);
      });
      
      const path2 = [{ x: 0, y: 1 }, { x: 1, y: 1 }];
      grid.setPath(path2);
      
      // Old path should be cleared
      path1.forEach(pos => {
        expect(grid.getCellType(pos.x, pos.y)).toBe(CellType.EMPTY);
      });
      
      // New path should be set
      path2.forEach(pos => {
        expect(grid.getCellType(pos.x, pos.y)).toBe(CellType.PATH);
      });
    });
  });

  describe('obstacle management', () => {
    test('addObstacles adds obstacles to empty cells', () => {
      const obstacles = [{ x: 2, y: 2 }, { x: 3, y: 3 }];
      grid.addObstacles(obstacles);
      
      expect(grid.getCellType(2, 2)).toBe(CellType.OBSTACLE);
      expect(grid.getCellType(3, 3)).toBe(CellType.OBSTACLE);
    });

    test('addObstacles skips non-empty cells', () => {
      grid.setCellType(2, 2, CellType.PATH);
      grid.addObstacles([{ x: 2, y: 2 }]);
      
      expect(grid.getCellType(2, 2)).toBe(CellType.PATH);
    });

    test('generateRandomObstacles respects boundaries', () => {
      grid.generateRandomObstacles(5);
      
      const obstacles = grid.getCellsOfType(CellType.OBSTACLE);
      expect(obstacles.length).toBeLessThanOrEqual(5);
      
      obstacles.forEach(obs => {
        expect(obs.x).toBeGreaterThan(2);
        expect(obs.x).toBeLessThan(grid.width - 2);
        expect(obs.y).toBeGreaterThan(2);
        expect(obs.y).toBeLessThan(grid.height - 2);
      });
    });
  });

  describe('neighbor queries', () => {
    test('getNeighbors returns all valid neighbors', () => {
      const neighbors = grid.getNeighbors(5, 5);
      expect(neighbors).toHaveLength(4);
      
      const expectedNeighbors = [
        { x: 5, y: 4 }, // Up
        { x: 6, y: 5 }, // Right
        { x: 5, y: 6 }, // Down
        { x: 4, y: 5 }  // Left
      ];
      
      expectedNeighbors.forEach(expected => {
        expect(neighbors).toContainEqual(expected);
      });
    });

    test('getNeighbors handles edge cells', () => {
      const cornorNeighbors = grid.getNeighbors(0, 0);
      expect(cornorNeighbors).toHaveLength(2);
      expect(cornorNeighbors).toContainEqual({ x: 1, y: 0 });
      expect(cornorNeighbors).toContainEqual({ x: 0, y: 1 });
    });

    test('getWalkableNeighbors filters out unwalkable cells', () => {
      grid.setCellType(5, 4, CellType.TOWER);
      grid.setCellType(6, 5, CellType.BLOCKED);
      
      const walkable = grid.getWalkableNeighbors(5, 5);
      expect(walkable).toHaveLength(2);
      expect(walkable).not.toContainEqual({ x: 5, y: 4 });
      expect(walkable).not.toContainEqual({ x: 6, y: 5 });
    });
  });

  describe('borders and spawn zones', () => {
    test('setBorders sets border cells', () => {
      grid.setBorders();
      
      // Check corners are BORDER
      expect(grid.getCellType(0, 0)).toBe(CellType.BORDER);
      expect(grid.getCellType(grid.width - 1, 0)).toBe(CellType.BORDER);
      expect(grid.getCellType(0, grid.height - 1)).toBe(CellType.BORDER);
      expect(grid.getCellType(grid.width - 1, grid.height - 1)).toBe(CellType.BORDER);
      
      // Check top and bottom edges (except corners) are BORDER
      for (let x = 1; x < grid.width - 1; x++) {
        expect(grid.getCellType(x, 0)).toBe(CellType.BORDER);
        expect(grid.getCellType(x, grid.height - 1)).toBe(CellType.BORDER);
      }
      
      // Check left and right borders (excluding corners)
      for (let y = 1; y < grid.height - 1; y++) {
        expect(grid.getCellType(0, y)).toBe(CellType.BORDER);
        expect(grid.getCellType(grid.width - 1, y)).toBe(CellType.BORDER);
      }
    });

    test('setSpawnZones sets spawn zone cells', () => {
      const spawnZones = [{ x: 1, y: 1 }, { x: 8, y: 8 }];
      grid.setSpawnZones(spawnZones);
      
      expect(grid.getCellType(1, 1)).toBe(CellType.SPAWN_ZONE);
      expect(grid.getCellType(8, 8)).toBe(CellType.SPAWN_ZONE);
    });
  });

  describe('cell queries', () => {
    test('getCellsOfType returns all cells of specified type', () => {
      grid.setCellType(1, 1, CellType.TOWER);
      grid.setCellType(3, 3, CellType.TOWER);
      grid.setCellType(5, 5, CellType.TOWER);
      
      const towers = grid.getCellsOfType(CellType.TOWER);
      expect(towers).toHaveLength(3);
      expect(towers).toContainEqual({ x: 1, y: 1 });
      expect(towers).toContainEqual({ x: 3, y: 3 });
      expect(towers).toContainEqual({ x: 5, y: 5 });
    });

    test('countCellsOfType counts correctly', () => {
      grid.setCellType(2, 2, CellType.PATH);
      grid.setCellType(3, 3, CellType.PATH);
      
      expect(grid.countCellsOfType(CellType.PATH)).toBe(2);
      expect(grid.countCellsOfType(CellType.EMPTY)).toBe(98); // 100 - 2
    });
  });

  describe('height management', () => {
    test('gets and sets height', () => {
      grid.setHeight(5, 5, 0.5);
      expect(grid.getHeight(5, 5)).toBe(0.5);
    });

    test('clamps height between 0 and 1', () => {
      grid.setHeight(0, 0, -0.5);
      expect(grid.getHeight(0, 0)).toBe(0);
      
      grid.setHeight(1, 1, 1.5);
      expect(grid.getHeight(1, 1)).toBe(1);
    });

    test('returns 0 for cells without height', () => {
      expect(grid.getHeight(5, 5)).toBe(0);
    });
  });
});