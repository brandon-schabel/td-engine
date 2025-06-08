import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '../utils/Vector2';

export enum PlayerUpgradeType {
  DAMAGE = 'DAMAGE',
  SPEED = 'SPEED',
  FIRE_RATE = 'FIRE_RATE',
  HEALTH = 'HEALTH'
}

interface PlayerStats {
  damage: number;
  speed: number;
  fireRate: number;
  health: number;
  radius: number;
}

const BASE_PLAYER_STATS: PlayerStats = {
  damage: 15,
  speed: 150, // pixels per second
  fireRate: 2, // shots per second
  health: 100,
  radius: 12
};

export class Player extends Entity {
  private baseDamage: number;
  private baseSpeed: number;
  private baseFireRate: number;
  private cooldownTime: number;
  private currentCooldown: number = 0;
  
  // Movement
  private velocity: Vector2 = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  
  // Upgrade levels
  private upgradeLevels: Map<PlayerUpgradeType, number> = new Map();
  private level: number = 1;

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
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update cooldown
    if (this.currentCooldown > 0) {
      this.currentCooldown = Math.max(0, this.currentCooldown - deltaTime);
    }
    
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
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    
    if (aliveEnemies.length === 0) {
      return null;
    }
    
    return aliveEnemies.reduce((nearest, enemy) => {
      const distToEnemy = this.distanceTo(enemy);
      const distToNearest = this.distanceTo(nearest);
      return distToEnemy < distToNearest ? enemy : nearest;
    });
  }

  canShoot(): boolean {
    return this.currentCooldown <= 0;
  }

  shoot(target: Enemy): Projectile | null {
    if (!this.canShoot()) {
      return null;
    }

    // Reset cooldown
    this.currentCooldown = this.cooldownTime;

    // Create projectile toward target enemy
    return new Projectile(
      { ...this.position },
      target,
      this.damage,
      400 // Player projectile speed
    );
  }

  autoShoot(enemies: Enemy[]): Projectile | null {
    if (!this.canShoot()) {
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
    const maxLevel = 5; // Max upgrade level
    
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
    this.level = 1 + Math.floor(this.getTotalUpgrades() / 4);
    
    return true;
  }

  canUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < 5;
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

  // Computed properties based on upgrades
  get damage(): number {
    const damageLevel = this.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    return Math.floor(this.baseDamage * (1 + damageLevel * 0.4));
  }

  get speed(): number {
    const speedLevel = this.getUpgradeLevel(PlayerUpgradeType.SPEED);
    return Math.floor(this.baseSpeed * (1 + speedLevel * 0.3));
  }

  get fireRate(): number {
    const fireRateLevel = this.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    return this.baseFireRate * (1 + fireRateLevel * 0.25);
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
}