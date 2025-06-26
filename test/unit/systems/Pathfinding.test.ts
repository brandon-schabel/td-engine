import { describe, test, expect, beforeEach } from 'bun:test';
import { Pathfinding } from '@/systems/Pathfinding';
import { Grid, CellType } from '@/systems/Grid';
import { MovementType } from '@/systems/MovementSystem';
import type { Vector2 } from '@/utils/Vector2';

describe('Pathfinding', () => {
  let grid: Grid;
  
  beforeEach(() => {
    // Create a 10x10 grid for testing
    grid = new Grid(10, 10, 20);
    // Don't set borders by default - let individual tests set them if needed
    Pathfinding.clearCache();
  });

  describe('Basic pathfinding', () => {
    test('finds simple path in empty grid', () => {
      const start = { x: 30, y: 30 };
      const goal = { x: 150, y: 150 };
      
      const result = Pathfinding.findPath(start, goal, grid);
      
      expect(result.success).toBe(true);
      expect(result.path.length).toBeGreaterThan(0);
      expect(result.path[0]).toEqual(start);
      const lastPoint = result.path[result.path.length - 1];
      // Check if we reached the goal (within cell size tolerance)
      expect(Math.abs(lastPoint.x - goal.x)).toBeLessThan(grid.cellSize);
      expect(Math.abs(lastPoint.y - goal.y)).toBeLessThan(grid.cellSize);
    });

    test('fails when goal is blocked', () => {
      // Block the goal position
      grid.setCellType(9, 9, CellType.BLOCKED);
      
      const start = { x: 20, y: 20 };
      const goal = { x: 190, y: 190 };
      
      const result = Pathfinding.findPath(start, goal, grid);
      
      expect(result.success).toBe(false);
      expect(result.path.length).toBe(0);
    });

    test('finds path around obstacles', () => {
      // Create a wall in the middle
      for (let y = 3; y <= 6; y++) {
        grid.setCellType(5, y, CellType.OBSTACLE);
      }
      
      const start = { x: 20, y: 100 };
      const goal = { x: 180, y: 100 };
      
      const result = Pathfinding.findPath(start, goal, grid);
      
      expect(result.success).toBe(true);
      // Path exists but might be optimized/smoothed
      expect(result.path.length).toBeGreaterThan(0);
    });
  });

  describe('Border handling', () => {
    test('cannot path through border cells', () => {
      const start = { x: 20, y: 20 };
      const goal = { x: -20, y: 20 }; // Outside grid
      
      const result = Pathfinding.findPath(start, goal, grid);
      
      expect(result.success).toBe(false);
    });

    test('avoids paths too close to borders', () => {
      // First set borders
      grid.setBorders();
      
      const start = { x: 60, y: 60 };
      const goal = { x: 160, y: 40 }; // Near edge but not at border
      
      const result = Pathfinding.findPath(start, goal, grid, {
        minDistanceFromObstacles: 1
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Check that path avoids getting too close to actual borders
        result.path.forEach(point => {
          const gridPos = grid.worldToGrid(point);
          // Should not be at the very edge (0 or 9)
          expect(gridPos.x).toBeGreaterThan(0);
          expect(gridPos.x).toBeLessThan(9);
          expect(gridPos.y).toBeGreaterThan(0);
          expect(gridPos.y).toBeLessThan(9);
        });
      }
    });

    test('finds alternative path when goal is near border', () => {
      const start = { x: 100, y: 100 };
      const goal = { x: 20, y: 20 }; // Very close to corner
      
      const result = Pathfinding.findAlternativePath(start, goal, grid);
      
      expect(result.success).toBe(true);
      expect(result.path.length).toBeGreaterThan(0);
    });
  });

  describe('Path validation', () => {
    test('validates walkable path', () => {
      const path: Vector2[] = [
        { x: 20, y: 20 },
        { x: 40, y: 40 },
        { x: 60, y: 60 }
      ];
      
      const isValid = Pathfinding.validatePath(path, grid);
      expect(isValid).toBe(true);
    });

    test('invalidates path through obstacles', () => {
      // Block a cell in the middle
      grid.setCellType(2, 2, CellType.OBSTACLE);
      
      const path: Vector2[] = [
        { x: 20, y: 20 },
        { x: 40, y: 40 }, // This goes through the obstacle
        { x: 60, y: 60 }
      ];
      
      const isValid = Pathfinding.validatePath(path, grid);
      expect(isValid).toBe(false);
    });

    test('invalidates path with blocked segments', () => {
      // Create a wall that blocks the path
      for (let x = 0; x < 10; x++) {
        grid.setCellType(x, 5, CellType.OBSTACLE);
      }
      
      const path: Vector2[] = [
        { x: 100, y: 60 },
        { x: 100, y: 120 } // This crosses the wall
      ];
      
      const isValid = Pathfinding.validatePath(path, grid);
      expect(isValid).toBe(false);
    });
  });

  describe('Movement types', () => {
    test('walking movement avoids water', () => {
      // Create a water area
      for (let x = 4; x <= 6; x++) {
        for (let y = 4; y <= 6; y++) {
          grid.setCellType(x, y, CellType.WATER);
        }
      }
      
      const start = { x: 20, y: 100 };
      const goal = { x: 180, y: 100 };
      
      const result = Pathfinding.findPath(start, goal, grid, {
        movementType: MovementType.WALKING
      });
      
      expect(result.success).toBe(true);
      // Path should go around water
      result.path.forEach(point => {
        const gridPos = grid.worldToGrid(point);
        expect(grid.getCellType(gridPos.x, gridPos.y)).not.toBe(CellType.WATER);
      });
    });

    test('flying movement can cross obstacles', () => {
      // Create obstacles
      for (let y = 3; y <= 6; y++) {
        grid.setCellType(5, y, CellType.OBSTACLE);
      }
      
      const start = { x: 20, y: 100 };
      const goal = { x: 180, y: 100 };
      
      const result = Pathfinding.findPath(start, goal, grid, {
        movementType: MovementType.FLYING
      });
      
      expect(result.success).toBe(true);
      // Flying path should be shorter than walking
      expect(result.path.length).toBeLessThan(10);
    });
  });

  describe('Predictive pathfinding', () => {
    test('predicts target movement', () => {
      const start = { x: 20, y: 20 };
      const goal = { x: 100, y: 100 };
      const targetVelocity = { x: 50, y: 0 }; // Moving right
      
      const result = Pathfinding.findPath(start, goal, grid, {
        predictiveTarget: true,
        targetVelocity,
        predictionTime: 1.0
      });
      
      expect(result.success).toBe(true);
      // Path should aim ahead of the target
      const lastPoint = result.path[result.path.length - 1];
      expect(lastPoint.x).toBeGreaterThan(goal.x);
    });

    test('falls back when predicted position is invalid', () => {
      const start = { x: 100, y: 100 };
      const goal = { x: 180, y: 180 };
      const targetVelocity = { x: 200, y: 200 }; // Would go out of bounds
      
      const result = Pathfinding.findPath(start, goal, grid, {
        predictiveTarget: true,
        targetVelocity,
        predictionTime: 1.0
      });
      
      expect(result.success).toBe(true);
      // Should find path to goal or very close to it
      const lastPoint = result.path[result.path.length - 1];
      const distance = Math.sqrt(
        Math.pow(lastPoint.x - goal.x, 2) + 
        Math.pow(lastPoint.y - goal.y, 2)
      );
      expect(distance).toBeLessThan(grid.cellSize);
    });
  });

  describe('Path smoothing', () => {
    test('smooths path with line-of-sight optimization', () => {
      const start = { x: 20, y: 20 };
      const goal = { x: 180, y: 180 };
      
      const resultWithSmoothing = Pathfinding.findPath(start, goal, grid, {
        smoothPath: true
      });
      
      const resultWithoutSmoothing = Pathfinding.findPath(start, goal, grid, {
        smoothPath: false
      });
      
      expect(resultWithSmoothing.success).toBe(true);
      expect(resultWithoutSmoothing.success).toBe(true);
      
      // Smoothed path should have fewer or equal points
      expect(resultWithSmoothing.path.length).toBeLessThanOrEqual(resultWithoutSmoothing.path.length);
    });
  });

  describe('Performance and caching', () => {
    test('caches path results', () => {
      const start = { x: 20, y: 20 };
      const goal = { x: 180, y: 180 };
      
      // First call
      const result1 = Pathfinding.findPath(start, goal, grid);
      const iterations1 = result1.iterations;
      
      // Second call (should be cached)
      const result2 = Pathfinding.findPath(start, goal, grid);
      
      expect(result2.success).toBe(result1.success);
      expect(result2.path).toEqual(result1.path);
      expect(result2.iterations).toBe(iterations1); // Same iterations means it was cached
    });

    test('respects max iterations limit', () => {
      // Create a maze that requires many iterations
      for (let x = 1; x < 9; x++) {
        for (let y = 1; y < 9; y++) {
          if ((x + y) % 2 === 0) {
            grid.setCellType(x, y, CellType.OBSTACLE);
          }
        }
      }
      
      const start = { x: 10, y: 10 };
      const goal = { x: 170, y: 170 };
      
      const result = Pathfinding.findPath(start, goal, grid, {
        maxIterations: 10 // Very low limit
      });
      
      // Should fail due to iteration limit
      expect(result.iterations).toBeLessThanOrEqual(10);
    });
  });

  describe('Edge cases', () => {
    test('handles start equals goal', () => {
      const position = { x: 100, y: 100 };
      
      const result = Pathfinding.findPath(position, position, grid);
      
      expect(result.success).toBe(true);
      expect(result.path.length).toBe(1);
      expect(result.path[0]).toEqual(position);
    });

    test('handles diagonal movement correctly', () => {
      const start = { x: 20, y: 20 };
      const goal = { x: 180, y: 180 };
      
      const diagonalResult = Pathfinding.findPath(start, goal, grid, {
        allowDiagonal: true
      });
      
      const noDiagonalResult = Pathfinding.findPath(start, goal, grid, {
        allowDiagonal: false
      });
      
      expect(diagonalResult.success).toBe(true);
      expect(noDiagonalResult.success).toBe(true);
      
      // Diagonal path should be shorter or equal (if both are direct)
      expect(diagonalResult.path.length).toBeLessThanOrEqual(noDiagonalResult.path.length);
    });

    test('avoids diagonal corner cutting', () => {
      // Place obstacles to create a corner
      grid.setCellType(5, 5, CellType.OBSTACLE);
      grid.setCellType(6, 6, CellType.OBSTACLE);
      
      const start = { x: 80, y: 80 };
      const goal = { x: 140, y: 140 };
      
      const result = Pathfinding.findPath(start, goal, grid, {
        allowDiagonal: true
      });
      
      expect(result.success).toBe(true);
      
      // Check that path doesn't cut through the diagonal between obstacles
      result.path.forEach((point, index) => {
        if (index > 0) {
          const prev = result.path[index - 1];
          const dx = Math.abs(point.x - prev.x);
          const dy = Math.abs(point.y - prev.y);
          
          // If moving diagonally
          if (dx > 0 && dy > 0) {
            const gridPos = grid.worldToGrid(point);
            const prevGridPos = grid.worldToGrid(prev);
            
            // Check that the diagonal move doesn't cut corners
            const horizontalClear = grid.isWalkable(gridPos.x, prevGridPos.y);
            const verticalClear = grid.isWalkable(prevGridPos.x, gridPos.y);
            
            expect(horizontalClear && verticalClear).toBe(true);
          }
        }
      });
    });
  });
});