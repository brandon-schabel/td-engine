/**
 * Settings scene - full screen settings menu
 */

import { Scene } from './Scene';
import type { SceneManager } from './SceneManager';
import { createButton, createHeader, createSlider, createToggle, cn } from '@/ui/elements';
import { IconType, createSvgIcon } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { TransitionType } from './SceneTransition';
import { loadSettings, saveSettings, type GameSettings } from '@/config/GameSettings';

export class SettingsScene extends Scene {
  private settings: GameSettings;
  private isDirty: boolean = false;
  private returnScene: string = 'mainMenu'; // Default to main menu

  constructor(manager: SceneManager) {
    super(manager);
    this.settings = loadSettings();
  }

  protected async onEnter(): Promise<void> {
    // Check if we have a return scene specified globally
    const globalReturnScene = (window as any).__settingsReturnScene;
    if (globalReturnScene) {
      this.returnScene = globalReturnScene;
      delete (window as any).__settingsReturnScene;
    }
    
    this.isDirty = false;
    this.createSettingsUI();
  }

  protected async onExit(): Promise<void> {
    if (this.isDirty) {
      saveSettings(this.settings);
      // Apply settings to audio manager
      const audioManager = this.manager.getAudioManager();
      if (audioManager) {
        audioManager.setMasterVolume(this.settings.masterVolume);
        audioManager.setEnabled(this.settings.soundEnabled);
      }
    }
  }

  protected onUpdate(_deltaTime: number): void {
    // No updates needed
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (event instanceof KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          this.handleBack();
          break;
      }
    }
  }

  protected onDestroy(): void {
    // Clean up
  }

  private createSettingsUI(): void {
    // Clear container
    this.container.innerHTML = '';

    // Set container styles
    this.container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col',
      'bg-surface-primary'
    );

    // Create header with back button
    const header = document.createElement('div');
    header.className = cn(
      'flex',
      'items-center',
      'justify-between',
      'p-4',
      'border-b',
      'border-border-primary',
      'bg-surface-secondary'
    );

    const backButton = createButton({
      text: 'Back',
      icon: IconType.ARROW_LEFT,
      variant: 'ghost',
      size: 'sm',
      onClick: () => this.handleBack()
    });
    header.appendChild(backButton);

    const title = document.createElement('h1');
    title.className = cn('text-2xl', 'font-bold', 'text-text-primary');
    title.textContent = 'Settings';
    header.appendChild(title);

    const saveButton = createButton({
      text: 'Save',
      icon: IconType.SAVE,
      variant: this.isDirty ? 'primary' : 'ghost',
      size: 'sm',
      onClick: () => this.handleSave()
    });
    header.appendChild(saveButton);

    this.container.appendChild(header);

    // Create content container
    const content = document.createElement('div');
    content.className = cn(
      'flex-1',
      'overflow-y-auto',
      'p-4',
      'sm:p-8'
    );

    const settingsContainer = document.createElement('div');
    settingsContainer.className = cn(
      'max-w-2xl',
      'mx-auto',
      'space-y-8'
    );

    // Audio Settings
    const audioSection = this.createSection('Audio Settings', IconType.SPEAKER);
    
    // Master Volume
    audioSection.appendChild(this.createSettingRow(
      'Master Volume',
      createSlider({
        value: this.settings.masterVolume,
        min: 0,
        max: 1,
        step: 0.1,
        label: `${Math.round(this.settings.masterVolume * 100)}%`,
        onChange: (value) => {
          this.settings.masterVolume = value;
          this.isDirty = true;
          this.createSettingsUI();
          // Preview volume
          const audioManager = this.manager.getAudioManager();
          audioManager?.setMasterVolume(value);
          audioManager?.playUISound(SoundType.SELECT);
        }
      })
    ));

    // Sound Enabled
    audioSection.appendChild(this.createSettingRow(
      'Sound Effects',
      createToggle({
        checked: this.settings.soundEnabled,
        onChange: (checked) => {
          this.settings.soundEnabled = checked;
          this.isDirty = true;
          this.createSettingsUI();
          // Apply immediately
          const audioManager = this.manager.getAudioManager();
          audioManager?.setEnabled(checked);
          if (checked) {
            audioManager?.playUISound(SoundType.SELECT);
          }
        }
      })
    ));

    settingsContainer.appendChild(audioSection);

    // Graphics Settings
    const graphicsSection = this.createSection('Graphics Settings', IconType.SETTINGS);

    // Visual Quality
    const qualityOptions = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    graphicsSection.appendChild(this.createSettingRow(
      'Visual Quality',
      this.createOptionButtons(
        qualityOptions,
        this.settings.visualQuality,
        (value) => {
          this.settings.visualQuality = value as any;
          this.isDirty = true;
          this.createSettingsUI();
        }
      )
    ));

    // Show FPS
    graphicsSection.appendChild(this.createSettingRow(
      'Show FPS Counter',
      createToggle({
        checked: this.settings.showFPS,
        onChange: (checked) => {
          this.settings.showFPS = checked;
          this.isDirty = true;
          this.createSettingsUI();
        }
      })
    ));

    settingsContainer.appendChild(graphicsSection);

    // Gameplay Settings
    const gameplaySection = this.createSection('Gameplay Settings', IconType.GAMEPAD);

    // Auto-pause
    gameplaySection.appendChild(this.createSettingRow(
      'Auto-pause on Focus Loss',
      createToggle({
        checked: this.settings.autoPause ?? true,
        onChange: (checked) => {
          this.settings.autoPause = checked;
          this.isDirty = true;
          this.createSettingsUI();
        }
      })
    ));

    settingsContainer.appendChild(gameplaySection);

    content.appendChild(settingsContainer);
    this.container.appendChild(content);
  }

  private createSection(title: string, icon: IconType): HTMLElement {
    const section = document.createElement('div');
    section.className = cn(
      'bg-surface-secondary',
      'rounded-xl',
      'p-6',
      'space-y-4'
    );

    const iconSvg = createSvgIcon(icon, { size: 20 });
    const header = createHeader({
      title,
      icon: iconSvg,
      level: 3,
      variant: 'compact',
      customClasses: ['text-text-primary', 'uppercase', 'text-sm', 'font-semibold', 'tracking-wider']
    });
    section.appendChild(header);

    return section;
  }

  private createSettingRow(label: string, control: HTMLElement): HTMLElement {
    const row = document.createElement('div');
    row.className = cn(
      'flex',
      'items-center',
      'justify-between',
      'py-3',
      'px-4',
      'rounded-lg',
      'hover:bg-surface-primary/50',
      'transition-colors'
    );

    const labelElement = document.createElement('label');
    labelElement.className = cn('text-text-primary', 'font-medium');
    labelElement.textContent = label;
    row.appendChild(labelElement);

    row.appendChild(control);
    return row;
  }

  private createOptionButtons(
    options: string[],
    selected: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('flex', 'gap-2');

    options.forEach(option => {
      const button = createButton({
        text: option,
        variant: selected === option ? 'primary' : 'ghost',
        size: 'sm',
        onClick: () => {
          const audioManager = this.manager.getAudioManager();
          audioManager?.playUISound(SoundType.SELECT);
          onChange(option);
        }
      });
      container.appendChild(button);
    });

    return container;
  }

  private handleBack(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Go back to the scene we came from
    this.manager.switchTo(this.returnScene, {
      type: TransitionType.SLIDE_DOWN
    });
    
    // Reset to default for next time
    this.returnScene = 'mainMenu';
  }

  private handleSave(): void {
    if (!this.isDirty) return;

    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.SUCCESS);
    
    saveSettings(this.settings);
    this.isDirty = false;
    this.createSettingsUI();
  }
}