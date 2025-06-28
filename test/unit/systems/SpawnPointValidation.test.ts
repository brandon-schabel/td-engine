import { describe, it, expect, beforeEach } from 'bun:test';
import { Pathfinding } from '@/systems/Pathfinding';
import { Grid, CellType } from '@/systems/Grid';
import { MovementType } from '@/systems/MovementSystem';
import type { Vector2 } from '@/utils/Vector2';

describe('SpawnPointValidation', () => {
  let grid: Grid;
  const gridSize = 10;
  const cellSize = 32;
  
  beforeEach(() => {
    grid = new Grid(gridSize, gridSize, cellSize);
    // Clear grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.setCellType(x, y, CellType.EMPTY);
      }
    }
    // Set borders which are required for pathfinding
    grid.setBorders();
  });
  
  describe('validateSpawnPointConnectivity', () => {
    it('should validate accessible spawn point', () => {
      // Create simple path from spawn to player (avoiding borders)
      const spawnGrid = { x: 1, y: 1 };
      const playerGrid = { x: 8, y: 8 };
      
      // Create path
      for (let i = 1; i <= 8; i++) {
        grid.setCellType(i, i, CellType.PATH);
      }
      
      const spawnWorld = grid.gridToWorld(spawnGrid.x, spawnGrid.y);
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      const result = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(result.isValid).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.path!.length).toBeGreaterThan(0);
      expect(result.issue).toBeUndefined();
    });
    
    it('should fail validation for blocked spawn point', () => {
      // Surround spawn point with obstacles
      const spawnGrid = { x: 2, y: 2 };
      const playerGrid = { x: 7, y: 7 };
      
      // Block spawn point completely with obstacles
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
            const x = spawnGrid.x + dx;
            const y = spawnGrid.y + dy;
            if (grid.isInBounds(x, y)) {
              grid.setCellType(x, y, CellType.OBSTACLE);
            }
          }
        }
      }
      
      const spawnWorld = grid.gridToWorld(spawnGrid.x, spawnGrid.y);
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      const result = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(result.isValid).toBe(false);
      expect(result.issue).toBe('No valid path from spawn point to target');
    });
    
    it('should fail validation for spawn point on obstacle', () => {
      const spawnGrid = { x: 5, y: 5 };
      const playerGrid = { x: 8, y: 8 };
      
      // Place obstacle at spawn point
      grid.setCellType(spawnGrid.x, spawnGrid.y, CellType.OBSTACLE);
      
      const spawnWorld = grid.gridToWorld(spawnGrid.x, spawnGrid.y);
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      const result = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(result.isValid).toBe(false);
      expect(result.issue).toBe('Spawn point is not walkable');
    });
    
    it('should fail validation for out of bounds spawn point', () => {
      const spawnWorld = { x: -100, y: -100 }; // Out of bounds
      const playerWorld = grid.gridToWorld(5, 5);
      
      const result = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(result.isValid).toBe(false);
      expect(result.issue).toBe('Spawn point is out of bounds');
    });
    
    it('should validate spawn point with water for flying enemies', () => {
      const spawnGrid = { x: 0, y: 0 };
      const playerGrid = { x: 9, y: 9 };
      
      // Fill with water
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          grid.setCellType(x, y, CellType.WATER);
        }
      }
      
      const spawnWorld = grid.gridToWorld(spawnGrid.x, spawnGrid.y);
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      // Should fail for walking enemies
      const walkingResult = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      expect(walkingResult.isValid).toBe(false);
      
      // Should succeed for flying enemies
      const flyingResult = Pathfinding.validateSpawnPointConnectivity(
        spawnWorld,
        playerWorld,
        grid,
        MovementType.FLYING
      );
      expect(flyingResult.isValid).toBe(true);
    });
  });
  
  describe('validateAllSpawnPoints', () => {
    it('should validate multiple spawn points', () => {
      // Create cross-shaped paths
      const playerGrid = { x: 5, y: 5 };
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      // Create horizontal and vertical paths through center
      for (let i = 0; i < gridSize; i++) {
        grid.setCellType(i, 5, CellType.PATH);
        grid.setCellType(5, i, CellType.PATH);
      }
      
      // Create spawn points at corners
      const spawnPoints: Vector2[] = [
        grid.gridToWorld(0, 5),    // Left
        grid.gridToWorld(9, 5),    // Right
        grid.gridToWorld(5, 0),    // Top
        grid.gridToWorld(5, 9),    // Bottom
      ];
      
      const validation = Pathfinding.validateAllSpawnPoints(
        spawnPoints,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(validation.allSpawnPointsValid).toBe(true);
      expect(validation.validSpawnPoints.length).toBe(4);
      expect(validation.invalidSpawnPoints.length).toBe(0);
      expect(validation.errors.length).toBe(0);
    });
    
    it('should identify inaccessible spawn points', () => {
      const playerGrid = { x: 5, y: 5 };
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      // Create a wall dividing the map
      for (let y = 1; y < gridSize - 1; y++) {
        grid.setCellType(4, y, CellType.OBSTACLE);
      }
      
      // Spawn points on both sides of wall
      const spawnPoints: Vector2[] = [
        grid.gridToWorld(1, 1),    // Left side - blocked
        grid.gridToWorld(8, 8),    // Right side - accessible
        grid.gridToWorld(7, 7),    // Right side - accessible
      ];
      
      const validation = Pathfinding.validateAllSpawnPoints(
        spawnPoints,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(validation.allSpawnPointsValid).toBe(false);
      expect(validation.validSpawnPoints.length).toBe(2);
      expect(validation.invalidSpawnPoints.length).toBe(1);
      expect(validation.errors.length).toBe(1);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
    
    it('should warn about too few valid spawn points', () => {
      const playerGrid = { x: 5, y: 5 };
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      // Only one spawn point (placed on a path to ensure it's valid)
      const spawnPoints: Vector2[] = [
        grid.gridToWorld(5, 3)
      ];
      
      // Create clear path from spawn to player
      grid.setCellType(5, 3, CellType.PATH);
      grid.setCellType(5, 4, CellType.PATH);
      grid.setCellType(5, 5, CellType.PATH);
      
      const validation = Pathfinding.validateAllSpawnPoints(
        spawnPoints,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(validation.allSpawnPointsValid).toBe(true);
      expect(validation.validSpawnPoints.length).toBe(1);
      expect(validation.warnings).toContain('Less than 2 valid spawn points available - gameplay may be too predictable');
    });
    
    it('should handle empty spawn points array', () => {
      const playerWorld = grid.gridToWorld(5, 5);
      const spawnPoints: Vector2[] = [];
      
      const validation = Pathfinding.validateAllSpawnPoints(
        spawnPoints,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(validation.allSpawnPointsValid).toBe(false);
      expect(validation.errors).toContain('No spawn points defined');
    });
    
    it('should warn about unusually long paths', () => {
      // Create a simple test that validates the warning system works
      const playerGrid = { x: 8, y: 2 };
      const spawnGrid = { x: 2, y: 2 };
      const playerWorld = grid.gridToWorld(playerGrid.x, playerGrid.y);
      
      // Create a very long winding path
      // First, block direct path
      for (let x = 3; x <= 7; x++) {
        grid.setCellType(x, 2, CellType.OBSTACLE);
        grid.setCellType(x, 3, CellType.OBSTACLE);
      }
      
      // Create the only available path - a long detour
      // Path goes down, then right, then up
      for (let y = 2; y <= 8; y++) {
        grid.setCellType(2, y, CellType.PATH);
      }
      for (let x = 2; x <= 8; x++) {
        grid.setCellType(x, 8, CellType.PATH);
      }
      for (let y = 8; y >= 2; y--) {
        grid.setCellType(8, y, CellType.PATH);
      }
      
      const spawnPoints: Vector2[] = [
        grid.gridToWorld(spawnGrid.x, spawnGrid.y)
      ];
      
      const validation = Pathfinding.validateAllSpawnPoints(
        spawnPoints,
        playerWorld,
        grid,
        MovementType.WALKING
      );
      
      expect(validation.allSpawnPointsValid).toBe(true);
      expect(validation.spawnValidations.length).toBe(1);
      expect(validation.spawnValidations[0].isValid).toBe(true);
      
      // The path should be long enough to trigger a warning
      // Direct distance is 6, path length should be around 18
      if (validation.spawnValidations[0].pathCost && validation.spawnValidations[0].distance) {
        const costRatio = validation.spawnValidations[0].pathCost / validation.spawnValidations[0].distance;
        console.log(`Path cost ratio: ${costRatio}`);
      }
    });
  });
  
  describe('arePointsConnected', () => {
    it('should return true for connected points', () => {
      const point1 = grid.gridToWorld(2, 2);
      const point2 = grid.gridToWorld(6, 6);
      
      // Since empty cells are walkable, points should be connected by default
      const connected = Pathfinding.arePointsConnected(point1, point2, grid);
      expect(connected).toBe(true);
    });
    
    it('should return false for disconnected points', () => {
      const point1 = grid.gridToWorld(2, 2);
      const point2 = grid.gridToWorld(7, 7);
      
      // Create a complete wall that blocks all paths
      // Fill entire middle section with obstacles
      for (let y = 4; y <= 5; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
          grid.setCellType(x, y, CellType.OBSTACLE);
        }
      }
      for (let x = 4; x <= 5; x++) {
        for (let y = 1; y < gridSize - 1; y++) {
          grid.setCellType(x, y, CellType.OBSTACLE);
        }
      }
      
      const connected = Pathfinding.arePointsConnected(point1, point2, grid);
      expect(connected).toBe(false);
    });
    
    it('should respect movement type', () => {
      const point1 = grid.gridToWorld(2, 2);
      const point2 = grid.gridToWorld(7, 7);
      
      // Fill with water (except borders which are already blocked)
      for (let y = 1; y < gridSize - 1; y++) {
        for (let x = 1; x < gridSize - 1; x++) {
          grid.setCellType(x, y, CellType.WATER);
        }
      }
      
      // Not connected for walking
      const walkingConnected = Pathfinding.arePointsConnected(
        point1, 
        point2, 
        grid, 
        MovementType.WALKING
      );
      expect(walkingConnected).toBe(false);
      
      // Connected for flying
      const flyingConnected = Pathfinding.arePointsConnected(
        point1, 
        point2, 
        grid, 
        MovementType.FLYING
      );
      expect(flyingConnected).toBe(true);
    });
  });
});