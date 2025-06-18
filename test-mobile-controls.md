# Mobile Controls Testing Guide

This guide helps test the new mobile shooting controls implementation.

## Testing on Desktop (Development)

1. **Enable Mobile Emulation in Chrome DevTools:**
   - Open Chrome DevTools (F12)
   - Click the device toolbar toggle (Ctrl+Shift+M or Cmd+Shift+M)
   - Select a mobile device preset (e.g., iPhone 12 Pro)
   - Refresh the page

2. **Test Touch Events:**
   - Click and hold to simulate touch for shooting
   - The mobile controls should appear at the bottom of the screen
   - Virtual joystick on the left for movement
   - Shoot button on the right for firing

## Testing on Mobile Device

1. **Local Network Testing:**
   - Run `bun dev` on your development machine
   - Note your local IP address (e.g., 192.168.1.100)
   - On mobile device, navigate to `http://[YOUR-IP]:5173`

2. **Touch Controls:**
   - **Movement:** Use the left virtual joystick
   - **Shooting:** Hold the red shoot button on the right
   - **Aiming:** Touch and drag anywhere on the game canvas
   - **Tower Placement:** Tap on the game canvas

## Features to Test

### Basic Functionality
- [ ] Touch indicators appear when touching the screen
- [ ] Virtual joystick appears on mobile devices
- [ ] Shoot button appears and responds to touch
- [ ] Player moves correctly with virtual joystick
- [ ] Player shoots when holding shoot button
- [ ] Aiming follows touch/drag on canvas

### Multi-touch Support
- [ ] Can move and shoot simultaneously
- [ ] Touch indicators show for multiple touches
- [ ] No conflicts between UI controls and game canvas

### Visual Feedback
- [ ] Touch indicators show ripple effect
- [ ] Shoot button shows pressed state
- [ ] Joystick knob follows touch movement
- [ ] Haptic feedback on supported devices

### Edge Cases
- [ ] Controls hide on desktop/non-touch devices
- [ ] Touch cancel (phone call) stops all actions
- [ ] Controls work in both portrait and landscape
- [ ] Performance remains smooth with controls active

## Known Issues & Limitations

1. **Browser Compatibility:**
   - Best experience on Chrome/Safari mobile
   - Firefox mobile may have touch event delays

2. **Performance:**
   - Older devices may experience lag with many projectiles
   - Touch indicators add minimal overhead

3. **UI Scaling:**
   - Controls are fixed size, may need adjustment for tablets

## Debug Commands

Open browser console and run:
```javascript
// Check if touch is detected
console.log('Touch device:', 'ontouchstart' in window);

// Check active touches
document.addEventListener('touchstart', e => console.log('Touches:', e.touches.length));

// Test haptic feedback
navigator.vibrate && navigator.vibrate(100);
```

## Improvements for Future

1. Customizable control positions
2. Adjustable joystick sensitivity
3. Auto-fire toggle option
4. Gesture controls (pinch to zoom)
5. Control opacity settings