# Touch Gesture System

## Overview
The TD Engine now supports comprehensive touch gestures for intuitive mobile gameplay. This system allows players to control the camera and interact with the game using natural touch gestures.

## Supported Gestures

### Camera Controls

#### **Swipe** - Pan Camera
- **Action**: Swipe in any direction to pan the camera
- **Behavior**: Camera moves opposite to swipe direction (natural scrolling)
- **Momentum**: Camera continues moving briefly after swipe ends

#### **Pinch** - Zoom In/Out
- **Action**: Pinch two fingers together or apart
- **Behavior**: Zoom focuses on the center point between fingers
- **Limits**: Zoom is constrained between 0.5x and 3.0x

#### **Two-Finger Pan** - Alternative Pan
- **Action**: Drag with two fingers
- **Behavior**: Alternative way to pan the camera
- **Use Case**: When single-finger swipe conflicts with other controls

### Game Interactions

#### **Tap** - Select/Place
- **Action**: Single tap
- **Behavior**: Same as mouse click - selects towers, places towers, etc.

#### **Double Tap** - Center on Player
- **Action**: Two quick taps
- **Behavior**: Camera instantly centers on player and re-enables following

#### **Long Press** - Context Menu
- **Action**: Press and hold for 500ms
- **Behavior**: Currently triggers a long press event (future: context menu)

## Configuration

Gesture behavior can be customized via `GestureConfig`:

```typescript
const config: GestureConfig = {
  enabled: true,
  thresholds: {
    swipe: {
      minVelocity: 0.5,      // pixels/ms
      minDistance: 50,       // pixels
      maxDuration: 300,      // ms
      directionTolerance: Math.PI / 4
    },
    pinch: {
      minDistance: 10,
      sensitivity: 0.01,
      smoothing: 0.15
    },
    // ... other gesture thresholds
  },
  camera: {
    swipePanMultiplier: 2.0,
    pinchZoomMultiplier: 1.0,
    momentumDuration: 1000,
    // ... other camera settings
  }
};
```

## Dead Zones

Gestures are automatically disabled in certain areas:
- Over UI elements (buttons, panels, etc.)
- During tower placement mode
- Over virtual joysticks (mobile controls)

## Visual Feedback

When enabled, the system provides:
- **Gesture Trails**: Green trails show finger movement
- **Gesture Indicators**: Icons appear showing recognized gestures
  - 👆 Single tap
  - 👆👆 Double tap
  - 👇 Long press
  - ⬆️⬇️⬅️➡️ Swipe directions
  - 🔍+/- Pinch zoom

## Integration

The touch gesture system is automatically initialized on touch-enabled devices:

```typescript
// In Game constructor
if ('ontouchstart' in window) {
  this.touchGestureManager = new TouchGestureManager(this, canvas);
}
```

## Events

The gesture manager emits events for custom handling:

```typescript
gestureManager.on('swipe', (data) => {
  console.log('Swipe:', data.direction, data.velocity);
});

gestureManager.on('pinch', (data) => {
  console.log('Pinch:', data.scale, data.center);
});

gestureManager.on('doubleTap', (data) => {
  console.log('Double tap at:', data.position);
});
```

## Performance

The gesture system is optimized for 60fps gameplay:
- Touch events use passive listeners where possible
- Gesture recognition uses efficient algorithms
- Visual feedback is rendered on a separate canvas
- Momentum calculations use requestAnimationFrame

## Mobile vs Desktop

The system automatically adjusts thresholds for mobile devices:
- Lower velocity requirements for swipes
- More forgiving tap detection
- Adjusted zoom sensitivity
- Optimized for touch screens vs trackpads