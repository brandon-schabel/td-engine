import { Tower, TowerType, UpgradeType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import { Entity } from '@/entities/Entity';
import type { Vector2 } from '@/utils/Vector2';
import { Grid } from '@/systems/Grid';
import type { TowerStats } from '@/entities/Tower';
import type { Path } from '@/types/map';

export interface EntityFactoryOptions {
  position?: Vector2;
  health?: number;
  maxHealth?: number;
  speed?: number;
  damage?: number;
}

export interface TowerFactoryOptions extends EntityFactoryOptions {
  type?: TowerType;
  range?: number;
  fireRate?: number;
  level?: number;
}

export interface EnemyFactoryOptions extends EntityFactoryOptions {
  type?: EnemyType;
  reward?: number;
  path?: Path;
  pathProgress?: number;
}

export interface ProjectileFactoryOptions {
  position?: Vector2;
  target?: Entity;
  damage?: number;
  speed?: number;
  pierce?: number;
  aoe?: number;
}

const DEFAULT_TOWER_STATS: Record<TowerType, TowerStats> = {
  [TowerType.BASIC]: { damage: 20, range: 100, fireRate: 1 },
  [TowerType.SNIPER]: { damage: 50, range: 200, fireRate: 0.5 },
  [TowerType.RAPID]: { damage: 5, range: 80, fireRate: 5 }
};

const DEFAULT_ENEMY_STATS = {
  [EnemyType.BASIC]: { health: 100, speed: 50, reward: 10 },
  [EnemyType.FAST]: { health: 50, speed: 100, reward: 15 },
  [EnemyType.TANK]: { health: 300, speed: 25, reward: 25 }
};

export function createTestTower(options: TowerFactoryOptions = {}): Tower {
  const type = options.type || TowerType.BASIC;
  const position = options.position || { x: 100, y: 100 };
  
  const tower = new Tower(type, position);
  
  if (options.health !== undefined) {
    tower.health = options.health;
  }
  
  if (options.maxHealth !== undefined) {
    tower.maxHealth = options.maxHealth;
  }
  
  if (options.level !== undefined && options.level > 1) {
    for (let i = 1; i < options.level; i++) {
      tower.upgrade(UpgradeType.DAMAGE); // Default to damage upgrades
    }
  }
  
  return tower;
}

export function createTestEnemy(options: EnemyFactoryOptions = {}): Enemy {
  const type = options.type || EnemyType.BASIC;
  const position = options.position || { x: 0, y: 0 };
  const stats = DEFAULT_ENEMY_STATS[type];
  const defaultPath: Path = {
    id: 'test-path',
    points: [
      { x: 0, y: 5 },
      { x: 10, y: 5 },
      { x: 10, y: 10 },
      { x: 20, y: 10 }
    ],
    length: 25
  };
  
  const enemy = new Enemy(
    position,
    options.health ?? stats.health,
    type
  );
  
  if (options.maxHealth !== undefined) {
    enemy.maxHealth = options.maxHealth;
  }
  
  if (options.path) {
    enemy.setPath(options.path.points);
  } else {
    enemy.setPath(defaultPath.points);
  }
  
  if (options.pathProgress !== undefined && 'pathProgress' in enemy) {
    (enemy as any).pathProgress = options.pathProgress;
  }
  
  return enemy;
}

export function createTestPlayer(options: EntityFactoryOptions = {}): Player {
  const position = options.position || { x: 400, y: 300 };
  const grid = new Grid(25, 19, 32);
  
  const player = new Player(position, grid);
  
  if (options.health !== undefined) {
    player.health = options.health;
  }
  
  if (options.maxHealth !== undefined) {
    player.maxHealth = options.maxHealth;
  }
  
  if (options.speed !== undefined) {
    player.speed = options.speed;
  }
  
  if (options.damage !== undefined) {
    player.damage = options.damage;
  }
  
  return player;
}

export function createTestProjectile(options: ProjectileFactoryOptions = {}): Projectile {
  const position = options.position || { x: 100, y: 100 };
  const target = options.target || createTestEnemy({ position: { x: 200, y: 200 } });
  const damage = options.damage ?? 10;
  const speed = options.speed ?? 300;
  
  const projectile = new Projectile(position, target, damage, speed);
  
  if (options.pierce !== undefined) {
    projectile.pierce = options.pierce;
  }
  
  if (options.aoe !== undefined) {
    projectile.aoe = options.aoe;
  }
  
  return projectile;
}

export function createTestGrid(width = 25, height = 19, cellSize = 32): Grid {
  return new Grid(width, height, cellSize);
}

export function createTestPath(points?: Vector2[]): Path {
  const defaultPoints = [
    { x: 0, y: 5 },
    { x: 5, y: 5 },
    { x: 5, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 15 },
    { x: 15, y: 15 }
  ];
  
  const pathPoints = points || defaultPoints;
  let length = 0;
  
  for (let i = 1; i < pathPoints.length; i++) {
    const dx = pathPoints[i].x - pathPoints[i - 1].x;
    const dy = pathPoints[i].y - pathPoints[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  
  return {
    id: `test-path-${Date.now()}`,
    points: pathPoints,
    length
  };
}

export function createEntityGroup<T extends Entity>(
  factory: (options?: any) => T,
  count: number,
  options?: any[]
): T[] {
  const entities: T[] = [];
  
  for (let i = 0; i < count; i++) {
    const entityOptions = options?.[i] || {};
    entities.push(factory(entityOptions));
  }
  
  return entities;
}

export function positionEntitiesInGrid<T extends Entity>(
  entities: T[],
  gridPositions: Vector2[],
  cellSize = 32
): void {
  entities.forEach((entity, index) => {
    if (index < gridPositions.length) {
      const gridPos = gridPositions[index];
      entity.position = {
        x: gridPos.x * cellSize + cellSize / 2,
        y: gridPos.y * cellSize + cellSize / 2
      };
    }
  });
}

export function damageEntity(entity: Entity, amount: number): void {
  entity.takeDamage(amount);
}

export function healEntity(entity: Entity, amount: number): void {
  entity.heal(amount);
}

export function setEntityHealth(entity: Entity, health: number): void {
  entity.health = Math.max(0, Math.min(health, entity.maxHealth));
}

export function killEntity(entity: Entity): void {
  entity.health = 0;
}