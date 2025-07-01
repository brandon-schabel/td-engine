import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualJoystickProps {
  size?: number;
  onMove?: (direction: { x: number; y: number } | null) => void;
  position?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 120,
  onMove,
  position = 'left',
  className,
  disabled = false
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  
  const knobSize = size * 0.4;
  const maxDistance = (size - knobSize) / 2;

  const updateKnobPosition = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit to max distance
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }
    
    setKnobPosition({ x: deltaX, y: deltaY });
    
    // Calculate normalized direction (-1 to 1)
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;
    
    // Apply deadzone
    const deadzone = 0.15;
    const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    
    if (magnitude < deadzone) {
      onMove?.(null);
    } else {
      // Rescale to remove deadzone
      const scaledMagnitude = (magnitude - deadzone) / (1 - deadzone);
      const angle = Math.atan2(normalizedY, normalizedX);
      onMove?.({
        x: Math.cos(angle) * scaledMagnitude,
        y: Math.sin(angle) * scaledMagnitude
      });
    }
  }, [maxDistance, onMove]);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation(); // Prevent gesture manager from processing this touch
    setIsActive(true);
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      touchIdRef.current = touch.identifier;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    updateKnobPosition(clientX, clientY);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [disabled, updateKnobPosition]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive || disabled) return;
    
    e.preventDefault();
    e.stopPropagation(); // Prevent gesture manager from processing this touch
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    updateKnobPosition(clientX, clientY);
  }, [isActive, disabled, updateKnobPosition]);

  const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation(); // Prevent gesture manager from processing this touch
    
    if ('changedTouches' in e) {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
    }
    
    setIsActive(false);
    setKnobPosition({ x: 0, y: 0 });
    onMove?.(null);
    touchIdRef.current = null;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [isActive, onMove]);

  // Handle mouse events for desktop testing
  useEffect(() => {
    if (!isActive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e as any);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e as any);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isActive, handleMove, handleEnd]);

  return (
    <div
      ref={baseRef}
      className={cn(
        'relative touch-none select-none',
        'transition-opacity duration-200',
        disabled && 'opacity-50',
        className
      )}
      style={{
        width: size,
        height: size
      }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
    >
      {/* Base ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-white/10 backdrop-blur-md',
          'border-2 border-white/20',
          'shadow-lg shadow-black/50',
          isActive && 'bg-white/20 border-white/30'
        )}
      />
      
      {/* Center dot */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-2 h-2 rounded-full',
          'bg-white/30'
        )}
      />
      
      {/* Knob */}
      <div
        ref={knobRef}
        className={cn(
          'absolute rounded-full',
          'bg-white/30 backdrop-blur-sm',
          'border-2 border-white/40',
          'shadow-lg shadow-black/50',
          'transition-all duration-100',
          isActive && 'bg-white/40 border-white/60 scale-110'
        )}
        style={{
          width: knobSize,
          height: knobSize,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-white/20 blur-sm" />
      </div>
    </div>
  );
};