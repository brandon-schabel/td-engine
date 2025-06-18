import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import type { Vector2 } from '@/utils/Vector2';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';
import { PROJECTILE_RENDER } from '@/config/RenderingConfig';

export class Projectile extends Entity {
  public readonly damage: number;
  public target: Enemy | null;
  private speed: number;
  private initialVelocity?: Vector2;
  private lifetime: number = GAMEPLAY_CONSTANTS.projectiles.lifetime;
  private age: number = 0;
  public hitSoundPlayed: boolean = false;

  constructor(
    position: Vector2,
    target: Enemy | null,
    damage: number,
    speed: number = GAMEPLAY_CONSTANTS.projectiles.defaultSpeed,
    velocity?: Vector2
  ) {
    super(EntityType.PROJECTILE, position, 1, PROJECTILE_RENDER.basic.radius);
    
    this.damage = damage;
    this.target = target;
    this.speed = speed;
    
    if (velocity) {
      this.velocity = { ...velocity };
      this.initialVelocity = { ...velocity };
    }
  }

  override update(deltaTime: number): void {
    if (!this.isAlive) {
      return;
    }

    // Update age and check lifetime
    this.age += deltaTime;
    if (this.age >= this.lifetime) {
      this.isAlive = false;
      return;
    }

    if (this.target && this.target.isAlive) {
      // Homing projectile - move towards target
      this.moveTo(this.target.position, this.speed);
      
      // Check for collision with target
      if (this.collidesWith(this.target)) {
        this.target.takeDamage(this.damage);
        this.isAlive = false;
      }
    } else if (this.initialVelocity) {
      // Non-homing projectile - maintain constant velocity
      // Velocity is already set, just let parent update position
    } else {
      // No target and no velocity - destroy
      this.isAlive = false;
      return;
    }

    super.update(deltaTime);
  }

  hasHitTarget(): boolean {
    return !this.isAlive && !!this.target && !this.target.isAlive;
  }

  checkCollisionWithEnemies(enemies: Enemy[]): Enemy | null {
    if (!this.isAlive) return null;
    
    for (const enemy of enemies) {
      if (enemy.isAlive && this.collidesWith(enemy)) {
        enemy.takeDamage(this.damage);
        this.isAlive = false;
        return enemy;
      }
    }
    
    return null;
  }
}