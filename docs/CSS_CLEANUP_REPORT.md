# CSS Cleanup Report

## Summary

This document details the CSS cleanup performed on UIStyles.ts and ComponentStyles.ts to remove redundant styles that have been replaced by element abstractions and utility classes.

## UIStyles.ts Cleanup

### Removed Classes

1. **Button Styles** (replaced by `createButton()` element abstraction)
   - `.ui-button` and all variants (`.secondary`, `.danger`, `.outline`, `.small`, `.large`)
   - `.ui-button.xs`, `.ui-button.sm`, `.ui-button.lg`, `.ui-button.xl`
   - `.ui-button.success`, `.ui-button.ghost`
   - `.ui-button-icon-only`
   - `.ui-button-close`

2. **Card Styles** (replaced by `createCard()` and utility classes)
   - `.ui-card` base styles
   - `.ui-card.interactive`
   - `.ui-card.hover-lift`, `.ui-card.hover-glow`

3. **Utility Classes** (replaced by UtilityStyles.ts)
   - `.ui-flex-center`, `.ui-flex-between`
   - `.ui-text-secondary`, `.ui-text-muted`, `.ui-text-success`, `.ui-text-warning`, `.ui-text-danger`
   - `.ui-title-xl`, `.ui-title-lg`, `.ui-title-md`, `.ui-title-sm`
   - `.ui-mt-*`, `.ui-mb-*`, `.ui-p-*` spacing utilities
   - `.ui-disabled`, `.ui-selected`, `.ui-active`
   - `.ui-icon-primary`, `.ui-icon-success`, `.ui-icon-warning`, `.ui-icon-danger`
   - `.ui-backdrop-blur`

4. **Component Patterns** (replaced by element abstractions)
   - `.ui-stat-row`, `.ui-stat-icon`, `.ui-stat-label`, `.ui-stat-value` (replaced by `createStatDisplay()`)
   - `.ui-resource-item`, `.ui-resource-icon`, `.ui-resource-value` (replaced by `createResourceDisplay()`)
   - `.ui-header`, `.ui-header-title` (replaced by `createHeader()`)
   - `.ui-icon-container` and size variants (replaced by `createIconContainer()`)
   - `.ui-badge` and variants (can use utilities)
   - `.ui-cost` and `.ui-cost.affordable` (can use utilities)
   - `.ui-close-button` (replaced by `createCloseButton()`)
   - `.ui-dialog-close` (replaced by dialog system)

5. **Layout Utilities** (replaced by utility classes)
   - `.ui-section`, `.ui-divider`, `.ui-divider.gradient`

### Retained Classes in UIStyles.ts

1. **Core Dialog System** (complex structural styles)
   - `.ui-dialog-container`
   - `.ui-dialog`
   - `.ui-dialog-overlay`
   - `.ui-dialog-header`
   - `.ui-dialog-title`
   - `.ui-dialog-content`
   - `.ui-dialog-footer`
   - `.ui-dialog-build-menu`

2. **Form Elements** (not yet abstracted)
   - `.ui-input`
   - `.ui-select`
   - `.ui-label`
   - `.ui-toggle`, `.ui-toggle-switch`
   - `.ui-slider-*` components

3. **Complex Effects & Animations**
   - `.ui-loading` and spinner animation
   - `.ui-fade-in`, `.ui-slide-up`, `.ui-scale-in` animations
   - `.ui-shimmer`, `.ui-gradient-text`, `.ui-pulse`, `.ui-glow` effects
   - `.ui-level-indicator`, `.ui-level-dot` (complex pseudo-element styling)

4. **Game-Specific Layouts**
   - `.ui-control-bar` (specific game layout)
   - `.ui-placement-indicator` (game feature)
   - `.ui-button-control` (still used by SimpleGameUI)

5. **Utilities**
   - `.ui-tooltip` (if not using Tooltip abstraction everywhere)
   - `.ui-grid` and column variants
   - `.ui-scrollable` and scrollbar styling
   - `.ui-error`, `.ui-success`, `.ui-warning` state classes
   - `.ui-hide-mobile`, `.ui-hide-desktop` responsive utilities
   - `.off-screen` animation state

## ComponentStyles.ts Cleanup

### Removed/Simplified

1. **Removed "Extends" Comments** - Cleaned up all comments that referenced extended base classes
2. **Removed Empty Style Blocks** - Removed style blocks that only extended other classes
3. **Simplified Overrides** - Kept only the actual style overrides, not the base class references

### Retained in ComponentStyles.ts

All styles in ComponentStyles.ts were retained because they contain:
- Complex gradients and multi-step animations
- Game-specific visual effects
- Pseudo-element styling
- Component-specific overrides
- Mobile-specific adjustments

## Still Using Old Classes

These components still reference old CSS classes and need refactoring:

1. **SimpleGameUI.ts**
   - Uses `ui-button-control` for game control buttons

2. **BuildMenuUI.ts**
   - Uses `ui-card` for the main content container

3. **PlayerUpgradeUI.ts**
   - Uses `ui-cost` for upgrade cost display

## Migration Guide

### For Remaining Old Classes

1. **Replace `ui-card` usage**:
   ```typescript
   // OLD
   element.className = cn('ui-card');
   
   // NEW
   import { createCard } from '@/ui/elements';
   const card = createCard({ className: 'custom-class' });
   ```

2. **Replace `ui-cost` usage**:
   ```typescript
   // OLD
   element.className = cn('ui-cost');
   
   // NEW
   element.className = cn(
     'inline-flex items-center gap-1',
     'px-2 py-1',
     'bg-warning/10 border border-warning/30',
     'rounded-sm text-sm font-semibold text-warning'
   );
   ```

3. **Replace `ui-button-control`**:
   ```typescript
   // OLD
   customClasses: ['ui-button-control']
   
   // NEW
   // Define specific control button styles in the component
   // or create a new button variant
   ```

## Benefits of Cleanup

1. **Reduced CSS Bundle Size**: Removed ~400 lines of redundant CSS
2. **Single Source of Truth**: Styles now come from element abstractions and utilities
3. **Better Maintainability**: No duplicate style definitions
4. **Consistent API**: All UI creation follows the same pattern
5. **Type Safety**: Element abstractions provide TypeScript interfaces

## Next Steps

1. Refactor remaining components to use element abstractions
2. Remove the last few old class references
3. Consider creating more element abstractions for form elements
4. Audit ComponentStyles.ts for more cleanup opportunities
5. Create a style guide documenting the utility-first approach