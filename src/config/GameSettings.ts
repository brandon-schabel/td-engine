// Simplified game settings for user preferences
export interface GameSettings {
  // Difficulty preset
  difficulty: 'CASUAL' | 'NORMAL' | 'CHALLENGE';

  // Audio settings
  masterVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  soundEnabled: boolean;

  // Visual settings
  visualQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  showFPS: boolean;
  showFps: boolean; // Alias for compatibility
  particleEffects: boolean;

  // Gameplay settings
  autoPause: boolean;

  // Debug settings
  showPathDebug: boolean;

  // Map preferences
  mapSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  terrain: 'FOREST' | 'DESERT' | 'ARCTIC';
  pathComplexity: 'SIMPLE' | 'COMPLEX';

  // Mobile controls
  mobileJoystickEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  touchControlsLayout: 'default' | 'lefty';
}

// Difficulty enum for UI compatibility
export enum Difficulty {
  EASY = 'CASUAL',
  NORMAL = 'NORMAL',
  HARD = 'CHALLENGE',
  EXPERT = 'CHALLENGE' // Map to CHALLENGE for now
}

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'NORMAL',
  masterVolume: 0.7,
  sfxVolume: 0.7,
  musicVolume: 0.5,
  soundEnabled: true,
  visualQuality: 'MEDIUM',
  showFPS: false,
  showFps: false,
  particleEffects: true,
  autoPause: true,
  showPathDebug: false,
  mapSize: 'MEDIUM',
  terrain: 'FOREST',
  pathComplexity: 'SIMPLE',
  mobileJoystickEnabled: true,
  hapticFeedbackEnabled: true,
  touchControlsLayout: 'default'
};

// Load settings from localStorage
export function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem('gameSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old volume values (0-100) to new range (0-1)
      if (parsed.masterVolume > 1) {
        parsed.masterVolume = parsed.masterVolume / 100;
      }
      if (parsed.sfxVolume > 1) {
        parsed.sfxVolume = parsed.sfxVolume / 100;
      }
      if (parsed.musicVolume > 1) {
        parsed.musicVolume = parsed.musicVolume / 100;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Difficulty presets that modify game constants
export const DIFFICULTY_PRESETS = {
  CASUAL: {
    startingCurrency: 100,
    startingLives: 17,
    towerCostMultiplier: 1.2,
    enemyHealthMultiplier: 0.84,  // Reduced by 30% from 1.2
    enemySpeedMultiplier: 0.84,   // Reduced by 30% from 1.2
    waveDelayMultiplier: 1.0
  },
  NORMAL: {
    startingCurrency: 70,
    startingLives: 13,
    towerCostMultiplier: 1.5,
    enemyHealthMultiplier: 1.05,  // Reduced by 30% from 1.5
    enemySpeedMultiplier: 0.91,   // Reduced by 30% from 1.3
    waveDelayMultiplier: 0.7
  },
  CHALLENGE: {
    startingCurrency: 50,
    startingLives: 10,
    towerCostMultiplier: 1.8,
    enemyHealthMultiplier: 1.4,   // Reduced by 30% from 2.0
    enemySpeedMultiplier: 1.05,   // Reduced by 30% from 1.5
    waveDelayMultiplier: 0.5
  }
} as const;

// Map size configurations
export const MAP_SIZE_CONFIGS = {
  SMALL: { width: 30, height: 22, cellSize: 32 },
  MEDIUM: { width: 45, height: 33, cellSize: 32 },
  LARGE: { width: 60, height: 45, cellSize: 32 }
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

export class SettingsManager implements GameSettings {
  private static instance: SettingsManager;
  private _settings: GameSettings;

  // GameSettings interface properties
  get difficulty() { return this._settings.difficulty; }
  set difficulty(value) { this._settings.difficulty = value; }

  get masterVolume() { return this._settings.masterVolume; }
  set masterVolume(value) { this._settings.masterVolume = value; }

  get sfxVolume() { return this._settings.sfxVolume; }
  set sfxVolume(value) { this._settings.sfxVolume = value; }

  get musicVolume() { return this._settings.musicVolume; }
  set musicVolume(value) { this._settings.musicVolume = value; }

  get soundEnabled() { return this._settings.soundEnabled; }
  set soundEnabled(value) { this._settings.soundEnabled = value; }

  get visualQuality() { return this._settings.visualQuality; }
  set visualQuality(value) { this._settings.visualQuality = value; }

  get showFPS() { return this._settings.showFPS; }
  set showFPS(value) { this._settings.showFPS = value; }

  get showFps() { return this._settings.showFps; }
  set showFps(value) { this._settings.showFps = value; }

  get particleEffects() { return this._settings.particleEffects; }
  set particleEffects(value) { this._settings.particleEffects = value; }

  get autoPause() { return this._settings.autoPause; }
  set autoPause(value) { this._settings.autoPause = value; }

  get showPathDebug() { return this._settings.showPathDebug; }
  set showPathDebug(value) { this._settings.showPathDebug = value; }

  get mapSize() { return this._settings.mapSize; }
  set mapSize(value) { this._settings.mapSize = value; }

  get terrain() { return this._settings.terrain; }
  set terrain(value) { this._settings.terrain = value; }

  get pathComplexity() { return this._settings.pathComplexity; }
  set pathComplexity(value) { this._settings.pathComplexity = value; }

  get mobileJoystickEnabled() { return this._settings.mobileJoystickEnabled; }
  set mobileJoystickEnabled(value) { this._settings.mobileJoystickEnabled = value; }

  get hapticFeedbackEnabled() { return this._settings.hapticFeedbackEnabled; }
  set hapticFeedbackEnabled(value) { this._settings.hapticFeedbackEnabled = value; }

  get touchControlsLayout() { return this._settings.touchControlsLayout; }
  set touchControlsLayout(value) { this._settings.touchControlsLayout = value; }

  private constructor() {
    this._settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  getSettings(): GameSettings {
    return { ...this._settings };
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this._settings = { ...this._settings, ...newSettings };
    this.saveSettings();
  }

  reset(): void {
    this._settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  save(): void {
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.reset();
  }

  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old volume values (0-100) to new range (0-1)
        if (parsed.masterVolume > 1) {
          parsed.masterVolume = parsed.masterVolume / 100;
        }
        if (parsed.sfxVolume > 1) {
          parsed.sfxVolume = parsed.sfxVolume / 100;
        }
        if (parsed.musicVolume > 1) {
          parsed.musicVolume = parsed.musicVolume / 100;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
}

// Namespace pattern to allow both interface and class usage
export namespace GameSettings {
  export const getInstance = SettingsManager.getInstance;
}