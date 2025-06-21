import { BaseDialog } from './BaseDialog';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { SettingsManager, DIFFICULTY_PRESETS, type GameSettings } from '@/config/GameSettings';
import { isMobile } from '@/config/ResponsiveConfig';

export interface GameSettingsDialogOptions {
  audioManager: AudioManager;
  onStartGame?: (settings: GameSettings) => void;
  onClose?: () => void;
}

export class GameSettingsDialog extends BaseDialog {
  private settingsManager: SettingsManager;
  private settings: GameSettings;
  private onStartGame?: (settings: GameSettings) => void;
  
  constructor(options: GameSettingsDialogOptions) {
    super({
      title: 'Game Settings',
      width: DIALOG_CONFIG.sizes.large,
      closeable: false,
      modal: true,
      audioManager: options.audioManager,
      className: 'game-settings-dialog'
    });
    
    this.settingsManager = SettingsManager.getInstance();
    this.settings = this.settingsManager.getSettings();
    this.onStartGame = options.onStartGame;
    
    this.buildContent();
  }
  
  protected buildContent(): void {
    // Create scrollable content area
    const scrollContainer = document.createElement('div');
    const isMobileDevice = isMobile(window.innerWidth);
    
    scrollContainer.className = 'ui-scrollable settings-content';
    scrollContainer.style.maxHeight = isMobileDevice ? 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 180px)' : 'clamp(400px, 70vh, 600px)';
    if (isMobileDevice) {
      scrollContainer.style.paddingBottom = '20px';
    }
    
    // Add title for mobile to make it clear this is the main menu
    if (isMobileDevice) {
      const title = document.createElement('h1');
      title.className = 'settings-mobile-title';
      title.textContent = 'Tower Defense';
      scrollContainer.appendChild(title);
    }
    
    // Difficulty section
    const difficultySection = this.createDifficultySection();
    scrollContainer.appendChild(difficultySection);
    
    // Audio section
    const audioSection = this.createAudioSection();
    scrollContainer.appendChild(this.createDivider());
    scrollContainer.appendChild(audioSection);
    
    // Graphics section
    const graphicsSection = this.createGraphicsSection();
    scrollContainer.appendChild(this.createDivider());
    scrollContainer.appendChild(graphicsSection);
    
    // Map section
    const mapSection = this.createMapSection();
    scrollContainer.appendChild(this.createDivider());
    scrollContainer.appendChild(mapSection);
    
    // Mobile controls section (if on touch device)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const mobileSection = this.createMobileSection();
      scrollContainer.appendChild(this.createDivider());
      scrollContainer.appendChild(mobileSection);
    }
    
    this.content.appendChild(scrollContainer);
    
    // Create footer with action buttons
    this.createFooter();
    const footer = this.footer!;
    
    // Adjust footer layout for mobile
    if (isMobileDevice) {
      footer.style.flexDirection = 'column-reverse';
      footer.style.gap = '12px';
    }
    
    // Start Game button (primary action)
    const startButton = this.createButton('Start Game', {
      icon: IconType.PLAY,
      primary: true,
      onClick: () => {
        this.saveSettings();
        this.hide();
        if (this.onStartGame) {
          this.onStartGame(this.settings);
        } else {
          console.error('[GameSettingsDialog] onStartGame callback not defined!');
        }
      }
    });
    
    // Make start button more prominent on mobile
    if (isMobileDevice) {
      startButton.style.width = '100%';
      startButton.style.minHeight = '56px';
      startButton.style.fontSize = 'clamp(16px, 4vw, 20px)';
    }
    
    // Reset button
    const resetButton = this.createButton('Reset to Defaults', {
      icon: IconType.RESET,
      color: '#FF9800',
      onClick: () => {
        this.resetToDefaults();
      }
    });
    
    if (isMobileDevice) {
      resetButton.style.width = '100%';
    }
    
    footer.appendChild(resetButton);
    footer.appendChild(startButton);
  }
  
  private createDifficultySection(): HTMLElement {
    const section = this.createSection('Difficulty', IconType.DIFFICULTY);
    
    // Preset buttons
    const presetContainer = document.createElement('div');
    presetContainer.className = 'settings-preset-container';
    
    const difficulties: Array<{ value: GameSettings['difficulty'], label: string, icon: string }> = [
      { value: 'CASUAL', label: 'Casual', icon: '🟢' },
      { value: 'NORMAL', label: 'Normal', icon: '🟡' },
      { value: 'CHALLENGE', label: 'Challenge', icon: '🔴' }
    ];
    
    difficulties.forEach(diff => {
      const button = document.createElement('button');
      button.className = 'preset-button';
      button.className = 'ui-button difficulty-preset-button';
      
      button.innerHTML = `${diff.icon} ${diff.label}`;
      button.dataset.difficulty = diff.value;
      
      if (this.settings.difficulty === diff.value) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        this.settings.difficulty = diff.value;
        this.updateDifficultyButtons(presetContainer);
        this.updateDifficultyDescription();
        this.playSound(SoundType.BUTTON_CLICK);
      });
      
      presetContainer.appendChild(button);
    });
    
    section.appendChild(presetContainer);
    
    // Difficulty description
    const description = document.createElement('p');
    description.className = 'difficulty-description';
    description.className = 'settings-description';
    section.appendChild(description);
    
    this.updateDifficultyDescription();
    
    return section;
  }
  
  private createAudioSection(): HTMLElement {
    const section = this.createSection('Audio', IconType.AUDIO_ON);
    
    // Master Volume
    const volumeItem = this.createSliderItem(
      'Master Volume',
      this.settings.masterVolume,
      0, 1, 0.1,
      (value) => {
        this.settings.masterVolume = value;
        this.options.audioManager?.setMasterVolume(value);
      }
    );
    section.appendChild(volumeItem);
    
    // Sound toggle
    const soundToggle = this.createToggleItem(
      'Sound Effects',
      this.settings.soundEnabled,
      (value) => {
        this.settings.soundEnabled = value;
        if (this.options.audioManager) {
          this.options.audioManager.setEnabled(value);
        }
      }
    );
    section.appendChild(soundToggle);
    
    return section;
  }
  
  private createGraphicsSection(): HTMLElement {
    const section = this.createSection('Graphics', IconType.SETTINGS);
    
    // Visual Quality
    const qualityItem = this.createSelectItem(
      'Quality',
      [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' }
      ],
      this.settings.visualQuality,
      (value) => {
        this.settings.visualQuality = value as GameSettings['visualQuality'];
      }
    );
    section.appendChild(qualityItem);
    
    // Show FPS
    const fpsToggle = this.createToggleItem(
      'Show FPS Counter',
      this.settings.showFPS,
      (value) => {
        this.settings.showFPS = value;
      }
    );
    section.appendChild(fpsToggle);
    
    return section;
  }
  
  private createMapSection(): HTMLElement {
    const section = this.createSection('Map', IconType.MAP);
    
    // Map Size
    const sizeItem = this.createSelectItem(
      'Size',
      [
        { value: 'SMALL', label: 'Small' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'LARGE', label: 'Large' }
      ],
      this.settings.mapSize,
      (value) => {
        this.settings.mapSize = value as GameSettings['mapSize'];
      }
    );
    section.appendChild(sizeItem);
    
    // Terrain
    const terrainItem = this.createSelectItem(
      'Terrain',
      [
        { value: 'FOREST', label: '🌲 Forest' },
        { value: 'DESERT', label: '🏜️ Desert' },
        { value: 'ARCTIC', label: '❄️ Arctic' }
      ],
      this.settings.terrain,
      (value) => {
        this.settings.terrain = value as GameSettings['terrain'];
      }
    );
    section.appendChild(terrainItem);
    
    // Path Complexity
    const pathItem = this.createSelectItem(
      'Path Style',
      [
        { value: 'SIMPLE', label: 'Simple' },
        { value: 'COMPLEX', label: 'Complex' }
      ],
      this.settings.pathComplexity,
      (value) => {
        this.settings.pathComplexity = value as GameSettings['pathComplexity'];
      }
    );
    section.appendChild(pathItem);
    
    return section;
  }
  
  private createMobileSection(): HTMLElement {
    const section = this.createSection('Mobile Controls', IconType.TOUCH);
    
    // Virtual Joystick
    const joystickToggle = this.createToggleItem(
      'Virtual Joystick',
      this.settings.mobileJoystickEnabled,
      (value) => {
        this.settings.mobileJoystickEnabled = value;
      }
    );
    section.appendChild(joystickToggle);
    
    // Haptic Feedback
    const hapticToggle = this.createToggleItem(
      'Haptic Feedback',
      this.settings.hapticFeedbackEnabled,
      (value) => {
        this.settings.hapticFeedbackEnabled = value;
      }
    );
    section.appendChild(hapticToggle);
    
    // Touch Layout
    const layoutItem = this.createSelectItem(
      'Layout',
      [
        { value: 'default', label: 'Right-handed' },
        { value: 'lefty', label: 'Left-handed' }
      ],
      this.settings.touchControlsLayout,
      (value) => {
        this.settings.touchControlsLayout = value as GameSettings['touchControlsLayout'];
      }
    );
    section.appendChild(layoutItem);
    
    return section;
  }
  
  private createSection(title: string, icon: IconType): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';
    
    const header = document.createElement('div');
    header.className = 'settings-section-title';
    
    const iconElement = createSvgIcon(icon, { size: 24 });
    header.innerHTML = `${iconElement}<span>${title}</span>`;
    section.appendChild(header);
    
    return section;
  }
  
  private createToggleItem(label: string, value: boolean, onChange: (value: boolean) => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'settings-row';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'settings-label';
    labelElement.textContent = label;
    item.appendChild(labelElement);
    
    const toggle = this.createToggle(value, onChange);
    item.appendChild(toggle);
    
    // Make entire row clickable on mobile
    if ('ontouchstart' in window) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', (e) => {
        if (e.target === item || e.target === labelElement) {
          toggle.querySelector('input')?.click();
        }
      });
    }
    
    return item;
  }
  
  private createSliderItem(label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'settings-row';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'settings-label';
    labelElement.textContent = label;
    item.appendChild(labelElement);
    
    const sliderContainer = this.createSlider(value, min, max, step, onChange);
    item.appendChild(sliderContainer);
    
    return item;
  }
  
  private createSelectItem(label: string, options: Array<{value: string, label: string}>, value: string, onChange: (value: string) => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'settings-row';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'settings-label';
    labelElement.textContent = label;
    item.appendChild(labelElement);
    
    const select = document.createElement('select');
    select.className = 'ui-select settings-select';
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      if (option.value === value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });
    
    select.addEventListener('change', () => {
      onChange(select.value);
      this.playSound(SoundType.SELECT);
    });
    
    item.appendChild(select);
    
    return item;
  }
  
  private createDivider(): HTMLElement {
    const divider = document.createElement('hr');
    divider.className = 'settings-divider';
    return divider;
  }
  
  private updateDifficultyButtons(container: HTMLElement): void {
    container.querySelectorAll('.preset-button').forEach(btn => {
      const button = btn as HTMLButtonElement;
      if (button.dataset.difficulty === this.settings.difficulty) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }
  
  private updateDifficultyDescription(): void {
    const preset = DIFFICULTY_PRESETS[this.settings.difficulty];
    const descriptions = {
      CASUAL: `More currency (${preset.startingCurrency}), extra lives (${preset.startingLives}), weaker enemies`,
      NORMAL: `Balanced gameplay - ${preset.startingCurrency} currency, ${preset.startingLives} lives`,
      CHALLENGE: `Less currency (${preset.startingCurrency}), fewer lives (${preset.startingLives}), stronger enemies`
    };
    
    const descElement = this.content.querySelector('.difficulty-description');
    if (descElement) {
      descElement.textContent = descriptions[this.settings.difficulty];
    }
  }
  
  private resetToDefaults(): void {
    this.settingsManager.resetToDefaults();
    this.settings = this.settingsManager.getSettings();
    
    // Rebuild content
    this.content.innerHTML = '';
    this.footer?.remove();
    this.footer = null;
    this.buildContent();
    
    this.playSound(SoundType.SELECT);
  }
  
  private saveSettings(): void {
    this.settingsManager.updateSettings(this.settings);
  }
  
  public getSettings(): GameSettings {
    return { ...this.settings };
  }
}