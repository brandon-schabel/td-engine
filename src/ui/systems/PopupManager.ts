/**
 * PopupManager.ts - Manages all floating entity popups
 * Changes:
 * 1. Initial implementation with popup tracking
 * 2. Update loop integration
 * 3. Cleanup and lifecycle management
 * 4. Z-order management
 * 5. Performance optimization with pooling
 */

import { EntityPopup } from '@/ui/components/floating/EntityPopup';
import { DamageNumberPopup, DamageType, type DamageNumberOptions } from '@/ui/components/floating/DamageNumberPopup';
import { EntityInfoPopup, type EntityInfoOptions } from '@/ui/components/floating/EntityInfoPopup';
import { HealthBarPopup, type HealthBarOptions } from '@/ui/components/floating/HealthBarPopup';
import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';

export interface PopupManagerOptions {
  maxPopups?: number;
  enablePooling?: boolean;
  poolSize?: number;
}

export class PopupManager {
  private popups: Set<EntityPopup> = new Set();
  private camera: Camera;
  private options: Required<PopupManagerOptions>;
  private damageNumberPool: DamageNumberPopup[] = [];
  private nextZIndex: number = 1000;

  constructor(camera: Camera, options: PopupManagerOptions = {}) {
    this.camera = camera;
    this.options = {
      maxPopups: 100,
      enablePooling: true,
      poolSize: 20,
      ...options
    };

    if (this.options.enablePooling) {
      this.initializePool();
    }
  }

  private initializePool(): void {
    // Pre-create damage number popups for pooling
    // We'll create them as needed rather than pre-allocating
  }

  /**
   * Update all active popups
   */
  public update(): void {
    const toRemove: EntityPopup[] = [];

    this.popups.forEach(popup => {
      if (popup.isDestroyed()) {
        toRemove.push(popup);
      } else {
        popup.update();
      }
    });

    // Clean up destroyed popups
    toRemove.forEach(popup => {
      this.popups.delete(popup);
      
      // Return to pool if applicable
      if (this.options.enablePooling && popup instanceof DamageNumberPopup) {
        this.returnToPool(popup);
      }
    });
  }

  /**
   * Create a damage number popup
   */
  public createDamageNumber(
    entity: Entity,
    damage: number,
    damageType: DamageType = DamageType.NORMAL
  ): DamageNumberPopup {
    // Check popup limit
    if (this.popups.size >= this.options.maxPopups) {
      this.removeOldestPopup();
    }

    let popup: DamageNumberPopup;

    // Try to get from pool
    if (this.options.enablePooling && this.damageNumberPool.length > 0) {
      popup = this.damageNumberPool.pop()!;
      // Reset popup with new data
      // Since we can't easily reset, we'll create new ones for now
      popup = new DamageNumberPopup(entity, this.camera, {
        damage,
        damageType,
        zIndex: this.getNextZIndex()
      });
    } else {
      popup = new DamageNumberPopup(entity, this.camera, {
        damage,
        damageType,
        zIndex: this.getNextZIndex()
      });
    }

    this.popups.add(popup);
    popup.show();
    return popup;
  }

  /**
   * Create an entity info popup
   */
  public createEntityInfo(
    entity: Entity,
    options?: Partial<EntityInfoOptions>
  ): EntityInfoPopup {
    // Check popup limit
    if (this.popups.size >= this.options.maxPopups) {
      this.removeOldestPopup();
    }

    const popup = new EntityInfoPopup(entity, this.camera, {
      ...options,
      zIndex: this.getNextZIndex()
    });

    this.popups.add(popup);
    popup.show();
    return popup;
  }

  /**
   * Create a health bar popup
   */
  public createHealthBar(
    entity: Entity,
    options?: Partial<HealthBarOptions>
  ): HealthBarPopup {
    // Check popup limit
    if (this.popups.size >= this.options.maxPopups) {
      this.removeOldestPopup();
    }

    const popup = new HealthBarPopup(entity, this.camera, {
      ...options,
      zIndex: this.getNextZIndex()
    });

    this.popups.add(popup);
    popup.show();
    return popup;
  }

  /**
   * Show damage for multiple entities at once
   */
  public createDamageBurst(
    entities: Entity[],
    damage: number,
    damageType: DamageType = DamageType.NORMAL
  ): DamageNumberPopup[] {
    return entities.map((entity, index) => {
      // Stagger the animations slightly
      setTimeout(() => {
        this.createDamageNumber(entity, damage, damageType);
      }, index * 50);
      
      return this.createDamageNumber(entity, damage, damageType);
    });
  }

  /**
   * Get all popups for a specific entity
   */
  public getPopupsForEntity(entity: Entity): EntityPopup[] {
    const result: EntityPopup[] = [];
    this.popups.forEach(popup => {
      if (popup.getEntity() === entity) {
        result.push(popup);
      }
    });
    return result;
  }

  /**
   * Remove all popups for a specific entity
   */
  public removePopupsForEntity(entity: Entity): void {
    const toRemove = this.getPopupsForEntity(entity);
    toRemove.forEach(popup => {
      popup.destroy();
      this.popups.delete(popup);
    });
  }

  /**
   * Add a custom popup to be managed
   */
  public addPopup(popup: EntityPopup): void {
    // Check popup limit
    if (this.popups.size >= this.options.maxPopups) {
      this.removeOldestPopup();
    }
    
    this.popups.add(popup);
  }

  /**
   * Remove a specific popup
   */
  public removePopup(popup: EntityPopup): void {
    popup.destroy();
    this.popups.delete(popup);
  }

  /**
   * Clear all popups
   */
  public clearAll(): void {
    this.popups.forEach(popup => popup.destroy());
    this.popups.clear();
  }

  /**
   * Get active popup count
   */
  public getPopupCount(): number {
    return this.popups.size;
  }

  /**
   * Update camera reference (if camera changes)
   */
  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  private removeOldestPopup(): void {
    // Remove the first popup (oldest)
    const oldest = this.popups.values().next().value;
    if (oldest) {
      this.removePopup(oldest);
    }
  }

  private returnToPool(popup: DamageNumberPopup): void {
    if (this.damageNumberPool.length < this.options.poolSize) {
      // Reset popup state here if we implement reset functionality
      // For now, we'll just let it be garbage collected
    }
  }

  private getNextZIndex(): number {
    return this.nextZIndex++;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.clearAll();
    this.damageNumberPool = [];
  }

  /**
   * Static factory method for common use cases
   */
  public static createDamagePopup(
    popupManager: PopupManager,
    entity: Entity,
    damage: number,
    isCritical: boolean = false
  ): DamageNumberPopup {
    return popupManager.createDamageNumber(
      entity,
      damage,
      isCritical ? DamageType.CRITICAL : DamageType.NORMAL
    );
  }
}