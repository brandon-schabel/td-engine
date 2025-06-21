import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { GameSettings, Difficulty, SettingsManager } from '@/config/GameSettings';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';

export class SettingsUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private settings: SettingsManager;
  private onSettingsChange: ((settings: GameSettings) => void) | null = null;

  constructor(game: Game, _anchorElement?: HTMLElement) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
    this.settings = SettingsManager.getInstance();
    // _anchorElement parameter kept for backward compatibility but not used with createDialog
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

    // Create the dialog element using createDialog
    this.element = this.floatingUI.createDialog(
      elementId,
      this.createContent(),
      {
        title: 'Game Settings',
        modal: true,
        closeable: true,
        onClose: () => this.handleClose(),
        className: 'settings-dialog'
      }
    );

    // Position at center of screen
    const centerPos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      getPosition: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    };
    this.element.setTarget(centerPos as any);

    // Enable the element
    this.element.enable();
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
    
    // Find the content area within the dialog
    const contentElement = this.element.getElement().querySelector('.ui-dialog-content');
    if (contentElement) {
      // Clear existing content
      contentElement.innerHTML = '';
      // Add new content
      contentElement.appendChild(this.createContent());
    }
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
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }

    this.onSettingsChange = null;
  }
}