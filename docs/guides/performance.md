# Performance Optimization Guide

This guide covers performance optimization techniques and best practices for TD Engine to ensure smooth gameplay even with hundreds of entities on screen.

## Performance Monitoring

### Built-in Metrics

```typescript
// Get performance metrics
const metrics = game.getEntityManager().getPerformanceMetrics();
console.log(`Entities: ${metrics.entityCount}`);
console.log(`Spatial cells: ${metrics.spatialCells}`);
console.log(`Pool usage: ${metrics.poolUtilization * 100}%`);
```

### Browser DevTools

1. **Performance Tab**: Record gameplay sessions
2. **Memory Tab**: Monitor memory usage and leaks
3. **Rendering Tab**: Check paint frequency and layers

### Custom FPS Counter

```typescript
class FPSCounter {
  private frames = 0;
  private lastTime = performance.now();
  
  update(): void {
    this.frames++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      console.log(`FPS: ${this.frames}`);
      this.frames = 0;
      this.lastTime = currentTime;
    }
  }
}
```

## Key Optimization Techniques

### 1. Spatial Partitioning

TD Engine uses a spatial grid to reduce collision checks:

```typescript
class EntityManager {
  private spatialGrid: Map<string, Entity[]> = new Map();
  private spatialCellSize: number = 100;
  
  getEntitiesInRadius(position: Vector2, radius: number): Entity[] {
    // Only check cells that could contain entities in range
    const cellRadius = Math.ceil(radius / this.spatialCellSize);
    const centerCell = this.getSpatialCell(position);
    const [centerX, centerY] = centerCell.split(',').map(Number);
    
    const entities: Entity[] = [];
    
    // Check only nearby cells instead of all entities
    for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
      for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
        const cell = `${x},${y}`;
        const cellEntities = this.spatialGrid.get(cell) || [];
        
        // Still need to check actual distance
        cellEntities.forEach(entity => {
          if (Vector2Utils.distance(entity.position, position) <= radius) {
            entities.push(entity);
          }
        });
      }
    }
    
    return entities;
  }
}
```

**Benefits:**
- O(1) cell lookup vs O(n) full scan
- Dramatically reduces collision checks
- Scales well with entity count

### 2. Object Pooling

Reuse objects instead of creating new ones:

```typescript
class ProjectilePool {
  private pool: Projectile[] = [];
  private maxSize: number = 100;
  
  acquire(position: Vector2, target: Enemy, damage: number): Projectile {
    // Try to reuse from pool
    let projectile = this.pool.find(p => !p.isAlive);
    
    if (projectile) {
      // Reset existing projectile
      projectile.reset(position, target, damage);
    } else if (this.pool.length < this.maxSize) {
      // Create new if under limit
      projectile = new Projectile(position, target, damage);
      this.pool.push(projectile);
    } else {
      // Forcibly reuse oldest if at limit
      projectile = this.pool[0];
      projectile.reset(position, target, damage);
    }
    
    return projectile;
  }
}
```

**Benefits:**
- Reduces garbage collection
- Predictable memory usage
- Eliminates allocation overhead

### 3. Visibility Culling

Only process/render visible entities:

```typescript
renderTower(tower: Tower): void {
  // Early exit if not visible
  if (!this.camera.isVisible(tower.position, tower.radius)) {
    return;
  }
  
  // ... render tower
}

updateEnemy(enemy: Enemy, deltaTime: number): void {
  // Simplified update for off-screen enemies
  if (!this.camera.isVisible(enemy.position, 100)) {
    enemy.simpleUpdate(deltaTime); // Just position update
    return;
  }
  
  enemy.fullUpdate(deltaTime); // Full AI, animation, etc.
}
```

**Benefits:**
- Reduces rendering calls
- Simplifies off-screen logic
- Scales with zoom level

### 4. Batch Rendering

Minimize context state changes:

```typescript
renderEnemies(enemies: Enemy[]): void {
  // Group by type to minimize state changes
  const enemiesByType = new Map<EnemyType, Enemy[]>();
  
  enemies.forEach(enemy => {
    if (!enemiesByType.has(enemy.type)) {
      enemiesByType.set(enemy.type, []);
    }
    enemiesByType.get(enemy.type)!.push(enemy);
  });
  
  // Render each type with single setup
  enemiesByType.forEach((enemyGroup, type) => {
    this.ctx.save();
    this.setupEnemyStyle(type); // Set color, etc. once
    
    enemyGroup.forEach(enemy => {
      this.drawEnemy(enemy); // Just position/transform
    });
    
    this.ctx.restore();
  });
}
```

### 5. Level of Detail (LOD)

Adjust detail based on zoom/distance:

```typescript
renderEntity(entity: Entity): void {
  const zoom = this.camera.getZoom();
  
  if (zoom < 0.5) {
    // Far zoom - simple shapes
    this.renderEntitySimple(entity);
  } else if (zoom < 1.0) {
    // Medium zoom - basic details
    this.renderEntityMedium(entity);
  } else {
    // Close zoom - full details
    this.renderEntityDetailed(entity);
  }
}

renderEntitySimple(entity: Entity): void {
  // Just a colored square
  this.ctx.fillStyle = entity.color;
  this.ctx.fillRect(
    entity.screenX - entity.radius,
    entity.screenY - entity.radius,
    entity.radius * 2,
    entity.radius * 2
  );
}
```

### 6. Update Throttling

Update different systems at different rates:

```typescript
class Game {
  private updateTimers = {
    ai: 0,
    particles: 0,
    ui: 0
  };
  
  update(deltaTime: number): void {
    // Always update critical systems
    this.updatePhysics(deltaTime);
    this.updateCombat(deltaTime);
    
    // AI at 10 FPS
    this.updateTimers.ai += deltaTime;
    if (this.updateTimers.ai >= 100) {
      this.updateAI();
      this.updateTimers.ai = 0;
    }
    
    // Particles at 30 FPS
    this.updateTimers.particles += deltaTime;
    if (this.updateTimers.particles >= 33) {
      this.updateParticles();
      this.updateTimers.particles = 0;
    }
    
    // UI at 4 FPS
    this.updateTimers.ui += deltaTime;
    if (this.updateTimers.ui >= 250) {
      this.updateUI();
      this.updateTimers.ui = 0;
    }
  }
}
```

## Memory Management

### 1. Cleanup Dead References

```typescript
cleanupEntities(): void {
  // Remove dead entities
  this.enemies = this.enemies.filter(e => e.isAlive);
  this.projectiles = this.projectiles.filter(p => p.isAlive);
  
  // Clear references in spatial grid
  this.spatialGrid.forEach((entities, cell) => {
    const alive = entities.filter(e => e.isAlive);
    if (alive.length === 0) {
      this.spatialGrid.delete(cell);
    } else {
      this.spatialGrid.set(cell, alive);
    }
  });
}
```

### 2. Limit Entity Counts

```typescript
const MAX_ENTITIES = {
  projectiles: 200,
  particles: 500,
  decorations: 100
};

spawnProjectile(projectile: Projectile): void {
  if (this.projectiles.length >= MAX_ENTITIES.projectiles) {
    // Remove oldest projectile
    this.projectiles.shift();
  }
  this.projectiles.push(projectile);
}
```

### 3. Texture Management

```typescript
class TextureManager {
  private cache: Map<string, HTMLImageElement> = new Map();
  private maxCacheSize: number = 50;
  
  async loadTexture(url: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    // Evict old textures if needed
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Load and cache
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    
    this.cache.set(url, img);
    return img;
  }
}
```

## Canvas Optimization

### 1. Layer Management

```typescript
class LayeredRenderer {
  private staticCanvas: HTMLCanvasElement;  // Grid, decorations
  private dynamicCanvas: HTMLCanvasElement; // Entities
  private uiCanvas: HTMLCanvasElement;      // UI overlay
  
  constructor() {
    // Static layer - render once
    this.renderStaticLayer();
    
    // Dynamic layer - render each frame
    this.renderDynamicLayer();
    
    // UI layer - render on change
    this.renderUILayer();
  }
  
  renderStaticLayer(): void {
    const ctx = this.staticCanvas.getContext('2d')!;
    this.renderGrid(ctx);
    this.renderDecorations(ctx);
    // Only re-render on map change
  }
}
```

### 2. Path Caching

```typescript
class CachedRenderer {
  private pathCache: Map<string, Path2D> = new Map();
  
  renderTower(tower: Tower): void {
    const key = `${tower.type}_${tower.level}`;
    
    let path = this.pathCache.get(key);
    if (!path) {
      path = new Path2D();
      this.createTowerPath(path, tower.type, tower.level);
      this.pathCache.set(key, path);
    }
    
    // Reuse cached path
    this.ctx.save();
    this.ctx.translate(tower.x, tower.y);
    this.ctx.fillStyle = tower.color;
    this.ctx.fill(path);
    this.ctx.restore();
  }
}
```

### 3. Image Smoothing

```typescript
setupCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  
  // Disable smoothing for pixel art
  ctx.imageSmoothingEnabled = false;
  
  // Or optimize for performance
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
}
```

## Algorithm Optimization

### 1. Pathfinding Caching

```typescript
class CachedPathfinder {
  private pathCache: Map<string, Vector2[]> = new Map();
  
  findPath(start: Vector2, end: Vector2): Vector2[] {
    const key = `${start.x},${start.y}-${end.x},${end.y}`;
    
    // Check cache
    if (this.pathCache.has(key)) {
      return [...this.pathCache.get(key)!];
    }
    
    // Calculate path
    const path = this.calculatePath(start, end);
    
    // Cache for reuse
    this.pathCache.set(key, path);
    
    // Limit cache size
    if (this.pathCache.size > 100) {
      const firstKey = this.pathCache.keys().next().value;
      this.pathCache.delete(firstKey);
    }
    
    return [...path];
  }
}
```

### 2. Distance Checks

```typescript
// Squared distance for comparisons (avoid sqrt)
function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Use squared distances for comparisons
findClosestEnemy(position: Vector2, range: number): Enemy | null {
  const rangeSquared = range * range;
  let closest: Enemy | null = null;
  let minDistSquared = rangeSquared;
  
  for (const enemy of this.enemies) {
    const distSquared = distanceSquared(position, enemy.position);
    if (distSquared < minDistSquared) {
      closest = enemy;
      minDistSquared = distSquared;
    }
  }
  
  return closest;
}
```

## Profiling Tools

### 1. Custom Profiler

```typescript
class Profiler {
  private timings: Map<string, number[]> = new Map();
  
  start(label: string): void {
    if (!this.timings.has(label)) {
      this.timings.set(label, []);
    }
    this.timings.get(label)!.push(performance.now());
  }
  
  end(label: string): void {
    const starts = this.timings.get(label);
    if (!starts || starts.length === 0) return;
    
    const start = starts.pop()!;
    const duration = performance.now() - start;
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  report(): void {
    console.table(this.getAverages());
  }
}

// Usage
profiler.start('update');
game.update(deltaTime);
profiler.end('update');
```

### 2. Memory Profiling

```typescript
class MemoryMonitor {
  report(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log({
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      });
    }
  }
}
```

## Performance Checklist

### Before Optimization
- [ ] Profile to identify bottlenecks
- [ ] Set performance targets (60 FPS with X entities)
- [ ] Create benchmarks for comparison

### During Development
- [ ] Use object pooling for frequently created objects
- [ ] Implement spatial partitioning for collision detection
- [ ] Add visibility culling for rendering
- [ ] Batch similar rendering operations
- [ ] Cache expensive calculations
- [ ] Use appropriate data structures (Map vs Array)
- [ ] Minimize DOM manipulation

### Testing
- [ ] Test with maximum expected entities
- [ ] Test on low-end devices
- [ ] Monitor memory usage over time
- [ ] Check for memory leaks
- [ ] Verify smooth gameplay at 60 FPS

### Optimization Priorities
1. **Algorithm complexity** - O(n²) to O(n log n)
2. **Rendering calls** - Batch and cull
3. **Memory allocation** - Pool and reuse
4. **State changes** - Minimize context switches
5. **Calculations** - Cache results

## Common Performance Issues

### 1. Too Many Draw Calls
**Problem**: Each entity rendered separately
**Solution**: Batch rendering, sprite sheets

### 2. Expensive Collision Detection
**Problem**: Checking every entity against every other
**Solution**: Spatial partitioning, broad phase detection

### 3. Memory Leaks
**Problem**: References preventing garbage collection
**Solution**: Proper cleanup, weak references

### 4. Large Textures
**Problem**: High memory usage, slow loading
**Solution**: Texture atlases, compression, LOD

### 5. Complex Calculations Every Frame
**Problem**: Recalculating unchanged values
**Solution**: Cache results, update only on change