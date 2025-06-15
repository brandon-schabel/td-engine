import { describe, it, expect } from 'vitest';
import { Tower, TowerType } from '@/entities/Tower';
import { Grid, CellType } from '@/systems/Grid';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { TOWER_COSTS } from '@/config/GameConfig';
import { describeEntity, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { TowerBuilder, EnemyBuilder } from '../helpers/builders';

describe.skip('Wall Tower Type',
  () => new Tower(TowerType.WALL, { x: 100, y: 100 }),
  (getWall, context) => {
    const createGrid = () => new Grid(25, 19, 32);
    const createEnemy = () => new EnemyBuilder()
      .ofType(EnemyType.BASIC)
      .at(150, 100)
      .withPath([{ x: 0, y: 0 }, { x: 100, y: 0 }])
      .build();

    describe('Wall Properties', () => {
      it('creates with correct stats', () => {
        const wall = getWall();
        
        expect(wall.towerType).toBe(TowerType.WALL);
        expect(wall.damage).toBe(0); // Walls don't deal damage
        expect(wall.range).toBe(0); // Walls don't have range
        expect(wall.fireRate).toBe(0); // Walls don't shoot
        expect(wall.health).toBe(200); // Walls should have high health
        expect(wall.radius).toBe(16); // Slightly larger than other towers
      });

      it(when('enemies are nearby'), () => {
        const wall = getWall();
        const enemy = createEnemy();
        
        then('does not shoot');
        const projectile = wall.shoot(enemy);
        expect(projectile).toBeNull();
      });

      it(when('finding targets'), () => {
        const wall = getWall();
        const enemy = createEnemy();
        
        then('returns null');
        const target = wall.findTarget([enemy]);
        expect(target).toBeNull();
      });

      it(when('checking upgrades'), () => {
        const wall = getWall();
        
        then('cannot be upgraded');
        // Walls shouldn't be upgradeable
        expect(wall.canUpgrade('DAMAGE' as any)).toBe(false);
        expect(wall.canUpgrade('RANGE' as any)).toBe(false);
        expect(wall.canUpgrade('FIRE_RATE' as any)).toBe(false);
      });
    });

    describe('Wall Cost', () => {
      it('has correct cost in config', () => {
        const cost = TOWER_COSTS['WALL' as keyof typeof TOWER_COSTS];
        expect(cost).toBe(10); // Walls should be cheap
      });
    });

    describe('Grid Integration', () => {
      it(when('wall is placed on grid'), () => {
        const grid = createGrid();
        const gridPos = { x: 5, y: 5 };
        const worldPos = grid.gridToWorld(gridPos.x, gridPos.y);
        
        // Initially cell should be empty
        expect(grid.getCellType(gridPos.x, gridPos.y)).toBe(CellType.EMPTY);
        
        // Place wall
        const wall = new Tower(TowerType.WALL, worldPos);
        grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
        
        then('blocks the cell');
        expect(grid.getCellType(gridPos.x, gridPos.y)).toBe(CellType.OBSTACLE);
        expect(grid.isWalkable(gridPos.x, gridPos.y)).toBe(false);
      });

      it(then('prevents tower placement'), () => {
        const grid = createGrid();
        const gridPos = { x: 5, y: 5 };
        
        grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
        
        expect(grid.canPlaceTower(gridPos.x, gridPos.y)).toBe(false);
      });
    });

    describe('Wall Rendering', () => {
      it('has appropriate visual properties', () => {
        const wall = getWall();
        
        then('maintains size without upgrades');
        expect(wall.getVisualRadius()).toBe(16);
        expect(wall.getVisualLevel()).toBe(1);
      });
    });
  }
);