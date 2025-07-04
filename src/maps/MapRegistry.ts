import { MapRegistryEntry, PresetMap } from './types';
import { MapLoader } from './MapLoader';
import { GameMode } from '@/types/GameMode';

export class MapRegistry {
  private static maps: Map<string, MapRegistryEntry> = new Map();
  private static initialized = false;

  static initializeSync(): void {
    if (this.initialized) return;
    this.registerAllMaps();
    this.initialized = true;
  }

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    this.registerAllMaps();
    this.initialized = true;
  }

  private static registerAllMaps(): void {
    // Register all preset maps
    this.registerMap({
      id: 'classic',
      name: 'Classic Path',
      description: 'A traditional tower defense map with a winding path',
      difficulty: 'easy',
      playerCount: { min: 1, max: 1 },
      supportedModes: [GameMode.CLASSIC, GameMode.SURVIVAL],
      thumbnail: '/assets/maps/classic-thumb.png',
      loadMap: () => MapLoader.loadMap('classic')
    });

    this.registerMap({
      id: 'crossroads',
      name: 'Crossroads',
      description: 'Multiple paths converge at a central point',
      difficulty: 'medium',
      playerCount: { min: 1, max: 2 },
      supportedModes: [GameMode.CLASSIC, GameMode.SURVIVAL, GameMode.COOP],
      thumbnail: '/assets/maps/crossroads-thumb.png',
      loadMap: () => MapLoader.loadMap('crossroads')
    });

    this.registerMap({
      id: 'spiral',
      name: 'The Spiral',
      description: 'Enemies spiral inward toward the center',
      difficulty: 'hard',
      playerCount: { min: 1, max: 1 },
      supportedModes: [GameMode.CLASSIC, GameMode.SURVIVAL],
      thumbnail: '/assets/maps/spiral-thumb.png',
      loadMap: () => MapLoader.loadMap('spiral')
    });

    this.registerMap({
      id: 'arena',
      name: 'Battle Arena',
      description: 'Open arena designed for multiplayer battles',
      difficulty: 'medium',
      playerCount: { min: 2, max: 4 },
      supportedModes: [GameMode.VERSUS, GameMode.COOP],
      thumbnail: '/assets/maps/arena-thumb.png',
      loadMap: () => MapLoader.loadMap('arena')
    });

    this.registerMap({
      id: 'tutorial',
      name: 'Training Grounds',
      description: 'Simple map perfect for learning the basics',
      difficulty: 'easy',
      playerCount: { min: 1, max: 1 },
      supportedModes: [GameMode.CLASSIC],
      thumbnail: '/assets/maps/tutorial-thumb.png',
      loadMap: () => MapLoader.loadMap('tutorial')
    });
  }

  static registerMap(entry: MapRegistryEntry): void {
    this.maps.set(entry.id, entry);
  }

  static getMap(id: string): MapRegistryEntry | undefined {
    return this.maps.get(id);
  }

  static getAllMaps(): MapRegistryEntry[] {
    return Array.from(this.maps.values());
  }

  static getMapsForMode(mode: GameMode): MapRegistryEntry[] {
    return this.getAllMaps().filter(map => 
      map.supportedModes.includes(mode)
    );
  }

  static getMapsForPlayerCount(count: number): MapRegistryEntry[] {
    return this.getAllMaps().filter(map => 
      count >= map.playerCount.min && count <= map.playerCount.max
    );
  }

  static async loadMap(id: string): Promise<PresetMap> {
    const entry = this.getMap(id);
    if (!entry) {
      throw new Error(`Map not found: ${id}`);
    }
    return entry.loadMap();
  }

  static getDefaultMapForMode(mode: GameMode): string {
    const modeDefaults: Record<GameMode, string> = {
      [GameMode.CLASSIC]: 'classic',
      [GameMode.SURVIVAL]: 'spiral',
      [GameMode.VERSUS]: 'arena',
      [GameMode.COOP]: 'crossroads'
    };
    return modeDefaults[mode] || 'classic';
  }
}