import { expect } from 'vitest';
import { Entity } from '@/entities/Entity';
import { Tower } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Vector2 } from '@/utils/Vector2';
import { Path } from '@/types/map';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInRange(target: Entity, range: number): void;
    toBeOnPath(path: Path, tolerance?: number): void;
    toHaveTargeted(enemy: Enemy): void;
    toBeWithinBounds(bounds: { width: number; height: number }): void;
    toHaveHealthPercentage(percentage: number, tolerance?: number): void;
    toBeMovingTowards(target: Vector2, tolerance?: number): void;
    toHaveFireRateOf(shotsPerSecond: number, tolerance?: number): void;
    toBeAtGridPosition(gridX: number, gridY: number, cellSize?: number): void;
  }
}

// Custom matcher: toBeInRange
expect.extend({
  toBeInRange(received: Entity, target: Entity, range: number) {
    const distance = received.distanceTo(target);
    const pass = distance <= range;
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected entity at (${received.position.x}, ${received.position.y}) not to be within ${range} units of target at (${target.position.x}, ${target.position.y}), but distance was ${distance.toFixed(2)}`
          : `Expected entity at (${received.position.x}, ${received.position.y}) to be within ${range} units of target at (${target.position.x}, ${target.position.y}), but distance was ${distance.toFixed(2)}`,
    };
  },
});

// Custom matcher: toBeOnPath
expect.extend({
  toBeOnPath(received: Entity, path: Path, tolerance = 5) {
    let minDistance = Infinity;
    let closestSegment = -1;
    
    for (let i = 0; i < path.points.length - 1; i++) {
      const start = path.points[i];
      const end = path.points[i + 1];
      
      const segmentLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.y - start.y, 2)
      );
      
      if (segmentLength === 0) continue;
      
      const t = Math.max(0, Math.min(1, (
        (received.position.x - start.x) * (end.x - start.x) +
        (received.position.y - start.y) * (end.y - start.y)
      ) / (segmentLength * segmentLength)));
      
      const projection = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
      };
      
      const distance = Math.sqrt(
        Math.pow(received.position.x - projection.x, 2) +
        Math.pow(received.position.y - projection.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSegment = i;
      }
    }
    
    const pass = minDistance <= tolerance;
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected entity at (${received.position.x}, ${received.position.y}) not to be on path, but was ${minDistance.toFixed(2)} units from segment ${closestSegment}`
          : `Expected entity at (${received.position.x}, ${received.position.y}) to be within ${tolerance} units of path, but was ${minDistance.toFixed(2)} units away from closest segment ${closestSegment}`,
    };
  },
});

// Custom matcher: toHaveTargeted
expect.extend({
  toHaveTargeted(received: Tower, enemy: Enemy) {
    const receivedAny = received as any;
    const pass = receivedAny.target === enemy || 
                 (receivedAny.lastTarget && receivedAny.lastTarget === enemy);
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected tower not to have targeted enemy at (${enemy.position.x}, ${enemy.position.y})`
          : `Expected tower to have targeted enemy at (${enemy.position.x}, ${enemy.position.y})`,
    };
  },
});

// Custom matcher: toBeWithinBounds
expect.extend({
  toBeWithinBounds(received: Vector2, bounds: { width: number; height: number }) {
    const pass = received.x >= 0 && 
                 received.x <= bounds.width && 
                 received.y >= 0 && 
                 received.y <= bounds.height;
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected position (${received.x}, ${received.y}) not to be within bounds (0, 0) to (${bounds.width}, ${bounds.height})`
          : `Expected position (${received.x}, ${received.y}) to be within bounds (0, 0) to (${bounds.width}, ${bounds.height})`,
    };
  },
});

// Custom matcher: toHaveHealthPercentage
expect.extend({
  toHaveHealthPercentage(received: Entity, percentage: number, tolerance = 0.01) {
    const actualPercentage = received.health / received.maxHealth;
    const difference = Math.abs(actualPercentage - percentage);
    const pass = difference <= tolerance;
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected entity not to have ${(percentage * 100).toFixed(1)}% health, but had ${(actualPercentage * 100).toFixed(1)}%`
          : `Expected entity to have ${(percentage * 100).toFixed(1)}% health (±${(tolerance * 100).toFixed(1)}%), but had ${(actualPercentage * 100).toFixed(1)}%`,
    };
  },
});

// Custom matcher: toBeMovingTowards
expect.extend({
  toBeMovingTowards(received: { position: Vector2; velocity: Vector2 }, target: Vector2, tolerance = 0.1) {
    const velocityMagnitude = Math.sqrt(received.velocity.x ** 2 + received.velocity.y ** 2);
    
    if (velocityMagnitude === 0) {
      return {
        pass: false,
        message: () => `Expected entity to be moving towards (${target.x}, ${target.y}), but velocity is zero`,
      };
    }
    
    // Calculate direction to target
    const dx = target.x - received.position.x;
    const dy = target.y - received.position.y;
    const distanceToTarget = Math.sqrt(dx ** 2 + dy ** 2);
    
    if (distanceToTarget === 0) {
      return {
        pass: true,
        message: () => `Entity is already at target position (${target.x}, ${target.y})`,
      };
    }
    
    // Normalize both vectors
    const targetDirection = { x: dx / distanceToTarget, y: dy / distanceToTarget };
    const velocityDirection = { x: received.velocity.x / velocityMagnitude, y: received.velocity.y / velocityMagnitude };
    
    // Calculate dot product (1 = same direction, -1 = opposite direction)
    const dotProduct = targetDirection.x * velocityDirection.x + targetDirection.y * velocityDirection.y;
    const pass = dotProduct >= (1 - tolerance);
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected entity not to be moving towards (${target.x}, ${target.y})`
          : `Expected entity to be moving towards (${target.x}, ${target.y}), but velocity direction deviates by ${Math.acos(dotProduct) * 180 / Math.PI}°`,
    };
  },
});

// Custom matcher: toHaveFireRateOf
expect.extend({
  toHaveFireRateOf(received: Tower, shotsPerSecond: number, tolerance = 0.1) {
    const actualFireRate = received.fireRate;
    const difference = Math.abs(actualFireRate - shotsPerSecond);
    const pass = difference <= tolerance;
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected tower not to have fire rate of ${shotsPerSecond} shots/sec, but had ${actualFireRate} shots/sec`
          : `Expected tower to have fire rate of ${shotsPerSecond} shots/sec (±${tolerance}), but had ${actualFireRate} shots/sec`,
    };
  },
});

// Custom matcher: toBeAtGridPosition
expect.extend({
  toBeAtGridPosition(received: Entity, gridX: number, gridY: number, cellSize = 32) {
    const expectedX = gridX * cellSize + cellSize / 2;
    const expectedY = gridY * cellSize + cellSize / 2;
    const pass = received.position.x === expectedX && received.position.y === expectedY;
    
    const actualGridX = Math.floor((received.position.x - cellSize / 2) / cellSize);
    const actualGridY = Math.floor((received.position.y - cellSize / 2) / cellSize);
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected entity not to be at grid position (${gridX}, ${gridY})`
          : `Expected entity to be at grid position (${gridX}, ${gridY}), but was at (${actualGridX}, ${actualGridY})`,
    };
  },
});