// Camera.ts - Updated with better player following

import type { Vector2 } from "@/utils/Vector2";
import { CAMERA_CONFIG } from "../config/UIConfig";

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
  // INCREASED SMOOTHING for more responsive following
  private smoothing: number = 0.15; // Increased from whatever CAMERA_CONFIG.smoothing was

  // Zoom system properties
  private zoom: number = 1.0;
  private targetZoom: number = 1.0;
  private minZoom: number = 0.5; // Allow more zoom out
  private maxZoom: number = 3.0;
  private zoomSpeed: number = 0.15;
  private zoomSmoothing: number = 0.12;

  // Camera mode - START WITH FOLLOW ENABLED
  private followTarget: boolean = true;

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

    if (this.followTarget) {
      // SIMPLIFIED FOLLOWING - Always center on target when following
      const targetX = targetPosition.x - effectiveViewportWidth / 2;
      const targetY = targetPosition.y - effectiveViewportHeight / 2;

      // Smooth camera movement with higher smoothing for better responsiveness
      this.position.x += (targetX - this.position.x) * this.smoothing;
      this.position.y += (targetY - this.position.y) * this.smoothing;
    }

    // Clamp camera to world bounds
    this.position.x = Math.max(
      0,
      Math.min(this.worldWidth - effectiveViewportWidth, this.position.x)
    );
    this.position.y = Math.max(
      0,
      Math.min(this.worldHeight - effectiveViewportHeight, this.position.y)
    );
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
        y: this.position.y + effectiveViewportHeight,
      },
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

    // DON'T disable following when zooming to fit
    // this.followTarget = false; // REMOVED
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

      this.position.x += deltaX / this.zoom;
      this.position.y += deltaY / this.zoom;

      // Clamp to bounds
      this.position.x = Math.max(
        0,
        Math.min(this.worldWidth - effectiveViewportWidth, this.position.x)
      );
      this.position.y = Math.max(
        0,
        Math.min(this.worldHeight - effectiveViewportHeight, this.position.y)
      );
    }
  }

  // Instantly center on target without smoothing
  centerOnTarget(targetPosition: Vector2): void {
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;

    // Center directly on target without offset
    const targetX = targetPosition.x - effectiveViewportWidth / 2;
    const targetY = targetPosition.y - effectiveViewportHeight / 2;

    // Set position directly without smoothing
    this.position.x = targetX;
    this.position.y = targetY;

    // Clamp to world bounds
    this.position.x = Math.max(
      0,
      Math.min(this.worldWidth - effectiveViewportWidth, this.position.x)
    );
    this.position.y = Math.max(
      0,
      Math.min(this.worldHeight - effectiveViewportHeight, this.position.y)
    );

    // ENSURE follow is enabled after centering
    this.followTarget = true;
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
    this.targetZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.targetZoom)
    );
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
      visibleBounds: this.getVisibleBounds(),
    };
  }

  // Update viewport dimensions (for window resizing)
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Recalculate bounds to ensure camera stays within world limits
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;

    // Clamp position to world bounds
    this.position.x = Math.max(
      0,
      Math.min(this.worldWidth - effectiveViewportWidth, this.position.x)
    );
    this.position.y = Math.max(
      0,
      Math.min(this.worldHeight - effectiveViewportHeight, this.position.y)
    );
  }

  // Force enable following and center on position
  enableFollowingAndCenter(targetPosition: Vector2): void {
    this.followTarget = true;
    this.centerOnTarget(targetPosition);
  }

  // Reset camera to default state
  reset(): void {
    // Reset zoom to default
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    
    // Enable following
    this.followTarget = true;
    
    // Center camera on middle of the world initially
    const effectiveViewportWidth = this.viewportWidth / this.zoom;
    const effectiveViewportHeight = this.viewportHeight / this.zoom;
    
    this.position.x = (this.worldWidth - effectiveViewportWidth) / 2;
    this.position.y = (this.worldHeight - effectiveViewportHeight) / 2;
  }
}
