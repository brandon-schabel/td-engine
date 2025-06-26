import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import { Tower } from './Tower';
import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import { CellType } from '@/systems/Grid';
import { MovementType, MovementSystem } from '@/systems/MovementSystem';
import { CooldownManager } from '@/utils/CooldownManager';
import { ENEMY_STATS, ENEMY_BEHAVIOR, EnemyBehavior } from '../config/EnemyConfig';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ENEMY_RENDER } from '@/config/RenderingConfig';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { Pathfinding } from '@/systems/Pathfinding';
import { NavigationGrid } from '@/systems/NavigationGrid';
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
  private navigationGrid: NavigationGrid | null = null;
  
  // Pathfinding properties
  private currentPath: Vector2[] = [];
  private currentPathTarget: Vector2 | null = null;
  private pathRecalculationTimer: number = 0;
  private readonly PATH_RECALCULATION_INTERVAL = 1000; // Recalculate path every second
  private readonly WAYPOINT_REACHED_DISTANCE = 10; // Distance to consider waypoint reached
  
  // Stuck detection and recovery
  private positionHistory: Vector2[] = [];
  private stuckCounter: number = 0;
  private readonly STUCK_THRESHOLD = 10; // Movement less than 10 units/sec means stuck
  private readonly STUCK_DETECTION_TIME = 1.0; // seconds
  private isRecovering: boolean = false;
  private recoveryTimer: number = 0;
  private readonly RECOVERY_DURATION = 0.5; // seconds
  private lastValidPosition: Vector2 | null = null;
  private emergencyTeleportCounter: number = 0;
  private readonly EMERGENCY_TELEPORT_THRESHOLD = 3; // After 3 recovery attempts

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
    
    // Stuck detection and recovery
    if (this.detectStuck(deltaTime)) {
      this.initiateRecovery(activeGrid);
    }
    
    // Handle recovery movement
    if (this.isRecovering) {
      this.performRecoveryMovement(deltaTime, activeGrid);
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
        minDistanceFromObstacles: this.radius / grid.cellSize,
        smoothPath: true
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
        pathOptions
      );

      if (pathResult.success && pathResult.path.length > 0) {
        this.currentPath = pathResult.path;
        this.currentPathTarget = targetPos;
        this.pathRecalculationTimer = 0;
      } else {
        // No path found - try alternative path finding
        const alternativeResult = Pathfinding.findAlternativePath(
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
        
        if (alternativeResult.success && alternativeResult.path.length > 0) {
          this.currentPath = alternativeResult.path;
          this.currentPathTarget = alternativeResult.path[alternativeResult.path.length - 1];
          this.pathRecalculationTimer = 0;
        } else {
          // Still no path - try our own nearby position search
          const nearbyPos = this.findNearbyAccessiblePosition(targetPos, grid);
          if (nearbyPos) {
            const fallbackPath = Pathfinding.findPath(
              this.position,
              nearbyPos,
              grid,
              {
                movementType: this.movementType || MovementType.WALKING,
                allowDiagonal: true,
                minDistanceFromObstacles: this.radius / grid.cellSize,
                smoothPath: true,
                maxIterations: 500 // Limit iterations
              }
            );
            
            if (fallbackPath.success && fallbackPath.path.length > 0) {
              this.currentPath = fallbackPath.path;
              this.currentPathTarget = nearbyPos;
              this.pathRecalculationTimer = 0;
            } else {
              // Really stuck - initiate recovery
              this.isRecovering = true;
              return;
            }
          } else {
            // No accessible position found - initiate recovery
            this.isRecovering = true;
            return;
          }
        }
      }
    }

    // Follow current path
    if (this.currentPath.length > 0) {
      // Find the next waypoint we haven't reached yet
      while (this.currentPath.length > 1 && this.distanceTo(this.currentPath[0]) < this.WAYPOINT_REACHED_DISTANCE) {
        this.currentPath.shift();
      }

      // Move towards next waypoint with smooth movement
      if (this.currentPath.length > 0) {
        // Use smooth movement for better visuals
        this.smoothMoveTo(this.currentPath[0], this.speed, 0.016); // Assume ~60fps
        
        // Apply velocity with collision detection
        const newPos = {
          x: this.position.x + this.velocity.x * 0.016,
          y: this.position.y + this.velocity.y * 0.016
        };
        
        if (!grid || MovementSystem.canEntityMoveTo(this, newPos, grid)) {
          this.position = newPos;
        }
      }
    } else {
      this.velocity = { x: 0, y: 0 };
    }
  }

  // Find a nearby accessible position when target is unreachable
  private findNearbyAccessiblePosition(targetPos: Vector2, grid: Grid): Vector2 | null {
    const cache = ProblematicPositionCache.getInstance();
    
    // Search in expanding circles around the target
    const searchRadii = [50, 100, 150, 200];
    const angleStep = Math.PI / 4; // Check 8 directions
    
    for (const radius of searchRadii) {
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const testX = targetPos.x + Math.cos(angle) * radius;
        const testY = targetPos.y + Math.sin(angle) * radius;
        const testPos = { x: testX, y: testY };
        
        // Skip positions known to be problematic
        if (cache.isPositionBad(testPos)) {
          continue;
        }
        
        // Check if this position is accessible
        if (MovementSystem.canEntityMoveTo(this, testPos, grid)) {
          // Try to find a path to this position
          const testPath = Pathfinding.findPath(
            this.position,
            testPos,
            grid,
            {
              movementType: this.movementType || MovementType.WALKING,
              allowDiagonal: true,
              maxIterations: 500 // Limit iterations for performance
            }
          );
          
          if (testPath.success) {
            return testPos;
          }
        }
      }
    }
    
    return null;
  }

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
    // Update position history
    this.positionHistory.push({ ...this.position });
    
    // Keep only last 5 positions (about 0.5 seconds of history at 60fps)
    if (this.positionHistory.length > 30) {
      this.positionHistory.shift();
    }
    
    // Need enough history to detect stuck
    if (this.positionHistory.length < 30) {
      return false;
    }
    
    // Calculate total distance moved in the history window
    const oldestPos = this.positionHistory[0];
    const totalDistance = this.distanceTo(oldestPos);
    const timeWindow = this.positionHistory.length * deltaTime;
    const averageSpeed = totalDistance / timeWindow;
    
    // Check if moving too slowly (stuck)
    if (averageSpeed < this.STUCK_THRESHOLD && this.speed > 0) {
      this.stuckCounter += deltaTime;
      
      // Faster stuck detection near water/bridges
      const detectionTime = this.isNearWaterOrBridge() ? 
        this.STUCK_DETECTION_TIME * 0.5 : 
        this.STUCK_DETECTION_TIME;
      
      if (this.stuckCounter >= detectionTime) {
        return true;
      }
    } else {
      this.stuckCounter = 0;
      // Save last known good position
      if (averageSpeed > this.STUCK_THRESHOLD * 2) {
        this.lastValidPosition = { ...this.position };
        // Reset emergency counter on good movement
        this.emergencyTeleportCounter = Math.max(0, this.emergencyTeleportCounter - 0.1);
      }
    }
    
    return false;
  }
  
  // Check if enemy is near water or bridge tiles
  private isNearWaterOrBridge(): boolean {
    if (!this.grid) return false;
    
    const gridPos = this.grid.worldToGrid(this.position);
    const checkRadius = 2;
    
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        const x = gridPos.x + dx;
        const y = gridPos.y + dy;
        
        if (this.grid.isInBounds(x, y)) {
          const cellType = this.grid.getCellType(x, y);
          if (cellType === CellType.WATER || cellType === CellType.BRIDGE) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Initiate recovery when stuck
  private initiateRecovery(grid?: Grid): void {
    console.log(`Enemy ${this.id} is stuck! Initiating recovery...`);
    
    // Mark current position as problematic
    const cache = ProblematicPositionCache.getInstance();
    cache.addBadPosition(this.position);
    console.log(`Marked position ${this.position.x}, ${this.position.y} as problematic`);
    
    this.emergencyTeleportCounter++;
    
    // If we've tried recovery too many times, do emergency teleport
    if (this.emergencyTeleportCounter >= this.EMERGENCY_TELEPORT_THRESHOLD) {
      this.performEmergencyTeleport(grid);
      return;
    }
    
    this.isRecovering = true;
    this.recoveryTimer = 0;
    this.stuckCounter = 0;
    this.positionHistory = [];
    
    // Clear current path - it's not working
    this.currentPath = [];
    this.currentPathTarget = null;
    
    // Try different recovery strategies
    this.selectRecoveryStrategy(grid);
  }
  
  // Select and apply recovery strategy
  private selectRecoveryStrategy(_grid?: Grid): void {
    // Special strategy for water/bridge areas
    if (this.isNearWaterOrBridge() && _grid) {
      // Try to find nearest bridge or solid ground
      const gridPos = _grid.worldToGrid(this.position);
      const searchRadius = 3;
      
      let nearestBridge: Vector2 | null = null;
      let nearestLand: Vector2 | null = null;
      let minBridgeDist = Infinity;
      let minLandDist = Infinity;
      
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          const x = gridPos.x + dx;
          const y = gridPos.y + dy;
          
          if (_grid.isInBounds(x, y)) {
            const cellType = _grid.getCellType(x, y);
            const worldPos = _grid.gridToWorld(x, y);
            const dist = this.distanceTo(worldPos);
            
            if (cellType === CellType.BRIDGE && dist < minBridgeDist) {
              nearestBridge = worldPos;
              minBridgeDist = dist;
            } else if ((cellType === CellType.EMPTY || cellType === CellType.PATH) && dist < minLandDist) {
              nearestLand = worldPos;
              minLandDist = dist;
            }
          }
        }
      }
      
      // Move towards bridge or land
      const target = nearestBridge || nearestLand;
      if (target) {
        const angle = Math.atan2(target.y - this.position.y, target.x - this.position.x);
        this.velocity = {
          x: Math.cos(angle) * this.speed * 0.8,
          y: Math.sin(angle) * this.speed * 0.8
        };
        return;
      }
    }
    
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
  
  // Perform recovery movement
  private performRecoveryMovement(deltaTime: number, _grid?: Grid): void {
    this.recoveryTimer += deltaTime;
    
    // Apply recovery velocity with collision detection
    const newPos = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime
    };
    
    // Check if new position is valid
    if (_grid && MovementSystem.canEntityMoveTo(this, newPos, _grid)) {
      this.position = newPos;
    } else {
      // Hit obstacle during recovery - try different direction
      const newAngle = Math.random() * Math.PI * 2;
      this.velocity = {
        x: Math.cos(newAngle) * this.speed * 0.7,
        y: Math.sin(newAngle) * this.speed * 0.7
      };
    }
    
    // End recovery after duration
    if (this.recoveryTimer >= this.RECOVERY_DURATION) {
      this.isRecovering = false;
      this.recoveryTimer = 0;
      this.emergencyTeleportCounter = Math.max(0, this.emergencyTeleportCounter - 1); // Reduce counter on successful recovery
      // Force path recalculation after recovery
      this.pathRecalculationTimer = this.PATH_RECALCULATION_INTERVAL;
    }
  }
  
  // Smooth movement implementation
  private smoothMoveTo(target: Vector2, speed: number, _deltaTime: number): void {
    const distance = this.distanceTo(target);
    if (distance < 1) return;
    
    const direction = {
      x: (target.x - this.position.x) / distance,
      y: (target.y - this.position.y) / distance
    };
    
    // Calculate desired speed with deceleration near target
    const targetSpeed = Math.min(speed, distance * 3);
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    
    // Smooth speed interpolation
    const smoothingFactor = 0.2;
    const smoothSpeed = currentSpeed * (1 - smoothingFactor) + targetSpeed * smoothingFactor;
    
    // Apply smooth velocity
    this.velocity = {
      x: direction.x * smoothSpeed,
      y: direction.y * smoothSpeed
    };
  }
  
  // Emergency teleport when completely stuck
  private performEmergencyTeleport(grid?: Grid): void {
    console.log(`Enemy ${this.id} performing emergency teleport!`);
    
    const cache = ProblematicPositionCache.getInstance();
    
    this.emergencyTeleportCounter = 0;
    this.isRecovering = false;
    this.recoveryTimer = 0;
    this.positionHistory = [];
    
    if (!grid) return;
    
    // Find nearest walkable cell in expanding circles
    const searchRadii = [50, 100, 150, 200, 300];
    
    for (const radius of searchRadii) {
      // Try 16 directions
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const testPos = {
          x: this.position.x + Math.cos(angle) * radius,
          y: this.position.y + Math.sin(angle) * radius
        };
        
        // Skip known bad positions
        if (cache.isPositionBad(testPos)) {
          continue;
        }
        
        // Check if position is valid and walkable
        const gridPos = grid.worldToGrid(testPos);
        if (grid.isInBounds(gridPos.x, gridPos.y) && 
            !grid.isNearBorder(gridPos.x, gridPos.y, 1)) {
          
          const cellType = grid.getCellType(gridPos.x, gridPos.y);
          
          // For walking enemies, avoid water areas completely
          if (this.movementType === MovementType.WALKING) {
            // Check surrounding area for water
            let hasNearbyWater = false;
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const checkX = gridPos.x + dx;
                const checkY = gridPos.y + dy;
                if (grid.isInBounds(checkX, checkY)) {
                  const nearbyCell = grid.getCellType(checkX, checkY);
                  if (nearbyCell === CellType.WATER) {
                    hasNearbyWater = true;
                    break;
                  }
                }
              }
              if (hasNearbyWater) break;
            }
            
            // Skip positions near water for walking enemies
            if (hasNearbyWater && cellType !== CellType.BRIDGE) {
              continue;
            }
          }
          
          // Check if we can actually move there
          if (MovementSystem.canEntityMoveTo(this, testPos, grid)) {
            // Teleport!
            this.position = testPos;
            this.velocity = { x: 0, y: 0 };
            
            // Clear path and force recalculation
            this.currentPath = [];
            this.currentPathTarget = null;
            this.pathRecalculationTimer = this.PATH_RECALCULATION_INTERVAL;
            
            console.log(`Enemy ${this.id} teleported to ${testPos.x}, ${testPos.y}`);
            return;
          }
        }
      }
    }
    
    console.warn(`Enemy ${this.id} could not find emergency teleport location!`);
  }
}