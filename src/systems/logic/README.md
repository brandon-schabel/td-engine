# Logic Systems

This directory contains pure functional logic systems that handle all game entity updates without side effects. These systems make the game logic testable, predictable, and easier to reason about.

## Architecture

Each logic system is a collection of pure functions that:
- Take entity state and game context as input
- Return update objects describing what should change
- Never mutate entities directly
- Generate actions for side effects (sounds, effects, etc.)

## Core Systems

### EnemyLogic
Handles enemy AI, pathfinding, targeting, and attack behavior.
- `updateEnemy()` - Main update function for enemy logic
- Movement with pathfinding
- Target selection based on behavior type
- Stuck detection and recovery
- Attack timing and cooldowns

### TowerLogic
Manages tower targeting, shooting, and special abilities.
- `updateTower()` - Main update function for tower logic
- Enemy targeting strategies
- Projectile spawning
- Special effects per tower type
- Cooldown management

### PlayerLogic
Controls player movement, shooting, and abilities.
- `updatePlayer()` - Main update function for player logic
- Input handling (keyboard/mouse/mobile)
- Movement with terrain awareness
- Manual/auto shooting modes
- Health regeneration
- Ability usage

### ProjectileLogic
Handles projectile movement, collision, and damage.
- `updateProjectile()` - Main update function for projectile logic
- Homing behavior
- Collision detection
- Target retargeting
- Lifetime management

### CombatLogic
Centralizes damage calculations and combat mechanics.
- `calculateDamage()` - Main damage calculation
- Critical hits
- Armor/resistance calculations
- Damage types (physical/magical/true)
- Healing calculations
- Combat rewards

## Usage Example

```typescript
import { updateEnemy, GameContext, InputState } from '@/systems/logic';

// In your game loop
const context: GameContext = {
  deltaTime: 16,
  enemies: game.enemies,
  towers: game.towers,
  player: game.player,
  projectiles: game.projectiles,
  grid: game.grid,
  gameTime: Date.now(),
  isPaused: false
};

// Update an enemy
const enemyUpdate = updateEnemy(enemy, context);

// Apply the updates
if (enemyUpdate.position) {
  enemy.position = enemyUpdate.position;
}
if (enemyUpdate.velocity) {
  enemy.velocity = enemyUpdate.velocity;
}

// Process generated actions
for (const action of enemyUpdate.actions) {
  switch (action.type) {
    case 'DAMAGE_ENTITY':
      // Apply damage to target
      break;
    case 'PLAY_SOUND':
      // Play sound effect
      break;
    // ... handle other actions
  }
}
```

## Testing

Since all logic functions are pure, they're easy to test:

```typescript
describe('EnemyLogic', () => {
  it('should move enemy towards player', () => {
    const enemy = createMockEnemy();
    const context = createMockContext();
    
    const update = updateEnemy(enemy, context);
    
    expect(update.velocity).toBeDefined();
    expect(update.state).toBe('MOVING');
  });
  
  it('should attack when in range', () => {
    const enemy = createMockEnemy();
    const context = createMockContext();
    // Position enemy within attack range
    enemy.position = { x: 100, y: 100 };
    context.player.position = { x: 110, y: 100 };
    
    const update = updateEnemy(enemy, context);
    
    expect(update.state).toBe('ATTACKING');
    expect(update.actions).toContainEqual({
      type: 'DAMAGE_ENTITY',
      targetId: context.player.id,
      damage: enemy.damage
    });
  });
});
```

## Adding New Logic

To add a new logic system:

1. Create a new file (e.g., `PowerUpLogic.ts`)
2. Define update result interface in `types.ts`
3. Implement pure update function
4. Export from `index.ts`
5. Add tests

Example:
```typescript
// PowerUpLogic.ts
export function updatePowerUp(
  powerUp: PowerUp,
  context: GameContext
): PowerUpUpdate {
  const actions: GameAction[] = [];
  const update: PowerUpUpdate = { actions };
  
  // Check if player collected it
  if (context.player && checkCollision(powerUp, context.player)) {
    update.isCollected = true;
    
    actions.push({
      type: 'APPLY_POWER_UP',
      powerUpType: powerUp.type,
      targetId: context.player.id
    });
  }
  
  return update;
}
```

## Benefits

1. **Testability** - Pure functions are easy to test
2. **Predictability** - Same inputs always produce same outputs
3. **Debugging** - Can replay exact scenarios
4. **Performance** - Can optimize/parallelize pure functions
5. **Multiplayer Ready** - Deterministic logic for client prediction
6. **Separation of Concerns** - Logic separate from rendering/audio/effects