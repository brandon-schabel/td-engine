/**
 * Slider Element Abstraction
 * Provides a declarative API for creating range sliders with consistent styling
 */

import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateSliderOptions {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  valuePosition?: 'top' | 'right' | 'bottom';
  valueFormatter?: (value: number) => string;
  label?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  trackColor?: string;
  thumbColor?: string;
  fillColor?: string;
  onChange?: (value: number) => void;
  onInput?: (value: number) => void;
  fullWidth?: boolean;
  customClasses?: string[];
  containerClasses?: string[];
}

/**
 * Creates a slider element with consistent styling and behavior
 */
export function createSlider(options: CreateSliderOptions): HTMLDivElement {
  const {
    min = 0,
    max = 100,
    step = 1,
    value = min,
    size = 'md',
    showValue = false,
    valuePosition = 'right',
    valueFormatter = (v) => String(v),
    label,
    name,
    id,
    disabled = false,
    trackColor = 'bg-surface-secondary',
    thumbColor = 'bg-primary',
    fillColor = 'bg-primary',
    onChange,
    onInput,
    fullWidth = true,
    customClasses = [],
    containerClasses = []
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = cn(
    fullWidth && 'w-full',
    ...containerClasses
  );

  // Create label if provided
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = cn(
      'block',
      'text-primary',
      'mb-2',
      getSizeLabelClass(size)
    );
    labelEl.textContent = label;
    if (id) labelEl.htmlFor = id;
    container.appendChild(labelEl);
  }

  // Create wrapper for slider and value
  const wrapper = document.createElement('div');
  wrapper.className = cn(
    'flex',
    'items-center',
    'gap-3',
    valuePosition === 'top' || valuePosition === 'bottom' ? 'flex-col' : 'flex-row'
  );

  // Create slider container
  const sliderContainer = document.createElement('div');
  sliderContainer.className = cn(
    'relative',
    'flex-1',
    'w-full'
  );

  // Create track
  const track = document.createElement('div');
  track.className = cn(
    'absolute',
    'w-full',
    'rounded-full',
    trackColor,
    ...getTrackSizeClasses(size)
  );

  // Create fill (progress)
  const fill = document.createElement('div');
  fill.className = cn(
    'absolute',
    'rounded-full',
    fillColor,
    'transition-all',
    'duration-150',
    ...getTrackSizeClasses(size)
  );
  
  // Calculate initial fill width
  const percentage = ((value - min) / (max - min)) * 100;
  fill.style.width = `${percentage}%`;

  // Create range input
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.disabled = disabled;
  
  if (id) input.id = id;
  if (name) input.name = name;

  // Slider input classes
  const sliderClasses = [
    'absolute',
    'w-full',
    'appearance-none',
    'bg-transparent',
    'cursor-pointer',
    'z-10',
    disabled && 'cursor-not-allowed',
    ...getSliderSizeClasses(size),
    ...customClasses
  ];

  input.className = cn(...sliderClasses);

  // Style the input for cross-browser compatibility
  const styleId = `slider-styles-${Math.random().toString(36).substr(2, 9)}`;
  const style = document.createElement('style');
  style.textContent = getSliderStyles(styleId, size, thumbColor, disabled);
  document.head.appendChild(style);
  input.classList.add(styleId);

  // Create value display
  let valueDisplay: HTMLDivElement | null = null;
  if (showValue) {
    valueDisplay = document.createElement('div');
    valueDisplay.className = cn(
      'text-primary',
      'font-medium',
      'min-w-[3ch]',
      'text-center',
      getSizeLabelClass(size),
      disabled && 'opacity-50'
    );
    valueDisplay.textContent = valueFormatter(value);
  }

  // Assemble slider
  track.appendChild(fill);
  sliderContainer.appendChild(track);
  sliderContainer.appendChild(input);

  // Assemble wrapper based on value position
  if (showValue && (valuePosition === 'top' || valuePosition === 'bottom')) {
    if (valuePosition === 'top') {
      wrapper.appendChild(valueDisplay!);
      wrapper.appendChild(sliderContainer);
    } else {
      wrapper.appendChild(sliderContainer);
      wrapper.appendChild(valueDisplay!);
    }
  } else {
    wrapper.appendChild(sliderContainer);
    if (showValue) {
      wrapper.appendChild(valueDisplay!);
    }
  }

  container.appendChild(wrapper);

  // Event handlers
  const updateValue = (newValue: number) => {
    const percentage = ((newValue - min) / (max - min)) * 100;
    fill.style.width = `${percentage}%`;
    
    if (valueDisplay) {
      valueDisplay.textContent = valueFormatter(newValue);
    }
  };

  if (onInput) {
    input.addEventListener('input', (e) => {
      const newValue = Number((e.target as HTMLInputElement).value);
      updateValue(newValue);
      onInput(newValue);
    });
  } else {
    // Always update visual state on input
    input.addEventListener('input', (e) => {
      const newValue = Number((e.target as HTMLInputElement).value);
      updateValue(newValue);
    });
  }

  if (onChange) {
    input.addEventListener('change', (e) => {
      const newValue = Number((e.target as HTMLInputElement).value);
      onChange(newValue);
    });
  }

  // Cleanup function to remove styles when element is removed
  const cleanup = () => {
    style.remove();
  };

  // Store cleanup function on container for manual cleanup if needed
  (container as any).__cleanup = cleanup;

  return container;
}

/**
 * Get track size classes
 */
function getTrackSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['h-1', 'top-2'];
    case 'lg':
      return ['h-2', 'top-3'];
    default: // md
      return ['h-1.5', 'top-2.5'];
  }
}

/**
 * Get slider input size classes
 */
function getSliderSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['h-5'];
    case 'lg':
      return ['h-8'];
    default: // md
      return ['h-6'];
  }
}

/**
 * Get label size class
 */
function getSizeLabelClass(size: string): string {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

/**
 * Generate slider-specific styles
 */
function getSliderStyles(id: string, size: string, _thumbColor: string, disabled: boolean): string {
  const thumbSize = size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px';
  const thumbBorder = size === 'sm' ? '2px' : '3px';
  const disabledOpacity = disabled ? 'opacity: 0.5;' : '';
  
  return `
    /* Webkit (Chrome, Safari, Edge) */
    .${id}::-webkit-slider-thumb {
      appearance: none;
      width: ${thumbSize};
      height: ${thumbSize};
      border-radius: 50%;
      border: ${thumbBorder} solid white;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      margin-top: -${parseInt(thumbSize) / 2 - 2}px;
      transition: all 150ms ease-in-out;
      ${disabledOpacity}
    }
    
    .${id}::-webkit-slider-thumb {
      background-color: var(--color-primary);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    
    .${id}:not(:disabled)::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .${id}:not(:disabled)::-webkit-slider-thumb:active {
      transform: scale(0.95);
    }
    
    /* Firefox */
    .${id}::-moz-range-thumb {
      width: ${thumbSize};
      height: ${thumbSize};
      border-radius: 50%;
      border: ${thumbBorder} solid white;
      background-color: var(--color-primary);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      transition: all 150ms ease-in-out;
      ${disabledOpacity}
    }
    
    .${id}:not(:disabled)::-moz-range-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .${id}:not(:disabled)::-moz-range-thumb:active {
      transform: scale(0.95);
    }
    
    /* Focus styles */
    .${id}:focus {
      outline: none;
    }
    
    .${id}:focus::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba(65, 105, 225, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .${id}:focus::-moz-range-thumb {
      box-shadow: 0 0 0 3px rgba(65, 105, 225, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
  `;
}

/**
 * Utility function to create a volume slider
 */
export function createVolumeSlider(options: Partial<CreateSliderOptions> = {}): HTMLDivElement {
  return createSlider({
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    showValue: true,
    valueFormatter: (v) => `${v}%`,
    label: 'Volume',
    ...options
  });
}

/**
 * Utility function to create a percentage slider
 */
export function createPercentageSlider(options: Partial<CreateSliderOptions> = {}): HTMLDivElement {
  return createSlider({
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    valueFormatter: (v) => `${v}%`,
    ...options
  });
}