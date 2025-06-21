/**
 * Player Level Display Component
 * Shows player level, experience progress, and available upgrade points
 */

import { Game } from "@/core/Game";
import { cn, createProgressBar, createStatDisplay } from "@/ui/elements";
import type { FloatingUIManager } from "@/ui/floating/FloatingUIManager";

export class PlayerLevelDisplay {
  private game: Game;
  private floatingUI: FloatingUIManager;
  private updateInterval: number | null = null;
  private displayElement: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
    this.floatingUI = this.game.getFloatingUIManager();
  }

  mount(parent: HTMLElement): void {
    // Create main display container
    this.displayElement = document.createElement('div');
    this.displayElement.className = cn(
      'fixed',
      'top-4',
      'left-4',
      'bg-surface-secondary',
      'border',
      'border-surface-border',
      'rounded-lg',
      'p-3',
      'shadow-lg',
      'z-20',
      'min-w-[250px]'
    );

    // Level header
    const header = document.createElement('div');
    header.className = cn('flex', 'items-center', 'justify-between', 'mb-2');
    
    const levelText = document.createElement('div');
    levelText.className = cn('text-lg', 'font-bold', 'text-primary');
    levelText.id = 'player-level-text';
    
    const pointsText = document.createElement('div');
    pointsText.className = cn('text-sm', 'text-secondary');
    pointsText.id = 'upgrade-points-text';
    
    header.appendChild(levelText);
    header.appendChild(pointsText);

    // Experience progress bar
    this.progressBar = createProgressBar({
      width: 220,
      height: 12,
      progress: 0,
      fillColor: 'primary',
      backgroundColor: 'surface-primary',
      variant: 'small',
      animated: true,
      className: 'mb-1'
    });

    // Experience text
    const expText = document.createElement('div');
    expText.className = cn('text-xs', 'text-center', 'text-muted');
    expText.id = 'experience-text';

    // Assemble display
    this.displayElement.appendChild(header);
    this.displayElement.appendChild(this.progressBar);
    this.displayElement.appendChild(expText);

    parent.appendChild(this.displayElement);

    // Start updating
    this.update();
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private update(): void {
    const player = this.game.getPlayer();
    const levelSystem = player.getPlayerLevelSystem();
    
    // Update level text
    const levelText = document.getElementById('player-level-text');
    if (levelText) {
      levelText.textContent = `Level ${levelSystem.getLevel()}`;
    }

    // Update upgrade points
    const pointsText = document.getElementById('upgrade-points-text');
    if (pointsText) {
      const availablePoints = levelSystem.getAvailableUpgradePoints();
      if (availablePoints > 0) {
        pointsText.textContent = `${availablePoints} Points`;
        pointsText.className = cn('text-sm', 'text-success', 'font-medium');
      } else {
        pointsText.textContent = '';
      }
    }

    // Update progress bar
    if (this.progressBar && this.progressBar.updateProgress) {
      const progress = levelSystem.getLevelProgress();
      this.progressBar.updateProgress(progress);
    }

    // Update experience text
    const expText = document.getElementById('experience-text');
    if (expText) {
      const exp = levelSystem.getExperience();
      const required = levelSystem.getExperienceToNextLevel();
      
      if (levelSystem.getLevel() >= 50) {
        expText.textContent = 'MAX LEVEL';
        expText.className = cn('text-xs', 'text-center', 'text-warning', 'font-bold');
      } else {
        expText.textContent = `${Math.floor(exp)} / ${required} XP`;
        expText.className = cn('text-xs', 'text-center', 'text-muted');
      }
    }
  }

  /**
   * Show level up notification
   */
  showLevelUpNotification(newLevel: number, pointsEarned: number): void {
    const notificationId = `level-up-${Date.now()}`;
    const notification = this.floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0.1,
      className: cn(
        'fixed',
        'top-1/2',
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        '-translate-y-1/2',
        'bg-surface-primary',
        'border-2',
        'border-warning',
        'rounded-lg',
        'px-8',
        'py-6',
        'shadow-2xl',
        'z-[900]',
        'animate-bounce-in'
      )
    });

    const content = document.createElement('div');
    content.className = cn('text-center', 'space-y-3');
    
    const title = document.createElement('div');
    title.className = cn('text-2xl', 'font-bold', 'text-warning');
    title.textContent = 'LEVEL UP!';
    
    const levelInfo = document.createElement('div');
    levelInfo.className = cn('text-xl', 'text-primary');
    levelInfo.textContent = `Level ${newLevel}`;
    
    const pointsInfo = document.createElement('div');
    pointsInfo.className = cn('text-sm', 'text-secondary');
    pointsInfo.textContent = pointsEarned === 1 
      ? '1 Upgrade Point Earned' 
      : `${pointsEarned} Upgrade Points Earned`;
    
    content.appendChild(title);
    content.appendChild(levelInfo);
    content.appendChild(pointsInfo);
    
    notification.setContent(content);
    notification.enable();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
    }, 3000);
  }

  /**
   * Toggle visibility
   */
  setVisible(visible: boolean): void {
    if (this.displayElement) {
      this.displayElement.style.display = visible ? 'block' : 'none';
    }
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.displayElement) {
      this.displayElement.remove();
      this.displayElement = null;
    }
  }
}