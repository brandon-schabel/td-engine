/**
 * GameWithEvents - Extended Game class with event emitting capabilities
 * Provides reactive updates for UI components
 */

import { Game } from './Game';
import { EventEmitter } from '../utils/EventEmitter';
import { GameState } from './GameState';
import { Tower, TowerType } from '@/entities/Tower';
import type { Vector2 } from '@/utils/Vector2';
import type { MapGenerationConfig } from '@/types/MapData';

// Define the GameEvents type that was missing
export type GameEvents = {
  currencyChanged: { amount: number; previous: number };
  livesChanged: { amount: number; previous: number };
  scoreChanged: { amount: number; previous: number };
  gameStateChanged: { state: GameState; previous: GameState };
  gameOver: { won: boolean; score: number };
  towerPlaced: { tower: Tower; cost: number };
  selectedTowerTypeChanged: { type: TowerType | null };
  waveStarted: { waveNumber: number };
  mousePositionChanged: { gridX: number; gridY: number; worldX: number; worldY: number };
  hoverTowerChanged: { tower: Tower | null };
  towerSelected: { tower: Tower | null };
  gamePaused: undefined;
  gameResumed: undefined;
};

export class GameWithEvents extends Game {
  private eventEmitter: EventEmitter<GameEvents>;
  private previousState: {
    currency: number;
    lives: number;
    score: number;
    gameState: GameState;
  };
  private firstUpdate: boolean = true;

  constructor(
    canvas: HTMLCanvasElement, 
    mapConfig?: MapGenerationConfig, 
    autoStart: boolean = true,
    difficultyConfig?: { enemyHealthMultiplier?: number; enemySpeedMultiplier?: number }
  ) {
    super(canvas, mapConfig, autoStart, difficultyConfig);
    
    this.eventEmitter = new EventEmitter<GameEvents>();
    
    // Initialize previous state tracking
    this.previousState = {
      currency: this.getCurrency(),
      lives: this.getLives(),
      score: this.getScore(),
      gameState: this.getGameState()
    };
    
    console.log('[GameWithEvents] Created with canvas:', canvas, 'autoStart:', autoStart);
  }

  /**
   * Subscribe to game events
   */
  on<K extends keyof GameEvents>(event: K, handler: (data: GameEvents[K]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from game events
   */
  off<K extends keyof GameEvents>(event: K, handler: (data: GameEvents[K]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Emit a game event
   */
  private emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * Override update to check for state changes
   */
  update = (deltaTime: number): void => {
    if (this.firstUpdate) {
      console.log('[GameWithEvents] First update called, deltaTime:', deltaTime);
      this.firstUpdate = false;
    }
    
    // Call parent update method directly
    // Since update is an arrow function property, we need to call it as a property
    const parentUpdate = Object.getPrototypeOf(Object.getPrototypeOf(this)).update;
    if (parentUpdate) {
      parentUpdate.call(this, deltaTime);
    }
    
    // Check for state changes and emit events
    this.checkStateChanges();
  };

  /**
   * Check for state changes and emit appropriate events
   */
  private checkStateChanges(): void {
    // Currency changes
    const currentCurrency = this.getCurrency();
    if (currentCurrency !== this.previousState.currency) {
      this.emit('currencyChanged', {
        amount: currentCurrency,
        previous: this.previousState.currency
      });
      this.previousState.currency = currentCurrency;
    }
    
    // Lives changes
    const currentLives = this.getLives();
    if (currentLives !== this.previousState.lives) {
      this.emit('livesChanged', {
        amount: currentLives,
        previous: this.previousState.lives
      });
      this.previousState.lives = currentLives;
    }
    
    // Score changes
    const currentScore = this.getScore();
    if (currentScore !== this.previousState.score) {
      this.emit('scoreChanged', {
        amount: currentScore,
        previous: this.previousState.score
      });
      this.previousState.score = currentScore;
    }
    
    // Game state changes
    const currentGameState = this.getGameState();
    if (currentGameState !== this.previousState.gameState) {
      this.emit('gameStateChanged', {
        state: currentGameState,
        previous: this.previousState.gameState
      });
      
      // Emit specific state events
      if (currentGameState === GameState.GAME_OVER) {
        this.emit('gameOver', {
          won: false,
          score: currentScore
        });
      } else if (currentGameState === GameState.VICTORY) {
        this.emit('gameOver', {
          won: true,
          score: currentScore
        });
      }
      
      this.previousState.gameState = currentGameState;
    }
  }

  /**
   * Note: Resource management is handled internally by the Game class
   * and changes are detected in checkStateChanges()
   */

  /**
   * Override tower methods to emit events
   */
  override placeTower(towerType: TowerType, worldPosition: Vector2): boolean {
    const cost = this.getTowerCost(towerType);
    const towerCount = this.getTowers().length;
    const result = super.placeTower(towerType, worldPosition);
    
    if (result) {
      // Check if a new tower was added
      const newTowers = this.getTowers();
      if (newTowers.length > towerCount) {
        const tower = newTowers[newTowers.length - 1]; // Get the last tower (newly placed)
        if (tower) {
          this.emit('towerPlaced', { tower, cost });
        }
      }
    }
    
    return result;
  }

  override setSelectedTowerType(type: TowerType | null): void {
    super.setSelectedTowerType(type);
    this.emit('selectedTowerTypeChanged', { type });
  }

  /**
   * Override wave management to emit events
   */
  override startNextWave(): boolean {
    const currentWave = this.getCurrentWave();
    const result = super.startNextWave();
    const newWave = this.getCurrentWave();
    
    if (result && newWave > currentWave) {
      this.emit('waveStarted', { waveNumber: newWave });
    }
    
    return result;
  }

  /**
   * Override mouse handlers to emit events
   */
  override handleMouseMove(event: MouseEvent): void {
    super.handleMouseMove(event);
    
    // Since camera and grid are private, we'll emit mouse position events
    // The UI can calculate grid positions using public methods if needed
    this.emit('mousePositionChanged', {
      gridX: 0, // Will be calculated by UI if needed
      gridY: 0,
      worldX: event.offsetX,
      worldY: event.offsetY
    });
    
    // Check hover tower change
    const currentHoverTower = this.getHoverTower();
    if (currentHoverTower !== this.previousHoverTower) {
      this.emit('hoverTowerChanged', { tower: currentHoverTower });
      this.previousHoverTower = currentHoverTower;
    }
  }

  private previousHoverTower: Tower | null = null;

  /**
   * Handle tower selection events
   */
  override handleMouseDown(event: MouseEvent): void {
    const previousSelected = this.getSelectedTower();
    super.handleMouseDown(event);
    const currentSelected = this.getSelectedTower();
    
    if (previousSelected !== currentSelected) {
      this.emit('towerSelected', { tower: currentSelected });
    }
  }

  /**
   * Override pause/resume to emit events
   */
  override pause(): void {
    super.pause();
    this.emit('gamePaused', undefined);
  }

  override resume(): void {
    super.resume();
    this.emit('gameResumed', undefined);
  }

  /**
   * Public method to emit custom events
   */
  emitCustomEvent<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this.emit(event, data);
  }

  /**
   * Get the event emitter for advanced use cases
   */
  getEventEmitter(): EventEmitter<GameEvents> {
    return this.eventEmitter;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.eventEmitter.removeAllListeners();
  }
}