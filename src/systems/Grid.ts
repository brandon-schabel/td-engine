import type { Vector2 } from '@/utils/Vector2';
import type { MapDecoration } from '@/types/MapData';
import { BiomeType } from '@/types/MapData';
import { GRID_RENDER } from '../config/UIConfig';

export enum CellType {
  EMPTY = 'EMPTY',
  PATH = 'PATH',
  TOWER = 'TOWER',
  BLOCKED = 'BLOCKED',
  OBSTACLE = 'OBSTACLE',
  DECORATIVE = 'DECORATIVE',
  ROUGH_TERRAIN = 'ROUGH_TERRAIN',
  WATER = 'WATER',
  BRIDGE = 'BRIDGE',
  SPAWN_ZONE = 'SPAWN_ZONE',
  BORDER = 'BORDER'
}

export interface CellData {
  type: CellType;
  decoration?: MapDecoration;
  movementSpeed?: number;  // For rough terrain (0-1 multiplier)
  height?: number;         // For 3D-like effects (0-1)
  biomeVariant?: string;   // Specific biome variant for this cell
}

export class Grid {
  public readonly width: number;
  public readonly height: number;
  public readonly cellSize: number;
  private cells: CellData[][];
  private biome: BiomeType = BiomeType.GRASSLAND;

  constructor(width: number, height: number, cellSize: number = GRID_RENDER.defaultCellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    
    // Initialize grid with empty cells
    this.cells = Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({ type: CellType.EMPTY }))
    );
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getCellType(x: number, y: number): CellType {
    if (!this.isInBounds(x, y)) {
      return CellType.BLOCKED;
    }
    return this.cells[y]?.[x]?.type ?? CellType.EMPTY;
  }

  getCellData(x: number, y: number): CellData | null {
    if (!this.isInBounds(x, y)) {
      return { type: CellType.BLOCKED };
    }
    return this.cells[y]?.[x] ?? null;
  }

  setCellType(x: number, y: number, type: CellType): void {
    if (!this.isInBounds(x, y)) {
      return;
    }
    if (!this.cells[y]?.[x]) {
      this.cells[y]![x] = { type };
    } else {
      this.cells[y]![x]!.type = type;
    }
  }

  setCellData(x: number, y: number, cellData: CellData): void {
    if (!this.isInBounds(x, y)) {
      return;
    }
    this.cells[y]![x] = { ...cellData };
  }

  setBiome(biome: BiomeType): void {
    this.biome = biome;
  }

  getBiome(): BiomeType {
    return this.biome;
  }

  getMovementSpeed(x: number, y: number): number {
    const cellData = this.getCellData(x, y);
    if (!cellData) return 1.0;
    
    switch (cellData.type) {
      case CellType.ROUGH_TERRAIN:
        return cellData.movementSpeed || GRID_RENDER.movementSpeeds.ROUGH_TERRAIN;
      case CellType.WATER:
      case CellType.BLOCKED:
      case CellType.OBSTACLE:
        return 0.0;
      case CellType.PATH:
        return GRID_RENDER.movementSpeeds.PATH; // Slightly faster on paths
      default:
        return 1.0;
    }
  }

  worldToGrid(worldPos: Vector2): Vector2 {
    return {
      x: Math.floor(worldPos.x / this.cellSize),
      y: Math.floor(worldPos.y / this.cellSize)
    };
  }

  gridToWorld(gridX: number, gridY: number): Vector2 {
    // Return center of cell
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    };
  }

  canPlaceTower(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) {
      return false;
    }
    
    const cellType = this.getCellType(x, y);
    return cellType === CellType.EMPTY || cellType === CellType.DECORATIVE;
  }

  isWalkable(x: number, y: number): boolean {
    const cellType = this.getCellType(x, y);
    return cellType === CellType.EMPTY || 
           cellType === CellType.PATH ||
           cellType === CellType.ROUGH_TERRAIN ||
           cellType === CellType.BRIDGE ||
           cellType === CellType.SPAWN_ZONE;
  }

  isPassableForEnemies(x: number, y: number): boolean {
    return this.isWalkable(x, y);
  }

  setPath(pathCoords: Vector2[]): void {
    // Clear existing path
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y]?.[x]?.type === CellType.PATH) {
          this.cells[y]![x]!.type = CellType.EMPTY;
        }
      }
    }
    
    // Set new path
    pathCoords.forEach(coord => {
      if (this.isInBounds(coord.x, coord.y)) {
        this.setCellType(coord.x, coord.y, CellType.PATH);
      }
    });
  }

  addObstacles(obstacleCoords: Vector2[]): void {
    obstacleCoords.forEach(coord => {
      if (this.isInBounds(coord.x, coord.y) && this.getCellType(coord.x, coord.y) === CellType.EMPTY) {
        this.setCellType(coord.x, coord.y, CellType.OBSTACLE);
      }
    });
  }

  generateRandomObstacles(count: number): void {
    const obstacles: Vector2[] = [];
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let placed = false;
      
      while (!placed && attempts < 100) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);
        
        // Only place on empty cells, not near spawn areas
        if (this.getCellType(x, y) === CellType.EMPTY && 
            x > 2 && x < this.width - 2 && 
            y > 2 && y < this.height - 2) {
          obstacles.push({ x, y });
          placed = true;
        }
        attempts++;
      }
    }
    
    this.addObstacles(obstacles);
  }

  getNeighbors(x: number, y: number): Vector2[] {
    const neighbors: Vector2[] = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];
    
    directions.forEach(dir => {
      const nx = x + dir.x;
      const ny = y + dir.y;
      
      if (this.isInBounds(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    });
    
    return neighbors;
  }

  getWalkableNeighbors(x: number, y: number): Vector2[] {
    return this.getNeighbors(x, y).filter(neighbor => {
      return this.isWalkable(neighbor.x, neighbor.y);
    });
  }

  // Additional utility methods for map generation
  addDecorations(decorations: MapDecoration[]): void {
    decorations.forEach(decoration => {
      const gridPos = this.worldToGrid(decoration.position);
      if (this.isInBounds(gridPos.x, gridPos.y)) {
        const cellData = this.getCellData(gridPos.x, gridPos.y) || { type: CellType.EMPTY };
        cellData.decoration = decoration;
        if (decoration.blocking) {
          cellData.type = CellType.OBSTACLE;
        } else {
          cellData.type = CellType.DECORATIVE;
        }
        this.setCellData(gridPos.x, gridPos.y, cellData);
      }
    });
  }

  setBorders(): void {
    // Set only the outermost edge as BORDER type
    // Keep the inner 2 tiles walkable for enemy movement
    for (let x = 0; x < this.width; x++) {
      // Top edge
      if (x === 0 || x === this.width - 1) {
        this.setCellType(x, 0, CellType.BORDER);
      }
      // Bottom edge
      if (x === 0 || x === this.width - 1) {
        this.setCellType(x, this.height - 1, CellType.BORDER);
      }
    }
    
    for (let y = 1; y < this.height - 1; y++) {
      // Left edge
      this.setCellType(0, y, CellType.BORDER);
      // Right edge
      this.setCellType(this.width - 1, y, CellType.BORDER);
    }
  }

  setSpawnZones(spawnZones: Vector2[]): void {
    spawnZones.forEach(spawn => {
      if (this.isInBounds(spawn.x, spawn.y)) {
        this.setCellType(spawn.x, spawn.y, CellType.SPAWN_ZONE);
      }
    });
  }

  // Get all cells of a specific type
  getCellsOfType(cellType: CellType): Vector2[] {
    const cells: Vector2[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getCellType(x, y) === cellType) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  // Count cells of a specific type
  countCellsOfType(cellType: CellType): number {
    return this.getCellsOfType(cellType).length;
  }

  // Get height at a position (for 3D-like effects)
  getHeight(x: number, y: number): number {
    const cellData = this.getCellData(x, y);
    return cellData?.height || 0;
  }

  setHeight(x: number, y: number, height: number): void {
    const cellData = this.getCellData(x, y) || { type: CellType.EMPTY };
    cellData.height = Math.max(0, Math.min(1, height));
    this.setCellData(x, y, cellData);
  }
}