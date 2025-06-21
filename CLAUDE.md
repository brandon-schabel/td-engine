# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TDD

Before writing a new feature and integrating it, ensure the tests are in a passing, after implementing the feature make sure tests are still passing, and make sure any new tests are passing

## General Code Principles

Write self-explanatory, modular, functional code following DRY, SRP, and KISS. Code should be unit-testable with clear naming. Include a comment at the top of each file detailing the 5 most recent changes. Minimize file size with concise code.

## CRITICAL FILE SAFETY RULES

- **NEVER delete files outside the project working directory** (/Users/brandon/Programming/td-engine)
- **NEVER make changes that could be catastrophic to the system**
- **ALWAYS double-check before any file deletion** - think carefully about WHY a file is being deleted
- **BE EXTREMELY CAUTIOUS with file operations** - especially deletions
- **If uncertain about a file deletion, ASK THE USER FIRST**
- **Verify file paths** - ensure all operations are within the project scope

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

**STRICTLY UNIT TESTING ONLY** - There will be NO integration tests OR functional tests, just strictly unit testing. Very strong unit testing is required. If something can't be unit tested then break it out of the class or function until it can be unit tested. We're not going for 100% code coverage, but we do require thorough unit test coverage for all business logic.

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

## Recent Cleanup (June 2025)

Successfully migrated all UI to FloatingUIManager and removed:
- PopupManager system (replaced by FloatingUIManager)
- UIManager (no longer needed)
- Pathfinder system (unused A* implementation)
- ResourceManager and UpgradeService (over-engineered for current needs)
- VirtualJoystick component (unused)
- Redundant CSS files (styles injected via TypeScript)
- Dead code in SimpleGameUI (duplicate tower upgrade handlers)

The codebase now uses FloatingUIManager as the single UI system for all popups, dialogs, and floating elements.

### UI Styling Migration (December 2024)

Completed migration from inline styles to centralized CSS class-based styling system:
- **Migrated Components**: TowerUpgradeUI, BuildMenuUI, InventoryUI, PlayerUpgradeUI, IconButton, SimplePowerUpDisplay, SimpleItemTooltip
- **Removed all inline styles** - No more `style.cssText` or inline style attributes
- **Centralized styles** - All styles now in `ComponentStyles.ts` using CSS classes
- **Design token integration** - CSS custom properties generated from configuration files
- **Performance improvements** - CSS animations instead of JavaScript
- **Better maintainability** - Single source of truth for styling

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

The game/engine makes heavy use of configuration constants to enable better game balance tuning. All gameplay values, visual parameters, and UI dimensions are centralized in configuration files, making it easy to adjust game balance, create different difficulty modes, and maintain consistent styling throughout the codebase.

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
- **Game balance** - All numeric values affecting gameplay should be in config files
- **Easy tuning** - Group balance-related constants for quick iteration

## UI Styling System

The UI uses a centralized CSS-based styling system with design tokens generated from configuration files.

### Architecture

- **StyleManager** (`src/ui/styles/StyleManager.ts`) - Singleton that manages style injection
- **UIStyles** (`src/ui/styles/UIStyles.ts`) - Base utility classes and common UI patterns
- **ComponentStyles** (`src/ui/styles/ComponentStyles.ts`) - Game-specific component styles

### Key Principles

1. **No inline styles** - All styling through CSS classes
2. **Design tokens** - CSS custom properties generated from config files
3. **Semantic naming** - Classes describe purpose, not appearance
4. **Data attributes** - For dynamic styling (e.g., `data-tower-type`, `data-rarity`)
5. **Single injection** - Styles injected once at startup for performance

### Usage Example

```typescript
// Instead of inline styles
element.style.cssText = `background: ${COLOR_THEME.ui.background.primary}`;

// Use CSS classes
element.className = 'ui-card';

// For dynamic styling, use data attributes
element.dataset.towerType = tower.type.toLowerCase();
```

### CSS Class Naming Conventions

- **Utility classes**: `ui-` prefix (e.g., `ui-button`, `ui-card`)
- **Component classes**: Component name prefix (e.g., `tower-upgrade-panel`)
- **State modifiers**: Descriptive names (e.g., `active`, `disabled`, `critical`)
- **Responsive variants**: Use CSS media queries, not JavaScript

### Adding New Styles

1. Add component styles to `ComponentStyles.ts`
2. Use existing CSS custom properties from `StyleManager`
3. Follow BEM-like naming for complex components
4. Test responsive behavior with CSS media queries

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

## Project Management - Linear Integration

### Linear Workspace Configuration

- **Workspace**: BS Projects (Team ID: `2868a346-2a0d-4953-af4e-4b695aa5a981`)
- **Projects**:
  - **TD Engine** (Project ID: `a02b7c60-372f-448d-8368-0e56e1ddae61`)
  - **OctoPrompt** (Project ID: `9e96fe84-c58e-47d3-8402-3552cdf0bf3b`)

### Linear MCP Integration

The Linear MCP (Model Context Protocol) integration is built into Claude Code and provides direct access to Linear's API for project management. No additional setup or configuration is required - the MCP commands are available out of the box.

### Available Linear MCP Commands

- **List teams**: `mcp__linear__list_teams` - View all teams in the workspace
- **List projects**: `mcp__linear__list_projects` - View all projects (use with teamId parameter)
- **List issues**: `mcp__linear__list_issues` - View issues (use with teamId or projectId)
- **Get issue details**: `mcp__linear__get_issue` - Get specific issue details (use with issue ID)
- **Create comments**: `mcp__linear__create_comment` - Add comments to issues
- **Create issue**: `mcp__linear__create_issue` - Create new issues
- **Update issue**: `mcp__linear__update_issue` - Update existing issues
- **List issue statuses**: `mcp__linear__list_issue_statuses` - View available statuses
- **Get user**: `mcp__linear__get_user` - Get user information
- **Search documentation**: `mcp__linear__search_documentation` - Search Linear docs

### Issue Workflow

1. **Check available issues** using MCP commands with the appropriate project ID
2. **Copy branch name** from Linear issue (Cmd/Ctrl + Shift + .)
3. **Create feature branch** with Linear's naming convention (e.g., `brandonschabel1995/td-123-feature-name`)
4. **Link commits/PRs** to Linear issues using issue ID (e.g., TD-123, OP-456)
5. **Linear automatically updates** issue status based on PR activity

### Branch Naming Convention

- Format: `username/project-issueNumber-description`
- Examples:
  - TD Engine: `brandonschabel1995/td-123-add-new-tower`
  - OctoPrompt: `brandonschabel1995/op-456-implement-feature`

## Known Limitations

- Single player only
- No save system
- Procedural maps only
- Large maps (>50x50) may impact performance
