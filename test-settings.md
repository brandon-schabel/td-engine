# Settings Menu Test Plan

## Test Steps:

1. **From Game Scene:**
   - Start a new game
   - Press ESC or click the pause button
   - In the pause menu, click "Settings"
   - Verify that the settings scene opens
   - Click "Back" in settings
   - Verify that you return to the game scene (not main menu)

2. **Using Settings Button:**
   - During gameplay, click the settings button in the control bar
   - Verify that pause menu opens
   - Click "Settings" in the pause menu
   - Verify settings scene opens
   - Click "Back" 
   - Verify you return to the game

3. **From Main Menu:**
   - Go to main menu
   - If there's a settings option, click it
   - Verify settings scene opens
   - Click "Back"
   - Verify you return to main menu

## Expected Behavior:
- Settings menu should be accessible from the pause menu during gameplay
- When accessed from game, "Back" should return to game
- When accessed from main menu, "Back" should return to main menu
- All settings changes should persist