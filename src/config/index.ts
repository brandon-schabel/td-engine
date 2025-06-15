/**
 * Master configuration index
 * Re-exports all configuration modules for easy importing
 */

// Core game configuration
export * from './GameConfig';
export * from './GameSettings';

// Entity-specific configuration
export * from './PlayerConfig';
export * from './TowerConfig';
export * from './EnemyConfig';

// System configuration
export * from './AudioConfig';
export * from './UIConfig';

// Re-export specific commonly used configs for convenience
export { 
  TOWER_COSTS,
  BASE_PLAYER_STATS,
  GAME_MECHANICS,
  UPGRADE_CONFIG,
  COLOR_CONFIG,
  RENDER_CONFIG
} from './GameConfig';

export {
  PLAYER_ABILITIES,
  PLAYER_UPGRADES,
  POWER_UP_CONFIG
} from './PlayerConfig';

export {
  TOWER_STATS,
  TOWER_UPGRADES
} from './TowerConfig';

export {
  ENEMY_STATS,
  ENEMY_BEHAVIOR
} from './EnemyConfig';

export {
  AUDIO_SYSTEM,
  SOUND_VOLUMES
} from './AudioConfig';

export {
  HUD_CONFIG,
  CAMERA_CONFIG,
  GRID_RENDER
} from './UIConfig';