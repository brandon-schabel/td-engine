import { Game } from '@/core/Game';
import { vi } from 'vitest';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  entityCount: number;
  memoryUsage?: number;
}

export interface FrameTimings {
  start: number;
  updateStart: number;
  updateEnd: number;
  renderStart: number;
  renderEnd: number;
  end: number;
}

/**
 * Performance monitor for game testing
 */
export class PerformanceMonitor {
  private frames: FrameTimings[] = [];
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  
  constructor(private game: Game) {}
  
  /**
   * Start monitoring performance
   */
  start(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frames = [];
  }
  
  /**
   * Record frame timing
   */
  recordFrame(timing: FrameTimings): void {
    this.frames.push(timing);
  }
  
  /**
   * Measure a single frame
   */
  measureFrame(deltaTime: number): FrameTimings {
    const frameStart = performance.now();
    
    // Measure update time
    const updateStart = performance.now();
    this.game.update(deltaTime);
    const updateEnd = performance.now();
    
    // Measure render time
    const renderStart = performance.now();
    this.game.render();
    const renderEnd = performance.now();
    
    const frameEnd = performance.now();
    
    const timing: FrameTimings = {
      start: frameStart,
      updateStart,
      updateEnd,
      renderStart,
      renderEnd,
      end: frameEnd
    };
    
    this.recordFrame(timing);
    return timing;
  }
  
  /**
   * Run performance test for specified duration
   */
  async runTest(durationMs: number, targetFps = 60): Promise<PerformanceMetrics> {
    this.start();
    
    const frameTime = 1000 / targetFps;
    const totalFrames = Math.ceil(durationMs / frameTime);
    
    for (let i = 0; i < totalFrames; i++) {
      this.measureFrame(frameTime);
      
      // Yield to event loop periodically
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return this.getMetrics();
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.frames.length === 0) {
      return {
        fps: 0,
        frameTime: 0,
        updateTime: 0,
        renderTime: 0,
        entityCount: 0
      };
    }
    
    const gameAny = this.game as any;
    const entityCount = (gameAny.enemies?.length || 0) + 
                       (gameAny.towers?.length || 0) + 
                       (gameAny.projectiles?.length || 0);
    
    // Calculate average times
    const avgFrameTime = this.frames.reduce((sum, f) => sum + (f.end - f.start), 0) / this.frames.length;
    const avgUpdateTime = this.frames.reduce((sum, f) => sum + (f.updateEnd - f.updateStart), 0) / this.frames.length;
    const avgRenderTime = this.frames.reduce((sum, f) => sum + (f.renderEnd - f.renderStart), 0) / this.frames.length;
    
    // Calculate FPS
    const duration = this.frames[this.frames.length - 1].end - this.frames[0].start;
    const fps = (this.frames.length / duration) * 1000;
    
    return {
      fps: Math.round(fps),
      frameTime: avgFrameTime,
      updateTime: avgUpdateTime,
      renderTime: avgRenderTime,
      entityCount,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Get frame time statistics
   */
  getFrameStats(): {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } {
    if (this.frames.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }
    
    const frameTimes = this.frames.map(f => f.end - f.start);
    frameTimes.sort((a, b) => a - b);
    
    return {
      min: frameTimes[0],
      max: frameTimes[frameTimes.length - 1],
      avg: frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length,
      p95: frameTimes[Math.floor(frameTimes.length * 0.95)],
      p99: frameTimes[Math.floor(frameTimes.length * 0.99)]
    };
  }
  
  /**
   * Check if performance meets targets
   */
  assertPerformance(targets: {
    minFps?: number;
    maxFrameTime?: number;
    maxUpdateTime?: number;
    maxRenderTime?: number;
  }): void {
    const metrics = this.getMetrics();
    
    if (targets.minFps !== undefined) {
      expect(metrics.fps).toBeGreaterThanOrEqual(targets.minFps);
    }
    
    if (targets.maxFrameTime !== undefined) {
      expect(metrics.frameTime).toBeLessThanOrEqual(targets.maxFrameTime);
    }
    
    if (targets.maxUpdateTime !== undefined) {
      expect(metrics.updateTime).toBeLessThanOrEqual(targets.maxUpdateTime);
    }
    
    if (targets.maxRenderTime !== undefined) {
      expect(metrics.renderTime).toBeLessThanOrEqual(targets.maxRenderTime);
    }
  }
  
  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }
  
  /**
   * Clear recorded data
   */
  clear(): void {
    this.frames = [];
  }
}

/**
 * FPS counter for real-time monitoring
 */
export class FPSCounter {
  private frameTimes: number[] = [];
  private lastTime: number = 0;
  
  constructor(private sampleSize = 60) {}
  
  /**
   * Update with new frame
   */
  update(currentTime: number): void {
    if (this.lastTime > 0) {
      const frameTime = currentTime - this.lastTime;
      this.frameTimes.push(frameTime);
      
      if (this.frameTimes.length > this.sampleSize) {
        this.frameTimes.shift();
      }
    }
    
    this.lastTime = currentTime;
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const avgFrameTime = this.frameTimes.reduce((sum, t) => sum + t, 0) / this.frameTimes.length;
    return 1000 / avgFrameTime;
  }
  
  /**
   * Get smoothed FPS
   */
  getSmoothedFPS(): number {
    if (this.frameTimes.length < 10) return this.getFPS();
    
    // Use last 10 frames for smoothing
    const recentFrames = this.frameTimes.slice(-10);
    const avgFrameTime = recentFrames.reduce((sum, t) => sum + t, 0) / recentFrames.length;
    return 1000 / avgFrameTime;
  }
  
  /**
   * Reset counter
   */
  reset(): void {
    this.frameTimes = [];
    this.lastTime = 0;
  }
}

/**
 * Stress test utilities
 */
export class StressTester {
  constructor(private game: Game) {}
  
  /**
   * Spawn many entities for stress testing
   */
  async spawnEntities(config: {
    enemyCount?: number;
    towerCount?: number;
    projectileCount?: number;
  }): Promise<void> {
    const gameAny = this.game as any;
    
    // Spawn enemies
    if (config.enemyCount) {
      for (let i = 0; i < config.enemyCount; i++) {
        const enemy = {
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          health: 100,
          isAlive: true,
          update: vi.fn(),
          render: vi.fn()
        };
        gameAny.enemies.push(enemy);
      }
    }
    
    // Spawn towers
    if (config.towerCount) {
      for (let i = 0; i < config.towerCount; i++) {
        const tower = {
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          update: vi.fn(),
          render: vi.fn()
        };
        gameAny.towers.push(tower);
      }
    }
    
    // Spawn projectiles
    if (config.projectileCount) {
      for (let i = 0; i < config.projectileCount; i++) {
        const projectile = {
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          isAlive: true,
          update: vi.fn(),
          render: vi.fn()
        };
        gameAny.projectiles.push(projectile);
      }
    }
  }
  
  /**
   * Run stress test with increasing load
   */
  async runLoadTest(config: {
    startEntities: number;
    endEntities: number;
    step: number;
    framesToTest: number;
    targetFps?: number;
  }): Promise<Array<{ entityCount: number; metrics: PerformanceMetrics }>> {
    const results: Array<{ entityCount: number; metrics: PerformanceMetrics }> = [];
    const monitor = new PerformanceMonitor(this.game);
    
    for (let count = config.startEntities; count <= config.endEntities; count += config.step) {
      // Clear existing entities
      const gameAny = this.game as any;
      gameAny.enemies = [];
      gameAny.towers = [];
      gameAny.projectiles = [];
      
      // Spawn new entities
      await this.spawnEntities({ enemyCount: count });
      
      // Run performance test
      const metrics = await monitor.runTest(
        config.framesToTest * (1000 / (config.targetFps || 60)),
        config.targetFps
      );
      
      results.push({ entityCount: count, metrics });
      
      // Stop if FPS drops too low
      if (metrics.fps < 30) {
        break;
      }
    }
    
    return results;
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private snapshots: Array<{ time: number; memory?: number; entityCount: number }> = [];
  
  constructor(private game: Game) {}
  
  /**
   * Take memory snapshot
   */
  snapshot(): void {
    const gameAny = this.game as any;
    const entityCount = (gameAny.enemies?.length || 0) + 
                       (gameAny.towers?.length || 0) + 
                       (gameAny.projectiles?.length || 0);
    
    this.snapshots.push({
      time: performance.now(),
      memory: this.getMemoryUsage(),
      entityCount
    });
  }
  
  /**
   * Check for memory leaks
   */
  async checkForLeaks(testFn: () => Promise<void>, iterations = 10): Promise<boolean> {
    // Take initial snapshot
    this.snapshot();
    
    // Run test multiple times
    for (let i = 0; i < iterations; i++) {
      await testFn();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.snapshot();
    }
    
    // Analyze snapshots
    return this.analyzeSnapshots();
  }
  
  /**
   * Analyze snapshots for leaks
   */
  private analyzeSnapshots(): boolean {
    if (this.snapshots.length < 3) return false;
    
    // Check if memory is consistently increasing
    let increasingTrend = 0;
    
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];
      
      if (curr.memory && prev.memory && curr.memory > prev.memory) {
        increasingTrend++;
      }
    }
    
    // Consider it a leak if memory increases in most iterations
    return increasingTrend > this.snapshots.length * 0.7;
  }
  
  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }
  
  /**
   * Clear snapshots
   */
  clear(): void {
    this.snapshots = [];
  }
}