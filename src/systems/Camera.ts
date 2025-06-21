// Camera.ts - Rewritten for perfect player centering
// Changes:
// 1. Complete rewrite with center-based positioning
// 2. Simplified math to ensure player stays at exact center
// 3. Mobile-responsive viewport handling
// 4. Better zoom system that maintains centering
// 5. Added debug mode for visualizing camera center

import type { Vector2 } from "@/utils/Vector2";

export interface CameraOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
  zoomSmoothing?: number;
  smoothing?: number;
}

export class Camera {
  // Camera position represents the top-left corner of the viewport in world space
  private position: Vector2 = { x: 0, y: 0 };
  
  // Viewport dimensions (canvas size)
  private viewportWidth: number;
  private viewportHeight: number;
  
  // World boundaries
  private worldWidth: number;
  private worldHeight: number;
  
  // Following settings
  private followTarget: boolean = true;
  private smoothing: number = 0.04;
  
  // Zoom system
  private zoom: number = 1.0;
  private targetZoom: number = 1.0;
  private minZoom: number = 0.5;
  private maxZoom: number = 3.0;
  private zoomSpeed: number = 0.15;
  private zoomSmoothing: number = 0.12;
  
  // Debug mode
  private debugMode: boolean = false;

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    worldWidth: number,
    worldHeight: number,
    options?: CameraOptions
  ) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Apply options
    if (options) {
      this.minZoom = options.minZoom ?? this.minZoom;
      this.maxZoom = options.maxZoom ?? this.maxZoom;
      this.zoomSpeed = options.zoomSpeed ?? this.zoomSpeed;
      this.zoomSmoothing = options.zoomSmoothing ?? this.zoomSmoothing;
      this.smoothing = options.smoothing ?? this.smoothing;
    }
  }

  update(targetPosition: Vector2): void {
    // Update zoom with smoothing
    this.zoom += (this.targetZoom - this.zoom) * this.zoomSmoothing;

    if (this.followTarget) {
      // Calculate where the camera should be to center the target
      const targetCameraX = targetPosition.x - (this.viewportWidth / 2) / this.zoom;
      const targetCameraY = targetPosition.y - (this.viewportHeight / 2) / this.zoom;

      // Apply smoothing to camera movement
      this.position.x += (targetCameraX - this.position.x) * this.smoothing;
      this.position.y += (targetCameraY - this.position.y) * this.smoothing;
    }

    // Clamp camera position to world bounds
    this.clampCameraPosition();
  }

  private clampCameraPosition(): void {
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;

    // Ensure camera doesn't go outside world bounds
    this.position.x = Math.max(0, Math.min(this.worldWidth - effectiveViewportWidth, this.position.x));
    this.position.y = Math.max(0, Math.min(this.worldHeight - effectiveViewportHeight, this.position.y));

    // If world is smaller than viewport, center it
    if (effectiveViewportWidth > this.worldWidth) {
      this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
    }
    if (effectiveViewportHeight > this.worldHeight) {
      this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
    }
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: (worldPos.x - this.position.x) * this.zoom,
      y: (worldPos.y - this.position.y) * this.zoom,
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x / this.zoom + this.position.x,
      y: screenPos.y / this.zoom + this.position.y,
    };
  }

  // Get the center of the viewport in world coordinates
  getViewportCenter(): Vector2 {
    return {
      x: this.position.x + (this.viewportWidth / 2) / this.zoom,
      y: this.position.y + (this.viewportHeight / 2) / this.zoom,
    };
  }

  // Check if a world position is visible on screen
  isVisible(worldPos: Vector2, radius: number = 0): boolean {
    const screenPos = this.worldToScreen(worldPos);
    const scaledRadius = radius * this.zoom;
    
    return (
      screenPos.x + scaledRadius >= 0 &&
      screenPos.x - scaledRadius <= this.viewportWidth &&
      screenPos.y + scaledRadius >= 0 &&
      screenPos.y - scaledRadius <= this.viewportHeight
    );
  }

  // Get camera position (top-left corner of viewport in world space)
  getPosition(): Vector2 {
    return { ...this.position };
  }

  // Set camera position directly
  setPosition(position: Vector2): void {
    this.position = { ...position };
    this.clampCameraPosition();
  }

  // Get the visible world bounds
  getVisibleBounds(): { min: Vector2; max: Vector2 } {
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;

    return {
      min: { ...this.position },
      max: {
        x: this.position.x + effectiveViewportWidth,
        y: this.position.y + effectiveViewportHeight,
      },
    };
  }

  // Zoom control methods
  setZoom(zoom: number): void {
    const previousCenter = this.getViewportCenter();
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    
    // Adjust position to maintain the same center point after zoom
    if (!this.followTarget) {
      const newZoom = this.targetZoom;
      this.position.x = previousCenter.x - (this.viewportWidth / 2) / newZoom;
      this.position.y = previousCenter.y - (this.viewportHeight / 2) / newZoom;
      this.clampCameraPosition();
    }
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

  // Zoom to fit the entire world in view
  zoomToFit(): void {
    const zoomX = this.viewportWidth / this.worldWidth;
    const zoomY = this.viewportHeight / this.worldHeight;
    const fitZoom = Math.min(zoomX, zoomY);

    this.setZoom(Math.max(this.minZoom, Math.min(this.maxZoom, fitZoom)));

    // Center the world in the viewport
    const effectiveViewportWidth = this.viewportWidth / this.targetZoom;
    const effectiveViewportHeight = this.viewportHeight / this.targetZoom;

    this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
    this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
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
      this.position.x += deltaX / this.zoom;
      this.position.y += deltaY / this.zoom;
      this.clampCameraPosition();
    }
  }

  // Instantly center on target without smoothing
  centerOnTarget(targetPosition: Vector2): void {
    // Calculate camera position to center the target
    this.position.x = targetPosition.x - (this.viewportWidth / 2) / this.zoom;
    this.position.y = targetPosition.y - (this.viewportHeight / 2) / this.zoom;
    
    // Clamp to world bounds
    this.clampCameraPosition();
    
    // Enable following
    this.followTarget = true;
  }

  // Force enable following and center on position
  enableFollowingAndCenter(targetPosition: Vector2): void {
    this.followTarget = true;
    this.centerOnTarget(targetPosition);
  }

  // Reset camera zoom to default
  reset(): void {
    this.setZoom(1.0);
  }

  // Get zoom limits
  getZoomLimits(): { min: number; max: number } {
    return { min: this.minZoom, max: this.maxZoom };
  }

  // Set zoom limits
  setZoomLimits(min: number, max: number): void {
    this.minZoom = Math.max(0.1, min);
    this.maxZoom = Math.max(this.minZoom, max);
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
  }

  // Update viewport dimensions (for window resizing)
  updateViewport(width: number, height: number): void {
    const previousCenter = this.getViewportCenter();
    
    this.viewportWidth = width;
    this.viewportHeight = height;
    
    // Maintain the same center point after resize
    if (!this.followTarget) {
      this.position.x = previousCenter.x - (this.viewportWidth / 2) / this.zoom;
      this.position.y = previousCenter.y - (this.viewportHeight / 2) / this.zoom;
    }
    
    this.clampCameraPosition();
  }

  // Get camera info for debugging/UI
  getCameraInfo(): {
    position: Vector2;
    center: Vector2;
    zoom: number;
    targetZoom: number;
    followTarget: boolean;
    visibleBounds: { min: Vector2; max: Vector2 };
    viewportSize: { width: number; height: number };
  } {
    return {
      position: this.getPosition(),
      center: this.getViewportCenter(),
      zoom: this.zoom,
      targetZoom: this.targetZoom,
      followTarget: this.followTarget,
      visibleBounds: this.getVisibleBounds(),
      viewportSize: { width: this.viewportWidth, height: this.viewportHeight },
    };
  }

  // Reset camera to default state
  reset(): void {
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.followTarget = true;
    
    // Center camera in the middle of the world
    this.position.x = (this.worldWidth - this.viewportWidth) / 2;
    this.position.y = (this.worldHeight - this.viewportHeight) / 2;
    this.clampCameraPosition();
  }

  // Enable/disable debug mode
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  // Debug rendering helper - draws camera info on screen
  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (!this.debugMode) return;

    // Draw crosshair at viewport center
    ctx.save();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY);
    ctx.lineTo(centerX + 20, centerY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX, centerY + 20);
    ctx.stroke();
    
    // Draw circle at center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw debug text
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px monospace';
    ctx.fillText(`Camera Center: (${Math.round(this.getViewportCenter().x)}, ${Math.round(this.getViewportCenter().y)})`, 10, 20);
    ctx.fillText(`Zoom: ${this.zoom.toFixed(2)}`, 10, 40);
    ctx.fillText(`Following: ${this.followTarget ? 'YES' : 'NO'}`, 10, 60);
    
    ctx.restore();
  }
}