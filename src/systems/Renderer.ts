import { Tower, TowerType } from '@/entities/Tower';
import { Entity } from '@/entities/Entity';
import { Grid } from './Grid';
import { Camera } from './Camera';
import { TextureManager } from './TextureManager';
import type { Vector2 } from '@/utils/Vector2';
import { COLOR_CONFIG } from '../config/GameConfig';
import { GRID_RENDER_DETAILS, TOWER_RENDER, ENTITY_RENDER } from '../config/RenderingConfig';
import { COLOR_THEME } from '../config/ColorTheme';
import { BIOME_PRESETS, BiomeType } from '@/types/MapData';
import type { BiomeColors, EnvironmentalEffect } from '@/types/MapData';
import { adjustColorBrightness } from '@/utils/MathUtils';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { TerrainRenderer } from './TerrainRenderer';
import { EntityRenderer } from './renderers/EntityRenderer';
import { EffectsRenderer } from './renderers/EffectsRenderer';
import { UIRenderer } from './renderers/UIRenderer';
import { DecorationRenderer } from './renderers/DecorationRenderer';
import { DebugRenderer } from './renderers/DebugRenderer';
import { utilizeEntityStore, type Rectangle } from '@/stores/entityStore';
import type { StoreApi } from 'zustand';

// Legacy render config for backward compatibility
const RENDER_CONFIG = {
  obstacleColor: COLOR_THEME.map.blocked,
  gridLineColor: GRID_RENDER_DETAILS.gridLines.color,
  dashPattern: ENTITY_RENDER.dashPatterns.dashed,
  healthBarWidth: ENTITY_RENDER.healthBar.width,
  healthBarHeight: ENTITY_RENDER.healthBar.height,
  ghostOpacity: TOWER_RENDER.placement.ghostOpacity
} as const;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grid: Grid;
  private camera: Camera;
  private viewportWidth: number;
  private viewportHeight: number;
  private textureManager: TextureManager;
  private terrainRenderer: TerrainRenderer;
  private entityRenderer: EntityRenderer;
  private effectsRenderer: EffectsRenderer;
  private uiRenderer: UIRenderer;
  private decorationRenderer: DecorationRenderer;
  private debugRenderer: DebugRenderer;
  private environmentalEffects: EnvironmentalEffect[] = [];
  private biomeLogged: boolean = false;
  private pixelRatio: number;
  private renderSettings: {
    enableShadows: boolean;
    enableAntialiasing: boolean;
    enableGlowEffects: boolean;
    enableParticles: boolean;
    lodEnabled: boolean;
    lodBias: number;
  } = {
      enableShadows: true,
      enableAntialiasing: true,
      enableGlowEffects: true,
      enableParticles: true,
      lodEnabled: true,
      lodBias: 1.0
    };
  private unsubscribe: (() => void) | null = null;
  private entityStoreApi: StoreApi<any>;

  constructor(canvas: HTMLCanvasElement, grid: Grid, camera: Camera, textureManager?: TextureManager) {
    this.canvas = canvas;
    this.grid = grid;
    this.camera = camera;

    // Store pixel ratio for later use
    this.pixelRatio = window.devicePixelRatio || 1;

    // Use CSS dimensions for viewport since context is scaled
    this.viewportWidth = canvas.width / this.pixelRatio;
    this.viewportHeight = canvas.height / this.pixelRatio;

    this.textureManager = textureManager || new TextureManager();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    // Apply initial context state
    this.restoreContextState();

    // Initialize terrain renderer
    this.terrainRenderer = new TerrainRenderer(ctx, grid, camera);

    // Initialize entity renderer
    this.entityRenderer = new EntityRenderer({
      ctx: this.ctx,
      camera: this.camera,
      textureManager: this.textureManager,
      renderSettings: this.renderSettings
    });

    // Initialize effects renderer
    this.effectsRenderer = new EffectsRenderer({
      ctx: this.ctx,
      camera: this.camera,
      renderSettings: this.renderSettings
    });

    // Initialize UI renderer
    this.uiRenderer = new UIRenderer({
      ctx: this.ctx,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight
    });

    // Initialize decoration renderer
    this.decorationRenderer = new DecorationRenderer(ctx, grid, camera);

    // Initialize debug renderer
    this.debugRenderer = new DebugRenderer(ctx, camera, this.viewportWidth, this.viewportHeight);

    // Store reference to entity store API
    this.entityStoreApi = utilizeEntityStore;

    console.log('[Renderer] Created with canvas:', {
      canvas: canvas,
      width: canvas.width,
      height: canvas.height,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      context: ctx,
      gridSize: { width: grid.width, height: grid.height }
    });

    // Preload common textures
    this.preloadTextures();
  }

  // Update render settings based on game settings
  updateRenderSettings(settings: {
    enableShadows?: boolean;
    enableAntialiasing?: boolean;
    enableGlowEffects?: boolean;
    enableParticles?: boolean;
    lodBias?: number;
    useLowQualityMode?: boolean;
  }): void {
    if (settings.useLowQualityMode) {
      // Low quality mode overrides individual settings
      this.renderSettings.enableShadows = false;
      this.renderSettings.enableAntialiasing = false;
      this.renderSettings.enableGlowEffects = false;
      this.renderSettings.enableParticles = false;
      this.renderSettings.lodBias = 0.5; // More aggressive LOD
    } else {
      // Apply individual settings
      if (settings.enableShadows !== undefined) {
        this.renderSettings.enableShadows = settings.enableShadows;
      }
      if (settings.enableAntialiasing !== undefined) {
        this.renderSettings.enableAntialiasing = settings.enableAntialiasing;
        // Apply antialiasing to canvas
        this.ctx.imageSmoothingEnabled = settings.enableAntialiasing;
      }
      if (settings.enableGlowEffects !== undefined) {
        this.renderSettings.enableGlowEffects = settings.enableGlowEffects;
      }
      if (settings.enableParticles !== undefined) {
        this.renderSettings.enableParticles = settings.enableParticles;
      }
      if (settings.lodBias !== undefined) {
        this.renderSettings.lodBias = settings.lodBias;
      }
    }

    // Update renderers with new settings
    if (this.entityRenderer) {
      // Re-create entity renderer with new settings
      this.entityRenderer = new EntityRenderer({
        ctx: this.ctx,
        camera: this.camera,
        textureManager: this.textureManager,
        renderSettings: this.renderSettings
      });
    }
    
    // Effects renderer uses the same render settings object, so it updates automatically
    // UI renderer doesn't use render settings
  }


  private async preloadTextures(): Promise<void> {
    // Preload basic game textures
    try {
      await Promise.all([
        this.textureManager.loadTexture('player', '/assets/player.png'),
        this.textureManager.loadTexture('tower_basic', '/assets/tower_basic.png'),
        this.textureManager.loadTexture('tower_sniper', '/assets/tower_sniper.png'),
        this.textureManager.loadTexture('tower_rapid', '/assets/tower_rapid.png'),
        this.textureManager.loadTexture('enemy_basic', '/assets/enemy_basic.png'),
        this.textureManager.loadTexture('enemy_fast', '/assets/enemy_fast.png'),
        this.textureManager.loadTexture('enemy_tank', '/assets/enemy_tank.png'),
        this.textureManager.loadTexture('projectile', '/assets/projectile.png'),
        this.textureManager.loadTexture('health_pickup', '/assets/health_pickup.png'),
        this.textureManager.loadTexture('power_up', '/assets/power_up.png')
      ]);
    } catch (error) {
      console.warn('Some textures failed to load, falling back to primitive rendering:', error);
    }
  }

  clear(backgroundColor?: string): void {
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      if (typeof this.ctx.fillRect === 'function') {
        // Use logical viewport dimensions, not pixel dimensions
        this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
      }
    } else {
      if (typeof this.ctx.clearRect === 'function') {
        // Use logical viewport dimensions, not pixel dimensions
        this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
      }
    }
  }

  private getBiomeColors(biome: BiomeType): BiomeColors {
    return BIOME_PRESETS[biome].colors;
  }


  renderGrid(): void {
    // Use the new terrain renderer
    this.terrainRenderer.renderGrid();
    return;
  }

  renderDecorations(): void {
    this.decorationRenderer.renderDecorations();
  }


  setEnvironmentalEffects(effects: EnvironmentalEffect[]): void {
    this.environmentalEffects = effects;
  }

  private renderEnvironmentalEffects(): void {
    if (!this.environmentalEffects || this.environmentalEffects.length === 0) return;

    this.environmentalEffects.forEach(effect => {
      switch (effect.type) {
        case 'PARTICLES':
          // Only render particles if enabled
          if (this.renderSettings.enableParticles) {
            this.renderParticleEffect(effect);
          }
          break;
        case 'LIGHTING':
          this.renderLightingEffect(effect);
          break;
        case 'ANIMATION':
          this.renderAnimationEffect(effect);
          break;
      }
    });
  }

  private renderParticleEffect(effect: EnvironmentalEffect): void {
    const screenPos = this.camera.worldToScreen(effect.position);
    const time = Date.now() * 0.001;

    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }
    this.ctx.globalAlpha = effect.intensity;

    const particleCount = Math.floor(10 * effect.intensity);
    const particleType = effect.properties.particleType;
    const direction = effect.properties.direction || { x: 0, y: 1 };
    const speed = effect.properties.speed || 20;
    const color = effect.properties.color || '#FFFFFF';

    for (let i = 0; i < particleCount; i++) {
      const offset = (i * 137 + time * speed) % (effect.radius * 2);
      const x = screenPos.x + Math.sin(i * 0.618 + time) * effect.radius;
      const y = screenPos.y - effect.radius + offset;

      this.ctx.fillStyle = color;

      switch (particleType) {
        case 'snow':
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.arc === 'function') {
            this.ctx.arc(x + Math.sin(time + i) * 10, y, 2, 0, Math.PI * 2);
          }
          if (typeof this.ctx.fill === 'function') {
            this.ctx.fill();
          }
          break;

        case 'leaves':
          if (typeof this.ctx.save === 'function') {
            this.ctx.save();
          }
          if (typeof this.ctx.translate === 'function') {
            this.ctx.translate(x, y);
          }
          if (typeof this.ctx.rotate === 'function') {
            this.ctx.rotate(time + i);
          }
          this.ctx.fillStyle = color;
          if (typeof this.ctx.fillRect === 'function') {
            this.ctx.fillRect(-3, -2, 6, 4);
          }
          if (typeof this.ctx.restore === 'function') {
            this.ctx.restore();
          }
          break;

        case 'ash':
          this.ctx.fillStyle = color;
          if (typeof this.ctx.fillRect === 'function') {
            this.ctx.fillRect(x + Math.sin(time * 2 + i) * 20, y, 3, 3);
          }
          break;

        case 'sand':
          this.ctx.fillStyle = color;
          if (typeof this.ctx.fillRect === 'function') {
            this.ctx.fillRect(x + direction.x * offset, y + direction.y * offset * 0.5, 1, 1);
          }
          break;
      }
    }

    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  private renderLightingEffect(effect: EnvironmentalEffect): void {
    const screenPos = this.camera.worldToScreen(effect.position);
    const lightType = effect.properties.lightType;
    const color = effect.properties.color || '#FFFFFF';
    const pulsing = effect.properties.pulsing || false;

    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }

    if (lightType === 'glow') {
      const pulse = pulsing ? Math.sin(Date.now() * 0.003) * 0.3 + 0.7 : 1;
      let gradient;
      if (typeof this.ctx.createRadialGradient === 'function') {
        gradient = this.ctx.createRadialGradient(
          screenPos.x, screenPos.y, 0,
          screenPos.x, screenPos.y, effect.radius * pulse
        );
      }

      if (gradient) {
        gradient.addColorStop(0, color + '88');
        gradient.addColorStop(0.5, color + '44');
        gradient.addColorStop(1, color + '00');

        this.ctx.fillStyle = gradient;
      }
      if (typeof this.ctx.fillRect === 'function') {
        this.ctx.fillRect(
          screenPos.x - effect.radius,
          screenPos.y - effect.radius,
          effect.radius * 2,
          effect.radius * 2
        );
      }
    }

    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  private renderAnimationEffect(_effect: EnvironmentalEffect): void {
    // This would typically affect how decorations are rendered
    // For now, we'll skip implementation as decorations handle their own animation
  }



  renderDestructionEffect(effect: DestructionEffect): void {
    this.effectsRenderer.renderDestructionEffect(effect);
  }

  // PowerUp rendering removed - type not defined


  renderAimerLine(aimerLine: { start: Vector2; end: Vector2 }): void {
    this.effectsRenderer.renderAimerLine(aimerLine);
  }


  renderTowerRange(tower: Tower): void {
    this.effectsRenderer.renderTowerRange(tower);
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    this.effectsRenderer.renderTowerGhost(towerType, position, canPlace);
  }


  renderText(
    text: string,
    x: number,
    y: number,
    color: string = '#ffffff',
    font: string = '16px Arial',
    align: CanvasTextAlign = 'left'
  ): void {
    this.uiRenderer.renderText(text, x, y, color, font, align);
  }

  renderEntities(aimerLine?: { start: Vector2; end: Vector2 } | null): void {
    // Get viewport bounds for culling
    const visibleBounds = this.camera.getVisibleBounds();
    const viewport: Rectangle = {
      x: visibleBounds.min.x,
      y: visibleBounds.min.y,
      width: visibleBounds.max.x - visibleBounds.min.x,
      height: visibleBounds.max.y - visibleBounds.min.y
    };

    // Get visible entities from store using viewport culling
    const { getVisibleEntities, selectedTower } = this.entityStoreApi.getState();
    const visible = getVisibleEntities(viewport);

    // Render towers
    visible.towers.forEach(tower => {
      this.entityRenderer.renderTower(tower, tower === selectedTower);
    });

    // Render enemies
    visible.enemies.forEach(enemy => {
      this.entityRenderer.renderEnemy(enemy);
    });

    // Render collectibles
    visible.collectibles.forEach(collectible => {
      this.entityRenderer.renderCollectible(collectible);
    });

    // Render projectiles
    visible.projectiles.forEach(projectile => {
      this.entityRenderer.renderProjectile(projectile);
    });
    
    // Debug: Log projectile rendering
    if (visible.projectiles.length > 0) {
      console.log(`[Renderer] Rendering ${visible.projectiles.length} projectiles`);
    }

    // Render player
    if (visible.player) {
      this.entityRenderer.renderPlayer(visible.player);
    }

    // Render aimer line
    if (aimerLine) {
      this.effectsRenderer.renderAimerLine(aimerLine);
    }

    // Render destruction effects
    visible.destructionEffects.forEach(effect => {
      this.effectsRenderer.renderDestructionEffect(effect);
    });
  }

  renderScene(aimerLine?: { start: Vector2; end: Vector2 } | null): void {
    // Save the current context state
    this.ctx.save();

    // Ensure our pixel ratio scaling is maintained
    // This is a safeguard in case something else modified the transform
    if (this.ctx.getTransform) {
      const currentTransform = this.ctx.getTransform();
      // Check if transform has been reset (a=1, d=1 means no scaling)
      if (currentTransform.a === 1 && currentTransform.d === 1 && this.pixelRatio !== 1) {
        console.warn('[Renderer] Context transform was reset, restoring pixel ratio scaling');
        this.restoreContextState();
      }
    }

    // Clear canvas with biome-appropriate background
    const biome = this.grid.getBiome();
    const biomeColors = this.getBiomeColors(biome);

    // Only log biome on first render
    if (!this.biomeLogged) {
      console.log('[Renderer] Current biome:', biome, 'Colors:', biomeColors);
      this.biomeLogged = true;
    }

    this.clear(adjustColorBrightness(biomeColors.primary, 0.3));

    // Render grid with biome colors
    this.renderGrid();

    // Render decorations
    this.renderDecorations();

    // Render environmental effects
    this.renderEnvironmentalEffects();

    // Render all entities from store
    this.renderEntities(aimerLine);

    // Render pathfinding debug if enabled
    const { getAllEnemies, getAllTowers, getAllProjectiles, getAllCollectibles } = this.entityStoreApi.getState();
    this.debugRenderer.renderPathfindingDebug(getAllEnemies());

    // Render debug overlay if enabled
    const { player } = this.entityStoreApi.getState();
    this.debugRenderer.renderDebugOverlay(player, {
      enemies: getAllEnemies().length,
      towers: getAllTowers().length,
      projectiles: getAllProjectiles().length,
      collectibles: getAllCollectibles().length
    });

    // Restore the context state
    this.ctx.restore();
  }

  renderUI(currency: number, lives: number, score: number, wave: number): void {
    this.uiRenderer.renderUI(currency, lives, score, wave);
  }

  renderGameOver(): void {
    this.uiRenderer.renderGameOver();
  }

  renderVictory(): void {
    this.uiRenderer.renderVictory();
  }

  renderPaused(): void {
    this.uiRenderer.renderPaused();
  }

  // DEPRECATED: Tower upgrade panel is now handled by the dialog system
  // renderTowerUpgradePanel(tower: Tower, x: number, y: number): void {
  //   // Old implementation removed - see TowerInfoDialog for new UI
  // }

  // Getter methods for viewport dimensions
  getViewportWidth(): number {
    return this.viewportWidth;
  }

  getViewportHeight(): number {
    return this.viewportHeight;
  }

  getCanvasWidth(): number {
    return this.viewportWidth;
  }

  getCanvasHeight(): number {
    return this.viewportHeight;
  }

  // Toggle debug mode
  setDebugMode(enabled: boolean): void {
    this.debugRenderer.setDebugMode(enabled);
  }

  // Subscribe to entity store changes for reactive rendering
  subscribeToStore(callback: () => void): void {
    // Unsubscribe from previous subscription if exists
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Subscribe to store changes
    this.unsubscribe = this.entityStoreApi.subscribe(callback);
  }

  // Cleanup method
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Restore context state after canvas reset
  private restoreContextState(): void {
    // Reset transform to identity
    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      // Fallback for older browsers
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Apply pixel ratio scaling
    if (this.pixelRatio !== 1) {
      this.ctx.scale(this.pixelRatio, this.pixelRatio);
      console.log('[Renderer] Restored pixel ratio scaling:', this.pixelRatio);
    }

    // Restore other context defaults if needed
    this.ctx.imageSmoothingEnabled = this.renderSettings.enableAntialiasing;
  }

  // Update canvas size and restore context state
  updateCanvasSize(width: number, height: number): void {
    // Setting canvas dimensions resets the context, so we need to restore state
    this.canvas.width = width;
    this.canvas.height = height;

    // Update viewport dimensions
    this.viewportWidth = width / this.pixelRatio;
    this.viewportHeight = height / this.pixelRatio;

    // Update UI renderer viewport
    this.uiRenderer.updateViewport(this.viewportWidth, this.viewportHeight);

    // Update debug renderer viewport
    this.debugRenderer.updateViewport(this.viewportWidth, this.viewportHeight);

    // Restore context state after reset
    this.restoreContextState();

    console.log('[Renderer] Canvas resized:', {
      pixelDimensions: { width, height },
      logicalDimensions: { width: this.viewportWidth, height: this.viewportHeight }
    });
  }

}