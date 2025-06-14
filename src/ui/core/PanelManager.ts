/**
 * PanelManager - Central panel visibility coordinator with z-index management
 * Manages overlapping panels, focus, and stacking order
 */

import { EventEmitter } from './EventEmitter';
import type { Component } from './Component';

export interface PanelConfig {
  id: string;
  component: Component<any>;
  zIndex: number;
  modal: boolean;           // Whether panel blocks interaction with other panels
  pauseGame: boolean;       // Whether to pause game when panel is shown
  closable: boolean;        // Whether panel can be closed with escape key
  persistent: boolean;      // Whether panel survives game state changes
  position: PanelPosition;
  category: PanelCategory;
}

export type PanelPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 
                           'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

export type PanelCategory = 'hud' | 'overlay' | 'menu' | 'dialog' | 'tooltip' | 'notification';

export interface PanelStackEntry {
  config: PanelConfig;
  visible: boolean;
  focused: boolean;
  lastActiveTime: number;
}

export class PanelManager extends EventEmitter {
  private panels: Map<string, PanelStackEntry> = new Map();
  private zIndexCounter: number = 1000;
  private focusStack: string[] = [];
  private gameReference: any = null;
  
  // Z-index ranges for different panel categories
  private readonly Z_INDEX_RANGES = {
    hud: { min: 1000, max: 1099 },
    overlay: { min: 1100, max: 1199 },
    menu: { min: 1200, max: 1299 },
    dialog: { min: 1300, max: 1399 },
    tooltip: { min: 1400, max: 1499 },
    notification: { min: 1500, max: 1599 }
  };

  constructor(gameReference?: any) {
    super();
    this.gameReference = gameReference;
    this.setupGlobalEventListeners();
  }

  /**
   * Register a panel with the manager
   */
  registerPanel(config: PanelConfig): void {
    // Validate z-index for category
    const range = this.Z_INDEX_RANGES[config.category];
    if (config.zIndex < range.min || config.zIndex > range.max) {
      config.zIndex = this.getNextZIndexForCategory(config.category);
    }

    const entry: PanelStackEntry = {
      config,
      visible: false,
      focused: false,
      lastActiveTime: 0
    };

    this.panels.set(config.id, entry);
    this.emit('panelRegistered', { panelId: config.id, config });
  }

  /**
   * Show a panel
   */
  showPanel(panelId: string, focus: boolean = true): boolean {
    const entry = this.panels.get(panelId);
    if (!entry) {
      console.warn(`Panel ${panelId} not found`);
      return false;
    }

    // Handle modal panels
    if (entry.config.modal) {
      this.hideNonModalPanels();
    }

    // Handle game pause
    if (entry.config.pauseGame && this.gameReference?.pause) {
      this.gameReference.pause();
    }

    // Show the panel
    entry.visible = true;
    entry.lastActiveTime = Date.now();
    
    if (entry.config.component && typeof entry.config.component.show === 'function') {
      entry.config.component.show();
    }

    // Apply z-index
    this.applyZIndex(entry);

    // Handle focus
    if (focus) {
      this.focusPanel(panelId);
    }

    this.emit('panelShown', { panelId, config: entry.config });
    return true;
  }

  /**
   * Hide a panel
   */
  hidePanel(panelId: string): boolean {
    const entry = this.panels.get(panelId);
    if (!entry || !entry.visible) {
      return false;
    }

    entry.visible = false;
    entry.focused = false;
    
    if (entry.config.component && typeof entry.config.component.hide === 'function') {
      entry.config.component.hide();
    }

    // Remove from focus stack
    this.removePanelFromFocusStack(panelId);

    // Handle game resume if this was the last modal/pause panel
    if (entry.config.pauseGame && this.gameReference?.resume) {
      const hasOtherPausingPanels = Array.from(this.panels.values())
        .some(p => p.visible && p.config.pauseGame && p.config.id !== panelId);
      
      if (!hasOtherPausingPanels) {
        this.gameReference.resume();
      }
    }

    // Auto-focus next panel in stack
    if (this.focusStack.length > 0) {
      const nextPanelId = this.focusStack[this.focusStack.length - 1];
      this.focusPanel(nextPanelId);
    }

    this.emit('panelHidden', { panelId, config: entry.config });
    return true;
  }

  /**
   * Toggle panel visibility
   */
  togglePanel(panelId: string): boolean {
    const entry = this.panels.get(panelId);
    if (!entry) return false;

    if (entry.visible) {
      return this.hidePanel(panelId);
    } else {
      return this.showPanel(panelId);
    }
  }

  /**
   * Focus a panel (bring to front)
   */
  focusPanel(panelId: string): boolean {
    const entry = this.panels.get(panelId);
    if (!entry || !entry.visible) {
      return false;
    }

    // Update focus state
    this.clearAllFocus();
    entry.focused = true;
    entry.lastActiveTime = Date.now();

    // Update focus stack
    this.removePanelFromFocusStack(panelId);
    this.focusStack.push(panelId);

    // Update z-index to bring to front
    entry.config.zIndex = this.getNextZIndexForCategory(entry.config.category);
    this.applyZIndex(entry);

    this.emit('panelFocused', { panelId, config: entry.config });
    return true;
  }

  /**
   * Close all closable panels
   */
  closeAllClosablePanels(): void {
    const closablePanels = Array.from(this.panels.entries())
      .filter(([_, entry]) => entry.visible && entry.config.closable)
      .map(([id, _]) => id);

    closablePanels.forEach(panelId => this.hidePanel(panelId));
  }

  /**
   * Hide panels that don't survive game state changes
   */
  handleGameStateChange(newState: string): void {
    const panelsToHide = Array.from(this.panels.entries())
      .filter(([_, entry]) => entry.visible && !entry.config.persistent)
      .map(([id, _]) => id);

    panelsToHide.forEach(panelId => this.hidePanel(panelId));

    this.emit('gameStateChanged', { newState, hiddenPanels: panelsToHide });
  }

  /**
   * Get visible panels ordered by z-index
   */
  getVisiblePanels(): PanelStackEntry[] {
    return Array.from(this.panels.values())
      .filter(entry => entry.visible)
      .sort((a, b) => a.config.zIndex - b.config.zIndex);
  }

  /**
   * Get focused panel
   */
  getFocusedPanel(): PanelStackEntry | null {
    return Array.from(this.panels.values())
      .find(entry => entry.focused) || null;
  }

  /**
   * Check if any modal panels are visible
   */
  hasVisibleModalPanels(): boolean {
    return Array.from(this.panels.values())
      .some(entry => entry.visible && entry.config.modal);
  }

  /**
   * Get panel by ID
   */
  getPanel(panelId: string): PanelStackEntry | null {
    return this.panels.get(panelId) || null;
  }

  /**
   * Check if panel is visible
   */
  isPanelVisible(panelId: string): boolean {
    const entry = this.panels.get(panelId);
    return entry ? entry.visible : false;
  }

  /**
   * Update panel configuration
   */
  updatePanelConfig(panelId: string, updates: Partial<PanelConfig>): boolean {
    const entry = this.panels.get(panelId);
    if (!entry) return false;

    Object.assign(entry.config, updates);
    
    // Re-apply z-index if category changed
    if (updates.category || updates.zIndex) {
      this.applyZIndex(entry);
    }

    this.emit('panelConfigUpdated', { panelId, config: entry.config });
    return true;
  }

  /**
   * Private helper methods
   */

  private getNextZIndexForCategory(category: PanelCategory): number {
    const range = this.Z_INDEX_RANGES[category];
    const existingZIndexes = Array.from(this.panels.values())
      .filter(entry => entry.config.category === category)
      .map(entry => entry.config.zIndex)
      .sort((a, b) => b - a);

    if (existingZIndexes.length === 0) {
      return range.min;
    }

    const highest = existingZIndexes[0];
    return Math.min(highest + 1, range.max);
  }

  private applyZIndex(entry: PanelStackEntry): void {
    if (entry.config.component && entry.config.component.element) {
      entry.config.component.element.style.zIndex = entry.config.zIndex.toString();
    }
  }

  private clearAllFocus(): void {
    this.panels.forEach(entry => {
      entry.focused = false;
    });
  }

  private removePanelFromFocusStack(panelId: string): void {
    const index = this.focusStack.indexOf(panelId);
    if (index > -1) {
      this.focusStack.splice(index, 1);
    }
  }

  private hideNonModalPanels(): void {
    const nonModalPanels = Array.from(this.panels.entries())
      .filter(([_, entry]) => entry.visible && !entry.config.modal)
      .map(([id, _]) => id);

    nonModalPanels.forEach(panelId => this.hidePanel(panelId));
  }

  private setupGlobalEventListeners(): void {
    // Handle escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const focusedPanel = this.getFocusedPanel();
        if (focusedPanel && focusedPanel.config.closable) {
          this.hidePanel(focusedPanel.config.id);
          event.preventDefault();
        }
      }
    });

    // Handle clicks outside panels
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside all modal panels
      const modalPanels = Array.from(this.panels.values())
        .filter(entry => entry.visible && entry.config.modal);

      for (const entry of modalPanels) {
        if (entry.config.component.element && 
            !entry.config.component.element.contains(target)) {
          if (entry.config.closable) {
            this.hidePanel(entry.config.id);
          }
        }
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.panels.clear();
    this.focusStack = [];
    this.removeAllListeners();
  }
}