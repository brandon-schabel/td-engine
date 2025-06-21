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

export class PowerUpDisplay {
  private game: Game;
  private floatingUI: FloatingUIManager;
  private updateInterval: number | null = null;
  private activePowerUpIds: Set<string> = new Set();

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
      className: 'powerup-display-container'
    });

    // Position the container at top-right
    const element = powerUpContainer.getElement();
    element.className = 'powerup-display-container';

    powerUpContainer.setContent('<div id="powerup-items"></div>').enable();

    // Start updating
    this.updateInterval = window.setInterval(
      () => this.update(),
      ANIMATION_CONFIG.durations.fast
    );
  }

  private update(): void {
    const player = this.game.getPlayer();
    const activePowerUps = player.getActivePowerUps();
    const itemsContainer = document.getElementById('powerup-items');

    if (!itemsContainer) return;

    // Remove power-ups that are no longer active
    for (const powerUpId of this.activePowerUpIds) {
      const [type] = powerUpId.split('-');
      if (!activePowerUps.has(type)) {
        this.floatingUI.remove(powerUpId);
        this.activePowerUpIds.delete(powerUpId);
      }
    }

    // Update or create elements for active power-ups
    let index = 0;
    activePowerUps.forEach((duration, type) => {
      const powerUpId = `powerup-${type}-${index}`;

      if (!this.activePowerUpIds.has(powerUpId)) {
        // Create new power-up element
        this.createPowerUpElement(type, powerUpId, index);
        this.activePowerUpIds.add(powerUpId);
      }

      // Update the content
      this.updatePowerUpElement(powerUpId, type, duration);
      index++;
    });
  }

  private createPowerUpElement(_type: string, powerUpId: string, index: number): void {
    const powerUpElement = this.floatingUI.create(powerUpId, 'custom', {
      persistent: true,
      autoHide: false,
      smoothing: 0,
      className: 'powerup-item'
    });

    // Position relative to the main container
    const topOffset = UI_CONSTANTS.powerUpDisplay.position.top + (index * 40);

    const element = powerUpElement.getElement();
    element.className = 'powerup-item';
    element.style.top = `${topOffset}px`;

    powerUpElement.enable();
  }

  private updatePowerUpElement(powerUpId: string, type: string, duration: number): void {
    const element = this.floatingUI.get(powerUpId);
    if (!element) return;

    const remainingTime = Math.ceil(duration / 1000);
    const icon = createSvgIcon(this.getPowerUpIcon(type), { size: 20 });
    const name = this.getPowerUpName(type);

    // Color state is handled by CSS classes

    element.setContent(`
      <div class="powerup-item-content">
        ${icon}
        <span class="powerup-item-name">${name}</span>
        <span class="powerup-item-timer">${remainingTime}s</span>
      </div>
    `);

    // Update state classes
    const elementNode = element.getElement();
    elementNode.classList.remove('warning', 'critical');
    if (remainingTime <= 3) {
      elementNode.classList.add('critical');
    } else if (remainingTime <= 10) {
      elementNode.classList.add('warning');
    }
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

  /**
   * Show a power-up collection notification
   */
  public showPowerUpNotification(type: string, duration: number): void {
    const notificationId = `powerup-notification-${Date.now()}`;
    const notification = this.floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0.1,
      className: 'powerup-notification'
    });

    const icon = createSvgIcon(this.getPowerUpIcon(type), { size: 24 });
    const name = this.getPowerUpName(type);

    const element = notification.getElement();
    element.className = 'powerup-notification';

    // Animation is now handled in CSS

    notification.setContent(`
      <div class="powerup-notification-content">
        ${icon}
        <div class="powerup-notification-info">
          <div class="powerup-notification-name">${name}</div>
          <div class="powerup-notification-duration">${Math.ceil(duration / 1000)}s duration</div>
        </div>
      </div>
    `);

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
      className: 'item-pickup-notification'
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
    element.className = 'item-pickup-notification';

    // Animation is now handled in CSS

    const icon = getItemIcon(itemType);
    notification.setContent(`
      ${icon}
      <span>${itemName} added to inventory</span>
    `);

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
      className: 'inventory-full-notification'
    });

    const element = notification.getElement();
    element.className = 'inventory-full-notification';

    const warningIcon = createSvgIcon(IconType.WARNING, { size: 24 });
    notification.setContent(`
      ${warningIcon}
      <span>Inventory full! ${itemName} used immediately</span>
    `);

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

    // Clean up all power-up elements
    for (const powerUpId of this.activePowerUpIds) {
      this.floatingUI.remove(powerUpId);
    }
    this.activePowerUpIds.clear();

    // Remove main container
    this.floatingUI.remove('powerup-display');
  }
}
