/**
 * DamageNumberPopup.ts - Animated floating damage numbers
 * Changes:
 * 1. Initial implementation with float-up animation
 * 2. Color coding based on damage type
 * 3. Size scaling based on damage amount
 * 4. Critical hit effects
 * 5. Pooling support for performance
 */

import { EntityPopup, type EntityPopupOptions } from './EntityPopup';
import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export enum DamageType {
  NORMAL = 'NORMAL',
  CRITICAL = 'CRITICAL',
  HEAL = 'HEAL',
  POISON = 'POISON',
  FIRE = 'FIRE',
  ICE = 'ICE'
}

export interface DamageNumberOptions extends EntityPopupOptions {
  damage: number;
  damageType?: DamageType;
  fontSize?: number;
  floatSpeed?: number;
  floatDistance?: number;
  animationDuration?: number;
  criticalMultiplier?: number;
}

export class DamageNumberPopup extends EntityPopup {
  private damage: number;
  private damageType: DamageType;
  private fontSize: number;
  private floatDistance: number;
  private animationDuration: number;
  private criticalMultiplier: number;
  private startTime: number;
  private animationFrame?: number;

  constructor(
    entity: Entity,
    camera: Camera,
    options: DamageNumberOptions
  ) {
    const defaults = {
      damageType: DamageType.NORMAL,
      fontSize: 18,
      floatSpeed: 100, // pixels per second
      floatDistance: 50, // total pixels to float
      animationDuration: 1000, // milliseconds
      criticalMultiplier: 1.5,
      anchor: 'center' as const,
      fadeIn: false,
      fadeOut: true,
      autoHide: true,
      hideDelay: 0, // Will use animationDuration instead
      className: 'damage-number-popup',
      offset: { x: 0, y: -20 }
    };

    super(entity, camera, { ...defaults, ...options });
    
    this.damage = options.damage;
    this.damageType = options.damageType || DamageType.NORMAL;
    this.fontSize = options.fontSize || defaults.fontSize;
    this.floatDistance = options.floatDistance || defaults.floatDistance;
    this.animationDuration = options.animationDuration || defaults.animationDuration;
    this.criticalMultiplier = options.criticalMultiplier || defaults.criticalMultiplier;
    this.startTime = Date.now();

    // Override hide delay with animation duration
    this.options.hideDelay = this.animationDuration;
  }

  protected buildContent(): void {
    // Apply damage-specific styles
    const color = this.getDamageColor();
    const actualFontSize = this.calculateFontSize();
    const isCritical = this.damageType === DamageType.CRITICAL;
    
    this.element.style.cssText += `
      color: ${color};
      font-size: ${actualFontSize}px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      text-align: center;
      text-shadow: 
        2px 2px 4px rgba(0, 0, 0, 0.8),
        -1px -1px 0 rgba(0, 0, 0, 0.5);
      user-select: none;
      ${isCritical ? `
        animation: criticalPulse ${ANIMATION_CONFIG.combat.criticalHit}ms ease-out;
      ` : ''}
    `;

    // Add critical hit styles
    if (isCritical) {
      this.addCriticalStyles();
    }

    // Set content
    const damageText = this.formatDamage();
    this.element.textContent = damageText;
  }

  private getDamageColor(): string {
    switch (this.damageType) {
      case DamageType.CRITICAL:
        return COLOR_THEME.ui.text.danger;
      case DamageType.HEAL:
        return COLOR_THEME.player.fill;
      case DamageType.POISON:
        return '#9932CC'; // Purple
      case DamageType.FIRE:
        return '#FF6347'; // Tomato red
      case DamageType.ICE:
        return '#87CEEB'; // Sky blue
      case DamageType.NORMAL:
      default:
        return COLOR_THEME.ui.currency;
    }
  }

  private calculateFontSize(): number {
    let size = this.fontSize;
    
    // Scale based on damage amount
    if (this.damage >= 100) {
      size *= 1.2;
    } else if (this.damage >= 50) {
      size *= 1.1;
    }
    
    // Critical hits are bigger
    if (this.damageType === DamageType.CRITICAL) {
      size *= this.criticalMultiplier;
    }
    
    return Math.round(size);
  }

  private formatDamage(): string {
    const sign = this.damageType === DamageType.HEAL ? '+' : '-';
    const text = `${sign}${Math.round(this.damage)}`;
    
    if (this.damageType === DamageType.CRITICAL) {
      return `${text}!`;
    }
    
    return text;
  }

  private addCriticalStyles(): void {
    // Add critical hit animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes criticalPulse {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        50% {
          transform: scale(1.5);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    
    if (!document.querySelector('style[data-damage-animations]')) {
      style.setAttribute('data-damage-animations', 'true');
      document.head.appendChild(style);
    }
  }

  public override update(): void {
    if (this.destroyed || !this.entity.isAlive) {
      this.destroy();
      return;
    }

    // Update base position
    super.update();
    
    // Apply floating animation
    if (this.visible) {
      this.updateFloatAnimation();
    }
  }

  private updateFloatAnimation(): void {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    
    // Easing function for smooth deceleration
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Calculate float offset
    const floatOffset = this.floatDistance * easeOut;
    
    // Apply additional transform for floating
    const currentTransform = this.element.style.transform;
    const baseTransform = currentTransform.replace(/translateY\([^)]*\)/, '');
    
    // Update Y position
    this.element.style.transform = `${baseTransform} translateY(-${floatOffset}px)`;
    
    // Update opacity for fade out
    if (progress > 0.5) {
      const fadeProgress = (progress - 0.5) * 2; // 0 to 1 in second half
      this.element.style.opacity = `${1 - fadeProgress}`;
    }
    
    // Continue animation
    if (progress < 1 && !this.destroyed) {
      this.animationFrame = requestAnimationFrame(() => this.updateFloatAnimation());
    }
  }

  public override show(): void {
    super.show();
    
    // Start float animation
    this.startTime = Date.now();
    this.updateFloatAnimation();
  }

  protected override onDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  /**
   * Static factory method for easy creation
   */
  public static create(
    entity: Entity,
    camera: Camera,
    damage: number,
    damageType: DamageType = DamageType.NORMAL
  ): DamageNumberPopup {
    return new DamageNumberPopup(entity, camera, {
      damage,
      damageType
    });
  }
}