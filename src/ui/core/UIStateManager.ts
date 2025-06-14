/**
 * UIStateManager - Centralized UI state management with reactive updates
 * Provides a reactive state system for UI components
 */

import { EventEmitter } from './EventEmitter';

export interface UIState {
  // Game state
  isGameRunning: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  gameWon: boolean;
  gameState: string;
  finalScore: number;
  
  // Wave and progression
  currentWave: number;
  lastCompletedWave: number;
  
  // Resources
  currency: number;
  lives: number;
  score: number;
  
  // Player state
  playerHealth: number;
  
  // Selection state
  selectedTowerType: string | null;
  selectedTower: any | null;
  hoverTower: any | null;
  
  // Statistics
  enemiesKilled: number;
  totalEnemiesSpawned: number;
  towersBuilt: number;
  
  // Affordability states
  canAffordTowers: Record<string, boolean>;
  canAffordPlayerUpgrades: Record<string, boolean>;
  canAffordTowerUpgrades: Record<string, boolean>;
  canAffordInventoryUpgrade: boolean;
  
  // UI panel visibility
  showBuildPanel: boolean;
  showPlayerUpgrades: boolean;
  showInventory: boolean;
  showSettings: boolean;
  showTowerUpgradePanel: boolean;
  
  // Modal state
  hasVisibleModal: boolean;
  
  // Input state
  mousePosition: {
    worldX: number;
    worldY: number;
    gridX: number;
    gridY: number;
  };
  
  [key: string]: any;
}

export class UIStateManager extends EventEmitter {
  private state: UIState;
  private computedValues: Map<string, () => any> = new Map();
  private subscriptions: Map<string, Set<(value: any) => void>> = new Map();

  constructor() {
    super();
    
    this.state = {
      // Game state
      isGameRunning: false,
      isPaused: false,
      isGameOver: false,
      gameWon: false,
      gameState: 'MENU',
      finalScore: 0,
      
      // Wave and progression
      currentWave: 0,
      lastCompletedWave: 0,
      
      // Resources
      currency: 100,
      lives: 10,
      score: 0,
      
      // Player state
      playerHealth: 100,
      
      // Selection state
      selectedTowerType: null,
      selectedTower: null,
      hoverTower: null,
      
      // Statistics
      enemiesKilled: 0,
      totalEnemiesSpawned: 0,
      towersBuilt: 0,
      
      // Affordability states
      canAffordTowers: {
        BASIC: true,
        SNIPER: false,
        RAPID: false,
        WALL: true
      },
      canAffordPlayerUpgrades: {
        damage: false,
        speed: false,
        fireRate: false,
        health: false
      },
      canAffordTowerUpgrades: {
        damage: false,
        range: false,
        fireRate: false,
        special: false
      },
      canAffordInventoryUpgrade: false,
      
      // UI panel visibility
      showBuildPanel: true,
      showPlayerUpgrades: false,
      showInventory: false,
      showSettings: false,
      showTowerUpgradePanel: false,
      
      // Modal state
      hasVisibleModal: false,
      
      // Input state
      mousePosition: {
        worldX: 0,
        worldY: 0,
        gridX: 0,
        gridY: 0
      }
    };
    
    // Setup computed values
    this.setupComputedValues();
  }

  /**
   * Get current state value
   */
  get<K extends keyof UIState>(key: K): UIState[K] {
    return this.state[key];
  }

  /**
   * Get entire state object (readonly)
   */
  getState(): Readonly<UIState> {
    return { ...this.state };
  }

  /**
   * Set state value(s) and notify subscribers
   */
  set<K extends keyof UIState>(key: K, value: UIState[K]): void;
  set(updates: Partial<UIState>): void;
  set<K extends keyof UIState>(keyOrUpdates: K | Partial<UIState>, value?: UIState[K]): void {
    const updates = typeof keyOrUpdates === 'string' 
      ? { [keyOrUpdates]: value } as Partial<UIState>
      : keyOrUpdates;
    
    const prevState = { ...this.state };
    Object.assign(this.state, updates);
    
    // Notify specific subscribers
    Object.entries(updates).forEach(([key, newValue]) => {
      if (prevState[key] !== newValue) {
        this.notifySubscribers(key, newValue);
        this.emit('stateChanged', { key, value: newValue, prevValue: prevState[key] });
      }
    });
    
    // Update computed values
    this.updateComputedValues();
    
    // Emit global state change
    this.emit('stateUpdate', this.state);
  }

  /**
   * Subscribe to state changes for a specific key
   */
  subscribe<K extends keyof UIState>(key: K, callback: (value: UIState[K]) => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback as any);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(key)?.delete(callback as any);
    };
  }

  /**
   * Subscribe to multiple state keys
   */
  subscribeMultiple<K extends keyof UIState>(
    keys: K[], 
    callback: (state: Pick<UIState, K>) => void
  ): () => void {
    const unsubscribers: (() => void)[] = [];
    
    keys.forEach(key => {
      const unsubscribe = this.subscribe(key, () => {
        const relevantState = {} as Pick<UIState, K>;
        keys.forEach(k => {
          relevantState[k] = this.state[k];
        });
        callback(relevantState);
      });
      unsubscribers.push(unsubscribe);
    });
    
    // Return function to unsubscribe from all
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Create a computed value that updates when dependencies change
   */
  computed<T>(dependencies: (keyof UIState)[], computer: (state: UIState) => T): () => T {
    const computeValue = () => computer(this.state);
    const key = `computed_${Date.now()}_${Math.random()}`;
    
    this.computedValues.set(key, computeValue);
    
    // Subscribe to dependency changes
    dependencies.forEach(dep => {
      this.subscribe(dep, () => {
        this.emit('computedUpdate', { key, value: computeValue() });
      });
    });
    
    return computeValue;
  }

  /**
   * Batch multiple state updates
   */
  batch(updater: (state: UIState) => Partial<UIState>): void {
    const updates = updater({ ...this.state });
    this.set(updates);
  }

  /**
   * Setup computed values that derive from multiple state properties
   */
  private setupComputedValues(): void {
    // Game progress percentage (0-100)
    this.computedValues.set('gameProgress', () => {
      const maxWaves = 20; // Could come from config
      return Math.min((this.state.currentWave / maxWaves) * 100, 100);
    });
    
    // Player health percentage
    this.computedValues.set('playerHealthPercent', () => {
      return Math.max(0, Math.min(100, this.state.playerHealth));
    });
    
    // Survival rate
    this.computedValues.set('survivalRate', () => {
      if (this.state.totalEnemiesSpawned === 0) return 100;
      return Math.round((this.state.enemiesKilled / this.state.totalEnemiesSpawned) * 100);
    });
    
    // Can place any tower
    this.computedValues.set('canPlaceAnyTower', () => {
      return Object.values(this.state.canAffordTowers).some(affordable => affordable);
    });
    
    // Has any affordable upgrades
    this.computedValues.set('hasAffordableUpgrades', () => {
      return Object.values(this.state.canAffordPlayerUpgrades).some(affordable => affordable) ||
             Object.values(this.state.canAffordTowerUpgrades).some(affordable => affordable) ||
             this.state.canAffordInventoryUpgrade;
    });
    
    // Game status text
    this.computedValues.set('gameStatusText', () => {
      if (this.state.isGameOver) {
        return this.state.gameWon ? 'Victory!' : 'Game Over';
      }
      if (this.state.isPaused) {
        return 'Paused';
      }
      if (this.state.isGameRunning) {
        return `Wave ${this.state.currentWave}`;
      }
      return 'Menu';
    });
    
    // Resource status (low/critical warnings)
    this.computedValues.set('resourceStatus', () => {
      const status: { lives: string; currency: string; health: string } = {
        lives: 'normal',
        currency: 'normal',
        health: 'normal'
      };
      
      if (this.state.lives <= 1) status.lives = 'critical';
      else if (this.state.lives <= 3) status.lives = 'low';
      
      if (this.state.currency < 20) status.currency = 'low';
      
      if (this.state.playerHealth <= 25) status.health = 'critical';
      else if (this.state.playerHealth <= 50) status.health = 'low';
      
      return status;
    });
  }

  /**
   * Get computed value
   */
  getComputed(key: string): any {
    const computer = this.computedValues.get(key);
    return computer ? computer() : undefined;
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    const defaultState: UIState = {
      // Game state
      isGameRunning: false,
      isPaused: false,
      isGameOver: false,
      gameWon: false,
      gameState: 'MENU',
      finalScore: 0,
      
      // Wave and progression
      currentWave: 0,
      lastCompletedWave: 0,
      
      // Resources
      currency: 100,
      lives: 10,
      score: 0,
      
      // Player state
      playerHealth: 100,
      
      // Selection state
      selectedTowerType: null,
      selectedTower: null,
      hoverTower: null,
      
      // Statistics
      enemiesKilled: 0,
      totalEnemiesSpawned: 0,
      towersBuilt: 0,
      
      // Affordability states
      canAffordTowers: {
        BASIC: true,
        SNIPER: false,
        RAPID: false,
        WALL: true
      },
      canAffordPlayerUpgrades: {
        damage: false,
        speed: false,
        fireRate: false,
        health: false
      },
      canAffordTowerUpgrades: {
        damage: false,
        range: false,
        fireRate: false,
        special: false
      },
      canAffordInventoryUpgrade: false,
      
      // UI panel visibility
      showBuildPanel: true,
      showPlayerUpgrades: false,
      showInventory: false,
      showSettings: false,
      showTowerUpgradePanel: false,
      
      // Modal state
      hasVisibleModal: false,
      
      // Input state
      mousePosition: {
        worldX: 0,
        worldY: 0,
        gridX: 0,
        gridY: 0
      }
    };
    
    this.set(defaultState);
  }

  /**
   * Notify subscribers of state changes
   */
  private notifySubscribers(key: string, value: any): void {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in UI state subscriber for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Update all computed values
   */
  private updateComputedValues(): void {
    this.computedValues.forEach((computer, key) => {
      try {
        const value = computer();
        this.emit('computedUpdate', { key, value });
      } catch (error) {
        console.error(`Error updating computed value ${key}:`, error);
      }
    });
  }

  /**
   * Cleanup all subscriptions
   */
  destroy(): void {
    this.subscriptions.clear();
    this.computedValues.clear();
    this.removeAllListeners();
  }

  /**
   * Toggle boolean state values
   */
  toggle(key: keyof UIState): void {
    const currentValue = this.get(key);
    if (typeof currentValue === 'boolean') {
      this.set(key, !currentValue as any);
    }
  }

  /**
   * Increment numeric state values
   */
  increment(key: keyof UIState, amount: number = 1): void {
    const currentValue = this.get(key);
    if (typeof currentValue === 'number') {
      this.set(key, (currentValue + amount) as any);
    }
  }

  /**
   * Utility methods for common UI state patterns
   */
  showPanel(panelName: 'buildPanel' | 'playerUpgrades' | 'inventory' | 'settings'): void {
    const key = `show${panelName.charAt(0).toUpperCase() + panelName.slice(1)}` as keyof UIState;
    this.set(key, true as any);
  }

  hidePanel(panelName: 'buildPanel' | 'playerUpgrades' | 'inventory' | 'settings'): void {
    const key = `show${panelName.charAt(0).toUpperCase() + panelName.slice(1)}` as keyof UIState;
    this.set(key, false as any);
  }

  togglePanel(panelName: 'buildPanel' | 'playerUpgrades' | 'inventory' | 'settings'): void {
    const key = `show${panelName.charAt(0).toUpperCase() + panelName.slice(1)}` as keyof UIState;
    this.toggle(key);
  }

  hideAllPanels(): void {
    this.set({
      showBuildPanel: false,
      showPlayerUpgrades: false,
      showInventory: false,
      showSettings: false
    });
  }
}