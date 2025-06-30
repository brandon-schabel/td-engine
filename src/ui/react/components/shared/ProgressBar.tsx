import React, { forwardRef, HTMLAttributes, useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  progress: number; // 0-1
  fillColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  backgroundColor?: 'primary' | 'secondary' | 'muted';
  variant?: 'small' | 'medium' | 'large';
  label?: string | ((progress: number) => string);
  animated?: boolean;
  showPercentage?: boolean;
}

export interface TimerProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  duration: number; // milliseconds
  startTime?: number; // timestamp, defaults to Date.now()
  fillColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  backgroundColor?: 'primary' | 'secondary' | 'muted';
  variant?: 'small' | 'medium' | 'large';
  showTimeRemaining?: boolean;
  onComplete?: () => void;
  powerUpType?: string;
  icon?: IconType;
  paused?: boolean;
}

export interface SegmentedProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  segments: number;
  filledSegments: number;
  segmentGap?: number;
  fillColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  backgroundColor?: 'primary' | 'secondary' | 'muted';
}

const variantStyles = {
  small: 'h-2',
  medium: 'h-4',
  large: 'h-8',
};

const fillColorStyles = {
  primary: 'bg-button-primary',
  secondary: 'bg-ui-text-secondary',
  success: 'bg-success-DEFAULT',
  warning: 'bg-warning-DEFAULT',
  danger: 'bg-danger-DEFAULT',
  info: 'bg-info-DEFAULT',
};

const backgroundColorStyles = {
  primary: 'bg-ui-bg-primary',
  secondary: 'bg-ui-bg-secondary',
  muted: 'bg-ui-bg-muted',
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      progress,
      fillColor = 'primary',
      backgroundColor = 'secondary',
      variant = 'medium',
      label,
      animated = false,
      showPercentage = false,
      ...props
    },
    ref
  ) => {
    const clampedProgress = Math.min(1, Math.max(0, progress));
    const percentage = Math.round(clampedProgress * 100);

    const getLabelText = () => {
      if (typeof label === 'function') {
        return label(clampedProgress);
      }
      if (label) {
        return label;
      }
      if (showPercentage) {
        return `${percentage}%`;
      }
      return null;
    };

    const labelText = getLabelText();

    return (
      <div
        ref={ref}
        className={cn(
          'progress-bar-container relative overflow-hidden rounded',
          variantStyles[variant],
          backgroundColorStyles[backgroundColor],
          className
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <div
          className={cn(
            'progress-bar-fill absolute inset-y-0 left-0 h-full rounded',
            fillColorStyles[fillColor],
            animated && 'transition-all duration-300 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {labelText && (
          <div className="progress-bar-label absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] pointer-events-none z-20">
            {labelText}
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export const TimerProgressBar = forwardRef<HTMLDivElement, TimerProgressBarProps>(
  (
    {
      className,
      duration,
      startTime = Date.now(),
      fillColor = 'success',
      backgroundColor = 'secondary',
      variant = 'medium',
      showTimeRemaining = false,
      onComplete,
      powerUpType,
      icon,
      paused = false,
      ...props
    },
    ref
  ) => {
    const [progress, setProgress] = useState(1);
    const [timeRemaining, setTimeRemaining] = useState(duration);
    const animationFrameRef = useRef<number | null>(null);
    const completedRef = useRef(false);
    const pausedTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(startTime);

    const formatTime = useCallback((ms: number): string => {
      const seconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, []);

    const getFillColor = (): typeof fillColor => {
      if (!powerUpType) return fillColor;
      
      switch (powerUpType) {
        case 'SPEED_BOOST': return 'info';
        case 'EXTRA_DAMAGE': return 'danger';
        case 'FASTER_SHOOTING': return 'warning';
        case 'SHIELD': return 'primary';
        case 'HEALTH_REGEN': return 'success';
        default: return fillColor;
      }
    };

    useEffect(() => {
      const updateTimer = () => {
        if (completedRef.current) return;

        const currentTime = Date.now();
        
        if (paused) {
          pausedTimeRef.current += currentTime - lastUpdateTimeRef.current;
        }
        
        lastUpdateTimeRef.current = currentTime;
        
        const elapsed = currentTime - startTime - pausedTimeRef.current;
        const remaining = Math.max(0, duration - elapsed);
        const newProgress = remaining / duration;

        setProgress(newProgress);
        setTimeRemaining(remaining);

        if (remaining <= 0 && !completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        } else if (!paused) {
          animationFrameRef.current = requestAnimationFrame(updateTimer);
        }
      };

      if (!paused) {
        updateTimer();
      }

      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, [duration, startTime, onComplete, paused]);

    const content = (
      <ProgressBar
        progress={progress}
        fillColor={getFillColor()}
        backgroundColor={backgroundColor}
        variant={variant}
        label={showTimeRemaining ? formatTime(timeRemaining) : undefined}
        animated
        className={cn(powerUpType && 'power-up-timer')}
      />
    );

    if (icon) {
      return (
        <div
          ref={ref}
          className={cn('timer-progress-wrapper flex items-center gap-2', className)}
          {...props}
        >
          <div className="timer-icon w-6 h-6 flex items-center justify-center">
            <Icon type={icon} size={20} />
          </div>
          {content}
        </div>
      );
    }

    return React.cloneElement(content, { ref, className, ...props });
  }
);

TimerProgressBar.displayName = 'TimerProgressBar';

export const SegmentedProgressBar = forwardRef<HTMLDivElement, SegmentedProgressBarProps>(
  (
    {
      className,
      segments,
      filledSegments,
      segmentGap = 2,
      fillColor = 'primary',
      backgroundColor = 'secondary',
      ...props
    },
    ref
  ) => {
    const clampedFilledSegments = Math.min(segments, Math.max(0, filledSegments));

    return (
      <div
        ref={ref}
        className={cn('segmented-progress-bar flex', className)}
        style={{ gap: `${segmentGap}px` }}
        {...props}
      >
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={cn(
              'progress-segment flex-1 h-full rounded',
              i < clampedFilledSegments 
                ? fillColorStyles[fillColor] 
                : backgroundColorStyles[backgroundColor]
            )}
          />
        ))}
      </div>
    );
  }
);

SegmentedProgressBar.displayName = 'SegmentedProgressBar';