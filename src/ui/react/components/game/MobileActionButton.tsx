import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '../shared/Icon';
import { IconType } from '@/ui/icons/SvgIcons';

interface MobileActionButtonProps {
  icon: IconType;
  size?: number;
  onTap?: () => void;
  onHold?: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  glowColor?: string;
}

export const MobileActionButton: React.FC<MobileActionButtonProps> = ({
  icon,
  size = 60,
  onTap,
  onHold,
  label,
  disabled = false,
  className,
  glowColor = 'rgba(255, 255, 255, 0.3)'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = React.useRef<number | null>(null);
  const tapTimeoutRef = React.useRef<number | null>(null);
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsPressed(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Set up hold detection
    if (onHold) {
      holdTimeoutRef.current = window.setTimeout(() => {
        setIsHolding(true);
        onHold();
        
        // Stronger haptic for hold
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
    }
  }, [disabled, onHold]);
  
  const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isPressed) return;
    
    e.preventDefault();
    
    // Clear hold timeout
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    // If not holding, trigger tap
    if (!isHolding && onTap) {
      onTap();
    }
    
    setIsPressed(false);
    setIsHolding(false);
  }, [isPressed, isHolding, onTap]);
  
  const handleCancel = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    setIsPressed(false);
    setIsHolding(false);
  }, []);
  
  React.useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <button
        className={cn(
          'relative touch-none select-none',
          'rounded-full transition-all duration-150',
          'bg-white/10 backdrop-blur-md',
          'border-2 border-white/20',
          'shadow-lg shadow-black/50',
          'flex items-center justify-center',
          'active:scale-95',
          isPressed && 'bg-white/20 border-white/30 scale-110',
          isHolding && 'animate-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          width: size,
          height: size,
          boxShadow: isPressed ? `0 0 20px ${glowColor}` : undefined
        }}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleCancel}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleCancel}
        disabled={disabled}
      >
        {/* Icon */}
        <Icon 
          type={icon} 
          size={size * 0.5} 
          className={cn(
            'text-white',
            isPressed && 'scale-110'
          )} 
        />
        
        {/* Inner glow */}
        {isPressed && (
          <div 
            className="absolute inset-2 rounded-full blur-md pointer-events-none"
            style={{ backgroundColor: glowColor }}
          />
        )}
      </button>
      
      {/* Label */}
      {label && (
        <span className={cn(
          'absolute -bottom-5 left-1/2 -translate-x-1/2',
          'text-xs text-white/70 whitespace-nowrap',
          'pointer-events-none select-none'
        )}>
          {label}
        </span>
      )}
    </div>
  );
};