import { describe, it, expect, beforeEach } from 'bun:test';
import { TerrainGenerator } from '../TerrainGenerator';
import { Grid, CellType } from '../Grid';
import { BiomeType } from '@/types/MapData';
import type { MapGenerationConfig } from '@/types/MapData';

describe('TerrainGenerator', () => {
  let grid: Grid;
  let generator: TerrainGenerator;
  const seed = 12345;

  beforeEach(() => {
    grid = new Grid(20, 20, 32);
    generator = new TerrainGenerator(grid, BiomeType.FOREST, seed);
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(generator).toBeDefined();
      expect((generator as any).grid).toBe(grid);
      expect((generator as any).biome).toBe(BiomeType.FOREST);
      expect((generator as any).seed).toBe(seed);
    });

    it('should create seeded random generator', () => {
      const random1 = (generator as any).random();
      const random2 = (generator as any).random();
      
      // Create new generator with same seed
      const generator2 = new TerrainGenerator(grid, BiomeType.FOREST, seed);
      const random3 = (generator2 as any).random();
      const random4 = (generator2 as any).random();
      
      expect(random1).toBe(random3);
      expect(random2).toBe(random4);
    });
  });

  describe('generateTerrain', () => {
    const baseConfig: MapGenerationConfig = {
      width: 20,
      height: 20,
      cellSize: 32,
      biome: BiomeType.FOREST,
      difficulty: 'MEDIUM' as any,
      pathComplexity: 0.5,
      obstacleCount: 10,
      decorationLevel: 'MODERATE' as any,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: 2,
      openAreaCount: 1,
      playerAdvantageSpots: 1
    };

    it('should generate water bodies when enabled', () => {
      generator.generateTerrain(baseConfig);
      
      const waterCells = grid.getCellsOfType(CellType.WATER);
      expect(waterCells.length).toBeGreaterThan(0);
    });

    it('should not generate water when disabled', () => {
      const config = { ...baseConfig, enableWater: false };
      generator.generateTerrain(config);
      
      const waterCells = grid.getCellsOfType(CellType.WATER);
      expect(waterCells.length).toBe(0);
    });

    it('should generate rough terrain', () => {
      generator.generateTerrain(baseConfig);
      
      const roughCells = grid.getCellsOfType(CellType.ROUGH_TERRAIN);
      expect(roughCells.length).toBeGreaterThan(0);
    });

    it('should generate bridges over water near paths', () => {
      // Create a path
      for (let x = 0; x < 10; x++) {
        grid.setCellType(x, 10, CellType.PATH);
      }
      
      // Add water crossing the path
      for (let x = 4; x < 6; x++) {
        grid.setCellType(x, 10, CellType.WATER);
      }
      
      generator.generateTerrain(baseConfig);
      
      // Should have converted water cells on path to bridges
      expect(grid.getCellType(4, 10)).toBe(CellType.BRIDGE);
      expect(grid.getCellType(5, 10)).toBe(CellType.BRIDGE);
    });
  });

  describe('terrain generation by biome', () => {
    const config: MapGenerationConfig = {
      width: 20,
      height: 20,
      cellSize: 32,
      biome: BiomeType.FOREST,
      difficulty: 'MEDIUM' as any,
      pathComplexity: 0.5,
      obstacleCount: 0,
      decorationLevel: 'NONE' as any,
      enableWater: true
    };

    it('should generate appropriate terrain for forest biome', () => {
      const forestGen = new TerrainGenerator(grid, BiomeType.FOREST, seed);
      forestGen.generateTerrain({ ...config, biome: BiomeType.FOREST });
      
      const waterCells = grid.getCellsOfType(CellType.WATER);
      const roughCells = grid.getCellsOfType(CellType.ROUGH_TERRAIN);
      
      // Forest should have moderate water and rough terrain
      expect(waterCells.length).toBeGreaterThan(10);
      expect(roughCells.length).toBeGreaterThan(15);
    });

    it('should generate appropriate terrain for desert biome', () => {
      const desertGrid = new Grid(20, 20, 32);
      const desertGen = new TerrainGenerator(desertGrid, BiomeType.DESERT, seed);
      desertGen.generateTerrain({ ...config, biome: BiomeType.DESERT });
      
      const waterCells = desertGrid.getCellsOfType(CellType.WATER);
      const roughCells = desertGrid.getCellsOfType(CellType.ROUGH_TERRAIN);
      
      // Desert should have less water, more rough terrain
      expect(waterCells.length).toBeLessThan(10);
      expect(roughCells.length).toBeGreaterThan(20);
    });

    it('should generate appropriate terrain for arctic biome', () => {
      const arcticGrid = new Grid(20, 20, 32);
      const arcticGen = new TerrainGenerator(arcticGrid, BiomeType.ARCTIC, seed);
      arcticGen.generateTerrain({ ...config, biome: BiomeType.ARCTIC });
      
      const waterCells = arcticGrid.getCellsOfType(CellType.WATER);
      
      // Arctic should have more water (frozen lakes)
      expect(waterCells.length).toBeGreaterThan(20);
    });
  });

  describe('strategic terrain placement', () => {
    it('should add terrain near choke points', () => {
      // Create a choke point (narrow path)
      grid.setCellType(10, 10, CellType.PATH);
      grid.setCellType(10, 9, CellType.PATH);
      grid.setCellType(10, 11, CellType.PATH);
      
      const config: MapGenerationConfig = {
        width: 20,
        height: 20,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: 'MEDIUM' as any,
        pathComplexity: 0.5,
        obstacleCount: 0,
        decorationLevel: 'NONE' as any,
        chokePointCount: 1
      };
      
      generator.generateTerrain(config);
      
      // Should have terrain near the choke point
      let terrainNearChoke = 0;
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          const cellType = grid.getCellType(10 + dx, 10 + dy);
          if (cellType === CellType.WATER || cellType === CellType.ROUGH_TERRAIN) {
            terrainNearChoke++;
          }
        }
      }
      
      expect(terrainNearChoke).toBeGreaterThan(0);
    });
  });

  describe('terrain validation', () => {
    it('should validate continuous paths', () => {
      // Create a simple path
      for (let x = 0; x < 10; x++) {
        grid.setCellType(x, 10, CellType.PATH);
      }
      
      const isValid = generator.validateTerrain();
      expect(isValid).toBe(true);
    });

    it('should detect broken paths', () => {
      // Create disconnected path segments
      for (let x = 0; x < 5; x++) {
        grid.setCellType(x, 10, CellType.PATH);
      }
      for (let x = 7; x < 10; x++) {
        grid.setCellType(x, 10, CellType.PATH);
      }
      
      const isValid = generator.validateTerrain();
      expect(isValid).toBe(false);
    });

    it('should accept mostly connected paths', () => {
      // Create a long path with a few disconnected cells
      for (let x = 0; x < 20; x++) {
        grid.setCellType(x, 10, CellType.PATH);
      }
      // Add a few disconnected cells
      grid.setCellType(0, 5, CellType.PATH);
      grid.setCellType(1, 5, CellType.PATH);
      
      const isValid = generator.validateTerrain();
      expect(isValid).toBe(true); // 20/22 cells connected > 80%
    });
  });

  describe('terrain transitions', () => {
    it('should smooth rough terrain edges', () => {
      // Create rough terrain patch
      for (let x = 5; x < 8; x++) {
        for (let y = 5; y < 8; y++) {
          grid.setCellType(x, y, CellType.ROUGH_TERRAIN);
        }
      }
      
      const config: MapGenerationConfig = {
        width: 20,
        height: 20,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: 'MEDIUM' as any,
        pathComplexity: 0.5,
        obstacleCount: 0,
        decorationLevel: 'NONE' as any
      };
      
      generator.generateTerrain(config);
      
      // Check edge cells have adjusted movement speed
      const edgeCell = grid.getCellData(5, 5);
      if (edgeCell && edgeCell.type === CellType.ROUGH_TERRAIN) {
        expect(edgeCell.movementSpeed).toBe(0.7); // Edge speed
      }
      
      // Check center cells keep original speed
      const centerCell = grid.getCellData(6, 6);
      if (centerCell && centerCell.type === CellType.ROUGH_TERRAIN) {
        expect(centerCell.movementSpeed).toBeUndefined(); // Uses default
      }
    });
  });

  describe('cluster generation', () => {
    it('should respect density when generating clusters', () => {
      // Test private method indirectly through water generation
      const config: MapGenerationConfig = {
        width: 30,
        height: 30,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: 'MEDIUM' as any,
        pathComplexity: 0.5,
        obstacleCount: 0,
        decorationLevel: 'NONE' as any,
        enableWater: true
      };
      
      const largeGrid = new Grid(30, 30, 32);
      const largeGen = new TerrainGenerator(largeGrid, BiomeType.FOREST, seed);
      largeGen.generateTerrain(config);
      
      const waterCells = largeGrid.getCellsOfType(CellType.WATER);
      const totalCells = 30 * 30;
      const waterPercentage = waterCells.length / totalCells;
      
      // Should be close to biome water coverage setting (15% for forest)
      expect(waterPercentage).toBeGreaterThan(0.10);
      expect(waterPercentage).toBeLessThan(0.20);
    });

    it('should avoid placing terrain on paths', () => {
      // Create a grid filled with paths
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          grid.setCellType(x, y, CellType.PATH);
        }
      }
      
      const config: MapGenerationConfig = {
        width: 20,
        height: 20,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: 'MEDIUM' as any,
        pathComplexity: 0.5,
        obstacleCount: 0,
        decorationLevel: 'NONE' as any
      };
      
      generator.generateTerrain(config);
      
      // Rough terrain should not be placed on paths
      const roughCells = grid.getCellsOfType(CellType.ROUGH_TERRAIN);
      expect(roughCells.length).toBe(0);
    });
  });
});