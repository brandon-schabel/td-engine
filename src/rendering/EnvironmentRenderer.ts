/**
 * Environment Renderer
 * Specialized renderer for the game world environment (grid, background, effects)
 */

import { BaseRenderer } from './BaseRenderer';
import { Grid, CellType } from '@/systems/Grid';
import { Tower, TowerType } from '@/entities/Tower';
import { RENDER_CONFIG } from '../config/GameConfig';
import type { Vector2 } from '@/utils/Vector2';

export class EnvironmentRenderer extends BaseRenderer {
  private grid: Grid;

  constructor(
    canvas: HTMLCanvasElement,
    camera: any,
    textureManager: any,
    grid: Grid
  ) {
    super(canvas, camera, textureManager);
    this.grid = grid;
  }

  renderGrid(): void {
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();
    
    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));
    
    // Render cell backgrounds
    this.renderCellBackgrounds(startX, endX, startY, endY, cellSize);
    
    // Render grid lines
    this.renderGridLines(startX, endX, startY, endY, cellSize);
  }

  private renderCellBackgrounds(startX: number, endX: number, startY: number, endY: number, cellSize: number): void {
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellType = this.grid.getCellType(x, y);
        const worldPos = this.grid.gridToWorld(x, y);
        const screenPos = this.getScreenPosition(worldPos);
        
        this.renderCell(cellType, screenPos, cellSize);
      }
    }
  }

  private renderCell(cellType: CellType, screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;
    
    switch (cellType) {
      case CellType.PATH:
        this.ctx.fillStyle = RENDER_CONFIG.pathColor;
        this.ctx.fillRect(
          screenPos.x - halfSize,
          screenPos.y - halfSize,
          cellSize,
          cellSize
        );
        break;
      
      case CellType.BLOCKED:
        this.ctx.fillStyle = RENDER_CONFIG.blockedColor;
        this.ctx.fillRect(
          screenPos.x - halfSize,
          screenPos.y - halfSize,
          cellSize,
          cellSize
        );
        break;
      
      case CellType.OBSTACLE:
        this.renderObstacle(screenPos, cellSize);
        break;
    }
  }

  private renderObstacle(screenPos: Vector2, cellSize: number): void {
    // Render rocks/obstacles
    this.fillCircle(screenPos, cellSize / 3, RENDER_CONFIG.obstacleColor);
    
    // Add some detail
    this.strokeCircle(screenPos, cellSize / 3, '#888888', 2);
  }

  private renderGridLines(startX: number, endX: number, startY: number, endY: number, cellSize: number): void {
    this.ctx.strokeStyle = RENDER_CONFIG.gridLineColor;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * cellSize;
      const screenX = this.getScreenPosition({ x: worldX, y: 0 }).x;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * cellSize;
      const screenY = this.getScreenPosition({ x: 0, y: worldY }).y;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
    }

    this.ctx.stroke();
  }

  renderTowerRange(tower: Tower): void {
    if (!this.isVisible(tower.position, tower.range)) return;
    
    const screenPos = this.getScreenPosition(tower);
    this.renderDashedLine(
      screenPos, 
      screenPos, // Will be drawn as a circle
      'rgba(255, 255, 255, 0.3)', 
      2, 
      RENDER_CONFIG.dashPattern
    );
    
    // Actually render as a circle
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash(RENDER_CONFIG.dashPattern);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    const tempTower = new Tower(towerType, position);
    const screenPos = this.getScreenPosition(position);
    
    this.saveContext();
    this.ctx.globalAlpha = RENDER_CONFIG.ghostOpacity;
    
    // Render tower body
    let color: string;
    if (canPlace) {
      switch (towerType) {
        case TowerType.BASIC:
          color = '#81C784'; // Light green
          break;
        case TowerType.SNIPER:
          color = '#64B5F6'; // Light blue
          break;
        case TowerType.RAPID:
          color = '#FFB74D'; // Light orange
          break;
        default:
          color = '#81C784';
      }
    } else {
      color = '#E57373'; // Light red
    }
    
    this.fillCircle(screenPos, tempTower.radius, color);
    
    // Tower outline
    const strokeColor = canPlace ? '#4CAF50' : '#F44336';
    this.strokeCircle(screenPos, tempTower.radius, strokeColor, 2);
    
    // Show range preview
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tempTower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    this.restoreContext();
  }

  renderBackground(biome?: string): void {
    // Render biome-specific background
    let backgroundColor: string;
    
    switch (biome) {
      case 'FOREST':
        backgroundColor = '#1a3d1a';
        break;
      case 'DESERT':
        backgroundColor = '#3d3a1a';
        break;
      case 'ARCTIC':
        backgroundColor = '#1a1a3d';
        break;
      case 'VOLCANIC':
        backgroundColor = '#3d1a1a';
        break;
      default:
        backgroundColor = '#2E2E2E';
    }
    
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderParticleEffect(
    position: Vector2, 
    particleCount: number, 
    color: string, 
    radius: number = 2,
    spread: number = 20
  ): void {
    if (!this.isVisible(position, spread)) return;
    
    const screenPos = this.getScreenPosition(position);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = Math.random() * spread;
      const particleX = screenPos.x + Math.cos(angle) * distance;
      const particleY = screenPos.y + Math.sin(angle) * distance;
      
      this.fillCircle({ x: particleX, y: particleY }, radius, color);
    }
  }

  renderExplosion(position: Vector2, radius: number, intensity: number = 1): void {
    if (!this.isVisible(position, radius)) return;
    
    const screenPos = this.getScreenPosition(position);
    
    // Multiple explosion rings
    for (let i = 0; i < 3; i++) {
      const ringRadius = radius * (0.3 + i * 0.35);
      const alpha = (1 - i * 0.3) * intensity;
      const color = `rgba(255, ${128 - i * 40}, 0, ${alpha})`;
      
      this.renderWithGlow(() => {
        this.strokeCircle(screenPos, ringRadius, color, 3);
      }, '#FF8000', 15);
    }
  }

  renderLightning(start: Vector2, end: Vector2, branches: number = 3): void {
    const screenStart = this.getScreenPosition(start);
    const screenEnd = this.getScreenPosition(end);
    
    this.saveContext();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    
    // Main lightning bolt
    this.renderJaggedLine(screenStart, screenEnd, 5);
    
    // Branches
    for (let i = 0; i < branches; i++) {
      const t = 0.3 + (i / branches) * 0.4; // Position along main bolt
      const branchStart = {
        x: screenStart.x + (screenEnd.x - screenStart.x) * t,
        y: screenStart.y + (screenEnd.y - screenStart.y) * t
      };
      
      const angle = Math.atan2(screenEnd.y - screenStart.y, screenEnd.x - screenStart.x) + 
                   (Math.random() - 0.5) * Math.PI * 0.5;
      const branchLength = 20 + Math.random() * 30;
      
      const branchEnd = {
        x: branchStart.x + Math.cos(angle) * branchLength,
        y: branchStart.y + Math.sin(angle) * branchLength
      };
      
      this.ctx.lineWidth = 1;
      this.renderJaggedLine(branchStart, branchEnd, 3);
    }
    
    this.restoreContext();
  }

  private renderJaggedLine(start: Vector2, end: Vector2, segments: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 10;
      const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 10;
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  }

  renderWaveEffect(center: Vector2, radius: number, time: number): void {
    if (!this.isVisible(center, radius)) return;
    
    const screenPos = this.getScreenPosition(center);
    const animatedRadius = radius * (0.5 + 0.5 * Math.sin(time * 0.01));
    const alpha = 0.3 + 0.2 * Math.sin(time * 0.015);
    
    this.strokeCircle(screenPos, animatedRadius, `rgba(100, 200, 255, ${alpha})`, 2);
  }

  renderEnvironmentalAnimation(type: 'rain' | 'snow' | 'leaves', intensity: number = 1): void {
    const particleCount = Math.floor(50 * intensity);
    
    switch (type) {
      case 'rain':
        this.renderRain(particleCount);
        break;
      case 'snow':
        this.renderSnow(particleCount);
        break;
      case 'leaves':
        this.renderFallingLeaves(particleCount);
        break;
    }
  }

  private renderRain(particleCount: number): void {
    this.ctx.strokeStyle = 'rgba(150, 150, 255, 0.6)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - 2, y + 10);
      this.ctx.stroke();
    }
  }

  private renderSnow(particleCount: number): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const radius = 1 + Math.random() * 2;
      
      this.fillCircle({ x, y }, radius, 'rgba(255, 255, 255, 0.8)');
    }
  }

  private renderFallingLeaves(particleCount: number): void {
    const colors = ['#8B4513', '#CD853F', '#D2691E', '#A0522D'];
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, 3, 2);
    }
  }
}