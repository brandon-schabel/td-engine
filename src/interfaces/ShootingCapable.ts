/**
 * ShootingCapable - Interface and utilities for entities that can shoot projectiles
 * Eliminates duplicate shooting logic between Player and Tower classes
 */

import { Enemy } from '@/entities/Enemy';
import { Projectile, ProjectileType } from '@/entities/Projectile';
import type { Vector2 } from '@/utils/Vector2';
import { CooldownManager } from '@/utils/CooldownManager';

/**
 * Interface for entities that can shoot projectiles
 */
export interface ShootingCapable {
  readonly position: Vector2;
  readonly damage: number;
  readonly cooldownTime: number;
  currentCooldown: number;
  
  canShoot(): boolean;
  shoot(target: Enemy): Projectile | null;
}

/**
 * Configuration for creating a projectile
 */
export interface ProjectileConfig {
  position: Vector2;
  target: Enemy;
  damage: number;
  speed: number;
  projectileType?: ProjectileType;
}

/**
 * Utility class for common shooting operations
 */
export class ShootingUtils {
  /**
   * Checks if shooting cooldown is ready
   */
  static canShoot(currentCooldown: number): boolean {
    return CooldownManager.isReady(currentCooldown);
  }

  /**
   * Starts shooting cooldown
   */
  static startShootingCooldown(cooldownTime: number): number {
    return CooldownManager.startCooldown(cooldownTime);
  }

  /**
   * Creates a standard projectile with common logic
   */
  static createProjectile(config: ProjectileConfig): Projectile {
    return new Projectile(
      { ...config.position }, // Copy position to avoid reference issues
      config.target,
      config.damage,
      config.speed,
      undefined, // velocity
      config.projectileType || ProjectileType.BASIC_BULLET
    );
  }

  /**
   * Finds the nearest alive enemy from a list
   */
  static findNearestEnemy(shooterPosition: Vector2, enemies: Enemy[]): Enemy | null {
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    
    if (aliveEnemies.length === 0) {
      return null;
    }

    return aliveEnemies.reduce((nearest, enemy) => {
      const distToEnemy = ShootingUtils.calculateDistance(shooterPosition, enemy.position);
      const distToNearest = ShootingUtils.calculateDistance(shooterPosition, nearest.position);
      return distToEnemy < distToNearest ? enemy : nearest;
    });
  }

  /**
   * Finds enemies within a specific range
   */
  static findEnemiesInRange(shooterPosition: Vector2, enemies: Enemy[], range: number): Enemy[] {
    return enemies.filter(enemy => 
      enemy.isAlive && ShootingUtils.calculateDistance(shooterPosition, enemy.position) <= range
    );
  }

  /**
   * Calculates distance between two positions
   */
  static calculateDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Checks if a target is within range
   */
  static isInRange(shooterPosition: Vector2, targetPosition: Vector2, range: number): boolean {
    return ShootingUtils.calculateDistance(shooterPosition, targetPosition) <= range;
  }

  /**
   * Performs a complete shooting action with cooldown management
   * Returns the created projectile or null if shooting failed
   */
  static performShoot(
    shooter: ShootingCapable,
    target: Enemy,
    projectileSpeed: number
  ): Projectile | null {
    if (!ShootingUtils.canShoot(shooter.currentCooldown)) {
      return null;
    }

    // Start cooldown
    shooter.currentCooldown = ShootingUtils.startShootingCooldown(shooter.cooldownTime);

    // Create and return projectile
    return ShootingUtils.createProjectile({
      position: shooter.position,
      target,
      damage: shooter.damage,
      speed: projectileSpeed
    });
  }

  /**
   * Auto-targeting shooting - finds nearest enemy and shoots
   */
  static autoShoot(
    shooter: ShootingCapable,
    enemies: Enemy[],
    projectileSpeed: number,
    range?: number
  ): Projectile | null {
    if (!ShootingUtils.canShoot(shooter.currentCooldown)) {
      return null;
    }

    // Filter by range if specified
    const availableTargets = range 
      ? ShootingUtils.findEnemiesInRange(shooter.position, enemies, range)
      : enemies.filter(enemy => enemy.isAlive);

    const target = ShootingUtils.findNearestEnemy(shooter.position, availableTargets);
    if (!target) {
      return null;
    }

    return ShootingUtils.performShoot(shooter, target, projectileSpeed);
  }
}

