import type { Player } from '@/entities/Player';
import type { Enemy } from '@/entities/Enemy';
import type { PlayerUpdate, GameContext, GameAction, InputState, ProjectileCreateData } from './types';
import { ProjectileType } from '@/entities/Projectile';
import { GAME_MECHANICS } from '@/config/GameConfig';
import { PLAYER_ABILITIES } from '@/config/PlayerConfig';
import { normalizeMovement } from '@/utils/MathUtils';
import { MovementSystem } from '@/systems/MovementSystem';

// Helper function for distance calculation
function distanceTo(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate player movement based on input
function calculateMovement(
  player: Player,
  input: InputState,
  context: GameContext
): { x: number; y: number } {
  let movementX = 0;
  let movementY = 0;

  if (input.mobileInput) {
    // Use mobile directional input
    movementX = input.mobileInput.x;
    movementY = input.mobileInput.y;
  } else {
    // Calculate movement based on pressed keys
    if (input.keys.has('w') || input.keys.has('arrowup')) {
      movementY -= 1;
    }
    if (input.keys.has('s') || input.keys.has('arrowdown')) {
      movementY += 1;
    }
    if (input.keys.has('a') || input.keys.has('arrowleft')) {
      movementX -= 1;
    }
    if (input.keys.has('d') || input.keys.has('arrowright')) {
      movementX += 1;
    }
  }

  // Normalize diagonal movement
  const normalized = normalizeMovement(movementX, movementY);
  
  // Apply speed
  const speed = player.speed;
  const velocity = {
    x: normalized.x * speed,
    y: normalized.y * speed
  };

  // Check if target position would be valid
  if (context.grid && (velocity.x !== 0 || velocity.y !== 0)) {
    const deltaSeconds = context.deltaTime / 1000;
    const targetPos = {
      x: player.position.x + velocity.x * deltaSeconds,
      y: player.position.y + velocity.y * deltaSeconds
    };
    
    if (!MovementSystem.canEntityMoveTo(player, targetPos, context.grid)) {
      // Stop movement if hitting impassable terrain
      return { x: 0, y: 0 };
    }
  }

  return velocity;
}

// Find nearest enemy for auto-targeting
function findNearestEnemy(player: Player, enemies: Enemy[]): Enemy | null {
  const aliveEnemies = enemies.filter(e => e.isAlive);
  
  if (aliveEnemies.length === 0) {
    return null;
  }

  return aliveEnemies.reduce((nearest, enemy) => {
    const nearestDist = distanceTo(player.position, nearest.position);
    const enemyDist = distanceTo(player.position, enemy.position);
    return enemyDist < nearestDist ? enemy : nearest;
  });
}

// Calculate shooting based on input and mode
function calculateShooting(
  player: Player,
  input: InputState,
  context: GameContext,
  canShoot: boolean
): ProjectileCreateData | null {
  if (!canShoot) {
    return null;
  }

  // Manual shooting mode
  if (input.isMouseDown || input.mobileInput) {
    const angle = Math.atan2(
      input.mousePosition.y - player.position.y,
      input.mousePosition.x - player.position.x
    );
    
    const speed = GAME_MECHANICS.projectileSpeed;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    return {
      position: { ...player.position },
      targetId: null,
      velocity,
      damage: player.damage,
      speed,
      projectileType: ProjectileType.PLAYER_SHOT
    };
  }

  return null;
}

// Check if player should regenerate health
function calculateRegeneration(
  player: Player,
  regenerationTimer: number,
  damageCooldown: number,
  deltaTime: number
): { shouldHeal: boolean; healAmount: number; newTimer: number } {
  if (!player.isAlive || player.health >= player.maxHealth || damageCooldown > 0) {
    return { shouldHeal: false, healAmount: 0, newTimer: regenerationTimer };
  }

  const hasRegen = player.getUpgradeLevel('REGENERATION' as any) > 0;
  if (!hasRegen) {
    return { shouldHeal: false, healAmount: 0, newTimer: regenerationTimer };
  }

  const newTimer = regenerationTimer + deltaTime;
  
  if (newTimer >= GAME_MECHANICS.regenInterval) {
    const regenRate = PLAYER_ABILITIES.regeneration.baseRate + 
                     player.getUpgradeLevel('REGENERATION' as any) * PLAYER_ABILITIES.regeneration.levelBonus;
    const healAmount = Math.min(regenRate, player.maxHealth - player.health);
    
    return { 
      shouldHeal: healAmount > 0, 
      healAmount, 
      newTimer: 0 
    };
  }

  return { shouldHeal: false, healAmount: 0, newTimer };
}

// Check if player can use heal ability
function checkHealAbility(
  player: Player,
  input: InputState,
  healAbilityCooldown: number
): { shouldHeal: boolean; healAmount: number } {
  if (healAbilityCooldown > 0 || !player.isAlive || player.health >= player.maxHealth) {
    return { shouldHeal: false, healAmount: 0 };
  }

  // Check if heal key is pressed
  if (input.keys.has('h') || input.keys.has('space')) {
    const healAmount = Math.min(
      PLAYER_ABILITIES.heal.amount,
      player.maxHealth - player.health
    );
    
    return { shouldHeal: true, healAmount };
  }

  return { shouldHeal: false, healAmount: 0 };
}

// Main player update logic
export function updatePlayer(
  player: Player,
  input: InputState,
  context: GameContext,
  state: {
    regenerationTimer: number;
    damageCooldown: number;
    healAbilityCooldown: number;
    shootingCooldown: number;
  }
): PlayerUpdate {
  const actions: GameAction[] = [];
  const update: PlayerUpdate = { actions };

  if (!player.isAlive) {
    return update;
  }

  // Update movement
  const velocity = calculateMovement(player, input, context);
  if (velocity.x !== 0 || velocity.y !== 0) {
    update.velocity = velocity;
  }

  // Update position (would be handled by entity system)
  const deltaSeconds = context.deltaTime / 1000;
  const newPosition = {
    x: player.position.x + velocity.x * deltaSeconds,
    y: player.position.y + velocity.y * deltaSeconds
  };

  // Constrain to bounds (if needed)
  // This would normally be handled by the game bounds system

  update.position = newPosition;

  // Update cooldowns
  const newShootingCooldown = Math.max(0, state.shootingCooldown - context.deltaTime);
  const newHealCooldown = Math.max(0, state.healAbilityCooldown - context.deltaTime);
  const newDamageCooldown = Math.max(0, state.damageCooldown - context.deltaTime);

  // Always update the shooting cooldown
  update.cooldown = newShootingCooldown;

  // Check shooting
  const canShoot = newShootingCooldown <= 0;
  const projectileData = calculateShooting(player, input, context, canShoot);
  
  if (projectileData) {
    actions.push({
      type: 'SPAWN_PROJECTILE',
      projectile: projectileData
    });
    
    actions.push({
      type: 'PLAY_SOUND',
      soundType: 'player_shoot',
      position: player.position
    });
    
    // Reset cooldown after shooting
    update.cooldown = player.cooldownTime;
  }

  // Check heal ability
  const healAbility = checkHealAbility(player, input, newHealCooldown);
  if (healAbility.shouldHeal) {
    actions.push({
      type: 'HEAL_ENTITY',
      targetId: player.id,
      amount: healAbility.healAmount
    });
    
    actions.push({
      type: 'CREATE_EFFECT',
      effectType: 'heal',
      position: player.position,
      data: { amount: healAbility.healAmount }
    });
    
    // Reset heal cooldown
    update.cooldown = GAME_MECHANICS.healAbilityCooldown;
  }

  // Check regeneration
  const regen = calculateRegeneration(
    player,
    state.regenerationTimer,
    newDamageCooldown,
    context.deltaTime
  );
  
  if (regen.shouldHeal) {
    actions.push({
      type: 'HEAL_ENTITY',
      targetId: player.id,
      amount: regen.healAmount
    });
  }

  return update;
}

// Calculate player combat stats for UI
export function calculatePlayerStats(player: Player): {
  dps: number;
  effectiveHealth: number;
  movementSpeed: number;
  criticalChance: number;
} {
  const dps = player.damage * player.fireRate;
  const effectiveHealth = player.health * (1 + (player.armor || 0) / 100);
  const movementSpeed = player.speed;
  const criticalChance = 0; // Could be added as an upgrade
  
  return {
    dps,
    effectiveHealth,
    movementSpeed,
    criticalChance
  };
}

// Check if player is in danger
export function isPlayerInDanger(
  player: Player,
  enemies: Enemy[]
): {
  inDanger: boolean;
  threatLevel: number;
  nearestThreat: Enemy | null;
} {
  const dangerRadius = 150; // Distance at which enemies are considered dangerous
  const nearbyEnemies = enemies.filter(e => 
    e.isAlive && distanceTo(player.position, e.position) < dangerRadius
  );
  
  if (nearbyEnemies.length === 0) {
    return { inDanger: false, threatLevel: 0, nearestThreat: null };
  }
  
  const nearestThreat = nearbyEnemies.reduce((nearest, enemy) => {
    const nearestDist = distanceTo(player.position, nearest.position);
    const enemyDist = distanceTo(player.position, enemy.position);
    return enemyDist < nearestDist ? enemy : nearest;
  });
  
  // Calculate threat level based on number and proximity of enemies
  const threatLevel = nearbyEnemies.reduce((total, enemy) => {
    const distance = distanceTo(player.position, enemy.position);
    const proximityThreat = 1 - (distance / dangerRadius);
    const damageThreat = enemy.damage / player.maxHealth;
    return total + (proximityThreat * damageThreat);
  }, 0);
  
  return {
    inDanger: true,
    threatLevel: Math.min(1, threatLevel),
    nearestThreat
  };
}