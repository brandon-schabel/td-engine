import type { Vector2 } from '@/utils/Vector2';
import type { Enemy } from './Enemy';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';

export enum ProjectileType {
  BASIC_BULLET = 'BASIC_BULLET',
  SNIPER_ROUND = 'SNIPER_ROUND',
  RAPID_PELLET = 'RAPID_PELLET',
  PLAYER_SHOT = 'PLAYER_SHOT'
}

// Simple projectile class without complex inheritance
export class Projectile {
  public readonly id: string;
  public position: Vector2;
  public velocity: Vector2;
  public readonly damage: number;
  public readonly speed: number;
  public readonly radius: number;
  public readonly projectileType: ProjectileType;
  public targetId: string | null;
  public isAlive: boolean = true;
  public age: number = 0;
  public readonly maxLifetime: number;
  
  // Visual properties
  public color: string;
  public glowColor: string;
  public trailLength: number;
  
  constructor(
    position: Vector2,
    targetId: string | null,
    damage: number,
    speed: number = GAMEPLAY_CONSTANTS.projectiles.defaultSpeed,
    velocity?: Vector2,
    projectileType: ProjectileType = ProjectileType.BASIC_BULLET
  ) {
    // Generate unique ID
    this.id = `PROJECTILE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Core properties
    this.position = { ...position };
    this.damage = damage;
    this.speed = speed;
    this.projectileType = projectileType;
    this.targetId = targetId;
    this.maxLifetime = GAMEPLAY_CONSTANTS.projectiles.lifetime;
    
    // Set radius based on type
    switch (projectileType) {
      case ProjectileType.SNIPER_ROUND:
        this.radius = 6;
        this.color = '#00FFFF';
        this.glowColor = '#00CCFF';
        this.trailLength = 40;
        break;
      case ProjectileType.RAPID_PELLET:
        this.radius = 3;
        this.color = '#FF6B35';
        this.glowColor = '#FF4500';
        this.trailLength = 10;
        break;
      case ProjectileType.PLAYER_SHOT:
        this.radius = 5;
        this.color = '#00FF00';
        this.glowColor = '#00CC00';
        this.trailLength = 15;
        break;
      case ProjectileType.BASIC_BULLET:
      default:
        this.radius = 4;
        this.color = '#FFEB3B';
        this.glowColor = '#FFC107';
        this.trailLength = 20;
        break;
    }
    
    // Set velocity - if provided use it, otherwise default to rightward
    if (velocity) {
      this.velocity = { ...velocity };
    } else {
      // Default velocity (rightward)
      this.velocity = { x: this.speed, y: 0 };
    }
    
    console.log(`[Projectile] Created ${this.id} at position:`, this.position, 'velocity:', this.velocity, 'type:', projectileType);
  }
  
  // Simple collision check
  collidesWith(enemy: Enemy): boolean {
    const dx = enemy.position.x - this.position.x;
    const dy = enemy.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (this.radius + enemy.radius);
  }
  
  // Get rotation angle based on velocity
  getRotation(): number {
    return Math.atan2(this.velocity.y, this.velocity.x);
  }
}