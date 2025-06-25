/**
 * Terrain SVG Generator
 * Generates unique SVG patterns for each terrain tile based on coordinates
 */

import { CellType } from '@/systems/Grid';
import { coordinateVariation } from '@/utils/MathUtils';

export interface TerrainSvgOptions {
  size: number;
  biomeColor?: string;
  brightness?: number;
  detailLevel?: 'high' | 'medium' | 'low';
}

export class TerrainSvgGenerator {
  private svgCache: Map<string, string> = new Map();
  
  /**
   * Generate a unique cache key for a tile
   */
  private getCacheKey(x: number, y: number, type: CellType, detailLevel?: string): string {
    return `${x}_${y}_${type}_${detailLevel || 'high'}`;
  }
  
  /**
   * Get or generate SVG for a specific tile
   */
  getTerrainSvg(x: number, y: number, type: CellType, options: TerrainSvgOptions): string {
    const detailLevel = options.detailLevel || 'high';
    const cacheKey = this.getCacheKey(x, y, type, detailLevel);
    
    if (this.svgCache.has(cacheKey)) {
      return this.svgCache.get(cacheKey)!;
    }
    
    let svg: string;
    switch (type) {
      case CellType.EMPTY:
      case CellType.DECORATIVE:
        svg = this.generateGrassSvg(x, y, options);
        break;
      case CellType.PATH:
        svg = this.generateDirtSvg(x, y, options);
        break;
      case CellType.BLOCKED:
      case CellType.BORDER:
        svg = this.generateStoneSvg(x, y, options);
        break;
      case CellType.WATER:
        svg = this.generateWaterSvg(x, y, options);
        break;
      case CellType.OBSTACLE:
        svg = this.generateRockSvg(x, y, options);
        break;
      case CellType.ROUGH_TERRAIN:
        svg = this.generateRoughTerrainSvg(x, y, options);
        break;
      case CellType.BRIDGE:
        svg = this.generateBridgeSvg(x, y, options);
        break;
      default:
        svg = this.generateDefaultSvg(x, y, options);
    }
    
    this.svgCache.set(cacheKey, svg);
    return svg;
  }
  
  private generateGrassSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1, detailLevel = 'high' } = options;
    const variation = coordinateVariation(x, y, 0.2);
    const baseColor = this.adjustBrightness('#4a7c4e', brightness + variation);
    const darkColor = this.adjustBrightness('#3d6b3d', brightness + variation);
    
    // Low detail - just solid color
    if (detailLevel === 'low') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
        </svg>
      `;
    }
    
    // Use a seeded random based on coordinates for consistent randomness
    const random = this.seededRandom(x, y);
    
    // Medium detail - simplified
    if (detailLevel === 'medium') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
          <!-- Simple texture -->
          ${this.generateSimpleGrassTexture(x, y, size, random)}
        </svg>
      `;
    }
    
    // High detail - full version
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base grass color with gradient -->
        <defs>
          <radialGradient id="grass-${x}-${y}">
            <stop offset="0%" stop-color="${baseColor}" />
            <stop offset="100%" stop-color="${darkColor}" />
          </radialGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grass-${x}-${y})" />
        
        <!-- Grass blades -->
        ${this.generateGrassBlades(x, y, size, random)}
        
        <!-- Small flowers/clovers -->
        ${random.next() > 0.7 ? this.generateSmallFlowers(x, y, size, random) : ''}
      </svg>
    `;
  }
  
  private generateSimpleGrassTexture(_x: number, _y: number, size: number, random: any): string {
    let texture = '';
    const dotCount = 5 + Math.floor(random.next() * 3);
    
    // Simple dots to represent grass texture
    for (let i = 0; i < dotCount; i++) {
      const dx = random.next() * size;
      const dy = random.next() * size;
      const radius = 1 + random.next() * 0.5;
      const opacity = 0.1 + random.next() * 0.1;
      
      texture += `
        <circle cx="${dx}" cy="${dy}" r="${radius}" 
                fill="rgba(0, 0, 0, ${opacity})" />
      `;
    }
    
    return texture;
  }
  
  private generateGrassBlades(_x: number, _y: number, size: number, random: any): string {
    let blades = '';
    const bladeCount = 8 + Math.floor(random.next() * 5);
    
    for (let i = 0; i < bladeCount; i++) {
      const bx = random.next() * size;
      const by = random.next() * size;
      const height = 4 + random.next() * 6;
      const sway = (random.next() - 0.5) * 4;
      const opacity = 0.3 + random.next() * 0.4;
      
      blades += `
        <path d="M ${bx} ${by} Q ${bx + sway} ${by - height/2} ${bx + sway/2} ${by - height}" 
              stroke="rgba(61, 107, 61, ${opacity})" 
              stroke-width="${0.5 + random.next() * 0.5}" 
              fill="none" />
      `;
    }
    
    return blades;
  }
  
  private generateSmallFlowers(_x: number, _y: number, size: number, random: any): string {
    let flowers = '';
    const flowerCount = 2 + Math.floor(random.next() * 3);
    
    for (let i = 0; i < flowerCount; i++) {
      const fx = random.next() * size;
      const fy = random.next() * size;
      const radius = 1 + random.next() * 2;
      
      flowers += `
        <circle cx="${fx}" cy="${fy}" r="${radius}" 
                fill="rgba(255, 255, 200, 0.3)" />
      `;
    }
    
    return flowers;
  }
  
  private generateDirtSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1, detailLevel = 'high' } = options;
    const variation = coordinateVariation(x, y, 0.15);
    const baseColor = this.adjustBrightness('#8B7355', brightness + variation);
    
    // Low detail - just solid color
    if (detailLevel === 'low') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
        </svg>
      `;
    }
    
    const random = this.seededRandom(x, y);
    
    // Medium detail - simplified
    if (detailLevel === 'medium') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
          <!-- Simple wear mark -->
          <line x1="${size * 0.2}" y1="${size * 0.3}" 
                x2="${size * 0.8}" y2="${size * 0.7}" 
                stroke="rgba(0, 0, 0, 0.1)" 
                stroke-width="1" />
        </svg>
      `;
    }
    
    // High detail - full version
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base dirt color -->
        <rect width="${size}" height="${size}" fill="${baseColor}" />
        
        <!-- Dirt texture -->
        ${this.generateDirtTexture(x, y, size, random)}
        
        <!-- Small pebbles -->
        ${this.generatePebbles(x, y, size, random)}
        
        <!-- Wear marks for paths -->
        <line x1="${size * 0.2}" y1="${size * 0.3}" 
              x2="${size * 0.8}" y2="${size * 0.7}" 
              stroke="rgba(0, 0, 0, 0.1)" 
              stroke-width="1" />
      </svg>
    `;
  }
  
  private generateDirtTexture(_x: number, _y: number, size: number, random: any): string {
    let texture = '';
    const spotCount = 15 + Math.floor(random.next() * 10);
    
    for (let i = 0; i < spotCount; i++) {
      const sx = random.next() * size;
      const sy = random.next() * size;
      const sw = 1 + random.next() * 2;
      const sh = 1 + random.next() * 2;
      const opacity = 0.05 + random.next() * 0.1;
      
      texture += `
        <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" 
              fill="rgba(0, 0, 0, ${opacity})" />
      `;
    }
    
    return texture;
  }
  
  private generatePebbles(_x: number, _y: number, size: number, random: any): string {
    let pebbles = '';
    const pebbleCount = 3 + Math.floor(random.next() * 4);
    
    for (let i = 0; i < pebbleCount; i++) {
      const px = random.next() * size;
      const py = random.next() * size;
      const radius = 1 + random.next() * 2;
      
      pebbles += `
        <circle cx="${px}" cy="${py}" r="${radius}" 
                fill="rgba(100, 100, 100, 0.3)" />
      `;
    }
    
    return pebbles;
  }
  
  private generateStoneSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1, detailLevel = 'high' } = options;
    const variation = coordinateVariation(x, y, 0.1);
    const baseColor = this.adjustBrightness('#696969', brightness * 0.7 + variation);
    
    // Low detail - just solid color
    if (detailLevel === 'low') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
        </svg>
      `;
    }
    
    const random = this.seededRandom(x, y);
    
    // Medium detail - simplified with just borders
    if (detailLevel === 'medium') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
          <!-- 3D effect borders -->
          <rect x="0" y="0" width="${size}" height="2" fill="rgba(255, 255, 255, 0.1)" />
          <rect x="0" y="0" width="2" height="${size}" fill="rgba(255, 255, 255, 0.1)" />
          <rect x="0" y="${size - 2}" width="${size}" height="2" fill="rgba(0, 0, 0, 0.2)" />
          <rect x="${size - 2}" y="0" width="2" height="${size}" fill="rgba(0, 0, 0, 0.2)" />
        </svg>
      `;
    }
    
    // High detail - full version
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base stone color -->
        <rect width="${size}" height="${size}" fill="${baseColor}" />
        
        <!-- Stone cracks -->
        ${this.generateCracks(x, y, size, random)}
        
        <!-- 3D effect borders -->
        <rect x="0" y="0" width="${size}" height="2" fill="rgba(255, 255, 255, 0.1)" />
        <rect x="0" y="0" width="2" height="${size}" fill="rgba(255, 255, 255, 0.1)" />
        <rect x="0" y="${size - 2}" width="${size}" height="2" fill="rgba(0, 0, 0, 0.2)" />
        <rect x="${size - 2}" y="0" width="2" height="${size}" fill="rgba(0, 0, 0, 0.2)" />
        
        <!-- Surface highlights -->
        ${this.generateStoneHighlights(x, y, size, random)}
      </svg>
    `;
  }
  
  private generateCracks(_x: number, _y: number, size: number, random: any): string {
    let cracks = '';
    const crackCount = 2 + Math.floor(random.next() * 2);
    
    for (let i = 0; i < crackCount; i++) {
      const x1 = random.next() * size;
      const y1 = random.next() * size;
      const x2 = random.next() * size;
      const y2 = random.next() * size;
      
      cracks += `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
              stroke="rgba(0, 0, 0, 0.3)" 
              stroke-width="1" />
      `;
    }
    
    return cracks;
  }
  
  private generateStoneHighlights(_x: number, _y: number, size: number, random: any): string {
    let highlights = '';
    const highlightCount = 3 + Math.floor(random.next() * 3);
    
    for (let i = 0; i < highlightCount; i++) {
      const hx = random.next() * size;
      const hy = random.next() * size;
      const hw = 2 + random.next() * 3;
      
      highlights += `
        <rect x="${hx}" y="${hy}" width="${hw}" height="1" 
              fill="rgba(255, 255, 255, 0.1)" />
      `;
    }
    
    return highlights;
  }
  
  private generateWaterSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1, detailLevel = 'high' } = options;
    const variation = coordinateVariation(x, y, 0.1);
    const baseColor = this.adjustBrightness('#4682B4', brightness + variation);
    
    // Low detail - just solid color
    if (detailLevel === 'low') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
        </svg>
      `;
    }
    
    const random = this.seededRandom(x, y);
    
    // Medium detail - simple waves
    if (detailLevel === 'medium') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${baseColor}" />
          <!-- Simple wave line -->
          <line x1="0" y1="${size/2}" x2="${size}" y2="${size/2}" 
                stroke="rgba(255, 255, 255, 0.2)" stroke-width="1" />
        </svg>
      `;
    }
    
    // High detail - full version
    // Add animation phase based on coordinates for variety
    const phase = (x * 7 + y * 13) % 360;
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base water color -->
        <rect width="${size}" height="${size}" fill="${baseColor}" />
        
        <!-- Wave patterns -->
        ${this.generateWaves(x, y, size, random, phase)}
        
        <!-- Water shimmer -->
        ${this.generateShimmer(x, y, size, random)}
      </svg>
    `;
  }
  
  private generateWaves(_x: number, _y: number, size: number, _random: any, _phase: number): string {
    let waves = '';
    const waveRows = Math.ceil(size / 8);
    
    for (let row = 0; row < waveRows; row++) {
      const y = row * 8;
      let path = `M 0 ${y}`;
      
      for (let x = 0; x < size; x += 4) {
        path += ` Q ${x + 2} ${y - 2} ${x + 4} ${y}`;
      }
      
      waves += `
        <path d="${path}" 
              stroke="rgba(255, 255, 255, 0.2)" 
              stroke-width="1" 
              fill="none" />
      `;
    }
    
    return waves;
  }
  
  private generateShimmer(_x: number, _y: number, size: number, random: any): string {
    let shimmer = '';
    const shimmerCount = 6 + Math.floor(random.next() * 6);
    
    for (let i = 0; i < shimmerCount; i++) {
      const sx = random.next() * size;
      const sy = random.next() * size;
      
      shimmer += `
        <rect x="${sx}" y="${sy}" width="1" height="3" 
              fill="rgba(255, 255, 255, 0.1)" />
      `;
    }
    
    return shimmer;
  }
  
  private generateRockSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1 } = options;
    const variation = coordinateVariation(x, y, 0.15);
    const baseColor = this.adjustBrightness('#808080', brightness + variation);
    const shadowColor = 'rgba(0, 0, 0, 0.3)';
    const highlightColor = this.adjustBrightness('#A0A0A0', brightness + variation);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Rock shadow -->
        <circle cx="${centerX + 2}" cy="${centerY + 2}" r="${radius}" fill="${shadowColor}" />
        
        <!-- Rock base -->
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${baseColor}" />
        
        <!-- Rock highlight -->
        <circle cx="${centerX - radius * 0.2}" cy="${centerY - radius * 0.2}" 
                r="${radius * 0.6}" fill="${highlightColor}" />
      </svg>
    `;
  }
  
  private generateRoughTerrainSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size, brightness = 1 } = options;
    const variation = coordinateVariation(x, y, 0.1);
    const baseColor = this.adjustBrightness('#8B7D6B', brightness + variation);
    const random = this.seededRandom(x, y);
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base rough terrain color -->
        <rect width="${size}" height="${size}" fill="${baseColor}" />
        
        <!-- Rough texture with pebbles -->
        ${this.generateRoughTexture(x, y, size, random)}
        
        <!-- Dashed border to indicate difficulty -->
        <rect x="0" y="0" width="${size}" height="${size}" 
              fill="none" 
              stroke="rgba(100, 80, 60, 0.4)" 
              stroke-width="2" 
              stroke-dasharray="3,2" />
      </svg>
    `;
  }
  
  private generateRoughTexture(_x: number, _y: number, size: number, _random: any): string {
    let texture = '';
    const pebbleCount = 8;
    const centerX = size / 2;
    const centerY = size / 2;
    
    for (let i = 0; i < pebbleCount; i++) {
      const angle = (Math.PI * 2 * i) / pebbleCount;
      const distance = size / 4;
      const px = centerX + Math.cos(angle) * distance;
      const py = centerY + Math.sin(angle) * distance;
      const radius = size / 16;
      
      texture += `
        <circle cx="${px}" cy="${py}" r="${radius}" 
                fill="rgba(0, 0, 0, 0.2)" />
      `;
    }
    
    return texture;
  }
  
  private generateBridgeSvg(_x: number, _y: number, options: TerrainSvgOptions): string {
    const { size } = options;
    const plankCount = 4;
    const plankWidth = size / plankCount;
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Water underneath -->
        <rect width="${size}" height="${size}" fill="#4682B4" />
        
        <!-- Bridge planks -->
        ${this.generateBridgePlanks(size, plankCount, plankWidth)}
        
        <!-- Bridge rails -->
        <rect x="2" y="0" width="2" height="${size}" fill="#654321" />
        <rect x="${size - 4}" y="0" width="2" height="${size}" fill="#654321" />
      </svg>
    `;
  }
  
  private generateBridgePlanks(size: number, count: number, width: number): string {
    let planks = '';
    
    for (let i = 0; i < count; i++) {
      const x = i * width;
      planks += `
        <rect x="${x}" y="0" width="${width - 2}" height="${size}" 
              fill="#8B6F47" />
      `;
    }
    
    return planks;
  }
  
  private generateDefaultSvg(x: number, y: number, options: TerrainSvgOptions): string {
    const { size } = options;
    const variation = coordinateVariation(x, y, 0.1);
    const color = this.adjustBrightness('#666666', 1 + variation);
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${color}" />
      </svg>
    `;
  }
  
  /**
   * Seeded random number generator for consistent randomness
   */
  private seededRandom(x: number, y: number) {
    let seed = x * 12345 + y * 67890;
    return {
      next: () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      }
    };
  }
  
  /**
   * Adjust color brightness
   */
  private adjustBrightness(color: string, brightness: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.max(0, Math.round(r * brightness)));
    const newG = Math.min(255, Math.max(0, Math.round(g * brightness)));
    const newB = Math.min(255, Math.max(0, Math.round(b * brightness)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * Clear the SVG cache
   */
  clearCache(): void {
    this.svgCache.clear();
  }
  
  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.svgCache.size;
  }
}