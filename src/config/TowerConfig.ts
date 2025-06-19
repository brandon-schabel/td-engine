/**
 * Tower-specific configuration constants
 * Centralizes all tower-related statistics and upgrade values
 */

// Tower base statistics
export const TOWER_STATS = {
  BASIC: {
    damage: 8,
    range: 85,
    fireRate: 1,      // shots per second
    health: 100,
    radius: 15,
    projectileSpeed: 300,
    color: '#4CAF50'  // Green
  },
  SNIPER: {
    damage: 38,
    range: 170,
    fireRate: 0.5,    // shots per second
    health: 80,
    radius: 15,
    projectileSpeed: 500,
    color: '#2196F3'  // Blue
  },
  RAPID: {
    damage: 4,
    range: 70,
    fireRate: 4,      // shots per second
    health: 60,
    radius: 15,
    projectileSpeed: 400,
    color: '#FF9800'  // Orange
  },
  WALL: {
    damage: 0,
    range: 0,
    fireRate: 0,
    health: 150,
    radius: 16,
    projectileSpeed: 0,
    color: '#9E9E9E'  // Gray
  }
} as const;

// Tower upgrade configuration - imports from UpgradeConfig
import { TOWER_UPGRADE_CONFIG, UPGRADE_CONSTANTS } from './UpgradeConfig';

export const TOWER_UPGRADES = {
  maxLevel: UPGRADE_CONSTANTS.maxLevel,
  costMultiplier: UPGRADE_CONSTANTS.defaultCostMultiplier,
  baseCosts: TOWER_UPGRADE_CONFIG.baseCosts,
  bonusMultipliers: TOWER_UPGRADE_CONFIG.bonusMultipliers
} as const;

// Tower visual configuration
export const TOWER_VISUALS = {
  baseSize: 20,
  sizeIncreasePerLevel: 2,
  maxSizeIncrease: 6,
  upgradeDotSpacing: 8,
  upgradeDotSpacingCompact: 4,
  upgradeDotRadius: 3,
  rangeIndicatorOpacity: 0.2,
  rangeIndicatorStrokeOpacity: 0.4,
  selectedStrokeWidth: 3,
  selectedGlowRadius: 20
} as const;

// Tower placement configuration
export const TOWER_PLACEMENT = {
  ghostOpacity: 0.6,
  validPlacementColor: 'rgba(76, 175, 80, 0.6)',
  invalidPlacementColor: 'rgba(244, 67, 54, 0.6)',
  rangePreviewOpacity: 0.3
} as const;