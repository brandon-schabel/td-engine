import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from './Grid';
import { CellType } from './Grid';
import { MovementType } from './MovementSystem';
import { Pathfinding } from './Pathfinding';

export interface NavigationCell {
  walkable: boolean;
  flyable: boolean;
  swimmable: boolean;
  cost: number;
  distanceToNearestObstacle: number;
}

export class NavigationGrid {
  private navigationCells: NavigationCell[][];
  private width: number;
  private height: number;
  private grid: Grid;
  private isDirty: boolean = true;

  // Configurable parameters
  private readonly obstacleBuffer: number = 0.5; // Grid cells
  private readonly dynamicObstacles: Set<string> = new Set(); // Track towers

  constructor(grid: Grid) {
    this.grid = grid;
    this.width = grid.width;
    this.height = grid.height;
    
    // Initialize navigation cells
    this.navigationCells = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(null).map(() => ({
        walkable: true,
        flyable: true,
        swimmable: true,
        cost: 1.0,
        distanceToNearestObstacle: Infinity
      }))
    );
    
    this.rebuild();
  }

  /**
   * Rebuild the navigation grid from the underlying grid
   */
  rebuild(): void {
    // Reset all cells
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cellType = this.grid.getCellType(x, y);
        const navCell = this.navigationCells[y][x];
        
        // Set walkability based on cell type
        switch (cellType) {
          case CellType.WATER:
            navCell.walkable = false;
            navCell.flyable = true;
            navCell.swimmable = true;
            navCell.cost = 1.0;
            break;
            
          case CellType.OBSTACLE:
          case CellType.BLOCKED:
          case CellType.BORDER:
            navCell.walkable = false;
            navCell.flyable = false;
            navCell.swimmable = false;
            navCell.cost = Infinity;
            break;
            
          case CellType.ROUGH_TERRAIN:
            navCell.walkable = true;
            navCell.flyable = true;
            navCell.swimmable = false;
            navCell.cost = 2.0; // Higher cost for rough terrain
            break;
            
          case CellType.BRIDGE:
            navCell.walkable = true;
            navCell.flyable = true;
            navCell.swimmable = true;
            navCell.cost = 1.0;
            break;
            
          default: // EMPTY, PATH, SPAWN_ZONE, DECORATIVE
            navCell.walkable = true;
            navCell.flyable = true;
            navCell.swimmable = false;
            navCell.cost = 1.0;
            break;
        }
      }
    }
    
    // Calculate distance to nearest obstacle
    this.calculateObstacleDistances();
    
    // Apply obstacle buffers
    this.applyObstacleBuffers();
    
    this.isDirty = false;
  }

  /**
   * Calculate distance to nearest obstacle for each cell
   */
  private calculateObstacleDistances(): void {
    // Use a simple flood fill algorithm
    const queue: Array<{x: number, y: number, distance: number}> = [];
    
    // Find all obstacle cells and add them to the queue
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cellType = this.grid.getCellType(x, y);
        if (cellType === CellType.OBSTACLE || cellType === CellType.BLOCKED || 
            cellType === CellType.BORDER || cellType === CellType.WATER) {
          queue.push({ x, y, distance: 0 });
          this.navigationCells[y][x].distanceToNearestObstacle = 0;
        } else {
          this.navigationCells[y][x].distanceToNearestObstacle = Infinity;
        }
      }
    }
    
    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 }
      ];
      
      for (const neighbor of neighbors) {
        if (this.isInBounds(neighbor.x, neighbor.y)) {
          const newDistance = current.distance + 1;
          if (newDistance < this.navigationCells[neighbor.y][neighbor.x].distanceToNearestObstacle) {
            this.navigationCells[neighbor.y][neighbor.x].distanceToNearestObstacle = newDistance;
            queue.push({ x: neighbor.x, y: neighbor.y, distance: newDistance });
          }
        }
      }
    }
  }

  /**
   * Apply obstacle buffers to prevent enemies from getting too close to walls
   */
  private applyObstacleBuffers(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const navCell = this.navigationCells[y][x];
        
        // If too close to obstacle, increase movement cost
        if (navCell.distanceToNearestObstacle < this.obstacleBuffer) {
          navCell.cost *= 2.0; // Double the cost near obstacles
          
          // Completely block if touching obstacle
          if (navCell.distanceToNearestObstacle === 0) {
            navCell.walkable = false;
          }
        }
      }
    }
  }

  /**
   * Add a dynamic obstacle (like a tower)
   */
  addDynamicObstacle(worldPos: Vector2, radius: number): void {
    const gridPos = this.grid.worldToGrid(worldPos);
    const key = `${gridPos.x},${gridPos.y}`;
    
    if (!this.dynamicObstacles.has(key)) {
      this.dynamicObstacles.add(key);
      
      // Update navigation cells around the obstacle
      const gridRadius = Math.ceil(radius / this.grid.cellSize);
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
          const x = gridPos.x + dx;
          const y = gridPos.y + dy;
          
          if (this.isInBounds(x, y)) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= gridRadius) {
              this.navigationCells[y][x].walkable = false;
              this.navigationCells[y][x].cost = Infinity;
            }
          }
        }
      }
      
      // Invalidate pathfinding cache for this position
      Pathfinding.invalidateCacheForPosition(gridPos.x, gridPos.y);
      this.isDirty = true;
    }
  }

  /**
   * Remove a dynamic obstacle
   */
  removeDynamicObstacle(worldPos: Vector2): void {
    const gridPos = this.grid.worldToGrid(worldPos);
    const key = `${gridPos.x},${gridPos.y}`;
    
    if (this.dynamicObstacles.delete(key)) {
      // Mark for rebuild
      this.isDirty = true;
      Pathfinding.invalidateCacheForPosition(gridPos.x, gridPos.y);
    }
  }

  /**
   * Check if a position is walkable for a specific movement type
   */
  isWalkable(gridX: number, gridY: number, movementType: MovementType): boolean {
    if (!this.isInBounds(gridX, gridY)) return false;
    
    const navCell = this.navigationCells[gridY][gridX];
    
    switch (movementType) {
      case MovementType.WALKING:
        return navCell.walkable;
      case MovementType.FLYING:
        return navCell.flyable;
      case MovementType.SWIMMING:
        return navCell.swimmable;
      case MovementType.AMPHIBIOUS:
        return navCell.walkable || navCell.swimmable;
      default:
        return navCell.walkable;
    }
  }

  /**
   * Get movement cost for a position
   */
  getMovementCost(gridX: number, gridY: number): number {
    if (!this.isInBounds(gridX, gridY)) return Infinity;
    return this.navigationCells[gridY][gridX].cost;
  }

  /**
   * Get distance to nearest obstacle
   */
  getDistanceToObstacle(gridX: number, gridY: number): number {
    if (!this.isInBounds(gridX, gridY)) return 0;
    return this.navigationCells[gridY][gridX].distanceToNearestObstacle;
  }

  /**
   * Check if a world position has enough clearance for an entity
   */
  hasEnoughClearance(worldPos: Vector2, entityRadius: number): boolean {
    const gridPos = this.grid.worldToGrid(worldPos);
    const gridRadius = Math.ceil(entityRadius / this.grid.cellSize);
    
    // Check if all cells within entity radius are walkable
    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const x = gridPos.x + dx;
        const y = gridPos.y + dy;
        
        if (!this.isInBounds(x, y) || !this.navigationCells[y][x].walkable) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get a safe position near the target that has enough clearance
   */
  getNearestSafePosition(targetPos: Vector2, entityRadius: number, movementType: MovementType): Vector2 | null {
    const gridPos = this.grid.worldToGrid(targetPos);
    
    // If target is already safe, return it
    if (this.hasEnoughClearance(targetPos, entityRadius)) {
      return targetPos;
    }
    
    // Search in expanding circles
    const maxRadius = 10;
    for (let radius = 1; radius <= maxRadius; radius++) {
      const positions: Vector2[] = [];
      
      // Check all positions at this radius
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / (4 * radius)) {
        const x = gridPos.x + Math.round(Math.cos(angle) * radius);
        const y = gridPos.y + Math.round(Math.sin(angle) * radius);
        
        if (this.isInBounds(x, y) && this.isWalkable(x, y, movementType)) {
          const worldPos = this.grid.gridToWorld(x, y);
          if (this.hasEnoughClearance(worldPos, entityRadius)) {
            positions.push(worldPos);
          }
        }
      }
      
      // Return the closest safe position
      if (positions.length > 0) {
        return positions.reduce((closest, pos) => {
          const distToTarget = Math.hypot(pos.x - targetPos.x, pos.y - targetPos.y);
          const closestDist = Math.hypot(closest.x - targetPos.x, closest.y - targetPos.y);
          return distToTarget < closestDist ? pos : closest;
        });
      }
    }
    
    return null;
  }

  /**
   * Check if coordinates are in bounds
   */
  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if navigation grid needs rebuilding
   */
  needsRebuild(): boolean {
    return this.isDirty;
  }

  /**
   * Get debug info for a position
   */
  getDebugInfo(gridX: number, gridY: number): NavigationCell | null {
    if (!this.isInBounds(gridX, gridY)) return null;
    return this.navigationCells[gridY][gridX];
  }
}