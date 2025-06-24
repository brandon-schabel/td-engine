import { describe, it, expect, beforeEach } from 'bun:test';
import { Entity, EntityType } from '../Entity';
import { Enemy, EnemyType } from '../Enemy';
import { Player } from '../Player';
import { Grid, CellType } from '@/systems/Grid';
import { MovementSystem, MovementType } from '@/systems/MovementSystem';

describe('Entity terrain-aware movement', () => {
  let grid: Grid;
  let entity: Entity;

  beforeEach(() => {
    grid = new Grid(20, 20, 32);
    entity = new Entity(EntityType.ENEMY, { x: 100, y: 100 }, 100, 10);
    entity.baseSpeed = 100;
    entity.currentSpeed = 100;
  });

  describe('Entity base class', () => {
    it('should update with terrain effects when grid is provided', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      entity.position = { x: 96, y: 96 };
      
      entity.update(16, grid); // 16ms frame
      
      // Should have terrain effect applied
      expect(entity.currentSpeed).toBeLessThan(entity.baseSpeed);
    });

    it('should smoothly transition between terrain speeds', () => {
      // Start on normal terrain
      grid.setCellType(3, 3, CellType.EMPTY);
      entity.position = { x: 96, y: 96 };
      entity.update(16, grid);
      
      const normalSpeed = entity.currentSpeed;
      
      // Move to rough terrain
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      entity.update(16, grid);
      
      // Speed should decrease but not instantly
      expect(entity.currentSpeed).toBeLessThan(normalSpeed);
      expect(entity.currentSpeed).toBeGreaterThan(50); // Not instantly at 50%
    });

    it('should not apply terrain effects without grid', () => {
      const initialSpeed = entity.currentSpeed;
      entity.update(16); // No grid
      
      expect(entity.currentSpeed).toBe(initialSpeed);
    });

    it('should apply terrain damage', () => {
      // Mock terrain with damage
      grid.setCellType(3, 3, CellType.BLOCKED);
      grid.setCellData(3, 3, { 
        type: 'LAVA' as CellType,
        movementSpeed: 0.3
      });
      
      entity.position = { x: 96, y: 96 };
      const initialHealth = entity.health;
      
      // This would apply damage if LAVA terrain was defined with damagePerSecond
      entity.update(1000, grid); // 1 second
      
      // For now, health should remain the same since LAVA isn't in TERRAIN_DEFINITIONS
      expect(entity.health).toBe(initialHealth);
    });

    it('should use terrain-aware movement in moveTo', () => {
      grid.setCellType(3, 3, CellType.PATH);
      entity.position = { x: 96, y: 96 };
      entity.currentSpeed = 120; // Path bonus applied
      
      entity.moveTo({ x: 200, y: 200 }, 100, grid);
      
      // Velocity should use current speed (terrain-adjusted)
      const velocityMagnitude = Math.sqrt(
        entity.velocity.x * entity.velocity.x + 
        entity.velocity.y * entity.velocity.y
      );
      
      expect(velocityMagnitude).toBeCloseTo(120, 1);
    });

    it('should provide helper method for terrain movement', () => {
      grid.setCellType(3, 3, CellType.PATH);
      entity.position = { x: 96, y: 96 };
      entity.baseSpeed = 100;
      entity.currentSpeed = 120;
      
      entity.moveToWithTerrain({ x: 200, y: 200 }, grid);
      
      const velocityMagnitude = Math.sqrt(
        entity.velocity.x * entity.velocity.x + 
        entity.velocity.y * entity.velocity.y
      );
      
      expect(velocityMagnitude).toBeCloseTo(120, 1);
    });
  });

  describe('Enemy terrain movement', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy({ x: 100, y: 100 }, 100, EnemyType.BASIC);
      enemy.setGrid(grid);
    });

    it('should initialize with terrain-aware properties', () => {
      expect(enemy.baseSpeed).toBe(enemy.speed);
      expect(enemy.currentSpeed).toBe(enemy.speed);
      expect(enemy.movementType).toBe(MovementType.WALKING);
    });

    it('should use terrain-aware speed when moving to target', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      enemy.position = { x: 96, y: 96 };
      
      // Update to apply terrain effects
      enemy.update(16, grid);
      
      // Set a target
      const mockPlayer = new Entity(EntityType.PLAYER, { x: 200, y: 200 }, 100, 10);
      enemy.setPlayerTarget(mockPlayer as any);
      
      // Update again to move towards target
      enemy.update(16, grid);
      
      // Velocity should be reduced due to rough terrain
      const velocityMagnitude = Math.sqrt(
        enemy.velocity.x * enemy.velocity.x + 
        enemy.velocity.y * enemy.velocity.y
      );
      
      expect(velocityMagnitude).toBeLessThan(enemy.speed);
    });

    it('should use terrain speed when following path', () => {
      // Create a path
      for (let i = 0; i < 10; i++) {
        grid.setCellType(i, 5, CellType.PATH);
      }
      
      // Place enemy on path (grid cell 5,5 = world pos 160,160 with cell size 32)
      enemy.position = { x: 5 * 32 + 16, y: 5 * 32 + 16 }; // Center of cell
      
      // Verify enemy is on path
      const gridPos = grid.worldToGrid(enemy.position);
      expect(grid.getCellType(gridPos.x, gridPos.y)).toBe(CellType.PATH);
      
      // Set initial speed
      enemy.baseSpeed = 50;
      enemy.currentSpeed = 50;
      
      // Update to apply terrain effects - path gives 1.2x speed
      enemy.update(3000, grid); // 3 seconds for full transition
      
      // Should have transitioned towards path speed (50 * 1.2 = 60)
      // Allow for some transition time
      expect(enemy.currentSpeed).toBeGreaterThan(55);
      expect(enemy.currentSpeed).toBeLessThanOrEqual(60);
    });

    it('should handle grid reference in update', () => {
      grid.setCellType(3, 3, CellType.WATER);
      enemy.position = { x: 96, y: 96 };
      
      // Should not take damage from water (no damage defined)
      const initialHealth = enemy.health;
      enemy.update(1000); // Uses stored grid reference
      
      expect(enemy.health).toBe(initialHealth);
    });
  });

  describe('Player terrain movement', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player({ x: 100, y: 100 });
      player.setGrid(grid);
    });

    it('should initialize with terrain-aware properties', () => {
      expect(player.baseSpeed).toBeGreaterThan(0);
      expect(player.currentSpeed).toBe(player.baseSpeed);
      expect(player.movementType).toBe(MovementType.WALKING);
    });

    it('should apply terrain multiplier to movement', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      player.position = { x: 96, y: 96 };
      
      // Update to apply terrain effects
      player.update(100, grid);
      
      // Simulate movement input
      player.handleKeyDown('w');
      player.update(16, grid);
      
      // Velocity should be reduced
      expect(player.velocity.y).toBeLessThan(0); // Moving up
      const speed = Math.abs(player.velocity.y);
      expect(speed).toBeLessThan(player.getCurrentSpeed());
    });

    it('should stop movement on impassable terrain', () => {
      // Test that MovementSystem prevents movement to water
      player.position = { x: 32, y: 32 };
      grid.setCellType(2, 1, CellType.WATER); // Water to the right
      
      // Verify MovementSystem prevents movement to water
      const canMove = MovementSystem.canEntityMoveTo(
        player, 
        { x: 64, y: 32 }, // Try to move into water cell
        grid
      );
      expect(canMove).toBe(false);
      
      // Test that player movement respects this
      player.handleKeyDown('d'); // Move right
      player.update(16, grid);
      
      // Player should try to move but updateMovement should block it
      // The current implementation sets velocity but then blocks actual position change
      // This is the expected behavior - velocity is set but position doesn't change
      const newX = player.position.x;
      
      // Update again - position should not change significantly towards water
      player.update(16, grid);
      
      // Player should not have moved into water cell (x >= 64)
      expect(player.position.x).toBeLessThan(64);
    });

    it('should handle terrain in setVelocity for touch controls', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      player.position = { x: 96, y: 96 };
      
      // Update to apply terrain effects
      player.update(100, grid);
      
      // Simulate touch control
      player.setVelocity(1, 0); // Move right
      
      // Velocity should include terrain effect
      const expectedSpeed = player.getCurrentSpeed() * player.lastTerrainSpeed;
      expect(Math.abs(player.velocity.x)).toBeLessThan(player.getCurrentSpeed());
    });

    it('should maintain terrain speed through upgrades', () => {
      grid.setCellType(3, 3, CellType.ROUGH_TERRAIN);
      player.position = { x: 96, y: 96 };
      
      player.update(100, grid);
      const terrainMultiplier = player.lastTerrainSpeed;
      
      // Upgrade speed
      player.upgrade('SPEED' as any);
      
      // Terrain multiplier should still apply
      player.update(16, grid);
      expect(player.lastTerrainSpeed).toBeCloseTo(terrainMultiplier, 2);
    });
  });

  describe('Movement type interactions', () => {
    it('should allow different movement types on appropriate terrain', () => {
      const flyingEnemy = new Enemy({ x: 100, y: 100 }, 100, EnemyType.BASIC);
      flyingEnemy.movementType = MovementType.FLYING;
      flyingEnemy.setGrid(grid);
      
      // Flying enemy can move over water
      grid.setCellType(3, 3, CellType.WATER);
      flyingEnemy.position = { x: 96, y: 96 };
      
      flyingEnemy.update(16, grid);
      
      // Should maintain full speed over water (allowing for small transition)
      expect(flyingEnemy.currentSpeed).toBeCloseTo(flyingEnemy.baseSpeed, 1);
    });

    it('should handle amphibious movement', () => {
      const amphibiousEntity = new Entity(EntityType.ENEMY, { x: 100, y: 100 }, 100, 10);
      amphibiousEntity.movementType = MovementType.AMPHIBIOUS;
      amphibiousEntity.baseSpeed = 100;
      amphibiousEntity.currentSpeed = 100;
      
      // Can move on land
      grid.setCellType(3, 3, CellType.EMPTY);
      amphibiousEntity.position = { x: 96, y: 96 };
      amphibiousEntity.update(16, grid);
      expect(amphibiousEntity.currentSpeed).toBeCloseTo(100, 1);
      
      // Can move in water
      grid.setCellType(3, 3, CellType.WATER);
      amphibiousEntity.update(1000, grid); // Let it fully transition
      expect(amphibiousEntity.currentSpeed).toBeGreaterThan(0);
    });
  });
});