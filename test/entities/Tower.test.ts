import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { EntityType } from '@/entities/Entity';
import { createTestTower, createTestEnemy, TimeController } from '../helpers';

describe('Tower', () => {
  let timeController: TimeController;

  beforeEach(() => {
    timeController = new TimeController();
  });

  afterEach(() => {
    timeController.reset();
  });

  describe('initialization', () => {
    it('should create a basic tower with default stats', () => {
      const tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      
      expect(tower.type).toBe(EntityType.TOWER);
      expect(tower.towerType).toBe(TowerType.BASIC);
      expect(tower.damage).toBe(10);
      expect(tower.range).toBe(100);
      expect(tower.fireRate).toBe(1); // 1 shot per second
      expect(tower.position).toEqual({ x: 100, y: 100 });
    });

    it('should create a sniper tower with correct stats', () => {
      const tower = createTestTower({ type: TowerType.SNIPER, position: { x: 0, y: 0 } });
      
      expect(tower.damage).toBe(50);
      expect(tower.range).toBe(200);
      expect(tower.fireRate).toBe(0.5); // 1 shot every 2 seconds
    });

    it('should create a rapid tower with correct stats', () => {
      const tower = createTestTower({ type: TowerType.RAPID, position: { x: 0, y: 0 } });
      
      expect(tower.damage).toBe(5);
      expect(tower.range).toBe(80);
      expect(tower.fireRate).toBe(4); // 4 shots per second
    });
  });

  describe('targeting', () => {
    let tower: Tower;
    let enemies: Enemy[];

    beforeEach(() => {
      tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      enemies = [
        createTestEnemy({ position: { x: 150, y: 100 }, health: 50 }), // 50 units away
        createTestEnemy({ position: { x: 100, y: 180 }, health: 50 }), // 80 units away
        createTestEnemy({ position: { x: 250, y: 100 }, health: 50 }), // 150 units away (out of range)
      ];
    });

    it('should find enemies in range', () => {
      const inRange = tower.findEnemiesInRange(enemies);
      
      expect(inRange).toHaveLength(2);
      expect(inRange).toContain(enemies[0]);
      expect(inRange).toContain(enemies[1]);
      expect(inRange).not.toContain(enemies[2]);
    });

    it('should target the closest enemy', () => {
      const target = tower.findTarget(enemies);
      
      expect(target).toBe(enemies[0]); // Closest enemy
    });

    it('should not target dead enemies', () => {
      enemies[0].isAlive = false;
      const target = tower.findTarget(enemies);
      
      expect(target).toBe(enemies[1]); // Next closest alive enemy
    });

    it('should return null if no enemies in range', () => {
      const farEnemies = [
        createTestEnemy({ position: { x: 300, y: 300 }, health: 50 })
      ];
      
      const target = tower.findTarget(farEnemies);
      expect(target).toBeNull();
    });
  });

  describe('shooting', () => {
    let tower: Tower;
    let enemy: Enemy;

    beforeEach(() => {
      tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      enemy = createTestEnemy({ position: { x: 150, y: 100 }, health: 50 });
    });

    it('should shoot at target when cooldown is ready', () => {
      const projectile = tower.shoot(enemy);
      
      expect(projectile).toBeDefined();
      expect(projectile?.position).toEqual(tower.position);
      expect(projectile?.damage).toBe(tower.damage);
      expect(projectile?.target).toBe(enemy);
    });

    it('should not shoot when on cooldown', () => {
      tower.shoot(enemy); // First shot
      const secondShot = tower.shoot(enemy); // Immediate second shot
      
      expect(secondShot).toBeNull();
    });

    it('should shoot again after cooldown expires', () => {
      tower.shoot(enemy); // First shot
      
      // Wait for cooldown (1000ms for basic tower)
      tower.update(1100);
      
      const secondShot = tower.shoot(enemy);
      expect(secondShot).toBeDefined();
    });

    it('should update cooldown correctly', () => {
      tower.shoot(enemy);
      expect(tower.canShoot()).toBe(false);
      
      tower.update(500); // Half cooldown
      expect(tower.canShoot()).toBe(false);
      
      tower.update(600); // Full cooldown + buffer
      expect(tower.canShoot()).toBe(true);
    });
  });

  describe('automatic targeting and shooting', () => {
    let tower: Tower;
    let enemies: Enemy[];

    beforeEach(() => {
      tower = createTestTower({ type: TowerType.RAPID, position: { x: 100, y: 100 } });
      enemies = [
        createTestEnemy({ position: { x: 120, y: 100 }, health: 50 }),
        createTestEnemy({ position: { x: 100, y: 150 }, health: 50 }),
      ];
    });

    it('should automatically shoot at enemies in range', () => {
      const projectiles = tower.updateAndShoot(enemies, 0);
      
      expect(projectiles).toHaveLength(1);
      expect(projectiles[0]?.target).toBe(enemies[0]); // Closest enemy
    });

    it('should respect fire rate', () => {
      // Rapid tower fires 4 times per second (250ms cooldown)
      let allProjectiles: any[] = [];
      
      allProjectiles.push(...tower.updateAndShoot(enemies, 0)); // First shot at t=0
      allProjectiles.push(...tower.updateAndShoot(enemies, 100)); // t=100, cooldown not ready
      allProjectiles.push(...tower.updateAndShoot(enemies, 100)); // t=200, still not ready
      allProjectiles.push(...tower.updateAndShoot(enemies, 51)); // t=251, should fire
      allProjectiles.push(...tower.updateAndShoot(enemies, 100)); // t=351, not ready
      allProjectiles.push(...tower.updateAndShoot(enemies, 150)); // t=501, should fire
      
      const validProjectiles = allProjectiles.filter(p => p !== null);
      expect(validProjectiles).toHaveLength(3);
    });
  });
});