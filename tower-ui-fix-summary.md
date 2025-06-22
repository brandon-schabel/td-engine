# Tower Upgrade UI Fix Summary

## Problem
The tower upgrade UI was difficult to close - clicking outside of it didn't reliably close it, and users had to select another tower first then close it manually.

## Root Causes
1. The click-outside handler was added with a delay, causing timing issues
2. The handler was listening to 'click' events instead of 'mousedown' events
3. The game's deselection logic wasn't using the proper `deselectTower()` method

## Solution Implemented

### 1. Fixed Click-Outside Detection in TowerUpgradeUI.ts
- Changed from 'click' to 'mousedown' event listener
- Removed the 100ms delay that was causing timing issues
- Added check to ensure we're clicking on the canvas (not other UI elements)
- Used capture phase to catch events before the game handles them

### 2. Fixed Game's Deselection Logic in Game.ts
- Updated the click handling to use the proper `deselectTower()` method
- This ensures the UI controller properly closes the tower upgrade UI

## Key Changes

### TowerUpgradeUI.ts
```typescript
// Before:
setTimeout(() => {
  document.addEventListener('click', this.clickOutsideHandler!, true);
}, 100);

// After:
document.addEventListener('mousedown', this.clickOutsideHandler!, true);
```

### Game.ts
```typescript
// Before:
if (this.selectedTower && !this.justSelectedTower) {
  const previousTower = this.selectedTower;
  this.selectedTower = null;
  // Manual event dispatch
}

// After:
if (this.selectedTower && !this.justSelectedTower) {
  this.deselectTower(); // Uses proper method that closes UI
}
```

## Expected Behavior
- Clicking anywhere on the game canvas (outside the tower upgrade UI) will now immediately close the UI
- The UI responds to mousedown events for instant feedback
- Other UI elements (buttons, menus) won't trigger the close behavior
- The proper cleanup methods are called ensuring no memory leaks