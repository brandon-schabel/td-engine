import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  variant?: 'switch' | 'checkbox';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  labelPosition?: 'left' | 'right';
  onCheckedChange?: (checked: boolean) => void;
}

const switchSizes = {
  sm: {
    switch: 'w-12 h-7',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    label: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    switch: 'w-14 h-8',
    thumb: 'w-6 h-6',
    translate: 'translate-x-6',
    label: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    switch: 'w-16 h-9',
    thumb: 'w-7 h-7',
    translate: 'translate-x-7',
    label: 'text-base',
    gap: 'gap-3',
  },
};

const checkboxSizes = {
  sm: {
    checkbox: 'w-4 h-4',
    label: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    checkbox: 'w-5 h-5',
    label: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    checkbox: 'w-6 h-6',
    label: 'text-base',
    gap: 'gap-3',
  },
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      variant = 'switch',
      size = 'md',
      label,
      labelPosition = 'right',
      checked,
      defaultChecked,
      disabled,
      onChange,
      onCheckedChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const switchConfig = switchSizes[size];
    const checkboxConfig = checkboxSizes[size];
    const sizeConfig = variant === 'switch' ? switchConfig : checkboxConfig;

    const labelElement = label && (
      <span className={cn(sizeConfig.label, 'text-ui-text-primary select-none')}>
        {label}
      </span>
    );

    return (
      <label
        className={cn(
          'inline-flex items-center cursor-pointer select-none',
          sizeConfig.gap,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {labelPosition === 'left' && labelElement}
        
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        
        {variant === 'switch' ? (
          <div
            className={cn(
              'relative inline-block rounded-full transition-colors duration-200',
              switchConfig.switch,
              checked || defaultChecked
                ? 'bg-button-primary border-button-primary'
                : 'bg-ui-bg-secondary border-ui-border-DEFAULT',
              'border',
              !disabled && 'hover:shadow-md'
            )}
          >
            <div
              className={cn(
                'absolute top-1 left-1 rounded-full bg-white transition-transform duration-200',
                switchConfig.thumb,
                checked || defaultChecked ? switchConfig.translate : 'translate-x-0'
              )}
            />
          </div>
        ) : (
          <div
            className={cn(
              'relative inline-flex items-center justify-center rounded border-2 transition-all duration-200',
              checkboxConfig.checkbox,
              checked || defaultChecked
                ? 'bg-button-primary border-button-primary'
                : 'bg-ui-bg-primary border-ui-border-DEFAULT',
              !disabled && 'hover:border-button-primary'
            )}
          >
            {(checked || defaultChecked) && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}
        
        {labelPosition === 'right' && labelElement}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

// Convenience components
export const Switch = forwardRef<HTMLInputElement, Omit<ToggleProps, 'variant'>>(
  (props, ref) => <Toggle ref={ref} variant="switch" {...props} />
);

Switch.displayName = 'Switch';

export const Checkbox = forwardRef<HTMLInputElement, Omit<ToggleProps, 'variant'>>(
  (props, ref) => <Toggle ref={ref} variant="checkbox" {...props} />
);

Checkbox.displayName = 'Checkbox';