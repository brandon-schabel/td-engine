import { Grid, CellType } from './Grid';
import { Camera } from './Camera';
import { COLOR_THEME } from '../config/ColorTheme';
import { BIOME_PRESETS, BiomeType } from '@/types/MapData';
import { adjustColorBrightness, coordinateVariation } from '@/utils/MathUtils';
import { ZOOM_RENDER_CONFIG } from '../config/RenderingConfig';

export class TerrainRenderer {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private camera: Camera;
  private patternCache: Map<string, CanvasPattern | null> = new Map();
  
  constructor(ctx: CanvasRenderingContext2D, grid: Grid, camera: Camera) {
    this.ctx = ctx;
    this.grid = grid;
    this.camera = camera;
    this.initializePatterns();
  }
  
  private initializePatterns(): void {
    // Create reusable patterns for different terrain types
    this.createGrassPattern();
    this.createDirtPattern();
    this.createStonePattern();
    this.createWaterPattern();
  }
  
  private createGrassPattern(): void {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d')!;
    const size = 64; // Larger for more detail
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Create gradient background for more natural look
    const gradient = patternCtx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
    gradient.addColorStop(0, '#4a7c4e');
    gradient.addColorStop(1, '#3d6b3d');
    patternCtx.fillStyle = gradient;
    patternCtx.fillRect(0, 0, size, size);
    
    // Add noise for texture
    const imageData = patternCtx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    patternCtx.putImageData(imageData, 0, 0);
    
    // Add grass blade details with better variety
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const height = 4 + Math.random() * 6;
      const sway = (Math.random() - 0.5) * 4;
      
      patternCtx.strokeStyle = `rgba(61, 107, 61, ${0.3 + Math.random() * 0.4})`;
      patternCtx.lineWidth = 0.5 + Math.random() * 0.5;
      
      patternCtx.beginPath();
      patternCtx.moveTo(x, y);
      patternCtx.quadraticCurveTo(x + sway, y - height/2, x + sway/2, y - height);
      patternCtx.stroke();
    }
    
    // Add some clover/flower spots
    patternCtx.fillStyle = 'rgba(255, 255, 200, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 1 + Math.random() * 2;
      patternCtx.beginPath();
      patternCtx.arc(x, y, radius, 0, Math.PI * 2);
      patternCtx.fill();
    }
    
    const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
    this.patternCache.set('grass', pattern);
  }
  
  private createDirtPattern(): void {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d')!;
    const size = 32;
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Base dirt color
    patternCtx.fillStyle = '#8B7355';
    patternCtx.fillRect(0, 0, size, size);
    
    // Add texture with dots and variations
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = 0.7 + Math.random() * 0.3;
      patternCtx.fillStyle = `rgba(0, 0, 0, ${0.1 * brightness})`;
      patternCtx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    
    // Add some pebbles
    patternCtx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 1 + Math.random() * 2;
      patternCtx.beginPath();
      patternCtx.arc(x, y, radius, 0, Math.PI * 2);
      patternCtx.fill();
    }
    
    const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
    this.patternCache.set('dirt', pattern);
  }
  
  private createStonePattern(): void {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d')!;
    const size = 32;
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Base stone color
    patternCtx.fillStyle = '#696969';
    patternCtx.fillRect(0, 0, size, size);
    
    // Add cracks
    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    patternCtx.lineWidth = 1;
    
    // Random cracks
    for (let i = 0; i < 3; i++) {
      patternCtx.beginPath();
      patternCtx.moveTo(Math.random() * size, Math.random() * size);
      patternCtx.lineTo(Math.random() * size, Math.random() * size);
      patternCtx.stroke();
    }
    
    // Add highlights
    patternCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      patternCtx.fillRect(x, y, 2 + Math.random() * 3, 1);
    }
    
    const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
    this.patternCache.set('stone', pattern);
  }
  
  private createWaterPattern(): void {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d')!;
    const size = 32;
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Base water color
    patternCtx.fillStyle = '#4682B4';
    patternCtx.fillRect(0, 0, size, size);
    
    // Add wave patterns
    patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    patternCtx.lineWidth = 1;
    
    for (let y = 0; y < size; y += 8) {
      patternCtx.beginPath();
      patternCtx.moveTo(0, y);
      for (let x = 0; x < size; x += 4) {
        patternCtx.quadraticCurveTo(x + 2, y - 2, x + 4, y);
      }
      patternCtx.stroke();
    }
    
    // Add shimmer
    patternCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      patternCtx.fillRect(x, y, 1, 3);
    }
    
    const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
    this.patternCache.set('water', pattern);
  }
  
  renderGrid(): void {
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();
    const zoom = this.camera.getZoom();
    
    // Get biome colors
    const biome = this.grid.getBiome();
    const biomeColors = BIOME_PRESETS[biome].colors;
    
    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));
    
    // Enable image smoothing for better texture rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Render terrain tiles
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellData = this.grid.getCellData(x, y);
        if (!cellData) continue;
        
        const worldPos = this.grid.gridToWorld(x, y);
        const screenPos = this.camera.worldToScreen(worldPos);
        const scaledCellSize = cellSize * zoom;
        
        // Calculate cell bounds
        const cellLeft = screenPos.x - scaledCellSize / 2;
        const cellTop = screenPos.y - scaledCellSize / 2;
        
        // Save context state
        this.ctx.save();
        
        // Clip to cell bounds for clean edges
        this.ctx.beginPath();
        this.ctx.rect(cellLeft, cellTop, scaledCellSize, scaledCellSize);
        this.ctx.clip();
        
        // Render base terrain
        this.renderTerrainTile(cellData.type, cellLeft, cellTop, scaledCellSize, x, y, biomeColors);
        
        // Add grid overlay for high zoom levels
        if (zoom > 1.5) {
          this.renderCellBorder(cellLeft, cellTop, scaledCellSize, cellData.type);
        }
        
        this.ctx.restore();
      }
    }
    
    // Render subtle grid lines at lower zoom levels
    if (zoom <= 1.5) {
      this.renderGridLines(startX, endX, startY, endY, cellSize, zoom);
    }
  }
  
  private renderTerrainTile(
    cellType: CellType, 
    x: number, 
    y: number, 
    size: number, 
    gridX: number, 
    gridY: number,
    biomeColors: any
  ): void {
    const height = this.grid.getCellData(gridX, gridY)?.height || 0;
    const variation = coordinateVariation(gridX, gridY, 0.1);
    const brightness = 1 - height * 0.3 + variation;
    
    // Check neighboring cells for smooth transitions
    const neighbors = this.getNeighborTypes(gridX, gridY);
    
    switch (cellType) {
      case CellType.EMPTY:
      case CellType.DECORATIVE:
        // Base layer
        this.ctx.fillStyle = adjustColorBrightness(biomeColors.primary, brightness);
        this.ctx.fillRect(x, y, size, size);
        
        // Use grass pattern overlay
        const grassPattern = this.patternCache.get('grass');
        if (grassPattern) {
          this.ctx.save();
          this.ctx.globalAlpha = 0.8;
          this.ctx.fillStyle = grassPattern;
          this.ctx.fillRect(x, y, size, size);
          this.ctx.restore();
        }
        
        // Add edge transitions
        this.renderEdgeTransitions(x, y, size, cellType, neighbors);
        
        // Add subtle shading
        const gradient = this.ctx.createLinearGradient(x, y, x, y + size);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.05 * (1 - brightness)})`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
        break;
        
      case CellType.PATH:
        // Use dirt pattern for paths
        const dirtPattern = this.patternCache.get('dirt');
        if (dirtPattern) {
          this.ctx.fillStyle = dirtPattern;
        } else {
          this.ctx.fillStyle = adjustColorBrightness(biomeColors.path, brightness);
        }
        this.ctx.fillRect(x, y, size, size);
        
        // Add wear marks
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.2, y + size * 0.3);
        this.ctx.lineTo(x + size * 0.8, y + size * 0.7);
        this.ctx.stroke();
        break;
        
      case CellType.BLOCKED:
      case CellType.BORDER:
        // Use stone pattern
        const stonePattern = this.patternCache.get('stone');
        if (stonePattern) {
          this.ctx.fillStyle = stonePattern;
        } else {
          this.ctx.fillStyle = adjustColorBrightness(biomeColors.border, brightness * 0.7);
        }
        this.ctx.fillRect(x, y, size, size);
        
        // Add 3D effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x, y, size, 2);
        this.ctx.fillRect(x, y, 2, size);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x, y + size - 2, size, 2);
        this.ctx.fillRect(x + size - 2, y, 2, size);
        break;
        
      case CellType.WATER:
        // Use water pattern
        const waterPattern = this.patternCache.get('water');
        if (waterPattern) {
          // Animate water pattern
          this.ctx.save();
          const time = Date.now() * 0.001;
          this.ctx.translate(x + Math.sin(time) * 2, y + Math.cos(time) * 1);
          this.ctx.fillStyle = waterPattern;
          this.ctx.fillRect(-2, -2, size + 4, size + 4);
          this.ctx.restore();
        } else {
          this.ctx.fillStyle = adjustColorBrightness(biomeColors.water || '#4682B4', brightness);
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case CellType.OBSTACLE:
        // Render rock/obstacle with more detail
        this.renderObstacle(x + size/2, y + size/2, size * 0.4, brightness);
        break;
        
      default:
        // Fallback solid color
        this.ctx.fillStyle = adjustColorBrightness(biomeColors.primary, brightness);
        this.ctx.fillRect(x, y, size, size);
    }
  }
  
  private renderObstacle(centerX: number, centerY: number, radius: number, brightness: number): void {
    // Rock base
    this.ctx.fillStyle = adjustColorBrightness('#808080', brightness);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Rock highlight
    this.ctx.fillStyle = adjustColorBrightness('#A0A0A0', brightness);
    this.ctx.beginPath();
    this.ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Rock shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  private renderCellBorder(x: number, y: number, size: number, cellType: CellType): void {
    // Only render borders for certain cell types at high zoom
    if (cellType === CellType.PATH || cellType === CellType.EMPTY || cellType === CellType.DECORATIVE) {
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.lineWidth = 0.5;
      this.ctx.strokeRect(x, y, size, size);
    }
  }
  
  private renderGridLines(startX: number, endX: number, startY: number, endY: number, cellSize: number, zoom: number): void {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    const lineWidth = ZOOM_RENDER_CONFIG.gridLineWidth.scaleInversely 
      ? ZOOM_RENDER_CONFIG.gridLineWidth.base / zoom
      : ZOOM_RENDER_CONFIG.gridLineWidth.base;
    this.ctx.lineWidth = Math.max(
      ZOOM_RENDER_CONFIG.gridLineWidth.min, 
      Math.min(ZOOM_RENDER_CONFIG.gridLineWidth.max, lineWidth)
    );
    
    this.ctx.beginPath();
    
    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * cellSize;
      const screenX = this.camera.worldToScreen({ x: worldX, y: 0 }).x;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.ctx.canvas.height);
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * cellSize;
      const screenY = this.camera.worldToScreen({ x: 0, y: worldY }).y;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.ctx.canvas.width, screenY);
    }
    
    this.ctx.stroke();
  }
  
  private getNeighborTypes(x: number, y: number): Map<string, CellType> {
    const neighbors = new Map<string, CellType>();
    const directions = [
      ['north', 0, -1],
      ['south', 0, 1],
      ['east', 1, 0],
      ['west', -1, 0],
      ['northeast', 1, -1],
      ['northwest', -1, -1],
      ['southeast', 1, 1],
      ['southwest', -1, 1]
    ];
    
    for (const [dir, dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const cell = this.grid.getCellData(nx, ny);
      if (cell) {
        neighbors.set(dir as string, cell.type);
      }
    }
    
    return neighbors;
  }
  
  private renderEdgeTransitions(x: number, y: number, size: number, cellType: CellType, neighbors: Map<string, CellType>): void {
    // Add smooth transitions to neighboring different terrain types
    const transitionSize = size * 0.2;
    
    // Check each edge
    if (neighbors.get('north') === CellType.PATH && cellType !== CellType.PATH) {
      const gradient = this.ctx.createLinearGradient(x, y, x, y + transitionSize);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, size, transitionSize);
    }
    
    if (neighbors.get('south') === CellType.PATH && cellType !== CellType.PATH) {
      const gradient = this.ctx.createLinearGradient(x, y + size, x, y + size - transitionSize);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y + size - transitionSize, size, transitionSize);
    }
    
    if (neighbors.get('east') === CellType.PATH && cellType !== CellType.PATH) {
      const gradient = this.ctx.createLinearGradient(x + size, y, x + size - transitionSize, y);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x + size - transitionSize, y, transitionSize, size);
    }
    
    if (neighbors.get('west') === CellType.PATH && cellType !== CellType.PATH) {
      const gradient = this.ctx.createLinearGradient(x, y, x + transitionSize, y);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, transitionSize, size);
    }
  }
}