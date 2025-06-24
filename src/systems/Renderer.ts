import { Tower, TowerType } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Player } from '@/entities/Player';
import { Collectible } from '@/entities/Collectible';
import { HealthPickup } from '@/entities/HealthPickup';
import { Entity } from '@/entities/Entity';
import { Grid, CellType } from './Grid';
import { Camera } from './Camera';
import { UpgradeType } from '@/entities/Tower';
import { TextureManager, type Texture } from './TextureManager';
import type { Vector2 } from '@/utils/Vector2';
import { COLOR_CONFIG } from '../config/GameConfig';
import { GRID_RENDER_DETAILS, ENTITY_RENDER, TOWER_RENDER, ZOOM_RENDER_CONFIG } from '../config/RenderingConfig';
import { COLOR_THEME } from '../config/ColorTheme';
import { BIOME_PRESETS, BiomeType } from '@/types/MapData';
import type { BiomeColors, EnvironmentalEffect } from '@/types/MapData';
import { adjustColorBrightness, coordinateVariation } from '@/utils/MathUtils';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { PathfindingDebug } from '@/debug/PathfindingDebug';
import type { NavigationGrid } from './NavigationGrid';
import { TerrainRenderer } from './TerrainRenderer';

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
  private environmentalEffects: EnvironmentalEffect[] = [];
  private debugMode: boolean = false;
  private biomeLogged: boolean = false;

  constructor(canvas: HTMLCanvasElement, grid: Grid, camera: Camera, textureManager?: TextureManager) {
    this.canvas = canvas;
    this.grid = grid;
    this.camera = camera;
    
    // Use CSS dimensions for viewport since context is scaled
    const pixelRatio = window.devicePixelRatio || 1;
    this.viewportWidth = canvas.width / pixelRatio;
    this.viewportHeight = canvas.height / pixelRatio;
    
    this.textureManager = textureManager || new TextureManager();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
    // Initialize terrain renderer
    this.terrainRenderer = new TerrainRenderer(ctx, grid, camera);
    
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
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } else {
      if (typeof this.ctx.clearRect === 'function') {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();
    
    // Get biome colors
    const biome = this.grid.getBiome();
    const biomeColors = this.getBiomeColors(biome);
    
    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));
    
    
    // Render only visible cells
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellData = this.grid.getCellData(x, y);
        if (!cellData) continue;
        
        const worldPos = this.grid.gridToWorld(x, y);
        const screenPos = this.camera.worldToScreen(worldPos);
        const height = cellData.height || 0;
        
        // Base cell color with height variation
        const brightness = 1 - height * 0.3; // Darker at higher elevations
        
        switch (cellData.type) {
          case CellType.PATH:
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.path, brightness);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            break;
            
          case CellType.BLOCKED:
          case CellType.BORDER:
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.border, brightness * 0.7);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            break;
            
          case CellType.OBSTACLE:
            // Render rocks/obstacles
            this.ctx.fillStyle = adjustColorBrightness(RENDER_CONFIG.obstacleColor, brightness);
            if (typeof this.ctx.beginPath === 'function') {
              this.ctx.beginPath();
            }
            if (typeof this.ctx.arc === 'function') {
              this.ctx.arc(screenPos.x, screenPos.y, cellSize / 3, 0, Math.PI * 2);
            }
            if (typeof this.ctx.fill === 'function') {
              this.ctx.fill();
            }
            
            // Add some detail
            this.ctx.strokeStyle = adjustColorBrightness('#888888', brightness * 0.8);
            this.ctx.lineWidth = 2;
            if (typeof this.ctx.stroke === 'function') {
              this.ctx.stroke();
            }
            break;
            
          case CellType.SPAWN_ZONE:
            // Render spawn zones with pulsing effect
            const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.accent, brightness * pulse);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            break;
            
          case CellType.WATER:
            // Render water with animated effect
            const time = Date.now() * 0.001;
            const waveOffset = Math.sin(time + x * 0.3 + y * 0.2) * 2;
            
            // Base water color
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.water || '#4682B4', brightness);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            
            // Add animated wave lines
            this.ctx.strokeStyle = adjustColorBrightness('#6495ED', brightness * 1.2);
            this.ctx.lineWidth = 1;
            if (typeof this.ctx.beginPath === 'function') {
              this.ctx.beginPath();
              // First wave
              const wave1Y = screenPos.y - cellSize / 4 + waveOffset;
              if (typeof this.ctx.moveTo === 'function') {
                this.ctx.moveTo(screenPos.x - cellSize / 2, wave1Y);
              }
              if (typeof this.ctx.quadraticCurveTo === 'function') {
                this.ctx.quadraticCurveTo(
                  screenPos.x - cellSize / 4, wave1Y - 3,
                  screenPos.x, wave1Y
                );
                this.ctx.quadraticCurveTo(
                  screenPos.x + cellSize / 4, wave1Y + 3,
                  screenPos.x + cellSize / 2, wave1Y
                );
              }
              // Second wave
              const wave2Y = screenPos.y + cellSize / 4 + waveOffset;
              if (typeof this.ctx.moveTo === 'function') {
                this.ctx.moveTo(screenPos.x - cellSize / 2, wave2Y);
              }
              if (typeof this.ctx.quadraticCurveTo === 'function') {
                this.ctx.quadraticCurveTo(
                  screenPos.x - cellSize / 4, wave2Y + 3,
                  screenPos.x, wave2Y
                );
                this.ctx.quadraticCurveTo(
                  screenPos.x + cellSize / 4, wave2Y - 3,
                  screenPos.x + cellSize / 2, wave2Y
                );
              }
            }
            if (typeof this.ctx.stroke === 'function') {
              this.ctx.stroke();
            }
            break;
            
          case CellType.ROUGH_TERRAIN:
            // Base rough terrain color
            this.ctx.fillStyle = adjustColorBrightness('#8B7355', brightness);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            
            // Add texture with small rocks
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            const rockCount = 4;
            const rockSize = cellSize / 10;
            for (let i = 0; i < rockCount; i++) {
              const angle = (Math.PI * 2 * i) / rockCount + coordinateVariation(x, y, 1);
              const distance = cellSize / 3;
              const rockX = screenPos.x + Math.cos(angle) * distance;
              const rockY = screenPos.y + Math.sin(angle) * distance;
              
              if (typeof this.ctx.beginPath === 'function') {
                this.ctx.beginPath();
              }
              if (typeof this.ctx.arc === 'function') {
                this.ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
              }
              if (typeof this.ctx.fill === 'function') {
                this.ctx.fill();
              }
            }
            
            // Add dashed border
            this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
            this.ctx.lineWidth = 1;
            if (typeof this.ctx.setLineDash === 'function') {
              this.ctx.setLineDash([3, 3]);
            }
            if (typeof this.ctx.strokeRect === 'function') {
              this.ctx.strokeRect(
                screenPos.x - cellSize / 2 + 1,
                screenPos.y - cellSize / 2 + 1,
                cellSize - 2,
                cellSize - 2
              );
            }
            if (typeof this.ctx.setLineDash === 'function') {
              this.ctx.setLineDash([]);
            }
            break;
            
          case CellType.BRIDGE:
            // First render water underneath
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.water || '#4682B4', brightness * 0.8);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            
            // Bridge planks
            this.ctx.fillStyle = adjustColorBrightness('#8B6F47', brightness);
            const plankWidth = cellSize / 5;
            const plankGap = 2;
            
            // Draw vertical planks
            for (let i = 0; i < 5; i++) {
              const plankX = screenPos.x - cellSize / 2 + i * (plankWidth + plankGap) + plankGap / 2;
              if (typeof this.ctx.fillRect === 'function') {
                this.ctx.fillRect(
                  plankX,
                  screenPos.y - cellSize / 2,
                  plankWidth - plankGap,
                  cellSize
                );
              }
            }
            
            // Bridge rails
            this.ctx.strokeStyle = adjustColorBrightness('#654321', brightness * 0.7);
            this.ctx.lineWidth = 2;
            if (typeof this.ctx.beginPath === 'function') {
              this.ctx.beginPath();
              // Left rail
              if (typeof this.ctx.moveTo === 'function') {
                this.ctx.moveTo(screenPos.x - cellSize / 2 + 2, screenPos.y - cellSize / 2);
              }
              if (typeof this.ctx.lineTo === 'function') {
                this.ctx.lineTo(screenPos.x - cellSize / 2 + 2, screenPos.y + cellSize / 2);
              }
              // Right rail
              if (typeof this.ctx.moveTo === 'function') {
                this.ctx.moveTo(screenPos.x + cellSize / 2 - 2, screenPos.y - cellSize / 2);
              }
              if (typeof this.ctx.lineTo === 'function') {
                this.ctx.lineTo(screenPos.x + cellSize / 2 - 2, screenPos.y + cellSize / 2);
              }
            }
            if (typeof this.ctx.stroke === 'function') {
              this.ctx.stroke();
            }
            break;
            
          case CellType.EMPTY:
          case CellType.DECORATIVE:
            // Render terrain with subtle variation
            const variation = coordinateVariation(x, y, 0.1);
            this.ctx.fillStyle = adjustColorBrightness(biomeColors.primary, brightness + variation);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            
            // Add subtle secondary color patches
            if ((x + y) % 7 === 0) {
              this.ctx.fillStyle = adjustColorBrightness(biomeColors.secondary, brightness + variation);
              if (typeof this.ctx.fillRect === 'function') {
                this.ctx.fillRect(
                  screenPos.x - cellSize / 4,
                  screenPos.y - cellSize / 4,
                  cellSize / 2,
                  cellSize / 2
                );
              }
            }
            break;
        }
      }
    }

    // Render grid lines
    this.ctx.strokeStyle = RENDER_CONFIG.gridLineColor;
    // Scale line width inversely with zoom to maintain consistent visual thickness
    const zoom = this.camera.getZoom();
    const lineWidth = ZOOM_RENDER_CONFIG.gridLineWidth.scaleInversely 
      ? ZOOM_RENDER_CONFIG.gridLineWidth.base / zoom
      : ZOOM_RENDER_CONFIG.gridLineWidth.base;
    this.ctx.lineWidth = Math.max(
      ZOOM_RENDER_CONFIG.gridLineWidth.min, 
      Math.min(ZOOM_RENDER_CONFIG.gridLineWidth.max, lineWidth)
    );
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * cellSize;
      const screenX = this.camera.worldToScreen({ x: worldX, y: 0 }).x;
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(screenX, 0);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(screenX, this.viewportHeight);
      }
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * cellSize;
      const screenY = this.camera.worldToScreen({ x: 0, y: worldY }).y;
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0, screenY);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(this.viewportWidth, screenY);
      }
    }

    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
  }

  renderDecorations(): void {
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();
    
    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));
    
    // Render decorations in visible cells
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellData = this.grid.getCellData(x, y);
        if (!cellData || !cellData.decoration) continue;
        
        const decoration = cellData.decoration;
        const screenPos = this.camera.worldToScreen(decoration.position);
        
        // Skip if not visible
        if (!this.camera.isVisible(decoration.position, cellSize)) continue;
        
        if (typeof this.ctx.save === 'function') {
          this.ctx.save();
        }
        if (typeof this.ctx.translate === 'function') {
          this.ctx.translate(screenPos.x, screenPos.y);
        }
        // Safety check for test environments
        if (typeof this.ctx.rotate === 'function') {
          this.ctx.rotate((decoration.rotation * Math.PI) / 180);
        }
        if (typeof this.ctx.scale === 'function') {
          this.ctx.scale(decoration.scale, decoration.scale);
        }
        
        // Render based on decoration type
        this.renderDecorationType(decoration.type, decoration.variant || 0, decoration.animated || false);
        
        if (typeof this.ctx.restore === 'function') {
          this.ctx.restore();
        }
      }
    }
  }

  private renderDecorationType(type: string, variant: number, animated: boolean): void {
    // Animation offset
    const animOffset = animated ? Math.sin(Date.now() * 0.001) * 2 : 0;
    
    // Safety check for canvas context methods
    if (!this.ctx || typeof this.ctx.beginPath !== 'function') {
      return;
    }
    
    switch (type) {
      // Forest decorations
      case 'tree_oak':
      case 'tree_pine':
        this.renderTree(type === 'tree_pine', variant, animOffset);
        break;
      case 'bush':
        this.renderBush(variant, animOffset);
        break;
      case 'boulder':
      case 'rock':
        this.renderRock(variant, type === 'boulder');
        break;
        
      // Desert decorations
      case 'cactus':
        this.renderCactus(variant);
        break;
      case 'rock_formation':
        this.renderRockFormation(variant);
        break;
      case 'dead_tree':
        this.renderDeadTree(variant);
        break;
      case 'sand_dune':
        this.renderSandDune(variant);
        break;
        
      // Arctic decorations
      case 'ice_formation':
        this.renderIceFormation(variant);
        break;
      case 'snow_pile':
        this.renderSnowPile(variant);
        break;
      case 'frozen_tree':
        this.renderFrozenTree(variant, animOffset);
        break;
        
      // Volcanic decorations
      case 'lava_rock':
        this.renderLavaRock(variant);
        break;
      case 'volcanic_boulder':
        this.renderVolcanicBoulder(variant);
        break;
      case 'ash_pile':
        this.renderAshPile(variant);
        break;
        
      // Grassland decorations
      case 'small_tree':
        this.renderSmallTree(variant, animOffset);
        break;
      case 'flower_patch':
        this.renderFlowerPatch(variant, animOffset);
        break;
      case 'tall_grass':
        this.renderTallGrass(variant, animOffset);
        break;
        
      default:
        // Generic decoration
        this.renderGenericDecoration();
    }
  }

  // Tree rendering
  private renderTree(isPine: boolean, variant: number, animOffset: number): void {
    if (isPine) {
      // Pine tree - triangular shape
      this.ctx.fillStyle = '#1B4F1B';
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0 + animOffset * 0.5, -20);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(-10, 5);
        this.ctx.lineTo(10, 5);
      }
      if (typeof this.ctx.closePath === 'function') {
        this.ctx.closePath();
      }
      if (typeof this.ctx.fill === 'function') {
        this.ctx.fill();
      }
      
      // Trunk
      this.ctx.fillStyle = '#4A2C17';
      if (typeof this.ctx.fillRect === 'function') {
        this.ctx.fillRect(-2, 5, 4, 8);
      }
    } else {
      // Oak tree - circular canopy
      this.ctx.fillStyle = variant === 0 ? '#2D5016' : '#3D6B1C';
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.arc === 'function') {
        this.ctx.arc(0 + animOffset, -10, 12, 0, Math.PI * 2);
      }
      if (typeof this.ctx.fill === 'function') {
        this.ctx.fill();
      }
      
      // Trunk
      this.ctx.fillStyle = '#4A2C17';
      if (typeof this.ctx.fillRect === 'function') {
        this.ctx.fillRect(-3, -2, 6, 12);
      }
    }
  }

  private renderBush(variant: number, animOffset: number): void {
    this.ctx.fillStyle = variant === 0 ? '#3A5F3A' : '#4B7C4B';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(-4 + animOffset * 0.3, 0, 6, 0, Math.PI * 2);
      this.ctx.arc(4 + animOffset * 0.3, 0, 6, 0, Math.PI * 2);
      this.ctx.arc(0, -3, 5, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderRock(variant: number, isLarge: boolean): void {
    const size = isLarge ? 12 : 8;
    this.ctx.fillStyle = variant === 0 ? '#5A5A5A' : '#6B6B6B';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(-size, size * 0.5);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(-size * 0.6, -size * 0.8);
      this.ctx.lineTo(size * 0.7, -size * 0.6);
      this.ctx.lineTo(size, size * 0.4);
    }
    if (typeof this.ctx.closePath === 'function') {
      this.ctx.closePath();
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
    
    // Add shading
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(0, -size * 0.7);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(size * 0.7, -size * 0.6);
      this.ctx.lineTo(size, size * 0.4);
      this.ctx.lineTo(0, size * 0.5);
    }
    if (typeof this.ctx.closePath === 'function') {
      this.ctx.closePath();
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderCactus(variant: number): void {
    this.ctx.fillStyle = '#4A7C59';
    // Main body
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(-4, -15, 8, 25);
    }
    
    // Arms
    if (variant === 0 || variant === 2) {
      if (typeof this.ctx.fillRect === 'function') {
        this.ctx.fillRect(-12, -5, 8, 4);
        this.ctx.fillRect(-12, -5, 4, 10);
      }
    }
    if (variant === 1 || variant === 2) {
      if (typeof this.ctx.fillRect === 'function') {
        this.ctx.fillRect(4, -8, 8, 4);
        this.ctx.fillRect(8, -8, 4, 12);
      }
    }
  }

  private renderRockFormation(variant: number): void {
    this.ctx.fillStyle = '#8B7355';
    // Multiple rock shapes
    const positions = [
      { x: -8, y: 5, w: 10, h: 15 },
      { x: 2, y: 8, w: 8, h: 12 },
      { x: -2, y: 0, w: 12, h: 20 }
    ];
    
    positions.forEach((pos, i) => {
      if (i <= variant) {
        if (typeof this.ctx.fillRect === 'function') {
          this.ctx.fillRect(pos.x - pos.w/2, -pos.h/2, pos.w, pos.h);
        }
      }
    });
  }

  private renderDeadTree(variant: number): void {
    this.ctx.strokeStyle = '#4A3C28';
    this.ctx.lineWidth = 3;
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(0, 10);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(0, -10);
    }
    
    // Branches
    if (variant === 0 || variant === 2) {
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0, -5);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(-8, -12);
      }
    }
    if (variant === 1 || variant === 2) {
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0, -8);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(6, -15);
      }
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
  }

  private renderSandDune(variant: number): void {
    this.ctx.fillStyle = '#E3C88F';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 5, 15 + variant * 2, 0, Math.PI, true);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderIceFormation(_variant: number): void {
    this.ctx.fillStyle = '#B3E5FC';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    // Crystalline shape
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(0, -15);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(-8, 5);
      this.ctx.lineTo(-4, 8);
      this.ctx.lineTo(4, 8);
      this.ctx.lineTo(8, 5);
    }
    if (typeof this.ctx.closePath === 'function') {
      this.ctx.closePath();
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
    
    // Add shine
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(0, -15);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(-4, -5);
      this.ctx.lineTo(0, -8);
    }
    if (typeof this.ctx.closePath === 'function') {
      this.ctx.closePath();
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderSnowPile(variant: number): void {
    this.ctx.fillStyle = '#F0F8FF';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 3, 10 + variant * 2, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderFrozenTree(_variant: number, animOffset: number): void {
    // Ice-covered tree
    this.ctx.fillStyle = '#A8D8EA';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0 + animOffset * 0.5, -10, 10, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
    
    // Icy trunk
    this.ctx.fillStyle = '#7FCDCD';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(-2, -2, 4, 12);
    }
  }

  private renderLavaRock(variant: number): void {
    this.ctx.fillStyle = '#2F1B14';
    this.renderRock(variant, false);
    
    // Add glowing cracks
    this.ctx.strokeStyle = '#FF4500';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(-4, 0);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(2, -3);
      this.ctx.lineTo(4, 2);
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
  }

  private renderVolcanicBoulder(variant: number): void {
    this.ctx.fillStyle = '#1A0E0A';
    this.renderRock(variant, true);
  }

  private renderAshPile(variant: number): void {
    this.ctx.fillStyle = '#4A4A4A';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 4, 8 + variant, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  private renderSmallTree(_variant: number, animOffset: number): void {
    this.ctx.fillStyle = '#7CFC00';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0 + animOffset * 0.7, -6, 8, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
    
    // Small trunk
    this.ctx.fillStyle = '#654321';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(-2, -1, 4, 8);
    }
  }

  private renderFlowerPatch(variant: number, animOffset: number): void {
    const colors = ['#FFB6C1', '#FFA07A', '#FFD700'];
    const flowerPositions = [
      { x: -4, y: 0 },
      { x: 4, y: -2 },
      { x: 0, y: 3 }
    ];
    
    flowerPositions.forEach((pos, i) => {
      if (i <= variant) {
        this.ctx.fillStyle = colors[i % colors.length]!;
        if (typeof this.ctx.beginPath === 'function') {
          this.ctx.beginPath();
        }
        if (typeof this.ctx.arc === 'function') {
          this.ctx.arc(pos.x + animOffset * 0.3, pos.y, 3, 0, Math.PI * 2);
        }
        if (typeof this.ctx.fill === 'function') {
          this.ctx.fill();
        }
      }
    });
  }

  private renderTallGrass(variant: number, animOffset: number): void {
    this.ctx.strokeStyle = '#7CFC00';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i <= variant; i++) {
      const x = (i - 1) * 4;
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(x, 5);
      }
      if (typeof this.ctx.quadraticCurveTo === 'function') {
        this.ctx.quadraticCurveTo(x + animOffset, -2, x + animOffset * 2, -8);
      }
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }
  }

  private renderGenericDecoration(): void {
    // Fallback for unknown decoration types
    this.ctx.fillStyle = '#888888';
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
    }
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  setEnvironmentalEffects(effects: EnvironmentalEffect[]): void {
    this.environmentalEffects = effects;
  }

  private renderEnvironmentalEffects(): void {
    if (!this.environmentalEffects || this.environmentalEffects.length === 0) return;
    
    this.environmentalEffects.forEach(effect => {
      switch (effect.type) {
        case 'PARTICLES':
          this.renderParticleEffect(effect);
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

  // Helper method to convert entity position for rendering
  private getScreenPosition(entity: Entity | Vector2): Vector2 {
    const worldPos = 'position' in entity ? entity.position : entity;
    return this.camera.worldToScreen(worldPos);
  }

  renderTower(tower: Tower, isSelected: boolean = false): void {
    // Skip if not visible
    if (!this.camera.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    const zoom = this.camera.getZoom();
    
    // Draw selection ring if selected
    if (isSelected) {
      this.ctx.save();
      
      // Pulsing effect
      const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      
      // Outer selection ring
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, (tower.radius + 10) * zoom * pulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFD700'; // Gold color
      this.ctx.lineWidth = Math.max(1, 3);
      this.ctx.stroke();
      
      // Inner selection ring
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, (tower.radius + 5) * zoom * pulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFA500'; // Orange color
      this.ctx.lineWidth = Math.max(1, 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // Pass zoom to the tower render method instead of scaling context
    tower.render(this.ctx, screenPos, this.textureManager, isSelected, zoom);
    
    // Also call the separate upgrade dots method for testing compatibility
    this.renderTowerUpgradeDots(tower);
  }

  renderTowerUpgradeDots(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    const zoom = this.camera.getZoom();
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = ['#FF4444', '#44FF44', '#4444FF']; // Red, Green, Blue
    const dotRadius = 3 * zoom; // Scale dot radius with zoom
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * 120) * (Math.PI / 180); // 120 degrees apart
        const distance = (tower.radius + 8) * zoom; // Scale distance with zoom
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4 * zoom); // Scale spacing with zoom
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          this.ctx.beginPath();
          this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = colors[index];
          this.ctx.fill();
          
          // Dot outline
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = Math.max(0.5, 1); // Fixed line width
          this.ctx.stroke();
        }
      }
    });
  }


  renderEnemy(enemy: Enemy): void {
    if (!this.camera.isVisible(enemy.position, enemy.radius)) return;
    const screenPos = this.getScreenPosition(enemy);
    const zoom = this.camera.getZoom();
    
    // Pass zoom to the enemy render method instead of scaling context
    enemy.render(this.ctx, screenPos, this.textureManager, zoom);
    
    // Render target line with proper scaling
    enemy.renderTargetLine(this.ctx, screenPos, this.getScreenPosition.bind(this), this.camera);
  }

  renderProjectile(projectile: Projectile): void {
    if (!this.camera.isVisible(projectile.position, projectile.radius)) return;
    const screenPos = this.getScreenPosition(projectile);
    const zoom = this.camera.getZoom();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('projectile');
    
    if (texture && texture.loaded) {
      const scaledSize = projectile.radius * 2 * zoom;
      this.renderTextureAt(texture, screenPos, scaledSize, scaledSize);
    } else {
      // Enhanced primitive rendering based on projectile type
      this.ctx.save();
      this.ctx.translate(screenPos.x, screenPos.y);
      this.ctx.scale(zoom, zoom);
      
      const rotation = projectile.getRotation();
      
      switch (projectile.projectileType) {
        case 'SNIPER_ROUND':
          // Long, thin bullet
          this.ctx.rotate(rotation);
          
          // Bullet trail
          const gradient = this.ctx.createLinearGradient(-projectile.radius * 3, 0, projectile.radius, 0);
          gradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
          gradient.addColorStop(0.7, 'rgba(100, 200, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(200, 220, 255, 1)');
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(-projectile.radius * 3, -projectile.radius * 0.3, projectile.radius * 4, projectile.radius * 0.6);
          
          // Main bullet
          this.ctx.fillStyle = '#E0F0FF';
          this.ctx.fillRect(-projectile.radius, -projectile.radius * 0.4, projectile.radius * 2, projectile.radius * 0.8);
          
          // Tip
          this.ctx.beginPath();
          this.ctx.moveTo(projectile.radius, 0);
          this.ctx.lineTo(projectile.radius * 1.5, -projectile.radius * 0.3);
          this.ctx.lineTo(projectile.radius * 1.5, projectile.radius * 0.3);
          this.ctx.closePath();
          this.ctx.fill();
          break;
          
        case 'RAPID_PELLET':
          // Small orange pellet
          this.ctx.beginPath();
          this.ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#FF6B35';
          this.ctx.fill();
          
          // Glow effect
          this.ctx.beginPath();
          this.ctx.arc(0, 0, projectile.radius * 1.5, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
          this.ctx.fill();
          break;
          
        case 'PLAYER_SHOT':
          // Green energy shot
          this.ctx.beginPath();
          this.ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#00FF00';
          this.ctx.fill();
          this.ctx.strokeStyle = '#00AA00';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          break;
          
        case 'BASIC_BULLET':
        default:
          // Yellow circular bullet with glow
          this.ctx.beginPath();
          this.ctx.arc(0, 0, projectile.radius * 1.5, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#FFEB3B';
          this.ctx.fill();
          
          this.ctx.strokeStyle = '#FFC107';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          break;
      }
      
      this.ctx.restore();
    }
  }

  renderPlayer(player: Player): void {
    if (!this.camera.isVisible(player.position, player.radius)) return;
    const screenPos = this.getScreenPosition(player);
    const zoom = this.camera.getZoom();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('player');
    
    if (texture && texture.loaded) {
      const scaledSize = player.radius * 2 * zoom;
      this.renderTextureAt(texture, screenPos, scaledSize, scaledSize);
    } else {
      // Enhanced primitive rendering for player
      this.ctx.save();
      this.ctx.translate(screenPos.x, screenPos.y);
      this.ctx.scale(zoom, zoom);
      
      // Player color based on level
      const level = player.getLevel();
      const hue = Math.min(180 + level * 20, 280); // Blue to purple progression
      const mainColor = `hsl(${hue}, 70%, 60%)`;
      const darkColor = `hsl(${hue}, 70%, 40%)`;
      const lightColor = `hsl(${hue}, 70%, 80%)`;
      
      // Body (torso)
      this.ctx.fillStyle = mainColor;
      this.ctx.fillRect(-player.radius * 0.6, -player.radius * 0.4, player.radius * 1.2, player.radius * 0.8);
      
      // Head with helmet
      this.ctx.beginPath();
      this.ctx.arc(0, -player.radius * 0.7, player.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = lightColor;
      this.ctx.fill();
      
      // Helmet top
      this.ctx.beginPath();
      this.ctx.arc(0, -player.radius * 0.7, player.radius * 0.4, Math.PI, 0);
      this.ctx.fillStyle = mainColor;
      this.ctx.fill();
      
      // Visor
      this.ctx.fillStyle = darkColor;
      this.ctx.fillRect(-player.radius * 0.3, -player.radius * 0.75, player.radius * 0.6, player.radius * 0.15);
      
      // Arms
      this.ctx.fillStyle = darkColor;
      this.ctx.fillRect(-player.radius * 0.9, -player.radius * 0.3, player.radius * 0.3, player.radius * 0.6);
      this.ctx.fillRect(player.radius * 0.6, -player.radius * 0.3, player.radius * 0.3, player.radius * 0.6);
      
      // Legs
      this.ctx.fillRect(-player.radius * 0.4, player.radius * 0.3, player.radius * 0.3, player.radius * 0.5);
      this.ctx.fillRect(player.radius * 0.1, player.radius * 0.3, player.radius * 0.3, player.radius * 0.5);
      
      // Armor details
      this.ctx.fillStyle = lightColor;
      this.ctx.fillRect(-player.radius * 0.2, -player.radius * 0.2, player.radius * 0.4, player.radius * 0.3);
      
      // Level badge on chest
      if (level > 1) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, player.radius * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = darkColor;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
      
      // Player outline
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, player.radius + 2, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // Movement indicator (if moving)
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > 0) {
        // Draw movement trail with zoom scaling
        if (typeof this.ctx.beginPath === 'function') {
          this.ctx.beginPath();
        }
        if (typeof this.ctx.arc === 'function') {
          this.ctx.arc(screenPos.x, screenPos.y, (player.radius + 3) * zoom, 0, Math.PI * 2);
        }
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = zoom;
        if (typeof this.ctx.stroke === 'function') {
          this.ctx.stroke();
        }
      }
    }
    
    // Level indicator with zoom scaling
    const level = player.getLevel();
    if (level > 1) {
      const fontSize = Math.max(8, 10 * zoom); // Minimum readable size
      this.renderText(
        level.toString(),
        screenPos.x,
        screenPos.y + 4 * zoom,
        '#FFFFFF',
        `bold ${fontSize}px Arial`,
        'center'
      );
    }
  }

  renderHealthPickup(pickup: HealthPickup): void {
    if (!pickup.isActive || !this.camera.isVisible(pickup.position, pickup.radius)) return;
    
    const screenPos = this.getScreenPosition(pickup);
    const visualY = pickup.getVisualY() - pickup.position.y + screenPos.y;
    const rotation = pickup.getRotation();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('health_pickup');
    
    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }
    if (typeof this.ctx.translate === 'function') {
      this.ctx.translate(screenPos.x, visualY);
    }
    // Safety check for test environments
    if (typeof this.ctx.rotate === 'function') {
      this.ctx.rotate(rotation);
    }
    
    if (texture && texture.loaded) {
      if (typeof this.ctx.drawImage === 'function') {
        this.ctx.drawImage(
          texture.image,
          -pickup.radius,
          -pickup.radius,
          pickup.radius * 2,
          pickup.radius * 2
        );
      }
    } else {
      // Fallback to primitive rendering
      this.ctx.strokeStyle = '#00FF00';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      
      // Vertical line
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0, -6);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(0, 6);
      }
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
      
      // Horizontal line  
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(-6, 0);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(6, 0);
      }
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }
    
    // Glow effect
    this.ctx.shadowColor = '#00FF00';
    this.ctx.shadowBlur = 10;
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    
    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  renderCollectible(collectible: Collectible): void {
    if (!this.camera.isVisible(collectible.position, collectible.radius)) return;
    
    const screenPos = this.getScreenPosition(collectible);
    collectible.render(this.ctx, screenPos);
  }

  renderDestructionEffect(effect: DestructionEffect): void {
    if (!effect || effect.isComplete) return;
    effect.render(this.ctx, this.camera);
  }

  // PowerUp rendering removed - type not defined


  renderAimerLine(aimerLine: { start: Vector2; end: Vector2 }): void {
    // Safety check for undefined properties
    if (!aimerLine || !aimerLine.start || !aimerLine.end) {
      return;
    }
    
    const screenStart = this.camera.worldToScreen(aimerLine.start);
    const screenEnd = this.camera.worldToScreen(aimerLine.end);
    
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(screenStart.x, screenStart.y);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
    }
    
    // Dashed line
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash(RENDER_CONFIG.dashPattern);
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    
    // Reset line dash
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]);
    }
    
    // Aim point
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenEnd.x, screenEnd.y, 3, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  // Health bar rendering has been moved to the HealthBarPopup system
  // This method is preserved for backwards compatibility but is no longer used
  renderHealthBar(_entity: Entity, _alwaysShow: boolean = false): void {
    // Health bars are now handled by the HealthBarPopup component
  }

  renderTowerRange(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.range)) return;
    
    const screenPos = this.getScreenPosition(tower);
    const zoom = this.camera.getZoom();
    
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tower.range * zoom, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2 * zoom;
    if (typeof this.ctx.setLineDash === 'function') {
      const scaledPattern = RENDER_CONFIG.dashPattern.map(dash => dash * zoom);
      this.ctx.setLineDash(scaledPattern);
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]); // Reset line dash
    }
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    // Create a temporary tower to get its stats
    const tempTower = new Tower(towerType, position);
    
    const screenPos = this.camera.worldToScreen(position);
    
    // Save current context state
    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }
    
    // Set transparency for ghost effect
    this.ctx.globalAlpha = RENDER_CONFIG.ghostOpacity;
    
    // Render tower body
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tempTower.radius, 0, Math.PI * 2);
    }
    
    // Color based on placement validity
    if (canPlace) {
      // Green tint for valid placement
      switch (towerType) {
        case TowerType.BASIC:
          this.ctx.fillStyle = '#81C784'; // Light green
          break;
        case TowerType.SNIPER:
          this.ctx.fillStyle = '#64B5F6'; // Light blue
          break;
        case TowerType.RAPID:
          this.ctx.fillStyle = '#FFB74D'; // Light orange
          break;
        case TowerType.WALL:
          this.ctx.fillStyle = '#9E9E9E'; // Light gray
          break;
      }
    } else {
      // Red tint for invalid placement
      this.ctx.fillStyle = '#E57373'; // Light red
    }
    
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
    
    // Tower outline
    this.ctx.strokeStyle = canPlace ? '#4CAF50' : '#F44336';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    
    // Show range preview
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tempTower.range, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([3, 3]);
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]); // Reset line dash
    }
    
    // Restore context state
    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  // Helper method to render texture at specific position and size
  private renderTextureAt(texture: Texture, position: Vector2, width: number, height: number): void {
    if (typeof this.ctx.drawImage === 'function') {
      this.ctx.drawImage(
        texture.image,
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
      );
    }
  }

  renderText(
    text: string, 
    x: number, 
    y: number, 
    color: string = '#ffffff', 
    font: string = '16px Arial',
    align: CanvasTextAlign = 'left'
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    if (typeof this.ctx.fillText === 'function') {
      this.ctx.fillText(text, x, y);
    }
  }

  renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], destructionEffects: DestructionEffect[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player, selectedTower?: Tower | null): void {
    // Render towers with health bars
    towers.forEach(tower => {
      this.renderTower(tower, tower === selectedTower);
      // Health bars are now handled by the HealthBarPopup system
    });

    // Render enemies with health bars
    enemies.forEach(enemy => {
      this.renderEnemy(enemy);
      // Health bars are now handled by the HealthBarPopup system
    });

    // Render collectibles
    collectibles.forEach(collectible => {
      this.renderCollectible(collectible);
    });

    // Render projectiles
    projectiles.forEach(projectile => {
      this.renderProjectile(projectile);
    });

    // Render player with health bar
    if (player) {
      this.renderPlayer(player);
      // Health bars are now handled by the HealthBarPopup system
    }

    // Render aimer line
    if (aimerLine) {
      this.renderAimerLine(aimerLine);
    }

    // Render destruction effects
    destructionEffects.forEach(effect => {
      this.renderDestructionEffect(effect);
    });
  }

  renderScene(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], destructionEffects: DestructionEffect[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player, selectedTower?: Tower | null, navGrid?: NavigationGrid): void {
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
    
    // Render all entities
    this.renderEntities(towers, enemies, projectiles, collectibles, destructionEffects, aimerLine, player, selectedTower);
    
    // Render pathfinding debug if enabled
    if (navGrid) {
      PathfindingDebug.render(this.ctx, this.grid, navGrid, enemies, this.camera);
    }
    
    // Render debug overlay if enabled
    if (this.debugMode) {
      this.renderDebugOverlay(player);
    }
  }

  renderUI(_currency: number, _lives: number, _score: number, _wave: number): void {
    
    // this.renderText(`Currency: $${currency}`, padding, padding + fontSize, COLOR_CONFIG.ui.currency, `${fontSize}px Arial`);
    // this.renderText(`Lives: ${lives}`, padding, padding + fontSize + lineHeight, COLOR_CONFIG.ui.lives, `${fontSize}px Arial`);
    // this.renderText(`Score: ${score}`, padding, padding + fontSize + lineHeight * 2, COLOR_CONFIG.ui.score, `${fontSize}px Arial`);
    // this.renderText(`Wave: ${wave}`, padding, padding + fontSize + lineHeight * 3, COLOR_CONFIG.ui.wave, `${fontSize}px Arial`);
  }

  renderGameOver(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Game Over text
    this.renderText(
      'GAME OVER',
      this.canvas.width / 2,
      this.canvas.height / 2,
      COLOR_CONFIG.ui.lives,
      '48px Arial',
      'center'
    );
  }

  renderVictory(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Victory text
    this.renderText(
      'VICTORY!',
      this.canvas.width / 2,
      this.canvas.height / 2,
      COLOR_CONFIG.ui.score,
      '48px Arial',
      'center'
    );
  }

  renderPaused(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Paused text
    this.renderText(
      'PAUSED',
      this.canvas.width / 2,
      this.canvas.height / 2,
      COLOR_CONFIG.ui.currency,
      '48px Arial',
      'center'
    );
    
    // Instructions
    this.renderText(
      'Press SPACE to resume',
      this.canvas.width / 2,
      this.canvas.height / 2 + 60,
      '#FFFFFF',
      '20px Arial',
      'center'
    );
    
    this.renderText(
      'Press M for Main Menu',
      this.canvas.width / 2,
      this.canvas.height / 2 + 90,
      '#CCCCCC',
      '16px Arial',
      'center'
    );
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
    return this.canvas.width;
  }

  getCanvasHeight(): number {
    return this.canvas.height;
  }

  // Toggle debug mode
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Render debug overlay
  private renderDebugOverlay(player?: Player): void {
    if (!player) return;

    // Get camera info
    const cameraInfo = this.camera.getCameraInfo();
    const playerScreenPos = this.camera.worldToScreen(player.position);
    
    // Draw crosshair at screen center
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    
    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 20, centerY);
    this.ctx.lineTo(centerX + 20, centerY);
    this.ctx.stroke();
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 20);
    this.ctx.lineTo(centerX, centerY + 20);
    this.ctx.stroke();
    
    // Draw circle at center
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw line from center to player
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(playerScreenPos.x, playerScreenPos.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw player marker
    this.ctx.strokeStyle = '#FFFF00';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(playerScreenPos.x, playerScreenPos.y, 15, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Debug text
    const debugText = [
      `Camera Following: ${cameraInfo.followTarget ? 'YES' : 'NO'}`,
      `Camera Pos: (${cameraInfo.position.x.toFixed(0)}, ${cameraInfo.position.y.toFixed(0)})`,
      `Player World: (${player.position.x.toFixed(0)}, ${player.position.y.toFixed(0)})`,
      `Player Screen: (${playerScreenPos.x.toFixed(0)}, ${playerScreenPos.y.toFixed(0)})`,
      `Distance from Center: ${Math.sqrt(Math.pow(playerScreenPos.x - centerX, 2) + Math.pow(playerScreenPos.y - centerY, 2)).toFixed(1)}px`,
      `Zoom: ${cameraInfo.zoom.toFixed(2)}`,
      `Player Moving: ${player.isMoving() ? 'YES' : 'NO'}`
    ];
    
    // Background for text
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 100, 300, debugText.length * 20 + 20);
    
    // Debug text
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '14px monospace';
    debugText.forEach((text, i) => {
      this.ctx.fillText(text, 20, 120 + i * 20);
    });
  }
}