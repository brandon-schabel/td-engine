/**
 * DestructionEffect - Visual effects for when entities are destroyed
 * Now powered by the advanced ParticleSystem
 */

import type { Vector2 } from '@/utils/Vector2';
import { EnemyType } from '@/entities/Enemy';
import { ParticleSystem, ParticlePresets } from './ParticleSystem';

export class DestructionEffect {
  public readonly id: string;
  public position: Vector2;
  public type: EnemyType | 'tower';
  public age: number = 0;
  public maxAge: number;
  public isComplete: boolean = false;
  
  private particleSystem: ParticleSystem;
  private secondarySystem?: ParticleSystem; // For multi-layer effects

  constructor(position: Vector2, type: EnemyType | 'tower', particleMultiplier: number = 1.0) {
    this.id = `destruction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.position = { ...position };
    this.type = type;
    this.maxAge = 2000; // 2 seconds for particle effects
    
    // Create particle effects based on type
    switch (this.type) {
      case EnemyType.BASIC:
        this.particleSystem = new ParticleSystem(position, {
          ...ParticlePresets.explosion('#ff0000'),
          count: Math.floor(20 * particleMultiplier)
        });
        break;
        
      case EnemyType.FAST:
        this.particleSystem = new ParticleSystem(position, {
          ...ParticlePresets.sparks('#00aaff'),
          count: Math.floor(15 * particleMultiplier),
          speed: { min: 150, max: 350 } // Extra fast for fast enemy
        });
        break;
        
      case EnemyType.TANK:
        // Multi-layer effect for tank
        this.particleSystem = new ParticleSystem(position, {
          ...ParticlePresets.explosion('#8800ff'),
          count: Math.floor(30 * particleMultiplier),
          size: { min: 4, max: 10 }
        });
        
        // Add smoke effect
        this.secondarySystem = new ParticleSystem(position, {
          ...ParticlePresets.smoke(),
          count: Math.floor(15 * particleMultiplier)
        });
        break;
        
      case 'tower':
        this.particleSystem = new ParticleSystem(position, {
          ...ParticlePresets.explosion('#ff8800'),
          count: Math.floor(25 * particleMultiplier),
          gravity: 150,
          friction: 0.03
        });
        
        // Add sparks
        this.secondarySystem = new ParticleSystem(position, {
          ...ParticlePresets.sparks('#ffff00'),
          count: Math.floor(10 * particleMultiplier)
        });
        break;
        
      default:
        this.particleSystem = new ParticleSystem(position, ParticlePresets.explosion());
    }
    
    // Start the particle effects
    this.particleSystem.start();
    this.secondarySystem?.start();
  }

  public update(deltaTime: number): void {
    this.age += deltaTime;
    
    // Update particle systems
    this.particleSystem.update(deltaTime);
    this.secondarySystem?.update(deltaTime);
    
    // Check if effect is complete
    if (this.age >= this.maxAge || 
        (!this.particleSystem.isActive() && !this.secondarySystem?.isActive())) {
      this.isComplete = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.isComplete) return;
    
    // Render particle systems
    this.particleSystem.render(ctx);
    this.secondarySystem?.render(ctx);
  }

  public destroy(): void {
    this.particleSystem.destroy();
    this.secondarySystem?.destroy();
    this.isComplete = true;
  }

  // For compatibility with existing code
  public get particles() {
    return []; // Return empty array as particles are now managed internally
  }
}