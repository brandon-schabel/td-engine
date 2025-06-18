import { BaseDialog } from './BaseDialog';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { SettingsManager, DIFFICULTY_PRESETS, type GameSettings } from '@/config/GameSettings';

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
      closeable: true,
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
    scrollContainer.style.cssText = `
      max-height: clamp(400px, 70vh, 600px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-right: 8px;
    `;
    
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
    
    // Reset button
    const resetButton = this.createButton('Reset to Defaults', {
      icon: IconType.RESET,
      color: '#FF9800',
      onClick: () => {
        this.resetToDefaults();
      }
    });
    
    // Start Game button
    const startButton = this.createButton('Start Game', {
      icon: IconType.PLAY,
      primary: true,
      onClick: () => {
        console.log('[GameSettingsDialog] Start button clicked');
        this.saveSettings();
        console.log('[GameSettingsDialog] Settings saved:', this.settings);
        this.hide();
        console.log('[GameSettingsDialog] Dialog hidden, calling onStartGame');
        if (this.onStartGame) {
          this.onStartGame(this.settings);
        } else {
          console.error('[GameSettingsDialog] onStartGame callback not defined!');
        }
      }
    });
    
    footer.appendChild(resetButton);
    footer.appendChild(startButton);
  }
  
  private createDifficultySection(): HTMLElement {
    const section = this.createSection('Difficulty', IconType.DIFFICULTY);
    
    // Preset buttons
    const presetContainer = document.createElement('div');
    presetContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    `;
    
    const difficulties: Array<{ value: GameSettings['difficulty'], label: string, icon: string }> = [
      { value: 'CASUAL', label: 'Casual', icon: '🟢' },
      { value: 'NORMAL', label: 'Normal', icon: '🟡' },
      { value: 'CHALLENGE', label: 'Challenge', icon: '🔴' }
    ];
    
    difficulties.forEach(diff => {
      const button = document.createElement('button');
      button.className = 'preset-button';
      button.style.cssText = `
        flex: 1;
        min-width: clamp(80px, 20vw, 120px);
        padding: 12px;
        border: 2px solid #444;
        background: #333;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(12px, 2.5vw, 14px);
        transition: all 0.2s;
        min-height: 44px;
      `;
      
      button.innerHTML = `${diff.icon} ${diff.label}`;
      button.dataset.difficulty = diff.value;
      
      if (this.settings.difficulty === diff.value) {
        button.style.borderColor = '#4CAF50';
        button.style.background = 'rgba(76, 175, 80, 0.2)';
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
    description.style.cssText = `
      font-size: clamp(11px, 2.5vw, 12px);
      color: #aaa;
      margin: 0;
      line-height: 1.4;
    `;
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
    section.style.cssText = `
      margin-bottom: 20px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #4CAF50;
      font-size: clamp(16px, 4vw, 18px);
      font-weight: bold;
    `;
    
    const iconElement = createSvgIcon(icon, { size: 24 });
    header.innerHTML = `${iconElement}<span>${title}</span>`;
    section.appendChild(header);
    
    return section;
  }
  
  private createToggleItem(label: string, value: boolean, onChange: (value: boolean) => void): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      min-height: ${DIALOG_CONFIG.mobile.minTouchTarget}px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.style.cssText = `
      flex: 1;
      color: #CCCCCC;
      font-size: clamp(14px, 3.5vw, 16px);
      user-select: none;
    `;
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
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      min-height: ${DIALOG_CONFIG.mobile.minTouchTarget}px;
      gap: 16px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.style.cssText = `
      color: #CCCCCC;
      font-size: clamp(14px, 3.5vw, 16px);
    `;
    labelElement.textContent = label;
    item.appendChild(labelElement);
    
    const sliderContainer = this.createSlider(value, min, max, step, onChange);
    item.appendChild(sliderContainer);
    
    return item;
  }
  
  private createSelectItem(label: string, options: Array<{value: string, label: string}>, value: string, onChange: (value: string) => void): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      min-height: ${DIALOG_CONFIG.mobile.minTouchTarget}px;
      gap: 16px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.style.cssText = `
      color: #CCCCCC;
      font-size: clamp(14px, 3.5vw, 16px);
    `;
    labelElement.textContent = label;
    item.appendChild(labelElement);
    
    const select = document.createElement('select');
    select.style.cssText = `
      background: #333;
      color: white;
      border: 1px solid #555;
      padding: 8px 12px;
      border-radius: 4px;
      min-width: clamp(100px, 25vw, 150px);
      font-size: clamp(12px, 3vw, 14px);
    `;
    
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
    divider.style.cssText = `
      margin: 24px 0;
      border: none;
      border-top: 1px solid rgba(76, 175, 80, 0.2);
    `;
    return divider;
  }
  
  private updateDifficultyButtons(container: HTMLElement): void {
    container.querySelectorAll('.preset-button').forEach(btn => {
      const button = btn as HTMLButtonElement;
      if (button.dataset.difficulty === this.settings.difficulty) {
        button.style.borderColor = '#4CAF50';
        button.style.background = 'rgba(76, 175, 80, 0.2)';
      } else {
        button.style.borderColor = '#444';
        button.style.background = '#333';
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