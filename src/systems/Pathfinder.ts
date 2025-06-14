import { Grid } from './Grid';
import type { Vector2 } from '@/utils/Vector2';

interface Node {
  position: Vector2;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: Node | null;
}

export class Pathfinder {
  private grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  findPath(start: Vector2, end: Vector2): Vector2[] | null {
    // Check if start and end are valid
    if (!this.grid.isInBounds(start.x, start.y) || 
        !this.grid.isInBounds(end.x, end.y)) {
      return null;
    }

    // Check if end is walkable
    if (!this.grid.isWalkable(end.x, end.y)) {
      return null;
    }

    // Handle same start and end
    if (start.x === end.x && start.y === end.y) {
      return [start];
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();
    
    // Create start node
    const startNode: Node = {
      position: start,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    
    openList.push(startNode);

    while (openList.length > 0) {
      // Get node with lowest f cost
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }
      
      const currentNode = openList.splice(currentIndex, 1)[0];
      const posKey = `${currentNode.position.x},${currentNode.position.y}`;
      closedSet.add(posKey);

      // Check if we reached the goal
      if (currentNode.position.x === end.x && 
          currentNode.position.y === end.y) {
        return this.reconstructPath(currentNode);
      }

      // Check neighbors
      const neighbors = this.grid.getWalkableNeighbors(
        currentNode.position.x, 
        currentNode.position.y
      );

      for (const neighborPos of neighbors) {
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        
        // Skip if already evaluated
        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeG = currentNode.g + 1; // Cost to move to neighbor

        // Check if neighbor is already in open list
        let neighbor = openList.find(n => 
          n.position.x === neighborPos.x && 
          n.position.y === neighborPos.y
        );

        if (!neighbor) {
          // Create new neighbor node
          neighbor = {
            position: neighborPos,
            g: tentativeG,
            h: this.heuristic(neighborPos, end),
            f: 0,
            parent: currentNode
          };
          neighbor.f = neighbor.g + neighbor.h;
          openList.push(neighbor);
        } else if (tentativeG < neighbor.g) {
          // Update existing neighbor if we found a better path
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
        }
      }
    }

    // No path found
    return null;
  }

  private heuristic(a: Vector2, b: Vector2): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private reconstructPath(endNode: Node): Vector2[] {
    const path: Vector2[] = [];
    let current: Node | null = endNode;
    
    while (current) {
      path.unshift({ ...current.position });
      current = current.parent;
    }
    
    return path;
  }

  // Convert grid path to world coordinates
  gridPathToWorld(gridPath: Vector2[]): Vector2[] {
    return gridPath.map(gridPos => 
      this.grid.gridToWorld(gridPos.x, gridPos.y)
    );
  }
}