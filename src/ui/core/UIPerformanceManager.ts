/**
 * UIPerformanceManager - Performance optimization for UI updates
 * Provides batching, throttling, and efficient update strategies
 */

export interface UIUpdateBatch {
  timestamp: number;
  updates: UIUpdate[];
  priority: 'high' | 'medium' | 'low';
}

export interface UIUpdate {
  id: string;
  type: 'state' | 'props' | 'style' | 'content' | 'visibility';
  target: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface PerformanceMetrics {
  totalUpdates: number;
  batchedUpdates: number;
  averageBatchSize: number;
  updateLatency: number;
  frameDrops: number;
  memoryUsage?: number;
}

export class UIPerformanceManager {
  private updateQueue: Map<string, UIUpdate> = new Map();
  private batchQueue: UIUpdateBatch[] = [];
  private isProcessing: boolean = false;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private frameDropCount: number = 0;
  
  // Performance settings
  private readonly BATCH_TIMEOUT = 16; // ~60fps
  private readonly MAX_BATCH_SIZE = 50;
  private readonly PRIORITY_WEIGHTS = {
    high: 1,
    medium: 2,
    low: 3
  };
  
  // Metrics
  private metrics: PerformanceMetrics = {
    totalUpdates: 0,
    batchedUpdates: 0,
    averageBatchSize: 0,
    updateLatency: 0,
    frameDrops: 0
  };

  constructor() {
    this.startPerformanceMonitoring();
  }

  /**
   * Queue a UI update for batch processing
   */
  queueUpdate(update: Omit<UIUpdate, 'timestamp'>): void {
    const fullUpdate: UIUpdate = {
      ...update,
      timestamp: performance.now()
    };

    // Deduplicate updates for the same target
    const key = `${update.target}_${update.type}`;
    const existing = this.updateQueue.get(key);
    
    if (existing && existing.priority <= this.PRIORITY_WEIGHTS[update.priority]) {
      // Replace with higher priority update
      this.updateQueue.set(key, fullUpdate);
    } else if (!existing) {
      this.updateQueue.set(key, fullUpdate);
    }

    this.metrics.totalUpdates++;
    this.scheduleProcessing();
  }

  /**
   * Force immediate processing of all queued updates
   */
  flushUpdates(): void {
    if (this.updateQueue.size === 0) return;

    this.processBatch();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalUpdates: 0,
      batchedUpdates: 0,
      averageBatchSize: 0,
      updateLatency: 0,
      frameDrops: 0
    };
  }

  /**
   * Create an optimized update scheduler
   */
  createUpdateScheduler<T>(
    target: string,
    updateFn: (data: T) => void,
    options: {
      throttleMs?: number;
      batchKey?: string;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): (data: T) => void {
    const { throttleMs = 0, batchKey = target, priority = 'medium' } = options;
    let lastUpdate = 0;
    let pendingData: T | null = null;

    return (data: T) => {
      const now = performance.now();
      
      // Throttling
      if (throttleMs > 0 && now - lastUpdate < throttleMs) {
        pendingData = data;
        return;
      }

      // Queue the update
      this.queueUpdate({
        id: `${target}_${now}`,
        type: 'props',
        target: batchKey,
        data: pendingData || data,
        priority
      });

      lastUpdate = now;
      pendingData = null;
    };
  }

  /**
   * Create a debounced update function
   */
  createDebouncedUpdate<T>(
    target: string,
    updateFn: (data: T) => void,
    delayMs: number = 100,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): (data: T) => void {
    let timeoutId: number | null = null;

    return (data: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        this.queueUpdate({
          id: `${target}_debounced`,
          type: 'props',
          target,
          data,
          priority
        });
        timeoutId = null;
      }, delayMs) as any;
    };
  }

  /**
   * Create a batched state updater for components
   */
  createBatchedStateUpdater<T extends Record<string, any>>(
    componentId: string,
    setState: (updates: Partial<T>) => void,
    options: {
      maxWaitMs?: number;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): (updates: Partial<T>) => void {
    const { maxWaitMs = 50, priority = 'medium' } = options;
    const pendingUpdates: Partial<T> = {};
    let hasUpdates = false;
    let timeoutId: number | null = null;

    const flushUpdates = () => {
      if (hasUpdates) {
        setState({ ...pendingUpdates });
        Object.keys(pendingUpdates).forEach(key => delete pendingUpdates[key]);
        hasUpdates = false;
      }
      timeoutId = null;
    };

    return (updates: Partial<T>) => {
      Object.assign(pendingUpdates, updates);
      hasUpdates = true;

      if (!timeoutId) {
        timeoutId = setTimeout(flushUpdates, maxWaitMs) as any;
      }

      // Also queue for immediate processing if high priority
      if (priority === 'high') {
        this.queueUpdate({
          id: `${componentId}_state`,
          type: 'state',
          target: componentId,
          data: updates,
          priority
        });
      }
    };
  }

  /**
   * Optimize animations by using transform and opacity
   */
  optimizeAnimation(
    element: HTMLElement,
    properties: {
      x?: number;
      y?: number;
      scale?: number;
      rotation?: number;
      opacity?: number;
    },
    options: {
      duration?: number;
      easing?: string;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): void {
    const { duration = 300, easing = 'ease', priority = 'medium' } = options;
    
    this.queueUpdate({
      id: `animation_${element.id || element.className}`,
      type: 'style',
      target: element.id || 'anonymous',
      data: {
        element,
        properties,
        duration,
        easing
      },
      priority
    });
  }

  /**
   * Batch DOM measurements to avoid layout thrashing
   */
  batchMeasurements<T>(
    measurements: Array<() => T>
  ): Promise<T[]> {
    return new Promise((resolve) => {
      this.queueUpdate({
        id: `measurements_${Date.now()}`,
        type: 'content',
        target: 'dom_measurements',
        data: {
          measurements,
          callback: resolve
        },
        priority: 'high'
      });
    });
  }

  /**
   * Private methods
   */

  private scheduleProcessing(): void {
    if (this.isProcessing || this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.processBatch();
      this.rafId = null;
    });
  }

  private processBatch(): void {
    if (this.updateQueue.size === 0) return;

    this.isProcessing = true;
    const startTime = performance.now();

    // Convert queue to batch
    const updates = Array.from(this.updateQueue.values());
    this.updateQueue.clear();

    // Sort by priority
    updates.sort((a, b) => 
      this.PRIORITY_WEIGHTS[a.priority] - this.PRIORITY_WEIGHTS[b.priority]
    );

    const batch: UIUpdateBatch = {
      timestamp: startTime,
      updates: updates.slice(0, this.MAX_BATCH_SIZE),
      priority: updates[0]?.priority || 'medium'
    };

    // Process the batch
    this.executeBatch(batch);

    // Update metrics
    this.metrics.batchedUpdates++;
    this.metrics.averageBatchSize = 
      (this.metrics.averageBatchSize * (this.metrics.batchedUpdates - 1) + batch.updates.length) / 
      this.metrics.batchedUpdates;
    this.metrics.updateLatency = performance.now() - startTime;

    // If there are remaining updates, schedule another batch
    if (updates.length > this.MAX_BATCH_SIZE) {
      updates.slice(this.MAX_BATCH_SIZE).forEach(update => {
        const key = `${update.target}_${update.type}`;
        this.updateQueue.set(key, update);
      });
      this.scheduleProcessing();
    }

    this.isProcessing = false;
  }

  private executeBatch(batch: UIUpdateBatch): void {
    // Group updates by type for more efficient processing
    const updatesByType = new Map<string, UIUpdate[]>();
    
    batch.updates.forEach(update => {
      const type = update.type;
      if (!updatesByType.has(type)) {
        updatesByType.set(type, []);
      }
      updatesByType.get(type)!.push(update);
    });

    // Process updates by type
    updatesByType.forEach((updates, type) => {
      switch (type) {
        case 'style':
          this.processStyleUpdates(updates);
          break;
        case 'content':
          this.processContentUpdates(updates);
          break;
        case 'visibility':
          this.processVisibilityUpdates(updates);
          break;
        case 'state':
        case 'props':
          this.processDataUpdates(updates);
          break;
        default:
          console.warn(`Unknown update type: ${type}`);
      }
    });
  }

  private processStyleUpdates(updates: UIUpdate[]): void {
    updates.forEach(update => {
      const { element, properties, duration, easing } = update.data;
      
      if (element && element instanceof HTMLElement) {
        // Use transform for better performance
        const transforms: string[] = [];
        
        if (properties.x !== undefined || properties.y !== undefined) {
          transforms.push(`translate(${properties.x || 0}px, ${properties.y || 0}px)`);
        }
        
        if (properties.scale !== undefined) {
          transforms.push(`scale(${properties.scale})`);
        }
        
        if (properties.rotation !== undefined) {
          transforms.push(`rotate(${properties.rotation}deg)`);
        }
        
        if (transforms.length > 0) {
          element.style.transform = transforms.join(' ');
        }
        
        if (properties.opacity !== undefined) {
          element.style.opacity = properties.opacity.toString();
        }
        
        // Apply transition
        element.style.transition = `all ${duration}ms ${easing}`;
      }
    });
  }

  private processContentUpdates(updates: UIUpdate[]): void {
    updates.forEach(update => {
      if (update.target === 'dom_measurements') {
        const { measurements, callback } = update.data;
        const results = measurements.map((measure: () => any) => measure());
        callback(results);
      }
    });
  }

  private processVisibilityUpdates(updates: UIUpdate[]): void {
    updates.forEach(update => {
      // Handle visibility changes efficiently
      const { element, visible } = update.data;
      
      if (element instanceof HTMLElement) {
        if (visible) {
          element.style.display = '';
          element.style.opacity = '1';
        } else {
          element.style.opacity = '0';
          // Use timeout to avoid layout thrashing
          setTimeout(() => {
            if (element.style.opacity === '0') {
              element.style.display = 'none';
            }
          }, 300);
        }
      }
    });
  }

  private processDataUpdates(updates: UIUpdate[]): void {
    // These are handled by components themselves
    // This manager just coordinates the timing
    updates.forEach(update => {
      // Emit event for components to handle
      const event = new CustomEvent('ui-update', {
        detail: { update }
      });
      document.dispatchEvent(event);
    });
  }

  private startPerformanceMonitoring(): void {
    let lastTime = performance.now();
    
    const monitor = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      
      // Detect frame drops (assuming 60fps target)
      if (frameTime > 20) { // >20ms indicates dropped frames
        this.metrics.frameDrops++;
      }
      
      lastTime = currentTime;
      
      // Monitor memory usage if available
      if ('memory' in performance) {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.updateQueue.clear();
    this.batchQueue = [];
  }
}