import { describe, it, expect } from 'vitest';
import type { Vector2 } from '@/utils/Vector2';
import { Vector2Utils } from '@/utils/Vector2';

describe('Vector2Utils', () => {
  describe('distance', () => {
    it('calculates distance between two points', () => {
      const a: Vector2 = { x: 0, y: 0 };
      const b: Vector2 = { x: 3, y: 4 };
      expect(Vector2Utils.distance(a, b)).toBe(5);
    });

    it('calculates distance with negative coordinates', () => {
      const a: Vector2 = { x: -1, y: -1 };
      const b: Vector2 = { x: 2, y: 3 };
      expect(Vector2Utils.distance(a, b)).toBe(5);
    });

    it('returns 0 for same points', () => {
      const a: Vector2 = { x: 5, y: 5 };
      const b: Vector2 = { x: 5, y: 5 };
      expect(Vector2Utils.distance(a, b)).toBe(0);
    });

    it('distance is symmetric', () => {
      const a: Vector2 = { x: 1, y: 2 };
      const b: Vector2 = { x: 4, y: 6 };
      expect(Vector2Utils.distance(a, b)).toBe(Vector2Utils.distance(b, a));
    });
  });

  describe('normalize', () => {
    it('normalizes a vector', () => {
      const v: Vector2 = { x: 3, y: 4 };
      const normalized = Vector2Utils.normalize(v);
      
      expect(normalized.x).toBeCloseTo(0.6, 5);
      expect(normalized.y).toBeCloseTo(0.8, 5);
      
      const length = Math.sqrt(normalized.x * normalized.x + normalized.y * normalized.y);
      expect(length).toBeCloseTo(1, 5);
    });

    it('handles zero vector', () => {
      const v: Vector2 = { x: 0, y: 0 };
      const normalized = Vector2Utils.normalize(v);
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('normalizes negative vectors', () => {
      const v: Vector2 = { x: -3, y: -4 };
      const normalized = Vector2Utils.normalize(v);
      
      expect(normalized.x).toBeCloseTo(-0.6, 5);
      expect(normalized.y).toBeCloseTo(-0.8, 5);
      
      const length = Math.sqrt(normalized.x * normalized.x + normalized.y * normalized.y);
      expect(length).toBeCloseTo(1, 5);
    });
  });

  describe('multiply', () => {
    it('multiplies vector by positive scalar', () => {
      const v: Vector2 = { x: 3, y: 4 };
      const result = Vector2Utils.multiply(v, 2);
      
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('multiplies vector by negative scalar', () => {
      const v: Vector2 = { x: 3, y: 4 };
      const result = Vector2Utils.multiply(v, -2);
      
      expect(result.x).toBe(-6);
      expect(result.y).toBe(-8);
    });

    it('multiplies vector by zero', () => {
      const v: Vector2 = { x: 3, y: 4 };
      const result = Vector2Utils.multiply(v, 0);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('multiplies by fractional scalar', () => {
      const v: Vector2 = { x: 10, y: 20 };
      const result = Vector2Utils.multiply(v, 0.5);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const a: Vector2 = { x: 1, y: 2 };
      const b: Vector2 = { x: 3, y: 4 };
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('adds with negative values', () => {
      const a: Vector2 = { x: 5, y: 3 };
      const b: Vector2 = { x: -2, y: -1 };
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(2);
    });

    it('adds zero vector', () => {
      const a: Vector2 = { x: 5, y: 7 };
      const b: Vector2 = { x: 0, y: 0 };
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
    });

    it('addition is commutative', () => {
      const a: Vector2 = { x: 1, y: 2 };
      const b: Vector2 = { x: 3, y: 4 };
      
      const result1 = Vector2Utils.add(a, b);
      const result2 = Vector2Utils.add(b, a);
      
      expect(result1.x).toBe(result2.x);
      expect(result1.y).toBe(result2.y);
    });
  });

  describe('subtract', () => {
    it('subtracts two vectors', () => {
      const a: Vector2 = { x: 5, y: 7 };
      const b: Vector2 = { x: 2, y: 3 };
      const result = Vector2Utils.subtract(a, b);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('subtracts with negative values', () => {
      const a: Vector2 = { x: 3, y: 2 };
      const b: Vector2 = { x: -2, y: -3 };
      const result = Vector2Utils.subtract(a, b);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    it('subtracts zero vector', () => {
      const a: Vector2 = { x: 5, y: 7 };
      const b: Vector2 = { x: 0, y: 0 };
      const result = Vector2Utils.subtract(a, b);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
    });

    it('subtracting same vectors gives zero', () => {
      const a: Vector2 = { x: 5, y: 7 };
      const result = Vector2Utils.subtract(a, a);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('length', () => {
    it('calculates length of vector', () => {
      const v: Vector2 = { x: 3, y: 4 };
      expect(Vector2Utils.length(v)).toBe(5);
    });

    it('calculates length with negative values', () => {
      const v: Vector2 = { x: -3, y: -4 };
      expect(Vector2Utils.length(v)).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      const v: Vector2 = { x: 0, y: 0 };
      expect(Vector2Utils.length(v)).toBe(0);
    });

    it('calculates length of unit vectors', () => {
      const v1: Vector2 = { x: 1, y: 0 };
      const v2: Vector2 = { x: 0, y: 1 };
      
      expect(Vector2Utils.length(v1)).toBe(1);
      expect(Vector2Utils.length(v2)).toBe(1);
    });

    it('handles very large values', () => {
      const v: Vector2 = { x: 1e5, y: 0 };
      expect(Vector2Utils.length(v)).toBe(1e5);
    });

    it('handles very small values', () => {
      const v: Vector2 = { x: 1e-10, y: 1e-10 };
      expect(Vector2Utils.length(v)).toBeCloseTo(Math.sqrt(2) * 1e-10, 15);
    });
  });

  describe('edge cases', () => {
    it('handles operations with Infinity', () => {
      const v: Vector2 = { x: Infinity, y: 0 };
      const normalized = Vector2Utils.normalize(v);
      
      // When normalizing a vector with Infinity:
      // length = Infinity, so Infinity/Infinity = NaN, 0/Infinity = 0
      expect(normalized.x).toBeNaN();
      expect(normalized.y).toBe(0);
    });

    it('handles operations with very large numbers', () => {
      const a: Vector2 = { x: 1e10, y: 1e10 };
      const b: Vector2 = { x: -1e10, y: -1e10 };
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('immutability', () => {
    it('does not modify input vectors', () => {
      const a: Vector2 = { x: 1, y: 2 };
      const b: Vector2 = { x: 3, y: 4 };
      
      Vector2Utils.add(a, b);
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
      expect(b.x).toBe(3);
      expect(b.y).toBe(4);
      
      Vector2Utils.normalize(a);
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
      
      Vector2Utils.multiply(a, 5);
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
    });
  });
});