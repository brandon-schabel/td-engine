import { gameStore } from "@/stores/gameStore";

/**
 * Manages in-game currency operations
 * Provides a centralized interface for currency transactions
 */
export class CurrencyManager {
  /**
   * Get current currency amount
   * @returns Current currency balance
   */
  public getCurrency(): number {
    const state = gameStore.getState();
    return state?.currency ?? 0;
  }

  /**
   * Add currency to the player's balance
   * @param amount - Amount to add (must be positive)
   */
  public addCurrency(amount: number): void {
    if (amount < 0) {
      console.warn('[CurrencyManager] Cannot add negative currency amount:', amount);
      return;
    }
    
    gameStore.getState().addCurrency(amount);
    
    // Log transaction
    console.log(`[CurrencyManager] Added ${amount} currency. New balance: ${this.getCurrency()}`);
  }

  /**
   * Spend currency from the player's balance
   * @param amount - Amount to spend (must be positive)
   * @returns true if transaction was successful
   */
  public spendCurrency(amount: number): boolean {
    if (amount < 0) {
      console.warn('[CurrencyManager] Cannot spend negative currency amount:', amount);
      return false;
    }

    if (!this.canAffordCurrency(amount)) {
      console.log(`[CurrencyManager] Insufficient funds. Required: ${amount}, Available: ${this.getCurrency()}`);
      return false;
    }

    gameStore.getState().spendCurrency(amount);
    
    // Log transaction
    console.log(`[CurrencyManager] Spent ${amount} currency. New balance: ${this.getCurrency()}`);
    
    return true;
  }

  /**
   * Check if player can afford a certain amount
   * @param cost - Cost to check
   * @returns true if player has enough currency
   */
  public canAffordCurrency(cost: number): boolean {
    return gameStore.getState().canAfford(cost);
  }

  /**
   * Set currency to a specific amount
   * Used primarily for testing and initialization
   * @param amount - New currency amount (must be non-negative)
   */
  public setCurrency(amount: number): void {
    if (amount < 0) {
      console.warn('[CurrencyManager] Cannot set negative currency amount:', amount);
      return;
    }

    gameStore.setState({ currency: amount });
    
    // Log transaction
    console.log(`[CurrencyManager] Set currency to ${amount}`);
  }

  /**
   * Award currency with optional multipliers
   * @param baseAmount - Base amount to award
   * @param multiplier - Optional multiplier (default: 1.0)
   */
  public awardCurrency(baseAmount: number, multiplier: number = 1.0): void {
    const finalAmount = Math.floor(baseAmount * multiplier);
    this.addCurrency(finalAmount);
    
    // Dispatch event for UI notifications
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('currencyAwarded', {
        detail: { 
          amount: finalAmount,
          baseAmount,
          multiplier
        }
      }));
    }
  }

  /**
   * Refund a percentage of currency
   * @param originalCost - Original cost paid
   * @param refundPercentage - Percentage to refund (0-100)
   */
  public refundCurrency(originalCost: number, refundPercentage: number): void {
    const refundAmount = Math.floor(originalCost * (refundPercentage / 100));
    if (refundAmount > 0) {
      this.addCurrency(refundAmount);
      
      // Log refund
      console.log(`[CurrencyManager] Refunded ${refundAmount} currency (${refundPercentage}% of ${originalCost})`);
      
      // Dispatch event for UI notifications
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('currencyRefunded', {
          detail: { 
            amount: refundAmount,
            originalCost,
            percentage: refundPercentage
          }
        }));
      }
    }
  }

  /**
   * Get currency transaction history from game stats
   * @returns Object with currency statistics
   */
  public getCurrencyStats(): {
    totalEarned: number;
    currentBalance: number;
  } {
    const state = gameStore.getState();
    return {
      totalEarned: state.stats.totalCurrencyEarned,
      currentBalance: this.getCurrency()
    };
  }
}