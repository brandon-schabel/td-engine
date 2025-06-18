# Infinite Wave System Plan

## Core Design Philosophy

The infinite wave system uses logarithmic scaling to create a challenging but fair progression where:
- Waves 1-10: Tutorial/onboarding difficulty
- Waves 11-30: Steady progression introducing all mechanics
- Waves 31-50: Challenging but achievable for good players
- Waves 50+: Extreme challenge for dedicated players

## 1. Logarithmic Scaling Formulas

### Difficulty Score Formula
```typescript
// Base difficulty score that drives all other scaling
difficultyScore = 10 + (20 * Math.log10(waveNumber + 9))

// Examples:
// Wave 1: 10 + 20 * log10(10) = 30
// Wave 10: 10 + 20 * log10(19) = 35.6
// Wave 30: 10 + 20 * log10(39) = 41.8
// Wave 50: 10 + 20 * log10(59) = 45.4
// Wave 100: 10 + 20 * log10(109) = 50.7
```

### Key Scaling Principles
- Early waves (1-10): Slow growth to allow learning
- Mid waves (11-30): Moderate growth introducing complexity
- Late waves (31-50): Diminishing returns on difficulty
- End game (50+): Very slow growth, skill becomes primary factor

## 2. Enemy Health & Damage Scaling

### Health Scaling
```typescript
// Base health multiplier with logarithmic growth
healthMultiplier = 1 + (0.5 * Math.log10(waveNumber))

// Enemy specific formulas:
basicHealth = 75 * healthMultiplier
fastHealth = 45 * healthMultiplier  
tankHealth = 300 * healthMultiplier
flyingHealth = 60 * healthMultiplier
bossHealth = 1500 * healthMultiplier

// Examples at key waves:
// Wave 1: 1.0x multiplier (75 HP basic)
// Wave 10: 1.5x multiplier (112 HP basic)
// Wave 30: 1.74x multiplier (130 HP basic)
// Wave 50: 1.85x multiplier (139 HP basic)
```

### Damage Scaling
```typescript
// More conservative damage scaling to prevent one-shots
damageMultiplier = 1 + (0.3 * Math.log10(waveNumber))

// Wave 50: ~1.51x damage multiplier
```

## 3. Enemy Quantity & Timing

### Total Enemy Count
```typescript
// Sigmoid-like growth that plateaus
baseEnemyCount = 8 + Math.floor(12 * Math.log10(waveNumber + 1))
maxEnemyCount = Math.min(baseEnemyCount, 80) // Cap at 80 enemies

// Wave 1: 8 enemies
// Wave 10: 20 enemies  
// Wave 30: 35 enemies
// Wave 50: 44 enemies
// Wave 100+: 80 enemies (capped)
```

### Spawn Timing
```typescript
// Faster spawns but with limits
spawnDelay = Math.max(0.5, 2.0 - (0.1 * Math.log10(waveNumber)))

// Wave 1: 2.0s between spawns
// Wave 50: 1.3s between spawns
// Cap at 0.5s minimum
```

## 4. Enemy Type Introduction & Mix

### Wave Thresholds
- Waves 1-3: BASIC only
- Waves 4-7: BASIC + FAST
- Waves 8-15: BASIC + FAST + TANK
- Waves 16-25: All ground types + FLYING
- Waves 26+: All types including BOSS

### Enemy Mix Ratios
```typescript
function getEnemyMix(waveNumber: number): EnemyMix {
  if (waveNumber <= 3) {
    return { basic: 1.0 };
  }
  
  if (waveNumber <= 7) {
    return { basic: 0.7, fast: 0.3 };
  }
  
  if (waveNumber <= 15) {
    return { basic: 0.5, fast: 0.35, tank: 0.15 };
  }
  
  if (waveNumber <= 25) {
    return { basic: 0.4, fast: 0.3, tank: 0.2, flying: 0.1 };
  }
  
  // Wave 26+
  const bossWave = waveNumber % 10 === 0;
  if (bossWave) {
    return { basic: 0.3, fast: 0.25, tank: 0.25, flying: 0.15, boss: 0.05 };
  }
  
  return { basic: 0.35, fast: 0.3, tank: 0.2, flying: 0.15 };
}
```

## 5. Reward Scaling

### Currency Rewards
```typescript
// Logarithmic growth with wave bonuses
baseReward = 5 * waveNumber;
scalingBonus = Math.floor(10 * Math.log10(waveNumber + 1));
waveReward = baseReward + scalingBonus;

// Milestone bonuses
if (waveNumber % 10 === 0) {
  waveReward *= 2; // Double rewards every 10 waves
}

// Examples:
// Wave 1: 5 + 3 = 8 currency
// Wave 10: 50 + 13 = 63 currency (×2 = 126)
// Wave 30: 150 + 17 = 167 currency (×2 = 334)
// Wave 50: 250 + 20 = 270 currency (×2 = 540)
```

### Kill Rewards
```typescript
// Per-enemy rewards scale slightly
killReward = Math.floor(enemyBaseReward * (1 + 0.1 * Math.log10(waveNumber)));
```

## 6. Spawn Patterns & Special Mechanics

### Pattern Progression
```typescript
function getSpawnPattern(waveNumber: number): SpawnPattern {
  const patterns = [
    'SINGLE_POINT',      // Waves 1-2
    'RANDOM',            // Waves 3-5
    'ROUND_ROBIN',       // Waves 6-8
    'DISTRIBUTED',       // Waves 9-12
    'EDGE_FOCUSED',      // Waves 13-16
    'CORNER_FOCUSED',    // Waves 17-20
    'BURST_SPAWN',       // Waves 21-25
    'PINCER_MOVEMENT',   // Waves 26-30
    'ADAPTIVE_SPAWN',    // Waves 31-40
    'CHAOS_MODE'         // Waves 41+
  ];
  
  // Cycle through patterns with increasing complexity
  const patternIndex = Math.min(Math.floor(waveNumber / 3), patterns.length - 1);
  return patterns[patternIndex];
}
```

### Special Wave Events
- **Boss Waves** (every 10 waves): Include 1-2 boss enemies
- **Swarm Waves** (waves ending in 5): 50% more enemies, but weaker
- **Elite Waves** (waves ending in 7): Fewer but much stronger enemies
- **Speed Waves** (waves ending in 3): All FAST enemies

## 7. Difficulty Checkpoints

### Soft Caps
- Wave 50: Primary difficulty plateau (achievable goal)
- Wave 100: Secondary plateau (extreme challenge)
- Wave 150+: Minimal scaling, pure endurance

### Scaling Adjustments
```typescript
function getDifficultyMultiplier(waveNumber: number): number {
  if (waveNumber <= 50) {
    return 1.0; // Normal scaling
  } else if (waveNumber <= 100) {
    return 0.5; // Half scaling rate
  } else {
    return 0.25; // Quarter scaling rate
  }
}
```

## 8. Implementation Plan

### Phase 1: Core Algorithm
1. Create `InfiniteWaveGenerator` class
2. Implement scaling formulas
3. Add wave generation logic

### Phase 2: Integration
1. Modify `WaveManager` to support infinite waves
2. Update `Game.ts` to use wave generator after wave 10
3. Add configuration options

### Phase 3: Balancing
1. Create test scenarios for waves 1, 10, 30, 50, 100
2. Adjust scaling parameters based on playtesting
3. Add telemetry for balance monitoring

### Phase 4: Polish
1. Add wave preview UI
2. Create milestone reward notifications
3. Add leaderboard for highest wave reached

## Configuration Parameters

```typescript
interface InfiniteWaveConfig {
  // Scaling rates
  healthScalingRate: number;      // 0.5
  damageScalingRate: number;      // 0.3
  enemyCountScalingRate: number;  // 12
  spawnDelayScalingRate: number;  // 0.1
  
  // Caps
  maxEnemyCount: number;          // 80
  minSpawnDelay: number;          // 0.5
  
  // Rewards
  baseRewardPerWave: number;      // 5
  rewardScalingBonus: number;     // 10
  milestoneMultiplier: number;    // 2
  
  // Difficulty plateaus
  primaryPlateau: number;         // 50
  secondaryPlateau: number;       // 100
  
  // Special wave intervals
  bossWaveInterval: number;       // 10
  swarmWaveInterval: number;      // 5
  eliteWaveInterval: number;      // 7
}
```

## Example Wave Configurations

### Wave 1
- Enemies: 8 BASIC (75 HP each)
- Pattern: SINGLE_POINT
- Spawn Delay: 2.0s
- Reward: 8 currency

### Wave 10
- Enemies: 10 BASIC, 7 FAST, 3 TANK
- Pattern: DISTRIBUTED
- Spawn Delay: 1.9s
- Reward: 126 currency (milestone bonus)

### Wave 30
- Enemies: 12 BASIC, 10 FAST, 7 TANK, 6 FLYING
- Pattern: ADAPTIVE_SPAWN
- Spawn Delay: 1.5s
- Reward: 334 currency (milestone bonus)

### Wave 50
- Enemies: 15 BASIC, 13 FAST, 9 TANK, 7 FLYING
- Pattern: CHAOS_MODE
- Spawn Delay: 1.3s
- Reward: 540 currency (milestone bonus)
- Special: 1 BOSS enemy

## Testing Strategy

1. **Unit Tests**: Test scaling formulas with known inputs/outputs
2. **Integration Tests**: Verify wave generation produces valid configurations
3. **Balance Tests**: Simulate player progression through waves 1-50
4. **Stress Tests**: Ensure performance at wave 100+

## Success Metrics

- Average player reaches wave 20-30
- Good players reach wave 50 without extreme difficulty
- Wave 100 remains achievable but very challenging
- No performance degradation up to wave 200
- Reward scaling keeps upgrades meaningful