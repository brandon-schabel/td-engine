import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { BiomeType, MapDifficulty, DecorationLevel } from '@/types/MapData';
import type { MapGenerationConfig } from '@/types/MapData';

// Simple canvas mock
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    font: '',
    textAlign: '',
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    setLineDash: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    globalAlpha: 1
  }))
};

// AudioContext and document mocked in setup.ts

describe('Game Map Integration', () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (game) {
      game.stop();
    }
  });

  it('should initialize with default map generation', () => {
    game = new Game(mockCanvas as any, undefined, false); // Disable auto-start
    
    expect(game).toBeDefined();
    expect(game.getCurrentMapData()).toBeDefined();
    expect(game.getMapGenerator()).toBeDefined();
    expect(game.getTextureManager()).toBeDefined();
  });

  it('should initialize with custom map configuration', () => {
    const customConfig: MapGenerationConfig = {
      width: 20,
      height: 15,
      cellSize: 32,
      biome: BiomeType.DESERT,
      difficulty: MapDifficulty.HARD,
      seed: 12345,
      pathComplexity: 0.8,
      obstacleCount: 20,
      decorationLevel: DecorationLevel.DENSE,
      enableWater: false,
      enableAnimations: true,
      chokePointCount: 3,
      openAreaCount: 2,
      playerAdvantageSpots: 1
    };

    game = new Game(mockCanvas as any, customConfig, false); // Disable auto-start
    
    const mapData = game.getCurrentMapData();
    expect(mapData.metadata.biome).toBe(BiomeType.DESERT);
    expect(mapData.metadata.difficulty).toBe(MapDifficulty.HARD);
    expect(mapData.metadata.width).toBe(20);
    expect(mapData.metadata.height).toBe(15);
  });

  it('should have generated map with required components', () => {
    game = new Game(mockCanvas as any, undefined, false);
    const mapData = game.getCurrentMapData();
    
    // Check required map components
    expect(mapData.metadata).toBeDefined();
    expect(mapData.biomeConfig).toBeDefined();
    expect(mapData.paths.length).toBeGreaterThan(0);
    expect(mapData.spawnZones.length).toBeGreaterThan(0);
    expect(mapData.playerStart).toBeDefined();
    expect(mapData.decorations.length).toBeGreaterThan(0);
    expect(mapData.heightMap).toBeDefined();
  });

  it('should allow map regeneration', () => {
    game = new Game(mockCanvas as any, undefined, false);
    const originalMapData = game.getCurrentMapData();
    
    // Regenerate with different seed
    const newConfig: MapGenerationConfig = {
      width: 25,
      height: 19,
      cellSize: 32,
      biome: BiomeType.ARCTIC,
      difficulty: MapDifficulty.EASY,
      seed: 54321,
      pathComplexity: 0.3,
      obstacleCount: 5,
      decorationLevel: DecorationLevel.MINIMAL,
      enableWater: true,
      enableAnimations: false,
      chokePointCount: 1,
      openAreaCount: 4,
      playerAdvantageSpots: 3
    };

    game.regenerateMap(newConfig);
    const newMapData = game.getCurrentMapData();
    
    // Maps should be different (check biome and difficulty changed)
    expect(newMapData.metadata.biome).toBe(BiomeType.ARCTIC);
    expect(newMapData.metadata.difficulty).toBe(MapDifficulty.EASY);
    expect(newMapData.metadata.width).toBe(25);
    expect(newMapData.metadata.height).toBe(19);
    // Seed should be the one we provided
    expect(newMapData.metadata.seed).toBe(54321);
  });

  it('should generate map variants', () => {
    game = new Game(mockCanvas as any, undefined, false);
    
    const variants = game.generateMapVariants(3);
    
    expect(variants.length).toBe(3);
    variants.forEach(variant => {
      expect(variant.metadata).toBeDefined();
      expect(variant.paths.length).toBeGreaterThan(0);
      expect(variant.spawnZones.length).toBeGreaterThan(0);
    });
    
    // Variants should have different seeds
    const seeds = variants.map(v => v.metadata.seed);
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBe(3);
  });

  it('should have player positioned at generated start position', () => {
    game = new Game(mockCanvas as any, undefined, false);
    const mapData = game.getCurrentMapData();
    const player = game.getPlayer();
    
    // Player should be positioned at the generated start position (converted to world coordinates)
    expect(player.position).toBeDefined();
    expect(player.position.x).toBeGreaterThan(0);
    expect(player.position.y).toBeGreaterThan(0);
  });

  it('should validate generated maps', () => {
    game = new Game(mockCanvas as any, undefined, false);
    const mapData = game.getCurrentMapData();
    const mapGenerator = game.getMapGenerator();
    
    const validation = mapGenerator.validate(mapData);
    
    expect(validation.isValid).toBe(true);
    expect(validation.pathReachability).toBe(true);
    expect(validation.towerPlacementSpaces).toBeGreaterThan(0);
    expect(validation.strategicBalance).toBeGreaterThan(0);
  });

  afterEach(() => {
    if (game) {
      game.stop();
    }
  });
});