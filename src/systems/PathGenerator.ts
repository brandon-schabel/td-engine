import type { Vector2 } from '../utils/Vector2';
import type { MapPath, MapGenerationConfig } from '../types/MapData';
import { Grid, CellType } from './Grid';

export interface PathGenerationOptions {
  complexity: number;       // 0-1, how winding the path is
  minLength: number;        // Minimum path length
  chokePoints: number;      // Number of narrow sections
  branches: number;         // Number of branch paths
  smoothness: number;       // 0-1, how smooth curves are
}

export class PathGenerator {
  private grid: Grid;
  private width: number;
  private height: number;
  private random: () => number;

  constructor(grid: Grid, seed?: number) {
    this.grid = grid;
    this.width = grid.width;
    this.height = grid.height;
    
    // Simple seeded random number generator
    if (seed !== undefined) {
      let seedValue = seed;
      this.random = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };
    } else {
      this.random = Math.random;
    }
  }

  generateMainPath(config: MapGenerationConfig): MapPath {
    const options: PathGenerationOptions = {
      complexity: config.pathComplexity,
      minLength: Math.min(this.width, this.height) * 0.8,
      chokePoints: config.chokePointCount,
      branches: 0, // Main path has no branches
      smoothness: 0.7
    };

    const waypoints = this.generatePathWaypoints(options);
    const smoothedPath = this.smoothPath(waypoints, options.smoothness);
    const finalPath = this.ensureMinimumLength(smoothedPath, options.minLength);

    return {
      waypoints: finalPath,
      width: 1,
      type: 'MAIN',
      connections: []
    };
  }

  generateBranchPaths(mainPath: MapPath, branchCount: number): MapPath[] {
    const branches: MapPath[] = [];
    
    for (let i = 0; i < branchCount; i++) {
      const branch = this.generateBranchFromMainPath(mainPath, i);
      if (branch) {
        branches.push(branch);
      }
    }

    return branches;
  }

  private generatePathWaypoints(options: PathGenerationOptions): Vector2[] {
    const waypoints: Vector2[] = [];
    
    // Start from left edge, end at right edge (or other configuration)
    const startY = Math.floor(this.height * (0.3 + this.random() * 0.4));
    const endY = Math.floor(this.height * (0.3 + this.random() * 0.4));
    
    waypoints.push({ x: 0, y: startY });

    // Generate intermediate waypoints based on complexity
    const segmentCount = Math.floor(3 + options.complexity * 5);
    
    for (let i = 1; i < segmentCount; i++) {
      const progress = i / segmentCount;
      const baseX = Math.floor(progress * (this.width - 1));
      
      // Add some randomness based on complexity
      const maxDeviation = Math.floor(this.height * 0.3 * options.complexity);
      const yDeviation = (this.random() - 0.5) * 2 * maxDeviation;
      
      // Interpolate Y between start and end, plus deviation
      const baseY = startY + (endY - startY) * progress;
      const finalY = Math.floor(Math.max(1, Math.min(this.height - 2, baseY + yDeviation)));
      
      waypoints.push({ x: baseX, y: finalY });
    }

    waypoints.push({ x: this.width - 1, y: endY });
    
    return waypoints;
  }

  private smoothPath(waypoints: Vector2[], smoothness: number): Vector2[] {
    if (waypoints.length < 3 || smoothness <= 0) {
      return waypoints;
    }

    const smoothed: Vector2[] = [waypoints[0]];
    
    for (let i = 1; i < waypoints.length - 1; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      
      // Calculate smoothed position
      const smoothX = curr.x + (prev.x + next.x - 2 * curr.x) * smoothness * 0.5;
      const smoothY = curr.y + (prev.y + next.y - 2 * curr.y) * smoothness * 0.5;
      
      smoothed.push({
        x: Math.floor(Math.max(1, Math.min(this.width - 2, smoothX))),
        y: Math.floor(Math.max(1, Math.min(this.height - 2, smoothY)))
      });
    }
    
    smoothed.push(waypoints[waypoints.length - 1]);
    return smoothed;
  }

  private ensureMinimumLength(waypoints: Vector2[], minLength: number): Vector2[] {
    const totalLength = this.calculatePathLength(waypoints);
    
    if (totalLength >= minLength) {
      return waypoints;
    }

    // Add more waypoints to increase length
    const result: Vector2[] = [waypoints[0]];
    
    for (let i = 1; i < waypoints.length; i++) {
      const start = waypoints[i - 1];
      const end = waypoints[i];
      
      // Add intermediate points if segment is long
      const segmentLength = this.distance(start, end);
      const subdivisions = Math.floor(segmentLength / 3);
      
      for (let j = 1; j <= subdivisions; j++) {
        const t = j / (subdivisions + 1);
        const intermediate = {
          x: Math.floor(start.x + (end.x - start.x) * t),
          y: Math.floor(start.y + (end.y - start.y) * t)
        };
        result.push(intermediate);
      }
      
      result.push(end);
    }
    
    return result;
  }

  private generateBranchFromMainPath(mainPath: MapPath, branchIndex: number): MapPath | null {
    if (mainPath.waypoints.length < 3) return null;

    // Pick a connection point along the main path
    const connectionIndex = Math.floor(1 + this.random() * (mainPath.waypoints.length - 2));
    const connectionPoint = mainPath.waypoints[connectionIndex];
    
    // Generate branch direction (perpendicular to main path direction)
    const pathDirection = this.getPathDirection(mainPath, connectionIndex);
    const branchDirection = this.getPerpendicularDirection(pathDirection);
    
    // Generate branch waypoints
    const branchLength = 3 + Math.floor(this.random() * 4);
    const waypoints: Vector2[] = [connectionPoint];
    
    let current = connectionPoint;
    for (let i = 0; i < branchLength; i++) {
      const step = {
        x: Math.floor(current.x + branchDirection.x * (2 + this.random() * 2)),
        y: Math.floor(current.y + branchDirection.y * (2 + this.random() * 2))
      };
      
      // Ensure within bounds
      if (step.x < 1 || step.x >= this.width - 1 || 
          step.y < 1 || step.y >= this.height - 1) {
        break;
      }
      
      waypoints.push(step);
      current = step;
    }
    
    return {
      waypoints,
      width: 1,
      type: 'BRANCH',
      connections: [connectionIndex] // Index into main path
    };
  }

  private getPathDirection(path: MapPath, index: number): Vector2 {
    if (index <= 0) {
      const curr = path.waypoints[0];
      const next = path.waypoints[1];
      return this.normalize({ x: next.x - curr.x, y: next.y - curr.y });
    }
    
    if (index >= path.waypoints.length - 1) {
      const prev = path.waypoints[path.waypoints.length - 2];
      const curr = path.waypoints[path.waypoints.length - 1];
      return this.normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
    }
    
    const prev = path.waypoints[index - 1];
    const next = path.waypoints[index + 1];
    return this.normalize({ x: next.x - prev.x, y: next.y - prev.y });
  }

  private getPerpendicularDirection(direction: Vector2): Vector2 {
    // Rotate 90 degrees, then add some randomness
    const perpendicular = { x: -direction.y, y: direction.x };
    
    // Add randomness
    const angle = (this.random() - 0.5) * Math.PI * 0.5; // ±45 degrees
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    return {
      x: perpendicular.x * cos - perpendicular.y * sin,
      y: perpendicular.x * sin + perpendicular.y * cos
    };
  }

  private normalize(vector: Vector2): Vector2 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  private distance(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private calculatePathLength(waypoints: Vector2[]): number {
    let length = 0;
    for (let i = 1; i < waypoints.length; i++) {
      length += this.distance(waypoints[i - 1], waypoints[i]);
    }
    return length;
  }

  // Create a detailed path by filling in cells between waypoints
  createDetailedPath(path: MapPath): Vector2[] {
    const detailedPath: Vector2[] = [];
    
    // Handle single waypoint case
    if (path.waypoints.length === 1) {
      return [{ ...path.waypoints[0] }];
    }
    
    for (let i = 1; i < path.waypoints.length; i++) {
      const start = path.waypoints[i - 1];
      const end = path.waypoints[i];
      
      // Use Bresenham's line algorithm to get all cells between waypoints
      const linePoints = this.getLinePoints(start, end);
      
      // Add to detailed path (avoid duplicates)
      linePoints.forEach(point => {
        if (detailedPath.length === 0 || 
            detailedPath[detailedPath.length - 1].x !== point.x ||
            detailedPath[detailedPath.length - 1].y !== point.y) {
          detailedPath.push(point);
        }
      });
    }
    
    return detailedPath;
  }

  private getLinePoints(start: Vector2, end: Vector2): Vector2[] {
    const points: Vector2[] = [];
    
    // Ensure start and end are integers to prevent infinite loops
    const startX = Math.round(start.x);
    const startY = Math.round(start.y);
    const endX = Math.round(end.x);
    const endY = Math.round(end.y);
    
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;
    
    let x = startX;
    let y = startY;
    
    // Add safety counter to prevent infinite loops
    let maxIterations = Math.max(dx, dy) * 2 + 10;
    let iterations = 0;
    
    while (iterations < maxIterations) {
      points.push({ x, y });
      
      if (x === endX && y === endY) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      
      iterations++;
    }
    
    return points;
  }

  // Validate that a path is playable
  validatePath(path: MapPath): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check minimum length
    if (path.waypoints.length < 2) {
      issues.push('Path must have at least 2 waypoints');
    }
    
    // Check all waypoints are within bounds
    path.waypoints.forEach((point, index) => {
      if (point.x < 0 || point.x >= this.width || 
          point.y < 0 || point.y >= this.height) {
        issues.push(`Waypoint ${index} is out of bounds`);
      }
    });
    
    // Check path connectivity
    const detailedPath = this.createDetailedPath(path);
    let reachableFromStart = true;
    
    for (let i = 1; i < detailedPath.length; i++) {
      const current = detailedPath[i];
      const previous = detailedPath[i - 1];
      
      // Check if current cell is reachable from previous
      if (Math.abs(current.x - previous.x) > 1 || 
          Math.abs(current.y - previous.y) > 1) {
        reachableFromStart = false;
        issues.push(`Path has unreachable segment at waypoint ${i}`);
        break;
      }
    }
    
    if (!reachableFromStart) {
      issues.push('Path is not fully connected');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Add strategic elements to paths
  addChokePoints(path: MapPath, count: number): Vector2[] {
    const chokePoints: Vector2[] = [];
    const detailedPath = this.createDetailedPath(path);
    
    if (detailedPath.length < count * 3) return chokePoints;
    
    const spacing = Math.floor(detailedPath.length / (count + 1));
    
    for (let i = 1; i <= count; i++) {
      const index = Math.min(spacing * i, detailedPath.length - 1);
      chokePoints.push(detailedPath[index]);
    }
    
    return chokePoints;
  }
}