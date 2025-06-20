/**
 * Player Power-Up System
 * Extracted from Player.ts to handle power-up collection and effects
 */

export interface ActivePowerUp {
  type: string;
  endTime: number;
  effects: PowerUpEffects;
}

export interface PowerUpEffects {
  damageMultiplier?: number;
  speedMultiplier?: number;
  fireRateMultiplier?: number;
  hasShield?: boolean;
  healthRegenBoost?: number;
}

export class PlayerPowerUps {
  private activePowerUps: Map<string, ActivePowerUp> = new Map();
  
  // Current effect totals
  private totalDamageMultiplier: number = 1.0;
  private totalSpeedMultiplier: number = 1.0;
  private totalFireRateMultiplier: number = 1.0;
  private hasShield: boolean = false;
  private healthRegenBoost: number = 0;
  
  // Statistics
  private powerUpsCollected: number = 0;
  private totalPowerUpDuration: number = 0;
  private powerUpTypeStats: Map<string, number> = new Map();

  update(_deltaTime: number): void {
    const currentTime = Date.now();
    const expiredPowerUps: string[] = [];
    
    this.activePowerUps.forEach((powerUp, type) => {
      if (currentTime >= powerUp.endTime) {
        expiredPowerUps.push(type);
      }
    });
    
    // Remove expired power-ups and recalculate effects
    if (expiredPowerUps.length > 0) {
      expiredPowerUps.forEach(type => {
        this.activePowerUps.delete(type);
      });
      this.recalculateEffects();
    }
  }

  // Power-up application methods
  addExtraDamage(multiplier: number, duration: number): void {
    this.addPowerUp('EXTRA_DAMAGE', duration, { damageMultiplier: multiplier });
  }

  addSpeedBoost(multiplier: number, duration: number): void {
    this.addPowerUp('SPEED_BOOST', duration, { speedMultiplier: multiplier });
  }

  addFasterShooting(multiplier: number, duration: number): void {
    this.addPowerUp('FASTER_SHOOTING', duration, { fireRateMultiplier: multiplier });
  }

  addShield(duration: number): void {
    this.addPowerUp('SHIELD', duration, { hasShield: true });
  }

  addHealthRegenBoost(regenBoost: number, duration: number): void {
    this.addPowerUp('HEALTH_REGEN', duration, { healthRegenBoost: regenBoost });
  }

  private addPowerUp(type: string, duration: number, effects: PowerUpEffects): void {
    const endTime = Date.now() + duration;
    
    // If power-up already exists, extend duration or replace if new one is stronger
    const existing = this.activePowerUps.get(type);
    if (existing) {
      // Extend duration if new one lasts longer
      if (endTime > existing.endTime) {
        existing.endTime = endTime;
      }
      // Update effects if new one is stronger
      if (this.isStrongerEffect(effects, existing.effects)) {
        existing.effects = effects;
      }
    } else {
      this.activePowerUps.set(type, { type, endTime, effects });
    }
    
    this.powerUpsCollected++;
    this.totalPowerUpDuration += duration;
    this.updatePowerUpStats(type);
    this.recalculateEffects();
  }

  private isStrongerEffect(newEffects: PowerUpEffects, existingEffects: PowerUpEffects): boolean {
    // Simple comparison - in a real implementation this could be more sophisticated
    return (newEffects.damageMultiplier || 1) > (existingEffects.damageMultiplier || 1) ||
           (newEffects.speedMultiplier || 1) > (existingEffects.speedMultiplier || 1) ||
           (newEffects.fireRateMultiplier || 1) > (existingEffects.fireRateMultiplier || 1) ||
           (newEffects.healthRegenBoost || 0) > (existingEffects.healthRegenBoost || 0);
  }

  private updatePowerUpStats(type: string): void {
    const current = this.powerUpTypeStats.get(type) || 0;
    this.powerUpTypeStats.set(type, current + 1);
  }

  private recalculateEffects(): void {
    // Reset all effects
    this.totalDamageMultiplier = 1.0;
    this.totalSpeedMultiplier = 1.0;
    this.totalFireRateMultiplier = 1.0;
    this.hasShield = false;
    this.healthRegenBoost = 0;
    
    // Apply all active power-up effects
    this.activePowerUps.forEach(powerUp => {
      const effects = powerUp.effects;
      
      if (effects.damageMultiplier) {
        this.totalDamageMultiplier *= effects.damageMultiplier;
      }
      if (effects.speedMultiplier) {
        this.totalSpeedMultiplier *= effects.speedMultiplier;
      }
      if (effects.fireRateMultiplier) {
        this.totalFireRateMultiplier *= effects.fireRateMultiplier;
      }
      if (effects.hasShield) {
        this.hasShield = true;
      }
      if (effects.healthRegenBoost) {
        this.healthRegenBoost += effects.healthRegenBoost;
      }
    });
  }

  // Effect getters
  getDamageMultiplier(): number {
    return this.totalDamageMultiplier;
  }

  getSpeedMultiplier(): number {
    return this.totalSpeedMultiplier;
  }

  getFireRateMultiplier(): number {
    return this.totalFireRateMultiplier;
  }

  getShieldStatus(): boolean {
    return this.hasShield;
  }

  getHealthRegenBoost(): number {
    return this.healthRegenBoost;
  }

  // Power-up queries
  hasActivePowerUp(type: string): boolean {
    return this.activePowerUps.has(type);
  }

  getActivePowerUps(): Map<string, ActivePowerUp> {
    return new Map(this.activePowerUps);
  }

  getActivePowerUpCount(): number {
    return this.activePowerUps.size;
  }

  getRemainingDuration(type: string): number {
    const powerUp = this.activePowerUps.get(type);
    if (!powerUp) return 0;
    
    return Math.max(0, powerUp.endTime - Date.now());
  }

  // Remove specific power-ups
  removePowerUp(type: string): boolean {
    const removed = this.activePowerUps.delete(type);
    if (removed) {
      this.recalculateEffects();
    }
    return removed;
  }

  removeAllPowerUps(): void {
    this.activePowerUps.clear();
    this.recalculateEffects();
  }

  // Damage mitigation through shield
  mitigateDamage(incomingDamage: number): {
    actualDamage: number;
    shieldBlocked: boolean;
    shieldRemaining: boolean;
  } {
    if (this.hasShield && incomingDamage > 0) {
      // Shield blocks the damage and is consumed
      this.removePowerUp('SHIELD');
      return {
        actualDamage: 0,
        shieldBlocked: true,
        shieldRemaining: false
      };
    }
    
    return {
      actualDamage: incomingDamage,
      shieldBlocked: false,
      shieldRemaining: this.hasShield
    };
  }

  // Statistics
  getPowerUpsCollected(): number {
    return this.powerUpsCollected;
  }

  getTotalPowerUpDuration(): number {
    return this.totalPowerUpDuration;
  }

  getPowerUpTypeStats(): Map<string, number> {
    return new Map(this.powerUpTypeStats);
  }

  getMostUsedPowerUpType(): string | null {
    let maxCount = 0;
    let mostUsed: string | null = null;
    
    this.powerUpTypeStats.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = type;
      }
    });
    
    return mostUsed;
  }

  // Power-up efficiency
  getEfficiencyMetrics(): {
    averageDurationPerPowerUp: number;
    powerUpUtilization: number;
    effectivenessRating: number;
  } {
    const avgDuration = this.powerUpsCollected > 0 ? 
      this.totalPowerUpDuration / this.powerUpsCollected : 0;
    
    // Calculate utilization as percentage of time with active power-ups
    const totalGameTime = Date.now(); // This would need to be tracked properly
    const utilization = this.totalPowerUpDuration / Math.max(totalGameTime, 1);
    
    // Effectiveness based on variety of power-ups used
    const varietyScore = this.powerUpTypeStats.size / 5; // Assuming 5 types max
    const effectivenessRating = Math.min(1, varietyScore * utilization);
    
    return {
      averageDurationPerPowerUp: avgDuration,
      powerUpUtilization: utilization,
      effectivenessRating
    };
  }

  // Power-up recommendations
  getRecommendedPowerUps(): string[] {
    const stats = this.powerUpTypeStats;
    
    // Recommend least used power-ups
    const allTypes = ['EXTRA_DAMAGE', 'SPEED_BOOST', 'FASTER_SHOOTING', 'SHIELD', 'HEALTH_REGEN'];
    const sortedByUsage = allTypes.sort((a, b) => (stats.get(a) || 0) - (stats.get(b) || 0));
    
    return sortedByUsage.slice(0, 3);
  }

  // Save/Load state
  getState(): {
    activePowerUps: Array<{ type: string; endTime: number; effects: PowerUpEffects }>;
    powerUpsCollected: number;
    totalPowerUpDuration: number;
    powerUpTypeStats: Record<string, number>;
  } {
    const activePowerUpsArray = Array.from(this.activePowerUps.values());
    const powerUpTypeStatsObj: Record<string, number> = {};
    this.powerUpTypeStats.forEach((count, type) => {
      powerUpTypeStatsObj[type] = count;
    });
    
    return {
      activePowerUps: activePowerUpsArray,
      powerUpsCollected: this.powerUpsCollected,
      totalPowerUpDuration: this.totalPowerUpDuration,
      powerUpTypeStats: powerUpTypeStatsObj
    };
  }

  setState(state: {
    activePowerUps: Array<{ type: string; endTime: number; effects: PowerUpEffects }>;
    powerUpsCollected: number;
    totalPowerUpDuration: number;
    powerUpTypeStats: Record<string, number>;
  }): void {
    this.activePowerUps.clear();
    state.activePowerUps.forEach(powerUp => {
      this.activePowerUps.set(powerUp.type, powerUp);
    });
    
    this.powerUpsCollected = state.powerUpsCollected;
    this.totalPowerUpDuration = state.totalPowerUpDuration;
    
    this.powerUpTypeStats.clear();
    Object.entries(state.powerUpTypeStats).forEach(([type, count]) => {
      this.powerUpTypeStats.set(type, count);
    });
    
    this.recalculateEffects();
  }

  // Debug information
  getDebugInfo(): {
    activeCount: number;
    activePowerUps: Array<{ type: string; remainingMs: number; effects: PowerUpEffects }>;
    totalEffects: {
      damage: number;
      speed: number;
      fireRate: number;
      shield: boolean;
      healthRegen: number;
    };
    statistics: {
      collected: number;
      totalDuration: number;
      typeStats: Record<string, number>;
    };
  } {
    const activePowerUpsArray = Array.from(this.activePowerUps.values()).map(powerUp => ({
      type: powerUp.type,
      remainingMs: Math.max(0, powerUp.endTime - Date.now()),
      effects: powerUp.effects
    }));
    
    const powerUpTypeStatsObj: Record<string, number> = {};
    this.powerUpTypeStats.forEach((count, type) => {
      powerUpTypeStatsObj[type] = count;
    });
    
    return {
      activeCount: this.activePowerUps.size,
      activePowerUps: activePowerUpsArray,
      totalEffects: {
        damage: this.totalDamageMultiplier,
        speed: this.totalSpeedMultiplier,
        fireRate: this.totalFireRateMultiplier,
        shield: this.hasShield,
        healthRegen: this.healthRegenBoost
      },
      statistics: {
        collected: this.powerUpsCollected,
        totalDuration: this.totalPowerUpDuration,
        typeStats: powerUpTypeStatsObj
      }
    };
  }
}