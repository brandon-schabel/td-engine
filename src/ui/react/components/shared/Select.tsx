import React, { forwardRef, SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  errorMessage?: string;
  icon?: IconType;
  placeholder?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
}

const selectSizes = {
  sm: {
    select: 'px-2 py-1 text-xs pr-8',
    icon: 16,
    iconPadding: 'pl-8',
  },
  md: {
    select: 'px-3 py-2 text-sm pr-10',
    icon: 20,
    iconPadding: 'pl-10',
  },
  lg: {
    select: 'px-4 py-3 text-base pr-12',
    icon: 24,
    iconPadding: 'pl-12',
  },
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      size = 'md',
      error = false,
      errorMessage,
      icon,
      placeholder,
      fullWidth = true,
      onChange,
      onValueChange,
      disabled,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const sizeConfig = selectSizes[size];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      onChange?.(newValue);
      onValueChange?.(newValue);
    };

    const selectClasses = cn(
      // Base styles
      'w-full appearance-none bg-ui-bg-primary text-ui-text-primary',
      'border rounded-md transition-all duration-200 cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ui-bg-secondary',
      
      // Size styles
      sizeConfig.select,
      
      // Icon padding
      icon && sizeConfig.iconPadding,
      
      // State styles
      error
        ? 'border-status-error focus:border-status-error focus:ring-status-error'
        : 'border-ui-border-subtle focus:border-button-primary focus:ring-button-primary',
      
      // Disabled styles
      disabled && 'opacity-50 cursor-not-allowed bg-ui-bg-secondary',
      
      className
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-secondary pointer-events-none">
              <Icon type={icon} size={sizeConfig.icon} />
            </div>
          )}
          
          <select
            ref={ref}
            className={selectClasses}
            disabled={disabled}
            onChange={handleChange}
            value={value}
            defaultValue={defaultValue}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Chevron icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-text-secondary pointer-events-none">
            <Icon type={IconType.CHEVRON_DOWN} size={sizeConfig.icon} />
          </div>
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

Select.displayName = 'Select';

// Grouped select component
export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface GroupedSelectProps extends Omit<SelectProps, 'options'> {
  groups: SelectGroup[];
}

export const GroupedSelect = forwardRef<HTMLSelectElement, GroupedSelectProps>(
  ({ groups, ...props }, ref) => {
    const allOptions: React.ReactNode[] = [];
    
    groups.forEach((group, groupIndex) => {
      allOptions.push(
        <optgroup key={`group-${groupIndex}`} label={group.label}>
          {group.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </optgroup>
      );
    });

    return (
      <Select ref={ref} options={[]} {...props}>
        {allOptions}
      </Select>
    );
  }
);

GroupedSelect.displayName = 'GroupedSelect';