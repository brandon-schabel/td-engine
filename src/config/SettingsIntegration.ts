import type { GameSettings } from './GameSettings';
import { DIFFICULTY_PRESETS, MAP_SIZE_CONFIGS, VISUAL_QUALITY_CONFIGS } from './GameSettings';
import { TOWER_COSTS, BASE_PLAYER_STATS, GAME_MECHANICS } from './GameConfig';

// Apply settings to create modified game configuration
export function applySettingsToGame(settings: GameSettings) {
  const difficultyPreset = DIFFICULTY_PRESETS[settings.difficulty];
  const mapConfig = MAP_SIZE_CONFIGS[settings.mapSize];
  const visualConfig = VISUAL_QUALITY_CONFIGS[settings.visualQuality];

  return {
    // Apply difficulty multipliers to base costs
    towerCosts: {
      BASIC: Math.round(TOWER_COSTS.BASIC * difficultyPreset.towerCostMultiplier),
      SNIPER: Math.round(TOWER_COSTS.SNIPER * difficultyPreset.towerCostMultiplier),
      RAPID: Math.round(TOWER_COSTS.RAPID * difficultyPreset.towerCostMultiplier),
      WALL: Math.round(TOWER_COSTS.WALL * difficultyPreset.towerCostMultiplier)
    },
    
    // Starting game state
    startingCurrency: difficultyPreset.startingCurrency,
    startingLives: difficultyPreset.startingLives,
    
    // Player stats (unchanged from base)
    playerStats: { ...BASE_PLAYER_STATS },
    
    // Game mechanics (unchanged from base)
    mechanics: { ...GAME_MECHANICS },
    
    // Enemy modifiers
    enemyHealthMultiplier: difficultyPreset.enemyHealthMultiplier,
    enemySpeedMultiplier: difficultyPreset.enemySpeedMultiplier,
    waveDelayMultiplier: difficultyPreset.waveDelayMultiplier,
    
    // Map configuration
    mapConfig: {
      ...mapConfig,
      biome: settings.terrain.toLowerCase(),
      pathComplexity: settings.pathComplexity === 'COMPLEX' ? 0.8 : 0.4
    },
    
    // Audio settings
    audioConfig: {
      masterVolume: settings.masterVolume,
      soundEnabled: settings.soundEnabled
    },
    
    // Visual settings
    visualConfig: {
      ...visualConfig,
      showFPS: settings.showFPS
    }
  };
}

// Convert settings to a simple game configuration object
export interface SimpleGameConfig {
  towerCosts: {
    BASIC: number;
    SNIPER: number;
    RAPID: number;
    WALL: number;
  };
  startingCurrency: number;
  startingLives: number;
  playerStats: typeof BASE_PLAYER_STATS;
  mechanics: typeof GAME_MECHANICS;
  enemyHealthMultiplier: number;
  enemySpeedMultiplier: number;
  waveDelayMultiplier: number;
  mapConfig: {
    width: number;
    height: number;
    cellSize: number;
    biome: string;
    pathComplexity: number;
  };
  audioConfig: {
    masterVolume: number;
    soundEnabled: boolean;
  };
  visualConfig: {
    particleCount: number;
    animationDetails: boolean;
    glowEffects: boolean;
    targetFPS: number;
    showFPS: boolean;
  };
}

// Helper to get current game configuration based on settings
export function getCurrentGameConfig(): SimpleGameConfig {
  // This can be expanded to get settings from SettingsManager if needed
  // For now, return a default configuration
  const defaultSettings: GameSettings = {
    difficulty: 'NORMAL',
    masterVolume: 0.7,
    soundEnabled: true,
    visualQuality: 'MEDIUM',
    showFPS: false,
    mapSize: 'MEDIUM',
    terrain: 'FOREST',
    pathComplexity: 'SIMPLE'
  };
  
  return applySettingsToGame(defaultSettings);
}