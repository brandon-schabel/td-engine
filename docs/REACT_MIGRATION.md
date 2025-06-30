# React Component Migration Guide

## Overview

This guide documents the migration from DOM manipulation helpers to pure React components in the Wave TD codebase. The migration improves developer experience, type safety, and follows React best practices.

## Migration Summary

### Phase 1: Infrastructure Setup ✅

- Configured Tailwind v4
- Created comprehensive theme mapping all design tokens
- Set up cn() utility for className merging (clsx + tailwind-merge)

### Phase 2: Component Library Creation ✅

Created pure React components to replace DOM helpers:

| DOM Helper | React Component | Key Features |
|------------|----------------|--------------|
| `createButton` | `Button` | All variants, sizes, loading states, icons |
| `createCard` | `Card`, `StructuredCard` | Composable with CardHeader/Body/Footer |
| `createInput` | `Input`, `SearchInput`, `PasswordInput` | Error states, icons, specialized variants |
| `createSelect` | `Select`, `GroupedSelect` | Grouped options support |
| `createToggle` | `Toggle`, `Switch`, `Checkbox` | Multiple variants |
| `createSlider` | `Slider` | Value display, custom formatting |
| `createResourceDisplay` | `ResourceDisplay` | Animation support for game resources |
| `createHeader` | `Header`, `DialogHeader` | Icons, subtitles, close buttons |
| `createStatDisplay` | `StatDisplay`, `StatGrid` | Grid/list/inline layouts |
| `createIconContainer` | `IconContainer` | Badges, interactive states |
| `createTabBar` | `TabBar` | Multiple variants, controlled/uncontrolled |
| `createProgressBar` | `ProgressBar`, `TimerProgressBar` | Timer support, segments |
| `createTooltip` | `Tooltip` | Portal rendering, positioning |

### Phase 3: Component Refactoring ✅

Refactored existing components to use new React components:

- Settings.tsx - Uses Slider and Toggle components
- GameOver.tsx - Uses Button component and proper React patterns
- BuildMenu.tsx - Uses ResourceDisplay and Icon components
- TowerUpgrade.tsx - Uses Button, IconContainer, and InlineStats
- Inventory.tsx - Uses Button and TabBar components
- Panel.tsx - Uses Header component

### Phase 4: Tailwind v4 Migration ✅

Updated all className usage from old utility system to Tailwind v4:

- Migrated color classes (bg-surface-*→ bg-ui-bg-*)
- Updated text colors (text-primary → text-ui-text-primary)
- Fixed border colors to use new naming
- Preserved Tailwind-native classes (shadow-*, rounded-*, flex, etc.)

## Key Patterns

### 1. Component Imports

```typescript
// ❌ Old pattern
import { createButton, createCard } from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';

// ✅ New pattern
import { Button, Card } from './shared';
import { cn } from '@/lib/utils';
```

### 2. DOM Manipulation → React Components

```typescript
// ❌ Old pattern
const buttonRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (buttonRef.current) {
    buttonRef.current.innerHTML = '';
    const button = createButton({
      text: 'Click me',
      onClick: handleClick
    });
    buttonRef.current.appendChild(button);
  }
}, []);

// ✅ New pattern
<Button onClick={handleClick}>
  Click me
</Button>
```

### 3. Tailwind Class Names

```typescript
// ❌ Old classes
className={cn('bg-surface-primary', 'text-primary', 'border-border-primary')}

// ✅ New Tailwind v4 classes
className={cn('bg-ui-bg-primary', 'text-ui-text-primary', 'border-ui-border-DEFAULT')}
```

## Design System Mapping

### Colors

- Background: `bg-ui-bg-{primary|secondary|tertiary|hover|muted}`
- Text: `text-ui-text-{primary|secondary|muted|disabled}`
- Borders: `border-ui-border-{DEFAULT|subtle|strong}`
- Buttons: `bg-button-{primary|secondary|danger}` with hover states
- Status: `{text|bg|border}-{success|danger|warning|info}-DEFAULT`

### Component Composition

All components support:

- ForwardRef for proper ref handling
- TypeScript generics where applicable
- Controlled and uncontrolled modes
- Accessibility attributes
- Tailwind utility composition with cn()

## Benefits

1. **Type Safety**: Full TypeScript support with proper types
2. **Developer Experience**: IntelliSense, prop validation, easier debugging
3. **Performance**: React's reconciliation vs manual DOM updates
4. **Maintainability**: Standard React patterns, easier to understand
5. **Flexibility**: Composable components, easier to extend
6. **Testing**: Easier to write unit tests for React components

## Next Steps

1. Continue migrating any remaining components using DOM helpers
2. Remove unused DOM helper functions from `/src/ui/elements`
3. Set up component documentation/Storybook
4. Add comprehensive unit tests for all components
5. Consider extracting component library to separate package

## Migration Checklist

- [x] Set up Tailwind v4
- [x] Create React component library
- [x] Refactor existing components
- [x] Update all className usage
- [x] Document new patterns
- [ ] Remove legacy DOM helpers
- [ ] Add component tests
- [ ] Set up Storybook (optional)
