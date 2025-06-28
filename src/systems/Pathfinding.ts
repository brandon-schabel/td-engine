import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from './Grid';
import { CellType } from './Grid';
import { MovementSystem, MovementType } from './MovementSystem';

export interface PathNode {
  position: Vector2;
  gridX: number;
  gridY: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

export interface PathfindingOptions {
  maxIterations?: number;
  allowDiagonal?: boolean;
  smoothPath?: boolean;
  movementType?: MovementType;
}

export interface PathfindingResult {
  path: Vector2[];
  success: boolean;
  iterations: number;
  cost: number;
}

export interface SpawnPointValidationResult {
  isValid: boolean;
  spawnPoint: Vector2;
  targetPosition: Vector2;
  path?: Vector2[];
  pathCost?: number;
  issue?: string;
  distance?: number;
}

export interface MapConnectivityValidation {
  allSpawnPointsValid: boolean;
  validSpawnPoints: Vector2[];
  invalidSpawnPoints: Vector2[];
  spawnValidations: SpawnPointValidationResult[];
  warnings: string[];
  errors: string[];
}

export class Pathfinding {
  private static readonly DEFAULT_OPTIONS: Required<PathfindingOptions> = {
    maxIterations: 1000,
    allowDiagonal: true,
    smoothPath: true,
    movementType: MovementType.WALKING
  };

  // Path cache for performance
  private static pathCache = new Map<string, PathfindingResult>();
  private static readonly CACHE_SIZE = 50;

  /**
   * Find a path from start to goal using A* algorithm
   */
  static findPath(
    start: Vector2,
    goal: Vector2,
    grid: Grid,
    options: PathfindingOptions = {}
  ): PathfindingResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    const startGrid = grid.worldToGrid(start);
    const goalGrid = grid.worldToGrid(goal);

    if (!grid.isInBounds(startGrid.x, startGrid.y) || !grid.isInBounds(goalGrid.x, goalGrid.y)) {
      return { path: [], success: false, iterations: 0, cost: 0 };
    }

    const cacheKey = `${startGrid.x},${startGrid.y}-${goalGrid.x},${goalGrid.y}-${opts.movementType}`;
    const cached = this.pathCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.isWalkableForMovementType(goalGrid.x, goalGrid.y, grid, opts.movementType)) {
      return { path: [], success: false, iterations: 0, cost: 0 };
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, PathNode>();

    const startH = this.heuristic(start, goal);
    const startNode: PathNode = {
      position: start,
      gridX: startGrid.x,
      gridY: startGrid.y,
      g: 0,
      h: startH,
      f: startH,
      parent: null
    };

    openSet.push(startNode);
    nodeMap.set(`${startGrid.x},${startGrid.y}`, startNode);

    let iterations = 0;
    let currentNode: PathNode | null = null;

    while (openSet.length > 0 && iterations < opts.maxIterations) {
      iterations++;

      currentNode = this.getLowestFNode(openSet);

      if (currentNode.gridX === goalGrid.x && currentNode.gridY === goalGrid.y) {
        break;
      }

      const currentIndex = openSet.indexOf(currentNode);
      openSet.splice(currentIndex, 1);
      closedSet.add(`${currentNode.gridX},${currentNode.gridY}`);

      const neighbors = this.getNeighbors(currentNode, grid, opts);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.gridX},${neighbor.gridY}`;

        if (closedSet.has(neighborKey)) continue;

        if (!this.isWalkableForMovementType(neighbor.gridX, neighbor.gridY, grid, opts.movementType)) continue;

        const movementCost = MovementSystem.getMovementCost(
          currentNode.position,
          grid.gridToWorld(neighbor.gridX, neighbor.gridY),
          grid,
          opts.movementType
        );
        const tentativeG = currentNode.g + movementCost;

        let neighborNode = nodeMap.get(neighborKey);
        if (!neighborNode) {
          neighborNode = {
            position: grid.gridToWorld(neighbor.gridX, neighbor.gridY),
            gridX: neighbor.gridX,
            gridY: neighbor.gridY,
            g: Infinity,
            h: this.heuristic(grid.gridToWorld(neighbor.gridX, neighbor.gridY), goal),
            f: Infinity,
            parent: null
          };
          nodeMap.set(neighborKey, neighborNode);
        }

        if (tentativeG < neighborNode.g) {
          neighborNode.parent = currentNode;
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;

          if (!openSet.includes(neighborNode)) {
            openSet.push(neighborNode);
          }
        }
      }
    }

    let path: Vector2[] = [];
    let totalCost = 0;

    if (currentNode && currentNode.gridX === goalGrid.x && currentNode.gridY === goalGrid.y) {
      path = this.reconstructPath(currentNode);
      totalCost = currentNode.g;

      if (opts.smoothPath && path.length > 2) {
        path = this.smoothPath(path, grid, opts);
      }
    }

    const result: PathfindingResult = {
      path,
      success: path.length > 0,
      iterations,
      cost: totalCost
    };

    this.cacheResult(cacheKey, result);

    return result;
  }

  /**
   * Check if a position is walkable for the given movement type
   */
  private static isWalkableForMovementType(x: number, y: number, grid: Grid, movementType: MovementType): boolean {
    const cellType = grid.getCellType(x, y);
    return MovementSystem.canMoveOnTerrain(movementType, cellType);
  }

  /**
   * Check if a position is valid (walkable and respects obstacle distance)
   */
  

  /**
   * Get valid neighbors for a node
   */
  private static getNeighbors(node: PathNode, grid: Grid, opts: Required<PathfindingOptions>): Array<{gridX: number, gridY: number}> {
    const neighbors: Array<{gridX: number, gridY: number}> = [];
    
    // Cardinal directions
    const cardinalDirs = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }  // Left
    ];
    
    // Diagonal directions
    const diagonalDirs = [
      { dx: -1, dy: -1 }, // Up-Left
      { dx: 1, dy: -1 },  // Up-Right
      { dx: 1, dy: 1 },   // Down-Right
      { dx: -1, dy: 1 }   // Down-Left
    ];
    
    // Add cardinal neighbors
    for (const dir of cardinalDirs) {
      const x = node.gridX + dir.dx;
      const y = node.gridY + dir.dy;
      if (grid.isInBounds(x, y)) {
        neighbors.push({ gridX: x, gridY: y });
      }
    }
    
    // Add diagonal neighbors if allowed
    if (opts.allowDiagonal) {
      for (const dir of diagonalDirs) {
        const x = node.gridX + dir.dx;
        const y = node.gridY + dir.dy;
        
        // Check if diagonal movement is possible
        if (grid.isInBounds(x, y)) {
          const targetWalkable = this.isWalkableForMovementType(x, y, grid, opts.movementType);
          
          if (targetWalkable) {
            // Check for corner cutting - but be more lenient with bridges
            const xCardinal = grid.isInBounds(node.gridX + dir.dx, node.gridY);
            const yCardinal = grid.isInBounds(node.gridX, node.gridY + dir.dy);
            
            if (xCardinal && yCardinal) {
              const xCell = grid.getCellType(node.gridX + dir.dx, node.gridY);
              const yCell = grid.getCellType(node.gridX, node.gridY + dir.dy);
              const targetCell = grid.getCellType(x, y);
              
              // Allow diagonal movement if:
              // 1. Both cardinal cells are walkable, OR
              // 2. Target is a bridge (bridges connect water/land), OR
              // 3. One cardinal is a bridge
              const xWalkable = this.isWalkableForMovementType(node.gridX + dir.dx, node.gridY, grid, opts.movementType);
              const yWalkable = this.isWalkableForMovementType(node.gridX, node.gridY + dir.dy, grid, opts.movementType);
              
              if ((xWalkable && yWalkable) || 
                  targetCell === CellType.BRIDGE ||
                  xCell === CellType.BRIDGE || 
                  yCell === CellType.BRIDGE) {
                neighbors.push({ gridX: x, gridY: y });
              }
            }
          }
        }
      }
    }
    
    return neighbors;
  }

  /**
   * Calculate movement cost between two nodes
   */
  
  
  /**
   * Calculate penalty for being near obstacles
   */
  

  /**
   * Heuristic function for A* (Euclidean distance)
   */
  private static heuristic(a: Vector2, b: Vector2): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the node with the lowest f score from the open set
   */
  private static getLowestFNode(openSet: PathNode[]): PathNode {
    let lowest = openSet[0];
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < lowest.f) {
        lowest = openSet[i];
      }
    }
    return lowest;
  }

  /**
   * Reconstruct the path from the goal node
   */
  private static reconstructPath(goalNode: PathNode): Vector2[] {
    const path: Vector2[] = [];
    let current: PathNode | null = goalNode;
    
    while (current) {
      path.unshift(current.position);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Smooth the path using line-of-sight checks and spline interpolation
   */
  private static smoothPath(path: Vector2[], grid: Grid, opts: Required<PathfindingOptions>): Vector2[] {
    if (path.length < 3) return path;

    const optimized: Vector2[] = [path[0]];
    let currentIndex = 0;

    while (currentIndex < path.length - 1) {
      let furthestVisible = currentIndex + 1;

      for (let i = currentIndex + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[currentIndex], path[i], grid, opts)) {
          furthestVisible = i;
        }
      }

      optimized.push(path[furthestVisible]);
      currentIndex = furthestVisible;
    }

    return optimized;
  }
  
  /**
   * Apply Catmull-Rom spline interpolation for smoother paths
   */
  

  /**
   * Check if there's a clear line of sight between two points
   */
  private static hasLineOfSight(start: Vector2, end: Vector2, grid: Grid, opts: Required<PathfindingOptions>): boolean {
    const startGrid = grid.worldToGrid(start);
    const endGrid = grid.worldToGrid(end);

    const dx = Math.abs(endGrid.x - startGrid.x);
    const dy = Math.abs(endGrid.y - startGrid.y);
    const sx = startGrid.x < endGrid.x ? 1 : -1;
    const sy = startGrid.y < endGrid.y ? 1 : -1;
    let err = dx - dy;

    let x = startGrid.x;
    let y = startGrid.y;

    while (x !== endGrid.x || y !== endGrid.y) {
      if (!this.isWalkableForMovementType(x, y, grid, opts.movementType)) {
        return false;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  /**
   * Cache a pathfinding result
   */
  private static cacheResult(key: string, result: PathfindingResult): void {
    // Limit cache size
    if (this.pathCache.size >= this.CACHE_SIZE) {
      const firstKey = this.pathCache.keys().next().value;
      if (firstKey) {
        this.pathCache.delete(firstKey);
      }
    }
    
    this.pathCache.set(key, result);
  }

  /**
   * Clear the path cache
   */
  static clearCache(): void {
    this.pathCache.clear();
  }

  /**
   * Invalidate cached paths that include a specific grid position
   */
  static invalidateCacheForPosition(gridX: number, gridY: number): void {
    const keysToDelete: string[] = [];
    
    for (const [key, _] of this.pathCache) {
      // Simple check - could be optimized
      if (key.includes(`${gridX},${gridY}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.pathCache.delete(key));
  }
  
  
  /**
   * Validate if a path is still walkable
   */
  static validatePath(path: Vector2[], grid: Grid, movementType: MovementType = MovementType.WALKING): boolean {
    if (!path || path.length === 0) return false;
    
    // Check each segment of the path
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
      // Check if positions are walkable
      const currentGrid = grid.worldToGrid(current);
      const nextGrid = grid.worldToGrid(next);
      
      if (!this.isWalkableForMovementType(currentGrid.x, currentGrid.y, grid, movementType) ||
          !this.isWalkableForMovementType(nextGrid.x, nextGrid.y, grid, movementType)) {
        return false;
      }
      
      // Check if there's line of sight between consecutive points
      if (!this.hasLineOfSight(current, next, grid, {
        ...this.DEFAULT_OPTIONS,
        movementType
      })) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Find alternative path when original fails - with border awareness
   */
  
  /**
   * Validate that a spawn point has a valid path to the target position
   */
  static validateSpawnPointConnectivity(
    spawnPoint: Vector2,
    targetPosition: Vector2,
    grid: Grid,
    movementType: MovementType = MovementType.WALKING
  ): SpawnPointValidationResult {
    const result: SpawnPointValidationResult = {
      isValid: false,
      spawnPoint,
      targetPosition,
      distance: Math.sqrt(
        Math.pow(targetPosition.x - spawnPoint.x, 2) + 
        Math.pow(targetPosition.y - spawnPoint.y, 2)
      )
    };

    // Check if spawn point is within bounds
    const spawnGrid = grid.worldToGrid(spawnPoint);
    if (!grid.isInBounds(spawnGrid.x, spawnGrid.y)) {
      result.issue = 'Spawn point is out of bounds';
      return result;
    }

    // Check if spawn point is walkable
    if (!this.isWalkableForMovementType(spawnGrid.x, spawnGrid.y, grid, movementType)) {
      result.issue = 'Spawn point is not walkable';
      return result;
    }

    // Check if target is within bounds
    const targetGrid = grid.worldToGrid(targetPosition);
    if (!grid.isInBounds(targetGrid.x, targetGrid.y)) {
      result.issue = 'Target position is out of bounds';
      return result;
    }

    // Find path from spawn to target
    const pathResult = this.findPath(spawnPoint, targetPosition, grid, {
      movementType,
      maxIterations: 2000, // Allow more iterations for validation
      smoothPath: false // Don't smooth for validation
    });

    if (pathResult.success && pathResult.path.length > 0) {
      result.isValid = true;
      result.path = pathResult.path;
      result.pathCost = pathResult.cost;
    } else {
      result.issue = 'No valid path from spawn point to target';
    }

    return result;
  }

  /**
   * Validate all spawn points for connectivity to a target position
   */
  static validateAllSpawnPoints(
    spawnPoints: Vector2[],
    targetPosition: Vector2,
    grid: Grid,
    movementType: MovementType = MovementType.WALKING
  ): MapConnectivityValidation {
    const validation: MapConnectivityValidation = {
      allSpawnPointsValid: true,
      validSpawnPoints: [],
      invalidSpawnPoints: [],
      spawnValidations: [],
      warnings: [],
      errors: []
    };

    if (spawnPoints.length === 0) {
      validation.allSpawnPointsValid = false;
      validation.errors.push('No spawn points defined');
      return validation;
    }

    // Validate each spawn point
    for (const spawnPoint of spawnPoints) {
      const result = this.validateSpawnPointConnectivity(
        spawnPoint,
        targetPosition,
        grid,
        movementType
      );

      validation.spawnValidations.push(result);

      if (result.isValid) {
        validation.validSpawnPoints.push(spawnPoint);
        
        // Check if path is unusually long
        if (result.pathCost && result.distance) {
          const costRatio = result.pathCost / result.distance;
          if (costRatio > 3) {
            validation.warnings.push(
              `Spawn point at (${spawnPoint.x}, ${spawnPoint.y}) has an unusually long path (${costRatio.toFixed(1)}x direct distance)`
            );
          }
        }
      } else {
        validation.invalidSpawnPoints.push(spawnPoint);
        validation.allSpawnPointsValid = false;
        validation.errors.push(
          `Spawn point at (${spawnPoint.x}, ${spawnPoint.y}): ${result.issue}`
        );
      }
    }

    // Add summary warnings
    if (validation.invalidSpawnPoints.length > 0) {
      const percentage = (validation.invalidSpawnPoints.length / spawnPoints.length) * 100;
      validation.warnings.push(
        `${validation.invalidSpawnPoints.length} of ${spawnPoints.length} spawn points (${percentage.toFixed(0)}%) are inaccessible`
      );
    }

    if (validation.validSpawnPoints.length < 2) {
      validation.warnings.push(
        'Less than 2 valid spawn points available - gameplay may be too predictable'
      );
    }

    return validation;
  }

  /**
   * Check if there's a connected region containing both points
   */
  static arePointsConnected(
    point1: Vector2,
    point2: Vector2,
    grid: Grid,
    movementType: MovementType = MovementType.WALKING
  ): boolean {
    const pathResult = this.findPath(point1, point2, grid, {
      movementType,
      maxIterations: 2000,
      smoothPath: false
    });
    
    return pathResult.success;
  }
}