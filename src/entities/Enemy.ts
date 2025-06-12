import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import { Tower } from './Tower';
import type { Vector2 } from '../utils/Vector2';

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK'
}

export enum EnemyBehavior {
  PLAYER_FOCUSED = 'PLAYER_FOCUSED',
  TOWER_FOCUSED = 'TOWER_FOCUSED',
  OPPORTUNIST = 'OPPORTUNIST' // Attacks towers if close, otherwise targets player
}

interface EnemyStats {
  health: number;
  speed: number;
  radius: number;
  reward: number; // Currency given when killed
  damage: number;
  attackRange: number;
  attackCooldown: number; // milliseconds
  towerDetectionRange: number; // How far they can detect towers
  behavior: EnemyBehavior;
}

const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  [EnemyType.BASIC]: {
    health: 50,
    speed: 50,
    radius: 8,
    reward: 10,
    damage: 10,
    attackRange: 20,
    attackCooldown: 1000, // 1 attack per second
    towerDetectionRange: 60,
    behavior: EnemyBehavior.OPPORTUNIST // Will attack towers if close, otherwise player
  },
  [EnemyType.FAST]: {
    health: 30,
    speed: 100,
    radius: 6,
    reward: 15,
    damage: 5,
    attackRange: 15,
    attackCooldown: 500, // 2 attacks per second
    towerDetectionRange: 40,
    behavior: EnemyBehavior.PLAYER_FOCUSED // Primarily targets player
  },
  [EnemyType.TANK]: {
    health: 200,
    speed: 25,
    radius: 12,
    reward: 50,
    damage: 20,
    attackRange: 25,
    attackCooldown: 2000, // 0.5 attacks per second
    towerDetectionRange: 80,
    behavior: EnemyBehavior.TOWER_FOCUSED // Prioritizes attacking towers
  }
};

export class Enemy extends Entity {
  public readonly enemyType: EnemyType;
  public readonly speed: number;
  public readonly reward: number;
  public readonly damage: number;
  public readonly behavior: EnemyBehavior;
  private readonly attackRange: number;
  private readonly attackCooldownTime: number;
  private readonly towerDetectionRange: number;
  private currentAttackCooldown: number = 0;
  private target: Player | Tower | null = null;
  private playerTarget: Player | null = null;
  private path: Vector2[] = [];
  private currentPathIndex: number = 0;
  private availableTowers: Tower[] = [];

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
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackCooldownTime = stats.attackCooldown;
    this.towerDetectionRange = stats.towerDetectionRange;
    this.behavior = stats.behavior;
  }

  setPath(path: Vector2[]): void {
    this.path = [...path];
    this.currentPathIndex = 0;
  }

  setTowers(towers: Tower[]): void {
    this.availableTowers = towers;
  }

  private findBestTowerTarget(): Tower | null {
    const nearbyTowers = this.availableTowers.filter(tower => 
      tower.isAlive && this.distanceTo(tower.position) <= this.towerDetectionRange
    );

    if (nearbyTowers.length === 0) return null;

    // Find closest tower
    return nearbyTowers.reduce((closest, tower) => {
      const closestDistance = closest ? this.distanceTo(closest.position) : Infinity;
      const towerDistance = this.distanceTo(tower.position);
      return towerDistance < closestDistance ? tower : closest;
    }, null as Tower | null);
  }

  private selectTarget(): Player | Tower | null {
    const nearbyTower = this.findBestTowerTarget();
    const alivePlayerTarget = this.playerTarget && this.playerTarget.isAlive ? this.playerTarget : null;
    
    switch (this.behavior) {
      case EnemyBehavior.TOWER_FOCUSED:
        // Prioritize towers, fallback to player
        return nearbyTower || alivePlayerTarget;
        
      case EnemyBehavior.PLAYER_FOCUSED:
        // Prioritize player, only attack towers if very close
        if (nearbyTower && this.distanceTo(nearbyTower.position) <= this.attackRange * 1.2) {
          return nearbyTower;
        }
        return alivePlayerTarget;
        
      case EnemyBehavior.OPPORTUNIST:
        // Attack towers if in detection range, otherwise target player
        return nearbyTower || alivePlayerTarget;
        
      default:
        return alivePlayerTarget;
    }
  }

  override update(deltaTime: number): void {
    if (!this.isAlive) {
      return;
    }

    // Update attack cooldown
    if (this.currentAttackCooldown > 0) {
      this.currentAttackCooldown = Math.max(0, this.currentAttackCooldown - deltaTime);
    }

    // Select best target based on behavior and proximity
    this.target = this.selectTarget();

    // Target-based movement and attack
    if (this.target && this.target.isAlive) {
      if (this.isInAttackRange()) {
        // Stop moving and attack
        this.tryAttack();
      } else {
        // Move towards target (tower or player)
        this.moveTo(this.target.position, this.speed);
      }
    } else if (this.playerTarget && this.playerTarget.isAlive) {
      // No towers to attack, move toward player
      if (this.playerTarget.position) {
        this.moveTo(this.playerTarget.position, this.speed);
      }
    } else if (this.path.length > 0) {
      // Fallback to path movement if no target
      if (this.currentPathIndex < this.path.length) {
        const waypoint = this.path[this.currentPathIndex];
        if (waypoint) {
          this.moveTo(waypoint, this.speed);
          
          // Check if reached waypoint
          if (this.distanceTo(waypoint) < 5) {
            this.currentPathIndex++;
          }
        }
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

  // Player targeting methods
  setTarget(player: Player): void {
    this.playerTarget = player;
  }

  getTarget(): Player | Tower | null {
    return this.target;
  }

  getPlayerTarget(): Player | null {
    return this.playerTarget;
  }

  getAngleToTarget(): number {
    if (!this.target) return 0;
    
    const dx = this.target.position.x - this.position.x;
    const dy = this.target.position.y - this.position.y;
    return Math.atan2(dy, dx);
  }

  // Attack methods
  isInAttackRange(): boolean {
    if (!this.target) return false;
    return this.distanceTo(this.target.position) <= this.attackRange;
  }

  tryAttack(): boolean {
    if (!this.isAlive || !this.target || !this.target.isAlive || !this.isInAttackRange()) {
      return false;
    }

    if (this.currentAttackCooldown > 0) {
      return false;
    }

    // Perform attack on current target (player or tower)
    this.target.takeDamage(this.damage);
    this.currentAttackCooldown = this.attackCooldownTime;
    return true;
  }

  // Get current target type for debugging/display
  getTargetType(): string {
    if (!this.target) return 'none';
    if (this.target === this.playerTarget) return 'player';
    return 'tower';
  }

  getAttackCooldown(): number {
    return this.attackCooldownTime;
  }
}