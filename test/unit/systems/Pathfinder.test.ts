import { describe, test, expect, beforeEach } from 'vitest';
import { Pathfinder } from '@/systems/Pathfinder';
import { Grid, CellType } from '@/systems/Grid';
import { assertPathIsValid, assertVector2Equal } from '../../helpers/assertions';
import { createMockGrid } from '../../helpers/factories';

describe('Pathfinder', () => {
  let grid: Grid;
  let pathfinder: Pathfinder;

  beforeEach(() => {
    grid = new Grid(10, 10, 32);
    pathfinder = new Pathfinder(grid);
  });

  describe('findPath - basic pathfinding', () => {
    test('finds straight horizontal path', () => {
      const start = { x: 0, y: 5 };
      const end = { x: 5, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path!.length).toBe(6);
      assertPathIsValid(path!, start, end);
      
      // Check it's a straight line
      path!.forEach(pos => {
        expect(pos.y).toBe(5);
      });
    });

    test('finds straight vertical path', () => {
      const start = { x: 5, y: 0 };
      const end = { x: 5, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path!.length).toBe(6);
      assertPathIsValid(path!, start, end);
      
      // Check it's a straight line
      path!.forEach(pos => {
        expect(pos.x).toBe(5);
      });
    });

    test('finds diagonal path using manhattan movement', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 3, y: 3 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      expect(path!.length).toBe(7); // Manhattan distance + 1
      assertPathIsValid(path!, start, end);
    });

    test('returns single point path when start equals end', () => {
      const point = { x: 5, y: 5 };
      
      const path = pathfinder.findPath(point, point);
      
      expect(path).toEqual([point]);
    });
  });

  describe('findPath - with obstacles', () => {
    test('finds path around single obstacle', () => {
      // Create horizontal wall
      for (let x = 2; x <= 7; x++) {
        grid.setCellType(x, 5, CellType.BLOCKED);
      }
      
      const start = { x: 5, y: 3 };
      const end = { x: 5, y: 7 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      assertPathIsValid(path!, start, end);
      
      // Path should go around the wall
      const blockedPositions = path!.filter(pos => pos.y === 5);
      expect(blockedPositions.every(pos => pos.x < 2 || pos.x > 7)).toBe(true);
    });

    test('finds shortest path around obstacles', () => {
      // Create L-shaped obstacle
      grid.setCellType(5, 3, CellType.BLOCKED);
      grid.setCellType(5, 4, CellType.BLOCKED);
      grid.setCellType(5, 5, CellType.BLOCKED);
      grid.setCellType(6, 5, CellType.BLOCKED);
      grid.setCellType(7, 5, CellType.BLOCKED);
      
      const start = { x: 5, y: 2 };
      const end = { x: 7, y: 4 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      assertPathIsValid(path!, start, end);
      
      // Should find a reasonably short path
      expect(path!.length).toBeLessThanOrEqual(10);
    });

    test('returns null when no path exists', () => {
      // Surround the end point with obstacles
      const end = { x: 5, y: 5 };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx !== 0 || dy !== 0) {
            grid.setCellType(end.x + dx, end.y + dy, CellType.BLOCKED);
          }
        }
      }
      
      const start = { x: 0, y: 0 };
      const path = pathfinder.findPath(start, end);
      
      expect(path).toBeNull();
    });

    test('handles maze-like environment', () => {
      // Create a simple maze
      const maze = [
        '##########',
        '#S.......#',
        '#.#####.##',
        '#.......##',
        '#####.####',
        '#.....####',
        '#.#######',
        '#.......E#',
        '##########'
      ];
      
      // Parse maze
      let start = { x: 0, y: 0 };
      let end = { x: 0, y: 0 };
      
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x] === '#') {
            grid.setCellType(x, y, CellType.BLOCKED);
          } else if (maze[y][x] === 'S') {
            start = { x, y };
          } else if (maze[y][x] === 'E') {
            end = { x, y };
          }
        }
      }
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      assertPathIsValid(path!, start, end);
      
      // All path positions should be walkable
      path!.forEach(pos => {
        expect(grid.isWalkable(pos.x, pos.y)).toBe(true);
      });
    });
  });

  describe('findPath - edge cases', () => {
    test('returns null for out of bounds start', () => {
      const path = pathfinder.findPath(
        { x: -1, y: 0 },
        { x: 5, y: 5 }
      );
      
      expect(path).toBeNull();
    });

    test('returns null for out of bounds end', () => {
      const path = pathfinder.findPath(
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      );
      
      expect(path).toBeNull();
    });

    test('returns null when end is not walkable', () => {
      grid.setCellType(5, 5, CellType.BLOCKED);
      
      const path = pathfinder.findPath(
        { x: 0, y: 0 },
        { x: 5, y: 5 }
      );
      
      expect(path).toBeNull();
    });

    test('handles path from blocked position', () => {
      const start = { x: 5, y: 5 };
      grid.setCellType(start.x, start.y, CellType.TOWER);
      
      const path = pathfinder.findPath(start, { x: 0, y: 0 });
      
      // Should still find path since we don't check if start is walkable
      expect(path).not.toBeNull();
    });
  });

  describe('findPath - performance', () => {
    test('finds path in large empty grid efficiently', () => {
      const largeGrid = new Grid(50, 50);
      const largePathfinder = new Pathfinder(largeGrid);
      
      const startTime = performance.now();
      const path = largePathfinder.findPath(
        { x: 0, y: 0 },
        { x: 49, y: 49 }
      );
      const endTime = performance.now();
      
      expect(path).not.toBeNull();
      expect(path!.length).toBe(99); // Manhattan distance + 1
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test('terminates quickly when no path exists', () => {
      // Create a wall dividing the grid
      for (let y = 0; y < 10; y++) {
        grid.setCellType(5, y, CellType.BLOCKED);
      }
      
      const startTime = performance.now();
      const path = pathfinder.findPath(
        { x: 0, y: 5 },
        { x: 9, y: 5 }
      );
      const endTime = performance.now();
      
      expect(path).toBeNull();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('gridPathToWorld', () => {
    test('converts grid coordinates to world coordinates', () => {
      const gridPath = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];
      
      const worldPath = pathfinder.gridPathToWorld(gridPath);
      
      expect(worldPath).toHaveLength(3);
      
      // With cell size 32, centers should be at 16, 48, 80
      assertVector2Equal(worldPath[0], { x: 16, y: 16 });
      assertVector2Equal(worldPath[1], { x: 48, y: 16 });
      assertVector2Equal(worldPath[2], { x: 80, y: 16 });
    });

    test('handles empty path', () => {
      const worldPath = pathfinder.gridPathToWorld([]);
      expect(worldPath).toEqual([]);
    });
  });

  describe('pathfinding with different cell types', () => {
    test('paths through walkable terrain types', () => {
      grid.setCellType(5, 5, CellType.PATH);
      grid.setCellType(6, 5, CellType.ROUGH_TERRAIN);
      grid.setCellType(7, 5, CellType.SPAWN_ZONE);
      
      const path = pathfinder.findPath(
        { x: 4, y: 5 },
        { x: 8, y: 5 }
      );
      
      expect(path).not.toBeNull();
      expect(path!.some(pos => pos.x === 5 && pos.y === 5)).toBe(true);
      expect(path!.some(pos => pos.x === 6 && pos.y === 5)).toBe(true);
      expect(path!.some(pos => pos.x === 7 && pos.y === 5)).toBe(true);
    });

    test('avoids non-walkable terrain types', () => {
      grid.setCellType(5, 5, CellType.TOWER);
      grid.setCellType(6, 5, CellType.WATER);
      grid.setCellType(7, 5, CellType.OBSTACLE);
      
      const path = pathfinder.findPath(
        { x: 4, y: 5 },
        { x: 8, y: 5 }
      );
      
      expect(path).not.toBeNull();
      
      // Should go around the obstacles
      const pathOnRow5 = path!.filter(pos => pos.y === 5);
      pathOnRow5.forEach(pos => {
        expect(pos.x).not.toBe(5);
        expect(pos.x).not.toBe(6);
        expect(pos.x).not.toBe(7);
      });
    });
  });

  describe('heuristic accuracy', () => {
    test('finds optimal path in open space', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 3 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      
      // Optimal path length is Manhattan distance + 1
      const manhattanDistance = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
      expect(path!.length).toBe(manhattanDistance + 1);
    });

    test('finds near-optimal path with obstacles', () => {
      // Add a few scattered obstacles
      grid.setCellType(2, 2, CellType.BLOCKED);
      grid.setCellType(3, 3, CellType.BLOCKED);
      grid.setCellType(4, 1, CellType.BLOCKED);
      
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 5 };
      
      const path = pathfinder.findPath(start, end);
      
      expect(path).not.toBeNull();
      
      // Path should be reasonably efficient
      const manhattanDistance = 10;
      expect(path!.length).toBeLessThanOrEqual(manhattanDistance + 4);
    });
  });
});