/**
 * UI and rendering configuration constants
 * Centralizes all UI-related dimensions, colors, and settings
 */

// HUD configuration
export const HUD_CONFIG = {
  padding: 10,
  fontSize: 18,
  lineHeight: 25,
  position: {
    x: 10,
    y: 10
  },
  background: {
    color: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 5
  },
  colors: {
    currency: '#FFD700',
    lives: '#FF4444',
    score: '#4CAF50',
    wave: '#2196F3',
    fps: '#FFFFFF'
  },
  // Wave progress bar
  waveProgress: {
    position: { x: 'center', y: 50 },
    width: 300,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    fillColor: '#2196F3',
    borderColor: '#FFFFFF',
    borderWidth: 2
  }
} as const;

// Game overlay configuration
export const OVERLAY_CONFIG = {
  opacity: 0.7,
  titleFontSize: 48,
  subtitleFontSize: 24,
  buttonFontSize: 20,
  fadeInDuration: 300,
  fadeOutDuration: 300,
  colors: {
    gameOver: {
      background: 'rgba(0, 0, 0, 0.7)',
      title: '#FF4444',
      text: '#FFFFFF'
    },
    victory: {
      background: 'rgba(0, 0, 0, 0.7)',
      title: '#4CAF50',
      text: '#FFFFFF'
    },
    paused: {
      background: 'rgba(0, 0, 0, 0.5)',
      title: '#FFFFFF',
      text: '#CCCCCC'
    }
  }
} as const;

// Camera configuration
export const CAMERA_CONFIG = {
  smoothing: 0.85, // Increased from 0.25 for much more responsive following
  minZoom: 0.3,
  maxZoom: 3.0,
  zoomSpeed: 0.1,
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

// Animation configuration
export const ANIMATION_TIMINGS = {
  uiTransition: 200,
  panelSlide: 300,
  buttonPress: 100,
  tooltipDelay: 500,
  notificationDuration: 3000,
  scoreCountUp: 1000,
  currencyChange: 500
} as const;

// Dialog configuration
export const DIALOG_CONFIG = {
  sizes: {
    small: 'clamp(300px, 85vw, 400px)',
    medium: 'clamp(320px, 90vw, 600px)',
    large: 'clamp(400px, 95vw, 800px)',
    fullscreen: '100vw'
  },
  mobile: {
    breakpoint: 768,
    fullscreenThreshold: 600,
    minTouchTarget: 44,
    gridColumns: {
      phone: 4,
      tablet: 6,
      desktop: 8
    }
  },
  animations: {
    fadeIn: 200,
    fadeOut: 200,
    scaleIn: 0.9,
    scaleOut: 0.9,
    swipeThreshold: 100
  },
  colors: {
    overlay: 'rgba(0, 0, 0, 0.8)',
    background: 'rgba(20, 20, 20, 0.95)',
    border: '#4CAF50',
    headerBg: 'rgba(76, 175, 80, 0.1)',
    footerBg: 'rgba(40, 40, 40, 0.8)'
  },
  spacing: {
    padding: 20,
    headerPadding: 16,
    footerPadding: 16,
    buttonGap: 12,
    itemGap: 4
  }
} as const;