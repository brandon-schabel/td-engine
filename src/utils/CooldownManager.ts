/**
 * CooldownManager - Centralized utility for managing cooldown timing
 * Eliminates duplicate cooldown logic across Player, Tower, and Enemy classes
 */

export class CooldownManager {
  /**
   * Updates a cooldown timer by reducing it by deltaTime
   * @param currentCooldown Current cooldown value in milliseconds
   * @param deltaTime Time elapsed since last update in milliseconds
   * @returns Updated cooldown value (minimum 0)
   */
  static updateCooldown(currentCooldown: number, deltaTime: number): number {
    return Math.max(0, currentCooldown - deltaTime);
  }

  /**
   * Checks if a cooldown is ready (expired)
   * @param cooldown Current cooldown value in milliseconds
   * @returns True if cooldown has expired (value is 0 or less)
   */
  static isReady(cooldown: number): boolean {
    return cooldown <= 0;
  }

  /**
   * Starts a cooldown timer
   * @param cooldownTime Duration of cooldown in milliseconds
   * @returns The cooldown time (for assignment to current cooldown)
   */
  static startCooldown(cooldownTime: number): number {
    return Math.max(0, cooldownTime);
  }

  /**
   * Gets the remaining cooldown as a percentage (0-1)
   * @param currentCooldown Current cooldown value
   * @param maxCooldown Maximum cooldown duration
   * @returns Percentage remaining (1 = full cooldown, 0 = ready)
   */
  static getCooldownPercentage(currentCooldown: number, maxCooldown: number): number {
    if (maxCooldown <= 0) return 0;
    return Math.min(1, Math.max(0, currentCooldown / maxCooldown));
  }

  /**
   * Gets remaining cooldown time in seconds (for UI display)
   * @param currentCooldown Current cooldown value in milliseconds
   * @returns Remaining time in seconds, rounded to 1 decimal place
   */
  static getCooldownSeconds(currentCooldown: number): number {
    return Math.round(Math.max(0, currentCooldown / 1000) * 10) / 10;
  }
}

/**
 * Interface for entities that have cooldown-based abilities
 */
export interface CooldownCapable {
  readonly cooldownTime: number;
  currentCooldown: number;
  
  canPerformAction(): boolean;
  startCooldown(): void;
}

/**
 * Base class for entities with cooldown capabilities
 * Concrete classes should extend this and implement the cooldownTime property
 */
export abstract class CooldownEntity {
  currentCooldown: number = 0;
  
  // Must be implemented by concrete classes
  abstract readonly cooldownTime: number;
  
  /**
   * Checks if the action can be performed (cooldown is ready)
   */
  canPerformAction(): boolean {
    return CooldownManager.isReady(this.currentCooldown);
  }
  
  /**
   * Starts the cooldown timer
   */
  startCooldown(): void {
    this.currentCooldown = CooldownManager.startCooldown(this.cooldownTime);
  }
  
  /**
   * Updates the cooldown timer (should be called in entity update method)
   */
  updateCooldown(deltaTime: number): void {
    this.currentCooldown = CooldownManager.updateCooldown(this.currentCooldown, deltaTime);
  }
  
  /**
   * Gets the cooldown progress as a percentage
   */
  getCooldownProgress(): number {
    return CooldownManager.getCooldownPercentage(this.currentCooldown, this.cooldownTime);
  }
  
  /**
   * Gets remaining cooldown in seconds for display
   */
  getCooldownDisplayTime(): number {
    return CooldownManager.getCooldownSeconds(this.currentCooldown);
  }
}