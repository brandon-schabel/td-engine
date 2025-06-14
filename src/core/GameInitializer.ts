import { Grid } from '@/systems/Grid';
import { Camera } from '@/systems/Camera';
import { Player } from '@/entities/Player';
import { WaveManager } from '@/systems/WaveManager';
import { EnemyType } from '@/entities/Enemy';
import type { WaveConfig } from '@/systems/WaveManager';
import { BiomeType, MapDifficulty, DecorationLevel, MapSize, MAP_SIZE_PRESETS } from '@/types/MapData';
import type { MapData, MapGenerationConfig } from '@/types/MapData';

const DEFAULT_WAVES: WaveConfig[] = [
  {
    waveNumber: 1,
    enemies: [
      { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 2,
    enemies: [
      { type: EnemyType.BASIC, count: 8, spawnDelay: 800 }
    ],
    startDelay: 3000
  },
  {
    waveNumber: 3,
    enemies: [
      { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 },
      { type: EnemyType.FAST, count: 3, spawnDelay: 600 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 4,
    enemies: [
      { type: EnemyType.BASIC, count: 10, spawnDelay: 600 },
      { type: EnemyType.FAST, count: 5, spawnDelay: 800 }
    ],
    startDelay: 2000
  },
  {
    waveNumber: 5,
    enemies: [
      { type: EnemyType.TANK, count: 3, spawnDelay: 2000 },
      { type: EnemyType.FAST, count: 8, spawnDelay: 400 }
    ],
    startDelay: 3000
  }
];

export class GameInitializer {
  static generateEnhancedDefaultConfig(): MapGenerationConfig {
    const mapSize = MapSize.MEDIUM; // Default to medium size for good balance
    const preset = MAP_SIZE_PRESETS[mapSize];
    
    if (!preset) {
      throw new Error(`Map size preset not found: ${mapSize}`);
    }
    
    // Random biome selection with weighted distribution
    const biomes = [
      BiomeType.FOREST,   // 25%
      BiomeType.DESERT,   // 20%
      BiomeType.ARCTIC,   // 20%
      BiomeType.VOLCANIC, // 20%
      BiomeType.GRASSLAND // 15%
    ];
    const biomeWeights = [0.25, 0.45, 0.65, 0.85, 1.0];
    const randomValue = Math.random();
    let selectedBiome: BiomeType = BiomeType.FOREST;
    
    for (let i = 0; i < biomeWeights.length; i++) {
      if (randomValue < biomeWeights[i]!) {
        selectedBiome = biomes[i] ?? BiomeType.FOREST;
        break;
      }
    }

    const difficulty = MapDifficulty.MEDIUM;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    return {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: selectedBiome,
      difficulty,
      seed: Date.now(),
      pathComplexity: 0.75, // More winding paths for strategy
      obstacleCount: Math.floor(preset.baseObstacles * difficultyMultiplier),
      decorationLevel: DecorationLevel.DENSE, // Rich visual environment
      enableWater: true,
      enableAnimations: true,
      chokePointCount: Math.floor(preset.baseChokePoints * difficultyMultiplier),
      openAreaCount: preset.baseOpenAreas,
      playerAdvantageSpots: preset.baseAdvantageSpots
    };
  }

  static initializePlayer(mapData: MapData, grid: Grid): Player {
    const playerWorldPos = grid.gridToWorld(mapData.playerStart.x, mapData.playerStart.y);
    return new Player(playerWorldPos);
  }

  static initializeWaveManager(mapData: MapData, grid: Grid): WaveManager {
    const spawnZone = mapData.spawnZones[0] || { x: 1, y: Math.floor(grid.height / 2) };
    const spawnWorldPos = grid.gridToWorld(spawnZone.x, spawnZone.y);
    const waveManager = new WaveManager(spawnWorldPos);
    waveManager.loadWaves(DEFAULT_WAVES);
    return waveManager;
  }

  static initializeCamera(canvasWidth: number, canvasHeight: number, worldWidth: number, worldHeight: number): Camera {
    return new Camera(canvasWidth, canvasHeight, worldWidth, worldHeight);
  }

  private static getDifficultyMultiplier(difficulty: MapDifficulty): number {
    switch (difficulty) {
      case MapDifficulty.EASY: return 0.7;
      case MapDifficulty.MEDIUM: return 1.0;
      case MapDifficulty.HARD: return 1.3;
      case MapDifficulty.EXTREME: return 1.6;
      default: return 1.0;
    }
  }

  private static getRandomBiome(): BiomeType {
    const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
    return biomes[Math.floor(Math.random() * biomes.length)] ?? BiomeType.FOREST;
  }

  static createMapWithSize(mapSize: MapSize, biome?: BiomeType, difficulty?: MapDifficulty): MapGenerationConfig {
    const preset = MAP_SIZE_PRESETS[mapSize];
    if (!preset) {
      throw new Error(`Map size preset not found: ${mapSize}`);
    }
    
    const selectedBiome: BiomeType = biome || this.getRandomBiome();
    const selectedDifficulty = difficulty || MapDifficulty.MEDIUM;
    const difficultyMultiplier = this.getDifficultyMultiplier(selectedDifficulty);

    return {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: selectedBiome,
      difficulty: selectedDifficulty,
      seed: Date.now(),
      pathComplexity: 0.7 + (difficultyMultiplier - 1) * 0.2, // Scale complexity with difficulty
      obstacleCount: Math.floor(preset.baseObstacles * difficultyMultiplier),
      decorationLevel: DecorationLevel.DENSE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: Math.floor(preset.baseChokePoints * difficultyMultiplier),
      openAreaCount: preset.baseOpenAreas,
      playerAdvantageSpots: preset.baseAdvantageSpots
    };
  }
}