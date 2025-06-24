import { describe, it, expect, beforeEach } from 'bun:test';
import { MovementSystem, MovementType, TERRAIN_DEFINITIONS } from '../MovementSystem';
import { Entity, EntityType } from '@/entities/Entity';
import { Grid, CellType } from '../Grid';

describe('MovementSystem', () => {
  let grid: Grid;
  let entity: Entity;

  beforeEach(() => {
    grid = new Grid(10, 10, 32);
    entity = new Entity(EntityType.ENEMY, { x: 100, y: 100 }, 100, 10);
    entity.baseSpeed = 100;
    entity.currentSpeed = 100;
    MovementSystem.clearCache();
  });

  describe('getEntityMovementType', () => {
    it('should return default WALKING movement type', () => {
      const movementType = MovementSystem.getEntityMovementType(entity);
      expect(movementType).toBe(MovementType.WALKING);
    });

    it('should return custom movement type if set', () => {
      entity.movementType = MovementType.FLYING;
      const movementType = MovementSystem.getEntityMovementType(entity);
      expect(movementType).toBe(MovementType.FLYING);
    });

    it('should detect flying entities by name', () => {
      // Create a mock entity with custom constructor name
      const flyingEntity = Object.create(Entity.prototype);
      Object.assign(flyingEntity, new Entity(EntityType.ENEMY, { x: 0, y: 0 }, 100, 10));
      Object.defineProperty(flyingEntity.constructor, 'name', {
        value: 'FlyingEnemy',
        configurable: true
      });
      const movementType = MovementSystem.getEntityMovementType(flyingEntity);
      expect(movementType).toBe(MovementType.FLYING);
    });

    it('should detect aquatic entities by name', () => {
      // Create a mock entity with custom constructor name
      const aquaticEntity = Object.create(Entity.prototype);
      Object.assign(aquaticEntity, new Entity(EntityType.ENEMY, { x: 0, y: 0 }, 100, 10));
      Object.defineProperty(aquaticEntity.constructor, 'name', {
        value: 'AquaticEnemy',
        configurable: true
      });
      const movementType = MovementSystem.getEntityMovementType(aquaticEntity);
      expect(movementType).toBe(MovementType.SWIMMING);
    });
  });

  describe('canEntityMoveTo', () => {
    it('should allow walking entities to move on empty cells', () => {
      entity.movementType = MovementType.WALKING;
      grid.setCellType(3, 3, CellType.EMPTY);
      const canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(true);
    });

    it('should prevent walking entities from moving on water', () => {
      entity.movementType = MovementType.WALKING;
      grid.setCellType(3, 3, CellType.WATER);
      const canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(false);
    });

    it('should allow flying entities to move over water', () => {
      entity.movementType = MovementType.FLYING;
      grid.setCellType(3, 3, CellType.WATER);
      const canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(true);
    });

    it('should allow swimming entities to move in water', () => {
      entity.movementType = MovementType.SWIMMING;
      grid.setCellType(3, 3, CellType.WATER);
      const canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(true);
    });

    it('should allow amphibious entities to move on land and water', () => {
      entity.movementType = MovementType.AMPHIBIOUS;
      
      grid.setCellType(3, 3, CellType.EMPTY);
      let canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(true);
      
      grid.setCellType(3, 3, CellType.WATER);
      canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
      expect(canMove).toBe(true);
    });

    it('should prevent all entities from moving on blocked cells', () => {
      const movementTypes = [
        MovementType.WALKING,
        MovementType.FLYING,
        MovementType.SWIMMING,
        MovementType.AMPHIBIOUS,
        MovementType.ALL_TERRAIN
      ];

      grid.setCellType(3, 3, CellType.BLOCKED);
      
      for (const movementType of movementTypes) {
        entity.movementType = movementType;
        const canMove = MovementSystem.canEntityMoveTo(entity, { x: 96, y: 96 }, grid);
        expect(canMove).toBe(false);
      }
    });

    it('should return false for out of bounds positions', () => {
      const canMove = MovementSystem.canEntityMoveTo(entity, { x: -100, y: -100 }, grid);
      expect(canMove).toBe(false);
    });
  });

  describe('getAdjustedSpeed', () => {
    it('should return base speed on normal terrain', () => {
      grid.setCellType(3, 3, CellType.EMPTY);
      entity.position = { x: 96, y: 96 };
      const adjustedSpeed = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(adjustedSpeed).toBe(100);
    });

    it('should apply speed multiplier on rough terrain', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      entity.position = { x: 96, y: 96 };
      const adjustedSpeed = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(adjustedSpeed).toBe(50); // 0.5 multiplier
    });

    it('should apply speed bonus on paths', () => {
      grid.setCellType(3, 3, CellType.PATH);
      entity.position = { x: 96, y: 96 };
      const adjustedSpeed = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(adjustedSpeed).toBe(120); // 1.2 multiplier
    });

    it('should cache speed calculations', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      entity.position = { x: 96, y: 96 };
      
      // First call should calculate
      const speed1 = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(speed1).toBe(50);
      
      // Change grid but cached value should still be returned
      grid.setCellType(3, 3, CellType.PATH);
      const speed2 = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(speed2).toBe(50); // Still cached value
      
      // Clear cache and recalculate
      MovementSystem.clearCache();
      const speed3 = MovementSystem.getAdjustedSpeed(entity, 100, grid);
      expect(speed3).toBe(120); // New calculation
    });
  });

  describe('getMovementCost', () => {
    it('should calculate base cost as distance', () => {
      grid.setCellType(0, 0, CellType.EMPTY);
      grid.setCellType(3, 4, CellType.EMPTY);
      
      const cost = MovementSystem.getMovementCost(
        { x: 0, y: 0 },
        { x: 96, y: 128 }, // 3,4 in grid coords
        grid,
        MovementType.WALKING
      );
      
      expect(cost).toBe(5); // Distance is 5 (3-4-5 triangle)
    });

    it('should increase cost for rough terrain', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      
      const cost = MovementSystem.getMovementCost(
        { x: 64, y: 64 },
        { x: 96, y: 96 },
        grid,
        MovementType.WALKING
      );
      
      // Distance is ~1.414, speed multiplier is 0.5, so cost is ~2.828
      expect(cost).toBeGreaterThan(2.8);
      expect(cost).toBeLessThan(2.9);
    });

    it('should return Infinity for impassable terrain', () => {
      grid.setCellType(3, 3, CellType.WATER);
      
      const cost = MovementSystem.getMovementCost(
        { x: 64, y: 64 },
        { x: 96, y: 96 },
        grid,
        MovementType.WALKING
      );
      
      expect(cost).toBe(Infinity);
    });

    it('should allow flying over water', () => {
      grid.setCellType(3, 3, CellType.WATER);
      
      const cost = MovementSystem.getMovementCost(
        { x: 64, y: 64 },
        { x: 96, y: 96 },
        grid,
        MovementType.FLYING
      );
      
      // Flying entities move at normal speed over water
      // Distance is sqrt(2) ≈ 1.414 in grid coordinates
      expect(cost).toBeGreaterThan(1.4);
      expect(cost).toBeLessThan(1.5);
    });
  });

  describe('applyTerrainEffects', () => {
    it('should apply damage over time from terrain', () => {
      // Add lava terrain type for testing
      TERRAIN_DEFINITIONS['LAVA'] = {
        walkable: true,
        flyable: true,
        swimmable: false,
        speedMultiplier: 0.3,
        damagePerSecond: 10
      };
      
      grid.setCellType(3, 3, CellType.BLOCKED); // Use as placeholder
      grid.setCellData(3, 3, { type: 'LAVA' as CellType });
      entity.position = { x: 96, y: 96 };
      
      const initialHealth = entity.health;
      MovementSystem.applyTerrainEffects(entity, 1000, grid); // 1 second
      
      expect(entity.health).toBe(initialHealth - 10);
      
      // Clean up
      delete TERRAIN_DEFINITIONS['LAVA'];
    });

    it('should apply status effects from terrain', () => {
      // Add poison terrain type for testing
      TERRAIN_DEFINITIONS['POISON'] = {
        walkable: true,
        flyable: true,
        swimmable: false,
        speedMultiplier: 0.8,
        statusEffect: {
          type: 'poison',
          duration: 5000,
          strength: 1
        }
      };
      
      grid.setCellType(3, 3, CellType.BLOCKED);
      grid.setCellData(3, 3, { type: 'POISON' as CellType });
      entity.position = { x: 96, y: 96 };
      
      // Mock applyStatusEffect
      let appliedEffect: any = null;
      (entity as any).applyStatusEffect = (effect: any) => {
        appliedEffect = effect;
      };
      
      MovementSystem.applyTerrainEffects(entity, 1000, grid);
      
      expect(appliedEffect).toEqual({
        type: 'poison',
        duration: 5000,
        strength: 1
      });
      
      // Clean up
      delete TERRAIN_DEFINITIONS['POISON'];
    });

    it('should not apply effects if entity is not on special terrain', () => {
      grid.setCellType(3, 3, CellType.EMPTY);
      entity.position = { x: 96, y: 96 };
      
      const initialHealth = entity.health;
      MovementSystem.applyTerrainEffects(entity, 1000, grid);
      
      expect(entity.health).toBe(initialHealth);
    });
  });

  describe('getSmoothTransitionSpeed', () => {
    it('should instantly return target speed if within max change', () => {
      const result = MovementSystem.getSmoothTransitionSpeed(
        entity,
        100,
        102,
        1000, // 1 second
        5.0   // 5 units per second max change
      );
      
      expect(result).toBe(102);
    });

    it('should gradually transition to target speed', () => {
      const result = MovementSystem.getSmoothTransitionSpeed(
        entity,
        100,
        150,
        1000, // 1 second
        10.0  // 10 units per second max change
      );
      
      expect(result).toBe(110); // 100 + 10
    });

    it('should handle negative transitions', () => {
      const result = MovementSystem.getSmoothTransitionSpeed(
        entity,
        100,
        50,
        1000, // 1 second
        10.0  // 10 units per second max change
      );
      
      expect(result).toBe(90); // 100 - 10
    });

    it('should handle small delta times', () => {
      const result = MovementSystem.getSmoothTransitionSpeed(
        entity,
        100,
        150,
        100,  // 0.1 second
        10.0  // 10 units per second
      );
      
      expect(result).toBe(101); // 100 + 1
    });
  });
});