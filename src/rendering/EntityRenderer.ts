/**
 * Entity Renderer
 * Specialized renderer for game entities (towers, enemies, projectiles, player, pickups)
 */

import { BaseRenderer } from './BaseRenderer';
import { Tower } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Player } from '@/entities/Player';
import { HealthPickup } from '@/entities/HealthPickup';
import { PowerUp } from '@/entities/PowerUp';
import { Entity } from '@/entities/Entity';
import { UpgradeType } from '@/entities/Tower';
import { COLOR_CONFIG, UPGRADE_CONFIG } from '../config/GameConfig';
import { ENTITY_RENDER, TOWER_RENDER, ENEMY_RENDER, PLAYER_RENDER, ANIMATION_CONFIG } from '../config/RenderingConfig';
import { COLOR_THEME } from '../config/ColorTheme';
import { UI_CONSTANTS } from '../config/UIConstants';
import type { Vector2 } from '@/utils/Vector2';

export class EntityRenderer extends BaseRenderer {
  
  renderTower(tower: Tower): void {
    if (!this.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    
    // Try to render with texture first
    const textureId = `tower_${tower.towerType.toLowerCase()}`;
    const texture = this.textureManager.getTexture(textureId);
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, tower.radius * 2, tower.radius * 2);
    } else {
      this.renderTowerPrimitive(tower, screenPos);
    }
    
    // Render upgrade indicators
    this.renderTowerUpgradeDots(tower, screenPos);
  }

  private renderTowerPrimitive(tower: Tower, screenPos: Vector2): void {
    const upgradeLevel = tower.getVisualLevel();
    const intensity = Math.min(1 + (upgradeLevel - 1) * UPGRADE_CONFIG.visualUpgradeMultiplier, UPGRADE_CONFIG.visualIntensityMultiplier);
    
    let color: string;
    switch (tower.towerType) {
      case 'BASIC':
        color = `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
        break;
      case 'SNIPER':
        color = `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
        break;
      case 'RAPID':
        color = `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(50 * intensity, 80)}%)`;
        break;
      default:
        color = COLOR_CONFIG.health.high;
    }
    
    this.fillCircle(screenPos, tower.radius, color);
    
    // Tower outline - thicker for upgraded towers
    const strokeColor = upgradeLevel > 1 ? COLOR_THEME.ui.background.primary : COLOR_THEME.ui.border.default;
    const lineWidth = upgradeLevel > 1 ? TOWER_RENDER.upgradedOutlineWidth : TOWER_RENDER.baseOutlineWidth;
    this.strokeCircle(screenPos, tower.radius, strokeColor, lineWidth);
  }

  private renderTowerUpgradeDots(tower: Tower, screenPos: Vector2): void {
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = ENTITY_RENDER.upgradeDots.colors;
    const dotRadius = ENTITY_RENDER.upgradeDots.radius;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        const angle = (index * ENTITY_RENDER.upgradeDots.angleSpacing) * (Math.PI / 180);
        const distance = tower.radius + ENTITY_RENDER.upgradeDots.distanceOffset;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * ENTITY_RENDER.upgradeDots.spacingCompact);
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          this.fillCircle({ x, y }, dotRadius, colors[index] || colors[0]);
          this.strokeCircle({ x, y }, dotRadius, COLOR_THEME.towers.upgradeDots.stroke, ENTITY_RENDER.lineWidths.thin);
        }
      }
    });
  }

  renderEnemy(enemy: Enemy): void {
    if (!this.isVisible(enemy.position, enemy.radius)) return;
    
    const screenPos = this.getScreenPosition(enemy);
    
    // Try to render with texture first
    const textureId = `enemy_${enemy.enemyType.toLowerCase()}`;
    const texture = this.textureManager.getTexture(textureId);
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, enemy.radius * 2, enemy.radius * 2);
    } else {
      this.renderEnemyPrimitive(enemy, screenPos);
    }
    
    // Render targeting indicators
    this.renderEnemyTargeting(enemy, screenPos);
  }

  private renderEnemyPrimitive(enemy: Enemy, screenPos: Vector2): void {
    let color: string;
    switch (enemy.enemyType) {
      case 'BASIC':
        color = COLOR_THEME.enemies.outline;
        break;
      case 'FAST':
        color = COLOR_THEME.effects.explosion;
        break;
      case 'TANK':
        color = COLOR_THEME.ui.button.primary;
        break;
      default:
        color = COLOR_THEME.enemies.outline;
    }
    
    this.fillCircle(screenPos, enemy.radius, color);
  }

  private renderEnemyTargeting(enemy: Enemy, screenPos: Vector2): void {
    const targetType = enemy.getTargetType();
    let strokeColor: string;
    let lineWidth: number;

    if (targetType === 'tower') {
      strokeColor = COLOR_THEME.ui.currency; // Gold outline for tower attackers
      lineWidth = ENTITY_RENDER.lineWidths.normal;
    } else if (targetType === 'player') {
      strokeColor = COLOR_THEME.ui.text.danger; // Red outline for player attackers  
      lineWidth = ENTITY_RENDER.lineWidths.normal;
    } else {
      strokeColor = COLOR_THEME.ui.background.primary;
      lineWidth = ENTITY_RENDER.lineWidths.thin;
    }

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      screenPos.x - enemy.radius,
      screenPos.y - enemy.radius,
      enemy.radius * 2,
      enemy.radius * 2
    );
    
    // Draw target indicator line if enemy has a target
    const target = enemy.getTarget();
    if (target && this.isVisible(target.position, ENTITY_RENDER.visibility.minTargetDistance)) {
      const targetScreenPos = this.getScreenPosition(target);
      const lineColor = targetType === 'tower' ? this.hexToRgba(COLOR_THEME.ui.currency, 0.5) : this.hexToRgba(COLOR_THEME.ui.text.danger, 0.5);
      this.renderDashedLine(screenPos, targetScreenPos, lineColor, ENTITY_RENDER.lineWidths.thin, ENTITY_RENDER.dashPatterns.dotted);
    }
  }

  renderProjectile(projectile: Projectile): void {
    if (!this.isVisible(projectile.position, projectile.radius)) return;
    
    const screenPos = this.getScreenPosition(projectile);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('projectile');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, projectile.radius * 2, projectile.radius * 2);
    } else {
      this.fillCircle(screenPos, projectile.radius, COLOR_THEME.ui.currency);
      this.strokeCircle(screenPos, projectile.radius, COLOR_THEME.ui.warning, ENTITY_RENDER.lineWidths.thin);
    }
  }

  renderPlayer(player: Player): void {
    if (!this.isVisible(player.position, player.radius)) return;
    
    const screenPos = this.getScreenPosition(player);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('player');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, player.radius * 2, player.radius * 2);
    } else {
      this.renderPlayerPrimitive(player, screenPos);
    }
    
    // Render player-specific indicators
    this.renderPlayerIndicators(player, screenPos);
  }

  private renderPlayerPrimitive(player: Player, screenPos: Vector2): void {
    const level = player.getLevel();
    const hue = Math.min(
      PLAYER_RENDER.levelProgression.baseHue + level * PLAYER_RENDER.levelProgression.huePerLevel, 
      PLAYER_RENDER.levelProgression.maxHue
    );
    const color = `hsl(${hue}, ${PLAYER_RENDER.levelProgression.saturation}%, ${PLAYER_RENDER.levelProgression.lightness}%)`;
    
    this.fillCircle(screenPos, player.radius, color);
    this.strokeCircle(screenPos, player.radius, COLOR_THEME.ui.text.primary, ENTITY_RENDER.lineWidths.normal);
  }

  private renderPlayerIndicators(player: Player, screenPos: Vector2): void {
    // Movement indicator
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > 0) {
        this.strokeCircle(screenPos, player.radius + PLAYER_RENDER.movementIndicatorOffset, this.hexToRgba(COLOR_THEME.ui.text.primary, 0.3), ENTITY_RENDER.lineWidths.thin);
      }
    }
    
    // Level indicator
    const level = player.getLevel();
    if (level > 1) {
      this.renderText(
        level.toString(),
        screenPos.x,
        screenPos.y + PLAYER_RENDER.levelTextOffset,
        COLOR_THEME.ui.text.primary,
        UI_CONSTANTS.fonts.levelIndicator,
        'center'
      );
    }
  }

  renderHealthPickup(pickup: HealthPickup): void {
    if (!pickup.isActive || !this.isVisible(pickup.position, pickup.radius)) return;
    
    const screenPos = this.getScreenPosition(pickup);
    const visualY = pickup.getVisualY() - pickup.position.y + screenPos.y;
    const rotation = pickup.getRotation();
    
    this.saveContext();
    this.ctx.translate(screenPos.x, visualY);
    this.ctx.rotate(rotation);
    
    // Try texture first
    const texture = this.textureManager.getTexture('health_pickup');
    
    if (texture && texture.loaded) {
      this.ctx.drawImage(
        texture.image,
        -pickup.radius,
        -pickup.radius,
        pickup.radius * 2,
        pickup.radius * 2
      );
    } else {
      this.renderHealthPickupPrimitive();
    }
    
    // Glow effect
    this.renderWithGlow(() => {
      this.strokeCircle({ x: 0, y: 0 }, pickup.radius, this.hexToRgba(COLOR_THEME.player.fill, 0.3), ENTITY_RENDER.lineWidths.thin);
    }, COLOR_THEME.player.fill, ENTITY_RENDER.glowEffects.healthPickup);
    
    this.restoreContext();
  }

  private renderHealthPickupPrimitive(): void {
    this.ctx.strokeStyle = COLOR_THEME.player.fill;
    this.ctx.lineWidth = ENTITY_RENDER.lineWidths.thick;
    this.ctx.lineCap = 'round';
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(0, -ENTITY_RENDER.pickups.health.crossSize);
    this.ctx.lineTo(0, ENTITY_RENDER.pickups.health.crossSize);
    this.ctx.stroke();
    
    // Horizontal line  
    this.ctx.beginPath();
    this.ctx.moveTo(-ENTITY_RENDER.pickups.health.crossSize, 0);
    this.ctx.lineTo(ENTITY_RENDER.pickups.health.crossSize, 0);
    this.ctx.stroke();
  }

  renderPowerUp(powerUp: PowerUp): void {
    if (!powerUp.isActive || !this.isVisible(powerUp.position, powerUp.radius)) return;

    const screenPos = this.getScreenPosition(powerUp);
    const visualY = powerUp.getVisualY() - powerUp.position.y + screenPos.y;
    const rotation = powerUp.getRotation();
    const scale = powerUp.getPulseScale();
    const config = powerUp.getConfig();
    
    this.saveContext();
    this.ctx.translate(screenPos.x, visualY);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);
    
    // Try texture first
    const texture = this.textureManager.getTexture('power_up');
    
    if (texture && texture.loaded) {
      this.ctx.drawImage(
        texture.image,
        -powerUp.radius,
        -powerUp.radius,
        powerUp.radius * 2,
        powerUp.radius * 2
      );
    } else {
      this.renderPowerUpPrimitive(powerUp);
    }
    
    // Glow effect
    this.renderWithGlow(() => {
      this.strokeCircle({ x: 0, y: 0 }, powerUp.radius, this.hexToRgba(config.color, 0.3), ENTITY_RENDER.lineWidths.normal);
    }, config.color, ENTITY_RENDER.glowEffects.powerUp);
    
    this.restoreContext();
  }

  private renderPowerUpPrimitive(powerUp: PowerUp): void {
    const config = powerUp.getConfig();
    
    this.ctx.fillStyle = config.color;
    this.ctx.strokeStyle = COLOR_THEME.ui.text.primary;
    this.ctx.lineWidth = ENTITY_RENDER.lineWidths.normal;
    
    switch (powerUp.powerUpType) {
      case 'EXTRA_DAMAGE':
        this.renderSwordIcon();
        break;
      case 'FASTER_SHOOTING':
        this.renderArrowIcon();
        break;
      case 'EXTRA_CURRENCY':
        this.renderCoinIcon();
        break;
      case 'SHIELD':
        this.renderShieldIcon();
        break;
      case 'SPEED_BOOST':
        this.renderSpeedIcon();
        break;
    }
  }

  private renderSwordIcon(): void {
    const size = ENTITY_RENDER.powerUpIcons.size;
    this.ctx.beginPath();
    this.ctx.moveTo(-size, size);
    this.ctx.lineTo(size, -size);
    this.ctx.lineTo(size - 2, -size - 2);
    this.ctx.lineTo(-size - 2, size - 2);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderArrowIcon(): void {
    const size = ENTITY_RENDER.powerUpIcons.size;
    this.ctx.beginPath();
    this.ctx.moveTo(-size, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.moveTo(size / 2, -size / 2);
    this.ctx.lineTo(size, 0);
    this.ctx.lineTo(size / 2, size / 2);
    this.ctx.stroke();
  }

  private renderCoinIcon(): void {
    const size = ENTITY_RENDER.powerUpIcons.size;
    this.fillCircle({ x: 0, y: 0 }, size, this.ctx.fillStyle as string);
    this.strokeCircle({ x: 0, y: 0 }, size, this.ctx.strokeStyle as string, ENTITY_RENDER.lineWidths.normal);
    this.ctx.fillStyle = COLOR_THEME.ui.text.primary;
    this.ctx.font = UI_CONSTANTS.fonts.coinIcon;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('$', 0, ENTITY_RENDER.powerUpIcons.textOffset);
  }

  private renderShieldIcon(): void {
    const radius = ENTITY_RENDER.powerUpIcons.shieldRadius;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI);
    this.ctx.lineTo(-radius, radius);
    this.ctx.lineTo(radius, radius);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderSpeedIcon(): void {
    const size = ENTITY_RENDER.powerUpIcons.size;
    this.ctx.beginPath();
    this.ctx.moveTo(-size, -size / 2);
    this.ctx.lineTo(size, -size / 2);
    this.ctx.moveTo(-size * 0.75, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.moveTo(-size, size / 2);
    this.ctx.lineTo(size, size / 2);
    this.ctx.stroke();
  }

  renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
    if (!alwaysShow && entity.health >= entity.maxHealth) return;
    if (!this.isVisible(entity.position, entity.radius + 10)) return;

    const screenPos = this.getScreenPosition(entity);
    const barWidth = ENTITY_RENDER.healthBar.width;
    const barHeight = ENTITY_RENDER.healthBar.height;
    const x = screenPos.x - barWidth / 2;
    const y = screenPos.y - entity.radius - ENTITY_RENDER.healthBar.offset;
    
    // Background
    this.ctx.fillStyle = ENTITY_RENDER.healthBar.backgroundColor;
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health bar
    const healthPercentage = entity.health / entity.maxHealth;
    const healthWidth = barWidth * healthPercentage;
    
    let barColor: string;
    if (healthPercentage > 0.6) {
      barColor = COLOR_CONFIG.health.high;
    } else if (healthPercentage > 0.3) {
      barColor = COLOR_CONFIG.health.medium;
    } else {
      barColor = COLOR_CONFIG.health.low;
    }
    
    this.ctx.fillStyle = barColor;
    this.ctx.fillRect(x, y, healthWidth, barHeight);
    
    // Health bar outline
    this.ctx.strokeStyle = ENTITY_RENDER.healthBar.borderColor;
    this.ctx.lineWidth = ENTITY_RENDER.healthBar.borderWidth;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  renderAimerLine(aimerLine: { start: Vector2; end: Vector2 }): void {
    const screenStart = this.getScreenPosition(aimerLine.start);
    const screenEnd = this.getScreenPosition(aimerLine.end);
    
    this.renderDashedLine(screenStart, screenEnd, TOWER_RENDER.targetLine.color, TOWER_RENDER.targetLine.width, TOWER_RENDER.targetLine.dashPattern);
    
    // Aim point
    this.fillCircle(screenEnd, PLAYER_RENDER.aimer.dotSize / 2, this.hexToRgba(COLOR_THEME.ui.text.primary, 0.8));
  }

  // Batch rendering methods for performance
  renderAllTowers(towers: Tower[], showHealthBars: boolean = true): void {
    towers.forEach(tower => {
      this.renderTower(tower);
      if (showHealthBars) {
        this.renderHealthBar(tower, true);
      }
    });
  }

  renderAllEnemies(enemies: Enemy[], showHealthBars: boolean = true): void {
    enemies.forEach(enemy => {
      this.renderEnemy(enemy);
      if (showHealthBars) {
        this.renderHealthBar(enemy, true);
      }
    });
  }

  renderAllProjectiles(projectiles: Projectile[]): void {
    projectiles.forEach(projectile => {
      this.renderProjectile(projectile);
    });
  }

  renderAllPickups(healthPickups: HealthPickup[], powerUps: PowerUp[]): void {
    healthPickups.forEach(pickup => {
      this.renderHealthPickup(pickup);
    });
    
    powerUps.forEach(powerUp => {
      this.renderPowerUp(powerUp);
    });
  }
}