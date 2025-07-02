import { useEntityStore } from '@/stores/entityStore';
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
    const entityStore = useEntityStore.getState();
    const gameState = gameStore.getState();

    // Check if game is playing
    if (gameState.isGameOver || gameState.isPaused) {
      return;
    }

    // Create game context for logic systems
    const context: GameContext = {
      deltaTime,
      enemies: entityStore.getAllEnemies(),
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

    // Update spawn zone manager
    const gameStateSnapshot = {
      lives: gameState.lives,
      score: gameState.score,
      waveNumber: this.waveManager.currentWave,
      enemyCount: context.enemies.length,
      towerCount: context.towers.length,
      playerPosition: entityStore.player ? { ...entityStore.player.position } : { x: 0, y: 0 }
    };
    this.spawnZoneManager.update(deltaTime, gameStateSnapshot, context.towers, entityStore.player || undefined);

    // 2. Process entity updates and collect actions
    const allActions: GameAction[] = [];

    // Update enemies
    const enemyUpdates: Array<{ id: string; updates: Partial<Enemy> }> = [];
    context.enemies.forEach(enemy => {
      if (!enemy.isAlive) return;

      const update = updateEnemy(enemy, context);
      
      // Collect updates
      if (update.position || update.velocity || update.health !== undefined || update.state) {
        enemyUpdates.push({
          id: enemy.id,
          updates: {
            position: update.position,
            velocity: update.velocity,
            health: update.health
          }
        });
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
        towerUpdates.push({
          id: tower.id,
          updates: {
            target: update.targetId ? context.enemies.find(e => e.id === update.targetId) : null
          }
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
        entityStore.updatePlayer({
          position: playerUpdate.position,
          velocity: playerUpdate.velocity,
          health: playerUpdate.health,
          currentCooldown: playerUpdate.cooldown
        });
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

    // Update projectiles
    const projectileUpdates: Array<{ id: string; updates: Partial<Projectile> }> = [];
    context.projectiles.forEach(projectile => {
      if (!projectile.isAlive) return;

      const update = updateProjectile(projectile, context, deltaTime);
      
      // Collect updates
      if (update.position || update.velocity || update.isAlive !== undefined) {
        projectileUpdates.push({
          id: projectile.id,
          updates: {
            position: update.position,
            velocity: update.velocity,
            isAlive: update.isAlive
          }
        });
      }

      // Collect actions
      allActions.push(...update.actions);
    });

    // Update collectibles
    const collectibles = entityStore.getAllCollectibles();
    collectibles.forEach(collectible => {
      collectible.update(deltaTime);
      
      // Check collection with player
      if (entityStore.player && collectible.isActive && collectible.position.distanceTo(entityStore.player.position) < 30) {
        collectible.collect(entityStore.player);
        entityStore.removeCollectible(collectible.id);
        this.audioManager.playSound(SoundType.COIN_PICKUP);
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
      towers: towerUpdates,
      projectiles: projectileUpdates
    });

    // 4. Process all actions
    this.processActions(allActions);

    // 5. Clean up dead entities
    entityStore.cleanupDeadEntities();
  }

  private processActions(actions: GameAction[]): void {
    const entityStore = useEntityStore.getState();
    actions.forEach(action => {
      switch (action.type) {
        case 'SPAWN_PROJECTILE':
          // Create new projectile from action data
          const projectile = new Projectile(
            action.projectile.position,
            action.projectile.targetId ? entityStore.enemies[action.projectile.targetId] : null,
            action.projectile.damage,
            action.projectile.speed,
            action.projectile.projectileType
          );
          if (action.projectile.velocity) {
            projectile.velocity = action.projectile.velocity;
          }
          entityStore.addProjectile(projectile);
          break;

        case 'DAMAGE_ENTITY':
          // Apply damage to entity
          const targetEnemy = entityStore.enemies[action.targetId];
          if (targetEnemy && targetEnemy.isAlive) {
            const wasAlive = targetEnemy.isAlive;
            targetEnemy.takeDamage(action.damage);
            
            if (wasAlive && !targetEnemy.isAlive) {
              // Enemy was killed
              this.handleEnemyDeath(targetEnemy);
            }
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
            const effect = new DestructionEffect(action.position);
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
    const entityStore = useEntityStore.getState();
    
    // Update game state
    gameStore.getState().addScore(10); // TODO: Add scoreValue to Enemy class
    gameStore.getState().addCurrency(5); // TODO: Add value to Enemy class
    gameStore.getState().addKills(1);

    // Play death sound
    this.audioManager.playSound(SoundType.ENEMY_DEATH);

    // Create destruction effect
    const effect = new DestructionEffect(enemy.position);
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
    useEntityStore.getState().clearAllEntities();
  }
}