/**
 * CollisionManager - Manages the SAT collision system integration with the game
 */

import { CollisionSystem, ColliderType, type ColliderConfig } from './CollisionSystem';
import { CollisionShapes, CollisionGroup, shouldCollide } from './CollisionShapes';
import type { Entity } from '@/entities/Entity';
import { EntityType } from '@/entities/Entity';
import type { Tower } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import type { Projectile } from '@/entities/Projectile';
import type { Player } from '@/entities/Player';
import type { Collectible } from '@/entities/Collectible';
import type { HealthPickup } from '@/entities/HealthPickup';

export class CollisionManager {
  private collisionSystem: CollisionSystem;
  private entityGroups: Map<Entity, CollisionGroup> = new Map();
  
  constructor(worldWidth: number, worldHeight: number) {
    this.collisionSystem = new CollisionSystem(worldWidth, worldHeight);
  }
  
  /**
   * Register an entity with the collision system
   */
  registerEntity(entity: Entity): void {
    let colliderConfig: ColliderConfig;
    let group: CollisionGroup;
    
    // Determine collider shape and group based on entity type
    switch (entity.type) {
      case EntityType.PLAYER:
        colliderConfig = CollisionShapes.circle(entity.radius);
        group = CollisionGroup.PLAYER;
        break;
        
      case EntityType.ENEMY:
        // Use different shapes based on enemy subtype if needed
        colliderConfig = CollisionShapes.circle(entity.radius);
        group = CollisionGroup.ENEMY;
        break;
        
      case EntityType.TOWER:
        colliderConfig = CollisionShapes.towerBase();
        group = CollisionGroup.TOWER;
        break;
        
      case EntityType.PROJECTILE:
        colliderConfig = CollisionShapes.projectileBullet();
        group = CollisionGroup.PROJECTILE;
        break;
        
      case EntityType.COLLECTIBLE:
      case EntityType.HEALTH_PICKUP:
      case EntityType.POWER_UP:
        colliderConfig = CollisionShapes.circle(entity.radius);
        group = CollisionGroup.PICKUP;
        break;
        
      default:
        // Default to circle collider
        colliderConfig = CollisionShapes.circle(entity.radius);
        group = CollisionGroup.OBSTACLE;
    }
    
    this.collisionSystem.registerEntity(entity, colliderConfig);
    this.entityGroups.set(entity, group);
  }
  
  /**
   * Unregister an entity from the collision system
   */
  unregisterEntity(entity: Entity): void {
    this.collisionSystem.unregisterEntity(entity);
    this.entityGroups.delete(entity);
  }
  
  /**
   * Update entity position in collision system
   */
  updateEntityPosition(entity: Entity): void {
    this.collisionSystem.updateEntityPosition(entity);
  }
  
  /**
   * Check if two entities collide
   */
  checkCollision(entityA: Entity, entityB: Entity): boolean {
    const groupA = this.entityGroups.get(entityA);
    const groupB = this.entityGroups.get(entityB);
    
    if (!groupA || !groupB) return false;
    
    // Check if these groups should collide
    if (!shouldCollide(groupA, groupB)) return false;
    
    return this.collisionSystem.checkCollision(entityA, entityB);
  }
  
  /**
   * Check projectile collision with enemies
   */
  checkProjectileCollisions(projectile: Projectile, enemies: Enemy[]): Enemy | null {
    // Use direct collision check since Projectile is simplified
    for (const enemy of enemies) {
      if (enemy.isAlive && projectile.collidesWith(enemy)) {
        return enemy;
      }
    }
    return null;
  }
  
  /**
   * Check collectible collision with player
   */
  checkCollectibleCollision(collectible: Collectible | HealthPickup, player: Player): boolean {
    return this.checkCollision(collectible, player);
  }
  
  /**
   * Get all entities colliding with a given entity
   */
  getCollisions(entity: Entity, filter?: (other: Entity) => boolean): Entity[] {
    return this.collisionSystem.checkCollisionsForEntity(entity, filter);
  }
  
  /**
   * Perform a raycast
   */
  raycast(
    origin: { x: number; y: number },
    direction: { x: number; y: number },
    maxDistance: number,
    filter?: (entity: Entity) => boolean
  ): { entity: Entity; point: { x: number; y: number }; distance: number } | null {
    return this.collisionSystem.rayCast(origin, direction, maxDistance, filter);
  }
  
  /**
   * Check if a point is inside any entity's collider
   */
  getEntityAtPoint(point: { x: number; y: number }, filter?: (entity: Entity) => boolean): Entity | null {
    return this.collisionSystem.pointInAnyCollider(point, filter);
  }
  
  /**
   * Clear all colliders
   */
  clear(): void {
    this.collisionSystem.clear();
    this.entityGroups.clear();
  }
  
  /**
   * Debug: Get all colliders for visualization
   */
  getAllColliders(): Array<{ entity: Entity; collider: any }> {
    return this.collisionSystem.getAllColliders();
  }
}