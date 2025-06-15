import { describe, it, expect } from 'vitest';
import { Entity, EntityType } from '@/entities/Entity';
import type { Vector2 } from '@/utils/Vector2';
import { describeEntity, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { assertEntityHealth, assertEntityPosition } from '../helpers/assertions';

describeEntity('Entity',
  () => new Entity(EntityType.ENEMY),
  (getEntity, context) => {

    describe('initialization', () => {
      it('creates with default values', () => {
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

      it('accepts custom position', () => {
        const position = { x: 50, y: 100 };
        const entity = new Entity(EntityType.TOWER, position);
        
        expect(entity.position).toEqual(position);
      });

      it('generates unique IDs', () => {
        const entity1 = new Entity(EntityType.ENEMY);
        const entity2 = new Entity(EntityType.ENEMY);
        
        expect(entity1.id).not.toBe(entity2.id);
      });
    });

    describe('health management', () => {
      it(when('taking damage'), () => {
        const entity = new Entity(EntityType.ENEMY);
        entity.takeDamage(30);
        
        assertEntityHealth(entity, 70);
        expect(entity.isAlive).toBe(true);
      });

      it(then('dies when health reaches zero'), () => {
        const entity = new Entity(EntityType.ENEMY);
        entity.takeDamage(100);
        
        assertEntityHealth(entity, 0);
        expect(entity.isAlive).toBe(false);
      });

      it(then('prevents negative health'), () => {
        const entity = new Entity(EntityType.ENEMY);
        entity.takeDamage(150);
        
        assertEntityHealth(entity, 0);
        expect(entity.isAlive).toBe(false);
      });

      it(when('healing'), () => {
        const entity = new Entity(EntityType.ENEMY);
        entity.takeDamage(50);
        entity.heal(30);
        
        assertEntityHealth(entity, 80);
      });

      it(then('caps healing at max health'), () => {
        const entity = new Entity(EntityType.ENEMY);
        entity.takeDamage(30);
        entity.heal(50);
        
        assertEntityHealth(entity, entity.maxHealth);
      });
    });

    describe('movement', () => {
      const createMovingEntity = () => new Entity(EntityType.ENEMY, { x: 100, y: 100 });

      it(when('updating position with velocity'), () => {
        const entity = createMovingEntity();
        entity.velocity = { x: 10, y: 5 };
        entity.update(100); // 100ms = 0.1s
        
        assertEntityPosition(entity, { x: 101, y: 100.5 }, 0.01);
      });

      it(when('moving to target position'), () => {
        const entity = createMovingEntity();
        const target = { x: 200, y: 100 };
        entity.moveTo(target, 50); // Move at 50 units/second
        
        then('velocity points towards target');
        expect(entity.velocity.x).toBeGreaterThan(0);
        expect(entity.velocity.y).toBe(0);
        
        then('maintains correct speed');
        const speed = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
        expect(speed).toBeCloseTo(50);
      });

      it(when('reaching target'), () => {
        const entity = createMovingEntity();
        const target = { x: 105, y: 100 };
        entity.moveTo(target, 50);
        
        // Move multiple small steps
        for (let i = 0; i < 10; i++) {
          entity.update(20); // 20ms steps
          entity.moveTo(target, 50); // Recalculate velocity each frame
        }
        
        then('stops at target');
        const distance = entity.distanceTo(target);
        expect(distance).toBeLessThan(1);
        
        // When close enough, velocity should be zero
        entity.moveTo(target, 50);
        expect(entity.velocity.x).toBeCloseTo(0);
        expect(entity.velocity.y).toBeCloseTo(0);
      });
    });

    describe('distance calculations', () => {
      it(when('calculating distance to entity'), () => {
        const entity1 = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
        const entity2 = new Entity(EntityType.ENEMY, { x: 3, y: 4 });
        
        expect(entity1.distanceTo(entity2)).toBe(5); // 3-4-5 triangle
      });

      it(when('calculating distance to point'), () => {
        const entity = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
        const point = { x: 3, y: 4 };
        
        expect(entity.distanceTo(point)).toBe(5);
      });

      it(when('checking range'), () => {
        const entity1 = new Entity(EntityType.TOWER, { x: 0, y: 0 });
        const entity2 = new Entity(EntityType.ENEMY, { x: 50, y: 0 });
        
        expect(entity1.isInRange(entity2, 100)).toBe(true);
        expect(entity1.isInRange(entity2, 30)).toBe(false);
      });
    });

    describe('collision detection', () => {
      it(when('entities overlap'), () => {
        const entity1 = new Entity(EntityType.ENEMY, { x: 0, y: 0 });
        const entity2 = new Entity(EntityType.ENEMY, { x: 15, y: 0 });
        
        then('detects collision');
        // Default radius is 10, so they should collide when centers are 20 units apart
        expect(entity1.collidesWith(entity2)).toBe(true);
        
        then('no collision when separated');
        entity2.position.x = 25;
        expect(entity1.collidesWith(entity2)).toBe(false);
      });
    });
  }
);