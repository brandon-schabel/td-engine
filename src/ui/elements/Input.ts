/**
 * Input Element Abstraction
 * Provides a declarative API for creating input fields with consistent styling
 */

import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateInputOptions {
  type?: 'text' | 'number' | 'search' | 'password';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  value?: string | number;
  name?: string;
  id?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  maxLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
  customClasses?: string[];
  containerClasses?: string[];
}

/**
 * Creates an input element with consistent styling and behavior
 */
export function createInput(options: CreateInputOptions): HTMLDivElement {
  const {
    type = 'text',
    size = 'md',
    placeholder,
    value = '',
    name,
    id,
    disabled = false,
    readonly = false,
    required = false,
    error = false,
    errorMessage,
    icon,
    iconPosition = 'left',
    iconSize,
    onChange,
    onInput,
    onFocus,
    onBlur,
    onKeyDown,
    min,
    max,
    step,
    pattern,
    maxLength,
    autoFocus = false,
    autoComplete,
    fullWidth = true,
    customClasses = [],
    containerClasses = []
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = cn(
    'relative',
    fullWidth && 'w-full',
    ...containerClasses
  );

  // Create wrapper for input and icon
  const wrapper = document.createElement('div');
  wrapper.className = 'relative';

  // Create input
  const input = document.createElement('input');
  input.type = type;
  
  if (id) input.id = id;
  if (name) input.name = name;
  if (placeholder) input.placeholder = placeholder;
  if (autoComplete) input.setAttribute('autocomplete', autoComplete);
  if (pattern) input.pattern = pattern;
  if (maxLength) input.maxLength = maxLength;
  
  // Set value
  input.value = String(value);
  
  // Set number-specific attributes
  if (type === 'number') {
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    if (step !== undefined) input.step = String(step);
  }
  
  // State attributes
  input.disabled = disabled;
  input.readOnly = readonly;
  input.required = required;
  if (autoFocus) input.autofocus = true;

  // Build input classes
  const inputClasses = [
    'input-base',
    'w-full',
    'transition-all'
  ];

  // Size classes
  inputClasses.push(...getInputSizeClasses(size));

  // Icon padding
  if (icon) {
    if (iconPosition === 'left') {
      inputClasses.push(size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10');
    } else {
      inputClasses.push(size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10');
    }
  }

  // State classes
  if (error) {
    inputClasses.push(
      'border-danger',
      'focus:border-danger',
      'focus:shadow-danger'
    );
  } else {
    inputClasses.push(
      'border-subtle',
      'focus:border-primary',
      'focus:shadow-primary'
    );
  }

  if (disabled) {
    inputClasses.push(
      'opacity-50',
      'cursor-not-allowed',
      'bg-surface-secondary'
    );
  }

  if (readonly) {
    inputClasses.push(
      'bg-surface-secondary',
      'cursor-default'
    );
  }

  // Custom classes
  inputClasses.push(...customClasses);

  // Apply classes
  input.className = cn(...inputClasses);

  // Add icon if provided
  if (icon) {
    const iconEl = createInputIcon(icon, iconPosition, iconSize || getIconSizeForInputSize(size));
    wrapper.appendChild(iconEl);
  }

  // Add input to wrapper
  wrapper.appendChild(input);
  container.appendChild(wrapper);

  // Add error message if provided
  if (error && errorMessage) {
    const errorEl = document.createElement('div');
    errorEl.className = cn(
      'text-xs',
      'text-danger',
      'mt-1',
      'px-1'
    );
    errorEl.textContent = errorMessage;
    container.appendChild(errorEl);
  }

  // Event handlers
  if (onChange) {
    input.addEventListener('change', (e) => {
      onChange((e.target as HTMLInputElement).value);
    });
  }

  if (onInput) {
    input.addEventListener('input', (e) => {
      onInput((e.target as HTMLInputElement).value);
    });
  }

  if (onFocus) {
    input.addEventListener('focus', onFocus);
  }

  if (onBlur) {
    input.addEventListener('blur', onBlur);
  }

  if (onKeyDown) {
    input.addEventListener('keydown', onKeyDown);
  }

  return container;
}

/**
 * Get size-specific classes for input
 */
function getInputSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['px-2', 'py-1', 'text-sm', 'rounded'];
    case 'lg':
      return ['px-4', 'py-3', 'text-lg', 'rounded-lg'];
    default: // md
      return ['px-3', 'py-2', 'text-base', 'rounded-md'];
  }
}

/**
 * Get appropriate icon size for input size
 */
function getIconSizeForInputSize(size: string): number {
  switch (size) {
    case 'sm':
      return 16;
    case 'lg':
      return 24;
    default:
      return 20;
  }
}

/**
 * Create icon element for input
 */
function createInputIcon(icon: IconType, position: 'left' | 'right', size: number): HTMLDivElement {
  const iconContainer = document.createElement('div');
  iconContainer.className = cn(
    'absolute',
    'top-1/2',
    '-translate-y-1/2',
    'text-secondary',
    'pointer-events-none',
    position === 'left' ? 'left-3' : 'right-3'
  );
  
  iconContainer.innerHTML = createSvgIcon(icon, { size });
  
  return iconContainer;
}

/**
 * Utility function to create a search input
 */
export function createSearchInput(options: Partial<CreateInputOptions> = {}): HTMLDivElement {
  return createInput({
    type: 'search',
    icon: IconType.SEARCH,
    placeholder: 'Search...',
    ...options
  });
}

/**
 * Utility function to create a password input with toggle
 */
export function createPasswordInput(options: Partial<CreateInputOptions> = {}): HTMLDivElement {
  const container = createInput({
    type: 'password',
    icon: IconType.LOCK,
    placeholder: 'Password',
    ...options
  });

  // Add toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = cn(
    'absolute',
    'right-3',
    'top-1/2',
    '-translate-y-1/2',
    'text-secondary',
    'hover:text-primary',
    'transition-colors',
    'p-1',
    'rounded',
    'hover:bg-surface-hover'
  );

  const input = container.querySelector('input') as HTMLInputElement;
  let isVisible = false;

  const updateToggle = () => {
    toggleBtn.innerHTML = createSvgIcon(
      isVisible ? IconType.EYE_OFF : IconType.EYE,
      { size: 20 }
    );
    toggleBtn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  };

  updateToggle();

  toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    input.type = isVisible ? 'text' : 'password';
    updateToggle();
  });

  const wrapper = container.querySelector('.relative') as HTMLDivElement;
  wrapper.appendChild(toggleBtn);

  return container;
}