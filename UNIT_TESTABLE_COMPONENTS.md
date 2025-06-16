# Unit-Testable Components in TD Engine

This document lists all unit-testable components found in the TD Engine codebase, organized by category.

## 1. Mathematical Utilities

### Vector2Utils (`src/utils/Vector2.ts`)
- **Pure Functions:**
  - `distance(a, b)` - Calculate distance between two points
  - `normalize(v)` - Normalize a vector to unit length
  - `multiply(v, scalar)` - Scale a vector
  - `add(a, b)` - Add two vectors
  - `subtract(a, b)` - Subtract vectors
  - `length(v)` - Get vector magnitude

### PathGenerator (`src/systems/PathGenerator.ts`)
- **Mathematical Calculations:**
  - `normalize(vector)` - Vector normalization
  - `distance(a, b)` - Distance calculation
  - `calculatePathLength(waypoints)` - Total path length
  - `getPerpendicularDirection(direction)` - Perpendicular vector calculation
  - `smoothPath(waypoints, smoothness)` - Path smoothing algorithm
  - `getLinePoints(start, end)` - Bresenham's line algorithm

### Pathfinder (`src/systems/Pathfinder.ts`)
- **Algorithms:**
  - `findPath(start, end)` - A* pathfinding algorithm
  - `heuristic(a, b)` - Manhattan distance heuristic
  - `reconstructPath(endNode)` - Path reconstruction
  - `gridPathToWorld(gridPath)` - Coordinate conversion

## 2. Game Logic & State Management

### CooldownManager (`src/utils/CooldownManager.ts`)
- **Pure Functions:**
  - `updateCooldown(currentCooldown, deltaTime)` - Update cooldown timer
  - `isReady(cooldown)` - Check if cooldown expired
  - `startCooldown(cooldownTime)` - Initialize cooldown
  - `getCooldownPercentage(current, max)` - Calculate cooldown progress
  - `getCooldownSeconds(currentCooldown)` - Convert to seconds for display

### ResourceManager (`src/systems/ResourceManager.ts`)
- **State Management:**
  - `getResource(type)` - Get resource value
  - `setResource(type, value)` - Set resource value
  - `addResource(type, amount)` - Add to resource
  - `spendResource(type, amount)` - Spend resource with validation
  - `canAfford(type, amount)` - Check affordability
  - `canAffordMultiple(costs)` - Check multiple resource costs
  - `isGameOver()` - Check game over condition
  - `enemyKilled(currency, score)` - Process enemy kill rewards

### ScoreManager (`src/systems/ScoreManager.ts`)
- **Data Processing:**
  - `saveScore(stats)` - Save and rank scores
  - `getScores()` - Retrieve all scores
  - `getTopScores(limit)` - Get top N scores
  - `getPersonalBest()` - Get highest score
  - `getAverageScore()` - Calculate average score
  - `getScoreStats()` - Aggregate statistics

### WaveManager (`src/systems/WaveManager.ts`)
- **Wave Logic:**
  - `startWave(waveNumber)` - Initialize wave
  - `calculateSpawnPointDistribution(count, pattern)` - Spawn distribution
  - `selectSpawnPoint(index, pattern)` - Choose spawn location
  - `isWaveComplete()` - Check wave completion
  - `hasNextWave()` - Check if more waves exist
  - `getWaveInfo(waveNumber)` - Get wave configuration

## 3. Inventory System

### Inventory (`src/systems/Inventory.ts`)
- **Item Management:**
  - `addItem(item, slot)` - Add item with stacking logic
  - `removeItem(slot, quantity)` - Remove items
  - `moveItem(fromSlot, toSlot)` - Move/swap items
  - `canStackItems(item1, item2)` - Check stackability
  - `findStackableSlot(item)` - Find available stack
  - `sortInventory()` - Sort items by type/rarity
  - `calculateItemValue(item)` - Calculate item worth
  - `getStatistics()` - Inventory statistics

## 4. Player Systems

### PlayerProgression (`src/entities/player/PlayerProgression.ts`)
- **Upgrade Calculations:**
  - `upgrade(type)` - Apply upgrade
  - `canUpgrade(type)` - Check upgrade availability
  - `getDamageMultiplier()` - Calculate damage bonus
  - `getSpeedMultiplier()` - Calculate speed bonus
  - `getFireRateMultiplier()` - Calculate fire rate bonus
  - `calculateExperienceForNextLevel()` - XP requirement formula
  - `canPrestige()` - Check prestige eligibility
  - `prestige()` - Prestige calculation and reset

### PlayerPowerUps (`src/entities/player/PlayerPowerUps.ts`)
- **Power-Up Management:**
  - `addPowerUp(type, duration, effects)` - Add/extend power-up
  - `isStrongerEffect(new, existing)` - Compare effect strength
  - `recalculateEffects()` - Aggregate active effects
  - `mitigateDamage(damage)` - Shield damage calculation
  - `getRemainingDuration(type)` - Time remaining
  - `getEfficiencyMetrics()` - Power-up usage metrics
  - `getRecommendedPowerUps()` - Usage-based recommendations

### PlayerCombat (`src/entities/player/PlayerCombat.ts`)
- **Combat Calculations:**
  - `getAimAngle()` - Calculate aim direction
  - `canShoot()` - Check shooting availability
  - `calculateDamage()` - Damage with multipliers
  - `updateFireRate(rate)` - Fire rate calculation
  - `getAimerLine(position)` - Aiming visualization

## 5. Event System

### EventEmitter (`src/utils/EventEmitter.ts`)
- **Event Management:**
  - `on(event, listener)` - Add event listener
  - `off(event, listener)` - Remove listener
  - `emit(event, data)` - Trigger event
  - `removeAllListeners(event)` - Clear listeners

## 6. Configuration & Validation

### GameConfig (`src/config/GameConfig.ts`)
- **Constants & Configuration:**
  - Tower costs mapping
  - Base player stats
  - Game mechanics constants
  - Upgrade configurations
  - Currency configurations
  - Item drop chances

## 7. Data Structures

### GameState (`src/core/GameState.ts`)
- **State Enum:**
  - State transitions validation
  - State checking logic

## 8. Utility Functions

### Grid System (`src/systems/Grid.ts`)
- **Grid Calculations:**
  - `isInBounds(x, y)` - Boundary checking
  - `worldToGrid(x, y)` - Coordinate conversion
  - `gridToWorld(x, y)` - Coordinate conversion
  - `isWalkable(x, y)` - Walkability check
  - `getWalkableNeighbors(x, y)` - Neighbor finding

## Testing Priorities

### High Priority (Core Game Logic):
1. Vector2Utils - Foundation for all position/movement
2. CooldownManager - Core timing mechanism
3. ResourceManager - Game economy
4. Inventory - Item management
5. PathFinder - Enemy movement
6. WaveManager - Enemy spawning

### Medium Priority (Player Systems):
1. PlayerProgression - Upgrade system
2. PlayerPowerUps - Temporary effects
3. PlayerCombat - Shooting mechanics
4. ScoreManager - Score tracking

### Lower Priority (Utilities):
1. EventEmitter - Event system
2. PathGenerator - Map generation
3. Configuration constants

## Test Coverage Guidelines

Each testable component should have tests for:
- **Pure Functions**: All input/output combinations
- **State Management**: State transitions and validation
- **Edge Cases**: Boundary conditions, null/undefined handling
- **Error Conditions**: Invalid inputs, error states
- **Integration Points**: How components interact

## Example Test Structure

```typescript
describe('ComponentName', () => {
  describe('functionName', () => {
    it('should handle normal case', () => {
      // Test normal operation
    });
    
    it('should handle edge case', () => {
      // Test boundaries
    });
    
    it('should handle error case', () => {
      // Test error conditions
    });
  });
});
```