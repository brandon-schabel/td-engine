# Floating UI Elements Refactoring

## Overview

This document describes the refactoring of floating UI elements in the td-engine game from inline implementations to reusable components.

## Refactored Components

### 1. FloatingUIElement (Base Class)
- **Location**: `src/ui/components/game/FloatingUIElement.ts`
- **Purpose**: Base class for all floating UI elements with common styling and behavior
- **Features**:
  - Configurable positioning (top/bottom/left/right)
  - Customizable border color and styling
  - Built-in icon support
  - Automatic update interval management
  - Cleanup on destroy

### 2. IconButton
- **Location**: `src/ui/components/game/IconButton.ts`
- **Purpose**: Reusable button component with icon and hover effects
- **Features**:
  - Consistent hover animations
  - Customizable colors and styles
  - Easy icon integration
  - Enable/disable functionality

### 3. Display Components

#### CurrencyDisplay
- Shows player currency with coin icon
- Updates every 100ms
- Gold border color

#### WaveDisplay
- Shows current wave and enemy count
- Updates every 100ms
- Green border color

#### HealthDisplay
- Shows player health with dynamic color
- Changes color based on health percentage:
  - Green: > 50%
  - Orange: 26-50%
  - Red: ≤ 25%

#### FloatingCameraControls
- Camera zoom controls with buttons
- Shows current zoom percentage
- Cyan border color

## Benefits of Refactoring

1. **Code Reduction**: ~60% less code in SimpleGameUI.ts
2. **Consistency**: All floating UI elements share the same base styling
3. **Maintainability**: Changes to common behavior only need to be made in one place
4. **Extensibility**: Easy to create new floating UI elements by extending FloatingUIElement
5. **Type Safety**: TypeScript interfaces ensure proper usage

## Common Patterns Identified

### Styling
- Background: `rgba(0, 0, 0, 0.8)`
- Border: `2px solid [color]`
- Border radius: `8px`
- Padding: `8px 12px`
- Font: `bold, clamp(14px, 3vw, 18px)`
- Z-index: `100`
- Layout: `flex` with `gap: 8px`

### Update Mechanism
- All elements use `setInterval` with 100ms intervals
- Consistent 10Hz update rate

### Icon Usage
- Icons are 20px for displays, 18px for buttons
- Created using `createSvgIcon` utility
- Positioned at the beginning with 8px gap

## Usage Example

```typescript
// Create a custom floating UI element
class CustomDisplay extends FloatingUIElement {
  constructor() {
    super({
      id: 'custom-display',
      position: { top: 100, left: 10 },
      borderColor: '#FF00FF',
      icon: IconType.STAR,
      onUpdate: () => this.updateContent()
    });
  }

  private updateContent(): void {
    this.setContent('Custom content here');
  }
}

// Use it
const customDisplay = new CustomDisplay();
customDisplay.mount(gameContainer);
```

## Migration Guide

To migrate existing inline floating UI elements:

1. Identify the element's position, color, and icon
2. Create a new class extending FloatingUIElement
3. Implement the update logic in the onUpdate callback
4. Replace the inline implementation with the new component

## Future Improvements

1. Add animation support (fade in/out, slide)
2. Add more positioning options (center, percentage-based)
3. Create a FloatingUIManager to handle all floating elements
4. Add theme support for consistent color schemes
5. Consider using CSS variables for easier theming