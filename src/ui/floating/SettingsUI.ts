import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { GameSettings, Difficulty, SettingsManager } from '@/config/GameSettings';
import { createButton, createHeader, createSlider, createToggle, cn } from '@/ui/elements';

export class SettingsUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private settings: SettingsManager;
  private onSettingsChange: ((settings: GameSettings) => void) | null = null;
  private cameraControlsMinimized: boolean = false;

  constructor(game: Game, _anchorElement?: HTMLElement) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
    this.settings = SettingsManager.getInstance();
    // _anchorElement parameter kept for backward compatibility but not used with createDialog
    
    // Load camera controls state from localStorage
    const savedState = localStorage.getItem('cameraControlsMinimized');
    this.cameraControlsMinimized = savedState === 'true';
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
    content.className = cn('pr-2', 'max-h-[60vh]', 'overflow-y-auto');

    // Audio Settings
    const audioSection = document.createElement('div');
    audioSection.className = cn('mb-8', 'rounded-md', 'p-4', 'border', 'border-white/5', 'transition-all');
    
    const audioHeader = createHeader({
      title: 'Audio Settings',
      level: 3,
      variant: 'compact',
      showCloseButton: false,
      icon: createSvgIcon(IconType.SOUND, { size: 20 }),
      customClasses: ['mb-4', 'text-lg', 'font-semibold']
    });
    audioSection.appendChild(audioHeader);

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
    gameplaySection.className = cn('mb-8', 'rounded-md', 'p-4', 'border', 'border-white/5', 'transition-all');
    
    const gameplayHeader = createHeader({
      title: 'Gameplay Settings',
      level: 3,
      variant: 'compact',
      showCloseButton: false,
      icon: createSvgIcon(IconType.UPGRADE, { size: 20 }),
      customClasses: ['mb-4', 'text-lg', 'font-semibold']
    });
    gameplaySection.appendChild(gameplayHeader);

    // Difficulty
    const difficultyItem = document.createElement('div');
    difficultyItem.className = cn('mb-6');
    
    const difficultyLabel = document.createElement('span');
    difficultyLabel.className = cn('block', 'text-primary', 'mb-2', 'text-base');
    difficultyLabel.textContent = 'Difficulty';
    difficultyItem.appendChild(difficultyLabel);

    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = cn('flex', 'gap-2', 'flex-wrap');

    const difficulties = [
      { value: Difficulty.EASY, label: 'Easy', class: 'easy' },
      { value: Difficulty.NORMAL, label: 'Normal', class: 'normal' },
      { value: Difficulty.HARD, label: 'Hard', class: 'hard' },
      { value: Difficulty.EXPERT, label: 'Expert', class: 'expert' }
    ];

    difficulties.forEach(diff => {
      const button = createButton({
        text: diff.label,
        variant: this.settings.difficulty === diff.value ? 'primary' : 'outline',
        size: 'sm',
        customClasses: ['difficulty-button', diff.class],
        onClick: () => {
          this.settings.difficulty = diff.value;
          // Update all difficulty buttons
          difficultyButtons.querySelectorAll('.difficulty-button').forEach((btn, index) => {
            const difficultyOption = difficulties[index];
            if (difficultyOption) {
              btn.className = createButton({
                text: difficultyOption.label,
                variant: this.settings.difficulty === difficultyOption.value ? 'primary' : 'outline',
                size: 'sm',
                customClasses: ['difficulty-button', difficultyOption.class]
              }).className;
            }
          });
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        }
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

    // Camera Controls Section
    const cameraSection = document.createElement('div');
    cameraSection.className = cn('mb-8', 'rounded-md', 'p-4', 'border', 'border-white/5', 'transition-all');
    
    const cameraHeader = createHeader({
      title: 'Camera Controls',
      level: 3,
      variant: 'compact',
      showCloseButton: false,
      icon: createSvgIcon(IconType.ZOOM_IN, { size: 20 }),
      customClasses: ['mb-4', 'text-lg', 'font-semibold']
    });
    
    // Add minimize/maximize button to header
    const headerContainer = document.createElement('div');
    headerContainer.className = cn('flex', 'items-center', 'justify-between', 'mb-4');
    headerContainer.appendChild(cameraHeader);
    
    const minimizeButton = createButton({
      text: this.cameraControlsMinimized ? 'Expand' : 'Minimize',
      variant: 'ghost',
      size: 'xs',
      icon: this.cameraControlsMinimized ? IconType.EXPAND : IconType.COLLAPSE,
      customClasses: ['ml-auto'],
      onClick: () => {
        this.cameraControlsMinimized = !this.cameraControlsMinimized;
        localStorage.setItem('cameraControlsMinimized', String(this.cameraControlsMinimized));
        this.updateContent();
      }
    });
    headerContainer.appendChild(minimizeButton);
    
    cameraSection.appendChild(headerContainer);
    
    if (!this.cameraControlsMinimized) {
      // Camera controls content
      const cameraControls = document.createElement('div');
      cameraControls.className = cn('space-y-4');
      
      // Current zoom display
      const zoomDisplay = document.createElement('div');
      zoomDisplay.className = cn('text-center', 'text-secondary', 'mb-4');
      const currentZoom = Math.round(this.game.getCamera().getZoom() * 100);
      zoomDisplay.textContent = `Current Zoom: ${currentZoom}%`;
      cameraControls.appendChild(zoomDisplay);
      
      // Zoom buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.className = cn('flex', 'gap-2', 'justify-center', 'mb-4');
      
      const zoomInButton = createButton({
        text: 'Zoom In',
        icon: IconType.ZOOM_IN,
        variant: 'outline',
        size: 'sm',
        onClick: () => {
          this.game.getCamera().zoomIn();
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          this.updateContent();
        }
      });
      buttonContainer.appendChild(zoomInButton);
      
      const zoomOutButton = createButton({
        text: 'Zoom Out',
        icon: IconType.ZOOM_OUT,
        variant: 'outline',
        size: 'sm',
        onClick: () => {
          this.game.getCamera().zoomOut();
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          this.updateContent();
        }
      });
      buttonContainer.appendChild(zoomOutButton);
      
      const resetZoomButton = createButton({
        text: 'Reset',
        icon: IconType.RESET_ZOOM,
        variant: 'outline',
        size: 'sm',
        onClick: () => {
          this.game.getCamera().reset();
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          this.updateContent();
        }
      });
      buttonContainer.appendChild(resetZoomButton);
      
      cameraControls.appendChild(buttonContainer);
      
      // Camera follow toggle
      this.createToggleSetting(cameraControls, {
        label: 'Follow Player',
        value: this.game.getCamera().isFollowingTarget(),
        onChange: (value) => {
          this.game.getCamera().setFollowTarget(value);
          if (value) {
            this.game.resetCameraToPlayer();
          }
        }
      });
      
      cameraSection.appendChild(cameraControls);
    }
    
    content.appendChild(cameraSection);

    // Footer buttons
    const footer = document.createElement('div');
    footer.className = cn('flex', 'justify-between', 'gap-4', 'mt-8');

    const resetButton = createButton({
      text: 'Reset to Defaults',
      variant: 'outline',
      size: 'md',
      customClasses: ['settings-button', 'reset'],
      onClick: () => {
        if (confirm('Reset all settings to default values?')) {
          this.settings.reset();
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          this.updateContent();
        }
      }
    });
    footer.appendChild(resetButton);

    const saveButton = createButton({
      text: 'Save & Close',
      variant: 'success',
      size: 'md',
      customClasses: ['settings-button', 'save'],
      onClick: () => {
        this.handleClose();
      }
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
    item.className = cn('mb-6');

    const slider = createSlider({
      label: options.label,
      min: options.min,
      max: options.max,
      value: options.value,
      showValue: true,
      valueFormatter: (v) => `${v}%`,
      onChange: options.onChange,
      onInput: options.onChange,
      size: 'md',
      fullWidth: true,
      containerClasses: ['settings-slider-wrapper']
    });

    item.appendChild(slider);
    parent.appendChild(item);
  }

  private createToggleSetting(parent: HTMLElement, options: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }): void {
    const item = document.createElement('div');
    item.className = cn('mb-4', 'flex', 'items-center', 'justify-between');

    const toggle = createToggle({
      label: options.label,
      checked: options.value,
      onChange: (checked) => {
        options.onChange(checked);
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      },
      size: 'md',
      labelPosition: 'left',
      containerClasses: ['w-full', 'justify-between']
    });

    item.appendChild(toggle);
    parent.appendChild(item);
  }

  private updateContent(): void {
    if (!this.element) return;
    
    // Find the content area within the dialog
    const contentElement = this.element.getElement().querySelector('.ui-dialog-content');
    if (contentElement) {
      // Clear existing content
      while (contentElement.firstChild) {
        contentElement.removeChild(contentElement.firstChild);
      }
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