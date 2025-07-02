import type { DamageSource, Damageable, CombatResult, GameAction } from './types';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';

// Constants for combat calculations
const BASE_CRIT_CHANCE = 0.05; // 5% base crit chance
const BASE_CRIT_MULTIPLIER = 1.5;
const ARMOR_REDUCTION_FORMULA = 0.06; // Each point of armor reduces damage by 0.6%
const MAGIC_RESIST_REDUCTION_FORMULA = 0.06;
const MAX_DAMAGE_REDUCTION = 0.75; // 75% max damage reduction

// Calculate critical hit
function calculateCritical(
  source: DamageSource
): { isCrit: boolean; multiplier: number } {
  const critChance = source.critChance || BASE_CRIT_CHANCE;
  const critMultiplier = source.critMultiplier || BASE_CRIT_MULTIPLIER;
  
  const isCrit = Math.random() < critChance;
  
  return {
    isCrit,
    multiplier: isCrit ? critMultiplier : 1.0
  };
}

// Calculate armor reduction
function calculateArmorReduction(armor: number): number {
  if (armor <= 0) return 0;
  
  // Diminishing returns formula
  const reduction = (armor * ARMOR_REDUCTION_FORMULA) / (1 + armor * ARMOR_REDUCTION_FORMULA);
  return Math.min(reduction, MAX_DAMAGE_REDUCTION);
}

// Calculate magic resistance reduction
function calculateMagicResistReduction(magicResist: number): number {
  if (magicResist <= 0) return 0;
  
  // Similar to armor but for magic damage
  const reduction = (magicResist * MAGIC_RESIST_REDUCTION_FORMULA) / (1 + magicResist * MAGIC_RESIST_REDUCTION_FORMULA);
  return Math.min(reduction, MAX_DAMAGE_REDUCTION);
}

// Main damage calculation
export function calculateDamage(
  source: DamageSource,
  target: Damageable
): CombatResult {
  // Check if target is invulnerable
  if (target.health <= 0) {
    return {
      finalDamage: 0,
      isCrit: false,
      damageType: source.damageType || 'physical',
      blocked: true,
      overkill: 0
    };
  }

  // Calculate critical hit
  const { isCrit, multiplier } = calculateCritical(source);
  let damage = source.damage * multiplier;

  // Apply damage type resistances
  const damageType = source.damageType || 'physical';
  let reduction = 0;

  switch (damageType) {
    case 'physical':
      reduction = calculateArmorReduction(target.armor || 0);
      break;
    case 'magical':
      reduction = calculateMagicResistReduction(target.magicResist || 0);
      break;
    case 'true':
      // True damage ignores all resistances
      reduction = 0;
      break;
  }

  // Apply general damage reduction (from abilities, etc.)
  if (target.damageReduction) {
    reduction = Math.min(MAX_DAMAGE_REDUCTION, reduction + target.damageReduction);
  }

  // Calculate final damage
  const finalDamage = Math.max(1, Math.floor(damage * (1 - reduction)));

  // Calculate overkill
  const overkill = Math.max(0, finalDamage - target.health);

  return {
    finalDamage,
    isCrit,
    damageType,
    blocked: false,
    overkill
  };
}

// Calculate damage over time
export function calculateDamageOverTime(
  damage: number,
  duration: number,
  tickRate: number = 1000 // Default 1 second ticks
): {
  damagePerTick: number;
  totalTicks: number;
  totalDamage: number;
} {
  const totalTicks = Math.floor(duration / tickRate);
  const damagePerTick = damage / totalTicks;
  
  return {
    damagePerTick,
    totalTicks,
    totalDamage: damagePerTick * totalTicks
  };
}

// Calculate area damage with falloff
export function calculateAreaDamage(
  baseDamage: number,
  centerDistance: number,
  maxRadius: number,
  falloffType: 'linear' | 'exponential' = 'linear'
): number {
  if (centerDistance >= maxRadius) {
    return 0;
  }
  
  const distanceRatio = centerDistance / maxRadius;
  
  switch (falloffType) {
    case 'linear':
      return baseDamage * (1 - distanceRatio);
    case 'exponential':
      return baseDamage * Math.pow(1 - distanceRatio, 2);
    default:
      return baseDamage;
  }
}

// Generate combat actions based on result
export function generateCombatActions(
  result: CombatResult,
  sourceId: string,
  targetId: string,
  targetPosition: { x: number; y: number }
): GameAction[] {
  const actions: GameAction[] = [];

  // Damage action is handled by the caller
  
  // Critical hit effect
  if (result.isCrit) {
    actions.push({
      type: 'CREATE_EFFECT',
      effectType: 'critical_hit',
      position: targetPosition,
      data: { damage: result.finalDamage }
    });
    
    actions.push({
      type: 'PLAY_SOUND',
      soundType: 'critical_hit',
      position: targetPosition
    });
  }
  
  // Overkill effect
  if (result.overkill > 0) {
    actions.push({
      type: 'CREATE_EFFECT',
      effectType: 'overkill',
      position: targetPosition,
      data: { overkillDamage: result.overkill }
    });
  }
  
  // Blocked/absorbed effect
  if (result.blocked) {
    actions.push({
      type: 'CREATE_EFFECT',
      effectType: 'damage_blocked',
      position: targetPosition
    });
    
    actions.push({
      type: 'PLAY_SOUND',
      soundType: 'damage_blocked',
      position: targetPosition
    });
  }

  return actions;
}

// Calculate healing with modifiers
export function calculateHealing(
  baseHeal: number,
  target: Damageable,
  healingModifier: number = 1.0
): {
  effectiveHeal: number;
  overheal: number;
  percentHealed: number;
} {
  const modifiedHeal = baseHeal * healingModifier;
  const missingHealth = target.maxHealth - target.health;
  const effectiveHeal = Math.min(modifiedHeal, missingHealth);
  const overheal = modifiedHeal - effectiveHeal;
  const percentHealed = effectiveHeal / target.maxHealth;
  
  return {
    effectiveHeal,
    overheal,
    percentHealed
  };
}

// Calculate damage mitigation from shields/barriers
export function calculateShieldMitigation(
  incomingDamage: number,
  shieldHealth: number,
  shieldEfficiency: number = 1.0
): {
  damageToShield: number;
  damageToHealth: number;
  shieldRemaining: number;
} {
  const effectiveDamage = incomingDamage / shieldEfficiency;
  
  if (effectiveDamage <= shieldHealth) {
    return {
      damageToShield: effectiveDamage,
      damageToHealth: 0,
      shieldRemaining: shieldHealth - effectiveDamage
    };
  }
  
  const overflow = effectiveDamage - shieldHealth;
  return {
    damageToShield: shieldHealth,
    damageToHealth: overflow * shieldEfficiency,
    shieldRemaining: 0
  };
}

// Calculate experience reward for kill
export function calculateKillReward(
  enemyLevel: number,
  enemyType: string,
  playerLevel: number
): {
  experience: number;
  currency: number;
  bonusMultiplier: number;
} {
  // Base rewards (would come from config)
  const baseExp = 10;
  const baseCurrency = 5;
  
  // Level difference modifier
  const levelDiff = enemyLevel - playerLevel;
  const levelModifier = Math.max(0.5, Math.min(1.5, 1 + levelDiff * 0.1));
  
  // Enemy type modifier
  const typeModifier = enemyType === 'BOSS' ? 10 :
                      enemyType === 'TANK' ? 2 :
                      enemyType === 'FAST' ? 0.8 :
                      1;
  
  const bonusMultiplier = levelModifier * typeModifier;
  
  return {
    experience: Math.floor(baseExp * bonusMultiplier),
    currency: Math.floor(baseCurrency * bonusMultiplier),
    bonusMultiplier
  };
}