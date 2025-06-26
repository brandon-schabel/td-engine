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
  minDistanceFromObstacles?: number;
  terrainCostMultiplier?: number;
  smoothPath?: boolean;
  movementType?: MovementType;
  predictiveTarget?: boolean; // Enable predictive targeting
  targetVelocity?: Vector2; // Target's velocity for prediction
  predictionTime?: number; // How far ahead to predict (in seconds)
}

export interface PathfindingResult {
  path: Vector2[];
  success: boolean;
  iterations: number;
  cost: number;
}

export class Pathfinding {
  private static readonly DEFAULT_OPTIONS: Required<PathfindingOptions> = {
    maxIterations: 1000,
    allowDiagonal: true,
    minDistanceFromObstacles: 0,
    terrainCostMultiplier: 1.0,
    smoothPath: true,
    movementType: MovementType.WALKING,
    predictiveTarget: false,
    targetVelocity: { x: 0, y: 0 },
    predictionTime: 0.5
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
    
    // Apply predictive targeting if enabled
    let targetGoal = goal;
    if (opts.predictiveTarget && opts.targetVelocity && 
        (opts.targetVelocity.x !== 0 || opts.targetVelocity.y !== 0)) {
      targetGoal = {
        x: goal.x + opts.targetVelocity.x * opts.predictionTime,
        y: goal.y + opts.targetVelocity.y * opts.predictionTime
      };
      
      // Ensure predicted position is valid
      const predictedGrid = grid.worldToGrid(targetGoal);
      if (!grid.isInBounds(predictedGrid.x, predictedGrid.y) ||
          !this.isWalkableForMovementType(predictedGrid.x, predictedGrid.y, grid, opts.movementType)) {
        targetGoal = goal; // Fall back to original goal
      }
    }
    
    // Convert world positions to grid coordinates
    const startGrid = grid.worldToGrid(start);
    const goalGrid = grid.worldToGrid(targetGoal);
    
    // Check if start and goal are valid
    if (!grid.isInBounds(startGrid.x, startGrid.y) || !grid.isInBounds(goalGrid.x, goalGrid.y)) {
      return { path: [], success: false, iterations: 0, cost: 0 };
    }
    
    // Check cache
    const cacheKey = `${startGrid.x},${startGrid.y}-${goalGrid.x},${goalGrid.y}-${opts.movementType}`;
    const cached = this.pathCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Check if goal is walkable
    if (!this.isWalkableForMovementType(goalGrid.x, goalGrid.y, grid, opts.movementType)) {
      return { path: [], success: false, iterations: 0, cost: 0 };
    }
    
    // A* algorithm
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, PathNode>();
    
    // Create start node
    const startH = this.heuristic({ gridX: startGrid.x, gridY: startGrid.y }, { gridX: goalGrid.x, gridY: goalGrid.y });
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
      
      // Get node with lowest f score
      currentNode = this.getLowestFNode(openSet);
      
      // Check if we reached the goal
      if (currentNode.gridX === goalGrid.x && currentNode.gridY === goalGrid.y) {
        break;
      }
      
      // Move current node from open to closed set
      const currentIndex = openSet.indexOf(currentNode);
      openSet.splice(currentIndex, 1);
      closedSet.add(`${currentNode.gridX},${currentNode.gridY}`);
      
      // Check all neighbors
      const neighbors = this.getNeighbors(currentNode, grid, opts);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.gridX},${neighbor.gridY}`;
        
        // Skip if in closed set
        if (closedSet.has(neighborKey)) continue;
        
        // Skip if not walkable or too close to obstacles
        if (!this.isValidPosition(neighbor.gridX, neighbor.gridY, grid, opts)) continue;
        
        // Calculate tentative g score
        const movementCost = this.getMovementCost(currentNode, neighbor, grid, opts);
        const tentativeG = currentNode.g + movementCost;
        
        // Get or create neighbor node
        let neighborNode = nodeMap.get(neighborKey);
        if (!neighborNode) {
          neighborNode = {
            position: grid.gridToWorld(neighbor.gridX, neighbor.gridY),
            gridX: neighbor.gridX,
            gridY: neighbor.gridY,
            g: Infinity,
            h: this.heuristic({ gridX: neighbor.gridX, gridY: neighbor.gridY }, { gridX: goalGrid.x, gridY: goalGrid.y }),
            f: Infinity,
            parent: null
          };
          nodeMap.set(neighborKey, neighborNode);
        }
        
        // Check if this path to neighbor is better
        if (tentativeG < neighborNode.g) {
          neighborNode.parent = currentNode;
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          
          // Add to open set if not already there
          if (!openSet.includes(neighborNode)) {
            openSet.push(neighborNode);
          }
        }
      }
    }
    
    // Reconstruct path if we found the goal
    let path: Vector2[] = [];
    let totalCost = 0;
    
    if (currentNode && currentNode.gridX === goalGrid.x && currentNode.gridY === goalGrid.y) {
      path = this.reconstructPath(currentNode);
      totalCost = currentNode.g;
      
      // Smooth the path if requested
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
    
    // Cache the result
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
  private static isValidPosition(x: number, y: number, grid: Grid, opts: Required<PathfindingOptions>): boolean {
    if (!this.isWalkableForMovementType(x, y, grid, opts.movementType)) {
      return false;
    }
    
    // Check minimum distance from obstacles
    if (opts.minDistanceFromObstacles > 0) {
      const radius = Math.ceil(opts.minDistanceFromObstacles);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const checkX = x + dx;
          const checkY = y + dy;
          if (grid.isInBounds(checkX, checkY)) {
            const cellType = grid.getCellType(checkX, checkY);
            if (cellType === CellType.OBSTACLE || cellType === CellType.BLOCKED || cellType === CellType.WATER) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < opts.minDistanceFromObstacles) {
                return false;
              }
            }
          }
        }
      }
    }
    
    return true;
  }

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
  private static getMovementCost(from: PathNode, to: {gridX: number, gridY: number}, grid: Grid, opts: Required<PathfindingOptions>): number {
    // Base cost is distance
    const dx = to.gridX - from.gridX;
    const dy = to.gridY - from.gridY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Get terrain cost multiplier
    const speedMultiplier = grid.getMovementSpeed(to.gridX, to.gridY);
    const terrainCost = speedMultiplier > 0 ? 1.0 / speedMultiplier : 10.0;
    
    return distance * terrainCost * opts.terrainCostMultiplier;
  }

  /**
   * Heuristic function for A* (Euclidean distance)
   */
  private static heuristic(a: { gridX: number, gridY: number }, b: { gridX: number, gridY: number }): number {
    const dx = Math.abs(a.gridX - b.gridX);
    const dy = Math.abs(a.gridY - b.gridY);
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
   * Smooth the path using line-of-sight checks
   */
  private static smoothPath(path: Vector2[], grid: Grid, opts: Required<PathfindingOptions>): Vector2[] {
    if (path.length < 3) return path;
    
    const smoothed: Vector2[] = [path[0]];
    let currentIndex = 0;
    
    while (currentIndex < path.length - 1) {
      let furthestVisible = currentIndex + 1;
      
      // Find the furthest point we can see from current position
      for (let i = currentIndex + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[currentIndex], path[i], grid, opts)) {
          furthestVisible = i;
        }
      }
      
      smoothed.push(path[furthestVisible]);
      currentIndex = furthestVisible;
    }
    
    return smoothed;
  }

  /**
   * Check if there's a clear line of sight between two points
   */
  private static hasLineOfSight(start: Vector2, end: Vector2, grid: Grid, opts: Required<PathfindingOptions>): boolean {
    const startGrid = grid.worldToGrid(start);
    const endGrid = grid.worldToGrid(end);
    
    // Use Bresenham's line algorithm
    const dx = Math.abs(endGrid.x - startGrid.x);
    const dy = Math.abs(endGrid.y - startGrid.y);
    const sx = startGrid.x < endGrid.x ? 1 : -1;
    const sy = startGrid.y < endGrid.y ? 1 : -1;
    let err = dx - dy;
    
    let x = startGrid.x;
    let y = startGrid.y;
    
    while (x !== endGrid.x || y !== endGrid.y) {
      if (!this.isValidPosition(x, y, grid, opts)) {
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
  static findAlternativePath(
    start: Vector2,
    goal: Vector2,
    grid: Grid,
    options?: PathfindingOptions
  ): PathfindingResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // First, try relaxed pathfinding constraints
    const relaxedResult = this.findPath(start, goal, grid, {
      ...opts,
      minDistanceFromObstacles: 0, // Allow closer to obstacles
      maxIterations: opts.maxIterations * 2 // More iterations
    });
    
    if (relaxedResult.success) {
      return relaxedResult;
    }
    
    // Try to find paths to nearby accessible positions
    const searchRadii = [30, 60, 90, 120, 150];
    const angleSteps = 16; // More angles for better coverage
    
    // Sort angles by proximity to goal direction
    const goalAngle = Math.atan2(goal.y - start.y, goal.x - start.x);
    const angles: number[] = [];
    for (let i = 0; i < angleSteps; i++) {
      angles.push((i / angleSteps) * Math.PI * 2);
    }
    angles.sort((a, b) => {
      const diffA = Math.abs(((a - goalAngle + Math.PI) % (Math.PI * 2)) - Math.PI);
      const diffB = Math.abs(((b - goalAngle + Math.PI) % (Math.PI * 2)) - Math.PI);
      return diffA - diffB;
    });
    
    for (const radius of searchRadii) {
      for (const angle of angles) {
        const alternativeGoal = {
          x: goal.x + Math.cos(angle) * radius,
          y: goal.y + Math.sin(angle) * radius
        };
        
        // Check if alternative goal is valid
        const gridPos = grid.worldToGrid(alternativeGoal);
        if (!grid.isInBounds(gridPos.x, gridPos.y)) {
          continue;
        }
        
        // Don't go too close to borders unless necessary
        if (radius < 120 && grid.isNearBorder(gridPos.x, gridPos.y, 1)) {
          continue;
        }
        
        // Check if the position is walkable
        if (!this.isWalkableForMovementType(gridPos.x, gridPos.y, grid, opts.movementType)) {
          continue;
        }
        
        // Try to find path to alternative goal
        const result = this.findPath(start, alternativeGoal, grid, {
          ...opts,
          maxIterations: Math.min(opts.maxIterations, 500) // Limit iterations for performance
        });
        
        if (result.success) {
          return result;
        }
      }
    }
    
    // Last resort: try to move in the general direction
    const emergencyPath = this.createEmergencyPath(start, goal, grid, opts);
    if (emergencyPath.length > 0) {
      return {
        path: emergencyPath,
        success: true,
        iterations: 1,
        cost: emergencyPath.length
      };
    }
    
    // If all else fails, return empty path
    return {
      path: [],
      success: false,
      iterations: 0,
      cost: Infinity
    };
  }
  
  /**
   * Create emergency path for when normal pathfinding fails
   */
  private static createEmergencyPath(
    start: Vector2, 
    goal: Vector2, 
    grid: Grid, 
    opts: Required<PathfindingOptions>
  ): Vector2[] {
    const path: Vector2[] = [start];
    const stepSize = grid.cellSize;
    const maxSteps = 10;
    
    let current = { ...start };
    
    for (let step = 0; step < maxSteps; step++) {
      const dx = goal.x - current.x;
      const dy = goal.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < stepSize) break;
      
      // Try to move directly toward goal
      const direction = { x: dx / distance, y: dy / distance };
      let nextPos = {
        x: current.x + direction.x * stepSize,
        y: current.y + direction.y * stepSize
      };
      
      const gridPos = grid.worldToGrid(nextPos);
      
      // If direct path is blocked, try perpendicular directions
      if (!grid.isInBounds(gridPos.x, gridPos.y) || 
          !this.isWalkableForMovementType(gridPos.x, gridPos.y, grid, opts.movementType)) {
        
        // Try left and right perpendicular
        const perpAngles = [Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        let foundAlternative = false;
        
        for (const perpAngle of perpAngles) {
          const newAngle = Math.atan2(direction.y, direction.x) + perpAngle;
          const altPos = {
            x: current.x + Math.cos(newAngle) * stepSize,
            y: current.y + Math.sin(newAngle) * stepSize
          };
          
          const altGrid = grid.worldToGrid(altPos);
          if (grid.isInBounds(altGrid.x, altGrid.y) && 
              this.isWalkableForMovementType(altGrid.x, altGrid.y, grid, opts.movementType)) {
            nextPos = altPos;
            foundAlternative = true;
            break;
          }
        }
        
        if (!foundAlternative) break;
      }
      
      path.push(nextPos);
      current = nextPos;
    }
    
    return path.length > 1 ? path : [];
  }
}