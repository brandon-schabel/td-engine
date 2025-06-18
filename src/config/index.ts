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
export * from './MapConfig';
export * from './InventoryConfig';
export * from './ItemConfig';
export * from './RenderingConfig';

// New centralized configurations
export * from './ColorTheme';
export * from './UIConstants';
export * from './AnimationConfig';
export * from './GameplayConstants';
export * from './ResponsiveConfig';

// Re-export specific commonly used configs for convenience
export { 
  GAME_INIT,
  TOWER_COSTS,
  BASE_PLAYER_STATS,
  GAME_MECHANICS,
  UPGRADE_CONFIG,
  COLOR_CONFIG
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

export {
  MAP_SIZES,
  DEFAULT_MAP_CONFIG,
  BIOME_CONFIG
} from './MapConfig';

export {
  INVENTORY_CONFIG,
  INVENTORY_UPGRADES
} from './InventoryConfig';

export {
  ITEM_DROP_CONFIG,
  COLLECTIBLE_DROP_CHANCES,
  RARITY_DROP_WEIGHTS
} from './ItemConfig';

export {
  ENTITY_RENDER,
  TOWER_RENDER,
  ENEMY_RENDER,
  PLAYER_RENDER,
  ANIMATION_CONFIG as RENDER_ANIMATION_CONFIG,
  RENDER_SETTINGS
} from './RenderingConfig';

export {
  COLOR_THEME
} from './ColorTheme';

export {
  UI_CONSTANTS
} from './UIConstants';

export {
  ANIMATION_CONFIG,
  getAnimationDuration,
  interpolate
} from './AnimationConfig';

export {
  GAMEPLAY_CONSTANTS
} from './GameplayConstants';

export {
  RESPONSIVE_CONFIG,
  getBreakpoint,
  getScaleFactor,
  isMobile,
  isTablet,
  isDesktop
} from './ResponsiveConfig';