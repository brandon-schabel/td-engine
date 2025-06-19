import { BaseDialog } from './BaseDialog';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface SettingsDialogOptions {
  audioManager: AudioManager;
  onResume?: () => void;
  onRestart?: () => void;
  onQuit?: () => void;
}

interface SettingsSection {
  title: string;
  icon: IconType;
  items: SettingsItem[];
}

interface SettingsItem {
  label: string;
  type: 'toggle' | 'slider' | 'button';
  value?: boolean | number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: any) => void;
  onClick?: () => void;
}

export class SettingsDialog extends BaseDialog {
  private settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    masterVolume: number;
    soundVolume: number;
    musicVolume: number;
    showFPS: boolean;
    showGrid: boolean;
    autoSave: boolean;
    showTouchJoysticks: boolean;
  };
  
  private sections: SettingsSection[];
  private onResume?: () => void;
  private onRestart?: () => void;
  private onQuit?: () => void;
  
  constructor(options: SettingsDialogOptions) {
    super({
      title: 'Settings',
      width: DIALOG_CONFIG.sizes.medium,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'settings-dialog'
    });
    
    this.onResume = options.onResume;
    this.onRestart = options.onRestart;
    this.onQuit = options.onQuit;
    
    // Load settings from localStorage
    this.settings = this.loadSettings();
    
    // Define settings sections
    this.sections = this.createSections();
    
    this.buildContent();
  }
  
  private loadSettings(): typeof this.settings {
    const stored = localStorage.getItem('gameSettings');
    const defaults = {
      soundEnabled: true,
      musicEnabled: true,
      masterVolume: 0.7,
      soundVolume: 0.7,
      musicVolume: 0.5,
      showFPS: false,
      showGrid: false,
      autoSave: true,
      showTouchJoysticks: true
    };
    
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  }
  
  private saveSettings(): void {
    localStorage.setItem('gameSettings', JSON.stringify(this.settings));
  }
  
  private createSections(): SettingsSection[] {
    return [
      {
        title: 'Audio',
        icon: IconType.SOUND,
        items: [
          {
            label: 'Sound Effects',
            type: 'toggle',
            value: this.settings.soundEnabled,
            onChange: (value) => {
              this.settings.soundEnabled = value;
              this.saveSettings();
              if (this.options.audioManager) {
                this.options.audioManager.setSoundEnabled(value);
              }
            }
          },
          {
            label: 'Music',
            type: 'toggle',
            value: this.settings.musicEnabled,
            onChange: (value) => {
              this.settings.musicEnabled = value;
              this.saveSettings();
              if (this.options.audioManager) {
                this.options.audioManager.setMusicEnabled(value);
              }
            }
          },
          {
            label: 'Master Volume',
            type: 'slider',
            value: this.settings.masterVolume,
            min: 0,
            max: 1,
            step: 0.1,
            onChange: (value) => {
              this.settings.masterVolume = value;
              this.saveSettings();
              if (this.options.audioManager) {
                this.options.audioManager.setMasterVolume(value);
              }
            }
          },
          {
            label: 'Sound Volume',
            type: 'slider',
            value: this.settings.soundVolume,
            min: 0,
            max: 1,
            step: 0.1,
            onChange: (value) => {
              this.settings.soundVolume = value;
              this.saveSettings();
              if (this.options.audioManager) {
                this.options.audioManager.setSoundVolume(value);
              }
            }
          },
          {
            label: 'Music Volume',
            type: 'slider',
            value: this.settings.musicVolume,
            min: 0,
            max: 1,
            step: 0.1,
            onChange: (value) => {
              this.settings.musicVolume = value;
              this.saveSettings();
              if (this.options.audioManager) {
                this.options.audioManager.setMusicVolume(value);
              }
            }
          }
        ]
      },
      {
        title: 'Display',
        icon: IconType.SETTINGS,
        items: [
          {
            label: 'Show FPS',
            type: 'toggle',
            value: this.settings.showFPS,
            onChange: (value) => {
              this.settings.showFPS = value;
              this.saveSettings();
            }
          },
          {
            label: 'Show Grid',
            type: 'toggle',
            value: this.settings.showGrid,
            onChange: (value) => {
              this.settings.showGrid = value;
              this.saveSettings();
            }
          }
        ]
      },
      {
        title: 'Game',
        icon: IconType.GAME_CONTROLLER,
        items: [
          {
            label: 'Auto Save',
            type: 'toggle',
            value: this.settings.autoSave,
            onChange: (value) => {
              this.settings.autoSave = value;
              this.saveSettings();
            }
          }
        ]
      },
      {
        title: 'Controls',
        icon: IconType.GAME_CONTROLLER,
        items: [
          {
            label: 'Touch Joysticks',
            type: 'toggle',
            value: this.settings.showTouchJoysticks,
            onChange: (value) => {
              this.settings.showTouchJoysticks = value;
              this.saveSettings();
              // Notify the game to update joystick visibility
              window.dispatchEvent(new CustomEvent('touchJoysticksToggled', { detail: { enabled: value }}));
            }
          }
        ]
      }
    ];
  }
  
  protected buildContent(): void {
    // Create scrollable content area
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
      max-height: clamp(300px, 60vh, 500px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-right: 8px;
    `;
    
    // Render sections
    this.sections.forEach((section, index) => {
      const sectionElement = this.createSection(section);
      scrollContainer.appendChild(sectionElement);
      
      if (index < this.sections.length - 1) {
        const divider = document.createElement('hr');
        divider.style.cssText = `
          margin: 20px 0;
          border: none;
          border-top: 1px solid rgba(76, 175, 80, 0.2);
        `;
        scrollContainer.appendChild(divider);
      }
    });
    
    this.content.appendChild(scrollContainer);
    
    // Create footer with action buttons
    this.createFooter();
    const footer = this.footer!;
    
    if (this.onResume) {
      const resumeButton = this.createButton('Resume', {
        icon: IconType.PLAY,
        primary: true,
        onClick: () => {
          this.hide();
          this.onResume?.();
        }
      });
      footer.appendChild(resumeButton);
    }
    
    if (this.onRestart) {
      const restartButton = this.createButton('Restart', {
        icon: IconType.RESTART,
        color: '#FF9800',
        onClick: () => {
          this.hide();
          this.onRestart?.();
        }
      });
      footer.appendChild(restartButton);
    }
    
    if (this.onQuit) {
      const quitButton = this.createButton('Quit', {
        icon: IconType.HOME,
        color: '#F44336',
        onClick: () => {
          this.hide();
          this.onQuit?.();
        }
      });
      footer.appendChild(quitButton);
    }
  }
  
  private createSection(section: SettingsSection): HTMLElement {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'settings-section';
    sectionElement.style.cssText = `
      margin-bottom: 16px;
    `;
    
    // Section header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #4CAF50;
      font-size: clamp(16px, 4vw, 18px);
      font-weight: bold;
    `;
    
    const icon = createSvgIcon(section.icon, { size: 24 });
    header.innerHTML = `${icon}<span>${section.title}</span>`;
    sectionElement.appendChild(header);
    
    // Section items
    section.items.forEach(item => {
      const itemElement = this.createSettingItem(item);
      sectionElement.appendChild(itemElement);
    });
    
    return sectionElement;
  }
  
  private createSettingItem(item: SettingsItem): HTMLElement {
    const itemElement = document.createElement('div');
    itemElement.className = 'setting-item';
    itemElement.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      min-height: ${DIALOG_CONFIG.mobile.minTouchTarget}px;
    `;
    
    const label = document.createElement('label');
    label.style.cssText = `
      flex: 1;
      color: #CCCCCC;
      font-size: clamp(14px, 3.5vw, 16px);
      user-select: none;
    `;
    label.textContent = item.label;
    itemElement.appendChild(label);
    
    switch (item.type) {
      case 'toggle':
        const toggle = this.createToggle(item.value as boolean, (value) => {
          item.onChange?.(value);
        });
        itemElement.appendChild(toggle);
        
        // Make entire row clickable on mobile
        if ('ontouchstart' in window) {
          itemElement.style.cursor = 'pointer';
          itemElement.addEventListener('click', (e) => {
            if (e.target === itemElement || e.target === label) {
              toggle.click();
            }
          });
        }
        break;
        
      case 'slider':
        const sliderContainer = this.createSlider(
          item.value as number,
          item.min!,
          item.max!,
          item.step!,
          (value) => {
            item.onChange?.(value);
          }
        );
        itemElement.appendChild(sliderContainer);
        break;
        
      case 'button':
        const button = this.createButton(item.label, {
          onClick: item.onClick
        });
        itemElement.appendChild(button);
        break;
    }
    
    return itemElement;
  }
  
  
  
  public getSettings(): typeof this.settings {
    return { ...this.settings };
  }
}