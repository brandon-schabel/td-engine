/**
 * NotificationPopup.ts - Floating notification system
 * Changes:
 * 1. Initial implementation for game notifications
 * 2. Multiple notification types (info, success, warning, error)
 * 3. Auto-dismiss with configurable duration
 * 4. Stack multiple notifications
 * 5. Animation support
 */

import { COLOR_THEME } from '@/config/ColorTheme';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REWARD = 'reward'
}

export interface NotificationOptions {
  type?: NotificationType;
  duration?: number;
  icon?: IconType;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animate?: boolean;
  sound?: boolean;
  stackOffset?: number;
  onClick?: () => void;
}

export class NotificationPopup {
  private element: HTMLElement;
  private options: Required<NotificationOptions>;
  private dismissTimer?: number;
  private static activeNotifications: NotificationPopup[] = [];
  private index: number = 0;
  private destroyed: boolean = false;

  constructor(
    message: string,
    options: NotificationOptions = {}
  ) {
    this.options = {
      type: NotificationType.INFO,
      duration: 3000,
      icon: this.getDefaultIcon(options.type || NotificationType.INFO),
      position: 'top',
      animate: true,
      sound: true,
      stackOffset: 60,
      onClick: () => {},
      ...options
    };

    this.element = this.createElement(message);
    this.index = NotificationPopup.activeNotifications.length;
    NotificationPopup.activeNotifications.push(this);
    
    this.show();
  }

  private getDefaultIcon(type: NotificationType): IconType {
    switch (type) {
      case NotificationType.SUCCESS:
        return IconType.CHECK;
      case NotificationType.WARNING:
        return IconType.WARNING;
      case NotificationType.ERROR:
        return IconType.CLOSE;
      case NotificationType.REWARD:
        return IconType.COIN;
      case NotificationType.INFO:
      default:
        return IconType.INFO;
    }
  }

  private createElement(message: string): HTMLElement {
    const element = document.createElement('div');
    element.className = `notification-popup notification-${this.options.type}`;
    
    const backgroundColor = this.getBackgroundColor();
    const borderColor = this.getBorderColor();
    const textColor = this.getTextColor();
    
    element.style.cssText = `
      position: fixed;
      ${this.getPositionStyles()}
      background: ${backgroundColor};
      border: 2px solid ${borderColor};
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: ${UI_CONSTANTS.zIndex.notification || 2000};
      opacity: 0;
      transform: ${this.getInitialTransform()};
      transition: all ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      cursor: ${this.options.onClick ? 'pointer' : 'default'};
      user-select: none;
      pointer-events: auto;
    `;

    // Icon
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      width: 24px;
      height: 24px;
      color: ${textColor};
      flex-shrink: 0;
    `;
    iconContainer.innerHTML = createSvgIcon(this.options.icon, { size: 24 });
    element.appendChild(iconContainer);

    // Message
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      flex: 1;
      color: ${textColor};
      font-size: 14px;
      font-weight: 500;
      font-family: Arial, sans-serif;
      line-height: 1.4;
    `;
    messageEl.textContent = message;
    element.appendChild(messageEl);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      color: ${textColor};
      opacity: 0.7;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
    `;
    closeButton.innerHTML = createSvgIcon(IconType.CLOSE, { size: 16 });
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss();
    });
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.7';
    });
    element.appendChild(closeButton);

    // Click handler
    if (this.options.onClick) {
      element.addEventListener('click', this.options.onClick);
    }

    return element;
  }

  private getPositionStyles(): string {
    const offset = 20;
    const stackOffset = this.index * this.options.stackOffset;
    
    switch (this.options.position) {
      case 'top':
        return `top: ${offset + stackOffset}px; left: 50%; transform: translateX(-50%);`;
      case 'bottom':
        return `bottom: ${offset + stackOffset}px; left: 50%; transform: translateX(-50%);`;
      case 'top-right':
        return `top: ${offset + stackOffset}px; right: ${offset}px;`;
      case 'top-left':
        return `top: ${offset + stackOffset}px; left: ${offset}px;`;
      case 'bottom-right':
        return `bottom: ${offset + stackOffset}px; right: ${offset}px;`;
      case 'bottom-left':
        return `bottom: ${offset + stackOffset}px; left: ${offset}px;`;
      default:
        return `top: ${offset + stackOffset}px; left: 50%; transform: translateX(-50%);`;
    }
  }

  private getInitialTransform(): string {
    if (this.options.position.includes('top')) {
      return 'translateY(-20px)';
    } else {
      return 'translateY(20px)';
    }
  }

  private getBackgroundColor(): string {
    switch (this.options.type) {
      case NotificationType.SUCCESS:
        return COLOR_THEME.ui.background.success + 'f0';
      case NotificationType.WARNING:
        return COLOR_THEME.ui.background.warning + 'f0';
      case NotificationType.ERROR:
        return COLOR_THEME.ui.background.danger + 'f0';
      case NotificationType.REWARD:
        return COLOR_THEME.ui.background.secondary + 'f0';
      case NotificationType.INFO:
      default:
        return COLOR_THEME.ui.background.secondary + 'f0';
    }
  }

  private getBorderColor(): string {
    switch (this.options.type) {
      case NotificationType.SUCCESS:
        return COLOR_THEME.ui.text.success;
      case NotificationType.WARNING:
        return COLOR_THEME.ui.currency;
      case NotificationType.ERROR:
        return COLOR_THEME.ui.text.danger;
      case NotificationType.REWARD:
        return COLOR_THEME.ui.currency;
      case NotificationType.INFO:
      default:
        return COLOR_THEME.ui.border.default;
    }
  }

  private getTextColor(): string {
    switch (this.options.type) {
      case NotificationType.SUCCESS:
        return COLOR_THEME.ui.text.success;
      case NotificationType.WARNING:
        return COLOR_THEME.ui.text.primary;
      case NotificationType.ERROR:
        return COLOR_THEME.ui.text.danger;
      case NotificationType.REWARD:
        return COLOR_THEME.ui.currency;
      case NotificationType.INFO:
      default:
        return COLOR_THEME.ui.text.primary;
    }
  }

  private show(): void {
    if (this.destroyed) return;
    
    document.body.appendChild(this.element);
    
    // Force layout
    void this.element.offsetHeight;
    
    // Animate in
    requestAnimationFrame(() => {
      this.element.style.opacity = '1';
      this.element.style.transform = this.element.style.transform.replace(/translateY\([^)]*\)/, 'translateY(0)');
    });

    // Auto dismiss
    if (this.options.duration > 0) {
      this.dismissTimer = window.setTimeout(() => {
        this.dismiss();
      }, this.options.duration);
    }
  }

  public dismiss(): void {
    if (this.destroyed) return;
    
    this.destroyed = true;
    
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
    
    // Animate out
    this.element.style.opacity = '0';
    this.element.style.transform = this.element.style.transform.replace(/translateY\([^)]*\)/, this.getInitialTransform());
    
    // Remove after animation
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Remove from active notifications
      const index = NotificationPopup.activeNotifications.indexOf(this);
      if (index > -1) {
        NotificationPopup.activeNotifications.splice(index, 1);
        
        // Update positions of remaining notifications
        NotificationPopup.updatePositions();
      }
    }, ANIMATION_CONFIG.durations.uiTransition);
  }

  private static updatePositions(): void {
    this.activeNotifications.forEach((notification, index) => {
      notification.index = index;
      const stackOffset = index * notification.options.stackOffset;
      
      // Update position based on type
      const position = notification.options.position;
      if (position.includes('top')) {
        notification.element.style.top = `${20 + stackOffset}px`;
      } else if (position.includes('bottom')) {
        notification.element.style.bottom = `${20 + stackOffset}px`;
      }
    });
  }

  /**
   * Static factory methods
   */
  public static info(message: string, options?: NotificationOptions): NotificationPopup {
    return new NotificationPopup(message, { ...options, type: NotificationType.INFO });
  }

  public static success(message: string, options?: NotificationOptions): NotificationPopup {
    return new NotificationPopup(message, { ...options, type: NotificationType.SUCCESS });
  }

  public static warning(message: string, options?: NotificationOptions): NotificationPopup {
    return new NotificationPopup(message, { ...options, type: NotificationType.WARNING });
  }

  public static error(message: string, options?: NotificationOptions): NotificationPopup {
    return new NotificationPopup(message, { ...options, type: NotificationType.ERROR });
  }

  public static reward(message: string, amount: number, options?: NotificationOptions): NotificationPopup {
    return new NotificationPopup(`${message} +${amount}`, { 
      ...options, 
      type: NotificationType.REWARD,
      icon: IconType.COIN
    });
  }

  /**
   * Clear all notifications
   */
  public static clearAll(): void {
    [...this.activeNotifications].forEach(notification => notification.dismiss());
  }
}