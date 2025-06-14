/**
 * ButtonStateManager - Unified button state management with cooldowns and game integration
 * Manages button states, cooldowns, and action availability across the UI
 */

import { EventEmitter } from './EventEmitter';
import type { GameWithEvents } from '@/core/GameWithEvents';
import type { UIStateManager } from './UIStateManager';

export interface ButtonState {
  id: string;
  enabled: boolean;
  visible: boolean;
  loading: boolean;
  cooldownRemaining: number;
  cooldownTotal: number;
  lastUsed: number;
  usageCount: number;
  errorMessage?: string;
  successMessage?: string;
  icon?: string;
  text?: string;
  shortcut?: string;
  category: ButtonCategory;
}

export type ButtonCategory = 'tower' | 'upgrade' | 'action' | 'menu' | 'system';

export interface ButtonConfig {
  id: string;
  category: ButtonCategory;
  cooldownMs?: number;
  maxUsesPerWave?: number;
  requiresGameRunning?: boolean;
  requiresCurrency?: number;
  requiresSelectedTower?: boolean;
  enabledWhen?: (gameState: any, uiState: any) => boolean;
  onActivate?: () => Promise<void> | void;
  icon?: string;
  text?: string;
  shortcut?: string;
}

export class ButtonStateManager extends EventEmitter {
  private states: Map<string, ButtonState> = new Map();
  private configs: Map<string, ButtonConfig> = new Map();
  private game: GameWithEvents;
  private uiState: UIStateManager;
  private updateInterval: number | null = null;

  constructor(game: GameWithEvents, uiState: UIStateManager) {
    super();
    this.game = game;
    this.uiState = uiState;
    
    this.setupGameEventListeners();
    this.startUpdateLoop();
  }

  /**
   * Register a button with the manager
   */
  registerButton(config: ButtonConfig): void {
    this.configs.set(config.id, config);
    
    const initialState: ButtonState = {
      id: config.id,
      enabled: false,
      visible: true,
      loading: false,
      cooldownRemaining: 0,
      cooldownTotal: config.cooldownMs || 0,
      lastUsed: 0,
      usageCount: 0,
      category: config.category,
      icon: config.icon,
      text: config.text,
      shortcut: config.shortcut
    };

    this.states.set(config.id, initialState);
    this.updateButtonState(config.id);
    
    this.emit('buttonRegistered', { buttonId: config.id, state: initialState });
  }

  /**
   * Activate a button (execute its action)
   */
  async activateButton(buttonId: string): Promise<boolean> {
    const state = this.states.get(buttonId);
    const config = this.configs.get(buttonId);
    
    if (!state || !config) {
      console.warn(`Button ${buttonId} not found`);
      return false;
    }

    if (!this.canActivateButton(buttonId)) {
      this.emit('buttonActivationFailed', { 
        buttonId, 
        reason: state.errorMessage || 'Button not available' 
      });
      return false;
    }

    // Set loading state
    state.loading = true;
    state.errorMessage = undefined;
    this.emit('buttonStateChanged', { buttonId, state: { ...state } });

    try {
      // Execute the action
      if (config.onActivate) {
        await config.onActivate();
      }

      // Update usage tracking
      state.lastUsed = Date.now();
      state.usageCount++;
      
      // Start cooldown if configured
      if (config.cooldownMs && config.cooldownMs > 0) {
        state.cooldownRemaining = config.cooldownMs;
      }

      state.loading = false;
      state.successMessage = 'Action completed successfully';
      
      this.emit('buttonActivated', { buttonId, state: { ...state } });
      
      // Clear success message after delay
      setTimeout(() => {
        state.successMessage = undefined;
        this.emit('buttonStateChanged', { buttonId, state: { ...state } });
      }, 2000);

      return true;

    } catch (error) {
      state.loading = false;
      state.errorMessage = error instanceof Error ? error.message : 'Action failed';
      
      this.emit('buttonActivationFailed', { 
        buttonId, 
        reason: state.errorMessage,
        error 
      });
      
      // Clear error message after delay
      setTimeout(() => {
        state.errorMessage = undefined;
        this.emit('buttonStateChanged', { buttonId, state: { ...state } });
      }, 3000);

      return false;
    } finally {
      this.updateButtonState(buttonId);
    }
  }

  /**
   * Check if button can be activated
   */
  canActivateButton(buttonId: string): boolean {
    const state = this.states.get(buttonId);
    const config = this.configs.get(buttonId);
    
    if (!state || !config) return false;
    if (!state.visible || state.loading) return false;
    if (state.cooldownRemaining > 0) return false;

    // Check game running requirement
    if (config.requiresGameRunning && !this.uiState.get('isGameRunning')) {
      state.errorMessage = 'Game must be running';
      return false;
    }

    // Check currency requirement
    if (config.requiresCurrency && this.uiState.get('currency') < config.requiresCurrency) {
      state.errorMessage = `Requires $${config.requiresCurrency}`;
      return false;
    }

    // Check selected tower requirement
    if (config.requiresSelectedTower && !this.uiState.get('selectedTower')) {
      state.errorMessage = 'Select a tower first';
      return false;
    }

    // Check wave usage limit
    if (config.maxUsesPerWave) {
      const currentWave = this.uiState.get('currentWave');
      const waveUsageKey = `${buttonId}_wave_${currentWave}`;
      const waveUsage = this.getWaveUsage(waveUsageKey);
      
      if (waveUsage >= config.maxUsesPerWave) {
        state.errorMessage = `Max ${config.maxUsesPerWave} uses per wave`;
        return false;
      }
    }

    // Check custom enabled condition
    if (config.enabledWhen) {
      const gameState = this.getGameState();
      const uiStateData = this.uiState.getState();
      
      if (!config.enabledWhen(gameState, uiStateData)) {
        state.errorMessage = 'Action not available';
        return false;
      }
    }

    state.errorMessage = undefined;
    return true;
  }

  /**
   * Get button state
   */
  getButtonState(buttonId: string): ButtonState | null {
    const state = this.states.get(buttonId);
    return state ? { ...state } : null;
  }

  /**
   * Get all button states for a category
   */
  getButtonsByCategory(category: ButtonCategory): ButtonState[] {
    return Array.from(this.states.values())
      .filter(state => state.category === category)
      .map(state => ({ ...state }));
  }

  /**
   * Update button visibility
   */
  setButtonVisibility(buttonId: string, visible: boolean): void {
    const state = this.states.get(buttonId);
    if (state && state.visible !== visible) {
      state.visible = visible;
      this.emit('buttonStateChanged', { buttonId, state: { ...state } });
    }
  }

  /**
   * Force update button state
   */
  updateButtonState(buttonId: string): void {
    const state = this.states.get(buttonId);
    const config = this.configs.get(buttonId);
    
    if (!state || !config) return;

    const wasEnabled = state.enabled;
    state.enabled = this.canActivateButton(buttonId);
    
    if (wasEnabled !== state.enabled) {
      this.emit('buttonStateChanged', { buttonId, state: { ...state } });
    }
  }

  /**
   * Update all button states
   */
  updateAllButtonStates(): void {
    this.states.forEach((_, buttonId) => {
      this.updateButtonState(buttonId);
    });
  }

  /**
   * Get buttons that are currently on cooldown
   */
  getButtonsOnCooldown(): ButtonState[] {
    return Array.from(this.states.values())
      .filter(state => state.cooldownRemaining > 0)
      .map(state => ({ ...state }));
  }

  /**
   * Reset wave-specific usage counters
   */
  resetWaveUsage(): void {
    // Clear wave usage tracking when new wave starts
    const currentWave = this.uiState.get('currentWave');
    
    // Store previous wave data for reference
    this.emit('waveUsageReset', { wave: currentWave });
  }

  /**
   * Reset all button states
   */
  resetAllStates(): void {
    this.states.forEach(state => {
      state.usageCount = 0;
      state.lastUsed = 0;
      state.cooldownRemaining = 0;
      state.loading = false;
      state.errorMessage = undefined;
      state.successMessage = undefined;
    });
    
    this.updateAllButtonStates();
    this.emit('allStatesReset');
  }

  /**
   * Private methods
   */

  private setupGameEventListeners(): void {
    // Update button states on relevant game events
    this.game.on('currencyChanged', () => {
      this.updateAllButtonStates();
    });

    this.game.on('gameStateChanged', () => {
      this.updateAllButtonStates();
    });

    this.game.on('towerSelected', () => {
      this.updateAllButtonStates();
    });

    this.game.on('waveStarted', () => {
      this.resetWaveUsage();
      this.updateAllButtonStates();
    });

    // Update UI state changes
    this.uiState.on('stateChanged', () => {
      this.updateAllButtonStates();
    });
  }

  private startUpdateLoop(): void {
    // Update cooldowns every 100ms
    this.updateInterval = setInterval(() => {
      this.updateCooldowns();
    }, 100) as any;
  }

  private updateCooldowns(): void {
    let anyUpdated = false;
    
    this.states.forEach((state, buttonId) => {
      if (state.cooldownRemaining > 0) {
        const newCooldown = Math.max(0, state.cooldownRemaining - 100);
        
        if (newCooldown !== state.cooldownRemaining) {
          state.cooldownRemaining = newCooldown;
          anyUpdated = true;
          
          if (newCooldown === 0) {
            this.emit('buttonCooldownComplete', { buttonId, state: { ...state } });
            this.updateButtonState(buttonId);
          } else {
            this.emit('buttonCooldownUpdate', { buttonId, state: { ...state } });
          }
        }
      }
    });

    if (anyUpdated) {
      this.emit('cooldownsUpdated');
    }
  }

  private getGameState(): any {
    return {
      currency: this.game.getCurrency(),
      lives: this.game.getLives(),
      score: this.game.getScore(),
      wave: this.game.getCurrentWave(),
      isPaused: this.game.isPaused(),
      isGameOver: this.game.isGameOverPublic(),
      selectedTower: this.game.getSelectedTower(),
      selectedTowerType: this.game.getSelectedTowerType(),
      towers: this.game.getTowers(),
      enemies: this.game.getEnemies()
    };
  }

  private waveUsageTracking: Map<string, number> = new Map();

  private getWaveUsage(key: string): number {
    return this.waveUsageTracking.get(key) || 0;
  }

  private incrementWaveUsage(key: string): void {
    const current = this.getWaveUsage(key);
    this.waveUsageTracking.set(key, current + 1);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.states.clear();
    this.configs.clear();
    this.waveUsageTracking.clear();
    this.removeAllListeners();
  }
}