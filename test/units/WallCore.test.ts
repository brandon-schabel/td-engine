import { describe, it, expect } from 'vitest';
import { Tower, TowerType } from '../../src/entities/Tower';
import { TOWER_COSTS } from '../../src/config/GameConfig';

describe('Wall Core Functionality', () => {
  it('should have wall type in TowerType enum', () => {
    expect(TowerType.WALL).toBe('WALL');
  });

  it('should have wall cost defined', () => {
    expect(TOWER_COSTS.WALL).toBe(10);
  });

  it('should create wall with zero damage and range', () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    expect(wall.towerType).toBe(TowerType.WALL);
    expect(wall.damage).toBe(0);
    expect(wall.range).toBe(0);
    expect(wall.fireRate).toBe(0);
    expect(wall.health).toBe(200);
    expect(wall.radius).toBe(16);
  });

  it('wall should not be able to shoot', () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    expect(wall.canShoot()).toBe(false);
  });

  it('wall should not be upgradeable', () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    expect(wall.canUpgrade('DAMAGE' as any)).toBe(false);
    expect(wall.canUpgrade('RANGE' as any)).toBe(false);
    expect(wall.canUpgrade('FIRE_RATE' as any)).toBe(false);
  });
});