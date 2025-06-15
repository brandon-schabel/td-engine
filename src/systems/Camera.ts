import type { Vector2 } from '@/utils/Vector2';
import { CAMERA_CONFIG } from '../config/UIConfig';

export interface CameraOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
  zoomSmoothing?: number;
}

export class Camera {
  private position: Vector2 = { x: 0, y: 0 };
  private viewportWidth: number;
  private viewportHeight: number;
  private worldWidth: number;
  private worldHeight: number;
  private smoothing: number = CAMERA_CONFIG.smoothing; // Camera smoothing factor (increased for more responsive following)
  
  // Zoom system properties
  private zoom: number = 1.0;
  private targetZoom: number = 1.0;
  private minZoom: number = CAMERA_CONFIG.minZoom;
  private maxZoom: number = CAMERA_CONFIG.maxZoom;
  private zoomSpeed: number = CAMERA_CONFIG.zoomSpeed;
  private zoomSmoothing: number = CAMERA_CONFIG.zoomSmoothing;
  
  // Camera mode
  private followTarget: boolean = true;
  
  constructor(viewportWidth: number, viewportHeight: number, worldWidth: number, worldHeight: number, options?: CameraOptions) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    
    // Apply options if provided
    if (options) {
      this.minZoom = options.minZoom ?? this.minZoom;
      this.maxZoom = options.maxZoom ?? this.maxZoom;
      this.zoomSpeed = options.zoomSpeed ?? this.zoomSpeed;
      this.zoomSmoothing = options.zoomSmoothing ?? this.zoomSmoothing;
    }
  }
  
  update(targetPosition: Vector2): void {
    // Update zoom smoothing
    this.zoom += (this.targetZoom - this.zoom) * this.zoomSmoothing;
    
    // Calculate effective viewport size based on zoom
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;
    
    // Check if the entire world fits in the viewport (zoomed out enough)
    const worldFitsHorizontally = this.worldWidth <= effectiveViewportWidth;
    const worldFitsVertically = this.worldHeight <= effectiveViewportHeight;
    
    if (worldFitsHorizontally || worldFitsVertically) {
      // Center the world in the viewport when zoomed out
      if (worldFitsHorizontally) {
        this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
      }
      if (worldFitsVertically) {
        this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
      }
      
      // For dimensions that don't fit, continue following the target
      if (!worldFitsHorizontally && this.followTarget) {
        const targetX = targetPosition.x - effectiveViewportWidth / 2;
        this.position.x += (targetX - this.position.x) * this.smoothing;
      }
      if (!worldFitsVertically && this.followTarget) {
        const targetY = targetPosition.y - effectiveViewportHeight / 2;
        this.position.y += (targetY - this.position.y) * this.smoothing;
      }
    } else if (this.followTarget) {
      // Normal following behavior when zoomed in
      const targetX = targetPosition.x - effectiveViewportWidth / 2;
      const targetY = targetPosition.y - effectiveViewportHeight / 2;
      
      // Smooth camera movement
      this.position.x += (targetX - this.position.x) * this.smoothing;
      this.position.y += (targetY - this.position.y) * this.smoothing;
    }
    
    // Clamp camera to world bounds (accounting for zoom)
    if (!worldFitsHorizontally) {
      this.position.x = Math.max(0, Math.min(this.worldWidth - effectiveViewportWidth, this.position.x));
    }
    if (!worldFitsVertically) {
      this.position.y = Math.max(0, Math.min(this.worldHeight - effectiveViewportHeight, this.position.y));
    }
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: (worldPos.x - this.position.x) * this.zoom,
      y: (worldPos.y - this.position.y) * this.zoom
    };
  }
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: (screenPos.x / this.zoom) + this.position.x,
      y: (screenPos.y / this.zoom) + this.position.y
    };
  }
  
  // Check if a world position is visible on screen
  isVisible(worldPos: Vector2, radius: number = 0): boolean {
    const screenPos = this.worldToScreen(worldPos);
    const scaledRadius = radius * this.zoom;
    return screenPos.x + scaledRadius >= 0 && 
           screenPos.x - scaledRadius <= this.viewportWidth &&
           screenPos.y + scaledRadius >= 0 && 
           screenPos.y - scaledRadius <= this.viewportHeight;
  }
  
  getPosition(): Vector2 {
    return { ...this.position };
  }
  
  setPosition(position: Vector2): void {
    this.position = { ...position };
  }
  
  // Get the visible world bounds
  getVisibleBounds(): { min: Vector2; max: Vector2 } {
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;
    
    return {
      min: { ...this.position },
      max: {
        x: this.position.x + effectiveViewportWidth,
        y: this.position.y + effectiveViewportHeight
      }
    };
  }
  
  // Zoom control methods
  setZoom(zoom: number): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }
  
  getZoom(): number {
    return this.zoom;
  }
  
  getTargetZoom(): number {
    return this.targetZoom;
  }
  
  zoomIn(factor?: number): void {
    const zoomFactor = factor ?? this.zoomSpeed;
    this.setZoom(this.targetZoom + zoomFactor);
  }
  
  zoomOut(factor?: number): void {
    const zoomFactor = factor ?? this.zoomSpeed;
    this.setZoom(this.targetZoom - zoomFactor);
  }
  
  // Zoom to specific level with optional center point
  zoomTo(zoom: number, centerPoint?: Vector2): void {
    if (centerPoint) {
      // Calculate new position to keep the center point centered
      const oldEffectiveWidth = this.viewportWidth / this.zoom;
      const oldEffectiveHeight = this.viewportHeight / this.zoom;
      const newEffectiveWidth = this.viewportWidth / zoom;
      const newEffectiveHeight = this.viewportHeight / zoom;
      
      // Adjust position to keep center point centered
      const deltaX = (oldEffectiveWidth - newEffectiveWidth) / 2;
      const deltaY = (oldEffectiveHeight - newEffectiveHeight) / 2;
      
      this.position.x += deltaX;
      this.position.y += deltaY;
    }
    
    this.setZoom(zoom);
  }
  
  // Zoom to fit the entire world in view
  zoomToFit(): void {
    const zoomX = this.viewportWidth / this.worldWidth;
    const zoomY = this.viewportHeight / this.worldHeight;
    const fitZoom = Math.min(zoomX, zoomY);
    
    this.setZoom(Math.max(this.minZoom, Math.min(this.maxZoom, fitZoom)));
    
    // Center the world
    const effectiveViewportWidth = this.viewportWidth / this.targetZoom;
    const effectiveViewportHeight = this.viewportHeight / this.targetZoom;
    
    this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
    this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
    
    // Disable following temporarily
    this.followTarget = false;
  }
  
  // Camera movement control
  setFollowTarget(follow: boolean): void {
    this.followTarget = follow;
  }
  
  isFollowingTarget(): boolean {
    return this.followTarget;
  }
  
  // Pan the camera manually (when not following target)
  pan(deltaX: number, deltaY: number): void {
    if (!this.followTarget) {
      const effectiveViewportWidth = this.viewportWidth / this.zoom;
      const effectiveViewportHeight = this.viewportHeight / this.zoom;
      
      // Check if the entire world fits in the viewport
      const worldFitsHorizontally = this.worldWidth <= effectiveViewportWidth;
      const worldFitsVertically = this.worldHeight <= effectiveViewportHeight;
      
      // Only allow panning in dimensions where the world doesn't fit
      if (!worldFitsHorizontally) {
        this.position.x += deltaX / this.zoom;
        this.position.x = Math.max(0, Math.min(this.worldWidth - effectiveViewportWidth, this.position.x));
      }
      
      if (!worldFitsVertically) {
        this.position.y += deltaY / this.zoom;
        this.position.y = Math.max(0, Math.min(this.worldHeight - effectiveViewportHeight, this.position.y));
      }
    }
  }
  
  // Get zoom limits
  getZoomLimits(): { min: number; max: number } {
    return { min: this.minZoom, max: this.maxZoom };
  }
  
  // Set zoom limits
  setZoomLimits(min: number, max: number): void {
    this.minZoom = Math.max(0.1, min);
    this.maxZoom = Math.max(this.minZoom, max);
    
    // Clamp current zoom to new limits
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
  }
  
  // Get camera info for debugging/UI
  getCameraInfo(): {
    position: Vector2;
    zoom: number;
    targetZoom: number;
    followTarget: boolean;
    visibleBounds: { min: Vector2; max: Vector2 };
  } {
    return {
      position: this.getPosition(),
      zoom: this.zoom,
      targetZoom: this.targetZoom,
      followTarget: this.followTarget,
      visibleBounds: this.getVisibleBounds()
    };
  }
  
  // Update viewport dimensions (for window resizing)
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    
    // Recalculate bounds to ensure camera stays within world limits
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;
    
    // Check if the world fits in the viewport
    const worldFitsHorizontally = this.worldWidth <= effectiveViewportWidth;
    const worldFitsVertically = this.worldHeight <= effectiveViewportHeight;
    
    // Center the world if it fits
    if (worldFitsHorizontally) {
      this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
    } else {
      this.position.x = Math.max(0, Math.min(this.worldWidth - effectiveViewportWidth, this.position.x));
    }
    
    if (worldFitsVertically) {
      this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
    } else {
      this.position.y = Math.max(0, Math.min(this.worldHeight - effectiveViewportHeight, this.position.y));
    }
  }
}