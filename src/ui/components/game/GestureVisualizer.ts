/**
 * GestureVisualizer.ts - Visual feedback for touch gestures
 * Shows trails, indicators, and feedback for recognized gestures
 */

import type { TouchGestureManager } from '@/input/TouchGestureManager';
import type { Vector2 } from '@/utils/Vector2';
import { GestureType } from '@/input/GestureRecognizer';
import { cn } from '@/ui/elements';

export interface GestureVisualizerOptions {
  canvas: HTMLCanvasElement;
  gestureManager: TouchGestureManager;
  showTrails?: boolean;
  showIndicators?: boolean;
  trailColor?: string;
  trailWidth?: number;
  fadeTime?: number;
}

interface Trail {
  points: Vector2[];
  timestamp: number;
  opacity: number;
}

interface Indicator {
  type: GestureType;
  position: Vector2;
  timestamp: number;
  data?: any;
}

export class GestureVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlay: HTMLDivElement;
  private gestureManager: TouchGestureManager;
  private options: Required<GestureVisualizerOptions>;
  
  private trails: Trail[] = [];
  private indicators: Indicator[] = [];
  private animationId: number | null = null;
  private lastUpdateTime = 0;
  
  constructor(options: GestureVisualizerOptions) {
    this.gestureManager = options.gestureManager;
    
    this.options = {
      canvas: options.canvas,
      gestureManager: options.gestureManager,
      showTrails: options.showTrails ?? true,
      showIndicators: options.showIndicators ?? true,
      trailColor: options.trailColor ?? '#00FF00',
      trailWidth: options.trailWidth ?? 3,
      fadeTime: options.fadeTime ?? 500
    };
    
    // Create visualization canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    this.canvas.width = options.canvas.width;
    this.canvas.height = options.canvas.height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for gesture visualizer');
    }
    this.ctx = ctx;
    
    // Create overlay for HTML indicators
    this.overlay = document.createElement('div');
    this.overlay.className = cn(
      'gesture-overlay',
      'absolute',
      'inset-0',
      'pointer-events-none',
      'z-50'
    );
    
    // Add to DOM
    options.canvas.parentElement?.appendChild(this.canvas);
    options.canvas.parentElement?.appendChild(this.overlay);
    
    // Listen to gesture events
    this.setupEventListeners();
    
    // Start animation loop
    this.startAnimation();
  }
  
  private setupEventListeners(): void {
    // Listen for all gesture types
    this.gestureManager.on('gesture', (event) => {
      if (this.options.showIndicators) {
        this.addIndicator(event);
      }
    });
    
    // Track touch points for trails
    if (this.options.showTrails) {
      this.setupTrailTracking();
    }
  }
  
  private setupTrailTracking(): void {
    let currentTrail: Trail | null = null;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        currentTrail = {
          points: [{ x: touch.clientX, y: touch.clientY }],
          timestamp: Date.now(),
          opacity: 1
        };
        this.trails.push(currentTrail);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (currentTrail && e.touches.length === 1) {
        const touch = e.touches[0];
        currentTrail.points.push({ x: touch.clientX, y: touch.clientY });
        
        // Limit trail length
        if (currentTrail.points.length > 50) {
          currentTrail.points.shift();
        }
      }
    };
    
    const handleTouchEnd = () => {
      currentTrail = null;
    };
    
    this.canvas.parentElement?.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.canvas.parentElement?.addEventListener('touchmove', handleTouchMove, { passive: true });
    this.canvas.parentElement?.addEventListener('touchend', handleTouchEnd, { passive: true });
    this.canvas.parentElement?.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }
  
  private addIndicator(event: any): void {
    const { type, gesture } = event;
    let position: Vector2 = { x: 0, y: 0 };
    
    // Get position based on gesture type
    switch (type) {
      case GestureType.TAP:
      case GestureType.DOUBLE_TAP:
      case GestureType.LONG_PRESS:
        if (gesture.startTouches?.[0]) {
          position = gesture.startTouches[0].position;
        }
        break;
        
      case GestureType.SWIPE:
        if (gesture.currentTouches?.[0]) {
          position = gesture.currentTouches[0].position;
        }
        break;
        
      case GestureType.PINCH:
        if (gesture.pinchCenter) {
          position = gesture.pinchCenter;
        }
        break;
    }
    
    const indicator: Indicator = {
      type,
      position,
      timestamp: Date.now(),
      data: gesture
    };
    
    this.indicators.push(indicator);
    this.showIndicatorFeedback(indicator);
  }
  
  private showIndicatorFeedback(indicator: Indicator): void {
    const element = document.createElement('div');
    element.className = cn(
      'gesture-indicator',
      'absolute',
      'animate-fadeOut',
      'pointer-events-none'
    );
    
    // Style based on gesture type
    switch (indicator.type) {
      case GestureType.TAP:
        element.innerHTML = '👆';
        element.className += ' text-2xl';
        break;
        
      case GestureType.DOUBLE_TAP:
        element.innerHTML = '👆👆';
        element.className += ' text-2xl';
        break;
        
      case GestureType.LONG_PRESS:
        element.innerHTML = '👇';
        element.className += ' text-2xl animate-pulse';
        break;
        
      case GestureType.SWIPE:
        const direction = indicator.data?.swipeDirection || 'unknown';
        const arrows: Record<string, string> = {
          up: '⬆️',
          down: '⬇️',
          left: '⬅️',
          right: '➡️'
        };
        element.innerHTML = arrows[direction] || '➡️';
        element.className += ' text-3xl';
        break;
        
      case GestureType.PINCH:
        const scale = indicator.data?.pinchScale || 1;
        element.innerHTML = scale > 1 ? '🔍+' : '🔍-';
        element.className += ' text-2xl';
        break;
    }
    
    // Position element
    element.style.left = `${indicator.position.x}px`;
    element.style.top = `${indicator.position.y}px`;
    element.style.transform = 'translate(-50%, -50%)';
    
    this.overlay.appendChild(element);
    
    // Remove after animation
    setTimeout(() => {
      element.remove();
    }, 1000);
  }
  
  private startAnimation(): void {
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - this.lastUpdateTime;
      this.lastUpdateTime = timestamp;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Update and draw trails
      if (this.options.showTrails) {
        this.updateTrails(deltaTime);
        this.drawTrails();
      }
      
      // Update indicators
      this.updateIndicators(deltaTime);
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  private updateTrails(deltaTime: number): void {
    const fadeRate = deltaTime / this.options.fadeTime;
    
    this.trails = this.trails.filter(trail => {
      trail.opacity -= fadeRate;
      return trail.opacity > 0 && trail.points.length > 0;
    });
  }
  
  private drawTrails(): void {
    this.ctx.strokeStyle = this.options.trailColor;
    this.ctx.lineWidth = this.options.trailWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    for (const trail of this.trails) {
      if (trail.points.length < 2) continue;
      
      this.ctx.globalAlpha = trail.opacity;
      this.ctx.beginPath();
      this.ctx.moveTo(trail.points[0].x, trail.points[0].y);
      
      // Draw smooth curve through points
      for (let i = 1; i < trail.points.length - 1; i++) {
        const xc = (trail.points[i].x + trail.points[i + 1].x) / 2;
        const yc = (trail.points[i].y + trail.points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(trail.points[i].x, trail.points[i].y, xc, yc);
      }
      
      // Draw last segment
      const lastPoint = trail.points[trail.points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  private updateIndicators(_deltaTime: number): void {
    const now = Date.now();
    this.indicators = this.indicators.filter(indicator => {
      return now - indicator.timestamp < this.options.fadeTime;
    });
  }
  
  /**
   * Update canvas size when window resizes
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  /**
   * Show or hide trails
   */
  public setShowTrails(show: boolean): void {
    this.options.showTrails = show;
    if (!show) {
      this.trails = [];
    }
  }
  
  /**
   * Show or hide indicators
   */
  public setShowIndicators(show: boolean): void {
    this.options.showIndicators = show;
    if (!show) {
      this.indicators = [];
      this.overlay.innerHTML = '';
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.canvas.remove();
    this.overlay.remove();
    
    // Remove all listeners
    this.gestureManager.removeAllListeners();
  }
}