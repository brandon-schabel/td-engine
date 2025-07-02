# Multiplayer-Ready Architecture Refactor

## Overview

This document summarizes the comprehensive refactoring done to prepare the Wave TD game engine for multiplayer support. The refactoring centralizes all game state management and separates game logic from entity classes, creating a deterministic and synchronizable architecture.

## Key Changes

### 1. Centralized State Management

#### EntityStore (`src/stores/entityStore.ts`)
- Single source of truth for all game entities
- Record-based storage for O(1) lookups
- Memoized selectors for performance
- Reactive subscriptions for UI updates
- Features:
  - CRUD operations for all entity types
  - Batch updates for performance
  - Viewport culling
  - Selection management

#### GameStore (`src/stores/gameStore.ts`)
- Complete game state management
- Player progression and statistics
- Wave management
- Resource management
- Detailed statistics tracking by entity type

### 2. Logic Systems (`src/systems/logic/`)

Pure functions for all game logic:
- **EnemyLogic.ts**: Movement, pathfinding, targeting
- **TowerLogic.ts**: Target acquisition, shooting
- **PlayerLogic.ts**: Movement, abilities, leveling
- **ProjectileLogic.ts**: Physics, collision detection
- **CombatLogic.ts**: Damage calculations, effects

Benefits:
- Deterministic execution
- Easy testing
- Client prediction ready
- No side effects

### 3. Game Loop Orchestration

#### GameLoop (`src/systems/GameLoop.ts`)
- Orchestrates all systems
- Processes entity updates
- Handles action execution
- Manages entity lifecycle

#### InputManager (`src/input/InputManager.ts`)
- Centralized input handling
- Unified input state
- Coordinate transformations

### 4. Renderer Refactoring

- Reads directly from EntityStore
- Viewport culling optimization
- Reactive rendering capability
- No direct entity manipulation

### 5. UI Components Update

- All components connected to stores
- Custom hooks for performance
- Reactive updates
- No direct game instance dependencies

## Architecture Benefits

### Multiplayer Ready
- Centralized state makes synchronization straightforward
- Deterministic logic enables client prediction
- Clear separation of concerns
- Action-based updates for networking

### Performance
- O(1) entity lookups
- Batch state updates
- Selective UI subscriptions
- Viewport culling

### Maintainability
- Clear separation of concerns
- Pure functions for logic
- Type-safe throughout
- Easy testing

### Developer Experience
- Redux DevTools integration
- Time-travel debugging
- Clear data flow
- Comprehensive documentation

## Migration Status

### Completed
- ✅ EntityStore implementation
- ✅ GameStore expansion
- ✅ Logic systems extraction
- ✅ Renderer refactoring
- ✅ Game loop orchestration
- ✅ UI component connections
- ✅ Test suite updates

### Backward Compatibility
- Game class maintains entity arrays temporarily
- Syncs to stores before rendering
- All existing features preserved
- Save/load system continues to work

## Future Improvements

### Phase 2: Full Migration
1. Remove entity arrays from Game class
2. Move all entity creation to stores
3. Migrate save/load to use stores directly
4. Remove sync methods

### Phase 3: Networking
1. Add action serialization
2. Implement state synchronization
3. Add client prediction
4. Handle lag compensation

### Phase 4: Optimizations
1. Add entity pooling
2. Implement spatial indexing
3. Add LOD system
4. Optimize render batching

## Usage Examples

### Reading State
```typescript
// In React components
import { useTowers, useGameStore } from '@/stores';

function TowerManager() {
  const towers = useTowers();
  const currency = useGameStore(state => state.currency);
}

// Outside React
import { useEntityStore, useGameStore } from '@/stores';

const towers = useEntityStore.getState().getAllTowers();
const gameState = useGameStore.getState();
```

### Updating State
```typescript
// Entity operations
import { addTower, selectTower } from '@/stores/entityStore';

const tower = new Tower(TowerType.BASIC, position);
addTower(tower);
selectTower(tower);

// Game state
import { useGameStore } from '@/stores/gameStore';

const { spendCurrency, addScore } = useGameStore.getState();
spendCurrency(100);
addScore(50);
```

### Logic Systems
```typescript
import { updateEnemy } from '@/systems/logic/EnemyLogic';

const result = updateEnemy(enemy, deltaTime, gameContext);
// result.position - new position
// result.actions - side effects to process
```

## Testing

All tests have been updated and are passing:
- Unit tests for logic systems
- Store integration tests
- Component tests with mocked stores
- Full game integration tests

Run tests with: `bun test`

## Development Workflow

1. State changes go through stores
2. Logic is in pure functions
3. UI subscribes to state
4. Renderer reads from stores
5. Actions describe changes

This architecture provides a solid foundation for adding multiplayer capabilities while improving code quality and maintainability.