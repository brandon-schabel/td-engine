import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import type { Vector2 } from '../utils/Vector2';

export class HealthPickup extends Entity {
  public readonly healAmount: number;
  public isActive: boolean = true;
  private animationTime: number = 0;
  
  constructor(position: Vector2, healAmount: number = 25) {
    super(EntityType.HEALTH_PICKUP, position, 1, 10); // 1 health, 10 radius
    this.healAmount = healAmount;
  }

  override update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update animation time for visual effects
    this.animationTime += deltaTime;
    
    super.update(deltaTime);
  }

  checkCollisionWithPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;
    
    // Check collision based on combined radii
    const distance = this.distanceTo(player);
    return distance <= (this.radius + player.radius);
  }

  tryHealPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive || !this.checkCollisionWithPlayer(player)) {
      return false;
    }

    // Heal the player
    player.heal(this.healAmount);
    
    // Deactivate the pickup
    this.isActive = false;
    this.isAlive = false;
    
    return true;
  }

  // Visual effects
  getVisualY(): number {
    // Bobbing animation
    const bobAmount = 5;
    const bobSpeed = 0.002; // radians per millisecond
    return this.position.y + Math.sin(this.animationTime * bobSpeed) * bobAmount;
  }

  getRotation(): number {
    // Slow rotation
    const rotationSpeed = 0.001; // radians per millisecond
    return this.animationTime * rotationSpeed;
  }

  // Spawn system helpers
  static getSpawnChance(): number {
    return 0.2; // 20% chance to spawn from defeated enemies
  }

  static shouldSpawnFromEnemy(enemyType?: string): boolean {
    const chance = HealthPickup.getSpawnChance();
    return Math.random() < chance;
  }
}