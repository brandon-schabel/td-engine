/**
 * Player Level Display Component
 * Shows player level, experience progress, and available upgrade points
 */

import { Game } from "@/core/Game";
import { cn, createProgressBar } from "@/ui/elements";
import type { FloatingUIManager } from "@/ui/floating/FloatingUIManager";
import type { FloatingUIElement } from "@/ui/floating/FloatingUIElement";
import { SoundType } from "@/audio/AudioManager";
import { PersistentPositionManager } from "@/ui/utils/PersistentPositionManager";

export class PlayerLevelDisplay {
  private static instances: PlayerLevelDisplay[] = [];
  
  private game: Game;
  private floatingUI: FloatingUIManager;
  private floatingElement: FloatingUIElement | null = null;
  private updateInterval: number | null = null;
  private displayElement: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private levelTextElement: HTMLDivElement | null = null;
  private pointsTextElement: HTMLDivElement | null = null;
  private expTextElement: HTMLDivElement | null = null;

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
    this.floatingUI = this.game.getFloatingUIManager();
    
    // Track instance
    PlayerLevelDisplay.instances.push(this);
  }

  mount(_parent: HTMLElement): void {
    // Clean up any existing instance first
    this.cleanup();
    
    // Check if mobile
    const isMobile = 'ontouchstart' in window;
    
    // Create main display container
    this.displayElement = document.createElement('div');
    this.displayElement.className = cn(
      'bg-surface-secondary',
      'border',
      'border-default',
      'rounded-lg',
      isMobile ? 'p-2' : 'p-3',
      'shadow-lg',
      isMobile ? 'min-w-[120px]' : 'min-w-[200px]',
      'pointer-events-auto'
    );

    // Level header
    const header = document.createElement('div');
    header.className = cn('flex', 'items-center', 'justify-between', 'mb-2');
    
    this.levelTextElement = document.createElement('div');
    this.levelTextElement.className = cn(
      isMobile ? 'text-sm' : 'text-lg', 
      'font-bold', 
      'text-primary'
    );
    
    this.pointsTextElement = document.createElement('div');
    this.pointsTextElement.className = cn(
      isMobile ? 'text-xs' : 'text-sm', 
      'text-secondary'
    );
    
    header.appendChild(this.levelTextElement);
    header.appendChild(this.pointsTextElement);

    // Experience progress bar
    this.progressBar = createProgressBar({
      width: isMobile ? 120 : 220,
      height: isMobile ? 8 : 12,
      progress: 0,
      fillColor: 'primary',
      backgroundColor: 'surface-primary',
      variant: 'small',
      animated: true,
      className: 'mb-1'
    });

    // Experience text
    this.expTextElement = document.createElement('div');
    this.expTextElement.className = cn('text-xs', 'text-center', 'text-secondary');

    // Assemble display
    this.displayElement.appendChild(header);
    this.displayElement.appendChild(this.progressBar);
    this.displayElement.appendChild(this.expTextElement);

    // Create floating UI element with draggable functionality
    this.floatingElement = this.floatingUI.create('player-level-display', 'custom', {
      className: cn('pointer-events-auto'),
      screenSpace: true,
      draggable: true,
      persistPosition: true,
      positionKey: 'player-level-display-position',
      zIndex: 500,
      smoothing: 0,
      autoHide: false,
      persistent: true
    });
    
    this.floatingElement.setContent(this.displayElement);
    
    // Load saved position or use default
    const savedPosition = PersistentPositionManager.loadPosition('player-level-display', 'player-level-display-position');
    if (savedPosition) {
      // Ensure minimum margins from screen edges
      const minMargin = 20;
      const width = isMobile ? 120 : 220;
      const adjustedPos = {
        x: Math.min(Math.max(minMargin, savedPosition.x), window.innerWidth - width - minMargin),
        y: Math.max(minMargin, savedPosition.y)
      };
      
      // Only update if position was adjusted
      if (adjustedPos.x !== savedPosition.x || adjustedPos.y !== savedPosition.y) {
        this.floatingElement.setTarget(adjustedPos);
      }
      this.floatingElement.enable();
    } else {
      // Set default position in top-right with better padding
      const width = isMobile ? 120 : 220;
      const height = isMobile ? 70 : 100;
      const padding = isMobile ? 20 : 50;
      const defaultPos = PersistentPositionManager.getDefaultPosition(width, height, 'top-right', padding);
      this.floatingElement.setTarget({ x: defaultPos.x, y: defaultPos.y });
      this.floatingElement.enable();
    }

    // Start updating
    this.update();
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private update(): void {
    const player = this.game.getPlayer();
    const levelSystem = player.getPlayerLevelSystem();
    
    // Update level text
    if (this.levelTextElement) {
      this.levelTextElement.textContent = `Level ${levelSystem.getLevel()}`;
    }

    // Update upgrade points
    if (this.pointsTextElement) {
      const availablePoints = levelSystem.getAvailableUpgradePoints();
      if (availablePoints > 0) {
        this.pointsTextElement.textContent = `${availablePoints} Points`;
        const isMobile = 'ontouchstart' in window;
        this.pointsTextElement.className = cn(
          isMobile ? 'text-xs' : 'text-sm', 
          'text-success', 
          'font-medium'
        );
      } else {
        this.pointsTextElement.textContent = '';
      }
    }

    // Update progress bar
    if (this.progressBar && (this.progressBar as any).updateProgress) {
      const progress = levelSystem.getLevelProgress();
      (this.progressBar as any).updateProgress(progress);
    }

    // Update experience text
    if (this.expTextElement) {
      const exp = levelSystem.getExperience();
      const required = levelSystem.getExperienceToNextLevel();
      
      if (levelSystem.getLevel() >= 50) {
        this.expTextElement.textContent = 'MAX LEVEL';
        this.expTextElement.className = cn('text-xs', 'text-center', 'text-warning', 'font-bold');
      } else {
        this.expTextElement.textContent = `${Math.floor(exp)} / ${required} XP`;
        this.expTextElement.className = cn('text-xs', 'text-center', 'text-secondary');
      }
    }
  }

  /**
   * Show level up notification
   */
  showLevelUpNotification(newLevel: number, pointsEarned: number): void {
    // Main notification - smaller and at top of screen
    const notificationId = `level-up-${Date.now()}`;
    const notification = this.floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0.1,
      className: cn(
        'fixed',
        'top-20',  // Positioned at top with padding
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        'bg-surface-primary',
        'border-2',
        'border-warning',
        'rounded-lg',
        'px-6',
        'py-3',
        'shadow-lg',
        'z-[900]',
        'animate-slide-down-fade-in'
      )
    });

    const content = document.createElement('div');
    content.className = cn('text-center', 'space-y-1');
    
    const title = document.createElement('div');
    title.className = cn('text-lg', 'font-bold', 'text-golden');
    title.textContent = `LEVEL ${newLevel}`;
    
    const pointsInfo = document.createElement('div');
    pointsInfo.className = cn('text-sm', 'text-warning');
    pointsInfo.textContent = pointsEarned === 1 
      ? '+1 Upgrade Point' 
      : `+${pointsEarned} Upgrade Points`;
    
    content.appendChild(title);
    content.appendChild(pointsInfo);
    
    notification.setContent(content);
    notification.enable();

    // Play level up sound
    this.playLevelUpSound();

    // Add glow to level display
    this.addLevelDisplayGlow();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
    }, 2500);
  }


  private playLevelUpSound(): void {
    try {
      this.game.getAudioManager().playSound(SoundType.PLAYER_LEVEL_UP, 1);
    } catch (error) {
      // Audio might not be available or initialized
      console.debug('Level up sound could not be played:', error);
    }
  }

  private addLevelDisplayGlow(): void {
    if (this.displayElement) {
      this.displayElement.classList.add('animate-golden-pulse');
      setTimeout(() => {
        this.displayElement?.classList.remove('animate-golden-pulse');
      }, 3000);
    }
  }

  /**
   * Toggle visibility
   */
  setVisible(visible: boolean): void {
    if (this.floatingElement) {
      if (visible) {
        this.floatingElement.enable();
      } else {
        this.floatingElement.disable();
      }
    }
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.floatingElement) {
      this.floatingElement.destroy();
      this.floatingElement = null;
    }

    if (this.displayElement) {
      this.displayElement.remove();
      this.displayElement = null;
    }
    
    // Remove from instances tracking
    const index = PlayerLevelDisplay.instances.indexOf(this);
    if (index > -1) {
      PlayerLevelDisplay.instances.splice(index, 1);
    }
  }
  
  static cleanupAll(): void {
    // Clean up all existing instances
    const instances = [...PlayerLevelDisplay.instances];
    instances.forEach(instance => instance.cleanup());
    PlayerLevelDisplay.instances = [];
  }
}