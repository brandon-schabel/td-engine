import { describe, it, expect, beforeEach } from 'vitest';
import { Grid, CellType } from '@/systems/Grid';
import type { Vector2 } from '@/utils/Vector2';

describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(10, 10, 32); // 10x10 grid with 32px cells
  });

  describe('initialization', () => {
    it('should create a grid with correct dimensions', () => {
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(10);
      expect(grid.cellSize).toBe(32);
    });

    it('should initialize all cells as empty', () => {
      for (let x = 0; x < grid.width; x++) {
        for (let y = 0; y < grid.height; y++) {
          expect(grid.getCellType(x, y)).toBe(CellType.EMPTY);
        }
      }
    });
  });

  describe('cell operations', () => {
    it('should set and get cell types', () => {
      grid.setCellType(5, 5, CellType.TOWER);
      expect(grid.getCellType(5, 5)).toBe(CellType.TOWER);
      
      grid.setCellType(3, 3, CellType.PATH);
      expect(grid.getCellType(3, 3)).toBe(CellType.PATH);
    });

    it('should handle out of bounds coordinates', () => {
      expect(grid.getCellType(-1, 0)).toBe(CellType.BLOCKED);
      expect(grid.getCellType(0, -1)).toBe(CellType.BLOCKED);
      expect(grid.getCellType(10, 0)).toBe(CellType.BLOCKED);
      expect(grid.getCellType(0, 10)).toBe(CellType.BLOCKED);
    });

    it('should not set cell type for out of bounds', () => {
      grid.setCellType(-1, 0, CellType.TOWER);
      grid.setCellType(10, 0, CellType.TOWER);
      
      // Should not affect the grid
      expect(grid.getCellType(0, 0)).toBe(CellType.EMPTY);
    });
  });

  describe('coordinate conversion', () => {
    it('should convert world position to grid coordinates', () => {
      const coords = grid.worldToGrid({ x: 48, y: 48 });
      expect(coords).toEqual({ x: 1, y: 1 });
      
      const coords2 = grid.worldToGrid({ x: 160, y: 96 });
      expect(coords2).toEqual({ x: 5, y: 3 });
    });

    it('should convert grid coordinates to world position (center)', () => {
      const pos = grid.gridToWorld(1, 1);
      expect(pos).toEqual({ x: 48, y: 48 }); // Center of cell (1,1)
      
      const pos2 = grid.gridToWorld(5, 3);
      expect(pos2).toEqual({ x: 176, y: 112 }); // Center of cell (5,3)
    });

    it('should handle negative world positions', () => {
      const coords = grid.worldToGrid({ x: -10, y: -10 });
      expect(coords).toEqual({ x: -1, y: -1 });
    });
  });

  describe('placement validation', () => {
    it('should allow tower placement on empty cells', () => {
      expect(grid.canPlaceTower(5, 5)).toBe(true);
    });

    it('should not allow tower placement on path', () => {
      grid.setCellType(5, 5, CellType.PATH);
      expect(grid.canPlaceTower(5, 5)).toBe(false);
    });

    it('should not allow tower placement on blocked cells', () => {
      grid.setCellType(5, 5, CellType.BLOCKED);
      expect(grid.canPlaceTower(5, 5)).toBe(false);
    });

    it('should not allow tower placement on existing towers', () => {
      grid.setCellType(5, 5, CellType.TOWER);
      expect(grid.canPlaceTower(5, 5)).toBe(false);
    });

    it('should not allow tower placement out of bounds', () => {
      expect(grid.canPlaceTower(-1, 0)).toBe(false);
      expect(grid.canPlaceTower(10, 0)).toBe(false);
    });
  });

  describe('path creation', () => {
    it('should set a path', () => {
      const path = [
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
      ];
      
      grid.setPath(path);
      
      path.forEach(coord => {
        expect(grid.getCellType(coord.x, coord.y)).toBe(CellType.PATH);
      });
    });

    it('should clear previous path when setting new one', () => {
      // Set first path
      grid.setPath([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
      
      // Set new path
      grid.setPath([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
      
      // Old path should be empty
      expect(grid.getCellType(0, 0)).toBe(CellType.EMPTY);
      expect(grid.getCellType(1, 0)).toBe(CellType.EMPTY);
      
      // New path should be set
      expect(grid.getCellType(5, 5)).toBe(CellType.PATH);
      expect(grid.getCellType(6, 5)).toBe(CellType.PATH);
    });
  });

  describe('neighbors', () => {
    it('should get valid neighbors', () => {
      const neighbors = grid.getNeighbors(5, 5);
      
      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 4, y: 5 });
      expect(neighbors).toContainEqual({ x: 6, y: 5 });
      expect(neighbors).toContainEqual({ x: 5, y: 4 });
      expect(neighbors).toContainEqual({ x: 5, y: 6 });
    });

    it('should exclude out of bounds neighbors', () => {
      const neighbors = grid.getNeighbors(0, 0);
      
      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContainEqual({ x: 1, y: 0 });
      expect(neighbors).toContainEqual({ x: 0, y: 1 });
    });

    it('should get walkable neighbors only', () => {
      grid.setCellType(4, 5, CellType.TOWER);
      grid.setCellType(6, 5, CellType.BLOCKED);
      
      const neighbors = grid.getWalkableNeighbors(5, 5);
      
      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContainEqual({ x: 5, y: 4 });
      expect(neighbors).toContainEqual({ x: 5, y: 6 });
    });
  });
});