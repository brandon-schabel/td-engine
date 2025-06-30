import React, { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  valuePosition?: 'top' | 'right' | 'bottom' | 'left';
  valueFormatter?: (value: number) => string;
  label?: string;
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
}

const sliderSizes = {
  sm: {
    track: 'h-1',
    thumb: 'w-3 h-3',
    label: 'text-xs',
    value: 'text-xs',
  },
  md: {
    track: 'h-2',
    thumb: 'w-4 h-4',
    label: 'text-sm',
    value: 'text-sm',
  },
  lg: {
    track: 'h-3',
    thumb: 'w-5 h-5',
    label: 'text-base',
    value: 'text-base',
  },
};

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      size = 'md',
      showValue = false,
      valuePosition = 'right',
      valueFormatter = (v) => String(v),
      label,
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      disabled,
      onChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [currentValue, setCurrentValue] = useState(
      value ?? defaultValue ?? min
    );

    useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(value);
      }
    }, [value]);

    const sizeConfig = sliderSizes[size];
    const percentage = ((Number(currentValue) - Number(min)) / (Number(max) - Number(min))) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setCurrentValue(newValue);
      onChange?.(newValue);
      onValueChange?.(newValue);
    };

    const valueDisplay = showValue && (
      <span className={cn(sizeConfig.value, 'text-ui-text-secondary min-w-[3ch] text-center')}>
        {valueFormatter(Number(currentValue))}
      </span>
    );

    const sliderElement = (
      <div className="relative w-full">
        {/* Track */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-full rounded-full bg-ui-bg-secondary border border-ui-border-subtle',
            sizeConfig.track
          )}
        >
          {/* Fill */}
          <div
            className={cn(
              'absolute top-0 left-0 h-full rounded-full bg-button-primary transition-all duration-150',
              sizeConfig.track
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            'relative w-full appearance-none bg-transparent cursor-pointer',
            'focus:outline-none',
            disabled && 'cursor-not-allowed opacity-50',
            // Custom thumb styles
            '[&::-webkit-slider-thumb]:appearance-none',
            `[&::-webkit-slider-thumb]:${sizeConfig.thumb.split(' ').join(' [&::-webkit-slider-thumb]:')}`,
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-button-primary',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:transition-all',
            '[&::-webkit-slider-thumb]:duration-200',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:active:scale-95',
            // Firefox
            '[&::-moz-range-thumb]:appearance-none',
            `[&::-moz-range-thumb]:${sizeConfig.thumb.split(' ').join(' [&::-moz-range-thumb]:')}`,
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-button-primary',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:transition-all',
            '[&::-moz-range-thumb]:duration-200',
            '[&::-moz-range-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:active:scale-95',
            className
          )}
          style={{
            height: sizeConfig.track.replace('h-', '').replace(/(\d+)/, '$1').concat('rem'),
          }}
          {...props}
        />
      </div>
    );

    return (
      <div className="w-full">
        {label && (
          <label className={cn('block mb-2 font-medium text-ui-text-primary', sizeConfig.label)}>
            {label}
          </label>
        )}
        
        <div
          className={cn(
            'flex items-center gap-3',
            (valuePosition === 'top' || valuePosition === 'bottom') && 'flex-col',
            valuePosition === 'left' && 'flex-row-reverse'
          )}
        >
          {(valuePosition === 'top' || valuePosition === 'left') && valueDisplay}
          {sliderElement}
          {(valuePosition === 'bottom' || valuePosition === 'right') && valueDisplay}
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';