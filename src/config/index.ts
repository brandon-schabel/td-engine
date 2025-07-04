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
export * from './InventoryConfig';
export * from './ItemConfig';
export * from './RenderingConfig';
export * from './UpgradeConfig';

// New centralized configurations
export * from './ColorTheme';
export * from './AnimationConfig';
export * from './GameplayConstants';
export * from './ResponsiveConfig';

// Re-export specific commonly used configs for convenience
export { 
  GAME_INIT,
  TOWER_COSTS,
  BASE_PLAYER_STATS,
  GAME_MECHANICS,
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
} from './AudioConfig';

export {
  CAMERA_CONFIG,
  GRID_RENDER
} from './UIConfig';

export {
  INVENTORY_CONFIG,
  INVENTORY_UPGRADES
} from './InventoryConfig';

export {
  COLLECTIBLE_DROP_CHANCES,
} from './ItemConfig';

export {
  ENTITY_RENDER,
  TOWER_RENDER,
  ENEMY_RENDER,
  ANIMATION_CONFIG as RENDER_ANIMATION_CONFIG,
} from './RenderingConfig';

export {
  COLOR_THEME
} from './ColorTheme';



export {
  ANIMATION_CONFIG,
  getAnimationDuration
} from './AnimationConfig';

export {
  GAMEPLAY_CONSTANTS
} from './GameplayConstants';

