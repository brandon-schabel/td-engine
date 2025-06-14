/**
 * UI Renderer
 * Specialized renderer for user interface elements (HUD, overlays, menus)
 */

import { BaseRenderer } from './BaseRenderer';
import { Tower } from '@/entities/Tower';
import { UpgradeType } from '@/entities/Tower';
import { COLOR_CONFIG, UPGRADE_CONFIG } from '../config/GameConfig';

export class UIRenderer extends BaseRenderer {

  renderHUD(currency: number, lives: number, score: number, wave: number): void {
    const padding = 10;
    const fontSize = 18;
    const lineHeight = 25;
    
    this.renderText(`Currency: $${currency}`, padding, padding + fontSize, COLOR_CONFIG.ui.currency, `${fontSize}px Arial`);
    this.renderText(`Lives: ${lives}`, padding, padding + fontSize + lineHeight, COLOR_CONFIG.ui.lives, `${fontSize}px Arial`);
    this.renderText(`Score: ${score}`, padding, padding + fontSize + lineHeight * 2, COLOR_CONFIG.ui.score, `${fontSize}px Arial`);
    this.renderText(`Wave: ${wave}`, padding, padding + fontSize + lineHeight * 3, COLOR_CONFIG.ui.wave, `${fontSize}px Arial`);
  }

  renderGameOver(): void {
    this.renderOverlay('GAME OVER', COLOR_CONFIG.ui.lives);
  }

  renderVictory(): void {
    this.renderOverlay('VICTORY!', COLOR_CONFIG.ui.score);
  }

  renderPaused(): void {
    this.renderOverlay('PAUSED', COLOR_CONFIG.ui.currency, 'Press SPACE to resume');
  }

  private renderOverlay(title: string, titleColor: string, subtitle?: string): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
        '#FFFFFF',
        '20px Arial',
        'center'
      );
    }
  }

  renderTowerUpgradePanel(tower: Tower, x: number, y: number, upgradeManager: any): void {
    const panelWidth = 250;
    const panelHeight = 180;
    
    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(x, y, panelWidth, panelHeight);
    
    // Panel border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    this.renderTowerInfo(tower, x, y);
    this.renderUpgradeOptions(tower, x, y, upgradeManager);
    this.renderPanelInstructions(x, y, panelHeight);
  }

  private renderTowerInfo(tower: Tower, x: number, y: number): void {
    const padding = 10;
    let currentY = y + padding + 20;
    
    this.renderText(
      `${tower.towerType} Tower (Level ${tower.getLevel()})`,
      x + padding,
      currentY,
      '#FFFFFF',
      'bold 16px Arial'
    );
    
    currentY += 25;
    
    // Stats
    this.renderText(
      `Damage: ${tower.damage} | Range: ${tower.range} | Fire Rate: ${tower.fireRate.toFixed(1)}`,
      x + padding,
      currentY,
      '#CCCCCC',
      '12px Arial'
    );
  }

  private renderUpgradeOptions(tower: Tower, x: number, y: number, upgradeManager: any): void {
    const padding = 10;
    let currentY = y + padding + 70;
    
    const upgradeTypes = ['DAMAGE', 'RANGE', 'FIRE_RATE'];
    const upgradeNames = ['Damage', 'Range', 'Fire Rate'];
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType as any);
      const cost = upgradeManager?.getUpgradeCost(tower, upgradeType) || 0;
      const canUpgrade = tower.canUpgrade(upgradeType as any);
      
      const color = canUpgrade ? COLOR_CONFIG.health.high : '#666666';
      const text = `${upgradeNames[index]}: Lv.${level}/${UPGRADE_CONFIG.maxLevel} (${cost > 0 ? `$${cost}` : 'MAX'})`;
      
      this.renderText(
        text,
        x + padding,
        currentY,
        color,
        '14px Arial'
      );
      
      currentY += 20;
    });
  }

  private renderPanelInstructions(x: number, y: number, panelHeight: number): void {
    const padding = 10;
    this.renderText(
      'Click tower upgrades in UI panel',
      x + padding,
      y + panelHeight - 15,
      '#888888',
      '12px Arial'
    );
  }

  renderNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', duration?: number): void {
    const colors = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      success: '#4CAF50'
    };

    const x = this.canvas.width - 320;
    const y = 50;
    const width = 300;
    const height = 60;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = colors[type];
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Icon
    const iconX = x + 15;
    const iconY = y + height / 2;
    this.fillCircle({ x: iconX, y: iconY }, 8, colors[type]);

    // Message
    this.renderText(
      message,
      x + 35,
      y + height / 2 + 4,
      '#FFFFFF',
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
    color: string = '#4CAF50'
  ): void {
    // Background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(x, y, width, height);

    // Progress fill
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width * Math.max(0, Math.min(1, progress)), height);

    // Border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Label
    if (label) {
      this.renderText(
        label,
        x + width / 2,
        y + height / 2 + 4,
        '#FFFFFF',
        '12px Arial',
        'center'
      );
    }
  }

  renderTooltip(text: string, x: number, y: number, maxWidth: number = 200): void {
    const padding = 8;
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(adjustedX, adjustedY, tooltipWidth, tooltipHeight);

    // Border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(adjustedX, adjustedY, tooltipWidth, tooltipHeight);

    // Text
    lines.forEach((line, index) => {
      this.renderText(
        line,
        adjustedX + padding,
        adjustedY + padding + (index + 1) * lineHeight,
        '#FFFFFF',
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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, width, height);

    // Border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    const scaleX = width / worldWidth;
    const scaleY = height / worldHeight;

    // Render towers
    this.ctx.fillStyle = '#4CAF50';
    towers.forEach(tower => {
      const miniX = x + tower.x * scaleX;
      const miniY = y + tower.y * scaleY;
      this.ctx.fillRect(miniX - 1, miniY - 1, 2, 2);
    });

    // Render enemies
    this.ctx.fillStyle = '#F44336';
    enemies.forEach(enemy => {
      const miniX = x + enemy.x * scaleX;
      const miniY = y + enemy.y * scaleY;
      this.ctx.fillRect(miniX - 1, miniY - 1, 2, 2);
    });

    // Render player
    this.ctx.fillStyle = '#2196F3';
    const playerMiniX = x + playerPosition.x * scaleX;
    const playerMiniY = y + playerPosition.y * scaleY;
    this.fillCircle({ x: playerMiniX, y: playerMiniY }, 2, '#2196F3');
  }

  renderResourceCounter(
    x: number,
    y: number,
    icon: string,
    value: number,
    color: string = '#FFFFFF'
  ): void {
    // Icon background
    this.fillCircle({ x: x + 15, y: y + 15 }, 12, 'rgba(0, 0, 0, 0.7)');
    
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
    
    const color = fps > 45 ? '#4CAF50' : fps > 30 ? '#FF9800' : '#F44336';
    
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