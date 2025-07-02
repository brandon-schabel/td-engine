import type { Projectile } from '@/entities/Projectile';
import type { Enemy } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { ProjectileUpdate, GameContext, GameAction } from './types';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';

// Helper function for distance calculation
function distanceTo(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Check collision between projectile and enemy
function checkCollision(projectile: Projectile, enemy: Enemy): boolean {
  const distance = distanceTo(projectile.position, enemy.position);
  const collisionRadius = projectile.radius + enemy.radius;
  return distance <= collisionRadius;
}

// Calculate homing movement towards target
function calculateHomingMovement(
  projectile: Projectile,
  target: Enemy,
  speed: number
): Vector2 {
  const dx = target.position.x - projectile.position.x;
  const dy = target.position.y - projectile.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 1) {
    return { x: 0, y: 0 };
  }
  
  // Normalize and apply speed
  return {
    x: (dx / distance) * speed,
    y: (dy / distance) * speed
  };
}

// Find new target if original is lost
function findNewTarget(
  projectile: Projectile,
  enemies: Enemy[],
  maxRetargetDistance: number = 200
): Enemy | null {
  const aliveEnemies = enemies.filter(e => e.isAlive);
  
  if (aliveEnemies.length === 0) {
    return null;
  }
  
  // Find enemies within retarget range
  const nearbyEnemies = aliveEnemies.filter(e => 
    distanceTo(projectile.position, e.position) <= maxRetargetDistance
  );
  
  if (nearbyEnemies.length === 0) {
    return null;
  }
  
  // Return closest enemy
  return nearbyEnemies.reduce((closest, enemy) => {
    const closestDist = distanceTo(projectile.position, closest.position);
    const enemyDist = distanceTo(projectile.position, enemy.position);
    return enemyDist < closestDist ? enemy : closest;
  });
}

// Check if projectile should expire
function checkLifetime(age: number, maxLifetime: number): boolean {
  return age >= maxLifetime;
}

// Main projectile update logic
export function updateProjectile(
  projectile: Projectile,
  context: GameContext,
  state: {
    age: number;
    hasHitTarget: boolean;
  }
): ProjectileUpdate {
  const actions: GameAction[] = [];
  const update: ProjectileUpdate = { actions };

  if (!projectile.isAlive) {
    update.isAlive = false;
    return update;
  }

  // Update age
  const newAge = state.age + context.deltaTime;
  
  // Check lifetime
  if (checkLifetime(newAge, GAMEPLAY_CONSTANTS.projectiles.lifetime)) {
    update.isAlive = false;
    
    // Create expire effect
    actions.push({
      type: 'CREATE_EFFECT',
      effectType: 'projectile_expire',
      position: projectile.position
    });
    
    return update;
  }

  // Find current target
  let currentTarget: Enemy | null = null;
  if (projectile.target) {
    // Check if target still exists and is alive
    currentTarget = context.enemies.find(e => e.id === projectile.target?.id && e.isAlive) || null;
    
    // If target is lost, try to find a new one (for homing projectiles)
    if (!currentTarget && projectile.projectileType !== 'PLAYER_SHOT') {
      currentTarget = findNewTarget(projectile, context.enemies);
    }
  }

  // Update movement
  if (currentTarget) {
    // Homing projectile - move towards target
    const velocity = calculateHomingMovement(projectile, currentTarget, projectile.speed);
    update.velocity = velocity;
    
    // Update position
    const deltaSeconds = context.deltaTime / 1000;
    update.position = {
      x: projectile.position.x + velocity.x * deltaSeconds,
      y: projectile.position.y + velocity.y * deltaSeconds
    };
    
    // Check collision with target
    if (checkCollision(projectile, currentTarget)) {
      update.isAlive = false;
      
      // Apply damage
      actions.push({
        type: 'DAMAGE_ENTITY',
        targetId: currentTarget.id,
        damage: projectile.damage,
        sourceId: projectile.id
      });
      
      // Create hit effect
      actions.push({
        type: 'CREATE_EFFECT',
        effectType: 'projectile_hit',
        position: currentTarget.position,
        data: { 
          projectileType: projectile.projectileType,
          damage: projectile.damage 
        }
      });
      
      // Play hit sound
      actions.push({
        type: 'PLAY_SOUND',
        soundType: 'projectile_hit',
        position: currentTarget.position
      });
    }
  } else if (projectile.velocity) {
    // Non-homing projectile or lost target - maintain velocity
    const deltaSeconds = context.deltaTime / 1000;
    update.position = {
      x: projectile.position.x + projectile.velocity.x * deltaSeconds,
      y: projectile.position.y + projectile.velocity.y * deltaSeconds
    };
    
    // Check collision with any enemy (for non-targeted projectiles)
    for (const enemy of context.enemies) {
      if (enemy.isAlive && checkCollision(projectile, enemy)) {
        update.isAlive = false;
        
        // Apply damage
        actions.push({
          type: 'DAMAGE_ENTITY',
          targetId: enemy.id,
          damage: projectile.damage,
          sourceId: projectile.id
        });
        
        // Create hit effect
        actions.push({
          type: 'CREATE_EFFECT',
          effectType: 'projectile_hit',
          position: enemy.position,
          data: { 
            projectileType: projectile.projectileType,
            damage: projectile.damage 
          }
        });
        
        // Play hit sound
        actions.push({
          type: 'PLAY_SOUND',
          soundType: 'projectile_hit',
          position: enemy.position
        });
        
        break; // Only hit one enemy
      }
    }
  } else {
    // No target and no velocity - destroy projectile
    update.isAlive = false;
  }

  // Check if projectile went out of bounds
  if (update.position) {
    const bounds = {
      minX: -100,
      minY: -100,
      maxX: (context.grid?.width || 1000) + 100,
      maxY: (context.grid?.height || 1000) + 100
    };
    
    if (update.position.x < bounds.minX || update.position.x > bounds.maxX ||
        update.position.y < bounds.minY || update.position.y > bounds.maxY) {
      update.isAlive = false;
    }
  }

  return update;
}

// Calculate projectile trajectory for preview/prediction
export function calculateProjectileTrajectory(
  startPos: Vector2,
  targetPos: Vector2,
  speed: number,
  targetVelocity?: Vector2,
  predictionTime: number = 0.5
): {
  intercept: Vector2;
  timeToHit: number;
  angle: number;
} {
  // Simple interception calculation
  let interceptPoint = { ...targetPos };
  
  if (targetVelocity) {
    // Predict where target will be
    interceptPoint = {
      x: targetPos.x + targetVelocity.x * predictionTime,
      y: targetPos.y + targetVelocity.y * predictionTime
    };
  }
  
  const distance = distanceTo(startPos, interceptPoint);
  const timeToHit = distance / speed;
  
  const dx = interceptPoint.x - startPos.x;
  const dy = interceptPoint.y - startPos.y;
  const angle = Math.atan2(dy, dx);
  
  return {
    intercept: interceptPoint,
    timeToHit,
    angle
  };
}

// Check if projectile type has special effects
export function getProjectileSpecialEffects(
  projectileType: string,
  isHit: boolean
): GameAction[] {
  const actions: GameAction[] = [];
  
  switch (projectileType) {
    case 'SNIPER_ROUND':
      if (isHit) {
        // Sniper rounds might pierce through enemies
        actions.push({
          type: 'CREATE_EFFECT',
          effectType: 'pierce',
          position: { x: 0, y: 0 }, // Position would be set by caller
          data: { pierceCount: 1 }
        });
      }
      break;
      
    case 'RAPID_PELLET':
      // Rapid pellets are simple, no special effects
      break;
      
    case 'PLAYER_SHOT':
      if (isHit) {
        // Player shots might grant experience on kill
        actions.push({
          type: 'ADD_EXPERIENCE',
          amount: 1
        });
      }
      break;
  }
  
  return actions;
}