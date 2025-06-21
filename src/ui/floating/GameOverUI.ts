import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { isMobile } from '@/config/ResponsiveConfig';
import { formatNumber } from '@/utils/formatters';

export class GameOverUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private onRestart: (() => void) | null = null;
  private onMainMenu: (() => void) | null = null;

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(callbacks: {
    onRestart?: () => void;
    onMainMenu?: () => void;
  } = {}): void {
    this.onRestart = callbacks.onRestart || null;
    this.onMainMenu = callbacks.onMainMenu || null;

    if (this.element) {
      this.element.enable();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'game-over-ui';

    // Create dialog with modal overlay
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Game Over',
      modal: true,
      closeable: false,
      className: 'game-over-dialog'
    });

    // Add custom styles for game over
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .game-over-dialog {
        min-width: ${isMobile(window.innerWidth) ? '320px' : '500px'};
        text-align: center;
      }
      
      .game-over-dialog .dialog-title {
        font-size: ${isMobile(window.innerWidth) ? '28px' : '36px'};
        color: ${COLOR_THEME.ui.text.danger};
        text-transform: uppercase;
        letter-spacing: 3px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .game-over-content {
        padding: ${UI_CONSTANTS.spacing.lg}px 0;
      }
      
      .game-over-stats {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: ${UI_CONSTANTS.spacing.xl}px;
        margin-bottom: ${UI_CONSTANTS.spacing.xl}px;
      }
      
      .game-over-score {
        font-size: ${isMobile(window.innerWidth) ? '32px' : '48px'};
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.success};
        margin-bottom: ${UI_CONSTANTS.spacing.lg}px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .game-over-score-label {
        font-size: ${isMobile(window.innerWidth) ? '16px' : '20px'};
        color: ${COLOR_THEME.ui.text.secondary};
        display: block;
        margin-bottom: ${UI_CONSTANTS.spacing.sm}px;
      }
      
      .game-over-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: ${UI_CONSTANTS.spacing.md}px;
        margin-top: ${UI_CONSTANTS.spacing.lg}px;
      }
      
      .game-over-stat {
        background: rgba(255, 255, 255, 0.05);
        padding: ${UI_CONSTANTS.spacing.md}px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .game-over-stat-icon {
        color: ${COLOR_THEME.ui.text.primary};
        margin-bottom: ${UI_CONSTANTS.spacing.sm}px;
      }
      
      .game-over-stat-value {
        font-size: ${isMobile(window.innerWidth) ? '20px' : '24px'};
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.primary};
        margin-bottom: 4px;
      }
      
      .game-over-stat-label {
        font-size: ${isMobile(window.innerWidth) ? '12px' : '14px'};
        color: ${COLOR_THEME.ui.text.secondary};
      }
      
      .game-over-buttons {
        display: flex;
        gap: ${UI_CONSTANTS.spacing.md}px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .game-over-button {
        padding: ${UI_CONSTANTS.spacing.md}px ${UI_CONSTANTS.spacing.xl}px;
        background: ${COLOR_THEME.ui.button.primary};
        color: white;
        border: none;
        border-radius: 8px;
        font-size: ${isMobile(window.innerWidth) ? '16px' : '18px'};
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: ${UI_CONSTANTS.spacing.sm}px;
        text-transform: uppercase;
        letter-spacing: 1px;
        min-width: ${isMobile(window.innerWidth) ? '140px' : '180px'};
      }
      
      .game-over-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .game-over-button.restart {
        background: ${COLOR_THEME.ui.button.success};
      }
      
      .game-over-button.menu {
        background: ${COLOR_THEME.ui.button.secondary};
      }
      
      .game-over-message {
        font-size: ${isMobile(window.innerWidth) ? '14px' : '16px'};
        color: ${COLOR_THEME.ui.text.secondary};
        margin-top: ${UI_CONSTANTS.spacing.lg}px;
        font-style: italic;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .game-over-score {
        animation: pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleElement);

    // Store style element reference for cleanup
    (this.element as any)._gameOverStyleElement = styleElement;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'game-over-content';

    const stats = this.game.getGameStats();
    const score = this.game.getScore();
    const wave = this.game.getCurrentWave();

    // Score display
    const statsDiv = document.createElement('div');
    statsDiv.className = 'game-over-stats';

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'game-over-score';
    scoreDiv.innerHTML = `
      <span class="game-over-score-label">Final Score</span>
      ${formatNumber(score)}
    `;
    statsDiv.appendChild(scoreDiv);

    // Stats grid
    const statGrid = document.createElement('div');
    statGrid.className = 'game-over-stat-grid';

    const statItems = [
      {
        icon: IconType.ENEMY,
        value: stats.enemiesKilled,
        label: 'Enemies Killed'
      },
      {
        icon: IconType.WAVE,
        value: wave,
        label: 'Waves Survived'
      },
      {
        icon: IconType.TOWER,
        value: stats.towersBuilt,
        label: 'Towers Built'
      },
      {
        icon: IconType.CLOCK,
        value: this.formatTime(stats.gameTime),
        label: 'Time Played'
      }
    ];

    statItems.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.className = 'game-over-stat';
      statDiv.innerHTML = `
        <div class="game-over-stat-icon">${createSvgIcon(stat.icon as IconType, { size: 32 })}</div>
        <div class="game-over-stat-value">${stat.value}</div>
        <div class="game-over-stat-label">${stat.label}</div>
      `;
      statGrid.appendChild(statDiv);
    });

    statsDiv.appendChild(statGrid);
    content.appendChild(statsDiv);

    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'game-over-buttons';

    // Restart button
    const restartButton = document.createElement('button');
    restartButton.className = 'game-over-button restart';
    restartButton.innerHTML = `
      ${createSvgIcon(IconType.RESTART, { size: 24 })}
      <span>Try Again</span>
    `;
    restartButton.addEventListener('click', () => {
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onRestart) {
        this.onRestart();
      }
      this.close();
    });
    buttonsDiv.appendChild(restartButton);

    // Main menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'game-over-button menu';
    menuButton.innerHTML = `
      ${createSvgIcon(IconType.HOME, { size: 24 })}
      <span>Main Menu</span>
    `;
    menuButton.addEventListener('click', () => {
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onMainMenu) {
        this.onMainMenu();
      }
      this.close();
    });
    buttonsDiv.appendChild(menuButton);

    content.appendChild(buttonsDiv);

    // Message
    const message = document.createElement('div');
    message.className = 'game-over-message';
    message.textContent = this.getGameOverMessage(wave, score);
    content.appendChild(message);

    return content;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private getGameOverMessage(wave: number, score: number): string {
    if (wave >= 50) {
      return "Incredible performance! You're a tower defense master!";
    } else if (wave >= 30) {
      return "Excellent job! You've proven your strategic skills!";
    } else if (wave >= 20) {
      return "Well played! You're getting better!";
    } else if (wave >= 10) {
      return "Good effort! Keep practicing!";
    } else {
      return "Don't give up! Every defeat is a lesson!";
    }
  }

  public hide(): void {
    this.close();
  }

  public close(): void {
    this.destroy();
  }

  public destroy(): void {
    // Clean up custom styles
    const styleElement = this.element && (this.element as any)._gameOverStyleElement;
    if (styleElement) {
      styleElement.remove();
    }

    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }

    this.onRestart = null;
    this.onMainMenu = null;
  }
}