/**
 * UnifiedEntityRenderer - Centralized entity rendering system
 * Eliminates duplicate rendering logic across entity classes
 * 
 * Recent changes:
 * - Initial creation to consolidate entity rendering
 * - Added texture loading with fallback to primitive rendering
 * - Added specialized rendering strategies for different entity types
 * - Added visual effects support (animations, pulses, etc.)
 * - Added rendering optimizations
 */

import type { Entity } from '@/entities/Entity';
import { EntityType } from '@/entities/Entity';
import type { Tower } from '@/entities/Tower';
import { TowerType } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import { EnemyType } from '@/entities/Enemy';
import type { Player } from '@/entities/Player';
import type { Collectible } from '@/entities/Collectible';
import type { Projectile } from '@/entities/Projectile';
import type { TextureManager } from '@/systems/TextureManager';
import type { Vector2 } from '@/utils/Vector2';
import { COLOR_CONFIG } from '@/config/GameConfig';
import { TOWER_RENDER, ENTITY_RENDER, ANIMATION_CONFIG } from '@/config/RenderingConfig';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  screenPos: Vector2;
  textureManager?: TextureManager;
  isSelected?: boolean;
  animationTime?: number;
}

export class UnifiedEntityRenderer {
  private static instance: UnifiedEntityRenderer;
  
  private constructor() {}
  
  static getInstance(): UnifiedEntityRenderer {
    if (!this.instance) {
      this.instance = new UnifiedEntityRenderer();
    }
    return this.instance;
  }
  
  /**
   * Main render method that delegates to specific renderers
   */
  render(entity: Entity, context: RenderContext): void {
    switch (entity.type) {
      case EntityType.TOWER:
        this.renderTower(entity as Tower, context);
        break;
      case EntityType.ENEMY:
        this.renderEnemy(entity as Enemy, context);
        break;
      case EntityType.PLAYER:
        this.renderPlayer(entity as Player, context);
        break;
      case EntityType.PROJECTILE:
        this.renderProjectile(entity as Projectile, context);
        break;
      case EntityType.COLLECTIBLE:
      case EntityType.HEALTH_PICKUP:
      case EntityType.POWER_UP:
        this.renderCollectible(entity as Collectible, context);
        break;
    }
  }
  
  /**
   * Render tower with selection indicator and upgrade dots
   */
  private renderTower(tower: Tower, context: RenderContext): void {
    const { ctx, screenPos, textureManager, isSelected } = context;
    
    // Draw selection indicator first (behind the tower)
    if (isSelected) {
      this.renderSelectionIndicator(ctx, screenPos, tower.radius);
    }
    
    // Try texture rendering first
    const textureId = `tower_${tower.towerType.toLowerCase()}`;
    if (!this.renderTexture(ctx, screenPos, tower.radius, textureId, textureManager)) {
      // Fallback to primitive rendering
      this.renderTowerPrimitive(ctx, screenPos, tower);
    }
    
    // Render upgrade dots (not for walls)
    if (tower.towerType !== TowerType.WALL) {
      this.renderTowerUpgradeDots(ctx, screenPos, tower);
    }
  }
  
  /**
   * Render enemy with target indicator outline
   */
  private renderEnemy(enemy: Enemy, context: RenderContext): void {
    const { ctx, screenPos, textureManager } = context;
    
    // Try texture rendering first
    const textureId = `enemy_${enemy.enemyType.toLowerCase()}`;
    if (!this.renderTexture(ctx, screenPos, enemy.radius, textureId, textureManager)) {
      // Fallback to primitive rendering
      this.renderEnemyPrimitive(ctx, screenPos, enemy);
    }
    
    // Enemy outline based on target
    this.renderEnemyOutline(ctx, screenPos, enemy);
  }
  
  /**
   * Render player with aiming indicator
   */
  private renderPlayer(player: Player, context: RenderContext): void {
    const { ctx, screenPos, textureManager } = context;
    
    // Try texture rendering first
    const textureId = 'player';
    if (!this.renderTexture(ctx, screenPos, player.radius, textureId, textureManager)) {
      // Fallback to primitive rendering
      this.renderPlayerPrimitive(ctx, screenPos, player);
    }
    
    // Render health bar
    this.renderHealthBar(ctx, screenPos, player);
    
    // Render shield effect if active
    if (player.getShieldStatus && player.getShieldStatus()) {
      this.renderShieldEffect(ctx, screenPos, player.radius);
    }
  }
  
  /**
   * Render projectile
   */
  private renderProjectile(projectile: Projectile, context: RenderContext): void {
    const { ctx, screenPos, textureManager } = context;
    
    // Try texture rendering first
    const textureId = 'projectile';
    if (!this.renderTexture(ctx, screenPos, projectile.radius, textureId, textureManager)) {
      // Simple circle for projectiles
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, projectile.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFEB3B';
      ctx.fill();
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFEB3B';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  /**
   * Render collectible with animation effects
   */
  private renderCollectible(collectible: Collectible, context: RenderContext): void {
    const { ctx, screenPos, animationTime = 0 } = context;
    
    // Calculate animation effects
    const bobOffset = Math.sin(animationTime * ANIMATION_CONFIG.bobSpeed) * ANIMATION_CONFIG.bobAmount;
    const rotation = animationTime * ANIMATION_CONFIG.rotationSpeed;
    const scale = 1 + Math.sin(animationTime * ANIMATION_CONFIG.pulseSpeed) * 0.2;
    
    // Apply transformations
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y + bobOffset);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    
    // Draw collectible
    ctx.beginPath();
    ctx.arc(0, 0, collectible.radius, 0, Math.PI * 2);
    ctx.fillStyle = (collectible as any).config?.color || '#FFD700';
    ctx.fill();
    
    // Add bright outline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add inner glow for power-ups
    if (collectible.isPowerUp && collectible.isPowerUp()) {
      ctx.beginPath();
      ctx.arc(0, 0, collectible.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Helper method to render texture with fallback
   */
  private renderTexture(
    ctx: CanvasRenderingContext2D,
    screenPos: Vector2,
    radius: number,
    textureId: string,
    textureManager?: TextureManager
  ): boolean {
    if (!textureManager) return false;
    
    const texture = textureManager.getTexture(textureId);
    if (texture && texture.loaded) {
      ctx.drawImage(
        texture.image,
        screenPos.x - radius,
        screenPos.y - radius,
        radius * 2,
        radius * 2
      );
      return true;
    }
    
    return false;
  }
  
  /**
   * Render selection indicator for towers
   */
  private renderSelectionIndicator(ctx: CanvasRenderingContext2D, pos: Vector2, radius: number): void {
    ctx.save();
    
    // Main selection circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Glowing effect
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * Primitive rendering methods as fallbacks
   */
  private renderTowerPrimitive(ctx: CanvasRenderingContext2D, pos: Vector2, tower: Tower): void {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, tower.radius, 0, Math.PI * 2);
    
    // Color based on tower type and upgrade level
    const upgradeLevel = tower.getVisualLevel();
    const intensity = Math.min(1 + (upgradeLevel - 1) * 0.2, 1.5);
    
    const colors = {
      [TowerType.BASIC]: `hsl(${COLOR_CONFIG.towers.basic.hue}, ${COLOR_CONFIG.towers.basic.saturation}%, ${Math.min(50 * intensity, 80)}%)`,
      [TowerType.SNIPER]: `hsl(${COLOR_CONFIG.towers.sniper.hue}, ${COLOR_CONFIG.towers.sniper.saturation}%, ${Math.min(50 * intensity, 80)}%)`,
      [TowerType.RAPID]: `hsl(${COLOR_CONFIG.towers.rapid.hue}, ${COLOR_CONFIG.towers.rapid.saturation}%, ${Math.min(50 * intensity, 80)}%)`,
      [TowerType.WALL]: '#666666'
    };
    
    ctx.fillStyle = colors[tower.towerType] || COLOR_CONFIG.health.high;
    ctx.fill();
    
    // Tower outline
    ctx.strokeStyle = upgradeLevel > 1 ? '#222222' : '#333333';
    ctx.lineWidth = upgradeLevel > 1 ? TOWER_RENDER.upgradedOutlineWidth : TOWER_RENDER.baseOutlineWidth;
    ctx.stroke();
  }
  
  private renderEnemyPrimitive(ctx: CanvasRenderingContext2D, pos: Vector2, enemy: Enemy): void {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, enemy.radius, 0, Math.PI * 2);
    
    const colors = {
      [EnemyType.BASIC]: '#F44336',
      [EnemyType.FAST]: '#FF5722',
      [EnemyType.TANK]: '#9C27B0'
    };
    
    ctx.fillStyle = colors[enemy.enemyType] || '#F44336';
    ctx.fill();
  }
  
  private renderPlayerPrimitive(ctx: CanvasRenderingContext2D, pos: Vector2, player: Player): void {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_CONFIG.ui.currency;
    ctx.fill();
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  /**
   * Render enemy outline based on target
   */
  private renderEnemyOutline(ctx: CanvasRenderingContext2D, pos: Vector2, enemy: Enemy): void {
    const targetType = enemy.getTargetType();
    
    if (targetType === 'tower') {
      ctx.strokeStyle = '#FFD700'; // Gold outline for tower attackers
      ctx.lineWidth = 2;
    } else if (targetType === 'player') {
      ctx.strokeStyle = '#FF4444'; // Red outline for player attackers
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
    }
    
    ctx.strokeRect(
      pos.x - enemy.radius,
      pos.y - enemy.radius,
      enemy.radius * 2,
      enemy.radius * 2
    );
  }
  
  /**
   * Render health bar for entities
   */
  private renderHealthBar(ctx: CanvasRenderingContext2D, pos: Vector2, entity: Entity): void {
    const barWidth = entity.radius * 2;
    const barHeight = 4;
    const barY = pos.y - entity.radius - 8;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(pos.x - barWidth / 2, barY, barWidth, barHeight);
    
    // Health bar
    const healthPercent = entity.health / entity.maxHealth;
    const healthColor = healthPercent > 0.5 ? COLOR_CONFIG.health.high : 
                       healthPercent > 0.25 ? COLOR_CONFIG.health.medium : 
                       COLOR_CONFIG.health.low;
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(pos.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
  }
  
  /**
   * Render shield effect
   */
  private renderShieldEffect(ctx: CanvasRenderingContext2D, pos: Vector2, radius: number): void {
    ctx.save();
    
    // Pulsing shield
    const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 1.3 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Render tower upgrade dots
   */
  private renderTowerUpgradeDots(ctx: CanvasRenderingContext2D, pos: Vector2, tower: Tower): void {
    const upgradeTypes = ['DAMAGE', 'RANGE', 'FIRE_RATE'];
    const colors = ENTITY_RENDER.upgradeDots.colors;
    const dotRadius = ENTITY_RENDER.upgradeDots.radius;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = (tower as any).getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        const angle = (index * 120) * (Math.PI / 180);
        const distance = tower.radius + 8;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4);
          const x = pos.x + Math.cos(angle) * dotDistance;
          const y = pos.y + Math.sin(angle) * dotDistance;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = colors[index] || colors[0];
          ctx.fill();
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
  }
}