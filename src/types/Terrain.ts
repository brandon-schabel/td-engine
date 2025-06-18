/**
 * Terrain type definitions
 * Re-exports terrain-related types from other modules
 */

// Re-export BiomeType from MapData
export { BiomeType } from './MapData';

// Re-export CellType as TerrainType for terrain configuration
export { CellType as TerrainType } from '@/systems/Grid';