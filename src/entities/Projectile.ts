import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import type { Vector2 } from '../utils/Vector2';

export class Projectile extends Entity {
  public readonly damage: number;
  public target: Enemy;
  private speed: number;

  constructor(
    position: Vector2,
    target: Enemy,
    damage: number,
    speed: number = 300
  ) {
    super(EntityType.PROJECTILE, position, 1, 3); // Small radius, 1 health
    
    this.damage = damage;
    this.target = target;
    this.speed = speed;
  }

  update(deltaTime: number): void {
    if (!this.isAlive || !this.target.isAlive) {
      this.isAlive = false;
      return;
    }

    // Move towards target
    this.moveTo(this.target.position, this.speed);
    
    // Check for collision with target
    if (this.collidesWith(this.target)) {
      this.target.takeDamage(this.damage);
      this.isAlive = false;
    }

    super.update(deltaTime);
  }

  hasHitTarget(): boolean {
    return !this.isAlive && this.target && !this.target.isAlive;
  }
}