// Simplified game settings for user preferences
export interface GameSettings {
  // Difficulty preset
  difficulty: 'CASUAL' | 'NORMAL' | 'CHALLENGE';
  
  // Audio settings
  masterVolume: number; // 0-1
  soundEnabled: boolean;
  
  // Visual settings
  visualQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  showFPS: boolean;
  
  // Map preferences
  mapSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  terrain: 'FOREST' | 'DESERT' | 'ARCTIC';
  pathComplexity: 'SIMPLE' | 'COMPLEX';
}

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'NORMAL',
  masterVolume: 0.7,
  soundEnabled: true,
  visualQuality: 'MEDIUM',
  showFPS: false,
  mapSize: 'MEDIUM',
  terrain: 'FOREST',
  pathComplexity: 'SIMPLE'
};

// Difficulty presets that modify game constants
export const DIFFICULTY_PRESETS = {
  CASUAL: {
    startingCurrency: 150,
    startingLives: 25,
    towerCostMultiplier: 0.8,
    enemyHealthMultiplier: 0.8,
    enemySpeedMultiplier: 0.9,
    waveDelayMultiplier: 1.5
  },
  NORMAL: {
    startingCurrency: 100,
    startingLives: 20,
    towerCostMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    waveDelayMultiplier: 1.0
  },
  CHALLENGE: {
    startingCurrency: 75,
    startingLives: 15,
    towerCostMultiplier: 1.2,
    enemyHealthMultiplier: 1.3,
    enemySpeedMultiplier: 1.1,
    waveDelayMultiplier: 0.8
  }
} as const;

// Map size configurations
export const MAP_SIZE_CONFIGS = {
  SMALL: { width: 60, height: 60, cellSize: 32 },
  MEDIUM: { width: 80, height: 80, cellSize: 32 },
  LARGE: { width: 120, height: 120, cellSize: 32 }
} as const;

// Visual quality settings
export const VISUAL_QUALITY_CONFIGS = {
  LOW: {
    particleCount: 0.5,
    animationDetails: false,
    glowEffects: false,
    targetFPS: 30
  },
  MEDIUM: {
    particleCount: 1.0,
    animationDetails: true,
    glowEffects: true,
    targetFPS: 60
  },
  HIGH: {
    particleCount: 1.5,
    animationDetails: true,
    glowEffects: true,
    targetFPS: 60
  }
} as const;

// Settings persistence
const SETTINGS_KEY = 'tower-defense-settings';

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: GameSettings;

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
}