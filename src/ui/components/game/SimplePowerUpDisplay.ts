/**
 * Power-Up Display using FloatingUIManager
 * Recent changes:
 * - Refactored to use FloatingUIManager instead of old FloatingUIElement
 * - Improved power-up tracking and display
 * - Added notification popups for power-up collection
 * - Better mobile responsiveness
 * - Integrated with new popup system
 */

import { Game } from "@/core/Game";
import { IconType, createSvgIcon } from "@/ui/icons/SvgIcons";
import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { UI_CONSTANTS } from "@/config/UIConstants";
import type { FloatingUIManager } from "@/ui/floating/FloatingUIManager";
import { cn, createTimerProgressBar } from "@/ui/elements";
import type { ActivePowerUp } from "@/entities/player/PlayerPowerUps";

export class PowerUpDisplay {
  private game: Game;
  private floatingUI: FloatingUIManager;
  private updateInterval: number | null = null;
  private activePowerUpIds: Set<string> = new Set();
  private powerUpProgressBars: Map<string, HTMLDivElement> = new Map();

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
    this.floatingUI = this.game.getFloatingUIManager();
  }

  mount(_parent: HTMLElement): void {
    // Create main power-up container using FloatingUIManager
    const powerUpContainer = this.floatingUI.create('powerup-display', 'custom', {
      persistent: true,
      autoHide: false,
      smoothing: 0,
      className: cn(
        'fixed',
        'top-[80px]',
        'right-[20px]',
        'flex',
        'flex-col',
        'gap-2',
        'z-[800]',
        'pointer-events-none'
      )
    });

    // Position the container at top-right
    const element = powerUpContainer.getElement();
    element.className = cn(
      'fixed',
      'top-[80px]',
      'right-[20px]',
      'flex',
      'flex-col',
      'gap-2',
      'z-[800]',
      'pointer-events-none'
    );

    powerUpContainer.setContent('<div id="powerup-items"></div>').enable();

    // Start updating
    this.updateInterval = window.setInterval(
      () => this.update(),
      ANIMATION_CONFIG.durations.fast
    );
  }

  private update(): void {
    const player = this.game.getPlayer();
    const playerPowerUps = player.getPlayerPowerUps();
    const activePowerUps = playerPowerUps.getActivePowerUps();
    const itemsContainer = document.getElementById('powerup-items');

    if (!itemsContainer) return;

    // Remove power-ups that are no longer active
    for (const powerUpId of this.activePowerUpIds) {
      const [, type] = powerUpId.split('-');
      if (!activePowerUps.has(type)) {
        this.floatingUI.remove(powerUpId);
        this.activePowerUpIds.delete(powerUpId);
        
        // Destroy the progress bar
        const progressBar = this.powerUpProgressBars.get(powerUpId);
        if (progressBar && (progressBar as any).destroy) {
          (progressBar as any).destroy();
        }
        this.powerUpProgressBars.delete(powerUpId);
      }
    }

    // Update or create elements for active power-ups
    let index = 0;
    activePowerUps.forEach((powerUp: ActivePowerUp, type: string) => {
      const powerUpId = `powerup-${type}-${index}`;

      if (!this.activePowerUpIds.has(powerUpId)) {
        // Create new power-up element
        this.createPowerUpElement(type, powerUpId, index, powerUp);
        this.activePowerUpIds.add(powerUpId);
      }

      index++;
    });
  }

  private createPowerUpElement(type: string, powerUpId: string, index: number, powerUp: ActivePowerUp): void {
    const powerUpElement = this.floatingUI.create(powerUpId, 'custom', {
      persistent: true,
      autoHide: false,
      smoothing: 0,
      className: cn(
        'bg-gradient-to-br', // Gradient background
        'from-surface-primary/95',
        'to-surface-secondary/95',
        'backdrop-blur-sm', // Blur effect
        'border-2', // Thicker border
        'border-primary/60', // More visible border
        'rounded-xl', // More rounded corners
        'px-4', // More horizontal padding
        'py-3', // More vertical padding
        'shadow-2xl', // Stronger shadow
        'shadow-black/40', // Shadow color
        'transition-all',
        'duration-300',
        'min-w-[280px]', // Increased width
        'ring-2', // Add ring effect
        'ring-white/10' // Subtle white ring
      )
    });

    // Position relative to the main container
    const topOffset = UI_CONSTANTS.powerUpDisplay.position.top + (index * 80); // Increased spacing from 60 to 80

    const element = powerUpElement.getElement();
    element.className = cn(
      'bg-gradient-to-br', // Gradient background
      'from-surface-primary/95',
      'to-surface-secondary/95',
      'backdrop-blur-sm', // Blur effect
      'border-2', // Thicker border
      'border-primary/60', // More visible border
      'rounded-xl', // More rounded corners
      'px-4', // More horizontal padding
      'py-3', // More vertical padding
      'shadow-2xl', // Stronger shadow
      'shadow-black/40', // Shadow color
      'transition-all',
      'duration-300',
      'min-w-[280px]', // Increased width
      'ring-2', // Add ring effect
      'ring-white/10' // Subtle white ring
    );
    element.style.top = `${topOffset}px`;

    // Create content with progress bar
    const content = this.createPowerUpContent(type, powerUp);
    powerUpElement.setContent(content);

    powerUpElement.enable();
  }

  private createPowerUpContent(type: string, powerUp: ActivePowerUp): HTMLDivElement {
    const container = document.createElement('div');
    container.className = cn('flex', 'flex-col', 'gap-3'); // Increased gap

    // Header with icon and name
    const header = document.createElement('div');
    header.className = cn('flex', 'items-center', 'gap-3'); // Increased gap
    
    const iconType = this.getPowerUpIcon(type);
    const iconColor = this.getPowerUpIconColor(type);
    // Larger icon with better visibility
    const icon = createSvgIcon(iconType, { 
      size: 28, // Increased from 20
      className: cn(iconColor, 'filter', 'drop-shadow-md') // Add drop shadow
    });
    const name = this.getPowerUpName(type);
    
    header.innerHTML = `
      ${icon}
      <span class="${cn(
        'text-base', // Increased from text-sm
        'font-bold', // Changed from font-medium
        'text-white', // Changed to white for better contrast
        'tracking-wide',
        'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' // Text shadow for readability
      )}">${name}</span>
    `;

    // Progress bar with improved visibility
    const remainingTime = powerUp.endTime - Date.now();
    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.className = cn(
      'p-1.5', // Padding around progress bar
      'bg-black/30', // Semi-transparent dark background
      'rounded-md',
      'shadow-inner'
    );
    
    const progressBar = createTimerProgressBar({
      width: 220, // Increased from 200
      height: 16, // Doubled from 8 for better visibility
      duration: remainingTime,
      startTime: Date.now(),
      powerUpType: type,
      showTimeRemaining: true,
      onComplete: () => {
        // Power-up will be removed in the next update cycle
      }
    });

    // Store progress bar reference
    const powerUpId = `powerup-${type}-${Array.from(this.activePowerUpIds).filter(id => id.startsWith(`powerup-${type}`)).length}`;
    this.powerUpProgressBars.set(powerUpId, progressBar);

    progressBarWrapper.appendChild(progressBar);
    
    container.appendChild(header);
    container.appendChild(progressBarWrapper);

    return container;
  }

  private getPowerUpIcon(type: string): IconType {
    const iconMap: Record<string, IconType> = {
      EXTRA_DAMAGE: IconType.DAMAGE,
      SPEED_BOOST: IconType.SPEED,
      FASTER_SHOOTING: IconType.SPEED,
      SHIELD: IconType.SHIELD,
      EXTRA_CURRENCY: IconType.COINS,
      HEALTH: IconType.HEART,
      HEALTH_REGEN: IconType.HEART,
    };
    return iconMap[type] || IconType.STAR;
  }

  private getPowerUpName(type: string): string {
    const nameMap: Record<string, string> = {
      EXTRA_DAMAGE: "Extra Damage",
      SPEED_BOOST: "Speed Boost",
      FASTER_SHOOTING: "Rapid Fire",
      SHIELD: "Shield",
      EXTRA_CURRENCY: "Extra Currency",
      HEALTH: "Health Boost",
      HEALTH_REGEN: "Health Regen",
    };
    return nameMap[type] || "Power-Up";
  }

  private getPowerUpIconColor(type: string): string {
    const colorMap: Record<string, string> = {
      EXTRA_DAMAGE: 'text-red-500',
      SPEED_BOOST: 'text-yellow-400',
      FASTER_SHOOTING: 'text-yellow-400',
      SHIELD: 'text-blue-500',
      HEALTH: 'text-green-500',
      HEALTH_REGEN: 'text-green-500',
      EXTRA_CURRENCY: 'text-yellow-500'
    };
    return colorMap[type] || 'text-primary';
  }

  /**
   * Show a power-up collection notification
   */
  public showPowerUpNotification(type: string, duration: number): void {
    const notificationId = `powerup-notification-${Date.now()}`;
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
        'bg-white',
        'border-2',
        'border-primary',
        'rounded-lg',
        'px-6',
        'py-4',
        'shadow-xl',
        'z-[900]',
        'animate-bounce-in'
      )
    });

    const iconType = this.getPowerUpIcon(type);
    const iconColor = this.getPowerUpIconColor(type);
    const icon = createSvgIcon(iconType, { size: 24, className: iconColor });
    const name = this.getPowerUpName(type);

    const element = notification.getElement();
    element.className = cn(
      'fixed',
      'top-1/2',
      'left-1/2',
      'transform',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'bg-white',
      'border-2',
      'border-primary',
      'rounded-lg',
      'px-6',
      'py-4',
      'shadow-xl',
      'z-[900]',
      'animate-bounce-in'
    );

    // Animation is now handled in CSS

    const content = document.createElement('div');
    content.className = cn('flex', 'items-center', 'gap-4');
    content.innerHTML = `
      ${icon}
      <div class="${cn('flex', 'flex-col')}">
        <div class="${cn('text-lg', 'font-bold')}" style="color: #000">${name}</div>
        <div class="${cn('text-sm')}" style="color: #666">${Math.ceil(duration / 1000)}s duration</div>
      </div>
    `;
    notification.setContent(content);

    notification.enable();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
    }, 2000);
  }

  /**
   * Show item pickup notification
   */
  public showItemPickupNotification(itemName: string, itemType: string): void {
    const notificationId = `item-notification-${Date.now()}`;
    const notification = this.floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0,
      className: cn(
        'fixed',
        'bottom-[120px]',
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        'bg-surface-secondary',
        'border',
        'border-surface-border',
        'rounded-full',
        'px-4',
        'py-2',
        'shadow-lg',
        'z-[850]',
        'animate-slide-up'
      )
    });

    // Get icon based on item type
    const getItemIcon = (type: string): string => {
      if (type.includes('CONSUMABLE')) {
        if (type.includes('health')) return createSvgIcon(IconType.HEART, { size: 24 });
        if (type.includes('damage')) return createSvgIcon(IconType.DAMAGE, { size: 24 });
        if (type.includes('speed')) return createSvgIcon(IconType.SPEED, { size: 24 });
        if (type.includes('shield')) return createSvgIcon(IconType.SHIELD, { size: 24 });
        return createSvgIcon(IconType.STAR, { size: 24 });
      }
      if (type.includes('EQUIPMENT')) return createSvgIcon(IconType.UPGRADE, { size: 24 });
      if (type.includes('MATERIAL')) return createSvgIcon(IconType.COINS, { size: 24 });
      return createSvgIcon(IconType.STAR, { size: 24 });
    };

    const element = notification.getElement();
    element.className = cn(
      'fixed',
      'bottom-[120px]',
      'left-1/2',
      'transform',
      '-translate-x-1/2',
      'bg-surface-secondary',
      'border',
      'border-surface-border',
      'rounded-full',
      'px-4',
      'py-2',
      'shadow-lg',
      'z-[850]',
      'animate-slide-up'
    );

    // Animation is now handled in CSS

    const icon = getItemIcon(itemType);
    const content = document.createElement('div');
    content.className = cn('flex', 'items-center', 'gap-2');
    content.innerHTML = `
      ${icon}
      <span class="${cn('text-sm', 'font-medium', 'text-primary')}">${itemName} added to inventory</span>
    `;
    notification.setContent(content);

    notification.enable();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
    }, 3000);
  }

  /**
   * Show inventory full notification
   */
  public showInventoryFullNotification(itemName: string): void {
    const notificationId = `inventory-full-${Date.now()}`;
    const notification = this.floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0,
      className: cn(
        'fixed',
        'bottom-[180px]',
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        'bg-warning',
        'text-on-warning',
        'border',
        'border-warning-dark',
        'rounded-lg',
        'px-4',
        'py-3',
        'shadow-xl',
        'z-[860]',
        'animate-shake'
      )
    });

    const element = notification.getElement();
    element.className = cn(
      'fixed',
      'bottom-[180px]',
      'left-1/2',
      'transform',
      '-translate-x-1/2',
      'bg-warning',
      'text-on-warning',
      'border',
      'border-warning-dark',
      'rounded-lg',
      'px-4',
      'py-3',
      'shadow-xl',
      'z-[860]',
      'animate-shake'
    );

    const warningIcon = createSvgIcon(IconType.WARNING, { size: 24 });
    const content = document.createElement('div');
    content.className = cn('flex', 'items-center', 'gap-2');
    content.innerHTML = `
      ${warningIcon}
      <span class="${cn('text-sm', 'font-medium')}">Inventory full! ${itemName} used immediately</span>
    `;
    notification.setContent(content);

    notification.enable();

    // Auto-remove after animation
    setTimeout(() => {
      this.floatingUI.remove(notificationId);
    }, 4000);
  }

  /**
   * Test method to show notifications (for debugging)
   */
  public testNotifications(): void {
    console.log('[PowerUpDisplay] Testing notifications...');

    // Test power-up notification
    this.showPowerUpNotification('EXTRA_DAMAGE', 10000);

    setTimeout(() => {
      // Test item pickup notification
      this.showItemPickupNotification('Health Potion', 'CONSUMABLE');
    }, 1000);

    setTimeout(() => {
      // Test inventory full notification
      this.showInventoryFullNotification('Magic Sword');
    }, 2000);
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Clean up all progress bars
    for (const [, progressBar] of this.powerUpProgressBars) {
      if ((progressBar as any).destroy) {
        (progressBar as any).destroy();
      }
    }
    this.powerUpProgressBars.clear();

    // Clean up all power-up elements
    for (const powerUpId of this.activePowerUpIds) {
      this.floatingUI.remove(powerUpId);
    }
    this.activePowerUpIds.clear();

    // Remove main container
    this.floatingUI.remove('powerup-display');
  }
}
