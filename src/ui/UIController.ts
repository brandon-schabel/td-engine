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
import { uiStore, getUIState, UIPanelType } from '@/stores/uiStore';
import type { Tower } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import type { Entity } from '@/entities/Entity';
import type { TowerType } from '@/entities/Tower';
import { cn } from '@/ui/styles/UtilityStyles';

export interface UIElementInfo {
  id: string;
  type: 'dialog' | 'popup' | 'hud' | 'healthbar' | 'custom';
  element: FloatingUIElement | any; // Any for legacy UI components
  closeable: boolean;
  persistent: boolean;
}

export class UIController {
  private floatingUI: FloatingUIManager;
  private activeElements = new Map<string, UIElementInfo>();
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  // Update tracking to prevent flickering
  private updateCache = new Map<string, any>();

  constructor(private game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.setupEscapeHandler();
    this.setupStateListeners();
  }

  private setupEscapeHandler(): void {
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAllDialogs();
      }
    };
    window.addEventListener('keydown', this.escapeHandler);
  }

  private setupStateListeners(): void {
    // Listen for panel close events to sync with UI components
    uiStore.subscribe(
      (state) => state.panels,
      (panels, prevPanels) => {
        // Check for closed panels
        for (const [panelType, prevState] of Object.entries(prevPanels)) {
          if (prevState.isOpen && !panels[panelType as UIPanelType].isOpen) {
            this.handlePanelClosed(panelType as UIPanelType);
          }
        }
      }
    );

    // Handle build mode changes
    uiStore.subscribe(
      (state) => state.isPanelOpen(UIPanelType.BUILD_MODE),
      (isOpen) => {
        if (isOpen) {
          this.hideBuildModeUI();
        } else {
          this.showBuildModeUI();
        }
      }
    );
  }

  private handlePanelClosed(panel: UIPanelType): void {
    // Ensure UI component is properly cleaned up when state manager closes panel
    const mappings: Partial<Record<UIPanelType, string>> = {
      [UIPanelType.PAUSE_MENU]: 'pause-menu',
      [UIPanelType.TOWER_UPGRADE]: 'tower-upgrade',
      [UIPanelType.PLAYER_UPGRADE]: 'player-upgrade',
      [UIPanelType.INVENTORY]: 'inventory',
      [UIPanelType.BUILD_MENU]: 'build-menu',
      [UIPanelType.BUILD_MODE]: 'build-mode'
    };

    const elementId = mappings[panel];
    if (elementId && this.activeElements.has(elementId)) {
      this.close(elementId);
    }
  }

  /**
   * Close all non-persistent dialogs and popups
   */
  public closeAllDialogs(): void {
    // Use UI store to close all transient panels
    getUIState().closeAllPanels(false);
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

    try {
      // Map element ID to panel type and notify state manager
      const panelMappings: Record<string, UIPanelType> = {
        'pause-menu': UIPanelType.PAUSE_MENU,
        'settings': UIPanelType.SETTINGS,
        'tower-upgrade': UIPanelType.TOWER_UPGRADE,
        'player-upgrade': UIPanelType.PLAYER_UPGRADE,
        'inventory': UIPanelType.INVENTORY,
        'build-menu': UIPanelType.BUILD_MENU,
        'game-over': UIPanelType.GAME_OVER,
        'build-mode': UIPanelType.BUILD_MODE,
        'pre-game-config': UIPanelType.PRE_GAME_CONFIG
      };

      const panelType = panelMappings[id];
      if (panelType) {
        getUIState().closePanel(panelType);
      }

      // Call destroy on the element if it exists
      try {
        if (info.element && typeof info.element.destroy === 'function') {
          info.element.destroy();
        } else if (info.element && typeof info.element.close === 'function') {
          info.element.close();
        }
      } catch (error) {
        console.error(`[UIController] Error destroying element ${id}:`, error);
      }

      // Always remove from tracking, even if destroy failed
      this.activeElements.delete(id);
      this.updateCache.delete(id);
    } catch (error) {
      console.error(`[UIController] Fatal error in close(${id}):`, error);
      // Ensure cleanup happens even on fatal error
      this.activeElements.delete(id);
      this.updateCache.delete(id);
    }
  }

  /**
   * Show build menu at screen position
   */
  public showBuildMenu(screenX: number, screenY: number, onTowerSelect: (type: TowerType) => void, anchorElement?: HTMLElement): void {
    // Check if build menu is already open
    if (this.isOpen('build-menu')) {
      // Build menu is already open, React will handle updates
      return;
    }

    // Use UI store to handle panel opening with metadata
    const store = getUIState();
    store.openPanel(UIPanelType.BUILD_MENU, { 
      position: { x: screenX, y: screenY }, 
      onTowerSelect,
      anchorElement 
    });
    
    // No need to create old UI instance - React will handle it
  }

  /**
   * Show tower upgrade UI for selected tower
   */
  public showTowerUpgrade(tower: Tower): void {
    // Use UI store to handle panel opening with tower metadata
    const store = getUIState();
    store.openPanel(UIPanelType.TOWER_UPGRADE, { tower });
    
    // No need to create old UI instance - React will handle it
  }

  /**
   * Show player upgrade UI
   */
  public showPlayerUpgrade(player: Player, screenPos?: { x: number; y: number }): void {
    // Use UI store to handle panel opening
    const store = getUIState();
    store.openPanel(UIPanelType.PLAYER_UPGRADE, { player, screenPos });
    
    // No need to create old UI instance - React will handle it
  }

  /**
   * Show inventory UI
   */
  public showInventory(screenPos?: { x: number; y: number }): void {
    // Toggle inventory using UI store
    const store = getUIState();
    store.togglePanel(UIPanelType.INVENTORY, { position: screenPos });
    
    // No need to create old UI instance - React will handle it
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
    // Use UI store to handle panel opening
    const store = getUIState();
    store.openPanel(UIPanelType.PAUSE_MENU, options);
    
    // No need to create old UI instance - React will handle it
  }


  /**
   * Show game over UI
   */
  public showGameOver(): void {
    // Use UI store to handle panel opening
    const store = getUIState();
    store.openPanel(UIPanelType.GAME_OVER);
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

    // React components handle their own cleanup

    // Reset UI store
    getUIState().closeAllPanels(true);
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



  /**
   * Enter build mode (for tower placement)
   */
  public enterBuildMode(towerType: TowerType): void {
    getUIState().enterBuildMode({ towerType });
  }

  /**
   * Exit build mode
   */
  public exitBuildMode(): void {
    getUIState().exitBuildMode();
  }

  /**
   * Check if in build mode
   */
  public isInBuildMode(): boolean {
    return getUIState().isInBuildMode();
  }

  /**
   * Hide UI elements during build mode
   */
  private hideBuildModeUI(): void {
    // Hide HUD elements
    const hudElements = [
      '.ui-control-bar',
      '.static-hud',
      '.mobile-controls'
    ];

    hudElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).style.visibility = 'hidden';
      });
    });

    // Add build mode indicator
    const indicator = document.getElementById('build-mode-indicator');
    if (!indicator) {
      const buildIndicator = document.createElement('div');
      buildIndicator.id = 'build-mode-indicator';

      const isMobile = 'ontouchstart' in window;

      if (isMobile) {
        // Mobile version with cancel button
        buildIndicator.className = cn(
          'fixed',
          'top-4',
          'left-1/2',
          'transform',
          '-translate-x-1/2',
          'bg-surface-secondary',
          'border',
          'border-border-primary',
          'rounded-lg',
          'shadow-lg',
          'z-50',
          'flex',
          'items-center',
          'gap-3',
          'px-4',
          'py-3'
        );

        const text = document.createElement('span');
        text.className = cn('text-primary', 'text-sm');
        text.textContent = 'Tap to place tower';

        const cancelButton = document.createElement('button');
        cancelButton.className = cn(
          'bg-danger',
          'text-white',
          'px-3',
          'py-1',
          'rounded',
          'text-sm',
          'font-medium',
          'hover:bg-danger-dark',
          'active:scale-95',
          'transition-transform'
        );
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => {
          this.exitBuildMode();
        };

        buildIndicator.appendChild(text);
        buildIndicator.appendChild(cancelButton);
      } else {
        // Desktop version
        buildIndicator.className = cn(
          'fixed',
          'top-4',
          'left-1/2',
          'transform',
          '-translate-x-1/2',
          'bg-surface-secondary',
          'text-primary',
          'px-4',
          'py-2',
          'rounded-lg',
          'shadow-lg',
          'z-50'
        );
        buildIndicator.textContent = 'Place tower or press ESC to cancel';
      }

      document.body.appendChild(buildIndicator);
    }
  }

  /**
   * Show UI elements after build mode
   */
  private showBuildModeUI(): void {
    // Show HUD elements
    const hudElements = [
      '.ui-control-bar',
      '.static-hud',
      '.mobile-controls'
    ];

    hudElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).style.visibility = '';
      });
    });

    // Remove build mode indicator
    const indicator = document.getElementById('build-mode-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}