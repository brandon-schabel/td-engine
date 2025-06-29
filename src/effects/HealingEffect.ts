/**
 * HealingEffect - Visual effect for healing
 * Uses the ParticleSystem for smooth animations
 */

import type { Vector2 } from '@/utils/Vector2';
import { ParticleSystem, ParticlePresets } from './ParticleSystem';

export class HealingEffect {
  private particleSystem: ParticleSystem;
  public isComplete: boolean = false;
  
  constructor(position: Vector2, amount: number) {
    // Scale particle count based on heal amount
    const particleCount = Math.min(20, Math.max(5, Math.floor(amount / 10)));
    
    this.particleSystem = new ParticleSystem(position, {
      ...ParticlePresets.healing(),
      count: particleCount,
      emitRate: particleCount * 2, // Emit over time
      emitDuration: 500
    });
    
    this.particleSystem.start();
  }
  
  public update(deltaTime: number): void {
    this.particleSystem.update(deltaTime);
    
    if (!this.particleSystem.isActive()) {
      this.isComplete = true;
    }
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isComplete) {
      this.particleSystem.render(ctx);
    }
  }
  
  public setPosition(position: Vector2): void {
    this.particleSystem.setPosition(position);
  }
  
  public destroy(): void {
    this.particleSystem.destroy();
    this.isComplete = true;
  }
}