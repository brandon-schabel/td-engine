import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import type { Vector2 } from '../utils/Vector2';

export class HealthPickup extends Entity {
  public healAmount: number;
  public isActive: boolean;
  private bobOffset: number = 0;
  private bobTime: number = 0;
  private rotation: number = 0;

  constructor(position: Vector2, healAmount: number = 25) {
    super(EntityType.HEALTH_PICKUP, position, 1, 10);
    this.healAmount = healAmount;
    this.isActive = true;
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    // Update bobbing animation
    this.bobTime += deltaTime;
    this.bobOffset = Math.sin(this.bobTime / 200) * 5; // Bob up and down

    // Update rotation
    this.rotation += deltaTime * 0.002; // Slow rotation
  }

  checkCollisionWithPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;

    const distance = this.distanceTo(player);
    return distance <= this.radius + player.radius;
  }

  tryHealPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;

    if (this.checkCollisionWithPlayer(player)) {
      const previousHealth = player.health;
      player.heal(this.healAmount);
      this.isActive = false;
      return true;
    }

    return false;
  }

  getVisualY(): number {
    return this.position.y + this.bobOffset;
  }

  getRotation(): number {
    return this.rotation;
  }

  // Static methods for spawn system
  static getSpawnChance(): number {
    return 0.1; // 10% chance to spawn from defeated enemies
  }

  static shouldSpawnFromEnemy(enemyType?: string): boolean {
    // Could vary spawn chance based on enemy type
    return Math.random() < HealthPickup.getSpawnChance();
  }
}