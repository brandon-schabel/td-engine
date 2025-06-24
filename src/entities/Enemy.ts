import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import { Tower } from './Tower';
import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import { MovementType } from '@/systems/MovementSystem';
import { CooldownManager } from '@/utils/CooldownManager';
import { ENEMY_STATS, ENEMY_BEHAVIOR, EnemyBehavior } from '../config/EnemyConfig';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ENEMY_RENDER } from '@/config/RenderingConfig';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { Pathfinding } from '@/systems/Pathfinding';
import { NavigationGrid } from '@/systems/NavigationGrid';

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
  private grid: Grid | null = null;
  private navigationGrid: NavigationGrid | null = null;
  
  // Pathfinding properties
  private currentPath: Vector2[] = [];
  private currentPathTarget: Vector2 | null = null;
  private pathRecalculationTimer: number = 0;
  private readonly PATH_RECALCULATION_INTERVAL = 1000; // Recalculate path every second
  private readonly WAYPOINT_REACHED_DISTANCE = 10; // Distance to consider waypoint reached

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
    
    // Set up terrain-aware movement
    this.baseSpeed = stats.speed;
    this.currentSpeed = stats.speed;
    
    // Set movement type based on enemy type
    switch (enemyType) {
      case EnemyType.FAST:
        this.movementType = MovementType.WALKING;
        break;
      case EnemyType.TANK:
        this.movementType = MovementType.WALKING;
        break;
      default:
        this.movementType = MovementType.WALKING;
    }
  }

  setPath(path: Vector2[]): void {
    this.path = [...path];
    this.currentPathIndex = 0;
  }

  setTowers(towers: Tower[]): void {
    this.availableTowers = towers;
  }

  setGrid(grid: Grid): void {
    this.grid = grid;
  }

  setNavigationGrid(navGrid: NavigationGrid): void {
    this.navigationGrid = navGrid;
  }

  setPlayerTarget(player: Player): void {
    this.playerTarget = player;
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

  override update(deltaTime: number, grid?: Grid): void {
    if (!this.isAlive) {
      return;
    }

    // Use provided grid or stored grid reference
    const activeGrid = grid || this.grid || undefined;

    // Update attack cooldown using CooldownManager
    this.currentAttackCooldown = CooldownManager.updateCooldown(this.currentAttackCooldown, deltaTime);
    
    // Update path recalculation timer
    this.pathRecalculationTimer += deltaTime;

    // Select best target based on behavior and proximity
    this.target = this.selectTarget();

    // Target-based movement and attack
    if (this.target && this.target.isAlive) {
      if (this.isInAttackRange()) {
        // Stop moving and attack
        this.velocity = { x: 0, y: 0 };
        this.tryAttack();
      } else {
        // Use pathfinding to move towards target
        this.moveToWithPathfinding(this.target.position, activeGrid);
      }
    } else if (this.playerTarget && this.playerTarget.isAlive) {
      // No towers to attack, move toward player
      if (this.playerTarget.position) {
        this.moveToWithPathfinding(this.playerTarget.position, activeGrid);
      }
    } else if (this.path.length > 0) {
      // Fallback to original path movement if no target
      if (this.currentPathIndex < this.path.length) {
        const waypoint = this.path[this.currentPathIndex];
        if (waypoint) {
          this.moveTo(waypoint, this.speed, activeGrid);
          
          // Check if reached waypoint
          if (this.distanceTo(waypoint) < ENEMY_BEHAVIOR.waypointReachedThreshold) {
            this.currentPathIndex++;
          }
        }
      }
    }

    super.update(deltaTime, activeGrid);
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

  // Create destruction effect when enemy dies
  createDestructionEffect(): DestructionEffect {
    return new DestructionEffect(this.position, this.enemyType);
  }

  // Pathfinding movement
  private moveToWithPathfinding(targetPos: Vector2, grid?: Grid): void {
    if (!grid || !this.navigationGrid) {
      // Fallback to direct movement if no grid available
      this.moveTo(targetPos, this.speed, grid);
      return;
    }

    // Check if we need to recalculate path
    const needsNewPath = !this.currentPath.length || 
                        !this.currentPathTarget ||
                        this.distanceTo(targetPos) > 50 || // Target moved significantly
                        this.pathRecalculationTimer >= this.PATH_RECALCULATION_INTERVAL;

    if (needsNewPath) {
      // Calculate new path
      const pathResult = Pathfinding.findPath(
        this.position,
        targetPos,
        grid,
        {
          movementType: this.movementType || MovementType.WALKING,
          allowDiagonal: true,
          minDistanceFromObstacles: this.radius / grid.cellSize,
          smoothPath: true
        }
      );

      if (pathResult.success && pathResult.path.length > 0) {
        this.currentPath = pathResult.path;
        this.currentPathTarget = targetPos;
        this.pathRecalculationTimer = 0;
      } else {
        // No path found, try direct movement as fallback
        this.moveTo(targetPos, this.speed, grid);
        return;
      }
    }

    // Follow current path
    if (this.currentPath.length > 0) {
      // Find the next waypoint we haven't reached yet
      while (this.currentPath.length > 1 && this.distanceTo(this.currentPath[0]) < this.WAYPOINT_REACHED_DISTANCE) {
        this.currentPath.shift();
      }

      // Move towards next waypoint
      if (this.currentPath.length > 0) {
        this.moveTo(this.currentPath[0], this.speed, grid);
      }
    }
  }

  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any): void {
    // Try to render with texture first
    const textureId = `enemy_${this.enemyType.toLowerCase()}`;
    const texture = textureManager?.getTexture(textureId);
    
    if (texture && texture.loaded && textureManager) {
      ctx.drawImage(texture.image, screenPos.x - this.radius, screenPos.y - this.radius, this.radius * 2, this.radius * 2);
    } else {
      // Enhanced primitive rendering based on enemy type
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      
      switch (this.enemyType) {
        case EnemyType.BASIC:
          // Basic enemy - spiky circle with eyes
          ctx.fillStyle = COLOR_THEME.enemies.basic;
          
          // Body with spikes
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeRadius = i % 2 === 0 ? this.radius : this.radius * 0.8;
            const x = Math.cos(angle) * spikeRadius;
            const y = Math.sin(angle) * spikeRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          
          // Evil eyes
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(-this.radius * 0.3, -this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
          ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye pupils
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(-this.radius * 0.3, -this.radius * 0.2, this.radius * 0.05, 0, Math.PI * 2);
          ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.05, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case EnemyType.FAST:
          // Fast enemy - streamlined triangle shape
          ctx.fillStyle = COLOR_THEME.enemies.fast;
          
          // Pointed body facing movement direction
          const moveAngle = Math.atan2(this.velocity.y, this.velocity.x);
          ctx.rotate(moveAngle);
          
          ctx.beginPath();
          ctx.moveTo(this.radius, 0);
          ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7);
          ctx.lineTo(-this.radius * 0.3, 0);
          ctx.lineTo(-this.radius * 0.7, this.radius * 0.7);
          ctx.closePath();
          ctx.fill();
          
          // Speed lines
          ctx.strokeStyle = COLOR_THEME.enemies.fast;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(-this.radius * 1.2, -this.radius * 0.3);
          ctx.lineTo(-this.radius * 0.8, 0);
          ctx.moveTo(-this.radius * 1.2, this.radius * 0.3);
          ctx.lineTo(-this.radius * 0.8, 0);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
          
        case EnemyType.TANK:
          // Tank enemy - heavy armored square with treads
          ctx.fillStyle = COLOR_THEME.enemies.tank;
          
          // Main body
          ctx.fillRect(-this.radius * 0.8, -this.radius * 0.6, this.radius * 1.6, this.radius * 1.2);
          
          // Armor plates
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(-this.radius * 0.7, -this.radius * 0.5, this.radius * 0.3, this.radius);
          ctx.fillRect(this.radius * 0.4, -this.radius * 0.5, this.radius * 0.3, this.radius);
          
          // Treads
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(-this.radius * 0.9, -this.radius * 0.7, this.radius * 1.8, this.radius * 0.2);
          ctx.fillRect(-this.radius * 0.9, this.radius * 0.5, this.radius * 1.8, this.radius * 0.2);
          
          // Tread details
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.radius * 0.25, -this.radius * 0.7);
            ctx.lineTo(i * this.radius * 0.25, -this.radius * 0.5);
            ctx.moveTo(i * this.radius * 0.25, this.radius * 0.5);
            ctx.lineTo(i * this.radius * 0.25, this.radius * 0.7);
            ctx.stroke();
          }
          break;
          
        default:
          // Default circular enemy
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = COLOR_THEME.enemies.default;
          ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Enemy outline - different color based on target
    const targetType = this.getTargetType();
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, this.radius + 2, 0, Math.PI * 2);
    
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
    ctx.stroke();
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