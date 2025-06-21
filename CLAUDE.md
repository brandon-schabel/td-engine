# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Keep this file update with the 10 most important changes, for example for architectural changes it should mention to never use the old way anymore, when the old way is found, remove it in place of the new way until the codebase is refactored to the new way(that is if something changes)

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
- DialogManager and BaseDialog system (replaced by FloatingUIManager)
- All dialog components in `/src/ui/components/dialogs/`
- Dialog-specific styles and injection

The codebase now uses FloatingUIManager as the single UI system for all popups, dialogs, and floating elements. UIController provides centralized management of all UI elements.

### UI Styling Migration (December 2024)

Completed migration from inline styles to centralized CSS class-based styling system:
- **Migrated Components**: All UI components including TowerUpgradeUI, BuildMenuUI, InventoryUI, PlayerUpgradeUI, IconButton, SimplePowerUpDisplay, SimpleItemTooltip, MainMenuUI, PauseMenuUI, SettingsUI, Game.ts notifications, SimpleGameUI controls, and helpers.ts utilities
- **Removed all inline styles** - No more `style.cssText`, `createElement('style')`, or direct style property manipulation
- **Unified Dialog System**: SettingsUI refactored to use `floatingUI.createDialog()` eliminating duplicate modal overlay logic
- **Centralized styles** - All styles now in `ComponentStyles.ts` using CSS classes
- **Design token integration** - CSS custom properties generated from configuration files
- **Performance improvements** - CSS animations instead of JavaScript
- **Better maintainability** - Single source of truth for styling

## Architecture Overview

### Project Structure

```
td-engine/
├── src/                    # Source code
│   ├── core/              # Core game engine
│   ├── entities/          # Game objects
│   ├── systems/           # Game systems
│   ├── ui/                # User interface
│   ├── audio/             # Audio management
│   ├── config/            # Configuration files
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utilities
│   ├── rendering/         # Rendering systems
│   └── main.ts            # Entry point
├── public/                 # Static assets
│   ├── images/            # Game textures/sprites
│   ├── audio/             # Sound effects/music
│   └── fonts/             # Game fonts
├── test/                   # Test files
│   ├── helpers/           # Test utilities
│   └── unit/              # Unit tests (mirrors src/)
├── docs/                   # Documentation
├── scripts/                # Build/utility scripts
└── dist/                   # Build output

### Detailed Folder Architecture

```
src/
├── core/                   # Core game engine
│   ├── Game.ts            # Main game controller
│   ├── GameEngine.ts      # Game loop & state machine
│   ├── GameState.ts       # Game state enum
│   └── GameEventBus.ts    # Event system
│
├── entities/              # Game objects (inherit from Entity)
│   ├── Entity.ts          # Base entity class
│   ├── Tower.ts           # Tower implementation
│   ├── Enemy.ts           # Enemy implementation
│   ├── Player.ts          # Player character
│   ├── Projectile.ts      # Projectile system
│   ├── Collectible.ts     # Collectible items
│   └── items/             # Item system
│       ├── ItemTypes.ts   # Item type definitions
│       ├── Equipment.ts   # Equipment system
│       └── ItemFactory.ts # Item generation
│
├── systems/               # Game systems & managers
│   ├── Grid.ts            # Grid-based world system
│   ├── WaveManager.ts     # Enemy wave spawning
│   ├── SpawnZoneManager.ts # Dynamic spawn zones
│   ├── Camera.ts          # Viewport & camera
│   ├── Renderer.ts        # Canvas rendering
│   ├── MapGenerator.ts    # Procedural maps
│   ├── TextureManager.ts  # Texture loading/caching
│   ├── ScoreManager.ts    # Score & leaderboard
│   ├── Inventory.ts       # Inventory system
│   └── GameAudioHandler.ts # Game-specific audio
│
├── ui/                    # User interface system
│   ├── UIController.ts    # Centralized UI manager
│   ├── SimpleGameUI.ts    # Main game UI setup
│   ├── floating/          # Floating UI system
│   │   ├── index.ts       # FloatingUIManager
│   │   ├── FloatingUIElement.ts
│   │   ├── types.ts       # UI type definitions
│   │   ├── BuildMenuUI.ts # Build menu dialog
│   │   ├── TowerUpgradeUI.ts
│   │   ├── PlayerUpgradeUI.ts
│   │   ├── InventoryUI.ts
│   │   ├── GameOverUI.ts
│   │   ├── MainMenuUI.ts
│   │   ├── PauseMenuUI.ts
│   │   └── SettingsUI.ts
│   ├── components/        # UI components
│   │   ├── game/          # Game-specific UI
│   │   └── ui/            # Generic UI elements
│   ├── icons/             # SVG icon system
│   │   └── SvgIcons.ts
│   ├── styles/            # Styling system
│   │   ├── StyleManager.ts # Style injection
│   │   ├── UIStyles.ts    # Base UI styles
│   │   └── ComponentStyles.ts # Component styles
│   └── systems/           # UI subsystems (empty - all UI managed by FloatingUIManager)
│   └── utils/             # UI utilities
│       └── touchSupport.ts
│
├── audio/                 # Audio system
│   ├── AudioManager.ts    # Main audio controller
│   ├── AudioContext.ts    # Web Audio API wrapper
│   └── SoundLibrary.ts    # Sound definitions
│
├── config/                # Configuration constants
│   ├── GameConfig.ts      # Core game settings
│   ├── GameSettings.ts    # User preferences
│   ├── ColorTheme.ts      # Color palette
│   ├── UIConstants.ts     # UI dimensions
│   ├── AnimationConfig.ts # Animation timings
│   ├── GameplayConstants.ts
│   ├── ResponsiveConfig.ts # Responsive breakpoints
│   ├── PlayerConfig.ts    # Player settings
│   ├── TowerConfig.ts     # Tower definitions
│   ├── EnemyConfig.ts     # Enemy definitions
│   ├── ItemConfig.ts      # Item settings
│   ├── InventoryConfig.ts # Inventory settings
│   ├── AudioConfig.ts     # Audio settings
│   ├── UIConfig.ts        # UI configuration
│   ├── MapConfig.ts       # Map generation
│   └── RenderingConfig.ts # Rendering settings
│
├── types/                 # TypeScript type definitions
│   ├── GameTypes.ts       # Core game types
│   ├── MapData.ts         # Map-related types
│   ├── ItemTypes.ts       # Item system types
│   └── UITypes.ts         # UI-related types
│
├── utils/                 # Utility functions
│   ├── Vector2.ts         # 2D vector math
│   ├── CooldownManager.ts # Cooldown utilities
│   ├── formatters.ts      # Number/text formatting
│   ├── random.ts          # Random utilities
│   └── performance.ts     # Performance helpers
│
└── rendering/             # Rendering utilities
    ├── ParticleSystem.ts  # Particle effects
    ├── RenderUtils.ts     # Drawing helpers
    └── CanvasUtils.ts     # Canvas utilities
```

### Core Game Engine

#### Game Class (`src/core/Game.ts`)
The main game controller that manages all game systems:

```typescript
// Access game instance
const game = new Game(canvas, mapConfig);

// Core methods
game.start();                    // Start game loop
game.pause();                    // Pause game
game.resume();                   // Resume game
game.stop();                     // Stop and cleanup

// Resource management
game.getCurrency();              // Get current currency
game.addCurrency(100);           // Add currency
game.placeTower(x, y, type);     // Place a tower

// Tower management
game.selectTower(tower);         // Select a tower for upgrades
game.deselectTower();            // Deselect current tower
game.upgradeTower(tower, type);  // Upgrade a tower

// Wave management
game.startNextWave();            // Start next enemy wave
game.getCurrentWave();           // Get current wave number

// Access subsystems
game.getCamera();                // Get camera instance
game.getGrid();                  // Get grid system
game.getFloatingUIManager();     // Get UI manager
game.getAudioManager();          // Get audio system
```

#### GameEngine (`src/core/GameEngine.ts`)
Handles the game loop and state management:

```typescript
// Game states
enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

// The engine automatically manages update/render cycles
// You rarely interact with it directly
```

### Entity System

All game objects inherit from Entity base class:

```typescript
// Entity types
enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  TOWER = 'TOWER',
  PROJECTILE = 'PROJECTILE',
  COLLECTIBLE = 'COLLECTIBLE'
}

// Common entity methods
entity.update(deltaTime);        // Update entity state
entity.takeDamage(amount);       // Apply damage
entity.distanceTo(target);       // Calculate distance
entity.moveTo(position, speed);  // Move entity
```

### Grid System (`src/systems/Grid.ts`)

```typescript
const grid = game.getGrid();

// Check if position is valid for building
grid.canPlaceTower(x, y);

// Get entities at position
const tower = grid.getTowerAt(x, y);
const entities = grid.getEntitiesAt(x, y);

// Convert between grid and world coordinates
const gridPos = grid.worldToGrid(worldX, worldY);
const worldPos = grid.gridToWorld(gridX, gridY);
```

### Camera System (`src/systems/Camera.ts`)

```typescript
const camera = game.getCamera();

// Convert coordinates
const screenPos = camera.worldToScreen(worldPos);
const worldPos = camera.screenToWorld(screenPos);

// Camera controls
camera.zoomIn();
camera.zoomOut();
camera.reset();
camera.centerOnTarget(position);
```

## Configuration

The game/engine makes heavy use of configuration constants to enable better game balance tuning. All gameplay values, visual parameters, and UI dimensions are centralized in configuration files, making it easy to adjust game balance, create different difficulty modes, and maintain consistent styling throughout the codebase.


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

## UI System

### UIController (`src/ui/UIController.ts`)

The UIController is the centralized manager for all floating UI elements in the game. It prevents race conditions, manages UI lifecycle, and provides intelligent updates to prevent flickering.

#### Key Features
- **Centralized Control**: All UI operations go through UIController
- **Smart Updates**: Only updates changed DOM elements to prevent flickering
- **Escape Handler**: Press ESC to close all open dialogs (except HUD/health bars)
- **Lifecycle Management**: Proper cleanup and resource management

#### Usage Examples

```typescript
// Access UIController through game instance
const game = new Game(canvas, mapConfig);

// Show build menu at screen position
game.uiController.showBuildMenu(screenX, screenY, (towerType) => {
  // Handle tower selection
  game.setSelectedTowerType(towerType);
});

// Show tower upgrade UI
game.uiController.showTowerUpgrade(tower);

// Show player upgrade dialog
game.uiController.showPlayerUpgrade(player);

// Show inventory
game.uiController.showInventory();

// Show game over screen
game.uiController.showGameOver(stats);

// Create health bar for entity
game.uiController.createHealthBar(entity, {
  width: 60,
  height: 6,
  offset: { x: 0, y: -30 },
  showValue: true
});

// Close specific UI element
game.uiController.close('inventory');

// Close all dialogs (triggered by ESC key)
game.uiController.closeAllDialogs();

// Check if UI is open
if (game.uiController.isOpen('inventory')) {
  // Inventory is currently shown
}
```

### FloatingUIManager (`src/ui/floating/FloatingUIManager.ts`)

Low-level UI positioning and rendering system. Usually accessed through UIController.

#### Key Features
- **World/Screen Space**: Supports both coordinate systems
- **Smooth Following**: UI elements can smoothly follow entities
- **Auto Update Loop**: Efficient animation frame updates
- **Dialog System**: Modal dialogs with overlays

### Creating Custom UI Components

```typescript
import { FloatingUIElement } from '@/ui/floating';
import type { Game } from '@/core/Game';

export class CustomUI {
  private game: Game;
  private element: FloatingUIElement | null = null;
  
  constructor(game: Game) {
    this.game = game;
  }
  
  show(): void {
    const floatingUI = this.game.getFloatingUIManager();
    
    // Create floating element
    this.element = floatingUI.create('custom-ui', 'dialog', {
      persistent: true,
      autoHide: false,
      className: 'custom-dialog',
      screenSpace: true,  // Use screen coordinates
      anchor: 'center',   // Anchor point
      offset: { x: 0, y: 0 }
    });
    
    // Set content
    const content = document.createElement('div');
    content.innerHTML = '<h2>Custom UI</h2>';
    this.element.setContent(content);
    
    // Position at center of screen
    const centerPos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      getPosition: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    };
    this.element.setTarget(centerPos as any);
    
    // Enable to show
    this.element.enable();
  }
  
  destroy(): void {
    if (this.element) {
      this.game.getFloatingUIManager().remove(this.element.id);
      this.element = null;
    }
  }
}
```

### Smart DOM Updates (Preventing Flickering)

When creating UI that updates frequently, use smart updates:

```typescript
// Store last values
private lastValues = {
  currency: -1,
  health: -1
};

// Only update changed elements
private updateDynamicValues(): void {
  const element = this.element?.getElement();
  if (!element) return;
  
  const currency = this.game.getCurrency();
  
  // Only update if value changed
  if (currency !== this.lastValues.currency) {
    const currencyEl = element.querySelector('.currency-value');
    if (currencyEl) {
      currencyEl.textContent = String(currency);
    }
    this.lastValues.currency = currency;
  }
}
```

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

#### New Tower Type
1. Update `TowerType` enum in `src/entities/Tower.ts`
2. Add tower config in `src/config/TowerConfig.ts`:
   ```typescript
   [TowerType.NEW_TOWER]: {
     cost: 150,
     damage: 25,
     range: 100,
     fireRate: 1.5,
     // ... other stats
   }
   ```
3. Add tower icon in `src/ui/icons/SvgIcons.ts`
4. Update tower behavior in `Tower.ts` if needed
5. Add color theme in `ColorTheme.ts`
6. Write unit tests

#### New Enemy Type
1. Update `EnemyType` enum in `src/entities/Enemy.ts`
2. Add enemy config in `src/config/EnemyConfig.ts`:
   ```typescript
   [EnemyType.NEW_ENEMY]: {
     health: 100,
     speed: 50,
     damage: 10,
     reward: 25,
     // ... other stats
   }
   ```
3. Configure behavior (e.g., PLAYER_FOCUSED, TOWER_FOCUSED)
4. Add to wave configurations
5. Write unit tests

#### New UI Dialog
1. Create UI component extending pattern:
   ```typescript
   export class NewDialogUI {
     private game: Game;
     private element: FloatingUIElement | null = null;
     
     show(): void {
       // Use game.getFloatingUIManager()
     }
   }
   ```
2. Add method to UIController:
   ```typescript
   public showNewDialog(): void {
     this.close('new-dialog');
     // Create and show dialog
   }
   ```
3. Add styles to `ComponentStyles.ts`

### Audio System

```typescript
const audioManager = game.getAudioManager();

// UI sounds
audioManager.playUISound(SoundType.BUTTON_CLICK);
audioManager.playUISound(SoundType.UPGRADE);

// Spatial sounds (3D positioned)
audioManager.playSpatialSound(SoundType.EXPLOSION, position);
audioManager.playSpatialSound(SoundType.TOWER_SHOOT, tower.position);

// Background music
audioManager.playBackgroundMusic('battle');
audioManager.setMusicVolume(0.5);
```

### Performance Guidelines

- Remove destroyed entities from arrays
- Use grid for spatial queries instead of looping all entities
- Render only visible entities (`camera.isVisible()`)
- Limit concurrent sounds to prevent audio overload
- Reuse objects when possible (object pooling)
- Use `requestAnimationFrame` for smooth animations
- Batch DOM updates in UI components

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
