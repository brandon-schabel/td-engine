/**
 * Player Upgrade Configuration
 * Defines permanent upgrades that players can purchase with upgrade points
 */

export enum UpgradeType {
  DAMAGE = 'DAMAGE',
  FIRE_RATE = 'FIRE_RATE',
  MOVEMENT_SPEED = 'MOVEMENT_SPEED',
  MAX_HEALTH = 'MAX_HEALTH',
  REGENERATION = 'REGENERATION'
}

export interface UpgradeDefinition {
  type: UpgradeType;
  name: string;
  description: string;
  maxLevel: number;
  costPerLevel: number; // Cost in upgrade points
  bonusPerLevel: number; // Percentage or flat bonus per level
  icon?: string;
}

export const PLAYER_UPGRADE_DEFINITIONS: Record<UpgradeType, UpgradeDefinition> = {
  [UpgradeType.DAMAGE]: {
    type: UpgradeType.DAMAGE,
    name: 'Damage Boost',
    description: 'Increases projectile damage by {value}%',
    maxLevel: 10,
    costPerLevel: 1,
    bonusPerLevel: 0.15, // 15% per level
    icon: 'DAMAGE'
  },
  [UpgradeType.FIRE_RATE]: {
    type: UpgradeType.FIRE_RATE,
    name: 'Rapid Fire',
    description: 'Increases fire rate by {value}%',
    maxLevel: 10,
    costPerLevel: 1,
    bonusPerLevel: 0.12, // 12% per level
    icon: 'FIRE_RATE'
  },
  [UpgradeType.MOVEMENT_SPEED]: {
    type: UpgradeType.MOVEMENT_SPEED,
    name: 'Swift Movement',
    description: 'Increases movement speed by {value}%',
    maxLevel: 8,
    costPerLevel: 1,
    bonusPerLevel: 0.10, // 10% per level
    icon: 'SPEED'
  },
  [UpgradeType.MAX_HEALTH]: {
    type: UpgradeType.MAX_HEALTH,
    name: 'Vitality',
    description: 'Increases maximum health by {value}%',
    maxLevel: 10,
    costPerLevel: 1,
    bonusPerLevel: 0.20, // 20% per level
    icon: 'HEALTH'
  },
  [UpgradeType.REGENERATION]: {
    type: UpgradeType.REGENERATION,
    name: 'Regeneration',
    description: 'Regenerate {value} HP per second',
    maxLevel: 5,
    costPerLevel: 2, // More expensive
    bonusPerLevel: 2, // 2 HP/s per level (flat bonus)
    icon: 'REGENERATION'
  }
};


// Helper function to get next level description
export function getNextLevelDescription(type: UpgradeType, currentLevel: number): string {
  const def = PLAYER_UPGRADE_DEFINITIONS[type];
  if (currentLevel >= def.maxLevel) {
    return 'Max level reached';
  }

  const nextLevel = currentLevel + 1;
  const value = def.type === UpgradeType.REGENERATION
    ? (def.bonusPerLevel * nextLevel).toFixed(0)
    : (def.bonusPerLevel * nextLevel * 100).toFixed(0);

  return def.description.replace('{value}', value);
}