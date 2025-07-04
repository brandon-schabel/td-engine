/**
 * Rendering system configuration constants
 * Centralizes all rendering-related settings, styles, and visual parameters
 */

// Zoom-aware rendering configuration
export const ZOOM_RENDER_CONFIG = {
  // Line width constraints
  gridLineWidth: {
    base: 1,          // Base line width at 1x zoom
    min: 0.5,         // Minimum line width
    max: 2,           // Maximum line width
    scaleInversely: true  // Scale inversely with zoom
  },
  strokeWidth: {
    thin: 1,          // Thin strokes (always fixed)
    normal: 2,        // Normal strokes (always fixed)
    thick: 3,         // Thick strokes (always fixed)
    scaleWithZoom: false  // Don't scale stroke widths
  },
  // Entity scaling
  entityScale: {
    scaleGeometry: true,    // Scale entity sizes with zoom
    scaleStrokes: false,    // Don't scale stroke widths
    scaleFonts: true,       // Scale font sizes with zoom
    minFontSize: 8,         // Minimum readable font size
    maxFontSize: 24         // Maximum font size
  }
} as const;

// Entity rendering configuration
export const ENTITY_RENDER = {
  // Health bars
  healthBar: {
    width: 56,  // Doubled from 28
    height: 10, // Doubled from 5
    offset: 20, // Increased from 15
    borderWidth: 2, // Doubled from 1
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: '#000000',
    colors: {
      high: '#4CAF50',    // >60% health
      medium: '#FF9800',  // 30-60% health
      low: '#F44336'      // <30% health
    }
  },

  // Upgrade indicators
  upgradeDots: {
    radius: 3,
    spacing: 8,
    spacingCompact: 4,
    colors: ['#FF4444', '#44FF44', '#4444FF'], // Red, Green, Blue
    maxVisible: 5,
    distanceOffset: 8,
    angleSpacing: 120
  },

  // Selection and hover effects
  selection: {
    strokeWidth: 3,
    strokeColor: '#4CAF50',
    glowRadius: 20,
    glowColor: 'rgba(76, 175, 80, 0.5)',
    animationSpeed: 0.002,
    radiusOffset: 8,
    glowRadiusOffset: 12
  },

  // Shadow configuration
  shadows: {
    blur: 10,
    offsetX: 2,
    offsetY: 2,
    color: 'rgba(0, 0, 0, 0.3)'
  },

  // Line styles
  lineWidths: {
    thin: 1,
    normal: 2,
    thick: 3,
    extra: 4
  },

  // Dash patterns
  dashPatterns: {
    none: [],
    dashed: [5, 5],
    dotted: [2, 3],
    dashDot: [10, 5, 2, 5]
  },

  // Debug visualization
  debug: {
    collisionBoxColor: 'rgba(255, 0, 255, 0.5)',
    pathColor: 'rgba(0, 255, 255, 0.5)',
    gridColor: 'rgba(255, 255, 255, 0.2)',
    vectorColor: 'rgba(255, 255, 0, 0.8)'
  },

  // Visibility settings
  visibility: {
    minTargetDistance: 10
  },

  // Glow effects
  glowEffects: {
    healthPickup: 10,
    powerUp: 15
  },

  // Pickup rendering
  pickups: {
    health: {
      crossSize: 6
    }
  },

  // Power-up icon dimensions
  powerUpIcons: {
    size: 8,
    shieldRadius: 8,
    textOffset: 3
  }
} as const;

// Tower-specific rendering
export const TOWER_RENDER = {
  baseOutlineWidth: 2,
  upgradedOutlineWidth: 3,
  rangeIndicator: {
    fillOpacity: 0.1,
    strokeOpacity: 0.3,
    strokeWidth: 2,
    dashPattern: [5, 5]
  },
  placement: {
    ghostOpacity: 0.6,
    validColor: 'rgba(76, 175, 80, 0.6)',
    invalidColor: 'rgba(244, 67, 54, 0.6)',
    rangePreviewOpacity: 0.3
  },
  targetLine: {
    width: 2,
    dashPattern: [5, 3],
    color: 'rgba(255, 255, 255, 0.5)'
  },
  selection: {
    dashPattern: [5, 3]
  }
} as const;

// Enemy-specific rendering
export const ENEMY_RENDER = {
  damageFlash: {
    duration: 100, // milliseconds
    color: '#FFFFFF'
  },
  deathAnimation: {
    duration: 300, // milliseconds
    fadeOut: true,
    particleCount: 5
  },
  boss: {
    glowRadius: 10,
    glowColor: 'rgba(255, 0, 0, 0.5)',
    outlineWidth: 3,
    healthBarScale: 1.5
  },
  pathIndicator: {
    opacity: 0.3,
    width: 2,
    color: 'rgba(255, 255, 255, 0.3)'
  },
  outline: {
    towerAttacker: 2,
    playerAttacker: 2,
    default: 1
  },
  targetLine: {
    dashPattern: [3, 3],
    width: 1
  }
} as const;



// Grid and terrain rendering
export const GRID_RENDER_DETAILS = {
  gridLines: {
    color: '#333333',
    width: 0.5,
    opacity: 0.5
  },
  cellHighlight: {
    strokeWidth: 2,
    fillOpacity: 0.3,
    animationSpeed: 0.002
  },
  terrainColors: {
    EMPTY: '#1a1a1a',
    PATH: '#654321',
    TOWER: '#2a2a2a',
    OBSTACLE: '#666666',
    SPAWN: '#4a4a00',
    DESTINATION: '#004a00',
    BLOCKED: '#444444',
    ROUGH_TERRAIN: '#8B4513',
    WATER: '#1E6BA8',
    BRIDGE: '#8B6914'
  },
  terrainEffects: {
    ROUGH_TERRAIN: {
      borderWidth: 2,
      borderColor: '#8B4513',
      dashPattern: [3, 3]
    },
    WATER: {
      waveColor: 'rgba(255, 255, 255, 0.3)',
      waveLineWidth: 1,
      waveAmplitude: 3
    },
    BRIDGE: {
      plankColor: '#8B6914',
      railColor: '#654321',
      railWidth: 2,
      plankCount: 5
    }
  }
} as const;

// Animation configuration
export const ANIMATION_CONFIG = {
  bobAmount: 5,
  bobSpeed: 0.002, // radians per millisecond
  rotationSpeed: 0.001, // radians per millisecond
  pulseSpeed: 0.004,
  cameraSmoothing: 0.25,

  // PowerUp-specific animations (more dramatic)
  powerUp: {
    bobAmount: 8,
    bobSpeed: 0.003,
    rotationSpeed: 0.002,
  },

  // Collectible animations
  collectible: {
    floatHeight: 5,
    floatSpeed: 0.002,
    spinSpeed: 0.003,
    pulseAmount: 0.1
  }
} as const;

// Performance optimization settings
export const RENDER_OPTIMIZATION = {
  culling: {
    enabled: true,
    margin: 25 // pixels outside viewport to still render (reduced from 50 for better performance)
  },
  batching: {
    enabled: true,
    maxBatchSize: 1000
  },
  LOD: {
    enabled: true,
    // Zoom-based LOD thresholds (defined in Renderer)
    // high: 0.8x zoom = FULL detail
    // medium: 0.5x zoom = MEDIUM detail  
    // low: 0.35x zoom = LOW detail
    // below 0.35x zoom = CULLED
    levels: {
      FULL: 0,      // Full detail (textures/SVGs, all effects)
      MEDIUM: 1,    // Reduced detail (textures/SVGs, no target lines)
      LOW: 2,       // Minimal detail (simple colored circles only)
      CULLED: 3     // Not rendered
    }
  }
} as const;
