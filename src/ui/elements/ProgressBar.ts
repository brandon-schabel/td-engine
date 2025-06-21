/**
 * Progress Bar UI Element
 * Provides visual feedback for progress, timers, and power-ups
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { IconType, createSvgIcon } from '@/ui/icons/SvgIcons';

export interface CreateProgressBarOptions {
  width: number;
  height: number;
  progress: number; // 0-1
  fillColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  backgroundColor?: 'surface-primary' | 'surface-secondary' | 'muted';
  variant?: 'small' | 'medium' | 'large';
  label?: string;
  animated?: boolean;
  className?: string;
}

export interface CreateTimerProgressBarOptions {
  width: number;
  height: number;
  duration: number; // milliseconds
  startTime: number; // timestamp
  fillColor?: string;
  backgroundColor?: string;
  showTimeRemaining?: boolean;
  onComplete?: () => void;
  powerUpType?: string;
  icon?: IconType;
  className?: string;
}

interface ProgressBarElement extends HTMLDivElement {
  updateProgress?: (progress: number) => void;
  destroy?: () => void;
}

/**
 * Create a basic progress bar
 */
export function createProgressBar(options: CreateProgressBarOptions): ProgressBarElement {
  const {
    width,
    height,
    progress,
    fillColor = 'primary',
    backgroundColor = 'surface-secondary',
    variant = 'medium',
    label,
    animated = false,
    className
  } = options;

  // Container
  const container = document.createElement('div') as ProgressBarElement;
  container.className = cn(
    'progress-bar-container',
    'relative',
    'overflow-hidden',
    'rounded',
    `bg-${backgroundColor}`,
    variant === 'small' && 'h-2',
    variant === 'medium' && 'h-4',
    variant === 'large' && 'h-8',
    className
  );
  container.style.width = `${width}px`;
  container.setAttribute('data-update-progress', 'true');

  // Progress fill
  const fill = document.createElement('div');
  fill.className = cn(
    'progress-bar-fill',
    'absolute',
    'inset-y-0',
    'left-0',
    'rounded',
    `bg-${fillColor}`,
    animated && 'transition-width',
    'duration-300',
    'ease-out'
  );
  fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;

  // Label (optional)
  if (label) {
    const labelElement = document.createElement('div');
    labelElement.className = cn(
      'progress-bar-label',
      'absolute',
      'inset-0',
      'flex',
      'items-center',
      'justify-center',
      'text-xs',
      'font-medium',
      'text-content-primary'
    );
    labelElement.textContent = label;
    container.appendChild(labelElement);
  }

  container.appendChild(fill);

  // Update function
  container.updateProgress = (newProgress: number) => {
    const clampedProgress = Math.min(1, Math.max(0, newProgress));
    fill.style.width = `${clampedProgress * 100}%`;
    if (label) {
      const labelElement = container.querySelector('.progress-bar-label');
      if (labelElement) {
        labelElement.textContent = `${Math.round(clampedProgress * 100)}%`;
      }
    }
  };

  return container;
}

/**
 * Create a timer-based progress bar (counts down)
 */
export function createTimerProgressBar(options: CreateTimerProgressBarOptions): ProgressBarElement {
  const {
    width,
    height,
    duration,
    startTime,
    showTimeRemaining = false,
    onComplete,
    powerUpType,
    icon,
    className
  } = options;

  // Determine colors based on power-up type
  let fillColor = 'success';
  if (powerUpType) {
    switch (powerUpType) {
      case 'SPEED_BOOST':
        fillColor = 'info';
        break;
      case 'EXTRA_DAMAGE':
        fillColor = 'danger';
        break;
      case 'FASTER_SHOOTING':
        fillColor = 'warning';
        break;
      case 'SHIELD':
        fillColor = 'secondary';
        break;
      case 'HEALTH_REGEN':
        fillColor = 'success';
        break;
    }
  }

  // Create container with flex layout for icon
  const wrapper = document.createElement('div') as ProgressBarElement;
  wrapper.className = cn(
    'timer-progress-wrapper',
    'flex',
    'items-center',
    'gap-2',
    className
  );

  // Icon (optional)
  if (icon) {
    const iconContainer = document.createElement('div');
    iconContainer.className = cn(
      'timer-icon',
      'w-6',
      'h-6',
      'flex',
      'items-center',
      'justify-center'
    );
    iconContainer.innerHTML = createSvgIcon(icon, { size: 20 });
    wrapper.appendChild(iconContainer);
  }

  // Progress bar
  const progressBar = createProgressBar({
    width: icon ? width - 32 : width, // Account for icon space
    height,
    progress: 1, // Start at full
    fillColor: fillColor as any,
    backgroundColor: 'surface-secondary',
    variant: height <= 12 ? 'small' : height <= 20 ? 'medium' : 'large',
    animated: true,
    className: cn('timer-progress', powerUpType && 'power-up-timer')
  }) as ProgressBarElement;

  // Time label
  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showTimeRemaining) {
    const label = document.createElement('div');
    label.className = cn(
      'progress-bar-label',
      'absolute',
      'inset-0',
      'flex',
      'items-center',
      'justify-center',
      'text-xs',
      'font-medium',
      'text-content-primary',
      'pointer-events-none'
    );
    progressBar.appendChild(label);
  }

  wrapper.appendChild(progressBar);

  // Timer attributes
  wrapper.setAttribute('data-timer-active', 'true');
  wrapper.setAttribute('data-duration', duration.toString());

  // Timer update logic
  let animationFrameId: number | null = null;
  let completed = false;

  const updateTimer = () => {
    if (completed) return;

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const remaining = Math.max(0, duration - elapsed);
    const progress = remaining / duration;

    if (progressBar.updateProgress) {
      progressBar.updateProgress(progress);
    }

    if (showTimeRemaining) {
      const label = progressBar.querySelector('.progress-bar-label');
      if (label) {
        label.textContent = formatTime(remaining);
      }
    }

    if (remaining <= 0) {
      completed = true;
      wrapper.setAttribute('data-timer-active', 'false');
      if (onComplete) {
        onComplete();
      }
    } else {
      animationFrameId = requestAnimationFrame(updateTimer);
    }
  };

  // Start the timer
  updateTimer();

  // Destroy function
  wrapper.destroy = () => {
    completed = true;
    wrapper.setAttribute('data-timer-active', 'false');
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  return wrapper;
}

/**
 * Create a multi-segment progress bar
 */
export function createSegmentedProgressBar(options: {
  width: number;
  height: number;
  segments: number;
  filledSegments: number;
  segmentGap?: number;
  fillColor?: string;
  backgroundColor?: string;
  className?: string;
}): HTMLDivElement {
  const {
    width,
    height,
    segments,
    filledSegments,
    segmentGap = 2,
    fillColor = 'primary',
    backgroundColor = 'surface-secondary',
    className
  } = options;

  const container = document.createElement('div');
  container.className = cn(
    'segmented-progress-bar',
    'flex',
    'gap-0.5',
    className
  );
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  const segmentWidth = (width - (segments - 1) * segmentGap) / segments;

  for (let i = 0; i < segments; i++) {
    const segment = document.createElement('div');
    segment.className = cn(
      'progress-segment',
      'rounded',
      i < filledSegments ? `bg-${fillColor}` : `bg-${backgroundColor}`
    );
    segment.style.width = `${segmentWidth}px`;
    segment.style.height = '100%';
    container.appendChild(segment);
  }

  return container;
}