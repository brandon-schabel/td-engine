# Touch Controls Implementation

## Overview
This document describes the touch control implementation for the TD Engine game, including tap-to-shoot mechanics and virtual joystick support.

## Features Implemented

### 1. Touch Input Manager (`src/input/TouchInputManager.ts`)
- Handles all touch events on the canvas
- Detects tap vs hold gestures
- Manages multi-touch for simultaneous movement and shooting
- Provides haptic feedback support

### 2. Virtual Joystick (`src/ui/components/VirtualJoystick.ts`)
- Visual joystick for movement control
- Configurable position (left/right handed)
- Dead zone support
- Smooth visual feedback

### 3. Player Controls Updates
- Added methods to Player class:
  - `setVelocity()` - Direct velocity control for joystick
  - `setAimDirection()` - Set aim angle for touch shooting
  - `startShooting()/stopShooting()` - Continuous shooting support
  - `tryShoot()` - Single shot for tap events

### 4. Settings Integration
- Added mobile control settings:
  - `mobileJoystickEnabled` - Toggle virtual joystick
  - `hapticFeedbackEnabled` - Toggle vibration feedback
  - `touchControlsLayout` - Choose left/right handed layout

### 5. UI Updates
- Settings menu now shows mobile controls section on touch devices
- Touch hints updated to reflect new control scheme
- Virtual joystick automatically positions based on settings

## Control Scheme

### Shooting
- **Tap**: Fire a single shot in the direction tapped
- **Hold & Drag**: Continuous shooting with aim adjustment
- **Double Tap**: Reserved for special abilities (future feature)

### Movement
- **Virtual Joystick**: Drag within the joystick area to move
- **Dead Zone**: Small movements near center are ignored
- **Layout**: Joystick position switches based on handedness setting

## Testing the Implementation

### Desktop Testing
1. Open Chrome DevTools (F12)
2. Toggle device emulation (Ctrl+Shift+M)
3. Select a mobile device preset or responsive mode
4. Reload the page to activate touch controls

### Mobile Testing
1. Access the game on a mobile device
2. Touch controls should automatically activate
3. Virtual joystick appears in bottom corner
4. Tap anywhere to shoot, hold to continuous fire

### Test Scenarios
1. **Basic Shooting**
   - Tap on enemies to shoot at them
   - Hold finger down for continuous fire
   - Drag while holding to adjust aim

2. **Movement**
   - Use virtual joystick to move player
   - Test diagonal movement
   - Verify speed is consistent in all directions

3. **Multi-touch**
   - Move with joystick while shooting
   - Ensure both inputs work simultaneously

4. **Settings**
   - Toggle joystick on/off in settings
   - Switch between left/right handed layouts
   - Test haptic feedback (on supported devices)

## Implementation Notes

### Touch Detection
The system uses feature detection to determine if touch is available:
```typescript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

### Coordinate Conversion
Touch coordinates are converted to world space using the camera system:
```typescript
const worldPoint = camera.screenToWorld(point.x, point.y);
```

### Performance Considerations
- Touch events use `passive: false` to allow preventDefault
- Virtual joystick updates are throttled to animation frames
- Haptic feedback has minimal duration (10-50ms)

## Future Enhancements
- Gesture recognition for special abilities
- Customizable joystick size and opacity
- Touch sensitivity settings
- On-screen ability buttons
- Pinch-to-zoom camera controls