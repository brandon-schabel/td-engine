# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Code Principles
Write self-explanatory, modular, and functional code. Adhere to DRY (Don't Repeat Yourself), SRP (Single Responsibility Principle), and KISS (Keep It Simple, Stupid). Code should be easily unit-testable and read like a clear sentence, avoiding magic numbers. Include a comment at the top of each file detailing the 5 most recent changes to prevent repeated mistakes. Minimize file size by writing concise code and fitting more characters per line where readable.

---
## TypeScript Rules
Apply these to all TypeScript files for a consistent, high-quality codebase.

### 1. Strong Typing & Advanced TS Features
- **No `any` Unless Absolutely Necessary**: Use strong typing. For unknown shapes, use or create a Zod schema and derive the TS type.
- **Generics & Inference**: Leverage TypeScript’s generics and advanced inference to avoid wide or unknown types.
- **Modern TS Constructs**: Use mapped types, intersection types, `satisfies` expressions, etc., for clarity or correctness.

### 2. Functional & Readable Code
- **Functional Programming Style**: Prefer pure functions; avoid side effects unless essential.
- **No Bloated Functions**: Each function should have a single, small responsibility. Refactor large functions.
- **Descriptive Naming**: Use clear names. Avoid abbreviations or single-letter variables (except in trivial loops).

### 3. Error Handling & Logging
- **Throw or Return**: On error, throw a typed error (`Error` subclass) or return a descriptive error object. Do not silently swallow errors.
- **Logging**: Use a consistent logging approach (e.g., custom `logger` module). Prefer structured logs over `console.log` for production.

### 4. Minimal External Dependencies
- **Prefer Bun & Standard Lib**: Rely on Bun’s built-in features or TS/Node standard libraries. Verify necessary external libraries carefully.
- **Tree Shaking & Dead Code**: Minimize imports and remove unused code. Don’t import entire libraries for small parts.

### 5. File & Module Organization
- **Single-Responsibility Files**: Each file should typically contain one main concept (class, service, or small group of related functions).
- **Clear Imports & Exports**: Use named exports unless a file’s purpose is a single main export. Sort and group imports logically.

### 6. Testing & Documentation
- **Test-Driven Mindset**: Add/update tests when introducing new logic. Keep functions small and unit-testable.
- **Inline Documentation**: Provide concise docstrings or inline comments for complex logic. Keep them accurate.

* **Readability and Simplicity (KISS)**: Write clear, concise code.
* **Modularity**: Organize code into logical modules/packages. Avoid circular dependencies.
* **Error Handling**: Handle exceptions gracefully. Use specific exception types.
* **Docstrings**: Write clear docstrings for modules, functions, and Pydantic models (e.g., Google style).
* **Avoid Global Variables**: Minimize their use.
* **Regularly Refactor**.


## Prerequisites & Environment Setup

### System Requirements
- **Node.js**: **Bun**: Version 1.2+ (recommended) - always use bun 
- **Browser**: Modern browser with Canvas2D and WebAudio API support
- **Operating System**: Cross-platform (Windows, macOS, Linux)
- **Memory**: Minimum 4GB RAM for development
- **Graphics**: Hardware-accelerated Canvas2D support

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd claude-td

# Install dependencies using Bun (recommended)
bun install
```

### Browser Compatibility
- **Chrome/Edge**: 90+ (full support)
- **Firefox**: 88+ (full support)
- **Safari**: 14+ (full support)
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

### Development Environment Configuration
- **TypeScript**: Configured with strict mode and latest ECMAScript features
- **Module Resolution**: Bundler mode with path mapping (`@/` → `src/`)
- **Hot Module Replacement**: Enabled for rapid development
- **Source Maps**: Generated for debugging

**Note**: There is no need to start the server manually during AI assistance, as the user will run the server themselves.

## Development Commands

```bash
# Run development server
bun dev

# Run tests in watch mode
bun test

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage

# Type check without emitting
bun typecheck

# Build for production
bun build
```

## Test-Driven Development (TDD) Approach

**IMPORTANT: Always follow a test-driven development approach when creating new modules or features.**

### TDD Process
1. **Write comprehensive tests FIRST** before implementing any new module
2. Ensure tests cover:
   - All expected behaviors and edge cases
   - Error conditions and boundary values
   - Integration with existing systems
3. Run tests to verify they fail (red phase)
4. Implement the minimal code to make tests pass (green phase)
5. Refactor while keeping tests green

### Testing Framework & Infrastructure

#### Testing Stack
- **Vitest**: Modern test runner with TypeScript support
- **jsdom**: DOM simulation for browser-like environment
- **Comprehensive Mocking**: Canvas, Audio, DOM elements

#### Testing Patterns & Organization

##### 1. Test Helper Utilities (`test/helpers/`)
- **Mock Builders**: `createTestGame()`, `createMockCanvas()`
- **Entity Builders**: `createTestTower()`, `createTestEnemy()`
- **Game State Simulators**: `simulateWaveCompletion()`, `simulateVictory()`
- **Assertion Helpers**: Custom matchers for game-specific validations

##### 2. Test Categories
- **Unit Tests**: Individual class behavior testing
- **Integration Tests**: System interaction testing
- **Core Tests**: Game engine and main game loop testing

##### 3. Mock Strategies
- **Canvas Context Mocking**: Comprehensive 2D context simulation
- **Audio Context Mocking**: WebAudio API simulation
- **DOM Element Mocking**: Full DOM interaction support
- **Animation Frame Mocking**: Controlled time progression

#### Testing Best Practices
- Place tests in `test/` directory mirroring the `src/` structure
- Mock Canvas and DOM elements when needed
- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks
- Use helper utilities for consistent test setup

Example test structure:
```typescript
describe('GameEngine', () => {
  describe('state management', () => {
    it('should transition from MENU to PLAYING when started', () => {
      // Test implementation using helpers
    });
    
    it('should pause and resume correctly', () => {
      // Test implementation
    });
  });
  
  describe('game loop', () => {
    it('should call update and render callbacks', () => {
      // Test implementation
    });
  });
});
```

## Architecture Overview

### File Structure
```
src/
├── core/           # Game engine and main orchestration
├── entities/       # Game objects (Tower, Enemy, Player, etc.)
├── systems/        # Game systems (Grid, WaveManager, etc.)
├── ui/             # User interface components
├── audio/          # Audio management system
├── config/         # Configuration and presets
├── types/          # TypeScript definitions
├── utils/          # Utility functions
└── rendering/      # Specialized rendering systems

test/
├── core/           # Core engine tests
├── entities/       # Entity behavior tests
├── systems/        # System integration tests
├── helpers/        # Testing utilities and mocks
└── integration/    # Full integration tests
```

### Game Engine Implementation

#### Core Architecture Pattern: Observer + State Machine
The `GameEngine` class (`src/core/GameEngine.ts`) implements:
- **State Management**: Enum-based states (MENU, PLAYING, PAUSED, GAME_OVER, VICTORY)
- **Observer Pattern**: Callback subscription system for update/render cycles
- **Frame-based Loop**: Uses `requestAnimationFrame` with `setTimeout` fallback
- **Delta Time**: Frame-rate independent updates

#### State Transitions
```
MENU → PLAYING (via start())
PLAYING ⇄ PAUSED (via pause()/resume())
PLAYING → GAME_OVER (via gameOver())
PLAYING → VICTORY (via victory())
```

### Core Game Loop
The game follows a classic **Update-Render cycle**:

#### Update Phase (`Game.update()`):
1. Spawn zone management
2. Wave management and enemy spawning
3. Entity updates (enemies, player, towers, projectiles)
4. Collision detection and damage processing
5. Resource management
6. Game state validation

#### Render Phase (`Game.render()`):
1. Scene rendering (entities, effects, UI)
2. Tower range visualization
3. Tower ghost preview for placement
4. Game state overlays

### Entity System
#### Entity Hierarchy
```
Entity (base class)
├── Tower (with 5-level upgrade system)
├── Enemy (with AI pathfinding)
├── Player (manual control + auto-shooting)
├── Projectile (with targeting systems)
└── Collectible (with pickup behavior)
```

#### Entity Features
- **Entity ID System**: Unique tracking for debugging
- **Common Properties**: Position, velocity, health, radius
- **Inheritance Pattern**: Specialized behavior through class extension
- **Component-like Design**: Modular functionality

### Game Systems
#### Core Systems
- **Grid**: 25x19 cell-based world with multiple cell types (EMPTY, PATH, TOWER, OBSTACLE)
- **WaveManager**: Enemy spawn patterns with configurable waves
- **SpawnZoneManager**: Dynamic spawn point management
- **AudioManager**: Spatial audio with position-based effects
- **TextureManager**: Asset loading and caching
- **Camera**: Viewport management and coordinate transformation

#### Advanced Features
- **Dynamic Map Generation**: Procedural maps with biome support
- **Multi-pattern Spawning**: Various enemy spawn strategies
- **Upgrade Systems**: Both tower and player progression (5 levels each)
- **Touch Support**: Mobile controls with virtual joystick

### Key Architectural Patterns
- **Entity-Component-like**: Base Entity with specialized inheritance
- **Manager Pattern**: Dedicated managers for complex systems
- **Observer Pattern**: GameEngine callback subscriptions
- **Grid-based World**: Spatial partitioning for efficient queries
- **Modular Rendering**: Separate renderers for different concerns
- **Strict TypeScript**: No implicit any, comprehensive type safety

## Development Workflow & Performance

### Build Tools & Configuration
- **Vite**: Modern build tool with Hot Module Replacement (HMR)
- **TypeScript**: Strict mode with ESNext target and bundler resolution
- **Path Mapping**: `@/` prefix for clean imports from `src/`

### Performance Optimizations
- **Inlined Resource Management**: Currency, lives, score tracking in Game class
- **Entity Array Filtering**: Efficient cleanup of destroyed entities
- **Cached Mock Objects**: Reusable test fixtures for performance
- **Spatial Partitioning**: Grid-based collision detection
- **Frame-rate Independence**: Delta time-based updates

### Code Quality Measures
- **Strict TypeScript Configuration**: Full type safety enforcement
- **Test-Driven Development**: Write tests before implementation
- **Modular Architecture**: Clear separation of concerns
- **Comprehensive Documentation**: Inline comments and type annotations
- **Modern Language Features**: Advanced TypeScript patterns

### Development Best Practices
- **Hot Module Replacement**: Instant feedback during development
- **Watch Mode Testing**: Continuous test execution during development
- **Type Checking**: Separate type checking from building
- **Test Coverage**: Monitor test coverage with detailed reporting
- **Mobile Support**: Touch controls and responsive design considerations

## Configuration & Customization

### Game Configuration System
The game features a comprehensive configuration system located in `src/config/`:

#### Core Configuration Files
- **`GameConfig.ts`**: Base game constants (tower costs, player stats, mechanics)
- **`GameConfiguration.ts`**: Runtime configuration interface
- **`ConfigurationPresets.ts`**: Pre-defined game difficulty and style presets
- **`ConfigurationValidator.ts`**: Ensures configuration validity
- **`ConfigurationPersistence.ts`**: Saves/loads user preferences

#### Customizable Game Parameters

##### Tower Configuration
```typescript
// Located in src/config/GameConfig.ts
export const TOWER_COSTS = {
  'BASIC': 20,    // Basic tower cost
  'SNIPER': 50,   // Sniper tower cost
  'RAPID': 30,    // Rapid fire tower cost
  'WALL': 10      // Wall/barrier cost
} as const;
```

##### Player Base Stats
```typescript
export const BASE_PLAYER_STATS = {
  damage: 15,         // Base damage per shot
  speed: 150,         // Movement speed (pixels/second)
  fireRate: 2,        // Shots per second
  health: 100,        // Starting health
  radius: 12          // Collision radius
} as const;
```

##### Game Mechanics Tuning
```typescript
export const GAME_MECHANICS = {
  projectileSpeed: 400,           // Player projectile speed
  towerProjectileSpeed: 300,      // Tower projectile speed
  healAbilityCooldown: 20000,     // Heal cooldown (ms)
  damageRegenCooldown: 3000,      // Damage regeneration delay (ms)
  regenInterval: 1000             // Health regen interval (ms)
} as const;
```

### Map Generation Configuration
Maps support extensive customization through `MapGenerationConfig`:

#### Biome Types
- **FOREST**: Green terrain with trees
- **DESERT**: Sandy terrain with cacti
- **ARCTIC**: Snow/ice terrain
- **VOLCANIC**: Lava terrain with rocks
- **GRASSLAND**: Plain grass terrain

#### Map Difficulty Levels
- **EASY**: Simpler paths, fewer obstacles
- **MEDIUM**: Balanced complexity
- **HARD**: Complex paths, more obstacles
- **EXTREME**: Maximum challenge

#### Customizable Map Parameters
```typescript
interface MapGenerationConfig {
  width: number;              // Map width in cells
  height: number;             // Map height in cells
  cellSize: number;           // Pixel size per cell
  biome: BiomeType;           // Visual theme
  difficulty: MapDifficulty;  // Complexity level
  seed?: number;              // Random seed for reproducibility
  pathComplexity: number;     // Path winding factor (0-1)
  obstacleCount: number;      // Number of obstacles
  decorationLevel: number;    // Visual detail level (0-1)
  enableWater: boolean;       // Include water features
  enableAnimations: boolean;  // Animated decorations
}
```

### Audio System Configuration
The audio system (`src/audio/AudioManager.ts`) supports:
- **Master Volume Control**: Global volume adjustment
- **Sound Type Categories**: UI, Game Effects, Background
- **Spatial Audio**: Position-based sound effects
- **Web Audio API**: Advanced audio processing

### UI Theme Customization
UI theming is handled through `src/ui/core/themes/`:
- **Color Schemes**: Customizable color palettes
- **Component Styling**: Modular CSS-in-JS styling
- **Responsive Design**: Mobile and desktop layouts
- **Touch Controls**: Virtual joystick and touch buttons

## Build & Deployment

### Development Server
```bash
# Start development server with HMR
bun dev
# Server runs on http://localhost:4017
```

### Production Build
```bash
# Build optimized production bundle
bun build

# Outputs to dist/ directory
# Assets are optimized and minified
# Source maps included for debugging
```

### Build Configuration
The build process uses **Vite** with these optimizations:
- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Tree Shaking**: Removes unused code
- **Asset Optimization**: Images and other assets are optimized
- **TypeScript Compilation**: Full type checking during build
- **Hot Module Replacement**: Development-only feature

### Deployment Considerations
- **Static Hosting**: Can be deployed to any static hosting service
- **Asset Paths**: All assets use relative paths
- **Browser Support**: ES2020+ required
- **HTTPS**: Required for WebAudio API in production
- **Performance**: Optimized for 60fps gameplay

### Environment Variables
Currently minimal environment configuration is needed:
- No API keys or external services required
- All configuration is compile-time

## Code Standards & Conventions

### TypeScript Configuration
- **Strict Mode**: All strict TypeScript options enabled
- **No Implicit Any**: Explicit typing required
- **Null Checking**: Strict null checks enforced
- **ES Modules**: Modern module system
- **Path Mapping**: Use `@/` for src/ imports
- **Type Imports**: import type { GameType } from '@/types'
- **When importing use defined paths**: `@/entites`, `@/config`, `@/core` - `@/` is a reference to src/

### Naming Conventions

#### Files and Directories
- **PascalCase**: Class files (`GameEngine.ts`, `Tower.ts`)
- **camelCase**: Utility files (`vector2.ts`, `timeController.ts`)
- **kebab-case**: Test files (`game-engine.test.ts`)
- **lowercase**: Directories (`src/`, `test/`, `ui/`)

#### Code Naming
- **PascalCase**: Classes, Interfaces, Enums, Types
- **camelCase**: Functions, variables, methods
- **SCREAMING_SNAKE_CASE**: Constants and enum values
- **_private**: Private members (prefix with underscore)

#### Import/Export Patterns
```typescript
// Prefer named exports
export class GameEngine { }
export const GAME_CONFIG = { };

// Use index files for module aggregation
export * from './GameEngine';
export * from './Game';

// Import organization
import { GameEngine } from '@/core/GameEngine';
import type { Position } from '@/types';
import { vi } from 'vitest'; // Test-only imports last
```

### Error Handling Patterns
```typescript
// Use Result-like patterns for fallible operations
class Tower {
  upgrade(type: UpgradeType): { success: boolean; error?: string } {
    if (!this.canUpgrade(type)) {
      return { success: false, error: 'Cannot upgrade further' };
    }
    // ... upgrade logic
    return { success: true };
  }
}

// Use try-catch for external APIs only
async function loadAssets(): Promise<void> {
  try {
    await audioManager.initialize();
  } catch (error) {
    console.warn('Audio initialization failed:', error);
    // Graceful fallback
  }
}
```

## Debugging & Troubleshooting

### Development Debug Features
- **Browser DevTools**: Full source map support
- **Console Commands**: Debug commands available in browser console
- **Performance Profiling**: Use browser performance tools
- **Memory Debugging**: Monitor object creation and cleanup

### Common Issues & Solutions

#### Canvas Rendering Issues
```typescript
// Check canvas context availability
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas 2D context not supported');
}
```

#### Audio Problems
```typescript
// Handle Web Audio API permission requirements
document.addEventListener('click', async () => {
  try {
    await audioManager.initialize();
  } catch (error) {
    console.warn('Audio requires user interaction');
  }
});
```

#### Performance Issues
- **Check Frame Rate**: Use browser performance tab
- **Monitor Entity Count**: Large numbers of entities affect performance
- **Canvas Size**: Very large canvas affects rendering performance
- **Memory Leaks**: Check for unreleased event listeners

### Debug Console Commands
Available in browser console during development:
```javascript
// Access game instance
window.game.pause();
window.game.resume();

// Spawn enemies for testing
window.game.spawnTestEnemies(10);

// Add currency for testing
window.game.addCurrency(1000);

// Audio controls
window.game.audioManager.stopAllSounds();
```

### Testing Debug Utilities
```typescript
// Use test helpers for debugging
import { createTestGame, simulateGameFrames } from '@/test/helpers';

const game = createTestGame({ debug: true });
simulateGameFrames(game, 60); // Debug game state after 1 second
```

## Game Development Specifics

### Adding New Tower Types
1. **Define Tower Type**: Add to `TowerType` enum
2. **Update Costs**: Add cost to `TOWER_COSTS`
3. **Implement Behavior**: Extend base Tower class or add type-specific logic
4. **Add Icons**: Create SVG icon in `SvgIcons.ts`
5. **Update UI**: Add tower to build panel
6. **Write Tests**: Test tower behavior and integration

### Adding New Enemy Types
1. **Define Enemy Type**: Add to `EnemyType` enum
2. **Implement Behavior**: Extend base Enemy class
3. **Configure Stats**: Add to enemy configuration
4. **Update Wave Config**: Include in wave definitions
5. **Add Visual Assets**: Create appropriate sprites/colors
6. **Test Integration**: Verify spawning and behavior

### Modifying Game Balance
Game balance is controlled through configuration files:
- **Tower Stats**: Damage, range, fire rate in tower implementations
- **Enemy Stats**: Health, speed, reward values
- **Economic Balance**: Tower costs, enemy rewards, upgrade costs
- **Wave Progression**: Enemy counts, types, timing

### Performance Optimization Guidelines
- **Entity Management**: Remove destroyed entities from arrays
- **Collision Detection**: Use spatial partitioning (grid system)
- **Rendering**: Only render visible entities
- **Audio**: Limit concurrent sound effects
- **Memory**: Reuse objects where possible

### Mobile Development Considerations
- **Touch Controls**: Virtual joystick and touch buttons implemented
- **Performance**: Mobile devices have limited processing power
- **Screen Size**: Responsive UI scaling
- **Battery**: Optimize for energy efficiency
- **Network**: Offline gameplay (no network required)

## Known Limitations & Technical Debt

### Current Limitations
- **Single Player Only**: No multiplayer support
- **No Save System**: Progress is not persistent
- **Limited Asset Management**: Minimal texture/sound assets
- **No Level Editor**: Maps are procedurally generated only
- **Performance**: Large maps (>50x50) may impact performance

### Areas for Future Improvement
- **Save/Load System**: Implement game state persistence
- **Asset Pipeline**: More sophisticated asset management
- **Visual Effects**: Particle systems and animations
- **Sound Design**: More comprehensive audio feedback
- **Accessibility**: Screen reader support, color blind considerations
- **Performance**: Web Workers for heavy computations

### Technical Debt
- **Legacy UI Code**: Some UI components need modernization
- **Test Coverage**: Some systems need more comprehensive testing
- **Documentation**: Some internal APIs need better documentation
- **Configuration**: Could benefit from runtime configuration loading

This documentation provides comprehensive guidance for development, debugging, and customization of the tower defense game. Regular updates to this file help maintain clarity and usefulness for all developers working on the project.