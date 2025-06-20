import type { Vector2 } from '@/utils/Vector2';
import { Vector2Utils } from '@/utils/Vector2';

export enum EntityType {
  TOWER = 'TOWER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  PLAYER = 'PLAYER',
  HEALTH_PICKUP = 'HEALTH_PICKUP',
  POWER_UP = 'POWER_UP',
  COLLECTIBLE = 'COLLECTIBLE'
}

let nextId = 1;

export type DamageEvent = {
  entity: Entity;
  amount: number;
  actualDamage: number;
  source?: Entity;
};

export type DamageCallback = (event: DamageEvent) => void;

export class Entity {
  public readonly id: string;
  public readonly type: EntityType;
  public position: Vector2;
  public velocity: Vector2;
  public health: number;
  public maxHealth: number;
  public radius: number;
  public isAlive: boolean;
  
  // Damage event callback
  public onDamage?: DamageCallback;

  constructor(
    type: EntityType,
    position: Vector2 = { x: 0, y: 0 },
    maxHealth: number = 100,
    radius: number = 10
  ) {
    this.id = `${type}_${nextId++}`;
    this.type = type;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.radius = radius;
    this.isAlive = true;
  }

  update(deltaTime: number): void {
    if (!this.isAlive) return;

    // Update position based on velocity (deltaTime is in milliseconds)
    const dt = deltaTime / 1000; // Convert to seconds
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }

  takeDamage(amount: number, source?: Entity): void {
    if (!this.isAlive) return;

    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);
    const actualDamage = previousHealth - this.health;
    
    // Trigger damage event callback
    if (this.onDamage && actualDamage > 0) {
      this.onDamage({
        entity: this,
        amount,
        actualDamage,
        source
      });
    }
    
    if (this.health === 0) {
      this.isAlive = false;
    }
  }

  heal(amount: number): void {
    if (!this.isAlive) return;

    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  moveTo(target: Vector2, speed: number): void {
    const distance = this.distanceTo(target);
    
    if (distance < 1) {
      // Close enough to target, stop moving
      this.velocity = { x: 0, y: 0 };
      return;
    }

    // Calculate direction vector
    const direction = Vector2Utils.subtract(target, this.position);
    const normalizedDirection = Vector2Utils.normalize(direction);
    
    // Set velocity
    this.velocity = Vector2Utils.multiply(normalizedDirection, speed);
  }

  distanceTo(target: Entity | Vector2): number {
    const targetPos = 'position' in target ? target.position : target;
    return Vector2Utils.distance(this.position, targetPos);
  }

  isInRange(target: Entity | Vector2, range: number): boolean {
    return this.distanceTo(target) <= range;
  }

  getPosition(): Vector2 {
    return { ...this.position };
  }

  collidesWith(other: Entity): boolean {
    const distance = this.distanceTo(other);
    return distance < (this.radius + other.radius);
  }
}