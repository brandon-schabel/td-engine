import { describe, it, expect } from 'vitest';
import { MapGenerator } from '@/systems/MapGenerator';
import { TextureManager } from '@/systems/TextureManager';
import { BiomeType, MapDifficulty, DecorationLevel } from '@/types/MapData';
import type { MapGenerationConfig } from '@/types/MapData';

describe('Game Map Integration - Simple', () => {
  it('should successfully generate maps for game use', () => {
    const mapGenerator = new MapGenerator();
    const textureManager = new TextureManager();
    
    const config: MapGenerationConfig = {
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

    const mapData = mapGenerator.generate(config);
    
    // Verify map is valid for game use
    expect(mapData).toBeDefined();
    expect(mapData.metadata.width).toBe(25);
    expect(mapData.metadata.height).toBe(19);
    expect(mapData.paths.length).toBeGreaterThan(0);
    expect(mapData.spawnZones.length).toBeGreaterThan(0);
    expect(mapData.playerStart).toBeDefined();
    expect(mapData.decorations.length).toBeGreaterThan(0);
    
    // Validate the map
    const validation = mapGenerator.validate(mapData);
    expect(validation.isValid).toBe(true);
    expect(validation.pathReachability).toBe(true);
  });

  it('should generate maps for different biomes suitable for game', () => {
    const mapGenerator = new MapGenerator();
    const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
    
    biomes.forEach(biome => {
      const config: MapGenerationConfig = {
        width: 20,
        height: 15,
        cellSize: 32,
        biome,
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

      const mapData = mapGenerator.generate(config);
      
      expect(mapData.biomeConfig.type).toBe(biome);
      expect(mapData.decorations.length).toBeGreaterThan(0);
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should have proper texture sets for all biomes', () => {
    const textureManager = new TextureManager();
    const biomes = ['FOREST', 'DESERT', 'ARCTIC', 'VOLCANIC', 'GRASSLAND'];
    
    biomes.forEach(biome => {
      const textureSet = textureManager.getBiomeTextureSet(biome);
      expect(textureSet).not.toBeNull();
      expect(textureSet!.ground.length).toBeGreaterThan(0);
      expect(textureSet!.decorations.length).toBeGreaterThan(0);
      expect(textureSet!.obstacles.length).toBeGreaterThan(0);
      expect(textureSet!.effects.length).toBeGreaterThan(0);
    });
  });

  it('should generate valid player start positions', () => {
    const mapGenerator = new MapGenerator();
    
    for (let i = 0; i < 5; i++) {
      const config: MapGenerationConfig = {
        width: 25,
        height: 19,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: MapDifficulty.MEDIUM,
        seed: Date.now() + i,
        pathComplexity: 0.6,
        obstacleCount: 15,
        decorationLevel: DecorationLevel.MODERATE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: 2,
        openAreaCount: 3,
        playerAdvantageSpots: 2
      };

      const mapData = mapGenerator.generate(config);
      
      // Player start should be within bounds
      expect(mapData.playerStart.x).toBeGreaterThanOrEqual(0);
      expect(mapData.playerStart.x).toBeLessThan(config.width);
      expect(mapData.playerStart.y).toBeGreaterThanOrEqual(0);
      expect(mapData.playerStart.y).toBeLessThan(config.height);
    }
  });

  it('should generate maps suitable for different difficulties', () => {
    const mapGenerator = new MapGenerator();
    const difficulties = [MapDifficulty.EASY, MapDifficulty.MEDIUM, MapDifficulty.HARD, MapDifficulty.EXTREME];
    
    difficulties.forEach(difficulty => {
      const config: MapGenerationConfig = {
        width: 25,
        height: 19,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty,
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

      const mapData = mapGenerator.generate(config);
      
      expect(mapData.metadata.difficulty).toBe(difficulty);
      expect(mapData.spawnZones.length).toBeGreaterThan(0);
      
      // Higher difficulties should generally have more spawn zones
      if (difficulty === MapDifficulty.EXTREME) {
        expect(mapData.spawnZones.length).toBeGreaterThanOrEqual(2);
      }
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });
});