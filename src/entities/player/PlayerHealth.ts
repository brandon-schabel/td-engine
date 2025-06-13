/**
 * Player Health System
 * Extracted from Player.ts to handle health, healing, and regeneration
 */

import { CooldownManager } from '../../utils/CooldownManager';
import { GAME_MECHANICS } from '../../config/GameConfig';

export interface HealthInfo {
  current: number;
  max: number;
  percentage: number;
  isRegenerating: boolean;
  regenRate: number;
}

export class PlayerHealth {
  private health: number;
  private maxHealth: number;
  private baseMaxHealth: number;
  
  // Regeneration mechanics
  private regenerationTimer: number = 0;
  private damageCooldown: number = 0;
  
  // Heal ability
  private healAbilityCooldown: number = 5000; // Start on cooldown
  private maxHealAbilityCooldown: number = GAME_MECHANICS.healAbilityCooldown;
  
  // Tracking
  private healthPickupsCollected: number = 0;
  private totalHealingReceived: number = 0;
  private totalDamageTaken: number = 0;
  
  // Callbacks
  private onHealthPickupCallback?: () => void;
  private onDeathCallback?: () => void;
  private onHealCallback?: (amount: number) => void;
  private onDamageCallback?: (amount: number) => void;

  constructor(baseMaxHealth: number) {
    this.baseMaxHealth = baseMaxHealth;
    this.maxHealth = baseMaxHealth;
    this.health = baseMaxHealth;
  }

  update(deltaTime: number, hasRegeneration: boolean, regenRate: number): void {
    // Update cooldowns
    this.healAbilityCooldown = CooldownManager.updateCooldown(this.healAbilityCooldown, deltaTime);
    this.damageCooldown = CooldownManager.updateCooldown(this.damageCooldown, deltaTime);
    
    // Update regeneration
    if (hasRegeneration && this.isAlive() && this.health < this.maxHealth && this.damageCooldown <= 0) {
      this.regenerationTimer += deltaTime;
      
      if (this.regenerationTimer >= GAME_MECHANICS.regenInterval) {
        const healAmount = Math.min(regenRate, this.maxHealth - this.health);
        if (healAmount > 0) {
          this.heal(healAmount, 'regeneration');
        }
        this.regenerationTimer = 0;
      }
    }
  }

  // Core health methods
  takeDamage(amount: number, source: string = 'unknown'): number {
    if (!this.isAlive()) return 0;
    
    const actualDamage = Math.min(amount, this.health);
    this.health = Math.max(0, this.health - amount);
    this.totalDamageTaken += actualDamage;
    
    // Reset regeneration cooldown
    this.damageCooldown = GAME_MECHANICS.damageRegenCooldown;
    
    this.onDamageCallback?.(actualDamage);
    
    if (!this.isAlive()) {
      this.onDeathCallback?.();
    }
    
    return actualDamage;
  }

  heal(amount: number, source: string = 'unknown'): number {
    if (!this.isAlive()) return 0;
    
    const actualHealAmount = Math.min(amount, this.maxHealth - this.health);
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.totalHealingReceived += actualHealAmount;
    
    this.onHealCallback?.(actualHealAmount);
    
    return actualHealAmount;
  }

  // Health pickups
  collectHealthPickup(healAmount: number): boolean {
    if (!this.isAlive()) {
      return false;
    }

    const actualHealAmount = this.heal(healAmount, 'health_pickup');
    
    if (actualHealAmount > 0 || this.health === this.maxHealth) {
      this.healthPickupsCollected++;
      this.onHealthPickupCallback?.();
      return true;
    }
    
    return false;
  }

  // Heal ability
  canUseHealAbility(): boolean {
    return this.healAbilityCooldown <= 0 && this.isAlive() && this.health < this.maxHealth;
  }

  useHealAbility(): boolean {
    if (!this.canUseHealAbility()) {
      return false;
    }

    const healAmount = 30;
    this.heal(healAmount, 'heal_ability');
    this.healAbilityCooldown = this.maxHealAbilityCooldown;
    return true;
  }

  getHealAbilityCooldown(): number {
    return this.healAbilityCooldown;
  }

  getHealAbilityCooldownProgress(): number {
    if (this.healAbilityCooldown <= 0) return 1;
    return 1 - (this.healAbilityCooldown / this.maxHealAbilityCooldown);
  }

  // Health state
  isAlive(): boolean {
    return this.health > 0;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getHealthPercentage(): number {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }

  setMaxHealth(newMaxHealth: number): void {
    const healthPercentage = this.getHealthPercentage();
    this.maxHealth = newMaxHealth;
    
    // Scale current health proportionally
    this.health = Math.floor(newMaxHealth * healthPercentage);
  }

  // Full heal
  fullHeal(): void {
    this.health = this.maxHealth;
  }

  // Health boosts
  addTemporaryMaxHealthBoost(amount: number, duration: number): void {
    const oldMaxHealth = this.maxHealth;
    this.maxHealth += amount;
    this.health += amount; // Also boost current health
    
    setTimeout(() => {
      this.maxHealth = oldMaxHealth;
      this.health = Math.min(this.health, this.maxHealth);
    }, duration);
  }

  // Get comprehensive health info
  getHealthInfo(): HealthInfo {
    return {
      current: this.health,
      max: this.maxHealth,
      percentage: this.getHealthPercentage(),
      isRegenerating: this.damageCooldown <= 0,
      regenRate: 0 // This would be passed from the progression system
    };
  }

  // Statistics
  getHealthPickupsCollected(): number {
    return this.healthPickupsCollected;
  }

  getTotalHealingReceived(): number {
    return this.totalHealingReceived;
  }

  getTotalDamageTaken(): number {
    return this.totalDamageTaken;
  }

  getNetHealthChange(): number {
    return this.totalHealingReceived - this.totalDamageTaken;
  }

  // Health status checks
  isLowHealth(threshold: number = 0.25): boolean {
    return this.getHealthPercentage() <= threshold;
  }

  isCriticalHealth(threshold: number = 0.1): boolean {
    return this.getHealthPercentage() <= threshold;
  }

  isFullHealth(): boolean {
    return this.health >= this.maxHealth;
  }

  // Event callbacks
  onHealthPickup(callback: () => void): void {
    this.onHealthPickupCallback = callback;
  }

  onDeath(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  onHeal(callback: (amount: number) => void): void {
    this.onHealCallback = callback;
  }

  onDamage(callback: (amount: number) => void): void {
    this.onDamageCallback = callback;
  }

  // Save/Load state
  getState(): {
    health: number;
    maxHealth: number;
    healAbilityCooldown: number;
    healthPickupsCollected: number;
    totalHealingReceived: number;
    totalDamageTaken: number;
  } {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      healAbilityCooldown: this.healAbilityCooldown,
      healthPickupsCollected: this.healthPickupsCollected,
      totalHealingReceived: this.totalHealingReceived,
      totalDamageTaken: this.totalDamageTaken
    };
  }

  setState(state: {
    health: number;
    maxHealth: number;
    healAbilityCooldown: number;
    healthPickupsCollected: number;
    totalHealingReceived: number;
    totalDamageTaken: number;
  }): void {
    this.health = state.health;
    this.maxHealth = state.maxHealth;
    this.healAbilityCooldown = state.healAbilityCooldown;
    this.healthPickupsCollected = state.healthPickupsCollected;
    this.totalHealingReceived = state.totalHealingReceived;
    this.totalDamageTaken = state.totalDamageTaken;
  }

  // Debug information
  getDebugInfo(): {
    health: HealthInfo;
    timers: {
      healAbilityCooldown: number;
      damageCooldown: number;
      regenerationTimer: number;
    };
    statistics: {
      pickupsCollected: number;
      totalHealing: number;
      totalDamage: number;
      netChange: number;
    };
  } {
    return {
      health: this.getHealthInfo(),
      timers: {
        healAbilityCooldown: this.healAbilityCooldown,
        damageCooldown: this.damageCooldown,
        regenerationTimer: this.regenerationTimer
      },
      statistics: {
        pickupsCollected: this.healthPickupsCollected,
        totalHealing: this.totalHealingReceived,
        totalDamage: this.totalDamageTaken,
        netChange: this.getNetHealthChange()
      }
    };
  }
}