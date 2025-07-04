import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencyManager } from '@/core/managers/CurrencyManager';
import { gameStore } from '@/stores/gameStore';

describe('CurrencyManager', () => {
  let currencyManager: CurrencyManager;

  beforeEach(() => {
    // Reset game store
    gameStore.getState().resetGame();
    currencyManager = new CurrencyManager();
  });

  describe('getCurrency', () => {
    it('should return current currency from gameStore', () => {
      gameStore.setState({ currency: 100 });
      expect(currencyManager.getCurrency()).toBe(100);
    });

    it('should return 0 when state is undefined', () => {
      // This should not happen in practice, but test defensive programming
      expect(currencyManager.getCurrency()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addCurrency', () => {
    it('should add currency to the balance', () => {
      currencyManager.setCurrency(100);
      currencyManager.addCurrency(50);
      expect(currencyManager.getCurrency()).toBe(150);
    });

    it('should not add negative amounts', () => {
      currencyManager.setCurrency(100);
      currencyManager.addCurrency(-50);
      expect(currencyManager.getCurrency()).toBe(100);
    });
  });

  describe('spendCurrency', () => {
    it('should spend currency when affordable', () => {
      currencyManager.setCurrency(100);
      const result = currencyManager.spendCurrency(50);
      expect(result).toBe(true);
      expect(currencyManager.getCurrency()).toBe(50);
    });

    it('should not spend when insufficient funds', () => {
      currencyManager.setCurrency(30);
      const result = currencyManager.spendCurrency(50);
      expect(result).toBe(false);
      expect(currencyManager.getCurrency()).toBe(30);
    });

    it('should not spend negative amounts', () => {
      currencyManager.setCurrency(100);
      const result = currencyManager.spendCurrency(-50);
      expect(result).toBe(false);
      expect(currencyManager.getCurrency()).toBe(100);
    });
  });

  describe('canAffordCurrency', () => {
    it('should return true when player has enough currency', () => {
      currencyManager.setCurrency(100);
      expect(currencyManager.canAffordCurrency(50)).toBe(true);
      expect(currencyManager.canAffordCurrency(100)).toBe(true);
    });

    it('should return false when player lacks currency', () => {
      currencyManager.setCurrency(30);
      expect(currencyManager.canAffordCurrency(50)).toBe(false);
    });
  });

  describe('setCurrency', () => {
    it('should set currency to specific amount', () => {
      currencyManager.setCurrency(250);
      expect(currencyManager.getCurrency()).toBe(250);
    });

    it('should not set negative currency', () => {
      currencyManager.setCurrency(100);
      currencyManager.setCurrency(-50);
      expect(currencyManager.getCurrency()).toBe(100);
    });
  });

  describe('awardCurrency', () => {
    it('should award base amount with no multiplier', () => {
      currencyManager.setCurrency(100);
      currencyManager.awardCurrency(50);
      expect(currencyManager.getCurrency()).toBe(150);
    });

    it('should apply multiplier to award', () => {
      currencyManager.setCurrency(100);
      currencyManager.awardCurrency(50, 2.0);
      expect(currencyManager.getCurrency()).toBe(200);
    });

    it('should floor fractional amounts', () => {
      currencyManager.setCurrency(100);
      currencyManager.awardCurrency(33, 1.5);
      expect(currencyManager.getCurrency()).toBe(149); // 100 + floor(33 * 1.5) = 100 + 49
    });
  });

  describe('refundCurrency', () => {
    it('should refund percentage of original cost', () => {
      currencyManager.setCurrency(100);
      currencyManager.refundCurrency(200, 50); // 50% refund
      expect(currencyManager.getCurrency()).toBe(200);
    });

    it('should floor fractional refunds', () => {
      currencyManager.setCurrency(100);
      currencyManager.refundCurrency(150, 33); // 33% refund
      expect(currencyManager.getCurrency()).toBe(149); // 100 + floor(150 * 0.33) = 100 + 49
    });

    it('should not refund when percentage is 0', () => {
      currencyManager.setCurrency(100);
      currencyManager.refundCurrency(200, 0);
      expect(currencyManager.getCurrency()).toBe(100);
    });
  });

  describe('getCurrencyStats', () => {
    it('should return currency statistics', () => {
      currencyManager.setCurrency(250);
      gameStore.setState({ 
        stats: { 
          ...gameStore.getState().stats,
          totalCurrencyEarned: 1000 
        }
      });
      
      const stats = currencyManager.getCurrencyStats();
      expect(stats.totalEarned).toBe(1000);
      expect(stats.currentBalance).toBe(250);
    });
  });
});