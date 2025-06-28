import type { Vector2 } from '@/utils/Vector2';


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
    enemies: Enemy[],
    camera: any
  ) {
    if (!this.enabled) return;

    ctx.save();

    // Render enemy paths
    if (this.showPaths) {
      this.renderEnemyPaths(ctx, enemies, camera);
    }

    ctx.restore();
  }
  
  static isEnabled(): boolean {
    return this.enabled;
  }
  
  static getDebugState() {
    return {
      enabled: this.enabled,
      showPaths: this.showPaths,
      showNavGrid: this.showNavGrid,
      showCosts: this.showCosts
    };
  }

  



  /**
   * Render enemy paths
   */
  private static renderEnemyPaths(ctx: CanvasRenderingContext2D, enemies: Enemy[], camera: any) {
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    
    let pathsRendered = 0;

    enemies.forEach((enemy) => {
      if (!enemy.isAlive) return;

      // Access the enemy's current path through the debug getter
      const path = enemy.debugPath;
      if (!path || path.length < 2) return;
      
      pathsRendered++;

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
  
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).PathfindingDebug = PathfindingDebug;
}