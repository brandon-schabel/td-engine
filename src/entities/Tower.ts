import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import type { Vector2 } from '@/utils/Vector2';
export enum UpgradeType {
  DAMAGE = 'DAMAGE',
  RANGE = 'RANGE',
  FIRE_RATE = 'FIRE_RATE'
}
import { GAME_MECHANICS, UPGRADE_CONFIG, COLOR_CONFIG, TOWER_COSTS } from '../config/GameConfig';
import { TOWER_STATS, TOWER_UPGRADES, TOWER_VISUALS } from '../config/TowerConfig';
import { ENTITY_RENDER, TOWER_RENDER } from '../config/RenderingConfig';
import { COLOR_THEME } from '../config/ColorTheme';
import { GAMEPLAY_CONSTANTS } from '../config/GameplayConstants';
import { CooldownManager } from '@/utils/CooldownManager';
import { ShootingUtils, type ShootingCapable } from '../interfaces/ShootingCapable';
import { calculateUpgradeCost, calculateSellValue } from '@/utils/MathUtils';

export enum TowerType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  RAPID = 'RAPID',
  WALL = 'WALL'
}

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number; // Shots per second
  health: number;
  radius: number;
}

// Tower stats are now imported from TowerConfig

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
    // Walls don't target enemies
    if (this.towerType === TowerType.WALL) {
      return null;
    }
    const inRange = this.findEnemiesInRange(enemies);
    return ShootingUtils.findNearestEnemy(this.position, inRange);
  }

  canShoot(): boolean {
    // Walls can't shoot
    if (this.towerType === TowerType.WALL) {
      return false;
    }
    return ShootingUtils.canShoot(this.currentCooldown);
  }

  shoot(target: Enemy): Projectile | null {
    // Walls can't shoot
    if (this.towerType === TowerType.WALL) {
      return null;
    }
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
    // Walls cannot be upgraded
    if (this.towerType === TowerType.WALL) {
      return false;
    }
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

  getMaxUpgradeLevel(): number {
    return TOWER_UPGRADES.maxLevel;
  }

  // Upgrade cost and management (replaces TowerUpgradeManager)
  getUpgradeCost(upgradeType: UpgradeType): number {
    const baseCost = TOWER_UPGRADES.baseCosts[upgradeType];
    const currentLevel = this.getUpgradeLevel(upgradeType);
    
    if (currentLevel >= TOWER_UPGRADES.maxLevel) {
      return 0; // Max level reached
    }
    
    return calculateUpgradeCost(baseCost, TOWER_UPGRADES.costMultiplier, currentLevel);
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
    return Math.floor(this.baseDamage * (1 + damageLevel * TOWER_UPGRADES.bonusMultipliers.DAMAGE));
  }

  get range(): number {
    const rangeLevel = this.getUpgradeLevel(UpgradeType.RANGE);
    return Math.floor(this.baseRange * (1 + rangeLevel * TOWER_UPGRADES.bonusMultipliers.RANGE));
  }

  get fireRate(): number {
    const fireRateLevel = this.getUpgradeLevel(UpgradeType.FIRE_RATE);
    return this.baseFireRate * (1 + fireRateLevel * TOWER_UPGRADES.bonusMultipliers.FIRE_RATE);
  }

  getVisualRadius(): number {
    // Increase visual size slightly with upgrades
    const baseRadius = TOWER_STATS[this.towerType].radius;
    const sizeIncrease = Math.min(this.level - 1, 3) * TOWER_VISUALS.sizeIncreasePerLevel; // Max 6 pixel increase
    return baseRadius + sizeIncrease;
  }

  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any, isSelected: boolean = false): void {
    // Draw selection indicator first (behind the tower)
    if (isSelected) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, this.radius + ENTITY_RENDER.selection.radiusOffset, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR_THEME.towers.selection.indicator;
      ctx.lineWidth = ENTITY_RENDER.selection.strokeWidth;
      ctx.setLineDash(TOWER_RENDER.selection.dashPattern);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Glowing effect
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, this.radius + ENTITY_RENDER.selection.glowRadiusOffset, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR_THEME.towers.selection.glow;
      ctx.lineWidth = ENTITY_RENDER.lineWidths.normal;
      ctx.stroke();
      ctx.restore();
    }
    
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
        case TowerType.WALL:
          // Walls are gray/stone colored
          ctx.fillStyle = COLOR_THEME.towers.wall;
          break;
        default:
          ctx.fillStyle = COLOR_CONFIG.health.high;
      }
      
      ctx.fill();
      
      // Tower outline - thicker for upgraded towers
      ctx.strokeStyle = upgradeLevel > 1 ? COLOR_THEME.towers.outline.upgraded : COLOR_THEME.towers.outline.base;
      ctx.lineWidth = upgradeLevel > 1 ? TOWER_RENDER.upgradedOutlineWidth : TOWER_RENDER.baseOutlineWidth;
      ctx.stroke();
    }
    
    // Render upgrade dots (not for walls)
    if (this.towerType !== TowerType.WALL) {
      this.renderUpgradeDots(ctx, screenPos);
    }
  }

  private renderUpgradeDots(ctx: CanvasRenderingContext2D, screenPos: Vector2): void {
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = COLOR_CONFIG.upgradeDots;
    const dotRadius = ENTITY_RENDER.upgradeDots.radius;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = this.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * ENTITY_RENDER.upgradeDots.angleSpacing) * (Math.PI / 180);
        const distance = this.radius + ENTITY_RENDER.upgradeDots.distanceOffset;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * ENTITY_RENDER.upgradeDots.spacingCompact);
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = colors[index] || COLOR_CONFIG.upgradeDots[0];
          ctx.fill();
          
          // Dot outline
          ctx.strokeStyle = COLOR_THEME.towers.upgradeDots.stroke;
          ctx.lineWidth = ENTITY_RENDER.lineWidths.thin;
          ctx.stroke();
        }
      }
    });
  }
  
  getSellValue(): number {
    // Base cost of the tower
    const baseCost = TOWER_COSTS[this.towerType];
    
    // Calculate total upgrade cost spent
    let upgradeCostSpent = 0;
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    
    upgradeTypes.forEach(type => {
      const level = this.getUpgradeLevel(type);
      const baseCost = TOWER_UPGRADES.baseCosts[type];
      
      // Sum up costs for each upgrade level
      for (let i = 1; i <= level; i++) {
        upgradeCostSpent += calculateUpgradeCost(baseCost, TOWER_UPGRADES.costMultiplier, i - 1);
      }
    });
    
    // Sell value is based on economy sell refund configuration
    return calculateSellValue(baseCost, upgradeCostSpent, 1 - GAMEPLAY_CONSTANTS.economy.sellRefund);
  }
}