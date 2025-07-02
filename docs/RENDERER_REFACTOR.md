# Renderer Refactoring: Store-Based Architecture

## Overview

The Renderer has been refactored to read directly from the centralized entity store instead of receiving entity arrays as parameters. This makes the renderer a "dumb" component that only reads state and draws it, with no knowledge of game logic.

## Key Changes

### 1. **Renderer.ts Updates**

#### Imports
- Added `useEntityStore` and `Rectangle` type imports
- Added `StoreApi` from zustand for type safety

#### Class Properties
- Added `unsubscribe` for subscription cleanup
- Added `entityStoreApi` to store reference to the entity store

#### Constructor
- Stores reference to entity store API: `this.entityStoreApi = useEntityStore`

#### renderEntities Method
**Before:**
```typescript
renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], destructionEffects: DestructionEffect[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player, selectedTower?: Tower | null): void {
  towers.forEach(tower => this.renderTower(tower, tower === selectedTower));
  enemies.forEach(enemy => this.renderEnemy(enemy));
  // ... etc
}
```

**After:**
```typescript
renderEntities(aimerLine?: { start: Vector2; end: Vector2 } | null): void {
  // Get viewport bounds for culling
  const viewport = this.getViewportRectangle();
  
  // Get visible entities from store using viewport culling
  const { getVisibleEntities, selectedTower } = this.entityStoreApi.getState();
  const visible = getVisibleEntities(viewport);
  
  // Render only visible entities
  visible.towers.forEach(tower => this.renderTower(tower, tower === selectedTower));
  visible.enemies.forEach(enemy => this.renderEnemy(enemy));
  // ... etc
}
```

#### renderScene Method
**Before:**
```typescript
renderScene(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], collectibles: Collectible[], destructionEffects: DestructionEffect[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player, selectedTower?: Tower | null): void
```

**After:**
```typescript
renderScene(aimerLine?: { start: Vector2; end: Vector2 } | null): void
```

#### New Methods
- `subscribeToStore(callback)`: Subscribe to entity store changes for reactive rendering
- `destroy()`: Clean up subscriptions when renderer is destroyed

### 2. **Game.ts Updates**

#### Imports
- Added `import { useEntityStore } from "@/stores/entityStore"`

#### New Method: syncEntitiesToStore
```typescript
private syncEntitiesToStore(): void {
  const entityStore = useEntityStore.getState();
  
  // Sync all entity arrays to store
  entityStore.setTowers(this.towers);
  entityStore.setEnemies(this.enemies);
  entityStore.setProjectiles(this.projectiles);
  entityStore.setCollectibles(this.collectibles);
  entityStore.setDestructionEffects(this.destructionEffects);
  entityStore.setPlayer(this.player);
  entityStore.selectTower(this.selectedTower);
  entityStore.hoverTower(this.hoverTower);
}
```

#### render Method
**Before:**
```typescript
this.renderer.renderScene(
  this.towers,
  this.enemies,
  this.projectiles,
  this.collectibles,
  this.destructionEffects,
  this.getPlayerAimerLine(),
  this.player,
  this.selectedTower
);
```

**After:**
```typescript
// Sync entities to store before rendering
this.syncEntitiesToStore();

// Render main scene - renderer now pulls from store
this.renderer.renderScene(this.getPlayerAimerLine());
```

#### stop Method
Added cleanup:
```typescript
// Clean up renderer subscriptions
if (this.renderer) {
  this.renderer.destroy();
}

// Clear entity store
useEntityStore.getState().clearAllEntities();
```

## Benefits

1. **Performance**: Viewport culling is now handled efficiently in the store
2. **Decoupling**: Renderer no longer needs to know about game logic
3. **Reactive**: Renderer can subscribe to store changes for automatic updates
4. **Testability**: Easier to test renderer in isolation
5. **Maintainability**: Single source of truth for entity state

## Migration Notes

- Methods like `renderTowerRange` and `renderTowerGhost` remain unchanged as they work with individual entities
- The renderer still maintains its own state for rendering settings and environmental effects
- Entity arrays in Game class are still the primary data source; they're synced to the store before each render

## Future Improvements

1. Move entity management entirely to the store (remove arrays from Game class)
2. Implement shallow equality checks in store subscription for better performance
3. Add memoization to prevent unnecessary re-renders
4. Consider moving camera state to a centralized store as well