/**
 * Responsive Design Configuration
 * Centralizes breakpoints, scaling factors, and responsive behavior
 */

export const RESPONSIVE_CONFIG = {
  // Breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    wide: 1920,
    ultrawide: 2560,
    
    // Orientation-specific
    landscape: {
      mobile: 600,
      tablet: 900,
    },
  },

  // Safe areas for mobile devices
  safeAreas: {
    top: 20, // Status bar
    bottom: 34, // Home indicator
    left: 0,
    right: 0,
    // iPhone notch areas
    notch: {
      portrait: 44,
      landscape: 0,
    },
  },

  // Scaling factors
  scaling: {
    // UI scaling based on screen size
    ui: {
      mobile: 0.8,
      tablet: 0.9,
      desktop: 1.0,
      wide: 1.1,
    },
    // Game world scaling
    game: {
      minZoom: 0.5,
      maxZoom: 2.0,
      defaultZoom: 1.0,
      zoomSpeed: 0.1,
      touchZoomSensitivity: 0.01,
    },
    // Font scaling
    font: {
      mobile: 0.9,
      tablet: 0.95,
      desktop: 1.0,
      minSize: 12,
      maxSize: 48,
    },
  },

  // Touch settings
  touch: {
    tapThreshold: 10, // Pixels moved before it's not a tap
    holdThreshold: 500, // Ms before tap becomes hold
    swipeThreshold: 50, // Minimum pixels for swipe
    swipeTimeThreshold: 300, // Maximum ms for swipe
    doubleTapThreshold: 300, // Ms between taps
    dragDeadzone: 5, // Pixels before drag starts
  },

  // Layout adjustments
  layout: {
    // HUD positioning
    hud: {
      mobile: {
        topOffset: 60,
        sideMargin: 10,
        bottomOffset: 100,
      },
      tablet: {
        topOffset: 40,
        sideMargin: 20,
        bottomOffset: 80,
      },
      desktop: {
        topOffset: 20,
        sideMargin: 30,
        bottomOffset: 40,
      },
    },
    // Control positioning
    controls: {
      mobile: {
        joystickOffset: { x: 30, y: 30 },
        buttonOffset: { x: 30, y: 30 },
        buttonSize: 60,
      },
      tablet: {
        joystickOffset: { x: 40, y: 40 },
        buttonOffset: { x: 40, y: 40 },
        buttonSize: 70,
      },
    },
  },

  // Orientation handling
  orientation: {
    lockPortrait: false,
    lockLandscape: false,
    rotationTransitionTime: 300,
    maintainAspectRatio: true,
  },

  // Performance adjustments per device type
  performance: {
    mobile: {
      particleReduction: 0.5,
      shadowsEnabled: false,
      maxEnemies: 100,
      renderDistance: 800,
    },
    tablet: {
      particleReduction: 0.7,
      shadowsEnabled: true,
      maxEnemies: 150,
      renderDistance: 1000,
    },
    desktop: {
      particleReduction: 1.0,
      shadowsEnabled: true,
      maxEnemies: 200,
      renderDistance: 1200,
    },
  },

  // Grid adjustments for different screens
  grid: {
    mobile: {
      cellSize: 30,
      visibleCells: { x: 15, y: 10 },
    },
    tablet: {
      cellSize: 35,
      visibleCells: { x: 20, y: 15 },
    },
    desktop: {
      cellSize: 40,
      visibleCells: { x: 25, y: 19 },
    },
  },

  // Modal and dialog sizing
  dialogs: {
    mobile: {
      maxWidth: '90%',
      maxHeight: '80%',
      padding: 15,
    },
    tablet: {
      maxWidth: '70%',
      maxHeight: '70%',
      padding: 20,
    },
    desktop: {
      maxWidth: 600,
      maxHeight: '80%',
      padding: 30,
    },
  },

  // Text sizing
  text: {
    // Minimum readable sizes
    minSizes: {
      mobile: 14,
      tablet: 12,
      desktop: 12,
    },
    // Scaling factors for different text types
    scaling: {
      heading: { mobile: 1.5, tablet: 1.8, desktop: 2.0 },
      body: { mobile: 1.0, tablet: 1.0, desktop: 1.0 },
      small: { mobile: 0.8, tablet: 0.85, desktop: 0.9 },
    },
  },
} as const;

export type ResponsiveConfig = typeof RESPONSIVE_CONFIG;

// Helper functions
export function getBreakpoint(width: number): 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide' {
  if (width < RESPONSIVE_CONFIG.breakpoints.mobile) return 'mobile';
  if (width < RESPONSIVE_CONFIG.breakpoints.tablet) return 'tablet';
  if (width < RESPONSIVE_CONFIG.breakpoints.desktop) return 'desktop';
  if (width < RESPONSIVE_CONFIG.breakpoints.wide) return 'wide';
  return 'ultrawide';
}

export function getScaleFactor(width: number, type: 'ui' | 'font' = 'ui'): number {
  const breakpoint = getBreakpoint(width);
  
  if (type === 'ui') {
    const uiScaling = RESPONSIVE_CONFIG.scaling.ui;
    switch (breakpoint) {
      case 'mobile': return uiScaling.mobile;
      case 'tablet': return uiScaling.tablet;
      case 'wide':
      case 'ultrawide': return uiScaling.wide;
      default: return uiScaling.desktop;
    }
  } else {
    const fontScaling = RESPONSIVE_CONFIG.scaling.font;
    switch (breakpoint) {
      case 'mobile': return fontScaling.mobile;
      case 'tablet': return fontScaling.tablet;
      case 'wide':
      case 'ultrawide': return fontScaling.desktop; // Font doesn't have 'wide'
      default: return fontScaling.desktop;
    }
  }
}

export function isMobile(width: number): boolean {
  return width < RESPONSIVE_CONFIG.breakpoints.mobile;
}

export function isTablet(width: number): boolean {
  return width >= RESPONSIVE_CONFIG.breakpoints.mobile && width < RESPONSIVE_CONFIG.breakpoints.tablet;
}

export function isDesktop(width: number): boolean {
  return width >= RESPONSIVE_CONFIG.breakpoints.tablet;
}