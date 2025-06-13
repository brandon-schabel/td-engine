# Test Utilities Documentation

This directory contains comprehensive test utilities for the Claude TD game. These utilities are designed to make testing easier, more expressive, and more maintainable.

## Table of Contents

1. [Custom Matchers](#custom-matchers)
2. [Async Testing Utilities](#async-testing-utilities)
3. [Builder Pattern](#builder-pattern)
4. [Performance Testing](#performance-testing)
5. [Data Generators](#data-generators)
6. [Existing Utilities](#existing-utilities)

## Custom Matchers

Custom Vitest matchers for game-specific assertions.

### Usage

```typescript
import '../helpers/matchers';

// Entity range checking
expect(tower).toBeInRange(enemy, 150);

// Path following
expect(enemy).toBeOnPath(path, tolerance);

// Tower targeting
expect(tower).toHaveTargeted(enemy);

// Position validation
expect(entity.position).toBeWithinBounds({ width: 800, height: 600 });

// Health percentage
expect(entity).toHaveHealthPercentage(0.5, 0.01); // 50% ± 1%

// Movement direction
expect(entity).toBeMovingTowards(target, 0.1);

// Fire rate
expect(tower).toHaveFireRateOf(2.5, 0.1); // 2.5 shots/sec ± 0.1

// Grid position
expect(tower).toBeAtGridPosition(5, 5, 32); // cellSize = 32
```

## Async Testing Utilities

Utilities for testing asynchronous game behavior.

### Basic Wait Functions

```typescript
import { waitFor, waitForGameState, waitForEntities } from '../helpers';

// Wait for condition
await waitFor(() => game.score >= 1000, { timeout: 5000 });

// Wait for game state
await waitForGameState(game, GameState.PLAYING);

// Wait for entities to spawn
const enemies = await waitForEntities(() => game.enemies, 10);

// Wait for entity position
await waitForPosition(enemy, 400, 300, 5); // tolerance = 5
```

### Async Game Simulator

```typescript
const simulator = new AsyncGameSimulator(game);

// Simulate for specific time
await simulator.simulateTime(5000); // 5 seconds

// Simulate until wave completes
await simulator.simulateWave(3);

// Simulate until score reached
await simulator.simulateToScore(10000);

// Simulate with custom condition
await simulator.simulateUntil(() => game.lives <= 5);
```

### Timeout Utilities

```typescript
// Add timeout to any promise
const result = await withTimeout(
  longRunningOperation(),
  1000,
  'Operation timed out'
);

// Retry with backoff
const data = await retryAsync(
  () => fetchGameData(),
  { maxRetries: 3, initialDelay: 100 }
);
```

## Builder Pattern

Fluent builders for creating complex test scenarios.

### Game Scenario Builder

```typescript
const game = new GameScenarioBuilder()
  .withCurrency(1000)
  .withLives(10)
  .withScore(5000)
  .withTower(TowerType.SNIPER, 5, 5, [UpgradeType.DAMAGE])
  .withEnemy(EnemyType.TANK, 200, 200, 150)
  .withWave(waveConfig)
  .withMap(mapData)
  .withSimplePath() // Adds a default path
  .build();
```

### Entity Builders

```typescript
// Tower builder
const tower = new TowerBuilder()
  .ofType(TowerType.RAPID)
  .atGrid(10, 10)
  .withLevel(4)
  .withUpgrades(UpgradeType.FIRE_RATE, UpgradeType.RANGE)
  .withHealth(80)
  .targeting(enemy)
  .build();

// Enemy builder
const enemy = new EnemyBuilder()
  .ofType(EnemyType.FAST)
  .at(100, 100)
  .withHealth(200)
  .withPath(pathPoints)
  .withPathProgress(0.5)
  .withSpeed(150)
  .build();

// Wave builder
const wave = new WaveBuilder()
  .number(5)
  .withEnemies(EnemyType.BASIC, 10, 500)
  .withEnemies(EnemyType.TANK, 3, 2000)
  .withStartDelay(3000)
  .build();

// Map builder
const map = new MapBuilder()
  .withSize(30, 20)
  .withPath(pathPoints, 'main-path')
  .withSpawn(0, 10)
  .withExit(29, 10)
  .withObstacle(15, 10)
  .build();
```

## Performance Testing

Tools for measuring and asserting game performance.

### Performance Monitor

```typescript
const monitor = new PerformanceMonitor(game);

// Run performance test
const metrics = await monitor.runTest(5000, 60); // 5 seconds at 60fps

// Get detailed metrics
console.log({
  fps: metrics.fps,
  frameTime: metrics.frameTime,
  updateTime: metrics.updateTime,
  renderTime: metrics.renderTime,
  entityCount: metrics.entityCount
});

// Assert performance targets
monitor.assertPerformance({
  minFps: 30,
  maxFrameTime: 50,
  maxUpdateTime: 10,
  maxRenderTime: 20
});

// Get frame statistics
const stats = monitor.getFrameStats();
console.log(`95th percentile: ${stats.p95}ms`);
```

### FPS Counter

```typescript
const fpsCounter = new FPSCounter();

// In game loop
function gameLoop(timestamp) {
  fpsCounter.update(timestamp);
  console.log(`FPS: ${fpsCounter.getFPS()}`);
  console.log(`Smoothed FPS: ${fpsCounter.getSmoothedFPS()}`);
}
```

### Stress Testing

```typescript
const stressTester = new StressTester(game);

// Spawn many entities
await stressTester.spawnEntities({
  enemyCount: 500,
  towerCount: 100,
  projectileCount: 1000
});

// Run load test with increasing entities
const results = await stressTester.runLoadTest({
  startEntities: 100,
  endEntities: 1000,
  step: 100,
  framesToTest: 300,
  targetFps: 60
});

// Analyze results
results.forEach(({ entityCount, metrics }) => {
  console.log(`${entityCount} entities: ${metrics.fps} FPS`);
});
```

### Memory Leak Detection

```typescript
const leakDetector = new MemoryLeakDetector(game);

// Check for leaks in a test scenario
const hasLeak = await leakDetector.checkForLeaks(async () => {
  // Create and destroy entities
  game.spawnEnemies(100);
  game.clearAllEnemies();
}, 10); // Run 10 iterations

expect(hasLeak).toBe(false);
```

## Data Generators

Utilities for generating random test data.

### Random Utilities

```typescript
// Seeded random for deterministic tests
const random = new Random(12345);

console.log(random.int(1, 10));        // Random integer
console.log(random.float(0.0, 1.0));   // Random float
console.log(random.bool(0.7));         // 70% chance true
console.log(random.pick([1, 2, 3]));   // Pick from array
console.log(random.shuffle([1, 2, 3])); // Shuffle array
```

### Enemy Generator

```typescript
const enemyGen = new EnemyGenerator();

// Generate wave pattern
const pattern = enemyGen.generateWavePattern({
  enemyCount: 50,
  difficulty: 'hard',
  mixedTypes: true
});

// Generate spawn positions
const positions = enemyGen.generateSpawnPositions(path, 10, 30);
```

### Tower Generator

```typescript
const towerGen = new TowerGenerator();

// Generate tower placements
const placements = towerGen.generatePlacement({
  grid: mapGrid,
  count: 10,
  strategy: 'defensive' // or 'offensive', 'random'
});

// Generate upgrade sequence
const upgrades = towerGen.generateUpgradeSequence(
  5, // level
  'balanced' // or 'damage', 'range', 'speed'
);
```

### Wave Generator

```typescript
const waveGen = new WaveGenerator();

// Generate wave sequence
const waves = waveGen.generateWaves({
  count: 20,
  startDifficulty: 1,
  difficultyIncrease: 1.3,
  startDelay: 2000
});

// Generate single wave
const wave = waveGen.generateWave(10, 15.5, 1000);
```

### Map Generator

```typescript
const mapGen = new MapGenerator();

// Generate random path
const path = mapGen.generatePath({
  width: 30,
  height: 20,
  complexity: 'complex',
  startSide: 'left',
  endSide: 'right'
});

// Generate complete map
const map = mapGen.generateMap({
  width: 25,
  height: 19,
  pathCount: 2,
  obstacleCount: 15
});
```

## Existing Utilities

Brief overview of pre-existing test utilities.

### Canvas Helpers
- `createMockCanvas()`: Creates mock canvas element
- `createMockContext2D()`: Creates mock 2D context
- `assertCanvasMethodCalled()`: Verify canvas operations

### Entity Helpers
- `createTestTower()`: Create tower with options
- `createTestEnemy()`: Create enemy with options
- `createTestPlayer()`: Create player entity
- `createTestProjectile()`: Create projectile

### Game Helpers
- `createTestGame()`: Create game instance
- `simulateGameFrames()`: Advance game simulation
- `getGameEntities()`: Access game internals

### Time Helpers
- `TimeController`: Control time in tests
- `simulateFrame()`: Simulate animation frames
- `advanceTime()`: Manually advance time

### Event Helpers
- `simulateClick()`: Simulate mouse clicks
- `simulateKeyPress()`: Simulate keyboard input
- `EventRecorder`: Record and verify events

### Assertion Helpers
- `expectEntityAlive()`: Check entity state
- `expectPositionNear()`: Position assertions
- `expectResourcesChanged()`: Resource tracking

## Best Practices

1. **Use builders for complex scenarios**: They make tests more readable and maintainable
2. **Prefer custom matchers**: They provide better error messages
3. **Use async utilities for timing**: Better than setTimeout in tests
4. **Monitor performance in critical tests**: Catch performance regressions early
5. **Use seeded random for determinism**: Makes tests reproducible
6. **Combine utilities**: They work well together for comprehensive tests

## Example Test

```typescript
describe('Complete game scenario', () => {
  it('should handle complex gameplay', async () => {
    // Generate test data
    const mapGen = new MapGenerator(new Random(42));
    const map = mapGen.generateMap({ pathCount: 2 });
    
    // Build scenario
    const game = new GameScenarioBuilder()
      .withCurrency(2000)
      .withMap(map)
      .build();
    
    // Monitor performance
    const monitor = new PerformanceMonitor(game);
    monitor.start();
    
    // Simulate gameplay
    const simulator = new AsyncGameSimulator(game);
    await simulator.simulateTime(10000);
    
    // Assert results
    expect(game).toBeInState(GameState.PLAYING);
    monitor.assertPerformance({ minFps: 30 });
    
    // Custom assertions
    const tower = game.towers[0];
    expect(tower).toBeInRange(game.enemies[0], tower.range);
  });
});
```