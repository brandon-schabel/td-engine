import type { Vector2 } from '../utils/Vector2';

export class Camera {
  private position: Vector2 = { x: 0, y: 0 };
  private viewportWidth: number;
  private viewportHeight: number;
  private worldWidth: number;
  private worldHeight: number;
  private smoothing: number = 0.25; // Camera smoothing factor (increased for more responsive following)
  
  constructor(viewportWidth: number, viewportHeight: number, worldWidth: number, worldHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }
  
  update(targetPosition: Vector2): void {
    // Calculate desired camera position (centered on target)
    const targetX = targetPosition.x - this.viewportWidth / 2;
    const targetY = targetPosition.y - this.viewportHeight / 2;
    
    // Smooth camera movement
    this.position.x += (targetX - this.position.x) * this.smoothing;
    this.position.y += (targetY - this.position.y) * this.smoothing;
    
    // Clamp camera to world bounds
    this.position.x = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, this.position.x));
    this.position.y = Math.max(0, Math.min(this.worldHeight - this.viewportHeight, this.position.y));
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: worldPos.x - this.position.x,
      y: worldPos.y - this.position.y
    };
  }
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x + this.position.x,
      y: screenPos.y + this.position.y
    };
  }
  
  // Check if a world position is visible on screen
  isVisible(worldPos: Vector2, radius: number = 0): boolean {
    const screenPos = this.worldToScreen(worldPos);
    return screenPos.x + radius >= 0 && 
           screenPos.x - radius <= this.viewportWidth &&
           screenPos.y + radius >= 0 && 
           screenPos.y - radius <= this.viewportHeight;
  }
  
  getPosition(): Vector2 {
    return { ...this.position };
  }
  
  setPosition(position: Vector2): void {
    this.position = { ...position };
  }
  
  // Get the visible world bounds
  getVisibleBounds(): { min: Vector2; max: Vector2 } {
    return {
      min: { ...this.position },
      max: {
        x: this.position.x + this.viewportWidth,
        y: this.position.y + this.viewportHeight
      }
    };
  }
}