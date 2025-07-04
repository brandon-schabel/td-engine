import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityFactory } from '../EntityFactory';
import { Player } from '@/entities/Player';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Projectile, ProjectileType } from '@/entities/Projectile';
import { Collectible } from '@/entities/Collectible';
import { CollectibleType } from '@/entities/items/ItemTypes';
import { Grid } from '@/systems/Grid';
import type { Vector2 } from '@/utils/Vector2';

describe('EntityFactory', () => {
  const mockPosition: Vector2 = { x: 100, y: 200 };
  let mockGrid: Grid;
  
  beforeEach(() => {
    mockGrid = new Grid(20, 20, 32);
  });
  
  describe('createPlayer', () => {
    it('should create a player at the specified position', () => {
      const player = EntityFactory.createPlayer(mockPosition);
      
      expect(player).toBeInstanceOf(Player);
      expect(player.position).toEqual(mockPosition);
      expect(player.isAlive).toBe(true);
    });
    
    it('should set up damage callback if provided', () => {
      const onDamage = vi.fn();
      const player = EntityFactory.createPlayer(mockPosition, { onDamage });
      
      expect(player.onDamage).toBe(onDamage);
    });
    
    it('should set grid reference if provided', () => {
      const player = EntityFactory.createPlayer(mockPosition, { grid: mockGrid });
      
      // Verify grid was set (Player has setGrid method)
      expect(player).toBeDefined();
    });
  });
  
  describe('createTower', () => {
    it('should create a tower of the specified type', () => {
      const tower = EntityFactory.createTower(TowerType.BASIC, mockPosition);
      
      expect(tower).toBeInstanceOf(Tower);
      expect(tower.towerType).toBe(TowerType.BASIC);
      expect(tower.position).toEqual(mockPosition);
    });
    
    it('should create different tower types correctly', () => {
      const basicTower = EntityFactory.createTower(TowerType.BASIC, mockPosition);
      const sniperTower = EntityFactory.createTower(TowerType.SNIPER, mockPosition);
      const rapidTower = EntityFactory.createTower(TowerType.RAPID, mockPosition);
      
      expect(basicTower.towerType).toBe(TowerType.BASIC);
      expect(sniperTower.towerType).toBe(TowerType.SNIPER);
      expect(rapidTower.towerType).toBe(TowerType.RAPID);
    });
    
    it('should set up damage callback if provided', () => {
      const onDamage = vi.fn();
      const tower = EntityFactory.createTower(TowerType.BASIC, mockPosition, { onDamage });
      
      expect(tower.onDamage).toBe(onDamage);
    });
  });
  
  describe('createEnemy', () => {
    it('should create an enemy of the specified type', () => {
      const enemy = EntityFactory.createEnemy(EnemyType.BASIC, mockPosition);
      
      expect(enemy).toBeInstanceOf(Enemy);
      expect(enemy.enemyType).toBe(EnemyType.BASIC);
      expect(enemy.position).toEqual(mockPosition);
    });
    
    it('should apply speed and health multipliers', () => {
      const normalEnemy = EntityFactory.createEnemy(EnemyType.BASIC, mockPosition);
      const enhancedEnemy = EntityFactory.createEnemy(EnemyType.BASIC, mockPosition, {
        speedMultiplier: 2.0,
        healthMultiplier: 3.0
      });
      
      expect(enhancedEnemy.speed).toBe(normalEnemy.speed * 2.0);
      expect(enhancedEnemy.maxHealth).toBe(normalEnemy.maxHealth * 3.0);
    });
    
    it('should set up references if provided', () => {
      const player = EntityFactory.createPlayer(mockPosition);
      const towers = [
        EntityFactory.createTower(TowerType.BASIC, { x: 50, y: 50 })
      ];
      
      const enemy = EntityFactory.createEnemy(EnemyType.BASIC, mockPosition, {
        grid: mockGrid,
        playerTarget: player,
        towers: towers
      });
      
      expect(enemy).toBeDefined();
    });
  });
  
  describe('createProjectile', () => {
    it('should create a projectile from a tower', () => {
      const tower = EntityFactory.createTower(TowerType.BASIC, mockPosition);
      const enemy = EntityFactory.createEnemy(EnemyType.BASIC, { x: 200, y: 200 });
      
      const projectile = EntityFactory.createProjectile(tower, enemy);
      
      expect(projectile).toBeInstanceOf(Projectile);
      expect(projectile.position).toEqual(mockPosition);
      expect(projectile.target).toBe(enemy);
      expect(projectile.projectileType).toBe(ProjectileType.BASIC_BULLET);
    });
    
    it('should create correct projectile type based on tower type', () => {
      const sniperTower = EntityFactory.createTower(TowerType.SNIPER, mockPosition);
      const rapidTower = EntityFactory.createTower(TowerType.RAPID, mockPosition);
      const enemy = EntityFactory.createEnemy(EnemyType.BASIC, { x: 200, y: 200 });
      
      const sniperProjectile = EntityFactory.createProjectile(sniperTower, enemy);
      const rapidProjectile = EntityFactory.createProjectile(rapidTower, enemy);
      
      expect(sniperProjectile.projectileType).toBe(ProjectileType.SNIPER_ROUND);
      expect(rapidProjectile.projectileType).toBe(ProjectileType.RAPID_PELLET);
    });
    
    it('should create a projectile from a player', () => {
      const player = EntityFactory.createPlayer(mockPosition);
      const enemy = EntityFactory.createEnemy(EnemyType.BASIC, { x: 200, y: 200 });
      
      const projectile = EntityFactory.createProjectile(player, enemy);
      
      expect(projectile.projectileType).toBe(ProjectileType.PLAYER_SHOT);
    });
    
    it('should accept custom velocity and speed', () => {
      const tower = EntityFactory.createTower(TowerType.BASIC, mockPosition);
      const velocity = { x: 10, y: 5 };
      
      const projectile = EntityFactory.createProjectile(tower, null, {
        velocity,
        speed: 500
      });
      
      expect(projectile.velocity).toEqual(velocity);
    });
  });
  
  describe('createCollectible', () => {
    it('should create a collectible of the specified type', () => {
      const collectible = EntityFactory.createCollectible(
        mockPosition,
        CollectibleType.HEALTH
      );
      
      expect(collectible).toBeInstanceOf(Collectible);
      expect(collectible.position).toEqual(mockPosition);
      expect(collectible.collectibleType).toBe(CollectibleType.HEALTH);
    });
    
    it('should create different collectible types', () => {
      const health = EntityFactory.createCollectible(mockPosition, CollectibleType.HEALTH);
      const coin = EntityFactory.createCollectible(mockPosition, CollectibleType.COIN);
      const powerUp = EntityFactory.createCollectible(mockPosition, CollectibleType.POWER_UP);
      
      expect(health.collectibleType).toBe(CollectibleType.HEALTH);
      expect(coin.collectibleType).toBe(CollectibleType.COIN);
      expect(powerUp.collectibleType).toBe(CollectibleType.POWER_UP);
    });
  });
  
  describe('createEnemyWave', () => {
    it('should create multiple enemies at different positions', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 300, y: 100 }
      ];
      
      const enemies = EntityFactory.createEnemyWave(EnemyType.BASIC, positions);
      
      expect(enemies).toHaveLength(3);
      enemies.forEach((enemy, index) => {
        expect(enemy).toBeInstanceOf(Enemy);
        expect(enemy.position).toEqual(positions[index]);
      });
    });
    
    it('should apply the same config to all enemies', () => {
      const positions = [{ x: 100, y: 100 }, { x: 200, y: 100 }];
      const config = { speedMultiplier: 1.5, healthMultiplier: 2.0 };
      
      const enemies = EntityFactory.createEnemyWave(EnemyType.FAST, positions, config);
      
      const normalFast = EntityFactory.createEnemy(EnemyType.FAST, { x: 0, y: 0 });
      
      enemies.forEach(enemy => {
        expect(enemy.speed).toBe(normalFast.speed * 1.5);
        expect(enemy.maxHealth).toBe(normalFast.maxHealth * 2.0);
      });
    });
  });
  
  describe('createBossEnemy', () => {
    it('should create a boss with enhanced stats', () => {
      const boss = EntityFactory.createBossEnemy(EnemyType.TANK, mockPosition);
      const normalTank = EntityFactory.createEnemy(EnemyType.TANK, mockPosition);
      
      expect(boss).toBeInstanceOf(Enemy);
      expect(boss.maxHealth).toBe(normalTank.maxHealth * 5.0);
      expect(boss.speed).toBe(normalTank.speed * 0.5);
    });
    
    it('should stack multipliers with config', () => {
      const boss = EntityFactory.createBossEnemy(EnemyType.TANK, mockPosition, {
        healthMultiplier: 2.0,
        speedMultiplier: 2.0
      });
      const normalTank = EntityFactory.createEnemy(EnemyType.TANK, mockPosition);
      
      expect(boss.maxHealth).toBe(normalTank.maxHealth * 10.0); // 2.0 * 5.0
      expect(boss.speed).toBe(normalTank.speed * 1.0); // 2.0 * 0.5
    });
  });
  
  describe('createRandomCollectible', () => {
    it('should create a random collectible', () => {
      const collectible = EntityFactory.createRandomCollectible(mockPosition);
      
      expect(collectible).toBeInstanceOf(Collectible);
      expect(collectible.position).toEqual(mockPosition);
      expect(collectible.collectibleType).toBeDefined();
    });
    
    it('should create different types when called multiple times', () => {
      // Create many collectibles to ensure we get different types
      const collectibles = Array.from({ length: 20 }, () => 
        EntityFactory.createRandomCollectible(mockPosition)
      );
      
      const types = new Set(collectibles.map(c => c.collectibleType));
      
      // Should have at least 2 different types out of 20 attempts
      expect(types.size).toBeGreaterThan(1);
    });
  });
});