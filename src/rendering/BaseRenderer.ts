/**
 * Base Renderer
 * Shared functionality for all specialized renderers
 */

import { Camera } from '@/systems/Camera';
import { TextureManager } from '@/systems/TextureManager';
import type { Vector2 } from '@/utils/Vector2';

export abstract class BaseRenderer {
  protected ctx: CanvasRenderingContext2D;
  protected canvas: HTMLCanvasElement;
  protected camera: Camera;
  protected textureManager: TextureManager;

  constructor(
    canvas: HTMLCanvasElement, 
    camera: Camera, 
    textureManager: TextureManager
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.textureManager = textureManager;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
  }

  // Shared utility methods
  protected getScreenPosition(position: Vector2): Vector2 {
    return this.camera.worldToScreen(position);
  }

  protected isVisible(position: Vector2, radius: number): boolean {
    return this.camera.isVisible(position, radius);
  }

  protected renderText(
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

  protected renderTextureAt(
    texture: any, 
    position: Vector2, 
    width: number, 
    height: number
  ): void {
    this.ctx.drawImage(
      texture.image,
      position.x - width / 2,
      position.y - height / 2,
      width,
      height
    );
  }

  protected beginCircle(center: Vector2, radius: number): void {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  }

  protected fillCircle(center: Vector2, radius: number, color: string): void {
    this.beginCircle(center, radius);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  protected strokeCircle(center: Vector2, radius: number, color: string, lineWidth: number = 1): void {
    this.beginCircle(center, radius);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  protected saveContext(): void {
    this.ctx.save();
  }

  protected restoreContext(): void {
    this.ctx.restore();
  }

  // Convert hex color to rgba string
  protected hexToRgba(hex: string, alpha: number = 1): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(255, 255, 255, ${alpha})`;
  }

  // Common rendering patterns
  protected renderWithGlow(
    renderFn: () => void, 
    glowColor: string, 
    glowSize: number = 10
  ): void {
    this.saveContext();
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = glowSize;
    renderFn();
    this.restoreContext();
  }

  protected renderDashedLine(
    start: Vector2, 
    end: Vector2, 
    color: string, 
    lineWidth: number = 1,
    dashPattern: number[] = [5, 5]
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash(dashPattern);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset
  }
}