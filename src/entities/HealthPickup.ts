import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import type { Vector2 } from '@/utils/Vector2';
import { animateHealthPickupBob } from '@/utils/AnimationUtils';
import type { gsap } from 'gsap';

export class HealthPickup extends Entity {
  public healAmount: number;
  public isActive: boolean;
  public bobOffset: number = 0;
  public rotation: number = 0;
  private animationTimeline: gsap.core.Timeline | null = null;

  constructor(position: Vector2, healAmount: number = 25) {
    super(EntityType.HEALTH_PICKUP, position, 1, 10);
    this.healAmount = healAmount;
    this.isActive = true;
    
    // Start bobbing animation
    this.animationTimeline = animateHealthPickupBob(this);
  }

  update(_deltaTime: number): void {
    if (!this.isActive) {
      // Kill animations when inactive
      if (this.animationTimeline) {
        this.animationTimeline.kill();
        this.animationTimeline = null;
      }
      return;
    }
    // GSAP handles all animations now
  }

  checkCollisionWithPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;

    const distance = this.distanceTo(player);
    return distance <= this.radius + player.radius;
  }

  tryHealPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;

    if (this.checkCollisionWithPlayer(player)) {
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
  
  destroy(): void {
    // Clean up animations
    if (this.animationTimeline) {
      this.animationTimeline.kill();
      this.animationTimeline = null;
    }
  }

  // Static methods for spawn system
  static getSpawnChance(): number {
    return 0.1; // 10% chance to spawn from defeated enemies
  }

  static shouldSpawnFromEnemy(): boolean {
    // Could vary spawn chance based on enemy type in the future
    return Math.random() < HealthPickup.getSpawnChance();
  }
}