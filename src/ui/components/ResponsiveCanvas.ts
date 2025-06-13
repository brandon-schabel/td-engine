/**
 * ResponsiveCanvas Component
 * Auto-scaling canvas system for responsive game design
 */

import { Component } from '../core/Component';
import type { ComponentProps, ComponentState } from '../core/types';
import { StyleSystem } from '../core/StyleSystem';

export interface ResponsiveCanvasProps extends ComponentProps {
  baseWidth?: number;
  baseHeight?: number;
  aspectRatio?: number;
  scaleMode?: 'fit' | 'fill' | 'stretch' | 'cover';
  maxScale?: number;
  minScale?: number;
  pixelRatio?: boolean;
  autoResize?: boolean;
  maintainSharpness?: boolean;
  onResize?: (canvas: HTMLCanvasElement, scale: number, bounds: DOMRect) => void;
  onScaleChange?: (scale: number) => void;
}

export interface ResponsiveCanvasState extends ComponentState {
  currentScale: number;
  actualWidth: number;
  actualHeight: number;
  containerWidth: number;
  containerHeight: number;
  pixelRatio: number;
}

/**
 * ResponsiveCanvas - Auto-scaling canvas with responsive design
 */
export class ResponsiveCanvas extends Component<ResponsiveCanvasProps, ResponsiveCanvasState> {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrame: number | null = null;
  
  protected getDefaultProps(): Partial<ResponsiveCanvasProps> {
    return {
      baseWidth: 1200,
      baseHeight: 800,
      aspectRatio: 1200 / 800,
      scaleMode: 'fit',
      maxScale: 2.0,
      minScale: 0.3,
      pixelRatio: true,
      autoResize: true,
      maintainSharpness: true
    };
  }

  protected getInitialState(): ResponsiveCanvasState {
    return {
      currentScale: 1.0,
      actualWidth: this.mergedProps.baseWidth!,
      actualHeight: this.mergedProps.baseHeight!,
      containerWidth: 0,
      containerHeight: 0,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  protected render(): string {
    const { baseWidth, baseHeight } = this.mergedProps;
    const styles = this.getCanvasStyles();
    
    return `
      <div class="${styles.container}" data-responsive-canvas="container">
        <canvas 
          class="${styles.canvas}"
          width="${baseWidth}"
          height="${baseHeight}"
          data-responsive-canvas="canvas"
        ></canvas>
      </div>
    `;
  }

  private getCanvasStyles() {
    const { scaleMode, maintainSharpness } = this.mergedProps;
    const { currentScale } = this.state;
    const theme = StyleSystem.getInstance().getTheme();
    
    return StyleSystem.getInstance().createStyles({
      container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: theme.colors.background,
        
        // Touch optimizations
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      },
      
      canvas: {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        background: 'transparent',
        
        // Image rendering optimizations
        imageRendering: maintainSharpness ? 'pixelated' : 'auto',
        WebkitImageRendering: maintainSharpness ? 'pixelated' : 'auto',
        msImageRendering: maintainSharpness ? 'pixelated' : 'auto',
        
        // Transform origin for scaling
        transformOrigin: 'center center',
        
        // Scale mode specific styles
        ...(scaleMode === 'stretch' && {
          width: '100%',
          height: '100%',
        }),
        
        ...(scaleMode === 'fill' && {
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
        }),
        
        ...(scaleMode === 'cover' && {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }),
        
        // Responsive adjustments
        '@media (max-width: 768px)': {
          // Ensure canvas doesn't exceed viewport on mobile
          maxWidth: '100vw',
          maxHeight: '100vh',
        },
        
        // High DPI display support
        '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)': {
          imageRendering: maintainSharpness ? 'pixelated' : 'crisp-edges',
        },
      }
    });
  }

  protected afterMount(): void {
    this.setupCanvas();
    this.setupResizeObserver();
    this.updateCanvasSize();
    
    if (this.mergedProps.autoResize) {
      this.startResizeLoop();
    }
  }

  private setupCanvas(): void {
    const canvasElement = this.element?.querySelector('[data-responsive-canvas="canvas"]') as HTMLCanvasElement;
    if (!canvasElement) return;
    
    this.canvas = canvasElement;
    this.context = this.canvas.getContext('2d');
    
    // Set initial canvas properties
    this.canvas.style.imageRendering = this.mergedProps.maintainSharpness ? 'pixelated' : 'auto';
  }

  private setupResizeObserver(): void {
    if (!this.element || !('ResizeObserver' in window)) {
      // Fallback to window resize event
      window.addEventListener('resize', this.handleWindowResize.bind(this));
      return;
    }
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleContainerResize(entry.contentRect);
      }
    });
    
    this.resizeObserver.observe(this.element);
  }

  private handleWindowResize(): void {
    if (this.element) {
      const rect = this.element.getBoundingClientRect();
      this.handleContainerResize(rect);
    }
  }

  private handleContainerResize(rect: DOMRect): void {
    this.setState({
      containerWidth: rect.width,
      containerHeight: rect.height
    });
    
    this.updateCanvasSize();
  }

  private updateCanvasSize(): void {
    if (!this.canvas) return;
    
    const { baseWidth, baseHeight, scaleMode, maxScale, minScale, pixelRatio: usePixelRatio } = this.mergedProps;
    const { containerWidth, containerHeight, pixelRatio } = this.state;
    
    if (containerWidth === 0 || containerHeight === 0) return;
    
    // Calculate scale based on mode
    let scale = this.calculateScale(scaleMode!, containerWidth, containerHeight, baseWidth!, baseHeight!);
    
    // Clamp scale to min/max bounds
    scale = Math.max(minScale!, Math.min(maxScale!, scale));
    
    // Apply pixel ratio if enabled
    const finalPixelRatio = usePixelRatio ? pixelRatio : 1;
    
    // Update canvas size and scaling
    const displayWidth = baseWidth! * scale;
    const displayHeight = baseHeight! * scale;
    
    // Set CSS size (actual display size)
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
    
    // Set canvas resolution (for crisp rendering)
    this.canvas.width = baseWidth! * finalPixelRatio;
    this.canvas.height = baseHeight! * finalPixelRatio;
    
    // Scale the drawing context
    if (this.context && finalPixelRatio !== 1) {
      this.context.scale(finalPixelRatio, finalPixelRatio);
    }
    
    // Update state
    this.setState({
      currentScale: scale,
      actualWidth: displayWidth,
      actualHeight: displayHeight
    });
    
    // Trigger callbacks
    this.mergedProps.onResize?.(this.canvas, scale, new DOMRect(0, 0, displayWidth, displayHeight));
    this.mergedProps.onScaleChange?.(scale);
  }

  private calculateScale(mode: string, containerWidth: number, containerHeight: number, baseWidth: number, baseHeight: number): number {
    switch (mode) {
      case 'fit':
        return Math.min(containerWidth / baseWidth, containerHeight / baseHeight);
        
      case 'fill':
        return Math.max(containerWidth / baseWidth, containerHeight / baseHeight);
        
      case 'cover':
        return Math.max(containerWidth / baseWidth, containerHeight / baseHeight);
        
      case 'stretch':
        // Return average scale for stretch mode (though CSS handles the stretching)
        return Math.min(containerWidth / baseWidth, containerHeight / baseHeight);
        
      default:
        return Math.min(containerWidth / baseWidth, containerHeight / baseHeight);
    }
  }

  private startResizeLoop(): void {
    const checkResize = () => {
      if (this.element) {
        const rect = this.element.getBoundingClientRect();
        const { containerWidth, containerHeight } = this.state;
        
        if (rect.width !== containerWidth || rect.height !== containerHeight) {
          this.handleContainerResize(rect);
        }
      }
      
      this.animationFrame = requestAnimationFrame(checkResize);
    };
    
    checkResize();
  }

  /**
   * Public API Methods
   */
  
  /**
   * Get the canvas element
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get the 2D rendering context
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.context;
  }

  /**
   * Get current scale factor
   */
  public getScale(): number {
    return this.state.currentScale;
  }

  /**
   * Get canvas dimensions
   */
  public getDimensions(): { width: number; height: number; scale: number } {
    return {
      width: this.state.actualWidth,
      height: this.state.actualHeight,
      scale: this.state.currentScale
    };
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    const { currentScale } = this.state;
    const { baseWidth, baseHeight } = this.mergedProps;
    
    // Calculate relative position within the canvas
    const relativeX = (screenX - rect.left) / rect.width;
    const relativeY = (screenY - rect.top) / rect.height;
    
    // Convert to canvas coordinates
    const canvasX = relativeX * baseWidth!;
    const canvasY = relativeY * baseHeight!;
    
    return { x: canvasX, y: canvasY };
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  public canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    const { baseWidth, baseHeight } = this.mergedProps;
    
    // Convert to relative position
    const relativeX = canvasX / baseWidth!;
    const relativeY = canvasY / baseHeight!;
    
    // Convert to screen coordinates
    const screenX = rect.left + (relativeX * rect.width);
    const screenY = rect.top + (relativeY * rect.height);
    
    return { x: screenX, y: screenY };
  }

  /**
   * Force resize update
   */
  public forceResize(): void {
    this.updateCanvasSize();
  }

  /**
   * Set scale mode
   */
  public setScaleMode(mode: 'fit' | 'fill' | 'stretch' | 'cover'): void {
    this.updateProps({ scaleMode: mode });
    this.updateCanvasSize();
  }

  /**
   * Set scale limits
   */
  public setScaleLimits(min: number, max: number): void {
    this.updateProps({ minScale: min, maxScale: max });
    this.updateCanvasSize();
  }

  /**
   * Check if device is mobile
   */
  public isMobile(): boolean {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }

  /**
   * Get current viewport info
   */
  public getViewportInfo(): {
    isMobile: boolean;
    isLandscape: boolean;
    devicePixelRatio: number;
    viewportWidth: number;
    viewportHeight: number;
  } {
    return {
      isMobile: this.isMobile(),
      isLandscape: window.innerWidth > window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  protected beforeUnmount(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
  }
}

/**
 * Utility functions for responsive canvas management
 */
export class ResponsiveCanvasUtils {
  /**
   * Create a game canvas with optimal settings
   */
  static createGameCanvas(baseWidth: number = 1200, baseHeight: number = 800): ResponsiveCanvas {
    return new ResponsiveCanvas({
      baseWidth,
      baseHeight,
      scaleMode: 'fit',
      maxScale: 2.0,
      minScale: 0.5,
      pixelRatio: true,
      autoResize: true,
      maintainSharpness: true
    });
  }

  /**
   * Create a UI canvas that scales with content
   */
  static createUICanvas(): ResponsiveCanvas {
    return new ResponsiveCanvas({
      baseWidth: window.innerWidth,
      baseHeight: window.innerHeight,
      scaleMode: 'stretch',
      pixelRatio: true,
      autoResize: true,
      maintainSharpness: false
    });
  }

  /**
   * Calculate optimal canvas size for device
   */
  static getOptimalCanvasSize(targetAspectRatio: number = 16/9): { width: number; height: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportAspectRatio = viewportWidth / viewportHeight;
    
    let width: number;
    let height: number;
    
    if (viewportAspectRatio > targetAspectRatio) {
      // Viewport is wider than target - limit by height
      height = viewportHeight;
      width = height * targetAspectRatio;
    } else {
      // Viewport is taller than target - limit by width
      width = viewportWidth;
      height = width / targetAspectRatio;
    }
    
    // Round to even numbers for better pixel alignment
    return {
      width: Math.floor(width / 2) * 2,
      height: Math.floor(height / 2) * 2
    };
  }

  /**
   * Check if current device needs special handling
   */
  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get recommended scale factors for different devices
   */
  static getRecommendedScaleFactors(): { min: number; max: number } {
    const deviceType = this.getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        return { min: 0.3, max: 1.5 };
      case 'tablet':
        return { min: 0.5, max: 2.0 };
      case 'desktop':
        return { min: 0.8, max: 3.0 };
      default:
        return { min: 0.5, max: 2.0 };
    }
  }
}