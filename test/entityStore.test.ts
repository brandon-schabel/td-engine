import { describe, it, expect, beforeEach, vi } from 'vitest';
import { utilizeEntityStore } from '../src/stores/entityStore';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Projectile, ProjectileType } from '@/entities/Projectile';
import { Player } from '@/entities/Player';

// Mock Vector2
const mockPosition = { x: 100, y: 100 };

describe('EntityStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = utilizeEntityStore.getState();
    store.clearAllEntities();
    store.setPlayer(null);
  });

  describe('Tower CRUD Operations', () => {
    it('should add a tower', () => {
      const store = utilizeEntityStore.getState();
      const tower = new Tower(TowerType.BASIC, mockPosition);

      store.addTower(tower);

      const towers = store.getAllTowers();
      expect(towers).toHaveLength(1);
      expect(towers[0]).toBe(tower);
    });

    it('should remove a tower', () => {
      const store = utilizeEntityStore.getState();
      const tower = new Tower(TowerType.BASIC, mockPosition);

      store.addTower(tower);
      store.removeTower(tower.id);

      const towers = store.getAllTowers();
      expect(towers).toHaveLength(0);
    });

    it('should update a tower', () => {
      const store = utilizeEntityStore.getState();
      const tower = new Tower(TowerType.BASIC, mockPosition);

      store.addTower(tower);
      store.updateTower(tower.id, { health: 50 });

      const towers = store.getAllTowers();
      expect(towers[0].health).toBe(50);
    });

    it('should clear selection when removing selected tower', () => {
      const store = utilizeEntityStore.getState();
      const tower = new Tower(TowerType.BASIC, mockPosition);

      store.addTower(tower);
      store.selectTower(tower);

      // Get fresh state after selection
      const stateAfterSelect = utilizeEntityStore.getState();
      expect(stateAfterSelect.selectedTower).toBe(tower);

      store.removeTower(tower.id);

      // Get fresh state after removal
      const stateAfterRemove = utilizeEntityStore.getState();
      expect(stateAfterRemove.selectedTower).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should batch update multiple entities', () => {
      const store = utilizeEntityStore.getState();
      const tower1 = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const tower2 = new Tower(TowerType.SNIPER, { x: 200, y: 200 });
      const enemy = new Enemy(EnemyType.BASIC, { x: 300, y: 300 });

      store.addTower(tower1);
      store.addTower(tower2);
      store.addEnemy(enemy);

      store.batchUpdate({
        towers: [
          { id: tower1.id, updates: { health: 75 } },
          { id: tower2.id, updates: { health: 50 } }
        ],
        enemies: [
          { id: enemy.id, updates: { health: 25 } }
        ]
      });

      const towers = store.getAllTowers();
      const enemies = store.getAllEnemies();

      expect(towers[0].health).toBe(75);
      expect(towers[1].health).toBe(50);
      expect(enemies[0].health).toBe(25);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup dead entities', () => {
      const store = utilizeEntityStore.getState();
      const tower = new Tower(TowerType.BASIC, mockPosition);
      const enemy = new Enemy(EnemyType.BASIC, mockPosition);
      const projectile = new Projectile(mockPosition, null, 10, 100, undefined, ProjectileType.BASIC_BULLET);

      store.addTower(tower);
      store.addEnemy(enemy);
      store.addProjectile(projectile);

      // Mark entities as dead
      tower.isAlive = false;
      enemy.isAlive = false;
      projectile.isAlive = false;

      store.cleanupDeadEntities();

      expect(store.getAllTowers()).toHaveLength(0);
      expect(store.getAllEnemies()).toHaveLength(0);
      expect(store.getAllProjectiles()).toHaveLength(0);
    });
  });

  describe('Selectors', () => {
    it('should get enemies in range', () => {
      const store = utilizeEntityStore.getState();
      const enemy1 = new Enemy(EnemyType.BASIC, { x: 110, y: 110 });
      const enemy2 = new Enemy(EnemyType.BASIC, { x: 200, y: 200 });
      const enemy3 = new Enemy(EnemyType.BASIC, { x: 500, y: 500 });

      store.addEnemy(enemy1);
      store.addEnemy(enemy2);
      store.addEnemy(enemy3);

      const enemiesInRange = store.getEnemiesInRange({ x: 100, y: 100 }, 150);

      expect(enemiesInRange).toHaveLength(2);
      expect(enemiesInRange).toContain(enemy1);
      expect(enemiesInRange).toContain(enemy2);
      expect(enemiesInRange).not.toContain(enemy3);
    });

    it('should get tower at grid position', () => {
      const store = utilizeEntityStore.getState();
      // Assuming 32px grid cells
      const tower1 = new Tower(TowerType.BASIC, { x: 48, y: 48 }); // Grid 1,1
      const tower2 = new Tower(TowerType.BASIC, { x: 80, y: 80 }); // Grid 2,2

      store.addTower(tower1);
      store.addTower(tower2);

      const foundTower = store.getTowerAt(1, 1);
      expect(foundTower).toBe(tower1);

      const notFound = store.getTowerAt(3, 3);
      expect(notFound).toBeNull();
    });

    it('should get visible entities within viewport', () => {
      const store = utilizeEntityStore.getState();
      const viewport = { x: 0, y: 0, width: 200, height: 200 };

      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const enemy = new Enemy(EnemyType.BASIC, { x: 150, y: 150 });
      const projectile = new Projectile({ x: 300, y: 300 }, null, 10, 100);

      store.addTower(tower);
      store.addEnemy(enemy);
      store.addProjectile(projectile);

      const visible = store.getVisibleEntities(viewport);

      expect(visible.towers).toHaveLength(1);
      expect(visible.enemies).toHaveLength(1);
      expect(visible.projectiles).toHaveLength(0); // Outside viewport
    });
  });

  describe('Entity Count', () => {
    it('should count all entities correctly', () => {
      const store = utilizeEntityStore.getState();

      store.addTower(new Tower(TowerType.BASIC, mockPosition));
      store.addEnemy(new Enemy(EnemyType.BASIC, mockPosition));
      store.addProjectile(new Projectile(mockPosition, null, 10, 100));
      store.setPlayer(new Player(mockPosition));

      expect(store.getEntityCount()).toBe(4);
    });
  });
});