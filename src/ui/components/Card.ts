/**
 * Card component for content containers
 * Supports different variants and interactive states
 */

import { Component, styleSystem } from '../core';
import type { ComponentProps, ComponentState } from '../core/types';

export interface CardProps extends ComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  header?: string | HTMLElement;
  footer?: string | HTMLElement;
}

interface CardState extends ComponentState {
  isHovered: boolean;
  isPressed: boolean;
}

export class Card extends Component<CardProps, CardState> {
  protected getInitialState(): CardState {
    return {
      isHovered: false,
      isPressed: false,
    };
  }

  protected render(): HTMLElement {
    const { header, children, footer, interactive = false } = this.props;

    const card = document.createElement(interactive ? 'button' : 'div');
    card.className = 'ui-card';
    
    if (interactive && card instanceof HTMLButtonElement) {
      card.type = 'button';
      card.setAttribute('role', 'button');
    }

    // Header
    if (header) {
      const headerEl = document.createElement('div');
      headerEl.className = 'ui-card-header';
      
      if (typeof header === 'string') {
        headerEl.textContent = header;
      } else {
        headerEl.appendChild(header);
      }
      
      card.appendChild(headerEl);
    }

    // Body
    if (children) {
      const body = document.createElement('div');
      body.className = 'ui-card-body';
      
      if (typeof children === 'string') {
        body.textContent = children;
      } else if (children instanceof HTMLElement) {
        body.appendChild(children);
      } else if (Array.isArray(children)) {
        children.forEach(child => {
          if (child instanceof HTMLElement) {
            body.appendChild(child);
          }
        });
      }
      
      card.appendChild(body);
    }

    // Footer
    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'ui-card-footer';
      
      if (typeof footer === 'string') {
        footerEl.textContent = footer;
      } else {
        footerEl.appendChild(footer);
      }
      
      card.appendChild(footerEl);
    }

    return card;
  }

  protected onMount(): void {
    if (!this.element || !this.props.interactive) return;

    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('click', this.handleClick);
    
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  protected onUnmount(): void {
    if (!this.element || !this.props.interactive) return;

    this.element.removeEventListener('mouseenter', this.handleMouseEnter);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }

  protected getStyles() {
    const theme = styleSystem.getTheme();
    const { variant = 'elevated', padding = 'md', interactive = false } = this.props;
    const { isHovered, isPressed } = this.state;

    const paddingMap = {
      none: '0',
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
    };

    const baseStyles = {
      display: 'block',
      width: '100%',
      borderRadius: theme.borderRadius.lg,
      transition: `all ${theme.transitions.normal} ${theme.transitions.easing.easeInOut}`,
      overflow: 'hidden',
      cursor: interactive ? 'pointer' : 'default',
      userSelect: interactive ? 'none' : 'auto',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      border: 'none',
      textAlign: 'left' as const,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
    };

    const variantStyles = {
      elevated: {
        backgroundColor: theme.colors.surface,
        boxShadow: isHovered ? theme.shadows.lg : theme.shadows.md,
      },
      outlined: {
        backgroundColor: 'transparent',
        border: `1px solid ${isHovered ? theme.colors.borderLight : theme.colors.border}`,
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: isHovered ? theme.colors.surfaceAlt : theme.colors.surface,
        boxShadow: 'none',
      },
    };

    // Apply padding to the card itself if no sections
    const hasSections = this.props.header || this.props.footer;
    const cardPadding = hasSections ? '0' : paddingMap[padding];

    return {
      ...baseStyles,
      ...variantStyles[variant],
      padding: cardPadding,
    };
  }

  protected applyStyles(): void {
    super.applyStyles();
    
    // Apply section styles
    const theme = styleSystem.getTheme();
    const { padding = 'md' } = this.props;
    
    const paddingMap = {
      none: '0',
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
    };

    // Style header
    const header = this.element?.querySelector('.ui-card-header') as HTMLElement;
    if (header) {
      Object.assign(header.style, {
        padding: paddingMap[padding],
        borderBottom: `1px solid ${theme.colors.border}`,
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      });
    }

    // Style body
    const body = this.element?.querySelector('.ui-card-body') as HTMLElement;
    if (body) {
      Object.assign(body.style, {
        padding: paddingMap[padding],
      });
    }

    // Style footer
    const footer = this.element?.querySelector('.ui-card-footer') as HTMLElement;
    if (footer) {
      Object.assign(footer.style, {
        padding: paddingMap[padding],
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
      });
    }
  }

  private handleMouseEnter = (): void => {
    if (!('ontouchstart' in window)) {
      this.setState({ isHovered: true });
    }
  };

  private handleMouseLeave = (): void => {
    this.setState({ isHovered: false, isPressed: false });
  };

  private handleMouseDown = (): void => {
    this.setState({ isPressed: true });
  };

  private handleMouseUp = (): void => {
    this.setState({ isPressed: false });
  };

  private handleTouchStart = (): void => {
    this.setState({ isPressed: true });
  };

  private handleTouchEnd = (): void => {
    this.setState({ isPressed: false });
  };

  private handleClick = (): void => {
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.emit('click');
  };
}