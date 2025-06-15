# Design Patterns and Architectural Decisions

This document outlines the key design patterns used in TD Engine and the reasoning behind major architectural decisions.

## Design Patterns

### 1. Game Loop Pattern

The engine uses a classic game loop pattern with fixed timestep updates:

```typescript
class GameEngine {
  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.update(deltaTime);  // Update game logic
    this.render(deltaTime);  // Render visuals
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
}
```

**Benefits:**
- Consistent frame-independent gameplay
- Clear separation between logic and rendering
- Easy to pause/resume

### 2. Observer Pattern

Used for decoupling the game engine from specific game logic:

```typescript
class GameEngine {
  private updateCallbacks: Set<UpdateCallback> = new Set();
  
  onUpdate(callback: UpdateCallback): Unsubscribe {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }
}
```

**Benefits:**
- Loose coupling between engine and game
- Easy to add/remove listeners
- Clean unsubscribe mechanism

### 3. State Pattern

Game state management using enum-based finite state machine:

```typescript
enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
```

**Benefits:**
- Clear state transitions
- Easy to add new states
- Prevents invalid state combinations

### 4. Object Pool Pattern

Used for frequently created/destroyed objects like projectiles:

```typescript
class EntityManager {
  private projectilePool: Projectile[] = [];
  
  createProjectile(...): Projectile {
    let projectile = this.projectilePool.find(p => !p.isAlive);
    if (projectile) {
      // Reset and reuse
    } else {
      // Create new
    }
  }
}
```

**Benefits:**
- Reduces garbage collection pressure
- Improves performance for bullet-heavy gameplay
- Predictable memory usage

### 5. Singleton Pattern

Used sparingly for true global systems:

```typescript
class AudioManager {
  private static instance: AudioManager;
  
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    AudioManager.instance = this;
  }
}
```

**Benefits:**
- Single audio context for the browser
- Centralized sound management
- Easy global access

### 6. Strategy Pattern

Used for different enemy spawn patterns:

```typescript
enum SpawnPattern {
  SINGLE_POINT = 'SINGLE_POINT',
  DISTRIBUTED = 'DISTRIBUTED',
  BURST_SPAWN = 'BURST_SPAWN',
  // ... more patterns
}
```

**Benefits:**
- Easy to add new spawn behaviors
- Runtime pattern selection
- Clean separation of algorithms

### 7. Factory Pattern

Used for creating entities with consistent initialization:

```typescript
class Game {
  createTower(type: TowerType, position: Vector2): Tower | null {
    // Validation
    // Grid updates
    // Tower creation
    // Event emission
    return tower;
  }
}
```

**Benefits:**
- Centralized entity creation
- Consistent initialization
- Easy to add creation logic

## Architectural Decisions

### 1. Monolithic Game Class

The `Game.ts` file is intentionally large (1700+ lines) and acts as the central orchestrator.

**Reasoning:**
- **Performance**: Direct method calls are faster than event systems
- **Debugging**: Easier to trace execution flow
- **Type Safety**: TypeScript works better with direct references

**Trade-offs:**
- Harder to unit test in isolation
- Can become unwieldy as features grow
- Tighter coupling between systems

### 2. Composition-Based Entity System

Entities use composition rather than deep inheritance hierarchies:

```typescript
class Player extends Entity {
  private combat: PlayerCombat;
  private movement: PlayerMovement;
  private health: PlayerHealth;
  private powerUps: PlayerPowerUps;
  private progression: PlayerProgression;
}
```

**Benefits:**
- Flexible entity capabilities
- Avoids inheritance diamond problem
- Easy to add/remove behaviors

### 3. Canvas 2D Rendering

Chose Canvas 2D API over WebGL:

**Reasoning:**
- Simpler to implement and maintain
- Sufficient performance for 2D tower defense
- Better browser compatibility
- Easier for contributors

**Optimizations:**
- Visibility culling
- Batch rendering where possible
- Minimal state changes

### 4. Procedural Audio Generation

Using Web Audio API for sound synthesis instead of audio files:

**Benefits:**
- No asset loading delays
- Smaller build size
- Dynamic sound variations
- No licensing concerns

**Trade-offs:**
- Limited to synthetic sounds
- More complex implementation
- Can't use pre-made sound effects

### 5. Grid-Based World

Fixed grid system for world representation:

```typescript
class Grid {
  private cells: CellData[][];
  private cellSize: number = 32;
}
```

**Benefits:**
- Simple spatial queries
- Easy pathfinding
- Natural tower placement
- Efficient collision detection

### 6. Update-Render Separation

Clear separation between game logic updates and rendering:

**Benefits:**
- Can run logic at different rates than rendering
- Easier to optimize each independently
- Clean architecture

### 7. TypeScript Strict Mode

Full TypeScript with strict typing:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Benefits:**
- Catches errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

## Performance Patterns

### 1. Spatial Partitioning

Entities organized in spatial grid for efficient queries:

```typescript
class EntityManager {
  private spatialGrid: Map<string, Entity[]> = new Map();
  
  getEntitiesInRadius(position: Vector2, radius: number): Entity[] {
    // Only check nearby grid cells
  }
}
```

### 2. Visibility Culling

Only render entities within camera view:

```typescript
if (!this.camera.isVisible(entity.position, entity.radius)) return;
```

### 3. Delta Time Capping

Prevent spiral of death with large time steps:

```typescript
const deltaTime = Math.min(currentTime - this.lastTime, MAX_DELTA);
```

## Anti-Patterns Avoided

1. **God Object**: While Game.ts is large, it delegates to specialized systems
2. **Anemic Domain Model**: Entities have behavior, not just data
3. **Premature Optimization**: Profile-guided optimization only
4. **Over-Engineering**: Simple solutions preferred over complex patterns
5. **Global State**: Minimal use of globals, prefer dependency injection