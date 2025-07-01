import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './Glass';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';

interface GlassOptionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: IconType;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const GlassOptionCard: React.FC<GlassOptionCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  onSelect,
  variant = 'default',
  className,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect();
    }
  };

  const variantStyles = {
    default: 'min-h-[120px]',
    compact: 'min-h-[80px]',
    detailed: 'min-h-[160px]',
  };

  return (
    <div
      className={cn(
        'relative group',
        'transform transition-all duration-300',
        !disabled && 'hover:scale-105',
        selected && 'scale-105',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-md animate-pulse" />
      )}
      
      <GlassCard
        variant={selected ? 'light' : 'dark'}
        blur={selected ? 'lg' : 'md'}
        padding="none"
        hover={!disabled}
        className={cn(
          'relative h-full',
          variantStyles[variant],
          'border-2 transition-all duration-300',
          selected 
            ? 'border-white/40 bg-white/15' 
            : 'border-white/10 hover:border-white/20',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        <div className="p-4 h-full flex flex-col justify-between">
          {/* Top section with icon and selected indicator */}
          <div className="flex items-start justify-between">
            {icon && (
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                'bg-white/10 backdrop-blur-sm',
                selected && 'bg-white/20'
              )}>
                <Icon icon={icon} size={20} className="text-white" />
              </div>
            )}
            
            {selected && (
              <div className={cn(
                'w-6 h-6 rounded-full',
                'bg-gradient-to-br from-blue-400 to-purple-400',
                'flex items-center justify-center',
                'shadow-lg shadow-blue-500/30'
              )}>
                <svg 
                  className="w-4 h-4 text-white" 
                  fill="none" 
                  strokeWidth="3" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="space-y-1">
            <h4 className={cn(
              'font-semibold text-white',
              variant === 'compact' ? 'text-sm' : 'text-base',
              selected && 'text-white'
            )}>
              {title}
            </h4>
            
            {description && (
              <p className={cn(
                'text-white/70',
                variant === 'compact' ? 'text-xs' : 'text-sm',
                selected && 'text-white/90'
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Optional hover effect overlay */}
          {!disabled && (
            <div className={cn(
              'absolute inset-0 rounded-xl',
              'bg-gradient-to-t from-white/0 to-white/5',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-300',
              'pointer-events-none'
            )} />
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// Variant for simple text-only options
export const GlassOptionButton: React.FC<{
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}> = ({ label, selected = false, disabled = false, onSelect, className }) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative px-6 py-3 rounded-lg',
        'backdrop-blur-md transition-all duration-300',
        'border text-white font-medium',
        selected
          ? 'bg-white/20 border-white/40 shadow-lg scale-105'
          : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:scale-105 active:scale-100',
        className
      )}
    >
      {label}
      {selected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
      )}
    </button>
  );
};