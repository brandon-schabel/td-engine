/**
 * Combat-related interfaces for entities that can be targeted, take damage, or engage in combat
 */

import type { Vector2 } from '../utils/Vector2';

/**
 * Interface for entities that can be targeted by attacks
 */
export interface Targetable {
  readonly position: Vector2;
  readonly radius: number;
  isAlive: boolean;
  
  takeDamage(amount: number): void;
  distanceTo(target: Vector2 | Targetable): number;
}

/**
 * Interface for entities that can engage in combat
 */
export interface CombatEntity extends Targetable {
  readonly damage: number;
  
  canAttack(target: Targetable): boolean;
  attack?(target: Targetable): boolean;
}

/**
 * Interface for entities that can collide with others
 */
export interface Collideable {
  readonly position: Vector2;
  readonly radius: number;
  isAlive: boolean;
  
  checkCollision(other: Collideable): boolean;
  onCollision?(other: Collideable): void;
}

/**
 * Interface for entities that can move
 */
export interface Moveable {
  position: Vector2;
  velocity: Vector2;
  readonly speed: number;
  
  moveTo(target: Vector2, speed?: number): void;
  update(deltaTime: number): void;
}

/**
 * Interface for entities that can be rendered
 */
export interface Renderable {
  readonly position: Vector2;
  readonly radius: number;
  isAlive: boolean;
  
  // Optional rendering properties
  color?: string;
  texture?: string;
  rotation?: number;
  scale?: number;
}

/**
 * Interface for entities that have health
 */
export interface HealthCapable {
  health: number;
  readonly maxHealth: number;
  isAlive: boolean;
  
  takeDamage(amount: number): void;
  heal(amount: number): void;
  getHealthPercentage(): number;
}

/**
 * Utility functions for combat operations
 */
export class CombatUtils {
  /**
   * Checks if two entities are within combat range
   */
  static isInCombatRange(attacker: CombatEntity, target: Targetable, range: number): boolean {
    return attacker.distanceTo(target) <= range;
  }

  /**
   * Calculates damage with potential modifiers
   */
  static calculateDamage(baseDamage: number, modifiers: number[] = []): number {
    return Math.floor(modifiers.reduce((damage, modifier) => damage * modifier, baseDamage));
  }

  /**
   * Checks if two collideable entities overlap
   */
  static checkCollision(entity1: Collideable, entity2: Collideable): boolean {
    const distance = Math.sqrt(
      Math.pow(entity1.position.x - entity2.position.x, 2) + 
      Math.pow(entity1.position.y - entity2.position.y, 2)
    );
    return distance <= (entity1.radius + entity2.radius);
  }

  /**
   * Finds the closest target from a list
   */
  static findClosestTarget<T extends Targetable>(
    position: Vector2, 
    targets: T[],
    maxRange?: number
  ): T | null {
    const aliveTargets = targets.filter(target => target.isAlive);
    
    if (aliveTargets.length === 0) {
      return null;
    }

    let closest = aliveTargets[0];
    let closestDistance = Math.sqrt(
      Math.pow(position.x - closest.position.x, 2) + 
      Math.pow(position.y - closest.position.y, 2)
    );

    for (let i = 1; i < aliveTargets.length; i++) {
      const target = aliveTargets[i];
      const distance = Math.sqrt(
        Math.pow(position.x - target.position.x, 2) + 
        Math.pow(position.y - target.position.y, 2)
      );

      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    }

    // Check range limit if specified
    if (maxRange !== undefined && closestDistance > maxRange) {
      return null;
    }

    return closest;
  }

  /**
   * Filters targets within a specific range
   */
  static getTargetsInRange<T extends Targetable>(
    position: Vector2,
    targets: T[],
    range: number
  ): T[] {
    return targets.filter(target => {
      if (!target.isAlive) return false;
      
      const distance = Math.sqrt(
        Math.pow(position.x - target.position.x, 2) + 
        Math.pow(position.y - target.position.y, 2)
      );
      
      return distance <= range;
    });
  }
}