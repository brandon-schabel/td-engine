# System Interactions

This document describes how different systems in TD Engine communicate and interact with each other.

## Communication Patterns

### 1. Direct Method Invocation

The most common pattern, used for synchronous operations where the caller needs immediate results.

```typescript
// Game directly calls methods on systems
class Game {
  update(deltaTime: number): void {
    // Direct calls to systems
    this.waveManager.update(deltaTime);
    this.player.update(deltaTime);
    this.towers.forEach(tower => tower.update(deltaTime));
  }
}
```

**Used for:**
- Entity updates
- Collision checks
- Resource management
- Rendering

### 2. Observer Pattern

Used by GameEngine to notify subscribers of update/render cycles:

```typescript
// Game subscribes to engine events
this.engine.onUpdate(this.update.bind(this));
this.engine.onRender(this.render.bind(this));
```

**Used for:**
- Game loop notifications
- Decoupling engine from game logic

### 3. Event Emitter

Custom event system for loose coupling between systems:

```typescript
// Equipment system notifies of stat changes
this.equipment.on('statsChanged', () => {
  this.applyEquipmentBonuses();
});
```

**Used for:**
- Equipment stat changes
- Inventory updates
- Achievement triggers

### 4. DOM Events

Browser events for UI-to-game communication:

```typescript
// UI dispatches custom events
document.dispatchEvent(new CustomEvent('gameEnd', {
  detail: { stats, victory, scoreEntry }
}));
```

**Used for:**
- Game end notifications
- Player interactions
- UI state changes

## System Interaction Flows

### 1. Entity Creation Flow

```
User Input (Mouse Click)
    ↓
Game.handleMouseClick()
    ↓
Game.placeTower()
    ├─> Validate placement (Grid.canPlaceTower)
    ├─> Check resources (Game.canAffordCurrency)
    ├─> Create entity (new Tower())
    ├─> Update grid (Grid.setCellType)
    ├─> Deduct resources (Game.spendCurrency)
    └─> Play sound (AudioManager.playSound)
```

### 2. Combat Flow

```
Tower.updateAndShoot()
    ├─> Find targets in range
    ├─> Check cooldown
    ├─> Create projectile
    └─> Return projectiles array
         ↓
Game.update() adds projectiles to array
         ↓
Projectile.update()
    ├─> Move toward target
    ├─> Check collision
    └─> Apply damage on hit
         ↓
Enemy.takeDamage()
    ├─> Reduce health
    ├─> Check if dead
    └─> Mark for removal
         ↓
Game.enemyKilled()
    ├─> Award currency
    ├─> Add score
    ├─> Spawn drops
    └─> Play sound
```

### 3. Wave Management Flow

```
Game.startNextWave()
    ↓
WaveManager.startWave()
    ├─> Load wave configuration
    ├─> Build spawn queue
    └─> Set wave active
         ↓
WaveManager.update() [each frame]
    ├─> Check spawn timers
    ├─> Create enemies at spawn points
    └─> Return new enemies
         ↓
Game.update()
    ├─> Add enemies to game
    ├─> Set enemy targets
    └─> Update enemy array
```

### 4. Rendering Pipeline Flow

```
GameEngine.render()
    ↓
Game.render()
    ↓
Renderer.renderScene()
    ├─> Clear canvas
    ├─> Render grid
    │    └─> Only visible cells
    ├─> Render decorations
    │    └─> With biome theming
    ├─> Render environmental effects
    │    └─> Particles, lighting
    ├─> Render entities
    │    ├─> Towers (with upgrades)
    │    ├─> Enemies (with health bars)
    │    ├─> Projectiles
    │    ├─> Collectibles
    │    └─> Player
    └─> Render UI overlay
```

## Inter-System Dependencies

### Core Dependencies
```
GameEngine
    └─> Game
         ├─> Grid
         ├─> WaveManager
         │    └─> SpawnZoneManager
         ├─> Renderer
         │    ├─> Camera
         │    └─> TextureManager
         ├─> AudioManager
         ├─> Player
         ├─> Inventory
         └─> EquipmentManager
```

### Entity Dependencies
```
Tower
    ├─> Enemy (for targeting)
    └─> Projectile (creation)

Enemy
    ├─> Player (for targeting)
    └─> Tower[] (for avoidance)

Projectile
    └─> Enemy (target tracking)

Player
    ├─> Projectile (creation)
    └─> CooldownManager
```

## Data Flow Examples

### 1. Player Movement
```
Keyboard Event
    ↓
Game.handleKeyDown('w')
    ↓
Player.handleKeyDown('w')
    ↓
Player.update() [next frame]
    ├─> Apply velocity
    ├─> Update position
    └─> Constrain to bounds
         ↓
Camera.update(player.position)
    └─> Follow player
```

### 2. Resource Economy
```
Enemy Death
    ↓
Game.enemyKilled(enemy)
    ├─> Calculate reward
    ├─> Add currency
    ├─> Update score
    └─> Chance to spawn drops
         ↓
UI Update (via polling)
    └─> Display new values
```

### 3. Upgrade System
```
UI Button Click
    ↓
Game.upgradePlayer(type)
    ├─> Check cost
    ├─> Deduct currency
    └─> Apply upgrade
         ↓
Player.upgrade(type)
    ├─> Increase level
    ├─> Update stats
    └─> Return success
         ↓
AudioManager.playSound()
```

## Event Sequences

### Game Start Sequence
1. User clicks "Start" in menu
2. Settings applied to game config
3. Map generated with biome
4. Game instance created
5. Grid initialized
6. Camera positioned
7. Player spawned
8. UI components created
9. Game loop started

### Wave Complete Sequence
1. Last enemy killed
2. WaveManager detects empty enemy list
3. Wave marked complete
4. Wave complete sound plays
5. UI shows "Start Next Wave" button
6. Player can build/upgrade
7. Next wave started on demand

### Game Over Sequence
1. Lives reach zero OR player dies
2. Game state set to GAME_OVER
3. Final stats calculated
4. Score saved to localStorage
5. Game end event dispatched
6. UI shows game over screen
7. Options to restart or return to menu

## Performance Considerations

### Batch Operations
- Entity updates batched by type
- Rendering batched where possible
- Sound updates throttled

### Lazy Updates
- UI polls for changes rather than event-driven
- Upgrade panels update only when visible
- Off-screen entities skip expensive operations

### Caching
- Spatial queries cached per frame
- Texture manager caches loaded assets
- Path calculations cached when possible