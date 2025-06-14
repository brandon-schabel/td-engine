import { describe, it, expect, beforeEach } from 'vitest';
import { GameWithEvents } from '../../src/core/GameWithEvents';
import { TowerType, UpgradeType } from '../../src/entities/Tower';
import { createMockCanvas } from '../helpers';

describe('Tower Upgrade Integration', () => {
  let game: GameWithEvents;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    game = new GameWithEvents(canvas, {
      width: 25,
      height: 19,
      cellSize: 20,
      biome: 'FOREST' as any,
      difficulty: 'MEDIUM' as any,
      seed: 12345,
      pathComplexity: 0.5,
      obstacleCount: 10,
      decorationLevel: 0.3,
      enableWater: false,
      enableAnimations: false
    }, false);
  });

  it('should emit towerSelected event when clicking on a tower', () => {
    // Place a tower first
    const worldPos = { x: 100, y: 100 };
    game.setSelectedTowerType(TowerType.BASIC);
    
    // Give the game money
    game.addCurrency(1000);
    
    const placed = game.placeTower(TowerType.BASIC, worldPos);
    expect(placed).toBe(true);
    
    const towers = game.getTowers();
    expect(towers.length).toBe(1);
    
    // Set up event listener
    let selectedTower = null;
    game.on('towerSelected', (data) => {
      selectedTower = data.tower;
    });
    
    // Simulate clicking on the tower
    const clickEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(clickEvent, 'offsetX', { value: 100 });
    Object.defineProperty(clickEvent, 'offsetY', { value: 100 });
    
    game.handleMouseDown(clickEvent);
    
    // Should have selected the tower
    expect(selectedTower).toBe(towers[0]);
    expect(game.getSelectedTower()).toBe(towers[0]);
  });

  it('should upgrade tower and spend currency', () => {
    // Place a tower
    const worldPos = { x: 100, y: 100 };
    game.setSelectedTowerType(TowerType.BASIC);
    game.addCurrency(1000);
    
    const placed = game.placeTower(TowerType.BASIC, worldPos);
    expect(placed).toBe(true);
    
    const tower = game.getTowers()[0]!;
    
    // Check initial state
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
    const initialDamage = tower.damage;
    const initialCurrency = game.getCurrency();
    
    // Get upgrade cost
    const upgradeCost = tower.getUpgradeCost(UpgradeType.DAMAGE);
    expect(upgradeCost).toBeGreaterThan(0);
    
    // Upgrade the tower
    const upgraded = game.upgradeTower(tower, UpgradeType.DAMAGE);
    expect(upgraded).toBe(true);
    
    // Check results
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(1);
    expect(tower.damage).toBeGreaterThan(initialDamage);
    expect(game.getCurrency()).toBe(initialCurrency - upgradeCost);
  });

  it('should not upgrade when insufficient funds', () => {
    // Place a tower
    const worldPos = { x: 100, y: 100 };
    game.setSelectedTowerType(TowerType.BASIC);
    game.addCurrency(1000);
    
    game.placeTower(TowerType.BASIC, worldPos);
    const tower = game.getTowers()[0]!;
    
    // Set currency to very low amount
    const lowAmount = 5;
    game.setCurrency(lowAmount);
    
    const upgradeCost = tower.getUpgradeCost(UpgradeType.DAMAGE);
    expect(upgradeCost).toBeGreaterThan(lowAmount);
    
    // Try to upgrade - should fail
    const upgraded = game.upgradeTower(tower, UpgradeType.DAMAGE);
    expect(upgraded).toBe(false);
    
    // Nothing should have changed
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(0);
    expect(game.getCurrency()).toBe(lowAmount);
  });

  it('should handle multiple upgrades correctly', () => {
    // Place a tower and give lots of money
    const worldPos = { x: 100, y: 100 };
    game.setSelectedTowerType(TowerType.BASIC);
    game.addCurrency(10000);
    
    game.placeTower(TowerType.BASIC, worldPos);
    const tower = game.getTowers()[0]!;
    
    // Upgrade damage multiple times
    let totalCost = 0;
    for (let i = 0; i < 3; i++) {
      const cost = tower.getUpgradeCost(UpgradeType.DAMAGE);
      totalCost += cost;
      const upgraded = game.upgradeTower(tower, UpgradeType.DAMAGE);
      expect(upgraded).toBe(true);
    }
    
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
    
    // Upgrade different types
    const rangeCost = tower.getUpgradeCost(UpgradeType.RANGE);
    totalCost += rangeCost;
    const rangeUpgraded = game.upgradeTower(tower, UpgradeType.RANGE);
    expect(rangeUpgraded).toBe(true);
    expect(tower.getUpgradeLevel(UpgradeType.RANGE)).toBe(1);
    
    // Check total upgrades
    expect(tower.getTotalUpgrades()).toBe(4);
    expect(game.getCurrency()).toBe(10000 - totalCost);
  });
});