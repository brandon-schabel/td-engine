import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SliderProps } from './Slider';

export interface GlassSliderProps extends SliderProps {
  glowColor?: 'blue' | 'green' | 'purple' | 'pink' | 'yellow';
  showReflection?: boolean;
  pulseOnChange?: boolean;
}

const glowColors = {
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  green: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
  pink: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
  yellow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
};

const glowColorsThumb = {
  blue: 'shadow-[0_0_15px_rgba(59,130,246,0.8),inset_0_0_10px_rgba(59,130,246,0.3)]',
  green: 'shadow-[0_0_15px_rgba(34,197,94,0.8),inset_0_0_10px_rgba(34,197,94,0.3)]',
  purple: 'shadow-[0_0_15px_rgba(168,85,247,0.8),inset_0_0_10px_rgba(168,85,247,0.3)]',
  pink: 'shadow-[0_0_15px_rgba(236,72,153,0.8),inset_0_0_10px_rgba(236,72,153,0.3)]',
  yellow: 'shadow-[0_0_15px_rgba(250,204,21,0.8),inset_0_0_10px_rgba(250,204,21,0.3)]',
};

export const GlassSlider = forwardRef<HTMLInputElement, GlassSliderProps>(
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
      glowColor = 'blue',
      showReflection = true,
      pulseOnChange = true,
      ...props
    },
    ref
  ) => {
    const [currentValue, setCurrentValue] = useState(
      value ?? defaultValue ?? min
    );
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(value);
      }
    }, [value]);

    const percentage = ((Number(currentValue) - Number(min)) / (Number(max) - Number(min))) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setCurrentValue(newValue);
      onChange?.(newValue);
      onValueChange?.(newValue);
      
      if (pulseOnChange) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 300);
      }
    };

    const valueDisplay = showValue && (
      <div className="relative">
        <div className={cn(
          "px-3 py-1 rounded-lg",
          "bg-white/10 backdrop-blur-md",
          "border border-white/20",
          "text-white font-medium",
          "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
          isPulsing && "animate-pulse"
        )}>
          {valueFormatter(Number(currentValue))}
        </div>
      </div>
    );

    const sliderElement = (
      <div className="relative w-full group">
        {/* Glow effect container */}
        <div className={cn(
          "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          glowColors[glowColor],
          "blur-md"
        )} />
        
        {/* Track container */}
        <div className="relative">
          {/* Track background */}
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 w-full rounded-full",
            "h-3",
            "bg-gradient-to-r from-white/5 to-white/10",
            "backdrop-blur-sm",
            "border border-white/20",
            "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
            "overflow-hidden"
          )}>
            {/* Reflection effect */}
            {showReflection && (
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            )}
            
            {/* Fill track */}
            <div
              className={cn(
                "absolute top-0 left-0 h-full rounded-full",
                "bg-gradient-to-r from-blue-500/80 to-blue-400/80",
                "backdrop-blur-sm",
                "shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                "transition-all duration-150",
                isPulsing && "animate-pulse"
              )}
              style={{ width: `${percentage}%` }}
            >
              {/* Shimmer effect on fill */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
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
              'glass-slider-input relative w-full appearance-none bg-transparent cursor-pointer h-3',
              'focus:outline-none',
              disabled && 'cursor-not-allowed opacity-50',
              className
            )}
            style={{
              '--thumb-size': '24px',
              '--thumb-glow': glowColorsThumb[glowColor],
            } as React.CSSProperties}
            {...props}
          />
        </div>
      </div>
    );

    return (
      <div className="w-full">
        {label && (
          <label className={cn('block mb-3 font-medium text-white text-sm')}>
            {label}
          </label>
        )}
        
        <div
          className={cn(
            'flex items-center gap-4',
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

GlassSlider.displayName = 'GlassSlider';