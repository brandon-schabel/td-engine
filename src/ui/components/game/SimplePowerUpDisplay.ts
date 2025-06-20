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
import { COLOR_THEME } from "@/config/ColorTheme";
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
    powerUpContainer.getElement().style.cssText = `
      position: fixed;
      top: ${UI_CONSTANTS.powerUpDisplay.position.top}px;
      right: ${UI_CONSTANTS.powerUpDisplay.position.right}px;
      display: flex;
      flex-direction: column;
      gap: ${UI_CONSTANTS.spacing.sm}px;
      pointer-events: none;
      z-index: 800;
    `;

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

    powerUpElement.getElement().style.cssText = `
      position: fixed;
      top: ${topOffset}px;
      right: ${UI_CONSTANTS.powerUpDisplay.position.right}px;
      background: ${COLOR_THEME.ui.background.overlay}e6;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      padding: 8px 12px;
      color: white;
      font-size: 14px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      pointer-events: none;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    powerUpElement.enable();
  }

  private updatePowerUpElement(powerUpId: string, type: string, duration: number): void {
    const element = this.floatingUI.get(powerUpId);
    if (!element) return;

    const remainingTime = Math.ceil(duration / 1000);
    const icon = createSvgIcon(this.getPowerUpIcon(type), { size: 20 });
    const name = this.getPowerUpName(type);

    // Update color based on remaining time
    let borderColor = '#4CAF50';
    let textColor = '#4CAF50';

    if (remainingTime <= 3) {
      borderColor = '#F44336';
      textColor = '#F44336';
    } else if (remainingTime <= 10) {
      borderColor = '#FF9800';
      textColor = '#FF9800';
    }

    element.setContent(`
      <div style="color: ${textColor}; display: flex; align-items: center; gap: 8px;">
        ${icon}
        <span>${name}</span>
        <span style="color: #FFD700; margin-left: auto; font-weight: bold;">${remainingTime}s</span>
      </div>
    `);

    // Update border color
    element.getElement().style.borderColor = borderColor;
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

    notification.getElement().style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #4CAF50, #45a049);
      border: 3px solid #fff;
      border-radius: 12px;
      padding: 16px 20px;
      color: white;
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
      animation: powerupNotification 2s ease-out forwards;
      z-index: 1500;
      pointer-events: none;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#powerup-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'powerup-notification-styles';
      style.textContent = `
        @keyframes powerupNotification {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          40% {
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -70%) scale(0.8);
          }
        }
      `;
      document.head.appendChild(style);
    }

    notification.setContent(`
      <div style="display: flex; align-items: center; gap: 12px;">
        ${icon}
        <div>
          <div style="font-size: 18px;">${name}</div>
          <div style="font-size: 14px; opacity: 0.9;">${Math.ceil(duration / 1000)}s duration</div>
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

    notification.getElement().style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #76C7C0, #4CAF50);
      border: 2px solid #fff;
      border-radius: 8px;
      padding: 12px 16px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
      animation: slideDownAndUp 3s ease-out forwards;
      z-index: 1500;
      pointer-events: none;
    `;

    // Add slide animation if not present
    if (!document.querySelector('#item-pickup-styles')) {
      const style = document.createElement('style');
      style.id = 'item-pickup-styles';
      style.textContent = `
        @keyframes slideDownAndUp {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          15%, 85% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
      `;
      document.head.appendChild(style);
    }

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

    notification.getElement().style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FF9800, #F57C00);
      border: 2px solid #fff;
      border-radius: 8px;
      padding: 12px 16px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
      animation: slideDownAndUp 4s ease-out forwards;
      z-index: 1500;
      pointer-events: none;
    `;

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
