# Draggable UI Summary

I've successfully made the score, wave, and health displays draggable, following the same pattern as the existing coins and level displays.

## Changes Made:

### 1. Created New Draggable Components:

- **DraggableScoreDisplay.tsx** - Shows the player's score with a star icon
  - Default position: Top right (x: window.innerWidth - 220, y: 20)
  
- **DraggableHealthDisplay.tsx** - Shows player health as "current/max"
  - Default position: Top left (x: 20, y: 20)
  - Changes color to red when health is low (< 30%)
  
- **DraggableWaveDisplay.tsx** - Shows current wave and enemies remaining
  - Default position: Top center (x: (window.innerWidth - 200) / 2, y: 20)
  - Shows "Prepare for next wave" between waves

### 2. Updated GameUI Component:

Added all draggable displays to the GameUI component:
```tsx
<DraggableHealthDisplay />
<DraggableCurrencyDisplay />
<DraggableWaveDisplay />
<DraggableScoreDisplay />
<DraggablePlayerLevelDisplay game={game} />
```

## Features:

1. **Drag and Drop**: All displays can be dragged to any position on screen
2. **Persistent Positions**: Positions are saved to localStorage with IDs:
   - `draggable-health-display`
   - `draggable-score-display`
   - `draggable-wave-display`
   - `draggable-currency-display` (existing)
   - `draggable-player-level-display` (existing)

3. **Consistent Styling**: All use the same glass-dark panel style for visual consistency

4. **Z-Index Management**: All displays have zIndex: 500 to ensure they stay above game content

## Usage:

- Simply click and drag any display to move it
- Positions are automatically saved and restored on page reload
- To reset positions, you can use the `useResetDraggablePositions` hook or clear localStorage

The UI now has 5 draggable displays that the player can arrange however they prefer!