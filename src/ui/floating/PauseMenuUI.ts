import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { isMobile } from '@/config/ResponsiveConfig';

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
    
    // Add custom styles for pause menu
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .pause-menu-dialog {
        min-width: ${isMobile(window.innerWidth) ? '280px' : '400px'};
        text-align: center;
      }
      
      .pause-menu-dialog .dialog-title {
        font-size: ${isMobile(window.innerWidth) ? '24px' : '32px'};
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .pause-menu-buttons {
        display: flex;
        flex-direction: column;
        gap: ${UI_CONSTANTS.spacing.md}px;
        padding: ${UI_CONSTANTS.spacing.lg}px 0;
      }
      
      .pause-menu-button {
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
        justify-content: center;
        gap: ${UI_CONSTANTS.spacing.sm}px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .pause-menu-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .pause-menu-button.resume {
        background: ${COLOR_THEME.ui.button.success};
      }
      
      .pause-menu-button.restart {
        background: ${COLOR_THEME.ui.button.danger};
      }
      
      .pause-menu-button.settings {
        background: ${COLOR_THEME.ui.button.secondary};
      }
      
      .pause-info {
        margin-top: ${UI_CONSTANTS.spacing.lg}px;
        padding: ${UI_CONSTANTS.spacing.md}px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        font-size: ${isMobile(window.innerWidth) ? '12px' : '14px'};
        color: ${COLOR_THEME.ui.text.secondary};
      }
      
      .pause-info-item {
        display: flex;
        justify-content: space-between;
        margin: ${UI_CONSTANTS.spacing.sm}px 0;
      }
      
      .pause-info-label {
        color: ${COLOR_THEME.ui.text.primary};
      }
      
      .pause-info-value {
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.success};
      }
    `;
    document.head.appendChild(styleElement);
    
    // Store style element reference for cleanup
    (this.element as any)._pauseStyleElement = styleElement;
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
    
    const stats = this.game.getGameStatistics();
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
        <span class="pause-info-value">${this.formatTime(stats.timePlayed)}</span>
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
    // Clean up custom styles
    const styleElement = this.element && (this.element as any)._pauseStyleElement;
    if (styleElement) {
      styleElement.remove();
    }
    
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }
    
    this.onResume = null;
    this.onRestart = null;
    this.onSettings = null;
  }
}