# Game Loop Refactoring

## Overview

The Game class has been refactored to use a centralized architecture with logic systems. This creates a clean separation between game orchestration, entity management, and game logic.

## New Architecture

### 1. **GameLoop** (`src/systems/GameLoop.ts`)
- Orchestrates all entity updates using pure logic functions
- Processes entity updates in a predictable order
- Handles action processing from logic results
- Integrates with entityStore and gameStore
- Manages entity lifecycle (creation, updates, cleanup)

### 2. **InputManager** (`src/input/InputManager.ts`)
- Centralizes all input handling (keyboard, mouse)
- Provides a unified InputState for logic systems
- Handles coordinate transformations (screen to world)
- Integrates with mobile controls

### 3. **Entity Store Integration**
- All entities are now managed by the centralized entityStore
- Local arrays (towers[], enemies[], etc.) are synced for backward compatibility
- Entity updates are batched for performance
- Dead entity cleanup is centralized

## Key Changes

### Game Class Updates

1. **Constructor Changes**:
   ```typescript
   // New properties
   private gameLoop: GameLoop;
   private inputManager: InputManager;
   
   // Initialization
   this.inputManager = new InputManager(canvas, this.camera);
   this.gameLoop = new GameLoop({
     grid: this.grid,
     audioManager: this.audioManager,
     waveManager: this.waveManager,
     spawnZoneManager: this.spawnZoneManager
   });
   ```

2. **Update Method Simplification**:
   - Delegates entity updates to GameLoop
   - Handles camera and touch gestures separately
   - Syncs entity arrays for backward compatibility
   - Maintains game flow control (wave completion, victory)

3. **Entity Management**:
   - `placeTower()` now uses `entityStore.addTower()`
   - `selectTower()` syncs with `entityStore.selectTower()`
   - Collectible spawning uses `entityStore.addCollectible()`

### Benefits

1. **Separation of Concerns**:
   - Game class focuses on high-level game flow
   - GameLoop handles entity updates
   - Logic systems contain pure game logic
   - Input handling is centralized

2. **Performance**:
   - Batch entity updates reduce store updates
   - Dead entity cleanup is more efficient
   - Logic systems can be optimized independently

3. **Maintainability**:
   - Clear responsibilities for each system
   - Easier to test logic systems in isolation
   - Simplified debugging with centralized state

4. **Extensibility**:
   - New entity types can be added easily
   - Logic systems can be enhanced independently
   - Input sources can be added to InputManager

## Migration Notes

- The refactoring maintains backward compatibility
- Local entity arrays are synced with the store
- All existing functionality is preserved
- Save/load system continues to work

## Future Improvements

1. Remove local entity arrays once all systems use the store
2. Add more sophisticated action processing (priority, batching)
3. Implement entity pooling for performance
4. Add replay system using action history