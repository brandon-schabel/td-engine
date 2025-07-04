import { Player, PlayerUpgradeType } from '@/entities/Player';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Projectile, ProjectileType } from '@/entities/Projectile';
import { Collectible } from '@/entities/Collectible';
import { CollectibleType } from '@/entities/items/ItemTypes';
import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import type { Entity } from '@/entities/Entity';
import { GAMEPLAY_CONSTANTS } from '@/config/GameplayConstants';
import { GAME_MECHANICS } from '@/config/GameConfig';

/**
 * Configuration options for creating a player
 */
export interface PlayerConfig {
  onDamage?: (event: { entity: Entity; actualDamage: number }) => void;
  grid?: Grid;
}

/**
 * Configuration options for creating a tower
 */
export interface TowerConfig {
  onDamage?: (event: { entity: Entity; actualDamage: number }) => void;
  onShoot?: (projectile: Projectile) => void;
}

/**
 * Configuration options for creating an enemy
 */
export interface EnemyConfig {
  speedMultiplier?: number;
  healthMultiplier?: number;
  onDamage?: (event: { entity: Entity; actualDamage: number }) => void;
  grid?: Grid;
  playerTarget?: Player;
  towers?: Tower[];
}

/**
 * Configuration options for creating a projectile
 */
export interface ProjectileConfig {
  velocity?: Vector2;
  projectileType?: ProjectileType;
  speed?: number;
}

/**
 * Configuration options for creating a collectible
 */
export interface CollectibleConfig {
  onCollect?: (player: Player) => void;
}

/**
 * Factory functions for creating game entities with proper configuration
 */
export class EntityFactory {
  /**
   * Create a configured player entity
   * @param position World position for the player
   * @param config Optional configuration for callbacks and grid
   * @returns Configured player entity
   */
  static createPlayer(position: Vector2, config?: PlayerConfig): Player {
    const player = new Player(position);
    
    // Set up damage callback if provided
    if (config?.onDamage) {
      player.onDamage = config.onDamage;
    }
    
    // Set grid reference if provided
    if (config?.grid) {
      player.setGrid(config.grid);
    }
    
    return player;
  }
  
  /**
   * Create a configured tower entity
   * @param type Tower type
   * @param position World position for the tower
   * @param config Optional configuration for callbacks
   * @returns Configured tower entity
   */
  static createTower(type: TowerType, position: Vector2, config?: TowerConfig): Tower {
    const tower = new Tower(type, position);
    
    // Set up damage callback if provided
    if (config?.onDamage) {
      tower.onDamage = config.onDamage;
    }
    
    // Set up shoot callback if provided
    if (config?.onShoot) {
      // Towers don't have a built-in onShoot callback, but we can store it for external use
      (tower as any)._onShoot = config.onShoot;
    }
    
    return tower;
  }
  
  /**
   * Create a configured enemy entity
   * @param type Enemy type
   * @param position World position for the enemy
   * @param config Optional configuration for callbacks and modifiers
   * @returns Configured enemy entity
   */
  static createEnemy(type: EnemyType, position: Vector2, config?: EnemyConfig): Enemy {
    const speedMultiplier = config?.speedMultiplier ?? 1.0;
    const healthMultiplier = config?.healthMultiplier ?? 1.0;
    
    const enemy = new Enemy(type, position, speedMultiplier, healthMultiplier);
    
    // Set up damage callback if provided
    if (config?.onDamage) {
      enemy.onDamage = config.onDamage;
    }
    
    // Set grid reference if provided
    if (config?.grid) {
      enemy.setGrid(config.grid);
    }
    
    // Set player target if provided
    if (config?.playerTarget) {
      enemy.setPlayerTarget(config.playerTarget);
    }
    
    // Set available towers if provided
    if (config?.towers) {
      enemy.setTowers(config.towers);
    }
    
    return enemy;
  }
  
  /**
   * Create a configured projectile entity
   * @param shooter The entity that fired the projectile
   * @param target The target enemy (can be null for non-homing projectiles)
   * @param config Optional configuration for projectile behavior
   * @returns Configured projectile entity
   */
  static createProjectile(
    shooter: Entity,
    target: Enemy | null,
    config?: ProjectileConfig
  ): Projectile {
    // Determine damage based on shooter type
    let damage = 0;
    let defaultProjectileType = ProjectileType.BASIC_BULLET;
    
    if ('damage' in shooter) {
      damage = (shooter as any).damage || 0;
    }
    
    // Determine projectile type based on shooter
    if ('towerType' in shooter) {
      const tower = shooter as Tower;
      switch (tower.towerType) {
        case TowerType.SNIPER:
          defaultProjectileType = ProjectileType.SNIPER_ROUND;
          break;
        case TowerType.RAPID:
          defaultProjectileType = ProjectileType.RAPID_PELLET;
          break;
        default:
          defaultProjectileType = ProjectileType.BASIC_BULLET;
      }
    } else if (shooter instanceof Player) {
      defaultProjectileType = ProjectileType.PLAYER_SHOT;
    }
    
    const projectileType = config?.projectileType ?? defaultProjectileType;
    const speed = config?.speed ?? GAME_MECHANICS.towerProjectileSpeed;
    
    const projectile = new Projectile(
      { ...shooter.position },
      target?.id || null,
      damage,
      speed,
      config?.velocity,
      projectileType
    );
    
    return projectile;
  }
  
  /**
   * Create a configured collectible entity
   * @param position World position for the collectible
   * @param type Collectible type
   * @param config Optional configuration for callbacks
   * @returns Configured collectible entity
   */
  static createCollectible(
    position: Vector2,
    type: CollectibleType,
    config?: CollectibleConfig
  ): Collectible {
    const collectible = new Collectible(position, type);
    
    // Set up collect callback if provided
    if (config?.onCollect) {
      (collectible as any)._onCollect = config.onCollect;
    }
    
    return collectible;
  }
  
  /**
   * Create multiple enemies with the same configuration
   * @param type Enemy type
   * @param positions Array of world positions
   * @param config Optional configuration for all enemies
   * @returns Array of configured enemies
   */
  static createEnemyWave(
    type: EnemyType,
    positions: Vector2[],
    config?: EnemyConfig
  ): Enemy[] {
    return positions.map(position => 
      EntityFactory.createEnemy(type, position, config)
    );
  }
  
  /**
   * Create a boss enemy with enhanced stats
   * @param type Enemy type to use as base
   * @param position World position
   * @param config Optional configuration
   * @returns Configured boss enemy
   */
  static createBossEnemy(
    type: EnemyType,
    position: Vector2,
    config?: EnemyConfig
  ): Enemy {
    // Bosses have 5x health and 0.5x speed
    const bossConfig: EnemyConfig = {
      ...config,
      healthMultiplier: (config?.healthMultiplier ?? 1.0) * 5.0,
      speedMultiplier: (config?.speedMultiplier ?? 1.0) * 0.5
    };
    
    const boss = EntityFactory.createEnemy(type, position, bossConfig);
    
    // Mark as boss (if supported by Enemy class)
    if ('isBoss' in boss) {
      (boss as any).isBoss = true;
    }
    
    return boss;
  }
  
  /**
   * Create a random collectible at a position
   * @param position World position
   * @param config Optional configuration
   * @returns Random collectible
   */
  static createRandomCollectible(
    position: Vector2,
    config?: CollectibleConfig
  ): Collectible {
    const type = Collectible.getRandomType();
    return EntityFactory.createCollectible(position, type, config);
  }
}