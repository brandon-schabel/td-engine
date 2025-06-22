# Getting Started with TD Engine

This guide will help you set up TD Engine and create your first tower defense game.

## Prerequisites

- **Bun** 1.2+ (recommended) or Node.js 18+
- **TypeScript** knowledge
- Modern web browser with Canvas support
- Basic understanding of game development concepts

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/td-engine.git
cd td-engine
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Using npm:
```bash
npm install
```

### 3. Start Development Server

```bash
bun dev
# or
npm run dev
```

The game will be available at `http://localhost:5173`

## Project Structure

```
td-engine/
├── src/
│   ├── core/          # Game engine core
│   ├── entities/      # Game objects (towers, enemies, etc.)
│   ├── systems/       # Game systems (rendering, audio, etc.)
│   ├── ui/           # UI components
│   ├── config/       # Configuration files
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── main.ts       # Entry point
├── test/             # Test files
├── public/           # Static assets
└── index.html        # HTML entry point
```

## Creating a Basic Game

### 1. HTML Setup

Create an HTML file with a canvas element:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Tower Defense Game</title>
    <style>

        #game-canvas {
            width: 100%;
            height: 100%;
            border: 1px solid #333;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
    </div>
    <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

### 2. Initialize the Game

```typescript
import { Game } from '@/core/Game';

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Create game with default configuration
const game = new Game(canvas);

// The game starts automatically!
```

### 3. Add Input Handlers

```typescript
// Mouse controls
canvas.addEventListener('mousedown', (e) => game.handleMouseDown(e));
canvas.addEventListener('mouseup', (e) => game.handleMouseUp(e));
canvas.addEventListener('mousemove', (e) => game.handleMouseMove(e));

// Keyboard controls
document.addEventListener('keydown', (e) => game.handleKeyDown(e.key));
document.addEventListener('keyup', (e) => game.handleKeyUp(e.key));

// Mouse wheel for zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    game.handleMouseWheel(e);
});
```

### 4. Configure the Game

```typescript
import { BiomeType, MapDifficulty, DecorationLevel } from '@/types/MapData';

const mapConfig = {
    width: 30,
    height: 20,
    cellSize: 32,
    biome: BiomeType.FOREST,
    difficulty: MapDifficulty.MEDIUM,
    seed: Date.now(),
    pathComplexity: 0.7,
    obstacleCount: 15,
    decorationLevel: DecorationLevel.NORMAL,
    enableWater: true,
    enableAnimations: true
};

const game = new Game(canvas, mapConfig);
```

## Game Controls

### Keyboard Controls

- **WASD/Arrow Keys** - Move player
- **Mouse** - Aim and shoot
- **1-4** - Select tower types
- **Space** - Pause/Resume
- **Enter** - Start next wave
- **ESC** - Cancel selection
- **U** - Toggle player upgrades
- **E** - Toggle inventory
- **+/-** - Zoom in/out
- **0** - Reset zoom
- **F** - Fit to screen
- **C** - Toggle camera follow

### Mouse Controls

- **Click** - Place tower / Select unit
- **Click + Hold** - Manual shooting
- **Right Click** - Cancel selection
- **Scroll** - Zoom in/out

## Core Concepts

### 1. Game Loop

The game runs at 60 FPS using `requestAnimationFrame`:

```typescript
// Game automatically manages the loop
// You can pause/resume:
game.pause();
game.resume();
```

### 2. Entity System

All game objects inherit from Entity:

```typescript
class Tower extends Entity {
    constructor(type: TowerType, position: Vector2) {
        super(EntityType.TOWER, position, 100, 15);
        // ...
    }
}
```

### 3. Grid System

The world is divided into a grid:

```typescript
const gridPos = game.grid.worldToGrid(worldPosition);
const canPlace = game.grid.canPlaceTower(gridPos.x, gridPos.y);
```

### 4. Resource Management

```typescript
// Check if player can afford something
if (game.canAffordTower(TowerType.BASIC)) {
    game.placeTower(TowerType.BASIC, position);
}

// Add currency
game.addCurrency(100);
```

## Adding Custom Content

### Creating a New Tower Type

1. Add to the enum in `entities/Tower.ts`:
```typescript
export enum TowerType {
    BASIC = 'BASIC',
    SNIPER = 'SNIPER',
    RAPID = 'RAPID',
    WALL = 'WALL',
    LASER = 'LASER' // New tower
}
```

2. Add configuration in `config/TowerConfig.ts`:
```typescript
export const TOWER_STATS = {
    LASER: {
        damage: 50,
        range: 200,
        fireRate: 0.5,
        projectileSpeed: 1000
    }
};

export const TOWER_COSTS = {
    LASER: 100
};
```

3. Implement behavior in Tower class:
```typescript
case TowerType.LASER:
    // Custom laser behavior
    break;
```

### Creating a New Enemy Type

Similar process for enemies in `entities/Enemy.ts` and `config/EnemyConfig.ts`.

## Development Commands

```bash
# Development server with hot reload
bun dev

# Run tests
bun test

# Run tests with UI
bun test:ui

# Type checking
bun typecheck

# Build for production
bun build

# Preview production build
bun preview
```

## Debugging

### Browser DevTools

1. Open DevTools (F12)
2. Use Sources tab for breakpoints
3. Console for logging

### Game Debug Commands

```javascript
// In browser console
window.game.pause();
window.game.addCurrency(1000);
window.game.player.heal(100);
```

### Performance Monitoring

```javascript
// Show FPS counter
window.showFPS = true;

// Log entity counts
console.log(game.getEntities());
```

## Common Issues

### Canvas Not Rendering

- Ensure canvas has explicit width/height
- Check if game loop is running
- Verify no JavaScript errors in console

### Performance Issues

- Reduce map size
- Lower decoration density
- Disable environmental effects
- Check entity counts

### Audio Not Playing

- Click or press a key to resume AudioContext
- Check browser autoplay policies
- Ensure audio is not muted

## Next Steps

1. Read the [Architecture Overview](../architecture/overview.md)
2. Learn about [Adding Features](./adding-features.md)
3. Explore the [API Reference](../api/core-classes.md)
4. Check out [Performance Optimization](./performance.md)

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Game Development Patterns](https://gameprogrammingpatterns.com/)