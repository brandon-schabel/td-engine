# Upgrade System Documentation

## Overview
The TD Engine upgrade system provides a flexible and extensible framework for upgrading both towers and players. The system is designed with modularity, configuration-driven development, and user experience in mind.

## Architecture

### Core Components

1. **BaseUpgradeManager** (`src/systems/BaseUpgradeManager.ts`)
   - Abstract base class providing common upgrade functionality
   - Handles cost calculations, level tracking, and upgrade application
   - Extensible for any upgradeable entity type

2. **TowerUpgradeManager** (`src/systems/TowerUpgradeManager.ts`)
   - Extends BaseUpgradeManager for tower-specific logic
   - Implements optimal upgrade path calculation
   - Supports batch upgrades and DPS calculations

3. **PlayerUpgradeManager** (`src/systems/PlayerUpgradeManager.ts`)
   - Extends BaseUpgradeManager for player-specific logic
   - Includes synergy calculations and survivability scoring
   - Provides upgrade recommendations based on playstyle

4. **UpgradeService** (`src/services/UpgradeService.ts`)
   - High-level service layer for all upgrade operations
   - Manages resource spending and validation
   - Provides unified interface for UI components

### Configuration

All upgrade settings are centralized in `src/config/UpgradeConfig.ts`:

```typescript
// Tower Upgrades
- DAMAGE: Base cost 15, +30% per level
- RANGE: Base cost 20, +25% per level  
- FIRE_RATE: Base cost 25, +20% per level

// Player Upgrades
- DAMAGE: Base cost 25, +40% per level
- SPEED: Base cost 20, +30% per level
- FIRE_RATE: Base cost 30, +25% per level
- HEALTH: Base cost 35, +50% per level
- REGENERATION: Base cost 40, +1.5 HP/s per level
```

### Cost Calculation

Upgrade costs follow an exponential formula:
```
cost = baseCost × costMultiplier^currentLevel
```

Default cost multiplier is 1.5x, creating this progression:
- Level 0→1: 1x base cost
- Level 1→2: 1.5x base cost
- Level 2→3: 2.25x base cost
- Level 3→4: 3.375x base cost
- Level 4→5: 5.0625x base cost

## Features

### 1. Smart Upgrade Recommendations
The system analyzes game state and suggests optimal upgrades based on:
- Cost efficiency (effect increase per currency spent)
- Current game phase (early/mid/late game)
- Entity state (e.g., low health prioritizes survivability)
- Enemy composition

### 2. Upgrade Synergies
Certain upgrade combinations provide bonus effects:
- **Tank Build**: Health + Regeneration → +15% effective health
- **Glass Cannon**: Damage + Fire Rate → +20% DPS
- **Mobile Gunner**: Speed + Fire Rate → +10% accuracy while moving

### 3. Bulk Upgrades
Players can purchase multiple upgrade levels at once with discounts:
- 2 levels: 5% discount
- 3+ levels: 10% discount

### 4. Enhanced UI
The `EnhancedUpgradeDialog` provides:
- Visual upgrade recommendations
- Effect previews (current → next)
- Efficiency ratings
- Synergy indicators
- Bulk purchase mode

## Usage Examples

### Basic Upgrade
```typescript
const result = upgradeService.upgradePlayer(player, PlayerUpgradeType.DAMAGE);
if (result.success) {
  console.log(`Upgraded! Cost: ${result.cost}, New Level: ${result.newLevel}`);
}
```

### Get Recommendations
```typescript
const recommendations = upgradeService.getUpgradeRecommendations(
  towers, 
  player, 
  5 // max recommendations
);
recommendations.forEach(rec => {
  console.log(`${rec.entityType} ${rec.upgradeType}: ${rec.reason}`);
});
```

### Bulk Upgrade
```typescript
const upgrades = [
  { type: PlayerUpgradeType.DAMAGE, levels: 2 },
  { type: PlayerUpgradeType.HEALTH, levels: 3 }
];
const result = upgradeService.upgradeTowerMultiple(tower, upgrades);
```

## Future Enhancements

1. **Upgrade Trees**: Branching paths with mutually exclusive choices
2. **Prestige System**: Reset upgrades for permanent bonuses
3. **Conditional Upgrades**: Unlock based on achievements or game progress
4. **Upgrade Combos**: Special effects when upgrading in specific sequences
5. **Dynamic Pricing**: Adjust costs based on game difficulty or economy state

## Configuration Tips

### Balancing Upgrade Costs
Modify cost multipliers in `UpgradeConfig.ts`:
```typescript
costScaling: {
  exponential: 1.5,    // Standard (current)
  moderate: 1.35,      // Gentler progression
  aggressive: 1.75,    // Steeper curve
  linear: 1.0          // No scaling (for testing)
}
```

### Adjusting Effects
Change bonus multipliers to fine-tune power progression:
```typescript
bonusMultipliers: {
  DAMAGE: 0.3,      // 30% increase per level
  RANGE: 0.25,      // 25% increase per level
  FIRE_RATE: 0.2    // 20% increase per level
}
```

### Adding New Upgrade Types
1. Add to the appropriate enum (UpgradeType or PlayerUpgradeType)
2. Add configuration to UpgradeConfig.ts
3. Implement upgrade logic in the entity class
4. Update UI components to display the new upgrade

## Testing
The upgrade system includes comprehensive unit tests covering:
- Cost calculations
- Level progression
- Synergy detection
- Recommendation algorithms
- Resource validation

Run tests with: `bun test`