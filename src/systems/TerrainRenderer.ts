import { Grid, CellType } from './Grid';
import { Camera } from './Camera';
import { BIOME_PRESETS } from '@/types/MapData';
import { adjustColorBrightness, coordinateVariation } from '@/utils/MathUtils';
import { ZOOM_RENDER_CONFIG } from '../config/RenderingConfig';
import { TerrainSvgGenerator } from '@/rendering/TerrainSvgGenerator';

export class TerrainRenderer {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private camera: Camera;
  private patternCache: Map<string, CanvasPattern | null> = new Map();
  private svgGenerator: TerrainSvgGenerator;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingImages: Map<string, Promise<HTMLImageElement>> = new Map();
  
  constructor(ctx: CanvasRenderingContext2D, grid: Grid, camera: Camera) {
    this.ctx = ctx;
    this.grid = grid;
    this.camera = camera;
    this.svgGenerator = new TerrainSvgGenerator();
    // Skip pattern initialization since we're using SVG now
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
        
        // Render base terrain using SVG
        this.renderTerrainTileSvg(cellData.type, cellLeft, cellTop, scaledCellSize, x, y, biomeColors);
        
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
  
  /**
   * Load SVG as an image for rendering
   */
  private async loadSvgAsImage(svg: string, cacheKey: string): Promise<HTMLImageElement> {
    // Check if already loading
    if (this.loadingImages.has(cacheKey)) {
      return this.loadingImages.get(cacheKey)!;
    }
    
    // Check if already loaded
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }
    
    // Create promise for loading
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        this.imageCache.set(cacheKey, img);
        this.loadingImages.delete(cacheKey);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        this.loadingImages.delete(cacheKey);
        reject(new Error(`Failed to load SVG for ${cacheKey}`));
      };
      
      img.src = url;
    });
    
    this.loadingImages.set(cacheKey, loadPromise);
    return loadPromise;
  }
  
  /**
   * Render terrain tile using SVG
   */
  private renderTerrainTileSvg(
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
    
    // Generate SVG for this specific tile
    const svg = this.svgGenerator.getTerrainSvg(gridX, gridY, cellType, {
      size: this.grid.cellSize,
      biomeColor: biomeColors.primary,
      brightness
    });
    
    const cacheKey = `${gridX}_${gridY}_${cellType}`;
    
    // Try to get cached image
    const cachedImage = this.imageCache.get(cacheKey);
    if (cachedImage) {
      // Draw the cached image
      this.ctx.drawImage(cachedImage, x, y, size, size);
    } else {
      // Load and draw later, for now draw fallback
      this.loadSvgAsImage(svg, cacheKey).then(_img => {
        // The image will be drawn on next frame when it's cached
      }).catch(err => {
        console.warn('Failed to load terrain SVG:', err);
      });
      
      // Draw fallback color while loading
      this.ctx.fillStyle = adjustColorBrightness(biomeColors.primary, brightness);
      this.ctx.fillRect(x, y, size, size);
    }
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
  
  /**
   * Clear all caches (patterns, SVGs, and images)
   */
  clearCaches(): void {
    this.patternCache.clear();
    this.imageCache.clear();
    this.loadingImages.clear();
    this.svgGenerator.clearCache();
  }
  
  /* =================================================================
   * Old pattern-based rendering code - preserved for reference
   * These methods have been replaced by SVG-based rendering above
   * =================================================================
   */
  
  /*
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
  */
}