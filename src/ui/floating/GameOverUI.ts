import type { Game } from '@/core/Game';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { formatNumber } from '@/utils/formatters';
import { 
  createButton, 
  createStatDisplay,
  type Stat 
} from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';

export class GameOverUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private onRestart: (() => void) | null = null;
  private onMainMenu: (() => void) | null = null;

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(callbacks: {
    onRestart?: () => void;
    onMainMenu?: () => void;
  } = {}): void {
    this.onRestart = callbacks.onRestart || null;
    this.onMainMenu = callbacks.onMainMenu || null;

    if (this.element) {
      this.element.enable();
      return;
    }

    this.create();
  }

  private create(): void {
    const elementId = 'game-over-ui';

    // Create dialog with modal overlay
    this.element = this.floatingUI.createDialog(elementId, this.createContent(), {
      title: 'Game Over',
      modal: true,
      closeable: false,
      className: 'game-over-dialog'
    });

    // Remove style injection - styles are now in ComponentStyles.ts
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = cn('game-over-content');

    const stats = this.game.getGameStats();
    const score = this.game.getScore();
    const wave = this.game.getCurrentWave();

    // Score display
    const statsDiv = document.createElement('div');
    statsDiv.className = cn('rounded-lg', 'p-8', 'mb-8');
    statsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';

    // Create score display with proper DOM elements
    const scoreDiv = document.createElement('div');
    scoreDiv.className = cn('game-over-score', 'ui-pulse');
    
    const scoreLabel = document.createElement('span');
    scoreLabel.className = cn('text-lg', 'text-secondary', 'block', 'mb-2');
    scoreLabel.textContent = 'Final Score';
    
    const scoreValue = document.createElement('span');
    scoreValue.className = cn('font-bold', 'text-success', 'block');
    scoreValue.style.fontSize = '48px';
    scoreValue.style.textShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
    scoreValue.textContent = formatNumber(score);
    
    scoreDiv.appendChild(scoreLabel);
    scoreDiv.appendChild(scoreValue);
    statsDiv.appendChild(scoreDiv);

    // Create stats using the stat display abstraction
    const statItems: Stat[] = [
      {
        icon: IconType.ENEMY,
        value: stats.enemiesKilled,
        label: 'Enemies Killed'
      },
      {
        icon: IconType.WAVE,
        value: wave,
        label: 'Waves Survived'
      },
      {
        icon: IconType.TOWER,
        value: stats.towersBuilt,
        label: 'Towers Built'
      },
      {
        icon: IconType.CLOCK,
        value: this.formatTime(stats.gameTime),
        label: 'Time Played'
      }
    ];

    const statGrid = createStatDisplay({
      stats: statItems,
      layout: 'grid',
      columns: 2,
      variant: 'large',
      showLabels: true,
      showIcons: true,
      gap: 'md'
    });

    statsDiv.appendChild(statGrid);
    content.appendChild(statsDiv);

    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = cn('flex', 'gap-4', 'justify-center', 'flex-wrap');

    // Create restart button using button abstraction
    const restartButton = createButton({
      text: 'Try Again',
      icon: IconType.RESTART,
      iconPosition: 'left',
      iconSize: 24,
      variant: 'success',
      size: 'lg',
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onRestart) {
          this.onRestart();
        }
        this.close();
      },
      customClasses: ['uppercase']
    });
    restartButton.style.minWidth = '180px';
    buttonsDiv.appendChild(restartButton);

    // Create main menu button using button abstraction
    const menuButton = createButton({
      text: 'Main Menu',
      icon: IconType.HOME,
      iconPosition: 'left',
      iconSize: 24,
      variant: 'secondary',
      size: 'lg',
      onClick: () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onMainMenu) {
          this.onMainMenu();
        }
        this.close();
      },
      customClasses: ['uppercase']
    });
    menuButton.style.minWidth = '180px';
    buttonsDiv.appendChild(menuButton);

    content.appendChild(buttonsDiv);

    // Message
    const message = document.createElement('div');
    message.className = cn('text-base', 'text-secondary', 'mt-5', 'italic');
    message.textContent = this.getGameOverMessage(wave);
    content.appendChild(message);

    return content;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private getGameOverMessage(wave: number): string {
    if (wave >= 50) {
      return "Incredible performance! You're a tower defense master!";
    } else if (wave >= 30) {
      return "Excellent job! You've proven your strategic skills!";
    } else if (wave >= 20) {
      return "Well played! You're getting better!";
    } else if (wave >= 10) {
      return "Good effort! Keep practicing!";
    } else {
      return "Don't give up! Every defeat is a lesson!";
    }
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

    this.onRestart = null;
    this.onMainMenu = null;
  }
}