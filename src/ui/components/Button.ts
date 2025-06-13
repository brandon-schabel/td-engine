/**
 * Touch-optimized Button component
 * Supports multiple variants, sizes, and states
 */

import { Component, styleSystem, InputSystem } from '../core';
import type { ButtonProps, ComponentState, UnifiedPointerEvent } from '../core/types';

interface ButtonState extends ComponentState {
  isPressed: boolean;
  isFocused: boolean;
  isHovered: boolean;
}

export class Button extends Component<ButtonProps, ButtonState> {
  private inputSystem: InputSystem | null = null;
  private ripples: Ripple[] = [];

  protected getInitialState(): ButtonState {
    return {
      isPressed: false,
      isFocused: false,
      isHovered: false,
    };
  }

  protected render(): HTMLElement {
    const {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
    } = this.props;

    // Create button element
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = disabled || loading;
    
    // Set ARIA attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-disabled', String(disabled || loading));
    if (loading) {
      button.setAttribute('aria-busy', 'true');
    }

    // Build content
    const content: HTMLElement[] = [];

    // Loading spinner
    if (loading) {
      const spinner = this.createSpinner();
      content.push(spinner);
    }

    // Icon
    if (icon && !loading) {
      const iconEl = this.createIcon(icon);
      if (iconPosition === 'left') {
        content.push(iconEl);
      }
    }

    // Text content
    if (children) {
      const text = document.createElement('span');
      text.className = 'button-text';
      text.textContent = children;
      content.push(text);
    }

    // Right icon
    if (icon && !loading && iconPosition === 'right') {
      const iconEl = this.createIcon(icon);
      content.push(iconEl);
    }

    // Ripple container
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'button-ripple-container';
    button.appendChild(rippleContainer);

    // Add content to button
    content.forEach(el => button.appendChild(el));

    return button;
  }

  protected onMount(): void {
    if (!this.element) return;

    // Setup input system for touch handling
    this.inputSystem = new InputSystem({
      element: this.element,
      preventDefault: true,
      stopPropagation: false,
    });

    // Handle pointer events
    this.inputSystem.on('pointerdown', this.handlePointerDown);
    this.inputSystem.on('pointerup', this.handlePointerUp);
    this.inputSystem.on('tap', this.handleTap);

    // Handle keyboard events
    this.element.addEventListener('focus', this.handleFocus);
    this.element.addEventListener('blur', this.handleBlur);
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('keyup', this.handleKeyUp);

    // Handle mouse hover (for desktop)
    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  protected onUnmount(): void {
    if (this.inputSystem) {
      this.inputSystem.destroy();
      this.inputSystem = null;
    }

    if (this.element) {
      this.element.removeEventListener('focus', this.handleFocus);
      this.element.removeEventListener('blur', this.handleBlur);
      this.element.removeEventListener('keydown', this.handleKeyDown);
      this.element.removeEventListener('keyup', this.handleKeyUp);
      this.element.removeEventListener('mouseenter', this.handleMouseEnter);
      this.element.removeEventListener('mouseleave', this.handleMouseLeave);
    }
  }

  protected getStyles() {
    const theme = styleSystem.getTheme();
    const { variant = 'primary', size = 'md', fullWidth = false, disabled = false } = this.props;
    const { isPressed, isHovered } = this.state;

    // Base styles
    const baseStyles = {
      position: 'relative' as const,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      border: 'none',
      borderRadius: theme.borderRadius.md,
      fontFamily: theme.typography.fontFamily,
      fontWeight: String(theme.typography.fontWeight.semibold),
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none' as const,
      touchAction: 'manipulation' as const,
      WebkitTapHighlightColor: 'transparent',
      transition: `all ${theme.transitions.fast} ${theme.transitions.easing.easeInOut}`,
      overflow: 'hidden',
      outline: 'none',
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? '0.5' : '1',
      transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    };

    // Size styles
    const sizeStyles = {
      xs: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        fontSize: theme.typography.fontSize.xs,
        minHeight: '32px',
      },
      sm: {
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        fontSize: theme.typography.fontSize.sm,
        minHeight: '36px',
      },
      md: {
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.md,
        minHeight: '44px',
      },
      lg: {
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        fontSize: theme.typography.fontSize.lg,
        minHeight: '52px',
      },
      xl: {
        padding: `${theme.spacing.lg} ${theme.spacing.xxl}`,
        fontSize: theme.typography.fontSize.xl,
        minHeight: '60px',
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: isHovered ? theme.colors.primaryLight : theme.colors.primary,
        color: theme.colors.primaryText,
        boxShadow: theme.shadows.sm,
      },
      secondary: {
        backgroundColor: isHovered ? theme.colors.secondaryLight : theme.colors.secondary,
        color: theme.colors.secondaryText,
        boxShadow: theme.shadows.sm,
      },
      success: {
        backgroundColor: isHovered ? theme.colors.success : theme.colors.success,
        color: '#FFFFFF',
        boxShadow: theme.shadows.sm,
      },
      warning: {
        backgroundColor: isHovered ? theme.colors.warning : theme.colors.warning,
        color: '#000000',
        boxShadow: theme.shadows.sm,
      },
      danger: {
        backgroundColor: isHovered ? theme.colors.error : theme.colors.error,
        color: '#FFFFFF',
        boxShadow: theme.shadows.sm,
      },
      ghost: {
        backgroundColor: isHovered ? theme.colors.surfaceAlt : 'transparent',
        color: theme.colors.primary,
        boxShadow: 'none',
      },
      link: {
        backgroundColor: 'transparent',
        color: theme.colors.primary,
        boxShadow: 'none',
        textDecoration: isHovered ? 'underline' : 'none',
        padding: '0',
        minHeight: 'auto',
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  }

  protected getClassNames(): string[] {
    const classes = super.getClassNames();
    const { variant = 'primary', size = 'md', fullWidth = false } = this.props;
    
    classes.push(
      `ui-button-${variant}`,
      `ui-button-${size}`,
      fullWidth ? 'ui-button-fullwidth' : ''
    );
    
    return classes.filter(Boolean);
  }

  private createSpinner(): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = 'button-spinner';
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: ui-spin 0.8s linear infinite;
    `;
    return spinner;
  }

  private createIcon(icon: string): HTMLElement {
    const iconEl = document.createElement('span');
    iconEl.className = 'button-icon';
    iconEl.textContent = icon;
    iconEl.style.fontSize = '1.2em';
    return iconEl;
  }

  private createRipple(x: number, y: number): void {
    if (!this.element || this.props.disabled) return;

    const rippleContainer = this.element.querySelector('.button-ripple-container') as HTMLElement;
    if (!rippleContainer) return;

    const ripple = document.createElement('div');
    ripple.className = 'button-ripple';
    
    const rect = this.element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    
    ripple.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-effect 0.6s ease-out;
      pointer-events: none;
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
    `;

    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
    
    if (!document.head.querySelector('[data-ripple-animation]')) {
      style.setAttribute('data-ripple-animation', 'true');
      document.head.appendChild(style);
    }

    rippleContainer.appendChild(ripple);
    
    // Clean up ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  private handlePointerDown = (event: UnifiedPointerEvent): void => {
    if (this.props.disabled || this.props.loading) return;
    
    this.setState({ isPressed: true });
    this.createRipple(event.x, event.y);
  };

  private handlePointerUp = (): void => {
    this.setState({ isPressed: false });
  };

  private handleTap = (): void => {
    if (this.props.disabled || this.props.loading) return;
    
    if (this.props.onClick) {
      // Create a synthetic unified pointer event for the click
      const event: UnifiedPointerEvent = {
        x: 0,
        y: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        identifier: 0,
        type: 'mouse',
        pressure: 0,
        isPrimary: true,
        button: 0,
        buttons: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        originalEvent: new MouseEvent('click'),
      };
      
      this.props.onClick(event);
    }
    
    this.emit('click');
  };

  private handleFocus = (): void => {
    this.setState({ isFocused: true });
  };

  private handleBlur = (): void => {
    this.setState({ isFocused: false });
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.setState({ isPressed: true });
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.setState({ isPressed: false });
      this.handleTap();
    }
  };

  private handleMouseEnter = (): void => {
    if (!('ontouchstart' in window)) {
      this.setState({ isHovered: true });
    }
  };

  private handleMouseLeave = (): void => {
    this.setState({ isHovered: false });
  };
}

interface Ripple {
  element: HTMLElement;
  timestamp: number;
}