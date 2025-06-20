/**
 * Player Movement System
 * Extracted from Player.ts to handle movement-specific logic
 */

import type { Vector2 } from '@/utils/Vector2';

export class PlayerMovement {
  public velocity: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  private baseSpeed: number;
  private speedMultiplier: number = 1.0;

  constructor(baseSpeed: number) {
    this.baseSpeed = baseSpeed;
  }

  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  update(_deltaTime: number): Vector2 {
    let movementX = 0;
    let movementY = 0;
    
    // Calculate movement based on pressed keys
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      movementY -= 1;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      movementY += 1;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      movementX -= 1;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      movementX += 1;
    }
    
    // Normalize diagonal movement
    const magnitude = Math.sqrt(movementX * movementX + movementY * movementY);
    if (magnitude > 0) {
      this.velocity.x = (movementX / magnitude) * this.speed;
      this.velocity.y = (movementY / magnitude) * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
    
    return { ...this.velocity };
  }

  applyMovement(position: Vector2, deltaTime: number): Vector2 {
    const deltaSeconds = deltaTime / 1000;
    return {
      x: position.x + this.velocity.x * deltaSeconds,
      y: position.y + this.velocity.y * deltaSeconds
    };
  }

  constrainToBounds(position: Vector2, bounds: { width: number; height: number }, radius: number): Vector2 {
    return {
      x: Math.max(radius, Math.min(bounds.width - radius, position.x)),
      y: Math.max(radius, Math.min(bounds.height - radius, position.y))
    };
  }

  get speed(): number {
    return this.baseSpeed * this.speedMultiplier;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  getVelocity(): Vector2 {
    return { ...this.velocity };
  }

  isMoving(): boolean {
    return this.velocity.x !== 0 || this.velocity.y !== 0;
  }

  getMovementDirection(): Vector2 {
    const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (magnitude === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: this.velocity.x / magnitude,
      y: this.velocity.y / magnitude
    };
  }

  getSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }

  stop(): void {
    this.velocity = { x: 0, y: 0 };
  }

  // Debug information
  getDebugInfo(): {
    velocity: Vector2;
    speed: number;
    pressedKeys: string[];
    isMoving: boolean;
  } {
    return {
      velocity: this.getVelocity(),
      speed: this.getSpeed(),
      pressedKeys: Array.from(this.keys),
      isMoving: this.isMoving()
    };
  }
}