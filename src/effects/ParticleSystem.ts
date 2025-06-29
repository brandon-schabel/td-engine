/**
 * ParticleSystem - Advanced particle effects powered by GSAP
 * Replaces basic particle animations with smooth, performant effects
 */

import { gsap } from '@/utils/AnimationUtils';
import type { Vector2 } from '@/utils/Vector2';

export interface ParticleConfig {
  // Emission
  count: number;
  emitDuration?: number; // How long to emit particles (ms)
  emitRate?: number; // Particles per second
  
  // Appearance
  size: { min: number; max: number };
  color: string | string[]; // Single color or array for variety
  opacity: { start: number; end: number };
  
  // Movement
  speed: { min: number; max: number };
  angle?: { min: number; max: number }; // Emission angle in radians
  gravity?: number;
  friction?: number;
  
  // Lifetime
  lifespan: { min: number; max: number }; // ms
  
  // Visual effects
  scale?: { start: number; end: number };
  rotation?: { min: number; max: number };
  blur?: boolean;
  glow?: boolean;
}

export interface Particle {
  id: number;
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  opacity: number;
  scale: number;
  rotation: number;
  age: number;
  lifespan: number;
  alive: boolean;
}

let particleIdCounter = 0;

export class ParticleSystem {
  private particles: Map<number, Particle> = new Map();
  private config: ParticleConfig;
  private position: Vector2;
  private emitting: boolean = false;
  private emitTimer: number = 0;
  private lastEmitTime: number = 0;
  private tweens: Map<number, gsap.core.Tween[]> = new Map();
  
  constructor(position: Vector2, config: ParticleConfig) {
    this.position = { ...position };
    this.config = config;
  }
  
  public start(): void {
    this.emitting = true;
    this.emitTimer = 0;
    this.lastEmitTime = Date.now();
    
    // Emit initial burst
    if (!this.config.emitRate) {
      this.emitBurst();
    }
  }
  
  public stop(): void {
    this.emitting = false;
  }
  
  public update(deltaTime: number): void {
    const now = Date.now();
    
    // Handle continuous emission
    if (this.emitting && this.config.emitRate) {
      const timeSinceLastEmit = now - this.lastEmitTime;
      const emitInterval = 1000 / this.config.emitRate;
      
      if (timeSinceLastEmit >= emitInterval) {
        const particlesToEmit = Math.floor(timeSinceLastEmit / emitInterval);
        for (let i = 0; i < particlesToEmit; i++) {
          this.emitParticle();
        }
        this.lastEmitTime = now;
      }
      
      // Check emit duration
      if (this.config.emitDuration) {
        this.emitTimer += deltaTime;
        if (this.emitTimer >= this.config.emitDuration) {
          this.stop();
        }
      }
    }
    
    // Update particles
    for (const [id, particle] of this.particles) {
      particle.age += deltaTime;
      
      if (particle.age >= particle.lifespan) {
        this.removeParticle(id);
      }
    }
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Set blend mode for better visual effects
    if (this.config.glow) {
      ctx.globalCompositeOperation = 'screen';
    }
    
    for (const particle of this.particles.values()) {
      if (!particle.alive) continue;
      
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      // Apply transformations
      ctx.translate(particle.position.x, particle.position.y);
      ctx.rotate(particle.rotation);
      ctx.scale(particle.scale, particle.scale);
      
      // Draw particle
      if (this.config.blur) {
        ctx.filter = 'blur(1px)';
      }
      
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  private emitBurst(): void {
    for (let i = 0; i < this.config.count; i++) {
      this.emitParticle();
    }
  }
  
  private emitParticle(): void {
    const id = particleIdCounter++;
    
    // Random values within configured ranges
    const size = this.randomRange(this.config.size.min, this.config.size.max);
    const speed = this.randomRange(this.config.speed.min, this.config.speed.max);
    const lifespan = this.randomRange(this.config.lifespan.min, this.config.lifespan.max);
    
    // Emission angle
    let angle: number;
    if (this.config.angle) {
      angle = this.randomRange(this.config.angle.min, this.config.angle.max);
    } else {
      angle = Math.random() * Math.PI * 2;
    }
    
    // Color selection
    let color: string;
    if (Array.isArray(this.config.color)) {
      color = this.config.color[Math.floor(Math.random() * this.config.color.length)];
    } else {
      color = this.config.color;
    }
    
    const particle: Particle = {
      id,
      position: { ...this.position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      size,
      color,
      opacity: this.config.opacity.start,
      scale: this.config.scale?.start || 1,
      rotation: this.config.rotation ? this.randomRange(this.config.rotation.min, this.config.rotation.max) : 0,
      age: 0,
      lifespan,
      alive: true
    };
    
    this.particles.set(id, particle);
    
    // Create GSAP animations for smooth movement
    const tweens: gsap.core.Tween[] = [];
    
    // Position animation with physics
    const positionTween = gsap.to(particle.position, {
      duration: lifespan / 1000,
      ease: 'none',
      onUpdate: () => {
        // Apply velocity
        particle.position.x += particle.velocity.x * 0.016; // ~60fps
        particle.position.y += particle.velocity.y * 0.016;
        
        // Apply gravity
        if (this.config.gravity) {
          particle.velocity.y += this.config.gravity * 0.016;
        }
        
        // Apply friction
        if (this.config.friction) {
          particle.velocity.x *= 1 - this.config.friction * 0.016;
          particle.velocity.y *= 1 - this.config.friction * 0.016;
        }
      }
    });
    tweens.push(positionTween);
    
    // Opacity fade
    const opacityTween = gsap.to(particle, {
      opacity: this.config.opacity.end,
      duration: lifespan / 1000,
      ease: 'power2.in'
    });
    tweens.push(opacityTween);
    
    // Scale animation
    if (this.config.scale) {
      const scaleTween = gsap.to(particle, {
        scale: this.config.scale.end,
        duration: lifespan / 1000,
        ease: 'power2.out'
      });
      tweens.push(scaleTween);
    }
    
    // Rotation animation
    if (this.config.rotation) {
      const rotationTween = gsap.to(particle, {
        rotation: particle.rotation + (Math.random() - 0.5) * Math.PI * 2,
        duration: lifespan / 1000,
        ease: 'none'
      });
      tweens.push(rotationTween);
    }
    
    this.tweens.set(id, tweens);
  }
  
  private removeParticle(id: number): void {
    const particle = this.particles.get(id);
    if (particle) {
      particle.alive = false;
      this.particles.delete(id);
      
      // Kill associated tweens
      const tweens = this.tweens.get(id);
      if (tweens) {
        tweens.forEach(tween => tween.kill());
        this.tweens.delete(id);
      }
    }
  }
  
  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  
  public getParticleCount(): number {
    return this.particles.size;
  }
  
  public isActive(): boolean {
    return this.emitting || this.particles.size > 0;
  }
  
  public setPosition(position: Vector2): void {
    this.position = { ...position };
  }
  
  public destroy(): void {
    this.stop();
    
    // Kill all tweens
    for (const tweens of this.tweens.values()) {
      tweens.forEach(tween => tween.kill());
    }
    
    this.particles.clear();
    this.tweens.clear();
  }
}

// Preset particle effects
export const ParticlePresets = {
  explosion: (color: string = '#ff6b00'): ParticleConfig => ({
    count: 30,
    size: { min: 2, max: 6 },
    color: [color, '#ff9500', '#ffb700'],
    opacity: { start: 1, end: 0 },
    speed: { min: 50, max: 200 },
    lifespan: { min: 300, max: 600 },
    scale: { start: 1, end: 0.3 },
    gravity: 100,
    friction: 0.02,
    glow: true
  }),
  
  smoke: (): ParticleConfig => ({
    count: 20,
    size: { min: 10, max: 20 },
    color: ['#666666', '#888888', '#aaaaaa'],
    opacity: { start: 0.6, end: 0 },
    speed: { min: 10, max: 30 },
    angle: { min: -Math.PI / 2 - 0.5, max: -Math.PI / 2 + 0.5 },
    lifespan: { min: 1000, max: 2000 },
    scale: { start: 0.5, end: 2 },
    gravity: -20,
    blur: true
  }),
  
  sparks: (color: string = '#ffff00'): ParticleConfig => ({
    count: 15,
    size: { min: 1, max: 3 },
    color: [color, '#ffffff'],
    opacity: { start: 1, end: 0 },
    speed: { min: 100, max: 300 },
    lifespan: { min: 200, max: 400 },
    gravity: 200,
    friction: 0.05,
    glow: true
  }),
  
  healing: (): ParticleConfig => ({
    count: 10,
    size: { min: 3, max: 5 },
    color: ['#00ff00', '#00ff88', '#88ff88'],
    opacity: { start: 0.8, end: 0 },
    speed: { min: 20, max: 50 },
    angle: { min: -Math.PI, max: 0 },
    lifespan: { min: 800, max: 1200 },
    scale: { start: 0.5, end: 1.5 },
    gravity: -50,
    glow: true
  }),
  
  powerUp: (): ParticleConfig => ({
    count: 25,
    emitRate: 50,
    emitDuration: 500,
    size: { min: 2, max: 4 },
    color: ['#ff00ff', '#00ffff', '#ffff00'],
    opacity: { start: 1, end: 0 },
    speed: { min: 50, max: 100 },
    lifespan: { min: 500, max: 1000 },
    scale: { start: 1, end: 0 },
    rotation: { min: 0, max: Math.PI * 2 },
    glow: true
  })
};