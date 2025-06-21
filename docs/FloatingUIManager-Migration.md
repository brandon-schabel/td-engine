# FloatingUIManager Migration Documentation

## Overview

This document describes the migration from the old DialogManager system to the new FloatingUIManager system for all UI dialogs in the TD Engine game.

## Migration Summary

### Migrated Components

1. **BuildMenuDialog** → **BuildMenuUI**
   - Shows tower build options when clicking on the map
   - Uses FloatingUIManager's popup type
   - Position-aware (shows at click location)

2. **PauseDialog** → **PauseMenuUI**
   - Game pause menu with resume, settings, and restart options
   - Uses FloatingUIManager's dialog type with modal overlay
   - Shows game statistics while paused

3. **SettingsDialog/GameSettingsDialog** → **SettingsUI**
   - Unified settings interface for audio, gameplay, and visual settings
   - Uses FloatingUIManager's dialog type with modal overlay
   - Real-time settings updates with sliders and toggles

4. **GameOverDialog** → **GameOverUI**
   - Game over screen showing final score and statistics
   - Uses FloatingUIManager's dialog type with modal overlay
   - Provides restart and main menu options

5. **InventoryDialog** → **InventoryUI** (Previously migrated)
   - Full inventory management interface
   - Uses FloatingUIManager's dialog type

### Benefits of Migration

1. **Unified API**: All UI elements now use the same FloatingUIManager system
2. **Better Performance**: Single update loop for all floating UI elements
3. **Consistent Styling**: Shared CSS and theming across all UI components
4. **Responsive Design**: Built-in mobile and responsive support
5. **Simplified Codebase**: Removed DialogManager and its adapters
6. **Better Positioning**: Automatic positioning relative to game entities or screen coordinates
7. **Animation Support**: Built-in smooth transitions and animations

### Implementation Details

#### New UI Components Location
All new UI components are located in `/src/ui/floating/`:
- `BuildMenuUI.ts`
- `PauseMenuUI.ts`
- `SettingsUI.ts`
- `GameOverUI.ts`
- `InventoryUI.ts` (previously migrated)

#### Usage Pattern

```typescript
// Old way (DialogManager)
dialogManager.register('pause', pauseDialog);
dialogManager.show('pause');

// New way (FloatingUIManager)
const pauseMenuUI = new PauseMenuUI(game);
pauseMenuUI.show({
  onResume: () => game.resume(),
  onSettings: () => showSettingsUI(),
  onRestart: () => window.location.reload()
});
```

#### Key Features

1. **Modal Support**: Dialogs can have modal overlays that block interaction
2. **Custom Styling**: Each UI component has its own responsive styles
3. **Event Handling**: Clean callback-based event handling
4. **Lifecycle Management**: Automatic cleanup when UI elements are destroyed
5. **Mobile Optimized**: Touch-friendly interfaces with appropriate sizing

### Files Modified

1. **src/ui/SimpleGameUI.ts**
   - Removed dialog imports and references
   - Added new UI component imports
   - Updated all dialog show/hide calls to use new UI components
   - Added event listener for gameEnd event

2. **src/main.ts**
   - Removed dialog imports and registrations
   - Removed initializeEarlyDialogs and initializeGameDialogs functions
   - Updated to initialize game directly instead of showing settings dialog
   - Simplified game end handling

3. **src/ui/floating/index.ts**
   - Added exports for all new UI components

### Removed Dependencies

- DialogManager (kept for backward compatibility but no longer used)
- BaseDialog and all dialog components
- DialogToFloatingUIAdapter
- Dialog-specific styles and injection

### Future Improvements

1. Remove DialogManager completely once confirmed stable
2. Add more UI element types (tooltips, context menus)
3. Enhance animation capabilities
4. Add UI element grouping and management features

## Migration Checklist

- [x] Migrate BuildMenuDialog to BuildMenuUI
- [x] Migrate PauseDialog to PauseMenuUI
- [x] Migrate SettingsDialog to SettingsUI
- [x] Migrate GameOverDialog to GameOverUI
- [x] Update SimpleGameUI to use new components
- [x] Remove dialog registrations from main.ts
- [x] Test all UI functionality
- [ ] Remove DialogManager system (future)

## Testing

All UI components should be tested for:
1. Proper display and positioning
2. Responsive behavior on mobile
3. Event handling and callbacks
4. Cleanup on destruction
5. Integration with game systems