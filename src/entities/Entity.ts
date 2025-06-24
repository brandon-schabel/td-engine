import type { Vector2 } from '@/utils/Vector2';
import { Vector2Utils } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import { MovementSystem, MovementType } from '@/systems/MovementSystem';
import { TerrainDebug } from '@/debug/TerrainDebug';

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
  isCritical?: boolean;
};

export type DamageCallback = (event: DamageEvent) => void;

export class Entity {
  public readonly id: string;
  public readonly type: EntityType;
  public readonly entityType: string;
  public position: Vector2;
  public velocity: Vector2;
  public health: number;
  public maxHealth: number;
  public radius: number;
  public isAlive: boolean;

  // Damage event callback
  public onDamage?: DamageCallback;
  
  // Terrain-aware movement properties
  public movementType?: MovementType;
  public baseSpeed: number = 0;
  public currentSpeed: number = 0;
  protected lastTerrainSpeed: number = 1.0;

  constructor(
    type: EntityType,
    position: Vector2 = { x: 0, y: 0 },
    maxHealth: number = 100,
    radius: number = 10
  ) {
    this.id = `${type}_${nextId++}`;
    this.type = type;
    this.entityType = type;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.radius = radius;
    this.isAlive = true;
  }

  update(deltaTime: number, grid?: Grid): void {
    if (!this.isAlive) return;

    // Update position based on velocity (deltaTime is in milliseconds)
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Calculate terrain speed modifier
    let speedModifier = 1.0;
    
    // Apply terrain effects if grid is provided
    if (grid) {
      // Apply terrain damage and effects
      MovementSystem.applyTerrainEffects(this, deltaTime, grid);
      
      // Update current speed based on terrain
      if (this.baseSpeed > 0) {
        const targetSpeed = MovementSystem.getAdjustedSpeed(this, this.baseSpeed, grid);
        this.currentSpeed = MovementSystem.getSmoothTransitionSpeed(
          this, 
          this.currentSpeed || this.baseSpeed, 
          targetSpeed, 
          deltaTime
        );
        this.lastTerrainSpeed = targetSpeed / this.baseSpeed;
        speedModifier = this.lastTerrainSpeed;
        
        // Debug logging
        const gridPos = grid.worldToGrid(this.position);
        const cellType = grid.getCellType(gridPos.x, gridPos.y);
        TerrainDebug.logMovement(this.id, this.position, this.baseSpeed, targetSpeed, cellType);
      }
    }
    
    // Apply velocity with terrain speed modifier
    this.position.x += this.velocity.x * speedModifier * dt;
    this.position.y += this.velocity.y * speedModifier * dt;
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

  moveTo(target: Vector2, speed: number, _grid?: Grid): void {
    const distance = this.distanceTo(target);

    if (distance < 1) {
      // Close enough to target, stop moving
      this.velocity = { x: 0, y: 0 };
      return;
    }

    // Calculate direction vector
    const direction = Vector2Utils.subtract(target, this.position);
    const normalizedDirection = Vector2Utils.normalize(direction);

    // Use base speed - terrain modifier will be applied in update()
    // This prevents double-applying terrain effects
    this.velocity = Vector2Utils.multiply(normalizedDirection, speed);
  }

  // Helper method for terrain-aware movement
  moveToWithTerrain(target: Vector2, grid: Grid): void {
    if (!this.baseSpeed) {
      console.warn(`Entity ${this.id} has no baseSpeed set for terrain-aware movement`);
      return;
    }
    
    this.moveTo(target, this.currentSpeed || this.baseSpeed, grid);
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