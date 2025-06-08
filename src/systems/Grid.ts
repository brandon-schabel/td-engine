import type { Vector2 } from '../utils/Vector2';

export enum CellType {
  EMPTY = 'EMPTY',
  PATH = 'PATH',
  TOWER = 'TOWER',
  BLOCKED = 'BLOCKED'
}

export class Grid {
  public readonly width: number;
  public readonly height: number;
  public readonly cellSize: number;
  private cells: CellType[][];

  constructor(width: number, height: number, cellSize: number = 32) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    
    // Initialize grid with empty cells
    this.cells = Array(height).fill(null).map(() => 
      Array(width).fill(CellType.EMPTY)
    );
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getCellType(x: number, y: number): CellType {
    if (!this.isInBounds(x, y)) {
      return CellType.BLOCKED;
    }
    return this.cells[y][x];
  }

  setCellType(x: number, y: number, type: CellType): void {
    if (!this.isInBounds(x, y)) {
      return;
    }
    this.cells[y][x] = type;
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
    return cellType === CellType.EMPTY;
  }

  setPath(pathCoords: Vector2[]): void {
    // Clear existing path
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === CellType.PATH) {
          this.cells[y][x] = CellType.EMPTY;
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
      const cellType = this.getCellType(neighbor.x, neighbor.y);
      return cellType === CellType.EMPTY || cellType === CellType.PATH;
    });
  }

  isWalkable(x: number, y: number): boolean {
    const cellType = this.getCellType(x, y);
    return cellType === CellType.EMPTY || cellType === CellType.PATH;
  }
}