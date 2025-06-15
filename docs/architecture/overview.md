# Architecture Overview

TD Engine is a browser-based tower defense game engine built with TypeScript. It follows a modular architecture with clear separation of concerns between game logic, rendering, audio, and input handling.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Environment                       │
├─────────────────────────────────────────────────────────────────┤
│                          UI Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ SimpleGameUI │  │ Settings Menu│  │ Game Over    │          │
│  │              │  │              │  │ Screen       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        Game Core                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GameEngine   │  │ Game         │  │ GameState    │          │
│  │ (Loop)       │  │ (Orchestrator)│  │ (FSM)        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                      System Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Renderer     │  │ AudioManager │  │ InputManager │          │
│  │ & Camera     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ WaveManager  │  │ EntityManager│  │ Inventory    │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                      Entity Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Tower        │  │ Enemy        │  │ Player       │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Projectile   │  │ Collectible  │                            │
│  │              │  │              │                            │
│  └──────────────┘  └──────────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Grid         │  │ MapData      │  │ GameConfig   │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Game Engine (`GameEngine.ts`)

The heart of the game loop, responsible for:
- Managing game state (menu, playing, paused, game over, victory)
- Running the update-render loop using `requestAnimationFrame`
- Providing pause/resume functionality
- Publishing update and render events to subscribers

```typescript
class GameEngine {
  private state: GameState = GameState.MENU;
  private updateCallbacks: Set<UpdateCallback> = new Set();
  private renderCallbacks: Set<RenderCallback> = new Set();
  
  // Main game loop
  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.update(deltaTime);
    this.render(deltaTime);
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
}
```

### 2. Game Orchestrator (`Game.ts`)

The main game class that integrates all systems:
- Manages entity collections (towers, enemies, projectiles)
- Handles resource economy (currency, lives, score)
- Processes player input and game events
- Coordinates between all game systems
- Implements save/load functionality

### 3. Entity System

Base entity architecture with inheritance:
- `Entity.ts` - Base class with position, health, velocity
- Specialized entities extend base functionality
- Entity lifecycle managed by Game class
- Spatial partitioning for performance

### 4. Rendering System

Canvas-based 2D rendering with:
- Camera system for viewport management
- Biome-based visual themes
- Environmental effects (particles, lighting)
- Texture management and caching
- Visibility culling for performance

### 5. Audio System

Procedural audio generation using Web Audio API:
- Dynamic sound synthesis
- Spatial audio for positional sounds
- Sound pooling and throttling
- Master volume control

## Data Flow

### Update Cycle
```
GameEngine.update(deltaTime)
  ├─> Game.update(deltaTime)
      ├─> SpawnZoneManager.update()
      ├─> WaveManager.update() -> spawn enemies
      ├─> Enemy.update() for each enemy
      ├─> Player.update()
      ├─> Tower.updateAndShoot() -> create projectiles
      ├─> Projectile.update() for each projectile
      ├─> Collectible.update() for each collectible
      ├─> Check collisions
      ├─> Clean up dead entities
      └─> Check win/lose conditions
```

### Render Cycle
```
GameEngine.render(deltaTime)
  ├─> Game.render(deltaTime)
      ├─> Renderer.clear()
      ├─> Renderer.renderGrid()
      ├─> Renderer.renderDecorations()
      ├─> Renderer.renderEnvironmentalEffects()
      ├─> Renderer.renderEntities()
      │   ├─> renderTower() for each tower
      │   ├─> renderEnemy() for each enemy
      │   ├─> renderProjectile() for each projectile
      │   ├─> renderCollectible() for each collectible
      │   └─> renderPlayer()
      ├─> Renderer.renderUI()
      └─> Renderer.renderGameStateOverlays()
```

## Key Design Principles

1. **Separation of Concerns**: Each system handles a specific aspect of the game
2. **Composition over Inheritance**: Systems are composed rather than deeply inherited
3. **Performance First**: Spatial partitioning, object pooling, visibility culling
4. **Type Safety**: Full TypeScript with strict typing
5. **Modularity**: Systems can be extended or replaced independently

## Communication Patterns

- **Direct Method Calls**: Most common pattern for synchronous operations
- **Observer Pattern**: GameEngine publishes update/render events
- **Event Emitter**: Custom events for decoupled communication
- **DOM Events**: UI layer communication with game core

## Memory Management

- **Object Pooling**: Projectiles reuse instances to reduce GC pressure
- **Spatial Partitioning**: Entities organized in spatial grid for efficient queries
- **Entity Cleanup**: Dead entities removed each frame
- **Resource Caching**: Textures and audio cached for reuse