import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { TowerType } from '@/entities/Tower';
import { PlayerUpgradeType } from '@/entities/Player';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { UpgradeType } from '@/systems/TowerUpgradeManager';

// Simple canvas mock
const mockCanvas = {
  width: 800,
  height: 608,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    set fillStyle(value: string) {},
    set strokeStyle(value: string) {},
    set lineWidth(value: number) {},
    set globalAlpha(value: number) {},
    set font(value: string) {},
    set textAlign(value: string) {}
  }))
} as unknown as HTMLCanvasElement;

describe('Currency Spending Debug', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(mockCanvas);
    vi.clearAllMocks();
  });

  describe('unexpected currency deductions', () => {
    it('should not lose currency during normal game updates', () => {
      const initialCurrency = game.getCurrency();
      
      // Run several game update cycles without any player actions
      for (let i = 0; i < 10; i++) {
        game.update(16); // 16ms frame
      }
      
      // Currency should not decrease during normal updates
      expect(game.getCurrency()).toBe(initialCurrency);
    });

    it('should not lose currency when moving player', () => {
      const initialCurrency = game.getCurrency();
      
      // Move player around
      game.handleKeyDown('w');
      game.update(16);
      game.handleKeyUp('w');
      
      game.handleKeyDown('d');
      game.update(16);
      game.handleKeyUp('d');
      
      // Currency should not decrease from movement
      expect(game.getCurrency()).toBe(initialCurrency);
    });

    it('should not lose currency from mouse movements or clicks on empty space', () => {
      const initialCurrency = game.getCurrency();
      
      // Simulate mouse movements using object literal (simpler approach)
      const mouseMove = {
        offsetX: 200,
        offsetY: 200,
        clientX: 200,
        clientY: 200,
        type: 'mousemove'
      } as MouseEvent;
      game.handleMouseMove(mouseMove);
      
      // Click on empty space
      const mouseClick = {
        offsetX: 200,
        offsetY: 200,
        clientX: 200,
        clientY: 200,
        type: 'click'
      } as MouseEvent;
      game.handleMouseClick(mouseClick);
      
      // Currency should not decrease
      expect(game.getCurrency()).toBe(initialCurrency);
    });

    it('should only lose currency when explicitly purchasing', () => {
      const initialCurrency = game.getCurrency();
      
      // Test tower placement - should spend currency
      const validPosition = { x: 200, y: 200 };
      const success = game.placeTower(TowerType.BASIC, validPosition);
      
      if (success) {
        const expectedCost = game.getTowerCost(TowerType.BASIC);
        expect(game.getCurrency()).toBe(initialCurrency - expectedCost);
      } else {
        // If placement failed, currency should not change
        expect(game.getCurrency()).toBe(initialCurrency);
      }
    });

    it('should only lose currency when successfully upgrading', () => {
      // Place a tower first
      const towerPos = { x: 200, y: 200 };
      game.placeTower(TowerType.BASIC, towerPos);
      
      const currencyAfterTower = game.getCurrency();
      const towers = game.getTowers();
      
      if (towers.length > 0) {
        const tower = towers[0];
        const upgradeCost = game.getUpgradeCost(tower, UpgradeType.DAMAGE);
        
        if (game.canAffordUpgrade(tower, UpgradeType.DAMAGE)) {
          const success = game.upgradeTower(tower, UpgradeType.DAMAGE);
          
          if (success) {
            expect(game.getCurrency()).toBe(currencyAfterTower - upgradeCost);
          } else {
            expect(game.getCurrency()).toBe(currencyAfterTower);
          }
        }
      }
    });

    it('should only lose currency when successfully upgrading player', () => {
      const initialCurrency = game.getCurrency();
      const upgradeCost = game.getPlayerUpgradeCost(PlayerUpgradeType.DAMAGE);
      
      if (game.canAffordPlayerUpgrade(PlayerUpgradeType.DAMAGE)) {
        const success = game.upgradePlayer(PlayerUpgradeType.DAMAGE);
        
        if (success) {
          expect(game.getCurrency()).toBe(initialCurrency - upgradeCost);
        } else {
          expect(game.getCurrency()).toBe(initialCurrency);
        }
      }
    });

    it('should not double-spend on rapid button clicks', () => {
      const player = game.getPlayer();
      const initialCurrency = game.getCurrency();
      const upgradeCost = game.getPlayerUpgradeCost(PlayerUpgradeType.DAMAGE);
      
      // Simulate rapid clicking (multiple upgrade attempts)
      const firstUpgrade = game.upgradePlayer(PlayerUpgradeType.DAMAGE);
      const secondUpgrade = game.upgradePlayer(PlayerUpgradeType.DAMAGE); // Should use new cost
      
      if (firstUpgrade && secondUpgrade) {
        // If both succeeded, should have spent for both levels
        const level1Cost = upgradeCost;
        const level2Cost = Math.floor(upgradeCost * 1.5); // Cost increases by 50%
        expect(game.getCurrency()).toBe(initialCurrency - level1Cost - level2Cost);
      } else if (firstUpgrade) {
        // Only first succeeded
        expect(game.getCurrency()).toBe(initialCurrency - upgradeCost);
      } else {
        // Neither succeeded
        expect(game.getCurrency()).toBe(initialCurrency);
      }
    });

    it('should track currency changes through enemy rewards', () => {
      const initialCurrency = game.getCurrency();
      
      // Create a mock enemy with appropriate reward values
      const mockEnemy = {
        enemyType: EnemyType.BASIC,
        reward: 10,
        position: { x: 100, y: 100 }
      } as Enemy;
      
      // Manually give enemy rewards (simulating kills)
      game.enemyKilled(mockEnemy);
      
      expect(game.getCurrency()).toBe(initialCurrency + 10);
    });
  });

  describe('currency validation', () => {
    it('should prevent spending more currency than available', () => {
      // Drain most currency first
      const currentCurrency = game.getCurrency();
      
      // Try to place expensive towers until we run out of money
      let remainingCurrency = currentCurrency;
      while (remainingCurrency >= 20) { // Basic tower cost
        const success = game.placeTower(TowerType.BASIC, { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 });
        if (success) {
          remainingCurrency -= 20;
        } else {
          break; // Can't place more towers (probably no valid positions)
        }
      }
      
      // Now try to place a tower that costs more than remaining currency
      const beforeExpensiveAttempt = game.getCurrency();
      const expensiveAttempt = game.placeTower(TowerType.SNIPER, { x: 500, y: 500 }); // Costs 50
      
      if (beforeExpensiveAttempt < 50) {
        // Should fail and not change currency
        expect(expensiveAttempt).toBe(false);
        expect(game.getCurrency()).toBe(beforeExpensiveAttempt);
      }
    });
  });
});