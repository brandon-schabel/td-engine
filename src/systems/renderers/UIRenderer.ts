import { COLOR_CONFIG } from '@/config/GameConfig';

/**
 * Interface for dependencies required by UIRenderer
 */
export interface UIRendererDependencies {
  ctx: CanvasRenderingContext2D;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * UIRenderer handles rendering of UI overlay elements including:
 * - HUD elements (currency, lives, score, wave)
 * - Game state overlays (game over, victory, pause)
 * - Text rendering utilities
 * 
 * Note: Most UI is now handled by React components. This renderer
 * is primarily for canvas-based overlays and text rendering.
 */
export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private viewportWidth: number;
  private viewportHeight: number;

  constructor(deps: UIRendererDependencies) {
    this.ctx = deps.ctx;
    this.viewportWidth = deps.viewportWidth;
    this.viewportHeight = deps.viewportHeight;
  }

  /**
   * Update viewport dimensions when canvas is resized
   * @param width New viewport width
   * @param height New viewport height
   */
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Render text utility
   * @param text Text to render
   * @param x X position
   * @param y Y position
   * @param color Text color
   * @param font Font string
   * @param align Text alignment
   */
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
    if (typeof this.ctx.fillText === 'function') {
      this.ctx.fillText(text, x, y);
    }
  }

  /**
   * Render UI HUD elements
   * Note: This is deprecated in favor of React components
   * @param currency Player currency
   * @param lives Player lives
   * @param score Current score
   * @param wave Current wave number
   */
  renderUI(currency: number, lives: number, score: number, wave: number): void {
    // This method is kept for backward compatibility but is no longer used
    // UI is now handled by React components in src/ui/react/components/game/
  }

  /**
   * Render game over overlay
   */
  renderGameOver(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    // Game Over text
    this.renderText(
      'GAME OVER',
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      COLOR_CONFIG.ui.lives,
      '48px Arial',
      'center'
    );
  }

  /**
   * Render victory overlay
   */
  renderVictory(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    // Victory text
    this.renderText(
      'VICTORY!',
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      COLOR_CONFIG.ui.score,
      '48px Arial',
      'center'
    );
  }

  /**
   * Render pause overlay
   */
  renderPaused(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    // Paused text
    this.renderText(
      'PAUSED',
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      COLOR_CONFIG.ui.currency,
      '48px Arial',
      'center'
    );

    // Instructions
    this.renderText(
      'Press SPACE to resume',
      this.viewportWidth / 2,
      this.viewportHeight / 2 + 60,
      '#FFFFFF',
      '20px Arial',
      'center'
    );

    this.renderText(
      'Press M for Main Menu',
      this.viewportWidth / 2,
      this.viewportHeight / 2 + 90,
      '#CCCCCC',
      '16px Arial',
      'center'
    );
  }

  /**
   * Render centered message overlay
   * @param message Message to display
   * @param subMessage Optional sub-message
   * @param overlayAlpha Alpha value for overlay (0-1)
   */
  renderMessage(message: string, subMessage?: string, overlayAlpha: number = 0.7): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    // Main message
    this.renderText(
      message,
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      '#FFFFFF',
      '36px Arial',
      'center'
    );

    // Sub-message if provided
    if (subMessage) {
      this.renderText(
        subMessage,
        this.viewportWidth / 2,
        this.viewportHeight / 2 + 50,
        '#CCCCCC',
        '18px Arial',
        'center'
      );
    }
  }

  /**
   * Render countdown timer
   * @param seconds Seconds remaining
   */
  renderCountdown(seconds: number): void {
    const displaySeconds = Math.ceil(seconds);
    
    // Large countdown number
    this.renderText(
      displaySeconds.toString(),
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      '#FFFFFF',
      '72px Arial',
      'center'
    );

    // "Next wave in..." text
    this.renderText(
      'Next wave in...',
      this.viewportWidth / 2,
      this.viewportHeight / 2 - 60,
      '#CCCCCC',
      '24px Arial',
      'center'
    );
  }

  /**
   * Render notification message at top of screen
   * @param message Message to display
   * @param color Message color
   * @param duration How long to show (handled externally)
   */
  renderNotification(message: string, color: string = '#FFFFFF'): void {
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    const textWidth = this.ctx.measureText(message).width;
    const padding = 20;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 40;
    const boxX = (this.viewportWidth - boxWidth) / 2;
    const boxY = 50;

    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }

    // Message
    this.renderText(
      message,
      this.viewportWidth / 2,
      boxY + boxHeight / 2 + 5,
      color,
      '18px Arial',
      'center'
    );
  }

  /**
   * Render debug text in corner
   * @param lines Array of debug text lines
   */
  renderDebugInfo(lines: string[]): void {
    const x = 10;
    let y = this.viewportHeight - 10 - (lines.length * 16);
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (typeof this.ctx.fillRect === 'function') {
      this.ctx.fillRect(x - 5, y - 15, 200, lines.length * 16 + 10);
    }

    // Debug lines
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#00FF00';
    lines.forEach(line => {
      if (typeof this.ctx.fillText === 'function') {
        this.ctx.fillText(line, x, y);
      }
      y += 16;
    });
  }
}