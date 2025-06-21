/**
 * Select Element Abstraction
 * Provides a declarative API for creating select dropdowns with consistent styling
 */

import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/ui/styles/UtilityStyles';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CreateSelectOptions {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  icon?: IconType;
  iconSize?: number;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  customClasses?: string[];
  containerClasses?: string[];
}

/**
 * Creates a select element with consistent styling and behavior
 */
export function createSelect(options: CreateSelectOptions): HTMLDivElement {
  const {
    options: selectOptions,
    value = '',
    placeholder,
    size = 'md',
    name,
    id,
    disabled = false,
    required = false,
    error = false,
    errorMessage,
    icon,
    iconSize,
    onChange,
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

  // Create wrapper for select and icon
  const wrapper = document.createElement('div');
  wrapper.className = 'relative';

  // Create select
  const select = document.createElement('select');
  
  if (id) select.id = id;
  if (name) select.name = name;
  
  // State attributes
  select.disabled = disabled;
  select.required = required;

  // Build select classes
  const selectClasses = [
    'w-full',
    'appearance-none',
    'transition-all',
    'cursor-pointer'
  ];

  // Base styling matching input-base
  selectClasses.push(
    'font-inherit',
    'color-inherit',
    'bg-surface-primary',
    'border',
    'border-solid'
  );

  // Size classes
  selectClasses.push(...getSelectSizeClasses(size));

  // Icon padding
  if (icon) {
    selectClasses.push(size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10');
  }

  // Always add padding for chevron on the right
  selectClasses.push(size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10');

  // State classes
  if (error) {
    selectClasses.push(
      'border-danger',
      'focus:border-danger',
      'focus:shadow-danger'
    );
  } else {
    selectClasses.push(
      'border-subtle',
      'focus:border-primary',
      'focus:shadow-primary'
    );
  }

  if (disabled) {
    selectClasses.push(
      'opacity-50',
      'cursor-not-allowed',
      'bg-surface-secondary'
    );
  }

  // Focus styles
  selectClasses.push(
    'focus:outline-none',
    'focus:ring-0'
  );

  // Custom classes
  selectClasses.push(...customClasses);

  // Apply classes
  select.className = cn(...selectClasses);

  // Add placeholder option if provided
  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    if (!value) placeholderOption.selected = true;
    select.appendChild(placeholderOption);
  }

  // Add options
  selectOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.disabled = opt.disabled || false;
    if (opt.value === value) option.selected = true;
    select.appendChild(option);
  });

  // Set value if no matching option was selected
  if (value && !select.value) {
    select.value = value;
  }

  // Add icon if provided
  if (icon) {
    const iconEl = createSelectIcon(icon, 'left', iconSize || getIconSizeForSelectSize(size));
    wrapper.appendChild(iconEl);
  }

  // Add chevron icon
  const chevronEl = createSelectIcon(IconType.CHEVRON_DOWN, 'right', getIconSizeForSelectSize(size));
  wrapper.appendChild(chevronEl);

  // Add select to wrapper
  wrapper.appendChild(select);
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

  // Event handler
  if (onChange) {
    select.addEventListener('change', (e) => {
      onChange((e.target as HTMLSelectElement).value);
    });
  }

  return container;
}

/**
 * Get size-specific classes for select
 */
function getSelectSizeClasses(size: string): string[] {
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
 * Get appropriate icon size for select size
 */
function getIconSizeForSelectSize(size: string): number {
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
 * Create icon element for select
 */
function createSelectIcon(icon: IconType, position: 'left' | 'right', size: number): HTMLDivElement {
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
 * Utility function to create a select with grouped options
 */
export function createGroupedSelect(options: {
  groups: Array<{
    label: string;
    options: SelectOption[];
  }>;
  value?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: string) => void;
  customClasses?: string[];
}): HTMLDivElement {
  const {
    groups,
    value = '',
    placeholder,
    size = 'md',
    onChange,
    customClasses = []
  } = options;

  // Create container following the same pattern
  const container = document.createElement('div');
  container.className = 'relative w-full';

  const wrapper = document.createElement('div');
  wrapper.className = 'relative';

  const select = document.createElement('select');
  select.className = cn(
    'w-full',
    'appearance-none',
    'transition-all',
    'cursor-pointer',
    'font-inherit',
    'color-inherit',
    'bg-surface-primary',
    'border',
    'border-solid',
    'border-subtle',
    'focus:border-primary',
    'focus:shadow-primary',
    'focus:outline-none',
    'focus:ring-0',
    ...getSelectSizeClasses(size),
    size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10',
    ...customClasses
  );

  // Add placeholder
  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    if (!value) placeholderOption.selected = true;
    select.appendChild(placeholderOption);
  }

  // Add grouped options
  groups.forEach(group => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;

    group.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.disabled = opt.disabled || false;
      if (opt.value === value) option.selected = true;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  // Add chevron
  const chevronEl = createSelectIcon(IconType.CHEVRON_DOWN, 'right', getIconSizeForSelectSize(size));
  wrapper.appendChild(chevronEl);

  wrapper.appendChild(select);
  container.appendChild(wrapper);

  // Event handler
  if (onChange) {
    select.addEventListener('change', (e) => {
      onChange((e.target as HTMLSelectElement).value);
    });
  }

  return container;
}