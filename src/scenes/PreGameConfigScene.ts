/**
 * Pre-game configuration scene - full screen game setup
 * Recent changes: Improved UI contrast and replaced inline CSS with utility classes
 */

import { Scene } from './Scene';
import { createButton, cn } from '@/ui/elements';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { BiomeType, MapDifficulty, MapSize } from '@/types/MapData';
import { TransitionType } from './SceneTransition';

export interface PreGameConfig {
  mapSize: MapSize;
  difficulty: MapDifficulty;
  biome: BiomeType;
}

export class PreGameConfigScene extends Scene {
  private selectedConfig: PreGameConfig = {
    mapSize: MapSize.MEDIUM,
    difficulty: MapDifficulty.MEDIUM,
    biome: BiomeType.FOREST
  };

  protected async onEnter(): Promise<void> {
    // Load saved preferences
    const savedConfig = localStorage.getItem('preGameConfig');
    if (savedConfig) {
      try {
        this.selectedConfig = { ...this.selectedConfig, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.warn('[PreGameConfigScene] Failed to parse saved config:', e);
      }
    }

    this.createConfigUI();
  }

  protected async onExit(): Promise<void> {
    // Save preferences
    localStorage.setItem('preGameConfig', JSON.stringify(this.selectedConfig));
  }

  protected onUpdate(_deltaTime: number): void {
    // Config scene doesn't need updates
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (event instanceof KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          this.handleBack();
          break;
        case 'Enter':
          this.handleStartGame();
          break;
      }
    }
  }

  protected onDestroy(): void {
    // Clean up
  }

  private createConfigUI(): void {
    // Clear container
    this.container.innerHTML = '';

    // Debug: Check if styles are applied
    console.log('[PreGameConfigScene] Creating UI...');

    // Main container with proper background
    this.container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col',
      'bg-surface-primary',
      'overflow-y-auto'
    );

    // Debug: Log computed styles after setting classes
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(this.container);
      console.log('[PreGameConfigScene] Container computed styles:', {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        display: computedStyle.display,
        className: this.container.className
      });
    }, 100);

    // Header with proper contrast
    const header = document.createElement('div');
    header.className = cn(
      'flex',
      'items-center',
      'justify-between',
      'p-4',
      'bg-surface-secondary',
      'border-b',
      'border-white/10'
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
    title.className = cn('text-2xl', 'font-bold', 'text-primary');
    title.textContent = 'Game Configuration';
    header.appendChild(title);

    header.appendChild(document.createElement('div'));
    this.container.appendChild(header);

    // Content container
    const content = document.createElement('div');
    content.className = cn(
      'flex-1',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'p-8',
      'gap-8'
    );

    // Configuration sections
    const configContainer = document.createElement('div');
    configContainer.className = cn('w-full', 'max-w-2xl', 'space-y-8');

    // Map Size Section
    configContainer.appendChild(this.createOptionSection(
      'Map Size',
      'Choose the battlefield size',
      [
        { value: MapSize.SMALL, label: 'Small', description: '20x20 - Quick games' },
        { value: MapSize.MEDIUM, label: 'Medium', description: '30x30 - Balanced' },
        { value: MapSize.LARGE, label: 'Large', description: '40x40 - Long games' },
        { value: MapSize.HUGE, label: 'Huge', description: '50x50 - Epic battles' }
      ],
      this.selectedConfig.mapSize,
      (value) => { this.selectedConfig.mapSize = value as MapSize; }
    ));

    // Difficulty Section
    configContainer.appendChild(this.createOptionSection(
      'Difficulty',
      'Set the challenge level',
      [
        { value: MapDifficulty.EASY, label: 'Easy', description: 'For beginners' },
        { value: MapDifficulty.MEDIUM, label: 'Medium', description: 'Balanced challenge' },
        { value: MapDifficulty.HARD, label: 'Hard', description: 'For veterans' },
        { value: MapDifficulty.EXTREME, label: 'Extreme', description: 'Ultimate test' }
      ],
      this.selectedConfig.difficulty,
      (value) => { this.selectedConfig.difficulty = value as MapDifficulty; }
    ));

    // Biome Section
    configContainer.appendChild(this.createOptionSection(
      'Biome',
      'Select the environment',
      [
        { value: BiomeType.FOREST, label: 'Forest', description: 'Lush greenery' },
        { value: BiomeType.DESERT, label: 'Desert', description: 'Sandy dunes' },
        { value: BiomeType.ARCTIC, label: 'Arctic', description: 'Frozen tundra' },
        { value: BiomeType.VOLCANIC, label: 'Volcanic', description: 'Molten landscape' }
      ],
      this.selectedConfig.biome,
      (value) => { this.selectedConfig.biome = value as BiomeType; }
    ));

    content.appendChild(configContainer);

    // Start button
    const startButton = createButton({
      text: 'Start Game',
      icon: IconType.PLAY,
      variant: 'primary',
      size: 'lg',
      onClick: () => this.handleStartGame()
    });
    startButton.className += ' ' + cn('px-8', 'py-4', 'text-lg');
    content.appendChild(startButton);

    this.container.appendChild(content);
  }

  private createOptionSection(
    title: string,
    description: string,
    options: Array<{ value: string; label: string; description: string }>,
    selectedValue: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = cn('space-y-4');

    // Header
    const headerContainer = document.createElement('div');
    headerContainer.className = cn('mb-4');

    const headerTitle = document.createElement('h3');
    headerTitle.className = cn('text-xl', 'font-bold', 'text-primary', 'mb-2');
    headerTitle.textContent = title;
    headerContainer.appendChild(headerTitle);

    const headerDesc = document.createElement('p');
    headerDesc.className = cn('text-sm', 'text-secondary');
    headerDesc.textContent = description;
    headerContainer.appendChild(headerDesc);

    section.appendChild(headerContainer);

    // Options grid
    const optionsGrid = document.createElement('div');
    optionsGrid.className = cn('grid', 'grid-cols-2', 'sm:grid-cols-4', 'gap-3');

    options.forEach(option => {
      const button = document.createElement('button');
      const isSelected = selectedValue === option.value;

      button.className = cn(
        'p-4',
        'rounded-lg',
        'border-2',
        'transition-all',
        'duration-200',
        'flex',
        'flex-col',
        'items-center',
        'gap-2',
        'hover:scale-105',
        'relative',
        isSelected ? 'bg-primary' : 'bg-surface-secondary',
        isSelected ? 'border-primary' : 'border-white/20',
        isSelected ? 'shadow-lg' : 'hover:border-white/40'
      );

      // Add selected indicator
      if (isSelected) {
        const indicator = document.createElement('div');
        indicator.className = cn(
          'absolute',
          'top-2',
          'right-2',
          'w-3',
          'h-3',
          'bg-primary',
          'rounded-full',
          'flex',
          'items-center',
          'justify-center'
        );
        indicator.innerHTML = '✓';
        indicator.style.fontSize = '10px';
        indicator.style.color = 'white';
        button.appendChild(indicator);
      }

      const label = document.createElement('div');
      label.className = cn(
        'font-semibold',
        'text-sm',
        isSelected ? 'text-white' : 'text-primary'
      );
      label.textContent = option.label;
      button.appendChild(label);

      const desc = document.createElement('div');
      desc.className = cn(
        'text-xs',
        isSelected ? 'text-white/90' : 'text-secondary',
        'text-center'
      );
      desc.textContent = option.description;
      button.appendChild(desc);

      button.addEventListener('click', () => {
        const audioManager = this.manager.getAudioManager();
        audioManager?.playUISound(SoundType.SELECT);
        onChange(option.value);
        this.createConfigUI();
      });

      optionsGrid.appendChild(button);
    });

    section.appendChild(optionsGrid);
    return section;
  }

  private handleBack(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);

    // Go back to main menu
    this.manager.switchTo('mainMenu', {
      type: TransitionType.SLIDE_RIGHT
    });
  }

  private handleStartGame(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);

    // Store config for game scene
    (window as any).__preGameConfig = this.selectedConfig;

    // Switch to game scene
    this.manager.switchTo('game', {
      type: TransitionType.FADE
    });
  }
}