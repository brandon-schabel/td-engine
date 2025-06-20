/**
 * UI Renderer
 * Specialized renderer for user interface elements (HUD, overlays, menus)
 */

import { BaseRenderer } from './BaseRenderer';
import { HUD_CONFIG } from '../config/UIConfig';
import { COLOR_THEME } from '../config/ColorTheme';
import { UI_CONSTANTS } from '../config/UIConstants';
import { ENTITY_RENDER, UI_RENDER } from '../config/RenderingConfig';

export class UIRenderer extends BaseRenderer {

  renderHUD(currency: number, lives: number, score: number, wave: number): void {
    const padding = UI_CONSTANTS.hud.padding;
    const fontSize = HUD_CONFIG.fontSize;
    const lineHeight = HUD_CONFIG.lineHeight;
    
    this.renderText(`Currency: $${currency}`, padding, padding + fontSize, COLOR_THEME.ui.currency, `${fontSize}px Arial`);
    this.renderText(`Lives: ${lives}`, padding, padding + fontSize + lineHeight, COLOR_THEME.ui.text.danger, `${fontSize}px Arial`);
    this.renderText(`Score: ${score}`, padding, padding + fontSize + lineHeight * 2, COLOR_THEME.ui.score, `${fontSize}px Arial`);
    this.renderText(`Wave: ${wave}`, padding, padding + fontSize + lineHeight * 3, COLOR_THEME.ui.wave, `${fontSize}px Arial`);
  }

  renderGameOver(): void {
    this.renderOverlay('GAME OVER', COLOR_THEME.ui.text.danger);
  }

  renderVictory(): void {
    this.renderOverlay('VICTORY!', COLOR_THEME.ui.text.success);
  }

  renderPaused(): void {
    this.renderOverlay('PAUSED', COLOR_THEME.ui.currency, 'Press SPACE to resume');
  }

  private renderOverlay(title: string, titleColor: string, subtitle?: string): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = COLOR_THEME.ui.background.overlay;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title text
    this.renderText(
      title,
      this.canvas.width / 2,
      this.canvas.height / 2,
      titleColor,
      '48px Arial',
      'center'
    );

    // Subtitle if provided
    if (subtitle) {
      this.renderText(
        subtitle,
        this.canvas.width / 2,
        this.canvas.height / 2 + 60,
        COLOR_THEME.ui.text.primary,
        '20px Arial',
        'center'
      );
    }
  }

  // DEPRECATED: Tower upgrade panel is now handled by the dialog system
  // renderTowerUpgradePanel(tower: Tower, x: number, y: number, upgradeManager: any): void {
  //   // Old implementation removed - see TowerInfoDialog for new UI
  // }

  // DEPRECATED: Part of old tower upgrade panel system
  // private renderTowerInfo(tower: Tower, x: number, y: number): void {
  //   // Old implementation removed - see TowerInfoDialog for new UI
  // }

  // DEPRECATED: Part of old tower upgrade panel system
  // private renderUpgradeOptions(tower: Tower, x: number, y: number, upgradeManager: any): void {
  //   // Old implementation removed - see TowerInfoDialog for new UI
  // }

  // DEPRECATED: Part of old tower upgrade panel system
  // private renderPanelInstructions(x: number, y: number, panelHeight: number): void {
  //   // Old implementation removed - see TowerInfoDialog for new UI
  // }

  renderNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    const colors = {
      info: COLOR_THEME.ui.button.primary,
      warning: COLOR_THEME.ui.text.warning,
      error: COLOR_THEME.ui.text.danger,
      success: COLOR_THEME.ui.text.success
    };

    const x = this.canvas.width - UI_RENDER.notification.width - UI_RENDER.notification.x;
    const y = UI_RENDER.notification.y;
    const width = UI_RENDER.notification.width;
    const height = UI_RENDER.notification.height;

    // Background
    this.ctx.fillStyle = COLOR_THEME.ui.background.overlay;
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = colors[type];
    this.ctx.lineWidth = UI_CONSTANTS.floatingUI.borderWidth;
    this.ctx.strokeRect(x, y, width, height);

    // Icon
    const iconX = x + UI_RENDER.notification.padding;
    const iconY = y + height / 2;
    this.fillCircle({ x: iconX, y: iconY }, UI_RENDER.notification.iconRadius, colors[type]);

    // Message
    this.renderText(
      message,
      x + 35,
      y + height / 2 + 4,
      COLOR_THEME.ui.text.primary,
      '14px Arial'
    );
  }

  renderProgressBar(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number, // 0 to 1
    label?: string,
    color: string = COLOR_THEME.ui.text.success
  ): void {
    // Background
    this.ctx.fillStyle = COLOR_THEME.ui.border.default;
    this.ctx.fillRect(x, y, width, height);

    // Progress fill
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width * Math.max(0, Math.min(1, progress)), height);

    // Border
    this.ctx.strokeStyle = COLOR_THEME.ui.border.default;
    this.ctx.lineWidth = ENTITY_RENDER.lineWidths.thin;
    this.ctx.strokeRect(x, y, width, height);

    // Label
    if (label) {
      this.renderText(
        label,
        x + width / 2,
        y + height / 2 + 4,
        COLOR_THEME.ui.text.primary,
        '12px Arial',
        'center'
      );
    }
  }

  renderTooltip(text: string, x: number, y: number, maxWidth: number = 200): void {
    const padding = UI_CONSTANTS.floatingUI.padding;
    const fontSize = 12;
    const lineHeight = 16;
    
    // Measure text
    this.ctx.font = `${fontSize}px Arial`;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    const tooltipWidth = Math.min(maxWidth + padding * 2, 
      Math.max(...lines.map(line => this.ctx.measureText(line).width)) + padding * 2);
    const tooltipHeight = lines.length * lineHeight + padding * 2;

    // Adjust position to stay on screen
    const adjustedX = Math.min(x, this.canvas.width - tooltipWidth);
    const adjustedY = Math.max(y - tooltipHeight - 10, 10);

    // Background
    this.ctx.fillStyle = COLOR_THEME.ui.background.overlay;
    this.ctx.fillRect(adjustedX, adjustedY, tooltipWidth, tooltipHeight);

    // Border
    this.ctx.strokeStyle = COLOR_THEME.ui.border.default;
    this.ctx.lineWidth = ENTITY_RENDER.lineWidths.thin;
    this.ctx.strokeRect(adjustedX, adjustedY, tooltipWidth, tooltipHeight);

    // Text
    lines.forEach((line, index) => {
      this.renderText(
        line,
        adjustedX + padding,
        adjustedY + padding + (index + 1) * lineHeight,
        COLOR_THEME.ui.text.primary,
        `${fontSize}px Arial`
      );
    });
  }

  renderMiniMap(
    x: number, 
    y: number, 
    width: number, 
    height: number,
    playerPosition: { x: number; y: number },
    enemies: Array<{ x: number; y: number }>,
    towers: Array<{ x: number; y: number }>,
    worldWidth: number,
    worldHeight: number
  ): void {
    // Background
    this.ctx.fillStyle = COLOR_THEME.ui.background.overlay;
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = COLOR_THEME.ui.border.default;
    this.ctx.lineWidth = ENTITY_RENDER.lineWidths.thin;
    this.ctx.strokeRect(x, y, width, height);

    const scaleX = width / worldWidth;
    const scaleY = height / worldHeight;

    // Render towers
    this.ctx.fillStyle = COLOR_THEME.ui.text.success;
    towers.forEach(tower => {
      const miniX = x + tower.x * scaleX;
      const miniY = y + tower.y * scaleY;
      this.ctx.fillRect(miniX - 1, miniY - 1, 2, 2);
    });

    // Render enemies
    this.ctx.fillStyle = COLOR_THEME.ui.text.danger;
    enemies.forEach(enemy => {
      const miniX = x + enemy.x * scaleX;
      const miniY = y + enemy.y * scaleY;
      this.ctx.fillRect(miniX - 1, miniY - 1, 2, 2);
    });

    // Render player
    this.ctx.fillStyle = COLOR_THEME.ui.button.primary;
    const playerMiniX = x + playerPosition.x * scaleX;
    const playerMiniY = y + playerPosition.y * scaleY;
    this.fillCircle({ x: playerMiniX, y: playerMiniY }, 2, COLOR_THEME.ui.button.primary);
  }

  renderResourceCounter(
    x: number,
    y: number,
    icon: string,
    value: number,
    color: string = COLOR_THEME.ui.text.primary
  ): void {
    // Icon background
    this.fillCircle({ x: x + 15, y: y + 15 }, 12, COLOR_THEME.ui.background.overlay);
    
    // Icon
    this.renderText(icon, x + 15, y + 20, color, 'bold 16px Arial', 'center');
    
    // Value
    this.renderText(
      value.toString(),
      x + 35,
      y + 20,
      color,
      'bold 14px Arial'
    );
  }

  renderFPS(fps: number): void {
    const x = this.canvas.width - 80;
    const y = 30;
    
    const color = fps > UI_RENDER.fps.thresholds.good ? COLOR_THEME.ui.text.success : 
                   fps > UI_RENDER.fps.thresholds.warning ? COLOR_THEME.ui.text.warning : 
                   COLOR_THEME.ui.text.danger;
    
    this.renderText(
      `FPS: ${Math.round(fps)}`,
      x,
      y,
      color,
      '12px monospace'
    );
  }

  // Clear the entire canvas
  clear(backgroundColor?: string): void {
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}