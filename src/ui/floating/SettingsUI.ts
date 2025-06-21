import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { isMobile } from '@/config/ResponsiveConfig';
import { GameSettings, Difficulty, SettingsManager } from '@/config/GameSettings';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';

export class SettingsUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private settings: SettingsManager;
  private onSettingsChange: ((settings: GameSettings) => void) | null = null;

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
    this.settings = GameSettings.getInstance();
  }

  public show(onSettingsChange?: (settings: GameSettings) => void): void {
    this.onSettingsChange = onSettingsChange || null;

    if (this.element) {
      this.element.enable();
      this.updateContent();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'settings-ui';

    // Create dialog with modal overlay
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Game Settings',
      modal: true,
      closeable: true,
      onClose: () => this.handleClose(),
      className: 'settings-dialog'
    });

    // Add custom styles for settings
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .settings-dialog {
        min-width: ${isMobile(window.innerWidth) ? '320px' : '500px'};
        max-width: 90vw;
      }
      
      .settings-content {
        padding: ${UI_CONSTANTS.spacing.md}px 0;
      }
      
      .settings-section {
        margin-bottom: ${UI_CONSTANTS.spacing.xl}px;
        padding: ${UI_CONSTANTS.spacing.md}px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }
      
      .settings-section-title {
        font-size: ${isMobile(window.innerWidth) ? '16px' : '18px'};
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.primary};
        margin-bottom: ${UI_CONSTANTS.spacing.md}px;
        display: flex;
        align-items: center;
        gap: ${UI_CONSTANTS.spacing.sm}px;
      }
      
      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: ${UI_CONSTANTS.spacing.md}px 0;
        padding: ${UI_CONSTANTS.spacing.sm}px 0;
      }
      
      .settings-label {
        color: ${COLOR_THEME.ui.text.secondary};
        font-size: ${isMobile(window.innerWidth) ? '14px' : '16px'};
        flex: 1;
      }
      
      .settings-control {
        display: flex;
        align-items: center;
        gap: ${UI_CONSTANTS.spacing.sm}px;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: ${UI_CONSTANTS.spacing.sm}px;
        min-width: ${isMobile(window.innerWidth) ? '120px' : '150px'};
      }
      
      .slider {
        flex: 1;
        height: 6px;
        background: ${COLOR_THEME.ui.background.primary};
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
      }
      
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: ${COLOR_THEME.ui.button.primary};
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        background: ${COLOR_THEME.ui.button.success};
      }
      
      .slider-value {
        min-width: 40px;
        text-align: right;
        color: ${COLOR_THEME.ui.text.primary};
        font-weight: bold;
      }
      
      .toggle-switch {
        position: relative;
        width: 60px;
        height: 30px;
        background: ${COLOR_THEME.ui.background.primary};
        border-radius: 15px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .toggle-switch.active {
        background: ${COLOR_THEME.ui.button.success};
      }
      
      .toggle-switch-handle {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .toggle-switch.active .toggle-switch-handle {
        transform: translateX(30px);
      }
      
      .difficulty-buttons {
        display: flex;
        gap: ${UI_CONSTANTS.spacing.sm}px;
        flex-wrap: wrap;
      }
      
      .difficulty-button {
        padding: ${UI_CONSTANTS.spacing.sm}px ${UI_CONSTANTS.spacing.md}px;
        background: ${COLOR_THEME.ui.button.secondary};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        font-size: ${isMobile(window.innerWidth) ? '12px' : '14px'};
      }
      
      .difficulty-button:hover {
        opacity: 0.8;
      }
      
      .difficulty-button.active {
        background: ${COLOR_THEME.ui.button.primary};
      }
      
      .difficulty-button.easy {
        background: #4CAF50;
      }
      
      .difficulty-button.normal.active {
        background: #2196F3;
      }
      
      .difficulty-button.hard {
        background: #FF9800;
      }
      
      .difficulty-button.expert {
        background: #F44336;
      }
      
      .settings-footer {
        display: flex;
        justify-content: space-between;
        gap: ${UI_CONSTANTS.spacing.md}px;
        margin-top: ${UI_CONSTANTS.spacing.xl}px;
      }
      
      .settings-button {
        flex: 1;
        padding: ${UI_CONSTANTS.spacing.md}px;
        background: ${COLOR_THEME.ui.button.primary};
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        font-size: ${isMobile(window.innerWidth) ? '14px' : '16px'};
      }
      
      .settings-button:hover {
        opacity: 0.8;
      }
      
      .settings-button.save {
        background: ${COLOR_THEME.ui.button.success};
      }
      
      .settings-button.reset {
        background: ${COLOR_THEME.ui.button.danger};
      }
    `;
    document.head.appendChild(styleElement);

    // Store style element reference for cleanup
    (this.element as any)._settingsStyleElement = styleElement;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'settings-content';

    // Audio Settings
    const audioSection = document.createElement('div');
    audioSection.className = 'settings-section';
    audioSection.innerHTML = `
      <h3 class="settings-section-title">
        ${createSvgIcon(IconType.SOUND, { size: 20 })}
        Audio Settings
      </h3>
    `;

    // Master Volume
    this.createSliderSetting(audioSection, {
      label: 'Master Volume',
      value: this.settings.masterVolume,
      min: 0,
      max: 100,
      onChange: (value) => {
        this.settings.masterVolume = value;
        this.game.getAudioManager()?.setMasterVolume(value / 100);
      }
    });

    // Sound Effects
    this.createSliderSetting(audioSection, {
      label: 'Sound Effects',
      value: this.settings.sfxVolume,
      min: 0,
      max: 100,
      onChange: (value) => {
        this.settings.sfxVolume = value;
        // TODO: Add setSfxVolume method to AudioManager
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      }
    });

    // Music
    this.createSliderSetting(audioSection, {
      label: 'Music Volume',
      value: this.settings.musicVolume,
      min: 0,
      max: 100,
      onChange: (value) => {
        this.settings.musicVolume = value;
        // TODO: Add setMusicVolume method to AudioManager
      }
    });

    content.appendChild(audioSection);

    // Gameplay Settings
    const gameplaySection = document.createElement('div');
    gameplaySection.className = 'settings-section';
    gameplaySection.innerHTML = `
      <h3 class="settings-section-title">
        ${createSvgIcon(IconType.UPGRADE, { size: 20 })}
        Gameplay Settings
      </h3>
    `;

    // Difficulty
    const difficultyItem = document.createElement('div');
    difficultyItem.className = 'settings-item';
    difficultyItem.innerHTML = '<span class="settings-label">Difficulty</span>';

    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = 'difficulty-buttons';

    const difficulties = [
      { value: Difficulty.EASY, label: 'Easy', class: 'easy' },
      { value: Difficulty.NORMAL, label: 'Normal', class: 'normal' },
      { value: Difficulty.HARD, label: 'Hard', class: 'hard' },
      { value: Difficulty.EXPERT, label: 'Expert', class: 'expert' }
    ];

    difficulties.forEach(diff => {
      const button = document.createElement('button');
      button.className = `difficulty-button ${diff.class}`;
      if (this.settings.difficulty === diff.value) {
        button.classList.add('active');
      }
      button.textContent = diff.label;
      addClickAndTouchSupport(button, () => {
        this.settings.difficulty = diff.value;
        difficultyButtons.querySelectorAll('.difficulty-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      });
      difficultyButtons.appendChild(button);
    });

    difficultyItem.appendChild(difficultyButtons);
    gameplaySection.appendChild(difficultyItem);

    // Auto-pause
    this.createToggleSetting(gameplaySection, {
      label: 'Auto-pause when unfocused',
      value: this.settings.autoPause,
      onChange: (value) => {
        this.settings.autoPause = value;
      }
    });

    // Show FPS
    this.createToggleSetting(gameplaySection, {
      label: 'Show FPS Counter',
      value: this.settings.showFps,
      onChange: (value) => {
        this.settings.showFps = value;
      }
    });

    // Particle Effects
    this.createToggleSetting(gameplaySection, {
      label: 'Particle Effects',
      value: this.settings.particleEffects,
      onChange: (value) => {
        this.settings.particleEffects = value;
      }
    });

    content.appendChild(gameplaySection);

    // Footer buttons
    const footer = document.createElement('div');
    footer.className = 'settings-footer';

    const resetButton = document.createElement('button');
    resetButton.className = 'settings-button reset';
    resetButton.textContent = 'Reset to Defaults';
    addClickAndTouchSupport(resetButton, () => {
      if (confirm('Reset all settings to default values?')) {
        this.settings.reset();
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        this.updateContent();
      }
    });
    footer.appendChild(resetButton);

    const saveButton = document.createElement('button');
    saveButton.className = 'settings-button save';
    saveButton.textContent = 'Save & Close';
    addClickAndTouchSupport(saveButton, () => {
      this.handleClose();
    });
    footer.appendChild(saveButton);

    content.appendChild(footer);

    return content;
  }

  private createSliderSetting(parent: HTMLElement, options: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
  }): void {
    const item = document.createElement('div');
    item.className = 'settings-item';

    const label = document.createElement('span');
    label.className = 'settings-label';
    label.textContent = options.label;
    item.appendChild(label);

    const control = document.createElement('div');
    control.className = 'settings-control';

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = options.min.toString();
    slider.max = options.max.toString();
    slider.value = options.value.toString();

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = `${options.value}%`;

    slider.addEventListener('input', () => {
      const value = parseInt(slider.value);
      valueDisplay.textContent = `${value}%`;
      options.onChange(value);
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    control.appendChild(sliderContainer);
    item.appendChild(control);
    parent.appendChild(item);
  }

  private createToggleSetting(parent: HTMLElement, options: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }): void {
    const item = document.createElement('div');
    item.className = 'settings-item';

    const label = document.createElement('span');
    label.className = 'settings-label';
    label.textContent = options.label;
    item.appendChild(label);

    const control = document.createElement('div');
    control.className = 'settings-control';

    const toggle = document.createElement('div');
    toggle.className = `toggle-switch ${options.value ? 'active' : ''}`;
    toggle.innerHTML = '<div class="toggle-switch-handle"></div>';

    addClickAndTouchSupport(toggle, () => {
      const newValue = !toggle.classList.contains('active');
      toggle.classList.toggle('active', newValue);
      options.onChange(newValue);
      this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    });

    control.appendChild(toggle);
    item.appendChild(control);
    parent.appendChild(item);
  }

  private updateContent(): void {
    if (!this.element) return;
    this.element.setContent(this.createContent());
  }

  private handleClose(): void {
    this.settings.save();
    if (this.onSettingsChange) {
      this.onSettingsChange(this.settings);
    }
    this.close();
  }

  public hide(): void {
    this.close();
  }

  public close(): void {
    this.destroy();
  }

  public destroy(): void {
    // Clean up custom styles
    const styleElement = this.element && (this.element as any)._settingsStyleElement;
    if (styleElement) {
      styleElement.remove();
    }

    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }

    this.onSettingsChange = null;
  }
}