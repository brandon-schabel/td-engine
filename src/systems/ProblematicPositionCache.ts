import type { Vector2 } from '@/utils/Vector2';

/**
 * Shared cache for tracking positions where enemies frequently get stuck
 * This helps avoid repeatedly trying to path to problematic areas
 */
export class ProblematicPositionCache {
  private static instance: ProblematicPositionCache;
  private badPositions: Map<string, number> = new Map(); // position key -> timestamp
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly POSITION_THRESHOLD = 20; // Consider positions within 20 units as "same"
  
  static getInstance(): ProblematicPositionCache {
    if (!ProblematicPositionCache.instance) {
      ProblematicPositionCache.instance = new ProblematicPositionCache();
    }
    return ProblematicPositionCache.instance;
  }
  
  addBadPosition(position: Vector2): void {
    const key = this.getPositionKey(position);
    this.badPositions.set(key, Date.now());
    
    // Clean up old entries
    this.cleanupOldEntries();
  }
  
  isPositionBad(position: Vector2): boolean {
    this.cleanupOldEntries();
    
    // Check if this exact position is bad
    const key = this.getPositionKey(position);
    if (this.badPositions.has(key)) {
      return true;
    }
    
    // Check nearby positions
    for (const [badKey, _] of this.badPositions) {
      const [x, y] = badKey.split(',').map(Number);
      const distance = Math.sqrt(
        Math.pow(position.x - x, 2) + 
        Math.pow(position.y - y, 2)
      );
      if (distance < this.POSITION_THRESHOLD) {
        return true;
      }
    }
    
    return false;
  }
  
  private getPositionKey(position: Vector2): string {
    // Round to nearest 10 units to group nearby positions
    const x = Math.round(position.x / 10) * 10;
    const y = Math.round(position.y / 10) * 10;
    return `${x},${y}`;
  }
  
  private cleanupOldEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    for (const [key, timestamp] of this.badPositions) {
      if (now - timestamp > this.CACHE_DURATION) {
        entriesToDelete.push(key);
      }
    }
    
    entriesToDelete.forEach(key => this.badPositions.delete(key));
  }
  
  // Get stats for debugging
  getStats(): { count: number, positions: string[] } {
    this.cleanupOldEntries();
    return {
      count: this.badPositions.size,
      positions: Array.from(this.badPositions.keys())
    };
  }
  
  // Clear all cached positions (useful for level transitions)
  clear(): void {
    this.badPositions.clear();
  }
}