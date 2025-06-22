/**
 * Game over scene - full screen game over display
 */

import { Scene } from './Scene';
import { createButton, createStatDisplay, cn } from '@/ui/elements';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { TransitionType } from './SceneTransition';
import { formatNumber } from '@/utils/formatters';
import type { Stat } from '@/ui/elements';

interface GameOverStats {
  score: number;
  wave: number;
  enemiesKilled: number;
  towersBuilt: number;
  timeSurvived: number;
  victory: boolean;
}

export class GameOverScene extends Scene {
  private stats: GameOverStats = {
    score: 0,
    wave: 0,
    enemiesKilled: 0,
    towersBuilt: 0,
    timeSurvived: 0,
    victory: false
  };

  protected async onEnter(): Promise<void> {
    // Get stats from stored data
    const storedStats = (window as any).__gameStats;
    if (storedStats) {
      this.stats = storedStats;
      // Clean up
      delete (window as any).__gameStats;
    } else {
      // Fallback to getting from game instance if available
      const game = (window as any).game;
      if (game) {
        this.stats = {
          score: game.getScore(),
          wave: game.getWaveNumber(),
          enemiesKilled: game.getEnemiesKilled(),
          towersBuilt: game.getTowersBuilt(),
          timeSurvived: Math.floor((Date.now() - game.getGameStartTime()) / 1000),
          victory: false
        };
      }
    }

    this.createGameOverUI();
  }

  protected async onExit(): Promise<void> {
    // Clean up
  }

  protected onUpdate(_deltaTime: number): void {
    // No updates needed
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (event instanceof KeyboardEvent) {
      switch (event.key) {
        case 'Enter':
        case ' ':
          this.handleRestart();
          break;
        case 'Escape':
          this.handleMainMenu();
          break;
      }
    }
  }

  protected onDestroy(): void {
    // Clean up
  }

  private createGameOverUI(): void {
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
      'items-center',
      'justify-center',
      'bg-gradient-to-b',
      this.stats.victory ? 'from-success/20' : 'from-error/20',
      'to-surface-primary'
    );

    // Create content container
    const content = document.createElement('div');
    content.className = cn(
      'flex',
      'flex-col',
      'items-center',
      'gap-8',
      'p-8',
      'max-w-lg',
      'w-full'
    );

    // Title
    const title = document.createElement('h1');
    title.className = cn(
      'text-4xl',
      'sm:text-5xl',
      'font-bold',
      'text-center',
      'mb-4',
      this.stats.victory ? 'text-success' : 'text-error'
    );
    title.textContent = this.stats.victory ? 'Victory!' : 'Game Over';
    content.appendChild(title);

    // Score display
    const scoreContainer = document.createElement('div');
    scoreContainer.className = cn(
      'text-center',
      'p-6',
      'bg-surface-secondary',
      'rounded-xl',
      'shadow-xl'
    );

    const scoreLabel = document.createElement('div');
    scoreLabel.className = cn('text-sm', 'text-text-secondary', 'mb-2');
    scoreLabel.textContent = 'Final Score';

    const scoreValue = document.createElement('div');
    scoreValue.className = cn('text-4xl', 'font-bold', 'text-accent-primary');
    scoreValue.textContent = formatNumber(this.stats.score);

    scoreContainer.appendChild(scoreLabel);
    scoreContainer.appendChild(scoreValue);
    content.appendChild(scoreContainer);

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.className = cn(
      'grid',
      'grid-cols-2',
      'gap-4',
      'w-full'
    );

    const stats: Stat[] = [
      {
        label: 'Wave Reached',
        value: this.stats.wave.toString(),
        icon: IconType.FLAG
      },
      {
        label: 'Enemies Killed',
        value: formatNumber(this.stats.enemiesKilled),
        icon: IconType.SKULL
      },
      {
        label: 'Towers Built',
        value: this.stats.towersBuilt.toString(),
        icon: IconType.TOWER
      },
      {
        label: 'Time Survived',
        value: this.formatTime(this.stats.timeSurvived),
        icon: IconType.CLOCK
      }
    ];

    stats.forEach(stat => {
      const statDisplay = createStatDisplay({
        stats: [stat],
        variant: 'compact',
        columns: 1
      });
      statsGrid.appendChild(statDisplay);
    });

    content.appendChild(statsGrid);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = cn(
      'flex',
      'flex-col',
      'sm:flex-row',
      'gap-4',
      'w-full',
      'max-w-sm'
    );

    const restartButton = createButton({
      text: 'Play Again',
      icon: IconType.REFRESH,
      variant: 'primary',
      size: 'lg',
      fullWidth: true,
      onClick: () => this.handleRestart()
    });
    buttonContainer.appendChild(restartButton);

    const menuButton = createButton({
      text: 'Main Menu',
      icon: IconType.HOME,
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      onClick: () => this.handleMainMenu()
    });
    buttonContainer.appendChild(menuButton);

    content.appendChild(buttonContainer);

    // Leaderboard button
    const leaderboardButton = createButton({
      text: 'View Leaderboard',
      icon: IconType.CROWN,
      variant: 'ghost',
      size: 'md',
      fullWidth: true,
      onClick: () => this.handleLeaderboard()
    });
    content.appendChild(leaderboardButton);

    this.container.appendChild(content);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private handleRestart(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Go to pre-game config
    this.manager.switchTo('preGameConfig', {
      type: TransitionType.FADE
    });
  }

  private handleMainMenu(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Go to main menu
    this.manager.switchTo('mainMenu', {
      type: TransitionType.FADE
    });
  }

  private handleLeaderboard(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Go to leaderboard
    this.manager.switchTo('leaderboard', {
      type: TransitionType.SLIDE_UP
    });
  }
}