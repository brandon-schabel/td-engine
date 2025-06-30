import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  fullWidth?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  asChild?: boolean;
}

const buttonVariants = {
  primary: [
    'bg-button-primary',
    'text-white',
    'border border-button-primary',
    'hover:brightness-110',
    'active:scale-95',
    'shadow-sm',
  ],
  secondary: [
    'bg-button-secondary',
    'text-white',
    'border border-button-secondary',
    'hover:brightness-110',
    'active:scale-95',
    'shadow-sm',
  ],
  danger: [
    'bg-button-danger',
    'text-white',
    'border border-button-danger',
    'hover:brightness-110',
    'active:scale-95',
    'shadow-sm',
  ],
  success: [
    'bg-button-success',
    'text-black',
    'border border-button-success',
    'hover:brightness-110',
    'active:scale-95',
    'shadow-sm',
  ],
  outline: [
    'bg-transparent',
    'text-button-primary',
    'border border-button-primary',
    'hover:bg-button-primary',
    'hover:text-white',
    'active:scale-95',
  ],
  ghost: [
    'bg-transparent',
    'text-ui-text-primary',
    'border border-transparent',
    'hover:bg-white/10',
    'active:scale-95',
  ],
};

const buttonSizes = {
  sm: {
    text: ['px-3', 'py-2', 'text-xs', 'gap-1', 'rounded'],
    iconOnly: ['p-2', 'text-xs', 'rounded'],
  },
  md: {
    text: ['px-4', 'py-2', 'text-sm', 'gap-2', 'rounded-md'],
    iconOnly: ['p-3', 'text-sm', 'rounded-md'],
  },
  lg: {
    text: ['px-6', 'py-3', 'text-base', 'gap-3', 'rounded-lg'],
    iconOnly: ['p-4', 'text-base', 'rounded-lg'],
  },
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      iconSize,
      fullWidth = false,
      loading = false,
      disabled = false,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isIconOnly = icon && !children;
    const sizeClasses = isIconOnly ? buttonSizes[size].iconOnly : buttonSizes[size].text;
    const finalIconSize = iconSize || iconSizes[size];

    const classes = cn(
      // Base styles
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // Variant styles
      buttonVariants[variant],
      
      // Size styles
      sizeClasses,
      
      // Width
      fullWidth && 'w-full',
      
      // Custom classes
      className
    );

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <Icon type={icon} size={finalIconSize} />
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <Icon type={icon} size={finalIconSize} />
        )}
      </>
    );

    const Component = asChild ? 'span' : 'button';

    return (
      <Component
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </Component>
    );
  }
);

Button.displayName = 'Button';

// Utility components for common button types
export const CloseButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'icon' | 'variant' | 'size'>>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      icon={IconType.CLOSE}
      variant="ghost"
      size="sm"
      aria-label="Close"
      className={className}
      {...props}
    />
  )
);

CloseButton.displayName = 'CloseButton';

export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children'> & { icon: IconType; 'aria-label': string }
>(({ className, icon, ...props }, ref) => (
  <Button ref={ref} icon={icon} className={className} {...props} />
));

IconButton.displayName = 'IconButton';