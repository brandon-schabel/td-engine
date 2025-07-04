/**
 * GestureConfig.ts - Configuration for touch gesture recognition
 * Defines thresholds, timings, and sensitivities for various gestures
 */

import type { Vector2 } from '@/utils/Vector2';

export interface GestureThresholds {
  // Swipe gesture thresholds
  swipe: {
    minVelocity: number;      // Minimum velocity in pixels/ms
    minDistance: number;      // Minimum distance in pixels
    maxDuration: number;      // Maximum duration in ms
    directionTolerance: number; // Angle tolerance in radians
  };

  // Pinch gesture thresholds
  pinch: {
    minDistance: number;      // Minimum finger distance change
    sensitivity: number;      // Scale factor for zoom in
    zoomOutMultiplier: number; // Separate multiplier for zoom out
    smoothing: number;        // Smoothing factor (0-1)
    velocityThreshold: number; // Minimum velocity for momentum
    momentumDecay: number;    // How fast momentum decays (0-1)
  };

  // Pan gesture thresholds
  pan: {
    minDistance: number;      // Minimum movement to start pan
    sensitivity: number;      // Pan speed multiplier
    deceleration: number;     // Friction for momentum (0-1)
    maxVelocity: number;      // Maximum pan velocity
  };

  // Tap gesture thresholds
  tap: {
    maxDuration: number;      // Maximum tap duration in ms
    maxDistance: number;      // Maximum movement during tap
    doubleTapDelay: number;   // Maximum delay between double taps
  };

  // Long press thresholds
  longPress: {
    minDuration: number;      // Minimum press duration in ms
    maxDistance: number;      // Maximum movement during press
  };
}

export interface GestureConfig {
  enabled: boolean;
  thresholds: GestureThresholds;

  // Camera-specific settings
  camera: {
    swipePanMultiplier: number;    // How much to pan per swipe unit
    pinchZoomMultiplier: number;   // Zoom speed multiplier
    pinchZoomOutMultiplier: number; // Zoom out speed multiplier
    momentumDuration: number;      // How long momentum lasts (ms)
    smoothingFactor: number;       // Camera movement smoothing (0-1)
    boundaryBounceback: boolean;   // Bounce when hitting world edges
    minZoomGesture: number;        // Minimum zoom level from gestures
    maxZoomGesture: number;        // Maximum zoom level from gestures
    autoFollowDelay: number;       // Delay before re-enabling follow (ms)
    autoFollowOnMovement: boolean; // Enable auto-follow when player moves
    smoothReturnDuration: number;  // Duration of smooth return animation (ms)
  };

  // Gesture zones (areas where gestures are disabled)
  deadZones: {
    ui: boolean;              // Disable over UI elements
    joystick: boolean;        // Disable over virtual joysticks
    customAreas: {            // Custom dead zones
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
  };

  // Visual feedback
  feedback: {
    visual: boolean;          // Show visual gesture indicators
    haptic: boolean;          // Enable haptic feedback
    trails: boolean;          // Show gesture trails
    debugMode: boolean;       // Show debug info
  };
}

// Default gesture configuration
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  enabled: true,

  thresholds: {
    swipe: {
      minVelocity: 0.5,       // 0.5 pixels per millisecond
      minDistance: 50,        // 50 pixels minimum
      maxDuration: 300,       // 300ms maximum
      directionTolerance: Math.PI / 4  // 45 degrees
    },

    pinch: {
      minDistance: 10,        // 10 pixels minimum change
      sensitivity: 0.01,      // 1% zoom per pixel for zoom in
      zoomOutMultiplier: 1.5, // 50% more sensitive for zoom out
      smoothing: 0.15,        // 15% smoothing
      velocityThreshold: 0.005, // Minimum scale velocity for momentum
      momentumDecay: 0.95     // 5% decay per frame
    },

    pan: {
      minDistance: 10,        // 10 pixels to start
      sensitivity: 1.5,       // 1.5x pan speed
      deceleration: 0.92,     // 8% friction per frame
      maxVelocity: 20         // 20 pixels per frame max
    },

    tap: {
      maxDuration: 250,       // 250ms maximum
      maxDistance: 10,        // 10 pixels tolerance
      doubleTapDelay: 300     // 300ms between taps
    },

    longPress: {
      minDuration: 500,       // 500ms minimum
      maxDistance: 10         // 10 pixels tolerance
    }
  },

  camera: {
    swipePanMultiplier: 2.0,
    pinchZoomMultiplier: 1.0,
    pinchZoomOutMultiplier: 1.5,
    momentumDuration: 1000,
    smoothingFactor: 0.12,
    boundaryBounceback: true,
    minZoomGesture: 0.5,
    maxZoomGesture: 3.0,
    autoFollowDelay: 500,
    autoFollowOnMovement: true,
    smoothReturnDuration: 800
  },

  deadZones: {
    ui: true,
    joystick: true,
    customAreas: []
  },

  feedback: {
    visual: true,
    haptic: true,
    trails: false,
    debugMode: false
  }
};

// Mobile-optimized configuration
export const MOBILE_GESTURE_CONFIG: Partial<GestureConfig> = {
  thresholds: {
    swipe: {
      minVelocity: 0.3,       // Lower threshold for mobile
      minDistance: 30,
      maxDuration: 400,
      directionTolerance: Math.PI / 3  // More forgiving
    },

    pinch: {
      minDistance: 5,
      sensitivity: 0.015,     // More sensitive on mobile
      zoomOutMultiplier: 1.8, // Even more sensitive zoom out on mobile
      smoothing: 0.2,
      velocityThreshold: 0.003,
      momentumDecay: 0.92
    },

    pan: {
      minDistance: 5,
      sensitivity: 2.0,       // Faster panning on mobile
      deceleration: 0.88,
      maxVelocity: 25
    },

    tap: {
      maxDuration: 300,
      maxDistance: 15,        // More forgiving for imprecise touches
      doubleTapDelay: 350
    },

    longPress: {
      minDuration: 400,       // Shorter for mobile
      maxDistance: 15
    }
  },

  camera: {
    swipePanMultiplier: 2.5,  // Faster camera movement on mobile
    pinchZoomMultiplier: 1.2,
    pinchZoomOutMultiplier: 1.8,
    momentumDuration: 800,
    smoothingFactor: 0.08,    // Less smoothing for responsiveness
    boundaryBounceback: true,
    minZoomGesture: 0.7,
    maxZoomGesture: 2.5,
    autoFollowDelay: 400,     // Shorter delay on mobile
    autoFollowOnMovement: true,
    smoothReturnDuration: 600 // Faster return on mobile
  }
};

// Helper function to merge configs
export function mergeGestureConfig(
  base: GestureConfig,
  override: Partial<GestureConfig>
): GestureConfig {
  return {
    ...base,
    ...override,
    thresholds: {
      ...base.thresholds,
      ...(override.thresholds || {})
    },
    camera: {
      ...base.camera,
      ...(override.camera || {})
    },
    deadZones: {
      ...base.deadZones,
      ...(override.deadZones || {})
    },
    feedback: {
      ...base.feedback,
      ...(override.feedback || {})
    }
  };
}
