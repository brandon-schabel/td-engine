/**
 * Game with Modern Renderer
 * Demonstrates how Game.ts would be refactored to use the new RenderingPipeline
 * This shows the simplified render method after the renderer split
 */

import { Game } from './Game';
import { RenderingPipeline, type RenderingOptions } from '../rendering/RenderingPipeline';
import { GameState } from './GameState';

/**
 * This class shows how the Game class render method would be simplified
 * after extracting the rendering logic into specialized components
 */
export class GameWithModernRenderer extends Game {
  private renderingPipeline: RenderingPipeline;
  private renderingOptions: RenderingOptions = {
    showHealthBars: true,
    showGrid: true,
    showMiniMap: false,
    showFPS: true,
    enableParticleEffects: true,
    environmentAnimation: null
  };

  constructor(canvas: HTMLCanvasElement, mapConfig?: any, autoStart: boolean = true) {
    super(canvas, mapConfig, autoStart);
    
    // Replace the monolithic renderer with the pipeline
    this.renderingPipeline = new RenderingPipeline(
      canvas,
      this.getGrid(),
      this.getCamera(),
      this.getTextureManager()
    );
  }

  // Dramatically simplified render method
  override render = (deltaTime: number): void => {
    // Main scene rendering
    this.renderingPipeline.renderScene(
      this.getTowers(),
      this.getEnemies(),
      this.getProjectiles(),
      this.getHealthPickups(),
      this.getPowerUps(),
      this.getPlayerAimerLine(),
      this.getPlayer(),
      this.renderingOptions
    );
    
    // Tower-specific UI
    const hoverTower = this.getHoverTower();
    if (hoverTower) {
      this.renderingPipeline.renderTowerUI(hoverTower, this.getUpgradeManager());
    }
    
    const selectedTower = this.getSelectedTower();
    if (selectedTower) {
      this.renderingPipeline.renderTowerUI(selectedTower, this.getUpgradeManager());
    }
    
    // Tower placement ghost
    const selectedTowerType = this.getSelectedTowerType();
    if (selectedTowerType && this.getEngine().getState() === GameState.PLAYING) {
      const mousePos = this.getMousePosition();
      const gridPos = this.getGrid().worldToGrid(mousePos);
      const canPlace = this.getGrid().canPlaceTower(gridPos.x, gridPos.y);
      const canAfford = this.canAffordTower(selectedTowerType);
      
      this.renderingPipeline.renderTowerGhost(selectedTowerType, mousePos, canPlace && canAfford);
    }
    
    // UI elements
    this.renderingPipeline.renderUI(
      this.getCurrency(),
      this.getLives(),
      this.getScore(),
      this.getCurrentWave(),
      this.renderingOptions
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

  // New convenience methods enabled by the modular renderer

  /**
   * Show notification to player
   */
  showNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    this.renderingPipeline.showNotification(message, type);
  }

  /**
   * Toggle rendering options
   */
  toggleMiniMap(): void {
    this.renderingOptions.showMiniMap = !this.renderingOptions.showMiniMap;
  }

  toggleFPS(): void {
    this.renderingOptions.showFPS = !this.renderingOptions.showFPS;
  }

  toggleHealthBars(): void {
    this.renderingOptions.showHealthBars = !this.renderingOptions.showHealthBars;
  }

  toggleGrid(): void {
    this.renderingOptions.showGrid = !this.renderingOptions.showGrid;
  }

  setEnvironmentAnimation(animation: 'rain' | 'snow' | 'leaves' | null): void {
    this.renderingOptions.environmentAnimation = animation;
  }

  setBiome(biome: string): void {
    this.renderingOptions.biome = biome;
  }

  /**
   * Get rendering performance metrics
   */
  getRenderingPerformance(): { fps: number; isPerformingWell: boolean } {
    const metrics = this.renderingPipeline.getPerformanceMetrics();
    return {
      fps: metrics.fps,
      isPerformingWell: metrics.isPerformingWell
    };
  }

  /**
   * Render special effects
   */
  renderExplosionAt(position: { x: number; y: number }, size: number = 50): void {
    this.renderingPipeline.renderExplosion(position, size);
  }

  renderLightningBetween(start: { x: number; y: number }, end: { x: number; y: number }): void {
    this.renderingPipeline.renderLightning(start, end);
  }

  renderParticlesBurst(position: { x: number; y: number }, color: string = '#FFD700'): void {
    this.renderingPipeline.renderParticleEffect(position, 20, color);
  }

  /**
   * Show progress for wave completion
   */
  showWaveProgress(): void {
    const waveManager = this.getWaveManager();
    if (waveManager) {
      const progress = waveManager.getWaveProgress ? waveManager.getWaveProgress() : 0;
      this.renderingPipeline.renderProgressBar(
        10,
        this.getCanvas().height - 40,
        200,
        20,
        progress,
        `Wave ${this.getCurrentWave()} Progress`,
        '#4CAF50'
      );
    }
  }

  /**
   * Show tooltip for UI elements
   */
  showTooltip(text: string, x: number, y: number): void {
    this.renderingPipeline.renderTooltip(text, x, y);
  }

  // Helper methods to access private members from parent class
  private getEngine(): any {
    return (this as any).engine;
  }

  private getGrid(): any {
    return (this as any).grid;
  }

  private getCamera(): any {
    return (this as any).camera;
  }

  private getTextureManager(): any {
    return (this as any).textureManager;
  }

  private getWaveManager(): any {
    return (this as any).waveManager;
  }

  private getCanvas(): HTMLCanvasElement {
    return (this as any).renderer.canvas;
  }

  private getMousePosition(): { x: number; y: number } {
    return (this as any).mousePosition;
  }

  /**
   * Get rendering pipeline for advanced usage
   */
  getRenderingPipeline(): RenderingPipeline {
    return this.renderingPipeline;
  }

  /**
   * Get current rendering options
   */
  getRenderingOptions(): RenderingOptions {
    return { ...this.renderingOptions };
  }

  /**
   * Update rendering options
   */
  setRenderingOptions(options: Partial<RenderingOptions>): void {
    this.renderingOptions = { ...this.renderingOptions, ...options };
  }

  /**
   * Cleanup rendering resources
   */
  override stop(): void {
    super.stop();
    this.renderingPipeline.cleanup();
  }
}