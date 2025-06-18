# Tower Info Dialog Debug Tests

## Summary of Changes Made

1. **Fixed tower selection logic in Game.ts**
   - Changed from direct property manipulation to using `selectTower()` and `deselectTower()` methods
   - This ensures proper event dispatching

2. **Fixed property name issue in TowerInfoDialog.ts**
   - Changed from `tower.type` to `tower.towerType` (the correct property name)
   - Updated in constructor title and all references

3. **Added extensive debug logging**
   - Game.ts: Logs when towers are clicked and selected
   - SimpleGameUI.ts: Logs when tower selection events are received and dialogs are shown
   - TowerInfoDialog.ts: Logs when content is built
   - DialogManager.ts: Already has logging for show/hide operations

4. **Added debug commands for testing**
   - `testTowerInfo()` - Directly shows tower info dialog for the first tower
   - `selectFirstTower()` - Selects the first tower through the game's selection system

## How to Test

1. Start the game and place at least one tower
2. Open the browser console (F12)
3. Try clicking on a tower - you should see:
   ```
   [DEBUG] Clicked on tower: BASIC at {x: ..., y: ...}
   [DEBUG] Selecting tower
   [SimpleGameUI] Tower selected event received
   [SimpleGameUI] Tower details: {...}
   [SimpleGameUI] showTowerInfoDialog called for tower: ...
   [TowerInfoDialog] buildContent called for tower: BASIC
   [DialogManager] Showing dialog "towerInfo"
   ```

4. If clicking doesn't work, test with debug commands:
   ```javascript
   // Test the dialog directly
   testTowerInfo()
   
   // Test tower selection through game
   selectFirstTower()
   ```

5. Visual feedback: Selected towers should show a green selection ring

## What Should Happen

1. Click on a tower
2. Tower gets a green selection ring
3. Tower info dialog appears next to the tower
4. Dialog shows tower stats, upgrades, and action buttons
5. Clicking elsewhere deselects the tower and closes the dialog

## Potential Remaining Issues

1. **Z-index conflicts** - Other UI elements might be blocking the dialog
2. **CSS issues** - The dialog container might not be visible
3. **Touch handling** - On mobile, touch events might interfere

## Debug Output to Look For

If the dialog still doesn't show, check for:
- Any errors in the console
- Whether the dialog container is added to the DOM (inspect element)
- The dialog's display and visibility styles
- Whether BaseDialog's show() method completes successfully