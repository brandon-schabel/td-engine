/**
 * Unit tests for Pathfinder
 * Tests A* pathfinding algorithm implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Pathfinder } from '@/systems/Pathfinder';
import { Grid, CellType } from '@/systems/Grid';
import { createMockGrid, createPathGrid } from '../helpers/mockData';
import type { Vector2 } from '@/utils/Vector2';

describe('Pathfinder', () => {
  let grid: Grid;
  let pathfinder: Pathfinder;

  beforeEach(() => {
    grid = createMockGrid(10, 10);
    pathfinder = new Pathfinder(grid);
  });

  describe('basic pathfinding', () => {
    it('should find straight horizontal path', () => {
      const start = { x: 0, y: 5 };
      const end = { x: 9, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(10);
      expect(path![0]).toEqual(start);
      expect(path![9]).toEqual(end);
      
      // Check all points are on same row
      path!.forEach(point => {
        expect(point.y).toBe(5);
      });
    });

    it('should find straight vertical path', () => {
      const start = { x: 5, y: 0 };
      const end = { x: 5, y: 9 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(10);
      
      // Check all points are on same column
      path!.forEach(point => {
        expect(point.x).toBe(5);
      });
    });

    it('should find diagonal path (manhattan distance)', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path).toHaveLength(11); // Manhattan distance
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(end);
    });

    it('should return single point for same start and end', () => {
      const point = { x: 5, y: 5 };
      const path = pathfinder.findPath(point, point);
      
      expect(path).toEqual([point]);
    });
  });

  describe('obstacle avoidance', () => {
    it('should find path around obstacles', () => {
      // Create vertical wall
      for (let y = 2; y < 8; y++) {
        grid.setCellType(5, y, CellType.OBSTACLE);
      }
      
      const start = { x: 0, y: 5 };
      const end = { x: 9, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Path should go around the wall
      const passesWall = path!.some(point => point.x === 5 && point.y >= 2 && point.y < 8);
      expect(passesWall).toBe(false);
    });

    it('should find shortest path around obstacles', () => {
      // Create obstacle that forces detour
      grid.setCellType(5, 5, CellType.OBSTACLE);
      grid.setCellType(5, 4, CellType.OBSTACLE);
      grid.setCellType(5, 6, CellType.OBSTACLE);
      
      const start = { x: 0, y: 5 };
      const end = { x: 9, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Should go around obstacle
      const blockedCells = path!.filter(p => 
        (p.x === 5 && (p.y === 4 || p.y === 5 || p.y === 6))
      );
      expect(blockedCells).toHaveLength(0);
    });

    it('should navigate complex maze', () => {
      const { grid: mazeGrid, start, end } = createPathGrid();
      const mazePathfinder = new Pathfinder(mazeGrid);
      
      const path = mazePathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path![0]).toEqual(start);
      expect(path![path!.length - 1]).toEqual(end);
      
      // All path points should be walkable
      path!.forEach(point => {
        expect(mazeGrid.isWalkable(point.x, point.y)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should return null for out of bounds start', () => {
      const path = pathfinder.findPath({ x: -1, y: 0 }, { x: 5, y: 5 });
      expect(path).toBeNull();
    });

    it('should return null for out of bounds end', () => {
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 10, y: 10 });
      expect(path).toBeNull();
    });

    it('should return null if end is not walkable', () => {
      grid.setCellType(5, 5, CellType.OBSTACLE);
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).toBeNull();
    });

    it('should return null for impossible path', () => {
      // Surround the end point with obstacles
      const end = { x: 5, y: 5 };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx !== 0 || dy !== 0) {
            grid.setCellType(end.x + dx, end.y + dy, CellType.OBSTACLE);
          }
        }
      }
      
      const path = pathfinder.findPath({ x: 0, y: 0 }, end);
      expect(path).toBeNull();
    });

    it('should handle start point being non-walkable', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 5 };
      
      // Make start non-walkable after enemies have spawned there
      grid.setCellType(start.x, start.y, CellType.TOWER);
      
      const path = pathfinder.findPath(start, end);
      // Should still find path since start is treated specially
      expect(path).not.toBeNull();
    });
  });

  describe('path characteristics', () => {
    it('should find optimal path length', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 3, y: 4 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Manhattan distance + 1 (including start)
      expect(path!.length).toBe(8);
    });

    it('should prefer straight paths when equal cost', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 0 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Should be straight horizontal line
      const allOnSameRow = path!.every(p => p.y === 0);
      expect(allOnSameRow).toBe(true);
    });

    it('should handle large grids efficiently', () => {
      const largeGrid = new Grid(50, 50);
      const largePathfinder = new Pathfinder(largeGrid);
      
      const start = { x: 0, y: 0 };
      const end = { x: 49, y: 49 };
      
      const startTime = performance.now();
      const path = largePathfinder.findPath(start, end);
      const endTime = performance.now();
      
      expect(path).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('gridPathToWorld', () => {
    it('should convert grid path to world coordinates', () => {
      const gridPath: Vector2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];
      
      const worldPath = pathfinder.gridPathToWorld(gridPath);
      
      expect(worldPath).toHaveLength(3);
      expect(worldPath[0]).toEqual({ x: 16, y: 16 }); // Center of cell
      expect(worldPath[1]).toEqual({ x: 48, y: 16 });
      expect(worldPath[2]).toEqual({ x: 80, y: 16 });
    });

    it('should handle empty path', () => {
      const worldPath = pathfinder.gridPathToWorld([]);
      expect(worldPath).toEqual([]);
    });
  });

  describe('different cell types', () => {
    it('should treat PATH cells as walkable', () => {
      grid.setCellType(5, 5, CellType.PATH);
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).not.toBeNull();
    });

    it('should treat ROUGH_TERRAIN as walkable', () => {
      grid.setCellType(5, 5, CellType.ROUGH_TERRAIN);
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).not.toBeNull();
    });

    it('should treat WATER as non-walkable', () => {
      grid.setCellType(5, 5, CellType.WATER);
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).toBeNull();
    });

    it('should treat SPAWN_ZONE as walkable', () => {
      grid.setCellType(5, 5, CellType.SPAWN_ZONE);
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).not.toBeNull();
    });
  });

  describe('pathfinding patterns', () => {
    it('should find L-shaped path', () => {
      // Block direct path
      for (let x = 1; x < 9; x++) {
        grid.setCellType(x, 5, CellType.OBSTACLE);
      }
      
      const start = { x: 0, y: 5 };
      const end = { x: 9, y: 0 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Path should go up/down then across
      const hasVerticalMovement = path!.some((p, i) => 
        i > 0 && p.y !== path![i-1].y
      );
      expect(hasVerticalMovement).toBe(true);
    });

    it('should find path through narrow corridor', () => {
      // Create walls with narrow passage
      for (let y = 0; y < 10; y++) {
        if (y !== 5) {
          grid.setCellType(5, y, CellType.OBSTACLE);
        }
      }
      
      const start = { x: 0, y: 5 };
      const end = { x: 9, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      // Should pass through the corridor
      const passesThrough = path!.some(p => p.x === 5 && p.y === 5);
      expect(passesThrough).toBe(true);
    });

    it('should handle dead ends gracefully', () => {
      // Create a dead end
      grid.setCellType(1, 0, CellType.OBSTACLE);
      grid.setCellType(0, 1, CellType.OBSTACLE);
      
      const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 9, y: 9 });
      
      expect(path).toBeNull();
    });
  });
});