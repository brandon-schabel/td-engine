/**
 * Rendering Pipeline
 * Coordinates all specialized renderers to replace the monolithic Renderer.ts
 * Provides a unified interface while maintaining modular architecture
 */

import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { Camera } from '../systems/Camera';
import { Grid } from '../systems/Grid';
import { TextureManager } from '../systems/TextureManager';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player } from '../entities/Player';
import { HealthPickup } from '../entities/HealthPickup';
import { PowerUp } from '../entities/PowerUp';
import type { Vector2 } from '../utils/Vector2';

export interface RenderingOptions {
  showHealthBars?: boolean;
  showGrid?: boolean;
  showMiniMap?: boolean;
  showFPS?: boolean;
  enableParticleEffects?: boolean;
  environmentAnimation?: 'rain' | 'snow' | 'leaves' | null;
  biome?: string;
}

export class RenderingPipeline {
  private entityRenderer: EntityRenderer;
  private uiRenderer: UIRenderer;
  private environmentRenderer: EnvironmentRenderer;
  
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private grid: Grid;
  
  private frameCount: number = 0;
  private lastFrameTime: number = Date.now();
  private fps: number = 60;
  
  constructor(
    canvas: HTMLCanvasElement,
    grid: Grid,
    camera: Camera,
    textureManager?: TextureManager
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.grid = grid;
    
    const texManager = textureManager || new TextureManager();
    
    this.entityRenderer = new EntityRenderer(canvas, camera, texManager);
    this.uiRenderer = new UIRenderer(canvas, camera, texManager);
    this.environmentRenderer = new EnvironmentRenderer(canvas, camera, texManager, grid);
  }

  /**
   * Main render method that replaces the original renderScene
   */
  renderScene(
    towers: Tower[],
    enemies: Enemy[],
    projectiles: Projectile[],
    healthPickups: HealthPickup[],
    powerUps: PowerUp[],
    aimerLine: { start: Vector2; end: Vector2 } | null,
    player?: Player,
    options: RenderingOptions = {}
  ): void {
    const defaultOptions: RenderingOptions = {
      showHealthBars: true,
      showGrid: true,
      showMiniMap: false,
      showFPS: false,
      enableParticleEffects: true,
      environmentAnimation: null,
      biome: undefined,
      ...options
    };

    // Update FPS calculation
    this.updateFPS();

    // Phase 1: Clear and render background
    this.renderBackground(defaultOptions);

    // Phase 2: Render environment
    this.renderEnvironment(defaultOptions);

    // Phase 3: Render game entities
    this.renderEntities(
      towers,
      enemies,
      projectiles,
      healthPickups,
      powerUps,
      player,
      aimerLine,
      defaultOptions
    );

    // Phase 4: Render effects and overlays
    this.renderEffects(towers, defaultOptions);
  }

  /**
   * Render just the UI elements
   */
  renderUI(currency: number, lives: number, score: number, wave: number, options: RenderingOptions = {}): void {
    this.uiRenderer.renderHUD(currency, lives, score, wave);
    
    if (options.showFPS) {
      this.uiRenderer.renderFPS(this.fps);
    }
  }

  /**
   * Render game state overlays
   */
  renderGameStateOverlay(state: 'game_over' | 'victory' | 'paused'): void {
    switch (state) {
      case 'game_over':
        this.uiRenderer.renderGameOver();
        break;
      case 'victory':
        this.uiRenderer.renderVictory();
        break;
      case 'paused':
        this.uiRenderer.renderPaused();
        break;
    }
  }

  /**
   * Render tower-specific UI elements
   */
  renderTowerUI(tower: Tower, upgradeManager: any): void {
    // Show tower range
    this.environmentRenderer.renderTowerRange(tower);
    
    // Show upgrade panel
    this.uiRenderer.renderTowerUpgradePanel(tower, 10, 150, upgradeManager);
  }

  /**
   * Render tower placement ghost
   */
  renderTowerGhost(towerType: any, position: Vector2, canPlace: boolean): void {
    this.environmentRenderer.renderTowerGhost(towerType, position, canPlace);
  }

  private renderBackground(options: RenderingOptions): void {
    this.uiRenderer.clear(options.biome ? undefined : '#2E2E2E');
    
    if (options.biome) {
      this.environmentRenderer.renderBackground(options.biome);
    }
  }

  private renderEnvironment(options: RenderingOptions): void {
    if (options.showGrid) {
      this.environmentRenderer.renderGrid();
    }

    if (options.environmentAnimation) {
      this.environmentRenderer.renderEnvironmentalAnimation(options.environmentAnimation, 0.5);
    }
  }

  private renderEntities(
    towers: Tower[],
    enemies: Enemy[],
    projectiles: Projectile[],
    healthPickups: HealthPickup[],
    powerUps: PowerUp[],
    player: Player | undefined,
    aimerLine: { start: Vector2; end: Vector2 } | null,
    options: RenderingOptions
  ): void {
    // Render in optimal order for visual layering
    
    // 1. Towers (background layer)
    this.entityRenderer.renderAllTowers(towers, options.showHealthBars);

    // 2. Enemies
    this.entityRenderer.renderAllEnemies(enemies, options.showHealthBars);

    // 3. Pickups and power-ups
    this.entityRenderer.renderAllPickups(healthPickups, powerUps);

    // 4. Projectiles (above other entities)
    this.entityRenderer.renderAllProjectiles(projectiles);

    // 5. Player (top layer for visibility)
    if (player) {
      this.entityRenderer.renderPlayer(player);
      if (options.showHealthBars) {
        this.entityRenderer.renderHealthBar(player, true);
      }
    }

    // 6. Aimer line (overlay)
    if (aimerLine) {
      this.entityRenderer.renderAimerLine(aimerLine);
    }
  }

  private renderEffects(towers: Tower[], options: RenderingOptions): void {
    if (options.showMiniMap) {
      const worldWidth = this.grid.width * this.grid.cellSize;
      const worldHeight = this.grid.height * this.grid.cellSize;
      
      this.uiRenderer.renderMiniMap(
        this.canvas.width - 210,
        10,
        200,
        150,
        this.camera.getPosition ? this.camera.getPosition() : { x: 0, y: 0 },
        [], // Would need enemy positions
        towers.map(t => t.position),
        worldWidth,
        worldHeight
      );
    }
  }

  private updateFPS(): void {
    this.frameCount++;
    const currentTime = Date.now();
    
    if (currentTime - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  // Public methods for specialized rendering
  
  /**
   * Render a notification message
   */
  showNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    this.uiRenderer.renderNotification(message, type);
  }

  /**
   * Render a progress bar
   */
  renderProgressBar(
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    label?: string,
    color?: string
  ): void {
    this.uiRenderer.renderProgressBar(x, y, width, height, progress, label, color);
  }

  /**
   * Render a tooltip
   */
  renderTooltip(text: string, x: number, y: number, maxWidth?: number): void {
    this.uiRenderer.renderTooltip(text, x, y, maxWidth);
  }

  /**
   * Render particle effects
   */
  renderParticleEffect(position: Vector2, particleCount: number, color: string): void {
    this.environmentRenderer.renderParticleEffect(position, particleCount, color);
  }

  /**
   * Render explosion effect
   */
  renderExplosion(position: Vector2, radius: number, intensity?: number): void {
    this.environmentRenderer.renderExplosion(position, radius, intensity);
  }

  /**
   * Render lightning effect
   */
  renderLightning(start: Vector2, end: Vector2, branches?: number): void {
    this.environmentRenderer.renderLightning(start, end, branches);
  }

  /**
   * Get individual renderers for direct access if needed
   */
  getEntityRenderer(): EntityRenderer {
    return this.entityRenderer;
  }

  getUIRenderer(): UIRenderer {
    return this.uiRenderer;
  }

  getEnvironmentRenderer(): EnvironmentRenderer {
    return this.environmentRenderer;
  }

  /**
   * Performance metrics
   */
  getPerformanceMetrics(): {
    fps: number;
    frameCount: number;
    isPerformingWell: boolean;
  } {
    return {
      fps: this.fps,
      frameCount: this.frameCount,
      isPerformingWell: this.fps > 45
    };
  }

  /**
   * Update rendering options at runtime
   */
  setRenderingOptions(options: Partial<RenderingOptions>): void {
    // This could be expanded to store options and apply them automatically
    console.log('Rendering options updated:', options);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Cleanup any resources if needed
    console.log('Rendering pipeline cleaned up');
  }
}