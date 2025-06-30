# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

- **TDD**: Write tests FIRST, ensure they pass after implementation
- **No `any`**: Use strong typing, Zod schemas for unknown shapes  
- **Functional style**: Pure functions, single responsibility, descriptive names
- **UNIT TESTING ONLY**: No integration tests. Break down code until it's unit testable
- **File Safety**: NEVER delete files outside `/Users/brandon/Programming/td-engine`
**Wave TD OctoPrompt Project Details:**

- **Project ID**: `1750564556414`

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

### React Component System (Updated Jan 2025)

The UI uses pure React components with Tailwind v4 for styling. **Always use React components instead of DOM manipulation**:

```typescript
// ✅ CORRECT - Use React components
import { Button, Card, Header } from '@/ui/react/components';
import { cn } from '@/lib/utils';

<Button 
  variant="primary"
  icon={IconType.SAVE}
  onClick={handleSave}
>
  Save
</Button>

// ❌ WRONG - Don't use DOM helpers or manual creation
const button = createButton({ text: 'Save' });
element.appendChild(button);
```

**Available Components:**

- **Buttons**: `Button`, `IconButton`, `CloseButton`
- **Cards**: `Card`, `StructuredCard`, `CardHeader`, `CardBody`, `CardFooter`  
- **Headers**: `Header`, `DialogHeader`, `CompactHeader`
- **Forms**: `Input`, `Select`, `Toggle`, `Switch`, `Checkbox`, `Slider`
- **Display**: `StatDisplay`, `ResourceDisplay`, `IconContainer`, `ProgressBar`
- **Navigation**: `TabBar`, `Tooltip`

### Styling Rules (Tailwind v4)

1. **Use Tailwind utility classes** for all styling
2. **NO inline styles** - Never use `element.style` or `style.cssText`
3. **Compose utilities** - Use `cn()` helper to merge classes
4. **Design tokens** - Use Tailwind theme values (`bg-ui-bg-primary`, etc.)

```typescript
// ✅ CORRECT - Tailwind utilities
className={cn('bg-ui-bg-primary', 'p-4', 'rounded-lg', 'shadow-md')}

// ❌ WRONG - Inline styles or old classes
element.style.backgroundColor = '#333';
className="bg-surface-primary" // old utility system
```

See `docs/REACT_MIGRATION.md` for migration guide from DOM helpers.

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

Follow React patterns for new UI:

```typescript
// Create a React component
export const NewDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose}>
      <Panel title="Dialog Title" icon={IconType.INFO} onClose={onClose}>
        <div className={cn('p-4', 'space-y-4')}>
          <Header title="Section Title" icon={IconType.INFO} />
          
          <Button 
            variant="primary"
            onClick={() => handleAction()}
          >
            Confirm
          </Button>
        </div>
      </Panel>
    </Modal>
  );
};

// Register with UIController
game.uiController.showDialog('new-dialog', <NewDialog />);
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

1. Create React component using shared components
2. Add to `UIController` or use existing panels
3. Use Tailwind utilities - NO custom CSS
4. Follow patterns in `src/ui/react/components`

## Recent Changes (Keep Updated)

1. **UI Refactor (Dec 2024)**: Migrated to utility-first CSS with element abstractions
2. **React Migration (Jan 2025)**: Converted DOM helpers to pure React components
   - Set up Tailwind v4
   - Created complete React component library
   - Migrated all components from DOM manipulation to React
   - See `docs/REACT_MIGRATION.md` for details
3. **Scene System Migration (Jan 2025)**: Converted scene system to React
   - Created React-based scene infrastructure (SceneContext, SceneRouter)
   - Migrated all scenes to React components
   - Added Framer Motion for scene transitions
   - See `docs/REACT_SCENES.md` for details
4. **Removed Systems**: PopupManager, DialogManager, UIManager (use FloatingUIManager)
5. **CSS Cleanup**: Removed 90% of custom CSS classes, now using Tailwind v4
6. **TypeScript**: Strict mode enforced, no `any` types allowed
7. **Testing**: Unit tests only, no integration tests
8. **Touch Gestures (Jan 2025)**: Added comprehensive touch gesture system
   - Swipe to pan camera
   - Pinch to zoom
   - Double tap to center on player
   - Gestures disabled during tower placement
   - See `docs/TOUCH_GESTURES.md` for details

## Linear Integration

- **Workspace**: BS Projects
- **Projects**: Wave TD, OctoPrompt
- Use MCP commands: `mcp__linear__list_issues`, `mcp__linear__create_issue`, etc.
- Branch format: `username/td-123-feature-name`

## Performance Guidelines

- Remove destroyed entities from arrays
- Use grid for spatial queries
- Render only visible entities
- Batch DOM updates
- Use `requestAnimationFrame` for animations
