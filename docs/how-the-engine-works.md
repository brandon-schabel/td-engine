# How the TD Engine Works

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Game Loop](#core-game-loop)
4. [Entity System](#entity-system)
5. [Rendering Pipeline](#rendering-pipeline)
6. [Audio System](#audio-system)
7. [Input Handling](#input-handling)
8. [Wave Management](#wave-management)
9. [State Management](#state-management)
10. [System Communication](#system-communication)
11. [Performance Considerations](#performance-considerations)
12. [Extending the Engine](#extending-the-engine)

## Introduction

TD Engine is a TypeScript-based tower defense game engine built for modern web browsers. It features:

- **Pure Canvas2D rendering** with camera system and zoom
- **Procedural audio generation** using Web Audio API
- **Entity-component architecture** for game objects
- **Frame-independent game loop** with delta time
- **Grid-based world** with biomes and decorations
- **Touch and keyboard/mouse** input support
- **Wave-based enemy spawning** with patterns
- **RPG elements** including player character and inventory

The engine is designed to be modular, testable, and performant while remaining easy to extend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Game Class                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ GameEngine  │  │ WaveManager  │  │ AudioManager  │ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   Camera    │  │   Renderer   │  │InputManager   │ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Entity Arrays                       │   │
│  │  towers[], enemies[], projectiles[], etc.       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

The `Game` class serves as the central hub, orchestrating all systems and managing entity collections. Each system is responsible for a specific domain:

- **GameEngine**: Manages the game loop and state
- **WaveManager**: Controls enemy spawning
- **AudioManager**: Handles sound generation
- **Camera**: Manages viewport and transformations
- **Renderer**: Draws everything to canvas
- **InputManager**: Processes user input

## Core Game Loop

The game uses a frame-based update/render loop implemented in `GameEngine.ts`:

```typescript
private gameLoop = (currentTime: number): void => {
    if (!this.running) return;

    const deltaTime = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);  // Update game logic
    this.render(deltaTime);  // Draw to screen

    this.animationId = requestAnimationFrame(this.gameLoop);
};
```

### Update Phase
1. **State Check**: Skip if paused
2. **System Updates**: Wave spawning, input processing
3. **Entity Updates**: Movement, targeting, cooldowns
4. **Combat Resolution**: Damage calculation, projectile hits
5. **Cleanup**: Remove dead entities
6. **Win/Loss Check**: Monitor game conditions

### Render Phase
1. **Clear Canvas**: Background with biome color
2. **World Rendering**: Grid, decorations, effects
3. **Entity Rendering**: All game objects
4. **UI Rendering**: HUD, menus, overlays
5. **Debug Info**: Optional performance stats

## Entity System

The entity system uses classical inheritance with a base `Entity` class:

```typescript
abstract class Entity {
    x: number;
    y: number;
    vx: number = 0;
    vy: number = 0;
    health: number;
    maxHealth: number;
    radius: number;
    type: EntityType;
    
    abstract update(deltaTime: number, game: Game): void;
    abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void;
    
    takeDamage(damage: number): void {
        this.health = Math.max(0, this.health - damage);
    }
    
    isAlive(): boolean {
        return this.health > 0;
    }
}
```

### Entity Hierarchy

```
Entity
├── Tower
│   ├── BasicTower (rapid fire)
│   ├── SniperTower (high damage, slow)
│   ├── CannonTower (area damage)
│   └── SlowTower (slows enemies)
├── Enemy
│   ├── BasicEnemy
│   ├── FastEnemy
│   ├── TankEnemy
│   └── FlyingEnemy
├── Projectile
│   ├── Bullet
│   ├── CannonBall
│   └── SlowProjectile
├── Player
└── Collectible
    ├── CoinCollectible
    └── HealthCollectible
```

Each entity type implements specific behaviors while sharing common functionality.

## Rendering Pipeline

The rendering system transforms world coordinates to screen space through the camera:

### Coordinate Transformation
```typescript
// World to screen transformation
const screenX = (worldX - camera.x) * camera.zoom + camera.width / 2;
const screenY = (worldY - camera.y) * camera.zoom + camera.height / 2;
```

### Rendering Layers (in order)
1. **Background**: Clear with biome color
2. **Grid**: World grid with biome tinting
3. **Decorations**: Trees, rocks, environmental props
4. **Effects**: Particles, environmental effects
5. **Entities**: Game objects (sorted by Y for depth)
6. **UI**: HUD elements, menus

### Optimization Techniques
- **Viewport Culling**: Only render visible entities
- **Batch Rendering**: Group similar draw calls
- **Texture Caching**: Reuse loaded images
- **Primitive Fallbacks**: Simple shapes when textures fail

## Audio System

The audio system generates sounds procedurally using Web Audio API:

```typescript
playSound(type: SoundType, options?: PlayOptions): void {
    const soundDef = SOUND_DEFINITIONS[type];
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = soundDef.waveform;
    oscillator.frequency.setValueAtTime(soundDef.frequency, now);
    
    // Apply ADSR envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
}
```

### Sound Categories
- **Combat**: Shooting, explosions, hits
- **UI**: Clicks, hover, menu sounds  
- **Game State**: Victory, defeat, wave start
- **Pickups**: Coin collection, health
- **Player**: Footsteps, damage, death

### Performance Features
- **Sound Throttling**: Limit sounds per frame
- **Distance Attenuation**: Volume based on distance
- **Concurrent Limit**: Maximum active sounds
- **Priority System**: Important sounds play first

## Input Handling

The `InputManager` provides a unified interface for all input:

```typescript
class InputManager {
    private keys: Map<string, boolean> = new Map();
    private mouseState: MouseState;
    
    getMovementVector(): { x: number; y: number } {
        let x = 0, y = 0;
        
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a')) x -= 1;
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d')) x += 1;
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w')) y -= 1;
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s')) y += 1;
        
        // Normalize diagonal movement
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 0) {
            x /= magnitude;
            y /= magnitude;
        }
        
        return { x, y };
    }
}
```

### Input Flow
1. **Event Capture**: Browser events → InputManager
2. **State Updates**: Track current input state
3. **Coordinate Transform**: Screen → world coordinates
4. **Action Dispatch**: Route to appropriate handlers
5. **Feedback**: Visual/audio confirmation

## Wave Management

The wave system orchestrates enemy spawning with patterns:

```typescript
interface Wave {
    enemies: EnemySpawnConfig[];
    spawnPattern: SpawnPattern;
    duration: number;
}

enum SpawnPattern {
    SINGLE_POINT,    // All from one location
    RANDOM,          // Random spawn points
    SEQUENTIAL,      // Cycle through points
    BURST_SPAWN,     // Groups at intervals
    SURROUND,        // From all edges
    ALTERNATING,     // Switch between points
    WAVE_FORMATION,  // Synchronized lines
    SPIRAL,          // Spiral pattern
    PINCER,          // Two-pronged attack
    BOSS_WAVE        // Boss with minions
}
```

### Spawn Process
1. **Pattern Selection**: Choose based on wave config
2. **Zone Selection**: Pick spawn points via SpawnZoneManager
3. **Queue Creation**: Pre-calculate spawn times
4. **Enemy Creation**: Instantiate at calculated positions
5. **Path Assignment**: Set initial movement direction

## State Management

The game uses a finite state machine for game states:

```typescript
enum GameState {
    MENU,
    PLAYING,
    PAUSED,
    GAME_OVER,
    VICTORY
}
```

### State Transitions
```
MENU ──start()──> PLAYING
  ↑                   │
  │                   ├─pause()──> PAUSED ──resume()──┐
  │                   │                                │
  │                   ├─gameOver()──> GAME_OVER       │
  │                   │                                │
  │                   └─victory()──> VICTORY          │
  │                                                    │
  └────────────────stop()──────────────────────────────┘
```

Each state affects:
- **Update behavior**: What gets updated
- **Render behavior**: What gets drawn
- **Input handling**: Which inputs are processed
- **Audio**: Background music and effects

## System Communication

Systems communicate through several patterns:

### 1. Direct Reference
```typescript
// Game holds references to all systems
class Game {
    private engine: GameEngine;
    private waveManager: WaveManager;
    private audioManager: AudioManager;
    
    // Systems can call each other through Game
    towerShoot(tower: Tower) {
        const projectile = tower.createProjectile();
        this.projectiles.push(projectile);
        this.audioManager.playSound(SoundType.TOWER_SHOOT);
    }
}
```

### 2. Observer Pattern
```typescript
// GameEngine uses callbacks for loose coupling
engine.onUpdate((deltaTime) => {
    game.update(deltaTime);
});

engine.onRender((deltaTime) => {
    game.render(deltaTime);
});
```

### 3. Entity Queries
```typescript
// Systems query entity arrays
findNearestEnemy(x: number, y: number, range: number): Enemy | null {
    return this.enemies
        .filter(enemy => {
            const dist = Math.hypot(enemy.x - x, enemy.y - y);
            return dist <= range;
        })
        .sort((a, b) => {
            const distA = Math.hypot(a.x - x, a.y - y);
            const distB = Math.hypot(b.x - x, b.y - y);
            return distA - distB;
        })[0] || null;
}
```

## Performance Considerations

### Memory Management
- **Entity Pooling**: Reuse projectiles and effects
- **Cleanup Cycles**: Remove dead entities each frame
- **Texture Caching**: Share loaded images
- **Sound Limits**: Cap concurrent sounds

### Computational Optimization
- **Spatial Partitioning**: Grid-based collision detection
- **Viewport Culling**: Only process visible entities
- **Delta Time Capping**: Prevent spiral of death
- **Batch Operations**: Group similar calculations

### Rendering Optimization
- **Layer Caching**: Static elements on separate canvas
- **Primitive Shapes**: Fallback for missing textures
- **Draw Call Batching**: Minimize state changes
- **Resolution Scaling**: Adjust for performance

### Profiling Points
```typescript
// Performance monitoring
const frameStart = performance.now();
this.update(deltaTime);
const updateTime = performance.now() - frameStart;

const renderStart = performance.now();
this.render(deltaTime);
const renderTime = performance.now() - renderStart;

// Alert if frame budget exceeded
if (updateTime + renderTime > 16.67) {
    console.warn('Frame budget exceeded');
}
```

## Extending the Engine

### Adding a New Tower Type

1. **Define the type** in `TowerType` enum
2. **Add configuration** to `TOWER_COSTS`
3. **Create tower class**:
```typescript
export class LaserTower extends Tower {
    constructor(x: number, y: number) {
        super(x, y, TowerType.LASER);
        this.damage = 50;
        this.range = 200;
        this.fireRate = 0.5;
    }
    
    update(deltaTime: number, game: Game): void {
        super.update(deltaTime, game);
        // Custom laser targeting logic
    }
    
    createProjectile(target: Enemy): Projectile {
        return new LaserBeam(this.x, this.y, target);
    }
}
```
4. **Update factory method** in `Tower.create()`
5. **Add UI button** and icon
6. **Write tests** for new behavior

### Adding a New Enemy Type

1. **Define the type** in `EnemyType` enum
2. **Create enemy class**:
```typescript
export class ShieldEnemy extends Enemy {
    private shieldHealth: number = 100;
    
    constructor(x: number, y: number) {
        super(x, y, EnemyType.SHIELD);
        this.speed = 0.03;
        this.maxHealth = 200;
        this.health = this.maxHealth;
    }
    
    takeDamage(damage: number): void {
        if (this.shieldHealth > 0) {
            this.shieldHealth -= damage;
            if (this.shieldHealth < 0) {
                super.takeDamage(-this.shieldHealth);
            }
        } else {
            super.takeDamage(damage);
        }
    }
}
```
3. **Add to wave configurations**
4. **Create visual representation**
5. **Test interactions**

### Adding a New System

1. **Create system class**:
```typescript
export class WeatherSystem {
    private currentWeather: WeatherType = WeatherType.CLEAR;
    private windSpeed: number = 0;
    private windDirection: number = 0;
    
    update(deltaTime: number, game: Game): void {
        // Update weather patterns
        // Affect projectile trajectories
        // Modify enemy speeds
    }
    
    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        // Render weather effects
    }
}
```

2. **Integrate with Game class**:
```typescript
class Game {
    private weatherSystem: WeatherSystem;
    
    constructor() {
        this.weatherSystem = new WeatherSystem();
    }
    
    update(deltaTime: number): void {
        this.weatherSystem.update(deltaTime, this);
        // ... rest of update
    }
}
```

3. **Add configuration options**
4. **Test system interactions**
5. **Document new features**

### Best Practices for Extensions

1. **Follow existing patterns**: Match code style and architecture
2. **Write tests first**: TDD ensures reliability
3. **Consider performance**: Profile new features
4. **Document thoroughly**: Update relevant docs
5. **Handle edge cases**: Null checks, bounds validation
6. **Maintain compatibility**: Don't break existing features

## Conclusion

The TD Engine provides a solid foundation for tower defense games with:

- **Modular architecture** for easy extension
- **Performance-focused** design decisions
- **Clean separation** of concerns
- **Testable components** throughout
- **Flexible configuration** system

The engine demonstrates common game programming patterns while remaining accessible to developers familiar with TypeScript and web technologies. Its design allows for significant customization while maintaining performance on modern browsers.

For specific implementation details, refer to the source code and inline documentation throughout the codebase.