import { describe, it, expect, beforeEach } from 'vitest';
import { PathGenerator } from '../../src/systems/PathGenerator';
import { Grid, CellType } from '../../src/systems/Grid';
import { BiomeType, MapDifficulty } from '../../src/types/MapData';
import type { MapGenerationConfig } from '../../src/types/MapData';

describe('PathGenerator', () => {
  let grid: Grid;
  let pathGenerator: PathGenerator;
  let config: MapGenerationConfig;

  beforeEach(() => {
    grid = new Grid(20, 15, 32);
    pathGenerator = new PathGenerator(grid, 12345); // Fixed seed for reproducible tests
    config = {
      width: 20,
      height: 15,
      cellSize: 32,
      biome: BiomeType.GRASSLAND,
      difficulty: MapDifficulty.MEDIUM,
      seed: 12345,
      pathComplexity: 0.5,
      obstacleCount: 10,
      decorationLevel: 'MODERATE' as any,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: 2,
      openAreaCount: 3,
      playerAdvantageSpots: 2
    };
  });

  describe('Main Path Generation', () => {
    it('should generate a main path with valid waypoints', () => {
      const path = pathGenerator.generateMainPath(config);
      
      expect(path).toBeDefined();
      expect(path.type).toBe('MAIN');
      expect(path.waypoints.length).toBeGreaterThan(1);
      expect(path.width).toBe(1);
      expect(path.connections).toEqual([]);
    });

    it('should generate paths within grid bounds', () => {
      const path = pathGenerator.generateMainPath(config);
      
      path.waypoints.forEach(waypoint => {
        expect(waypoint.x).toBeGreaterThanOrEqual(0);
        expect(waypoint.x).toBeLessThan(grid.width);
        expect(waypoint.y).toBeGreaterThanOrEqual(0);
        expect(waypoint.y).toBeLessThan(grid.height);
      });
    });

    it('should create more complex paths with higher complexity', () => {
      const simpleConfig = { ...config, pathComplexity: 0.1 };
      const complexConfig = { ...config, pathComplexity: 0.9 };
      
      const simplePath = pathGenerator.generateMainPath(simpleConfig);
      const complexPath = pathGenerator.generateMainPath(complexConfig);
      
      // Complex paths should generally have more waypoints
      expect(complexPath.waypoints.length).toBeGreaterThanOrEqual(simplePath.waypoints.length);
    });

    it('should generate reproducible paths with same seed', () => {
      const generator1 = new PathGenerator(grid, 12345);
      const generator2 = new PathGenerator(grid, 12345);
      
      const path1 = generator1.generateMainPath(config);
      const path2 = generator2.generateMainPath(config);
      
      expect(path1.waypoints.length).toBe(path2.waypoints.length);
      expect(path1.waypoints[0]).toEqual(path2.waypoints[0]);
      expect(path1.waypoints[path1.waypoints.length - 1])
        .toEqual(path2.waypoints[path2.waypoints.length - 1]);
    });

    it('should start and end at appropriate positions', () => {
      const path = pathGenerator.generateMainPath(config);
      
      const start = path.waypoints[0];
      const end = path.waypoints[path.waypoints.length - 1];
      
      // Should start near left edge and end near right edge
      expect(start.x).toBeLessThan(grid.width * 0.2);
      expect(end.x).toBeGreaterThan(grid.width * 0.8);
    });
  });

  describe('Branch Path Generation', () => {
    it('should generate branch paths from main path', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const branches = pathGenerator.generateBranchPaths(mainPath, 2);
      
      expect(branches.length).toBeLessThanOrEqual(2);
      
      branches.forEach(branch => {
        expect(branch.type).toBe('BRANCH');
        expect(branch.waypoints.length).toBeGreaterThan(0);
        expect(branch.connections.length).toBeGreaterThan(0);
      });
    });

    it('should not generate branches from very short main paths', () => {
      // Create a very short main path
      const shortPath = {
        waypoints: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const branches = pathGenerator.generateBranchPaths(shortPath, 2);
      expect(branches.length).toBe(0);
    });

    it('should connect branches to main path', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const branches = pathGenerator.generateBranchPaths(mainPath, 1);
      
      if (branches.length > 0) {
        const branch = branches[0];
        expect(branch.connections.length).toBe(1);
        
        const connectionIndex = branch.connections[0];
        expect(connectionIndex).toBeGreaterThanOrEqual(0);
        expect(connectionIndex).toBeLessThan(mainPath.waypoints.length);
        
        // Branch should start at connection point
        expect(branch.waypoints[0]).toEqual(mainPath.waypoints[connectionIndex]);
      }
    });
  });

  describe('Detailed Path Creation', () => {
    it('should create detailed path with all intermediate cells', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const detailedPath = pathGenerator.createDetailedPath(mainPath);
      
      expect(detailedPath.length).toBeGreaterThanOrEqual(mainPath.waypoints.length);
      
      // First and last points should match
      expect(detailedPath[0]).toEqual(mainPath.waypoints[0]);
      expect(detailedPath[detailedPath.length - 1])
        .toEqual(mainPath.waypoints[mainPath.waypoints.length - 1]);
    });

    it('should create continuous path without gaps', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const detailedPath = pathGenerator.createDetailedPath(mainPath);
      
      for (let i = 1; i < detailedPath.length; i++) {
        const prev = detailedPath[i - 1];
        const curr = detailedPath[i];
        
        const deltaX = Math.abs(curr.x - prev.x);
        const deltaY = Math.abs(curr.y - prev.y);
        
        // Adjacent cells should be connected (max distance of 1 in each direction)
        expect(deltaX).toBeLessThanOrEqual(1);
        expect(deltaY).toBeLessThanOrEqual(1);
        expect(deltaX + deltaY).toBeGreaterThan(0); // Should actually move
      }
    });

    it('should not contain duplicate consecutive points', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const detailedPath = pathGenerator.createDetailedPath(mainPath);
      
      for (let i = 1; i < detailedPath.length; i++) {
        const prev = detailedPath[i - 1];
        const curr = detailedPath[i];
        
        expect(prev.x !== curr.x || prev.y !== curr.y).toBe(true);
      }
    });
  });

  describe('Path Validation', () => {
    it('should validate valid paths as correct', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const validation = pathGenerator.validatePath(mainPath);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect paths with insufficient waypoints', () => {
      const invalidPath = {
        waypoints: [{ x: 1, y: 1 }],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const validation = pathGenerator.validatePath(invalidPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('at least 2 waypoints'))).toBe(true);
    });

    it('should detect out-of-bounds waypoints', () => {
      const invalidPath = {
        waypoints: [
          { x: 1, y: 1 },
          { x: grid.width + 5, y: grid.height + 5 }, // Out of bounds
          { x: 5, y: 5 }
        ],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const validation = pathGenerator.validatePath(invalidPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('out of bounds'))).toBe(true);
    });

    it('should validate path connectivity', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const validation = pathGenerator.validatePath(mainPath);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Choke Points', () => {
    it('should add choke points to paths', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const chokePoints = pathGenerator.addChokePoints(mainPath, 2);
      
      expect(chokePoints.length).toBeLessThanOrEqual(2);
      
      const detailedPath = pathGenerator.createDetailedPath(mainPath);
      chokePoints.forEach(chokePoint => {
        // Choke points should be on the path
        const onPath = detailedPath.some(point => 
          point.x === chokePoint.x && point.y === chokePoint.y
        );
        expect(onPath).toBe(true);
      });
    });

    it('should distribute choke points along the path', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const chokePoints = pathGenerator.addChokePoints(mainPath, 3);
      
      if (chokePoints.length >= 2) {
        const detailedPath = pathGenerator.createDetailedPath(mainPath);
        
        // Find positions of choke points along the path
        const positions = chokePoints.map(chokePoint => {
          return detailedPath.findIndex(point => 
            point.x === chokePoint.x && point.y === chokePoint.y
          );
        });
        
        // Positions should be in ascending order (distributed along path)
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i]).toBeGreaterThan(positions[i - 1]);
        }
      }
    });

    it('should not add more choke points than path can accommodate', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      const detailedPath = pathGenerator.createDetailedPath(mainPath);
      
      // Try to add more choke points than reasonable
      const chokePoints = pathGenerator.addChokePoints(mainPath, detailedPath.length * 2);
      
      // Should not exceed reasonable limits
      expect(chokePoints.length).toBeLessThan(detailedPath.length);
    });
  });

  describe('Line Drawing Algorithm', () => {
    it('should create straight line between two points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 0 };
      
      // Create a simple path to test line drawing
      const testPath = {
        waypoints: [start, end],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const detailedPath = pathGenerator.createDetailedPath(testPath);
      
      expect(detailedPath.length).toBe(6); // 0,1,2,3,4,5
      expect(detailedPath[0]).toEqual(start);
      expect(detailedPath[detailedPath.length - 1]).toEqual(end);
      
      // Should be a straight horizontal line
      detailedPath.forEach(point => {
        expect(point.y).toBe(0);
      });
    });

    it('should create diagonal line between two points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 3, y: 3 };
      
      const testPath = {
        waypoints: [start, end],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const detailedPath = pathGenerator.createDetailedPath(testPath);
      
      expect(detailedPath[0]).toEqual(start);
      expect(detailedPath[detailedPath.length - 1]).toEqual(end);
      
      // Should form a diagonal line
      for (let i = 1; i < detailedPath.length - 1; i++) {
        const point = detailedPath[i];
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(3);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle single waypoint path gracefully', () => {
      const singlePointPath = {
        waypoints: [{ x: 5, y: 5 }],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const validation = pathGenerator.validatePath(singlePointPath);
      expect(validation.isValid).toBe(false);
      
      const detailedPath = pathGenerator.createDetailedPath(singlePointPath);
      expect(detailedPath.length).toBe(1);
      expect(detailedPath[0]).toEqual({ x: 5, y: 5 });
    });

    it('should handle paths with identical start and end points', () => {
      const samePointPath = {
        waypoints: [{ x: 5, y: 5 }, { x: 5, y: 5 }],
        width: 1,
        type: 'MAIN' as const,
        connections: []
      };
      
      const detailedPath = pathGenerator.createDetailedPath(samePointPath);
      expect(detailedPath.length).toBe(1);
      expect(detailedPath[0]).toEqual({ x: 5, y: 5 });
    });

    it('should handle maximum complexity configuration', () => {
      const maxComplexityConfig = { ...config, pathComplexity: 1.0 };
      const path = pathGenerator.generateMainPath(maxComplexityConfig);
      
      expect(path.waypoints.length).toBeGreaterThan(2);
      
      const validation = pathGenerator.validatePath(path);
      expect(validation.isValid).toBe(true);
    });

    it('should handle minimum complexity configuration', () => {
      const minComplexityConfig = { ...config, pathComplexity: 0.0 };
      const path = pathGenerator.generateMainPath(minComplexityConfig);
      
      expect(path.waypoints.length).toBeGreaterThanOrEqual(2);
      
      const validation = pathGenerator.validatePath(path);
      expect(validation.isValid).toBe(true);
    });

    it('should handle very small grids', () => {
      const smallGrid = new Grid(3, 3, 32);
      const smallPathGenerator = new PathGenerator(smallGrid, 12345);
      const smallConfig = { ...config, width: 3, height: 3 };
      
      const path = smallPathGenerator.generateMainPath(smallConfig);
      
      expect(path.waypoints.length).toBeGreaterThanOrEqual(2);
      
      path.waypoints.forEach(waypoint => {
        expect(waypoint.x).toBeGreaterThanOrEqual(0);
        expect(waypoint.x).toBeLessThan(3);
        expect(waypoint.y).toBeGreaterThanOrEqual(0);
        expect(waypoint.y).toBeLessThan(3);
      });
    });
  });

  describe('Performance', () => {
    it('should generate paths in reasonable time for large grids', () => {
      const largeGrid = new Grid(100, 100, 32);
      const largePathGenerator = new PathGenerator(largeGrid, 12345);
      const largeConfig = { ...config, width: 100, height: 100 };
      
      const startTime = Date.now();
      const path = largePathGenerator.generateMainPath(largeConfig);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(path.waypoints.length).toBeGreaterThan(2);
    });

    it('should handle multiple branch generation efficiently', () => {
      const mainPath = pathGenerator.generateMainPath(config);
      
      const startTime = Date.now();
      const branches = pathGenerator.generateBranchPaths(mainPath, 10);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 0.5 seconds
      expect(branches.length).toBeLessThanOrEqual(10);
    });
  });
});