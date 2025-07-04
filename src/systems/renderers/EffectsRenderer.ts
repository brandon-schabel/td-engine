import { Camera } from '../Camera';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { Tower, TowerType } from '@/entities/Tower';
import type { Vector2 } from '@/utils/Vector2';
import { ENTITY_RENDER, TOWER_RENDER } from '@/config/RenderingConfig';
import { COLOR_THEME } from '@/config/ColorTheme';

/**
 * Interface for dependencies required by EffectsRenderer
 */
export interface EffectsRendererDependencies {
  ctx: CanvasRenderingContext2D;
  camera: Camera;
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
 * EffectsRenderer handles rendering of visual effects including:
 * - Destruction effects and particles
 * - Health bars
 * - Aimer lines
 * - Tower range indicators
 * - Tower placement ghosts
 */
export class EffectsRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private renderSettings: EffectsRendererDependencies['renderSettings'];
  
  // Render configuration constants
  private readonly dashPattern = [5, 5]; // Default dash pattern
  private readonly healthBarWidth = ENTITY_RENDER.healthBar.width;
  private readonly healthBarHeight = ENTITY_RENDER.healthBar.height;
  private readonly ghostOpacity = TOWER_RENDER.placement.ghostOpacity;

  constructor(deps: EffectsRendererDependencies) {
    this.ctx = deps.ctx;
    this.camera = deps.camera;
    this.renderSettings = deps.renderSettings;
  }

  /**
   * Render a destruction effect with particle animation
   * @param effect The destruction effect to render
   */
  renderDestructionEffect(effect: DestructionEffect): void {
    if (!effect || effect.isComplete) return;
    
    // Only render particles if enabled in settings
    if (!this.renderSettings.enableParticles) return;
    
    // Convert effect's world position to screen position
    const screenPos = this.camera.worldToScreen(effect.position);
    const zoom = this.camera.getZoom();

    // Save context state
    this.ctx.save();

    // Translate to screen position of the effect
    this.ctx.translate(screenPos.x, screenPos.y);

    // Apply zoom scaling
    this.ctx.scale(zoom, zoom);

    // Translate back by the world position so particles render relative to origin
    this.ctx.translate(-effect.position.x, -effect.position.y);

    // Render the effect (particles will be in world coordinates relative to effect position)
    effect.render(this.ctx);

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Render health bar above an entity
   * @param position World position of the entity
   * @param health Current health value
   * @param maxHealth Maximum health value
   * @param radius Entity radius for positioning
   */
  renderHealthBar(position: Vector2, health: number, maxHealth: number, radius: number): void {
    const screenPos = this.camera.worldToScreen(position);
    const healthPercentage = health / maxHealth;
    const zoom = this.camera.getZoom();

    // Position health bar above entity
    const barY = screenPos.y - (radius + ENTITY_RENDER.healthBar.offset) * zoom;
    const barX = screenPos.x - (this.healthBarWidth / 2) * zoom;

    // Background
    this.ctx.fillStyle = ENTITY_RENDER.healthBar.backgroundColor;
    this.ctx.fillRect(
      barX,
      barY,
      this.healthBarWidth * zoom,
      this.healthBarHeight * zoom
    );

    // Health bar fill
    let fillColor: string;
    if (healthPercentage > 0.6) {
      fillColor = ENTITY_RENDER.healthBar.colors.high;
    } else if (healthPercentage > 0.3) {
      fillColor = ENTITY_RENDER.healthBar.colors.medium;
    } else {
      fillColor = ENTITY_RENDER.healthBar.colors.low;
    }

    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(
      barX,
      barY,
      this.healthBarWidth * healthPercentage * zoom,
      this.healthBarHeight * zoom
    );

    // Border
    this.ctx.strokeStyle = ENTITY_RENDER.healthBar.borderColor;
    this.ctx.lineWidth = ENTITY_RENDER.healthBar.borderWidth * zoom;
    this.ctx.strokeRect(
      barX,
      barY,
      this.healthBarWidth * zoom,
      this.healthBarHeight * zoom
    );
  }

  /**
   * Render aimer line from start to end position
   * @param aimerLine Object containing start and end positions
   */
  renderAimerLine(aimerLine: { start: Vector2; end: Vector2 }): void {
    // Safety check for undefined properties
    if (!aimerLine || !aimerLine.start || !aimerLine.end) {
      return;
    }

    const screenStart = this.camera.worldToScreen(aimerLine.start);
    const screenEnd = this.camera.worldToScreen(aimerLine.end);

    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.moveTo === 'function') {
      this.ctx.moveTo(screenStart.x, screenStart.y);
    }
    if (typeof this.ctx.lineTo === 'function') {
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    // Dashed line
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash(this.dashPattern);
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }

    // Reset line dash
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]);
    }

    // Aim point
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenEnd.x, screenEnd.y, 3, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }
  }

  /**
   * Render tower range indicator
   * @param tower Tower to show range for
   */
  renderTowerRange(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.range)) return;

    const screenPos = this.camera.worldToScreen(tower.position);
    const zoom = this.camera.getZoom();

    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tower.range * zoom, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2 * zoom;
    if (typeof this.ctx.setLineDash === 'function') {
      const scaledPattern = this.dashPattern.map(dash => dash * zoom);
      this.ctx.setLineDash(scaledPattern);
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]); // Reset line dash
    }
  }

  /**
   * Render ghost preview of tower placement
   * @param towerType Type of tower being placed
   * @param position Position where tower would be placed
   * @param canPlace Whether placement is valid at this position
   */
  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    // Create a temporary tower to get its stats
    const tempTower = new Tower(towerType, position);
    const screenPos = this.camera.worldToScreen(position);

    // Save current context state
    if (typeof this.ctx.save === 'function') {
      this.ctx.save();
    }

    // Set transparency for ghost effect
    this.ctx.globalAlpha = this.ghostOpacity;

    // Render tower body
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tempTower.radius, 0, Math.PI * 2);
    }

    // Color based on placement validity
    if (canPlace) {
      // Green tint for valid placement
      switch (towerType) {
        case TowerType.BASIC:
          this.ctx.fillStyle = '#81C784'; // Light green
          break;
        case TowerType.SNIPER:
          this.ctx.fillStyle = '#64B5F6'; // Light blue
          break;
        case TowerType.RAPID:
          this.ctx.fillStyle = '#FFB74D'; // Light orange
          break;
        case TowerType.WALL:
          this.ctx.fillStyle = '#9E9E9E'; // Light gray
          break;
      }
    } else {
      // Red tint for invalid placement
      this.ctx.fillStyle = '#E57373'; // Light red
    }

    if (typeof this.ctx.fill === 'function') {
      this.ctx.fill();
    }

    // Tower outline
    this.ctx.strokeStyle = canPlace ? '#4CAF50' : '#F44336';
    this.ctx.lineWidth = 2;
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }

    // Show range preview
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
    }
    if (typeof this.ctx.arc === 'function') {
      this.ctx.arc(screenPos.x, screenPos.y, tempTower.range, 0, Math.PI * 2);
    }
    this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([3, 3]);
    }
    if (typeof this.ctx.stroke === 'function') {
      this.ctx.stroke();
    }
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]); // Reset line dash
    }

    // Restore context state
    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }
}