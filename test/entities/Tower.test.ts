import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { EntityType } from '@/entities/Entity';
import { 
  TowerBuilder, 
  EnemyBuilder, 
  TimeController,
  expectTowerCanTarget,
  expectTowerCannotTarget,
  expectEntityCount,
  createEntityGroup
} from '../helpers';

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
      const tower = new TowerBuilder()
        .ofType(TowerType.BASIC)
        .at(100, 100)
        .build();
      
      expect(tower.type).toBe(EntityType.TOWER);
      expect(tower.towerType).toBe(TowerType.BASIC);
      expect(tower.damage).toBe(10);
      expect(tower.range).toBe(100);
      expect(tower.fireRate).toBe(1); // 1 shot per second
      expect(tower.position).toEqual({ x: 100, y: 100 });
    });

    it('should create a sniper tower with correct stats', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.SNIPER)
        .at(0, 0)
        .build();
      
      expect(tower.damage).toBe(50);
      expect(tower.range).toBe(200);
      expect(tower.fireRate).toBe(0.5); // 1 shot every 2 seconds
    });

    it('should create a rapid tower with correct stats', () => {
      const tower = new TowerBuilder()
        .ofType(TowerType.RAPID)
        .at(0, 0)
        .build();
      
      expect(tower.damage).toBe(5);
      expect(tower.range).toBe(80);
      expect(tower.fireRate).toBe(4); // 4 shots per second
    });
  });

  describe('targeting', () => {
    let tower: Tower;
    let enemies: Enemy[];

    beforeEach(() => {
      tower = new TowerBuilder()
        .ofType(TowerType.BASIC)
        .at(100, 100)
        .build();
      
      enemies = [
        new EnemyBuilder().at(150, 100).withHealth(50).build(), // 50 units away
        new EnemyBuilder().at(100, 180).withHealth(50).build(), // 80 units away
        new EnemyBuilder().at(250, 100).withHealth(50).build(), // 150 units away (out of range)
      ];
    });

    it('should find enemies in range', () => {
      const inRange = tower.findEnemiesInRange(enemies);
      
      expectEntityCount(inRange, 2);
      expect(inRange).toContain(enemies[0]);
      expect(inRange).toContain(enemies[1]);
      expect(inRange).not.toContain(enemies[2]);
    });

    it('should target the closest enemy', () => {
      const target = tower.findTarget(enemies);
      
      expect(target).toBe(enemies[0]); // Closest enemy
      if (target) {
        expectTowerCanTarget(tower, target);
      }
    });

    it('should not target dead enemies', () => {
      enemies[0].isAlive = false;
      expectTowerCannotTarget(tower, enemies[0], 'dead');
      
      const target = tower.findTarget(enemies);
      expect(target).toBe(enemies[1]); // Next closest alive enemy
    });

    it('should return null if no enemies in range', () => {
      const farEnemy = new EnemyBuilder()
        .at(300, 300)
        .withHealth(50)
        .build();
      
      expectTowerCannotTarget(tower, farEnemy, 'range');
      
      const target = tower.findTarget([farEnemy]);
      expect(target).toBeNull();
    });
  });

  describe('shooting', () => {
    let tower: Tower;
    let enemy: Enemy;

    beforeEach(() => {
      tower = new TowerBuilder()
        .ofType(TowerType.BASIC)
        .at(100, 100)
        .build();
      
      enemy = new EnemyBuilder()
        .at(150, 100)
        .withHealth(50)
        .build();
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
      tower = new TowerBuilder()
        .ofType(TowerType.RAPID)
        .at(100, 100)
        .build();
      
      enemies = createEntityGroup(
        () => new EnemyBuilder().withHealth(50).build(),
        2,
        [
          { position: { x: 120, y: 100 } },
          { position: { x: 100, y: 150 } }
        ]
      ).map((enemy, index) => {
        const positions = [{ x: 120, y: 100 }, { x: 100, y: 150 }];
        enemy.position = positions[index];
        return enemy;
      });
    });

    it('should automatically shoot at enemies in range', () => {
      const projectiles = tower.updateAndShoot(enemies, 0);
      
      expectEntityCount(projectiles, 1);
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