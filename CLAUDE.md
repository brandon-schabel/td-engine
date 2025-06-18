# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TDD
Before writing a new feature and integrating it, ensure the tests are in a passing, after implementing the feature make sure tests are still passing, and make sure any new tests are passing 

## General Code Principles
Write self-explanatory, modular, functional code following DRY, SRP, and KISS. Code should be unit-testable with clear naming. Include a comment at the top of each file detailing the 5 most recent changes. Minimize file size with concise code.

## Update Docs
When changing/updating the architecture make sure to update the document files

## TypeScript Rules
- **No `any`**: Use strong typing, Zod schemas for unknown shapes
- **Functional style**: Pure functions, single responsibility, descriptive names
- **Error handling**: Throw typed errors or return error objects
- **Dependencies**: Prefer Bun built-ins, tree shake imports
- **File organization**: Single-responsibility files, named exports
- **Testing**: TDD approach, update tests with new logic

## Unit Testing Philosophy
Only unit test the engine. Avoid complex mocking, avoid integration tests, avoid functional tests, just do unit testing. If something can't be unit tested then break it out of the class or function until it can be unit tested. We're not going for 100% code coverage.

## Environment Setup
- **Bun**: Version 1.2+ (always use bun)
- **Browser**: Modern with Canvas2D and WebAudio support
- **TypeScript**: Strict mode, bundler resolution, path mapping (`@/` → `src/`)

## Development Commands
```bash
bun dev          # Development server
bun test         # Run tests
bun test:ui      # Tests with UI
bun test:coverage # Coverage report
bun typecheck    # Type checking
bun build        # Production build
```

## Test-Driven Development
1. Write comprehensive tests FIRST
2. Cover all behaviors, edge cases, error conditions
3. Run tests to verify failure
4. Implement minimal code to pass
5. Refactor while keeping tests green

### Testing Infrastructure
- **Stack**: Vitest, jsdom, comprehensive mocking
- **Helpers**: Located in `test/helpers/`
- **Structure**: Mirror `src/` in `test/` directory

## Architecture Overview

### File Structure
```
src/
├── core/      # Game engine
├── entities/  # Game objects
├── systems/   # Game systems
├── ui/        # UI components
├── audio/     # Audio management
├── config/    # Configuration
├── types/     # TypeScript definitions
├── utils/     # Utilities
└── rendering/ # Rendering systems
```

### Core Patterns
- **GameEngine**: State machine with observer pattern
- **Update-Render Loop**: Frame-based with delta time
- **Entity System**: Base Entity class with inheritance
- **Grid World**: 25x19 cells with spatial partitioning

### Key Systems
- **WaveManager**: Enemy spawning
- **AudioManager**: Spatial audio
- **TextureManager**: Asset caching
- **Camera**: Viewport management

## Configuration

### Core Config Files
- `GameConfig.ts`: Game initialization, mechanics, waves
- `GameSettings.ts`: User preferences, difficulty presets
- `ColorTheme.ts`: All game colors for theming
- `UIConstants.ts`: UI dimensions, spacing, z-index
- `AnimationConfig.ts`: Animation durations, easing
- `GameplayConstants.ts`: Core gameplay values
- `ResponsiveConfig.ts`: Breakpoints, scaling, touch

### Entity-Specific Config Files
- `PlayerConfig.ts`: Player abilities, upgrades, power-ups
- `TowerConfig.ts`: Tower stats, costs, upgrades
- `EnemyConfig.ts`: Enemy stats, behavior, rewards
- `ItemConfig.ts`: Item drops, rarity, generation
- `InventoryConfig.ts`: Inventory system settings

### System Config Files
- `AudioConfig.ts`: Audio volumes, spatial settings
- `UIConfig.ts`: HUD layout, camera, dialogs
- `MapConfig.ts`: Map generation, biomes, terrain
- `RenderingConfig.ts`: Rendering, particles, animations

### Customizable Parameters
- **Tower costs**: Configured in TowerConfig
- **Player stats**: Base stats, abilities, upgrades
- **Game mechanics**: Projectiles, waves, scoring
- **Visual theme**: Colors, animations, effects
- **Responsive design**: Breakpoints, scaling
- **Map generation**: Biomes, difficulty, dimensions

## Using the Configuration System

### Import Configuration
```typescript
// Import specific configs
import { COLOR_THEME, UI_CONSTANTS, ANIMATION_CONFIG } from '@/config';

// Use in code
const button = {
  backgroundColor: COLOR_THEME.ui.button.primary,
  padding: UI_CONSTANTS.spacing.md,
  transition: `opacity ${ANIMATION_CONFIG.durations.buttonHover}ms`
};
```

### Configuration Best Practices
- **Never hardcode values** - Always use configuration constants
- **Use semantic names** - Choose meaningful duration names (e.g., `dialogOpen` not `300`)
- **Group related values** - Keep similar configs together
- **Document units** - Specify ms, px, etc. in comments
- **Type safety** - Use `as const` for configuration objects

## Code Standards

### TypeScript
- Strict mode enabled
- Path imports: `@/` for src/
- Type imports: `import type { Type } from '@/types'`

### Naming Conventions
- **PascalCase**: Classes, interfaces, types
- **camelCase**: Functions, variables
- **SCREAMING_SNAKE_CASE**: Constants
- **Files**: PascalCase for classes, camelCase for utilities

### Error Handling
```typescript
// Return result pattern
upgrade(): { success: boolean; error?: string } {
  if (!this.canUpgrade()) {
    return { success: false, error: 'Cannot upgrade' };
  }
  return { success: true };
}
```

## Game Development

### Adding Features
- **New Tower**: Update TowerType enum, costs, implement behavior, add icon, write tests
- **New Enemy**: Update EnemyType enum, implement behavior, configure stats, test integration

### Performance Guidelines
- Remove destroyed entities
- Use grid for collision detection
- Render only visible entities
- Limit concurrent sounds
- Reuse objects when possible

## Debugging
- Browser DevTools with source maps
- Console commands: `window.game.pause()`, `window.game.addCurrency(1000)`
- Test helpers: `createTestGame()`, `simulateGameFrames()`

## Known Limitations
- Single player only
- No save system
- Procedural maps only
- Large maps (>50x50) may impact performance