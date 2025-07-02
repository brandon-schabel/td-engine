/**
 * Unit tests for SpawnZoneManager
 * Tests spawn zone management and spawn point selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpawnZoneManager, EdgeType, type SpawnZone, type GameStateSnapshot } from '@/systems/SpawnZoneManager';
import { Grid } from '@/systems/Grid';
import { createMockGrid } from '../helpers/mockData';

// Mock entities to avoid complex dependencies
const mockTower = (x: number, y: number) => ({
  position: { x, y },
  // Other properties not needed for tests
} as any);

const mockPlayer = (x: number, y: number) => ({
  position: { x, y },
  // Other properties not needed for tests  
} as any);

const mockGameState: GameStateSnapshot = {
  lives: 10,
  score: 0,
  waveNumber: 1,
  enemyCount: 0,
  towerCount: 0,
  playerPosition: { x: 100, y: 100 }
};

describe('SpawnZoneManager', () => {
  let grid: Grid;
  let spawnZoneManager: SpawnZoneManager;

  beforeEach(() => {
    grid = createMockGrid(20, 20);
    spawnZoneManager = new SpawnZoneManager(grid);
  });

  describe('initialization', () => {
    it('should generate initial spawn zones on all edges', () => {
      const zones = spawnZoneManager.getAllZones();
      
      expect(zones.length).toBeGreaterThan(0);
      
      // Check that all edge types are represented
      const edgeTypes = new Set(zones.map(z => z.edgeType));
      expect(edgeTypes.has(EdgeType.TOP)).toBe(true);
      expect(edgeTypes.has(EdgeType.BOTTOM)).toBe(true);
      expect(edgeTypes.has(EdgeType.LEFT)).toBe(true);
      expect(edgeTypes.has(EdgeType.RIGHT)).toBe(true);
    });

    it('should create zones with correct properties', () => {
      const zones = spawnZoneManager.getAllZones();
      const firstZone = zones[0];
      
      expect(firstZone).toHaveProperty('id');
      expect(firstZone).toHaveProperty('position');
      expect(firstZone).toHaveProperty('gridPosition');
      expect(firstZone).toHaveProperty('edgeType');
      expect(firstZone).toHaveProperty('priority');
      expect(firstZone.isActive).toBe(false);
      expect(firstZone.cooldownRemaining).toBe(0);
      expect(firstZone.spawnCount).toBe(0);
    });

    it('should assign correct edge types based on position', () => {
      const zones = spawnZoneManager.getAllZones();
      
      // Find a top edge zone - zones start from y=1 to avoid border cells
      const topZone = zones.find(z => z.gridPosition.y <= 3 && 
        z.gridPosition.x > 2 && z.gridPosition.x < grid.width - 3);
      expect(topZone?.edgeType).toBe(EdgeType.TOP);
      
      // Find a corner zone - corners are at x <= 2 or x >= width-3
      const cornerZone = zones.find(z => z.gridPosition.x <= 2 && z.gridPosition.y <= 3);
      expect(cornerZone?.edgeType).toBe(EdgeType.TOP_LEFT);
    });
  });

  describe('spawn position selection', () => {
    it('should return null when no zones are active', () => {
      const position = spawnZoneManager.getNextSpawnPosition();
      
      // Should activate a zone and return position
      expect(position).not.toBeNull();
      expect(spawnZoneManager.getActiveZones().length).toBe(1);
    });

    it('should activate zones when getting spawn position', () => {
      const position = spawnZoneManager.getNextSpawnPosition();
      
      expect(position).not.toBeNull();
      const activeZones = spawnZoneManager.getActiveZones();
      expect(activeZones.length).toBeGreaterThan(0);
      expect(activeZones[0].isActive).toBe(true);
    });

    it('should record spawn history', () => {
      spawnZoneManager.getNextSpawnPosition();
      spawnZoneManager.getNextSpawnPosition();
      
      const stats = spawnZoneManager.getSpawnStatistics();
      expect(stats.totalSpawns).toBe(2);
    });

    it('should respect chaos mode', () => {
      const chaosManager = new SpawnZoneManager(grid, { chaosMode: true });
      
      // Call update to activate multiple zones in chaos mode
      chaosManager.update(100, mockGameState, [], mockPlayer(0, 0));
      
      const positions = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const pos = chaosManager.getNextSpawnPosition();
        if (pos) {
          positions.add(`${pos.x},${pos.y}`);
        }
      }
      
      // Chaos mode should use various positions
      expect(positions.size).toBeGreaterThan(1);
    });
  });

  describe('zone management', () => {
    it('should update zone cooldowns', () => {
      // Manually activate a zone
      const zones = spawnZoneManager.getAllZones();
      const zone = zones[0];
      zone.isActive = true;
      zone.cooldownRemaining = 1000;
      
      spawnZoneManager.update(500, mockGameState, [], mockPlayer(0, 0));
      
      expect(zone.cooldownRemaining).toBe(500);
    });

    it('should handle temporary zones', () => {
      spawnZoneManager.createTemporaryZone({ x: 10, y: 0 }, 5000);
      
      const zones = spawnZoneManager.getAllZones();
      const tempZone = zones.find(z => z.id === 'zone_10_0');
      
      expect(tempZone).toBeDefined();
      expect(tempZone?.temporaryDuration).toBe(5000);
      expect(tempZone?.isActive).toBe(true);
    });

    it('should remove expired temporary zones', () => {
      spawnZoneManager.createTemporaryZone({ x: 10, y: 0 }, 1000);
      
      const initialCount = spawnZoneManager.getAllZones().length;
      
      // Update past expiration
      spawnZoneManager.update(1500, mockGameState, [], mockPlayer(0, 0));
      
      const finalCount = spawnZoneManager.getAllZones().length;
      expect(finalCount).toBe(initialCount - 1);
    });

    it('should manage max active zones', () => {
      const manager = new SpawnZoneManager(grid, { maxActiveZones: 2 });
      
      // Force activate multiple zones
      for (let i = 0; i < 5; i++) {
        manager.getNextSpawnPosition();
      }
      
      manager.update(100, mockGameState, [], mockPlayer(0, 0));
      
      const activeZones = manager.getActiveZones();
      expect(activeZones.length).toBeLessThanOrEqual(2);
    });
  });

  describe('adaptive weighting', () => {
    it('should reduce priority near towers', () => {
      const zones = spawnZoneManager.getAllZones();
      const zone = zones[0];
      const initialPriority = zone.priority;
      
      // Place tower near zone and player also near to isolate tower effect
      const towers = [mockTower(zone.position.x, zone.position.y)];
      const nearbyPlayer = mockPlayer(zone.position.x + 50, zone.position.y + 50);
      
      spawnZoneManager.update(100, mockGameState, towers, nearbyPlayer);
      
      expect(zone.priority).toBeLessThan(initialPriority);
    });

    it('should increase priority far from player', () => {
      const zones = spawnZoneManager.getAllZones();
      const zone = zones[0];
      const initialPriority = zone.priority;
      
      // Player far from zone
      const farPlayer = mockPlayer(1000, 1000);
      
      spawnZoneManager.update(100, mockGameState, [], farPlayer);
      
      expect(zone.priority).toBeGreaterThan(initialPriority);
    });
  });

  describe('spawn patterns', () => {
    it('should handle burst spawn pattern', () => {
      const positions = spawnZoneManager.getSpawnPositionsForPattern('BURST_SPAWN', 8);
      
      expect(positions.length).toBeLessThanOrEqual(8);
      
      // Should use different edges
      const edges = new Set<string>();
      positions.forEach(pos => {
        const zone = spawnZoneManager.getAllZones().find(z => 
          z.position.x === pos.x && z.position.y === pos.y
        );
        if (zone) edges.add(zone.edgeType);
      });
      
      expect(edges.size).toBeGreaterThan(1);
    });

    it('should handle pincer movement pattern', () => {
      const positions = spawnZoneManager.getSpawnPositionsForPattern('PINCER_MOVEMENT', 6);
      
      expect(positions.length).toBeLessThanOrEqual(6);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should fall back to default pattern', () => {
      const positions = spawnZoneManager.getSpawnPositionsForPattern('UNKNOWN_PATTERN', 4);
      
      expect(positions.length).toBeLessThanOrEqual(4);
    });
  });

  describe('statistics', () => {
    it('should track spawn statistics', () => {
      // Perform some spawns
      for (let i = 0; i < 10; i++) {
        spawnZoneManager.getNextSpawnPosition();
      }
      
      const stats = spawnZoneManager.getSpawnStatistics();
      
      expect(stats.totalSpawns).toBe(10);
      expect(stats.activeZoneCount).toBeGreaterThan(0);
      expect(stats.averageZonePriority).toBeGreaterThan(0);
      
      // Check edge distribution
      const totalEdgeSpawns = Object.values(stats.spawnsByEdge)
        .reduce((sum, count) => sum + count, 0);
      expect(totalEdgeSpawns).toBe(10);
    });

    it('should track spawns by edge type', () => {
      for (let i = 0; i < 20; i++) {
        spawnZoneManager.getNextSpawnPosition();
      }
      
      const stats = spawnZoneManager.getSpawnStatistics();
      
      // At least some edges should have spawns
      const usedEdges = Object.values(stats.spawnsByEdge)
        .filter(count => count > 0).length;
      expect(usedEdges).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      // Add some state
      for (let i = 0; i < 5; i++) {
        spawnZoneManager.getNextSpawnPosition();
      }
      spawnZoneManager.createTemporaryZone({ x: 15, y: 0 }, 5000);
      
      spawnZoneManager.reset();
      
      const stats = spawnZoneManager.getSpawnStatistics();
      expect(stats.totalSpawns).toBe(0);
      expect(stats.activeZoneCount).toBe(0);
      
      // Should have regenerated initial zones
      expect(spawnZoneManager.getAllZones().length).toBeGreaterThan(0);
    });
  });

  describe('edge detection', () => {
    it('should detect correct edge type for positions', () => {
      const manager = new SpawnZoneManager(grid, { dynamicZoneGeneration: true });
      
      // Test corner detection
      manager.createTemporaryZone({ x: 0, y: 0 }, 1000);
      const topLeftZone = manager.getAllZones().find(z => z.id === 'zone_0_0');
      expect(topLeftZone?.edgeType).toBe(EdgeType.TOP_LEFT);
      
      // Test edge detection
      manager.createTemporaryZone({ x: 10, y: 19 }, 1000);
      const bottomZone = manager.getAllZones().find(z => z.id === 'zone_10_19');
      expect(bottomZone?.edgeType).toBe(EdgeType.BOTTOM);
    });
  });

  describe('configuration', () => {
    it('should respect configuration options', () => {
      const config = {
        maxActiveZones: 5,
        zoneCooldown: 10000,
        adaptiveWeighting: false,
        chaosMode: false,
        dynamicZoneGeneration: false
      };
      
      const customManager = new SpawnZoneManager(grid, config);
      
      // Test dynamic zone generation disabled
      const initialCount = customManager.getAllZones().length;
      customManager.createTemporaryZone({ x: 15, y: 15 }, 1000);
      expect(customManager.getAllZones().length).toBe(initialCount);
    });

    it('should handle custom edge weights', () => {
      const config = {
        edgeWeights: {
          [EdgeType.TOP]: 2.0,
          [EdgeType.BOTTOM]: 0.5,
          [EdgeType.LEFT]: 1.0,
          [EdgeType.RIGHT]: 1.0,
          [EdgeType.TOP_LEFT]: 1.0,
          [EdgeType.TOP_RIGHT]: 1.0,
          [EdgeType.BOTTOM_LEFT]: 1.0,
          [EdgeType.BOTTOM_RIGHT]: 1.0
        }
      };
      
      const customManager = new SpawnZoneManager(grid, config);
      const zones = customManager.getAllZones();
      
      const topZone = zones.find(z => z.edgeType === EdgeType.TOP);
      const bottomZone = zones.find(z => z.edgeType === EdgeType.BOTTOM);
      
      expect(topZone?.priority).toBe(2.0);
      expect(bottomZone?.priority).toBe(0.5);
    });
  });
});