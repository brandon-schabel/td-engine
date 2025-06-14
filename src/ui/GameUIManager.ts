/**
 * GameUIManager - Centralized UI management for the tower defense game
 * Coordinates all UI components and manages their lifecycle
 */

import { GameWithEvents, type GameEvents } from '../core/GameWithEvents';
import { TouchInputSystem } from './core/TouchInputSystem';
import { ResponsiveUtils } from './components/Layout';
import { Toast } from './components/Toast';
import type { Component } from './core/Component';
import { BuildPanel, type BuildPanelProps } from './components/game/BuildPanel';
import { ActionPanel, type ActionPanelProps } from './components/game/ActionPanel';
import { TowerUpgradePanel, type TowerUpgradePanelProps } from './components/game/TowerUpgradePanel';
import { UIStateManager } from './core/UIStateManager';
import { PanelManager, type PanelConfig } from './core/PanelManager';
import { ModalSystem } from './core/ModalSystem';
import { ButtonStateManager } from './core/ButtonStateManager';
import { UIPerformanceManager } from './core/UIPerformanceManager';

export interface UIComponents {
  hudOverlay?: Component<any>;
  buildPanel?: BuildPanel;
  actionPanel?: ActionPanel;
  towerUpgradePanel?: TowerUpgradePanel;
  touchControlsPanel?: Component<any>;
  instructionsPanel?: Component<any>;
  audioControlPanel?: Component<any>;
  gameStateOverlay?: Component<any>;
  // Legacy components (to be phased out)
  towerSelectionPanel?: Component<any>;
  upgradePanel?: Component<any>;
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
  private uiState: UIStateManager;
  private panelManager: PanelManager;
  private modalSystem: ModalSystem;
  private buttonStateManager: ButtonStateManager;
  private performanceManager: UIPerformanceManager;
  
  // Legacy UI state (to be phased out)
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
    this.uiState = new UIStateManager();
    this.panelManager = new PanelManager(this.game);
    this.modalSystem = new ModalSystem(this.panelManager, this.game);
    this.buttonStateManager = new ButtonStateManager(this.game, this.uiState);
    this.performanceManager = new UIPerformanceManager();
    
    // Subscribe to all game events
    this.setupGameEventListeners();
    
    // Subscribe to UI state changes
    this.setupUIStateHandlers();
    
    // Setup panel and modal event handlers
    this.setupPanelEventHandlers();
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
      
      // Apply performance optimizations
      this.optimizePerformance();
      
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
    const { HUDOverlay } = await import('./components/HUDOverlay');
    const { TouchControlsPanel } = await import('./components/TouchControlsPanel');
    const { InstructionsPanel } = await import('./components/InstructionsPanel');
    const { AudioControlPanel } = await import('./components/AudioControlPanel');
    const { GameStateOverlay } = await import('./components/game/GameStateOverlay');
    
    // Create modern UI components
    await this.createModernComponent('hudOverlay', HUDOverlay, '#hud-container');
    await this.createBuildPanel();
    await this.createActionPanel();
    await this.createTowerUpgradePanel();
    
    // Touch controls only on mobile
    if (this.isMobile && this.options.enableTouchControls) {
      await this.createModernComponent('touchControlsPanel', TouchControlsPanel, '#touch-controls-container');
    }
    
    // Optional components
    if (this.options.showInstructions) {
      await this.createModernComponent('instructionsPanel', InstructionsPanel, '#instructions-container');
    }
    
    await this.createModernComponent('audioControlPanel', AudioControlPanel, '#audio-container');
    await this.createModernComponent('gameStateOverlay', GameStateOverlay, '#game-state-container');
    
    this.log(`Initialized ${Object.keys(this.components).length} UI components`);
  }

  /**
   * Create and mount a modern UI component (GameComponent-based)
   */
  private async createModernComponent<T extends Component<any>>(
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
      
      this.log(`Created modern component: ${key}`);
      
    } catch (error) {
      console.error(`Failed to create component ${key}:`, error);
    }
  }

  /**
   * Create BuildPanel with panel manager integration
   */
  private async createBuildPanel(): Promise<void> {
    try {
      const buildPanel = new BuildPanel({
        game: this.game,
        uiManager: this,
        isMobile: this.isMobile,
        visible: true,
        initiallyMinimized: false,
        position: 'bottom-left',
        showShortcuts: true
      } as BuildPanelProps);
      
      buildPanel.mount(document.body);
      this.components.buildPanel = buildPanel;
      
      // Register with panel manager
      this.panelManager.registerPanel({
        id: 'buildPanel',
        component: buildPanel,
        zIndex: 1050,
        modal: false,
        pauseGame: false,
        closable: false,
        persistent: true,
        position: 'bottom-left',
        category: 'hud'
      });
      
      this.log('Created BuildPanel');
    } catch (error) {
      console.error('Failed to create BuildPanel:', error);
    }
  }

  /**
   * Create ActionPanel with panel manager integration
   */
  private async createActionPanel(): Promise<void> {
    try {
      const actionPanel = new ActionPanel({
        game: this.game,
        uiManager: this,
        isMobile: this.isMobile,
        visible: true,
        position: 'bottom-right',
        showLabels: !this.isMobile,
        compact: this.isMobile
      } as ActionPanelProps);
      
      actionPanel.mount(document.body);
      this.components.actionPanel = actionPanel;
      
      // Register with panel manager
      this.panelManager.registerPanel({
        id: 'actionPanel',
        component: actionPanel,
        zIndex: 1050,
        modal: false,
        pauseGame: false,
        closable: false,
        persistent: true,
        position: 'bottom-right',
        category: 'hud'
      });
      
      // Listen for action panel events
      actionPanel.on('toggleInventory', this.toggleInventory);
      actionPanel.on('showSettings', this.toggleAudioControls);
      
      this.log('Created ActionPanel');
    } catch (error) {
      console.error('Failed to create ActionPanel:', error);
    }
  }

  /**
   * Create TowerUpgradePanel with panel manager integration
   */
  private async createTowerUpgradePanel(): Promise<void> {
    try {
      const towerUpgradePanel = new TowerUpgradePanel({
        game: this.game,
        uiManager: this,
        isMobile: this.isMobile,
        visible: false, // Starts hidden
        autoPosition: true,
        showTowerStats: true,
        compactMode: this.isMobile
      } as TowerUpgradePanelProps);
      
      towerUpgradePanel.mount(document.body);
      this.components.towerUpgradePanel = towerUpgradePanel;
      
      // Register with panel manager
      this.panelManager.registerPanel({
        id: 'towerUpgradePanel',
        component: towerUpgradePanel,
        zIndex: 1150,
        modal: false,
        pauseGame: false,
        closable: true,
        persistent: false,
        position: 'custom',
        category: 'overlay'
      });
      
      this.log('Created TowerUpgradePanel');
    } catch (error) {
      console.error('Failed to create TowerUpgradePanel:', error);
    }
  }

  /**
   * Setup game event listeners
   */
  private setupGameEventListeners(): void {
    // Resource changes - update UI state
    this.game.on('currencyChanged', (data) => {
      this.uiState.set('currency', data.amount);
      
      // Legacy component updates (to be phased out)
      this.updateComponentProp('hudOverlay', 'currency', data.amount);
      
      // Update affordable states for all components
      this.updateAffordabilityStates();
    });
    
    this.game.on('livesChanged', (data) => {
      this.uiState.set('lives', data.amount);
      this.updateComponentProp('hudOverlay', 'lives', data.amount);
      
      // Show warning when lives are low
      if (data.amount <= 3 && data.amount < data.previous) {
        Toast.show({
          message: `Warning: Only ${data.amount} lives remaining!`,
          type: 'warning',
          duration: 3000
        });
      }
      
      // Critical warning at 1 life
      if (data.amount === 1) {
        Toast.show({
          message: 'CRITICAL: Last life remaining!',
          type: 'error',
          duration: 5000
        });
      }
    });
    
    this.game.on('scoreChanged', (data) => {
      this.uiState.set('score', data.amount);
      this.updateComponentProp('hudOverlay', 'score', data.amount);
    });
    
    // Wave events
    this.game.on('waveStarted', (data) => {
      this.uiState.set('currentWave', data.waveNumber);
      this.updateComponentProp('hudOverlay', 'currentWave', data.waveNumber);
      Toast.show({
        message: `Wave ${data.waveNumber} started!`,
        type: 'info',
        duration: 2000
      });
    });
    
    this.game.on('waveCompleted', (data) => {
      Toast.show({
        message: `Wave ${data.waveNumber} complete!`,
        type: 'success',
        duration: 2500
      });
      this.uiState.set('lastCompletedWave', data.waveNumber);
    });
    
    // Enemy events
    this.game.on('enemySpawned', (data) => {
      this.uiState.increment('totalEnemiesSpawned');
    });
    
    this.game.on('enemyKilled', (data) => {
      this.uiState.increment('enemiesKilled');
      this.uiState.increment('currency', data.reward);
      
      // Show reward notification for high-value enemies
      if (data.reward >= 10) {
        Toast.show({
          message: `+$${data.reward}`,
          type: 'success',
          duration: 1000
        });
      }
    });
    
    // Tower events
    this.game.on('towerPlaced', (data) => {
      Toast.show({
        message: `${data.tower.towerType} Tower placed! (-$${data.cost})`,
        type: 'success',
        duration: 2000
      });
      this.uiState.increment('towersBuilt');
      this.updateAffordabilityStates();
    });
    
    this.game.on('towerUpgraded', (data) => {
      Toast.show({
        message: `Tower upgraded! (-$${data.cost})`,
        type: 'success',
        duration: 1500
      });
      this.updateAffordabilityStates();
    });
    
    this.game.on('towerSold', (data) => {
      Toast.show({
        message: `Tower sold! (+$${data.refund})`,
        type: 'info',
        duration: 1500
      });
      this.updateAffordabilityStates();
    });
    
    this.game.on('towerSelected', (data) => {
      this.selectedTower = data.tower;
      this.uiState.set('selectedTower', data.tower);
      
      // Show tower upgrade panel if tower is selected
      if (data.tower && this.components.towerUpgradePanel) {
        this.components.towerUpgradePanel.show();
      } else if (!data.tower && this.components.towerUpgradePanel) {
        this.components.towerUpgradePanel.hide();
      }
    });
    
    this.game.on('selectedTowerTypeChanged', (data) => {
      this.selectedTowerType = data.type;
      this.uiState.set('selectedTowerType', data.type);
    });
    
    this.game.on('hoverTowerChanged', (data) => {
      this.uiState.set('hoverTower', data.tower);
    });
    
    // Player events
    this.game.on('playerDamaged', (data) => {
      this.uiState.set('playerHealth', data.remainingHealth);
      if (data.remainingHealth <= 25) {
        Toast.show({
          message: `Low health: ${data.remainingHealth}%`,
          type: 'warning',
          duration: 2000
        });
      }
    });
    
    this.game.on('playerHealed', (data) => {
      this.uiState.set('playerHealth', data.currentHealth);
      Toast.show({
        message: `+${data.amount} Health`,
        type: 'success',
        duration: 1000
      });
    });
    
    this.game.on('playerUpgraded', (data) => {
      Toast.show({
        message: `Player upgraded: ${data.upgradeType} (-$${data.cost})`,
        type: 'success',
        duration: 2500
      });
      this.updateAffordabilityStates();
    });
    
    // Game state events
    this.game.on('gameStateChanged', (data) => {
      this.currentGameState = data.state;
      this.uiState.set({
        isGameRunning: data.state === 'PLAYING',
        isGameOver: data.state === 'GAME_OVER' || data.state === 'VICTORY',
        gameState: data.state
      });
      this.updateComponentProp('gameStateOverlay', 'gameState', data.state);
      
      // Handle specific state changes
      this.handleGameStateChange(data.state, data.previous);
      
      // Notify panel manager of game state changes
      this.panelManager.handleGameStateChange(data.state);
    });
    
    this.game.on('gamePaused', () => {
      this.uiState.set('isPaused', true);
      Toast.show({
        message: 'Game Paused',
        type: 'info',
        duration: 1000
      });
    });
    
    this.game.on('gameResumed', () => {
      this.uiState.set('isPaused', false);
      Toast.show({
        message: 'Game Resumed',
        type: 'info',
        duration: 1000
      });
    });
    
    this.game.on('gameOver', (data) => {
      this.uiState.set({
        isGameOver: true,
        gameWon: data.won,
        finalScore: data.score
      });
      this.handleGameOver(data.won, data.score);
    });
    
    // Mouse position tracking for cursor effects
    this.game.on('mousePositionChanged', (data) => {
      this.uiState.set('mousePosition', {
        worldX: data.worldX,
        worldY: data.worldY,
        gridX: data.gridX,
        gridY: data.gridY
      });
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
    
    // Show/hide modern UI panels based on game state
    if (this.components.buildPanel) {
      if (isPlaying) {
        this.components.buildPanel.show();
      } else {
        this.components.buildPanel.hide();
      }
    }
    
    if (this.components.actionPanel) {
      if (isPlaying) {
        this.components.actionPanel.show();
      } else {
        this.components.actionPanel.hide();
      }
    }
    
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
    this.uiState.togglePanel('playerUpgrades');
    this.showNotification('Player upgrades panel coming soon!', 'info', 2000);
  }

  toggleInventory(): void {
    this.uiState.togglePanel('inventory');
    this.showNotification('Inventory panel coming soon!', 'info', 2000);
  }

  toggleSettings(): void {
    this.uiState.togglePanel('settings');
  }
  
  toggleAudioControls(): void {
    const panel = this.components.audioControlPanel;
    if (panel && typeof panel.toggle === 'function') {
      panel.toggle();
    }
  }
  
  handleEscapeKey(): void {
    // Close any open panels and deselect towers
    this.game.setSelectedTowerType(null);
    this.game.setSelectedTower(null);
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

  /**
   * Update affordability states for all towers and upgrades (with performance optimization)
   */
  private updateAffordabilityStates(): void {
    // Use performance manager to batch these expensive calculations
    this.performanceManager.queueUpdate({
      id: 'affordability_update',
      type: 'state',
      target: 'uiState',
      data: () => {
        // Get current currency
        const currency = this.game.getCurrency();
        
        // Check tower affordability
        const towerAffordability = {
          BASIC: this.game.canAffordTower('BASIC'),
          SNIPER: this.game.canAffordTower('SNIPER'),
          RAPID: this.game.canAffordTower('RAPID'),
          WALL: this.game.canAffordTower('WALL')
        };
        
        // Batch all updates
        const updates: any = {
          canAffordTowers: towerAffordability,
          canAffordPlayerUpgrades: {
            damage: this.game.canAffordPlayerUpgrade('DAMAGE'),
            speed: this.game.canAffordPlayerUpgrade('SPEED'),
            fireRate: this.game.canAffordPlayerUpgrade('FIRE_RATE'),
            health: this.game.canAffordPlayerUpgrade('HEALTH')
          },
          canAffordInventoryUpgrade: this.game.canUpgradeInventory()
        };
        
        // Update selected tower upgrade affordability if applicable
        const selectedTower = this.game.getSelectedTower();
        if (selectedTower) {
          updates.canAffordTowerUpgrades = {
            damage: this.game.canAffordUpgrade(selectedTower, 'DAMAGE'),
            range: this.game.canAffordUpgrade(selectedTower, 'RANGE'),
            fireRate: this.game.canAffordUpgrade(selectedTower, 'FIRE_RATE'),
            special: this.game.canAffordUpgrade(selectedTower, 'SPECIAL')
          };
        }
        
        // Apply all updates at once
        this.uiState.set(updates);
      },
      priority: 'medium'
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ui: this.performanceManager.getMetrics(),
      components: Object.keys(this.components).length,
      activePanels: this.panelManager.getVisiblePanels().length,
      modalVisible: this.modalSystem.hasVisibleModal()
    };
  }

  /**
   * Optimize UI for better performance
   */
  optimizePerformance(): void {
    // Create optimized updaters for frequently updated components
    const currencyUpdater = this.performanceManager.createUpdateScheduler<number>(
      'currency_display',
      (amount) => this.updateComponentProp('hudOverlay', 'currency', amount),
      { throttleMs: 100, priority: 'medium' }
    );

    const scoreUpdater = this.performanceManager.createUpdateScheduler<number>(
      'score_display', 
      (score) => this.updateComponentProp('hudOverlay', 'score', score),
      { throttleMs: 200, priority: 'low' }
    );

    // Replace direct updates with optimized versions
    this.game.on('currencyChanged', (data) => currencyUpdater(data.amount));
    this.game.on('scoreChanged', (data) => scoreUpdater(data.amount));

    this.log('Performance optimizations applied');
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
   * Setup UI state change handlers
   */
  private setupUIStateHandlers(): void {
    // Subscribe to panel visibility changes
    this.uiState.subscribe('showBuildPanel', (visible) => {
      if (visible) {
        this.panelManager.showPanel('buildPanel');
      } else {
        this.panelManager.hidePanel('buildPanel');
      }
    });
    
    this.uiState.subscribe('showTowerUpgradePanel', (visible) => {
      if (visible) {
        this.panelManager.showPanel('towerUpgradePanel');
      } else {
        this.panelManager.hidePanel('towerUpgradePanel');
      }
    });
    
    // Handle escape key to close all panels
    this.uiState.subscribe('selectedTowerType', (type) => {
      if (!type) {
        // Clear any panel selections when tower type is deselected
        this.handleEscapeKey();
      }
    });
  }

  /**
   * Setup panel and modal event handlers
   */
  private setupPanelEventHandlers(): void {
    // Panel manager events
    this.panelManager.on('panelShown', (data) => {
      this.log(`Panel shown: ${data.panelId}`);
      this.uiState.set(`show${data.panelId.charAt(0).toUpperCase() + data.panelId.slice(1)}`, true);
    });
    
    this.panelManager.on('panelHidden', (data) => {
      this.log(`Panel hidden: ${data.panelId}`);
      this.uiState.set(`show${data.panelId.charAt(0).toUpperCase() + data.panelId.slice(1)}`, false);
    });
    
    this.panelManager.on('panelFocused', (data) => {
      this.log(`Panel focused: ${data.panelId}`);
    });
    
    // Modal system events
    this.modalSystem.on('modalShown', (data) => {
      this.log(`Modal shown: ${data.modalId}`);
      this.uiState.set('hasVisibleModal', true);
    });
    
    this.modalSystem.on('modalHidden', (data) => {
      this.log(`Modal hidden: ${data.modalId}`);
      this.uiState.set('hasVisibleModal', this.modalSystem.hasVisibleModal());
    });
  }

  /**
   * Get UI state manager for components
   */
  getUIState(): UIStateManager {
    return this.uiState;
  }

  /**
   * Get panel manager for advanced panel control
   */
  getPanelManager(): PanelManager {
    return this.panelManager;
  }

  /**
   * Get modal system for showing dialogs
   */
  getModalSystem(): ModalSystem {
    return this.modalSystem;
  }

  /**
   * Get button state manager for button integration
   */
  getButtonStateManager(): ButtonStateManager {
    return this.buttonStateManager;
  }

  /**
   * Get performance manager for optimization
   */
  getPerformanceManager(): UIPerformanceManager {
    return this.performanceManager;
  }

  /**
   * Show a confirmation dialog
   */
  async showConfirmation(message: string, title?: string): Promise<boolean> {
    return this.modalSystem.confirm(message, title);
  }

  /**
   * Show an alert dialog
   */
  async showAlert(message: string, title?: string): Promise<void> {
    return this.modalSystem.alert(message, title);
  }

  /**
   * Close all closable panels (like escape key behavior)
   */
  closeAllPanels(): void {
    this.panelManager.closeAllClosablePanels();
  }

  /**
   * Show/hide specific panels
   */
  showPanel(panelId: string, focus: boolean = true): boolean {
    return this.panelManager.showPanel(panelId, focus);
  }

  hidePanel(panelId: string): boolean {
    return this.panelManager.hidePanel(panelId);
  }

  togglePanelVisibility(panelId: string): boolean {
    return this.panelManager.togglePanel(panelId);
  }

  /**
   * Check if panel is visible
   */
  isPanelVisible(panelId: string): boolean {
    return this.panelManager.isPanelVisible(panelId);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Destroy UI systems
    this.uiState.destroy();
    this.panelManager.destroy();
    this.modalSystem.destroy();
    this.buttonStateManager.destroy();
    this.performanceManager.destroy();
    
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