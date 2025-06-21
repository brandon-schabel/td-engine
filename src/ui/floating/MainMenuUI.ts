/**
 * Recent changes:
 * - Initial creation of Main Menu UI
 * - Integrated with FloatingUIManager
 * - Uses centered dialog presentation
 * - Supports game start, settings, and leaderboard actions
 * - Migrated to use new button abstraction and utility-based styling system
 */

import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { AudioManager } from '@/audio/AudioManager';
import { createButton } from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';
import { PreGameConfigUI, type PreGameConfig } from './PreGameConfigUI';

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
    content.className = cn('p-8', 'text-center');
    
    // Game logo/title
    const logo = document.createElement('div');
    logo.className = 'main-menu-logo'; // Keep custom class for gradient text
    logo.innerHTML = `
      <div class="logo-icon">${createSvgIcon(IconType.TOWER, { size: 64 })}</div>
      <h1 class="logo-text">Tower Defense</h1>
      <div class="logo-subtitle">Defend your base!</div>
    `;
    content.appendChild(logo);
    
    // Menu buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = cn('flex', 'flex-col', 'gap-4', 'mx-auto');
    buttonsContainer.style.maxWidth = '300px';
    
    // Start Game button - now opens pre-game config
    const startButton = createButton({
      text: 'Start Game',
      icon: IconType.PLAY,
      variant: 'primary',
      size: 'lg',
      onClick: () => {
        this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
        // Show pre-game configuration dialog
        this.showPreGameConfig();
      }
    });
    buttonsContainer.appendChild(startButton);
    
    // Settings button
    const settingsButton = createButton({
      text: 'Settings',
      icon: IconType.SETTINGS,
      variant: 'secondary',
      size: 'lg',
      onClick: () => {
        this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onSettings) {
          this.onSettings();
        }
      }
    });
    buttonsContainer.appendChild(settingsButton);
    
    // Leaderboard button
    const leaderboardButton = createButton({
      text: 'Leaderboard',
      icon: IconType.CROWN,
      variant: 'secondary',
      size: 'lg',
      onClick: () => {
        this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onLeaderboard) {
          this.onLeaderboard();
        }
      }
    });
    buttonsContainer.appendChild(leaderboardButton);
    
    content.appendChild(buttonsContainer);
    
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
    
    // Don't null out callbacks here - they might still be needed
    // this.onStart = null;
    // this.onSettings = null;
    // this.onLeaderboard = null;
  }

  private showPreGameConfig(): void {
    // Hide main menu
    this.hide();
    
    // Show pre-game configuration
    const preGameConfig = new PreGameConfigUI(this.floatingUI);
    preGameConfig.show({
      onStartGame: (config: PreGameConfig) => {
        console.log('[MainMenuUI] onStartGame called with config:', config);
        console.log('[MainMenuUI] this.onStart is:', this.onStart);
        
        // Pass the config to the start callback BEFORE closing
        if (this.onStart) {
          console.log('[MainMenuUI] Calling onStart callback...');
          (this.onStart as any)(config);
        }
        
        // Close main menu AFTER starting the game
        this.close();
      },
      onBack: () => {
        // Show main menu again
        this.show({
          onStart: this.onStart,
          onSettings: this.onSettings,
          onLeaderboard: this.onLeaderboard
        });
      }
    });
  }
}