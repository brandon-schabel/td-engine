import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '../utils/Vector2';
export enum UpgradeType {
  DAMAGE = 'DAMAGE',
  RANGE = 'RANGE',
  FIRE_RATE = 'FIRE_RATE'
}
import { GAME_MECHANICS, UPGRADE_CONFIG, COLOR_CONFIG, RENDER_CONFIG } from '../config/GameConfig';
import { CooldownManager } from '../utils/CooldownManager';
import { ShootingUtils, type ShootingCapable } from '../interfaces/ShootingCapable';

export enum TowerType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  RAPID = 'RAPID'
}

export interface TowerStats {
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

export class Tower extends Entity implements ShootingCapable {
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
    
    // Update cooldown using CooldownManager
    this.currentCooldown = CooldownManager.updateCooldown(this.currentCooldown, deltaTime);
  }

  findEnemiesInRange(enemies: Enemy[]): Enemy[] {
    return ShootingUtils.findEnemiesInRange(this.position, enemies, this.range);
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    const inRange = this.findEnemiesInRange(enemies);
    return ShootingUtils.findNearestEnemy(this.position, inRange);
  }

  canShoot(): boolean {
    return ShootingUtils.canShoot(this.currentCooldown);
  }

  shoot(target: Enemy): Projectile | null {
    return ShootingUtils.performShoot(this, target, GAME_MECHANICS.towerProjectileSpeed);
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
    const maxLevel = UPGRADE_CONFIG.maxLevel;
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    // Recalculate cooldown if fire rate was upgraded
    if (upgradeType === UpgradeType.FIRE_RATE) {
      this.cooldownTime = 1000 / this.fireRate;
    }
    
    // Update visual level
    this.level = 1 + Math.floor(this.getTotalUpgrades() / UPGRADE_CONFIG.levelCalculationDivisor.tower);
    
    // Update radius based on new level
    this.radius = this.getVisualRadius();
    
    return true;
  }

  canUpgrade(upgradeType: UpgradeType): boolean {
    const currentLevel = this.upgradeLevels.get(upgradeType) || 0;
    return currentLevel < UPGRADE_CONFIG.maxLevel;
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

  // Upgrade cost and management (replaces TowerUpgradeManager)
  getUpgradeCost(upgradeType: UpgradeType): number {
    const configs = {
      [UpgradeType.DAMAGE]: { baseCost: 15, costMultiplier: 1.5, maxLevel: 5 },
      [UpgradeType.RANGE]: { baseCost: 20, costMultiplier: 1.5, maxLevel: 5 },
      [UpgradeType.FIRE_RATE]: { baseCost: 25, costMultiplier: 1.5, maxLevel: 5 }
    };
    
    const config = configs[upgradeType];
    const currentLevel = this.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= config.maxLevel) {
      return 0; // Max level reached
    }
    
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
  }

  canAffordUpgrade(upgradeType: UpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(upgradeType);
    return cost > 0 && availableCurrency >= cost && this.canUpgrade(upgradeType);
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

  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any): void {
    // Try to render with texture first
    const textureId = `tower_${this.towerType.toLowerCase()}`;
    const texture = textureManager?.getTexture(textureId);
    
    if (texture && texture.loaded && textureManager) {
      // Texture rendering - would need renderTextureAt method, use fallback for now
      ctx.drawImage(texture.image, screenPos.x - this.radius, screenPos.y - this.radius, this.radius * 2, this.radius * 2);
    } else {
      // Fallback to primitive rendering
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
      
      // Different colors for different tower types with upgrade intensity
      const upgradeLevel = this.getVisualLevel();
      const intensity = Math.min(1 + (upgradeLevel - 1) * UPGRADE_CONFIG.visualUpgradeMultiplier, UPGRADE_CONFIG.visualIntensityMultiplier);
      
      switch (this.towerType) {
        case TowerType.BASIC:
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        case TowerType.SNIPER:
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        case TowerType.RAPID:
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        default:
          ctx.fillStyle = COLOR_CONFIG.health.high;
      }
      
      ctx.fill();
      
      // Tower outline - thicker for upgraded towers
      ctx.strokeStyle = upgradeLevel > 1 ? '#222222' : '#333333';
      ctx.lineWidth = upgradeLevel > 1 ? RENDER_CONFIG.upgradeOutlineThickness.upgraded : RENDER_CONFIG.upgradeOutlineThickness.normal;
      ctx.stroke();
    }
    
    // Render upgrade dots
    this.renderUpgradeDots(ctx, screenPos);
  }

  private renderUpgradeDots(ctx: CanvasRenderingContext2D, screenPos: Vector2): void {
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = COLOR_CONFIG.upgradeDots;
    const dotRadius = RENDER_CONFIG.upgradeDotRadius;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = this.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * 120) * (Math.PI / 180); // 120 degrees apart
        const distance = this.radius + 8;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4);
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = colors[index] || COLOR_CONFIG.upgradeDots[0];
          ctx.fill();
          
          // Dot outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
  }
}