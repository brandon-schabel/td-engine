# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


There is no need to start the server, I will run the server myself.

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

### Testing Patterns
- Place tests in `test/` directory mirroring the `src/` structure
- Mock Canvas and DOM elements when needed
- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks

Example test structure:
```typescript
describe('NewModule', () => {
  it('should handle expected behavior', () => {
    // Test implementation
  });
  
  it('should handle edge cases', () => {
    // Test implementation
  });
});
```

## Architecture Overview

### Core Game Loop
- **GameEngine**: Manages game states (menu, playing, paused, game over, victory) and update/render cycles
- **Game**: Main orchestrator connecting all systems and handling user input

### Entity System
- **Entity**: Base class for all game objects
- **Player**: WASD/arrow controlled character with auto-shooting
- **Tower**: Three types (BASIC, SNIPER, RAPID) with upgradeable stats
- **Enemy**: Three types (BASIC, FAST, TANK) following predefined paths
- **Projectile**: Damage dealers spawned by towers and player

### Game Systems
- **Grid**: 25x19 cell-based map management
- **Pathfinder**: Converts grid paths to world coordinates
- **WaveManager**: Controls enemy spawn patterns
- **ResourceManager**: Tracks currency, lives, and score
- **Renderer**: Canvas-based 2D rendering
- **TowerUpgradeManager**: 5-level tower upgrade system
- **PlayerUpgradeManager**: 5-level player upgrade system

### Key Patterns
- Component-based architecture with clear separation of concerns
- Observer pattern for game engine callbacks
- Manager pattern for resource and upgrade systems
- Strict TypeScript with comprehensive type safety