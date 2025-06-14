import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameWithEvents } from '../../src/core/GameWithEvents';
import { TowerType, UpgradeType } from '../../src/entities/Tower';
import { 
  createMockCanvas,
  expectResourcesChanged,
  expectEntityCount
} from '../helpers';

// Mock MouseEvent for test environment
global.MouseEvent = vi.fn().mockImplementation((type, options = {}) => ({
  type,
  ...options,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
})) as any;

describe('Tower Upgrade Integration', () => {
  let game: GameWithEvents;
  let canvas: HTMLCanvasElement;

  const defaultMapConfig = {
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
  };

  beforeEach(() => {
    canvas = createMockCanvas();
    game = new GameWithEvents(canvas, defaultMapConfig, false);
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
    expectEntityCount(towers, 1);
    const tower = towers[0];
    
    // Set up event listener
    let selectedTower = null;
    game.on('towerSelected', (data) => {
      selectedTower = data.tower;
    });
    
    // Clear any previous selection and tower type
    game.setSelectedTowerType(null);
    
    // Make sure game is in PLAYING state (required for mouse interactions)
    game.start();
    
    // Simulate clicking on the tower using screen coordinates
    const camera = game.getCamera();
    const screenPos = camera.worldToScreen(tower.position);
    const clickEvent = new MouseEvent('mousedown', {});
    Object.defineProperty(clickEvent, 'offsetX', { value: screenPos.x });
    Object.defineProperty(clickEvent, 'offsetY', { value: screenPos.y });
    
    game.handleMouseDown(clickEvent);
    
    // Should have selected the tower and emitted event
    expect(game.getSelectedTower()).toBe(tower);
    expect(selectedTower).toBe(tower);
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
    
    // Check results - tower should be upgraded and currency reduced
    expectResourcesChanged(
      { currency: initialCurrency, lives: 0, score: 0 },
      { currency: game.getCurrency(), lives: 0, score: 0 },
      { currency: -upgradeCost }
    );
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
    
    // First set currency to a known amount (since game starts with 100)
    game.setCurrency(10000);
    const initialMoney = game.getCurrency();
    
    // Account for tower placement cost
    const towerCost = game.getTowerCost(TowerType.BASIC);
    
    game.placeTower(TowerType.BASIC, worldPos);
    const tower = game.getTowers()[0]!;
    
    const expectedAfterPlacement = initialMoney - towerCost;
    const actualAfterPlacement = game.getCurrency();
    expect(actualAfterPlacement).toBe(expectedAfterPlacement);
    
    // Upgrade damage multiple times
    for (let i = 0; i < 3; i++) {
      const currencyBefore = game.getCurrency();
      const cost = tower.getUpgradeCost(UpgradeType.DAMAGE);
      const upgraded = game.upgradeTower(tower, UpgradeType.DAMAGE);
      expect(upgraded).toBe(true);
      
      const currencyAfter = game.getCurrency();
      expect(currencyAfter).toBe(currencyBefore - cost);
    }
    
    expect(tower.getUpgradeLevel(UpgradeType.DAMAGE)).toBe(3);
    
    // Upgrade different types
    const currencyBefore = game.getCurrency();
    const rangeCost = tower.getUpgradeCost(UpgradeType.RANGE);
    const rangeUpgraded = game.upgradeTower(tower, UpgradeType.RANGE);
    expect(rangeUpgraded).toBe(true);
    expect(tower.getUpgradeLevel(UpgradeType.RANGE)).toBe(1);
    
    const currencyAfter = game.getCurrency();
    expect(currencyAfter).toBe(currencyBefore - rangeCost);
    
    // Check total upgrades
    expect(tower.getTotalUpgrades()).toBe(4);
  });
});