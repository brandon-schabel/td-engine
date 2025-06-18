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
      autoSave: true
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
  
  private createToggle(checked: boolean, onChange: (value: boolean) => void): HTMLElement {
    const toggle = document.createElement('label');
    toggle.className = 'setting-toggle';
    toggle.style.cssText = `
      position: relative;
      display: inline-block;
      width: clamp(44px, 10vw, 52px);
      height: clamp(24px, 6vw, 28px);
      cursor: pointer;
    `;
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;
    
    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${checked ? '#4CAF50' : '#666'};
      transition: background-color ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      border-radius: 28px;
    `;
    
    const knob = document.createElement('span');
    knob.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${checked ? 'calc(100% - 22px)' : '2px'};
      width: clamp(20px, 5vw, 24px);
      height: clamp(20px, 5vw, 24px);
      background-color: white;
      transition: left ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    
    slider.appendChild(knob);
    toggle.appendChild(input);
    toggle.appendChild(slider);
    
    input.addEventListener('change', () => {
      const isChecked = input.checked;
      slider.style.backgroundColor = isChecked ? '#4CAF50' : '#666';
      knob.style.left = isChecked ? 'calc(100% - 22px)' : '2px';
      onChange(isChecked);
      this.playSound(SoundType.BUTTON_CLICK);
    });
    
    return toggle;
  }
  
  private createSlider(value: number, min: number, max: number, step: number, onChange: (value: number) => void): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 clamp(120px, 30vw, 180px);
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      background: #333;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      border-radius: 3px;
    `;
    
    // Custom slider styles
    const styleId = `slider-styles-${Date.now()}`;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${styleId} + input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      #${styleId} + input[type="range"]::-moz-range-thumb {
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    const valueLabel = document.createElement('span');
    valueLabel.style.cssText = `
      min-width: 40px;
      text-align: right;
      color: #4CAF50;
      font-size: clamp(12px, 3vw, 14px);
      font-weight: bold;
    `;
    valueLabel.textContent = Math.round(value * 100) + '%';
    
    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      valueLabel.textContent = Math.round(newValue * 100) + '%';
      onChange(newValue);
    });
    
    slider.addEventListener('change', () => {
      this.playSound(SoundType.SELECT);
    });
    
    container.appendChild(slider);
    container.appendChild(valueLabel);
    
    return container;
  }
  
  public getSettings(): typeof this.settings {
    return { ...this.settings };
  }
}