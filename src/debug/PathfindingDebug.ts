import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import type { NavigationGrid } from '@/systems/NavigationGrid';
import type { Enemy } from '@/entities/Enemy';

export class PathfindingDebug {
  private static enabled = false;
  private static showNavGrid = false;
  private static showPaths = true;
  private static showCosts = false;

  static enable() {
    this.enabled = true;
    console.log('[PathfindingDebug] Debug visualization enabled');
  }

  static disable() {
    this.enabled = false;
  }

  static toggleNavGrid() {
    this.showNavGrid = !this.showNavGrid;
    console.log(`[PathfindingDebug] Navigation grid: ${this.showNavGrid ? 'ON' : 'OFF'}`);
  }

  static togglePaths() {
    this.showPaths = !this.showPaths;
    console.log(`[PathfindingDebug] Enemy paths: ${this.showPaths ? 'ON' : 'OFF'}`);
  }

  static toggleCosts() {
    this.showCosts = !this.showCosts;
    console.log(`[PathfindingDebug] Movement costs: ${this.showCosts ? 'ON' : 'OFF'}`);
  }

  /**
   * Render debug visualization
   */
  static render(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    navGrid: NavigationGrid,
    enemies: Enemy[],
    camera: any
  ) {
    if (!this.enabled) return;

    ctx.save();

    // Render navigation grid
    if (this.showNavGrid) {
      this.renderNavigationGrid(ctx, grid, navGrid, camera);
    }

    // Render enemy paths
    if (this.showPaths) {
      this.renderEnemyPaths(ctx, enemies, camera);
    }

    ctx.restore();
  }

  /**
   * Render navigation grid overlay
   */
  private static renderNavigationGrid(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    navGrid: NavigationGrid,
    camera: any
  ) {
    const cellSize = grid.cellSize;
    const visibleBounds = camera.getVisibleBounds();

    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(grid.height, Math.ceil(visibleBounds.max.y / cellSize));

    // Set transparency
    ctx.globalAlpha = 0.3;

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const worldPos = grid.gridToWorld(x, y);
        const screenPos = camera.worldToScreen(worldPos);
        const navInfo = navGrid.getDebugInfo(x, y);

        if (!navInfo) continue;

        // Color based on walkability
        if (!navInfo.walkable) {
          ctx.fillStyle = '#FF0000'; // Red for unwalkable
        } else if (navInfo.cost > 1.5) {
          ctx.fillStyle = '#FFA500'; // Orange for high cost
        } else if (navInfo.cost > 1.0) {
          ctx.fillStyle = '#FFFF00'; // Yellow for medium cost
        } else {
          ctx.fillStyle = '#00FF00'; // Green for walkable
        }

        ctx.fillRect(
          screenPos.x - cellSize / 2,
          screenPos.y - cellSize / 2,
          cellSize,
          cellSize
        );

        // Show distance to obstacle if enabled
        if (this.showCosts && navInfo.distanceToNearestObstacle < 3) {
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            navInfo.distanceToNearestObstacle.toFixed(0),
            screenPos.x,
            screenPos.y
          );
          ctx.globalAlpha = 0.3;
        }
      }
    }
  }

  /**
   * Render enemy paths
   */
  private static renderEnemyPaths(ctx: CanvasRenderingContext2D, enemies: Enemy[], camera: any) {
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;

    enemies.forEach((enemy) => {
      if (!enemy.isAlive) return;

      // Access the enemy's current path (if exposed)
      const path = (enemy as any).currentPath;
      if (!path || path.length < 2) return;

      // Draw path
      ctx.beginPath();
      
      // Start from enemy position
      const startScreen = camera.worldToScreen(enemy.position);
      ctx.moveTo(startScreen.x, startScreen.y);

      // Draw to each waypoint
      path.forEach((waypoint: Vector2) => {
        const screenPos = camera.worldToScreen(waypoint);
        ctx.lineTo(screenPos.x, screenPos.y);
      });

      ctx.stroke();

      // Draw waypoints as dots
      ctx.fillStyle = '#00FFFF';
      path.forEach((waypoint: Vector2, index: number) => {
        const screenPos = camera.worldToScreen(waypoint);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label first few waypoints
        if (index < 3) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(index.toString(), screenPos.x, screenPos.y - 5);
          ctx.fillStyle = '#00FFFF';
        }
      });
    });
  }

  /**
   * Get debug info as string
   */
  static getDebugInfo(navGrid: NavigationGrid, worldPos: Vector2, grid: Grid): string {
    if (!this.enabled) return '';

    const gridPos = grid.worldToGrid(worldPos);
    const navInfo = navGrid.getDebugInfo(gridPos.x, gridPos.y);

    if (!navInfo) return 'No navigation info';

    return `Grid(${gridPos.x},${gridPos.y}): ` +
           `Walk:${navInfo.walkable} ` +
           `Cost:${navInfo.cost.toFixed(1)} ` +
           `ObsDist:${navInfo.distanceToNearestObstacle.toFixed(1)}`;
  }
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).PathfindingDebug = PathfindingDebug;
}