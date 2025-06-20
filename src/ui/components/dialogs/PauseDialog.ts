import { BaseDialog } from './BaseDialog';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface PauseDialogOptions {
  audioManager?: AudioManager;
  onResume: () => void;
  onSettings: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export class PauseDialog extends BaseDialog {
  private onResume: () => void;
  private onSettings: () => void;
  private onRestart: () => void;
  private onQuit: () => void;
  
  constructor(options: PauseDialogOptions) {
    super({
      title: 'Game Paused',
      width: DIALOG_CONFIG.sizes.small,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'pause-dialog'
    });
    
    this.onResume = options.onResume;
    this.onSettings = options.onSettings;
    this.onRestart = options.onRestart;
    this.onQuit = options.onQuit;
    
    this.buildContent();
  }
  
  protected buildContent(): void {
    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0;
    `;
    
    // Menu buttons
    const menuItems = [
      {
        text: 'Resume',
        icon: IconType.PLAY,
        color: '#4CAF50',
        primary: true,
        onClick: () => {
          this.hide();
          this.onResume();
        }
      },
      {
        text: 'Settings',
        icon: IconType.SETTINGS,
        color: '#2196F3',
        onClick: () => {
          this.hide();
          this.onSettings();
        }
      },
      {
        text: 'Restart',
        icon: IconType.RESTART,
        color: '#FF9800',
        onClick: () => {
          this.hide();
          this.onRestart();
        }
      },
      {
        text: 'Main Menu',
        icon: IconType.HOME,
        color: '#F44336',
        onClick: () => {
          this.hide();
          this.onQuit();
        }
      }
    ];
    
    menuItems.forEach(item => {
      const button = this.createMenuButton(item);
      menuContainer.appendChild(button);
    });
    
    this.content.appendChild(menuContainer);
    
    // Add keyboard shortcuts info
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.style.cssText = `
      text-align: center;
      color: #999;
      font-size: clamp(11px, 2.8vw, 13px);
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;
    shortcutsInfo.innerHTML = `
      <div>Press <strong style="color: #4CAF50;">ESC</strong> to resume</div>
    `;
    
    this.content.appendChild(shortcutsInfo);
  }
  
  private createMenuButton(item: {
    text: string;
    icon: IconType;
    color: string;
    primary?: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.style.cssText = `
      width: 100%;
      min-height: clamp(48px, 12vw, 56px);
      padding: 12px 20px;
      background: ${item.primary ? item.color : `${item.color}33`};
      border: 2px solid ${item.color};
      border-radius: 8px;
      color: white;
      font-size: clamp(16px, 4vw, 18px);
      font-weight: bold;
      cursor: pointer;
      transition: all ${ANIMATION_CONFIG.durations.buttonHover}ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    `;
    
    const icon = createSvgIcon(item.icon, { size: 24 });
    button.innerHTML = `${icon}<span>${item.text}</span>`;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateX(8px)';
      button.style.boxShadow = '4px 4px 12px rgba(0, 0, 0, 0.3)';
      if (!item.primary) {
        button.style.background = `${item.color}66`;
      }
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateX(0)';
      button.style.boxShadow = 'none';
      if (!item.primary) {
        button.style.background = `${item.color}33`;
      }
    });
    
    // Active state for touch
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.98)';
    });
    
    button.addEventListener('touchend', () => {
      button.style.transform = 'translateX(0)';
    });
    
    button.addEventListener('click', () => {
      this.playSound(item.primary ? SoundType.SELECT : SoundType.BUTTON_CLICK);
      item.onClick();
    });
    
    return button;
  }
  
  protected beforeHide(): void {
    // Resume game when dialog is closed by any means
    this.onResume();
  }
  
  protected afterShow(): void {
    // Focus on resume button for keyboard navigation
    const resumeButton = this.content.querySelector('button');
    if (resumeButton) {
      resumeButton.focus();
    }
  }
}