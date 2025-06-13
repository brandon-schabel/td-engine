/**
 * TouchButton Component
 * Enhanced button with touch-optimized interactions and haptic feedback
 */

import { Component } from '../core/Component';
import type { ComponentProps, ComponentState } from '../core/types';
import { StyleSystem } from '../core/StyleSystem';

export interface TouchButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rectangle' | 'rounded' | 'circle' | 'square';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  ripple?: boolean;
  hapticFeedback?: boolean | 'light' | 'medium' | 'heavy';
  pressScale?: number;
  pressTimeout?: number;
  onPress?: (event: Event) => void;
  onLongPress?: (event: Event) => void;
  onHover?: (event: Event) => void;
  onFocus?: (event: Event) => void;
  onBlur?: (event: Event) => void;
}

export interface TouchButtonState extends ComponentState {
  isPressed: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isLoading: boolean;
  pressStartTime: number;
  ripples: Array<{ id: number; x: number; y: number; timestamp: number }>;
}

/**
 * TouchButton - Touch-optimized button with haptic feedback and visual effects
 */
export class TouchButton extends Component<TouchButtonProps, TouchButtonState> {
  private pressTimer: NodeJS.Timeout | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  private rippleCounter: number = 0;
  
  protected getDefaultProps(): Partial<TouchButtonProps> {
    return {
      variant: 'primary',
      size: 'md',
      shape: 'rounded',
      disabled: false,
      loading: false,
      iconPosition: 'left',
      ripple: true,
      hapticFeedback: 'medium',
      pressScale: 0.95,
      pressTimeout: 500
    };
  }

  protected getInitialState(): TouchButtonState {
    return {
      isPressed: false,
      isHovered: false,
      isFocused: false,
      isLoading: false,
      pressStartTime: 0,
      ripples: []
    };
  }

  protected render(): string {
    const { children, icon, iconPosition, loading, disabled } = this.mergedProps;
    const { isPressed, isLoading } = this.state;
    
    const styles = this.getButtonStyles();
    const iconHtml = this.renderIcon();
    const rippleHtml = this.renderRipples();
    const loadingHtml = (loading || isLoading) ? this.renderLoadingSpinner() : '';
    
    const content = this.arrangeContent(iconHtml, children, loadingHtml);
    
    return `
      <button 
        class="${styles.button}" 
        ${disabled ? 'disabled' : ''}
        ${this.getAriaAttributes()}
        data-touch-button="true"
      >
        ${rippleHtml}
        <span class="${styles.content}">
          ${content}
        </span>
      </button>
    `;
  }

  private getButtonStyles() {
    const { variant, size, shape, disabled, pressScale } = this.mergedProps;
    const { isPressed, isHovered, isFocused } = this.state;
    const theme = StyleSystem.getInstance().getTheme();
    
    // Size configurations
    const sizeConfig = {
      sm: {
        height: '36px',
        minWidth: theme.touch.minTargetSize,
        padding: '0 12px',
        fontSize: theme.typography.fontSize.sm,
        iconSize: '16px'
      },
      md: {
        height: theme.touch.recommendedTargetSize,
        minWidth: theme.touch.recommendedTargetSize,
        padding: '0 16px',
        fontSize: theme.typography.fontSize.md,
        iconSize: '20px'
      },
      lg: {
        height: theme.touch.comfortableTargetSize,
        minWidth: theme.touch.comfortableTargetSize,
        padding: '0 24px',
        fontSize: theme.typography.fontSize.lg,
        iconSize: '24px'
      },
      xl: {
        height: '64px',
        minWidth: '64px',
        padding: '0 32px',
        fontSize: theme.typography.fontSize.xl,
        iconSize: '28px'
      }
    };
    
    // Variant configurations
    const variantConfig = {
      primary: {
        background: theme.colors.primary,
        color: theme.colors.primaryText,
        border: `2px solid ${theme.colors.primary}`,
        hoverBackground: theme.colors.primaryLight,
        activeBackground: theme.colors.primaryDark,
      },
      secondary: {
        background: theme.colors.secondary,
        color: theme.colors.secondaryText,
        border: `2px solid ${theme.colors.secondary}`,
        hoverBackground: theme.colors.secondaryLight,
        activeBackground: theme.colors.secondaryDark,
      },
      success: {
        background: theme.colors.success,
        color: theme.colors.primaryText,
        border: `2px solid ${theme.colors.success}`,
        hoverBackground: '#45a049',
        activeBackground: '#3d8b40',
      },
      warning: {
        background: theme.colors.warning,
        color: theme.colors.text,
        border: `2px solid ${theme.colors.warning}`,
        hoverBackground: '#e68900',
        activeBackground: '#cc7a00',
      },
      danger: {
        background: theme.colors.error,
        color: theme.colors.primaryText,
        border: `2px solid ${theme.colors.error}`,
        hoverBackground: '#e53e3e',
        activeBackground: '#c53030',
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.text,
        border: `2px solid ${theme.colors.border}`,
        hoverBackground: theme.colors.surface,
        activeBackground: theme.colors.surfaceAlt,
      },
      link: {
        background: 'transparent',
        color: theme.colors.primary,
        border: '2px solid transparent',
        hoverBackground: 'transparent',
        activeBackground: 'transparent',
      }
    };
    
    const sizeStyles = sizeConfig[size!];
    const variantStyles = variantConfig[variant!];
    
    // Shape styles
    const borderRadius = shape === 'circle' || shape === 'square' ? '50%' :
                        shape === 'rounded' ? theme.borderRadius.lg : 
                        theme.borderRadius.sm;
    
    const baseStyles = {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: sizeStyles.height,
      minWidth: sizeStyles.minWidth,
      padding: shape === 'circle' || shape === 'square' ? '0' : sizeStyles.padding,
      fontSize: sizeStyles.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      fontFamily: theme.typography.fontFamily,
      background: variantStyles.background,
      color: variantStyles.color,
      border: variantStyles.border,
      borderRadius,
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      touchAction: 'manipulation',
      transition: `all ${theme.transitions.fast} ${theme.transitions.easing.easeOut}`,
      overflow: 'hidden',
      textDecoration: 'none',
      boxShadow: variant === 'link' ? 'none' : theme.shadows.sm,
      
      // Touch-specific styles
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      
      // States
      ...(isHovered && !disabled && {
        background: variantStyles.hoverBackground,
        transform: 'translateY(-1px)',
        boxShadow: variant === 'link' ? 'none' : theme.shadows.md,
      }),
      
      ...(isPressed && !disabled && {
        transform: `scale(${pressScale}) translateY(0px)`,
        background: variantStyles.activeBackground,
        boxShadow: variant === 'link' ? 'none' : theme.shadows.inner,
      }),
      
      ...(isFocused && {
        boxShadow: `${theme.shadows.sm}, ${theme.touch.states.focus.outline}`,
      }),
      
      ...(disabled && {
        opacity: theme.touch.states.disabled.opacity,
        cursor: theme.touch.states.disabled.cursor,
        transform: 'none',
      }),
      
      // Responsive adjustments
      '@media (max-width: 768px)': {
        fontSize: theme.responsive.mobile.fontSize[size! === 'xl' ? 'lg' : size!],
        minHeight: theme.touch.recommendedTargetSize,
      },
      
      // Accessibility
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        transform: 'none',
      },
    };
    
    return StyleSystem.getInstance().createStyles({
      button: baseStyles,
      content: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'relative',
        zIndex: 1,
      },
      ripple: {
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.6)',
        transform: 'scale(0)',
        animation: `ripple 600ms ${theme.transitions.easing.easeOut}`,
        pointerEvents: 'none',
        zIndex: 0,
      },
      loadingSpinner: {
        width: sizeStyles.iconSize,
        height: sizeStyles.iconSize,
        border: `2px solid ${variantStyles.color}`,
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      },
      icon: {
        fontSize: sizeStyles.iconSize,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    });
  }

  private renderIcon(): string {
    const { icon } = this.mergedProps;
    if (!icon) return '';
    
    const styles = this.getButtonStyles();
    return `<span class="${styles.icon}">${icon}</span>`;
  }

  private renderLoadingSpinner(): string {
    const styles = this.getButtonStyles();
    return `<div class="${styles.loadingSpinner}"></div>`;
  }

  private renderRipples(): string {
    const { ripple } = this.mergedProps;
    const { ripples } = this.state;
    
    if (!ripple || ripples.length === 0) return '';
    
    const styles = this.getButtonStyles();
    
    return ripples.map(ripple => `
      <span 
        class="${styles.ripple}" 
        style="left: ${ripple.x}px; top: ${ripple.y}px;"
        data-ripple-id="${ripple.id}"
      ></span>
    `).join('');
  }

  private arrangeContent(icon: string, children: any, loading: string): string {
    const { iconPosition, loading: isLoadingProp } = this.mergedProps;
    
    if (isLoadingProp && loading) {
      return loading;
    }
    
    if (!icon) {
      return typeof children === 'string' ? children : '';
    }
    
    const text = typeof children === 'string' ? children : '';
    
    switch (iconPosition) {
      case 'left':
        return `${icon}${text ? ` ${text}` : ''}`;
      case 'right':
        return `${text ? `${text} ` : ''}${icon}`;
      case 'top':
        return `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">${icon}${text ? `<span>${text}</span>` : ''}</div>`;
      case 'bottom':
        return `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">${text ? `<span>${text}</span>` : ''}${icon}</div>`;
      default:
        return `${icon}${text ? ` ${text}` : ''}`;
    }
  }

  private getAriaAttributes(): string {
    const { disabled, loading } = this.mergedProps;
    return [
      'role="button"',
      'tabindex="0"',
      disabled ? 'aria-disabled="true"' : '',
      loading ? 'aria-busy="true"' : '',
    ].filter(Boolean).join(' ');
  }

  protected afterMount(): void {
    this.setupEventListeners();
    this.addCSSAnimations();
  }

  private setupEventListeners(): void {
    if (!this.element) return;
    
    const button = this.element.querySelector('button');
    if (!button) return;
    
    // Touch and pointer events
    button.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    button.addEventListener('pointerup', this.handlePointerUp.bind(this));
    button.addEventListener('pointerleave', this.handlePointerLeave.bind(this));
    button.addEventListener('pointerenter', this.handlePointerEnter.bind(this));
    
    // Mouse events (fallback)
    button.addEventListener('mousedown', this.handleMouseDown.bind(this));
    button.addEventListener('mouseup', this.handleMouseUp.bind(this));
    button.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    button.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Touch events
    button.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    button.addEventListener('touchend', this.handleTouchEnd.bind(this));
    button.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Keyboard events
    button.addEventListener('keydown', this.handleKeyDown.bind(this));
    button.addEventListener('focus', this.handleFocus.bind(this));
    button.addEventListener('blur', this.handleBlur.bind(this));
    
    // Click event
    button.addEventListener('click', this.handleClick.bind(this));
  }

  private handlePointerDown(event: PointerEvent): void {
    this.startPress(event);
  }

  private handlePointerUp(event: PointerEvent): void {
    this.endPress(event);
  }

  private handlePointerEnter(event: PointerEvent): void {
    this.setState({ isHovered: true });
    this.mergedProps.onHover?.(event);
  }

  private handlePointerLeave(event: PointerEvent): void {
    this.setState({ isHovered: false, isPressed: false });
    this.clearTimers();
  }

  private handleMouseDown(event: MouseEvent): void {
    this.startPress(event);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.endPress(event);
  }

  private handleMouseEnter(event: MouseEvent): void {
    this.setState({ isHovered: true });
    this.mergedProps.onHover?.(event);
  }

  private handleMouseLeave(event: MouseEvent): void {
    this.setState({ isHovered: false, isPressed: false });
    this.clearTimers();
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault(); // Prevent 300ms delay
    this.startPress(event);
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.endPress(event);
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.setState({ isPressed: false });
    this.clearTimers();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.triggerPress(event);
    }
  }

  private handleFocus(event: FocusEvent): void {
    this.setState({ isFocused: true });
    this.mergedProps.onFocus?.(event);
  }

  private handleBlur(event: FocusEvent): void {
    this.setState({ isFocused: false, isPressed: false });
    this.mergedProps.onBlur?.(event);
    this.clearTimers();
  }

  private handleClick(event: MouseEvent): void {
    const { disabled, onPress } = this.mergedProps;
    if (disabled) return;
    
    onPress?.(event);
  }

  private startPress(event: Event): void {
    const { disabled, pressTimeout, ripple } = this.mergedProps;
    if (disabled) return;
    
    this.setState({ 
      isPressed: true, 
      pressStartTime: Date.now() 
    });
    
    // Create ripple effect
    if (ripple && event instanceof MouseEvent) {
      this.createRipple(event);
    }
    
    // Trigger haptic feedback
    this.triggerHapticFeedback();
    
    // Setup long press detection
    this.longPressTimer = setTimeout(() => {
      this.mergedProps.onLongPress?.(event);
      this.triggerHapticFeedback('heavy');
    }, pressTimeout);
  }

  private endPress(event: Event): void {
    this.setState({ isPressed: false });
    this.clearTimers();
  }

  private triggerPress(event: Event): void {
    const { disabled, onPress } = this.mergedProps;
    if (disabled) return;
    
    this.triggerHapticFeedback();
    onPress?.(event);
  }

  private createRipple(event: MouseEvent): void {
    const button = this.element?.querySelector('button');
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const rippleId = ++this.rippleCounter;
    
    this.setState({
      ripples: [...this.state.ripples, {
        id: rippleId,
        x,
        y,
        timestamp: Date.now()
      }]
    });
    
    // Remove ripple after animation
    setTimeout(() => {
      this.setState({
        ripples: this.state.ripples.filter(r => r.id !== rippleId)
      });
    }, 600);
  }

  private triggerHapticFeedback(intensity?: 'light' | 'medium' | 'heavy'): void {
    const { hapticFeedback } = this.mergedProps;
    if (!hapticFeedback || !navigator.vibrate) return;
    
    const theme = StyleSystem.getInstance().getTheme();
    const hapticIntensity = intensity || 
      (typeof hapticFeedback === 'string' ? hapticFeedback : 'medium');
    
    const pattern = theme.touch.haptics[hapticIntensity];
    navigator.vibrate(pattern);
  }

  private clearTimers(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private addCSSAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Public Methods
   */
  
  public setLoading(loading: boolean): void {
    this.setState({ isLoading: loading });
  }

  public trigger(): void {
    const event = new Event('click');
    this.triggerPress(event);
  }

  public focus(): void {
    const button = this.element?.querySelector('button');
    button?.focus();
  }

  public blur(): void {
    const button = this.element?.querySelector('button');
    button?.blur();
  }

  protected beforeUnmount(): void {
    this.clearTimers();
  }
}

/**
 * Utility function to create common button types
 */
export class TouchButtonFactory {
  /**
   * Create a primary action button
   */
  static createPrimaryButton(text: string, onPress: TouchButtonProps['onPress']): TouchButton {
    return new TouchButton({
      variant: 'primary',
      size: 'lg',
      children: text,
      onPress
    });
  }

  /**
   * Create an icon-only button
   */
  static createIconButton(icon: string, onPress: TouchButtonProps['onPress']): TouchButton {
    return new TouchButton({
      variant: 'ghost',
      shape: 'circle',
      size: 'md',
      icon,
      onPress
    });
  }

  /**
   * Create a floating action button
   */
  static createFloatingActionButton(icon: string, onPress: TouchButtonProps['onPress']): TouchButton {
    return new TouchButton({
      variant: 'primary',
      shape: 'circle',
      size: 'xl',
      icon,
      onPress,
      hapticFeedback: 'heavy'
    });
  }

  /**
   * Create a game control button
   */
  static createGameButton(icon: string, onPress: TouchButtonProps['onPress']): TouchButton {
    return new TouchButton({
      variant: 'secondary',
      shape: 'circle',
      size: 'lg',
      icon,
      onPress,
      hapticFeedback: 'medium',
      pressScale: 0.9
    });
  }
}