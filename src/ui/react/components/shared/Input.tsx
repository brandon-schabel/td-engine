import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
  error?: boolean;
  errorMessage?: string;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
}

const inputSizes = {
  sm: {
    input: 'px-2 py-1 text-xs',
    icon: 16,
    iconPadding: {
      left: 'pl-8',
      right: 'pr-8',
    },
  },
  md: {
    input: 'px-3 py-2 text-sm',
    icon: 20,
    iconPadding: {
      left: 'pl-10',
      right: 'pr-10',
    },
  },
  lg: {
    input: 'px-4 py-3 text-base',
    icon: 24,
    iconPadding: {
      left: 'pl-12',
      right: 'pr-12',
    },
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      onChange,
      onValueChange,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const sizeConfig = inputSizes[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange?.(value);
      onValueChange?.(value);
    };

    const inputClasses = cn(
      // Base styles
      'w-full text-ui-text-primary placeholder-ui-text-ui-text-secondary/50',
      'border rounded-md transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      
      // Variant styles
      variant === 'default' && [
        'bg-ui-bg-primary',
        'focus:ring-offset-ui-bg-secondary',
      ],
      variant === 'glass' && [
        'bg-white/10',
        'backdrop-blur-md',
        'focus:ring-offset-transparent',
      ],
      
      // Size styles
      sizeConfig.input,
      
      // Icon padding
      icon && iconPosition === 'left' && sizeConfig.iconPadding.left,
      icon && iconPosition === 'right' && sizeConfig.iconPadding.right,
      
      // State styles
      error
        ? 'border-status-error focus:border-status-error focus:ring-status-error'
        : 'border-ui-border-subtle focus:border-button-primary focus:ring-button-primary',
      
      // Disabled/readonly styles
      disabled && 'opacity-50 cursor-not-allowed bg-ui-bg-secondary',
      readOnly && 'bg-ui-bg-secondary cursor-default',
      
      className
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <div className="relative">
          {icon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-ui-text-secondary pointer-events-none',
                iconPosition === 'left' ? 'left-3' : 'right-3'
              )}
            >
              <Icon type={icon} size={sizeConfig.icon} />
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            readOnly={readOnly}
            onChange={handleChange}
            {...props}
          />
        </div>
        
        {error && errorMessage && (
          <div className="text-xs text-status-error mt-1 px-1">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Specialized input components
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon'>>(
  ({ placeholder = 'Search...', ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      icon={IconType.SEARCH}
      placeholder={placeholder}
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ placeholder = 'Password', iconPosition = 'left', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          icon={IconType.LOCK}
          iconPosition={iconPosition}
          placeholder={placeholder}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'text-ui-text-secondary hover:text-ui-text-primary',
            'transition-colors p-1 rounded hover:bg-white/10',
            iconPosition === 'right' && 'right-10'
          )}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon 
            type={showPassword ? IconType.EYE_OFF : IconType.EYE} 
            size={20} 
          />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';