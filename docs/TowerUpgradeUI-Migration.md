# Tower Upgrade UI Migration Guide

## Overview

The tower upgrade UI has been migrated from the old popup system (`TowerUpgradePopup`) to the new `FloatingUIManager` system (`TowerUpgradeUI`). This provides better performance, mobile responsiveness, and consistency with other floating UI elements.

## Key Changes

### 1. **New Component Location**
- Old: `src/ui/components/floating/TowerUpgradePopup.ts`
- New: `src/ui/floating/TowerUpgradeUI.ts`

### 2. **Integration in Game.ts**

#### Before:
```typescript
import { TowerUpgradePopup } from "@/ui/components/floating/TowerUpgradePopup";

private currentTowerUpgradePopup: TowerUpgradePopup | null = null;

// Creating popup
this.currentTowerUpgradePopup = TowerUpgradePopup.create(
  tower,
  this.camera,
  this,
  { /* options */ }
);

// Adding to UI manager
this.uiManager.addCustomPopup(this.currentTowerUpgradePopup);
this.currentTowerUpgradePopup.show();
```

#### After:
```typescript
import { TowerUpgradeUI } from "@/ui/floating/TowerUpgradeUI";

private currentTowerUpgradeUI: TowerUpgradeUI | null = null;

// Creating UI
this.currentTowerUpgradeUI = new TowerUpgradeUI(
  this.floatingUIManager,
  tower,
  this,
  { /* options */ }
);
// No need to manually show - it's automatically enabled
```

### 3. **Benefits of New System**

1. **Automatic Positioning**: The UI automatically follows the tower using the camera system
2. **Mobile Responsive**: Built-in mobile scaling and responsive design
3. **Better Performance**: Centralized update loop and DOM management
4. **Consistent Styling**: Uses the same system as health bars and damage numbers
5. **Simpler API**: No need to manually manage show/hide states

### 4. **Feature Parity**

All features from the old system have been preserved:
- ✅ Tower information display
- ✅ Bulk upgrade options (1, 5, 10, 25, MAX)
- ✅ Three upgrade types (Damage, Range, Fire Rate)
- ✅ Currency display
- ✅ Current stats display
- ✅ Sell button with 1-second delay protection
- ✅ Visual feedback for affordable/unaffordable upgrades
- ✅ Click outside to close
- ✅ ESC key to close
- ✅ Singleton pattern (only one upgrade UI at a time)

### 5. **API Reference**

```typescript
interface TowerUpgradeUIOptions {
  onUpgrade?: (tower: Tower) => void;
  onSell?: (tower: Tower) => void;
  onClose?: () => void;
}

// Create new upgrade UI
const upgradeUI = new TowerUpgradeUI(
  floatingUIManager,  // FloatingUIManager instance
  tower,              // Tower to upgrade
  game,               // Game instance
  options             // Optional callbacks
);

// Update the UI (refreshes all data)
upgradeUI.updateState();

// Destroy the UI
upgradeUI.destroy();

// Static methods
TowerUpgradeUI.destroyActive();  // Destroy any active UI
TowerUpgradeUI.getActive();      // Get current active UI
```

### 6. **Styling and Customization**

The new UI uses the same color theme and styling system:
- Background uses `COLOR_THEME.ui.background.secondary`
- Borders use `COLOR_THEME.ui.border.default`
- Tower colors match the tower type
- All icons use the SVG icon system

### 7. **Mobile Considerations**

The FloatingUIManager automatically handles:
- Touch events for mobile devices
- Responsive scaling based on screen size
- Proper z-index management
- Viewport constraints

## Migration Checklist

- [x] Create new `TowerUpgradeUI` component
- [x] Update `Game.ts` imports
- [x] Replace `currentTowerUpgradePopup` with `currentTowerUpgradeUI`
- [x] Update `selectTower()` method
- [x] Update `deselectTower()` method
- [x] Remove UIManager integration (no longer needed)
- [x] Export from `src/ui/floating/index.ts`
- [x] Remove old popup components (completed)
- [x] Update all references in the codebase
- [x] Create `PlayerUpgradeUI` using FloatingUIManager
- [x] Update `SimpleGameUI` to use new PlayerUpgradeUI
- [x] Remove dependencies on old dialog system

## Completed Changes

### Files Removed:
- `src/ui/components/floating/TowerUpgradePopup.ts`
- `src/ui/components/dialogs/UpgradeDialog.ts`
- `src/ui/components/dialogs/EnhancedUpgradeDialog.ts`
- `src/ui/components/dialogs/UpgradeDialogAdapter.ts`

### Files Updated:
- `src/ui/DialogShowFix.ts` - Removed UpgradeDialogAdapter dependency
- `src/ui/components/dialogs/TowerInfoDialogAdapter.ts` - Uses Game.selectTower() instead
- `src/ui/components/dialogs/index.ts` - Removed old exports
- `src/ui/SimpleGameUI.ts` - Uses new PlayerUpgradeUI
- `src/ui/floating/index.ts` - Added PlayerUpgradeUI export

### New Files Created:
- `src/ui/floating/PlayerUpgradeUI.ts` - Player upgrade dialog using FloatingUIManager

## Next Steps

1. Test thoroughly on both desktop and mobile
2. Consider adding animations using the FloatingUIManager's built-in support
3. Monitor for any remaining references that might have been missed
4. Consider migrating other dialogs to the floating UI system