# Tower Selection and Upgrade Test

This document describes how to test the tower selection and upgrade dialog functionality.

## Test Steps

### 1. Tower Selection
1. Start the game
2. Build a tower (press B to open build menu)
3. Place the tower on the map
4. Click on the placed tower
   - Expected: Tower should show a golden pulsing selection ring
   - Expected: Tower upgrade dialog should appear
   - Expected: Console should log "Tower selected: [type] at [position]"

### 2. Tower Deselection
1. With a tower selected, click on empty space
   - Expected: Selection ring should disappear
   - Expected: Tower upgrade dialog should close
   - Expected: Console should log "Tower deselected: [type]"

### 3. Tower Switching
1. Select a tower
2. Click on a different tower
   - Expected: First tower loses selection ring
   - Expected: Second tower gains selection ring
   - Expected: Upgrade dialog updates to show new tower's stats

### 4. Tower Upgrades
1. Select a tower
2. In the upgrade dialog, click on an upgrade button (Damage/Range/Fire Rate)
   - Expected: If you have enough currency, the upgrade should apply
   - Expected: Tower stats should update in the dialog
   - Expected: Upgrade dots should appear around the tower

### 5. Visual Feedback
- Selected towers should have a pulsing golden ring
- The ring should scale with zoom level
- The upgrade dialog should stay visible while tower is selected

## Console Commands for Testing

```javascript
// Force select a tower
game.selectTower(game.getTowers()[0])

// Clear selection
game.clearSelectedTower()

// Check selected tower
console.log(game.getSelectedTower())

// Add currency for testing upgrades
game.addCurrency(1000)
```

## Known Issues Fixed
1. ✅ Tower selection now uses events instead of polling
2. ✅ Added visual selection indicator (pulsing golden ring)
3. ✅ Added public methods for tower selection management
4. ✅ Tower upgrade dialog properly shows/hides on selection changes
5. ✅ Added missing getCamera() method to Game class

## Implementation Details

### Event System
- `towerSelected` event - Fired when a tower is selected
- `towerDeselected` event - Fired when a tower is deselected

### Selection Visual
- Outer ring: Gold (#FFD700) with 3px width
- Inner ring: Orange (#FFA500) with 2px width
- Pulsing animation using sin wave

### Click Detection
- Tower click radius multiplied by 1.5 for easier selection
- Handles switching between towers
- Deselects when clicking empty space