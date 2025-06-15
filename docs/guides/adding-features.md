# Adding Features to TD Engine

This guide explains how to extend TD Engine with new gameplay features, content, and systems.

## Table of Contents

1. [Adding New Towers](#adding-new-towers)
2. [Adding New Enemies](#adding-new-enemies)
3. [Creating Power-Ups](#creating-power-ups)
4. [Adding New Biomes](#adding-new-biomes)
5. [Creating UI Components](#creating-ui-components)
6. [Adding Sound Effects](#adding-sound-effects)
7. [Implementing Game Modes](#implementing-game-modes)

## Adding New Towers

### Step 1: Define the Tower Type

Edit `src/entities/Tower.ts`:

```typescript
export enum TowerType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  RAPID = 'RAPID',
  WALL = 'WALL',
  LASER = 'LASER',     // New tower
  MISSILE = 'MISSILE'  // Another new tower
}
```

### Step 2: Configure Tower Stats

Edit `src/config/TowerConfig.ts`:

```typescript
export const TOWER_STATS: Record<TowerType, TowerStats> = {
  LASER: {
    damage: 40,
    range: 200,
    fireRate: 2.0,      // Shots per second
    projectileSpeed: 1500,
    color: '#FF00FF',   // Purple laser
    projectileColor: '#FF00FF',
    upgrades: {
      damage: [50, 65, 85, 110, 145],
      range: [220, 245, 275, 310, 350],
      fireRate: [2.5, 3.0, 3.8, 4.5, 5.5]
    }
  },
  MISSILE: {
    damage: 100,
    range: 300,
    fireRate: 0.5,
    projectileSpeed: 400,
    color: '#8B4513',
    projectileColor: '#FF4500',
    upgrades: {
      damage: [150, 225, 340, 510, 765],
      range: [350, 400, 450, 500, 550],
      fireRate: [0.6, 0.75, 0.9, 1.1, 1.4]
    }
  }
};

export const TOWER_COSTS = {
  LASER: 75,
  MISSILE: 150
};
```

### Step 3: Implement Tower Behavior

In `src/entities/Tower.ts`, add custom shooting behavior:

```typescript
updateAndShoot(enemies: Enemy[], deltaTime: number): Projectile[] {
  // ... existing code ...
  
  switch (this.towerType) {
    case TowerType.LASER:
      return this.shootLaser(target);
      
    case TowerType.MISSILE:
      return this.shootMissile(target);
      
    // ... other cases
  }
}

private shootLaser(target: Enemy): Projectile[] {
  // Laser pierces through enemies
  const projectile = new Projectile(
    this.position,
    null, // No homing
    this.damage,
    this.projectileSpeed
  );
  
  // Set velocity toward target
  const direction = Vector2Utils.normalize(
    Vector2Utils.subtract(target.position, this.position)
  );
  projectile.velocity = Vector2Utils.multiply(direction, this.projectileSpeed);
  projectile.piercing = true; // Custom property
  
  return [projectile];
}

private shootMissile(target: Enemy): Projectile[] {
  // Missile has area damage
  const projectile = new Projectile(
    this.position,
    target, // Homing missile
    this.damage,
    this.projectileSpeed
  );
  
  projectile.aoeRadius = 50; // Area of effect
  projectile.aoeEnabled = true;
  
  return [projectile];
}
```

### Step 4: Add Tower Icon

Create an icon in `src/ui/icons/SvgIcons.ts`:

```typescript
export enum IconType {
  // ... existing icons
  LASER_TOWER = 'LASER_TOWER',
  MISSILE_TOWER = 'MISSILE_TOWER'
}

// In createSvgIcon function
case IconType.LASER_TOWER:
  return `<svg><!-- Laser tower SVG path --></svg>`;
```

### Step 5: Update UI

Add buttons for new towers in your UI setup:

```typescript
const laserTowerBtn = createTowerButton('Laser', TowerType.LASER, 75);
const missileTowerBtn = createTowerButton('Missile', TowerType.MISSILE, 150);
```

## Adding New Enemies

### Step 1: Define Enemy Type

Edit `src/entities/Enemy.ts`:

```typescript
export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK',
  FLYING = 'FLYING',    // New enemy
  STEALTH = 'STEALTH'   // Another new enemy
}
```

### Step 2: Configure Enemy Stats

Edit `src/config/EnemyConfig.ts`:

```typescript
export const ENEMY_STATS = {
  FLYING: {
    health: 80,
    speed: 120,
    damage: 15,
    reward: 20,
    color: '#4169E1',
    radius: 12,
    canFly: true  // Custom property
  },
  STEALTH: {
    health: 60,
    speed: 100,
    damage: 10,
    reward: 30,
    color: '#2F4F4F',
    radius: 10,
    stealthDuration: 3000,  // Invisible for 3 seconds
    stealthCooldown: 5000   // 5 second cooldown
  }
};
```

### Step 3: Implement Enemy Behavior

```typescript
class Enemy extends Entity {
  private canFly: boolean = false;
  private stealthActive: boolean = false;
  private stealthTimer: number = 0;
  
  constructor(position: Vector2, health: number, enemyType: EnemyType) {
    super(EntityType.ENEMY, position, health);
    
    // Apply special properties
    if (enemyType === EnemyType.FLYING) {
      this.canFly = true;
    }
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Stealth behavior
    if (this.enemyType === EnemyType.STEALTH) {
      this.updateStealth(deltaTime);
    }
  }
  
  private updateStealth(deltaTime: number): void {
    this.stealthTimer += deltaTime;
    
    const config = ENEMY_STATS[this.enemyType];
    if (this.stealthTimer < config.stealthDuration) {
      this.stealthActive = true;
    } else if (this.stealthTimer < config.stealthDuration + config.stealthCooldown) {
      this.stealthActive = false;
    } else {
      this.stealthTimer = 0; // Reset cycle
    }
  }
  
  // Towers can't target stealth enemies
  canBeTargeted(): boolean {
    return !this.stealthActive;
  }
}
```

### Step 4: Update Tower Targeting

```typescript
// In Tower.ts
findTarget(enemies: Enemy[]): Enemy | null {
  const validTargets = enemies.filter(enemy => {
    if (!enemy.isAlive) return false;
    if (!enemy.canBeTargeted()) return false; // Check stealth
    
    // Some towers can't target flying enemies
    if (enemy.canFly && !this.canTargetAir) return false;
    
    const distance = this.distanceTo(enemy);
    return distance <= this.range;
  });
  
  // Find closest valid target
  return validTargets.reduce((closest, enemy) => {
    if (!closest) return enemy;
    return this.distanceTo(enemy) < this.distanceTo(closest) ? enemy : closest;
  }, null as Enemy | null);
}
```

## Creating Power-Ups

### Step 1: Define Power-Up Type

Edit `src/entities/items/ItemTypes.ts`:

```typescript
export enum CollectibleType {
  HEALTH = 'HEALTH',
  EXTRA_DAMAGE = 'EXTRA_DAMAGE',
  SPEED_BOOST = 'SPEED_BOOST',
  SHIELD = 'SHIELD',
  EXTRA_CURRENCY = 'EXTRA_CURRENCY',
  FREEZE_ENEMIES = 'FREEZE_ENEMIES',    // New power-up
  DOUBLE_SHOT = 'DOUBLE_SHOT'           // Another new power-up
}
```

### Step 2: Configure Power-Up

```typescript
export const POWERUP_CONFIGS = {
  FREEZE_ENEMIES: {
    duration: 3000,
    color: '#00CED1',
    icon: '❄️',
    description: 'Freezes all enemies for 3 seconds'
  },
  DOUBLE_SHOT: {
    duration: 10000,
    color: '#FFD700',
    icon: '⚡',
    description: 'Double projectiles for 10 seconds'
  }
};
```

### Step 3: Implement Power-Up Effect

In `src/entities/player/PlayerPowerUps.ts`:

```typescript
applyPowerUp(type: CollectibleType): void {
  switch (type) {
    case CollectibleType.FREEZE_ENEMIES:
      this.freezeAllEnemies();
      break;
      
    case CollectibleType.DOUBLE_SHOT:
      this.activateDoubleShot();
      break;
  }
}

private freezeAllEnemies(): void {
  // Dispatch event to freeze enemies
  document.dispatchEvent(new CustomEvent('freezeEnemies', {
    detail: { duration: 3000 }
  }));
}

private activateDoubleShot(): void {
  this.doubleShotActive = true;
  this.doubleShotTimer = 10000;
}
```

## Adding New Biomes

### Step 1: Define Biome Type

Edit `src/types/MapData.ts`:

```typescript
export enum BiomeType {
  FOREST = 'FOREST',
  DESERT = 'DESERT',
  ARCTIC = 'ARCTIC',
  VOLCANIC = 'VOLCANIC',
  GRASSLAND = 'GRASSLAND',
  SWAMP = 'SWAMP',        // New biome
  CRYSTAL = 'CRYSTAL'     // Another new biome
}
```

### Step 2: Configure Biome Visuals

```typescript
export const BIOME_PRESETS = {
  SWAMP: {
    colors: {
      primary: '#2F4F2F',      // Dark green
      secondary: '#556B2F',     // Olive
      path: '#8B7D6B',         // Muddy brown
      border: '#4A4A4A',       // Dark gray
      accent: '#9ACD32'        // Yellow-green
    },
    decorations: [
      { type: 'swamp_tree', weight: 0.3 },
      { type: 'lily_pad', weight: 0.2 },
      { type: 'fog', weight: 0.4 },
      { type: 'firefly', weight: 0.1, animated: true }
    ],
    effects: [
      {
        type: 'PARTICLES',
        position: { x: 0, y: 0 },
        radius: 1000,
        intensity: 0.3,
        properties: {
          particleType: 'fog',
          color: '#708090',
          speed: 10
        }
      }
    ]
  }
};
```

### Step 3: Add Biome-Specific Mechanics

```typescript
// In Grid.ts
applyBiomeEffects(): void {
  if (this.biome === BiomeType.SWAMP) {
    // Swamp slows movement
    this.movementMultiplier = 0.8;
    
    // Random poison pools
    this.addPoisonPools();
  }
}
```

## Creating UI Components

### Step 1: Create Component Class

```typescript
// src/ui/components/SkillTree.ts
export class SkillTree {
  private container: HTMLDivElement;
  private skills: Map<string, SkillNode> = new Map();
  
  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'skill-tree';
    parent.appendChild(this.container);
    
    this.setupStyles();
    this.createSkillNodes();
  }
  
  private setupStyles(): void {
    this.container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #4CAF50;
      padding: 20px;
      border-radius: 10px;
    `;
  }
}
```

### Step 2: Integrate with Game

```typescript
// In main.ts or UI setup
const skillTree = new SkillTree(document.body);

// Connect to game events
game.on('levelUp', () => {
  skillTree.addSkillPoint();
});
```

## Adding Sound Effects

### Step 1: Define Sound Type

```typescript
// In AudioManager.ts
export enum SoundType {
  // ... existing sounds
  LASER_FIRE = 'laser_fire',
  MISSILE_LAUNCH = 'missile_launch',
  FREEZE_EFFECT = 'freeze_effect'
}
```

### Step 2: Create Sound Configuration

```typescript
this.soundConfigs.set(SoundType.LASER_FIRE, {
  frequency: 1200,
  duration: 0.3,
  volume: 0.4,
  type: 'sawtooth',
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.19 },
  modulation: { frequency: 50, depth: 100 }
});

this.soundConfigs.set(SoundType.FREEZE_EFFECT, {
  sequence: [
    { frequency: 800, duration: 0.1, type: 'sine' },
    { frequency: 1200, duration: 0.2, type: 'sine' },
    { frequency: 1600, duration: 0.3, type: 'triangle' }
  ]
});
```

## Implementing Game Modes

### Step 1: Define Game Mode

```typescript
export enum GameMode {
  CLASSIC = 'CLASSIC',
  SURVIVAL = 'SURVIVAL',
  RUSH = 'RUSH',
  SANDBOX = 'SANDBOX'
}
```

### Step 2: Create Mode Configuration

```typescript
export const GAME_MODE_CONFIG = {
  SURVIVAL: {
    startingLives: 1,
    startingCurrency: 200,
    waveInterval: 10000,  // Auto-start waves
    enemyHealthMultiplier: 1.1,  // +10% per wave
    rewardMultiplier: 1.5
  },
  RUSH: {
    startingLives: 20,
    startingCurrency: 500,
    waveInterval: 5000,
    spawnRateMultiplier: 2.0,
    simultaneousWaves: true
  },
  SANDBOX: {
    startingLives: 999,
    startingCurrency: 99999,
    unlimitedWaves: true,
    allTowersUnlocked: true,
    customWaveEditor: true
  }
};
```

### Step 3: Implement Mode Logic

```typescript
class Game {
  private gameMode: GameMode = GameMode.CLASSIC;
  
  constructor(canvas: HTMLCanvasElement, mapConfig?: MapGenerationConfig, mode?: GameMode) {
    this.gameMode = mode || GameMode.CLASSIC;
    this.applyGameMode();
  }
  
  private applyGameMode(): void {
    const config = GAME_MODE_CONFIG[this.gameMode];
    
    if (config) {
      this.lives = config.startingLives;
      this.currency = config.startingCurrency;
      
      if (config.waveInterval) {
        this.setupAutoWaves(config.waveInterval);
      }
    }
  }
}
```

## Testing Your Features

### Unit Tests

```typescript
// test/towers/LaserTower.test.ts
describe('Laser Tower', () => {
  it('should pierce through enemies', () => {
    const tower = new Tower(TowerType.LASER, { x: 0, y: 0 });
    const enemies = [
      new Enemy({ x: 50, y: 0 }, 100, EnemyType.BASIC),
      new Enemy({ x: 100, y: 0 }, 100, EnemyType.BASIC)
    ];
    
    const projectiles = tower.updateAndShoot(enemies, 16);
    
    expect(projectiles[0].piercing).toBe(true);
  });
});
```

### Integration Tests

```typescript
// test/integration/NewFeatures.test.ts
describe('New Features Integration', () => {
  it('should handle flying enemies correctly', async () => {
    const game = createTestGame();
    
    // Spawn flying enemy
    const enemy = new Enemy({ x: 0, y: 0 }, 100, EnemyType.FLYING);
    game.enemies.push(enemy);
    
    // Basic tower shouldn't target
    const basicTower = new Tower(TowerType.BASIC, { x: 50, y: 0 });
    expect(basicTower.findTarget([enemy])).toBeNull();
    
    // Anti-air tower should target
    const aaTower = new Tower(TowerType.MISSILE, { x: 50, y: 0 });
    expect(aaTower.findTarget([enemy])).toBe(enemy);
  });
});
```

## Best Practices

1. **Balance Testing**: Playtest new features extensively
2. **Code Organization**: Keep related code together
3. **Documentation**: Document new features and APIs
4. **Performance**: Profile new features for performance impact
5. **Compatibility**: Ensure new features work with existing systems
6. **Configuration**: Make features configurable when possible
7. **Error Handling**: Add proper error handling for edge cases

## Common Pitfalls

1. **Forgetting to update all systems** - New entities need support in rendering, collision, etc.
2. **Breaking existing balance** - Test how new features affect game difficulty
3. **Performance degradation** - Monitor frame rate with new features
4. **Missing UI updates** - Ensure UI reflects new features
5. **Save game compatibility** - Consider migration for saved games

## Next Steps

- Read about [Performance Optimization](./performance.md)
- Learn about [Testing Strategies](./testing.md)
- Explore the [API Reference](../api/core-classes.md)
- Check out example implementations in the codebase