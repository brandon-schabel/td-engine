/**
 * UIManager.ts - Centralized UI management system
 * Changes:
 * 1. Initial implementation as central UI coordinator
 * 2. Integrates PopupManager and DialogManager
 * 3. Provides unified API for all UI operations
 * 4. Handles UI system lifecycle and updates
 * 5. Singleton pattern for global access
 */

import { PopupManager, type PopupManagerOptions } from './PopupManager';
import { DialogManager } from './DialogManager';
import type { Camera } from '@/systems/Camera';
import type { Entity } from '@/entities/Entity';
import { DamageType } from '@/ui/components/floating/DamageNumberPopup';
import type { EntityInfoOptions } from '@/ui/components/floating/EntityInfoPopup';
import type { HealthBarOptions } from '@/ui/components/floating/HealthBarPopup';
import type { EntityPopup } from '@/ui/components/floating/EntityPopup';

export interface UIManagerOptions {
  camera: Camera;
  popupOptions?: PopupManagerOptions;
}

/**
 * Centralized UI manager that coordinates all UI systems
 */
export class UIManager {
  private static instance: UIManager | null = null;

  private popupManager: PopupManager;
  private dialogManager: DialogManager;
  private initialized: boolean = false;

  constructor(options: UIManagerOptions) {
    const { camera, popupOptions = {} } = options;

    // Initialize popup manager
    this.popupManager = new PopupManager(camera, {
      maxPopups: 50,
      enablePooling: true,
      ...popupOptions
    });

    // Get dialog manager singleton
    this.dialogManager = DialogManager.getInstance();

    this.initialized = true;

    // Set as singleton instance
    UIManager.instance = this;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): UIManager | null {
    return UIManager.instance;
  }

  /**
   * Initialize the UI manager (alternative to constructor for lazy init)
   */
  public static initialize(options: UIManagerOptions): UIManager {
    if (UIManager.instance) {
      console.warn('[UIManager] Already initialized, returning existing instance');
      return UIManager.instance;
    }

    return new UIManager(options);
  }

  /**
   * Update all UI systems
   */
  public update(): void {
    if (!this.initialized) return;

    // Update popup manager
    this.popupManager.update();

    // Dialog manager doesn't need regular updates
  }

  /**
   * Update camera reference for all UI systems
   */
  public setCamera(camera: Camera): void {
    this.popupManager.setCamera(camera);
  }

  // === Popup System API ===

  /**
   * Show damage number for an entity
   */
  public showDamageNumber(
    entity: Entity,
    damage: number,
    isCritical: boolean = false
  ): EntityPopup {
    return this.popupManager.createDamageNumber(
      entity,
      damage,
      isCritical ? DamageType.CRITICAL : DamageType.NORMAL
    );
  }

  /**
   * Show damage number with specific type
   */
  public showTypedDamage(
    entity: Entity,
    damage: number,
    damageType: DamageType
  ): EntityPopup {
    return this.popupManager.createDamageNumber(entity, damage, damageType);
  }

  /**
   * Show entity information popup
   */
  public showEntityInfo(
    entity: Entity,
    options?: Partial<EntityInfoOptions>
  ): EntityPopup {
    return this.popupManager.createEntityInfo(entity, options);
  }

  /**
   * Show health bar for an entity
   */
  public showHealthBar(
    entity: Entity,
    options?: Partial<HealthBarOptions>
  ): EntityPopup {
    return this.popupManager.createHealthBar(entity, options);
  }

  /**
   * Show damage for multiple entities
   */
  public showDamageBurst(
    entities: Entity[],
    damage: number,
    damageType: DamageType = DamageType.NORMAL
  ): EntityPopup[] {
    return this.popupManager.createDamageBurst(entities, damage, damageType);
  }

  /**
   * Get all popups for a specific entity
   */
  public getEntityPopups(entity: Entity): EntityPopup[] {
    return this.popupManager.getPopupsForEntity(entity);
  }

  /**
   * Remove all popups for a specific entity
   */
  public clearEntityPopups(entity: Entity): void {
    this.popupManager.removePopupsForEntity(entity);
  }

  /**
   * Add a custom popup
   */
  public addCustomPopup(popup: EntityPopup): void {
    this.popupManager.addPopup(popup);
  }

  /**
   * Remove a specific popup
   */
  public removePopup(popup: EntityPopup): void {
    this.popupManager.removePopup(popup);
  }

  /**
   * Clear all popups
   */
  public clearAllPopups(): void {
    this.popupManager.clearAll();
  }

  /**
   * Get popup count
   */
  public getPopupCount(): number {
    return this.popupManager.getPopupCount();
  }

  // === Dialog System API ===

  /**
   * Show a dialog by ID
   */
  public showDialog(dialogId: string): void {
    this.dialogManager.show(dialogId);
  }

  /**
   * Hide a dialog by ID
   */
  public hideDialog(dialogId: string): void {
    this.dialogManager.hide(dialogId);
  }

  /**
   * Hide all dialogs
   */
  public hideAllDialogs(): void {
    this.dialogManager.hideAll();
  }

  /**
   * Check if a dialog is visible
   */
  public isDialogVisible(dialogId: string): boolean {
    const dialog = this.dialogManager.getDialog(dialogId);
    return dialog ? dialog.isVisible() : false;
  }

  /**
   * Get the currently visible dialog ID
   */
  public getVisibleDialog(): string | null {
    const openDialogs = this.dialogManager.getOpenDialogs();
    return openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : null;
  }

  // === Direct Access (for advanced usage) ===

  /**
   * Get direct access to popup manager
   */
  public getPopupManager(): PopupManager {
    return this.popupManager;
  }

  /**
   * Get direct access to dialog manager
   */
  public getDialogManager(): DialogManager {
    return this.dialogManager;
  }

  // === Lifecycle ===

  /**
   * Cleanup all UI systems
   */
  public destroy(): void {
    this.clearAllPopups();
    this.hideAllDialogs();
    this.popupManager.destroy();
    this.initialized = false;

    // Clear singleton reference
    if (UIManager.instance === this) {
      UIManager.instance = null;
    }
  }

  /**
   * Check if UI manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  // === Utility Methods ===

  /**
   * Show a notification popup (convenience method)
   */
  public notify(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // This could create a notification popup in the future
    console.log(`[UIManager] Notification (${type}): ${message}`);
  }

  /**
   * Quick health bar creation for common entities
   */
  public trackEntityHealth(entity: Entity, options?: Partial<HealthBarOptions>): EntityPopup {
    return this.showHealthBar(entity, {
      hideWhenFull: true,
      flashOnDamage: true,
      ...options
    });
  }
}

// Export convenience function for getting UI manager
export function getUIManager(): UIManager | null {
  return UIManager.getInstance();
}