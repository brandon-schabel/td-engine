/**
 * Example: Customizing Touch Gestures
 * This example shows how to customize gesture behavior for your game
 */

import type { Game } from '@/core/Game';
import { TouchGestureManager } from '@/input/TouchGestureManager';
import { GestureConfig, mergeGestureConfig, DEFAULT_GESTURE_CONFIG } from '@/config/GestureConfig';

// Example 1: Custom gesture configuration
export function setupCustomGestures(game: Game, canvas: HTMLCanvasElement) {
  // Create custom config
  const customConfig: Partial<GestureConfig> = {
    thresholds: {
      swipe: {
        minVelocity: 0.3,      // More sensitive swipes
        minDistance: 30,       // Shorter swipes accepted
        maxDuration: 400,      // More time allowed
        directionTolerance: Math.PI / 3
      },
      pinch: {
        minDistance: 5,        // More sensitive pinch
        sensitivity: 0.02,     // Faster zoom
        smoothing: 0.1
      }
    },
    camera: {
      swipePanMultiplier: 3.0,   // Faster camera panning
      pinchZoomMultiplier: 1.5,  // Faster zoom
      momentumDuration: 1500,    // Longer momentum
      smoothingFactor: 0.15,
      boundaryBounceback: true,
      minZoomGesture: 0.3,       // Allow more zoom out
      maxZoomGesture: 5.0        // Allow more zoom in
    },
    feedback: {
      visual: true,              // Show gesture feedback
      haptic: true,              // Enable vibration
      trails: true,              // Show finger trails
      debugMode: false
    }
  };
  
  // Create gesture manager with custom config
  const gestureManager = new TouchGestureManager(game, canvas, customConfig);
  
  return gestureManager;
}

// Example 2: Custom gesture handlers
export function setupGestureHandlers(gestureManager: TouchGestureManager, game: Game) {
  // Handle swipe gestures
  gestureManager.on('swipe', (data) => {
    console.log(`Swipe ${data.direction} with velocity:`, data.velocity);
    
    // Custom action based on swipe direction
    switch (data.direction) {
      case 'up':
        // Maybe open inventory
        game.getUIController().showInventory();
        break;
      case 'down':
        // Maybe close all UI
        game.getUIController().closeAll();
        break;
    }
  });
  
  // Handle pinch gestures
  gestureManager.on('pinch', (data) => {
    // Custom zoom limits or effects
    if (data.scale > 2) {
      console.log('Maximum zoom reached!');
    }
  });
  
  // Handle long press
  gestureManager.on('longPress', (data) => {
    // Show context menu at position
    const worldPos = game.getCamera().screenToWorld(data.position);
    console.log('Long press at world position:', worldPos);
    
    // Could show tower info, enemy stats, etc.
  });
  
  // Handle double tap with custom behavior
  gestureManager.on('doubleTap', (data) => {
    // Instead of centering on player, maybe place a tower
    const worldPos = game.getCamera().screenToWorld(data.position);
    
    // Check if we can place a tower here
    const gridPos = game.getGrid().worldToGrid(worldPos);
    if (game.getGrid().canPlaceTower(gridPos.x, gridPos.y)) {
      // Quick-place the selected tower type
      const selectedType = game.getSelectedTowerType();
      if (selectedType) {
        game.placeTower(selectedType, worldPos);
      }
    }
  });
}

// Example 3: Conditional gesture enabling
export function setupConditionalGestures(gestureManager: TouchGestureManager, game: Game) {
  // Disable gestures during certain game states
  game.on('gameStateChanged', (state) => {
    switch (state) {
      case 'paused':
      case 'gameOver':
        gestureManager.setEnabled(false);
        break;
      case 'playing':
        gestureManager.setEnabled(true);
        break;
    }
  });
  
  // Disable gestures when UI is open
  game.getUIController().on('dialogOpened', () => {
    gestureManager.setEnabled(false);
  });
  
  game.getUIController().on('allDialogsClosed', () => {
    gestureManager.setEnabled(true);
  });
  
  // Add UI elements as dead zones
  const buildMenu = document.querySelector('.build-menu');
  if (buildMenu instanceof HTMLElement) {
    gestureManager.addUIElement(buildMenu);
  }
}

// Example 4: Visual feedback customization
export function setupGestureVisualization(game: Game, canvas: HTMLCanvasElement) {
  // Import the visualizer
  const { GestureVisualizer } = await import('@/ui/components/game/GestureVisualizer');
  
  // Create visualizer with custom options
  const visualizer = new GestureVisualizer({
    canvas,
    gestureManager: game.touchGestureManager!,
    showTrails: true,
    showIndicators: true,
    trailColor: '#00FFFF',    // Cyan trails
    trailWidth: 5,            // Thicker trails
    fadeTime: 750             // Slower fade
  });
  
  // Toggle visualization based on settings
  game.on('settingsChanged', (settings) => {
    visualizer.setShowTrails(settings.showGestureTrails);
    visualizer.setShowIndicators(settings.showGestureIndicators);
  });
  
  return visualizer;
}

// Example 5: Platform-specific configurations
export function getPlatformGestureConfig(): Partial<GestureConfig> {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // iPad-specific config
  if (userAgent.includes('ipad')) {
    return {
      thresholds: {
        swipe: {
          minVelocity: 0.4,
          minDistance: 40,
          maxDuration: 350,
          directionTolerance: Math.PI / 3
        }
      },
      camera: {
        swipePanMultiplier: 2.5,
        pinchZoomMultiplier: 1.2,
        momentumDuration: 1200,
        smoothingFactor: 0.1,
        boundaryBounceback: true,
        minZoomGesture: 0.5,
        maxZoomGesture: 3.0
      }
    };
  }
  
  // Android tablet config
  if (userAgent.includes('android') && userAgent.includes('tablet')) {
    return {
      thresholds: {
        tap: {
          maxDuration: 300,    // Android can be slower
          maxDistance: 15,
          doubleTapDelay: 400
        }
      }
    };
  }
  
  // Default mobile config
  return mergeGestureConfig(DEFAULT_GESTURE_CONFIG, MOBILE_GESTURE_CONFIG);
}