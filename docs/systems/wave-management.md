# Wave Management System

The wave management system orchestrates enemy spawning patterns, wave progression, and dynamic difficulty adjustments throughout the game.

## System Architecture

```
WaveManager
  ├─> Wave Configurations
  ├─> Spawn Queue Management
  ├─> Spawn Pattern Logic
  └─> SpawnZoneManager (dynamic spawning)
       ├─> Zone Activation
       ├─> Threat Analysis
       └─> Adaptive Spawning
```

## Core Components

### WaveManager Class

```typescript
class WaveManager {
  private spawnPoints: Vector2[];
  private waves: WaveConfig[] = [];
  private enemiesInWave: Enemy[] = [];
  private spawnQueue: SpawnQueueItem[] = [];
  private waveStartTime: number = 0;
  private currentTime: number = 0;
  private spawning: boolean = false;
  private waveActive: boolean = false;
  private spawnZoneManager?: SpawnZoneManager;
  
  public currentWave: number = 0;
}
```

### Wave Configuration

```typescript
interface WaveConfig {
  waveNumber: number;
  enemies: EnemySpawnConfig[];
  startDelay: number;         // Delay before wave starts
  spawnPattern?: SpawnPattern; // Wave-wide spawn pattern
}

interface EnemySpawnConfig {
  type: EnemyType;
  count: number;
  spawnDelay: number;         // Delay between spawns
  spawnPattern?: SpawnPattern; // Override for this enemy type
}
```

### Spawn Patterns

```typescript
enum SpawnPattern {
  SINGLE_POINT = 'SINGLE_POINT',           // All from one point
  RANDOM = 'RANDOM',                       // Random spawn points
  ROUND_ROBIN = 'ROUND_ROBIN',             // Cycle through points
  DISTRIBUTED = 'DISTRIBUTED',             // Even distribution
  EDGE_FOCUSED = 'EDGE_FOCUSED',           // Prefer edge spawns
  CORNER_FOCUSED = 'CORNER_FOCUSED',       // Prefer corners
  BURST_SPAWN = 'BURST_SPAWN',             // Simultaneous spawns
  PINCER_MOVEMENT = 'PINCER_MOVEMENT',     // From opposite sides
  ADAPTIVE_SPAWN = 'ADAPTIVE_SPAWN',       // Based on game state
  CHAOS_MODE = 'CHAOS_MODE'                // Completely random
}
```

## Wave Definition Examples

```typescript
const waves: WaveConfig[] = [
  {
    waveNumber: 1,
    enemies: [
      { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }
    ],
    startDelay: 2000,
    spawnPattern: SpawnPattern.SINGLE_POINT
  },
  {
    waveNumber: 5,
    enemies: [
      { 
        type: EnemyType.TANK, 
        count: 3, 
        spawnDelay: 2000,
        spawnPattern: SpawnPattern.CORNER_FOCUSED 
      },
      { 
        type: EnemyType.FAST, 
        count: 8, 
        spawnDelay: 400,
        spawnPattern: SpawnPattern.RANDOM 
      }
    ],
    startDelay: 3000
  }
];
```

## Spawn Queue System

### Building the Queue

```typescript
startWave(waveNumber: number): boolean {
  const wave = this.waves.find(w => w.waveNumber === waveNumber);
  if (!wave) return false;
  
  // Build spawn queue with timing
  for (const enemyConfig of wave.enemies) {
    let enemySpawnTime = wave.startDelay;
    
    for (let i = 0; i < enemyConfig.count; i++) {
      this.spawnQueue.push({
        type: enemyConfig.type,
        spawnTime: enemySpawnTime,
        spawnPointIndex: this.calculateSpawnPoint(i, enemyConfig)
      });
      enemySpawnTime += enemyConfig.spawnDelay;
    }
  }
  
  // Sort by spawn time
  this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);
  return true;
}
```

### Processing the Queue

```typescript
update(deltaTime: number): Enemy[] {
  if (!this.waveActive) return [];
  
  this.currentTime += deltaTime;
  const spawnedEnemies: Enemy[] = [];
  
  // Spawn enemies when their time comes
  while (this.spawnQueue.length > 0 && 
         this.currentTime >= this.spawnQueue[0].spawnTime) {
    const spawnItem = this.spawnQueue.shift()!;
    const spawnPoint = this.selectSpawnPoint(spawnItem.spawnPointIndex);
    
    const enemy = new Enemy(spawnPoint, 0, spawnItem.type);
    this.enemiesInWave.push(enemy);
    spawnedEnemies.push(enemy);
  }
  
  // Check wave completion
  if (this.spawnQueue.length === 0) {
    this.spawning = false;
  }
  
  if (!this.spawning && this.enemiesInWave.length === 0) {
    this.waveActive = false;
  }
  
  return spawnedEnemies;
}
```

## Spawn Pattern Implementation

### Pattern Logic

```typescript
private calculateSpawnPointDistribution(count: number, pattern: SpawnPattern): (number | undefined)[] {
  const indices: (number | undefined)[] = [];
  
  switch (pattern) {
    case SpawnPattern.SINGLE_POINT:
      // All enemies from one random point
      const singleIndex = Math.floor(Math.random() * this.spawnPoints.length);
      for (let i = 0; i < count; i++) {
        indices.push(singleIndex);
      }
      break;
      
    case SpawnPattern.DISTRIBUTED:
      // Evenly distribute across all points
      for (let i = 0; i < count; i++) {
        indices.push(i % this.spawnPoints.length);
      }
      break;
      
    case SpawnPattern.BURST_SPAWN:
      // Use different points for simultaneous spawning
      const burstPoints = Math.min(count, this.spawnPoints.length);
      for (let i = 0; i < count; i++) {
        indices.push(i % burstPoints);
      }
      break;
      
    case SpawnPattern.RANDOM:
    default:
      // Random selection (undefined = select at spawn time)
      for (let i = 0; i < count; i++) {
        indices.push(undefined);
      }
  }
  
  return indices;
}
```

## Dynamic Spawn Zone Management

### SpawnZoneManager Integration

```typescript
class SpawnZoneManager {
  private grid: Grid;
  private activeZones: Set<Vector2> = new Set();
  private zoneThreats: Map<string, number> = new Map();
  private config: SpawnZoneConfig;
  
  update(deltaTime: number, gameState: GameStateSnapshot, 
         towers: Tower[], player: Player): void {
    // Analyze threats
    this.updateZoneThreats(towers, player);
    
    // Activate/deactivate zones
    this.updateActiveZones(gameState);
    
    // Generate new zones if needed
    if (this.config.dynamicZoneGeneration) {
      this.generateDynamicZones(gameState);
    }
  }
}
```

### Threat Analysis

```typescript
private calculateZoneThreat(zone: Vector2, towers: Tower[], player: Player): number {
  let threat = 0;
  
  // Tower coverage
  towers.forEach(tower => {
    const distance = Vector2Utils.distance(zone, tower.position);
    if (distance <= tower.range) {
      threat += tower.damage * tower.fireRate;
    }
  });
  
  // Player proximity
  const playerDistance = Vector2Utils.distance(zone, player.position);
  if (playerDistance < 200) {
    threat += player.damage * 2;
  }
  
  return threat;
}
```

### Adaptive Spawning

```typescript
getNextSpawnPosition(pattern: SpawnPattern): Vector2 | null {
  if (pattern === SpawnPattern.ADAPTIVE_SPAWN) {
    // Choose zone with lowest threat
    let bestZone: Vector2 | null = null;
    let lowestThreat = Infinity;
    
    this.activeZones.forEach(zone => {
      const threat = this.zoneThreats.get(this.zoneKey(zone)) || 0;
      if (threat < lowestThreat) {
        lowestThreat = threat;
        bestZone = zone;
      }
    });
    
    return bestZone;
  }
  
  // Default random selection
  const zones = Array.from(this.activeZones);
  return zones[Math.floor(Math.random() * zones.length)] || null;
}
```

## Wave Progression

### Difficulty Scaling

```typescript
// Example of progressive difficulty
const generateWave = (waveNumber: number): WaveConfig => {
  const baseEnemyCount = 5 + waveNumber * 2;
  const hasTanks = waveNumber >= 5;
  const hasFastEnemies = waveNumber >= 3;
  
  const enemies: EnemySpawnConfig[] = [
    {
      type: EnemyType.BASIC,
      count: Math.floor(baseEnemyCount * 0.6),
      spawnDelay: Math.max(300, 1000 - waveNumber * 50)
    }
  ];
  
  if (hasFastEnemies) {
    enemies.push({
      type: EnemyType.FAST,
      count: Math.floor(baseEnemyCount * 0.3),
      spawnDelay: 400
    });
  }
  
  if (hasTanks) {
    enemies.push({
      type: EnemyType.TANK,
      count: Math.floor(waveNumber / 5) + 1,
      spawnDelay: 2000
    });
  }
  
  return {
    waveNumber,
    enemies,
    startDelay: 2000,
    spawnPattern: waveNumber >= 8 ? SpawnPattern.ADAPTIVE_SPAWN : SpawnPattern.RANDOM
  };
};
```

### Wave Completion

```typescript
isWaveComplete(): boolean {
  return !this.spawning && this.enemiesInWave.length === 0;
}

hasNextWave(): boolean {
  return this.currentWave < this.waves.length;
}

getWaveInfo(waveNumber: number): WaveConfig | null {
  return this.waves.find(w => w.waveNumber === waveNumber) || null;
}
```

## Integration with Game

### Starting Waves

```typescript
// In Game class
startNextWave(): boolean {
  if (this.waveManager.isWaveActive()) {
    return false;
  }
  
  const nextWave = this.waveManager.getNextWaveNumber();
  const started = this.waveManager.startWave(nextWave);
  
  if (started) {
    this.audioHandler.playWaveStart();
    this.audioHandler.resetWaveAudioFlags();
  }
  
  return started;
}
```

### Enemy Spawning

```typescript
// In Game update loop
const newEnemies = this.waveManager.update(deltaTime);
newEnemies.forEach((enemy) => {
  // Set enemy to target player
  enemy.setTarget(this.player);
  this.enemies.push(enemy);
});
```

## Advanced Features

### Multi-Zone Spawning

```typescript
constructor(spawnPoints: Vector2[] | Vector2) {
  // Support both single and multiple spawn points
  if (Array.isArray(spawnPoints)) {
    this.spawnPoints = spawnPoints.map(p => ({ ...p }));
  } else {
    this.spawnPoints = [{ ...spawnPoints }];
  }
}
```

### Pattern Combinations

```typescript
// Wave with mixed patterns
{
  waveNumber: 10,
  enemies: [
    {
      type: EnemyType.TANK,
      count: 4,
      spawnDelay: 2000,
      spawnPattern: SpawnPattern.CORNER_FOCUSED
    },
    {
      type: EnemyType.FAST,
      count: 20,
      spawnDelay: 200,
      spawnPattern: SpawnPattern.BURST_SPAWN
    }
  ],
  startDelay: 3000
}
```

### Conditional Spawning

```typescript
// Spawn based on player performance
if (player.level >= 5) {
  enemyConfig.count *= 1.5;
}

if (gameStats.perfectWaves >= 3) {
  enemyConfig.type = EnemyType.ELITE;
}
```

## Best Practices

1. **Balance Testing**: Test each wave at different player power levels
2. **Spawn Timing**: Avoid overwhelming spawn rates
3. **Pattern Variety**: Mix patterns to keep gameplay interesting
4. **Clear Feedback**: Visual/audio cues for wave start/end
5. **Progressive Difficulty**: Gradual increase in challenge

## Configuration

```typescript
const WAVE_CONFIG = {
  maxActiveZones: 5,
  spawnDelayMultiplier: 1.0,
  difficultyScaling: {
    easy: 0.7,
    normal: 1.0,
    hard: 1.3,
    extreme: 1.8
  },
  patternWeights: {
    early: [SpawnPattern.SINGLE_POINT, SpawnPattern.RANDOM],
    mid: [SpawnPattern.DISTRIBUTED, SpawnPattern.ROUND_ROBIN],
    late: [SpawnPattern.ADAPTIVE_SPAWN, SpawnPattern.CHAOS_MODE]
  }
};
```