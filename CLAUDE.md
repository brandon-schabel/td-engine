# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

- **TDD**: Write tests FIRST, ensure they pass after implementation
- **No `any`**: Use strong typing, Zod schemas for unknown shapes  
- **Functional style**: Pure functions, single responsibility, descriptive names
- **UNIT TESTING ONLY**: No integration tests. Break down code until it's unit testable
- **File Safety**: NEVER delete files outside `/Users/brandon/Programming/td-engine`

## Environment & Commands

- **Runtime**: Bun 1.2+ (always use bun, not npm)
- **TypeScript**: Strict mode, path mapping (`@/` → `src/`)

```bash
bun dev          # Development server
bun test         # Run tests  
bun typecheck    # Type checking
bun build        # Production build
```

## UI System Architecture

### UI Element Abstractions

The UI uses a utility-first CSS system with high-level element abstractions. **Always use these abstractions instead of manual DOM creation**:

```typescript
// ✅ CORRECT - Use element abstractions
import { createButton, createCard, createHeader, cn } from '@/ui/elements';

const button = createButton({
  text: 'Save',
  variant: 'primary',
  icon: IconType.SAVE,
  onClick: handleSave
});

// ❌ WRONG - Don't create DOM manually
const button = document.createElement('button');
button.className = 'ui-button';
button.style.backgroundColor = 'blue';
```

**Available Elements:**
- **Buttons**: `createButton`, `createIconButton`, `createCloseButton`
- **Cards**: `createCard`, `createStructuredCard`, `createClickableCard`  
- **Headers**: `createHeader`, `createDialogHeader`, `createCompactHeader`
- **Forms**: `createInput`, `createSelect`, `createToggle`, `createSlider`
- **Display**: `createStatDisplay`, `createResourceDisplay`, `createIconContainer`
- **Navigation**: `createTabBar`, `createTooltip`

### Styling Rules

1. **Use utility classes** for all styling (400+ available in `UtilityStyles.ts`)
2. **NO inline styles** - Never use `element.style` or `style.cssText`
3. **Compose utilities** - Build complex styles by combining utility classes
4. **Design tokens** - All values come from configuration as CSS variables

```typescript
// ✅ CORRECT - Utility classes
element.className = cn('bg-surface-primary', 'p-4', 'rounded-lg', 'shadow-md');

// ❌ WRONG - Inline styles
element.style.backgroundColor = '#333';
element.style.padding = '16px';
```

### FloatingUIManager & UIController

All UI dialogs and popups use the centralized `FloatingUIManager`:

```typescript
// Access through UIController
game.uiController.showBuildMenu(x, y, callback);
game.uiController.showTowerUpgrade(tower);
game.uiController.showInventory();

// Or create custom dialogs
const floatingUI = game.getFloatingUIManager();
const element = floatingUI.createDialog({
  id: 'my-dialog',
  title: 'Dialog Title',
  content: createContent(),
  onClose: () => cleanup()
});
```

### Creating New UI Components

Follow this pattern for new UI:

```typescript
export class NewDialogUI {
  private game: Game;
  private element: FloatingUIElement | null = null;
  
  show(): void {
    const content = document.createElement('div');
    content.className = cn('p-4', 'space-y-4');
    
    // Use element abstractions
    const header = createHeader({
      title: 'Section Title',
      icon: IconType.INFO
    });
    
    const button = createButton({
      text: 'Confirm',
      variant: 'primary',
      onClick: () => this.handleAction()
    });
    
    content.appendChild(header);
    content.appendChild(button);
    
    // Create floating dialog
    this.element = this.game.getFloatingUIManager().createDialog({
      id: 'new-dialog',
      title: 'Dialog Title',
      content,
      onClose: () => this.destroy()
    });
  }
}
```

## Game Architecture

### Core Systems

```typescript
// Game instance manages everything
const game = new Game(canvas, mapConfig);

// Key subsystems
game.getCamera();           // Camera system
game.getGrid();            // Grid placement system  
game.getFloatingUIManager(); // UI system
game.getAudioManager();     // Audio system
game.uiController;         // High-level UI control
```

### Entity System

All game objects inherit from `Entity`:
- `Tower`, `Enemy`, `Player`, `Projectile`, `Collectible`
- Common methods: `update()`, `takeDamage()`, `distanceTo()`, `moveTo()`

### Configuration-Driven

All gameplay values live in config files:
- `TowerConfig.ts` - Tower stats
- `EnemyConfig.ts` - Enemy stats  
- `ColorTheme.ts` - Visual theme
- `UIConstants.ts` - UI dimensions
- Never hardcode values - always use configs

## Adding Features

### New Tower Type
1. Add to `TowerType` enum
2. Add config in `TowerConfig.ts`
3. Add icon in `SvgIcons.ts`
4. Write unit tests

### New UI Dialog
1. Create class extending pattern above
2. Add to `UIController`
3. Use element abstractions - NO custom CSS

## Recent Changes (Keep Updated)

1. **UI Refactor (Dec 2024)**: Migrated to utility-first CSS with element abstractions
2. **Removed Systems**: PopupManager, DialogManager, UIManager (use FloatingUIManager)
3. **CSS Cleanup**: Removed 90% of custom CSS classes
4. **TypeScript**: Strict mode enforced, no `any` types allowed
5. **Testing**: Unit tests only, no integration tests

## Linear Integration

- **Workspace**: BS Projects
- **Projects**: TD Engine, OctoPrompt
- Use MCP commands: `mcp__linear__list_issues`, `mcp__linear__create_issue`, etc.
- Branch format: `username/td-123-feature-name`

## Performance Guidelines

- Remove destroyed entities from arrays
- Use grid for spatial queries
- Render only visible entities
- Batch DOM updates
- Use `requestAnimationFrame` for animations