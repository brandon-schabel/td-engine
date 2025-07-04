import { utilizeEntityStore } from '@/stores/entityStore';
import { gameStore } from '@/stores/gameStore';
import type { InputState, GameContext, GameAction } from '@/systems/logic/types';
import { updateEnemy } from '@/systems/logic/EnemyLogic';
import { updateTower } from '@/systems/logic/TowerLogic';
import { updatePlayer } from '@/systems/logic/PlayerLogic';
import { updateProjectile } from '@/systems/logic/ProjectileLogic';
import { calculateDamage } from '@/systems/logic/CombatLogic';
import type { Enemy } from '@/entities/Enemy';
import type { Tower } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import type { Grid } from '@/systems/Grid';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { Collectible } from '@/entities/Collectible';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { COLLECTIBLE_DROP_CHANCES } from '@/config/ItemConfig';
import { CollectibleType } from '@/entities/items/ItemTypes';
import type { WaveManager } from '@/systems/WaveManager';
import type { SpawnZoneManager } from '@/systems/SpawnZoneManager';
import { Entity } from '@/entities/Entity';

interface GameLoopDependencies {
  grid: Grid;
  audioManager: AudioManager;
  waveManager: WaveManager;
  spawnZoneManager: SpawnZoneManager;
}

export class GameLoop {
  private grid: Grid;
  private audioManager: AudioManager;
  private waveManager: WaveManager;
  private spawnZoneManager: SpawnZoneManager;
  private gameTime: number = 0;

  constructor(dependencies: GameLoopDependencies) {
    this.grid = dependencies.grid;
    this.audioManager = dependencies.audioManager;
    this.waveManager = dependencies.waveManager;
    this.spawnZoneManager = dependencies.spawnZoneManager;
  }

  update(deltaTime: number, inputState: InputState): void {
    this.gameTime += deltaTime;

    // 1. Get current state from stores
    const entityStore = utilizeEntityStore.getState();
    const gameState = gameStore.getState();

    // Check if game is playing
    if (gameState.isGameOver || gameState.isPaused) {
      return;
    }

    // Create game context for logic systems
    // TEMPORARILY DISABLED FILTERING TO DEBUG
    const allEnemies = entityStore.getAllEnemies();

    // Log any enemies with suspect positions
    allEnemies.forEach(e => {
      if (!e || !e.position || typeof e.position.x !== 'number' || typeof e.position.y !== 'number') {
      }
    });

    const context: GameContext = {
      deltaTime,
      enemies: allEnemies, // Use all enemies for now
      towers: entityStore.getAllTowers(),
      player: entityStore.player,
      projectiles: entityStore.getAllProjectiles(),
      grid: this.grid,
      gameTime: this.gameTime,
      isPaused: false
    };

    // Update wave manager and spawn new enemies
    const newEnemies = this.waveManager.update(deltaTime);
    newEnemies.forEach(enemy => {

      // Set enemy to target player
      if (entityStore.player) {
        enemy.setTarget(entityStore.player);
      }

      // Add damage callback for floating damage numbers
      enemy.onDamage = (event) => {
        if (event) {
          this.createDamageNumber(enemy, event.actualDamage, event.isCritical || false);
        }
      };

      entityStore.addEnemy(enemy);
    });

    // Update spawn zone manager - only if player exists
    if (entityStore.player) {
      const gameStateSnapshot = {
        lives: gameState.lives,
        score: gameState.score,
        waveNumber: this.waveManager.currentWave,
        enemyCount: context.enemies.length,
        towerCount: context.towers.length,
        playerPosition: entityStore.player ? { ...entityStore.player.position } : { x: 0, y: 0 }
      };
      this.spawnZoneManager.update(deltaTime, gameStateSnapshot, context.towers, entityStore.player);
    }

    // 2. Process entity updates and collect actions
    const allActions: GameAction[] = [];

    // Update enemies
    const enemyUpdates: Array<{ id: string; updates: Partial<Enemy> }> = [];
    context.enemies.forEach(enemy => {
      if (!enemy.isAlive) return;

      const update = updateEnemy(enemy, context);

      // Collect updates
      if (update.position || update.velocity || update.health !== undefined || update.state || update.cooldown !== undefined) {
        const updates: Partial<Enemy> = {};

        // Only include defined values
        if (update.position) updates.position = update.position;
        if (update.velocity) updates.velocity = update.velocity;
        if (update.health !== undefined) updates.health = update.health;
        if (update.cooldown !== undefined) (updates as any).currentAttackCooldown = update.cooldown;

        if (Object.keys(updates).length > 0) {
          enemyUpdates.push({
            id: enemy.id,
            updates
          });
        }
      }

      // Collect actions
      allActions.push(...update.actions);
    });

    // Update towers
    const towerUpdates: Array<{ id: string; updates: Partial<Tower> }> = [];
    context.towers.forEach(tower => {
      if (!tower.isAlive) return;

      const update = updateTower(tower, context);

      // Collect updates
      if (update.cooldown !== undefined || update.targetId !== undefined) {
        const updates: any = {};
        if (update.cooldown !== undefined) {
          updates.currentCooldown = update.cooldown;
        }
        if (update.targetId !== undefined) {
          updates.targetId = update.targetId;
        }
        towerUpdates.push({
          id: tower.id,
          updates
        });
      }

      // Collect actions
      allActions.push(...update.actions);
    });

    // Update player
    if (entityStore.player && entityStore.player.isAlive) {
      // Get player state for logic system
      const playerState = {
        regenerationTimer: (entityStore.player as any).regenerationTimer || 0,
        damageCooldown: (entityStore.player as any).damageCooldown || 0,
        healAbilityCooldown: (entityStore.player as any).healAbilityCooldown || 0,
        shootingCooldown: entityStore.player.currentCooldown || 0
      };

      const playerUpdate = updatePlayer(entityStore.player, inputState, context, playerState);

      // Apply player updates
      if (playerUpdate.position || playerUpdate.velocity || playerUpdate.health !== undefined || playerUpdate.cooldown !== undefined) {
        const updates: any = {};

        // Only include defined values
        if (playerUpdate.position) updates.position = playerUpdate.position;
        if (playerUpdate.velocity) updates.velocity = playerUpdate.velocity;
        if (playerUpdate.health !== undefined) updates.health = playerUpdate.health;
        if (playerUpdate.cooldown !== undefined) updates.currentCooldown = playerUpdate.cooldown;

        if (Object.keys(updates).length > 0) {
          entityStore.updatePlayer(updates);
        }
      }

      // Collect actions
      allActions.push(...playerUpdate.actions);

      // Check if player died
      if (entityStore.player.health <= 0) {
        this.audioManager.playSound(SoundType.GAME_OVER);
        gameStore.getState().gameOver();
        return;
      }
    }

    // Update projectiles with simplified logic
    context.projectiles.forEach(projectile => {
      if (!projectile.isAlive) return;

      // Get projectile state for logic system
      const projectileState = {
        age: projectile.age || 0,
        hasHitTarget: false
      };

      const projectileUpdate = updateProjectile(projectile, context, projectileState);

      // Apply projectile updates
      if (projectileUpdate.position) {
        projectile.position = projectileUpdate.position;
      }
      if (projectileUpdate.velocity) {
        projectile.velocity = projectileUpdate.velocity;
      }
      if (projectileUpdate.isAlive !== undefined) {
        projectile.isAlive = projectileUpdate.isAlive;
      }

      // Collect actions
      allActions.push(...projectileUpdate.actions);
    });

    // Update collectibles
    const collectibles = entityStore.getAllCollectibles();
    collectibles.forEach(collectible => {
      collectible.update(deltaTime);

      // Check collection with player
      if (entityStore.player && collectible.isActive) {
        const dx = collectible.position.x - entityStore.player.position.x;
        const dy = collectible.position.y - entityStore.player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 30) {
          collectible.tryCollectByPlayer(entityStore.player);
          entityStore.removeCollectible(collectible.id);
          this.audioManager.playSound(SoundType.CURRENCY_PICKUP);
        }
      }
    });

    // Update destruction effects
    const effects = entityStore.getAllDestructionEffects();
    effects.forEach(effect => {
      effect.update(deltaTime);
      if (effect.isComplete) {
        entityStore.removeDestructionEffect(effect.id);
      }
    });

    // 3. Apply batch updates to store
    entityStore.batchUpdate({
      enemies: enemyUpdates,
      towers: towerUpdates
    });

    // 3.5. Update entity positions based on velocity
    // This is needed because we're using functional updates instead of OOP

    // Update enemy positions
    entityStore.getAllEnemies().forEach(enemy => {
      if (enemy.isAlive && enemy.velocity && (enemy.velocity.x !== 0 || enemy.velocity.y !== 0)) {
        // Call the base Entity update to apply velocity to position
        Entity.prototype.update.call(enemy, deltaTime, this.grid);
      }
    });

    // Projectiles are updated by their own update method in the logic system
    // No need to manually update positions here since Projectile.update() handles it

    // 4. Process all actions
    this.processActions(allActions);

    // 5. Clean up dead entities
    entityStore.cleanupDeadEntities();

    // 6. Update enemy count in game store
    const remainingEnemies = entityStore.getAllEnemies().filter(e => e.isAlive).length;
    gameStore.getState().setEnemiesRemaining(remainingEnemies);

    // Debug: Log projectile count
    const aliveProjectiles = entityStore.getAllProjectiles().filter(p => p.isAlive);
    if (aliveProjectiles.length > 0) {
      console.log(`[GameLoop] ${aliveProjectiles.length} projectiles alive:`, aliveProjectiles.map(p => ({ id: p.id, pos: p.position, alive: p.isAlive })));
    }
  }

  private processActions(actions: GameAction[]): void {
    const entityStore = utilizeEntityStore.getState();
    actions.forEach(action => {
      switch (action.type) {
        case 'SPAWN_PROJECTILE':
          // Create new projectile from action data
          const projectile = new Projectile(
            action.projectile.position,
            action.projectile.targetId || null,
            action.projectile.damage,
            action.projectile.speed,
            action.projectile.velocity, // Pass velocity as 5th parameter
            action.projectile.projectileType
          );
          console.log(`[GameLoop] Spawning projectile ${projectile.id} at position:`, projectile.position, 'velocity:', projectile.velocity);
          entityStore.addProjectile(projectile);
          console.log(`[GameLoop] Projectile ${projectile.id} added to store, total projectiles:`, entityStore.getAllProjectiles().length);
          break;

        case 'DAMAGE_ENTITY':
          // Apply damage to entity - check all entity types

          // Check if target is an enemy
          const targetEnemy = entityStore.enemies[action.targetId];
          if (targetEnemy && targetEnemy.isAlive) {
            const wasAlive = targetEnemy.isAlive;
            targetEnemy.takeDamage(action.damage);

            if (wasAlive && !targetEnemy.isAlive) {
              // Enemy was killed
              this.handleEnemyDeath(targetEnemy);
            }
          }

          // Check if target is the player
          const targetPlayer = entityStore.player;
          if (targetPlayer && targetPlayer.id === action.targetId && targetPlayer.isAlive) {
            console.log(`[GameLoop] Player taking ${action.damage} damage from entity ${action.sourceId}`);
            targetPlayer.takeDamage(action.damage);

            // Check if player died
            if (!targetPlayer.isAlive) {
              this.audioManager.playSound(SoundType.GAME_OVER);
              gameStore.getState().gameOver();
            }
          }

          // Check if target is a tower
          const allTowers = Object.values(entityStore.towers);
          const targetTower = allTowers.find(t => t.id === action.targetId);
          if (targetTower && targetTower.isAlive) {
            console.log(`[GameLoop] Tower ${targetTower.id} taking ${action.damage} damage`);
            targetTower.takeDamage(action.damage);
          }
          break;

        case 'DESTROY_ENTITY':
          // Mark entity as dead
          const entity = entityStore.enemies[action.entityId] ||
            entityStore.towers[action.entityId] ||
            entityStore.projectiles[action.entityId];
          if (entity) {
            entity.isAlive = false;
          }
          break;

        case 'ADD_CURRENCY':
          gameStore.getState().addCurrency(action.amount);
          break;

        case 'SPAWN_COLLECTIBLE':
          const collectible = new Collectible(
            action.position,
            action.collectibleType as CollectibleType
          );
          entityStore.addCollectible(collectible);
          break;

        case 'PLAY_SOUND':
          if (action.soundType) {
            this.audioManager.playSound(action.soundType as SoundType);
          }
          break;

        case 'CREATE_EFFECT':
          if (action.effectType === 'destruction' && action.position) {
            const effect = new DestructionEffect(action.position, 'tower');
            entityStore.addDestructionEffect(effect);
          }
          break;

        case 'HEAL_ENTITY':
          const healTarget = entityStore.player;
          if (healTarget && healTarget.id === action.targetId) {
            healTarget.heal(action.amount);
          }
          break;

        case 'ADD_EXPERIENCE':
          const player = entityStore.player;
          if (player) {
            player.addExperience(action.amount);
          }
          break;
      }
    });
  }

  private handleEnemyDeath(enemy: Enemy): void {
    const entityStore = utilizeEntityStore.getState();

    // Update game state
    gameStore.getState().addScore(10); // TODO: Add scoreValue to Enemy class
    gameStore.getState().addCurrency(5); // TODO: Add value to Enemy class
    gameStore.getState().recordEnemyKill(enemy.enemyType.toString(), 5);

    // Play death sound
    this.audioManager.playSound(SoundType.ENEMY_DEATH);

    // Create destruction effect
    const effect = new DestructionEffect(enemy.position, enemy.enemyType);
    entityStore.addDestructionEffect(effect);

    // Roll for collectible drops
    Object.entries(COLLECTIBLE_DROP_CHANCES).forEach(([type, chance]) => {
      if (Math.random() < chance) {
        const collectible = new Collectible(enemy.position, type as CollectibleType);
        entityStore.addCollectible(collectible);
      }
    });
  }

  private createDamageNumber(entity: { position: { x: number, y: number } }, damage: number, isCritical: boolean): void {
    // This will be handled by the UI layer observing entity damage events
    // For now, we just log it
    console.log(`Damage: ${damage} ${isCritical ? '(CRIT)' : ''} at ${entity.position.x}, ${entity.position.y}`);
  }

  reset(): void {
    this.gameTime = 0;
    // Clear all entities
    utilizeEntityStore.getState().clearAllEntities();
  }
}