import { describe, it, expect, beforeEach } from 'vitest';
import { Entity, EntityType } from '../../src/entities/Entity';
import type { Vector2 } from '../../src/utils/Vector2';

describe('Entity', () => {
  describe('initialization', () => {
    it('should create an entity with default values', () => {
      const entity = new Entity(EntityType.ENEMY);
      
      expect(entity.id).toBeDefined();
      expect(entity.type).toBe(EntityType.ENEMY);
      expect(entity.position).toEqual({ x: 0, y: 0 });
      expect(entity.velocity).toEqual({ x: 0, y: 0 });
      expect(entity.health).toBe(100);
      expect(entity.maxHealth).toBe(100);
      expect(entity.isAlive).toBe(true);
      expect(entity.radius).toBe(10);
    });

    it('should create an entity with custom position', () => {
      const position = { x: 50, y: 100 };
      const entity = new Entity(EntityType.TOWER, position);
      
      expect(entity.position).toEqual(position);
    });

    it('should generate unique IDs for different entities', () => {
      const entity1 = new Entity(EntityType.ENEMY);
      const entity2 = new Entity(EntityType.ENEMY);
      
      expect(entity1.id).not.toBe(entity2.id);
    });
  });

  describe('health management', () => {
    let entity: Entity;

    beforeEach(() => {
      entity = new Entity(EntityType.ENEMY);
    });

    it('should take damage correctly', () => {
      entity.takeDamage(30);
      
      expect(entity.health).toBe(70);
      expect(entity.isAlive).toBe(true);
    });

    it('should die when health reaches zero', () => {
      entity.takeDamage(100);
      
      expect(entity.health).toBe(0);
      expect(entity.isAlive).toBe(false);
    });

    it('should not have negative health', () => {
      entity.takeDamage(150);
      
      expect(entity.health).toBe(0);
      expect(entity.isAlive).toBe(false);
    });

    it('should heal correctly', () => {
      entity.takeDamage(50);
      entity.heal(30);
      
      expect(entity.health).toBe(80);
    });

    it('should not heal above max health', () => {
      entity.takeDamage(30);
      entity.heal(50);
      
      expect(entity.health).toBe(entity.maxHealth);
    });
  });

  describe('movement', () => {
    let entity: Entity;

    beforeEach(() => {
      entity = new Entity(EntityType.ENEMY, { x: 100, y: 100 });
    });

    it('should update position based on velocity', () => {
      entity.velocity = { x: 10, y: 5 };
      entity.update(100); // 100ms = 0.1s
      
      expect(entity.position.x).toBeCloseTo(101); // 100 + (10 * 0.1)
      expect(entity.position.y).toBeCloseTo(100.5); // 100 + (5 * 0.1)
    });

    it('should move to a target position', () => {
      const target = { x: 200, y: 100 };
      entity.moveTo(target, 50); // Move at 50 units/second
      
      // Velocity should point towards target
      expect(entity.velocity.x).toBeGreaterThan(0);
      expect(entity.velocity.y).toBe(0);
      
      // Speed should be 50
      const speed = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
      expect(speed).toBeCloseTo(50);
    });

    it('should stop when reaching target', () => {
      const target = { x: 105, y: 100 };
      entity.moveTo(target, 50);
      
      // Move multiple small steps
      for (let i = 0; i < 10; i++) {
        entity.update(20); // 20ms steps
        entity.moveTo(target, 50); // Recalculate velocity each frame
      }
      
      // Should be close to target
      const distance = entity.distanceTo(target);
      expect(distance).toBeLessThan(1);
      
      // When close enough, velocity should be zero
      entity.moveTo(target, 50);
      expect(entity.velocity.x).toBeCloseTo(0);
      expect(entity.velocity.y).toBeCloseTo(0);
    });
  });

  describe('distance calculations', () => {
    it('should calculate distance to another entity', () => {
      const entity1 = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
      const entity2 = new Entity(EntityType.ENEMY, { x: 3, y: 4 });
      
      expect(entity1.distanceTo(entity2)).toBe(5); // 3-4-5 triangle
    });

    it('should calculate distance to a point', () => {
      const entity = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
      const point = { x: 3, y: 4 };
      
      expect(entity.distanceTo(point)).toBe(5);
    });

    it('should check if within range', () => {
      const entity1 = new Entity(EntityType.TOWER, { x: 0, y: 0 });
      const entity2 = new Entity(EntityType.ENEMY, { x: 50, y: 0 });
      
      expect(entity1.isInRange(entity2, 100)).toBe(true);
      expect(entity1.isInRange(entity2, 30)).toBe(false);
    });
  });

  describe('collision detection', () => {
    it('should detect collision between entities', () => {
      const entity1 = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
      const entity2 = new Entity(EntityType.ENEMY, { x: 15, y: 0 });
      
      // Default radius is 10, so they should collide when centers are 20 units apart
      expect(entity1.collidesWith(entity2)).toBe(true);
      
      entity2.position.x = 25;
      expect(entity1.collidesWith(entity2)).toBe(false);
    });
  });
});