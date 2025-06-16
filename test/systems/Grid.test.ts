/**
 * Unit tests for Grid system
 * Tests cell management, pathfinding helpers, and grid utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Grid, CellType } from '@/systems/Grid';
import { BiomeType } from '@/types/MapData';
import { createMockVector2, createMockGrid } from '../helpers/mockData';
import { assertVector2Equal } from '../helpers/testUtils';

describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(10, 10, 32);
  });

  describe('constructor', () => {
    it('should create grid with correct dimensions', () => {
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(10);
      expect(grid.cellSize).toBe(32);
    });

    it('should initialize all cells as empty', () => {
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          expect(grid.getCellType(x, y)).toBe(CellType.EMPTY);
        }
      }
    });

    it('should use default cell size when not provided', () => {
      const defaultGrid = new Grid(5, 5);
      expect(defaultGrid.cellSize).toBe(32); // Default from UIConfig
    });
  });

  describe('isInBounds', () => {
    it('should return true for valid coordinates', () => {
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(5, 5)).toBe(true);
      expect(grid.isInBounds(9, 9)).toBe(true);
    });

    it('should return false for out of bounds coordinates', () => {
      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(0, -1)).toBe(false);
      expect(grid.isInBounds(10, 0)).toBe(false);
      expect(grid.isInBounds(0, 10)).toBe(false);
      expect(grid.isInBounds(100, 100)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(grid.isInBounds(9, 9)).toBe(true);
      expect(grid.isInBounds(10, 9)).toBe(false);
      expect(grid.isInBounds(9, 10)).toBe(false);
    });
  });

  describe('getCellType and setCellType', () => {
    it('should get and set cell types', () => {
      grid.setCellType(3, 4, CellType.TOWER);
      expect(grid.getCellType(3, 4)).toBe(CellType.TOWER);
      
      grid.setCellType(5, 5, CellType.PATH);
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
    });

    it('should return BLOCKED for out of bounds', () => {
      expect(grid.getCellType(-1, 0)).toBe(CellType.BLOCKED);
      expect(grid.getCellType(10, 5)).toBe(CellType.BLOCKED);
    });

    it('should ignore setting out of bounds cells', () => {
      grid.setCellType(-1, 0, CellType.TOWER);
      grid.setCellType(10, 5, CellType.PATH);
      // Should not throw
    });

    it('should handle all cell types', () => {
      const cellTypes = Object.values(CellType);
      cellTypes.forEach((type, index) => {
        if (index < grid.width) {
          grid.setCellType(index, 0, type);
          expect(grid.getCellType(index, 0)).toBe(type);
        }
      });
    });
  });

  describe('getCellData and setCellData', () => {
    it('should get and set cell data', () => {
      const cellData = {
        type: CellType.ROUGH_TERRAIN,
        movementSpeed: 0.5,
        height: 0.3,
        biomeVariant: 'desert',
      };
      
      grid.setCellData(2, 3, cellData);
      const retrieved = grid.getCellData(2, 3);
      
      expect(retrieved).toEqual(cellData);
    });

    it('should return BLOCKED data for out of bounds', () => {
      const data = grid.getCellData(-1, 0);
      expect(data).toEqual({ type: CellType.BLOCKED });
    });

    it('should handle decorations in cell data', () => {
      const cellData = {
        type: CellType.DECORATIVE,
        decoration: {
          position: { x: 100, y: 100 },
          type: 'tree',
          variant: 0,
          blocking: false,
        },
      };
      
      grid.setCellData(5, 5, cellData);
      expect(grid.getCellData(5, 5)).toEqual(cellData);
    });
  });

  describe('biome management', () => {
    it('should set and get biome', () => {
      expect(grid.getBiome()).toBe(BiomeType.GRASSLAND); // Default
      
      grid.setBiome(BiomeType.DESERT);
      expect(grid.getBiome()).toBe(BiomeType.DESERT);
      
      grid.setBiome(BiomeType.SNOW);
      expect(grid.getBiome()).toBe(BiomeType.SNOW);
    });
  });

  describe('movement speed calculations', () => {
    it('should return correct movement speeds', () => {
      expect(grid.getMovementSpeed(0, 0)).toBe(1.0); // Empty cell
      
      grid.setCellType(1, 1, CellType.PATH);
      expect(grid.getMovementSpeed(1, 1)).toBe(1.2); // Path bonus
      
      grid.setCellType(2, 2, CellType.BLOCKED);
      expect(grid.getMovementSpeed(2, 2)).toBe(0.0);
    });

    it('should use custom movement speed for rough terrain', () => {
      grid.setCellData(3, 3, {
        type: CellType.ROUGH_TERRAIN,
        movementSpeed: 0.3,
      });
      expect(grid.getMovementSpeed(3, 3)).toBe(0.3);
    });

    it('should use default rough terrain speed when not specified', () => {
      grid.setCellType(4, 4, CellType.ROUGH_TERRAIN);
      expect(grid.getMovementSpeed(4, 4)).toBe(0.5); // Default from config
    });

    it('should return 0 for water and obstacles', () => {
      grid.setCellType(5, 5, CellType.WATER);
      expect(grid.getMovementSpeed(5, 5)).toBe(0.0);
      
      grid.setCellType(6, 6, CellType.OBSTACLE);
      expect(grid.getMovementSpeed(6, 6)).toBe(0.0);
    });
  });

  describe('coordinate conversion', () => {
    it('should convert world to grid coordinates', () => {
      const worldPos = createMockVector2(100, 200);
      const gridPos = grid.worldToGrid(worldPos);
      
      expect(gridPos.x).toBe(3); // 100 / 32
      expect(gridPos.y).toBe(6); // 200 / 32
    });

    it('should handle edge cases in world to grid', () => {
      expect(grid.worldToGrid({ x: 31, y: 31 })).toEqual({ x: 0, y: 0 });
      expect(grid.worldToGrid({ x: 32, y: 32 })).toEqual({ x: 1, y: 1 });
      expect(grid.worldToGrid({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });

    it('should convert grid to world coordinates (center of cell)', () => {
      const worldPos = grid.gridToWorld(3, 6);
      
      expect(worldPos.x).toBe(3 * 32 + 16); // 112
      expect(worldPos.y).toBe(6 * 32 + 16); // 208
    });

    it('should handle negative coordinates', () => {
      const negWorld = grid.worldToGrid({ x: -10, y: -20 });
      expect(negWorld.x).toBe(-1);
      expect(negWorld.y).toBe(-1);
    });
  });

  describe('tower placement', () => {
    it('should allow tower placement on empty cells', () => {
      expect(grid.canPlaceTower(5, 5)).toBe(true);
    });

    it('should allow tower placement on decorative cells', () => {
      grid.setCellType(5, 5, CellType.DECORATIVE);
      expect(grid.canPlaceTower(5, 5)).toBe(true);
    });

    it('should not allow tower placement on paths', () => {
      grid.setCellType(5, 5, CellType.PATH);
      expect(grid.canPlaceTower(5, 5)).toBe(false);
    });

    it('should not allow tower placement out of bounds', () => {
      expect(grid.canPlaceTower(-1, 0)).toBe(false);
      expect(grid.canPlaceTower(10, 10)).toBe(false);
    });

    it('should not allow tower placement on other cell types', () => {
      const nonPlaceableTypes = [
        CellType.TOWER, CellType.BLOCKED, CellType.OBSTACLE,
        CellType.WATER, CellType.SPAWN_ZONE, CellType.BORDER,
      ];
      
      nonPlaceableTypes.forEach((type, index) => {
        grid.setCellType(index, 0, type);
        expect(grid.canPlaceTower(index, 0)).toBe(false);
      });
    });
  });

  describe('walkability checks', () => {
    it('should check walkable cells correctly', () => {
      const walkableTypes = [
        CellType.EMPTY, CellType.PATH, CellType.ROUGH_TERRAIN,
        CellType.BRIDGE, CellType.SPAWN_ZONE,
      ];
      
      walkableTypes.forEach((type, index) => {
        grid.setCellType(index, 0, type);
        expect(grid.isWalkable(index, 0)).toBe(true);
      });
    });

    it('should check non-walkable cells correctly', () => {
      const nonWalkableTypes = [
        CellType.TOWER, CellType.BLOCKED, CellType.OBSTACLE,
        CellType.WATER, CellType.DECORATIVE, CellType.BORDER,
      ];
      
      nonWalkableTypes.forEach((type, index) => {
        grid.setCellType(index, 1, type);
        expect(grid.isWalkable(index, 1)).toBe(false);
      });
    });

    it('should check enemy passability', () => {
      // Currently same as walkable, but tested separately for future changes
      grid.setCellType(0, 0, CellType.PATH);
      expect(grid.isPassableForEnemies(0, 0)).toBe(true);
      
      grid.setCellType(1, 1, CellType.TOWER);
      expect(grid.isPassableForEnemies(1, 1)).toBe(false);
    });
  });

  describe('path management', () => {
    it('should set path coordinates', () => {
      const pathCoords = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ];
      
      grid.setPath(pathCoords);
      
      pathCoords.forEach(coord => {
        expect(grid.getCellType(coord.x, coord.y)).toBe(CellType.PATH);
      });
    });

    it('should clear existing path when setting new one', () => {
      // Set initial path
      grid.setPath([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
      
      // Set new path
      grid.setPath([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
      
      // Old path should be cleared
      expect(grid.getCellType(0, 0)).toBe(CellType.EMPTY);
      expect(grid.getCellType(1, 0)).toBe(CellType.EMPTY);
      
      // New path should be set
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
      expect(grid.getCellType(6, 5)).toBe(CellType.PATH);
    });

    it('should ignore out of bounds path coordinates', () => {
      grid.setPath([
        { x: 5, y: 5 },
        { x: 100, y: 100 }, // Out of bounds
        { x: 6, y: 5 },
      ]);
      
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
      expect(grid.getCellType(6, 5)).toBe(CellType.PATH);
    });
  });

  describe('obstacle generation', () => {
    it('should add obstacles at specified coordinates', () => {
      const obstacles = [
        { x: 2, y: 2 },
        { x: 4, y: 4 },
        { x: 6, y: 6 },
      ];
      
      grid.addObstacles(obstacles);
      
      obstacles.forEach(pos => {
        expect(grid.getCellType(pos.x, pos.y)).toBe(CellType.OBSTACLE);
      });
    });

    it('should not overwrite non-empty cells', () => {
      grid.setCellType(5, 5, CellType.PATH);
      grid.addObstacles([{ x: 5, y: 5 }]);
      
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
    });

    it('should generate random obstacles', () => {
      grid.generateRandomObstacles(10);
      
      let obstacleCount = 0;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          if (grid.getCellType(x, y) === CellType.OBSTACLE) {
            obstacleCount++;
            // Check that obstacles are not near edges
            expect(x).toBeGreaterThan(2);
            expect(x).toBeLessThan(grid.width - 2);
            expect(y).toBeGreaterThan(2);
            expect(y).toBeLessThan(grid.height - 2);
          }
        }
      }
      
      // May be less than requested due to random placement
      expect(obstacleCount).toBeGreaterThan(0);
      expect(obstacleCount).toBeLessThanOrEqual(10);
    });
  });

  describe('neighbor finding', () => {
    it('should find all neighbors', () => {
      const neighbors = grid.getNeighbors(5, 5);
      
      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 5, y: 4 }); // Up
      expect(neighbors).toContainEqual({ x: 6, y: 5 }); // Right
      expect(neighbors).toContainEqual({ x: 5, y: 6 }); // Down
      expect(neighbors).toContainEqual({ x: 4, y: 5 }); // Left
    });

    it('should handle edge neighbors', () => {
      const cornerNeighbors = grid.getNeighbors(0, 0);
      expect(cornerNeighbors).toHaveLength(2);
      expect(cornerNeighbors).toContainEqual({ x: 1, y: 0 });
      expect(cornerNeighbors).toContainEqual({ x: 0, y: 1 });
    });

    it('should find walkable neighbors only', () => {
      grid.setCellType(5, 4, CellType.OBSTACLE);
      grid.setCellType(6, 5, CellType.TOWER);
      
      const walkableNeighbors = grid.getWalkableNeighbors(5, 5);
      
      expect(walkableNeighbors).toHaveLength(2);
      expect(walkableNeighbors).toContainEqual({ x: 5, y: 6 });
      expect(walkableNeighbors).toContainEqual({ x: 4, y: 5 });
    });
  });

  describe('decorations', () => {
    it('should add decorations', () => {
      const decorations = [
        {
          position: { x: 100, y: 100 },
          type: 'tree',
          variant: 0,
          blocking: true,
        },
        {
          position: { x: 200, y: 200 },
          type: 'rock',
          variant: 1,
          blocking: false,
        },
      ];
      
      grid.addDecorations(decorations);
      
      const cell1 = grid.getCellData(3, 3); // 100/32 = 3
      expect(cell1?.type).toBe(CellType.OBSTACLE);
      expect(cell1?.decoration).toEqual(decorations[0]);
      
      const cell2 = grid.getCellData(6, 6); // 200/32 = 6
      expect(cell2?.type).toBe(CellType.DECORATIVE);
      expect(cell2?.decoration).toEqual(decorations[1]);
    });
  });

  describe('borders', () => {
    it('should set border cells', () => {
      grid.setBorders();
      
      // Check top and bottom borders
      for (let x = 0; x < grid.width; x++) {
        expect(grid.getCellType(x, 0)).toBe(CellType.BORDER);
        expect(grid.getCellType(x, grid.height - 1)).toBe(CellType.BORDER);
      }
      
      // Check left and right borders
      for (let y = 0; y < grid.height; y++) {
        expect(grid.getCellType(0, y)).toBe(CellType.BORDER);
        expect(grid.getCellType(grid.width - 1, y)).toBe(CellType.BORDER);
      }
      
      // Check interior is not affected
      expect(grid.getCellType(5, 5)).toBe(CellType.EMPTY);
    });
  });

  describe('spawn zones', () => {
    it('should set spawn zones', () => {
      const spawnZones = [
        { x: 0, y: 5 },
        { x: 9, y: 5 },
      ];
      
      grid.setSpawnZones(spawnZones);
      
      spawnZones.forEach(spawn => {
        expect(grid.getCellType(spawn.x, spawn.y)).toBe(CellType.SPAWN_ZONE);
      });
    });
  });

  describe('cell queries', () => {
    it('should get all cells of type', () => {
      grid.setCellType(1, 1, CellType.TOWER);
      grid.setCellType(3, 3, CellType.TOWER);
      grid.setCellType(5, 5, CellType.TOWER);
      
      const towers = grid.getCellsOfType(CellType.TOWER);
      
      expect(towers).toHaveLength(3);
      expect(towers).toContainEqual({ x: 1, y: 1 });
      expect(towers).toContainEqual({ x: 3, y: 3 });
      expect(towers).toContainEqual({ x: 5, y: 5 });
    });

    it('should count cells of type', () => {
      grid.setCellType(1, 1, CellType.PATH);
      grid.setCellType(2, 1, CellType.PATH);
      grid.setCellType(3, 1, CellType.PATH);
      
      expect(grid.countCellsOfType(CellType.PATH)).toBe(3);
      expect(grid.countCellsOfType(CellType.TOWER)).toBe(0);
    });
  });

  describe('height management', () => {
    it('should get and set height', () => {
      grid.setHeight(5, 5, 0.5);
      expect(grid.getHeight(5, 5)).toBe(0.5);
    });

    it('should clamp height values', () => {
      grid.setHeight(1, 1, -0.5);
      expect(grid.getHeight(1, 1)).toBe(0);
      
      grid.setHeight(2, 2, 1.5);
      expect(grid.getHeight(2, 2)).toBe(1);
    });

    it('should return 0 for cells without height', () => {
      expect(grid.getHeight(0, 0)).toBe(0);
    });
  });
});