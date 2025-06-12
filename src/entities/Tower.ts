import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '../utils/Vector2';
import { UpgradeType } from '../systems/TowerUpgradeManager';

export enum TowerType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  RAPID = 'RAPID'
}

interface TowerStats {
  damage: number;
  range: number;
  fireRate: number; // Shots per second
  health: number;
  radius: number;
}

const TOWER_STATS: Record<TowerType, TowerStats> = {
  [TowerType.BASIC]: {
    damage: 10,
    range: 100,
    fireRate: 1,
    health: 100,
    radius: 15
  },
  [TowerType.SNIPER]: {
    damage: 50,
    range: 200,
    fireRate: 0.5,
    health: 80,
    radius: 15
  },
  [TowerType.RAPID]: {
    damage: 5,
    range: 80,
    fireRate: 4,
    health: 60,
    radius: 15
  }
};

export class Tower extends Entity {
  public readonly towerType: TowerType;
  private baseDamage: number;
  private baseRange: number;
  private baseFireRate: number;
  private cooldownTime: number;
  private currentCooldown: number = 0;
  
  // Upgrade levels
  private upgradeLevels: Map<UpgradeType, number> = new Map();
  private level: number = 1;

  constructor(towerType: TowerType, position: Vector2) {
    const stats = TOWER_STATS[towerType];
    super(EntityType.TOWER, position, stats.health, stats.radius);
    
    this.towerType = towerType;
    this.baseDamage = stats.damage;
    this.baseRange = stats.range;
    this.baseFireRate = stats.fireRate;
    this.cooldownTime = 1000 / stats.fireRate; // Convert to milliseconds
    
    // Initialize upgrade levels
    this.upgradeLevels.set(UpgradeType.DAMAGE, 0);
    this.upgradeLevels.set(UpgradeType.RANGE, 0);
    this.upgradeLevels.set(UpgradeType.FIRE_RATE, 0);
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update cooldown
    if (this.currentCooldown > 0) {
      this.currentCooldown = Math.max(0, this.currentCooldown - deltaTime);
    }
  }

  findEnemiesInRange(enemies: Enemy[]): Enemy[] {
    return enemies.filter(enemy => 
      enemy.isAlive && this.isInRange(enemy, this.range)
    );
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    const inRange = this.findEnemiesInRange(enemies);
    
    if (inRange.length === 0) {
      return null;
    }

    // Target the closest enemy
    return inRange.reduce((closest, enemy) => {
      const distToEnemy = this.distanceTo(enemy);
      const distToClosest = this.distanceTo(closest);
      return distToEnemy < distToClosest ? enemy : closest;
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

    // Create projectile
    return new Projectile(
      { ...this.position },
      target,
      this.damage,
      300 // Projectile speed
    );
  }

  updateAndShoot(enemies: Enemy[], deltaTime: number): Projectile[] {
    this.update(deltaTime);
    
    const projectiles: Projectile[] = [];
    
    if (this.canShoot()) {
      const target = this.findTarget(enemies);
      if (target) {
        const projectile = this.shoot(target);
        if (projectile) {
          projectiles.push(projectile);
        }
      }
    }
    
    return projectiles;
  }

  // Upgrade system methods
  upgrade(upgradeType: UpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    const maxLevel = 5; // Max upgrade level
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    // Recalculate cooldown if fire rate was upgraded
    if (upgradeType === UpgradeType.FIRE_RATE) {
      this.cooldownTime = 1000 / this.fireRate;
    }
    
    // Update visual level
    this.level = 1 + Math.floor(this.getTotalUpgrades() / 3);
    
    // Update radius based on new level
    this.radius = this.getVisualRadius();
    
    return true;
  }

  canUpgrade(upgradeType: UpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < 5;
  }

  getUpgradeLevel(upgradeType: UpgradeType): number {
    return this.upgradeLevels.get(upgradeType) || 0;
  }

  getLevel(): number {
    return this.level;
  }

  getVisualLevel(): number {
    return this.level;
  }

  getTotalUpgrades(): number {
    let total = 0;
    this.upgradeLevels.forEach(level => total += level);
    return total;
  }

  getCooldownTime(): number {
    return this.cooldownTime;
  }

  // Computed properties based on upgrades
  get damage(): number {
    const damageLevel = this.getUpgradeLevel(UpgradeType.DAMAGE);
    return Math.floor(this.baseDamage * (1 + damageLevel * 0.3));
  }

  get range(): number {
    const rangeLevel = this.getUpgradeLevel(UpgradeType.RANGE);
    return Math.floor(this.baseRange * (1 + rangeLevel * 0.25));
  }

  get fireRate(): number {
    const fireRateLevel = this.getUpgradeLevel(UpgradeType.FIRE_RATE);
    return this.baseFireRate * (1 + fireRateLevel * 0.2);
  }

  getVisualRadius(): number {
    // Increase visual size slightly with upgrades
    const baseRadius = TOWER_STATS[this.towerType].radius;
    const sizeIncrease = Math.min(this.level - 1, 3) * 2; // Max 6 pixel increase
    return baseRadius + sizeIncrease;
  }
}