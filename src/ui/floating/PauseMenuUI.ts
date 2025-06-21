import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';

export class PauseMenuUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private onResume: (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onSettings: (() => void) | null = null;

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(callbacks: {
    onResume?: () => void;
    onRestart?: () => void;
    onSettings?: () => void;
  } = {}): void {
    this.onResume = callbacks.onResume || null;
    this.onRestart = callbacks.onRestart || null;
    this.onSettings = callbacks.onSettings || null;

    if (this.element) {
      this.element.enable();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'pause-menu-ui';

    // Create dialog with modal overlay
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Game Paused',
      modal: true,
      closeable: false,
      className: 'pause-menu-dialog'
    });
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'pause-menu-content';

    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'pause-menu-buttons';

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.className = 'pause-menu-button resume';
    resumeButton.innerHTML = `
      ${createSvgIcon(IconType.PLAY, { size: 24 })}
      <span>Resume Game</span>
    `;
    resumeButton.addEventListener('click', () => {
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onResume) {
        this.onResume();
      }
      this.close();
    });
    buttonsDiv.appendChild(resumeButton);

    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'pause-menu-button settings';
    settingsButton.innerHTML = `
      ${createSvgIcon(IconType.SETTINGS, { size: 24 })}
      <span>Settings</span>
    `;
    settingsButton.addEventListener('click', () => {
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onSettings) {
        this.onSettings();
      }
    });
    buttonsDiv.appendChild(settingsButton);

    // Restart button
    const restartButton = document.createElement('button');
    restartButton.className = 'pause-menu-button restart';
    restartButton.innerHTML = `
      ${createSvgIcon(IconType.RESTART, { size: 24 })}
      <span>Restart Game</span>
    `;
    restartButton.addEventListener('click', () => {
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (confirm('Are you sure you want to restart? All progress will be lost.')) {
        if (this.onRestart) {
          this.onRestart();
        }
        this.close();
      }
    });
    buttonsDiv.appendChild(restartButton);

    content.appendChild(buttonsDiv);

    // Game info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'pause-info';

    const stats = this.game.getGameStats();
    const currentWave = this.game.getCurrentWave();
    const score = this.game.getScore();
    const lives = this.game.getLives();

    infoDiv.innerHTML = `
      <div class="pause-info-item">
        <span class="pause-info-label">Current Wave:</span>
        <span class="pause-info-value">${currentWave}</span>
      </div>
      <div class="pause-info-item">
        <span class="pause-info-label">Score:</span>
        <span class="pause-info-value">${score.toLocaleString()}</span>
      </div>
      <div class="pause-info-item">
        <span class="pause-info-label">Lives:</span>
        <span class="pause-info-value">${lives}</span>
      </div>
      <div class="pause-info-item">
        <span class="pause-info-label">Enemies Killed:</span>
        <span class="pause-info-value">${stats.enemiesKilled}</span>
      </div>
      <div class="pause-info-item">
        <span class="pause-info-label">Time Played:</span>
        <span class="pause-info-value">${this.formatTime(stats.gameTime)}</span>
      </div>
    `;

    content.appendChild(infoDiv);

    return content;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

    this.onResume = null;
    this.onRestart = null;
    this.onSettings = null;
  }
}