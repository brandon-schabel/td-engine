# Remaining Custom CSS Classes

This document lists all custom CSS classes that remain after the cleanup, with justification for why they were kept.

## UIStyles.ts - Remaining Classes

### Dialog System (Core Infrastructure)
- **`.ui-dialog-container`** - Fixed positioning and z-index management for dialogs
- **`.ui-dialog`** - Complex dialog structure with will-change and transitions
- **`.ui-dialog-overlay`** - Modal overlay with specific z-index layering
- **`.ui-dialog-header/content/footer`** - Structural components of dialogs
- **`.ui-dialog-build-menu`** - Specific sizing for build menu dialog

**Justification**: These provide the core dialog infrastructure that FloatingUIManager relies on.

### Form Elements (Not Yet Abstracted)
- **`.ui-input`** - Styled text input
- **`.ui-select`** - Styled select dropdown
- **`.ui-label`** - Form labels
- **`.ui-toggle`/`.ui-toggle-switch`** - Custom toggle switch
- **`.ui-slider-*`** - Complete slider component system

**Justification**: Form elements haven't been abstracted into element helpers yet.

### Loading & State Indicators
- **`.ui-loading`** - Loading state with spinner animation
- **`.ui-error`/`.ui-success`/`.ui-warning`** - Semantic state colors

**Justification**: Complex pseudo-element animations and semantic meaning.

### Animation Classes
- **`.ui-fade-in`** - Fade in animation
- **`.ui-slide-up`** - Slide up animation  
- **`.ui-scale-in`** - Scale in animation
- **`.off-screen`** - Hidden state for animations

**Justification**: Reusable animation classes used by multiple components.

### Complex Visual Effects
- **`.ui-shimmer`** - Shimmer effect with pseudo-elements
- **`.ui-gradient-text`** - Gradient text effect with -webkit-background-clip
- **`.ui-pulse`** - Pulse animation
- **`.ui-glow`** - Glow filter effect
- **`.ui-level-indicator`/`.ui-level-dot`** - Level indicators with complex styling

**Justification**: These effects use advanced CSS features that are hard to replicate with utilities.

### Game-Specific Components
- **`.ui-control-bar`** - Bottom game control bar with specific positioning
- **`.ui-placement-indicator`** - Tower placement indicator
- **`.ui-button-control`** - Circular control buttons (still used by SimpleGameUI)

**Justification**: Game-specific UI elements with unique requirements.

### Layout Helpers
- **`.ui-grid`** - Grid layout with column variants
- **`.ui-scrollable`** - Custom scrollbar styling
- **`.ui-hide-mobile`/`.ui-hide-desktop`** - Responsive visibility
- **`.ui-tooltip`** - Tooltip base styles

**Justification**: Complex or specific layout needs not covered by utilities.

## ComponentStyles.ts - Key Custom Styles

### Tower System
- **`.tower-card-*`** - Tower card animations and hover effects
- **`.tower-type-specific colors`** - Dynamic tower coloring

**Justification**: Complex animations and game-specific styling.

### Health Bars
- **`.health-bar-*`** - Health bar animations and states
- **`.floating-healthbar`** - Positioned health bars

**Justification**: Game-specific with dynamic color states.

### Inventory System
- **`.inventory-*`** - Complete inventory UI system
- **`.rarity-*`** - Item rarity colors and effects

**Justification**: Complex grid layout with drag-drop and rarity system.

### Damage Numbers
- **`.damage-number`** - Floating damage text
- **`.damage-tier-*`** - Damage value color tiers
- **`@keyframes damage-float-*`** - Damage number animations

**Justification**: Complex game feedback system with multiple animation variants.

### Upgrade System
- **`.upgrade-node`** - Upgrade tree nodes with multiple states
- **`.upgrade-tree`** - Upgrade tree layout with pseudo-element background

**Justification**: Complex visual tree structure with state management.

### Menus & Settings
- **`.settings-*`** - Settings-specific UI customizations
- **`.game-over-*`** - Game over screen styles
- **`.mobile-*`** - Mobile control styles

**Justification**: Screen-specific layouts and mobile touch controls.

## Guidelines for Future Development

1. **When to Keep Custom CSS**:
   - Multi-step animations
   - Pseudo-element heavy designs
   - Complex gradients or filters
   - Game-specific visual feedback
   - Performance-critical animations

2. **When to Use Utilities**:
   - Simple layout (flex, grid, spacing)
   - Basic colors and typography
   - Standard borders and shadows
   - Common hover/active states

3. **When to Create Element Abstractions**:
   - Reusable UI patterns
   - Components with consistent behavior
   - Elements that need TypeScript types
   - Complex components built from utilities