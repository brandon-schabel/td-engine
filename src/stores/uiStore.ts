/**
 * UI Store - Centralized UI state management using Zustand
 * Replaces the class-based UIStateManager with a simpler, more reactive solution
 */

import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// UI Panel types
export enum UIPanelType {
  PAUSE_MENU = 'pause-menu',
  SETTINGS = 'settings',
  TOWER_UPGRADE = 'tower-upgrade',
  PLAYER_UPGRADE = 'player-upgrade',
  INVENTORY = 'inventory',
  BUILD_MENU = 'build-menu',
  GAME_OVER = 'game-over',
  MAIN_MENU = 'main-menu',
  BUILD_MODE = 'build-mode',
  PRE_GAME_CONFIG = 'pre-game-config'
}

// Panel configuration
export interface UIPanelConfig {
  isModal: boolean;
  isExclusive: boolean;
  allowMultiple: boolean;
  persistent: boolean;
}

// Panel state
export interface UIPanelState {
  isOpen: boolean;
  openedAt?: number;
  closedAt?: number;
  metadata?: Record<string, any>;
}

// Store state interface
interface UIStore {
  // State
  panels: Record<UIPanelType, UIPanelState>;
  currentModal: UIPanelType | null;
  
  // Actions
  openPanel: (panel: UIPanelType, metadata?: Record<string, any>) => void;
  closePanel: (panel: UIPanelType) => void;
  togglePanel: (panel: UIPanelType, metadata?: Record<string, any>) => void;
  closeAllPanels: (includePersistent?: boolean) => void;
  updatePanelMetadata: (panel: UIPanelType, metadata: Record<string, any>) => void;
  enterBuildMode: (metadata?: Record<string, any>) => void;
  exitBuildMode: () => void;
  
  // Selectors
  isPanelOpen: (panel: UIPanelType) => boolean;
  getOpenPanels: () => UIPanelType[];
  isInBuildMode: () => boolean;
  getPanelMetadata: (panel: UIPanelType) => Record<string, any> | undefined;
}

// Panel configurations
const panelConfigs: Record<UIPanelType, UIPanelConfig> = {
  [UIPanelType.PAUSE_MENU]: {
    isModal: true,
    isExclusive: true,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.SETTINGS]: {
    isModal: true,
    isExclusive: true,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.TOWER_UPGRADE]: {
    isModal: false,
    isExclusive: true,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.PLAYER_UPGRADE]: {
    isModal: false,
    isExclusive: true,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.INVENTORY]: {
    isModal: false,
    isExclusive: true,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.BUILD_MENU]: {
    isModal: false,
    isExclusive: false,
    allowMultiple: true,
    persistent: false
  },
  [UIPanelType.GAME_OVER]: {
    isModal: true,
    isExclusive: true,
    allowMultiple: false,
    persistent: true
  },
  [UIPanelType.MAIN_MENU]: {
    isModal: true,
    isExclusive: true,
    allowMultiple: false,
    persistent: true
  },
  [UIPanelType.BUILD_MODE]: {
    isModal: false,
    isExclusive: false,
    allowMultiple: false,
    persistent: false
  },
  [UIPanelType.PRE_GAME_CONFIG]: {
    isModal: true,
    isExclusive: true,
    allowMultiple: false,
    persistent: true
  }
};

// Initialize default panel states
const initialPanels: Record<UIPanelType, UIPanelState> = Object.values(UIPanelType).reduce(
  (acc, panel) => ({
    ...acc,
    [panel]: { isOpen: false }
  }),
  {} as Record<UIPanelType, UIPanelState>
);

// Create the store
export const uiStore = createStore<UIStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      panels: initialPanels,
      currentModal: null,
      
      // Actions
      openPanel: (panel, metadata) => {
        const config = panelConfigs[panel];
        if (!config) return;
        
        set((state) => {
          const newState = { ...state };
          
          // Handle modal exclusivity
          if (config.isModal && state.currentModal && state.currentModal !== panel) {
            newState.panels[state.currentModal] = {
              ...newState.panels[state.currentModal],
              isOpen: false,
              closedAt: Date.now()
            };
          }
          
          // Handle exclusive panels
          if (config.isExclusive && !config.isModal) {
            Object.entries(panelConfigs).forEach(([type, cfg]) => {
              if (type !== panel && cfg.isExclusive && !cfg.isModal && state.panels[type as UIPanelType].isOpen) {
                newState.panels[type as UIPanelType] = {
                  ...newState.panels[type as UIPanelType],
                  isOpen: false,
                  closedAt: Date.now()
                };
              }
            });
          }
          
          // Open the panel
          newState.panels[panel] = {
            ...newState.panels[panel],
            isOpen: true,
            openedAt: Date.now(),
            metadata
          };
          
          // Update current modal
          if (config.isModal) {
            newState.currentModal = panel;
          }
          
          return newState;
        });
      },
      
      closePanel: (panel) => {
        set((state) => ({
          ...state,
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              isOpen: false,
              closedAt: Date.now()
            }
          },
          currentModal: state.currentModal === panel ? null : state.currentModal
        }));
      },
      
      togglePanel: (panel, metadata) => {
        const state = get();
        if (state.panels[panel].isOpen) {
          state.closePanel(panel);
        } else {
          state.openPanel(panel, metadata);
        }
      },
      
      closeAllPanels: (includePersistent = false) => {
        set((state) => {
          const newPanels = { ...state.panels };
          
          Object.entries(panelConfigs).forEach(([type, config]) => {
            if (state.panels[type as UIPanelType].isOpen && (includePersistent || !config.persistent)) {
              newPanels[type as UIPanelType] = {
                ...newPanels[type as UIPanelType],
                isOpen: false,
                closedAt: Date.now()
              };
            }
          });
          
          return {
            ...state,
            panels: newPanels,
            currentModal: null
          };
        });
      },
      
      updatePanelMetadata: (panel, metadata) => {
        set((state) => ({
          ...state,
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              metadata: { ...state.panels[panel].metadata, ...metadata }
            }
          }
        }));
      },
      
      enterBuildMode: (metadata) => {
        get().openPanel(UIPanelType.BUILD_MODE, metadata);
      },
      
      exitBuildMode: () => {
        get().closePanel(UIPanelType.BUILD_MODE);
      },
      
      // Selectors
      isPanelOpen: (panel) => {
        return get().panels[panel]?.isOpen || false;
      },
      
      getOpenPanels: () => {
        return Object.entries(get().panels)
          .filter(([_, state]) => state.isOpen)
          .map(([type]) => type as UIPanelType);
      },
      
      isInBuildMode: () => {
        return get().panels[UIPanelType.BUILD_MODE]?.isOpen || false;
      },
      
      getPanelMetadata: (panel) => {
        return get().panels[panel]?.metadata;
      }
    })),
    {
      name: 'ui-store'
    }
  )
);

// Store API
export const getUIState = () => uiStore.getState();
export const subscribeToUIStore = (callback: (state: UIStore) => void) => uiStore.subscribe(callback);

// Subscribe to specific panel changes
export const subscribeToPanel = (
  panel: UIPanelType,
  callback: (isOpen: boolean) => void
) => {
  return uiStore.subscribe(
    (state) => state.panels[panel].isOpen,
    callback
  );
};

// Subscribe to modal changes
export const subscribeToModal = (
  callback: (currentModal: UIPanelType | null) => void
) => {
  return uiStore.subscribe(
    (state) => state.currentModal,
    callback
  );
};