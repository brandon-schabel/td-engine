import { describe, it, expect } from 'vitest';
import { Tower, TowerType } from '@/entities/Tower';
import { TOWER_COSTS } from '@/config/GameConfig';
import { when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';

describe('Wall Core Functionality', () => {
  const context = withTestContext();
  
  it('has wall type in TowerType enum', () => {
    expect(TowerType.WALL).toBe('WALL');
  });

  it('has wall cost defined', () => {
    expect(TOWER_COSTS.WALL).toBe(10);
  });

  it(when('creating wall tower'), () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    then('has correct properties');
    expect(wall.towerType).toBe(TowerType.WALL);
    expect(wall.damage).toBe(0);
    expect(wall.range).toBe(0);
    expect(wall.fireRate).toBe(0);
    expect(wall.health).toBe(200);
    expect(wall.radius).toBe(16);
  });

  it(then('cannot shoot'), () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    expect(wall.canShoot()).toBe(false);
  });

  it(then('cannot be upgraded'), () => {
    const wall = new Tower(TowerType.WALL, { x: 100, y: 100 });
    
    expect(wall.canUpgrade('DAMAGE' as any)).toBe(false);
    expect(wall.canUpgrade('RANGE' as any)).toBe(false);
    expect(wall.canUpgrade('FIRE_RATE' as any)).toBe(false);
  });
});