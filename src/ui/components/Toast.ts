/**
 * Toast notification component
 * Displays temporary messages with auto-dismiss and actions
 */

import { Component, styleSystem } from '../core';
import type { ComponentProps, NotificationOptions, NotificationType } from '../core/types';
import { Button } from './Button';

export interface ToastProps extends ComponentProps {
  options: NotificationOptions;
  onDismiss?: () => void;
}

interface ToastState {
  isVisible: boolean;
  isLeaving: boolean;
}

export class Toast extends Component<ToastProps, ToastState> {
  private dismissTimer: NodeJS.Timeout | null = null;
  private progressBar: HTMLElement | null = null;
  private startTime: number = 0;
  private duration: number = 0;
  private animationFrame: number | null = null;

  protected getInitialState(): ToastState {
    return {
      isVisible: false,
      isLeaving: false,
    };
  }

  protected render(): HTMLElement {
    const { options } = this.props;
    
    const toast = document.createElement('div');
    toast.className = 'ui-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Icon
    const icon = this.createIcon(options.type);
    toast.appendChild(icon);

    // Content
    const content = document.createElement('div');
    content.className = 'ui-toast-content';
    
    // Message
    const message = document.createElement('div');
    message.className = 'ui-toast-message';
    message.textContent = options.message;
    content.appendChild(message);

    // Action button
    if (options.action) {
      const actionButton = new Button({
        variant: 'link',
        size: 'sm',
        children: options.action.label,
        onClick: () => {
          options.action!.handler();
          this.dismiss();
        },
      });
      
      const actionContainer = document.createElement('div');
      actionContainer.className = 'ui-toast-action';
      actionButton.mount(actionContainer);
      content.appendChild(actionContainer);
    }

    toast.appendChild(content);

    // Dismiss button
    if (options.dismissible !== false) {
      const dismissButton = document.createElement('button');
      dismissButton.className = 'ui-toast-dismiss';
      dismissButton.setAttribute('aria-label', 'Dismiss notification');
      dismissButton.innerHTML = '✕';
      dismissButton.addEventListener('click', () => this.dismiss());
      toast.appendChild(dismissButton);
    }

    // Progress bar
    if (options.duration && options.duration > 0) {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'ui-toast-progress';
      toast.appendChild(this.progressBar);
    }

    return toast;
  }

  protected onMount(): void {
    // Show toast with animation
    requestAnimationFrame(() => {
      this.setState({ isVisible: true });
    });

    // Setup auto-dismiss
    const duration = this.props.options.duration ?? 5000;
    this.duration = duration;
    
    if (duration > 0) {
      this.startTime = Date.now();
      this.dismissTimer = setTimeout(() => this.dismiss(), duration);
      this.updateProgress();
    }

    // Setup swipe to dismiss on touch devices
    if ('ontouchstart' in window) {
      this.setupSwipeGesture();
    }
  }

  protected onUnmount(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  protected getStyles() {
    const theme = styleSystem.getTheme();
    const { options } = this.props;
    const { isVisible, isLeaving } = this.state;

    const typeColors: Record<NotificationType, { bg: string; text: string; icon: string }> = {
      info: {
        bg: theme.colors.info,
        text: theme.colors.primaryText,
        icon: theme.colors.primaryText,
      },
      success: {
        bg: theme.colors.success,
        text: theme.colors.primaryText,
        icon: theme.colors.primaryText,
      },
      warning: {
        bg: theme.colors.warning,
        text: '#000000',
        icon: '#000000',
      },
      error: {
        bg: theme.colors.error,
        text: theme.colors.primaryText,
        icon: theme.colors.primaryText,
      },
    };

    const colors = typeColors[options.type];

    const baseStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      minWidth: '300px',
      maxWidth: '500px',
      padding: theme.spacing.md,
      backgroundColor: colors.bg,
      color: colors.text,
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.lg,
      position: 'relative' as const,
      overflow: 'hidden',
      transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(120%)',
      opacity: isVisible && !isLeaving ? '1' : '0',
      transition: `all ${theme.transitions.normal} ${theme.transitions.easing.easeInOut}`,
      cursor: 'default',
      userSelect: 'none' as const,
    };

    return baseStyles;
  }

  protected applyStyles(): void {
    super.applyStyles();
    
    const theme = styleSystem.getTheme();
    const { options } = this.props;

    // Style icon
    const icon = this.element?.querySelector('.ui-toast-icon') as HTMLElement;
    if (icon) {
      Object.assign(icon.style, {
        fontSize: '20px',
        lineHeight: '1',
        flexShrink: '0',
      });
    }

    // Style content
    const content = this.element?.querySelector('.ui-toast-content') as HTMLElement;
    if (content) {
      Object.assign(content.style, {
        flex: '1',
        minWidth: '0',
      });
    }

    // Style message
    const message = this.element?.querySelector('.ui-toast-message') as HTMLElement;
    if (message) {
      Object.assign(message.style, {
        fontSize: theme.typography.fontSize.md,
        lineHeight: String(theme.typography.lineHeight.normal),
        wordBreak: 'break-word',
      });
    }

    // Style action
    const action = this.element?.querySelector('.ui-toast-action') as HTMLElement;
    if (action) {
      Object.assign(action.style, {
        marginTop: theme.spacing.xs,
      });
    }

    // Style dismiss button
    const dismiss = this.element?.querySelector('.ui-toast-dismiss') as HTMLElement;
    if (dismiss) {
      const typeColors: Record<NotificationType, string> = {
        info: theme.colors.primaryText,
        success: theme.colors.primaryText,
        warning: '#000000',
        error: theme.colors.primaryText,
      };

      Object.assign(dismiss.style, {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        background: 'none',
        border: 'none',
        color: typeColors[options.type],
        fontSize: '16px',
        lineHeight: '1',
        cursor: 'pointer',
        opacity: '0.7',
        transition: `opacity ${theme.transitions.fast}`,
        padding: theme.spacing.xs,
      });

      dismiss.addEventListener('mouseenter', () => {
        dismiss.style.opacity = '1';
      });

      dismiss.addEventListener('mouseleave', () => {
        dismiss.style.opacity = '0.7';
      });
    }

    // Style progress bar
    if (this.progressBar) {
      Object.assign(this.progressBar.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        transition: 'none',
        transformOrigin: 'left',
      });
    }
  }

  private createIcon(type: NotificationType): HTMLElement {
    const icons: Record<NotificationType, string> = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕',
    };

    const icon = document.createElement('div');
    icon.className = 'ui-toast-icon';
    icon.textContent = this.props.options.icon || icons[type];
    
    return icon;
  }

  private dismiss(): void {
    if (this.state.isLeaving) return;

    this.setState({ isLeaving: true });
    
    setTimeout(() => {
      if (this.props.onDismiss) {
        this.props.onDismiss();
      }
      this.emit('dismiss');
    }, 250);
  }

  private updateProgress = (): void => {
    if (!this.progressBar || this.duration <= 0) return;

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    this.progressBar.style.transform = `scaleX(${1 - progress})`;
    
    if (progress < 1 && !this.state.isLeaving) {
      this.animationFrame = requestAnimationFrame(this.updateProgress);
    }
  };

  private setupSwipeGesture(): void {
    if (!this.element) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      
      if (this.element) {
        this.element.style.transition = 'none';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !this.element) return;
      
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      
      // Only allow swiping to the right
      if (deltaX > 0) {
        this.element.style.transform = `translateX(${deltaX}px)`;
        this.element.style.opacity = String(1 - deltaX / 200);
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging || !this.element) return;
      
      isDragging = false;
      const deltaX = currentX - startX;
      
      // Dismiss if swiped more than 100px
      if (deltaX > 100) {
        this.dismiss();
      } else {
        // Snap back
        const theme = styleSystem.getTheme();
        this.element.style.transition = `all ${theme.transitions.normal} ${theme.transitions.easing.easeInOut}`;
        this.element.style.transform = 'translateX(0)';
        this.element.style.opacity = '1';
      }
    };

    this.element.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.element.addEventListener('touchmove', handleTouchMove, { passive: true });
    this.element.addEventListener('touchend', handleTouchEnd);
  }
}

/**
 * Toast container for managing multiple toasts
 */
export class ToastContainer extends Component<ComponentProps> {
  private toasts: Map<string, Toast> = new Map();
  private static instance: ToastContainer | null = null;

  protected getInitialState() {
    return {};
  }

  protected render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ui-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    
    return container;
  }

  protected getStyles() {
    const theme = styleSystem.getTheme();
    const position = 'top-right'; // Default position

    const positions = {
      'top': { top: theme.spacing.lg, left: '50%', transform: 'translateX(-50%)' },
      'bottom': { bottom: theme.spacing.lg, left: '50%', transform: 'translateX(-50%)' },
      'top-left': { top: theme.spacing.lg, left: theme.spacing.lg },
      'top-right': { top: theme.spacing.lg, right: theme.spacing.lg },
      'bottom-left': { bottom: theme.spacing.lg, left: theme.spacing.lg },
      'bottom-right': { bottom: theme.spacing.lg, right: theme.spacing.lg },
    };

    return {
      position: 'fixed' as const,
      zIndex: String(theme.zIndex.notification),
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.spacing.md,
      pointerEvents: 'none' as const,
      ...positions[position],
    };
  }

  /**
   * Show a toast notification
   */
  show(options: NotificationOptions): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast = new Toast({
      id,
      options,
      onDismiss: () => this.remove(id),
    });

    // Add pointer events to toast
    const toastWrapper = document.createElement('div');
    toastWrapper.style.pointerEvents = 'auto';
    toast.mount(toastWrapper);
    
    this.element?.appendChild(toastWrapper);
    this.toasts.set(id, toast);
    
    return id;
  }

  /**
   * Remove a toast
   */
  remove(id: string): void {
    const toast = this.toasts.get(id);
    if (toast) {
      const wrapper = toast.getElement()?.parentElement;
      toast.destroy();
      wrapper?.remove();
      this.toasts.delete(id);
    }
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts.forEach((_, id) => this.remove(id));
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ToastContainer {
    if (!ToastContainer.instance) {
      ToastContainer.instance = new ToastContainer({});
      ToastContainer.instance.mount(document.body);
    }
    return ToastContainer.instance;
  }
}

// Convenience function for showing toasts
export const toast = {
  show: (options: NotificationOptions) => ToastContainer.getInstance().show(options),
  info: (message: string, options?: Partial<NotificationOptions>) => 
    ToastContainer.getInstance().show({ ...options, type: 'info', message }),
  success: (message: string, options?: Partial<NotificationOptions>) => 
    ToastContainer.getInstance().show({ ...options, type: 'success', message }),
  warning: (message: string, options?: Partial<NotificationOptions>) => 
    ToastContainer.getInstance().show({ ...options, type: 'warning', message }),
  error: (message: string, options?: Partial<NotificationOptions>) => 
    ToastContainer.getInstance().show({ ...options, type: 'error', message }),
  clear: () => ToastContainer.getInstance().clear(),
};