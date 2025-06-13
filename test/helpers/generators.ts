import { EnemyType } from '@/entities/Enemy';
import { TowerType, UpgradeType } from '@/entities/Tower';
import { Vector2 } from '@/utils/Vector2';
import { Path, MapData } from '@/types/map';
import { WaveConfig } from '@/systems/WaveManager';

/**
 * Random number utilities
 */
export class Random {
  constructor(private seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
    }
  }
  
  /**
   * Get random number between 0 and 1
   */
  next(): number {
    if (this.seed === undefined) {
      return Math.random();
    }
    
    // Simple LCG for deterministic random
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483647;
    return this.seed / 2147483647;
  }
  
  /**
   * Get random integer between min and max (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Get random float between min and max
   */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Get random boolean
   */
  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
  
  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }
  
  /**
   * Shuffle array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Enemy generator
 */
export class EnemyGenerator {
  constructor(private random = new Random()) {}
  
  /**
   * Generate random enemy type
   */
  randomType(): EnemyType {
    return this.random.pick([EnemyType.BASIC, EnemyType.FAST, EnemyType.TANK]);
  }
  
  /**
   * Generate enemy wave pattern
   */
  generateWavePattern(options: {
    enemyCount: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    mixedTypes?: boolean;
  }): Array<{ type: EnemyType; count: number }> {
    const { enemyCount, difficulty = 'medium', mixedTypes = true } = options;
    
    if (!mixedTypes) {
      return [{ type: this.randomType(), count: enemyCount }];
    }
    
    // Distribute enemies based on difficulty
    const distribution = this.getDistribution(difficulty);
    const groups: Array<{ type: EnemyType; count: number }> = [];
    
    let remaining = enemyCount;
    for (const [type, percentage] of Object.entries(distribution)) {
      const count = Math.floor(enemyCount * percentage);
      if (count > 0) {
        groups.push({ type: type as EnemyType, count });
        remaining -= count;
      }
    }
    
    // Add remaining enemies to random group
    if (remaining > 0 && groups.length > 0) {
      groups[this.random.int(0, groups.length - 1)].count += remaining;
    }
    
    return groups;
  }
  
  /**
   * Generate spawn positions along path
   */
  generateSpawnPositions(path: Path, count: number, spacing = 50): Vector2[] {
    const positions: Vector2[] = [];
    let currentDistance = 0;
    
    for (let i = 0; i < count; i++) {
      const position = this.getPositionAtDistance(path, currentDistance);
      positions.push(position);
      currentDistance += spacing;
    }
    
    return positions;
  }
  
  private getDistribution(difficulty: 'easy' | 'medium' | 'hard'): Record<EnemyType, number> {
    switch (difficulty) {
      case 'easy':
        return {
          [EnemyType.BASIC]: 0.7,
          [EnemyType.FAST]: 0.2,
          [EnemyType.TANK]: 0.1
        };
      case 'medium':
        return {
          [EnemyType.BASIC]: 0.5,
          [EnemyType.FAST]: 0.3,
          [EnemyType.TANK]: 0.2
        };
      case 'hard':
        return {
          [EnemyType.BASIC]: 0.3,
          [EnemyType.FAST]: 0.4,
          [EnemyType.TANK]: 0.3
        };
    }
  }
  
  private getPositionAtDistance(path: Path, distance: number): Vector2 {
    let accumulatedDistance = 0;
    
    for (let i = 0; i < path.points.length - 1; i++) {
      const start = path.points[i];
      const end = path.points[i + 1];
      const segmentLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      
      if (accumulatedDistance + segmentLength >= distance) {
        const t = (distance - accumulatedDistance) / segmentLength;
        return {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t
        };
      }
      
      accumulatedDistance += segmentLength;
    }
    
    // Return last point if distance exceeds path length
    return path.points[path.points.length - 1];
  }
}

/**
 * Tower placement generator
 */
export class TowerGenerator {
  constructor(private random = new Random()) {}
  
  /**
   * Generate random tower type
   */
  randomType(): TowerType {
    return this.random.pick([TowerType.BASIC, TowerType.SNIPER, TowerType.RAPID]);
  }
  
  /**
   * Generate random upgrade type
   */
  randomUpgrade(): UpgradeType {
    return this.random.pick([UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE]);
  }
  
  /**
   * Generate tower placement strategy
   */
  generatePlacement(options: {
    grid: boolean[][];
    count: number;
    strategy?: 'random' | 'defensive' | 'offensive';
  }): Array<{ position: Vector2; type: TowerType }> {
    const { grid, count, strategy = 'random' } = options;
    const placements: Array<{ position: Vector2; type: TowerType }> = [];
    
    const availablePositions = this.getAvailablePositions(grid);
    const selectedPositions = this.selectPositions(availablePositions, count, strategy);
    
    for (const pos of selectedPositions) {
      placements.push({
        position: pos,
        type: this.selectTowerType(strategy)
      });
    }
    
    return placements;
  }
  
  /**
   * Generate upgrade sequence
   */
  generateUpgradeSequence(level: number, strategy?: 'balanced' | 'damage' | 'range' | 'speed'): UpgradeType[] {
    const upgrades: UpgradeType[] = [];
    
    for (let i = 1; i < level; i++) {
      switch (strategy) {
        case 'damage':
          upgrades.push(UpgradeType.DAMAGE);
          break;
        case 'range':
          upgrades.push(UpgradeType.RANGE);
          break;
        case 'speed':
          upgrades.push(UpgradeType.FIRE_RATE);
          break;
        case 'balanced':
        default:
          // Rotate through upgrade types
          const types = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
          upgrades.push(types[i % 3]);
          break;
      }
    }
    
    return upgrades;
  }
  
  private getAvailablePositions(grid: boolean[][]): Vector2[] {
    const positions: Vector2[] = [];
    const cellSize = 32;
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x]) {
          positions.push({
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2
          });
        }
      }
    }
    
    return positions;
  }
  
  private selectPositions(available: Vector2[], count: number, strategy: string): Vector2[] {
    if (strategy === 'random') {
      return this.random.shuffle(available).slice(0, count);
    }
    
    // For defensive/offensive, prefer certain areas
    const sorted = [...available].sort((a, b) => {
      if (strategy === 'defensive') {
        // Prefer positions closer to exit (right side)
        return b.x - a.x;
      } else {
        // Prefer positions closer to spawn (left side)
        return a.x - b.x;
      }
    });
    
    return sorted.slice(0, count);
  }
  
  private selectTowerType(strategy: string): TowerType {
    if (strategy === 'defensive') {
      // Prefer high damage towers for defense
      return this.random.pick([TowerType.SNIPER, TowerType.SNIPER, TowerType.BASIC]);
    } else if (strategy === 'offensive') {
      // Prefer rapid fire for offense
      return this.random.pick([TowerType.RAPID, TowerType.RAPID, TowerType.BASIC]);
    }
    
    return this.randomType();
  }
}

/**
 * Wave generator
 */
export class WaveGenerator {
  constructor(private random = new Random()) {}
  
  /**
   * Generate wave sequence
   */
  generateWaves(options: {
    count: number;
    startDifficulty?: number;
    difficultyIncrease?: number;
    startDelay?: number;
  }): WaveConfig[] {
    const {
      count,
      startDifficulty = 1,
      difficultyIncrease = 1.2,
      startDelay = 2000
    } = options;
    
    const waves: WaveConfig[] = [];
    let difficulty = startDifficulty;
    
    for (let i = 1; i <= count; i++) {
      waves.push(this.generateWave(i, difficulty, startDelay));
      difficulty *= difficultyIncrease;
    }
    
    return waves;
  }
  
  /**
   * Generate single wave
   */
  generateWave(waveNumber: number, difficulty: number, startDelay: number): WaveConfig {
    const enemyCount = Math.floor(5 + difficulty * 3);
    const enemyGenerator = new EnemyGenerator(this.random);
    
    const difficultyLevel = difficulty < 3 ? 'easy' : difficulty < 7 ? 'medium' : 'hard';
    const enemyGroups = enemyGenerator.generateWavePattern({
      enemyCount,
      difficulty: difficultyLevel,
      mixedTypes: waveNumber > 3
    });
    
    return {
      waveNumber,
      enemies: enemyGroups.map(group => ({
        ...group,
        spawnDelay: Math.max(200, 1000 - difficulty * 50)
      })),
      startDelay
    };
  }
}

/**
 * Map generator
 */
export class MapGenerator {
  constructor(private random = new Random()) {}
  
  /**
   * Generate random path
   */
  generatePath(options: {
    width: number;
    height: number;
    complexity?: 'simple' | 'medium' | 'complex';
    startSide?: 'left' | 'top' | 'bottom';
    endSide?: 'right' | 'top' | 'bottom';
  }): Path {
    const {
      width,
      height,
      complexity = 'medium',
      startSide = 'left',
      endSide = 'right'
    } = options;
    
    const points: Vector2[] = [];
    
    // Add start point
    points.push(this.getEdgePoint(startSide, width, height));
    
    // Add intermediate points based on complexity
    const turnCount = complexity === 'simple' ? 2 : complexity === 'medium' ? 4 : 6;
    
    for (let i = 0; i < turnCount; i++) {
      const progress = (i + 1) / (turnCount + 1);
      const x = this.random.int(width * 0.2, width * 0.8);
      const y = this.random.int(height * 0.2, height * 0.8);
      points.push({ x, y });
    }
    
    // Add end point
    points.push(this.getEdgePoint(endSide, width, height));
    
    // Smooth path
    const smoothedPoints = this.smoothPath(points);
    
    return {
      id: `generated-path-${Date.now()}`,
      points: smoothedPoints,
      length: this.calculatePathLength(smoothedPoints)
    };
  }
  
  /**
   * Generate complete map
   */
  generateMap(options: {
    width?: number;
    height?: number;
    pathCount?: number;
    obstacleCount?: number;
  }): MapData {
    const {
      width = 25,
      height = 19,
      pathCount = 1,
      obstacleCount = 0
    } = options;
    
    const paths: Path[] = [];
    const spawns: Vector2[] = [];
    const exits: Vector2[] = [];
    
    // Generate paths
    for (let i = 0; i < pathCount; i++) {
      const path = this.generatePath({
        width,
        height,
        complexity: this.random.pick(['simple', 'medium', 'complex'])
      });
      
      paths.push(path);
      spawns.push(path.points[0]);
      exits.push(path.points[path.points.length - 1]);
    }
    
    // Generate placeable grid
    const placeable = this.generatePlaceableGrid(width, height, paths);
    
    // Add random obstacles
    for (let i = 0; i < obstacleCount; i++) {
      const x = this.random.int(0, width - 1);
      const y = this.random.int(0, height - 1);
      if (placeable[y][x]) {
        placeable[y][x] = false;
      }
    }
    
    return {
      width,
      height,
      paths,
      spawns,
      exits,
      placeable
    };
  }
  
  private getEdgePoint(side: string, width: number, height: number): Vector2 {
    switch (side) {
      case 'left':
        return { x: 0, y: this.random.int(2, height - 3) };
      case 'right':
        return { x: width - 1, y: this.random.int(2, height - 3) };
      case 'top':
        return { x: this.random.int(2, width - 3), y: 0 };
      case 'bottom':
        return { x: this.random.int(2, width - 3), y: height - 1 };
      default:
        return { x: 0, y: Math.floor(height / 2) };
    }
  }
  
  private smoothPath(points: Vector2[]): Vector2[] {
    if (points.length <= 2) return points;
    
    const smoothed: Vector2[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Simple smoothing: adjust current point based on neighbors
      const smoothedPoint = {
        x: curr.x * 0.5 + (prev.x + next.x) * 0.25,
        y: curr.y * 0.5 + (prev.y + next.y) * 0.25
      };
      
      smoothed.push(smoothedPoint);
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  }
  
  private calculatePathLength(points: Vector2[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }
  
  private generatePlaceableGrid(width: number, height: number, paths: Path[]): boolean[][] {
    const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(true));
    
    // Mark path cells as not placeable
    paths.forEach(path => {
      for (let i = 0; i < path.points.length - 1; i++) {
        const start = path.points[i];
        const end = path.points[i + 1];
        
        // Use Bresenham's line algorithm
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const sx = start.x < end.x ? 1 : -1;
        const sy = start.y < end.y ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.floor(start.x);
        let y = Math.floor(start.y);
        
        while (true) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            grid[y][x] = false;
          }
          
          if (x === Math.floor(end.x) && y === Math.floor(end.y)) break;
          
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
      }
    });
    
    return grid;
  }
}