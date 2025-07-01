import { Entity, EntityType } from './Entity';
import { Enemy } from './Enemy';
import { Projectile, ProjectileType } from './Projectile';
import type { Vector2 } from '@/utils/Vector2';
import { IconType } from '@/ui/icons/SvgIcons';

export enum UpgradeType {
  DAMAGE = 'DAMAGE',
  RANGE = 'RANGE',
  FIRE_RATE = 'FIRE_RATE'
}
import { GAME_MECHANICS, COLOR_CONFIG, TOWER_COSTS } from '../config/GameConfig';
import { UPGRADE_CONSTANTS } from '../config/UpgradeConfig';
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
  public cooldownTime: number;
  public currentCooldown: number = 0;
  
  // Upgrade levels
  private upgradeLevels: Map<UpgradeType, number> = new Map();
  private level: number = 1;
  
  // Repair tracking
  private damageTaken: number = 0;

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
    
    // Determine projectile type based on tower type
    let projectileType: ProjectileType;
    switch (this.towerType) {
      case TowerType.SNIPER:
        projectileType = ProjectileType.SNIPER_ROUND;
        break;
      case TowerType.RAPID:
        projectileType = ProjectileType.RAPID_PELLET;
        break;
      case TowerType.BASIC:
      default:
        projectileType = ProjectileType.BASIC_BULLET;
        break;
    }
    
    if (!ShootingUtils.canShoot(this.currentCooldown)) {
      return null;
    }

    // Start cooldown
    this.currentCooldown = ShootingUtils.startShootingCooldown(this.cooldownTime);

    // Create and return projectile with appropriate type
    return ShootingUtils.createProjectile({
      position: this.position,
      target,
      damage: this.damage,
      speed: GAME_MECHANICS.towerProjectileSpeed,
      projectileType
    });
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
    const maxLevel = UPGRADE_CONSTANTS.maxLevelTower;
    
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    this.upgradeLevels.set(upgradeType, currentLevel + 1);
    
    // Recalculate cooldown if fire rate was upgraded
    if (upgradeType === UpgradeType.FIRE_RATE) {
      this.cooldownTime = 1000 / this.fireRate;
    }
    
    // Update visual level
    this.level = 1 + Math.floor(this.getTotalUpgrades() / UPGRADE_CONSTANTS.levelCalculationDivisor.tower);
    
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
    return currentLevel < UPGRADE_CONSTANTS.maxLevelTower;
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
    
    const costMultiplier = TOWER_UPGRADES.costMultipliers?.[upgradeType] || TOWER_UPGRADES.costMultiplier;
    return calculateUpgradeCost(baseCost, costMultiplier, currentLevel);
  }

  canAffordUpgrade(upgradeType: UpgradeType, availableCurrency: number): boolean {
    const cost = this.getUpgradeCost(upgradeType);
    return cost > 0 && availableCurrency >= cost && this.canUpgrade(upgradeType);
  }

  getCooldownTime(): number {
    return this.cooldownTime;
  }

  // Helper methods for TowerUpgrade UI
  getBaseDamage(): number {
    const baseStats = TOWER_STATS[this.towerType];
    return baseStats.damage;
  }

  getBaseRange(): number {
    const baseStats = TOWER_STATS[this.towerType];
    return baseStats.range;
  }

  getBaseFireRate(): number {
    const baseStats = TOWER_STATS[this.towerType];
    return baseStats.fireRate;
  }

  get attackSpeed(): number {
    return this.fireRate;
  }

  getTotalInvestment(): number {
    // Initial tower cost
    let total = TOWER_COSTS[this.towerType];
    
    // Add upgrade costs
    for (const [upgradeType, level] of this.upgradeLevels.entries()) {
      const baseCost = TOWER_UPGRADES.baseCosts[upgradeType];
      for (let i = 0; i < level; i++) {
        total += baseCost * Math.pow(TOWER_UPGRADES.costMultiplier, i);
      }
    }
    
    return Math.floor(total);
  }

  getDisplayName(): string {
    const names: Record<TowerType, string> = {
      [TowerType.BASIC]: 'Basic Tower',
      [TowerType.SNIPER]: 'Sniper Tower',
      [TowerType.RAPID]: 'Rapid Tower',
      [TowerType.WALL]: 'Wall'
    };
    return names[this.towerType];
  }

  getAverageUpgradeLevel(): number {
    const levels = Array.from(this.upgradeLevels.values());
    if (levels.length === 0) return 0;
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  }

  getIconType(): IconType {
    const icons: Record<TowerType, IconType> = {
      [TowerType.BASIC]: IconType.BASIC_TOWER,
      [TowerType.SNIPER]: IconType.SNIPER_TOWER,
      [TowerType.RAPID]: IconType.RAPID_TOWER,
      [TowerType.WALL]: IconType.WALL
    };
    return icons[this.towerType];
  }

  // Get preview of what stats would be after upgrade
  getUpgradePreview(upgradeType: UpgradeType): {
    currentValue: number;
    newValue: number;
    increase: number;
    percentIncrease: number;
  } | null {
    const currentLevel = this.getUpgradeLevel(upgradeType);
    if (currentLevel >= TOWER_UPGRADES.maxLevel) {
      return null; // Max level reached
    }

    const bonusMultiplier = TOWER_UPGRADES.bonusMultipliers[upgradeType];
    let currentValue: number;
    let baseValue: number;

    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        baseValue = this.baseDamage;
        currentValue = this.damage;
        break;
      case UpgradeType.RANGE:
        baseValue = this.baseRange;
        currentValue = this.range;
        break;
      case UpgradeType.FIRE_RATE:
        // For fire rate, we show attacks per second
        baseValue = 1000 / this.baseFireRate;
        currentValue = 1000 / this.fireRate;
        break;
      default:
        return null;
    }

    // Calculate what the new value would be after upgrade
    const newMultiplier = 1 + bonusMultiplier * (currentLevel + 1);
    const newValue = baseValue * newMultiplier;
    const increase = newValue - currentValue;
    const percentIncrease = currentLevel === 0 ? bonusMultiplier * 100 : (increase / currentValue) * 100;

    return {
      currentValue,
      newValue,
      increase,
      percentIncrease
    };
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
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2, textureManager?: any, isSelected: boolean = false, zoom: number = 1): void {
    // Draw selection indicator first (behind the tower)
    if (isSelected) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, (this.radius + ENTITY_RENDER.selection.radiusOffset) * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR_THEME.towers.selection.indicator;
      ctx.lineWidth = ENTITY_RENDER.selection.strokeWidth;
      ctx.setLineDash(TOWER_RENDER.selection.dashPattern);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Glowing effect
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, (this.radius + ENTITY_RENDER.selection.glowRadiusOffset) * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR_THEME.towers.selection.glow;
      ctx.lineWidth = ENTITY_RENDER.lineWidths.normal;
      ctx.stroke();
      ctx.restore();
    }
    
    // Try to render with texture first
    const textureId = `tower_${this.towerType.toLowerCase()}`;
    const texture = textureManager?.getTexture(textureId);
    
    if (texture && texture.loaded && textureManager) {
      // Texture rendering with zoom
      const scaledRadius = this.radius * zoom;
      ctx.drawImage(texture.image, screenPos.x - scaledRadius, screenPos.y - scaledRadius, scaledRadius * 2, scaledRadius * 2);
    } else {
      // Enhanced primitive rendering based on tower type
      const upgradeLevel = this.getVisualLevel();
      const intensity = Math.min(1 + (upgradeLevel - 1) * UPGRADE_CONSTANTS.visualUpgradeMultiplier, UPGRADE_CONSTANTS.visualIntensityMultiplier);
      const scaledRadius = this.radius * zoom;
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      
      switch (this.towerType) {
        case TowerType.BASIC:
          // Basic tower - square base with circular turret
          const basicColor = `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          
          // Square base
          ctx.fillStyle = basicColor;
          ctx.fillRect(-scaledRadius * 0.8, -scaledRadius * 0.8, scaledRadius * 1.6, scaledRadius * 1.6);
          ctx.strokeStyle = COLOR_THEME.ui.border.default;
          ctx.lineWidth = 2;
          ctx.strokeRect(-scaledRadius * 0.8, -scaledRadius * 0.8, scaledRadius * 1.6, scaledRadius * 1.6);
          
          // Circular turret
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(40 * intensity, 70)}%)`;
          ctx.fill();
          ctx.stroke();
          
          // Cannon barrel pointing up
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(30 * intensity, 60)}%)`;
          ctx.fillRect(-scaledRadius * 0.15, -scaledRadius * 0.8, scaledRadius * 0.3, scaledRadius * 0.6);
          break;
          
        case TowerType.SNIPER:
          // Sniper tower - tall hexagonal shape with crosshair
          const sniperColor = `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          
          // Hexagonal body
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * scaledRadius * 0.9;
            const y = Math.sin(angle) * scaledRadius * 0.9;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = sniperColor;
          ctx.fill();
          ctx.strokeStyle = COLOR_THEME.ui.border.default;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Crosshair
          ctx.strokeStyle = `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(70 * intensity, 90)}%)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-scaledRadius * 0.6, 0);
          ctx.lineTo(-scaledRadius * 0.2, 0);
          ctx.moveTo(scaledRadius * 0.2, 0);
          ctx.lineTo(scaledRadius * 0.6, 0);
          ctx.moveTo(0, -scaledRadius * 0.6);
          ctx.lineTo(0, -scaledRadius * 0.2);
          ctx.moveTo(0, scaledRadius * 0.2);
          ctx.lineTo(0, scaledRadius * 0.6);
          ctx.stroke();
          
          // Center dot
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(80 * intensity, 95)}%)`;
          ctx.fill();
          break;
          
        case TowerType.RAPID:
          // Rapid tower - rotating multi-barrel design
          const rapidColor = `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
          const time = Date.now() * 0.002;
          
          // Base circle
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = rapidColor;
          ctx.fill();
          ctx.strokeStyle = COLOR_THEME.ui.border.default;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Rotating barrels
          ctx.save();
          ctx.rotate(time);
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i / 4) * Math.PI * 2);
            ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(35 * intensity, 65)}%)`;
            ctx.fillRect(-scaledRadius * 0.1, -scaledRadius * 0.9, scaledRadius * 0.2, scaledRadius * 0.7);
            ctx.strokeRect(-scaledRadius * 0.1, -scaledRadius * 0.9, scaledRadius * 0.2, scaledRadius * 0.7);
            ctx.restore();
          }
          ctx.restore();
          
          // Center hub
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(30 * intensity, 60)}%)`;
          ctx.fill();
          ctx.stroke();
          break;
          
        case TowerType.WALL:
          // Wall - stone block pattern
          ctx.fillStyle = COLOR_THEME.towers.wall;
          const blockSize = scaledRadius * 0.5;
          
          // Draw stone blocks in a grid
          for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
              const offsetX = y % 2 === 0 ? 0 : blockSize * 0.5;
              ctx.fillRect(
                x * blockSize * 0.9 + offsetX - blockSize * 0.45,
                y * blockSize * 0.9 - blockSize * 0.45,
                blockSize * 0.8,
                blockSize * 0.8
              );
            }
          }
          
          // Outline
          ctx.strokeStyle = COLOR_THEME.ui.border.default;
          ctx.lineWidth = 2;
          ctx.strokeRect(-scaledRadius, -scaledRadius, scaledRadius * 2, scaledRadius * 2);
          break;
          
        default:
          // Default circular tower
          ctx.beginPath();
          ctx.arc(0, 0, scaledRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLOR_CONFIG.health.high;
          ctx.fill();
          ctx.strokeStyle = COLOR_THEME.ui.border.default;
          ctx.lineWidth = 2;
          ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Render upgrade dots (not for walls)
    if (this.towerType !== TowerType.WALL) {
      this.renderUpgradeDots(ctx, screenPos, zoom);
    }
  }

  private renderUpgradeDots(ctx: CanvasRenderingContext2D, screenPos: Vector2, zoom: number): void {
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = COLOR_CONFIG.upgradeDots;
    const dotRadius = ENTITY_RENDER.upgradeDots.radius * zoom;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = this.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * ENTITY_RENDER.upgradeDots.angleSpacing) * (Math.PI / 180);
        const distance = (this.radius + ENTITY_RENDER.upgradeDots.distanceOffset) * zoom;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * ENTITY_RENDER.upgradeDots.spacingCompact * zoom);
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
  
  // Repair functionality
  override takeDamage(damage: number): void {
    const previousHealth = this.health;
    super.takeDamage(damage);
    const actualDamage = previousHealth - this.health;
    this.damageTaken += actualDamage;
  }
  
  getDamageTaken(): number {
    return this.damageTaken;
  }
  
  canRepair(): boolean {
    // Can't repair if dead, at full health, or if it's a wall
    return this.isAlive && this.health < this.maxHealth && this.towerType !== TowerType.WALL;
  }
  
  getRepairCost(): number {
    if (!this.canRepair()) return 0;
    
    // Calculate repair cost based on damage percentage
    const damagePercentage = (this.maxHealth - this.health) / this.maxHealth;
    const totalValue = this.getTotalValue();
    
    // Cost is proportional to damage, max 20% of tower value
    const repairCost = damagePercentage * totalValue * 0.2;
    
    return Math.floor(repairCost);
  }
  
  repair(): boolean {
    if (!this.canRepair()) return false;
    
    this.health = this.maxHealth;
    this.damageTaken = 0;
    
    // Dispatch repair event
    this.dispatchEvent(new CustomEvent('towerRepaired', { detail: { tower: this } }));
    
    return true;
  }
  
  getTotalValue(): number {
    // Base cost plus all upgrade costs
    const baseCost = TOWER_COSTS[this.towerType];
    let totalCost = baseCost;
    
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    upgradeTypes.forEach(type => {
      const level = this.getUpgradeLevel(type);
      const upgradeBaseCost = TOWER_UPGRADES.baseCosts[type];
      const costMultiplier = TOWER_UPGRADES.costMultipliers?.[type] || TOWER_UPGRADES.costMultiplier;
      
      for (let i = 1; i <= level; i++) {
        totalCost += calculateUpgradeCost(upgradeBaseCost, costMultiplier, i - 1);
      }
    });
    
    return totalCost;
  }
  
  getRepairInfo(): {
    canRepair: boolean;
    cost: number;
    healthMissing: number;
    healthPercentage: number;
    isDestroyed: boolean;
  } {
    return {
      canRepair: this.canRepair(),
      cost: this.getRepairCost(),
      healthMissing: this.maxHealth - this.health,
      healthPercentage: this.health / this.maxHealth,
      isDestroyed: !this.isAlive
    };
  }
}