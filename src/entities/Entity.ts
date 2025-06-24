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
    
    // Calculate next position
    const nextX = this.position.x + this.velocity.x * speedModifier * dt;
    const nextY = this.position.y + this.velocity.y * speedModifier * dt;
    const nextPosition = { x: nextX, y: nextY };
    
    // Check if we can move to the next position
    if (grid && this.movementType !== undefined) {
      // Check if the next position is valid for our movement type
      const canMove = MovementSystem.canEntityMoveTo(this, nextPosition, grid);
      
      if (canMove) {
        // Move normally
        this.position = nextPosition;
      } else {
        // Try to slide along obstacles
        const slidePosition = this.trySlideMovement(this.position, nextPosition, grid, speedModifier * dt);
        if (slidePosition) {
          this.position = slidePosition;
        } else {
          // Can't move at all, stop
          this.velocity = { x: 0, y: 0 };
        }
      }
    } else {
      // No grid or movement type, move normally
      this.position = nextPosition;
    }
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

  // Try to slide along obstacles when direct movement is blocked
  private trySlideMovement(currentPos: Vector2, targetPos: Vector2, grid: Grid, maxDistance: number): Vector2 | null {
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    
    // Try horizontal movement only
    const horizontalPos = { x: targetPos.x, y: currentPos.y };
    if (dx !== 0 && MovementSystem.canEntityMoveTo(this, horizontalPos, grid)) {
      return horizontalPos;
    }
    
    // Try vertical movement only
    const verticalPos = { x: currentPos.x, y: targetPos.y };
    if (dy !== 0 && MovementSystem.canEntityMoveTo(this, verticalPos, grid)) {
      return verticalPos;
    }
    
    // Try diagonal slide (move at 45 degrees along obstacle)
    const slideAngle = Math.atan2(dy, dx);
    const angles = [
      slideAngle + Math.PI / 4,  // Slide right
      slideAngle - Math.PI / 4   // Slide left
    ];
    
    for (const angle of angles) {
      const slideX = currentPos.x + Math.cos(angle) * maxDistance;
      const slideY = currentPos.y + Math.sin(angle) * maxDistance;
      const slidePos = { x: slideX, y: slideY };
      
      if (MovementSystem.canEntityMoveTo(this, slidePos, grid)) {
        return slidePos;
      }
    }
    
    return null;
  }
}