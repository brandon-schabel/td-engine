/**
 * Modular Game
 * Demonstrates Game.ts after extracting input handling and entity management
 * Shows the significant simplification achieved through proper separation of concerns
 */

import { Game } from './Game';
import { InputManager, type InputEvents } from '@/systems/InputManager';
import { EntityManager, type EntityEvents } from '@/systems/EntityManager';
import { RenderingPipeline } from '../rendering/RenderingPipeline';
import { UpgradeService } from '../services/UpgradeService';
import { GameState } from './GameState';
import { TowerType } from '@/entities/Tower';
import { UpgradeType as TowerUpgradeType } from '@/systems/TowerUpgradeManager';
import { PlayerUpgradeType } from '@/entities/Player';
import { ResourceType } from '@/systems/ResourceManager';
import { TOWER_COSTS } from '../config/GameConfig';
import type { Vector2 } from '@/utils/Vector2';

/**
 * This class demonstrates how Game.ts would look after extracting
 * input handling and entity management into specialized systems
 */
export class ModularGame extends Game {
  private inputManager: InputManager;
  private entityManager: EntityManager;
  private renderingPipeline: RenderingPipeline;
  private upgradeService: UpgradeService;
  
  // Simplified state management
  private selectedTowerType: TowerType | null = null;
  private hoverTower: any = null;
  private selectedTower: any = null;

  constructor(canvas: HTMLCanvasElement, mapConfig?: any, autoStart: boolean = true) {
    super(canvas, mapConfig, autoStart);
    
    this.initializeModularSystems();
    this.setupEventHandlers();
  }

  private initializeModularSystems(): void {
    // Initialize input management
    this.inputManager = new InputManager(
      this.getCanvas(),
      this.getCamera(),
      this.createInputEventHandlers()
    );

    // Initialize entity management
    this.entityManager = new EntityManager(
      this.getPlayer(),
      this.getGrid(),
      this.createEntityEventHandlers()
    );

    // Initialize rendering pipeline
    this.renderingPipeline = new RenderingPipeline(
      this.getCanvas(),
      this.getGrid(),
      this.getCamera(),
      this.getTextureManager()
    );

    // Initialize upgrade service
    this.upgradeService = new UpgradeService(this.getResourceManager());
  }

  private createInputEventHandlers(): Partial<InputEvents> {
    return {
      onMouseDown: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => {
        this.handleMouseDown(worldPos, screenPos, event);
      },
      onMouseUp: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => {
        this.handleMouseUp(worldPos, screenPos, event);
      },
      onMouseMove: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => {
        this.handleMouseMove(worldPos, screenPos, event);
      },
      onKeyDown: (key: string, event: KeyboardEvent) => {
        this.handleKeyDown(key, event);
      },
      onKeyUp: (key: string, event: KeyboardEvent) => {
        this.handleKeyUp(key, event);
      },
      onWheel: (delta: number, worldPos: Vector2, event: WheelEvent) => {
        this.handleWheel(delta, worldPos, event);
      }
    };
  }

  private createEntityEventHandlers(): Partial<EntityEvents> {
    return {
      onEnemyKilled: (enemy, killer) => {
        const reward = enemy.reward || 10;
        const score = enemy.reward * 1.5;
        this.getResourceManager().enemyKilled(reward, score);
        this.getAudioHandler().handleEnemyDamage(enemy, true);
      },
      onPlayerDamaged: (player, damage, source) => {
        this.getAudioHandler().handlePlayerDamage(damage);
      },
      onProjectileHit: (projectile, target) => {
        this.getAudioHandler().handleProjectileHit();
      },
      onPickupCollected: (pickup, collector) => {
        if (pickup.constructor.name === 'HealthPickup') {
          this.getAudioHandler().playHealthPickup();
        } else {
          this.getAudioHandler().playPowerUpPickup();
        }
      },
      onEntitySpawned: (entity) => {
        // Handle entity spawn events if needed
      },
      onEntityRemoved: (entity) => {
        // Handle entity removal events if needed
      }
    };
  }

  private setupEventHandlers(): void {
    // Set up any additional event handlers
    this.inputManager.addEventListener('onCombo', () => {
      // Handle input combos
    });
  }

  // Dramatically simplified update method
  override update = (deltaTime: number): void => {
    if (this.getEngine().getState() !== GameState.PLAYING) {
      return;
    }

    // Check for game over
    if (this.getResourceManager().isGameOver()) {
      this.getEngine().gameOver();
      return;
    }

    // Update wave manager and spawn enemies
    const newEnemies = this.getWaveManager().update(deltaTime);
    newEnemies.forEach(enemy => {
      this.entityManager.createEnemy(enemy);
    });

    // Update all entities through the entity manager
    this.entityManager.updateAllEntities(deltaTime);
    
    // Update camera to follow player
    this.getCamera().update(this.entityManager.getPlayer().position);
    
    // Player manual shooting (handled through input manager state)
    if (this.inputManager.isMousePressed()) {
      const projectile = this.entityManager.getPlayer().updateShooting();
      if (projectile) {
        // The entity manager will handle this through its update cycle
        this.getAudioHandler().playPlayerShoot(this.entityManager.getPlayer().position);
      }
    }
    
    // Check if player died
    if (!this.entityManager.getPlayer().isAlive) {
      this.getAudioHandler().playGameOver();
      this.getEngine().gameOver();
      return;
    }

    // Check for wave completion and victory
    if (this.getWaveManager().isWaveComplete()) {
      if (!this.getWaveManager().hasNextWave()) {
        this.getAudioHandler().playVictory();
        this.getEngine().victory();
      } else {
        this.getAudioHandler().playWaveComplete();
      }
    }
  };

  // Dramatically simplified render method
  override render = (deltaTime: number): void => {
    const entities = this.entityManager.getEntities();
    
    this.renderingPipeline.renderScene(
      entities.towers,
      entities.enemies,
      entities.projectiles,
      entities.healthPickups,
      entities.powerUps,
      this.getPlayerAimerLine(),
      this.entityManager.getPlayer()
    );
    
    // Handle tower-specific rendering
    if (this.hoverTower) {
      this.renderingPipeline.renderTowerUI(this.hoverTower, this.upgradeService.getTowerUpgradeManager());
    }
    
    if (this.selectedTower) {
      this.renderingPipeline.renderTowerUI(this.selectedTower, this.upgradeService.getTowerUpgradeManager());
    }
    
    // Tower placement ghost
    if (this.selectedTowerType && this.getEngine().getState() === GameState.PLAYING) {
      const mousePos = this.inputManager.getMouseWorldPosition();
      const gridPos = this.getGrid().worldToGrid(mousePos);
      const canPlace = this.getGrid().canPlaceTower(gridPos.x, gridPos.y);
      const canAfford = this.canAffordTower(this.selectedTowerType);
      
      this.renderingPipeline.renderTowerGhost(this.selectedTowerType, mousePos, canPlace && canAfford);
    }
    
    // UI rendering
    this.renderingPipeline.renderUI(
      this.getCurrency(),
      this.getLives(),
      this.getScore(),
      this.getCurrentWave()
    );
    
    // Game state overlays
    const gameState = this.getEngine().getState();
    if (gameState === GameState.GAME_OVER) {
      this.renderingPipeline.renderGameStateOverlay('game_over');
    } else if (gameState === GameState.VICTORY) {
      this.renderingPipeline.renderGameStateOverlay('victory');
    } else if (gameState === GameState.PAUSED) {
      this.renderingPipeline.renderGameStateOverlay('paused');
    }
  };

  // Simplified input handling methods
  private handleMouseDown(worldPos: Vector2, screenPos: Vector2, event: MouseEvent): void {
    if (this.getEngine().getState() !== GameState.PLAYING) {
      return;
    }
    
    // Check if clicking on player
    const player = this.entityManager.getPlayer();
    if (player.distanceTo(worldPos) <= player.radius) {
      this.triggerPlayerUpgradePanel();
      return;
    }
    
    // Check if clicking on existing tower
    const clickedTower = this.entityManager.getTowerAt(worldPos, 32);
    
    if (clickedTower) {
      this.selectedTower = this.selectedTower === clickedTower ? null : clickedTower;
      this.selectedTowerType = null;
    } else if (this.selectedTowerType) {
      this.placeTower(this.selectedTowerType, worldPos);
    } else {
      // Manual shooting handled by input state
      this.selectedTower = null;
    }
  }

  private handleMouseUp(worldPos: Vector2, screenPos: Vector2, event: MouseEvent): void {
    // Mouse up handling is now managed by input manager state
  }

  private handleMouseMove(worldPos: Vector2, screenPos: Vector2, event: MouseEvent): void {
    // Find tower under mouse for range display
    this.hoverTower = this.entityManager.getTowerAt(worldPos, 32);
  }

  private handleKeyDown(key: string, event: KeyboardEvent): void {
    // Movement keys are handled automatically by input manager
    // Additional game-specific key handling can go here
    if (key === 'p') {
      this.getEngine().pause();
    } else if (key === 'escape') {
      this.selectedTowerType = null;
      this.selectedTower = null;
    }
  }

  private handleKeyUp(key: string, event: KeyboardEvent): void {
    // Key up handling
  }

  private handleWheel(delta: number, worldPos: Vector2, event: WheelEvent): void {
    // Handle camera zoom or other wheel-based interactions
    console.log(`Wheel: ${delta} at ${worldPos.x}, ${worldPos.y}`);
  }

  // Simplified tower placement
  private placeTower(towerType: TowerType, worldPosition: Vector2): boolean {
    const cost = TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];
    
    if (!this.getResourceManager().canAfford(ResourceType.CURRENCY, cost)) {
      this.renderingPipeline.showNotification('Not enough currency!', 'warning');
      return false;
    }
    
    const tower = this.entityManager.createTower(towerType, worldPosition);
    if (tower) {
      this.getResourceManager().spendResource(ResourceType.CURRENCY, cost);
      this.getAudioHandler().playTowerPlace();
      this.renderingPipeline.showNotification(`${towerType} tower placed!`, 'success');
      return true;
    } else {
      this.renderingPipeline.showNotification('Cannot place tower here!', 'error');
      return false;
    }
  }

  // Simplified upgrade methods using the service
  override upgradeTower(tower: any, upgradeType: TowerUpgradeType): boolean {
    const result = this.upgradeService.upgradeTower(tower, upgradeType);
    
    if (result.success) {
      this.getAudioHandler().playTowerUpgrade();
      this.renderingPipeline.showNotification(result.message, 'success');
    } else {
      this.renderingPipeline.showNotification(result.message, 'warning');
    }
    
    return result.success;
  }

  override upgradePlayer(upgradeType: PlayerUpgradeType): boolean {
    const result = this.upgradeService.upgradePlayer(this.entityManager.getPlayer(), upgradeType);
    
    if (result.success) {
      this.getAudioHandler().playPlayerLevelUp();
      this.renderingPipeline.showNotification(result.message, 'success');
    } else {
      this.renderingPipeline.showNotification(result.message, 'warning');
    }
    
    return result.success;
  }

  private triggerPlayerUpgradePanel(): void {
    const playerClickEvent = new CustomEvent('playerClicked');
    document.dispatchEvent(playerClickEvent);
  }

  // New methods enabled by modular architecture

  getInputState() {
    return this.inputManager.getState();
  }

  getEntityMetrics() {
    return this.entityManager.getPerformanceMetrics();
  }

  getRenderingMetrics() {
    return this.renderingPipeline.getPerformanceMetrics();
  }

  getUpgradeRecommendations() {
    const entities = this.entityManager.getEntities();
    return this.upgradeService.getUpgradeRecommendations(entities.towers, this.entityManager.getPlayer());
  }

  enableDebugMode(): void {
    const debugInfo = {
      input: this.inputManager.getDebugInfo(),
      entities: this.entityManager.getEntityCount(),
      rendering: this.renderingPipeline.getPerformanceMetrics()
    };
    
    console.log('Debug Info:', debugInfo);
  }

  // Override cleanup to handle new systems
  override stop(): void {
    this.inputManager.cleanup();
    this.entityManager.cleanup();
    this.renderingPipeline.cleanup();
    super.stop();
  }

  // Access methods for the modular systems
  getInputManager(): InputManager {
    return this.inputManager;
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  getRenderingPipeline(): RenderingPipeline {
    return this.renderingPipeline;
  }

  getUpgradeService(): UpgradeService {
    return this.upgradeService;
  }

  // Helper methods to access parent class members
  private getEngine(): any {
    return (this as any).engine;
  }

  private getGrid(): any {
    return (this as any).grid;
  }

  private getCamera(): any {
    return (this as any).camera;
  }

  private getCanvas(): HTMLCanvasElement {
    return (this as any).renderer.canvas;
  }

  private getTextureManager(): any {
    return (this as any).textureManager;
  }

  private getWaveManager(): any {
    return (this as any).waveManager;
  }

  private getResourceManager(): any {
    return (this as any).resourceManager;
  }

  private getAudioHandler(): any {
    return (this as any).audioHandler;
  }
}