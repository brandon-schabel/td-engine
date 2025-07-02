import type { Tower, TowerType } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import type { TowerUpdate, GameContext, GameAction, ProjectileCreateData } from './types';
import { ProjectileType } from '@/entities/Projectile';
import { GAME_MECHANICS } from '@/config/GameConfig';

// Helper function for distance calculation
function distanceTo(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Find all enemies within tower's range
function findEnemiesInRange(tower: Tower, enemies: Enemy[]): Enemy[] {
  return enemies.filter(enemy => 
    enemy.isAlive && distanceTo(tower.position, enemy.position) <= tower.range
  );
}

// Find the best target for the tower
function findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
  // Walls don't target enemies
  if (tower.towerType === TowerType.WALL) {
    return null;
  }

  const inRange = findEnemiesInRange(tower, enemies);
  
  if (inRange.length === 0) {
    return null;
  }

  // Different targeting strategies based on tower type
  switch (tower.towerType) {
    case TowerType.SNIPER:
      // Sniper targets strongest enemy (highest health)
      return inRange.reduce((strongest, enemy) => 
        enemy.health > strongest.health ? enemy : strongest
      );
      
    case TowerType.RAPID:
      // Rapid targets closest enemy for quick hits
      return inRange.reduce((closest, enemy) => {
        const closestDist = distanceTo(tower.position, closest.position);
        const enemyDist = distanceTo(tower.position, enemy.position);
        return enemyDist < closestDist ? enemy : closest;
      });
      
    case TowerType.BASIC:
    default:
      // Basic tower targets first enemy (closest to goal)
      // In real implementation, this would check progress along path
      return inRange.reduce((closest, enemy) => {
        const closestDist = distanceTo(tower.position, closest.position);
        const enemyDist = distanceTo(tower.position, enemy.position);
        return enemyDist < closestDist ? enemy : closest;
      });
  }
}

// Determine projectile type based on tower type
function getProjectileType(towerType: TowerType): ProjectileType {
  switch (towerType) {
    case TowerType.SNIPER:
      return ProjectileType.SNIPER_ROUND;
    case TowerType.RAPID:
      return ProjectileType.RAPID_PELLET;
    case TowerType.BASIC:
    default:
      return ProjectileType.BASIC_BULLET;
  }
}

// Check if tower can shoot
function canShoot(tower: Tower, currentCooldown: number): boolean {
  // Walls can't shoot
  if (tower.towerType === TowerType.WALL) {
    return false;
  }
  
  return currentCooldown <= 0;
}

// Create projectile data
function createProjectileData(tower: Tower, target: Enemy): ProjectileCreateData {
  return {
    position: { ...tower.position },
    targetId: target.id,
    damage: tower.damage,
    speed: GAME_MECHANICS.towerProjectileSpeed,
    projectileType: getProjectileType(tower.towerType)
  };
}

// Calculate special ability effects for advanced towers
function calculateSpecialEffects(tower: Tower, target: Enemy, actions: GameAction[]): void {
  switch (tower.towerType) {
    case TowerType.SNIPER:
      // Sniper has a chance to deal critical damage
      const critChance = 0.2; // 20% crit chance
      if (Math.random() < critChance) {
        actions.push({
          type: 'CREATE_EFFECT',
          effectType: 'critical_hit',
          position: target.position,
          data: { multiplier: 2.0 }
        });
      }
      break;
      
    case TowerType.RAPID:
      // Rapid tower might apply a brief slow
      const slowChance = 0.1; // 10% chance to slow
      if (Math.random() < slowChance) {
        actions.push({
          type: 'CREATE_EFFECT',
          effectType: 'slow',
          position: target.position,
          data: { duration: 1000, multiplier: 0.5 }
        });
      }
      break;
  }
}

// Main tower update logic
export function updateTower(
  tower: Tower,
  context: GameContext
): TowerUpdate {
  const actions: GameAction[] = [];
  const update: TowerUpdate = { actions };

  if (!tower.isAlive) {
    return update;
  }

  // Update cooldown
  const newCooldown = Math.max(0, tower.currentCooldown - context.deltaTime);
  if (newCooldown !== tower.currentCooldown) {
    update.cooldown = newCooldown;
  }

  // Walls don't shoot, just exist as obstacles
  if (tower.towerType === TowerType.WALL) {
    return update;
  }

  // Find and track target
  const target = findTarget(tower, context.enemies);
  update.targetId = target ? target.id : null;

  // Try to shoot if we have a target and cooldown is ready
  if (target && canShoot(tower, newCooldown)) {
    // Create projectile
    const projectileData = createProjectileData(tower, target);
    actions.push({
      type: 'SPAWN_PROJECTILE',
      projectile: projectileData
    });

    // Play shooting sound
    actions.push({
      type: 'PLAY_SOUND',
      soundType: `tower_shoot_${tower.towerType.toLowerCase()}`,
      position: tower.position
    });

    // Reset cooldown
    update.cooldown = tower.cooldownTime;

    // Calculate special effects
    calculateSpecialEffects(tower, target, actions);
  }

  return update;
}

// Calculate tower effectiveness (for UI/analytics)
export function calculateTowerEffectiveness(
  tower: Tower,
  enemiesInRange: Enemy[]
): {
  coverage: number;
  targetingEfficiency: number;
  damagePerSecond: number;
} {
  const maxTargets = Math.PI * tower.range * tower.range / 10000; // Rough estimate
  const coverage = Math.min(1, enemiesInRange.length / maxTargets);
  
  const targetingEfficiency = enemiesInRange.length > 0 ? 1 : 0;
  
  const damagePerSecond = tower.damage * tower.fireRate;
  
  return {
    coverage,
    targetingEfficiency,
    damagePerSecond
  };
}

// Check if tower placement is strategic
export function evaluateTowerPlacement(
  tower: Tower,
  context: GameContext
): {
  isChokepointCovered: boolean;
  nearbyTowerSynergy: number;
  pathCoverage: number;
} {
  // Check if near other towers for synergy
  const nearbyTowers = context.towers.filter(t => 
    t.id !== tower.id && 
    t.isAlive && 
    distanceTo(tower.position, t.position) < 200
  );
  
  const synergyScore = nearbyTowers.reduce((score, nearby) => {
    // Different tower types provide better synergy
    if (nearby.towerType !== tower.towerType) {
      return score + 0.3;
    }
    return score + 0.1;
  }, 0);
  
  // In a real implementation, we'd check actual path coverage
  const pathCoverage = 0.5; // Placeholder
  
  return {
    isChokepointCovered: nearbyTowers.length >= 2,
    nearbyTowerSynergy: Math.min(1, synergyScore),
    pathCoverage
  };
}