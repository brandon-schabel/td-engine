# EntityRenderer Extraction

## Overview

The EntityRenderer class has been extracted from the main Renderer class to improve separation of concerns and code organization. This refactoring isolates all entity-specific rendering logic into a dedicated class.

## Changes Made

### New File: `src/systems/renderers/EntityRenderer.ts`

Created a new EntityRenderer class that handles rendering of all game entities:
- **Towers** - including upgrade dots and selection rings
- **Enemies** - with health bars and target lines
- **Projectiles** - with type-specific visual styles
- **Player** - with level indicators and movement trails
- **Collectibles** - generic collectible rendering
- **Health Pickups** - with rotation and glow effects

### Key Features

1. **Level of Detail (LOD) System**
   - `calculateLOD()` method determines rendering quality based on zoom level
   - Three LOD levels: FULL, MEDIUM, LOW, and CULLED
   - Optimizes performance for entities far from camera

2. **Texture & Primitive Rendering**
   - Supports both texture-based and primitive fallback rendering
   - Each entity type has custom primitive rendering when textures unavailable

3. **Health Bar Rendering**
   - Universal health bar system for all entities with health
   - Color-coded based on entity type and health percentage

4. **Dependencies Management**
   - Clean interface for required dependencies
   - Accepts ctx, camera, textureManager, and renderSettings

### Updated: `src/systems/Renderer.ts`

The main Renderer class has been cleaned up:
- Removed all entity-specific rendering methods
- Added EntityRenderer as a private member
- Delegates entity rendering to EntityRenderer in `renderEntities()`
- Maintains responsibility for scene composition, terrain, and UI

### Benefits

1. **Better Organization** - Entity rendering logic is now self-contained
2. **Easier Testing** - EntityRenderer can be tested independently
3. **Reduced Complexity** - Main Renderer is now ~500 lines shorter
4. **Type Safety** - Clear interfaces for dependencies
5. **Maintainability** - Entity-specific rendering changes are isolated

## Usage

The EntityRenderer is created internally by Renderer and used automatically:

```typescript
// In Renderer constructor
this.entityRenderer = new EntityRenderer({
  ctx,
  camera,
  textureManager: this.textureManager,
  renderSettings: this.renderSettings
});

// In renderEntities method
visible.towers.forEach(tower => {
  this.entityRenderer.renderTower(tower, tower === selectedTower);
});
```

## Future Improvements

1. Consider extracting more specialized renderers:
   - EffectRenderer for particles and destruction effects
   - UIRenderer for game UI elements
   - TerrainRenderer enhancements

2. Add entity batching for improved performance
3. Implement render state caching to reduce redundant operations