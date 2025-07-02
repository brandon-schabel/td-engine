# Store Migration Guide

This document outlines the migration of UI components to use centralized Zustand stores instead of direct game instance dependencies.

## Overview

The UI has been updated to use two main stores:
- **gameStore**: Manages game state, resources, player stats, wave info, and statistics
- **entityStore**: Manages entities (towers, enemies, projectiles, player) and selection state

## Key Changes

### 1. Custom Hooks Created

#### Game Store Hooks (`src/stores/hooks/useGameStore.ts`)
- `useGameStore`: Base hook with selector
- `useCurrency`, `useLives`, `useScore`: Resource hooks
- `usePlayerStats`, `usePlayerLevel`: Player progression hooks
- `useWaveInfo`, `useIsWaveActive`: Wave state hooks
- `useGameUI`: Combined hook for UI components
- `useGameActions`, `useResourceActions`: Action hooks

#### Entity Store Hooks (exported from `src/stores/entityStore.ts`)
- `useTowers`, `useEnemies`, `useProjectiles`: Entity list hooks
- `usePlayer`: Player entity hook
- `useSelectedTower`, `useHoveredTower`: Selection hooks

#### Combined Game Hooks (`src/ui/react/hooks/useGameHooks.ts`)
- `useGameHeader`: Resources + wave info
- `useTowerPlacement`: Currency + tower building
- `useWaveManagement`: Wave control
- `usePlayerUpgrades`: Player progression
- `useGameStatistics`: Game stats

### 2. Component Updates

#### GameUI.tsx
- Uses `useGameUI`, `useIsGameOver`, `usePlayer` hooks
- Replaced `game.isPaused()` with store state
- Replaced `game.startNextWave()` with `startNextWave` action
- Still uses `game` for UI controller operations (gradual migration)

#### ControlBar.tsx
- Uses `useIsGameOver` hook
- Replaced `game.isGameOverPublic()` check

#### BuildMenu.tsx
- Uses `useCurrency` and `useStatisticActions`
- Records tower builds in statistics

#### TowerUpgrade.tsx
- Uses `useCurrency`, `useResourceActions`, `useSelectedTower`
- Adds currency when selling towers
- Syncs with entity store for selection

#### DraggablePlayerLevelDisplay.tsx
- Uses `usePlayerStats` and `usePlayer` hooks
- Calculates progress from store values
- Reduced update frequency

#### MobileControls.tsx
- Uses `usePlayer` hook
- Direct player reference from store

### 3. Connected Components

Created connected versions of ResourceDisplay that auto-subscribe to store values:

#### ConnectedResourceDisplay.tsx
- `ConnectedCurrencyDisplay`
- `ConnectedLivesDisplay`
- `ConnectedScoreDisplay`
- `ConnectedWaveDisplay`
- `ConnectedEnemiesDisplay`
- `GameHeader`: Complete game status bar
- `GameStatusBar`: Compact status display

## Migration Pattern

### Before (Direct Game Access)
```typescript
const currency = game.getCurrency();
const isPaused = game.isPaused();
game.startNextWave();
```

### After (Store Hooks)
```typescript
const currency = useCurrency();
const { isPaused, startNextWave } = useGameUI();
startNextWave();
```

## Benefits

1. **Performance**: Components only re-render when their specific data changes
2. **Testability**: Stores can be tested independently
3. **Type Safety**: Full TypeScript support with proper typing
4. **Multiplayer Ready**: Centralized state management
5. **Developer Experience**: Clear data flow and easier debugging

## Remaining Work

Some components still use the game instance for:
- UI Controller operations (dialogs, menus)
- Audio Manager access
- Tower selection syncing

These will be migrated in future updates as the corresponding systems are refactored.

## Usage Examples

### Simple Resource Display
```tsx
import { ConnectedCurrencyDisplay } from '@/ui/react/components/shared';

<ConnectedCurrencyDisplay variant="compact" />
```

### Complex Game UI
```tsx
import { useGameUI, useWaveManagement } from '@/stores/hooks/useGameStore';

const MyComponent = () => {
  const { isPaused, pauseGame, resumeGame } = useGameUI();
  const { canStartWave, startNextWave } = useWaveManagement();
  
  return (
    <div>
      <button onClick={isPaused ? resumeGame : pauseGame}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button onClick={startNextWave} disabled={!canStartWave}>
        Start Wave
      </button>
    </div>
  );
};
```