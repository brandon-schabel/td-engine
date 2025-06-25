/**
 * Environment Renderer
 * Specialized renderer for the game world environment (grid, background, effects)
 */

import { BaseRenderer } from './BaseRenderer';
import { Grid, CellType } from '@/systems/Grid';
import { Tower, TowerType } from '@/entities/Tower';
import { GRID_RENDER_DETAILS } from '../config/RenderingConfig';
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

        // Add subtle visual indicator for 2-tile border area
        const isInWalkableBorder = this.isInWalkableBorderArea(x, y);
        if (isInWalkableBorder && cellType === CellType.EMPTY) {
          this.renderWalkableBorderBackground(screenPos, cellSize);
        }

        this.renderCell(cellType, screenPos, cellSize);
      }
    }
  }

  private isInWalkableBorderArea(x: number, y: number): boolean {
    // Check if cell is within 2 tiles of the edge but not on the absolute edge
    const isNearEdge = (
      (x > 0 && x <= 2) || (x >= this.grid.width - 3 && x < this.grid.width - 1) ||
      (y > 0 && y <= 2) || (y >= this.grid.height - 3 && y < this.grid.height - 1)
    );
    
    return isNearEdge;
  }

  private renderWalkableBorderBackground(screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;
    
    // Render a subtle tinted background to indicate walkable border area
    this.ctx.fillStyle = 'rgba(100, 150, 200, 0.1)';
    this.ctx.fillRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );
    
    // Add subtle border pattern
    this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      screenPos.x - halfSize + 2,
      screenPos.y - halfSize + 2,
      cellSize - 4,
      cellSize - 4
    );
    this.ctx.setLineDash([]);
  }

  private renderCell(cellType: CellType, screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;

    switch (cellType) {
      case CellType.PATH:
        this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainColors.PATH;
        this.ctx.fillRect(
          screenPos.x - halfSize,
          screenPos.y - halfSize,
          cellSize,
          cellSize
        );
        break;

      case CellType.BLOCKED:
        this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainColors.BLOCKED;
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

      case CellType.WATER:
        console.log('Rendering water');
        this.renderWater(screenPos, cellSize);
        break;

      case CellType.ROUGH_TERRAIN:
        console.log('Rendering rough terrain');
        this.renderRoughTerrain(screenPos, cellSize);
        break;

      case CellType.BRIDGE:
        console.log('Rendering bridge');
        this.renderBridge(screenPos, cellSize);
        break;

      case CellType.BORDER:
        this.renderBorder(screenPos, cellSize);
        break;
    }
  }

  private renderObstacle(screenPos: Vector2, cellSize: number): void {
    // Render rocks/obstacles
    this.fillCircle(screenPos, cellSize / 3, GRID_RENDER_DETAILS.terrainColors.OBSTACLE);

    // Add some detail
    this.strokeCircle(screenPos, cellSize / 3, '#888888', 2);
  }

  private renderWater(screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;

    // Base water color
    this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainColors.WATER;
    this.ctx.fillRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );

    // Add water waves effect
    this.ctx.strokeStyle = GRID_RENDER_DETAILS.terrainEffects.WATER.waveColor;
    this.ctx.lineWidth = GRID_RENDER_DETAILS.terrainEffects.WATER.waveLineWidth;
    this.ctx.beginPath();

    // Draw 2 wave lines
    const waveOffset = cellSize / 4;
    const waveY1 = screenPos.y - waveOffset;
    const waveY2 = screenPos.y + waveOffset;
    const amplitude = GRID_RENDER_DETAILS.terrainEffects.WATER.waveAmplitude;

    // First wave
    this.ctx.moveTo(screenPos.x - halfSize, waveY1);
    this.ctx.quadraticCurveTo(
      screenPos.x - halfSize / 2, waveY1 - amplitude,
      screenPos.x, waveY1
    );
    this.ctx.quadraticCurveTo(
      screenPos.x + halfSize / 2, waveY1 + amplitude,
      screenPos.x + halfSize, waveY1
    );

    // Second wave
    this.ctx.moveTo(screenPos.x - halfSize, waveY2);
    this.ctx.quadraticCurveTo(
      screenPos.x - halfSize / 2, waveY2 + amplitude,
      screenPos.x, waveY2
    );
    this.ctx.quadraticCurveTo(
      screenPos.x + halfSize / 2, waveY2 - amplitude,
      screenPos.x + halfSize, waveY2
    );

    this.ctx.stroke();
  }

  private renderRoughTerrain(screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;

    // Base terrain color
    this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainColors.ROUGH_TERRAIN;
    this.ctx.fillRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );

    // Add rough texture with small rocks/pebbles
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    const pebbleCount = 4;
    const pebbleSize = cellSize / 8;

    for (let i = 0; i < pebbleCount; i++) {
      const angle = (Math.PI * 2 * i) / pebbleCount;
      const distance = cellSize / 4;
      const pebbleX = screenPos.x + Math.cos(angle) * distance;
      const pebbleY = screenPos.y + Math.sin(angle) * distance;

      this.fillCircle({ x: pebbleX, y: pebbleY }, pebbleSize, 'rgba(0, 0, 0, 0.2)');
    }

    // Add dashed border to indicate difficulty
    this.ctx.strokeStyle = GRID_RENDER_DETAILS.terrainEffects.ROUGH_TERRAIN.borderColor;
    this.ctx.lineWidth = GRID_RENDER_DETAILS.terrainEffects.ROUGH_TERRAIN.borderWidth;
    this.ctx.setLineDash(GRID_RENDER_DETAILS.terrainEffects.ROUGH_TERRAIN.dashPattern);
    this.ctx.strokeRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );
    this.ctx.setLineDash([]);
  }

  private renderBridge(screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;

    // First render water underneath
    this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainColors.WATER;
    this.ctx.fillRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );

    // Bridge planks
    this.ctx.fillStyle = GRID_RENDER_DETAILS.terrainEffects.BRIDGE.plankColor;
    const plankCount = GRID_RENDER_DETAILS.terrainEffects.BRIDGE.plankCount;
    const plankWidth = cellSize / plankCount;
    const plankGap = 2;

    // Draw vertical planks
    for (let i = 0; i < plankCount; i++) {
      const plankX = screenPos.x - halfSize + i * (plankWidth + plankGap);
      this.ctx.fillRect(
        plankX,
        screenPos.y - halfSize,
        plankWidth - plankGap,
        cellSize
      );
    }

    // Bridge supports/rails
    this.ctx.strokeStyle = GRID_RENDER_DETAILS.terrainEffects.BRIDGE.railColor;
    this.ctx.lineWidth = GRID_RENDER_DETAILS.terrainEffects.BRIDGE.railWidth;

    // Left rail
    this.ctx.beginPath();
    this.ctx.moveTo(screenPos.x - halfSize + 2, screenPos.y - halfSize);
    this.ctx.lineTo(screenPos.x - halfSize + 2, screenPos.y + halfSize);
    this.ctx.stroke();

    // Right rail
    this.ctx.beginPath();
    this.ctx.moveTo(screenPos.x + halfSize - 2, screenPos.y - halfSize);
    this.ctx.lineTo(screenPos.x + halfSize - 2, screenPos.y + halfSize);
    this.ctx.stroke();
  }

  private renderBorder(screenPos: Vector2, cellSize: number): void {
    const halfSize = cellSize / 2;

    // Dark solid border color
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(
      screenPos.x - halfSize,
      screenPos.y - halfSize,
      cellSize,
      cellSize
    );

    // Add cross-hatch pattern to indicate impassable
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 2;
    
    // Draw diagonal lines
    const spacing = cellSize / 4;
    for (let i = 0; i < 4; i++) {
      const offset = i * spacing;
      
      // Top-left to bottom-right lines
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x - halfSize + offset, screenPos.y - halfSize);
      this.ctx.lineTo(screenPos.x - halfSize, screenPos.y - halfSize + offset);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x + halfSize, screenPos.y + halfSize - offset);
      this.ctx.lineTo(screenPos.x + halfSize - offset, screenPos.y + halfSize);
      this.ctx.stroke();
    }
  }

  private renderGridLines(startX: number, endX: number, startY: number, endY: number, cellSize: number): void {
    this.ctx.strokeStyle = GRID_RENDER_DETAILS.gridLines.color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * cellSize;
      const screenPos = this.getScreenPosition({ x: worldX, y: 0 });
      const screenX = screenPos.x;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * cellSize;
      const screenPos = this.getScreenPosition({ x: 0, y: worldY });
      const screenY = screenPos.y;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
    }

    this.ctx.stroke();
  }

  renderTowerRange(tower: Tower): void {
    if (!this.isVisible(tower.position, tower.range)) return;

    const screenPos = this.getScreenPosition(tower.position);
    this.renderDashedLine(
      screenPos,
      screenPos, // Will be drawn as a circle
      'rgba(255, 255, 255, 0.3)',
      2,
      [5, 5]
    );

    // Actually render as a circle
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    const tempTower = new Tower(towerType, position);
    const screenPos = this.getScreenPosition(position);

    this.saveContext();
    this.ctx.globalAlpha = 0.6;

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