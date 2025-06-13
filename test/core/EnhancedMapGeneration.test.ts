import { describe, it, expect } from 'vitest';
import { MapGenerator } from '../../src/systems/MapGenerator';
import { BiomeType, MapDifficulty, DecorationLevel, MapSize, MAP_SIZE_PRESETS } from '../../src/types/MapData';
import type { MapGenerationConfig } from '../../src/types/MapData';

describe('Enhanced Map Generation', () => {
  it('should generate larger maps with more content', () => {
    const mapGenerator = new MapGenerator();
    const preset = MAP_SIZE_PRESETS[MapSize.MEDIUM];
    
    const config: MapGenerationConfig = {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: BiomeType.FOREST,
      difficulty: MapDifficulty.MEDIUM,
      seed: 12345,
      pathComplexity: 0.75,
      obstacleCount: preset.baseObstacles,
      decorationLevel: DecorationLevel.DENSE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: preset.baseChokePoints,
      openAreaCount: preset.baseOpenAreas,
      playerAdvantageSpots: preset.baseAdvantageSpots
    };

    const mapData = mapGenerator.generate(config);
    
    // Should have larger dimensions (4x increase)
    expect(mapData.metadata.width).toBe(60);
    expect(mapData.metadata.height).toBe(44);
    
    // Should have more decorations due to DENSE level and enhanced formula
    expect(mapData.decorations.length).toBeGreaterThan(50);
    
    // Should have strategic features
    expect(mapData.paths.length).toBeGreaterThan(0);
    expect(mapData.spawnZones.length).toBeGreaterThan(0);
    
    // Map should be valid
    const validation = mapGenerator.validate(mapData);
    expect(validation.isValid).toBe(true);
  });

  it('should scale appropriately with different map sizes', () => {
    const mapGenerator = new MapGenerator();
    
    const sizes = [MapSize.SMALL, MapSize.MEDIUM, MapSize.LARGE];
    const maps: any[] = [];
    
    sizes.forEach(size => {
      const preset = MAP_SIZE_PRESETS[size];
      const config: MapGenerationConfig = {
        width: preset.width,
        height: preset.height,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty: MapDifficulty.MEDIUM,
        seed: 12345,
        pathComplexity: 0.75,
        obstacleCount: preset.baseObstacles,
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: preset.baseChokePoints,
        openAreaCount: preset.baseOpenAreas,
        playerAdvantageSpots: preset.baseAdvantageSpots
      };

      const mapData = mapGenerator.generate(config);
      maps.push({ size, mapData, preset });
    });
    
    // Larger maps should have more decorations
    expect(maps[2].mapData.decorations.length).toBeGreaterThan(maps[1].mapData.decorations.length);
    expect(maps[1].mapData.decorations.length).toBeGreaterThan(maps[0].mapData.decorations.length);
    
    // All should be valid
    maps.forEach(({ mapData }) => {
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should generate maps with different biomes', () => {
    const mapGenerator = new MapGenerator();
    const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
    
    biomes.forEach(biome => {
      const preset = MAP_SIZE_PRESETS[MapSize.MEDIUM];
      const config: MapGenerationConfig = {
        width: preset.width,
        height: preset.height,
        cellSize: 32,
        biome,
        difficulty: MapDifficulty.MEDIUM,
        seed: 12345,
        pathComplexity: 0.75,
        obstacleCount: preset.baseObstacles,
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: preset.baseChokePoints,
        openAreaCount: preset.baseOpenAreas,
        playerAdvantageSpots: preset.baseAdvantageSpots
      };

      const mapData = mapGenerator.generate(config);
      
      expect(mapData.biomeConfig.type).toBe(biome);
      expect(mapData.decorations.length).toBeGreaterThan(30);
      
      // Each biome should have its own decoration types
      const decorationTypes = mapData.decorations.map(d => d.type);
      expect(decorationTypes.length).toBeGreaterThan(0);
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should scale difficulty appropriately', () => {
    const mapGenerator = new MapGenerator();
    const difficulties = [MapDifficulty.EASY, MapDifficulty.MEDIUM, MapDifficulty.HARD, MapDifficulty.EXTREME];
    const difficultyMultipliers = [0.7, 1.0, 1.3, 1.6];
    
    difficulties.forEach((difficulty, index) => {
      const preset = MAP_SIZE_PRESETS[MapSize.MEDIUM];
      const expectedObstacles = Math.floor(preset.baseObstacles * difficultyMultipliers[index]);
      
      const config: MapGenerationConfig = {
        width: preset.width,
        height: preset.height,
        cellSize: 32,
        biome: BiomeType.FOREST,
        difficulty,
        seed: 12345,
        pathComplexity: 0.75,
        obstacleCount: expectedObstacles,
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: Math.floor(preset.baseChokePoints * difficultyMultipliers[index]),
        openAreaCount: preset.baseOpenAreas,
        playerAdvantageSpots: preset.baseAdvantageSpots
      };

      const mapData = mapGenerator.generate(config);
      
      expect(mapData.metadata.difficulty).toBe(difficulty);
      
      if (difficulty === MapDifficulty.EXTREME) {
        expect(mapData.spawnZones.length).toBeGreaterThanOrEqual(2);
      }
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should validate map size presets are properly configured', () => {
    Object.entries(MAP_SIZE_PRESETS).forEach(([size, preset]) => {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
      expect(preset.baseObstacles).toBeGreaterThan(0);
      expect(preset.baseChokePoints).toBeGreaterThan(0);
      expect(preset.baseOpenAreas).toBeGreaterThan(0);
      expect(preset.baseAdvantageSpots).toBeGreaterThan(0);
      
      // Larger maps should have more features
      if (size !== MapSize.SMALL.toString()) {
        const smallPreset = MAP_SIZE_PRESETS[MapSize.SMALL];
        expect(preset.width * preset.height).toBeGreaterThan(smallPreset.width * smallPreset.height);
        expect(preset.baseObstacles).toBeGreaterThan(smallPreset.baseObstacles);
      }
    });
  });
});