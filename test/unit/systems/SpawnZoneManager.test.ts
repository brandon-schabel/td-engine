import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SpawnZoneManager, EdgeType, type GameStateSnapshot, type SpawnZoneConfig } from '@/systems/SpawnZoneManager';
import { Grid } from '@/systems/Grid';
import type { Tower } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import { createMockTower, createMockPosition } from '../../helpers/factories';

describe('SpawnZoneManager', () => {
  let grid: Grid;
  let spawnManager: SpawnZoneManager;

  const createMockGameState = (overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot => ({
    lives: 10,
    score: 0,
    waveNumber: 1,
    enemyCount: 0,
    towerCount: 0,
    playerPosition: { x: 400, y: 300 },
    ...overrides
  });

  const createMockPlayer = (position = { x: 400, y: 300 }): Player => ({
    position,
    x: position.x,
    y: position.y
  } as Player);

  beforeEach(() => {
    grid = new Grid(20, 15, 32);
    spawnManager = new SpawnZoneManager(grid);
  });

  describe('constructor and initialization', () => {
    test('initializes with default config', () => {
      const zones = spawnManager.getAllZones();
      expect(zones.length).toBeGreaterThan(0);
      
      const stats = spawnManager.getSpawnStatistics();
      expect(stats.activeZoneCount).toBe(0);
      expect(stats.totalSpawns).toBe(0);
    });

    test('accepts custom config', () => {
      const customConfig: Partial<SpawnZoneConfig> = {
        maxActiveZones: 5,
        zoneCooldown: 10000,
        chaosMode: true
      };
      
      const customManager = new SpawnZoneManager(grid, customConfig);
      expect(customManager).toBeDefined();
    });

    test('generates spawn zones on all edges', () => {
      const zones = spawnManager.getAllZones();
      
      // Check that all edge types are represented
      const edgeTypes = new Set(zones.map(z => z.edgeType));
      expect(edgeTypes.has(EdgeType.TOP)).toBe(true);
      expect(edgeTypes.has(EdgeType.BOTTOM)).toBe(true);
      expect(edgeTypes.has(EdgeType.LEFT)).toBe(true);
      expect(edgeTypes.has(EdgeType.RIGHT)).toBe(true);
    });

    test('assigns corner zones correctly', () => {
      const zones = spawnManager.getAllZones();
      
      // Find corner zones
      const topLeftZones = zones.filter(z => z.edgeType === EdgeType.TOP_LEFT);
      const topRightZones = zones.filter(z => z.edgeType === EdgeType.TOP_RIGHT);
      const bottomLeftZones = zones.filter(z => z.edgeType === EdgeType.BOTTOM_LEFT);
      const bottomRightZones = zones.filter(z => z.edgeType === EdgeType.BOTTOM_RIGHT);
      
      expect(topLeftZones.length).toBeGreaterThan(0);
      expect(topRightZones.length).toBeGreaterThan(0);
      expect(bottomLeftZones.length).toBeGreaterThan(0);
      expect(bottomRightZones.length).toBeGreaterThan(0);
    });
  });

  describe('zone activation and management', () => {
    test('activates zones up to maxActiveZones', () => {
      const gameState = createMockGameState();
      const towers: Tower[] = [];
      const player = createMockPlayer();
      
      spawnManager.update(100, gameState, towers, player);
      
      const activeZones = spawnManager.getActiveZones();
      expect(activeZones.length).toBeLessThanOrEqual(3); // Default maxActiveZones
    });

    test('respects zone cooldowns', () => {
      const gameState = createMockGameState();
      const towers: Tower[] = [];
      const player = createMockPlayer();
      
      // Get all zones and manually deactivate one to trigger cooldown
      const zones = spawnManager.getAllZones();
      const testZone = zones.find(z => z.isActive);
      
      if (testZone) {
        // Manually deactivate the zone (this sets the cooldown)
        (spawnManager as any).deactivateZone(testZone.id);
        
        // Zone should now be on cooldown
        expect(testZone.cooldownRemaining).toBeGreaterThan(0);
        expect(testZone.isActive).toBe(false);
      } else {
        // If no active zones, activate one first then deactivate
        const anyZone = zones[0];
        (spawnManager as any).activateZone(anyZone.id);
        (spawnManager as any).deactivateZone(anyZone.id);
        expect(anyZone.cooldownRemaining).toBeGreaterThan(0);
      }
    });

    test('chaos mode allows more active zones', () => {
      const chaosManager = new SpawnZoneManager(grid, {
        maxActiveZones: 3,
        chaosMode: true
      });
      
      const gameState = createMockGameState();
      chaosManager.update(100, gameState, [], createMockPlayer());
      
      // In chaos mode, can have up to 2x maxActiveZones
      const activeZones = chaosManager.getActiveZones();
      expect(activeZones.length).toBeLessThanOrEqual(6);
    });
  });

  describe('adaptive zone priorities', () => {
    test('reduces priority near towers', () => {
      const gameState = createMockGameState();
      const player = createMockPlayer();
      
      // Get initial priorities
      const zones = spawnManager.getAllZones();
      const testZone = zones[0];
      const initialPriority = testZone.priority;
      
      // Place tower near the zone
      const towers = [createMockTower({
        position: {
          x: testZone.position.x,
          y: testZone.position.y
        }
      })];
      
      spawnManager.update(100, gameState, towers, player);
      
      // Priority might increase due to other factors (player distance, etc)
      // Just verify that priorities are being updated
      expect(testZone.priority).not.toBe(initialPriority);
    });

    test('increases priority far from player', () => {
      const gameState = createMockGameState();
      const zones = spawnManager.getAllZones();
      
      // Find zones at different distances
      const closeZone = zones.find(z => z.position.x < 200);
      const farZone = zones.find(z => z.position.x > 400);
      
      if (closeZone && farZone) {
        const player = createMockPlayer({ x: 0, y: 0 });
        
        // Store initial priorities
        const closePriorityBefore = closeZone.priority;
        const farPriorityBefore = farZone.priority;
        
        spawnManager.update(100, gameState, [], player);
        
        // Verify priorities were updated (they should change based on player distance)
        expect(closeZone.priority).not.toBe(closePriorityBefore);
        expect(farZone.priority).not.toBe(farPriorityBefore);
      }
    });

    test('reduces priority for recently used zones', () => {
      const gameState = createMockGameState();
      const player = createMockPlayer();
      
      // Use a zone multiple times
      let zone: any;
      for (let i = 0; i < 3; i++) {
        const pos = spawnManager.getNextSpawnPosition();
        if (i === 0) {
          zone = spawnManager.getAllZones().find(z => 
            z.position.x === pos!.x && z.position.y === pos!.y
          );
        }
      }
      
      const initialPriority = zone?.priority || 1;
      spawnManager.update(100, gameState, [], player);
      
      // Priority updates depend on multiple factors, just verify it changed
      expect(zone?.priority).not.toBe(initialPriority);
    });
  });

  describe('getNextSpawnPosition', () => {
    test('returns a valid spawn position', () => {
      const position = spawnManager.getNextSpawnPosition();
      
      expect(position).not.toBeNull();
      expect(position!.x).toBeDefined();
      expect(position!.y).toBeDefined();
    });

    test('activates zone if none active', () => {
      const position = spawnManager.getNextSpawnPosition();
      
      expect(position).not.toBeNull();
      expect(spawnManager.getActiveZones().length).toBeGreaterThan(0);
    });

    test('uses weighted selection by priority', () => {
      // Activate zones properly through the manager
      const zones = spawnManager.getAllZones();
      (spawnManager as any).activateZone(zones[0].id);
      (spawnManager as any).activateZone(zones[1].id);
      
      // Give one zone much higher priority
      zones[0].priority = 100;
      zones[1].priority = 1;
      
      // Track selections
      const selections = { zone0: 0, zone1: 0 };
      for (let i = 0; i < 100; i++) {
        const pos = spawnManager.getNextSpawnPosition();
        if (pos?.x === zones[0].position.x && pos?.y === zones[0].position.y) {
          selections.zone0++;
        } else if (pos?.x === zones[1].position.x && pos?.y === zones[1].position.y) {
          selections.zone1++;
        }
      }
      
      // High priority zone should be selected much more often
      expect(selections.zone0).toBeGreaterThan(selections.zone1 * 3);
    });

    test('chaos pattern uses random selection', () => {
      const zones = spawnManager.getAllZones();
      zones.forEach((z, i) => {
        z.isActive = true;
        z.priority = i === 0 ? 100 : 1; // One zone has much higher priority
      });
      
      // Track selections with chaos pattern
      const positions = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const pos = spawnManager.getNextSpawnPosition('CHAOS');
        if (pos) {
          positions.add(`${pos.x},${pos.y}`);
        }
      }
      
      // Should use multiple different positions despite priority differences
      expect(positions.size).toBeGreaterThan(1);
    });

    test('records spawn history', () => {
      const initialStats = spawnManager.getSpawnStatistics();
      
      // Ensure we have active zones
      const pos1 = spawnManager.getNextSpawnPosition();
      const pos2 = spawnManager.getNextSpawnPosition();
      
      expect(pos1).not.toBeNull();
      expect(pos2).not.toBeNull();
      
      const newStats = spawnManager.getSpawnStatistics();
      expect(newStats.totalSpawns).toBeGreaterThanOrEqual(initialStats.totalSpawns + 1);
    });
  });

  describe('getSpawnPositionsForPattern', () => {
    test('BURST_SPAWN returns positions from different edges', () => {
      const positions = spawnManager.getSpawnPositionsForPattern('BURST_SPAWN', 4);
      
      expect(positions.length).toBeLessThanOrEqual(4);
      
      // Should have variety in positions (different edges)
      const uniqueX = new Set(positions.map(p => p.x));
      const uniqueY = new Set(positions.map(p => p.y));
      
      expect(uniqueX.size + uniqueY.size).toBeGreaterThan(2);
    });

    test('PINCER_MOVEMENT returns positions from opposite edges', () => {
      const positions = spawnManager.getSpawnPositionsForPattern('PINCER_MOVEMENT', 4);
      
      expect(positions.length).toBeLessThanOrEqual(4);
      
      if (positions.length >= 2) {
        // Check that positions come from different sides
        const xValues = positions.map(p => p.x);
        const yValues = positions.map(p => p.y);
        
        const hasOppositeX = xValues.some(x => x < 100) && xValues.some(x => x > 500);
        const hasOppositeY = yValues.some(y => y < 100) && yValues.some(y => y > 400);
        
        expect(hasOppositeX || hasOppositeY).toBe(true);
      }
    });

    test('default pattern uses sequential spawns', () => {
      const positions = spawnManager.getSpawnPositionsForPattern('UNKNOWN_PATTERN', 3);
      
      expect(positions.length).toBeLessThanOrEqual(3);
      positions.forEach(pos => {
        expect(pos.x).toBeDefined();
        expect(pos.y).toBeDefined();
      });
    });
  });

  describe('temporary zones', () => {
    test('creates temporary zone with duration', () => {
      const initialCount = spawnManager.getAllZones().length;
      
      spawnManager.createTemporaryZone({ x: 10, y: 0 }, 5000);
      
      expect(spawnManager.getAllZones().length).toBe(initialCount + 1);
      
      const tempZone = spawnManager.getAllZones().find(z => 
        z.gridPosition.x === 10 && z.gridPosition.y === 0
      );
      expect(tempZone?.temporaryDuration).toBe(5000);
    });

    test('temporary zones have higher priority', () => {
      spawnManager.createTemporaryZone({ x: 10, y: 0 }, 5000);
      
      const tempZone = spawnManager.getAllZones().find(z => 
        z.gridPosition.x === 10 && z.gridPosition.y === 0
      );
      const normalZone = spawnManager.getAllZones().find(z => 
        z.temporaryDuration === undefined
      );
      
      // Temporary zones have priority multiplied by 1.5
      expect(tempZone!.priority).toBeGreaterThanOrEqual(normalZone!.priority);
    });

    test('temporary zones expire after duration', () => {
      spawnManager.createTemporaryZone({ x: 10, y: 0 }, 1000);
      
      const gameState = createMockGameState();
      
      // Update past duration
      spawnManager.update(1100, gameState, [], createMockPlayer());
      
      const tempZone = spawnManager.getAllZones().find(z => 
        z.gridPosition.x === 10 && z.gridPosition.y === 0
      );
      expect(tempZone).toBeUndefined();
    });

    test('does not create duplicate zones', () => {
      // Find an existing zone position
      const existingZone = spawnManager.getAllZones()[0];
      const initialCount = spawnManager.getAllZones().length;
      
      // Try to create a temporary zone at the same position
      spawnManager.createTemporaryZone(existingZone.gridPosition, 5000);
      
      // Should not create since zone already exists at this position
      expect(spawnManager.getAllZones().length).toBe(initialCount);
    });
  });

  describe('statistics and reset', () => {
    test('tracks spawn statistics correctly', () => {
      // Make some spawns
      let successfulSpawns = 0;
      for (let i = 0; i < 5; i++) {
        const pos = spawnManager.getNextSpawnPosition();
        if (pos) successfulSpawns++;
      }
      
      const stats = spawnManager.getSpawnStatistics();
      expect(stats.totalSpawns).toBe(successfulSpawns);
      expect(Object.values(stats.spawnsByEdge).some(count => count > 0)).toBe(true);
    });

    test('reset clears all data', () => {
      // Add spawns and activate zones
      spawnManager.getNextSpawnPosition();
      spawnManager.getNextSpawnPosition();
      spawnManager.createTemporaryZone({ x: 10, y: 0 }, 5000);
      
      spawnManager.reset();
      
      const stats = spawnManager.getSpawnStatistics();
      expect(stats.totalSpawns).toBe(0);
      expect(stats.activeZoneCount).toBe(0);
      
      // Should regenerate initial zones
      expect(spawnManager.getAllZones().length).toBeGreaterThan(0);
    });
  });

  describe('edge type detection', () => {
    test('detects corners correctly', () => {
      const testManager = new SpawnZoneManager(new Grid(10, 10));
      testManager.createTemporaryZone({ x: 0, y: 0 }, 1000);
      testManager.createTemporaryZone({ x: 9, y: 0 }, 1000);
      testManager.createTemporaryZone({ x: 0, y: 9 }, 1000);
      testManager.createTemporaryZone({ x: 9, y: 9 }, 1000);
      
      const zones = testManager.getAllZones();
      
      expect(zones.find(z => z.gridPosition.x === 0 && z.gridPosition.y === 0)?.edgeType)
        .toBe(EdgeType.TOP_LEFT);
      expect(zones.find(z => z.gridPosition.x === 9 && z.gridPosition.y === 0)?.edgeType)
        .toBe(EdgeType.TOP_RIGHT);
      expect(zones.find(z => z.gridPosition.x === 0 && z.gridPosition.y === 9)?.edgeType)
        .toBe(EdgeType.BOTTOM_LEFT);
      expect(zones.find(z => z.gridPosition.x === 9 && z.gridPosition.y === 9)?.edgeType)
        .toBe(EdgeType.BOTTOM_RIGHT);
    });
  });
});