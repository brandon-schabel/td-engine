import { Entity } from '@/entities/Entity';
import { Tower } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Vector2 } from '@/utils/Vector2';
import { MapData, Path } from '@/types/map';
import { WaveConfig } from '@/systems/WaveManager';
import { expect } from 'vitest';

export function expectEntityAlive(entity: Entity): void {
  expect(entity.health).toBeGreaterThan(0);
  expect(entity.isAlive).toBe(true);
}

export function expectEntityDead(entity: Entity): void {
  expect(entity.health).toBe(0);
  expect(entity.isAlive).toBe(false);
}

export function expectEntityInRange(entity1: Entity, entity2: Entity, range: number): void {
  const distance = entity1.distanceTo(entity2);
  expect(distance).toBeLessThanOrEqual(range);
}

export function expectEntityOutOfRange(entity1: Entity, entity2: Entity, range: number): void {
  const distance = entity1.distanceTo(entity2);
  expect(distance).toBeGreaterThan(range);
}

export function expectHealthBetween(entity: Entity, min: number, max: number): void {
  expect(entity.health).toBeGreaterThanOrEqual(min);
  expect(entity.health).toBeLessThanOrEqual(max);
}

export function expectHealthPercentage(entity: Entity, percentage: number, tolerance = 0.01): void {
  const expectedHealth = entity.maxHealth * percentage;
  expect(Math.abs(entity.health - expectedHealth)).toBeLessThan(tolerance * entity.maxHealth);
}

export function expectValidPosition(position: Vector2, bounds: { width: number; height: number }): void {
  expect(position.x).toBeGreaterThanOrEqual(0);
  expect(position.x).toBeLessThanOrEqual(bounds.width);
  expect(position.y).toBeGreaterThanOrEqual(0);
  expect(position.y).toBeLessThanOrEqual(bounds.height);
}

export function expectPositionNear(actual: Vector2, expected: Vector2, tolerance = 1): void {
  const distance = Math.sqrt(
    Math.pow(actual.x - expected.x, 2) + 
    Math.pow(actual.y - expected.y, 2)
  );
  expect(distance).toBeLessThanOrEqual(tolerance);
}

export function expectVelocityDirection(entity: { velocity: Vector2 }, direction: Vector2, tolerance = 0.1): void {
  const magnitude = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
  
  if (magnitude === 0) {
    expect(direction.x).toBe(0);
    expect(direction.y).toBe(0);
    return;
  }
  
  const normalizedVelocity = {
    x: entity.velocity.x / magnitude,
    y: entity.velocity.y / magnitude
  };
  
  const dirMagnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
  const normalizedDirection = {
    x: direction.x / dirMagnitude,
    y: direction.y / dirMagnitude
  };
  
  expect(Math.abs(normalizedVelocity.x - normalizedDirection.x)).toBeLessThan(tolerance);
  expect(Math.abs(normalizedVelocity.y - normalizedDirection.y)).toBeLessThan(tolerance);
}

export function expectTowerCanTarget(tower: Tower, enemy: Enemy): void {
  const distance = tower.distanceTo(enemy);
  expect(distance).toBeLessThanOrEqual(tower.range);
  expect(enemy.isDead()).toBe(false);
}

export function expectTowerCannotTarget(tower: Tower, enemy: Enemy, reason?: 'range' | 'dead'): void {
  if (reason === 'range') {
    const distance = tower.distanceTo(enemy);
    expect(distance).toBeGreaterThan(tower.range);
  } else if (reason === 'dead') {
    expect(enemy.isDead()).toBe(true);
  } else {
    const distance = tower.distanceTo(enemy);
    const canTarget = distance <= tower.range && !enemy.isDead();
    expect(canTarget).toBe(false);
  }
}

export function expectEnemyOnPath(enemy: Enemy, path: Path, tolerance = 5): void {
  let minDistance = Infinity;
  
  for (let i = 0; i < path.points.length - 1; i++) {
    const start = path.points[i];
    const end = path.points[i + 1];
    
    const segmentLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    );
    
    if (segmentLength === 0) continue;
    
    const t = Math.max(0, Math.min(1, (
      (enemy.position.x - start.x) * (end.x - start.x) +
      (enemy.position.y - start.y) * (end.y - start.y)
    ) / (segmentLength * segmentLength)));
    
    const projection = {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y)
    };
    
    const distance = Math.sqrt(
      Math.pow(enemy.position.x - projection.x, 2) +
      Math.pow(enemy.position.y - projection.y, 2)
    );
    
    minDistance = Math.min(minDistance, distance);
  }
  
  expect(minDistance).toBeLessThanOrEqual(tolerance);
}

export function expectValidMapData(mapData: MapData): void {
  expect(mapData.width).toBeGreaterThan(0);
  expect(mapData.height).toBeGreaterThan(0);
  expect(mapData.paths).toHaveLength.greaterThan(0);
  expect(mapData.spawns).toHaveLength.greaterThan(0);
  expect(mapData.exits).toHaveLength.greaterThan(0);
  expect(mapData.placeable).toHaveLength(mapData.height);
  
  mapData.placeable.forEach(row => {
    expect(row).toHaveLength(mapData.width);
  });
  
  mapData.paths.forEach(path => {
    expect(path.points).toHaveLength.greaterThan(1);
    expect(path.length).toBeGreaterThan(0);
  });
}

export function expectPathConnectivity(paths: Path[], spawns: Vector2[], exits: Vector2[]): void {
  paths.forEach((path, index) => {
    const firstPoint = path.points[0];
    const lastPoint = path.points[path.points.length - 1];
    
    const hasValidStart = spawns.some(spawn => 
      Math.abs(spawn.x - firstPoint.x) < 1 && 
      Math.abs(spawn.y - firstPoint.y) < 1
    );
    
    const hasValidEnd = exits.some(exit => 
      Math.abs(exit.x - lastPoint.x) < 1 && 
      Math.abs(exit.y - lastPoint.y) < 1
    );
    
    expect(hasValidStart || hasValidEnd).toBe(true);
  });
}

export function expectValidWaveConfig(waveConfig: WaveConfig): void {
  expect(waveConfig.waveNumber).toBeGreaterThan(0);
  expect(waveConfig.enemies.length).toBeGreaterThan(0);
  expect(waveConfig.startDelay).toBeGreaterThanOrEqual(0);
  
  waveConfig.enemies.forEach(enemyGroup => {
    expect(enemyGroup.count).toBeGreaterThan(0);
    expect(enemyGroup.spawnDelay).toBeGreaterThan(0);
    expect(['BASIC', 'FAST', 'TANK']).toContain(enemyGroup.type);
  });
}

export function expectResourcesChanged(
  before: { currency: number; lives: number; score: number },
  after: { currency: number; lives: number; score: number },
  expected: { currency?: number; lives?: number; score?: number }
): void {
  if (expected.currency !== undefined) {
    expect(after.currency - before.currency).toBe(expected.currency);
  }
  
  if (expected.lives !== undefined) {
    expect(after.lives - before.lives).toBe(expected.lives);
  }
  
  if (expected.score !== undefined) {
    expect(after.score - before.score).toBe(expected.score);
  }
}

export function expectEntityCount(
  entities: Entity[],
  count: number | { min?: number; max?: number }
): void {
  if (typeof count === 'number') {
    expect(entities).toHaveLength(count);
  } else {
    if (count.min !== undefined) {
      expect(entities.length).toBeGreaterThanOrEqual(count.min);
    }
    if (count.max !== undefined) {
      expect(entities.length).toBeLessThanOrEqual(count.max);
    }
  }
}

export function expectUniquePositions(entities: Entity[], tolerance = 0.1): void {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const distance = Math.sqrt(
        Math.pow(entities[i].position.x - entities[j].position.x, 2) +
        Math.pow(entities[i].position.y - entities[j].position.y, 2)
      );
      expect(distance).toBeGreaterThan(tolerance);
    }
  }
}