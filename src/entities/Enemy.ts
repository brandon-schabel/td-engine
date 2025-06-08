import { Entity, EntityType } from './Entity';
import type { Vector2 } from '../utils/Vector2';

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK'
}

interface EnemyStats {
  health: number;
  speed: number;
  radius: number;
  reward: number; // Currency given when killed
}

const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  [EnemyType.BASIC]: {
    health: 50,
    speed: 50,
    radius: 8,
    reward: 10
  },
  [EnemyType.FAST]: {
    health: 30,
    speed: 100,
    radius: 6,
    reward: 15
  },
  [EnemyType.TANK]: {
    health: 200,
    speed: 25,
    radius: 12,
    reward: 50
  }
};

export class Enemy extends Entity {
  public readonly enemyType: EnemyType;
  public readonly speed: number;
  public readonly reward: number;
  private path: Vector2[] = [];
  private currentPathIndex: number = 0;

  constructor(
    position: Vector2, 
    health: number,
    enemyType: EnemyType = EnemyType.BASIC
  ) {
    const stats = ENEMY_STATS[enemyType];
    super(EntityType.ENEMY, position, health || stats.health, stats.radius);
    
    this.enemyType = enemyType;
    this.speed = stats.speed;
    this.reward = stats.reward;
  }

  setPath(path: Vector2[]): void {
    this.path = [...path];
    this.currentPathIndex = 0;
  }

  update(deltaTime: number): void {
    if (!this.isAlive || this.path.length === 0) {
      return;
    }

    // Move towards current waypoint
    if (this.currentPathIndex < this.path.length) {
      const target = this.path[this.currentPathIndex];
      this.moveTo(target, this.speed);
      
      // Check if reached waypoint
      if (this.distanceTo(target) < 5) {
        this.currentPathIndex++;
      }
    }

    super.update(deltaTime);
  }

  hasReachedEnd(): boolean {
    return this.currentPathIndex >= this.path.length;
  }

  getProgress(): number {
    if (this.path.length === 0) return 0;
    return this.currentPathIndex / this.path.length;
  }
}