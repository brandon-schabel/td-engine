# Rendering System

The rendering system in TD Engine provides efficient 2D canvas-based graphics with support for biomes, environmental effects, and performance optimizations.

## Architecture Overview

```
Renderer
  ├─> Camera (viewport management)
  ├─> TextureManager (asset caching)
  ├─> Grid rendering
  ├─> Entity rendering
  ├─> Environmental effects
  └─> UI overlay
```

## Core Components

### Renderer Class

The main rendering class that orchestrates all visual output:

```typescript
class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grid: Grid;
  private camera: Camera;
  private textureManager: TextureManager;
  private environmentalEffects: EnvironmentalEffect[] = [];
}
```

### Camera System

Manages viewport and world-to-screen transformations:

```typescript
class Camera {
  private viewportWidth: number;
  private viewportHeight: number;
  private position: Vector2;
  private zoom: number = 1.0;
  private followTarget: boolean = true;

  // Transform world coordinates to screen
  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: (worldPos.x - this.position.x) * this.zoom + this.viewportWidth / 2,
      y: (worldPos.y - this.position.y) * this.zoom + this.viewportHeight / 2
    };
  }

  // Check if object is visible
  isVisible(position: Vector2, radius: number): boolean {
    const bounds = this.getVisibleBounds();
    return position.x + radius >= bounds.min.x &&
           position.x - radius <= bounds.max.x &&
           position.y + radius >= bounds.min.y &&
           position.y - radius <= bounds.max.y;
  }
}
```

## Rendering Pipeline

### 1. Frame Clear
```typescript
clear(backgroundColor?: string): void {
  if (backgroundColor) {
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  } else {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

### 2. Grid Rendering
```typescript
renderGrid(): void {
  const visibleBounds = this.camera.getVisibleBounds();
  
  // Calculate visible grid cells
  const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
  const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
  
  // Render only visible cells
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      this.renderCell(x, y);
    }
  }
}
```

### 3. Entity Rendering
```typescript
renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], 
               collectibles: Collectible[], player?: Player): void {
  // Render in layers for proper depth
  towers.forEach(tower => this.renderTower(tower));
  enemies.forEach(enemy => this.renderEnemy(enemy));
  collectibles.forEach(collectible => this.renderCollectible(collectible));
  projectiles.forEach(projectile => this.renderProjectile(projectile));
  if (player) this.renderPlayer(player);
}
```

## Biome System

TD Engine supports multiple visual themes through biomes:

### Biome Configuration
```typescript
interface BiomeColors {
  primary: string;      // Main terrain color
  secondary: string;    // Accent terrain color
  path: string;        // Path/road color
  border: string;      // Wall/border color
  accent: string;      // Special features color
}

const BIOME_PRESETS = {
  FOREST: {
    colors: {
      primary: '#2D5016',
      secondary: '#3E7C17',
      path: '#8B7355',
      border: '#4A4A4A',
      accent: '#F4A460'
    }
  },
  DESERT: { /* ... */ },
  ARCTIC: { /* ... */ },
  // ... more biomes
};
```

### Height-Based Shading
```typescript
private adjustBrightness(color: string, brightness: number): string {
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Apply brightness
  const newR = Math.floor(Math.min(255, r * brightness));
  // ... convert back to hex
}

// Usage in rendering
const brightness = 1 - height * 0.3; // Darker at higher elevations
this.ctx.fillStyle = this.adjustBrightness(biomeColors.primary, brightness);
```

## Environmental Effects

### Particle Effects
```typescript
private renderParticleEffect(effect: EnvironmentalEffect): void {
  const particleCount = Math.floor(10 * effect.intensity);
  
  for (let i = 0; i < particleCount; i++) {
    switch (effect.properties.particleType) {
      case 'snow':
        // Render falling snow
        this.ctx.arc(x + Math.sin(time + i) * 10, y, 2, 0, Math.PI * 2);
        break;
      case 'leaves':
        // Render falling leaves with rotation
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(time + i);
        this.ctx.fillRect(-3, -2, 6, 4);
        this.ctx.restore();
        break;
      // ... more particle types
    }
  }
}
```

### Lighting Effects
```typescript
private renderLightingEffect(effect: EnvironmentalEffect): void {
  if (effect.properties.lightType === 'glow') {
    const gradient = this.ctx.createRadialGradient(
      screenPos.x, screenPos.y, 0,
      screenPos.x, screenPos.y, effect.radius
    );
    
    gradient.addColorStop(0, color + '88');
    gradient.addColorStop(0.5, color + '44');
    gradient.addColorStop(1, color + '00');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(/* ... */);
  }
}
```

## Performance Optimizations

### 1. Visibility Culling
Only render entities within camera view:
```typescript
renderTower(tower: Tower): void {
  // Early exit if not visible
  if (!this.camera.isVisible(tower.position, tower.radius)) return;
  
  // ... render tower
}
```

### 2. Batch Rendering
Minimize context state changes:
```typescript
// Group similar operations
this.ctx.save();
this.ctx.fillStyle = '#FF0000';
enemies.forEach(enemy => {
  if (enemy.type === EnemyType.BASIC) {
    // Render all basic enemies with same style
  }
});
this.ctx.restore();
```

### 3. Level of Detail
Adjust detail based on zoom:
```typescript
const zoom = this.camera.getZoom();
if (zoom < 0.5) {
  // Skip small details when zoomed out
  return;
}
```

### 4. Texture Caching
Cache and reuse loaded images:
```typescript
class TextureManager {
  private textures: Map<string, Texture> = new Map();
  
  async loadTexture(name: string, url: string): Promise<Texture> {
    if (this.textures.has(name)) {
      return this.textures.get(name)!;
    }
    
    const image = new Image();
    const texture = { image, loaded: false };
    
    image.onload = () => {
      texture.loaded = true;
    };
    
    image.src = url;
    this.textures.set(name, texture);
    return texture;
  }
}
```

## Rendering Techniques

### Health Bars
```typescript
renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
  if (!alwaysShow && entity.health >= entity.maxHealth) return;
  
  const barWidth = 40 * zoom;
  const barHeight = 4 * zoom;
  const x = screenPos.x - barWidth / 2;
  const y = screenPos.y - entity.radius - 10;
  
  // Background
  this.ctx.fillStyle = '#222222';
  this.ctx.fillRect(x, y, barWidth, barHeight);
  
  // Health
  const healthPercentage = entity.health / entity.maxHealth;
  const healthColor = healthPercentage > 0.6 ? '#4CAF50' : 
                     healthPercentage > 0.3 ? '#FF9800' : '#F44336';
  
  this.ctx.fillStyle = healthColor;
  this.ctx.fillRect(x, y, barWidth * healthPercentage, barHeight);
}
```

### Tower Range Indicators
```typescript
renderTowerRange(tower: Tower): void {
  const screenPos = this.getScreenPosition(tower);
  
  this.ctx.beginPath();
  this.ctx.arc(screenPos.x, screenPos.y, tower.range * zoom, 0, Math.PI * 2);
  this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  this.ctx.lineWidth = 2 * zoom;
  this.ctx.setLineDash([5 * zoom, 5 * zoom]);
  this.ctx.stroke();
  this.ctx.setLineDash([]); // Reset
}
```

### Ghost Preview
```typescript
renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
  this.ctx.save();
  this.ctx.globalAlpha = 0.6;
  
  // Color based on validity
  this.ctx.fillStyle = canPlace ? '#4CAF50' : '#F44336';
  
  // Render semi-transparent tower
  this.renderTower(tempTower);
  
  // Range preview
  this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
  this.ctx.setLineDash([3, 3]);
  // ... render range circle
  
  this.ctx.restore();
}
```

## UI Rendering

### HUD Elements
```typescript
renderUI(currency: number, lives: number, score: number, wave: number): void {
  const padding = 10;
  const fontSize = 18;
  const lineHeight = 25;
  
  // Currency
  this.renderText(
    `Currency: $${currency}`, 
    padding, 
    padding + fontSize, 
    '#FFD700', 
    `${fontSize}px Arial`
  );
  
  // Lives with color coding
  const livesColor = lives > 5 ? '#4CAF50' : lives > 2 ? '#FF9800' : '#F44336';
  this.renderText(
    `Lives: ${lives}`, 
    padding, 
    padding + fontSize + lineHeight, 
    livesColor, 
    `${fontSize}px Arial`
  );
  
  // ... score and wave
}
```

### State Overlays
```typescript
renderGameOver(): void {
  // Semi-transparent overlay
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
  // Game Over text
  this.renderText(
    'GAME OVER',
    this.canvas.width / 2,
    this.canvas.height / 2,
    '#F44336',
    '48px Arial',
    'center'
  );
}
```

## Best Practices

1. **Save/Restore Context**: Always save and restore when changing context state
2. **Batch Operations**: Group similar rendering operations
3. **Cache Calculations**: Store frequently used calculations
4. **Early Exit**: Skip rendering for off-screen objects
5. **Reuse Objects**: Don't create new objects in render loops

## Common Patterns

### Layer Ordering
```typescript
renderScene(): void {
  this.clear();
  this.renderGrid();        // Bottom layer
  this.renderDecorations(); // Environment
  this.renderShadows();     // Under entities
  this.renderEntities();    // Main layer
  this.renderEffects();     // Particles
  this.renderUI();          // Top layer
}
```

### Animation Frames
```typescript
// Time-based animation
const animationProgress = (Date.now() % 1000) / 1000;
const bounce = Math.sin(animationProgress * Math.PI * 2) * 5;
```

### Coordinate Transformation
```typescript
// Always transform coordinates for rendering
const screenPos = this.camera.worldToScreen(entity.position);
const screenRadius = entity.radius * this.camera.getZoom();
```