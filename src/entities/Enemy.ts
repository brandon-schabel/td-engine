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

import { ProblematicPositionCache } from '@/systems/ProblematicPositionCache';

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



  // Pathfinding properties
  private currentPath: Vector2[] = [];
  private currentPathTarget: Vector2 | null = null;

  // Getter for debug visualization
  get debugPath(): Vector2[] {
    return this.currentPath;
  }
  private pathRecalculationTimer: number = 0;
  private readonly PATH_RECALCULATION_INTERVAL = 2000; // Recalculate path every 2 seconds (increased from 1)
  private readonly WAYPOINT_REACHED_DISTANCE = 20; // Distance to consider waypoint reached (increased for smoother paths)

  // Stuck detection and recovery
  private positionHistory: Vector2[] = [];
  private velocityHistory: Vector2[] = [];
  private stuckCounter: number = 0;
  private readonly STUCK_THRESHOLD = 20; // Movement less than 20 units/sec means stuck (increased from 10)
  private readonly STUCK_DETECTION_TIME = 1.5; // seconds (increased from 1.0)
  private isRecovering: boolean = false;
  private recoveryTimer: number = 0;
  private readonly RECOVERY_DURATION = 1.0; // seconds (increased for smoother recovery)
  private lastValidPosition: Vector2 | null = null;





  constructor(
    position: Vector2,
    health: number,
    enemyType: EnemyType = EnemyType.BASIC,
    speedMultiplier: number = 1.0
  ) {
    const stats = ENEMY_STATS[enemyType];
    super(EntityType.ENEMY, position, health || stats.health, stats.radius);

    this.enemyType = enemyType;
    this.speed = stats.speed * speedMultiplier;
    this.reward = stats.reward;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackCooldownTime = stats.attackCooldown;
    this.towerDetectionRange = stats.towerDetectionRange;
    this.behavior = stats.behavior;

    // Set up terrain-aware movement
    this.baseSpeed = stats.speed * speedMultiplier;
    this.currentSpeed = stats.speed * speedMultiplier;

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

    // Calculate a unique path offset for this enemy to create lanes

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

    // Stuck detection and recovery
    if (this.detectStuck(deltaTime)) {
      this.initiateRecovery(activeGrid);
    }

    // Handle recovery movement
    if (this.isRecovering) {
      this.performRecoveryMovement(deltaTime);
      return; // Skip normal movement during recovery
    }

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
        this.moveToWithPathfinding(this.target.position, activeGrid, deltaTime);
      }
    } else if (this.playerTarget && this.playerTarget.isAlive) {
      // No towers to attack, move toward player
      if (this.playerTarget.position) {
        this.moveToWithPathfinding(this.playerTarget.position, activeGrid, deltaTime);
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
  private moveToWithPathfinding(targetPos: Vector2, grid?: Grid, deltaTime: number = 16): void {
    if (!grid) {
      console.warn(`Enemy ${this.id} missing grid or navigation grid for pathfinding`);
      // Stop movement if we can't pathfind
      this.velocity = { x: 0, y: 0 };
      return;
    }

    // Check if we need to recalculate path
    const needsNewPath = !this.currentPath.length ||
      !this.currentPathTarget ||
      this.distanceTo(targetPos) > 50 || // Target moved significantly
      this.pathRecalculationTimer >= this.PATH_RECALCULATION_INTERVAL ||
      !Pathfinding.validatePath(this.currentPath, grid, this.movementType || MovementType.WALKING);

    if (needsNewPath) {
      // Calculate new path with predictive targeting for moving targets
      const targetEntity = this.target || this.playerTarget;
      const pathOptions: any = {
        movementType: this.movementType || MovementType.WALKING,
        allowDiagonal: true,
        minDistanceFromObstacles: Math.max(1, Math.ceil(this.radius / grid.cellSize * ENEMY_BEHAVIOR.minObstacleDistanceMultiplier)),
        smoothPath: true,
        obstacleProximityPenalty: ENEMY_BEHAVIOR.obstacleProximityPenalty,
        obstacleProximityRange: ENEMY_BEHAVIOR.obstacleProximityRange
      };

      // Enable predictive targeting for moving entities
      if (targetEntity && 'velocity' in targetEntity) {
        pathOptions.predictiveTarget = true;
        pathOptions.targetVelocity = targetEntity.velocity;
        pathOptions.predictionTime = 0.5; // Predict 0.5 seconds ahead
      }

      const pathResult = Pathfinding.findPath(
        this.position,
        targetPos,
        grid,
        {
          movementType: this.movementType || MovementType.WALKING,
          allowDiagonal: true,
          smoothPath: true,
        }
      );

      if (pathResult.success && pathResult.path.length > 0) {
        this.currentPath = pathResult.path;
        this.currentPathTarget = targetPos;
        this.pathRecalculationTimer = 0;
      } else {
        // No path found - initiate recovery
        this.isRecovering = true;
        return;
      }
    }

    // Follow current path
    if (this.currentPath.length > 0) {
      // Find the next waypoint we haven't reached yet
      while (this.currentPath.length > 1 && this.distanceTo(this.currentPath[0]) < this.WAYPOINT_REACHED_DISTANCE) {
        this.currentPath.shift();
      }

      // Move towards next waypoint with smooth movement and obstacle avoidance
      if (this.currentPath.length > 0) {


        // Use smooth movement with proper deltaTime
        this.smoothMoveTo(this.currentPath[0], this.speed, deltaTime);





        // Movement is handled by Entity.update() which applies velocity
      }
    } else {
      this.velocity = { x: 0, y: 0 };
    }
  }

  // Find a nearby accessible position when target is unreachable


  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any, zoom: number = 1): void {
    // Try to render with texture first
    const textureId = `enemy_${this.enemyType.toLowerCase()}`;
    const texture = textureManager?.getTexture(textureId);

    if (texture && texture.loaded && textureManager) {
      const scaledRadius = this.radius * zoom;
      ctx.drawImage(texture.image, screenPos.x - scaledRadius, screenPos.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
    } else {
      // Enhanced primitive rendering based on enemy type
      const scaledRadius = this.radius * zoom;
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
            const spikeRadius = i % 2 === 0 ? scaledRadius : scaledRadius * 0.8;
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
          ctx.arc(-scaledRadius * 0.3, -scaledRadius * 0.2, scaledRadius * 0.15, 0, Math.PI * 2);
          ctx.arc(scaledRadius * 0.3, -scaledRadius * 0.2, scaledRadius * 0.15, 0, Math.PI * 2);
          ctx.fill();

          // Eye pupils
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(-scaledRadius * 0.3, -scaledRadius * 0.2, scaledRadius * 0.05, 0, Math.PI * 2);
          ctx.arc(scaledRadius * 0.3, -scaledRadius * 0.2, scaledRadius * 0.05, 0, Math.PI * 2);
          ctx.fill();
          break;

        case EnemyType.FAST:
          // Fast enemy - streamlined triangle shape
          ctx.fillStyle = COLOR_THEME.enemies.fast;

          // Pointed body facing movement direction
          const moveAngle = Math.atan2(this.velocity.y, this.velocity.x);
          ctx.rotate(moveAngle);

          ctx.beginPath();
          ctx.moveTo(scaledRadius, 0);
          ctx.lineTo(-scaledRadius * 0.7, -scaledRadius * 0.7);
          ctx.lineTo(-scaledRadius * 0.3, 0);
          ctx.lineTo(-scaledRadius * 0.7, scaledRadius * 0.7);
          ctx.closePath();
          ctx.fill();

          // Speed lines
          ctx.strokeStyle = COLOR_THEME.enemies.fast;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(-scaledRadius * 1.2, -scaledRadius * 0.3);
          ctx.lineTo(-scaledRadius * 0.8, 0);
          ctx.moveTo(-scaledRadius * 1.2, scaledRadius * 0.3);
          ctx.lineTo(-scaledRadius * 0.8, 0);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case EnemyType.TANK:
          // Tank enemy - heavy armored square with treads
          ctx.fillStyle = COLOR_THEME.enemies.tank;

          // Main body
          ctx.fillRect(-scaledRadius * 0.8, -scaledRadius * 0.6, scaledRadius * 1.6, scaledRadius * 1.2);

          // Armor plates
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(-scaledRadius * 0.7, -scaledRadius * 0.5, scaledRadius * 0.3, scaledRadius);
          ctx.fillRect(scaledRadius * 0.4, -scaledRadius * 0.5, scaledRadius * 0.3, scaledRadius);

          // Treads
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(-scaledRadius * 0.9, -scaledRadius * 0.7, scaledRadius * 1.8, scaledRadius * 0.2);
          ctx.fillRect(-scaledRadius * 0.9, scaledRadius * 0.5, scaledRadius * 1.8, scaledRadius * 0.2);

          // Tread details
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * scaledRadius * 0.25, -scaledRadius * 0.7);
            ctx.lineTo(i * scaledRadius * 0.25, -scaledRadius * 0.5);
            ctx.moveTo(i * scaledRadius * 0.25, scaledRadius * 0.5);
            ctx.lineTo(i * scaledRadius * 0.25, scaledRadius * 0.7);
            ctx.stroke();
          }
          break;

        default:
          // Default circular enemy
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLOR_THEME.enemies.default;
          ctx.fill();
      }

      ctx.restore();
    }

    // Enemy outline - different color based on target
    const targetType = this.getTargetType();
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, this.radius * zoom + 2, 0, Math.PI * 2);

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

  // Stuck detection system
  private detectStuck(deltaTime: number): boolean {
    // Update position and velocity history
    this.positionHistory.push({ ...this.position });
    this.velocityHistory.push({ ...this.velocity });

    // Keep only last 60 frames (about 1 second of history at 60fps)
    if (this.positionHistory.length > 60) {
      this.positionHistory.shift();
    }
    if (this.velocityHistory.length > 60) {
      this.velocityHistory.shift();
    }

    // Need enough history to detect stuck
    if (this.positionHistory.length < 60) {
      return false;
    }

    // Calculate movement metrics
    const oldestPos = this.positionHistory[0];
    const totalDistance = this.distanceTo(oldestPos);
    const timeWindow = this.positionHistory.length * deltaTime;
    const averageSpeed = totalDistance / timeWindow;

    // Calculate average velocity magnitude
    let avgVelocityMag = 0;
    for (const vel of this.velocityHistory) {
      avgVelocityMag += Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    }
    avgVelocityMag /= this.velocityHistory.length;

    // Check if stuck: low movement despite having velocity
    const isPositionStuck = averageSpeed < this.STUCK_THRESHOLD && this.speed > 0;
    const isVelocityStuck = avgVelocityMag > this.STUCK_THRESHOLD && averageSpeed < this.STUCK_THRESHOLD * 0.5;

    if (isPositionStuck || isVelocityStuck) {
      this.stuckCounter += deltaTime;

      // Use consistent detection time (no aggressive detection near water)
      if (this.stuckCounter >= this.STUCK_DETECTION_TIME) {
        return true;
      }
    } else {
      this.stuckCounter = Math.max(0, this.stuckCounter - deltaTime * 0.5); // Gradual recovery
      // Save last known good position
      if (averageSpeed > this.STUCK_THRESHOLD * 1.5) {
        this.lastValidPosition = { ...this.position };
      }
    }

    return false;
  }

  // Check if enemy is near water or bridge tiles


  // Initiate recovery when stuck
  private initiateRecovery(grid?: Grid): void {
    console.log(`Enemy ${this.id} is stuck! Initiating smooth recovery...`);

    // Mark current position as problematic
    const cache = ProblematicPositionCache.getInstance();
    cache.addBadPosition(this.position);

    this.isRecovering = true;
    this.recoveryTimer = 0;
    this.stuckCounter = 0;
    this.positionHistory = [];
    this.velocityHistory = [];

    // Clear current path - it's not working
    this.currentPath = [];
    this.currentPathTarget = null;

    // Choose wall following direction based on obstacle positions


    // Apply initial recovery force
    this.selectRecoveryStrategy(grid);
  }



  // Select and apply recovery strategy
  private selectRecoveryStrategy(_grid?: Grid): void {


    // Strategy 1: Try to move to last valid position
    if (this.lastValidPosition && this.distanceTo(this.lastValidPosition) > 20) {
      const angle = Math.atan2(
        this.lastValidPosition.y - this.position.y,
        this.lastValidPosition.x - this.position.x
      );
      this.velocity = {
        x: Math.cos(angle) * this.speed * 0.5,
        y: Math.sin(angle) * this.speed * 0.5
      };
      return;
    }

    // Strategy 2: Random walk
    const randomAngle = Math.random() * Math.PI * 2;
    this.velocity = {
      x: Math.cos(randomAngle) * this.speed * 0.7,
      y: Math.sin(randomAngle) * this.speed * 0.7
    };
  }

  // Perform recovery movement with smooth steering
  private performRecoveryMovement(deltaTime: number): void {
    this.recoveryTimer += deltaTime;

    // Placeholder for recoveryForce - actual calculation needs to be implemented
    const recoveryForce = { x: 0, y: 0 };

    // Apply steering force to velocity (with damping)
    const steeringInfluence = Math.min(1.0, this.recoveryTimer / 0.5); // Gradual influence
    this.velocity.x += recoveryForce.x * steeringInfluence * deltaTime;
    this.velocity.y += recoveryForce.y * steeringInfluence * deltaTime;

    // Limit velocity to max speed
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (currentSpeed > this.speed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
      this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
    }

    // End recovery after duration
    if (this.recoveryTimer >= this.RECOVERY_DURATION) {
      this.isRecovering = false;
      this.recoveryTimer = 0;


      // Force path recalculation after recovery
      this.pathRecalculationTimer = this.PATH_RECALCULATION_INTERVAL;
    }
  }







  // Smooth movement implementation
  // Smooth movement implementation with steering behaviors
  private smoothMoveTo(target: Vector2, speed: number, deltaTime: number): void {
    const distance = this.distanceTo(target);
    if (distance < 1) return;

    // Calculate desired velocity
    const desiredVelocity = {
      x: ((target.x - this.position.x) / distance) * speed,
      y: ((target.y - this.position.y) / distance) * speed
    };

    // Calculate steering force (desired - current)
    const steerX = desiredVelocity.x - this.velocity.x;
    const steerY = desiredVelocity.y - this.velocity.y;

    // Apply arrival behavior (slow down near target)
    const slowingDistance = ENEMY_BEHAVIOR.arrivalSlowingDistance;
    if (distance < slowingDistance) {
      const scaleFactor = distance / slowingDistance;
      desiredVelocity.x *= scaleFactor;
      desiredVelocity.y *= scaleFactor;
    }

    // Smooth velocity interpolation with steering
    const steeringRate = ENEMY_BEHAVIOR.steeringRate;
    const dt = deltaTime / 1000;

    this.velocity.x += steerX * steeringRate * dt;
    this.velocity.y += steerY * steeringRate * dt;

    // Limit velocity to max speed
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (currentSpeed > speed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * speed;
      this.velocity.y = (this.velocity.y / currentSpeed) * speed;
    }
  }

}