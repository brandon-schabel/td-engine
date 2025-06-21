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

    // Remove style injection - styles are now in ComponentStyles.ts
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
      <span class="game-over-score-value">${formatNumber(score)}</span>
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
    restartButton.className = 'ui-button game-over-button-restart';
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
    menuButton.className = 'ui-button secondary game-over-button-menu';
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
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }

    this.onRestart = null;
    this.onMainMenu = null;
  }
}