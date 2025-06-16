/**
 * Unit tests for Vector2Utils
 * Tests pure mathematical vector operations
 */

import { describe, it, expect } from 'vitest';
import { Vector2Utils } from '@/utils/Vector2';
import { assertVector2Equal, assertApproximatelyEqual } from '../helpers/testUtils';
import { createMockVector2 } from '../helpers/mockData';

describe('Vector2Utils', () => {
  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const a = createMockVector2(0, 0);
      const b = createMockVector2(3, 4);
      expect(Vector2Utils.distance(a, b)).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for same points', () => {
      const point = createMockVector2(5, 5);
      expect(Vector2Utils.distance(point, point)).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const a = createMockVector2(-3, -4);
      const b = createMockVector2(0, 0);
      expect(Vector2Utils.distance(a, b)).toBe(5);
    });

    it('should be commutative', () => {
      const a = createMockVector2(1, 2);
      const b = createMockVector2(4, 6);
      expect(Vector2Utils.distance(a, b)).toBe(Vector2Utils.distance(b, a));
    });

    it('should handle large numbers', () => {
      const a = createMockVector2(0, 0);
      const b = createMockVector2(1000000, 0);
      expect(Vector2Utils.distance(a, b)).toBe(1000000);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const v = createMockVector2(3, 4);
      const normalized = Vector2Utils.normalize(v);
      
      assertApproximatelyEqual(normalized.x, 0.6);
      assertApproximatelyEqual(normalized.y, 0.8);
      assertApproximatelyEqual(Vector2Utils.length(normalized), 1);
    });

    it('should return zero vector for zero input', () => {
      const v = createMockVector2(0, 0);
      const normalized = Vector2Utils.normalize(v);
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('should handle negative values', () => {
      const v = createMockVector2(-3, -4);
      const normalized = Vector2Utils.normalize(v);
      
      assertApproximatelyEqual(normalized.x, -0.6);
      assertApproximatelyEqual(normalized.y, -0.8);
      assertApproximatelyEqual(Vector2Utils.length(normalized), 1);
    });

    it('should preserve direction', () => {
      const v = createMockVector2(10, 5);
      const normalized = Vector2Utils.normalize(v);
      
      // Check that the ratio is preserved
      assertApproximatelyEqual(v.x / v.y, normalized.x / normalized.y);
    });
  });

  describe('multiply', () => {
    it('should multiply vector by scalar', () => {
      const v = createMockVector2(3, 4);
      const result = Vector2Utils.multiply(v, 2);
      
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('should handle multiplication by zero', () => {
      const v = createMockVector2(5, 7);
      const result = Vector2Utils.multiply(v, 0);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle negative scalars', () => {
      const v = createMockVector2(3, 4);
      const result = Vector2Utils.multiply(v, -2);
      
      expect(result.x).toBe(-6);
      expect(result.y).toBe(-8);
    });

    it('should handle fractional scalars', () => {
      const v = createMockVector2(10, 20);
      const result = Vector2Utils.multiply(v, 0.5);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a = createMockVector2(3, 4);
      const b = createMockVector2(1, 2);
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should handle negative values', () => {
      const a = createMockVector2(5, 3);
      const b = createMockVector2(-2, -7);
      const result = Vector2Utils.add(a, b);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(-4);
    });

    it('should be commutative', () => {
      const a = createMockVector2(1, 2);
      const b = createMockVector2(3, 4);
      
      const result1 = Vector2Utils.add(a, b);
      const result2 = Vector2Utils.add(b, a);
      
      expect(result1).toEqual(result2);
    });

    it('should handle zero vectors', () => {
      const v = createMockVector2(5, 7);
      const zero = createMockVector2(0, 0);
      const result = Vector2Utils.add(v, zero);
      
      expect(result).toEqual(v);
    });
  });

  describe('subtract', () => {
    it('should subtract two vectors', () => {
      const a = createMockVector2(5, 7);
      const b = createMockVector2(2, 3);
      const result = Vector2Utils.subtract(a, b);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should handle negative values', () => {
      const a = createMockVector2(3, 4);
      const b = createMockVector2(-2, -3);
      const result = Vector2Utils.subtract(a, b);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
    });

    it('should not be commutative', () => {
      const a = createMockVector2(5, 7);
      const b = createMockVector2(2, 3);
      
      const result1 = Vector2Utils.subtract(a, b);
      const result2 = Vector2Utils.subtract(b, a);
      
      expect(result1.x).toBe(-result2.x);
      expect(result1.y).toBe(-result2.y);
    });

    it('should return zero when subtracting same vectors', () => {
      const v = createMockVector2(5, 7);
      const result = Vector2Utils.subtract(v, v);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('length', () => {
    it('should calculate vector length', () => {
      const v = createMockVector2(3, 4);
      expect(Vector2Utils.length(v)).toBe(5);
    });

    it('should return 0 for zero vector', () => {
      const v = createMockVector2(0, 0);
      expect(Vector2Utils.length(v)).toBe(0);
    });

    it('should handle negative values', () => {
      const v = createMockVector2(-3, -4);
      expect(Vector2Utils.length(v)).toBe(5);
    });

    it('should handle single axis vectors', () => {
      expect(Vector2Utils.length(createMockVector2(5, 0))).toBe(5);
      expect(Vector2Utils.length(createMockVector2(0, 5))).toBe(5);
    });

    it('should handle very small values', () => {
      const v = createMockVector2(0.001, 0.001);
      assertApproximatelyEqual(Vector2Utils.length(v), Math.sqrt(0.000002));
    });
  });

  describe('edge cases and combined operations', () => {
    it('should handle vector chain operations', () => {
      const v1 = createMockVector2(1, 2);
      const v2 = createMockVector2(3, 4);
      const v3 = createMockVector2(5, 6);
      
      // (v1 + v2) - v3
      const temp = Vector2Utils.add(v1, v2);
      const result = Vector2Utils.subtract(temp, v3);
      
      expect(result.x).toBe(-1);
      expect(result.y).toBe(0);
    });

    it('should maintain precision with normalized vectors', () => {
      const v = createMockVector2(7, 11);
      const normalized = Vector2Utils.normalize(v);
      const scaled = Vector2Utils.multiply(normalized, Vector2Utils.length(v));
      
      assertVector2Equal(scaled, v, 6); // Allow for floating point precision
    });

    it('should handle infinity values gracefully', () => {
      const v = createMockVector2(Infinity, 0);
      expect(Vector2Utils.length(v)).toBe(Infinity);
      
      const normalized = Vector2Utils.normalize(v);
      // Infinity / Infinity = NaN
      expect(normalized.x).toBeNaN();
      // 0 / Infinity = 0
      expect(normalized.y).toBe(0);
    });
  });
});