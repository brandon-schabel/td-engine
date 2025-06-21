# UI Component Pattern Guide

This guide provides patterns and best practices for creating UI components in the TD Engine codebase using the new element abstraction system.

## Core Principles

1. **Use Element Abstractions First** - Always check if an existing abstraction fits your needs
2. **Compose with Utilities** - Build complex layouts using utility classes
3. **No Inline Styles** - Never use `element.style` or `style.cssText`
4. **Design Tokens Only** - Use CSS custom properties for all values
5. **Semantic HTML** - Use proper HTML elements for accessibility

## Common UI Patterns

### Dialog with Form

```typescript
import { 
  createButton, createInput, createSelect, createHeader, 
  createCard, cn 
} from '@/ui/elements';

function createSettingsDialog() {
  const container = document.createElement('div');
  container.className = cn('p-6', 'space-y-4', 'w-96');
  
  // Header
  const header = createDialogHeader({
    title: 'Game Settings',
    icon: IconType.SETTINGS,
    onClose: () => closeDialog()
  });
  
  // Form fields
  const volumeSlider = createVolumeSlider({
    value: 0.5,
    onChange: (value) => updateVolume(value)
  });
  
  const difficultySelect = createSelect({
    options: [
      { value: 'easy', label: 'Easy' },
      { value: 'normal', label: 'Normal' },
      { value: 'hard', label: 'Hard' }
    ],
    value: 'normal',
    onChange: (value) => updateDifficulty(value)
  });
  
  // Action buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = cn('flex', 'gap-2', 'justify-end', 'mt-6');
  
  buttonContainer.appendChild(
    createButton({
      text: 'Cancel',
      variant: 'secondary',
      onClick: () => closeDialog()
    })
  );
  
  buttonContainer.appendChild(
    createButton({
      text: 'Save',
      variant: 'primary',
      onClick: () => saveSettings()
    })
  );
  
  // Assemble
  container.appendChild(header);
  container.appendChild(volumeSlider);
  container.appendChild(difficultySelect);
  container.appendChild(buttonContainer);
  
  return container;
}
```

### Grid Layout with Cards

```typescript
function createInventoryGrid(items: Item[]) {
  const grid = document.createElement('div');
  grid.className = cn(
    'grid',
    'grid-cols-4',        // 4 columns
    'gap-4',              // Gap between items
    'p-4',                // Padding
    'max-h-96',           // Max height
    'overflow-y-auto'     // Scrollable
  );
  
  items.forEach(item => {
    const card = createClickableCard({
      content: createItemContent(item),
      onClick: () => selectItem(item),
      hover: true,
      className: cn(
        'aspect-square',   // Square cards
        'relative',
        item.equipped && 'ring-2 ring-primary'  // Highlight equipped
      )
    });
    
    grid.appendChild(card);
  });
  
  return grid;
}
```

### Tabbed Interface

```typescript
function createTabbedPanel() {
  const container = document.createElement('div');
  container.className = 'space-y-4';
  
  // Tab bar
  const tabs = createTabBar({
    tabs: [
      { id: 'stats', label: 'Stats', icon: IconType.STATS },
      { id: 'inventory', label: 'Inventory', icon: IconType.INVENTORY },
      { id: 'skills', label: 'Skills', icon: IconType.SKILL }
    ],
    activeTab: 'stats',
    variant: 'pills',
    onTabChange: (tabId) => switchTab(tabId)
  });
  
  // Content area
  const content = document.createElement('div');
  content.className = cn(
    'bg-surface-secondary',
    'p-4',
    'rounded-lg',
    'min-h-[300px]'
  );
  
  container.appendChild(tabs);
  container.appendChild(content);
  
  return container;
}
```

### List with Actions

```typescript
function createTowerList(towers: Tower[]) {
  const list = document.createElement('div');
  list.className = cn('space-y-2');
  
  towers.forEach(tower => {
    const row = document.createElement('div');
    row.className = cn(
      'flex',
      'items-center',
      'justify-between',
      'p-3',
      'bg-surface-secondary',
      'rounded-md',
      'hover:bg-surface-hover',
      'transition-colors'
    );
    
    // Tower info
    const info = document.createElement('div');
    info.className = 'flex items-center gap-3';
    
    const icon = createIconContainer({
      icon: getTowerIcon(tower.type),
      size: 'md',
      background: true
    });
    
    const stats = createInlineStats([
      { label: 'Damage', value: String(tower.damage) },
      { label: 'Range', value: `${tower.range}m` }
    ]);
    
    info.appendChild(icon);
    info.appendChild(stats);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'flex gap-2';
    
    actions.appendChild(
      createIconButton(IconType.UPGRADE, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => upgradeTower(tower)
      })
    );
    
    actions.appendChild(
      createIconButton(IconType.DELETE, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => sellTower(tower)
      })
    );
    
    row.appendChild(info);
    row.appendChild(actions);
    list.appendChild(row);
  });
  
  return list;
}
```

### Status Display

```typescript
function createPlayerStatus(player: Player) {
  const container = createCard({
    padding: 'lg',
    className: 'w-80'
  });
  
  // Header with avatar
  const header = document.createElement('div');
  header.className = cn('flex', 'items-center', 'gap-4', 'mb-4');
  
  const avatar = createIconContainer({
    icon: IconType.PLAYER,
    size: 'xl',
    background: true,
    className: 'ring-2 ring-primary'
  });
  
  const title = document.createElement('div');
  const name = document.createElement('h3');
  name.className = 'text-lg font-bold text-primary';
  name.textContent = player.name;
  
  const level = document.createElement('p');
  level.className = 'text-sm text-secondary';
  level.textContent = `Level ${player.level}`;
  
  title.appendChild(name);
  title.appendChild(level);
  header.appendChild(avatar);
  header.appendChild(title);
  
  // Stats grid
  const stats = createStatGrid([
    { 
      label: 'Health', 
      value: `${player.health}/${player.maxHealth}`,
      icon: IconType.HEALTH,
      color: 'danger'
    },
    { 
      label: 'Mana', 
      value: `${player.mana}/${player.maxMana}`,
      icon: IconType.MANA,
      color: 'info'
    },
    { 
      label: 'Damage', 
      value: `+${player.damageBonus}%`,
      icon: IconType.DAMAGE,
      color: 'success'
    },
    { 
      label: 'Defense', 
      value: String(player.defense),
      icon: IconType.SHIELD,
      color: 'primary'
    }
  ]);
  
  container.appendChild(header);
  container.appendChild(stats);
  
  return container;
}
```

## Utility Class Combinations

### Common Layout Patterns

```typescript
// Centered content
'flex items-center justify-center min-h-screen'

// Sticky header
'sticky top-0 z-10 bg-surface-primary border-b border-subtle'

// Scrollable container with fade
'relative max-h-96 overflow-y-auto'
// Add pseudo-element for fade effect

// Responsive grid
'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'

// Card with hover effect
'bg-surface-secondary p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer'

// Overlay/Modal backdrop
'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'
```

### State-Based Styling

```typescript
// Conditional classes
className={cn(
  'base-classes',
  isActive && 'ring-2 ring-primary',
  isDisabled && 'opacity-50 cursor-not-allowed',
  isError && 'border-danger text-danger'
)}

// Dynamic spacing
className={cn(
  'flex',
  dense ? 'gap-1' : 'gap-4',
  vertical ? 'flex-col' : 'flex-row'
)}
```

## Creating New Element Abstractions

When you identify a reusable pattern, create a new element abstraction:

```typescript
// src/ui/elements/NewElement.ts
import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateNewElementOptions {
  // Define your options
  variant?: 'default' | 'special';
  size?: 'sm' | 'md' | 'lg';
  // ... other props
}

export function createNewElement(options: CreateNewElementOptions): HTMLElement {
  const {
    variant = 'default',
    size = 'md',
    // ... destructure options
  } = options;
  
  const element = document.createElement('div');
  
  // Build classes using cn()
  element.className = cn(
    // Base classes
    'base-class',
    
    // Variant classes
    variant === 'special' && 'special-variant-classes',
    
    // Size classes
    getSizeClasses(size),
    
    // Optional classes
    options.customClasses
  );
  
  // Add children, event handlers, etc.
  
  return element;
}

// Helper functions for complex logic
function getSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm': return ['text-sm', 'p-2'];
    case 'lg': return ['text-lg', 'p-4'];
    default: return ['text-base', 'p-3'];
  }
}
```

## Anti-Patterns to Avoid

### ❌ Don't Do This

```typescript
// Direct style manipulation
element.style.backgroundColor = '#ff0000';
element.style.padding = '10px';

// Creating style elements
const style = document.createElement('style');
style.textContent = '.my-class { color: red; }';

// Inline styles in HTML strings
element.innerHTML = '<div style="color: blue;">Text</div>';

// Custom CSS classes without design tokens
.my-custom-class {
  color: #333;
  padding: 12px;
}

// Mixing abstractions and manual DOM
const button = createButton({ text: 'Click' });
button.style.marginTop = '10px'; // NO!
```

### ✅ Do This Instead

```typescript
// Use utility classes
element.className = cn('bg-danger', 'p-3');

// Use element abstractions
const button = createButton({
  text: 'Click',
  variant: 'primary',
  customClasses: ['mt-3'] // Use utility class
});

// Compose utilities for custom needs
const customElement = document.createElement('div');
customElement.className = cn(
  'text-primary',
  'p-3',
  'bg-surface-secondary',
  'rounded-md'
);
```

## Performance Considerations

1. **Batch DOM Updates** - Create elements off-DOM and append once
2. **Use Document Fragments** - For multiple elements
3. **Debounce Updates** - For frequently changing values
4. **Virtual Scrolling** - For large lists
5. **Lazy Loading** - For complex content

Example of efficient updates:

```typescript
// Smart update pattern
private lastValue = -1;

private updateValue(newValue: number): void {
  if (newValue === this.lastValue) return;
  
  const element = this.container.querySelector('.value');
  if (element) {
    element.textContent = String(newValue);
    this.lastValue = newValue;
  }
}
```

## Testing UI Components

When testing UI components:

1. Test the behavior, not the implementation
2. Use data attributes for test selectors
3. Mock element abstractions if needed
4. Test accessibility attributes
5. Verify event handlers are called

```typescript
// Add test attributes
element.setAttribute('data-testid', 'submit-button');

// In tests
const button = container.querySelector('[data-testid="submit-button"]');
expect(button).toHaveClass('bg-primary');
```