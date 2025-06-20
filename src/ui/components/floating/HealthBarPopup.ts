/**
 * HealthBarPopup.ts - Floating health bar above entities
 * Changes:
 * 1. Initial implementation with smooth transitions
 * 2. Color-coded health states
 * 3. Shield/armor display support
 * 4. Damage flash effects
 * 5. Auto-hide when full health option
 */

import { EntityPopup, type EntityPopupOptions } from './EntityPopup';
import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface HealthBarOptions extends EntityPopupOptions {
  width?: number;
  height?: number;
  borderRadius?: number;
  borderWidth?: number;
  showText?: boolean;
  showPercentage?: boolean;
  hideWhenFull?: boolean;
  flashOnDamage?: boolean;
  shieldAmount?: number;
  armorAmount?: number;
}

export class HealthBarPopup extends EntityPopup {
  private width: number;
  private height: number;
  private borderRadius: number;
  private borderWidth: number;
  private showText: boolean;
  private showPercentage: boolean;
  private hideWhenFull: boolean;
  private flashOnDamage: boolean;
  private shieldAmount: number;
  private armorAmount: number;
  
  private barContainer?: HTMLElement;
  private healthBar?: HTMLElement;
  private shieldBar?: HTMLElement;
  private armorBar?: HTMLElement;
  private textElement?: HTMLElement;
  
  private lastHealth: number;
  private damageFlashTimer?: number;

  constructor(
    entity: Entity,
    camera: Camera,
    options: HealthBarOptions = {}
  ) {
    const defaults = {
      width: 50,
      height: 6,
      borderRadius: 3,
      borderWidth: 1,
      showText: false,
      showPercentage: false,
      hideWhenFull: true,
      flashOnDamage: true,
      shieldAmount: 0,
      armorAmount: 0,
      anchor: 'top' as const,
      offset: { x: 0, y: -15 },
      className: 'health-bar-popup',
      fadeIn: false,
      fadeOut: false
    };

    super(entity, camera, { ...defaults, ...options });
    
    this.width = options.width || defaults.width;
    this.height = options.height || defaults.height;
    this.borderRadius = options.borderRadius || defaults.borderRadius;
    this.borderWidth = options.borderWidth || defaults.borderWidth;
    this.showText = options.showText || defaults.showText;
    this.showPercentage = options.showPercentage || defaults.showPercentage;
    this.hideWhenFull = options.hideWhenFull ?? defaults.hideWhenFull;
    this.flashOnDamage = options.flashOnDamage ?? defaults.flashOnDamage;
    this.shieldAmount = options.shieldAmount || defaults.shieldAmount;
    this.armorAmount = options.armorAmount || defaults.armorAmount;
    
    this.lastHealth = entity.health;
  }

  protected buildContent(): void {
    // Main container styling
    this.element.style.cssText += `
      width: ${this.width}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    `;

    // Create bar container
    this.barContainer = document.createElement('div');
    this.barContainer.className = 'health-bar-container';
    this.barContainer.style.cssText = `
      width: 100%;
      height: ${this.height}px;
      background: ${COLOR_THEME.ui.background.primary}cc;
      border: ${this.borderWidth}px solid ${COLOR_THEME.ui.border.default}66;
      border-radius: ${this.borderRadius}px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;

    // Create health bar
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'health-bar-fill';
    this.healthBar.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
      border-radius: ${Math.max(0, this.borderRadius - this.borderWidth)}px;
    `;

    // Create shield bar if needed
    if (this.shieldAmount > 0) {
      this.shieldBar = document.createElement('div');
      this.shieldBar.className = 'shield-bar-fill';
      this.shieldBar.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: #00BFFF; /* Sky blue for shield */
        opacity: 0.7;
        transition: width 0.3s ease;
        border-radius: ${Math.max(0, this.borderRadius - this.borderWidth)}px;
      `;
      this.barContainer.appendChild(this.shieldBar);
    }

    // Create armor bar if needed
    if (this.armorAmount > 0) {
      this.armorBar = document.createElement('div');
      this.armorBar.className = 'armor-bar-fill';
      this.armorBar.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: #FFD700; /* Gold for armor */
        opacity: 0.5;
        transition: width 0.3s ease;
        border-radius: ${Math.max(0, this.borderRadius - this.borderWidth)}px;
      `;
      this.barContainer.appendChild(this.armorBar);
    }

    this.barContainer.appendChild(this.healthBar);
    this.element.appendChild(this.barContainer);

    // Create text element if needed
    if (this.showText || this.showPercentage) {
      this.textElement = document.createElement('div');
      this.textElement.className = 'health-bar-text';
      this.textElement.style.cssText = `
        font-size: 10px;
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.primary};
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
      `;
      this.element.appendChild(this.textElement);
    }

    // Initial update
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const healthPercent = (this.entity.health / this.entity.maxHealth) * 100;
    const healthColor = this.getHealthColor(healthPercent);

    // Update health bar
    if (this.healthBar) {
      this.healthBar.style.width = `${healthPercent}%`;
      this.healthBar.style.backgroundColor = healthColor;
    }

    // Update shield bar
    if (this.shieldBar && this.shieldAmount > 0) {
      const shieldPercent = Math.min((this.shieldAmount / this.entity.maxHealth) * 100, 100);
      this.shieldBar.style.width = `${Math.min(healthPercent + shieldPercent, 100)}%`;
    }

    // Update armor bar
    if (this.armorBar && this.armorAmount > 0) {
      const armorPercent = Math.min((this.armorAmount / this.entity.maxHealth) * 100, 100);
      this.armorBar.style.width = `${Math.min(healthPercent + armorPercent, 100)}%`;
    }

    // Update text
    if (this.textElement) {
      if (this.showPercentage) {
        this.textElement.textContent = `${Math.round(healthPercent)}%`;
      } else if (this.showText) {
        this.textElement.textContent = `${Math.round(this.entity.health)}/${this.entity.maxHealth}`;
      }
    }

    // Check if should hide when full
    if (this.hideWhenFull && this.entity.health >= this.entity.maxHealth) {
      this.hide();
    } else if (!this.visible && this.entity.health < this.entity.maxHealth) {
      this.show();
    }

    // Flash on damage
    if (this.flashOnDamage && this.entity.health < this.lastHealth) {
      this.flashDamage();
    }

    this.lastHealth = this.entity.health;
  }

  private getHealthColor(percent: number): string {
    if (percent > 60) {
      return COLOR_THEME.ui.text.success;
    } else if (percent > 30) {
      return COLOR_THEME.ui.currency; // Use currency yellow as warning color
    } else {
      return COLOR_THEME.ui.text.danger;
    }
  }

  private flashDamage(): void {
    if (!this.barContainer) return;

    // Clear any existing flash
    if (this.damageFlashTimer) {
      clearTimeout(this.damageFlashTimer);
    }

    // Apply flash effect
    this.barContainer.style.boxShadow = `0 0 8px ${COLOR_THEME.ui.text.danger}`;
    
    // Remove flash after duration
    this.damageFlashTimer = window.setTimeout(() => {
      if (this.barContainer) {
        this.barContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
      }
    }, ANIMATION_CONFIG.combat.damageFlash);
  }

  public override update(): void {
    super.update();
    
    // Update health bar
    if (this.visible) {
      this.updateHealthBar();
    }
  }

  public setShieldAmount(amount: number): void {
    this.shieldAmount = amount;
    this.updateHealthBar();
  }

  public setArmorAmount(amount: number): void {
    this.armorAmount = amount;
    this.updateHealthBar();
  }

  protected override onDestroy(): void {
    if (this.damageFlashTimer) {
      clearTimeout(this.damageFlashTimer);
    }
  }

  /**
   * Static factory for quick creation
   */
  public static create(
    entity: Entity,
    camera: Camera,
    options?: Partial<HealthBarOptions>
  ): HealthBarPopup {
    return new HealthBarPopup(entity, camera, options || {});
  }
}