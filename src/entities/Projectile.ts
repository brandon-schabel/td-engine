import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import type { Vector2 } from '@/utils/Vector2';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';
import { PROJECTILE_RENDER } from '@/config/RenderingConfig';

export enum ProjectileType {
  BASIC_BULLET = 'BASIC_BULLET',
  SNIPER_ROUND = 'SNIPER_ROUND',
  RAPID_PELLET = 'RAPID_PELLET',
  PLAYER_SHOT = 'PLAYER_SHOT'
}

export class Projectile extends Entity {
  public readonly damage: number;
  public target: Enemy | null;
  private speed: number;
  private initialVelocity?: Vector2;
  private lifetime: number = GAMEPLAY_CONSTANTS.projectiles.lifetime;
  private age: number = 0;
  public hitSoundPlayed: boolean = false;
  public readonly projectileType: ProjectileType;
  private rotation: number = 0;

  constructor(
    position: Vector2,
    target: Enemy | null,
    damage: number,
    speed: number = GAMEPLAY_CONSTANTS.projectiles.defaultSpeed,
    velocity?: Vector2,
    projectileType: ProjectileType = ProjectileType.BASIC_BULLET
  ) {
    // Set radius based on projectile type
    const radius = projectileType === ProjectileType.SNIPER_ROUND ? 5 :
                  projectileType === ProjectileType.RAPID_PELLET ? 2 :
                  PROJECTILE_RENDER.basic.radius;
    
    super(EntityType.PROJECTILE, position, 1, radius);
    
    this.damage = damage;
    this.target = target;
    this.speed = speed;
    this.projectileType = projectileType;
    
    if (velocity) {
      this.velocity = { ...velocity };
      this.initialVelocity = { ...velocity };
      this.rotation = Math.atan2(velocity.y, velocity.x);
    } else if (target) {
      // Calculate initial rotation towards target
      const dx = target.position.x - position.x;
      const dy = target.position.y - position.y;
      this.rotation = Math.atan2(dy, dx);
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
      
      // Update rotation to face movement direction
      const dx = this.target.position.x - this.position.x;
      const dy = this.target.position.y - this.position.y;
      this.rotation = Math.atan2(dy, dx);
      
      // Check for collision with target
      if (this.collidesWith(this.target)) {
        this.target.takeDamage(this.damage, this);
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
  
  getRotation(): number {
    return this.rotation;
  }

  hasHitTarget(): boolean {
    return !this.isAlive && !!this.target && !this.target.isAlive;
  }

  checkCollisionWithEnemies(enemies: Enemy[]): Enemy | null {
    if (!this.isAlive) return null;
    
    for (const enemy of enemies) {
      if (enemy.isAlive && this.collidesWith(enemy)) {
        enemy.takeDamage(this.damage, this);
        this.isAlive = false;
        return enemy;
      }
    }
    
    return null;
  }
}