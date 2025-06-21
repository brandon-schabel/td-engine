/**
 * Recent changes:
 * - Initial creation of Main Menu UI
 * - Integrated with FloatingUIManager
 * - Uses centered dialog presentation
 * - Supports game start, settings, and leaderboard actions
 * - Follows established UI patterns from other floating UI components
 */

import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { AudioManager } from '@/audio/AudioManager';

export class MainMenuUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private audioManager: AudioManager | null = null;
  private onStart: (() => void) | null = null;
  private onSettings: (() => void) | null = null;
  private onLeaderboard: (() => void) | null = null;
  
  constructor(floatingUI: FloatingUIManager, audioManager?: AudioManager) {
    this.floatingUI = floatingUI;
    this.audioManager = audioManager || null;
  }
  
  public show(callbacks: {
    onStart?: () => void;
    onSettings?: () => void;
    onLeaderboard?: () => void;
  } = {}): void {
    this.onStart = callbacks.onStart || null;
    this.onSettings = callbacks.onSettings || null;
    this.onLeaderboard = callbacks.onLeaderboard || null;
    
    if (this.element) {
      this.element.enable();
      return;
    }
    
    this.create();
  }
  
  private create(): void {
    const elementId = 'main-menu-ui';
    
    // Create dialog without modal overlay for main menu
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Tower Defense',
      modal: false,
      closeable: false,
      className: 'main-menu-dialog'
    });
  }
  
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'main-menu-content';
    
    // Game logo/title
    const logo = document.createElement('div');
    logo.className = 'main-menu-logo';
    logo.innerHTML = `
      <div class="logo-icon">${createSvgIcon(IconType.TOWER, { size: 64 })}</div>
      <h1 class="logo-text">Tower Defense</h1>
      <div class="logo-subtitle">Defend your base!</div>
    `;
    content.appendChild(logo);
    
    // Menu buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'main-menu-buttons';
    
    // Start Game button
    const startButton = document.createElement('button');
    startButton.className = 'ui-button large primary';
    startButton.innerHTML = `
      ${createSvgIcon(IconType.PLAY, { size: 24 })}
      <span>Start Game</span>
    `;
    startButton.addEventListener('click', () => {
      this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onStart) {
        this.onStart();
      }
      this.close();
    });
    buttonsContainer.appendChild(startButton);
    
    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'ui-button large';
    settingsButton.innerHTML = `
      ${createSvgIcon(IconType.SETTINGS, { size: 24 })}
      <span>Settings</span>
    `;
    settingsButton.addEventListener('click', () => {
      this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onSettings) {
        this.onSettings();
      }
    });
    buttonsContainer.appendChild(settingsButton);
    
    // Leaderboard button
    const leaderboardButton = document.createElement('button');
    leaderboardButton.className = 'ui-button large';
    leaderboardButton.innerHTML = `
      ${createSvgIcon(IconType.CROWN, { size: 24 })}
      <span>Leaderboard</span>
    `;
    leaderboardButton.addEventListener('click', () => {
      this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
      if (this.onLeaderboard) {
        this.onLeaderboard();
      }
    });
    buttonsContainer.appendChild(leaderboardButton);
    
    content.appendChild(buttonsContainer);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .main-menu-dialog {
        min-width: 400px;
      }
      
      .main-menu-content {
        padding: var(--spacing-xl);
        text-align: center;
      }
      
      .main-menu-logo {
        margin-bottom: var(--spacing-xl);
      }
      
      .logo-icon {
        margin-bottom: var(--spacing-md);
        color: var(--color-button-primary);
      }
      
      .logo-text {
        font-size: var(--font-3xl);
        font-weight: bold;
        margin: 0 0 var(--spacing-xs) 0;
        background: linear-gradient(45deg, var(--color-button-primary), var(--color-button-hover));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .logo-subtitle {
        font-size: var(--font-lg);
        color: var(--color-text-secondary);
      }
      
      .main-menu-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        max-width: 300px;
        margin: 0 auto;
      }
      
      .main-menu-buttons .ui-button {
        width: 100%;
        justify-content: center;
      }
      
      @media (max-width: 480px) {
        .main-menu-dialog {
          min-width: 90vw;
        }
        
        .main-menu-content {
          padding: var(--spacing-lg);
        }
      }
    `;
    document.head.appendChild(style);
    
    return content;
  }
  
  public hide(): void {
    if (this.element) {
      this.element.disable();
    }
  }
  
  public close(): void {
    this.destroy();
  }
  
  public destroy(): void {
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }
    
    this.onStart = null;
    this.onSettings = null;
    this.onLeaderboard = null;
  }
}