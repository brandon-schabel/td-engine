/**
 * Color Theme Configuration
 * Centralizes all game colors for easy theming and consistency
 */

export const COLOR_THEME = {
  // Enemy colors
  enemies: {
    outline: '#ff0000',
    healthBar: {
      background: 'rgba(0, 0, 0, 0.7)',
      fill: '#ff0000',
      border: '#000000',
    },
    damage: '#ff0000',
    spawn: 'rgba(255, 0, 0, 0.3)',
  },

  // Tower colors
  towers: {
    basic: '#4169e1',
    laser: '#ff1493',
    frost: '#00bfff',
    artillery: '#ff8c00',
    selection: {
      valid: 'rgba(0, 255, 0, 0.3)',
      invalid: 'rgba(255, 0, 0, 0.3)',
      outline: '#00ff00',
    },
    range: {
      fill: 'rgba(255, 255, 255, 0.1)',
      stroke: 'rgba(255, 255, 255, 0.3)',
    },
    upgradeDots: {
      fill: '#ffd700',
      stroke: '#000000',
    },
  },

  // Player colors
  player: {
    fill: '#00ff00',
    outline: '#008000',
    healthBar: {
      background: 'rgba(0, 0, 0, 0.7)',
      fill: '#00ff00',
      border: '#000000',
    },
    aimer: '#ff0000',
    combat: {
      aimLine: '#ff0000',
      attackRange: 'rgba(255, 0, 0, 0.1)',
    },
  },

  // UI colors
  ui: {
    background: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      danger: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
    },
    button: {
      primary: '#4169e1',
      secondary: '#808080',
      danger: '#ff0000',
      success: '#00ff00',
      hover: 'rgba(255, 255, 255, 0.1)',
      pressed: 'rgba(0, 0, 0, 0.2)',
    },
    border: {
      default: '#333333',
      active: '#ffffff',
      error: '#ff0000',
    },
    healthBar: {
      player: '#00ff00',
      enemy: '#ff0000',
      background: 'rgba(0, 0, 0, 0.7)',
    },
    currency: '#ffd700',
    score: '#ffffff',
    wave: '#ff8c00',
  },

  // Game state colors
  states: {
    paused: 'rgba(0, 0, 0, 0.5)',
    gameOver: 'rgba(255, 0, 0, 0.3)',
    victory: 'rgba(0, 255, 0, 0.3)',
    loading: 'rgba(0, 0, 0, 0.8)',
  },

  // Effects colors
  effects: {
    damage: '#ff0000',
    heal: '#00ff00',
    freeze: '#00bfff',
    explosion: '#ff8c00',
    powerUp: '#ffd700',
  },

  // Map colors
  map: {
    grid: 'rgba(255, 255, 255, 0.1)',
    path: '#8b4513',
    blocked: 'rgba(255, 0, 0, 0.3)',
    spawn: 'rgba(0, 255, 0, 0.3)',
    base: 'rgba(0, 0, 255, 0.3)',
  },

  // Debug colors
  debug: {
    collision: 'rgba(255, 0, 255, 0.5)',
    pathfinding: 'rgba(0, 255, 255, 0.5)',
    grid: 'rgba(255, 255, 255, 0.2)',
    bounds: 'rgba(255, 255, 0, 0.5)',
  },
} as const;

export type ColorTheme = typeof COLOR_THEME;