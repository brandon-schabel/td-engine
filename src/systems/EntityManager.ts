/**
 * Entity Manager
 * Centralized entity lifecycle management extracted from Game.ts
 * Handles creation, updates, cleanup, and collision detection for all game entities
 */

import { Tower, TowerType } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player } from '../entities/Player';
import { HealthPickup } from '../entities/HealthPickup';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { Entity } from '../entities/Entity';
import { Grid, CellType } from './Grid';
import { EntityCleaner } from '../utils/EntityCleaner';
import { SPAWN_CHANCES, CURRENCY_CONFIG } from '../config/GameConfig';
import type { Vector2 } from '../utils/Vector2';

export interface EntityCollections {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  healthPickups: HealthPickup[];
  powerUps: PowerUp[];
}

export interface EntityEvents {
  onEnemyKilled: (enemy: Enemy, killer: Entity) => void;
  onPlayerDamaged: (player: Player, damage: number, source: Entity) => void;
  onTowerDestroyed: (tower: Tower, destroyer: Entity) => void;
  onProjectileHit: (projectile: Projectile, target: Entity) => void;
  onPickupCollected: (pickup: HealthPickup | PowerUp, collector: Player) => void;
  onEntitySpawned: (entity: Entity) => void;
  onEntityRemoved: (entity: Entity) => void;
}

export class EntityManager {
  private entities: EntityCollections;
  private player: Player;
  private grid: Grid;
  private events: Partial<EntityEvents>;
  
  // Performance optimization: spatial partitioning
  private spatialGrid: Map<string, Entity[]> = new Map();
  private spatialCellSize: number = 100;
  
  // Entity pools for performance
  private projectilePool: Projectile[] = [];
  private maxPoolSize: number = 100;

  constructor(
    player: Player,
    grid: Grid,
    events: Partial<EntityEvents> = {}
  ) {
    this.player = player;
    this.grid = grid;
    this.events = events;
    
    this.entities = {
      towers: [],
      enemies: [],
      projectiles: [],
      healthPickups: [],
      powerUps: []
    };

    this.initializeEntityPools();
  }

  private initializeEntityPools(): void {
    // Pre-create projectiles for object pooling
    for (let i = 0; i < this.maxPoolSize; i++) {
      const projectile = new Projectile({ x: 0, y: 0 }, null, 0, 0);
      projectile.isAlive = false;
      this.projectilePool.push(projectile);
    }
  }

  // Entity Creation Methods

  createTower(towerType: TowerType, position: Vector2): Tower | null {
    const gridPos = this.grid.worldToGrid(position);
    
    if (!this.grid.canPlaceTower(gridPos.x, gridPos.y)) {
      return null;
    }
    
    const tower = new Tower(towerType, position);
    this.entities.towers.push(tower);
    
    // Update grid
    this.grid.setCellType(gridPos.x, gridPos.y, CellType.TOWER);
    
    this.addToSpatialGrid(tower);
    this.events.onEntitySpawned?.(tower);
    
    return tower;
  }

  createEnemy(enemy: Enemy): void {
    // Set enemy to target player instead of following path
    enemy.setTarget(this.player);
    this.entities.enemies.push(enemy);
    
    this.addToSpatialGrid(enemy);
    this.events.onEntitySpawned?.(enemy);
  }

  createProjectile(position: Vector2, target: Enemy | null, damage: number, speed: number, velocity?: Vector2): Projectile {
    // Try to get from pool first
    let projectile = this.projectilePool.find(p => !p.isAlive);
    
    if (projectile) {
      // Reset pooled projectile
      projectile.position = { ...position };
      projectile.target = target;
      projectile.damage = damage;
      projectile.speed = speed;
      if (velocity) {
        projectile.velocity = { ...velocity };
      }
      projectile.isAlive = true;
      projectile.hitSoundPlayed = false;
    } else {
      // Create new if pool exhausted
      projectile = new Projectile(position, target, damage, speed, velocity);
    }
    
    this.entities.projectiles.push(projectile);
    this.addToSpatialGrid(projectile);
    this.events.onEntitySpawned?.(projectile);
    
    return projectile;
  }

  createHealthPickup(position: Vector2, healAmount: number = 25): HealthPickup {
    const pickup = new HealthPickup({ ...position }, healAmount);
    this.entities.healthPickups.push(pickup);
    
    this.addToSpatialGrid(pickup);
    this.events.onEntitySpawned?.(pickup);
    
    return pickup;
  }

  createPowerUp(position: Vector2, powerUpType: PowerUpType): PowerUp {
    const powerUp = new PowerUp({ ...position }, powerUpType);
    this.entities.powerUps.push(powerUp);
    
    this.addToSpatialGrid(powerUp);
    this.events.onEntitySpawned?.(powerUp);
    
    return powerUp;
  }

  // Entity Update Methods

  updateAllEntities(deltaTime: number): void {
    this.updateEnemies(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateTowers(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updatePickups(deltaTime);
    this.updatePowerUps(deltaTime);
    
    this.handleCollisions();
    this.cleanupEntities();
    this.updateSpatialGrid();
  }

  private updateEnemies(deltaTime: number): void {
    this.entities.enemies.forEach(enemy => {
      // Provide tower information for targeting decisions
      enemy.setTowers(this.entities.towers);
      enemy.update(deltaTime);
    });
  }

  private updatePlayer(deltaTime: number): void {
    this.player.update(deltaTime);
    
    // Constrain player to world bounds
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;
    this.player.constrainToBounds(worldWidth, worldHeight);
  }

  private updateTowers(deltaTime: number): void {
    this.entities.towers.forEach(tower => {
      const newProjectiles = tower.updateAndShoot(this.entities.enemies, deltaTime);
      newProjectiles.forEach(projectile => {
        this.entities.projectiles.push(projectile);
        this.addToSpatialGrid(projectile);
        this.events.onEntitySpawned?.(projectile);
      });
    });
  }

  private updateProjectiles(deltaTime: number): void {
    this.entities.projectiles.forEach(projectile => {
      projectile.update(deltaTime);
      
      // Check for collisions with enemies (for non-homing projectiles)
      if (!projectile.target) {
        const hitEnemy = projectile.checkCollisionWithEnemies(this.entities.enemies);
        if (hitEnemy && !projectile.hitSoundPlayed) {
          projectile.hitSoundPlayed = true;
          const wasKilled = !hitEnemy.isAlive;
          this.events.onProjectileHit?.(projectile, hitEnemy);
          if (wasKilled) {
            this.handleEnemyKilled(hitEnemy, projectile);
          }
        }
      }
      
      // Check if homing projectile hit target
      if (!projectile.isAlive && projectile.target && !projectile.hitSoundPlayed) {
        projectile.hitSoundPlayed = true;
        const wasKilled = !projectile.target.isAlive;
        this.events.onProjectileHit?.(projectile, projectile.target);
        if (wasKilled) {
          this.handleEnemyKilled(projectile.target, projectile);
        }
      }
    });
  }

  private updatePickups(deltaTime: number): void {
    this.entities.healthPickups.forEach(pickup => {
      pickup.update(deltaTime);
      if (pickup.tryHealPlayer(this.player)) {
        this.events.onPickupCollected?.(pickup, this.player);
      }
    });
  }

  private updatePowerUps(deltaTime: number): void {
    this.entities.powerUps.forEach(powerUp => {
      powerUp.update(deltaTime);
      if (powerUp.applyToPlayer(this.player)) {
        this.events.onPickupCollected?.(powerUp, this.player);
        
        // Handle specific power-up effects
        if (powerUp.powerUpType === PowerUpType.EXTRA_CURRENCY) {
          // This would typically be handled by the caller
          console.log('Extra currency power-up collected');
        }
      }
    });
  }

  // Collision Detection

  private handleCollisions(): void {
    // Player vs Enemies
    this.entities.enemies.forEach(enemy => {
      if (this.checkCollision(this.player, enemy)) {
        // Handle player damage
        const damage = enemy.getDamage ? enemy.getDamage() : 10;
        this.player.takeDamage(damage);
        this.events.onPlayerDamaged?.(this.player, damage, enemy);
      }
    });

    // Add more collision checks as needed
  }

  private checkCollision(entity1: Entity, entity2: Entity): boolean {
    const dx = entity1.position.x - entity2.position.x;
    const dy = entity1.position.y - entity2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (entity1.radius + entity2.radius);
  }

  // Entity Lifecycle Management

  private handleEnemyKilled(enemy: Enemy, killer: Entity): void {
    this.events.onEnemyKilled?.(enemy, killer);
    
    // Chance to spawn health pickup
    if (HealthPickup.shouldSpawnFromEnemy()) {
      this.createHealthPickup({ ...enemy.position });
    }
    
    // Chance to spawn power-up
    if (PowerUp.shouldSpawnFromEnemy()) {
      const powerUpType = PowerUp.getRandomType();
      this.createPowerUp({ ...enemy.position }, powerUpType);
    }
  }

  private cleanupEntities(): void {
    const cleanedEntities = EntityCleaner.cleanupAllEntities(this.entities);
    
    // Return dead projectiles to pool
    const deadProjectiles = this.entities.projectiles.filter(p => !p.isAlive);
    deadProjectiles.forEach(projectile => {
      if (this.projectilePool.length < this.maxPoolSize) {
        projectile.position = { x: 0, y: 0 };
        projectile.target = null;
        projectile.damage = 0;
        projectile.speed = 0;
        projectile.velocity = { x: 0, y: 0 };
        // Don't add back to pool here, it's already in the pool
      }
    });
    
    this.entities = cleanedEntities;
    this.cleanupSpatialGrid();
  }

  // Spatial Grid for Performance

  private addToSpatialGrid(entity: Entity): void {
    const cell = this.getSpatialCell(entity.position);
    if (!this.spatialGrid.has(cell)) {
      this.spatialGrid.set(cell, []);
    }
    this.spatialGrid.get(cell)!.push(entity);
  }

  private removeFromSpatialGrid(entity: Entity): void {
    const cell = this.getSpatialCell(entity.position);
    const entities = this.spatialGrid.get(cell);
    if (entities) {
      const index = entities.indexOf(entity);
      if (index !== -1) {
        entities.splice(index, 1);
      }
    }
  }

  private getSpatialCell(position: Vector2): string {
    const x = Math.floor(position.x / this.spatialCellSize);
    const y = Math.floor(position.y / this.spatialCellSize);
    return `${x},${y}`;
  }

  private updateSpatialGrid(): void {
    // Clear and rebuild spatial grid
    this.spatialGrid.clear();
    
    const allEntities = [
      ...this.entities.towers,
      ...this.entities.enemies,
      ...this.entities.projectiles,
      ...this.entities.healthPickups,
      ...this.entities.powerUps,
      this.player
    ];
    
    allEntities.forEach(entity => {
      if (entity.isAlive) {
        this.addToSpatialGrid(entity);
      }
    });
  }

  private cleanupSpatialGrid(): void {
    // Remove dead entities from spatial grid
    this.spatialGrid.forEach((entities, cell) => {
      this.spatialGrid.set(cell, entities.filter(entity => entity.isAlive));
    });
  }

  // Query Methods

  getEntitiesInRadius(position: Vector2, radius: number): Entity[] {
    const entities: Entity[] = [];
    const cellRadius = Math.ceil(radius / this.spatialCellSize);
    const centerCell = this.getSpatialCell(position);
    const [centerX, centerY] = centerCell.split(',').map(Number);
    
    for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
      for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
        const cell = `${x},${y}`;
        const cellEntities = this.spatialGrid.get(cell) || [];
        
        cellEntities.forEach(entity => {
          const distance = Math.sqrt(
            Math.pow(entity.position.x - position.x, 2) +
            Math.pow(entity.position.y - position.y, 2)
          );
          
          if (distance <= radius) {
            entities.push(entity);
          }
        });
      }
    }
    
    return entities;
  }

  getClosestEntity<T extends Entity>(position: Vector2, entityType: new (...args: any[]) => T, maxDistance?: number): T | null {
    let closest: T | null = null;
    let closestDistance = maxDistance || Infinity;
    
    const allEntities = [
      ...this.entities.towers,
      ...this.entities.enemies,
      ...this.entities.projectiles,
      ...this.entities.healthPickups,
      ...this.entities.powerUps
    ];
    
    allEntities.forEach(entity => {
      if (entity instanceof entityType && entity.isAlive) {
        const distance = Math.sqrt(
          Math.pow(entity.position.x - position.x, 2) +
          Math.pow(entity.position.y - position.y, 2)
        );
        
        if (distance < closestDistance) {
          closest = entity as T;
          closestDistance = distance;
        }
      }
    });
    
    return closest;
  }

  // Public API

  getEntities(): Readonly<EntityCollections> {
    return {
      towers: [...this.entities.towers],
      enemies: [...this.entities.enemies],
      projectiles: [...this.entities.projectiles],
      healthPickups: [...this.entities.healthPickups],
      powerUps: [...this.entities.powerUps]
    };
  }

  getPlayer(): Player {
    return this.player;
  }

  getTowerAt(position: Vector2, tolerance: number = 32): Tower | null {
    return this.entities.towers.find(tower => 
      Math.sqrt(
        Math.pow(tower.position.x - position.x, 2) +
        Math.pow(tower.position.y - position.y, 2)
      ) <= tolerance
    ) || null;
  }

  removeTower(tower: Tower): boolean {
    const index = this.entities.towers.indexOf(tower);
    if (index !== -1) {
      this.entities.towers.splice(index, 1);
      
      // Update grid
      const gridPos = this.grid.worldToGrid(tower.position);
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.EMPTY);
      
      this.removeFromSpatialGrid(tower);
      this.events.onEntityRemoved?.(tower);
      return true;
    }
    return false;
  }

  getEntityCount(): { total: number; byType: Record<string, number> } {
    const counts = {
      towers: this.entities.towers.length,
      enemies: this.entities.enemies.length,
      projectiles: this.entities.projectiles.length,
      healthPickups: this.entities.healthPickups.length,
      powerUps: this.entities.powerUps.length,
      player: 1
    };
    
    return {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      byType: counts
    };
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    entityCount: number;
    spatialCells: number;
    poolUtilization: number;
  } {
    return {
      entityCount: this.getEntityCount().total,
      spatialCells: this.spatialGrid.size,
      poolUtilization: (this.maxPoolSize - this.projectilePool.filter(p => !p.isAlive).length) / this.maxPoolSize
    };
  }

  // Cleanup
  cleanup(): void {
    this.entities.towers.length = 0;
    this.entities.enemies.length = 0;
    this.entities.projectiles.length = 0;
    this.entities.healthPickups.length = 0;
    this.entities.powerUps.length = 0;
    this.spatialGrid.clear();
    this.projectilePool.length = 0;
  }
}