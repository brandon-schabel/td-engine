# TD Engine Popup System Documentation

## Overview

The TD Engine popup system provides a flexible, reusable framework for creating UI elements that can follow game entities or display notifications. The system automatically handles world-to-screen coordinate conversion, camera movement, zoom levels, and screen boundary detection.

## Core Components

### 1. EntityPopup (Base Class)
The foundation for all entity-following popups.

**Features:**
- Automatic world-to-screen position tracking
- Screen boundary checking and repositioning
- Visibility management based on entity state
- Smooth animations and transitions
- Configurable anchoring (top, bottom, left, right, center)
- Auto-hide when entity is destroyed or off-screen

**Usage:**
```typescript
class CustomPopup extends EntityPopup {
  protected buildContent(): void {
    // Build your popup content here
  }
}
```

### 2. InteractiveEntityPopup
Extends EntityPopup to add user interaction capabilities.

**Features:**
- Enables pointer events for clicking
- Click-outside-to-close functionality
- Escape key to close
- Modal overlay option
- Focus management and keyboard navigation
- Event handling system

**Usage:**
```typescript
const popup = new InteractiveEntityPopup(entity, camera, {
  closeOnClickOutside: true,
  closeOnEscape: true,
  modal: false,
  onClose: () => console.log('Popup closed')
});
```

### 3. TowerUpgradePopup
Interactive popup for tower upgrades and management.

**Features:**
- Displays current tower stats
- Shows upgrade preview with improvements
- Cost validation and affordability checking
- Upgrade and sell buttons
- Integrates with game economy
- Visual feedback for actions

**Integration:**
```typescript
// In Game.ts - automatically shown when tower is clicked
this.currentTowerUpgradePopup = TowerUpgradePopup.create(
  tower,
  this.camera,
  this,
  {
    onUpgrade: (tower) => { /* handle upgrade */ },
    onSell: (tower) => { /* handle sell */ }
  }
);
```

### 4. DamageNumberPopup
Animated floating damage numbers.

**Features:**
- Float-up animation with easing
- Color coding by damage type
- Size scaling based on damage amount
- Critical hit effects
- Auto-fade after animation

**Usage:**
```typescript
const popup = popupManager.createDamageNumber(
  enemy,
  50,
  DamageType.CRITICAL
);
```

### 5. EntityInfoPopup
Flexible information panels for entities.

**Features:**
- Customizable content sections
- Icon support
- Dynamic content updates
- Optional health bar
- HTML-based styling

**Usage:**
```typescript
const infoPopup = new EntityInfoPopup(entity, camera, {
  title: 'Enemy Stats',
  sections: [
    { label: 'Health', value: entity.health, icon: IconType.HEALTH },
    { label: 'Speed', value: entity.speed, icon: IconType.SPEED }
  ],
  showHealthBar: true,
  updateInterval: 100
});
```

### 6. HealthBarPopup
Floating health bars above entities.

**Features:**
- Smooth health transitions
- Color-coded states (green/yellow/red)
- Shield and armor display
- Damage flash effects
- Hide-when-full option

### 7. NotificationPopup
Standalone notification system for game events.

**Features:**
- Multiple types (info, success, warning, error, reward)
- Auto-dismiss with configurable duration
- Stack multiple notifications
- Position options (top, bottom, corners)
- Click handlers
- Static factory methods

**Usage:**
```typescript
// Simple notifications
NotificationPopup.success('Tower upgraded!');
NotificationPopup.warning('Enemies approaching!');
NotificationPopup.error('Insufficient funds!');
NotificationPopup.reward('Gold earned', 100);

// Custom options
NotificationPopup.info('Game saved', {
  duration: 5000,
  position: 'top-right',
  onClick: () => console.log('Clicked!')
});
```

## PopupManager

Centralized management system for all entity popups.

**Features:**
- Tracks all active popups
- Updates positions each frame
- Cleanup and lifecycle management
- Z-order management
- Performance optimization
- Popup limit enforcement

**Usage:**
```typescript
// Get popup manager from game
const popupManager = game.getPopupManager();

// Create various popups
popupManager.createDamageNumber(enemy, 50);
popupManager.createHealthBar(tower);
popupManager.createEntityInfo(player, { title: 'Player Stats' });

// Custom popup
const customPopup = new MyCustomPopup(entity, camera);
popupManager.addPopup(customPopup);
```

## Integration Examples

### 1. Tower Selection
```typescript
// In Game.ts
selectTower(tower: Tower): void {
  // Close previous popup
  if (this.currentTowerUpgradePopup) {
    this.currentTowerUpgradePopup.destroy();
  }
  
  // Create new popup
  this.currentTowerUpgradePopup = TowerUpgradePopup.create(
    tower,
    this.camera,
    this,
    {
      onClose: () => {
        this.currentTowerUpgradePopup = null;
        this.deselectTower();
      },
      onUpgrade: (tower) => {
        this.audioHandler.playUpgrade();
      }
    }
  );
  
  // Add to popup manager
  this.popupManager.addPopup(this.currentTowerUpgradePopup);
}
```

### 2. Damage Events
```typescript
// In entity damage callback
enemy.onDamage = (event) => {
  this.popupManager.createDamageNumber(
    event.entity,
    event.actualDamage,
    event.isCritical ? DamageType.CRITICAL : DamageType.NORMAL
  );
};
```

### 3. Game Events
```typescript
// Wave complete
NotificationPopup.success('Wave completed!', {
  duration: 3000,
  position: 'top'
});

// Achievement unlocked
NotificationPopup.reward('Achievement Unlocked', 50, {
  icon: IconType.STAR,
  onClick: () => showAchievements()
});
```

## Styling and Configuration

### Colors
All popup colors use the centralized `COLOR_THEME` configuration:
```typescript
import { COLOR_THEME } from '@/config/ColorTheme';
```

### Z-Index Layers
Z-index values are managed in `UI_CONSTANTS`:
```typescript
UI_CONSTANTS.zIndex.floatingUI  // Entity popups
UI_CONSTANTS.zIndex.notification // Notifications
```

### Animation Durations
Animation timings use `ANIMATION_CONFIG`:
```typescript
ANIMATION_CONFIG.durations.uiTransition
ANIMATION_CONFIG.combat.criticalHit
```

## Best Practices

1. **Cleanup**: Always destroy popups when done to prevent memory leaks
2. **Performance**: Use PopupManager's limit enforcement for many popups
3. **Accessibility**: Include keyboard navigation for interactive popups
4. **Responsiveness**: Test popup positioning on different screen sizes
5. **Consistency**: Use the provided factory methods and styling patterns

## Creating Custom Popups

### Basic Entity Popup
```typescript
export class PowerUpPopup extends EntityPopup {
  private powerUp: PowerUp;
  
  constructor(powerUp: PowerUp, camera: Camera) {
    super(powerUp, camera, {
      anchor: 'top',
      offset: { x: 0, y: -20 },
      autoHide: true,
      hideDelay: 2000
    });
    
    this.powerUp = powerUp;
  }
  
  protected buildContent(): void {
    this.element.innerHTML = `
      <div class="power-up-popup">
        <img src="${this.powerUp.icon}" />
        <span>${this.powerUp.name}</span>
      </div>
    `;
    
    // Apply styles
    this.element.style.cssText += `
      background: ${COLOR_THEME.ui.background.success};
      padding: 8px 12px;
      border-radius: 4px;
    `;
  }
}
```

### Interactive Popup
```typescript
export class ItemPickupPopup extends InteractiveEntityPopup {
  private item: Item;
  
  constructor(item: Item, camera: Camera, game: Game) {
    super(item, camera, {
      closeOnClickOutside: true,
      modal: false
    });
    
    this.item = item;
  }
  
  protected buildContent(): void {
    // Create pickup button
    const pickupBtn = this.createButton('Pick Up', () => {
      this.game.pickupItem(this.item);
      this.handleClose();
    }, { primary: true });
    
    this.element.appendChild(pickupBtn);
  }
}
```

## Performance Considerations

1. **Popup Limits**: PopupManager enforces a maximum popup count
2. **Pooling**: DamageNumberPopup supports object pooling
3. **Update Frequency**: Use appropriate updateInterval for dynamic content
4. **Visibility Culling**: Popups auto-hide when entities are off-screen
5. **DOM Operations**: Batch DOM updates when possible

## Future Enhancements

1. **Popup Animations**: More animation presets
2. **Theming**: Easy theme switching for all popups
3. **Mobile Optimization**: Touch-friendly interactions
4. **Popup Queuing**: Queue system for sequential popups
5. **Rich Content**: Markdown/HTML content support
6. **Sound Integration**: Popup-specific sound effects