/**
 * DestructionEffect - Visual effects for when entities are destroyed
 */

import type { Vector2 } from '@/utils/Vector2';
import { EnemyType } from '@/entities/Enemy';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export class DestructionEffect {
  public position: Vector2;
  public type: EnemyType | 'tower';
  public particles: Particle[] = [];
  public age: number = 0;
  public maxAge: number;
  public isComplete: boolean = false;
  private particleMultiplier: number = 1.0;

  constructor(position: Vector2, type: EnemyType | 'tower', particleMultiplier: number = 1.0) {
    this.position = { ...position };
    this.type = type;
    this.maxAge = 1000; // 1 second
    this.particleMultiplier = Math.max(0.1, particleMultiplier); // Ensure at least 10% particles
    
    this.createParticles();
  }

  private createParticles(): void {
    const baseParticleCount = this.type === EnemyType.TANK ? 20 : 
                             this.type === EnemyType.FAST ? 10 : 15;
    const particleCount = Math.max(1, Math.floor(baseParticleCount * this.particleMultiplier));
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      
      let color: string;
      let size: number;
      
      switch (this.type) {
        case EnemyType.BASIC:
          color = `hsl(0, 100%, ${50 + Math.random() * 20}%)`; // Red variations
          size = 3 + Math.random() * 3;
          break;
        case EnemyType.FAST:
          color = `hsl(200, 100%, ${50 + Math.random() * 20}%)`; // Blue variations
          size = 2 + Math.random() * 2;
          break;
        case EnemyType.TANK:
          color = `hsl(270, 50%, ${40 + Math.random() * 20}%)`; // Purple variations
          size = 4 + Math.random() * 4;
          break;
        case 'tower':
          color = `hsl(${Math.random() * 60}, 50%, ${50 + Math.random() * 20}%)`; // Yellow-orange
          size = 3 + Math.random() * 3;
          break;
        default:
          color = '#FFFFFF';
          size = 3;
      }
      
      this.particles.push({
        position: { ...this.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        size,
        color,
        alpha: 1,
        life: 0,
        maxLife: 500 + Math.random() * 500
      });
    }
    
    // Add special effects for specific types
    if (this.type === EnemyType.TANK) {
      // Add debris chunks for tank
      const debrisCount = Math.max(1, Math.floor(5 * this.particleMultiplier));
      for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 50;
        
        this.particles.push({
          position: { ...this.position },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          },
          size: 6 + Math.random() * 4,
          color: '#666666',
          alpha: 1,
          life: 0,
          maxLife: 800
        });
      }
    }
  }

  update(deltaTime: number): void {
    this.age += deltaTime;
    
    if (this.age >= this.maxAge) {
      this.isComplete = true;
      return;
    }
    
    // Update particles
    let allDead = true;
    for (const particle of this.particles) {
      particle.life += deltaTime;
      
      if (particle.life < particle.maxLife) {
        allDead = false;
        
        // Update position
        particle.position.x += particle.velocity.x * deltaTime * 0.001;
        particle.position.y += particle.velocity.y * deltaTime * 0.001;
        
        // Apply gravity to larger particles
        if (particle.size > 5) {
          particle.velocity.y += 200 * deltaTime * 0.001;
        }
        
        // Slow down
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
        
        // Fade out
        particle.alpha = 1 - (particle.life / particle.maxLife);
        
        // Shrink
        particle.size *= 0.99;
      }
    }
    
    if (allDead) {
      this.isComplete = true;
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: any): void {
    for (const particle of this.particles) {
      if (particle.life >= particle.maxLife) continue;
      
      const screenPos = camera.worldToScreen(particle.position);
      const zoom = camera.getZoom();
      
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, particle.size * zoom, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Add glow for energy particles
      if (this.type === EnemyType.FAST || this.type === 'tower') {
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size * zoom * 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(')', ', 0.3)').replace('hsl', 'hsla');
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Add shockwave effect for tank explosion
    if (this.type === EnemyType.TANK && this.age < 200) {
      const screenPos = camera.worldToScreen(this.position);
      const zoom = camera.getZoom();
      const radius = (this.age / 200) * 50 * zoom;
      
      ctx.save();
      ctx.globalAlpha = 1 - (this.age / 200);
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 3 * zoom;
      ctx.stroke();
      ctx.restore();
    }
  }
}