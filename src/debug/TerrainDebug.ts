// Terrain debugging utilities

export class TerrainDebug {
  private static enabled = false;
  private static lastLogTime = 0;
  private static LOG_INTERVAL = 1000; // Log every 1 second

  static enable() {
    this.enabled = true;
    console.log('[TerrainDebug] Terrain debugging enabled');
  }

  static disable() {
    this.enabled = false;
  }

  static logMovement(entityId: string, position: { x: number, y: number }, baseSpeed: number, adjustedSpeed: number, terrainType: string) {
    if (!this.enabled) return;
    
    const now = Date.now();
    if (now - this.lastLogTime < this.LOG_INTERVAL) return;
    
    const speedRatio = adjustedSpeed / baseSpeed;
    if (speedRatio !== 1.0) {
      console.log(`[TerrainDebug] ${entityId} at (${Math.round(position.x)}, ${Math.round(position.y)}) on ${terrainType}: speed ${Math.round(speedRatio * 100)}% (${adjustedSpeed}/${baseSpeed})`);
      this.lastLogTime = now;
    }
  }

  static logTerrainAt(grid: any, worldX: number, worldY: number) {
    if (!this.enabled) return;
    
    const gridPos = grid.worldToGrid({ x: worldX, y: worldY });
    const cellType = grid.getCellType(gridPos.x, gridPos.y);
    const speedMultiplier = grid.getMovementSpeed(gridPos.x, gridPos.y);
    
    console.log(`[TerrainDebug] Grid(${gridPos.x}, ${gridPos.y}) = ${cellType}, speed multiplier: ${speedMultiplier}`);
  }
}

// Export to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).TerrainDebug = TerrainDebug;
}