import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from './Grid';
import type { MapGenerationConfig } from '@/types/MapData';
import { CellType } from './Grid';
import { BiomeType } from '@/types/MapData';

export interface TerrainCluster {
  center: Vector2;
  radius: number;
  cellType: CellType;
  density: number; // 0-1, how filled the cluster should be
}

export interface TerrainGenerationConfig {
  waterCoverage: number; // 0-1 percentage of map
  roughTerrainCoverage: number; // 0-1 percentage
  clusterMinSize: number;
  clusterMaxSize: number;
  bridgeWidth: number;
  noiseScale: number; // For Perlin noise generation
}

export class TerrainGenerator {
  private grid: Grid;
  private biome: BiomeType;
  private random: () => number;
  private seed: number;

  // Default terrain configs per biome
  private static readonly BIOME_TERRAIN_CONFIGS: Record<BiomeType, TerrainGenerationConfig> = {
    [BiomeType.FOREST]: {
      waterCoverage: 0.08,  // Reduced from 0.18
      roughTerrainCoverage: 0.25,
      clusterMinSize: 3,
      clusterMaxSize: 8,
      bridgeWidth: 1,
      noiseScale: 0.1
    },
    [BiomeType.DESERT]: {
      waterCoverage: 0.01,  // Reduced from 0.02
      roughTerrainCoverage: 0.35,
      clusterMinSize: 5,
      clusterMaxSize: 12,
      bridgeWidth: 1,
      noiseScale: 0.08
    },
    [BiomeType.ARCTIC]: {
      waterCoverage: 0.12,  // Reduced from 0.25
      roughTerrainCoverage: 0.15,
      clusterMinSize: 4,
      clusterMaxSize: 10,
      bridgeWidth: 2,
      noiseScale: 0.12
    },
    [BiomeType.VOLCANIC]: {
      waterCoverage: 0.05,  // Reduced from 0.20
      roughTerrainCoverage: 0.30,
      clusterMinSize: 3,
      clusterMaxSize: 7,
      bridgeWidth: 1,
      noiseScale: 0.15
    },
    [BiomeType.GRASSLAND]: {
      waterCoverage: 0.10,  // Reduced from 0.20
      roughTerrainCoverage: 0.30,
      clusterMinSize: 4,
      clusterMaxSize: 9,
      bridgeWidth: 1,
      noiseScale: 0.09
    }
  };

  constructor(grid: Grid, biome: BiomeType, seed: number) {
    this.grid = grid;
    this.biome = biome;
    this.seed = seed;
    
    // Seeded random number generator
    let seedValue = this.seed;
    this.random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
  }

  generateTerrain(config: MapGenerationConfig): void {
    const terrainConfig = TerrainGenerator.BIOME_TERRAIN_CONFIGS[this.biome];
    
    // Generate water bodies first
    if (config.enableWater !== false) {
      this.generateWaterBodies(terrainConfig);
    }
    
    // Generate rough terrain patches
    this.generateRoughTerrain(terrainConfig);
    
    // Add strategic terrain near choke points
    if (config.chokePointCount && config.chokePointCount > 0) {
      this.addStrategicTerrain(config);
    }
    
    // Generate bridges over water where paths cross
    this.generateBridges();
    
    // Smooth terrain transitions
    this.smoothTerrainTransitions();
  }

  private generateWaterBodies(config: TerrainGenerationConfig): void {
    const totalCells = this.grid.width * this.grid.height;
    const targetWaterCells = Math.floor(totalCells * config.waterCoverage);
    
    // Generate water clusters using Perlin-like noise
    const clusters: TerrainCluster[] = [];
    const numClusters = Math.floor(this.random() * 3) + 2;
    
    for (let i = 0; i < numClusters; i++) {
      const cluster: TerrainCluster = {
        center: {
          x: Math.floor(this.random() * this.grid.width),
          y: Math.floor(this.random() * this.grid.height)
        },
        radius: config.clusterMinSize + Math.floor(this.random() * (config.clusterMaxSize - config.clusterMinSize)),
        cellType: CellType.WATER,
        density: 0.7 + this.random() * 0.3
      };
      clusters.push(cluster);
    }
    
    // Apply clusters to grid
    this.applyClusters(clusters, targetWaterCells);
  }

  private generateRoughTerrain(config: TerrainGenerationConfig): void {
    const totalCells = this.grid.width * this.grid.height;
    const targetRoughCells = Math.floor(totalCells * config.roughTerrainCoverage);
    
    // Generate rough terrain patches
    const clusters: TerrainCluster[] = [];
    const numClusters = Math.floor(this.random() * 4) + 3;
    
    for (let i = 0; i < numClusters; i++) {
      const cluster: TerrainCluster = {
        center: {
          x: Math.floor(this.random() * this.grid.width),
          y: Math.floor(this.random() * this.grid.height)
        },
        radius: config.clusterMinSize + Math.floor(this.random() * (config.clusterMaxSize - config.clusterMinSize)),
        cellType: CellType.ROUGH_TERRAIN,
        density: 0.6 + this.random() * 0.4
      };
      clusters.push(cluster);
    }
    
    // Apply clusters, avoiding water and paths
    this.applyClusters(clusters, targetRoughCells, [CellType.WATER, CellType.PATH]);
  }

  private applyClusters(clusters: TerrainCluster[], maxCells: number, avoidTypes?: CellType[]): void {
    let cellsPlaced = 0;
    
    for (const cluster of clusters) {
      if (cellsPlaced >= maxCells) break;
      
      // Use diamond-square algorithm for natural-looking clusters
      for (let dy = -cluster.radius; dy <= cluster.radius; dy++) {
        for (let dx = -cluster.radius; dx <= cluster.radius; dx++) {
          const x = cluster.center.x + dx;
          const y = cluster.center.y + dy;
          
          if (!this.grid.isInBounds(x, y)) continue;
          
          // Calculate distance from center
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > cluster.radius) continue;
          
          // Apply density falloff
          const probability = cluster.density * (1 - distance / cluster.radius);
          if (this.random() > probability) continue;
          
          // Check if we should avoid this cell
          const currentType = this.grid.getCellType(x, y);
          if (avoidTypes && avoidTypes.includes(currentType)) {
            continue;
          }
          if (currentType !== CellType.EMPTY) {
            continue;
          }
          
          // Place terrain
          this.grid.setCellType(x, y, cluster.cellType);
          cellsPlaced++;
          
          if (cellsPlaced >= maxCells) break;
        }
        if (cellsPlaced >= maxCells) break;
      }
    }
  }

  private generateBridges(): void {
    // Find all path cells
    const pathCells = this.grid.getCellsOfType(CellType.PATH);
    
    // Check each path cell for adjacent water
    for (const pathCell of pathCells) {
      const neighbors = this.grid.getNeighbors(pathCell.x, pathCell.y);
      
      let hasWaterNeighbor = false;
      for (const neighbor of neighbors) {
        if (this.grid.getCellType(neighbor.x, neighbor.y) === CellType.WATER) {
          hasWaterNeighbor = true;
          break;
        }
      }
      
      // Convert path to bridge if next to water
      if (hasWaterNeighbor) {
        this.grid.setCellType(pathCell.x, pathCell.y, CellType.BRIDGE);
      }
    }
  }

  private addStrategicTerrain(config: MapGenerationConfig): void {
    // Find choke points (narrow path sections)
    const pathCells = this.grid.getCellsOfType(CellType.PATH);
    const chokePoints: Vector2[] = [];
    
    for (const cell of pathCells) {
      // Count path neighbors
      const neighbors = this.grid.getNeighbors(cell.x, cell.y);
      let pathNeighbors = 0;
      
      for (const neighbor of neighbors) {
        if (this.grid.getCellType(neighbor.x, neighbor.y) === CellType.PATH ||
            this.grid.getCellType(neighbor.x, neighbor.y) === CellType.BRIDGE) {
          pathNeighbors++;
        }
      }
      
      // Choke point if only 2 path neighbors (straight line)
      if (pathNeighbors === 2) {
        chokePoints.push(cell);
      }
    }
    
    // Add terrain near random choke points
    const selectedPoints = this.selectRandomElements(chokePoints, Math.min(config.chokePointCount || 0, chokePoints.length));
    
    for (const point of selectedPoints) {
      // Add rough terrain or water near choke point
      const terrainType = this.random() > 0.5 ? CellType.ROUGH_TERRAIN : CellType.WATER;
      const radius = 2 + Math.floor(this.random() * 3);
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = point.x + dx;
          const y = point.y + dy;
          
          if (!this.grid.isInBounds(x, y)) continue;
          
          const cellType = this.grid.getCellType(x, y);
          if (cellType === CellType.EMPTY && this.random() > 0.3) {
            this.grid.setCellType(x, y, terrainType);
          }
        }
      }
    }
  }

  private smoothTerrainTransitions(): void {
    // Add movement speed gradients for rough terrain edges
    const roughTerrainCells = this.grid.getCellsOfType(CellType.ROUGH_TERRAIN);
    
    for (const cell of roughTerrainCells) {
      const cellData = this.grid.getCellData(cell.x, cell.y);
      if (!cellData) continue;
      
      // Check if this is an edge cell
      const neighbors = this.grid.getNeighbors(cell.x, cell.y);
      let hasNonRoughNeighbor = false;
      
      for (const neighbor of neighbors) {
        const neighborType = this.grid.getCellType(neighbor.x, neighbor.y);
        if (neighborType !== CellType.ROUGH_TERRAIN && neighborType !== CellType.WATER) {
          hasNonRoughNeighbor = true;
          break;
        }
      }
      
      // Adjust movement speed for edge cells
      if (hasNonRoughNeighbor) {
        cellData.movementSpeed = 0.7; // Slightly faster at edges
        this.grid.setCellData(cell.x, cell.y, cellData);
      }
    }
  }

  private selectRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  // Validate that paths are still accessible after terrain generation
  validateTerrain(): boolean {
    const pathCells = this.grid.getCellsOfType(CellType.PATH);
    const bridgeCells = this.grid.getCellsOfType(CellType.BRIDGE);
    
    // Check if we have a continuous path
    if (pathCells.length + bridgeCells.length < 10) {
      return false; // Path too short
    }
    
    // Simple connectivity check
    const visited = new Set<string>();
    const toVisit: Vector2[] = pathCells.length > 0 ? [pathCells[0]] : [];
    
    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      const neighbors = this.grid.getWalkableNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const neighborType = this.grid.getCellType(neighbor.x, neighbor.y);
        if (neighborType === CellType.PATH || neighborType === CellType.BRIDGE) {
          toVisit.push(neighbor);
        }
      }
    }
    
    // Check if all path cells are connected
    return visited.size >= pathCells.length * 0.7; // Allow some disconnected cells
  }
}