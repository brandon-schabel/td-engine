import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '@/utils/Vector2';
import { BASE_PLAYER_STATS, GAME_MECHANICS } from '../config/GameConfig';
import { UPGRADE_CONSTANTS } from '../config/UpgradeConfig';
import { PLAYER_ABILITIES, PLAYER_UPGRADES, POWER_UP_CONFIG, PLAYER_VISUALS } from '../config/PlayerConfig';
import { CooldownManager } from '@/utils/CooldownManager';
import { ShootingUtils, type ShootingCapable } from '../interfaces/ShootingCapable';
import { PlayerPowerUps } from './player/PlayerPowerUps';
import { PlayerLevelSystem } from './player/PlayerLevelSystem';
import { calculateUpgradeCost, normalizeMovement } from '@/utils/MathUtils';

export enum PlayerUpgradeType {
  DAMAGE = 'DAMAGE',
  SPEED = 'SPEED',
  FIRE_RATE = 'FIRE_RATE',
  HEALTH = 'HEALTH',
  REGENERATION = 'REGENERATION'
}

export class Player extends Entity implements ShootingCapable {
  private baseDamage: number;
  private baseSpeed: number;
  private baseFireRate: number;
  public cooldownTime: number;
  public currentCooldown: number = 0;
  
  // Movement
  public override velocity: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  
  // Upgrade levels
  private upgradeLevels: Map<PlayerUpgradeType, number> = new Map();
  private level: number = 1;
  
  // Healing mechanics
  private regenerationTimer: number = 0;
  private damageCooldown: number = 0;
  private healAbilityCooldown: number = PLAYER_ABILITIES.heal.cooldown; // Start on cooldown
  private maxHealAbilityCooldown: number = GAME_MECHANICS.healAbilityCooldown;
  private healthPickupsCollected: number = 0;
  private totalHealingReceived: number = 0;
  private onHealthPickupCallback?: () => void;
  
  // Manual shooting mechanics
  private aimPosition: Vector2 = { x: 0, y: 0 };
  private isHolding: boolean = false;
  private shootingMode: 'manual' | 'auto' = 'manual';
  private isShooting: boolean = false; // For continuous shooting
  
  // Power-up system
  private powerUps: PlayerPowerUps;
  
  // Level system
  private levelSystem: PlayerLevelSystem;

  constructor(position: Vector2) {
    super(EntityType.PLAYER, position, BASE_PLAYER_STATS.health, BASE_PLAYER_STATS.radius);
    
    this.baseDamage = BASE_PLAYER_STATS.damage;
    this.baseSpeed = BASE_PLAYER_STATS.speed;
    this.baseFireRate = BASE_PLAYER_STATS.fireRate;
    this.cooldownTime = 1000 / BASE_PLAYER_STATS.fireRate;
    
    // Initialize upgrade levels
    this.upgradeLevels.set(PlayerUpgradeType.DAMAGE, 0);
    this.upgradeLevels.set(PlayerUpgradeType.SPEED, 0);
    this.upgradeLevels.set(PlayerUpgradeType.FIRE_RATE, 0);
    this.upgradeLevels.set(PlayerUpgradeType.HEALTH, 0);
    this.upgradeLevels.set(PlayerUpgradeType.REGENERATION, 0);
    
    // Initialize power-up system
    this.powerUps = new PlayerPowerUps();
    
    // Initialize level system
    this.levelSystem = new PlayerLevelSystem();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update cooldowns using CooldownManager
    this.currentCooldown = CooldownManager.updateCooldown(this.currentCooldown, deltaTime);
    this.healAbilityCooldown = CooldownManager.updateCooldown(this.healAbilityCooldown, deltaTime);
    this.damageCooldown = CooldownManager.updateCooldown(this.damageCooldown, deltaTime);
    
    // Update regeneration
    if (this.hasRegeneration() && this.isAlive && this.health < this.maxHealth && this.damageCooldown <= 0) {
      this.regenerationTimer += deltaTime;
      
      const regenRate = this.getRegenerationRate();
      
      if (this.regenerationTimer >= GAME_MECHANICS.regenInterval) {
        const healAmount = Math.min(regenRate, this.maxHealth - this.health);
        if (healAmount > 0) {
          this.heal(healAmount);
          this.totalHealingReceived += healAmount;
        }
        this.regenerationTimer = 0;
      }
    }
    
    // Update power-ups
    this.powerUps.update(deltaTime);
    
    // Update movement
    this.updateMovement(deltaTime);
  }

  private updateMovement(deltaTime: number): void {
    let movementX = 0;
    let movementY = 0;
    
    // Calculate movement based on pressed keys
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      movementY -= 1;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      movementY += 1;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      movementX -= 1;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      movementX += 1;
    }
    
    // Normalize diagonal movement
    const normalized = normalizeMovement(movementX, movementY);
    this.velocity.x = normalized.x * this.getCurrentSpeed();
    this.velocity.y = normalized.y * this.getCurrentSpeed();
    
    // Apply movement
    const deltaSeconds = deltaTime / 1000;
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
  }

  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  findNearestEnemy(enemies: Enemy[]): Enemy | null {
    return ShootingUtils.findNearestEnemy(this.position, enemies);
  }

  canShoot(): boolean {
    return ShootingUtils.canShoot(this.currentCooldown);
  }

  shoot(target: Enemy): Projectile | null {
    return ShootingUtils.performShoot(this as ShootingCapable, target, GAME_MECHANICS.projectileSpeed);
  }

  autoShoot(enemies: Enemy[]): Projectile | null {
    // Only auto-shoot if in auto mode
    if (this.shootingMode !== 'auto' || !this.canShoot()) {
      return null;
    }

    const target = this.findNearestEnemy(enemies);
    if (!target) {
      return null;
    }

    return this.shoot(target);
  }

  // Boundary checking
  constrainToBounds(width: number, height: number): void {
    this.position.x = Math.max(this.radius, Math.min(width - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(height - this.radius, this.position.y));
  }

  // Upgrade system
  upgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    const maxLevel = UPGRADE_CONSTANTS.maxLevel;
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    // Recalculate stats if needed
    if (upgradeType === PlayerUpgradeType.FIRE_RATE) {
      this.cooldownTime = 1000 / this.getCurrentFireRate();
    }
    
    if (upgradeType === PlayerUpgradeType.HEALTH) {
      // Increase max health and heal
      const oldMaxHealth = this.maxHealth;
      this.maxHealth = this.getMaxHealth();
      this.health += (this.maxHealth - oldMaxHealth);
    }
    
    // Removed level update - level is now only affected by experience
    
    return true;
  }

  canUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < UPGRADE_CONSTANTS.maxLevel;
  }

  getUpgradeLevel(upgradeType: PlayerUpgradeType): number {
    return this.upgradeLevels.get(upgradeType) || 0;
  }

  getMaxUpgradeLevel(): number {
    return UPGRADE_CONSTANTS.maxLevel;
  }

  getLevel(): number {
    return this.level;
  }

  getTotalUpgrades(): number {
    let total = 0;
    this.upgradeLevels.forEach(level => total += level);
    return total;
  }

  // Upgrade cost and management (replaces PlayerUpgradeManager)
  getUpgradeCost(upgradeType: PlayerUpgradeType): number {
    const configs = {
      [PlayerUpgradeType.DAMAGE]: { baseCost: 25, costMultiplier: 1.5, maxLevel: 5 },
      [PlayerUpgradeType.SPEED]: { baseCost: 20, costMultiplier: 1.5, maxLevel: 5 },
      [PlayerUpgradeType.FIRE_RATE]: { baseCost: 30, costMultiplier: 1.5, maxLevel: 5 },
      [PlayerUpgradeType.HEALTH]: { baseCost: 35, costMultiplier: 1.5, maxLevel: 5 },
      [PlayerUpgradeType.REGENERATION]: { baseCost: 40, costMultiplier: 1.5, maxLevel: 5 }
    };
    
    const config = configs[upgradeType];
    const currentLevel = this.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= config.maxLevel) {
      return 0; // Max level reached
    }
    
    return calculateUpgradeCost(config.baseCost, config.costMultiplier, currentLevel);
  }

  canAffordUpgrade(upgradeType: PlayerUpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(upgradeType);
    return cost > 0 && availableCurrency >= cost && this.canUpgrade(upgradeType);
  }

  getUpgradeDescription(upgradeType: PlayerUpgradeType): string {
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE:
        return `Increase damage by ${PLAYER_UPGRADES.bonusMultipliers.DAMAGE * 100}%`;
      case PlayerUpgradeType.SPEED:
        return `Increase movement speed by ${PLAYER_UPGRADES.bonusMultipliers.SPEED * 100}%`;
      case PlayerUpgradeType.FIRE_RATE:
        return `Increase fire rate by ${PLAYER_UPGRADES.bonusMultipliers.FIRE_RATE * 100}%`;
      case PlayerUpgradeType.HEALTH:
        return `Increase max health by ${PLAYER_UPGRADES.bonusMultipliers.HEALTH * 100}%`;
      case PlayerUpgradeType.REGENERATION:
        return `Increase regeneration by ${PLAYER_ABILITIES.regeneration.levelBonus} HP/s`;
      default:
        return 'Unknown upgrade';
    }
  }

  // Computed properties based on upgrades, level bonuses, and power-ups
  get damage(): number {
    const damageLevel = this.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const levelBonus = this.levelSystem.getLevelBonus('damage');
    const baseDamage = Math.floor(this.baseDamage * (1 + damageLevel * 0.4) * (1 + levelBonus));
    return Math.floor(baseDamage * this.powerUps.getDamageMultiplier());
  }

  get speed(): number {
    const speedLevel = this.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const levelBonus = this.levelSystem.getLevelBonus('speed');
    const baseSpeed = Math.floor(this.baseSpeed * (1 + speedLevel * 0.3) * (1 + levelBonus));
    return Math.floor(baseSpeed * this.powerUps.getSpeedMultiplier());
  }

  get fireRate(): number {
    const fireRateLevel = this.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const levelBonus = this.levelSystem.getLevelBonus('fireRate');
    const baseFireRate = this.baseFireRate * (1 + fireRateLevel * 0.25) * (1 + levelBonus);
    return baseFireRate * this.powerUps.getFireRateMultiplier();
  }

  getMaxHealth(): number {
    const healthLevel = this.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const levelBonus = this.levelSystem.getLevelBonus('health');
    return Math.floor(BASE_PLAYER_STATS.health * (1 + healthLevel * 0.5) * (1 + levelBonus));
  }

  getCooldownTime(): number {
    return this.cooldownTime;
  }

  getVelocity(): Vector2 {
    return { ...this.velocity };
  }

  isMoving(): boolean {
    return this.velocity.x !== 0 || this.velocity.y !== 0;
  }

  getPlayerPowerUps(): PlayerPowerUps {
    return this.powerUps;
  }

  getPlayerLevelSystem(): PlayerLevelSystem {
    return this.levelSystem;
  }

  // Experience and leveling
  addExperience(amount: number): boolean {
    return this.levelSystem.addExperience(amount);
  }

  getLevel(): number {
    return this.levelSystem.getLevel();
  }

  getExperienceProgress(): { current: number; required: number; percentage: number } {
    return {
      current: this.levelSystem.getExperience(),
      required: this.levelSystem.getExperienceToNextLevel(),
      percentage: this.levelSystem.getLevelProgress()
    };
  }

  // Override takeDamage is now in the power-up section

  // Healing mechanics
  hasRegeneration(): boolean {
    return this.getUpgradeLevel(PlayerUpgradeType.REGENERATION) > 0;
  }

  getRegenerationRate(): number {
    const regenLevel = this.getUpgradeLevel(PlayerUpgradeType.REGENERATION);
    if (regenLevel === 0) return 0;
    const levelBonus = this.levelSystem.getLevelBonus('regeneration');
    const baseRate = PLAYER_ABILITIES.regeneration.baseRate + regenLevel * PLAYER_ABILITIES.regeneration.levelBonus;
    return baseRate * (1 + levelBonus);
  }

  canUseHealAbility(): boolean {
    return this.healAbilityCooldown <= 0 && this.isAlive;
  }

  useHealAbility(): boolean {
    if (!this.canUseHealAbility() || this.health >= this.maxHealth) {
      return false;
    }

    const healAmount = PLAYER_ABILITIES.heal.amount;
    const actualHealAmount = Math.min(healAmount, this.maxHealth - this.health);
    this.heal(actualHealAmount);
    this.totalHealingReceived += actualHealAmount;
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

  collectHealthPickup(healAmount: number): boolean {
    if (!this.isAlive) {
      return false;
    }

    const actualHealAmount = Math.min(healAmount, this.maxHealth - this.health);
    if (actualHealAmount > 0) {
      this.heal(actualHealAmount);
      this.totalHealingReceived += actualHealAmount;
    }
    
    this.healthPickupsCollected++;
    
    if (this.onHealthPickupCallback) {
      this.onHealthPickupCallback();
    }
    
    return true;
  }

  onHealthPickup(callback: () => void): void {
    this.onHealthPickupCallback = callback;
  }

  getHealthPickupsCollected(): number {
    return this.healthPickupsCollected;
  }

  getTotalHealingReceived(): number {
    return this.totalHealingReceived;
  }

  // Manual shooting mechanics
  isAutoShootEnabled(): boolean {
    return this.shootingMode === 'auto';
  }

  getShootingMode(): string {
    return this.shootingMode;
  }

  setAimPosition(position: Vector2): void {
    this.aimPosition = { ...position };
  }

  getAimPosition(): Vector2 {
    return { ...this.aimPosition };
  }

  getAimAngle(): number {
    const dx = this.aimPosition.x - this.position.x;
    const dy = this.aimPosition.y - this.position.y;
    return Math.atan2(dy, dx);
  }

  shootManual(): Projectile | null {
    if (!this.canShoot()) {
      return null;
    }

    // Start shooting cooldown
    this.currentCooldown = CooldownManager.startCooldown(this.cooldownTime);

    // Create projectile in aim direction
    const angle = this.getAimAngle();
    const speed = GAME_MECHANICS.projectileSpeed;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    return new Projectile(
      { ...this.position },
      null, // No specific target, just direction
      this.getCurrentDamage(),
      speed,
      velocity
    );
  }

  handleMouseDown(position: Vector2): Projectile | null {
    this.setAimPosition(position);
    this.isHolding = true;
    return this.shootManual();
  }

  handleMouseUp(): void {
    this.isHolding = false;
  }

  handleMouseMove(position: Vector2): void {
    this.setAimPosition(position);
  }

  isHoldingToShoot(): boolean {
    return this.isHolding;
  }


  shouldShowAimer(): boolean {
    return true; // Always show aimer in manual mode
  }

  getAimerLine(): { start: Vector2; end: Vector2 } {
    const angle = this.getAimAngle();
    const aimerLength = PLAYER_VISUALS.aimerLength; // Length of the aimer line
    
    const end = {
      x: this.position.x + Math.cos(angle) * aimerLength,
      y: this.position.y + Math.sin(angle) * aimerLength
    };

    return {
      start: { ...this.position },
      end
    };
  }

  // Power-up system methods (delegated to PlayerPowerUps)
  addTemporaryDamageBoost(multiplier: number, duration: number = POWER_UP_CONFIG.durations.DAMAGE_BOOST): void {
    this.powerUps.addExtraDamage(multiplier, duration);
  }

  addTemporaryFireRateBoost(multiplier: number, duration: number = POWER_UP_CONFIG.durations.RAPID_FIRE): void {
    this.powerUps.addFasterShooting(multiplier, duration);
    this.cooldownTime = 1000 / this.getCurrentFireRate(); // Update cooldown
  }

  addTemporarySpeedBoost(multiplier: number, duration: number = POWER_UP_CONFIG.durations.SPEED_BOOST): void {
    this.powerUps.addSpeedBoost(multiplier, duration);
  }

  addShield(duration: number = POWER_UP_CONFIG.durations.INVINCIBILITY): void {
    this.powerUps.addShield(duration);
  }

  addHealthRegenBoost(regenBoost: number, duration: number): void {
    this.powerUps.addHealthRegenBoost(regenBoost, duration);
  }

  override takeDamage(amount: number): void {
    const damageResult = this.powerUps.mitigateDamage(amount);
    
    if (damageResult.actualDamage > 0) {
      super.takeDamage(damageResult.actualDamage);
      this.damageCooldown = GAME_MECHANICS.damageRegenCooldown;
    }
  }

  getActivePowerUps(): Map<string, number> {
    const result = new Map<string, number>();
    const activePowerUps = this.powerUps.getActivePowerUps();
    
    activePowerUps.forEach((powerUp) => {
      result.set(powerUp.type, powerUp.endTime);
    });
    
    return result;
  }

  hasActivePowerUp(type: string): boolean {
    return this.powerUps.hasActivePowerUp(type);
  }

  // Additional methods to expose powerup system functionality
  getPlayerPowerUps(): PlayerPowerUps {
    return this.powerUps;
  }

  getShieldStatus(): boolean {
    return this.powerUps.getShieldStatus();
  }

  // Equipment bonuses system
  private equipmentBonuses = {
    damageMultiplier: 1,
    healthMultiplier: 1,
    speedMultiplier: 1,
    fireRateMultiplier: 1
  };

  applyEquipmentBonuses(bonuses: {
    damageMultiplier: number;
    healthMultiplier: number;
    speedMultiplier: number;
    fireRateMultiplier: number;
  }): void {
    this.equipmentBonuses = { ...bonuses };
    // Recalculate cooldown time based on new fire rate
    this.cooldownTime = 1000 / this.getCurrentFireRate();
  }

  getEquipmentBonuses() {
    return { ...this.equipmentBonuses };
  }

  // Override stat calculations to include equipment bonuses
  getCurrentDamage(): number {
    return this.damage * this.equipmentBonuses.damageMultiplier;
  }

  getCurrentSpeed(): number {
    return this.speed * this.equipmentBonuses.speedMultiplier;
  }

  getCurrentFireRate(): number {
    return this.fireRate * this.equipmentBonuses.fireRateMultiplier;
  }

  getMaxHealthWithBonuses(): number {
    return this.getMaxHealth() * this.equipmentBonuses.healthMultiplier;
  }
  
  // Touch control methods
  setVelocity(x: number, y: number): void {
    const speed = this.getCurrentSpeed();
    // Normalize the input if needed
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 1) {
      const normalized = normalizeMovement(x, y);
      this.velocity.x = normalized.x * speed;
      this.velocity.y = normalized.y * speed;
    } else {
      this.velocity.x = x * speed;
      this.velocity.y = y * speed;
    }
  }
  
  setAimDirection(angle: number): void {
    // Update aim position based on angle
    const distance = 100; // Arbitrary distance for aim position
    this.aimPosition = {
      x: this.position.x + Math.cos(angle) * distance,
      y: this.position.y + Math.sin(angle) * distance
    };
  }
  
  startShooting(): void {
    this.isShooting = true;
  }
  
  stopShooting(): void {
    this.isShooting = false;
  }
  
  tryShoot(): Projectile | null {
    if (this.canShoot()) {
      return this.shootManual();
    }
    return null;
  }
  
  // Update shooting to support continuous touch shooting
  updateShooting(): Projectile | null {
    if ((this.isHolding || this.isShooting) && this.canShoot()) {
      return this.shootManual();
    }
    return null;
  }
}