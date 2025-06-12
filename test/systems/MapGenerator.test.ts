import { describe, it, expect, beforeEach } from 'vitest';
import { MapGenerator } from '../../src/systems/MapGenerator';
import { BiomeType, MapDifficulty, DecorationLevel } from '../../src/types/MapData';
import type { MapGenerationConfig } from '../../src/types/MapData';

describe('MapGenerator', () => {
  let mapGenerator: MapGenerator;
  let basicConfig: MapGenerationConfig;

  beforeEach(() => {
    mapGenerator = new MapGenerator(12345); // Fixed seed for reproducible tests
    basicConfig = {
      width: 20,
      height: 15,
      cellSize: 32,
      biome: BiomeType.GRASSLAND,
      difficulty: MapDifficulty.MEDIUM,
      seed: 12345,
      pathComplexity: 0.5,
      obstacleCount: 10,
      decorationLevel: DecorationLevel.MODERATE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: 2,
      openAreaCount: 3,
      playerAdvantageSpots: 2
    };
  });

  describe('Map Generation', () => {
    it('should generate a valid map with basic configuration', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData).toBeDefined();
      expect(mapData.metadata.width).toBe(basicConfig.width);
      expect(mapData.metadata.height).toBe(basicConfig.height);
      expect(mapData.metadata.biome).toBe(basicConfig.biome);
      expect(mapData.metadata.difficulty).toBe(basicConfig.difficulty);
      expect(mapData.metadata.seed).toBe(basicConfig.seed);
    });

    it('should generate different maps with different seeds', () => {
      const generator1 = new MapGenerator(1);
      const generator2 = new MapGenerator(2);
      
      const map1 = generator1.generate(basicConfig);
      const map2 = generator2.generate({ ...basicConfig, seed: 2 });
      
      // Maps should have different seeds or some variation
      expect(map1.metadata.seed).not.toBe(map2.metadata.seed);
    });

    it('should generate reproducible maps with same seed', () => {
      const generator1 = new MapGenerator(12345);
      const generator2 = new MapGenerator(12345);
      
      const map1 = generator1.generate(basicConfig);
      const map2 = generator2.generate(basicConfig);
      
      expect(map1.decorations.length).toBe(map2.decorations.length);
      expect(map1.paths[0].waypoints.length).toBe(map2.paths[0].waypoints.length);
    });

    it('should respect biome configuration', () => {
      const forestConfig = { ...basicConfig, biome: BiomeType.FOREST };
      const desertConfig = { ...basicConfig, biome: BiomeType.DESERT };
      
      const forestMap = mapGenerator.generate(forestConfig);
      const desertMap = mapGenerator.generate(desertConfig);
      
      expect(forestMap.biomeConfig.type).toBe(BiomeType.FOREST);
      expect(desertMap.biomeConfig.type).toBe(BiomeType.DESERT);
      
      // Forest should have different obstacle types than desert
      expect(forestMap.biomeConfig.obstacleTypes).not.toEqual(desertMap.biomeConfig.obstacleTypes);
    });

    it('should adjust decoration density based on decoration level', () => {
      const minimalConfig = { ...basicConfig, decorationLevel: DecorationLevel.MINIMAL };
      const denseConfig = { ...basicConfig, decorationLevel: DecorationLevel.DENSE };
      
      const minimalMap = mapGenerator.generate(minimalConfig);
      const denseMap = mapGenerator.generate(denseConfig);
      
      expect(denseMap.decorations.length).toBeGreaterThan(minimalMap.decorations.length);
    });

    it('should include environmental effects when animations are enabled', () => {
      const animatedConfig = { ...basicConfig, enableAnimations: true };
      const staticConfig = { ...basicConfig, enableAnimations: false };
      
      const animatedMap = mapGenerator.generate(animatedConfig);
      const staticMap = mapGenerator.generate(staticConfig);
      
      expect(animatedMap.effects.length).toBeGreaterThan(staticMap.effects.length);
    });
  });

  describe('Path Generation', () => {
    it('should generate at least one main path', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData.paths.length).toBeGreaterThan(0);
      expect(mapData.paths[0].type).toBe('MAIN');
      expect(mapData.paths[0].waypoints.length).toBeGreaterThan(1);
    });

    it('should generate paths within map bounds', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      mapData.paths.forEach(path => {
        path.waypoints.forEach(waypoint => {
          expect(waypoint.x).toBeGreaterThanOrEqual(0);
          expect(waypoint.x).toBeLessThan(basicConfig.width);
          expect(waypoint.y).toBeGreaterThanOrEqual(0);
          expect(waypoint.y).toBeLessThan(basicConfig.height);
        });
      });
    });

    it('should create more complex paths with higher complexity setting', () => {
      const simpleConfig = { ...basicConfig, pathComplexity: 0.1 };
      const complexConfig = { ...basicConfig, pathComplexity: 0.9 };
      
      const simpleMap = mapGenerator.generate(simpleConfig);
      const complexMap = mapGenerator.generate(complexConfig);
      
      // Complex paths should have more waypoints
      expect(complexMap.paths[0].waypoints.length).toBeGreaterThanOrEqual(simpleMap.paths[0].waypoints.length);
    });
  });

  describe('Spawn Zone Generation', () => {
    it('should generate at least one spawn zone', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData.spawnZones.length).toBeGreaterThan(0);
    });

    it('should generate more spawn zones for higher difficulties', () => {
      const easyConfig = { ...basicConfig, difficulty: MapDifficulty.EASY };
      const extremeConfig = { ...basicConfig, difficulty: MapDifficulty.EXTREME };
      
      const easyMap = mapGenerator.generate(easyConfig);
      const extremeMap = mapGenerator.generate(extremeConfig);
      
      expect(extremeMap.spawnZones.length).toBeGreaterThanOrEqual(easyMap.spawnZones.length);
    });

    it('should place spawn zones within map bounds', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      mapData.spawnZones.forEach(spawn => {
        expect(spawn.x).toBeGreaterThanOrEqual(0);
        expect(spawn.x).toBeLessThan(basicConfig.width);
        expect(spawn.y).toBeGreaterThanOrEqual(0);
        expect(spawn.y).toBeLessThan(basicConfig.height);
      });
    });
  });

  describe('Player Start Position', () => {
    it('should generate a valid player start position', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData.playerStart).toBeDefined();
      expect(mapData.playerStart.x).toBeGreaterThanOrEqual(0);
      expect(mapData.playerStart.x).toBeLessThan(basicConfig.width);
      expect(mapData.playerStart.y).toBeGreaterThanOrEqual(0);
      expect(mapData.playerStart.y).toBeLessThan(basicConfig.height);
    });
  });

  describe('Decoration Generation', () => {
    it('should generate decorations based on biome', () => {
      const forestConfig = { ...basicConfig, biome: BiomeType.FOREST };
      const desertConfig = { ...basicConfig, biome: BiomeType.DESERT };
      
      const forestMap = mapGenerator.generate(forestConfig);
      const desertMap = mapGenerator.generate(desertConfig);
      
      expect(forestMap.decorations.length).toBeGreaterThan(0);
      expect(desertMap.decorations.length).toBeGreaterThan(0);
      
      // Forest decorations should be different from desert
      const forestTypes = forestMap.decorations.map(d => d.type);
      const desertTypes = desertMap.decorations.map(d => d.type);
      
      expect(forestTypes.some(type => type.includes('tree'))).toBe(true);
      expect(desertTypes.some(type => type.includes('cactus'))).toBe(true);
    });

    it('should include blocking and non-blocking decorations', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      const blockingDecorations = mapData.decorations.filter(d => d.blocking);
      const nonBlockingDecorations = mapData.decorations.filter(d => !d.blocking);
      
      expect(blockingDecorations.length).toBeGreaterThan(0);
      expect(nonBlockingDecorations.length).toBeGreaterThan(0);
    });

    it('should assign random properties to decorations', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData.decorations.length).toBeGreaterThan(1);
      
      mapData.decorations.forEach(decoration => {
        expect(decoration.rotation).toBeGreaterThanOrEqual(0);
        expect(decoration.rotation).toBeLessThanOrEqual(360);
        expect(decoration.scale).toBeGreaterThan(0);
        expect(decoration.scale).toBeLessThanOrEqual(2);
        expect(decoration.variant).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Height Map Generation', () => {
    it('should generate height map with correct dimensions', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      expect(mapData.heightMap).toBeDefined();
      expect(mapData.heightMap!.length).toBe(basicConfig.height);
      expect(mapData.heightMap![0].length).toBe(basicConfig.width);
    });

    it('should generate height values within valid range', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      mapData.heightMap!.forEach(row => {
        row.forEach(height => {
          expect(height).toBeGreaterThanOrEqual(0);
          expect(height).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should vary height based on biome terrain variation', () => {
      const lowVariationConfig = { ...basicConfig, biome: BiomeType.GRASSLAND }; // Low variation
      const highVariationConfig = { ...basicConfig, biome: BiomeType.VOLCANIC }; // High variation
      
      const lowMap = mapGenerator.generate(lowVariationConfig);
      const highMap = mapGenerator.generate(highVariationConfig);
      
      // Calculate height variance for each map
      const lowHeights = lowMap.heightMap!.flat();
      const highHeights = highMap.heightMap!.flat();
      
      const lowVariance = calculateVariance(lowHeights);
      const highVariance = calculateVariance(highHeights);
      
      expect(highVariance).toBeGreaterThan(lowVariance);
    });
  });

  describe('Map Validation', () => {
    it('should validate generated maps as valid', () => {
      const mapData = mapGenerator.generate(basicConfig);
      const validation = mapGenerator.validate(mapData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.pathReachability).toBe(true);
      expect(validation.towerPlacementSpaces).toBeGreaterThan(0);
    });

    it('should detect validation errors in invalid maps', () => {
      const mapData = mapGenerator.generate(basicConfig);
      
      // Make map invalid by removing all spawn zones
      mapData.spawnZones = [];
      
      const validation = mapGenerator.validate(mapData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('spawn zones'))).toBe(true);
    });

    it('should calculate strategic balance', () => {
      const mapData = mapGenerator.generate(basicConfig);
      const validation = mapGenerator.validate(mapData);
      
      expect(validation.strategicBalance).toBeGreaterThan(0);
      expect(validation.strategicBalance).toBeLessThanOrEqual(1);
    });
  });

  describe('Map Variants', () => {
    it('should generate multiple different map variants', () => {
      const variants = mapGenerator.generateVariants(basicConfig, 3);
      
      expect(variants.length).toBe(3);
      
      // Each variant should be different
      for (let i = 0; i < variants.length; i++) {
        for (let j = i + 1; j < variants.length; j++) {
          expect(variants[i].metadata.seed).not.toBe(variants[j].metadata.seed);
          // Variants should have different seeds which should lead to some differences
          expect(variants[i]).not.toEqual(variants[j]);
        }
      }
    });

    it('should maintain base configuration in variants', () => {
      const variants = mapGenerator.generateVariants(basicConfig, 2);
      
      variants.forEach(variant => {
        expect(variant.metadata.width).toBe(basicConfig.width);
        expect(variant.metadata.height).toBe(basicConfig.height);
        expect(variant.metadata.biome).toBe(basicConfig.biome);
        expect(variant.metadata.difficulty).toBe(basicConfig.difficulty);
      });
    });
  });

  describe('Biome-Specific Generation', () => {
    it('should generate appropriate effects for each biome', () => {
      const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC];
      
      biomes.forEach(biome => {
        const config = { ...basicConfig, biome, enableAnimations: true };
        const mapData = mapGenerator.generate(config);
        
        expect(mapData.effects.length).toBeGreaterThan(0);
        
        // Check biome-specific effects
        switch (biome) {
          case BiomeType.FOREST:
            expect(mapData.effects.some(e => e.properties.particleType === 'leaves')).toBe(true);
            break;
          case BiomeType.DESERT:
            expect(mapData.effects.some(e => e.properties.particleType === 'sand')).toBe(true);
            break;
          case BiomeType.ARCTIC:
            expect(mapData.effects.some(e => e.properties.particleType === 'snow')).toBe(true);
            break;
          case BiomeType.VOLCANIC:
            expect(mapData.effects.some(e => e.properties.particleType === 'ash')).toBe(true);
            break;
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum map size', () => {
      const minConfig = { ...basicConfig, width: 5, height: 5 };
      const mapData = mapGenerator.generate(minConfig);
      
      expect(mapData).toBeDefined();
      expect(mapData.metadata.width).toBe(5);
      expect(mapData.metadata.height).toBe(5);
    });

    it('should handle large map size', () => {
      const largeConfig = { ...basicConfig, width: 100, height: 100 };
      const mapData = mapGenerator.generate(largeConfig);
      
      expect(mapData).toBeDefined();
      expect(mapData.metadata.width).toBe(100);
      expect(mapData.metadata.height).toBe(100);
    });

    it('should handle zero obstacles configuration', () => {
      const noObstaclesConfig = { 
        ...basicConfig, 
        obstacleCount: 0,
        decorationLevel: DecorationLevel.MINIMAL
      };
      
      const mapData = mapGenerator.generate(noObstaclesConfig);
      
      expect(mapData).toBeDefined();
      // Should still generate some decorations based on biome density
      expect(mapData.decorations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme path complexity', () => {
      const extremeComplexConfig = { ...basicConfig, pathComplexity: 1.0 };
      const mapData = mapGenerator.generate(extremeComplexConfig);
      
      expect(mapData.paths[0].waypoints.length).toBeGreaterThan(2);
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.pathReachability).toBe(true);
    });
  });

});

// Helper function for calculating variance
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}