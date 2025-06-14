import { Entity } from '@/entities/Entity';
import { TextureManager, type Texture } from './TextureManager';
import { Camera } from './Camera';
import type { Vector2 } from '@/utils/Vector2';

export interface RenderableEntity extends Entity {
  position: Vector2;
  radius: number;
  isAlive?: boolean;
}

export interface EntityRenderConfig {
  textureId?: string;
  fallbackColor: string;
  strokeColor?: string;
  lineWidth?: number;
  customRenderer?: (ctx: CanvasRenderingContext2D, screenPos: Vector2, entity: RenderableEntity) => void;
}

export class EntityRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private textureManager: TextureManager;

  constructor(ctx: CanvasRenderingContext2D, camera: Camera, textureManager: TextureManager) {
    this.ctx = ctx;
    this.camera = camera;
    this.textureManager = textureManager;
  }

  renderEntity(entity: RenderableEntity, config: EntityRenderConfig): void {
    // Skip if not visible
    if (!this.camera.isVisible(entity.position, entity.radius)) return;
    
    const screenPos = this.camera.worldToScreen(entity.position);
    
    // Try to render with texture first
    if (config.textureId) {
      const texture = this.textureManager.getTexture(config.textureId);
      
      if (texture && texture.loaded) {
        this.renderTextureAt(texture, screenPos, entity.radius * 2, entity.radius * 2);
        return;
      }
    }
    
    // Use custom renderer if provided
    if (config.customRenderer) {
      config.customRenderer(this.ctx, screenPos, entity);
      return;
    }
    
    // Fallback to primitive rendering
    this.renderPrimitive(screenPos, entity, config);
  }

  private renderPrimitive(screenPos: Vector2, entity: RenderableEntity, config: EntityRenderConfig): void {
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, entity.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = config.fallbackColor;
    this.ctx.fill();
    
    if (config.strokeColor) {
      this.ctx.strokeStyle = config.strokeColor;
      this.ctx.lineWidth = config.lineWidth || 2;
      this.ctx.stroke();
    }
  }

  private renderTextureAt(texture: Texture, position: Vector2, width: number, height: number): void {
    this.ctx.drawImage(
      texture.image,
      position.x - width / 2,
      position.y - height / 2,
      width,
      height
    );
  }

  renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
    // Show health bar if damaged or if alwaysShow is true
    if (!alwaysShow && entity.health >= entity.maxHealth) {
      return;
    }

    // Skip if entity is not visible
    if (!this.camera.isVisible(entity.position, entity.radius + 10)) return;

    const screenPos = this.camera.worldToScreen(entity.position);
    const barWidth = 28;
    const barHeight = 5;
    const x = screenPos.x - barWidth / 2;
    const y = screenPos.y - entity.radius - 10;
    
    // Background
    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health bar
    const healthPercentage = entity.health / entity.maxHealth;
    const healthWidth = barWidth * healthPercentage;
    
    if (healthPercentage > 0.6) {
      this.ctx.fillStyle = '#4CAF50';
    } else if (healthPercentage > 0.3) {
      this.ctx.fillStyle = '#FF9800';
    } else {
      this.ctx.fillStyle = '#F44336';
    }
    
    this.ctx.fillRect(x, y, healthWidth, barHeight);
    
    // Health bar outline
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  renderText(
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
    this.ctx.fillText(text, x, y);
  }
}