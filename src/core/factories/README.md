# EntityFactory

The `EntityFactory` module provides centralized factory functions for creating all game entities with proper configuration and callbacks.

## Overview

The EntityFactory ensures consistent entity creation across the game, handling:
- Initial configuration and state setup
- Callback assignments (onDamage, onShoot, etc.)
- Type-specific behavior (projectile types based on tower type)
- Configuration overrides (speed/health multipliers)

## Usage Examples

### Creating a Player

```typescript
import { EntityFactory } from '@/core/factories';

// Basic player creation
const player = EntityFactory.createPlayer({ x: 100, y: 200 });

// With damage callback
const player = EntityFactory.createPlayer({ x: 100, y: 200 }, {
  onDamage: (event) => {
    // Show damage number UI
    dispatchDamageNumber(event.entity, event.actualDamage, 'normal');
  },
  grid: gameGrid
});
```

### Creating Towers

```typescript
// Basic tower
const basicTower = EntityFactory.createTower(TowerType.BASIC, position);

// Tower with callbacks
const tower = EntityFactory.createTower(TowerType.SNIPER, position, {
  onDamage: (event) => {
    // Handle tower damage visual feedback
  },
  onShoot: (projectile) => {
    // Add projectile to game world
    entityStore.addProjectile(projectile);
  }
});
```

### Creating Enemies

```typescript
// Basic enemy
const enemy = EntityFactory.createEnemy(EnemyType.BASIC, spawnPosition);

// Enemy with modifiers and references
const enemy = EntityFactory.createEnemy(EnemyType.TANK, spawnPosition, {
  speedMultiplier: 1.5,      // 50% faster
  healthMultiplier: 2.0,     // 2x health
  grid: gameGrid,
  playerTarget: player,
  towers: activeTowers,
  onDamage: (event) => {
    // Show damage numbers
  }
});

// Create a boss enemy
const boss = EntityFactory.createBossEnemy(EnemyType.TANK, position, {
  playerTarget: player,
  towers: activeTowers
});

// Create an enemy wave
const spawnPositions = [
  { x: 0, y: 100 },
  { x: 0, y: 200 },
  { x: 0, y: 300 }
];
const wave = EntityFactory.createEnemyWave(EnemyType.FAST, spawnPositions, {
  speedMultiplier: 1.2,
  playerTarget: player
});
```

### Creating Projectiles

```typescript
// Tower projectile (auto-detects type based on tower)
const projectile = EntityFactory.createProjectile(tower, targetEnemy);

// Player projectile
const playerShot = EntityFactory.createProjectile(player, nearestEnemy);

// Custom projectile with velocity
const customProjectile = EntityFactory.createProjectile(tower, null, {
  velocity: { x: 500, y: 0 },  // Shoot right at 500 units/sec
  projectileType: ProjectileType.SNIPER_ROUND,
  speed: 800
});
```

### Creating Collectibles

```typescript
// Specific collectible type
const healthPickup = EntityFactory.createCollectible(
  position,
  CollectibleType.HEALTH
);

// Random collectible
const randomDrop = EntityFactory.createRandomCollectible(enemyPosition);

// With collection callback
const collectible = EntityFactory.createCollectible(position, CollectibleType.COIN, {
  onCollect: (player) => {
    // Play collection sound
    audioManager.playSound(SoundType.COIN_PICKUP);
  }
});
```

## Integration with Game Systems

### With Entity Store

```typescript
// Creating entities and adding to store
const tower = EntityFactory.createTower(TowerType.BASIC, position);
entityStore.addTower(tower);

const enemy = EntityFactory.createEnemy(EnemyType.FAST, spawnPos, {
  playerTarget: entityStore.getPlayer(),
  towers: entityStore.getAllTowers()
});
entityStore.addEnemy(enemy);
```

### With Wave Manager

```typescript
// Wave manager spawning enemies
class WaveManager {
  spawnWave(waveConfig: WaveConfig) {
    const enemies = EntityFactory.createEnemyWave(
      waveConfig.enemyType,
      this.getSpawnPositions(waveConfig.count),
      {
        speedMultiplier: this.difficultyMultiplier,
        healthMultiplier: this.getWaveHealthMultiplier(waveConfig.waveNumber),
        playerTarget: this.player,
        grid: this.grid
      }
    );
    
    enemies.forEach(enemy => this.entityStore.addEnemy(enemy));
  }
}
```

### With Combat System

```typescript
// Tower shooting logic
class TowerLogic {
  handleTowerShoot(tower: Tower, target: Enemy) {
    const projectile = EntityFactory.createProjectile(tower, target);
    
    // Dispatch projectile creation event
    this.eventBus.emit('projectileFired', { 
      shooter: tower, 
      projectile 
    });
    
    return projectile;
  }
}
```

## Benefits

1. **Consistency**: All entities are created with proper initialization
2. **Type Safety**: TypeScript interfaces ensure correct configuration
3. **Centralized Logic**: Entity creation logic in one place
4. **Easy Testing**: Mock EntityFactory for unit tests
5. **Flexible Configuration**: Override any aspect of entity creation
6. **Callback Management**: Consistent callback setup across entities

## Testing

The EntityFactory is fully unit tested. See `__tests__/EntityFactory.test.ts` for examples of:
- Basic entity creation
- Configuration overrides
- Callback setup
- Batch creation (waves)
- Special entity types (bosses)