import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface IconContainerProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconType | ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'default' | 'outlined' | 'filled' | 'ghost';
  shape?: 'square' | 'circle';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'muted';
  interactive?: boolean;
  badge?: string | number;
  badgeColor?: 'default' | 'primary' | 'danger' | 'success';
  tooltip?: string;
}

const sizeStyles = {
  xs: { container: 'w-6 h-6', icon: 14, rounded: 'rounded', badge: '-top-1 -right-1 text-xs min-w-[16px] h-[16px] px-0.5' },
  sm: { container: 'w-8 h-8', icon: 18, rounded: 'rounded', badge: '-top-1 -right-1 text-xs min-w-[18px] h-[18px] px-1' },
  md: { container: 'w-10 h-10', icon: 24, rounded: 'rounded-md', badge: '-top-1 -right-1 text-xs min-w-[20px] h-[20px] px-1' },
  lg: { container: 'w-12 h-12', icon: 28, rounded: 'rounded-lg', badge: '-top-2 -right-2 text-sm min-w-[22px] h-[22px] px-1.5' },
  xl: { container: 'w-16 h-16', icon: 36, rounded: 'rounded-lg', badge: '-top-2 -right-2 text-base min-w-[24px] h-[24px] px-2' },
};

const variantStyles = {
  default: 'border border-ui-border-subtle bg-ui-bg-secondary',
  outlined: 'border-2 bg-transparent',
  filled: 'border border-transparent',
  ghost: 'border border-transparent bg-transparent',
};

const colorStyles = {
  default: {
    icon: 'text-ui-text-primary',
    border: 'border-ui-border-subtle',
    bg: 'bg-ui-bg-secondary',
    filled: 'bg-ui-bg-secondary',
  },
  primary: {
    icon: 'text-button-primary',
    border: 'border-button-primary',
    bg: 'bg-button-primary text-white',
    filled: 'bg-button-primary text-white',
  },
  secondary: {
    icon: 'text-ui-text-secondary',
    border: 'border-ui-text-secondary',
    bg: 'bg-ui-bg-secondary text-ui-text-secondary',
    filled: 'bg-ui-bg-secondary text-ui-text-secondary',
  },
  success: {
    icon: 'text-success-DEFAULT',
    border: 'border-success-DEFAULT',
    bg: 'bg-success-DEFAULT text-white',
    filled: 'bg-success-DEFAULT text-white',
  },
  danger: {
    icon: 'text-danger-DEFAULT',
    border: 'border-danger-DEFAULT',
    bg: 'bg-danger-DEFAULT text-white',
    filled: 'bg-danger-DEFAULT text-white',
  },
  warning: {
    icon: 'text-warning-DEFAULT',
    border: 'border-warning-DEFAULT',
    bg: 'bg-warning-DEFAULT text-white',
    filled: 'bg-warning-DEFAULT text-white',
  },
  muted: {
    icon: 'text-ui-text-muted',
    border: 'border-ui-border-subtle',
    bg: 'bg-ui-bg-secondary text-ui-text-muted',
    filled: 'bg-ui-bg-secondary text-ui-text-muted',
  },
};

const badgeColorStyles = {
  default: 'bg-ui-text-primary text-ui-bg-primary',
  primary: 'bg-button-primary text-white',
  danger: 'bg-danger-DEFAULT text-white',
  success: 'bg-success-DEFAULT text-white',
};

export const IconContainer = forwardRef<HTMLDivElement, IconContainerProps>(
  (
    {
      className,
      icon,
      size = 'md',
      variant = 'default',
      shape = 'square',
      color = 'default',
      interactive = false,
      badge,
      badgeColor = 'default',
      tooltip,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const isInteractive = interactive || !!onClick;
    const sizeConfig = typeof size === 'number' ? null : sizeStyles[size];
    const colorConfig = colorStyles[color];

    const renderIcon = () => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return <span className={cn('icon-content', colorConfig.icon)}>{icon}</span>;
      }

      const iconSize = typeof size === 'number' ? Math.floor(size * 0.6) : sizeConfig!.icon;
      
      return (
        <span className={cn('icon-content', colorConfig.icon)}>
          <Icon type={icon as IconType} size={iconSize} />
        </span>
      );
    };

    const getVariantClasses = () => {
      const baseVariant = variantStyles[variant];
      
      if (variant === 'outlined') {
        return cn(baseVariant, colorConfig.border);
      }
      
      if (variant === 'filled') {
        return cn(baseVariant, colorConfig.filled);
      }
      
      return baseVariant;
    };

    const getSizeClasses = () => {
      if (typeof size === 'number') {
        return { width: size, height: size };
      }
      return undefined;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.(e as any);
      }
      onKeyDown?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'icon-container relative inline-flex items-center justify-center',
          sizeConfig?.container,
          shape === 'circle' ? 'rounded-full' : (sizeConfig?.rounded || 'rounded-md'),
          getVariantClasses(),
          isInteractive && [
            'cursor-pointer transition-all duration-200',
            variant === 'ghost' ? 'hover:bg-ui-bg-hover' : 'hover:scale-110 active:scale-95',
          ],
          className
        )}
        style={getSizeClasses()}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        title={tooltip}
        {...props}
      >
        {renderIcon()}
        
        {badge !== undefined && badge !== null && (
          <span
            className={cn(
              'absolute rounded-full flex items-center justify-center font-semibold',
              sizeConfig?.badge || '-top-1 -right-1 text-xs min-w-[18px] h-[18px] px-1',
              badgeColorStyles[badgeColor]
            )}
          >
            {badge}
          </span>
        )}
      </div>
    );
  }
);

IconContainer.displayName = 'IconContainer';

// Utility components
export const IconButton = forwardRef<HTMLDivElement, Omit<IconContainerProps, 'interactive' | 'variant'>>(
  ({ onClick, ...props }, ref) => (
    <IconContainer
      ref={ref}
      interactive
      variant="ghost"
      onClick={onClick}
      {...props}
    />
  )
);

IconButton.displayName = 'IconButton';

export const IconWithBadge = forwardRef<HTMLDivElement, IconContainerProps>(
  ({ badge, ...props }, ref) => (
    <IconContainer ref={ref} badge={badge} {...props} />
  )
);

IconWithBadge.displayName = 'IconWithBadge';