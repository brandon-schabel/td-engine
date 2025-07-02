import type { Enemy } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { EnemyUpdate, GameContext, GameAction } from './types';
import { Pathfinding } from '@/systems/Pathfinding';
import { MovementType, MovementSystem } from '@/systems/MovementSystem';
import { ENEMY_BEHAVIOR } from '@/config/EnemyConfig';

interface EnemyState {
  currentPath: Vector2[];
  currentPathTarget: Vector2 | null;
  pathRecalculationTimer: number;
  positionHistory: Vector2[];
  velocityHistory: Vector2[];
  stuckCounter: number;
  isRecovering: boolean;
  recoveryTimer: number;
  lastValidPosition: Vector2 | null;
}

// Constants from Enemy class
const PATH_RECALCULATION_INTERVAL = 2000;
const WAYPOINT_REACHED_DISTANCE = 20;
const STUCK_THRESHOLD = 20;
const STUCK_DETECTION_TIME = 1.5;
const RECOVERY_DURATION = 1.0;

// Extract enemy state for logic calculations
function getEnemyState(enemy: Enemy): EnemyState {
  // In a real implementation, these would be stored in a separate state manager
  // For now, we'll use default values
  return {
    currentPath: [],
    currentPathTarget: null,
    pathRecalculationTimer: 0,
    positionHistory: [],
    velocityHistory: [],
    stuckCounter: 0,
    isRecovering: false,
    recoveryTimer: 0,
    lastValidPosition: null
  };
}

// Calculate movement towards a target using pathfinding
function calculatePathfindingMovement(
  enemy: Enemy,
  targetPos: Vector2,
  context: GameContext,
  state: EnemyState
): { velocity: Vector2; newPath?: Vector2[]; actions: GameAction[] } {
  const actions: GameAction[] = [];
  
  if (!context.grid) {
    return { velocity: { x: 0, y: 0 }, actions };
  }

  // Check if we need to recalculate path
  const needsNewPath = !state.currentPath.length ||
    !state.currentPathTarget ||
    distanceTo(enemy.position, targetPos) > 50 ||
    state.pathRecalculationTimer >= PATH_RECALCULATION_INTERVAL ||
    !Pathfinding.validatePath(state.currentPath, context.grid, enemy.movementType || MovementType.WALKING);

  let currentPath = state.currentPath;

  if (needsNewPath) {
    const pathResult = Pathfinding.findPath(
      enemy.position,
      targetPos,
      context.grid,
      {
        movementType: enemy.movementType || MovementType.WALKING,
        allowDiagonal: true,
        smoothPath: true,
      }
    );

    if (pathResult.success && pathResult.path.length > 0) {
      currentPath = pathResult.path;
    } else {
      // No path found - initiate recovery
      return { 
        velocity: { x: 0, y: 0 }, 
        newPath: [],
        actions: [{ type: 'CREATE_EFFECT', effectType: 'stuck', position: enemy.position }]
      };
    }
  }

  // Follow current path
  if (currentPath.length > 0) {
    // Find the next waypoint we haven't reached yet
    while (currentPath.length > 1 && distanceTo(enemy.position, currentPath[0]) < WAYPOINT_REACHED_DISTANCE) {
      currentPath.shift();
    }

    // Move towards next waypoint
    if (currentPath.length > 0) {
      const target = currentPath[0];
      const distance = distanceTo(enemy.position, target);
      
      if (distance > 1) {
        // Calculate desired velocity
        const desiredVelocity = {
          x: ((target.x - enemy.position.x) / distance) * enemy.speed,
          y: ((target.y - enemy.position.y) / distance) * enemy.speed
        };

        // Apply arrival behavior (slow down near target)
        const slowingDistance = ENEMY_BEHAVIOR.arrivalSlowingDistance;
        if (distance < slowingDistance) {
          const scaleFactor = distance / slowingDistance;
          desiredVelocity.x *= scaleFactor;
          desiredVelocity.y *= scaleFactor;
        }

        return { velocity: desiredVelocity, newPath: currentPath, actions };
      }
    }
  }

  return { velocity: { x: 0, y: 0 }, newPath: currentPath, actions };
}

// Select best target based on enemy behavior
function selectTarget(
  enemy: Enemy,
  context: GameContext
): { targetId: string | null; targetType: 'player' | 'tower' | null } {
  const nearbyTowers = context.towers.filter(tower =>
    tower.isAlive && distanceTo(enemy.position, tower.position) <= enemy.towerDetectionRange
  );

  const nearestTower = nearbyTowers.length > 0 
    ? nearbyTowers.reduce((closest, tower) => {
        const closestDistance = closest ? distanceTo(enemy.position, closest.position) : Infinity;
        const towerDistance = distanceTo(enemy.position, tower.position);
        return towerDistance < closestDistance ? tower : closest;
      }, null as typeof context.towers[0] | null)
    : null;

  const playerInRange = context.player && context.player.isAlive;

  switch (enemy.behavior) {
    case 'TOWER_FOCUSED':
      if (nearestTower) return { targetId: nearestTower.id, targetType: 'tower' };
      if (playerInRange) return { targetId: context.player!.id, targetType: 'player' };
      break;

    case 'PLAYER_FOCUSED':
      if (nearestTower && distanceTo(enemy.position, nearestTower.position) <= enemy.attackRange * ENEMY_BEHAVIOR.towerAttackPriorityMultiplier) {
        return { targetId: nearestTower.id, targetType: 'tower' };
      }
      if (playerInRange) return { targetId: context.player!.id, targetType: 'player' };
      break;

    case 'OPPORTUNIST':
      if (nearestTower) return { targetId: nearestTower.id, targetType: 'tower' };
      if (playerInRange) return { targetId: context.player!.id, targetType: 'player' };
      break;

    default:
      if (playerInRange) return { targetId: context.player!.id, targetType: 'player' };
  }

  return { targetId: null, targetType: null };
}

// Check if enemy is stuck
function detectStuck(
  enemy: Enemy,
  state: EnemyState,
  deltaTime: number
): boolean {
  // Update position history
  const newPositionHistory = [...state.positionHistory, { ...enemy.position }];
  const newVelocityHistory = [...state.velocityHistory, { ...enemy.velocity }];

  // Keep only last 60 frames
  if (newPositionHistory.length > 60) newPositionHistory.shift();
  if (newVelocityHistory.length > 60) newVelocityHistory.shift();

  // Need enough history to detect stuck
  if (newPositionHistory.length < 60) {
    return false;
  }

  // Calculate movement metrics
  const oldestPos = newPositionHistory[0];
  const totalDistance = distanceTo(enemy.position, oldestPos);
  const timeWindow = newPositionHistory.length * (deltaTime / 1000);
  const averageSpeed = totalDistance / timeWindow;

  // Calculate average velocity magnitude
  let avgVelocityMag = 0;
  for (const vel of newVelocityHistory) {
    avgVelocityMag += Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  }
  avgVelocityMag /= newVelocityHistory.length;

  // Check if stuck
  const isPositionStuck = averageSpeed < STUCK_THRESHOLD && enemy.speed > 0;
  const isVelocityStuck = avgVelocityMag > STUCK_THRESHOLD && averageSpeed < STUCK_THRESHOLD * 0.5;

  return isPositionStuck || isVelocityStuck;
}

// Calculate recovery movement
function calculateRecoveryMovement(
  enemy: Enemy,
  state: EnemyState
): Vector2 {
  // Try to move to last valid position
  if (state.lastValidPosition && distanceTo(enemy.position, state.lastValidPosition) > 20) {
    const angle = Math.atan2(
      state.lastValidPosition.y - enemy.position.y,
      state.lastValidPosition.x - enemy.position.x
    );
    return {
      x: Math.cos(angle) * enemy.speed * 0.5,
      y: Math.sin(angle) * enemy.speed * 0.5
    };
  }

  // Random walk
  const randomAngle = Math.random() * Math.PI * 2;
  return {
    x: Math.cos(randomAngle) * enemy.speed * 0.7,
    y: Math.sin(randomAngle) * enemy.speed * 0.7
  };
}

// Helper function for distance calculation
function distanceTo(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Main enemy update logic
export function updateEnemy(
  enemy: Enemy,
  context: GameContext
): EnemyUpdate {
  const actions: GameAction[] = [];
  const update: EnemyUpdate = { actions };

  if (!enemy.isAlive) {
    return update;
  }

  // Get enemy state (in real implementation, this would be stored separately)
  const state = getEnemyState(enemy);

  // Update timers
  const newPathRecalculationTimer = state.pathRecalculationTimer + context.deltaTime;
  const newCooldown = Math.max(0, enemy.currentCooldown - context.deltaTime);

  // Stuck detection and recovery
  if (state.isRecovering) {
    const newRecoveryTimer = state.recoveryTimer + context.deltaTime;
    
    if (newRecoveryTimer >= RECOVERY_DURATION) {
      // End recovery
      update.state = 'MOVING';
      update.velocity = { x: 0, y: 0 };
    } else {
      // Continue recovery movement
      update.state = 'RECOVERING';
      update.velocity = calculateRecoveryMovement(enemy, state);
    }
    
    return update;
  }

  // Check if stuck
  if (detectStuck(enemy, state, context.deltaTime)) {
    const newStuckCounter = state.stuckCounter + context.deltaTime;
    
    if (newStuckCounter >= STUCK_DETECTION_TIME) {
      // Initiate recovery
      update.state = 'RECOVERING';
      update.velocity = calculateRecoveryMovement(enemy, state);
      actions.push({
        type: 'CREATE_EFFECT',
        effectType: 'stuck_indicator',
        position: enemy.position
      });
      return update;
    }
  }

  // Select target
  const { targetId, targetType } = selectTarget(enemy, context);
  update.targetId = targetId;

  // Find actual target entity
  let targetPosition: Vector2 | null = null;
  if (targetId) {
    if (targetType === 'player' && context.player?.id === targetId) {
      targetPosition = context.player.position;
    } else if (targetType === 'tower') {
      const tower = context.towers.find(t => t.id === targetId);
      if (tower) targetPosition = tower.position;
    }
  }

  // Movement and attack logic
  if (targetPosition) {
    const distance = distanceTo(enemy.position, targetPosition);
    
    if (distance <= enemy.attackRange) {
      // In attack range - stop and attack
      update.velocity = { x: 0, y: 0 };
      update.state = 'ATTACKING';
      
      // Try to attack
      if (newCooldown <= 0) {
        actions.push({
          type: 'DAMAGE_ENTITY',
          targetId: targetId!,
          damage: enemy.damage,
          sourceId: enemy.id
        });
        
        actions.push({
          type: 'PLAY_SOUND',
          soundType: 'enemy_attack',
          position: enemy.position
        });
        
        // Reset cooldown (would be stored in state)
        update.cooldown = enemy.attackCooldownTime;
      }
    } else {
      // Move towards target
      update.state = 'MOVING';
      const movement = calculatePathfindingMovement(enemy, targetPosition, context, state);
      update.velocity = movement.velocity;
      
      if (movement.newPath) {
        update.currentPath = movement.newPath;
      }
      
      actions.push(...movement.actions);
    }
  } else if (context.player && context.player.isAlive) {
    // No specific target, move towards player
    update.state = 'MOVING';
    const movement = calculatePathfindingMovement(enemy, context.player.position, context, state);
    update.velocity = movement.velocity;
    
    if (movement.newPath) {
      update.currentPath = movement.newPath;
    }
    
    actions.push(...movement.actions);
  }

  // Update cooldown
  if (newCooldown !== enemy.currentCooldown) {
    update.cooldown = newCooldown;
  }

  return update;
}

// Check if enemy has reached end of path
export function hasEnemyReachedEnd(enemy: Enemy, path: Vector2[]): boolean {
  if (path.length === 0) return false;
  
  const lastWaypoint = path[path.length - 1];
  const distance = distanceTo(enemy.position, lastWaypoint);
  
  return distance < ENEMY_BEHAVIOR.waypointReachedThreshold;
}

// Calculate enemy progress along path
export function getEnemyProgress(enemy: Enemy, path: Vector2[], currentPathIndex: number): number {
  if (path.length === 0) return 0;
  return currentPathIndex / path.length;
}