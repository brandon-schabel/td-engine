import { vec2 } from 'gl-matrix';

export type Vector2 = {
  x: number;
  y: number;
};

/**
 * Vector2Utils - Now powered by gl-matrix for optimized performance
 * Maintains the same API but uses gl-matrix under the hood
 */
export class Vector2Utils {
  // Temporary vec2 arrays to avoid allocations
  private static tempA: vec2 = vec2.create();
  private static tempB: vec2 = vec2.create();
  private static tempResult: vec2 = vec2.create();
  
  static distance(a: Vector2, b: Vector2): number {
    vec2.set(this.tempA, a.x, a.y);
    vec2.set(this.tempB, b.x, b.y);
    return vec2.distance(this.tempA, this.tempB);
  }

  static normalize(v: Vector2): Vector2 {
    vec2.set(this.tempA, v.x, v.y);
    vec2.normalize(this.tempResult, this.tempA);
    return {
      x: this.tempResult[0],
      y: this.tempResult[1]
    };
  }

  static multiply(v: Vector2, scalar: number): Vector2 {
    vec2.set(this.tempA, v.x, v.y);
    vec2.scale(this.tempResult, this.tempA, scalar);
    return {
      x: this.tempResult[0],
      y: this.tempResult[1]
    };
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    vec2.set(this.tempA, a.x, a.y);
    vec2.set(this.tempB, b.x, b.y);
    vec2.add(this.tempResult, this.tempA, this.tempB);
    return {
      x: this.tempResult[0],
      y: this.tempResult[1]
    };
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    vec2.set(this.tempA, a.x, a.y);
    vec2.set(this.tempB, b.x, b.y);
    vec2.subtract(this.tempResult, this.tempA, this.tempB);
    return {
      x: this.tempResult[0],
      y: this.tempResult[1]
    };
  }

  static length(v: Vector2): number {
    vec2.set(this.tempA, v.x, v.y);
    return vec2.length(this.tempA);
  }
  
  
}