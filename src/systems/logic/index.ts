// Export all logic systems
export * from './types';
export * from './EnemyLogic';
export * from './TowerLogic';
export * from './PlayerLogic';
export * from './ProjectileLogic';
export * from './CombatLogic';

// Re-export commonly used functions for convenience
export { updateEnemy, hasEnemyReachedEnd, getEnemyProgress } from './EnemyLogic';
export { updateTower, calculateTowerEffectiveness, evaluateTowerPlacement } from './TowerLogic';
export { updatePlayer, calculatePlayerStats, isPlayerInDanger } from './PlayerLogic';
export { updateProjectile } from './ProjectileLogic';
export { 
  calculateDamage, 
  calculateDamageOverTime, 
  calculateAreaDamage, 
  generateCombatActions,
  calculateHealing,
  calculateShieldMitigation,
  calculateKillReward 
} from './CombatLogic';