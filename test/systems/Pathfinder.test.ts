import { describe, it, expect } from 'vitest';
import { Pathfinder } from '@/systems/Pathfinder';
import { Grid, CellType } from '@/systems/Grid';
import type { Vector2 } from '@/utils/Vector2';
import { describeSystem, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';

describe.skip('Pathfinder',
  () => {
    const grid = new Grid(10, 10, 32);
    return new Pathfinder(grid);
  },
  (getPathfinder, context) => {
    const createGrid = () => new Grid(10, 10, 32);
    
    describe('basic pathfinding', () => {
      it(when('finding a straight path'), () => {
        const pathfinder = getPathfinder();
        const start = { x: 0, y: 0 };
        const end = { x: 5, y: 0 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        expect(path).toHaveLength(6); // Including start and end
        expect(path?.[0]).toEqual(start);
        expect(path?.[path.length - 1]).toEqual(end);
        
        // Check path is straight
        path?.forEach(point => {
          expect(point.y).toBe(0);
        });
      });

      it(when('finding path around obstacles'), () => {
        const grid = createGrid();
        const pathfinder = new Pathfinder(grid);
        
        // Create a wall
        for (let y = 0; y < 8; y++) {
          grid.setCellType(5, y, CellType.BLOCKED);
        }
        
        const start = { x: 0, y: 0 };
        const end = { x: 9, y: 0 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        expect(path?.[0]).toEqual(start);
        expect(path?.[path.length - 1]).toEqual(end);
        
        then('path avoids the wall');
        const pathCrossesWall = path?.some(point => point.x === 5 && point.y < 8);
        expect(pathCrossesWall).toBe(false);
      });

      it(then('returns null if no path exists'), () => {
        const grid = createGrid();
        const pathfinder = new Pathfinder(grid);
        
        // Completely block the target
        grid.setCellType(4, 4, CellType.BLOCKED);
        grid.setCellType(5, 4, CellType.BLOCKED);
        grid.setCellType(6, 4, CellType.BLOCKED);
        grid.setCellType(4, 5, CellType.BLOCKED);
        grid.setCellType(6, 5, CellType.BLOCKED);
        grid.setCellType(4, 6, CellType.BLOCKED);
        grid.setCellType(5, 6, CellType.BLOCKED);
        grid.setCellType(6, 6, CellType.BLOCKED);
        
        const start = { x: 0, y: 0 };
        const end = { x: 5, y: 5 }; // Surrounded by blocks
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeNull();
      });

      it(when('start and end are the same'), () => {
        const pathfinder = getPathfinder();
        const point = { x: 5, y: 5 };
        const path = pathfinder.findPath(point, point);
        
        expect(path).toEqual([point]);
      });
    });

    describe('path optimization', () => {
      it(when('finding the shortest path'), () => {
        const pathfinder = getPathfinder();
        const start = { x: 0, y: 0 };
        const end = { x: 3, y: 3 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        then('uses manhattan distance');
        // Manhattan distance is 6, so path should be 7 nodes (including start/end)
        expect(path).toHaveLength(7);
      });

      it(when('choosing between routes'), () => {
        const grid = createGrid();
        const pathfinder = new Pathfinder(grid);
        
        // Create a partial obstacle
        grid.setCellType(2, 1, CellType.BLOCKED);
        grid.setCellType(2, 2, CellType.BLOCKED);
        
        const start = { x: 0, y: 0 };
        const end = { x: 4, y: 2 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        then('avoids blocked cells efficiently');
        const blockedCells = path?.filter(p => 
          (p.x === 2 && p.y === 1) || (p.x === 2 && p.y === 2)
        );
        expect(blockedCells).toHaveLength(0);
      });
    });

    describe('tower avoidance', () => {
      it(when('towers are on the path'), () => {
        const grid = createGrid();
        const pathfinder = new Pathfinder(grid);
        grid.setCellType(5, 5, CellType.TOWER);
        
        const start = { x: 5, y: 4 };
        const end = { x: 5, y: 6 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        then('treats towers as obstacles');
        const pathGoesThoughTower = path?.some(p => p.x === 5 && p.y === 5);
        expect(pathGoesThoughTower).toBe(false);
      });
    });

    describe('boundary conditions', () => {
      it(when('pathfinding to grid boundaries'), () => {
        const pathfinder = getPathfinder();
        const start = { x: 5, y: 5 };
        const end = { x: 9, y: 9 }; // Bottom-right corner
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeDefined();
        expect(path?.[0]).toEqual(start);
        expect(path?.[path.length - 1]).toEqual(end);
      });

      it(then('returns null for out of bounds target'), () => {
        const pathfinder = getPathfinder();
        const start = { x: 5, y: 5 };
        const end = { x: 10, y: 10 }; // Out of bounds
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeNull();
      });

      it(then('returns null for out of bounds start'), () => {
        const pathfinder = getPathfinder();
        const start = { x: -1, y: 0 }; // Out of bounds
        const end = { x: 5, y: 5 };
        
        const path = pathfinder.findPath(start, end);
        
        expect(path).toBeNull();
      });
    });

    describe('performance', () => {
      it(when('handling large grids'), () => {
        const largeGrid = new Grid(50, 50, 32);
        const largePathfinder = new Pathfinder(largeGrid);
        
        const start = { x: 0, y: 0 };
        const end = { x: 49, y: 49 };
        
        const startTime = performance.now();
        const path = largePathfinder.findPath(start, end);
        const endTime = performance.now();
        
        expect(path).toBeDefined();
        then('completes quickly');
        expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      });
    });
  }
);