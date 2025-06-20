/**
 * Modular Player
 * Refactored Player class using specialized component systems
 * Demonstrates the significant simplification achieved through separation of concerns
 */

import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { PlayerMovement } from './player/PlayerMovement';
import { PlayerCombat, ShootingMode } from './player/PlayerCombat';
import { PlayerProgression } from './player/PlayerProgression';
import { PlayerHealth } from './player/PlayerHealth';
import { PlayerPowerUps } from './player/PlayerPowerUps';
import { BASE_PLAYER_STATS } from '../config/GameConfig';
import type { Vector2 } from '@/utils/Vector2';
import type { ShootingCapable } from '@/interfaces/ShootingCapable';
import type { Upgradeable } from '@/systems/BaseUpgradeManager';


export enum PlayerUpgradeType {
  DAMAGE = 'DAMAGE',
  SPEED = 'SPEED',
  FIRE_RATE = 'FIRE_RATE',
  HEALTH = 'HEALTH',
  REGENERATION = 'REGENERATION'
}

export class ModularPlayer extends Entity implements ShootingCapable, Upgradeable<PlayerUpgradeType> {
  // Specialized component systems
  private movement: PlayerMovement;
  private combat: PlayerCombat;
  private progression: PlayerProgression;
  private healthSystem: PlayerHealth;
  private powerUps: PlayerPowerUps;

  // Required by ShootingCapable interface
  readonly cooldownTime: number = BASE_PLAYER_STATS.fireRate;
  currentCooldown: number = 0;

  constructor(position: Vector2) {
    super(EntityType.PLAYER, position, BASE_PLAYER_STATS.health, BASE_PLAYER_STATS.radius);
    
    // Initialize component systems
    this.movement = new PlayerMovement(BASE_PLAYER_STATS.speed);
    this.combat = new PlayerCombat(BASE_PLAYER_STATS.damage, BASE_PLAYER_STATS.fireRate);
    this.progression = new PlayerProgression();
    this.healthSystem = new PlayerHealth(BASE_PLAYER_STATS.health);
    this.powerUps = new PlayerPowerUps();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Set up callbacks between systems
    this.healthSystem.onDeath(() => {
      this.isAlive = false;
    });

    this.healthSystem.onHealthPickup(() => {
      // Handle health pickup sound/effects
    });
  }

  // Dramatically simplified update method
  override update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update all component systems
    this.movement.update(deltaTime);
    this.combat.update(deltaTime);
    this.powerUps.update(deltaTime);
    
    // Update health system with regeneration info from progression
    this.healthSystem.update(
      deltaTime,
      this.progression.hasRegeneration(),
      this.progression.getRegenerationRate() + this.powerUps.getHealthRegenBoost()
    );
    
    // Apply movement to position
    this.position = this.movement.applyMovement(this.position, deltaTime);
    
    // Update combat system with current position
    this.combat.setPlayerPosition(this.position);
    
    // Sync health between entity and health system
    this.health = this.healthSystem.getHealth();
    this.maxHealth = this.calculateMaxHealth();
    this.healthSystem.setMaxHealth(this.maxHealth);
  }

  // Input handling (delegated to movement and combat systems)
  handleKeyDown(key: string): void {
    this.movement.handleKeyDown(key);
  }

  handleKeyUp(key: string): void {
    this.movement.handleKeyUp(key);
  }

  handleMouseDown(position: Vector2): Projectile | null {
    return this.combat.handleMouseDown(this.position, position);
  }

  handleMouseUp(): void {
    this.combat.handleMouseUp();
  }

  handleMouseMove(position: Vector2): void {
    this.combat.handleMouseMove(position);
  }

  // Combat interface (delegated to combat system)
  findNearestEnemy(enemies: Enemy[]): Enemy | null {
    return enemies.reduce<Enemy | null>((nearest, enemy) => {
      const distance = this.distanceTo(enemy.position);
      if (!nearest || distance < this.distanceTo(nearest.position)) {
        return enemy;
      }
      return nearest;
    }, null);
  }

  canShoot(): boolean {
    return this.combat.canShoot();
  }

  shoot(): Projectile | null {
    // This method would need to be updated to work with the new combat system
    return null; // Simplified for this example
  }

  autoShoot(enemies: Enemy[]): Projectile | null {
    return this.combat.autoShoot(this.position, enemies);
  }

  updateShooting(): Projectile | null {
    return this.combat.updateShooting(this.position);
  }

  // Upgrade interface (delegated to progression system)
  upgrade(upgradeType: PlayerUpgradeType): boolean {
    const success = this.progression.upgrade(upgradeType);
    
    if (success) {
      this.updateStatsFromProgression();
    }
    
    return success;
  }

  canUpgrade(upgradeType: PlayerUpgradeType): boolean {
    return this.progression.canUpgrade(upgradeType);
  }

  getUpgradeLevel(upgradeType: PlayerUpgradeType): number {
    return this.progression.getUpgradeLevel(upgradeType);
  }

  private updateStatsFromProgression(): void {
    // Update movement speed
    this.movement.setSpeedMultiplier(
      this.progression.getSpeedMultiplier() * this.powerUps.getSpeedMultiplier()
    );
    
    // Update combat stats
    this.combat.updateDamage(
      BASE_PLAYER_STATS.damage * this.progression.getDamageMultiplier() * this.powerUps.getDamageMultiplier()
    );
    
    this.combat.updateFireRate(
      BASE_PLAYER_STATS.fireRate * this.progression.getFireRateMultiplier() * this.powerUps.getFireRateMultiplier()
    );
    
    // Update max health
    this.maxHealth = this.calculateMaxHealth();
    this.healthSystem.setMaxHealth(this.maxHealth);
  }

  private calculateMaxHealth(): number {
    return Math.floor(BASE_PLAYER_STATS.health * this.progression.getHealthMultiplier());
  }

  // Health methods (delegated to health system)
  override takeDamage(amount: number): void {
    // Check for shield first
    const mitigation = this.powerUps.mitigateDamage(amount);
    
    if (mitigation.actualDamage > 0) {
      this.healthSystem.takeDamage(mitigation.actualDamage);
      this.health = this.healthSystem.getHealth();
      
      if (!this.healthSystem.isAlive()) {
        this.isAlive = false;
      }
    }
  }

  override heal(amount: number): void {
    this.healthSystem.heal(amount);
    this.health = this.healthSystem.getHealth();
  }

  collectHealthPickup(healAmount: number): boolean {
    const success = this.healthSystem.collectHealthPickup(healAmount);
    if (success) {
      this.health = this.healthSystem.getHealth();
    }
    return success;
  }

  canUseHealAbility(): boolean {
    return this.healthSystem.canUseHealAbility();
  }

  useHealAbility(): boolean {
    const success = this.healthSystem.useHealAbility();
    if (success) {
      this.health = this.healthSystem.getHealth();
    }
    return success;
  }

  // Power-up methods
  addTemporaryDamageBoost(multiplier: number, duration: number = 10000): void {
    this.powerUps.addExtraDamage(multiplier, duration);
    this.updateStatsFromProgression();
  }

  addTemporaryFireRateBoost(multiplier: number, duration: number = 8000): void {
    this.powerUps.addFasterShooting(multiplier, duration);
    this.updateStatsFromProgression();
  }

  addTemporarySpeedBoost(multiplier: number, duration: number = 12000): void {
    this.powerUps.addSpeedBoost(multiplier, duration);
    this.updateStatsFromProgression();
  }

  addShield(duration: number = 15000): void {
    this.powerUps.addShield(duration);
  }

  // Movement methods (delegated to movement system)
  constrainToBounds(width: number, height: number): void {
    this.position = this.movement.constrainToBounds(
      this.position, 
      { width, height }, 
      this.radius
    );
  }

  getVelocity(): Vector2 {
    return this.movement.getVelocity();
  }

  isMoving(): boolean {
    return this.movement.isMoving();
  }

  // Computed properties
  get damage(): number {
    return Math.floor(
      BASE_PLAYER_STATS.damage * 
      this.progression.getDamageMultiplier() * 
      this.powerUps.getDamageMultiplier()
    );
  }

  get speed(): number {
    return Math.floor(
      BASE_PLAYER_STATS.speed * 
      this.progression.getSpeedMultiplier() * 
      this.powerUps.getSpeedMultiplier()
    );
  }

  get fireRate(): number {
    return BASE_PLAYER_STATS.fireRate * 
           this.progression.getFireRateMultiplier() * 
           this.powerUps.getFireRateMultiplier();
  }

  // Level and progression
  getLevel(): number {
    return this.progression.getLevel();
  }

  getTotalUpgrades(): number {
    return this.progression.getTotalUpgrades();
  }

  addExperience(amount: number): boolean {
    return this.progression.addExperience(amount);
  }

  // Aiming and shooting mode
  shouldShowAimer(): boolean {
    return this.combat.shouldShowAimer();
  }

  getAimerLine(): { start: Vector2; end: Vector2 } {
    return this.combat.getAimerLine(this.position);
  }

  getShootingMode(): string {
    return this.combat.getShootingMode();
  }

  setShootingMode(mode: ShootingMode): void {
    this.combat.setShootingMode(mode);
  }

  isAutoShootEnabled(): boolean {
    return this.combat.isAutoShootEnabled();
  }

  isHoldingToShoot(): boolean {
    return this.combat.isHoldingToShoot();
  }

  // Power-up queries
  getActivePowerUps(): Map<string, any> {
    return this.powerUps.getActivePowerUps();
  }

  hasActivePowerUp(type: string): boolean {
    return this.powerUps.hasActivePowerUp(type);
  }

  // Health queries
  getHealthPickupsCollected(): number {
    return this.healthSystem.getHealthPickupsCollected();
  }

  getTotalHealingReceived(): number {
    return this.healthSystem.getTotalHealingReceived();
  }

  getHealAbilityCooldown(): number {
    return this.healthSystem.getHealAbilityCooldown();
  }

  getHealAbilityCooldownProgress(): number {
    return this.healthSystem.getHealAbilityCooldownProgress();
  }

  // Comprehensive player information
  getPlayerInfo(): {
    level: number;
    experience: any;
    health: any;
    combat: any;
    movement: any;
    powerUps: any;
    progression: any;
  } {
    return {
      level: this.getLevel(),
      experience: this.progression.getExperienceProgress(),
      health: this.healthSystem.getHealthInfo(),
      combat: this.combat.getCombatInfo(),
      movement: this.movement.getDebugInfo(),
      powerUps: this.powerUps.getDebugInfo(),
      progression: this.progression.getDebugInfo()
    };
  }

  // Performance metrics
  getPerformanceMetrics(): {
    totalUpgrades: number;
    powerUpsCollected: number;
    damageDealt: number; // Would need to be tracked
    distanceTraveled: number; // Would need to be tracked
    healthEfficiency: number;
  } {
    const healthInfo = this.healthSystem.getDebugInfo();
    const healthEfficiency = healthInfo.statistics.totalHealing / Math.max(healthInfo.statistics.totalDamage, 1);
    
    return {
      totalUpgrades: this.getTotalUpgrades(),
      powerUpsCollected: this.powerUps.getPowerUpsCollected(),
      damageDealt: 0, // Would need to implement tracking
      distanceTraveled: 0, // Would need to implement tracking
      healthEfficiency
    };
  }

  // Component access (for advanced usage)
  getMovementSystem(): PlayerMovement {
    return this.movement;
  }

  getCombatSystem(): PlayerCombat {
    return this.combat;
  }

  getProgressionSystem(): PlayerProgression {
    return this.progression;
  }

  getHealthSystem(): PlayerHealth {
    return this.healthSystem;
  }

  getPowerUpSystem(): PlayerPowerUps {
    return this.powerUps;
  }

  // Save/Load state
  getState(): any {
    return {
      position: this.position,
      isAlive: this.isAlive,
      movement: this.movement.getDebugInfo(),
      combat: this.combat.getCombatInfo(),
      progression: this.progression.getState(),
      health: this.healthSystem.getState(),
      powerUps: this.powerUps.getState()
    };
  }

  setState(state: any): void {
    this.position = state.position;
    this.isAlive = state.isAlive;
    
    if (state.progression) {
      this.progression.setState(state.progression);
    }
    if (state.health) {
      this.healthSystem.setState(state.health);
    }
    if (state.powerUps) {
      this.powerUps.setState(state.powerUps);
    }
    
    this.updateStatsFromProgression();
  }
}