/**
 * Pre-Game Configuration UI
 * 
 * Shows map configuration options before starting the game
 * Includes map size, difficulty, biome selection
 */

import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { BiomeType, MapDifficulty, MapSize } from '@/types/MapData';
import { createButton, createHeader, cn } from '@/ui/elements';

export interface PreGameConfig {
  mapSize: MapSize;
  difficulty: MapDifficulty;
  biome: BiomeType;
}

export class PreGameConfigUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game | null;
  private selectedConfig: PreGameConfig = {
    mapSize: MapSize.MEDIUM,
    difficulty: MapDifficulty.MEDIUM,
    biome: BiomeType.FOREST
  };
  private onStartGame: ((config: PreGameConfig) => void) | null = null;
  private onBack: (() => void) | null = null;

  constructor(floatingUI: FloatingUIManager, game?: Game) {
    this.floatingUI = floatingUI;
    this.game = game || null;
    
    // Load saved preferences
    const savedConfig = localStorage.getItem('preGameConfig');
    if (savedConfig) {
      try {
        this.selectedConfig = { ...this.selectedConfig, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.warn('[PreGameConfigUI] Failed to parse saved config:', e);
      }
    }
  }

  public show(callbacks: {
    onStartGame?: (config: PreGameConfig) => void;
    onBack?: () => void;
  } = {}): void {
    this.onStartGame = callbacks.onStartGame || null;
    this.onBack = callbacks.onBack || null;

    if (this.element) {
      this.element.enable();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'pre-game-config-ui';
    console.log('[PreGameConfigUI] Creating dialog...');

    // Create the dialog element
    this.element = this.floatingUI.createDialog(
      elementId,
      this.createContent(),
      {
        title: 'Game Configuration',
        modal: true,
        closeable: true,
        onClose: () => this.handleBack(),
        className: 'pre-game-config-dialog'
      }
    );
    
    console.log('[PreGameConfigUI] Dialog created:', this.element);

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
    
    // Debug: Check if overlay is blocking
    setTimeout(() => {
      const overlay = document.querySelector('.ui-dialog-overlay');
      if (overlay) {
        console.log('[PreGameConfigUI] Overlay z-index:', (overlay as HTMLElement).style.zIndex || 'default');
      }
      const dialog = document.querySelector('.ui-dialog');
      if (dialog) {
        console.log('[PreGameConfigUI] Dialog z-index:', (dialog as HTMLElement).style.zIndex || 'default');
      }
    }, 100);
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = cn('p-6', 'min-w-[400px]');
    content.style.pointerEvents = 'auto';
    content.style.position = 'relative';
    content.style.zIndex = '1001';

    // Map Size Section
    const mapSizeSection = this.createSection('Map Size', IconType.MAP);
    const mapSizeOptions = this.createOptionButtons<MapSize>(
      [
        { value: MapSize.SMALL, label: 'Small', description: '20x20' },
        { value: MapSize.MEDIUM, label: 'Medium', description: '30x30' },
        { value: MapSize.LARGE, label: 'Large', description: '40x40' },
        { value: MapSize.HUGE, label: 'Huge', description: '50x50' }
      ],
      this.selectedConfig.mapSize,
      (value) => {
        this.selectedConfig.mapSize = value;
        this.saveConfig();
      }
    );
    mapSizeSection.appendChild(mapSizeOptions);
    content.appendChild(mapSizeSection);

    // Difficulty Section
    const difficultySection = this.createSection('Difficulty', IconType.CROWN);
    const difficultyOptions = this.createOptionButtons<MapDifficulty>(
      [
        { value: MapDifficulty.EASY, label: 'Easy', description: 'For beginners' },
        { value: MapDifficulty.MEDIUM, label: 'Normal', description: 'Balanced challenge' },
        { value: MapDifficulty.HARD, label: 'Hard', description: 'For experienced players' },
        { value: MapDifficulty.EXTREME, label: 'Extreme', description: 'Maximum challenge' }
      ],
      this.selectedConfig.difficulty,
      (value) => {
        this.selectedConfig.difficulty = value;
        this.saveConfig();
      }
    );
    difficultySection.appendChild(difficultyOptions);
    content.appendChild(difficultySection);

    // Biome Section
    const biomeSection = this.createSection('Environment', IconType.TREE);
    const biomeOptions = this.createOptionButtons<BiomeType>(
      [
        { value: BiomeType.FOREST, label: 'Forest', description: 'Lush greenery' },
        { value: BiomeType.DESERT, label: 'Desert', description: 'Sandy terrain' },
        { value: BiomeType.ARCTIC, label: 'Arctic', description: 'Frozen wasteland' },
        { value: BiomeType.VOLCANIC, label: 'Volcanic', description: 'Molten landscape' },
        { value: BiomeType.GRASSLAND, label: 'Grassland', description: 'Open plains' }
      ],
      this.selectedConfig.biome,
      (value) => {
        this.selectedConfig.biome = value;
        this.saveConfig();
      }
    );
    biomeSection.appendChild(biomeOptions);
    content.appendChild(biomeSection);

    // Action buttons
    const footer = document.createElement('div');
    footer.className = cn('flex', 'justify-between', 'gap-4', 'mt-8', 'pt-6', 'border-t', 'border-white/10');

    const backButton = createButton({
      text: 'Back to Menu',
      variant: 'outline',
      size: 'lg',
      onClick: () => this.handleBack()
    });
    footer.appendChild(backButton);

    const startButton = createButton({
      text: 'Start Game',
      icon: IconType.PLAY,
      variant: 'primary',
      size: 'lg',
      onClick: () => this.handleStartGame()
    });
    footer.appendChild(startButton);

    content.appendChild(footer);

    return content;
  }

  private createSection(title: string, icon: IconType): HTMLElement {
    const section = document.createElement('div');
    section.className = cn('mb-6');

    const header = createHeader({
      title,
      level: 3,
      variant: 'compact',
      showCloseButton: false,
      icon: createSvgIcon(icon, { size: 20 }),
      customClasses: ['mb-3', 'text-lg', 'font-semibold']
    });
    section.appendChild(header);

    return section;
  }

  private createOptionButtons<T extends string>(
    options: Array<{ value: T; label: string; description?: string }>,
    selectedValue: T,
    onChange: (value: T) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('grid', 'grid-cols-2', 'gap-3');

    const buttons: HTMLButtonElement[] = [];

    options.forEach(option => {
      const button = document.createElement('button');
      button.className = cn(
        'p-3',
        'rounded-lg',
        'border',
        'transition-all',
        'text-left',
        'hover:scale-[1.02]',
        'active:scale-[0.98]',
        ...(selectedValue === option.value
          ? ['bg-primary/20', 'border-primary', 'text-primary']
          : ['bg-surface-secondary', 'border-white/10', 'text-primary', 'hover:border-white/20'])
      );

      const labelEl = document.createElement('div');
      labelEl.className = cn('font-medium', 'mb-1');
      labelEl.textContent = option.label;
      button.appendChild(labelEl);

      if (option.description) {
        const descEl = document.createElement('div');
        descEl.className = cn('text-xs', 'text-secondary');
        descEl.textContent = option.description;
        button.appendChild(descEl);
      }

      // Add pointer-events to ensure clickability
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      
      button.onclick = (e) => {
        console.log('[PreGameConfigUI] Button clicked:', option.label, option.value);
        e.preventDefault();
        e.stopPropagation();
        
        // Update visual state
        buttons.forEach(btn => {
          const isSelected = btn === button;
          btn.className = cn(
            'p-3',
            'rounded-lg',
            'border',
            'transition-all',
            'text-left',
            'hover:scale-[1.02]',
            'active:scale-[0.98]',
            ...(isSelected
              ? ['bg-primary/20', 'border-primary', 'text-primary']
              : ['bg-surface-secondary', 'border-white/10', 'text-primary', 'hover:border-white/20'])
          );
        });

        // Play sound and call onChange
        if (this.game?.getAudioManager()) {
          this.game.getAudioManager().playUISound(SoundType.BUTTON_CLICK);
        }
        onChange(option.value);
      };

      buttons.push(button);
      container.appendChild(button);
    });

    return container;
  }

  private saveConfig(): void {
    localStorage.setItem('preGameConfig', JSON.stringify(this.selectedConfig));
  }

  private handleStartGame(): void {
    console.log('[PreGameConfigUI] Start game clicked with config:', this.selectedConfig);
    if (this.onStartGame) {
      this.onStartGame(this.selectedConfig);
    }
    this.close();
  }

  private handleBack(): void {
    if (this.onBack) {
      this.onBack();
    }
    this.close();
  }

  public hide(): void {
    if (this.element) {
      this.element.disable();
    }
  }

  public close(): void {
    this.destroy();
  }

  public destroy(): void {
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }

    this.onStartGame = null;
    this.onBack = null;
  }
}