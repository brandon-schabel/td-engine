import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { createButton } from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';

export class PauseMenuUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private onResume: (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onSettings: (() => void) | null = null;
  private onMainMenu: (() => void) | null = null;

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(callbacks: {
    onResume?: () => void;
    onRestart?: () => void;
    onSettings?: () => void;
    onMainMenu?: () => void;
  } = {}): void {
    this.onResume = callbacks.onResume || null;
    this.onRestart = callbacks.onRestart || null;
    this.onSettings = callbacks.onSettings || null;
    this.onMainMenu = callbacks.onMainMenu || null;

    if (this.element) {
      this.element.enable();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'pause-menu-ui';

    // Create dialog with modal overlay
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Game Paused',
      modal: true,
      closeable: false,
      className: cn('min-w-[400px]', 'text-center', 'sm:min-w-[280px]')
    });
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = cn('py-4');

    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = cn('flex', 'flex-col', 'gap-4', 'py-5');

    // Resume button - primary variant for main action
    const resumeButton = createButton({
      text: 'Resume Game',
      icon: IconType.PLAY,
      variant: 'primary',
      size: 'lg',
      fullWidth: true,
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onResume) {
          this.onResume();
        }
        this.close();
      }
    });
    buttonsDiv.appendChild(resumeButton);

    // Settings button - secondary variant
    const settingsButton = createButton({
      text: 'Settings',
      icon: IconType.SETTINGS,
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onSettings) {
          this.onSettings();
        }
      }
    });
    buttonsDiv.appendChild(settingsButton);

    // Restart button - danger variant for destructive action
    const restartButton = createButton({
      text: 'Restart Game',
      icon: IconType.RESTART,
      variant: 'danger',
      size: 'lg',
      fullWidth: true,
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (confirm('Are you sure you want to restart? All progress will be lost.')) {
          if (this.onRestart) {
            this.onRestart();
          }
          this.close();
        }
      }
    });
    buttonsDiv.appendChild(restartButton);

    // Main Menu button - secondary variant
    const mainMenuButton = createButton({
      text: 'Main Menu',
      icon: IconType.HOME,
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onMainMenu) {
          this.onMainMenu();
        }
        this.close();
      }
    });
    buttonsDiv.appendChild(mainMenuButton);

    content.appendChild(buttonsDiv);

    // Game info
    const infoDiv = document.createElement('div');
    infoDiv.className = cn('mt-5', 'p-4', 'rounded-md', 'text-sm', 'text-secondary', 'bg-black/30');

    const stats = this.game.getGameStats();
    const currentWave = this.game.getCurrentWave();
    const score = this.game.getScore();
    const lives = this.game.getLives();

    // Create info items using DOM methods
    const infoItems = [
      { label: 'Current Wave', value: currentWave },
      { label: 'Score', value: score.toLocaleString() },
      { label: 'Lives', value: lives },
      { label: 'Enemies Killed', value: stats.enemiesKilled },
      { label: 'Time Played', value: this.formatTime(stats.gameTime) }
    ];

    infoItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = cn('flex', 'justify-between', 'my-2');

      const label = document.createElement('span');
      label.className = cn('text-primary');
      label.textContent = item.label + ':';
      itemDiv.appendChild(label);

      const value = document.createElement('span');
      value.className = cn('font-bold', 'text-success');
      value.textContent = String(item.value);
      itemDiv.appendChild(value);

      infoDiv.appendChild(itemDiv);
    });

    content.appendChild(infoDiv);

    return content;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

    this.onResume = null;
    this.onRestart = null;
    this.onSettings = null;
    this.onMainMenu = null;
  }
}