import type { Camera } from '@/systems/Camera';
import type { Player } from '@/entities/Player';
import type { Enemy } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import { PathfindingDebug } from '@/debug/PathfindingDebug';

export interface DebugRenderConfig {
  showCrosshair: boolean;
  showCameraInfo: boolean;
  showPlayerInfo: boolean;
  showPerformance: boolean;
  showPathfinding: boolean;
  showEntityCount: boolean;
}

/**
 * Handles all debug rendering overlays and visualizations
 */
export class DebugRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private viewportWidth: number;
  private viewportHeight: number;
  private debugMode: boolean = false;
  private config: DebugRenderConfig = {
    showCrosshair: true,
    showCameraInfo: true,
    showPlayerInfo: true,
    showPerformance: false,
    showPathfinding: true,
    showEntityCount: false
  };

  constructor(ctx: CanvasRenderingContext2D, camera: Camera, viewportWidth: number, viewportHeight: number) {
    this.ctx = ctx;
    this.camera = camera;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get current debug mode status
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Update debug configuration
   */
  updateConfig(config: Partial<DebugRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update viewport dimensions
   */
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Render pathfinding debug visualization
   */
  renderPathfindingDebug(enemies: Enemy[]): void {
    if (!this.debugMode || !this.config.showPathfinding) return;
    
    PathfindingDebug.render(this.ctx, enemies, this.camera);
  }

  /**
   * Render complete debug overlay
   */
  renderDebugOverlay(player: Player | null, entityCounts?: {
    enemies: number;
    towers: number;
    projectiles: number;
    collectibles: number;
  }): void {
    if (!this.debugMode || !player) return;

    // Render crosshair
    if (this.config.showCrosshair) {
      this.renderCrosshair();
    }

    // Render player tracking line
    if (this.config.showPlayerInfo) {
      this.renderPlayerTracking(player);
    }

    // Render debug text
    this.renderDebugText(player, entityCounts);
  }

  /**
   * Render crosshair at screen center
   */
  private renderCrosshair(): void {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;

    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 20, centerY);
    this.ctx.lineTo(centerX + 20, centerY);
    this.ctx.stroke();

    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 20);
    this.ctx.lineTo(centerX, centerY + 20);
    this.ctx.stroke();

    // Draw circle at center
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Render player tracking visualization
   */
  private renderPlayerTracking(player: Player): void {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    const playerScreenPos = this.camera.worldToScreen(player.position);

    // Draw line from center to player
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(playerScreenPos.x, playerScreenPos.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw player marker
    this.ctx.strokeStyle = '#FFFF00';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(playerScreenPos.x, playerScreenPos.y, 15, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Render debug text information
   */
  private renderDebugText(player: Player, entityCounts?: {
    enemies: number;
    towers: number;
    projectiles: number;
    collectibles: number;
  }): void {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    const cameraInfo = this.camera.getCameraInfo();
    const playerScreenPos = this.camera.worldToScreen(player.position);

    const debugText: string[] = [];

    // Camera info
    if (this.config.showCameraInfo) {
      debugText.push(
        `Camera Following: ${cameraInfo.followTarget ? 'YES' : 'NO'}`,
        `Camera Pos: (${cameraInfo.position.x.toFixed(0)}, ${cameraInfo.position.y.toFixed(0)})`,
        `Zoom: ${cameraInfo.zoom.toFixed(2)}`
      );
    }

    // Player info
    if (this.config.showPlayerInfo) {
      debugText.push(
        `Player World: (${player.position.x.toFixed(0)}, ${player.position.y.toFixed(0)})`,
        `Player Screen: (${playerScreenPos.x.toFixed(0)}, ${playerScreenPos.y.toFixed(0)})`,
        `Distance from Center: ${Math.sqrt(Math.pow(playerScreenPos.x - centerX, 2) + Math.pow(playerScreenPos.y - centerY, 2)).toFixed(1)}px`,
        `Player Moving: ${player.isMoving() ? 'YES' : 'NO'}`,
        `Player Health: ${player.health}/${player.maxHealth}`,
        `Player Level: ${player.level}`
      );
    }

    // Entity counts
    if (this.config.showEntityCount && entityCounts) {
      debugText.push(
        `Enemies: ${entityCounts.enemies}`,
        `Towers: ${entityCounts.towers}`,
        `Projectiles: ${entityCounts.projectiles}`,
        `Collectibles: ${entityCounts.collectibles}`
      );
    }

    // Performance info (placeholder for future implementation)
    if (this.config.showPerformance) {
      debugText.push(
        `FPS: 60`, // TODO: Implement actual FPS tracking
        `Frame Time: 16.67ms` // TODO: Implement actual frame time tracking
      );
    }

    // Background for text
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 100, 300, debugText.length * 20 + 20);

    // Debug text
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '14px monospace';
    debugText.forEach((text, i) => {
      this.ctx.fillText(text, 20, 120 + i * 20);
    });
  }

  /**
   * Render grid overlay for debugging placement
   */
  renderGridOverlay(gridSize: number, offset: Vector2 = { x: 0, y: 0 }): void {
    if (!this.debugMode) return;

    const visibleBounds = this.camera.getVisibleBounds();
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = Math.floor(visibleBounds.min.x / gridSize) * gridSize; x <= visibleBounds.max.x; x += gridSize) {
      const screenX = this.camera.worldToScreen({ x: x + offset.x, y: 0 }).x;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.viewportHeight);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = Math.floor(visibleBounds.min.y / gridSize) * gridSize; y <= visibleBounds.max.y; y += gridSize) {
      const screenY = this.camera.worldToScreen({ x: 0, y: y + offset.y }).y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.viewportWidth, screenY);
      this.ctx.stroke();
    }
  }

  /**
   * Render entity bounds for debugging collision detection
   */
  renderEntityBounds(position: Vector2, radius: number, color: string = '#FF00FF'): void {
    if (!this.debugMode) return;

    const screenPos = this.camera.worldToScreen(position);
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, radius * this.camera.getZoom(), 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Render a debug line between two world positions
   */
  renderDebugLine(start: Vector2, end: Vector2, color: string = '#00FFFF', dashed: boolean = false): void {
    if (!this.debugMode) return;

    const screenStart = this.camera.worldToScreen(start);
    const screenEnd = this.camera.worldToScreen(end);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    
    if (dashed) {
      this.ctx.setLineDash([5, 5]);
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(screenStart.x, screenStart.y);
    this.ctx.lineTo(screenEnd.x, screenEnd.y);
    this.ctx.stroke();
    
    if (dashed) {
      this.ctx.setLineDash([]);
    }
  }

  /**
   * Render debug text at a world position
   */
  renderDebugTextAt(text: string, position: Vector2, color: string = '#FFFFFF', backgroundColor?: string): void {
    if (!this.debugMode) return;

    const screenPos = this.camera.worldToScreen(position);
    
    this.ctx.font = '12px monospace';
    const textMetrics = this.ctx.measureText(text);
    
    // Draw background if specified
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(
        screenPos.x - 2,
        screenPos.y - 12,
        textMetrics.width + 4,
        16
      );
    }
    
    // Draw text
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, screenPos.x, screenPos.y);
  }
}