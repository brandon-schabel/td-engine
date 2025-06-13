import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '../utils/Vector2';
import { BASE_PLAYER_STATS, GAME_MECHANICS, UPGRADE_CONFIG } from '../config/GameConfig';
import { CooldownManager } from '../utils/CooldownManager';
import { ShootingUtils, type ShootingCapable } from '../interfaces/ShootingCapable';

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
  private cooldownTime: number;
  private currentCooldown: number = 0;
  
  // Movement
  public override velocity: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  
  // Upgrade levels
  private upgradeLevels: Map<PlayerUpgradeType, number> = new Map();
  private level: number = 1;
  
  // Healing mechanics
  private regenerationTimer: number = 0;
  private damageCooldown: number = 0;
  private healAbilityCooldown: number = 5000; // Start on cooldown
  private maxHealAbilityCooldown: number = GAME_MECHANICS.healAbilityCooldown;
  private healthPickupsCollected: number = 0;
  private totalHealingReceived: number = 0;
  private onHealthPickupCallback?: () => void;
  
  // Manual shooting mechanics
  private aimPosition: Vector2 = { x: 0, y: 0 };
  private isHolding: boolean = false;
  private shootingMode: 'manual' | 'auto' = 'manual';
  
  // Power-up system
  private temporaryDamageBoost: number = 1.0;
  private temporaryFireRateBoost: number = 1.0;
  private temporarySpeedBoost: number = 1.0;
  private hasShield: boolean = false;
  private activePowerUps: Map<string, number> = new Map(); // powerUpType -> endTime

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
    this.updatePowerUps();
    
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
    const magnitude = Math.sqrt(movementX * movementX + movementY * movementY);
    if (magnitude > 0) {
      this.velocity.x = (movementX / magnitude) * this.speed;
      this.velocity.y = (movementY / magnitude) * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
    
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
    return ShootingUtils.performShoot(this, target, GAME_MECHANICS.projectileSpeed);
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
    const maxLevel = UPGRADE_CONFIG.maxLevel;
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    // Recalculate stats if needed
    if (upgradeType === PlayerUpgradeType.FIRE_RATE) {
      this.cooldownTime = 1000 / this.fireRate;
    }
    
    if (upgradeType === PlayerUpgradeType.HEALTH) {
      // Increase max health and heal
      const oldMaxHealth = this.maxHealth;
      this.maxHealth = this.getMaxHealth();
      this.health += (this.maxHealth - oldMaxHealth);
    }
    
    // Update level
    this.level = 1 + Math.floor(this.getTotalUpgrades() / UPGRADE_CONFIG.levelCalculationDivisor.player);
    
    return true;
  }

  canUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < UPGRADE_CONFIG.maxLevel;
  }

  getUpgradeLevel(upgradeType: PlayerUpgradeType): number {
    return this.upgradeLevels.get(upgradeType) || 0;
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
    
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
  }

  canAffordUpgrade(upgradeType: PlayerUpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(upgradeType);
    return cost > 0 && availableCurrency >= cost && this.canUpgrade(upgradeType);
  }

  getUpgradeDescription(upgradeType: PlayerUpgradeType): string {
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE:
        return 'Increase damage by 40%';
      case PlayerUpgradeType.SPEED:
        return 'Increase movement speed by 30%';
      case PlayerUpgradeType.FIRE_RATE:
        return 'Increase fire rate by 25%';
      case PlayerUpgradeType.HEALTH:
        return 'Increase max health by 50%';
      case PlayerUpgradeType.REGENERATION:
        return 'Increase regeneration by 1.5 HP/s';
      default:
        return 'Unknown upgrade';
    }
  }

  // Computed properties based on upgrades and power-ups
  get damage(): number {
    const damageLevel = this.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const baseDamage = Math.floor(this.baseDamage * (1 + damageLevel * 0.4));
    return Math.floor(baseDamage * this.temporaryDamageBoost);
  }

  get speed(): number {
    const speedLevel = this.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const baseSpeed = Math.floor(this.baseSpeed * (1 + speedLevel * 0.3));
    return Math.floor(baseSpeed * this.temporarySpeedBoost);
  }

  get fireRate(): number {
    const fireRateLevel = this.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const baseFireRate = this.baseFireRate * (1 + fireRateLevel * 0.25);
    return baseFireRate * this.temporaryFireRateBoost;
  }

  getMaxHealth(): number {
    const healthLevel = this.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    return Math.floor(BASE_PLAYER_STATS.health * (1 + healthLevel * 0.5));
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

  // Override takeDamage is now in the power-up section

  // Healing mechanics
  hasRegeneration(): boolean {
    return this.getUpgradeLevel(PlayerUpgradeType.REGENERATION) > 0;
  }

  getRegenerationRate(): number {
    const regenLevel = this.getUpgradeLevel(PlayerUpgradeType.REGENERATION);
    if (regenLevel === 0) return 0;
    return 2 + regenLevel * 1.5; // 2 HP/s base, +1.5 per level
  }

  canUseHealAbility(): boolean {
    return this.healAbilityCooldown <= 0 && this.isAlive;
  }

  useHealAbility(): boolean {
    if (!this.canUseHealAbility() || this.health >= this.maxHealth) {
      return false;
    }

    const healAmount = 30;
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
      this.damage,
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

  updateShooting(): Projectile | null {
    if (this.isHolding && this.canShoot()) {
      return this.shootManual();
    }
    return null;
  }

  shouldShowAimer(): boolean {
    return true; // Always show aimer in manual mode
  }

  getAimerLine(): { start: Vector2; end: Vector2 } {
    const angle = this.getAimAngle();
    const aimerLength = 100; // Length of the aimer line
    
    const end = {
      x: this.position.x + Math.cos(angle) * aimerLength,
      y: this.position.y + Math.sin(angle) * aimerLength
    };

    return {
      start: { ...this.position },
      end
    };
  }

  // Power-up system methods
  private updatePowerUps(): void {
    const currentTime = Date.now();
    const expiredPowerUps: string[] = [];
    
    this.activePowerUps.forEach((endTime, powerUpType) => {
      if (currentTime >= endTime) {
        expiredPowerUps.push(powerUpType);
      }
    });
    
    // Remove expired power-ups
    expiredPowerUps.forEach(powerUpType => {
      this.activePowerUps.delete(powerUpType);
      
      // Apply cleanup effects
      switch (powerUpType) {
        case 'EXTRA_DAMAGE':
          this.removeTemporaryDamageBoost();
          break;
        case 'FASTER_SHOOTING':
          this.removeTemporaryFireRateBoost();
          break;
        case 'SHIELD':
          this.removeShield();
          break;
        case 'SPEED_BOOST':
          this.removeTemporarySpeedBoost();
          break;
      }
    });
  }

  addTemporaryDamageBoost(multiplier: number): void {
    this.temporaryDamageBoost = multiplier;
    this.activePowerUps.set('EXTRA_DAMAGE', Date.now() + 10000);
  }

  removeTemporaryDamageBoost(): void {
    this.temporaryDamageBoost = 1.0;
  }

  addTemporaryFireRateBoost(multiplier: number): void {
    this.temporaryFireRateBoost = multiplier;
    this.cooldownTime = 1000 / this.fireRate; // Update cooldown
    this.activePowerUps.set('FASTER_SHOOTING', Date.now() + 8000);
  }

  removeTemporaryFireRateBoost(): void {
    this.temporaryFireRateBoost = 1.0;
    this.cooldownTime = 1000 / this.fireRate; // Update cooldown
  }

  addTemporarySpeedBoost(multiplier: number): void {
    this.temporarySpeedBoost = multiplier;
    this.activePowerUps.set('SPEED_BOOST', Date.now() + 12000);
  }

  removeTemporarySpeedBoost(): void {
    this.temporarySpeedBoost = 1.0;
  }

  addShield(): void {
    this.hasShield = true;
    this.activePowerUps.set('SHIELD', Date.now() + 15000);
  }

  removeShield(): void {
    this.hasShield = false;
  }

  override takeDamage(amount: number): void {
    if (this.hasShield) {
      // Shield blocks damage
      return;
    }
    
    super.takeDamage(amount);
    this.damageCooldown = GAME_MECHANICS.damageRegenCooldown;
  }

  getActivePowerUps(): Map<string, number> {
    return new Map(this.activePowerUps);
  }

  hasActivePowerUp(type: string): boolean {
    return this.activePowerUps.has(type);
  }
}