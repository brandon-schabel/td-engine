# TD Engine Documentation

Welcome to the TD Engine documentation! This tower defense game engine is built with TypeScript and features a modular architecture for creating engaging tower defense experiences.

## Documentation Structure

### 🏗️ [Architecture](./architecture/)
- [Architecture Overview](./architecture/overview.md) - High-level system design and components
- [Design Patterns](./architecture/patterns.md) - Key patterns and architectural decisions
- [System Interactions](./architecture/interactions.md) - How systems communicate

### ⚙️ [Core Systems](./systems/)
- [Game Engine](./systems/game-engine.md) - Core game loop and state management
- [Entity System](./systems/entity-system.md) - Game object management
- [Rendering System](./systems/rendering.md) - Canvas rendering and camera
- [Audio System](./systems/audio.md) - Sound generation and management
- [Input System](./systems/input.md) - Keyboard, mouse, and touch handling

### 🎮 [Game Systems](./systems/)
- [Wave Management](./systems/wave-management.md) - Enemy spawning and waves
- [Resource Management](./systems/resources.md) - Currency, lives, and score
- [Upgrade Systems](./systems/upgrades.md) - Player and tower progression
- [Inventory System](./systems/inventory.md) - Item and equipment management

### 📚 [API Reference](./api/)
- [Core Classes](./api/core-classes.md) - Main game classes
- [Entity Classes](./api/entities.md) - Game object classes
- [System Classes](./api/systems.md) - Manager and system classes
- [Configuration](./api/configuration.md) - Game constants and settings

### 📖 [Developer Guides](./guides/)
- [Getting Started](./guides/getting-started.md) - Setup and first steps
- [Adding Features](./guides/adding-features.md) - Extending the game
- [Performance Guide](./guides/performance.md) - Optimization tips
- [Testing Guide](./guides/testing.md) - Testing strategies

## Quick Start

```typescript
import { Game } from './core/Game';

// Create canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Initialize game with default configuration
const game = new Game(canvas);

// Game automatically starts - set up input handlers
canvas.addEventListener('mousedown', (e) => game.handleMouseDown(e));
canvas.addEventListener('keydown', (e) => game.handleKeyDown(e.key));
```

## Key Features

- **Modular Architecture**: Composable systems for easy extension
- **Performance Optimized**: Spatial partitioning, object pooling, visibility culling
- **Full Input Support**: Keyboard, mouse, and touch controls
- **Dynamic Difficulty**: Adaptive spawn zones and wave patterns
- **Rich Audio**: Procedurally generated sounds using Web Audio API
- **Biome System**: Multiple themed environments with unique visuals
- **RPG Elements**: Player progression, inventory, and equipment

## Technology Stack

- **TypeScript**: Strict typing for maintainable code
- **Canvas 2D**: Hardware-accelerated rendering
- **Web Audio API**: Dynamic sound generation
- **Bun**: Fast build tool and test runner

## Contributing

See the [Developer Guides](./guides/) for information on extending the engine and contributing to the project.