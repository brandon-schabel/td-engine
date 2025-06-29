/**
 * CollisionSystem - Advanced collision detection using SAT.js
 * Supports circles, rectangles, and polygons with efficient broad-phase detection
 */

import SAT from 'sat';
import type { Entity } from '@/entities/Entity';
import type { Vector2 } from '@/utils/Vector2';

export enum ColliderType {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon'
}

export interface ColliderConfig {
  type: ColliderType;
  // For circles
  radius?: number;
  // For rectangles
  width?: number;
  height?: number;
  // For polygons
  points?: Vector2[];
  // Offset from entity position
  offset?: Vector2;
}

export class CollisionSystem {
  private colliders: Map<Entity, SAT.Circle | SAT.Polygon> = new Map();
  private spatialGrid: Map<string, Set<Entity>> = new Map();
  private gridCellSize: number = 100;
  private collisionResponse: SAT.Response = new SAT.Response();
  
  constructor(worldWidth: number, worldHeight: number, cellSize: number = 100) {
    this.gridCellSize = cellSize;
    this.initializeSpatialGrid(worldWidth, worldHeight);
  }
  
  private initializeSpatialGrid(width: number, height: number): void {
    const cols = Math.ceil(width / this.gridCellSize);
    const rows = Math.ceil(height / this.gridCellSize);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.spatialGrid.set(`${x},${y}`, new Set());
      }
    }
  }
  
  /**
   * Register an entity with a collider
   */
  public registerEntity(entity: Entity, config: ColliderConfig): void {
    let collider: SAT.Circle | SAT.Polygon;
    
    switch (config.type) {
      case ColliderType.CIRCLE:
        collider = new SAT.Circle(
          new SAT.Vector(
            entity.position.x + (config.offset?.x || 0),
            entity.position.y + (config.offset?.y || 0)
          ),
          config.radius || entity.radius
        );
        break;
        
      case ColliderType.RECTANGLE:
        const width = config.width || entity.radius * 2;
        const height = config.height || entity.radius * 2;
        collider = new SAT.Box(
          new SAT.Vector(
            entity.position.x - width / 2 + (config.offset?.x || 0),
            entity.position.y - height / 2 + (config.offset?.y || 0)
          ),
          width,
          height
        ).toPolygon();
        break;
        
      case ColliderType.POLYGON:
        if (!config.points || config.points.length < 3) {
          throw new Error('Polygon must have at least 3 points');
        }
        
        const points = config.points.map(p => new SAT.Vector(p.x, p.y));
        collider = new SAT.Polygon(
          new SAT.Vector(
            entity.position.x + (config.offset?.x || 0),
            entity.position.y + (config.offset?.y || 0)
          ),
          points
        );
        break;
    }
    
    this.colliders.set(entity, collider);
    this.updateEntityInGrid(entity);
  }
  
  /**
   * Unregister an entity
   */
  public unregisterEntity(entity: Entity): void {
    this.colliders.delete(entity);
    this.removeEntityFromGrid(entity);
  }
  
  /**
   * Update entity position in collision system
   */
  public updateEntityPosition(entity: Entity): void {
    const collider = this.colliders.get(entity);
    if (!collider) return;
    
    // Update collider position
    if (collider instanceof SAT.Circle) {
      collider.pos.x = entity.position.x;
      collider.pos.y = entity.position.y;
    } else {
      collider.pos.x = entity.position.x;
      collider.pos.y = entity.position.y;
    }
    
    // Update spatial grid
    this.updateEntityInGrid(entity);
  }
  
  /**
   * Check collision between two entities
   */
  public checkCollision(entityA: Entity, entityB: Entity): boolean {
    const colliderA = this.colliders.get(entityA);
    const colliderB = this.colliders.get(entityB);
    
    if (!colliderA || !colliderB) return false;
    
    this.collisionResponse.clear();
    
    // Check collision based on collider types
    if (colliderA instanceof SAT.Circle && colliderB instanceof SAT.Circle) {
      return SAT.testCircleCircle(colliderA, colliderB, this.collisionResponse);
    } else if (colliderA instanceof SAT.Circle && colliderB instanceof SAT.Polygon) {
      return SAT.testCirclePolygon(colliderA, colliderB, this.collisionResponse);
    } else if (colliderA instanceof SAT.Polygon && colliderB instanceof SAT.Circle) {
      return SAT.testPolygonCircle(colliderA, colliderB, this.collisionResponse);
    } else if (colliderA instanceof SAT.Polygon && colliderB instanceof SAT.Polygon) {
      return SAT.testPolygonPolygon(colliderA, colliderB, this.collisionResponse);
    }
    
    return false;
  }
  
  /**
   * Get collision details (overlap vector, etc.)
   */
  public getCollisionDetails(entityA: Entity, entityB: Entity): SAT.Response | null {
    if (this.checkCollision(entityA, entityB)) {
      return { ...this.collisionResponse };
    }
    return null;
  }
  
  /**
   * Check collisions for an entity against all nearby entities
   */
  public checkCollisionsForEntity(entity: Entity, filter?: (other: Entity) => boolean): Entity[] {
    const collisions: Entity[] = [];
    const nearbyEntities = this.getNearbyEntities(entity);
    
    for (const other of nearbyEntities) {
      if (other === entity) continue;
      if (filter && !filter(other)) continue;
      
      if (this.checkCollision(entity, other)) {
        collisions.push(other);
      }
    }
    
    return collisions;
  }
  
  /**
   * Ray cast from a point in a direction
   */
  public rayCast(
    origin: Vector2,
    direction: Vector2,
    maxDistance: number,
    filter?: (entity: Entity) => boolean
  ): { entity: Entity; point: Vector2; distance: number } | null {
    // Create a line segment for the ray
    const endPoint = {
      x: origin.x + direction.x * maxDistance,
      y: origin.y + direction.y * maxDistance
    };
    
    const ray = new SAT.Polygon(new SAT.Vector(0, 0), [
      new SAT.Vector(origin.x, origin.y),
      new SAT.Vector(endPoint.x, endPoint.y)
    ]);
    
    let closestHit: { entity: Entity; point: Vector2; distance: number } | null = null;
    let closestDistance = maxDistance;
    
    // Check all entities
    for (const [entity, collider] of this.colliders) {
      if (filter && !filter(entity)) continue;
      
      this.collisionResponse.clear();
      let hit = false;
      
      if (collider instanceof SAT.Circle) {
        hit = SAT.testPolygonCircle(ray, collider, this.collisionResponse);
      } else {
        hit = SAT.testPolygonPolygon(ray, collider, this.collisionResponse);
      }
      
      if (hit && this.collisionResponse.overlap < closestDistance) {
        closestDistance = this.collisionResponse.overlap;
        closestHit = {
          entity,
          point: {
            x: origin.x + direction.x * closestDistance,
            y: origin.y + direction.y * closestDistance
          },
          distance: closestDistance
        };
      }
    }
    
    return closestHit;
  }
  
  /**
   * Check if a point is inside any collider
   */
  public pointInAnyCollider(point: Vector2, filter?: (entity: Entity) => boolean): Entity | null {
    const testPoint = new SAT.Vector(point.x, point.y);
    
    for (const [entity, collider] of this.colliders) {
      if (filter && !filter(entity)) continue;
      
      if (collider instanceof SAT.Circle) {
        if (SAT.pointInCircle(testPoint, collider)) {
          return entity;
        }
      } else {
        if (SAT.pointInPolygon(testPoint, collider)) {
          return entity;
        }
      }
    }
    
    return null;
  }
  
  // Spatial grid management
  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridCellSize);
    const gridY = Math.floor(y / this.gridCellSize);
    return `${gridX},${gridY}`;
  }
  
  private updateEntityInGrid(entity: Entity): void {
    this.removeEntityFromGrid(entity);
    
    const key = this.getGridKey(entity.position.x, entity.position.y);
    const cell = this.spatialGrid.get(key);
    if (cell) {
      cell.add(entity);
    }
  }
  
  private removeEntityFromGrid(entity: Entity): void {
    for (const cell of this.spatialGrid.values()) {
      cell.delete(entity);
    }
  }
  
  private getNearbyEntities(entity: Entity): Set<Entity> {
    const nearby = new Set<Entity>();
    const gridX = Math.floor(entity.position.x / this.gridCellSize);
    const gridY = Math.floor(entity.position.y / this.gridCellSize);
    
    // Check 3x3 grid around entity
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          for (const other of cell) {
            nearby.add(other);
          }
        }
      }
    }
    
    return nearby;
  }
  
  /**
   * Debug: Get all colliders for visualization
   */
  public getAllColliders(): Array<{ entity: Entity; collider: SAT.Circle | SAT.Polygon }> {
    const result: Array<{ entity: Entity; collider: SAT.Circle | SAT.Polygon }> = [];
    
    for (const [entity, collider] of this.colliders) {
      result.push({ entity, collider });
    }
    
    return result;
  }
  
  /**
   * Clear all colliders
   */
  public clear(): void {
    this.colliders.clear();
    for (const cell of this.spatialGrid.values()) {
      cell.clear();
    }
  }
}