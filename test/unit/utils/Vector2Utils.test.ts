import { describe, test, expect } from 'vitest';
import { Vector2Utils } from '@/utils/Vector2';
import { assertVector2Equal } from '../../helpers/assertions';

describe('Vector2Utils', () => {
  describe('distance', () => {
    test('calculates distance between two points', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(Vector2Utils.distance(a, b)).toBe(5);
    });

    test('returns 0 for same points', () => {
      const a = { x: 5, y: 10 };
      const b = { x: 5, y: 10 };
      expect(Vector2Utils.distance(a, b)).toBe(0);
    });

    test('handles negative coordinates', () => {
      const a = { x: -3, y: -4 };
      const b = { x: 0, y: 0 };
      expect(Vector2Utils.distance(a, b)).toBe(5);
    });

    test('is commutative', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(Vector2Utils.distance(a, b)).toBe(Vector2Utils.distance(b, a));
    });
  });

  describe('normalize', () => {
    test('normalizes a vector to unit length', () => {
      const v = { x: 3, y: 4 };
      const normalized = Vector2Utils.normalize(v);
      assertVector2Equal(normalized, { x: 0.6, y: 0.8 });
      expect(Vector2Utils.length(normalized)).toBeCloseTo(1);
    });

    test('returns zero vector for zero input', () => {
      const v = { x: 0, y: 0 };
      const normalized = Vector2Utils.normalize(v);
      assertVector2Equal(normalized, { x: 0, y: 0 });
    });

    test('handles negative components', () => {
      const v = { x: -3, y: -4 };
      const normalized = Vector2Utils.normalize(v);
      assertVector2Equal(normalized, { x: -0.6, y: -0.8 });
      expect(Vector2Utils.length(normalized)).toBeCloseTo(1);
    });

    test('preserves direction', () => {
      const v = { x: 10, y: 5 };
      const normalized = Vector2Utils.normalize(v);
      const ratio = v.y / v.x;
      const normalizedRatio = normalized.y / normalized.x;
      expect(normalizedRatio).toBeCloseTo(ratio);
    });
  });

  describe('multiply', () => {
    test('multiplies vector by scalar', () => {
      const v = { x: 2, y: 3 };
      const result = Vector2Utils.multiply(v, 3);
      assertVector2Equal(result, { x: 6, y: 9 });
    });

    test('multiplies by zero returns zero vector', () => {
      const v = { x: 5, y: 10 };
      const result = Vector2Utils.multiply(v, 0);
      assertVector2Equal(result, { x: 0, y: 0 });
    });

    test('multiplies by negative scalar', () => {
      const v = { x: 3, y: 4 };
      const result = Vector2Utils.multiply(v, -2);
      assertVector2Equal(result, { x: -6, y: -8 });
    });

    test('multiplies by one returns same vector', () => {
      const v = { x: 7, y: 11 };
      const result = Vector2Utils.multiply(v, 1);
      assertVector2Equal(result, v);
    });
  });

  describe('add', () => {
    test('adds two vectors', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result = Vector2Utils.add(a, b);
      assertVector2Equal(result, { x: 4, y: 6 });
    });

    test('adding zero vector returns original', () => {
      const a = { x: 5, y: 7 };
      const zero = { x: 0, y: 0 };
      const result = Vector2Utils.add(a, zero);
      assertVector2Equal(result, a);
    });

    test('handles negative components', () => {
      const a = { x: 5, y: 3 };
      const b = { x: -2, y: -7 };
      const result = Vector2Utils.add(a, b);
      assertVector2Equal(result, { x: 3, y: -4 });
    });

    test('is commutative', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result1 = Vector2Utils.add(a, b);
      const result2 = Vector2Utils.add(b, a);
      assertVector2Equal(result1, result2);
    });
  });

  describe('subtract', () => {
    test('subtracts two vectors', () => {
      const a = { x: 5, y: 7 };
      const b = { x: 2, y: 3 };
      const result = Vector2Utils.subtract(a, b);
      assertVector2Equal(result, { x: 3, y: 4 });
    });

    test('subtracting zero vector returns original', () => {
      const a = { x: 5, y: 7 };
      const zero = { x: 0, y: 0 };
      const result = Vector2Utils.subtract(a, zero);
      assertVector2Equal(result, a);
    });

    test('subtracting vector from itself returns zero', () => {
      const a = { x: 5, y: 7 };
      const result = Vector2Utils.subtract(a, a);
      assertVector2Equal(result, { x: 0, y: 0 });
    });

    test('handles negative components', () => {
      const a = { x: 2, y: 3 };
      const b = { x: 5, y: 7 };
      const result = Vector2Utils.subtract(a, b);
      assertVector2Equal(result, { x: -3, y: -4 });
    });

    test('is not commutative', () => {
      const a = { x: 5, y: 7 };
      const b = { x: 2, y: 3 };
      const result1 = Vector2Utils.subtract(a, b);
      const result2 = Vector2Utils.subtract(b, a);
      assertVector2Equal(result1, { x: 3, y: 4 });
      assertVector2Equal(result2, { x: -3, y: -4 });
    });
  });

  describe('length', () => {
    test('calculates vector length', () => {
      const v = { x: 3, y: 4 };
      expect(Vector2Utils.length(v)).toBe(5);
    });

    test('returns 0 for zero vector', () => {
      const v = { x: 0, y: 0 };
      expect(Vector2Utils.length(v)).toBe(0);
    });

    test('handles negative components', () => {
      const v = { x: -3, y: -4 };
      expect(Vector2Utils.length(v)).toBe(5);
    });

    test('handles single axis vectors', () => {
      expect(Vector2Utils.length({ x: 5, y: 0 })).toBe(5);
      expect(Vector2Utils.length({ x: 0, y: 7 })).toBe(7);
    });
  });

  describe('integration tests', () => {
    test('normalize and multiply to scale vector to specific length', () => {
      const v = { x: 3, y: 4 };
      const targetLength = 10;
      const normalized = Vector2Utils.normalize(v);
      const scaled = Vector2Utils.multiply(normalized, targetLength);
      expect(Vector2Utils.length(scaled)).toBeCloseTo(targetLength);
    });

    test('vector operations maintain mathematical properties', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const c = { x: 5, y: 6 };
      
      // Associativity of addition: (a + b) + c = a + (b + c)
      const left = Vector2Utils.add(Vector2Utils.add(a, b), c);
      const right = Vector2Utils.add(a, Vector2Utils.add(b, c));
      assertVector2Equal(left, right);
      
      // Distributivity: k * (a + b) = k * a + k * b
      const k = 2;
      const dist1 = Vector2Utils.multiply(Vector2Utils.add(a, b), k);
      const dist2 = Vector2Utils.add(
        Vector2Utils.multiply(a, k),
        Vector2Utils.multiply(b, k)
      );
      assertVector2Equal(dist1, dist2);
    });
  });
});