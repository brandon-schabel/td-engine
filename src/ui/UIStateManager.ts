/**
 * UIStateManager - Centralized UI state management system
 * 
 * Manages the state of all UI panels in the game, enforcing modal exclusivity,
 * tracking open/closed states, and broadcasting state change events.
 * 
 * Features:
 * - Single source of truth for UI panel states
 * - Modal exclusivity enforcement (only one modal at a time)
 * - Event broadcasting for state changes
 * - State persistence and restoration
 * - Integration with FloatingUIManager
 */

import { EventEmitter } from '@/utils/EventEmitter';
import type { UIController } from './UIController';

// UI Panel types that can be managed
export enum UIPanelType {
  PAUSE_MENU = 'pause-menu',
  SETTINGS = 'settings',
  TOWER_UPGRADE = 'tower-upgrade',
  PLAYER_UPGRADE = 'player-upgrade',
  INVENTORY = 'inventory',
  BUILD_MENU = 'build-menu',
  GAME_OVER = 'game-over',
  MAIN_MENU = 'main-menu',
  BUILD_MODE = 'build-mode',  // Special mode for tower placement
  PRE_GAME_CONFIG = 'pre-game-config'
}

// Panel configuration
export interface UIPanelConfig {
  id: UIPanelType;
  isModal: boolean;
  isExclusive: boolean; // If true, closes other exclusive panels
  allowMultiple: boolean; // If false, only one instance can exist
  persistent: boolean; // If true, survives game state changes
}

// Panel state
export interface UIPanelState {
  id: UIPanelType;
  isOpen: boolean;
  openedAt?: number;
  closedAt?: number;
  metadata?: Record<string, any>;
}

// Events emitted by UIStateManager
export interface UIStateEvents {
  panelOpened: { panel: UIPanelType; state: UIPanelState };
  panelClosed: { panel: UIPanelType; state: UIPanelState };
  panelToggled: { panel: UIPanelType; isOpen: boolean };
  modalChanged: { current: UIPanelType | null; previous: UIPanelType | null };
  stateChanged: { panels: Map<UIPanelType, UIPanelState> };
}

export class UIStateManager extends EventEmitter<UIStateEvents> {
  private panelStates: Map<UIPanelType, UIPanelState>;
  private panelConfigs: Map<UIPanelType, UIPanelConfig>;
  private currentModal: UIPanelType | null = null;
  private stateHistory: Array<{ timestamp: number; state: Map<UIPanelType, UIPanelState> }> = [];
  
  // Default panel configurations
  private readonly defaultConfigs: UIPanelConfig[] = [
    {
      id: UIPanelType.PAUSE_MENU,
      isModal: true,
      isExclusive: true,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.SETTINGS,
      isModal: true,
      isExclusive: true,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.TOWER_UPGRADE,
      isModal: false,
      isExclusive: true,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.PLAYER_UPGRADE,
      isModal: false,
      isExclusive: true,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.INVENTORY,
      isModal: false,
      isExclusive: true,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.BUILD_MENU,
      isModal: false,
      isExclusive: false,
      allowMultiple: true,
      persistent: false
    },
    {
      id: UIPanelType.GAME_OVER,
      isModal: true,
      isExclusive: true,
      allowMultiple: false,
      persistent: true
    },
    {
      id: UIPanelType.MAIN_MENU,
      isModal: true,
      isExclusive: true,
      allowMultiple: false,
      persistent: true
    },
    {
      id: UIPanelType.BUILD_MODE,
      isModal: false,
      isExclusive: false,
      allowMultiple: false,
      persistent: false
    },
    {
      id: UIPanelType.PRE_GAME_CONFIG,
      isModal: true,
      isExclusive: true,
      allowMultiple: false,
      persistent: true
    }
  ];

  constructor(_uiController: UIController) {
    super();
    this.panelStates = new Map();
    this.panelConfigs = new Map();
    
    // Initialize panel configurations
    this.defaultConfigs.forEach(config => {
      this.panelConfigs.set(config.id, config);
      this.panelStates.set(config.id, {
        id: config.id,
        isOpen: false
      });
    });
  }

  /**
   * Open a UI panel
   */
  public openPanel(
    panelType: UIPanelType, 
    metadata?: Record<string, any>,
    options?: { force?: boolean; skipAnimation?: boolean }
  ): boolean {
    const config = this.panelConfigs.get(panelType);
    if (!config) {
      console.warn(`Unknown panel type: ${panelType}`);
      return false;
    }

    const currentState = this.panelStates.get(panelType);
    if (!currentState) return false;

    // Check if already open
    if (currentState.isOpen && !options?.force) {
      return false;
    }

    // Handle modal exclusivity
    if (config.isModal) {
      this.closeCurrentModal(panelType);
    }

    // Handle exclusive panels (only if not a modal, as modals have their own handling)
    if (config.isExclusive && !config.isModal) {
      this.closeExclusivePanels(panelType);
    }

    // Update state
    const newState: UIPanelState = {
      ...currentState,
      isOpen: true,
      openedAt: Date.now(),
      metadata
    };

    this.panelStates.set(panelType, newState);

    // Update current modal
    if (config.isModal) {
      const previousModal = this.currentModal;
      this.currentModal = panelType;
      this.emit('modalChanged', { current: panelType, previous: previousModal });
    }

    // Save state history
    this.saveStateSnapshot();

    // Emit events
    this.emit('panelOpened', { panel: panelType, state: newState });
    this.emit('stateChanged', { panels: new Map(this.panelStates) });

    return true;
  }

  /**
   * Close a UI panel
   */
  public closePanel(panelType: UIPanelType): boolean {
    const currentState = this.panelStates.get(panelType);
    if (!currentState || !currentState.isOpen) {
      return false;
    }

    // Update state
    const newState: UIPanelState = {
      ...currentState,
      isOpen: false,
      closedAt: Date.now()
    };

    this.panelStates.set(panelType, newState);

    // Update current modal
    if (this.currentModal === panelType) {
      const previousModal = this.currentModal;
      this.currentModal = null;
      this.emit('modalChanged', { current: null, previous: previousModal });
    }

    // Save state history
    this.saveStateSnapshot();

    // Emit events
    this.emit('panelClosed', { panel: panelType, state: newState });
    this.emit('stateChanged', { panels: new Map(this.panelStates) });

    return true;
  }

  /**
   * Toggle a UI panel open/closed
   */
  public togglePanel(panelType: UIPanelType, metadata?: Record<string, any>): boolean {
    const state = this.panelStates.get(panelType);
    if (!state) return false;

    const result = state.isOpen 
      ? this.closePanel(panelType)
      : this.openPanel(panelType, metadata);

    if (result) {
      this.emit('panelToggled', { panel: panelType, isOpen: !state.isOpen });
    }

    return result;
  }

  /**
   * Check if a panel is open
   */
  public isPanelOpen(panelType: UIPanelType): boolean {
    const state = this.panelStates.get(panelType);
    return state?.isOpen || false;
  }

  /**
   * Get all open panels
   */
  public getOpenPanels(): UIPanelType[] {
    const openPanels: UIPanelType[] = [];
    this.panelStates.forEach((state, type) => {
      if (state.isOpen) {
        openPanels.push(type);
      }
    });
    return openPanels;
  }

  /**
   * Get current modal panel
   */
  public getCurrentModal(): UIPanelType | null {
    return this.currentModal;
  }

  /**
   * Close all panels (optionally excluding persistent ones)
   */
  public closeAllPanels(includePersistent = false): void {
    this.panelStates.forEach((state, type) => {
      if (state.isOpen) {
        const config = this.panelConfigs.get(type);
        if (includePersistent || !config?.persistent) {
          this.closePanel(type);
        }
      }
    });
  }

  /**
   * Close all non-persistent panels
   */
  public closeTransientPanels(): void {
    this.closeAllPanels(false);
  }

  /**
   * Get panel state
   */
  public getPanelState(panelType: UIPanelType): UIPanelState | undefined {
    return this.panelStates.get(panelType);
  }

  /**
   * Get panel metadata
   */
  public getPanelMetadata(panelType: UIPanelType): Record<string, any> | undefined {
    return this.panelStates.get(panelType)?.metadata;
  }

  /**
   * Update panel metadata
   */
  public updatePanelMetadata(panelType: UIPanelType, metadata: Record<string, any>): void {
    const state = this.panelStates.get(panelType);
    if (state) {
      state.metadata = { ...state.metadata, ...metadata };
      this.emit('stateChanged', { panels: new Map(this.panelStates) });
    }
  }

  /**
   * Get state snapshot for persistence
   */
  public getStateSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {
      timestamp: Date.now(),
      currentModal: this.currentModal,
      panels: {}
    };

    this.panelStates.forEach((state, type) => {
      snapshot.panels[type] = {
        isOpen: state.isOpen,
        metadata: state.metadata
      };
    });

    return snapshot;
  }

  /**
   * Restore state from snapshot
   */
  public restoreStateSnapshot(snapshot: Record<string, any>): void {
    if (!snapshot || !snapshot.panels) return;

    // Close all panels first
    this.closeAllPanels(true);

    // Restore panel states
    Object.entries(snapshot.panels).forEach(([type, state]: [string, any]) => {
      const panelType = type as UIPanelType;
      if (state.isOpen) {
        this.openPanel(panelType, state.metadata);
      }
    });
  }

  /**
   * Private: Close current modal if any
   */
  private closeCurrentModal(excludePanel?: UIPanelType): void {
    if (this.currentModal && this.currentModal !== excludePanel) {
      this.closePanel(this.currentModal);
    }
  }

  /**
   * Private: Close other exclusive panels
   */
  private closeExclusivePanels(excludePanel: UIPanelType): void {
    this.panelConfigs.forEach((config, type) => {
      if (type !== excludePanel && config.isExclusive && !config.isModal) {
        const state = this.panelStates.get(type);
        if (state?.isOpen) {
          this.closePanel(type);
        }
      }
    });
  }

  /**
   * Private: Save state history snapshot
   */
  private saveStateSnapshot(): void {
    // Add a small delay to ensure timestamps are different
    const timestamp = Date.now();
    
    // Ensure we don't have duplicate timestamps
    const lastSnapshot = this.stateHistory[this.stateHistory.length - 1];
    const adjustedTimestamp = lastSnapshot && lastSnapshot.timestamp >= timestamp 
      ? lastSnapshot.timestamp + 1 
      : timestamp;
    
    this.stateHistory.push({
      timestamp: adjustedTimestamp,
      state: new Map(this.panelStates)
    });

    // Keep only last 50 snapshots
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }
  }

  /**
   * Get state history for debugging
   */
  public getStateHistory(): typeof this.stateHistory {
    return [...this.stateHistory];
  }

  /**
   * Clear state and history
   */
  public reset(): void {
    this.closeAllPanels(true);
    this.stateHistory = [];
    this.currentModal = null;
  }

  /**
   * Check if in build mode
   */
  public isInBuildMode(): boolean {
    return this.isPanelOpen(UIPanelType.BUILD_MODE);
  }

  /**
   * Enable build mode (hides HUD/controls)
   */
  public enterBuildMode(metadata?: Record<string, any>): void {
    this.openPanel(UIPanelType.BUILD_MODE, metadata);
  }

  /**
   * Exit build mode (shows HUD/controls)
   */
  public exitBuildMode(): void {
    this.closePanel(UIPanelType.BUILD_MODE);
  }
}