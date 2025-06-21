# UI State Management System

## Overview

The TD Engine now features a centralized UI state management system that addresses critical issues with panel state control, modal exclusivity, and UI synchronization. This system provides a single source of truth for all UI panel states and ensures consistent behavior across the application.

## Key Components

### UIStateManager

The `UIStateManager` class is the core of the state management system. It provides:

- **Centralized State Control**: All UI panel states are managed in one place
- **Modal Exclusivity**: Ensures only one modal dialog can be open at a time
- **Exclusive Panel Management**: Handles panels that should close when others open
- **Event Broadcasting**: Emits events for all state changes
- **State Persistence**: Can save and restore UI state snapshots
- **History Tracking**: Maintains a history of state changes for debugging

### Integration with UIController

The `UIController` has been updated to use the `UIStateManager` for all panel operations:

```typescript
// Access the state manager
const stateManager = game.uiController.getStateManager();

// Listen for UI state changes
stateManager.on('panelOpened', ({ panel, state }) => {
  console.log(`Panel ${panel} opened`);
});

// Check if a panel is open
if (stateManager.isPanelOpen(UIPanelType.INVENTORY)) {
  // Handle inventory being open
}
```

## Panel Types

The following panel types are managed by the system:

```typescript
enum UIPanelType {
  PAUSE_MENU = 'pause-menu',
  SETTINGS = 'settings',
  TOWER_UPGRADE = 'tower-upgrade',
  PLAYER_UPGRADE = 'player-upgrade',
  INVENTORY = 'inventory',
  BUILD_MENU = 'build-menu',
  GAME_OVER = 'game-over',
  MAIN_MENU = 'main-menu'
}
```

## Panel Configurations

Each panel has specific configuration that determines its behavior:

| Panel | Modal | Exclusive | Allow Multiple | Persistent |
|-------|-------|-----------|----------------|------------|
| PAUSE_MENU | ✓ | ✓ | ✗ | ✗ |
| SETTINGS | ✓ | ✓ | ✗ | ✗ |
| TOWER_UPGRADE | ✗ | ✓ | ✗ | ✗ |
| PLAYER_UPGRADE | ✗ | ✓ | ✗ | ✗ |
| INVENTORY | ✗ | ✓ | ✗ | ✗ |
| BUILD_MENU | ✗ | ✗ | ✓ | ✗ |
| GAME_OVER | ✓ | ✓ | ✗ | ✓ |
| MAIN_MENU | ✓ | ✓ | ✗ | ✓ |

- **Modal**: Creates overlay and prevents interaction with game
- **Exclusive**: Closes other exclusive panels when opened
- **Allow Multiple**: Whether multiple instances can exist
- **Persistent**: Survives game state changes

## Usage Examples

### Opening a Panel

```typescript
// Open inventory with metadata
game.uiController.showInventory();

// The UIController internally calls:
stateManager.openPanel(UIPanelType.INVENTORY, { 
  filter: 'weapons' 
});
```

### Listening for State Changes

```typescript
const stateManager = game.uiController.getStateManager();

// Listen for any panel opening
stateManager.on('panelOpened', ({ panel, state }) => {
  console.log(`${panel} opened at ${state.openedAt}`);
});

// Listen for modal changes
stateManager.on('modalChanged', ({ current, previous }) => {
  if (current) {
    console.log(`Modal changed to ${current}`);
    game.pause();
  } else {
    console.log('Modal closed');
    game.resume();
  }
});

// Listen for specific panel closing
stateManager.on('panelClosed', ({ panel }) => {
  if (panel === UIPanelType.SETTINGS) {
    // Save settings when panel closes
    game.saveSettings();
  }
});
```

### Checking Panel States

```typescript
// Check if inventory is open
if (stateManager.isPanelOpen(UIPanelType.INVENTORY)) {
  // Don't process game input while inventory is open
  return;
}

// Get all open panels
const openPanels = stateManager.getOpenPanels();
console.log('Open panels:', openPanels);

// Get current modal
const currentModal = stateManager.getCurrentModal();
if (currentModal) {
  console.log(`Modal ${currentModal} is blocking input`);
}
```

### Managing Panel Metadata

```typescript
// Store data with a panel
stateManager.openPanel(UIPanelType.TOWER_UPGRADE, {
  towerId: tower.id,
  upgradeLevel: tower.level
});

// Retrieve panel metadata
const metadata = stateManager.getPanelMetadata(UIPanelType.TOWER_UPGRADE);
if (metadata?.towerId) {
  const tower = game.getTowerById(metadata.towerId);
}

// Update metadata while panel is open
stateManager.updatePanelMetadata(UIPanelType.INVENTORY, {
  selectedTab: 'armor'
});
```

### State Persistence

```typescript
// Save current UI state
const snapshot = game.uiController.getUIStateSnapshot();
localStorage.setItem('uiState', JSON.stringify(snapshot));

// Restore UI state
const savedState = localStorage.getItem('uiState');
if (savedState) {
  game.uiController.restoreUIState(JSON.parse(savedState));
}
```

## Events

The UIStateManager emits the following events:

| Event | Data | Description |
|-------|------|-------------|
| `panelOpened` | `{ panel, state }` | Fired when a panel opens |
| `panelClosed` | `{ panel, state }` | Fired when a panel closes |
| `panelToggled` | `{ panel, isOpen }` | Fired when a panel is toggled |
| `modalChanged` | `{ current, previous }` | Fired when modal changes |
| `stateChanged` | `{ panels }` | Fired on any state change |

## Benefits

1. **Prevents Multiple Modals**: No more overlapping pause/settings menus
2. **Consistent State**: Panels remember their state and can be restored
3. **Better UX**: Exclusive panels close automatically when others open
4. **Debugging**: State history helps track down UI issues
5. **Extensible**: Easy to add new panels with specific behaviors
6. **Event-Driven**: React to UI state changes anywhere in the codebase

## Migration Guide

If you're updating existing code:

1. Replace direct UI element creation with `UIController` methods
2. Use `stateManager.isPanelOpen()` instead of checking DOM elements
3. Listen for state events instead of tracking UI state manually
4. Store panel-specific data in metadata instead of global variables

## Issues Resolved

This system resolves the following issues:

- **#001**: Multiple UI panels open simultaneously
- **#007**: Panels not reopening after closing
- **#008**: Modal dialogs not blocking properly
- **#023**: UI state not persisting across game states
- **#028**: Exclusive panels not closing when others open