# Tower Upgrade Panel Testing Guide

## Steps to Test Tower Upgrades:

1. **Start the game** - Open http://localhost:4021/ in your browser
2. **Open Browser Console** - Press F12 or Cmd+Option+I to see debug messages
3. **Place a tower** - Click one of the tower buttons (1-4) and place it on the map
4. **Click on the tower** - Click directly on the placed tower
   - You should see debug messages like "[DEBUG] Clicked on tower: BASIC"
   - The tower should have a green selection circle around it
5. **Look for the upgrade panel** - It should appear near the selected tower
   - The panel shows tower stats and three upgrade buttons
   - Each button shows the upgrade cost and stat increase

## What to Check in Console:
- `[DEBUG] Mouse down at screen:` - Shows where you clicked
- `[DEBUG] Clicked on tower:` - Confirms tower was selected
- `[DEBUG] Updating tower upgrade panel for:` - Panel is trying to show
- `[DEBUG] Tower upgrade panel shown at:` - Panel position

## If Panel Still Doesn't Show:
1. Check if there are any errors in the console
2. Try clicking different parts of the tower
3. Make sure you have enough currency to see upgrade options
4. Try refreshing the page and testing again

## Panel Features:
- **Damage Upgrade** (Red) - Increases tower damage
- **Range Upgrade** (Green) - Increases attack range
- **Fire Rate Upgrade** (Blue) - Increases shooting speed
- Each upgrade can go up to level 5
- Costs increase with each level