import type { Vector2 } from '@/utils/Vector2';
import type { 
  MapData, 
  MapGenerationConfig, 
  MapValidationResult, 
  MapDecoration, 
  EnvironmentalEffect,
  BiomeConfig,
  MapMetadata,
  SpawnZoneMetadata
} from '@/types/MapData';
import { BiomeType, BIOME_PRESETS, MapDifficulty, DecorationLevel } from '@/types/MapData';
import { Grid, CellType } from './Grid';
import { PathGenerator } from './PathGenerator';
import { TerrainGenerator } from './TerrainGenerator';
import { EdgeType } from './SpawnZoneManager';
import { Pathfinding } from './Pathfinding';
import { MovementType } from './MovementSystem';

export class MapGenerator {
  private pathGenerator: PathGenerator;
  private random: () => number;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
    
    // Seeded random number generator
    let seedValue = this.seed;
    this.random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    // Initialize with a temporary grid - will be replaced in generate()
    const tempGrid = new Grid(20, 20, 20);
    this.pathGenerator = new PathGenerator(tempGrid, this.seed);
  }

  generate(config: MapGenerationConfig, maxAttempts: number = 5): MapData {
    let attempts = 0;
    let mapData: MapData | null = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Use config seed if provided, otherwise use instance seed
      const useSeed = (config.seed ?? this.seed) + attempts - 1; // Modify seed for each attempt
      
      // Update random generator with the seed
      let seedValue = useSeed;
      this.random = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };
      
      // Create grid for generation
      const grid = new Grid(config.width, config.height, config.cellSize);
      grid.setBiome(config.biome);
      this.pathGenerator = new PathGenerator(grid, useSeed);

      // Get biome configuration
      const biomeConfig = BIOME_PRESETS[config.biome];

      // Generate metadata 
      const metadata = this.generateMetadata(config);

      // Generate paths
      const mainPath = this.pathGenerator.generateMainPath(config);
      const branchPaths = this.pathGenerator.generateBranchPaths(mainPath, 0); // No branches for now
      const paths = [mainPath, ...branchPaths];

      // Apply paths to grid
      this.applyPathsToGrid(grid, paths);

      // Generate terrain features (water, rough terrain, etc.)
      const terrainGenerator = new TerrainGenerator(grid, config.biome, useSeed);
      terrainGenerator.generateTerrain(config);

      // Generate spawn zones
      const spawnZones = this.generateSpawnZones(grid, mainPath, config);

      // Generate player start position
      const playerStart = this.generatePlayerStartPosition(grid, mainPath, config);

      // Generate obstacles and decorations
      const decorations = this.generateDecorations(grid, biomeConfig, config);
      
      // Apply decorations to grid
      grid.addDecorations(decorations);

      // Generate environmental effects
      const effects = this.generateEnvironmentalEffects(grid, biomeConfig, config);

      // Set borders
      grid.setBorders();

      // Generate height map for 3D effects
      const heightMap = this.generateHeightMap(grid, biomeConfig);

      // Capture terrain cells (water, rough terrain, bridges)
      const terrainCells: MapData['terrainCells'] = [];
      const terrainTypes = [CellType.WATER, CellType.ROUGH_TERRAIN, CellType.BRIDGE];
      
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cellType = grid.getCellType(x, y);
          if (terrainTypes.includes(cellType)) {
            terrainCells.push({ x, y, type: cellType });
          }
        }
      }
      
      mapData = {
        metadata,
        biomeConfig,
        paths,
        decorations,
        effects,
        spawnZones,
        spawnZonesWithMetadata: (this as any)._generatedSpawnZoneMetadata || undefined,
        playerStart,
        heightMap,
        terrainCells,
        customProperties: {}
      };
      
      // Clean up temporary storage
      delete (this as any)._generatedSpawnZoneMetadata;

      // Validate the generated map
      const validation = this.validate(mapData, { 
        validateSpawnConnectivity: true, 
        cellSize: config.cellSize 
      });
      
      // If map is valid or we've reached max attempts, return it
      if (validation.isValid || attempts >= maxAttempts) {
        if (!validation.isValid && attempts >= maxAttempts) {
          console.warn(`Map generation reached max attempts (${maxAttempts}) with validation errors:`, validation.errors);
        }
        return mapData;
      }
      
      // Log validation issues
      console.warn(`Map generation attempt ${attempts} failed validation:`, validation.errors);
    }

    // Should never reach here, but return the last attempt
    return mapData!;
  }

  private generateMetadata(config: MapGenerationConfig): MapMetadata {
    const biomeNames = {
      [BiomeType.FOREST]: 'Woodland',
      [BiomeType.DESERT]: 'Wasteland',
      [BiomeType.ARCTIC]: 'Frozen Tundra',
      [BiomeType.VOLCANIC]: 'Molten Peaks',
      [BiomeType.GRASSLAND]: 'Green Plains'
    };

    const difficultyAdjectives = {
      [MapDifficulty.EASY]: 'Peaceful',
      [MapDifficulty.MEDIUM]: 'Contested',
      [MapDifficulty.HARD]: 'Treacherous',
      [MapDifficulty.EXTREME]: 'Nightmare'
    };

    // Use config seed if provided, otherwise use instance seed
    const useSeed = config.seed ?? this.seed;

    return {
      name: `${difficultyAdjectives[config.difficulty]} ${biomeNames[config.biome]}`,
      description: `A ${config.difficulty.toLowerCase()} difficulty map set in a ${config.biome.toLowerCase()} environment.`,
      difficulty: config.difficulty,
      biome: config.biome,
      seed: useSeed,
      width: config.width,
      height: config.height,
      createdAt: new Date(),
      version: '1.0.0'
    };
  }

  private applyPathsToGrid(grid: Grid, paths: MapData['paths']): void {
    paths.forEach(path => {
      const detailedPath = this.pathGenerator.createDetailedPath(path);
      detailedPath.forEach(point => {
        grid.setCellType(point.x, point.y, CellType.PATH);
      });
    });
  }

  private generateSpawnZones(grid: Grid, mainPath: MapData['paths'][0], _config: MapGenerationConfig): Vector2[] {
    const spawnZones: Vector2[] = [];
    const spawnZonesWithMetadata: MapData['spawnZonesWithMetadata'] = [];
    
    // Get player start position for validation
    const playerStart = this.generatePlayerStartPosition(grid, mainPath, _config);
    const playerWorldPos = grid.gridToWorld(playerStart.x, playerStart.y);
    
    // Helper to determine edge type (spawn zones are now 2 tiles inward for better pathfinding)
    const getEdgeType = (pos: Vector2): EdgeType => {
      const isTop = pos.y === 2;
      const isBottom = pos.y === grid.height - 3;
      const isLeft = pos.x === 2;
      const isRight = pos.x === grid.width - 3;
      
      if (isTop && isLeft) return EdgeType.TOP_LEFT;
      if (isTop && isRight) return EdgeType.TOP_RIGHT;
      if (isBottom && isLeft) return EdgeType.BOTTOM_LEFT;
      if (isBottom && isRight) return EdgeType.BOTTOM_RIGHT;
      if (isTop) return EdgeType.TOP;
      if (isBottom) return EdgeType.BOTTOM;
      if (isLeft) return EdgeType.LEFT;
      if (isRight) return EdgeType.RIGHT;
      
      return EdgeType.TOP; // Default
    };
    
    // Helper to validate spawn point accessibility
    const isSpawnPointAccessible = (gridPos: Vector2): boolean => {
      const worldPos = grid.gridToWorld(gridPos.x, gridPos.y);
      const validation = Pathfinding.validateSpawnPointConnectivity(
        worldPos,
        playerWorldPos,
        grid,
        MovementType.WALKING
      );
      return validation.isValid;
    };
    
    // Primary spawn at path start - but validate it
    if (mainPath.waypoints.length > 0) {
      const firstWaypoint = mainPath.waypoints[0];
      if (firstWaypoint && isSpawnPointAccessible(firstWaypoint)) {
        spawnZones.push({ ...firstWaypoint });
        spawnZonesWithMetadata.push({
          position: { ...firstWaypoint },
          edgeType: getEdgeType(firstWaypoint),
          priority: 2.0 // Higher priority for main spawn
        });
      }
    }

    // Calculate total spawns based on difficulty and map size
    const baseSpawns = _config.difficulty === MapDifficulty.EXTREME ? 8 :
                       _config.difficulty === MapDifficulty.HARD ? 5 :
                       _config.difficulty === MapDifficulty.MEDIUM ? 3 : 2;
    
    // Add more spawns for larger maps
    const sizeMultiplier = Math.min(1.5, (grid.width * grid.height) / 400);
    const totalSpawns = Math.floor(baseSpawns * sizeMultiplier);
    const additionalSpawns = Math.max(0, totalSpawns - spawnZones.length);

    // Define edge positions (excluding corners initially)
    const edgePositions: Array<{pos: Vector2, edge: EdgeType}> = [];
    
    // Top edge (2 tiles inward from border, excluding corners)
    for (let x = 3; x < grid.width - 3; x++) {
      edgePositions.push({ pos: { x, y: 2 }, edge: EdgeType.TOP });
    }
    // Bottom edge (2 tiles inward from border, excluding corners)
    for (let x = 3; x < grid.width - 3; x++) {
      edgePositions.push({ pos: { x, y: grid.height - 3 }, edge: EdgeType.BOTTOM });
    }
    // Left edge (2 tiles inward from border, excluding corners)
    for (let y = 3; y < grid.height - 3; y++) {
      edgePositions.push({ pos: { x: 2, y }, edge: EdgeType.LEFT });
    }
    // Right edge (2 tiles inward from border, excluding corners)
    for (let y = 3; y < grid.height - 3; y++) {
      edgePositions.push({ pos: { x: grid.width - 3, y }, edge: EdgeType.RIGHT });
    }
    
    // Add corner positions separately (prioritized) - 2 tiles inward from actual corners
    const cornerPositions: Array<{pos: Vector2, edge: EdgeType}> = [
      { pos: { x: 2, y: 2 }, edge: EdgeType.TOP_LEFT },
      { pos: { x: grid.width - 3, y: 2 }, edge: EdgeType.TOP_RIGHT },
      { pos: { x: 2, y: grid.height - 3 }, edge: EdgeType.BOTTOM_LEFT },
      { pos: { x: grid.width - 3, y: grid.height - 3 }, edge: EdgeType.BOTTOM_RIGHT }
    ];
    
    // Shuffle positions for randomness
    const shuffleArray = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    
    const shuffledCorners = shuffleArray(cornerPositions);
    const shuffledEdges = shuffleArray(edgePositions);
    
    // Prioritize corners for harder difficulties
    const candidatePositions = _config.difficulty === MapDifficulty.EXTREME || _config.difficulty === MapDifficulty.HARD
      ? [...shuffledCorners, ...shuffledEdges]
      : [...shuffledEdges, ...shuffledCorners];

    // Add additional spawn zones
    let addedCount = 0;
    let attemptedCount = 0;
    const maxAttempts = candidatePositions.length * 2; // Allow retrying with relaxed constraints
    
    for (let i = 0; i < candidatePositions.length && addedCount < additionalSpawns && attemptedCount < maxAttempts; i++) {
      const candidate = candidatePositions[i];
      attemptedCount++;
      
      // Check if position is valid and not too close to existing spawns
      const minDistance = _config.difficulty === MapDifficulty.EXTREME ? 3 : 4;
      const tooClose = spawnZones.some(spawn => {
        const distance = Math.max(Math.abs(spawn.x - candidate.pos.x), Math.abs(spawn.y - candidate.pos.y));
        return distance < minDistance;
      });
      
      if (!tooClose) {
        // Check if the position is accessible (not blocked)
        const cellType = grid.getCellType(candidate.pos.x, candidate.pos.y);
        if (cellType === CellType.EMPTY || cellType === CellType.PATH) {
          // Validate spawn point connectivity
          if (isSpawnPointAccessible(candidate.pos)) {
            spawnZones.push(candidate.pos);
            
            // Create metadata for enhanced spawn zones
            const metadata: SpawnZoneMetadata = {
              position: candidate.pos,
              edgeType: candidate.edge,
              priority: candidate.edge.includes('CORNER') ? 1.5 : 1.0
            };
            
            // Add conditional activation for some spawn zones
            if (_config.difficulty === MapDifficulty.EXTREME && addedCount > 3) {
              metadata.conditional = {
                minWave: 3 + Math.floor(addedCount / 2)
              };
            } else if (_config.difficulty === MapDifficulty.HARD && addedCount > 2) {
              metadata.conditional = {
                minWave: 5 + addedCount
              };
            }
            
            spawnZonesWithMetadata.push(metadata);
            addedCount++;
          }
        }
      }
    }
    
    // If we couldn't add enough spawn zones, try with relaxed constraints
    if (addedCount < additionalSpawns) {
      console.warn(`Only ${addedCount} of ${additionalSpawns} additional spawn zones could be placed with validation`);
      
      // Try to add more spawn zones with relaxed distance constraints
      const relaxedMinDistance = 2;
      for (let i = 0; i < candidatePositions.length && addedCount < additionalSpawns; i++) {
        const candidate = candidatePositions[i];
        
        const alreadyAdded = spawnZones.some(spawn => 
          spawn.x === candidate.pos.x && spawn.y === candidate.pos.y
        );
        
        if (!alreadyAdded) {
          const tooClose = spawnZones.some(spawn => {
            const distance = Math.max(Math.abs(spawn.x - candidate.pos.x), Math.abs(spawn.y - candidate.pos.y));
            return distance < relaxedMinDistance;
          });
          
          if (!tooClose && isSpawnPointAccessible(candidate.pos)) {
            spawnZones.push(candidate.pos);
            
            const metadata: SpawnZoneMetadata = {
              position: candidate.pos,
              edgeType: candidate.edge,
              priority: candidate.edge.includes('CORNER') ? 1.2 : 0.8 // Lower priority for relaxed spawns
            };
            
            spawnZonesWithMetadata.push(metadata);
            addedCount++;
          }
        }
      }
    }
    
    // Store metadata in MapData (will be done in generate method)
    (this as any)._generatedSpawnZoneMetadata = spawnZonesWithMetadata;

    return spawnZones;
  }

  private generatePlayerStartPosition(grid: Grid, _mainPath: MapData['paths'][0], _config: MapGenerationConfig): Vector2 {
    // Place player at center of map by default
    const centerX = Math.floor(grid.width / 2);
    const centerY = Math.floor(grid.height / 2);
    
    // Try to find a good empty spot near center
    const searchRadius = 5;
    for (let radius = 0; radius <= searchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (grid.isInBounds(x, y) && grid.getCellType(x, y) === CellType.EMPTY) {
              return { x, y };
            }
          }
        }
      }
    }
    
    // Fallback to center
    return { x: centerX, y: centerY };
  }

  private generateDecorations(grid: Grid, biomeConfig: BiomeConfig, config: MapGenerationConfig): MapDecoration[] {
    const decorations: MapDecoration[] = [];
    
    // Calculate decoration count based on config and biome
    const baseDensity = biomeConfig.decorationDensity;
    const levelMultiplier = config.decorationLevel === DecorationLevel.DENSE ? 1.5 :
                           config.decorationLevel === DecorationLevel.MODERATE ? 1.0 : 0.5;
    
    // Enhanced decoration formula for more visual richness
    const sizeMultiplier = Math.min(grid.width * grid.height / 400, 2.0); // Scale with map size
    // Reduced base multiplier from 0.6 to 0.25 for less busy maps
    const targetCount = Math.floor(grid.width * grid.height * baseDensity * levelMultiplier * 0.25 * sizeMultiplier);
    
    // Generate decorations
    for (let i = 0; i < targetCount; i++) {
      const decoration = this.generateSingleDecoration(grid, biomeConfig);
      if (decoration) {
        decorations.push(decoration);
      }
    }

    return decorations;
  }

  private generateSingleDecoration(grid: Grid, biomeConfig: BiomeConfig): MapDecoration | null {
    const attempts = 10;
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      // Random position
      const gridX = Math.floor(1 + this.random() * (grid.width - 2));
      const gridY = Math.floor(1 + this.random() * (grid.height - 2));
      
      // Check if position is suitable
      if (grid.getCellType(gridX, gridY) === CellType.EMPTY) {
        const worldPos = grid.gridToWorld(gridX, gridY);
        
        // Choose decoration type from biome
        const decorationType = biomeConfig.obstacleTypes[
          Math.floor(this.random() * biomeConfig.obstacleTypes.length)
        ] ?? 'rock';
        
        // Determine if blocking based on decoration type
        const blocking = decorationType.includes('tree') || 
                        decorationType.includes('boulder') ||
                        decorationType.includes('rock_formation') ||
                        decorationType.includes('ice_formation') ||
                        decorationType.includes('lava_rock');
        
        return {
          type: decorationType,
          position: worldPos,
          rotation: this.random() * 360,
          scale: 0.8 + this.random() * 0.4, // 0.8 to 1.2
          variant: Math.floor(this.random() * 3), // 0-2 variants
          animated: biomeConfig.animatedElements && this.random() < 0.3,
          blocking
        };
      }
    }
    
    return null; // Couldn't find suitable position
  }

  private generateEnvironmentalEffects(grid: Grid, biomeConfig: BiomeConfig, config: MapGenerationConfig): EnvironmentalEffect[] {
    if (!config.enableAnimations) return [];
    
    const effects: EnvironmentalEffect[] = [];
    
    // Generate biome-specific effects
    switch (biomeConfig.type) {
      case BiomeType.FOREST:
        effects.push(...this.generateForestEffects(grid));
        break;
      case BiomeType.DESERT:
        effects.push(...this.generateDesertEffects(grid));
        break;
      case BiomeType.ARCTIC:
        effects.push(...this.generateArcticEffects(grid));
        break;
      case BiomeType.VOLCANIC:
        effects.push(...this.generateVolcanicEffects(grid));
        break;
      case BiomeType.GRASSLAND:
        effects.push(...this.generateGrasslandEffects(grid));
        break;
    }
    
    return effects;
  }

  private generateForestEffects(grid: Grid): EnvironmentalEffect[] {
    const effects: EnvironmentalEffect[] = [];
    
    // Falling leaves particle effect
    const leafCount = 3 + Math.floor(this.random() * 5);
    for (let i = 0; i < leafCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'PARTICLES',
        position: worldPos,
        radius: 50 + this.random() * 100,
        intensity: 0.3 + this.random() * 0.4,
        properties: {
          particleType: 'leaves',
          direction: { x: -0.5, y: 1 },
          speed: 20 + this.random() * 30,
          color: '#8FBC8F'
        }
      });
    }
    
    return effects;
  }

  private generateDesertEffects(grid: Grid): EnvironmentalEffect[] {
    const effects: EnvironmentalEffect[] = [];
    
    // Multiple sand particle effects across the map
    const sandCount = 3 + Math.floor(this.random() * 4);
    for (let i = 0; i < sandCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'PARTICLES',
        position: worldPos,
        radius: 60 + this.random() * 80,
        intensity: 0.15 + this.random() * 0.2,
        properties: {
          particleType: 'sand',
          direction: { x: 0.7 + this.random() * 0.6, y: 0.1 },
          speed: 8 + this.random() * 12,
          color: '#D2B48C'
        }
      });
    }
    
    // Heat shimmer effects
    const shimmerCount = 2 + Math.floor(this.random() * 2);
    for (let i = 0; i < shimmerCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'ANIMATION',
        position: worldPos,
        radius: 40 + this.random() * 60,
        intensity: 0.3 + this.random() * 0.3,
        properties: {
          animationType: 'heat_shimmer',
          speed: 1.5 + this.random() * 1.0,
          color: '#F4A460'
        }
      });
    }
    
    return effects;
  }

  private generateArcticEffects(grid: Grid): EnvironmentalEffect[] {
    const effects: EnvironmentalEffect[] = [];
    
    // Snow particles
    const snowCount = 2 + Math.floor(this.random() * 3);
    for (let i = 0; i < snowCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'PARTICLES',
        position: worldPos,
        radius: 80 + this.random() * 120,
        intensity: 0.4 + this.random() * 0.3,
        properties: {
          particleType: 'snow',
          direction: { x: 0, y: 1 },
          speed: 15 + this.random() * 20,
          color: '#FFFFFF'
        }
      });
    }
    
    return effects;
  }

  private generateVolcanicEffects(grid: Grid): EnvironmentalEffect[] {
    const effects: EnvironmentalEffect[] = [];
    
    // Ash particles and glowing embers
    effects.push({
      type: 'PARTICLES',
      position: grid.gridToWorld(Math.floor(grid.width / 2), Math.floor(grid.height / 2)),
      radius: Math.min(grid.width, grid.height) * grid.cellSize * 0.4,
      intensity: 0.5,
      properties: {
        particleType: 'ash',
        direction: { x: 0, y: -1 },
        speed: 25,
        color: '#696969'
      }
    });
    
    // Glowing effect
    effects.push({
      type: 'LIGHTING',
      position: grid.gridToWorld(Math.floor(grid.width / 2), Math.floor(grid.height / 2)),
      radius: Math.min(grid.width, grid.height) * grid.cellSize * 0.2,
      intensity: 0.7,
      properties: {
        lightType: 'glow',
        color: '#FF4500',
        pulsing: true
      }
    });
    
    return effects;
  }

  private generateGrasslandEffects(grid: Grid): EnvironmentalEffect[] {
    const effects: EnvironmentalEffect[] = [];
    
    // Multiple gentle wind effects across the grassland
    const windCount = 3 + Math.floor(this.random() * 3);
    for (let i = 0; i < windCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'ANIMATION',
        position: worldPos,
        radius: 80 + this.random() * 120,
        intensity: 0.2 + this.random() * 0.3,
        properties: {
          animationType: 'sway',
          direction: { x: 0.8 + this.random() * 0.4, y: 0.1 },
          frequency: 0.3 + this.random() * 0.4,
          color: '#32CD32'
        }
      });
    }
    
    // Butterfly or pollen particle effects
    const pollenCount = 2 + Math.floor(this.random() * 3);
    for (let i = 0; i < pollenCount; i++) {
      const worldPos = grid.gridToWorld(
        Math.floor(this.random() * grid.width),
        Math.floor(this.random() * grid.height)
      );
      
      effects.push({
        type: 'PARTICLES',
        position: worldPos,
        radius: 30 + this.random() * 50,
        intensity: 0.2 + this.random() * 0.2,
        properties: {
          particleType: 'pollen',
          direction: { x: 0.3, y: -0.1 },
          speed: 5 + this.random() * 10,
          color: '#FFFF99'
        }
      });
    }
    
    return effects;
  }

  private generateHeightMap(grid: Grid, biomeConfig: BiomeConfig): number[][] {
    const heightMap: number[][] = Array(grid.height).fill(null).map(() => 
      Array(grid.width).fill(0)
    );
    
    const variation = biomeConfig.terrainVariation;
    
    // Generate height using simple noise
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        // Simple noise generation
        const noise1 = this.noise(x * 0.1, y * 0.1);
        const noise2 = this.noise(x * 0.05, y * 0.05) * 0.5;
        const noise3 = this.noise(x * 0.2, y * 0.2) * 0.25;
        
        const height = (noise1 + noise2 + noise3) * variation;
        heightMap[y]![x] = Math.max(0, Math.min(1, height));
        
        // Set height in grid for movement calculations
        grid.setHeight(x, y, heightMap[y]![x]!);
      }
    }
    
    return heightMap;
  }

  // Simple noise function for height generation
  private noise(x: number, y: number): number {
    // Simple pseudo-noise based on position
    const n = Math.sin(x) * Math.sin(y) + Math.cos(x * 2) * Math.cos(y * 2) * 0.5;
    return (n + 1) / 2; // Normalize to 0-1
  }

  // Validate generated map
  validate(mapData: MapData, options: { validateSpawnConnectivity?: boolean; cellSize?: number } = {}): MapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { validateSpawnConnectivity = true, cellSize = 32 } = options;
    
    // Validate paths
    let pathReachability = true;
    mapData.paths.forEach((path, index) => {
      const pathValidation = this.pathGenerator.validatePath(path);
      if (!pathValidation.isValid) {
        pathReachability = false;
        errors.push(`Path ${index}: ${pathValidation.issues.join(', ')}`);
      }
    });
    
    // Check spawn zones
    if (mapData.spawnZones.length === 0) {
      errors.push('No spawn zones defined');
    }
    
    // Check player start position
    if (!mapData.playerStart) {
      errors.push('No player start position defined');
    }
    
    // Count available tower placement spaces
    const grid = new Grid(mapData.metadata.width, mapData.metadata.height, cellSize);
    grid.setBiome(mapData.metadata.biome);
    
    // Apply terrain cells first
    if (mapData.terrainCells) {
      mapData.terrainCells.forEach(cell => {
        grid.setCellType(cell.x, cell.y, cell.type as CellType);
      });
    }
    
    // Apply map data to grid for analysis
    mapData.paths.forEach(path => {
      const detailedPath = this.pathGenerator.createDetailedPath(path);
      detailedPath.forEach(point => {
        grid.setCellType(point.x, point.y, CellType.PATH);
      });
    });
    
    mapData.decorations.forEach(decoration => {
      if (decoration.blocking) {
        const gridPos = grid.worldToGrid(decoration.position);
        grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
      }
    });
    
    // Set borders
    grid.setBorders();
    
    // Validate spawn point connectivity if requested and we have both spawn zones and player start
    if (validateSpawnConnectivity && mapData.spawnZones.length > 0 && mapData.playerStart) {
      const playerWorldPos = grid.gridToWorld(mapData.playerStart.x, mapData.playerStart.y);
      
      // Convert spawn zones to world positions
      const spawnWorldPositions = mapData.spawnZones.map(spawnZone => 
        grid.gridToWorld(spawnZone.x, spawnZone.y)
      );
      
      // Validate all spawn points
      const connectivityValidation = Pathfinding.validateAllSpawnPoints(
        spawnWorldPositions,
        playerWorldPos,
        grid,
        MovementType.WALKING
      );
      
      // Add connectivity errors and warnings
      errors.push(...connectivityValidation.errors);
      warnings.push(...connectivityValidation.warnings);
      
      // Update path reachability based on spawn connectivity
      if (!connectivityValidation.allSpawnPointsValid) {
        pathReachability = false;
      }
      
      // If too many spawn points are invalid, it's a critical error
      if (connectivityValidation.invalidSpawnPoints.length > connectivityValidation.validSpawnPoints.length) {
        errors.push('More than half of spawn points are inaccessible - map is unplayable');
      }
    }
    
    const towerPlacementSpaces = grid.countCellsOfType(CellType.EMPTY);
    const minSpacesRequired = Math.floor(grid.width * grid.height * 0.3);
    
    if (towerPlacementSpaces < minSpacesRequired) {
      warnings.push(`Limited tower placement spaces: ${towerPlacementSpaces} (recommended: ${minSpacesRequired})`);
    }
    
    // Calculate strategic balance (placeholder)
    const strategicBalance = Math.min(1, towerPlacementSpaces / minSpacesRequired);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      pathReachability,
      towerPlacementSpaces,
      strategicBalance
    };
  }

  // Generate multiple map variants quickly
  generateVariants(baseConfig: MapGenerationConfig, count: number): MapData[] {
    const variants: MapData[] = [];
    
    for (let i = 0; i < count; i++) {
      const variantConfig = {
        ...baseConfig,
        seed: this.seed + i * 1000 // Offset seed for variation
      };
      
      // Create new generator with variant seed
      const variantGenerator = new MapGenerator(variantConfig.seed);
      variants.push(variantGenerator.generate(variantConfig));
    }
    
    return variants;
  }
}