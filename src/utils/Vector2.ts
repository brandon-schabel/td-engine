export type Vector2 = {
  x: number;
  y: number;
};

export class Vector2Utils {
  static distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(v: Vector2): Vector2 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y);
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: v.x / length,
      y: v.y / length
    };
  }

  static multiply(v: Vector2, scalar: number): Vector2 {
    return {
      x: v.x * scalar,
      y: v.y * scalar
    };
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }

  static length(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }
}