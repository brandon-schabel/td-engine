# Test Helpers for Tower Defense Game

This directory contains comprehensive test helpers designed to simplify and improve the testing architecture for the tower defense game.

## Overview

The test helpers are organized into several modules, each focused on a specific aspect of testing:

### 1. Canvas Helpers (`canvas.ts`)
- **createMockCanvas()**: Creates a mock HTML canvas element with all necessary methods
- **createMockContext2D()**: Creates a mock 2D rendering context
- **resetCanvasMocks()**: Clears all mock function calls
- **assertCanvasMethodCalled()**: Verifies canvas methods were called
- **getCanvasCallHistory()**: Gets the call history for a specific canvas method

### 2. Entity Helpers (`entities.ts`)
- **createTestTower()**: Factory for creating test towers with custom properties
- **createTestEnemy()**: Factory for creating test enemies
- **createTestPlayer()**: Factory for creating test players
- **createTestProjectile()**: Factory for creating test projectiles
- **createEntityGroup()**: Creates multiple entities at once
- **positionEntitiesInGrid()**: Positions entities in a grid pattern

### 3. Game Helpers (`game.ts`)
- **createTestGame()**: Creates a game instance with custom configuration
- **createTestGameWithWave()**: Creates a game with a specific wave already started
- **createTestGameWithTowers()**: Creates a game with pre-placed towers
- **simulateGameFrames()**: Advances the game by a specified number of frames
- **getGameEntities()**: Gets all entities in the game

### 4. Time Helpers (`time.ts`)
- **TimeController**: Main class for controlling time in tests
- **setupTimeMocks()**: Sets up all time-related mocks (requestAnimationFrame, setTimeout, etc.)
- **advanceTime()**: Advances the current time
- **simulateFrame()**: Simulates a single animation frame
- **simulateFrames()**: Simulates multiple animation frames

### 5. Assertion Helpers (`assertions.ts`)
- **expectEntityAlive()**: Asserts an entity is alive
- **expectEntityDead()**: Asserts an entity is dead
- **expectEntityInRange()**: Asserts two entities are within a certain range
- **expectHealthBetween()**: Asserts entity health is within bounds
- **expectTowerCanTarget()**: Asserts a tower can target an enemy
- **expectResourcesChanged()**: Verifies resource changes

### 6. Event Helpers (`events.ts`)
- **createMouseEvent()**: Creates mouse events for testing
- **createKeyboardEvent()**: Creates keyboard events
- **simulateUserInput()**: Simulates a sequence of user inputs
- **simulateClick()**: Simulates a click at specific coordinates
- **simulateDrag()**: Simulates a drag operation
- **EventRecorder**: Records and verifies event sequences

## Usage Examples

### Basic Entity Testing
```typescript
import { createTestTower, createTestEnemy, expectEntityInRange } from '../helpers';

it('should target enemies in range', () => {
  const tower = createTestTower({ 
    position: { x: 100, y: 100 },
    type: TowerType.SNIPER,
    range: 200 
  });
  
  const enemy = createTestEnemy({ 
    position: { x: 150, y: 150 } 
  });
  
  expectEntityInRange(tower, enemy, tower.range);
});
```

### Game State Testing
```typescript
import { createTestGame, simulateGameFrames } from '../helpers';

it('should update game state', () => {
  const game = createTestGame({
    initialCurrency: 1000,
    initialLives: 20
  });
  
  game.start();
  simulateGameFrames(game, 60); // Simulate 60 frames
  
  expect(game.enemies.length).toBeGreaterThan(0);
});
```

### Time-based Testing
```typescript
import { TimeController } from '../helpers';

it('should handle animations', () => {
  const timeController = new TimeController();
  const callback = vi.fn();
  
  engine.onUpdate(callback);
  engine.start();
  
  timeController.frames(10, 16); // 10 frames at 16ms each
  
  expect(callback).toHaveBeenCalledTimes(10);
});
```

### Event Testing
```typescript
import { simulateClick, EventRecorder } from '../helpers';

it('should handle user input', () => {
  const canvas = createMockCanvas();
  const recorder = new EventRecorder(canvas);
  
  recorder.startRecording(['click']);
  simulateClick(canvas, 100, 200);
  recorder.stopRecording();
  
  recorder.expectEventCount('click', 1);
});
```

## Benefits

1. **Reduced Boilerplate**: No more repetitive mock setups
2. **Improved Readability**: Tests focus on behavior, not setup
3. **Better Maintenance**: Changes to mocks only need updates in one place
4. **Type Safety**: All helpers are properly typed
5. **Consistent Testing**: Standard ways to create test objects
6. **Performance**: Reusable mocks and efficient test execution

## Best Practices

1. Always use `TimeController` for time-based tests instead of manual mocks
2. Use entity factories instead of creating entities manually
3. Prefer assertion helpers over manual expect statements for game-specific checks
4. Use `simulateGameFrames` for integration tests that need game updates
5. Clean up resources in `afterEach` hooks using provided reset methods