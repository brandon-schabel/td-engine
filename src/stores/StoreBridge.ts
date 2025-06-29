/**
 * StoreBridge - Integrates Zustand stores with the existing game architecture
 * Provides compatibility layer between class-based game and reactive stores
 */

import { uiStore, getUIState, UIPanelType } from './uiStore';
import { gameStore, getGameState } from './gameStore';
import type { Game } from '@/core/Game';

export class StoreBridge {
  private game: Game;
  private unsubscribers: (() => void)[] = [];
  
  constructor(game: Game) {
    this.game = game;
    this.setupSubscriptions();
    this.syncInitialState();
  }
  
  private setupSubscriptions(): void {
    // Sync currency changes from game to store
    const currencyInterval = setInterval(() => {
      const gameCurrency = this.game.getCurrency();
      const storeCurrency = getGameState().currency;
      if (gameCurrency !== storeCurrency) {
        gameStore.setState({ currency: gameCurrency });
      }
    }, 100);
    
    // Sync lives changes
    const livesInterval = setInterval(() => {
      const gameLives = this.game.getLives();
      const storeLives = getGameState().lives;
      if (gameLives !== storeLives) {
        gameStore.setState({ lives: gameLives });
      }
    }, 100);
    
    // Sync score changes
    const scoreInterval = setInterval(() => {
      const gameScore = this.game.getScore();
      const storeScore = getGameState().score;
      if (gameScore !== storeScore) {
        gameStore.setState({ score: gameScore });
      }
    }, 100);
    
    // Clean up intervals on destroy
    this.unsubscribers.push(
      () => clearInterval(currencyInterval),
      () => clearInterval(livesInterval),
      () => clearInterval(scoreInterval)
    );
    
    // Subscribe to store changes and update game
    this.unsubscribers.push(
      gameStore.subscribe(
        (state) => state.isPaused,
        (isPaused) => {
          if (isPaused) {
            this.game.pause();
          } else {
            this.game.resume();
          }
        }
      )
    );
  }
  
  private syncInitialState(): void {
    // Sync initial game state to stores
    gameStore.setState({
      currency: this.game.getCurrency(),
      lives: this.game.getLives(),
      score: this.game.getScore()
    });
  }
  
  /**
   * Create a UIStateManager-compatible API using Zustand store
   */
  public createUIStateManagerAdapter() {
    const store = getUIState();
    
    return {
      openPanel: (panelType: UIPanelType, metadata?: Record<string, any>) => {
        store.openPanel(panelType, metadata);
        return true;
      },
      
      closePanel: (panelType: UIPanelType) => {
        store.closePanel(panelType);
        return true;
      },
      
      togglePanel: (panelType: UIPanelType, metadata?: Record<string, any>) => {
        store.togglePanel(panelType, metadata);
        return true;
      },
      
      isPanelOpen: (panelType: UIPanelType) => {
        return store.isPanelOpen(panelType);
      },
      
      getOpenPanels: () => {
        return store.getOpenPanels();
      },
      
      getCurrentModal: () => {
        return getUIState().currentModal;
      },
      
      closeAllPanels: (includePersistent = false) => {
        store.closeAllPanels(includePersistent);
      },
      
      closeTransientPanels: () => {
        store.closeAllPanels(false);
      },
      
      getPanelMetadata: (panelType: UIPanelType) => {
        return store.getPanelMetadata(panelType);
      },
      
      updatePanelMetadata: (panelType: UIPanelType, metadata: Record<string, any>) => {
        store.updatePanelMetadata(panelType, metadata);
      },
      
      isInBuildMode: () => {
        return store.isInBuildMode();
      },
      
      enterBuildMode: (metadata?: Record<string, any>) => {
        store.enterBuildMode(metadata);
      },
      
      exitBuildMode: () => {
        store.exitBuildMode();
      }
    };
  }
  
  public destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

// API for getting game state in non-React context
export const getGameBridgeState = () => {
  const state = getGameState();
  return {
    currency: state.currency,
    lives: state.lives,
    score: state.score,
    isPaused: state.isPaused,
    currentWave: state.currentWave
  };
};