/**
 * UI Constants Configuration
 * Centralizes all UI dimensions, spacing, and layout values
 */

export const UI_CONSTANTS = {
  // Virtual joystick dimensions
  virtualJoystick: {
    base: {
      size: 120,
      opacity: 0.5,
      activeOpacity: 0.7,
    },
    knob: {
      size: 40,
      maxDistance: 40,
    },
    position: {
      bottom: 30,
      left: 30,
    },
  },

  // Mobile controls
  mobileControls: {
    button: {
      size: 60,
      spacing: 10,
      opacity: 0.6,
      activeOpacity: 0.8,
    },
    actionButton: {
      width: 80,
      height: 80,
    },
    position: {
      bottom: 30,
      right: 30,
    },
  },

  // Dialog dimensions
  dialog: {
    minWidth: 300,
    maxWidth: 600,
    padding: 20,
    borderRadius: 8,
    backdrop: {
      opacity: 0.7,
    },
    button: {
      minWidth: 100,
      height: 40,
      spacing: 10,
    },
  },

  // HUD elements
  hud: {
    padding: 10,
    spacing: 15,
    height: 60,
    statBar: {
      width: 200,
      height: 30,
    },
    minimap: {
      width: 150,
      height: 150,
    },
  },

  // Tower placement UI
  towerPlacement: {
    grid: {
      opacity: 0.3,
      highlightOpacity: 0.5,
    },
    preview: {
      opacity: 0.7,
      invalidOpacity: 0.3,
    },
    rangeIndicator: {
      opacity: 0.2,
      strokeOpacity: 0.4,
    },
  },

  // Floating UI elements
  floatingUI: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 2,
    maxWidth: 300,
    offset: 10,
    arrow: {
      size: 8,
    },
  },

  // Menu dimensions
  menu: {
    width: 400,
    buttonHeight: 50,
    buttonSpacing: 10,
    padding: 30,
    title: {
      fontSize: 36,
      marginBottom: 40,
    },
  },

  // Inventory UI
  inventory: {
    slot: {
      size: 50,
      spacing: 5,
      borderWidth: 2,
    },
    grid: {
      columns: 10,
      rows: 5,
    },
    equipped: {
      slotSize: 60,
      spacing: 10,
    },
  },

  // Health bars
  healthBar: {
    width: 40,
    height: 4,
    offset: 10,
    borderWidth: 1,
  },

  // Wave progress bar
  waveProgress: {
    width: 300,
    height: 20,
    borderRadius: 10,
    position: {
      top: 10,
      centerOffset: 150, // Half of width
    },
  },

  // Combat UI
  combat: {
    aimer: {
      length: 100,
      width: 2,
      dotSize: 4,
    },
    damageText: {
      fontSize: 16,
      duration: 1000,
      riseDistance: 30,
    },
  },

  // Loading screen
  loading: {
    spinner: {
      size: 50,
      borderWidth: 4,
    },
    text: {
      fontSize: 24,
      marginTop: 20,
    },
  },

  // Debug UI
  debug: {
    panel: {
      width: 300,
      padding: 10,
      fontSize: 12,
      lineHeight: 18,
    },
  },

  // General spacing
  spacing: {
    xs: 5,
    sm: 10,
    md: 15,
    lg: 20,
    xl: 30,
  },

  // Z-index layers
  zIndex: {
    background: 0,
    gameElements: 10,
    ui: 100,
    hud: 200,
    dialog: 300,
    modal: 400,
    tooltip: 500,
    debug: 1000,
  },
} as const;

export type UIConstants = typeof UI_CONSTANTS;