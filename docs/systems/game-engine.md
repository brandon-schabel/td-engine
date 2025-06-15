# Game Engine System

The GameEngine class is the heart of TD Engine, managing the game loop, state transitions, and coordinating updates and rendering.

## Overview

The GameEngine implements a classic game loop pattern using `requestAnimationFrame` for smooth, browser-synchronized updates. It maintains game state and provides hooks for game logic and rendering.

## Core Components

### GameState Enum

```typescript
enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
```

### GameEngine Class

```typescript
class GameEngine {
  private state: GameState = GameState.MENU;
  private running: boolean = false;
  private paused: boolean = false;
  private animationId: number | null = null;
  private lastTime: number = 0;
  
  private updateCallbacks: Set<UpdateCallback> = new Set();
  private renderCallbacks: Set<RenderCallback> = new Set();
}
```

## Key Features

### 1. Game Loop

The main game loop uses `requestAnimationFrame` for optimal performance:

```typescript
private gameLoop = (currentTime: number): void => {
  if (!this.running) return;

  // Calculate delta time (0 on first frame)
  const deltaTime = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
  this.lastTime = currentTime;

  // Update game logic
  this.update(deltaTime);
  
  // Render frame
  this.render(deltaTime);

  // Schedule next frame
  this.animationId = requestAnimationFrame(this.gameLoop);
};
```

### 2. State Management

The engine provides methods for state transitions:

- `start()` - Begin game loop, transition to PLAYING
- `stop()` - Stop game loop, transition to MENU
- `pause()` - Pause updates, maintain rendering
- `resume()` - Resume from pause
- `gameOver()` - End game with loss
- `victory()` - End game with win

### 3. Observer Pattern

Systems can subscribe to update and render events:

```typescript
// Subscribe to updates
const unsubscribe = engine.onUpdate((deltaTime) => {
  // Update game logic
});

// Subscribe to rendering
engine.onRender((deltaTime) => {
  // Render frame
});

// Later: unsubscribe
unsubscribe();
```

### 4. Pause Handling

When paused:
- Update callbacks are skipped
- Render callbacks continue (for pause menu display)
- Time is reset on resume to prevent large delta spikes

## Usage Example

```typescript
// Create engine
const engine = new GameEngine();

// Set up game logic
engine.onUpdate((deltaTime) => {
  // Update entities
  player.update(deltaTime);
  enemies.forEach(e => e.update(deltaTime));
});

// Set up rendering
engine.onRender((deltaTime) => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Render game
  renderer.render();
});

// Start game
engine.start();

// Handle pause
document.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    if (engine.isPaused()) {
      engine.resume();
    } else {
      engine.pause();
    }
  }
});
```

## State Transitions

```
MENU ──start()──> PLAYING ──pause()──> PAUSED
 ↑                    │                    │
 │                    │                    │
 └──stop()────────────┤                    │
                      │                    │
                      │ <──resume()────────┘
                      │
                      ├──gameOver()──> GAME_OVER
                      │
                      └──victory()──> VICTORY
```

## Delta Time

The engine provides delta time in milliseconds to all callbacks:

- Used for frame-independent movement
- Capped at first frame (0) to prevent initialization spikes
- Reset after pause to prevent jumps

Example usage:
```typescript
// Convert to seconds for physics
const dt = deltaTime / 1000;
position.x += velocity.x * dt;
```

## Performance Considerations

1. **Frame Timing**: Uses `requestAnimationFrame` for optimal browser synchronization
2. **Pause Efficiency**: Skips update logic when paused to save CPU
3. **Memory Management**: Proper cleanup of animation frames on stop
4. **Callback Performance**: Uses Set for O(1) add/remove operations

## Browser Compatibility

The engine includes fallbacks for environments without `requestAnimationFrame`:

```typescript
if (typeof requestAnimationFrame !== 'undefined') {
  this.animationId = requestAnimationFrame(this.gameLoop);
} else {
  // Fallback to setTimeout at ~60 FPS
  this.animationId = setTimeout(() => this.gameLoop(Date.now()), 16);
}
```

## Best Practices

1. **Single Update Handler**: Usually only the Game class subscribes to updates
2. **Multiple Renderers**: Can have multiple render subscribers for layers
3. **Delta Time Usage**: Always use delta time for time-based calculations
4. **State Checking**: Check game state before processing input
5. **Cleanup**: Always unsubscribe when components are destroyed

## Common Patterns

### Loading Screen
```typescript
engine.onRender(() => {
  if (engine.getState() === GameState.MENU) {
    renderLoadingScreen();
  }
});
```

### Victory Condition
```typescript
engine.onUpdate(() => {
  if (allEnemiesDefeated() && engine.getState() === GameState.PLAYING) {
    engine.victory();
  }
});
```

### Pause Menu
```typescript
engine.onRender(() => {
  if (engine.isPaused()) {
    renderPauseMenu();
  }
});
```