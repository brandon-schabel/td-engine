/**
 * CollisionShapes - Predefined collision shapes for common game entities
 */

import { ColliderType, type ColliderConfig } from './CollisionSystem';
import type { Vector2 } from '@/utils/Vector2';

export const CollisionShapes = {
  // Basic shapes
  circle: (radius: number): ColliderConfig => ({
    type: ColliderType.CIRCLE,
    radius
  }),
  
  square: (size: number): ColliderConfig => ({
    type: ColliderType.RECTANGLE,
    width: size,
    height: size
  }),
  
  rectangle: (width: number, height: number): ColliderConfig => ({
    type: ColliderType.RECTANGLE,
    width,
    height
  }),
  
  // Tower shapes
  towerBase: (): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: [
      { x: -15, y: -15 },
      { x: 15, y: -15 },
      { x: 15, y: 15 },
      { x: -15, y: 15 }
    ]
  }),
  
  towerHexagon: (): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: hexagonPoints(20)
  }),
  
  // Enemy shapes
  enemyTank: (): ColliderConfig => ({
    type: ColliderType.RECTANGLE,
    width: 30,
    height: 25
  }),
  
  enemyFlying: (): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: [
      { x: 0, y: -12 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
      { x: -5, y: 10 },
      { x: -10, y: 0 }
    ]
  }),
  
  // Projectile shapes
  projectileBullet: (): ColliderConfig => ({
    type: ColliderType.CIRCLE,
    radius: 3
  }),
  
  projectileMissile: (): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: [
      { x: 0, y: -8 },
      { x: 3, y: 0 },
      { x: 3, y: 5 },
      { x: -3, y: 5 },
      { x: -3, y: 0 }
    ]
  }),
  
  projectileLaser: (length: number): ColliderConfig => ({
    type: ColliderType.RECTANGLE,
    width: 4,
    height: length
  }),
  
  // Area shapes
  explosionArea: (radius: number): ColliderConfig => ({
    type: ColliderType.CIRCLE,
    radius
  }),
  
  shieldBubble: (radius: number): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: circleToPolygon(radius, 12) // 12-sided polygon
  }),
  
  // Obstacle shapes
  rockFormation: (): ColliderConfig => ({
    type: ColliderType.POLYGON,
    points: [
      { x: -20, y: -10 },
      { x: -15, y: -20 },
      { x: 5, y: -25 },
      { x: 20, y: -15 },
      { x: 25, y: 5 },
      { x: 15, y: 20 },
      { x: -10, y: 25 },
      { x: -25, y: 10 }
    ]
  }),
  
  wall: (width: number, height: number): ColliderConfig => ({
    type: ColliderType.RECTANGLE,
    width,
    height
  })
};

// Helper functions
function hexagonPoints(radius: number): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  return points;
}

function circleToPolygon(radius: number, segments: number): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (Math.PI * 2 * i) / segments;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  return points;
}

// Collision groups for filtering
export enum CollisionGroup {
  PLAYER = 1 << 0,
  ENEMY = 1 << 1,
  TOWER = 1 << 2,
  PROJECTILE = 1 << 3,
  OBSTACLE = 1 << 4,
  PICKUP = 1 << 5,
  AREA_EFFECT = 1 << 6
}

// Helper to check collision groups
export function shouldCollide(groupA: number, groupB: number): boolean {
  // Define which groups can collide
  const collisionMatrix: Record<number, number> = {
    [CollisionGroup.PLAYER]: CollisionGroup.ENEMY | CollisionGroup.OBSTACLE | CollisionGroup.PICKUP,
    [CollisionGroup.ENEMY]: CollisionGroup.PLAYER | CollisionGroup.TOWER | CollisionGroup.PROJECTILE | CollisionGroup.OBSTACLE,
    [CollisionGroup.TOWER]: CollisionGroup.ENEMY,
    [CollisionGroup.PROJECTILE]: CollisionGroup.ENEMY | CollisionGroup.OBSTACLE,
    [CollisionGroup.OBSTACLE]: CollisionGroup.PLAYER | CollisionGroup.ENEMY | CollisionGroup.PROJECTILE,
    [CollisionGroup.PICKUP]: CollisionGroup.PLAYER,
    [CollisionGroup.AREA_EFFECT]: CollisionGroup.ENEMY | CollisionGroup.PLAYER
  };
  
  return (collisionMatrix[groupA] & groupB) !== 0 || (collisionMatrix[groupB] & groupA) !== 0;
}