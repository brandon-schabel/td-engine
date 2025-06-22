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
    
    // Create main display container
    this.displayElement = document.createElement('div');
    this.displayElement.className = cn(
      'bg-surface-secondary',
      'border',
      'border-default',
      'rounded-lg',
      'p-3',
      'shadow-lg',
      'min-w-[200px]',
      'pointer-events-auto'
    );

    // Level header
    const header = document.createElement('div');
    header.className = cn('flex', 'items-center', 'justify-between', 'mb-2');
    
    this.levelTextElement = document.createElement('div');
    this.levelTextElement.className = cn('text-lg', 'font-bold', 'text-primary');
    
    this.pointsTextElement = document.createElement('div');
    this.pointsTextElement.className = cn('text-sm', 'text-secondary');
    
    header.appendChild(this.levelTextElement);
    header.appendChild(this.pointsTextElement);

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
      // Position will be set by FloatingUIElement's loadStoredPosition
      this.floatingElement.enable();
    } else {
      // Set default position in top-right
      const defaultPos = PersistentPositionManager.getDefaultPosition(220, 100, 'top-right', 10);
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
        this.pointsTextElement.className = cn('text-sm', 'text-success', 'font-medium');
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
    // Create radial burst background effect
    const burstId = `burst-${Date.now()}`;
    const burst = this.floatingUI.create(burstId, 'popup', {
      persistent: false,
      autoHide: false,
      className: cn(
        'fixed',
        'top-1/2',
        'left-1/2',
        'w-[300px]',
        'h-[300px]',
        'bg-golden/20',
        'rounded-full',
        'animate-radial-burst',
        'z-[899]',
        'pointer-events-none'
      )
    });
    burst.enable();

    // Main notification with epic animation
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
        'border-4',
        'border-warning',
        'rounded-xl',
        'px-10',
        'py-8',
        'shadow-2xl',
        'z-[900]',
        'animate-level-up-epic',
        'animate-golden-pulse'
      )
    });

    const content = document.createElement('div');
    content.className = cn('text-center', 'space-y-4', 'relative');
    
    // Add sparkle effects
    this.addSparkles(content);
    
    const title = document.createElement('div');
    title.className = cn('text-3xl', 'font-bold', 'text-golden', 'tracking-wider');
    title.textContent = 'LEVEL UP!';
    title.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    
    const levelInfo = document.createElement('div');
    levelInfo.className = cn('text-2xl', 'text-golden-light', 'font-semibold');
    levelInfo.textContent = `Level ${newLevel}`;
    
    const pointsInfo = document.createElement('div');
    pointsInfo.className = cn('text-lg', 'text-warning', 'font-medium');
    pointsInfo.textContent = pointsEarned === 1 
      ? '✨ 1 Upgrade Point Earned ✨' 
      : `✨ ${pointsEarned} Upgrade Points Earned ✨`;
    
    content.appendChild(title);
    content.appendChild(levelInfo);
    content.appendChild(pointsInfo);
    
    notification.setContent(content);
    notification.enable();

    // Add floating upgrade point indicator
    this.showFloatingPoints(pointsEarned);

    // Trigger screen flash effect
    this.createScreenFlash();

    // Play level up sound
    this.playLevelUpSound();

    // Add glow to level display
    this.addLevelDisplayGlow();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
      this.floatingUI.remove(burstId);
    }, 3500);
  }

  private addSparkles(container: HTMLElement): void {
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = cn(
        'absolute',
        'w-2',
        'h-2',
        'bg-golden',
        'rounded-full',
        'animate-sparkle'
      );
      sparkle.style.left = `${20 + Math.random() * 60}%`;
      sparkle.style.top = `${20 + Math.random() * 60}%`;
      sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
      container.appendChild(sparkle);
    }
  }

  private showFloatingPoints(points: number): void {
    const floatingId = `floating-points-${Date.now()}`;
    const floating = this.floatingUI.create(floatingId, 'popup', {
      persistent: false,
      autoHide: false,
      className: cn(
        'fixed',
        'top-1/2',
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        'text-2xl',
        'font-bold',
        'text-golden',
        'animate-float-up',
        'z-[901]',
        'pointer-events-none'
      )
    });

    const text = document.createElement('div');
    text.textContent = `+${points} ${points === 1 ? 'Point' : 'Points'}`;
    text.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
    
    floating.setContent(text);
    floating.enable();

    setTimeout(() => {
      this.floatingUI.remove(floatingId);
    }, 2000);
  }

  private createScreenFlash(): void {
    const flashId = `screen-flash-${Date.now()}`;
    const flash = this.floatingUI.create(flashId, 'popup', {
      persistent: false,
      autoHide: false,
      className: cn(
        'fixed',
        'inset-0',
        'bg-golden/10',
        'animate-screen-flash',
        'z-[898]',
        'pointer-events-none'
      )
    });
    
    flash.enable();
    
    setTimeout(() => {
      this.floatingUI.remove(flashId);
    }, 500);
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