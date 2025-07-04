/**
 * UI and rendering configuration constants
 * Centralizes all UI-related dimensions, colors, and settings
 */

// Camera configuration
export const CAMERA_CONFIG = {
  smoothing: 0.02, // Increased from 0.25 for much more responsive following
  minZoom: 0.3,
  maxZoom: 3.0,
  zoomSpeed: 0.025, // Reduced from 0.1 for finer zoom control
  zoomSmoothing: 0.15,
  edgePanSpeed: 5,
  edgePanZone: 50, // pixels from edge
  followPlayerOffset: {
    x: 0,
    y: 0 // Center directly on player (was -50)
  }
} as const;

// Grid rendering configuration
export const GRID_RENDER = {
  defaultCellSize: 32,
  gridLineColor: '#333333',
  gridLineWidth: 0.5,
  cellColors: {
    EMPTY: '#1a1a1a',
    PATH: '#654321',
    TOWER: '#2a2a2a',
    OBSTACLE: '#666666',
    SPAWN: '#4a4a00',
    DESTINATION: '#004a00',
    BLOCKED: '#444444'
  },
  cellBorders: {
    ROUGH_TERRAIN: {
      color: '#8B4513',
      width: 2,
      dashPattern: [3, 3]
    }
  },
  movementSpeeds: {
    ROUGH_TERRAIN: 0.5,
    PATH: 1.2,
    DEFAULT: 1.0
  }
} as const;

// Touch UI configuration
export const TOUCH_UI = {
  virtualJoystick: {
    size: 120,
    knobSize: 40,
    opacity: 0.6,
    activeOpacity: 0.8,
    position: { x: 100, y: -100 } // From bottom-left
  },
  actionButtons: {
    size: 60,
    spacing: 10,
    opacity: 0.7,
    activeOpacity: 0.9,
    position: { x: -100, y: -100 } // From bottom-right
  },
  gestureThresholds: {
    tap: 10, // pixels
    longPress: 500, // milliseconds
    swipe: 50, // pixels
    pinch: 20 // pixels
  },
  touchTargetSize: 44 // Minimum touch target size (accessibility)
} as const;

