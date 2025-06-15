# Entity System

The entity system in TD Engine provides a flexible framework for game objects with shared behavior and efficient management.

## Entity Hierarchy

```
Entity (Base Class)
  ├─> Tower
  │    ├─> BasicTower
  │    ├─> SniperTower
  │    ├─> RapidTower
  │    └─> Wall
  ├─> Enemy
  │    ├─> BasicEnemy
  │    ├─> FastEnemy
  │    └─> TankEnemy
  ├─> Player
  ├─> Projectile
  └─> Collectible
       ├─> HealthPickup
       └─> PowerUp
```

## Base Entity Class

All game objects inherit from the Entity base class:

```typescript
class Entity {
  public readonly id: string;
  public readonly type: EntityType;
  public position: Vector2;
  public velocity: Vector2;
  public health: number;
  public maxHealth: number;
  public radius: number;
  public isAlive: boolean;

  constructor(
    type: EntityType,
    position: Vector2 = { x: 0, y: 0 },
    maxHealth: number = 100,
    radius: number = 10
  ) {
    this.id = `${type}_${nextId++}`;
    this.type = type;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.radius = radius;
    this.isAlive = true;
  }
}
```

## Core Entity Methods

### Movement
```typescript
moveTo(target: Vector2, speed: number): void {
  const direction = Vector2Utils.subtract(target, this.position);
  const normalizedDirection = Vector2Utils.normalize(direction);
  this.velocity = Vector2Utils.multiply(normalizedDirection, speed);
}
```

### Health Management
```typescript
takeDamage(amount: number): void {
  if (!this.isAlive) return;
  
  this.health = Math.max(0, this.health - amount);
  if (this.health === 0) {
    this.isAlive = false;
  }
}

heal(amount: number): void {
  if (!this.isAlive) return;
  
  this.health = Math.min(this.maxHealth, this.health + amount);
}
```

### Collision Detection
```typescript
collidesWith(other: Entity): boolean {
  const distance = this.distanceTo(other);
  return distance < (this.radius + other.radius);
}
```

## Entity Manager

The EntityManager provides centralized entity lifecycle management with performance optimizations:

### Features
- Spatial partitioning for efficient queries
- Object pooling for projectiles
- Batch entity operations
- Collision detection optimization

### Spatial Partitioning
```typescript
class EntityManager {
  private spatialGrid: Map<string, Entity[]> = new Map();
  private spatialCellSize: number = 100;

  private getSpatialCell(position: Vector2): string {
    const x = Math.floor(position.x / this.spatialCellSize);
    const y = Math.floor(position.y / this.spatialCellSize);
    return `${x},${y}`;
  }

  getEntitiesInRadius(position: Vector2, radius: number): Entity[] {
    // Only check relevant grid cells
    const cellRadius = Math.ceil(radius / this.spatialCellSize);
    // ... check surrounding cells
  }
}
```

### Object Pooling
```typescript
class EntityManager {
  private projectilePool: Projectile[] = [];
  private maxPoolSize: number = 100;

  createProjectile(...args): Projectile {
    // Try to reuse from pool first
    let projectile = this.projectilePool.find(p => !p.isAlive);
    if (projectile) {
      // Reset and reuse
      projectile.reset(...args);
    } else {
      // Create new if pool exhausted
      projectile = new Projectile(...args);
    }
    return projectile;
  }
}
```

## Entity Types

### Tower
Stationary defensive structures:
```typescript
class Tower extends Entity {
  public towerType: TowerType;
  public damage: number;
  public range: number;
  public fireRate: number;
  private lastFireTime: number = 0;
  private upgradeLevels: Map<UpgradeType, number>;

  updateAndShoot(enemies: Enemy[], deltaTime: number): Projectile[] {
    // Find targets in range
    // Check cooldown
    // Create projectiles
  }
}
```

### Enemy
Mobile threats that follow paths or chase the player:
```typescript
class Enemy extends Entity {
  public enemyType: EnemyType;
  public speed: number;
  public reward: number;
  private target: Player | null;
  private path: Vector2[] | null;

  update(deltaTime: number): void {
    // Move toward target or follow path
    // Check for damage
    // Update animations
  }
}
```

### Player
The controlled character:
```typescript
class Player extends Entity {
  private movement: PlayerMovement;
  private combat: PlayerCombat;
  private health: PlayerHealth;
  private powerUps: PlayerPowerUps;
  private progression: PlayerProgression;

  update(deltaTime: number): void {
    // Handle input
    // Update position
    // Process combat
    // Apply power-ups
  }
}
```

### Projectile
Bullets and other flying objects:
```typescript
class Projectile extends Entity {
  public damage: number;
  public speed: number;
  public target: Enemy | null;
  
  update(deltaTime: number): void {
    if (this.target && this.target.isAlive) {
      // Home toward target
      this.moveToward(this.target.position);
    } else {
      // Continue in straight line
      this.updatePosition(deltaTime);
    }
  }
}
```

### Collectible
Items that can be picked up:
```typescript
class Collectible extends Entity {
  public collectibleType: CollectibleType;
  private floatAnimation: number = 0;
  
  tryCollectByPlayer(player: Player): boolean {
    if (this.distanceTo(player) <= this.radius + player.radius) {
      this.applyEffect(player);
      this.isActive = false;
      return true;
    }
    return false;
  }
}
```

## Entity Lifecycle

### Creation
```typescript
// Entities created through Game or EntityManager
const tower = new Tower(TowerType.BASIC, position);
game.towers.push(tower);
grid.setCellType(gridX, gridY, CellType.TOWER);
```

### Update
```typescript
// Each frame, entities are updated
entity.update(deltaTime);
```

### Destruction
```typescript
// Entities marked as dead
entity.isAlive = false;

// Cleaned up at end of frame
this.entities = this.entities.filter(e => e.isAlive);
```

## Performance Optimizations

### 1. Spatial Queries
Instead of checking all entities:
```typescript
// Bad
const nearbyEnemies = enemies.filter(e => e.distanceTo(tower) <= range);

// Good
const nearbyEnemies = entityManager.getEntitiesInRadius(
  tower.position, 
  range, 
  Enemy
);
```

### 2. Early Exit Conditions
```typescript
update(deltaTime: number): void {
  if (!this.isAlive) return;
  if (!this.isActive) return;
  // ... rest of update
}
```

### 3. Component Updates
Only update active components:
```typescript
if (this.powerUps.hasActivePowerUps()) {
  this.powerUps.update(deltaTime);
}
```

## Best Practices

1. **Immutable IDs**: Entity IDs should never change
2. **Position Copying**: Always copy positions to prevent shared references
3. **Health Bounds**: Always clamp health between 0 and maxHealth
4. **Cleanup**: Remove references when entities die
5. **Type Safety**: Use TypeScript enums for entity types

## Common Patterns

### Target Acquisition
```typescript
findNearestEnemy(position: Vector2, range: number): Enemy | null {
  let nearest: Enemy | null = null;
  let minDistance = range;
  
  for (const enemy of this.enemies) {
    if (!enemy.isAlive) continue;
    
    const distance = Vector2Utils.distance(position, enemy.position);
    if (distance < minDistance) {
      nearest = enemy;
      minDistance = distance;
    }
  }
  
  return nearest;
}
```

### Damage Application
```typescript
applyDamage(target: Entity, damage: number, source: Entity): void {
  target.takeDamage(damage);
  
  if (!target.isAlive) {
    this.handleEntityDeath(target, source);
  }
}
```