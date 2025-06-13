import { Tower, TowerType } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player, PlayerUpgradeType } from '../entities/Player';
import { Collectible } from '../entities/Collectible';
import { Entity } from '../entities/Entity';
import { Grid, CellType } from './Grid';
import { Camera } from './Camera';
import { UpgradeType } from '../entities/Tower';
import { TextureManager, type Texture, type SpriteFrame } from './TextureManager';
import type { Vector2 } from '../utils/Vector2';
import { COLOR_CONFIG, RENDER_CONFIG, UPGRADE_CONFIG } from '../config/GameConfig';
import { BIOME_PRESETS, BiomeType } from '../types/MapData';
import type { BiomeColors, EnvironmentalEffect } from '../types/MapData';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grid: Grid;
  private camera: Camera;
  private viewportWidth: number;
  private viewportHeight: number;
  private textureManager: TextureManager;
  private environmentalEffects: EnvironmentalEffect[] = [];

  constructor(canvas: HTMLCanvasElement, grid: Grid, camera: Camera, textureManager?: TextureManager) {
    this.canvas = canvas;
    this.grid = grid;
    this.camera = camera;
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;
    this.textureManager = textureManager || new TextureManager();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
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

  private adjustBrightness(color: string, brightness: number): string {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust brightness
    const newR = Math.floor(Math.min(255, r * brightness));
    const newG = Math.floor(Math.min(255, g * brightness));
    const newB = Math.floor(Math.min(255, b * brightness));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  renderGrid(): void {
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
            this.ctx.fillStyle = this.adjustBrightness(biomeColors.path, brightness);
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
            this.ctx.fillStyle = this.adjustBrightness(biomeColors.border, brightness * 0.7);
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
            this.ctx.fillStyle = this.adjustBrightness(RENDER_CONFIG.obstacleColor, brightness);
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
            this.ctx.strokeStyle = this.adjustBrightness('#888888', brightness * 0.8);
            this.ctx.lineWidth = 2;
            if (typeof this.ctx.stroke === 'function') {
              this.ctx.stroke();
            }
            break;
            
          case CellType.SPAWN_ZONE:
            // Render spawn zones with pulsing effect
            const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
            this.ctx.fillStyle = this.adjustBrightness(biomeColors.accent, brightness * pulse);
            if (typeof this.ctx.fillRect === 'function') {
              this.ctx.fillRect(
                screenPos.x - cellSize / 2,
                screenPos.y - cellSize / 2,
                cellSize,
                cellSize
              );
            }
            break;
            
          case CellType.EMPTY:
          case CellType.DECORATIVE:
            // Render terrain with subtle variation
            const variation = (x * 7 + y * 13) % 5 / 5 * 0.1; // Pseudo-random variation
            this.ctx.fillStyle = this.adjustBrightness(biomeColors.primary, brightness + variation);
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
              this.ctx.fillStyle = this.adjustBrightness(biomeColors.secondary, brightness + variation);
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
    this.ctx.lineWidth = 1;
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

  private renderIceFormation(variant: number): void {
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

  private renderFrozenTree(variant: number, animOffset: number): void {
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

  private renderSmallTree(variant: number, animOffset: number): void {
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

  private renderAnimationEffect(effect: EnvironmentalEffect): void {
    // This would typically affect how decorations are rendered
    // For now, we'll skip implementation as decorations handle their own animation
  }

  // Helper method to convert entity position for rendering
  private getScreenPosition(entity: Entity | Vector2): Vector2 {
    const worldPos = 'position' in entity ? entity.position : entity;
    return this.camera.worldToScreen(worldPos);
  }

  renderTower(tower: Tower): void {
    // Skip if not visible
    if (!this.camera.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    tower.render(this.ctx, screenPos, this.textureManager);
    
    // Also call the separate upgrade dots method for testing compatibility
    this.renderTowerUpgradeDots(tower);
  }

  renderTowerUpgradeDots(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = ['#FF4444', '#44FF44', '#4444FF']; // Red, Green, Blue
    const dotRadius = 3;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * 120) * (Math.PI / 180); // 120 degrees apart
        const distance = tower.radius + 8;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4);
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          this.ctx.beginPath();
          this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = colors[index];
          this.ctx.fill();
          
          // Dot outline
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    });
  }


  renderEnemy(enemy: Enemy): void {
    if (!this.camera.isVisible(enemy.position, enemy.radius)) return;
    const screenPos = this.getScreenPosition(enemy);
    
    enemy.render(this.ctx, screenPos, this.textureManager);
    enemy.renderTargetLine(this.ctx, screenPos, this.getScreenPosition.bind(this), this.camera);
  }

  renderProjectile(projectile: Projectile): void {
    if (!this.camera.isVisible(projectile.position, projectile.radius)) return;
    const screenPos = this.getScreenPosition(projectile);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('projectile');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, projectile.radius * 2, projectile.radius * 2);
    } else {
      // Fallback to primitive rendering
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.arc === 'function') {
        this.ctx.arc(screenPos.x, screenPos.y, projectile.radius, 0, Math.PI * 2);
      }
      this.ctx.fillStyle = '#FFEB3B';
      if (typeof this.ctx.fill === 'function') {
        this.ctx.fill();
      }
      
      this.ctx.strokeStyle = '#FFC107';
      this.ctx.lineWidth = 1;
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }
  }

  renderPlayer(player: Player): void {
    if (!this.camera.isVisible(player.position, player.radius)) return;
    const screenPos = this.getScreenPosition(player);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('player');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, player.radius * 2, player.radius * 2);
    } else {
      // Fallback to primitive rendering
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.arc === 'function') {
        this.ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);
      }
      
      // Player color based on level
      const level = player.getLevel();
      const hue = Math.min(180 + level * 20, 280); // Blue to purple progression
      this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      if (typeof this.ctx.fill === 'function') {
        this.ctx.fill();
      }
      
      // Player outline
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }
    
    // Movement indicator (if moving)
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > 0) {
        // Draw movement trail
        if (typeof this.ctx.beginPath === 'function') {
          this.ctx.beginPath();
        }
        if (typeof this.ctx.arc === 'function') {
          this.ctx.arc(screenPos.x, screenPos.y, player.radius + 3, 0, Math.PI * 2);
        }
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        if (typeof this.ctx.stroke === 'function') {
          this.ctx.stroke();
        }
      }
    }
    
    // Level indicator
    const level = player.getLevel();
    if (level > 1) {
      this.renderText(
        level.toString(),
        screenPos.x,
        screenPos.y + 4,
        '#FFFFFF',
        'bold 10px Arial',
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

  renderPowerUp(powerUp: PowerUp): void {
    if (!powerUp.isActive || !this.camera.isVisible(powerUp.position, powerUp.radius)) return;

    const screenPos = this.getScreenPosition(powerUp);
    const visualY = powerUp.getVisualY() - powerUp.position.y + screenPos.y;
    const rotation = powerUp.getRotation();
    const scale = powerUp.getPulseScale();
    const config = powerUp.getConfig();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('power_up');
    
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
    if (typeof this.ctx.scale === 'function') {
      this.ctx.scale(scale, scale);
    }
    
    if (texture && texture.loaded) {
      if (typeof this.ctx.drawImage === 'function') {
        this.ctx.drawImage(
          texture.image,
          -powerUp.radius,
          -powerUp.radius,
          powerUp.radius * 2,
          powerUp.radius * 2
        );
      }
    } else {
      // Fallback to primitive rendering
      this.ctx.fillStyle = config.color;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      
      switch (powerUp.powerUpType) {
        case 'EXTRA_DAMAGE':
          // Draw sword/damage icon
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(-8, 8);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, -8);
            this.ctx.lineTo(6, -10);
            this.ctx.lineTo(-10, 6);
          }
          if (typeof this.ctx.closePath === 'function') {
            this.ctx.closePath();
          }
          if (typeof this.ctx.fill === 'function') {
            this.ctx.fill();
          }
          if (typeof this.ctx.stroke === 'function') {
            this.ctx.stroke();
          }
          break;
          
        case 'FASTER_SHOOTING':
          // Draw rapid fire arrows
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(-8, 0);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, 0);
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(4, -4);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, 0);
            this.ctx.lineTo(4, 4);
          }
          if (typeof this.ctx.stroke === 'function') {
            this.ctx.stroke();
          }
          break;
          
        case 'EXTRA_CURRENCY':
          // Draw coin
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.arc === 'function') {
            this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
          }
          if (typeof this.ctx.fill === 'function') {
            this.ctx.fill();
          }
          if (typeof this.ctx.stroke === 'function') {
            this.ctx.stroke();
          }
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.font = 'bold 10px Arial';
          this.ctx.textAlign = 'center';
          if (typeof this.ctx.fillText === 'function') {
            this.ctx.fillText('$', 0, 3);
          }
          break;
          
        case 'SHIELD':
          // Draw shield
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.arc === 'function') {
            this.ctx.arc(0, 0, 8, 0, Math.PI);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(-8, 8);
            this.ctx.lineTo(8, 8);
          }
          if (typeof this.ctx.closePath === 'function') {
            this.ctx.closePath();
          }
          if (typeof this.ctx.fill === 'function') {
            this.ctx.fill();
          }
          if (typeof this.ctx.stroke === 'function') {
            this.ctx.stroke();
          }
          break;
          
        case 'SPEED_BOOST':
          // Draw wing/speed lines
          if (typeof this.ctx.beginPath === 'function') {
            this.ctx.beginPath();
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(-8, -4);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, -4);
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(-6, 0);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, 0);
          }
          if (typeof this.ctx.moveTo === 'function') {
            this.ctx.moveTo(-8, 4);
          }
          if (typeof this.ctx.lineTo === 'function') {
            this.ctx.lineTo(8, 4);
          }
          if (typeof this.ctx.stroke === 'function') {
            this.ctx.stroke();
          }
          break;
      }
    }
    
    // Glow effect
    this.ctx.shadowColor = config.color;
    this.ctx.shadowBlur = 15;
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = `rgba(${this.hexToRgb(config.color)}, 0.3)`;
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    
    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '255, 255, 255';
  }

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

  renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
    // Show health bar if damaged or if alwaysShow is true
    if (!alwaysShow && entity.health >= entity.maxHealth) {
      return;
    }

    // Skip if entity is not visible
    if (!this.camera.isVisible(entity.position, entity.radius + 10)) return;

    const screenPos = this.getScreenPosition(entity);
    const barWidth = RENDER_CONFIG.healthBarWidth;
    const barHeight = RENDER_CONFIG.healthBarHeight;
    const x = screenPos.x - barWidth / 2;
    const y = screenPos.y - entity.radius - 10;
    
    // Background
    this.ctx.fillStyle = '#222222';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
    
    // Health bar
    const healthPercentage = entity.health / entity.maxHealth;
    const healthWidth = barWidth * healthPercentage;
    
    if (healthPercentage > 0.6) {
      this.ctx.fillStyle = COLOR_CONFIG.health.high;
    } else if (healthPercentage > 0.3) {
      this.ctx.fillStyle = COLOR_CONFIG.health.medium;
    } else {
      this.ctx.fillStyle = COLOR_CONFIG.health.low;
    }
    
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(x, y, healthWidth, barHeight);
    }
    
    // Health bar outline
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.strokeRect === 'function') {
      this.ctx.strokeRect(x, y, barWidth, barHeight);
    }
  }

  renderTowerRange(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.range)) return;
    
    const screenPos = this.getScreenPosition(tower);
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tower.range, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash(RENDER_CONFIG.dashPattern);
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

  renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player): void {
    // Render towers with health bars
    towers.forEach(tower => {
      this.renderTower(tower);
      this.renderHealthBar(tower, true); // Always show tower health
    });

    // Render enemies with health bars
    enemies.forEach(enemy => {
      this.renderEnemy(enemy);
      this.renderHealthBar(enemy, true); // Always show enemy health
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
      this.renderHealthBar(player, true); // Always show player health
    }

    // Render aimer line
    if (aimerLine) {
      this.renderAimerLine(aimerLine);
    }
  }

  renderScene(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], effects: any[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player): void {
    // Clear canvas with biome-appropriate background
    const biome = this.grid.getBiome();
    const biomeColors = this.getBiomeColors(biome);
    this.clear(this.adjustBrightness(biomeColors.primary, 0.3));
    
    // Render grid with biome colors
    this.renderGrid();
    
    // Render decorations
    this.renderDecorations();
    
    // Render environmental effects
    this.renderEnvironmentalEffects();
    
    // Render all entities
    this.renderEntities(towers, enemies, projectiles, collectibles, aimerLine, player);
  }

  renderUI(currency: number, lives: number, score: number, wave: number): void {
    const padding = 10;
    const fontSize = 18;
    const lineHeight = 25;
    
    this.renderText(`Currency: $${currency}`, padding, padding + fontSize, COLOR_CONFIG.ui.currency, `${fontSize}px Arial`);
    this.renderText(`Lives: ${lives}`, padding, padding + fontSize + lineHeight, COLOR_CONFIG.ui.lives, `${fontSize}px Arial`);
    this.renderText(`Score: ${score}`, padding, padding + fontSize + lineHeight * 2, COLOR_CONFIG.ui.score, `${fontSize}px Arial`);
    this.renderText(`Wave: ${wave}`, padding, padding + fontSize + lineHeight * 3, COLOR_CONFIG.ui.wave, `${fontSize}px Arial`);
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
  }

  renderTowerUpgradePanel(tower: Tower, x: number, y: number): void {
    const panelWidth = 250;
    const panelHeight = 180;
    
    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(x, y, panelWidth, panelHeight);
    }
    
    // Panel border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.strokeRect === 'function') {
      this.ctx.strokeRect(x, y, panelWidth, panelHeight);
    }
    
    // Tower info
    const padding = 10;
    let currentY = y + padding + 20;
    
    this.renderText(
      `${tower.towerType} Tower (Level ${tower.getLevel()})`,
      x + padding,
      currentY,
      '#FFFFFF',
      'bold 16px Arial'
    );
    
    currentY += 25;
    
    // Stats
    this.renderText(
      `Damage: ${tower.damage} | Range: ${tower.range} | Fire Rate: ${tower.fireRate.toFixed(1)}`,
      x + padding,
      currentY,
      '#CCCCCC',
      '12px Arial'
    );
    
    currentY += 25;
    
    // Upgrade options
    const upgradeTypes = ['DAMAGE', 'RANGE', 'FIRE_RATE'];
    const upgradeNames = ['Damage', 'Range', 'Fire Rate'];
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType as any);
      const cost = tower.getUpgradeCost(upgradeType as any);
      const canUpgrade = tower.canUpgrade(upgradeType as any);
      
      const color = canUpgrade ? COLOR_CONFIG.health.high : '#666666';
      const text = `${upgradeNames[index]}: Lv.${level}/${UPGRADE_CONFIG.maxLevel} (${cost > 0 ? `$${cost}` : 'MAX'})`;
      
      this.renderText(
        text,
        x + padding,
        currentY,
        color,
        '14px Arial'
      );
      
      currentY += 20;
    });
    
    // Instructions
    this.renderText(
      'Click tower upgrades in UI panel',
      x + padding,
      y + panelHeight - 15,
      '#888888',
      '12px Arial'
    );
  }
}