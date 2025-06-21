/**
 * Recent changes:
 * - Initial creation of centralized UI controller
 * - Manages all floating UI elements from one place
 * - Handles escape key for closing dialogs
 * - Prevents race conditions and ensures proper cleanup
 * - Provides intelligent update system to prevent flickering
 */

import { FloatingUIManager, FloatingUIElement } from '@/ui/floating';
import type { Game } from '@/core/Game';
import { TowerUpgradeUI } from '@/ui/floating/TowerUpgradeUI';
import { PlayerUpgradeUI } from '@/ui/floating/PlayerUpgradeUI';
import { InventoryUI } from '@/ui/floating/InventoryUI';
import { BuildMenuUI } from '@/ui/floating/BuildMenuUI';
import { GameOverUI } from '@/ui/floating/GameOverUI';
import { SettingsUI } from '@/ui/floating/SettingsUI';
import { PauseMenuUI } from '@/ui/floating/PauseMenuUI';
import type { Tower } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import type { Entity } from '@/entities/Entity';
import type { TowerType } from '@/entities/Tower';
import type { GameSettings } from '@/config/GameSettings';

export interface UIElementInfo {
  id: string;
  type: 'dialog' | 'popup' | 'hud' | 'healthbar' | 'custom';
  element: FloatingUIElement | any; // Any for legacy UI components
  closeable: boolean;
  persistent: boolean;
}

export class UIController {
  private game: Game;
  private floatingUI: FloatingUIManager;
  private activeElements = new Map<string, UIElementInfo>();
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  // UI Component instances
  private towerUpgradeUI: TowerUpgradeUI | null = null;
  private playerUpgradeUI: PlayerUpgradeUI | null = null;
  private inventoryUI: InventoryUI | null = null;
  private buildMenuUI: BuildMenuUI | null = null;
  private gameOverUI: GameOverUI | null = null;
  private settingsUI: SettingsUI | null = null;
  private pauseMenuUI: PauseMenuUI | null = null;

  // Update tracking to prevent flickering
  private updateCache = new Map<string, any>();

  constructor(game: Game) {
    this.game = game;
    this.floatingUI = game.getFloatingUIManager();
    this.setupEscapeHandler();
  }

  private setupEscapeHandler(): void {
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAllDialogs();
      }
    };
    window.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Close all non-persistent dialogs and popups
   */
  public closeAllDialogs(): void {
    for (const [id, info] of this.activeElements.entries()) {
      if (info.closeable && info.type !== 'hud' && info.type !== 'healthbar') {
        this.close(id);
      }
    }
  }

  /**
   * Register a UI element with the controller
   */
  private register(id: string, element: FloatingUIElement | any, type: UIElementInfo['type'], closeable = true, persistent = false): void {
    this.activeElements.set(id, {
      id,
      type,
      element,
      closeable,
      persistent
    });
  }

  /**
   * Close and cleanup a UI element
   */
  public close(id: string): void {
    const info = this.activeElements.get(id);
    if (!info) return;

    // Call destroy on the element if it exists
    if (info.element && typeof info.element.destroy === 'function') {
      info.element.destroy();
    } else if (info.element && typeof info.element.close === 'function') {
      info.element.close();
    }

    this.activeElements.delete(id);
    this.updateCache.delete(id);

    // Special handling for tower-upgrade to deselect the tower AFTER cleanup
    if (id === 'tower-upgrade') {
      // Clear selected tower without calling close again
      if (this.game.getSelectedTower()) {
        this.game.clearSelectedTower();
      }
    }
  }

  /**
   * Show build menu at screen position
   */
  public showBuildMenu(screenX: number, screenY: number, onTowerSelect: (type: TowerType) => void, anchorElement?: HTMLElement): void {
    // Close any existing build menu
    this.close('build-menu');

    if (!this.buildMenuUI) {
      this.buildMenuUI = new BuildMenuUI(this.game);
    }

    // For build menu, we'll pass the screen coordinates as world coordinates
    // The BuildMenuUI will handle the proper positioning above the control bar
    this.buildMenuUI.show(screenX, screenY, onTowerSelect, anchorElement);
    this.register('build-menu', this.buildMenuUI, 'popup');
  }

  /**
   * Show tower upgrade UI for selected tower
   */
  public showTowerUpgrade(tower: Tower): void {
    // Close any existing tower upgrade UI
    this.close('tower-upgrade');

    // Always create a new TowerUpgradeUI instance
    // The TowerUpgradeUI class handles singleton behavior internally
    this.towerUpgradeUI = new TowerUpgradeUI(tower, this.game);

    this.register('tower-upgrade', this.towerUpgradeUI, 'dialog');
  }

  /**
   * Show player upgrade UI
   */
  public showPlayerUpgrade(player: Player, screenPos?: { x: number; y: number }, anchorElement?: HTMLElement): void {
    // Close any existing player upgrade UI
    this.close('player-upgrade');

    if (!this.playerUpgradeUI) {
      this.playerUpgradeUI = new PlayerUpgradeUI(player, this.game, screenPos, anchorElement);
    }

    this.register('player-upgrade', this.playerUpgradeUI, 'dialog');
  }

  /**
   * Show inventory UI
   */
  public showInventory(screenPos?: { x: number; y: number }, anchorElement?: HTMLElement): void {
    // Toggle inventory
    if (this.activeElements.has('inventory')) {
      this.close('inventory');
      return;
    }

    if (!this.inventoryUI) {
      this.inventoryUI = new InventoryUI(this.game, screenPos, anchorElement);
    }

    this.inventoryUI.show();
    this.register('inventory', this.inventoryUI, 'dialog');
  }

  /**
   * Show game over UI
   */
  public showGameOver(stats: any): void {
    this.closeAllDialogs();

    if (!this.gameOverUI) {
      this.gameOverUI = new GameOverUI(this.game);
    }

    this.gameOverUI.show(stats);
    this.register('game-over', this.gameOverUI, 'dialog', false, true);
  }

  /**
   * Show settings UI
   */
  public showSettings(anchorElement?: HTMLElement, onSettingsChange?: (settings: GameSettings) => void): void {
    // Close any existing settings UI
    this.close('settings');

    if (!this.settingsUI) {
      this.settingsUI = new SettingsUI(this.game, anchorElement);
    }

    this.settingsUI.show(onSettingsChange);
    this.register('settings', this.settingsUI, 'dialog');
  }

  /**
   * Show pause menu UI
   */
  public showPauseMenu(options?: {
    onResume?: () => void;
    onSettings?: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
  }): void {
    // Close any existing pause menu
    this.close('pause-menu');

    if (!this.pauseMenuUI) {
      this.pauseMenuUI = new PauseMenuUI(this.game);
    }

    this.pauseMenuUI.show(options);
    this.register('pause-menu', this.pauseMenuUI, 'dialog');
  }

  /**
   * Create a health bar for an entity
   */
  public createHealthBar(entity: Entity & { health: number; maxHealth?: number }, options?: any): FloatingUIElement {
    const healthBar = this.floatingUI.createHealthBar(entity, options);
    this.register(`healthbar-${entity.id}`, healthBar, 'healthbar', false, false);
    return healthBar;
  }

  /**
   * Smart update method that only updates changed values
   * Prevents flickering by doing targeted DOM updates
   */
  public smartUpdate(elementId: string, updates: Record<string, any>): void {
    const cached = this.updateCache.get(elementId) || {};
    const changes: Record<string, any> = {};

    // Find what actually changed
    for (const [key, value] of Object.entries(updates)) {
      if (JSON.stringify(cached[key]) !== JSON.stringify(value)) {
        changes[key] = value;
        cached[key] = value;
      }
    }

    // Only update if there are changes
    if (Object.keys(changes).length > 0) {
      this.updateCache.set(elementId, { ...cached });
      this.applySmartUpdates(elementId, changes);
    }
  }

  /**
   * Apply smart updates to specific elements without rebuilding entire DOM
   */
  private applySmartUpdates(elementId: string, changes: Record<string, any>): void {
    const info = this.activeElements.get(elementId);
    if (!info || !info.element) return;

    // Get the DOM element
    const element = info.element.getElement ? info.element.getElement() : null;
    if (!element) return;

    // Apply targeted updates
    for (const [key, value] of Object.entries(changes)) {
      const targetElement = element.querySelector(`[data-update-key="${key}"]`);
      if (targetElement) {
        if (typeof value === 'boolean') {
          targetElement.disabled = !value;
          targetElement.classList.toggle('disabled', !value);
        } else if (typeof value === 'string' || typeof value === 'number') {
          targetElement.textContent = String(value);
        }
      }
    }
  }

  /**
   * Cleanup all UI elements
   */
  public destroy(): void {
    // Close all elements
    for (const id of this.activeElements.keys()) {
      this.close(id);
    }

    // Remove escape handler
    if (this.escapeHandler) {
      window.removeEventListener('keydown', this.escapeHandler);
    }

    // Cleanup component instances
    this.towerUpgradeUI = null;
    this.playerUpgradeUI = null;
    this.inventoryUI = null;
    this.buildMenuUI = null;
    this.gameOverUI = null;
    this.settingsUI = null;
    this.pauseMenuUI = null;
  }

  /**
   * Get active element by ID
   */
  public getElement(id: string): UIElementInfo | undefined {
    return this.activeElements.get(id);
  }

  /**
   * Check if a specific UI is open
   */
  public isOpen(id: string): boolean {
    return this.activeElements.has(id);
  }
}