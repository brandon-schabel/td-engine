import { describe, it, expect } from 'vitest';
import { MapGenerator } from '@/systems/MapGenerator';
import { BiomeType, MapDifficulty, DecorationLevel, MapSize, MAP_SIZE_PRESETS } from '@/types/MapData';
import type { MapGenerationConfig } from '@/types/MapData';

describe('Map Generation Comparison Demo', () => {
  it('should show improvement from old vs new default configuration', () => {
    const mapGenerator = new MapGenerator();
    
    // Old small configuration
    const oldConfig: MapGenerationConfig = {
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
    
    // New enhanced configuration (medium size preset)
    const preset = MAP_SIZE_PRESETS[MapSize.MEDIUM];
    const newConfig: MapGenerationConfig = {
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
    
    const oldMap = mapGenerator.generate(oldConfig);
    const newMap = mapGenerator.generate(newConfig);
    
    console.log('\n=== MAP GENERATION COMPARISON ===');
    console.log(`Old Config: ${oldConfig.width}x${oldConfig.height} = ${oldConfig.width * oldConfig.height} cells`);
    console.log(`New Config: ${newConfig.width}x${newConfig.height} = ${newConfig.width * newConfig.height} cells`);
    console.log(`Size Increase: ${((newConfig.width * newConfig.height) / (oldConfig.width * oldConfig.height) * 100 - 100).toFixed(1)}%`);
    
    console.log(`\nOld Decorations: ${oldMap.decorations.length}`);
    console.log(`New Decorations: ${newMap.decorations.length}`);
    console.log(`Decoration Increase: ${((newMap.decorations.length / oldMap.decorations.length) * 100 - 100).toFixed(1)}%`);
    
    console.log(`\nOld Path Complexity: ${oldConfig.pathComplexity}`);
    console.log(`New Path Complexity: ${newConfig.pathComplexity}`);
    
    console.log(`\nOld Strategic Features: ${oldConfig.chokePointCount} choke points, ${oldConfig.openAreaCount} open areas`);
    console.log(`New Strategic Features: ${newConfig.chokePointCount} choke points, ${newConfig.openAreaCount} open areas`);
    
    // Verify improvements
    expect(newMap.metadata.width * newMap.metadata.height).toBeGreaterThan(oldMap.metadata.width * oldMap.metadata.height);
    expect(newMap.decorations.length).toBeGreaterThan(oldMap.decorations.length);
    expect(newConfig.pathComplexity).toBeGreaterThan(oldConfig.pathComplexity);
    expect(newConfig.chokePointCount).toBeGreaterThan(oldConfig.chokePointCount);
    expect(newConfig.openAreaCount).toBeGreaterThan(oldConfig.openAreaCount);
    
    // Both should be valid
    const oldValidation = mapGenerator.validate(oldMap);
    const newValidation = mapGenerator.validate(newMap);
    expect(oldValidation.isValid).toBe(true);
    expect(newValidation.isValid).toBe(true);
  });

  it('should demonstrate different map sizes', () => {
    const mapGenerator = new MapGenerator();
    const sizes = [MapSize.SMALL, MapSize.MEDIUM, MapSize.LARGE, MapSize.HUGE];
    
    console.log('\n=== MAP SIZE COMPARISON ===');
    
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
      const worldSize = `${preset.width * 32}x${preset.height * 32}px`;
      
      console.log(`${size}: ${preset.width}x${preset.height} (${worldSize}) - ${mapData.decorations.length} decorations, ${mapData.spawnZones.length} spawn zones`);
      
      expect(mapData.decorations.length).toBeGreaterThan(0);
      
      const validation = mapGenerator.validate(mapData);
      expect(validation.isValid).toBe(true);
    });
  });
});