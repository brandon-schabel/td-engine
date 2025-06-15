import { describe, it, expect } from 'vitest';
import { Vector2 } from '@/utils/vector2';
import { describePerformance, when, then } from '../helpers/templates';
import { assertPerformance } from '../helpers/assertions';

describe('Vector2', () => {
  describe('creation', () => {
    it('creates from coordinates', () => {
      const v = new Vector2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
    
    it('creates with default values', () => {
      const v = new Vector2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
    
    it('creates from object', () => {
      const v = Vector2.fromObject({ x: 5, y: 12 });
      expect(v.x).toBe(5);
      expect(v.y).toBe(12);
    });
  });
  
  describe('operations', () => {
    it(when('adding vectors'), () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      const result = v1.add(v2);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });
    
    it(then('original vectors are unchanged'), () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      v1.add(v2);
      
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
    });
    
    it('subtracts vectors', () => {
      const v1 = new Vector2(5, 7);
      const v2 = new Vector2(2, 3);
      const result = v1.subtract(v2);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
    
    it('multiplies by scalar', () => {
      const v = new Vector2(3, 4);
      const result = v.multiply(2);
      
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });
    
    it('divides by scalar', () => {
      const v = new Vector2(6, 8);
      const result = v.divide(2);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
    
    it('handles division by zero', () => {
      const v = new Vector2(6, 8);
      expect(() => v.divide(0)).toThrow();
    });
  });
  
  describe('magnitude and normalization', () => {
    it('calculates magnitude', () => {
      const v = new Vector2(3, 4);
      expect(v.magnitude()).toBe(5);
    });
    
    it('calculates squared magnitude', () => {
      const v = new Vector2(3, 4);
      expect(v.magnitudeSquared()).toBe(25);
    });
    
    it('normalizes vector', () => {
      const v = new Vector2(3, 4);
      const normalized = v.normalize();
      
      expect(normalized.magnitude()).toBeCloseTo(1, 5);
      expect(normalized.x).toBeCloseTo(0.6, 5);
      expect(normalized.y).toBeCloseTo(0.8, 5);
    });
    
    it('handles zero vector normalization', () => {
      const v = new Vector2(0, 0);
      const normalized = v.normalize();
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });
  });
  
  describe('distance calculations', () => {
    it('calculates distance between vectors', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      
      expect(v1.distanceTo(v2)).toBe(5);
    });
    
    it('calculates squared distance', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      
      expect(v1.distanceSquaredTo(v2)).toBe(25);
    });
    
    it('distance is symmetric', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(4, 6);
      
      expect(v1.distanceTo(v2)).toBe(v2.distanceTo(v1));
    });
  });
  
  describe('dot and cross products', () => {
    it('calculates dot product', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(2, 1);
      
      expect(v1.dot(v2)).toBe(10); // 3*2 + 4*1
    });
    
    it('dot product is commutative', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(2, 1);
      
      expect(v1.dot(v2)).toBe(v2.dot(v1));
    });
    
    it('calculates cross product (2D)', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(2, 1);
      
      expect(v1.cross(v2)).toBe(-5); // 3*1 - 4*2
    });
  });
  
  describe('angle calculations', () => {
    it('calculates angle to another vector', () => {
      const v1 = new Vector2(1, 0);
      const v2 = new Vector2(0, 1);
      
      const angle = v1.angleTo(v2);
      expect(angle).toBeCloseTo(Math.PI / 2, 5);
    });
    
    it('calculates angle from x-axis', () => {
      const v = new Vector2(1, 1);
      const angle = v.angle();
      
      expect(angle).toBeCloseTo(Math.PI / 4, 5);
    });
    
    it('rotates vector', () => {
      const v = new Vector2(1, 0);
      const rotated = v.rotate(Math.PI / 2);
      
      expect(rotated.x).toBeCloseTo(0, 5);
      expect(rotated.y).toBeCloseTo(1, 5);
    });
  });
  
  describe('utility methods', () => {
    it('clones vector', () => {
      const v = new Vector2(3, 4);
      const clone = v.clone();
      
      expect(clone).not.toBe(v);
      expect(clone.x).toBe(3);
      expect(clone.y).toBe(4);
    });
    
    it('checks equality', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(3, 4);
      const v3 = new Vector2(3, 5);
      
      expect(v1.equals(v2)).toBe(true);
      expect(v1.equals(v3)).toBe(false);
    });
    
    it('converts to array', () => {
      const v = new Vector2(3, 4);
      const arr = v.toArray();
      
      expect(arr).toEqual([3, 4]);
    });
    
    it('converts to object', () => {
      const v = new Vector2(3, 4);
      const obj = v.toObject();
      
      expect(obj).toEqual({ x: 3, y: 4 });
    });
  });
  
  describe('edge cases', () => {
    it('handles negative values', () => {
      const v = new Vector2(-3, -4);
      expect(v.magnitude()).toBe(5);
    });
    
    it('handles very large values', () => {
      const v = new Vector2(1e10, 1e10);
      const normalized = v.normalize();
      
      expect(normalized.magnitude()).toBeCloseTo(1, 5);
    });
    
    it('handles very small values', () => {
      const v = new Vector2(1e-10, 1e-10);
      const normalized = v.normalize();
      
      expect(normalized.magnitude()).toBeCloseTo(1, 5);
    });
  });
  
  describe('static methods', () => {
    it('creates zero vector', () => {
      const v = Vector2.zero();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
    
    it('creates unit vectors', () => {
      const right = Vector2.right();
      expect(right.x).toBe(1);
      expect(right.y).toBe(0);
      
      const up = Vector2.up();
      expect(up.x).toBe(0);
      expect(up.y).toBe(1);
    });
    
    it('lerps between vectors', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      
      const mid = Vector2.lerp(v1, v2, 0.5);
      expect(mid.x).toBe(5);
      expect(mid.y).toBe(5);
      
      const quarter = Vector2.lerp(v1, v2, 0.25);
      expect(quarter.x).toBe(2.5);
      expect(quarter.y).toBe(2.5);
    });
    
    it('clamps lerp parameter', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      
      const clamped = Vector2.lerp(v1, v2, 1.5);
      expect(clamped.x).toBe(10);
      expect(clamped.y).toBe(10);
    });
  });
});

describePerformance('Vector2', [
  {
    name: 'vector addition',
    fn: () => {
      const v1 = new Vector2(Math.random(), Math.random());
      const v2 = new Vector2(Math.random(), Math.random());
      v1.add(v2);
    },
    maxDuration: 0.01,
    iterations: 10000
  },
  {
    name: 'magnitude calculation',
    fn: () => {
      const v = new Vector2(Math.random() * 100, Math.random() * 100);
      v.magnitude();
    },
    maxDuration: 0.01,
    iterations: 10000
  },
  {
    name: 'normalization',
    fn: () => {
      const v = new Vector2(Math.random() * 100, Math.random() * 100);
      v.normalize();
    },
    maxDuration: 0.02,
    iterations: 10000
  },
  {
    name: 'distance calculation',
    fn: () => {
      const v1 = new Vector2(Math.random() * 100, Math.random() * 100);
      const v2 = new Vector2(Math.random() * 100, Math.random() * 100);
      v1.distanceTo(v2);
    },
    maxDuration: 0.02,
    iterations: 10000
  },
  {
    name: 'rotation',
    fn: () => {
      const v = new Vector2(Math.random() * 100, Math.random() * 100);
      v.rotate(Math.random() * Math.PI * 2);
    },
    maxDuration: 0.03,
    iterations: 10000
  }
]);