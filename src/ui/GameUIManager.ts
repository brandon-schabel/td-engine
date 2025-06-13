/**
 * GameUIManager - Centralized UI management for the tower defense game
 * Coordinates all UI components and manages their lifecycle
 */

import { GameWithEvents, type GameEvents } from '../core/GameWithEvents';
import { TouchInputSystem } from './core/TouchInputSystem';
import { ResponsiveUtils } from './components/Layout';
import { Toast } from './components/Toast';
import type { Component } from './core/Component';

export interface UIComponents {
  hudOverlay?: Component<any>;
  towerSelectionPanel?: Component<any>;
  upgradePanel?: Component<any>;
  touchControlsPanel?: Component<any>;
  instructionsPanel?: Component<any>;
  audioControlPanel?: Component<any>;
  gameStateOverlay?: Component<any>;
}

export interface GameUIManagerOptions {
  enableTouchControls?: boolean;
  enableHapticFeedback?: boolean;
  showInstructions?: boolean;
  autoHideInstructions?: boolean;
  debugMode?: boolean;
}

export class GameUIManager {
  private game: GameWithEvents;
  private components: UIComponents = {};
  private touchInputSystem: TouchInputSystem | null = null;
  private options: GameUIManagerOptions;
  private isInitialized: boolean = false;
  private isMobile: boolean;
  
  // UI state
  private currentGameState: any = null;
  private selectedTowerType: any = null;
  private selectedTower: any = null;
  
  constructor(game: GameWithEvents, options: GameUIManagerOptions = {}) {
    this.game = game;
    this.options = {
      enableTouchControls: true,
      enableHapticFeedback: true,
      showInstructions: true,
      autoHideInstructions: true,
      debugMode: false,
      ...options
    };
    
    this.isMobile = ResponsiveUtils.isMobile();
    
    // Subscribe to all game events
    this.setupGameEventListeners();
  }

  /**
   * Initialize the UI system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Setup touch input system if enabled and on mobile
      if (this.options.enableTouchControls && this.isMobile) {
        await this.initializeTouchControls();
      }
      
      // Initialize all UI components
      await this.initializeComponents();
      
      // Setup global UI event listeners
      this.setupGlobalEventListeners();
      
      this.isInitialized = true;
      
      this.log('UI Manager initialized successfully');
      
      // Show welcome notification
      if (!this.isMobile) {
        Toast.show({
          message: 'Game UI loaded! Press H for help.',
          type: 'info',
          duration: 3000
        });
      } else {
        Toast.show({
          message: 'Touch controls enabled! Tap the help button for instructions.',
          type: 'info',
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Failed to initialize UI Manager:', error);
      Toast.show({
        message: 'Failed to initialize UI. Some features may not work properly.',
        type: 'error',
        duration: 5000
      });
    }
  }

  /**
   * Initialize touch controls
   */
  private async initializeTouchControls(): Promise<void> {
    const canvas = this.game.getCanvas?.() || document.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas not found for touch input system');
    }
    
    this.touchInputSystem = new TouchInputSystem({
      canvas: canvas as HTMLCanvasElement,
      game: this.game,
      enableVirtualControls: true,
      enableGestures: true,
      hapticFeedback: this.options.enableHapticFeedback
    });
    
    // Setup touch event handlers
    this.setupTouchEventHandlers();
    
    this.log('Touch controls initialized');
  }

  /**
   * Initialize all UI components
   */
  private async initializeComponents(): Promise<void> {
    // Import components dynamically to avoid circular dependencies
    const { HUDOverlay } = await import('./components/game/HUDOverlay');
    const { TowerSelectionPanel } = await import('./components/game/TowerSelectionPanel');
    const { UpgradePanel } = await import('./components/game/UpgradePanel');
    const { TouchControlsPanel } = await import('./components/game/TouchControlsPanel');
    const { InstructionsPanel } = await import('./components/game/InstructionsPanel');
    const { AudioControlPanel } = await import('./components/game/AudioControlPanel');
    const { GameStateOverlay } = await import('./components/game/GameStateOverlay');
    
    // Create and mount components
    await this.createComponent('hudOverlay', HUDOverlay, '#hud-container');
    await this.createComponent('towerSelectionPanel', TowerSelectionPanel, '#tower-selection-container');
    await this.createComponent('upgradePanel', UpgradePanel, '#upgrade-container');
    
    // Touch controls only on mobile
    if (this.isMobile && this.options.enableTouchControls) {
      await this.createComponent('touchControlsPanel', TouchControlsPanel, '#touch-controls-container');
    }
    
    // Optional components
    if (this.options.showInstructions) {
      await this.createComponent('instructionsPanel', InstructionsPanel, '#instructions-container');
    }
    
    await this.createComponent('audioControlPanel', AudioControlPanel, '#audio-container');
    await this.createComponent('gameStateOverlay', GameStateOverlay, '#game-state-container');
    
    this.log(`Initialized ${Object.keys(this.components).length} UI components`);
  }

  /**
   * Create and mount a UI component
   */
  private async createComponent<T extends Component<any>>(
    key: keyof UIComponents,
    ComponentClass: new (...args: any[]) => T,
    containerSelector: string,
    props: any = {}
  ): Promise<void> {
    try {
      // Find or create container
      let container = document.querySelector(containerSelector) as HTMLElement;
      if (!container) {
        container = document.createElement('div');
        container.id = containerSelector.slice(1); // Remove the # from selector
        document.body.appendChild(container);
      }
      
      // Create component with game reference
      const component = new ComponentClass({
        game: this.game,
        uiManager: this,
        isMobile: this.isMobile,
        ...props
      });
      
      // Mount component
      component.mount(container);
      
      // Store reference
      this.components[key] = component;
      
      this.log(`Created component: ${key}`);
      
    } catch (error) {
      console.error(`Failed to create component ${key}:`, error);
    }
  }

  /**
   * Setup game event listeners
   */
  private setupGameEventListeners(): void {
    // Resource changes
    this.game.on('currencyChanged', (data) => {
      this.updateComponentProp('hudOverlay', 'currency', data.amount);
      this.updateComponentProp('towerSelectionPanel', 'currency', data.amount);
      this.updateComponentProp('upgradePanel', 'currency', data.amount);
    });
    
    this.game.on('livesChanged', (data) => {
      this.updateComponentProp('hudOverlay', 'lives', data.amount);
      
      // Show warning when lives are low
      if (data.amount <= 3 && data.amount < data.previous) {
        Toast.show({
          message: `Warning: Only ${data.amount} lives remaining!`,
          type: 'warning',
          duration: 3000
        });
      }
    });
    
    this.game.on('scoreChanged', (data) => {
      this.updateComponentProp('hudOverlay', 'score', data.amount);
    });
    
    // Wave events
    this.game.on('waveStarted', (data) => {
      this.updateComponentProp('hudOverlay', 'currentWave', data.waveNumber);
      Toast.show({
        message: `Wave ${data.waveNumber} started!`,
        type: 'info',
        duration: 2000
      });
    });
    
    // Tower events
    this.game.on('towerPlaced', (data) => {
      Toast.show({
        message: `Tower placed! (-$${data.cost})`,
        type: 'success',
        duration: 2000
      });
    });
    
    this.game.on('towerSelected', (data) => {
      this.selectedTower = data.tower;
      this.updateComponentProp('upgradePanel', 'selectedTower', data.tower);
      this.updateComponentProp('upgradePanel', 'visible', !!data.tower);
    });
    
    this.game.on('selectedTowerTypeChanged', (data) => {
      this.selectedTowerType = data.type;
      this.updateComponentProp('towerSelectionPanel', 'selectedType', data.type);
    });
    
    // Game state events
    this.game.on('gameStateChanged', (data) => {
      this.currentGameState = data.state;
      this.updateComponentProp('gameStateOverlay', 'gameState', data.state);
      
      // Handle specific state changes
      this.handleGameStateChange(data.state, data.previous);
    });
    
    this.game.on('gamePaused', () => {
      Toast.show({
        message: 'Game Paused',
        type: 'info',
        duration: 1000
      });
    });
    
    this.game.on('gameResumed', () => {
      Toast.show({
        message: 'Game Resumed',
        type: 'info',
        duration: 1000
      });
    });
    
    this.game.on('gameOver', (data) => {
      this.handleGameOver(data.won, data.score);
    });
    
    this.log('Game event listeners setup complete');
  }

  /**
   * Setup touch event handlers
   */
  private setupTouchEventHandlers(): void {
    if (!this.touchInputSystem) return;
    
    this.touchInputSystem.on('tap', (event) => {
      // Handle tap events
      this.log('Touch tap detected');
    });
    
    this.touchInputSystem.on('doubletap', (event) => {
      // Double tap to pause/resume
      if (this.game.isPaused()) {
        this.game.resume();
      } else {
        this.game.pause();
      }
    });
    
    this.touchInputSystem.on('press', (event) => {
      // Long press for context actions
      this.log('Touch long press detected');
    });
    
    this.touchInputSystem.on('virtualcontrol', (event) => {
      // Handle virtual control events (already implemented in TouchInputSystem)
      this.log(`Virtual control: ${event.type} - ${event.action}`);
    });
  }

  /**
   * Setup global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcut(event);
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
    
    // Visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.game.isPaused()) {
        this.game.pause();
        Toast.show({
          message: 'Game paused (tab hidden)',
          type: 'info',
          duration: 2000
        });
      }
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcut(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case 'h':
        this.toggleInstructions();
        break;
      case 'u':
        this.togglePlayerUpgrades();
        break;
      case 'm':
        this.toggleAudioControls();
        break;
      case 'escape':
        this.handleEscapeKey();
        break;
    }
  }

  /**
   * Handle window resize
   */
  private handleWindowResize(): void {
    // Update mobile detection
    const wasMobile = this.isMobile;
    this.isMobile = ResponsiveUtils.isMobile();
    
    if (wasMobile !== this.isMobile) {
      // Mobile state changed, reinitialize components
      this.reinitializeForDeviceChange();
    }
    
    // Update all components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.forceUpdate === 'function') {
        component.forceUpdate();
      }
    });
  }

  /**
   * Handle game state changes
   */
  private handleGameStateChange(newState: any, previousState: any): void {
    // Update UI visibility based on game state
    const isPlaying = newState === 'PLAYING';
    
    this.updateComponentProp('hudOverlay', 'visible', isPlaying);
    this.updateComponentProp('towerSelectionPanel', 'visible', isPlaying);
    
    // Auto-hide instructions after first wave
    if (this.options.autoHideInstructions && newState === 'PLAYING' && this.game.getCurrentWave() >= 1) {
      this.updateComponentProp('instructionsPanel', 'minimized', true);
    }
  }

  /**
   * Handle game over
   */
  private handleGameOver(won: boolean, score: number): void {
    const message = won 
      ? `Victory! Final Score: ${score.toLocaleString()}`
      : `Game Over! Final Score: ${score.toLocaleString()}`;
    
    Toast.show({
      message,
      type: won ? 'success' : 'error',
      duration: 5000
    });
  }

  /**
   * UI Action Methods
   */
  
  toggleInstructions(): void {
    const panel = this.components.instructionsPanel;
    if (panel && typeof panel.toggle === 'function') {
      panel.toggle();
    }
  }
  
  togglePlayerUpgrades(): void {
    const panel = this.components.upgradePanel;
    if (panel) {
      const isVisible = panel.getState?.()?.visible || false;
      this.updateComponentProp('upgradePanel', 'visible', !isVisible);
      this.updateComponentProp('upgradePanel', 'mode', 'player');
    }
  }
  
  toggleAudioControls(): void {
    const panel = this.components.audioControlPanel;
    if (panel && typeof panel.toggle === 'function') {
      panel.toggle();
    }
  }
  
  handleEscapeKey(): void {
    // Close any open panels
    this.updateComponentProp('upgradePanel', 'visible', false);
    this.game.setSelectedTowerType(null);
  }

  /**
   * Utility Methods
   */
  
  private updateComponentProp(componentKey: keyof UIComponents, prop: string, value: any): void {
    const component = this.components[componentKey];
    if (component && typeof component.updateProps === 'function') {
      component.updateProps({ [prop]: value });
    }
  }
  
  private reinitializeForDeviceChange(): void {
    // This is a complex operation - for now, just log it
    this.log(`Device type changed. Mobile: ${this.isMobile}`);
    
    // In a full implementation, we might need to:
    // 1. Destroy touch controls if switching to desktop
    // 2. Create touch controls if switching to mobile
    // 3. Adjust layout for new screen size
  }
  
  private log(message: string): void {
    if (this.options.debugMode) {
      console.log(`[GameUIManager] ${message}`);
    }
  }

  /**
   * Public API
   */
  
  getComponent<T extends Component<any>>(key: keyof UIComponents): T | undefined {
    return this.components[key] as T;
  }
  
  getGame(): GameWithEvents {
    return this.game;
  }
  
  getTouchInputSystem(): TouchInputSystem | null {
    return this.touchInputSystem;
  }
  
  isMobileDevice(): boolean {
    return this.isMobile;
  }
  
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
    Toast.show({ message, type, duration });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove game event listeners
    this.game.getEventEmitter().removeAllListeners();
    
    // Destroy all components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    // Destroy touch input system
    this.touchInputSystem?.destroy();
    
    // Remove global event listeners
    document.removeEventListener('keydown', this.handleKeyboardShortcut);
    window.removeEventListener('resize', this.handleWindowResize);
    
    this.log('UI Manager destroyed');
  }
}