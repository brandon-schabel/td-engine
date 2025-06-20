/**
 * Color Theme Configuration
 * Centralizes all game colors for easy theming and consistency
 */

export const COLOR_THEME = {
  // Enemy colors
  enemies: {
    basic: '#F44336',
    fast: '#FF5722',
    tank: '#9C27B0',
    default: '#F44336',
    outline: '#ff0000',
    outlines: {
      tower: '#FFD700',     // Gold outline for tower attackers
      player: '#FF4444',    // Red outline for player attackers
      default: '#000000',   // Default outline
    },
    targetLine: {
      tower: 'rgba(255, 215, 0, 0.5)',   // Gold target line
      player: 'rgba(255, 68, 68, 0.5)',   // Red target line
    },
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
    wall: '#666666',
    outline: {
      base: '#333333',
      upgraded: '#222222',
    },
    selection: {
      valid: 'rgba(0, 255, 0, 0.3)',
      invalid: 'rgba(255, 0, 0, 0.3)',
      outline: '#00ff00',
      indicator: '#4CAF50',
      glow: 'rgba(76, 175, 80, 0.3)',
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
    health: {
      high: '#4CAF50',
      medium: '#FF9800',
      low: '#F44336',
      critical: '#ff0000',
    },
    currency: '#ffd700',
    score: '#ffffff',
    wave: '#ff8c00',
    controls: {
      joystick: {
        base: 'rgba(255, 255, 255, 0.2)',
        baseBorder: 'rgba(255, 255, 255, 0.4)',
        knob: 'rgba(255, 255, 255, 0.5)',
        knobBorder: 'rgba(255, 255, 255, 0.8)',
      },
    },
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