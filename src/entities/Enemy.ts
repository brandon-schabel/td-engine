import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import { Tower } from './Tower';
import type { Vector2 } from '@/utils/Vector2';
import { CooldownManager } from '@/utils/CooldownManager';
import { ENEMY_STATS, ENEMY_BEHAVIOR, EnemyBehavior } from '../config/EnemyConfig';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ENEMY_RENDER } from '@/config/RenderingConfig';

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK'
}

// Enemy stats are now imported from EnemyConfig

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
        if (nearbyTower && this.distanceTo(nearbyTower.position) <= this.attackRange * ENEMY_BEHAVIOR.towerAttackPriorityMultiplier) {
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

    // Update attack cooldown using CooldownManager
    this.currentAttackCooldown = CooldownManager.updateCooldown(this.currentAttackCooldown, deltaTime);

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
          if (this.distanceTo(waypoint) < ENEMY_BEHAVIOR.waypointReachedThreshold) {
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

    if (!CooldownManager.isReady(this.currentAttackCooldown)) {
      return false;
    }

    // Perform attack on current target (player or tower)
    this.target.takeDamage(this.damage);
    this.currentAttackCooldown = CooldownManager.startCooldown(this.attackCooldownTime);
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

  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any): void {
    // Try to render with texture first
    const textureId = `enemy_${this.enemyType.toLowerCase()}`;
    const texture = textureManager?.getTexture(textureId);
    
    if (texture && texture.loaded && textureManager) {
      ctx.drawImage(texture.image, screenPos.x - this.radius, screenPos.y - this.radius, this.radius * 2, this.radius * 2);
    } else {
      // Fallback to primitive rendering
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
      
      // Different colors for different enemy types
      switch (this.enemyType) {
        case EnemyType.BASIC:
          ctx.fillStyle = COLOR_THEME.enemies.basic;
          break;
        case EnemyType.FAST:
          ctx.fillStyle = COLOR_THEME.enemies.fast;
          break;
        case EnemyType.TANK:
          ctx.fillStyle = COLOR_THEME.enemies.tank;
          break;
        default:
          ctx.fillStyle = COLOR_THEME.enemies.default;
      }
      
      ctx.fill();
    }
    
    // Enemy outline - different color based on target
    const targetType = this.getTargetType();
    if (targetType === 'tower') {
      ctx.strokeStyle = COLOR_THEME.enemies.outlines.tower;
      ctx.lineWidth = ENEMY_RENDER.outline.towerAttacker;
    } else if (targetType === 'player') {
      ctx.strokeStyle = COLOR_THEME.enemies.outlines.player;
      ctx.lineWidth = ENEMY_RENDER.outline.playerAttacker;
    } else {
      ctx.strokeStyle = COLOR_THEME.enemies.outlines.default;
      ctx.lineWidth = ENEMY_RENDER.outline.default;
    }
    ctx.strokeRect(
      screenPos.x - this.radius,
      screenPos.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }

  // Render target indicator line
  renderTargetLine(ctx: CanvasRenderingContext2D, screenPos: Vector2, getScreenPosition: (entity: any) => Vector2, camera: any): void {
    const target = this.getTarget();
    if (target && camera.isVisible(target.position, 10)) {
      const targetScreenPos = getScreenPosition(target);
      const targetType = this.getTargetType();
      
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y);
      ctx.lineTo(targetScreenPos.x, targetScreenPos.y);
      ctx.setLineDash(ENEMY_RENDER.targetLine.dashPattern);
      ctx.strokeStyle = targetType === 'tower' ? COLOR_THEME.enemies.targetLine.tower : COLOR_THEME.enemies.targetLine.player;
      ctx.lineWidth = ENEMY_RENDER.targetLine.width;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}