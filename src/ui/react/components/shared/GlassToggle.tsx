import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  glowColor?: 'blue' | 'green' | 'purple' | 'pink' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  showReflection?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const glowColors = {
  blue: {
    track: 'shadow-[0_0_20px_rgba(59,130,246,0.6),inset_0_0_10px_rgba(59,130,246,0.2)]',
    thumb: 'shadow-[0_0_15px_rgba(59,130,246,0.8)]',
    checked: 'from-blue-500/80 to-blue-400/80',
  },
  green: {
    track: 'shadow-[0_0_20px_rgba(34,197,94,0.6),inset_0_0_10px_rgba(34,197,94,0.2)]',
    thumb: 'shadow-[0_0_15px_rgba(34,197,94,0.8)]',
    checked: 'from-green-500/80 to-green-400/80',
  },
  purple: {
    track: 'shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_10px_rgba(168,85,247,0.2)]',
    thumb: 'shadow-[0_0_15px_rgba(168,85,247,0.8)]',
    checked: 'from-purple-500/80 to-purple-400/80',
  },
  pink: {
    track: 'shadow-[0_0_20px_rgba(236,72,153,0.6),inset_0_0_10px_rgba(236,72,153,0.2)]',
    thumb: 'shadow-[0_0_15px_rgba(236,72,153,0.8)]',
    checked: 'from-pink-500/80 to-pink-400/80',
  },
  yellow: {
    track: 'shadow-[0_0_20px_rgba(250,204,21,0.6),inset_0_0_10px_rgba(250,204,21,0.2)]',
    thumb: 'shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    checked: 'from-yellow-500/80 to-yellow-400/80',
  },
};

const sizes = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-12 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-6',
  },
  lg: {
    track: 'w-16 h-8',
    thumb: 'w-7 h-7',
    translate: 'translate-x-8',
  },
};

export const GlassToggle = forwardRef<HTMLInputElement, GlassToggleProps>(
  ({ 
    className, 
    glowColor = 'blue', 
    size = 'md', 
    showReflection = true, 
    onCheckedChange,
    checked,
    disabled,
    ...props 
  }, ref) => {
    const sizeConfig = sizes[size];
    const colorConfig = glowColors[glowColor];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <label className={cn(
        'relative inline-block',
        'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}>
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        
        {/* Track */}
        <div
          className={cn(
            'relative rounded-full transition-all duration-300',
            sizeConfig.track,
            'bg-gradient-to-r from-white/10 to-white/5',
            'backdrop-blur-md',
            'border border-white/20',
            'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
            'peer-hover:border-white/30',
            'peer-checked:bg-gradient-to-r',
            `peer-checked:${colorConfig.checked}`,
            'peer-checked:' + colorConfig.track,
            'overflow-hidden'
          )}
        >
          {/* Reflection effect */}
          {showReflection && (
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          )}
          
          {/* Inner glow effect when checked */}
          <div className={cn(
            "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
            "peer-checked:opacity-100",
            "bg-gradient-to-r from-transparent via-white/20 to-transparent",
            "animate-shimmer"
          )} />
          
          {/* Thumb */}
          <div
            className={cn(
              'absolute left-0.5 top-1/2 -translate-y-1/2',
              'block rounded-full',
              'transition-all duration-300 ease-out',
              sizeConfig.thumb,
              'peer-checked:' + sizeConfig.translate,
              'bg-gradient-to-br from-white to-gray-100',
              'shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]',
              'peer-hover:scale-110',
              'peer-checked:' + colorConfig.thumb,
              'peer-checked:bg-gradient-to-br peer-checked:from-white peer-checked:to-gray-50',
              'before:absolute before:inset-0 before:rounded-full',
              'before:bg-gradient-to-br before:from-transparent before:via-white/30 before:to-transparent',
              'before:opacity-70'
            )}
          >
            {/* Center highlight */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/60 to-transparent" />
          </div>
        </div>
      </label>
    );
  }
);

GlassToggle.displayName = 'GlassToggle';