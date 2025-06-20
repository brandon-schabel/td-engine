/**
 * EntityPopup.ts - Base class for UI popups that follow game entities
 * Changes:
 * 1. Initial implementation with world-to-screen tracking
 * 2. Screen boundary checking and repositioning
 * 3. Auto-hide when entity is destroyed or off-screen
 * 4. Smooth animation support
 * 5. Configurable offset and anchor positions
 */

import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';
import type { Vector2 } from '@/utils/Vector2';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface EntityPopupOptions {
  offset?: Vector2;
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  fadeIn?: boolean;
  fadeOut?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
  className?: string;
  zIndex?: number;
  boundaryPadding?: number;
}

export abstract class EntityPopup {
  protected element: HTMLElement;
  protected entity: Entity;
  protected camera: Camera;
  protected options: Required<EntityPopupOptions>;
  protected visible: boolean = false;
  protected destroyed: boolean = false;
  protected hideTimer?: number;
  protected lastScreenPosition: Vector2 = { x: 0, y: 0 };

  constructor(
    entity: Entity,
    camera: Camera,
    options: EntityPopupOptions = {}
  ) {
    this.entity = entity;
    this.camera = camera;
    this.options = {
      offset: { x: 0, y: 0 },
      anchor: 'top',
      fadeIn: true,
      fadeOut: true,
      autoHide: false,
      hideDelay: 0,
      className: '',
      zIndex: UI_CONSTANTS.zIndex.floatingUI || 1000,
      boundaryPadding: 20,
      ...options
    };

    this.element = this.createElement();
    this.applyBaseStyles();
    this.buildContent();
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = `entity-popup ${this.options.className}`;
    return element;
  }

  protected applyBaseStyles(): void {
    this.element.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: ${this.options.zIndex};
      opacity: 0;
      transition: opacity ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      will-change: transform, opacity;
    `;
  }

  /**
   * Abstract method for subclasses to build their content
   */
  protected abstract buildContent(): void;

  /**
   * Update popup position to follow entity
   */
  public update(): void {
    if (this.destroyed || !this.entity.isAlive) {
      this.destroy();
      return;
    }

    // Check if entity is visible on screen
    if (!this.camera.isVisible(this.entity.position, this.entity.radius)) {
      if (this.visible) {
        this.hide();
      }
      return;
    }

    // Show if hidden
    if (!this.visible) {
      this.show();
    }

    // Update position
    this.updatePosition();
  }

  protected updatePosition(): void {
    // Convert entity world position to screen position
    const screenPos = this.camera.worldToScreen(this.entity.position);
    
    // Calculate anchor offset based on entity radius
    const anchorOffset = this.calculateAnchorOffset(screenPos);
    
    // Apply custom offset
    const finalX = anchorOffset.x + this.options.offset.x;
    const finalY = anchorOffset.y + this.options.offset.y;

    // Check screen boundaries and adjust if needed
    const adjustedPosition = this.checkBoundaries(finalX, finalY);
    
    // Apply smooth translation
    this.element.style.transform = `translate(${adjustedPosition.x}px, ${adjustedPosition.y}px)`;
    
    this.lastScreenPosition = adjustedPosition;
  }

  protected calculateAnchorOffset(screenPos: Vector2): Vector2 {
    const entityScreenRadius = this.entity.radius * this.camera.getZoom();
    
    switch (this.options.anchor) {
      case 'top':
        return {
          x: screenPos.x - this.element.offsetWidth / 2,
          y: screenPos.y - entityScreenRadius - this.element.offsetHeight
        };
      case 'bottom':
        return {
          x: screenPos.x - this.element.offsetWidth / 2,
          y: screenPos.y + entityScreenRadius
        };
      case 'left':
        return {
          x: screenPos.x - entityScreenRadius - this.element.offsetWidth,
          y: screenPos.y - this.element.offsetHeight / 2
        };
      case 'right':
        return {
          x: screenPos.x + entityScreenRadius,
          y: screenPos.y - this.element.offsetHeight / 2
        };
      case 'center':
      default:
        return {
          x: screenPos.x - this.element.offsetWidth / 2,
          y: screenPos.y - this.element.offsetHeight / 2
        };
    }
  }

  protected checkBoundaries(x: number, y: number): Vector2 {
    const padding = this.options.boundaryPadding;
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    
    // Clamp to screen boundaries
    const clampedX = Math.max(
      padding,
      Math.min(x, window.innerWidth - width - padding)
    );
    
    const clampedY = Math.max(
      padding,
      Math.min(y, window.innerHeight - height - padding)
    );
    
    return { x: clampedX, y: clampedY };
  }

  public show(): void {
    if (this.visible || this.destroyed) return;
    
    this.visible = true;
    
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
    
    // Force layout calculation
    void this.element.offsetHeight;
    
    // Update position before showing
    this.updatePosition();
    
    // Fade in
    requestAnimationFrame(() => {
      if (this.options.fadeIn) {
        this.element.style.opacity = '1';
      } else {
        this.element.style.opacity = '1';
        this.element.style.transition = 'none';
      }
    });

    // Setup auto-hide timer if configured
    if (this.options.autoHide && this.options.hideDelay > 0) {
      this.hideTimer = window.setTimeout(() => {
        this.hide();
      }, this.options.hideDelay);
    }
  }

  public hide(): void {
    if (!this.visible || this.destroyed) return;
    
    this.visible = false;
    
    // Clear any pending hide timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
    
    if (this.options.fadeOut) {
      this.element.style.opacity = '0';
      
      // Remove after fade completes
      setTimeout(() => {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      }, ANIMATION_CONFIG.durations.uiTransition);
    } else {
      this.element.style.opacity = '0';
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  public destroy(): void {
    if (this.destroyed) return;
    
    this.destroyed = true;
    this.hide();
    
    // Clear timers
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    
    // Additional cleanup
    this.onDestroy();
  }

  /**
   * Hook for subclasses to perform cleanup
   */
  protected onDestroy(): void {
    // Override in subclasses if needed
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public getEntity(): Entity {
    return this.entity;
  }

  public setOffset(offset: Vector2): void {
    this.options.offset = offset;
    if (this.visible) {
      this.updatePosition();
    }
  }

  public getScreenPosition(): Vector2 {
    return { ...this.lastScreenPosition };
  }
}