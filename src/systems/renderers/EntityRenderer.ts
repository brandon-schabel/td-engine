import { Tower, TowerType, UpgradeType } from '@/entities/Tower';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Player } from '@/entities/Player';
import { Collectible } from '@/entities/Collectible';
import { HealthPickup } from '@/entities/HealthPickup';
import { Entity, EntityType } from '@/entities/Entity';
import { Camera } from '../Camera';
import { TextureManager, type Texture } from '../TextureManager';
import type { Vector2 } from '@/utils/Vector2';
import { ENTITY_RENDER, TOWER_RENDER, RENDER_OPTIMIZATION } from '@/config/RenderingConfig';

/**
 * Interface for dependencies required by EntityRenderer
 */
export interface EntityRendererDependencies {
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  textureManager: TextureManager;
  renderSettings: {
    enableShadows: boolean;
    enableAntialiasing: boolean;
    enableGlowEffects: boolean;
    enableParticles: boolean;
    lodEnabled: boolean;
    lodBias: number;
  };
}

/**
 * EntityRenderer handles rendering of all game entities including towers, enemies,
 * projectiles, player, and collectibles. Supports Level of Detail (LOD) optimization
 * and both texture-based and primitive rendering fallbacks.
 */
export class EntityRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private textureManager: TextureManager;
  private renderSettings: EntityRendererDependencies['renderSettings'];

  constructor(deps: EntityRendererDependencies) {
    this.ctx = deps.ctx;
    this.camera = deps.camera;
    this.textureManager = deps.textureManager;
    this.renderSettings = deps.renderSettings;
  }

  /**
   * Calculate LOD level for an entity based on camera zoom level
   */
  calculateLOD(_entity: Entity): number {
    if (!this.renderSettings.lodEnabled || !RENDER_OPTIMIZATION.LOD.enabled) {
      return RENDER_OPTIMIZATION.LOD.levels.FULL;
    }

    const zoom = this.camera.getZoom();

    // Define zoom thresholds for LOD levels
    // Higher zoom = more detail, lower zoom = less detail
    const zoomThresholds = {
      high: 0.8,    // Above this zoom, use FULL detail (textures/SVGs with all effects)
      medium: 0.5,  // Between medium and high, use MEDIUM detail (textures/SVGs, no extras)
      low: 0.35     // Between low and medium, use LOW detail (simple circles)
      // Below low (0.35), entities are CULLED
    };

    // Apply LOD bias to thresholds
    const adjustedHigh = zoomThresholds.high / this.renderSettings.lodBias;
    const adjustedMedium = zoomThresholds.medium / this.renderSettings.lodBias;
    const adjustedLow = zoomThresholds.low / this.renderSettings.lodBias;

    if (zoom >= adjustedHigh) {
      return RENDER_OPTIMIZATION.LOD.levels.FULL;
    } else if (zoom >= adjustedMedium) {
      return RENDER_OPTIMIZATION.LOD.levels.MEDIUM;
    } else if (zoom >= adjustedLow) {
      return RENDER_OPTIMIZATION.LOD.levels.LOW;
    } else {
      return RENDER_OPTIMIZATION.LOD.levels.CULLED;
    }
  }

  /**
   * Helper method to convert entity position for rendering
   */
  private getScreenPosition(entity: Entity | Vector2): Vector2 {
    const worldPos = 'position' in entity ? entity.position : entity;
    return this.camera.worldToScreen(worldPos);
  }

  /**
   * Helper method to render texture at specific position and size
   */
  private renderTextureAt(texture: Texture, position: Vector2, width: number, height: number): void {
    if (typeof this.ctx.drawImage === 'function') {
      this.ctx.drawImage(
        texture.image,
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
      );
    }
  }

  /**
   * Render a tower entity with LOD support
   */
  renderTower(tower: Tower, isSelected: boolean = false): void {
    // Skip if not visible
    if (!this.camera.isVisible(tower.position, tower.radius)) return;

    // Calculate LOD level
    const lodLevel = this.calculateLOD(tower);

    // Skip rendering if culled by LOD
    if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.CULLED) {
      return;
    }

    const screenPos = this.getScreenPosition(tower);
    const zoom = this.camera.getZoom();

    // Draw selection ring if selected (only for FULL and MEDIUM LOD)
    if (isSelected && lodLevel <= RENDER_OPTIMIZATION.LOD.levels.MEDIUM) {
      this.ctx.save();

      // Pulsing effect
      const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;

      // Outer selection ring
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, (tower.radius + 10) * zoom * pulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFD700'; // Gold color
      this.ctx.lineWidth = Math.max(1, 3);
      this.ctx.stroke();

      // Inner selection ring
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, (tower.radius + 5) * zoom * pulseScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFA500'; // Orange color
      this.ctx.lineWidth = Math.max(1, 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Render tower based on LOD level
    if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.LOW) {
      // Simple rendering for LOW LOD - just a colored circle
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, tower.radius * zoom, 0, Math.PI * 2);

      // Simple color based on tower type
      const colors: Record<string, string> = {
        'BASIC': '#FFEB3B',
        'SNIPER': '#64B5F6',
        'RAPID': '#FF6B35',
        'WALL': '#9E9E9E'
      };
      this.ctx.fillStyle = colors[tower.type] || '#808080';
      this.ctx.fill();
      this.ctx.restore();
    } else {
      // Full rendering for FULL and MEDIUM LOD
      tower.render(this.ctx, screenPos, this.textureManager, isSelected, zoom);

      // Only render upgrade dots for FULL LOD
      if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.FULL) {
        this.renderTowerUpgradeDots(tower);
      }
    }

    // Render health bar (skip for walls)
    if (tower.towerType !== TowerType.WALL && tower.health < tower.maxHealth) {
      this.renderHealthBar(tower, isSelected);
    }
  }

  /**
   * Render tower upgrade dots to indicate upgrade levels
   */
  renderTowerUpgradeDots(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.radius)) return;

    const screenPos = this.getScreenPosition(tower);
    const zoom = this.camera.getZoom();
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = ['#FF4444', '#44FF44', '#4444FF']; // Red, Green, Blue
    const dotRadius = 3 * zoom; // Scale dot radius with zoom

    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType);

      if (level > 0) {
        // Position dots around the tower
        const angle = (index * 120) * (Math.PI / 180); // 120 degrees apart
        const distance = (tower.radius + 8) * zoom; // Scale distance with zoom

        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4 * zoom); // Scale spacing with zoom
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;

          this.ctx.beginPath();
          this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = colors[index];
          this.ctx.fill();

          // Dot outline
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = Math.max(0.5, 1); // Fixed line width
          this.ctx.stroke();
        }
      }
    });
  }

  /**
   * Render an enemy entity with LOD support
   */
  renderEnemy(enemy: Enemy): void {
    if (!this.camera.isVisible(enemy.position, enemy.radius)) return;

    // Calculate LOD level
    const lodLevel = this.calculateLOD(enemy);

    // Skip rendering if culled by LOD
    if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.CULLED) {
      return;
    }

    const screenPos = this.getScreenPosition(enemy);
    const zoom = this.camera.getZoom();

    if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.LOW) {
      // Simple rendering for LOW LOD - just a colored circle
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, enemy.radius * zoom, 0, Math.PI * 2);

      // Simple color based on enemy health percentage
      const healthPercent = enemy.health / enemy.maxHealth;
      if (healthPercent > 0.6) {
        this.ctx.fillStyle = '#FF4444'; // Red for healthy enemies
      } else if (healthPercent > 0.3) {
        this.ctx.fillStyle = '#FF8844'; // Orange for damaged
      } else {
        this.ctx.fillStyle = '#FFAA44'; // Yellow for nearly dead
      }
      this.ctx.fill();
      this.ctx.restore();
    } else {
      // Full rendering for FULL and MEDIUM LOD
      enemy.render(this.ctx, screenPos, this.textureManager, zoom);

      // Only render target line for FULL LOD
      if (lodLevel === RENDER_OPTIMIZATION.LOD.levels.FULL) {
        enemy.renderTargetLine(this.ctx, screenPos, this.getScreenPosition.bind(this), this.camera);
      }
    }

    // Always render health bar for enemies
    this.renderHealthBar(enemy, true);
  }

  /**
   * Render a projectile entity
   */
  renderProjectile(projectile: Projectile): void {
    if (!projectile.isAlive) {
      return;
    }
    
    // Check visibility using position directly
    const visibleBounds = this.camera.getVisibleBounds();
    const buffer = 20;
    if (projectile.position.x < visibleBounds.min.x - buffer ||
        projectile.position.x > visibleBounds.max.x + buffer ||
        projectile.position.y < visibleBounds.min.y - buffer ||
        projectile.position.y > visibleBounds.max.y + buffer) {
      return;
    }
    
    const screenPos = this.getScreenPosition(projectile.position);
    const zoom = this.camera.getZoom();

    // Enhanced rendering with high visibility
    this.ctx.save();
    
    // Draw trail first (behind projectile)
    if (projectile.trailLength > 0) {
      const trailGradient = this.ctx.createLinearGradient(
        screenPos.x - projectile.velocity.x * 0.1,
        screenPos.y - projectile.velocity.y * 0.1,
        screenPos.x,
        screenPos.y
      );
      trailGradient.addColorStop(0, `${projectile.glowColor}00`);
      trailGradient.addColorStop(1, `${projectile.glowColor}AA`);
      
      this.ctx.strokeStyle = trailGradient;
      this.ctx.lineWidth = projectile.radius * zoom * 2;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(
        screenPos.x - projectile.velocity.x * projectile.trailLength * 0.001 * zoom,
        screenPos.y - projectile.velocity.y * projectile.trailLength * 0.001 * zoom
      );
      this.ctx.lineTo(screenPos.x, screenPos.y);
      this.ctx.stroke();
    }
    
    // Draw glow effect (always, for visibility)
    this.ctx.shadowColor = projectile.glowColor;
    this.ctx.shadowBlur = 20 * zoom;
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, projectile.radius * zoom * 2, 0, Math.PI * 2);
    this.ctx.fillStyle = `${projectile.glowColor}44`;
    this.ctx.fill();
    
    // Draw main projectile
    this.ctx.shadowBlur = 10 * zoom;
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, projectile.radius * zoom, 0, Math.PI * 2);
    this.ctx.fillStyle = projectile.color;
    this.ctx.fill();
    
    // Draw bright core
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, projectile.radius * zoom * 0.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();
    
    // Draw outline for extra visibility
    this.ctx.strokeStyle = projectile.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, projectile.radius * zoom + 1, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
    
  }

  /**
   * Render the player entity
   */
  renderPlayer(player: Player): void {
    if (!this.camera.isVisible(player.position, player.radius)) return;
    const screenPos = this.getScreenPosition(player);
    const zoom = this.camera.getZoom();

    // Try to render with texture first
    const texture = this.textureManager.getTexture('player');

    if (texture && texture.loaded) {
      const scaledSize = player.radius * 2 * zoom;
      this.renderTextureAt(texture, screenPos, scaledSize, scaledSize);
    } else {
      // Enhanced primitive rendering for player
      this.ctx.save();
      this.ctx.translate(screenPos.x, screenPos.y);
      this.ctx.scale(zoom, zoom);

      // Player color based on level
      const level = player.getLevel();
      const hue = Math.min(180 + level * 20, 280); // Blue to purple progression
      const mainColor = `hsl(${hue}, 70%, 60%)`;
      const darkColor = `hsl(${hue}, 70%, 40%)`;
      const lightColor = `hsl(${hue}, 70%, 80%)`;

      // Body (torso)
      this.ctx.fillStyle = mainColor;
      this.ctx.fillRect(-player.radius * 0.6, -player.radius * 0.4, player.radius * 1.2, player.radius * 0.8);

      // Head with helmet
      this.ctx.beginPath();
      this.ctx.arc(0, -player.radius * 0.7, player.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = lightColor;
      this.ctx.fill();

      // Helmet top
      this.ctx.beginPath();
      this.ctx.arc(0, -player.radius * 0.7, player.radius * 0.4, Math.PI, 0);
      this.ctx.fillStyle = mainColor;
      this.ctx.fill();

      // Visor
      this.ctx.fillStyle = darkColor;
      this.ctx.fillRect(-player.radius * 0.3, -player.radius * 0.75, player.radius * 0.6, player.radius * 0.15);

      // Arms
      this.ctx.fillStyle = darkColor;
      this.ctx.fillRect(-player.radius * 0.9, -player.radius * 0.3, player.radius * 0.3, player.radius * 0.6);
      this.ctx.fillRect(player.radius * 0.6, -player.radius * 0.3, player.radius * 0.3, player.radius * 0.6);

      // Legs
      this.ctx.fillRect(-player.radius * 0.4, player.radius * 0.3, player.radius * 0.3, player.radius * 0.5);
      this.ctx.fillRect(player.radius * 0.1, player.radius * 0.3, player.radius * 0.3, player.radius * 0.5);

      // Armor details
      this.ctx.fillStyle = lightColor;
      this.ctx.fillRect(-player.radius * 0.2, -player.radius * 0.2, player.radius * 0.4, player.radius * 0.3);

      // Level badge on chest
      if (level > 1) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, player.radius * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = darkColor;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      // Player outline
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, player.radius + 2, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Movement indicator (if moving)
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (speed > 0) {
        // Draw movement trail with zoom scaling
        if (typeof this.ctx.beginPath === 'function') {
          this.ctx.beginPath();
        }
        if (typeof this.ctx.arc === 'function') {
          this.ctx.arc(screenPos.x, screenPos.y, (player.radius + 3) * zoom, 0, Math.PI * 2);
        }
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = zoom;
        if (typeof this.ctx.stroke === 'function') {
          this.ctx.stroke();
        }
      }
    }

    // Level indicator with zoom scaling
    const level = player.getLevel();
    if (level > 1) {
      const fontSize = Math.max(8, 10 * zoom); // Minimum readable size
      this.renderText(
        level.toString(),
        screenPos.x,
        screenPos.y + 4 * zoom,
        '#FFFFFF',
        `bold ${fontSize}px Arial`,
        'center'
      );
    }

    // Always render health bar for player
    this.renderHealthBar(player, true);
  }

  /**
   * Render a collectible entity
   */
  renderCollectible(collectible: Collectible): void {
    if (!this.camera.isVisible(collectible.position, collectible.radius)) return;

    const screenPos = this.getScreenPosition(collectible);
    collectible.render(this.ctx, screenPos);
  }

  /**
   * Render a health pickup entity
   */
  renderHealthPickup(pickup: HealthPickup): void {
    if (!pickup.isActive || !this.camera.isVisible(pickup.position, pickup.radius)) return;

    const screenPos = this.getScreenPosition(pickup);
    const visualY = pickup.getVisualY() - pickup.position.y + screenPos.y;
    const rotation = pickup.getRotation();

    // Try to render with texture first
    const texture = this.textureManager.getTexture('health_pickup');

    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }
    if (typeof this.ctx.translate === 'function') {
      this.ctx.translate(screenPos.x, visualY);
    }
    // Safety check for test environments
    if (typeof this.ctx.rotate === 'function') {
      this.ctx.rotate(rotation);
    }

    if (texture && texture.loaded) {
      if (typeof this.ctx.drawImage === 'function') {
        this.ctx.drawImage(
          texture.image,
          -pickup.radius,
          -pickup.radius,
          pickup.radius * 2,
          pickup.radius * 2
        );
      }
    } else {
      // Fallback to primitive rendering
      this.ctx.strokeStyle = '#00FF00';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';

      // Vertical line
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(0, -6);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(0, 6);
      }
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }

      // Horizontal line
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.moveTo === 'function') {
        this.ctx.moveTo(-6, 0);
      }
      if (typeof this.ctx.lineTo === 'function') {
        this.ctx.lineTo(6, 0);
      }
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }

    // Glow effect (only if enabled)
    if (this.renderSettings.enableGlowEffects) {
      this.ctx.shadowColor = '#00FF00';
      this.ctx.shadowBlur = 10;
      if (typeof this.ctx.beginPath === 'function') {
        this.ctx.beginPath();
      }
      if (typeof this.ctx.arc === 'function') {
        this.ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
      }
      this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      this.ctx.lineWidth = 1;
      if (typeof this.ctx.stroke === 'function') {
        this.ctx.stroke();
      }
    }

    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  /**
   * Canvas-based health bar rendering
   */
  private renderHealthBar(entity: Entity & { health: number; maxHealth?: number; getMaxHealth?: () => number }, alwaysShow: boolean = false): void {
    // Skip if entity is dead or has no health
    if (!entity || entity.health <= 0) return;

    // Get max health
    const maxHealth = entity.maxHealth || (entity.getMaxHealth ? entity.getMaxHealth() : 100);

    // Skip rendering if entity has full health (unless forced to show)
    const healthPercent = entity.health / maxHealth;
    // For player, always show the health bar
    if (!alwaysShow && healthPercent >= 1 && entity.entityType !== EntityType.PLAYER) return;

    // Check if entity is visible
    if (!this.camera.isVisible(entity.position, entity.radius + 30)) return;

    // Get screen position
    const screenPos = this.getScreenPosition(entity);
    const zoom = this.camera.getZoom();

    // Health bar dimensions
    const barWidth = ENTITY_RENDER.healthBar.width * zoom;
    const barHeight = ENTITY_RENDER.healthBar.height * zoom;
    const yOffset = (entity.radius + ENTITY_RENDER.healthBar.offset) * zoom;

    // Position above entity
    const barX = screenPos.x - barWidth / 2;
    const barY = screenPos.y - yOffset;

    // Background (dark outline)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Background (lighter fill for contrast)
    this.ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar color based on entity type and health percentage
    let barColor = '#4CAF50'; // Default green

    if ('entityType' in entity) {
      if (entity.entityType === EntityType.PLAYER) {
        // Player uses gradient based on health
        if (healthPercent > 0.6) {
          barColor = '#4CAF50'; // Green
        } else if (healthPercent > 0.3) {
          barColor = '#FF9800'; // Orange
        } else {
          barColor = '#F44336'; // Red
        }
      } else if (entity.entityType === EntityType.TOWER) {
        barColor = '#2196F3'; // Towers are blue
      } else if (entity.entityType === EntityType.ENEMY) {
        // Enemies use gradient based on health
        if (healthPercent > 0.5) {
          barColor = '#4CAF50'; // Green
        } else if (healthPercent > 0.25) {
          barColor = '#FF9800'; // Orange
        } else {
          barColor = '#F44336'; // Red
        }
      }
    }

    // Health fill
    this.ctx.fillStyle = barColor;
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Add a white outline for better visibility
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  }

  /**
   * Render text helper method
   */
  private renderText(
    text: string,
    x: number,
    y: number,
    color: string = '#ffffff',
    font: string = '16px Arial',
    align: CanvasTextAlign = 'left'
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    if (typeof this.ctx.fillText === 'function') {
      this.ctx.fillText(text, x, y);
    }
  }
}