import { PresetMap, SimplifiedMapData, TerrainType as SimpleTerrainType } from './types';
import { MapData, BiomeType, MapDifficulty, BIOME_PRESETS, MapPath, MapDecoration, SpawnZoneMetadata } from '@/types/MapData';
import { GameMode } from '@/types/GameMode';
import { z } from 'zod';
import { PRESET_MAPS } from './presetMaps';
import { MapRegistry } from './MapRegistry';

// Validation schemas
const TileDataSchema = z.object({
  type: z.nativeEnum(SimpleTerrainType),
  isPath: z.boolean(),
  canPlaceTower: z.boolean()
});

const PathNodeSchema = z.object({
  x: z.number(),
  y: z.number()
});

const SpawnZoneSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  playerId: z.number().optional(),
  enemyTypes: z.array(z.string()).optional(),
  spawnRate: z.number().optional(),
  waveMultiplier: z.number().optional()
});

const DecorationSchema = z.object({
  type: z.string(),
  x: z.number(),
  y: z.number(),
  variant: z.number().optional()
});

const SimplifiedMapDataSchema = z.object({
  width: z.number().min(10).max(100),
  height: z.number().min(10).max(100),
  tiles: z.array(z.array(TileDataSchema)),
  paths: z.array(z.array(PathNodeSchema)),
  spawnZones: z.array(SpawnZoneSchema),
  decorations: z.array(DecorationSchema).optional(),
  startingResources: z.number().optional(),
  waveCount: z.number().optional()
});

const PresetMapDataSchema = z.object({
  metadata: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
    playerCount: z.object({
      min: z.number().min(1),
      max: z.number().max(4)
    }),
    supportedModes: z.array(z.nativeEnum(GameMode)),
    thumbnail: z.string().optional(),
    author: z.string().optional(),
    version: z.string()
  }),
  data: SimplifiedMapDataSchema
});

export class MapLoader {
  private static cache = new Map<string, PresetMap>();
  private static preloadedMaps = new Map<string, PresetMap>();

  // Initialize preset maps synchronously
  static initializePresetMaps(): void {
    // Initialize registry first
    MapRegistry.initializeSync();
    
    // Preload all preset maps
    for (const mapId of Object.keys(PRESET_MAPS)) {
      const mapData = PRESET_MAPS[mapId as keyof typeof PRESET_MAPS];
      const registryEntry = MapRegistry.getMap(mapId);
      
      if (registryEntry) {
        const presetData = {
          metadata: {
            id: mapId,
            name: registryEntry.name,
            description: registryEntry.description,
            difficulty: registryEntry.difficulty,
            playerCount: registryEntry.playerCount,
            supportedModes: registryEntry.supportedModes,
            version: "1.0.0"
          },
          data: mapData
        };
        
        const fullMapData = this.convertToMapData(presetData);
        const processedMap: PresetMap = {
          metadata: presetData.metadata,
          data: fullMapData
        };
        
        this.preloadedMaps.set(mapId, processedMap);
      }
    }
  }

  static loadMapSync(mapId: string): PresetMap | null {
    // Check preloaded maps first
    if (this.preloadedMaps.has(mapId)) {
      return this.preloadedMaps.get(mapId)!;
    }
    
    // Initialize if not already done
    if (this.preloadedMaps.size === 0) {
      this.initializePresetMaps();
    }
    
    return this.preloadedMaps.get(mapId) || null;
  }

  static async loadMap(mapId: string): Promise<PresetMap> {
    // Check cache first
    if (this.cache.has(mapId)) {
      return this.cache.get(mapId)!;
    }

    try {
      // Check if map exists
      if (!(mapId in PRESET_MAPS)) {
        throw new Error(`Map not found: ${mapId}`);
      }

      const mapData = PRESET_MAPS[mapId as keyof typeof PRESET_MAPS];
      
      // Get metadata from registry
      const registryEntry = MapRegistry.getMap(mapId);
      
      if (!registryEntry) {
        throw new Error(`Map not registered: ${mapId}`);
      }

      // Create preset data structure
      const presetData = {
        metadata: {
          id: mapId,
          name: registryEntry.name,
          description: registryEntry.description,
          difficulty: registryEntry.difficulty,
          playerCount: registryEntry.playerCount,
          supportedModes: registryEntry.supportedModes,
          version: "1.0.0"
        },
        data: mapData
      };

      // Convert simplified data to full MapData format
      const fullMapData = this.convertToMapData(presetData);

      const processedMap: PresetMap = {
        metadata: presetData.metadata,
        data: fullMapData
      };

      // Cache the map
      this.cache.set(mapId, processedMap);

      return processedMap;
    } catch (error) {
      console.error(`Error loading map ${mapId}:`, error);
      throw error;
    }
  }

  static async loadMapFromPath(path: string): Promise<PresetMap> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load map from path: ${path}`);
      }

      const mapData = await response.json();
      const validatedData = PresetMapDataSchema.parse(mapData);
      const fullMapData = this.convertToMapData(validatedData);

      return {
        metadata: validatedData.metadata,
        data: fullMapData
      };
    } catch (error) {
      console.error(`Error loading map from ${path}:`, error);
      throw error;
    }
  }

  private static convertToMapData(presetData: { metadata: any, data: SimplifiedMapData }): MapData {
    const { data } = presetData;
    
    // Convert difficulty
    const difficultyMap: Record<string, MapDifficulty> = {
      'easy': MapDifficulty.EASY,
      'medium': MapDifficulty.MEDIUM,
      'hard': MapDifficulty.HARD,
      'expert': MapDifficulty.EXTREME
    };

    // Convert paths to MapPath format
    const paths: MapPath[] = data.paths.map((pathNodes, index) => ({
      waypoints: pathNodes.map(node => ({ x: node.x, y: node.y })),
      width: 1,
      type: 'MAIN' as const,
      connections: []
    }));

    // Convert decorations
    const decorations: MapDecoration[] = (data.decorations || []).map(dec => ({
      type: dec.type,
      position: { x: dec.x, y: dec.y },
      rotation: 0,
      scale: 1,
      variant: dec.variant || 1,
      animated: false,
      blocking: false
    }));

    // Convert spawn zones
    const spawnZones = data.spawnZones.map(zone => ({
      x: zone.x + zone.width / 2, 
      y: zone.y + zone.height / 2
    }));

    const spawnZonesWithMetadata: SpawnZoneMetadata[] = data.spawnZones.map(zone => ({
      position: { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 },
      edgeType: 'left',
      priority: 1,
      conditional: {}
    }));

    // Generate terrain cells from tiles
    const terrainCells: { x: number; y: number; type: string }[] = [];
    data.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile.type === SimpleTerrainType.WATER) {
          terrainCells.push({ x, y, type: 'water' });
        } else if (tile.type === SimpleTerrainType.ROUGH) {
          terrainCells.push({ x, y, type: 'rough' });
        }
      });
    });

    // Determine player start position (center of the map)
    const playerStart = { x: Math.floor(data.width / 2), y: Math.floor(data.height / 2) };

    const mapData: MapData = {
      metadata: {
        name: presetData.metadata.name,
        description: presetData.metadata.description,
        difficulty: difficultyMap[presetData.metadata.difficulty],
        biome: BiomeType.GRASSLAND, // Default biome
        seed: Math.floor(Math.random() * 1000000),
        width: data.width,
        height: data.height,
        createdAt: new Date(),
        version: presetData.metadata.version
      },
      biomeConfig: BIOME_PRESETS[BiomeType.GRASSLAND],
      paths,
      decorations,
      effects: [],
      spawnZones,
      spawnZonesWithMetadata,
      playerStart,
      terrainCells,
      customProperties: {
        startingResources: data.startingResources || 500,
        waveCount: data.waveCount || 50,
        tiles: data.tiles // Store original tile data
      }
    };

    return mapData;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}