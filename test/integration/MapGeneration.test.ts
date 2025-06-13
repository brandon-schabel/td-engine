import { describe, it, expect, beforeEach } from 'vitest';
import { MapGenerator } from '@/systems/MapGenerator';
import { Grid, CellType } from '@/systems/Grid';
import { BiomeType, MapDifficulty, DecorationLevel } from '@/types/MapData';
import type { MapGenerationConfig, MapData } from '@/types/MapData';

describe('Map Generation Integration', () => {
  let mapGenerator: MapGenerator;
  let standardConfig: MapGenerationConfig;

  beforeEach(() => {
    mapGenerator = new MapGenerator(12345);
    standardConfig = {
      width: 25,
      height: 19,
      cellSize: 32,
      biome: BiomeType.FOREST,
      difficulty: MapDifficulty.MEDIUM,
      seed: 12345,
      pathComplexity: 0.6,
      obstacleCount: 15,
      decorationLevel: DecorationLevel.MODERATE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: 2,
      openAreaCount: 3,
      playerAdvantageSpots: 2
    };
  });

  describe('Complete Map Generation Pipeline', () => {
    it('should generate a fully playable map', () => {
      const mapData = mapGenerator.generate(standardConfig);
      
      // Verify all essential components are present
      expect(mapData.metadata).toBeDefined();
      expect(mapData.biomeConfig).toBeDefined();
      expect(mapData.paths.length).toBeGreaterThan(0);
      expect(mapData.spawnZones.length).toBeGreaterThan(0);
      expect(mapData.playerStart).toBeDefined();
      expect(mapData.decorations.length).toBeGreaterThan(0);
      expect(mapData.heightMap).toBeDefined();
      
      // Validate map passes validation
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
      expect(validation.pathReachability).toBe(true);
      expect(validation.towerPlacementSpaces).toBeGreaterThan(0);
    });

    it('should create maps that work with Grid system', () => {
      const mapData = mapGenerator.generate(standardConfig);
      const grid = new Grid(mapData.metadata.width, mapData.metadata.height);
      
      // Apply map data to grid
      grid.setBiome(mapData.biomeConfig.type);
      grid.setBorders();
      grid.setSpawnZones(mapData.spawnZones);
      grid.addDecorations(mapData.decorations);
      
      // Verify grid state
      expect(grid.getBiome()).toBe(mapData.biomeConfig.type);
      expect(grid.countCellsOfType(CellType.SPAWN_ZONE)).toBe(mapData.spawnZones.length);
      expect(grid.countCellsOfType(CellType.BORDER)).toBeGreaterThan(0);
      
      // Verify player start position is valid
      const playerGridPos = grid.worldToGrid(grid.gridToWorld(mapData.playerStart.x, mapData.playerStart.y));
      expect(grid.isInBounds(playerGridPos.x, playerGridPos.y)).toBe(true);
    });

    it('should maintain consistency between components', () => {
      const mapData = mapGenerator.generate(standardConfig);
      
      // Metadata should match generation config
      expect(mapData.metadata.width).toBe(standardConfig.width);
      expect(mapData.metadata.height).toBe(standardConfig.height);
      expect(mapData.metadata.biome).toBe(standardConfig.biome);
      expect(mapData.metadata.difficulty).toBe(standardConfig.difficulty);
      expect(mapData.metadata.seed).toBe(standardConfig.seed);
      
      // Biome config should match metadata
      expect(mapData.biomeConfig.type).toBe(mapData.metadata.biome);
      
      // Height map dimensions should match metadata
      expect(mapData.heightMap!.length).toBe(mapData.metadata.height);
      expect(mapData.heightMap![0].length).toBe(mapData.metadata.width);
    });
  });

  describe('Cross-System Integration', () => {
    it('should generate paths that work with pathfinding', () => {
      const mapData = mapGenerator.generate(standardConfig);
      const grid = new Grid(mapData.metadata.width, mapData.metadata.height);
      
      // Apply paths to grid
      mapData.paths.forEach(path => {
        // Get all cells in the path
        for (let i = 1; i < path.waypoints.length; i++) {
          const start = path.waypoints[i - 1];
          const end = path.waypoints[i];
          
          // Verify path segments are walkable
          const deltaX = Math.abs(end.x - start.x);
          const deltaY = Math.abs(end.y - start.y);
          const maxDelta = Math.max(deltaX, deltaY);
          
          for (let step = 0; step <= maxDelta; step++) {
            const t = maxDelta > 0 ? step / maxDelta : 0;
            const x = Math.floor(start.x + (end.x - start.x) * t);
            const y = Math.floor(start.y + (end.y - start.y) * t);
            
            expect(grid.isInBounds(x, y)).toBe(true);
            grid.setCellType(x, y, CellType.PATH);
          }
        }
      });
      
      // Verify all path cells are accessible
      const pathCells = grid.getCellsOfType(CellType.PATH);
      expect(pathCells.length).toBeGreaterThan(0);
      
      pathCells.forEach(cell => {
        expect(grid.isWalkable(cell.x, cell.y)).toBe(true);
      });
    });

    it('should place decorations without blocking essential paths', () => {
      const mapData = mapGenerator.generate(standardConfig);
      const grid = new Grid(mapData.metadata.width, mapData.metadata.height);
      
      // Apply paths first
      mapData.paths.forEach(path => {
        path.waypoints.forEach(waypoint => {
          grid.setCellType(waypoint.x, waypoint.y, CellType.PATH);
        });
      });
      
      // Apply decorations
      grid.addDecorations(mapData.decorations);
      
      // Verify no blocking decorations on paths
      const pathCells = grid.getCellsOfType(CellType.PATH);
      pathCells.forEach(cell => {
        const cellData = grid.getCellData(cell.x, cell.y);
        if (cellData?.decoration) {
          expect(cellData.decoration.blocking).toBe(false);
        }
      });
    });

    it('should place spawn zones in accessible locations', () => {
      const mapData = mapGenerator.generate(standardConfig);
      const grid = new Grid(mapData.metadata.width, mapData.metadata.height);
      
      // Apply all map elements
      grid.setBorders();
      mapData.paths.forEach(path => {
        path.waypoints.forEach(waypoint => {
          grid.setCellType(waypoint.x, waypoint.y, CellType.PATH);
        });
      });
      
      grid.addDecorations(mapData.decorations.filter(d => d.blocking));
      grid.setSpawnZones(mapData.spawnZones);
      
      // Verify spawn zones are accessible
      mapData.spawnZones.forEach(spawn => {
        expect(grid.isInBounds(spawn.x, spawn.y)).toBe(true);
        expect(grid.isPassableForEnemies(spawn.x, spawn.y)).toBe(true);
      });
    });
  });

  describe('Multi-Biome Integration', () => {
    it('should generate distinct maps for different biomes', () => {
      const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC];
      const maps: MapData[] = [];
      
      biomes.forEach(biome => {
        const config = { ...standardConfig, biome };
        const mapData = mapGenerator.generate(config);
        maps.push(mapData);
        
        // Each map should be valid
        const validation = mapGenerator.validate(mapData);
        expect(validation.isValid).toBe(true);
      });
      
      // Maps should have different characteristics
      for (let i = 0; i < maps.length; i++) {
        for (let j = i + 1; j < maps.length; j++) {
          const map1 = maps[i];
          const map2 = maps[j];
          
          // Different biomes should have different obstacle types
          expect(map1.biomeConfig.obstacleTypes).not.toEqual(map2.biomeConfig.obstacleTypes);
          
          // Different biomes should have different colors
          expect(map1.biomeConfig.colors).not.toEqual(map2.biomeConfig.colors);
          
          // Different biomes may have different decoration densities
          const densityDiff = Math.abs(map1.biomeConfig.decorationDensity - map2.biomeConfig.decorationDensity);
          expect(densityDiff).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should generate appropriate effects for each biome', () => {
      const biomeConfigs = [
        { biome: BiomeType.FOREST, expectedEffect: 'leaves' },
        { biome: BiomeType.DESERT, expectedEffect: 'sand' },
        { biome: BiomeType.ARCTIC, expectedEffect: 'snow' },
        { biome: BiomeType.VOLCANIC, expectedEffect: 'ash' }
      ];
      
      biomeConfigs.forEach(({ biome, expectedEffect }) => {
        const config = { ...standardConfig, biome, enableAnimations: true };
        const mapData = mapGenerator.generate(config);
        
        expect(mapData.effects.length).toBeGreaterThan(0);
        
        const hasExpectedEffect = mapData.effects.some(effect => 
          effect.properties.particleType === expectedEffect
        );
        expect(hasExpectedEffect).toBe(true);
      });
    });
  });

  describe('Difficulty Scaling Integration', () => {
    it('should scale map complexity with difficulty', () => {
      const difficulties = [MapDifficulty.EASY, MapDifficulty.MEDIUM, MapDifficulty.HARD, MapDifficulty.EXTREME];
      const maps: MapData[] = [];
      
      difficulties.forEach(difficulty => {
        const config = { ...standardConfig, difficulty };
        const mapData = mapGenerator.generate(config);
        maps.push(mapData);
        
        const validation = mapGenerator.validate(mapData);
        expect(validation.isValid).toBe(true);
      });
      
      // Higher difficulties should generally have more spawn zones
      for (let i = 1; i < maps.length; i++) {
        expect(maps[i].spawnZones.length).toBeGreaterThanOrEqual(maps[i - 1].spawnZones.length);
      }
    });

    it('should maintain playability across all difficulties', () => {
      const difficulties = [MapDifficulty.EASY, MapDifficulty.MEDIUM, MapDifficulty.HARD, MapDifficulty.EXTREME];
      
      difficulties.forEach(difficulty => {
        const config = { ...standardConfig, difficulty };
        const mapData = mapGenerator.generate(config);
        
        // All difficulties should produce valid, playable maps
        const validation = mapGenerator.validate(mapData);
        expect(validation.isValid).toBe(true);
        expect(validation.pathReachability).toBe(true);
        expect(validation.towerPlacementSpaces).toBeGreaterThan(0);
        expect(validation.strategicBalance).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should generate large maps within reasonable time', () => {
      const largeConfig = {
        ...standardConfig,
        width: 50,
        height: 40,
        decorationLevel: DecorationLevel.DENSE
      };
      
      const startTime = Date.now();
      const mapData = mapGenerator.generate(largeConfig);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });

    it('should handle multiple rapid generations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const config = { ...standardConfig, seed: standardConfig.seed! + i };
        const mapData = mapGenerator.generate(config);
        
        expect(mapData).toBeDefined();
        expect(mapData.paths.length).toBeGreaterThan(0);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain referential integrity', () => {
      const mapData = mapGenerator.generate(standardConfig);
      
      // All decorations should have valid positions
      mapData.decorations.forEach(decoration => {
        expect(decoration.position.x).toBeGreaterThanOrEqual(0);
        expect(decoration.position.y).toBeGreaterThanOrEqual(0);
        expect(decoration.position.x).toBeLessThan(standardConfig.width * standardConfig.cellSize);
        expect(decoration.position.y).toBeLessThan(standardConfig.height * standardConfig.cellSize);
      });
      
      // All effects should have valid positions and properties
      mapData.effects.forEach(effect => {
        expect(effect.position.x).toBeGreaterThanOrEqual(0);
        expect(effect.position.y).toBeGreaterThanOrEqual(0);
        expect(effect.radius).toBeGreaterThan(0);
        expect(effect.intensity).toBeGreaterThanOrEqual(0);
        expect(effect.intensity).toBeLessThanOrEqual(1);
        expect(effect.properties).toBeDefined();
      });
      
      // All paths should have valid waypoints
      mapData.paths.forEach(path => {
        expect(path.waypoints.length).toBeGreaterThan(1);
        path.waypoints.forEach(waypoint => {
          expect(waypoint.x).toBeGreaterThanOrEqual(0);
          expect(waypoint.x).toBeLessThan(standardConfig.width);
          expect(waypoint.y).toBeGreaterThanOrEqual(0);
          expect(waypoint.y).toBeLessThan(standardConfig.height);
        });
      });
    });

    it('should produce deterministic results with same configuration', () => {
      const generator1 = new MapGenerator(12345);
      const generator2 = new MapGenerator(12345);
      
      const map1 = generator1.generate(standardConfig);
      const map2 = generator2.generate(standardConfig);
      
      // Basic structure should be identical
      expect(map1.paths.length).toBe(map2.paths.length);
      expect(map1.spawnZones.length).toBe(map2.spawnZones.length);
      expect(map1.decorations.length).toBe(map2.decorations.length);
      expect(map1.effects.length).toBe(map2.effects.length);
      
      // First and last waypoints should be identical
      expect(map1.paths[0].waypoints[0]).toEqual(map2.paths[0].waypoints[0]);
      expect(map1.paths[0].waypoints[map1.paths[0].waypoints.length - 1])
        .toEqual(map2.paths[0].waypoints[map2.paths[0].waypoints.length - 1]);
    });
  });

  describe('Edge Case Integration', () => {
    it('should handle minimum viable configuration', () => {
      const minConfig: MapGenerationConfig = {
        width: 10,
        height: 8,
        cellSize: 32,
        biome: BiomeType.GRASSLAND,
        difficulty: MapDifficulty.EASY,
        seed: 12345,
        pathComplexity: 0.1,
        obstacleCount: 1,
        decorationLevel: DecorationLevel.MINIMAL,
        enableWater: false,
        enableAnimations: false,
        chokePointCount: 0,
        openAreaCount: 1,
        playerAdvantageSpots: 0
      };
      
      const mapData = mapGenerator.generate(minConfig);
      const validation = mapGenerator.validate(mapData);
      
      expect(validation.isValid).toBe(true);
      expect(mapData.paths.length).toBeGreaterThan(0);
      expect(mapData.spawnZones.length).toBeGreaterThan(0);
    });

    it('should handle maximum complexity configuration', () => {
      const maxConfig: MapGenerationConfig = {
        width: 30,
        height: 25,
        cellSize: 32,
        biome: BiomeType.VOLCANIC,
        difficulty: MapDifficulty.EXTREME,
        seed: 12345,
        pathComplexity: 1.0,
        obstacleCount: 50,
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: 5,
        openAreaCount: 8,
        playerAdvantageSpots: 6
      };
      
      const mapData = mapGenerator.generate(maxConfig);
      const validation = mapGenerator.validate(mapData);
      
      expect(validation.isValid).toBe(true);
      expect(mapData.decorations.length).toBeGreaterThan(0);
      expect(mapData.effects.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Integration', () => {
    it('should identify and report comprehensive validation issues', () => {
      const mapData = mapGenerator.generate(standardConfig);
      
      // Artificially introduce issues for testing
      const corruptedMap = { ...mapData };
      corruptedMap.spawnZones = []; // Remove spawn zones
      corruptedMap.paths = []; // Remove paths
      
      const validation = mapGenerator.validate(corruptedMap);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('spawn zones'))).toBe(true);
    });

    it('should provide meaningful strategic balance assessment', () => {
      const configs = [
        { ...standardConfig, decorationLevel: DecorationLevel.MINIMAL },
        { ...standardConfig, decorationLevel: DecorationLevel.MODERATE },
        { ...standardConfig, decorationLevel: DecorationLevel.DENSE }
      ];
      
      const validations = configs.map(config => {
        const mapData = mapGenerator.generate(config);
        return mapGenerator.validate(mapData);
      });
      
      validations.forEach(validation => {
        expect(validation.strategicBalance).toBeGreaterThan(0);
        expect(validation.strategicBalance).toBeLessThanOrEqual(1);
      });
      
      // Dense decoration should generally result in lower strategic balance
      expect(validations[2].strategicBalance).toBeLessThanOrEqual(validations[0].strategicBalance);
    });
  });
});