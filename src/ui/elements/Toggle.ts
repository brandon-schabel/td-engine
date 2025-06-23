/**
 * Toggle Element Abstraction
 * Provides a declarative API for creating toggle switches and checkboxes with consistent styling
 */

import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateToggleOptions {
  variant?: 'switch' | 'checkbox';
  size?: 'sm' | 'md' | 'lg';
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  name?: string;
  id?: string;
  value?: string;
  onChange?: (checked: boolean) => void;
  customClasses?: string[];
  containerClasses?: string[];
}

/**
 * Creates a toggle element (switch or checkbox) with consistent styling
 */
export function createToggle(options: CreateToggleOptions): HTMLLabelElement {
  const {
    variant = 'switch',
    size = 'md',
    checked = false,
    disabled = false,
    label,
    labelPosition = 'right',
    name,
    id,
    value,
    onChange,
    customClasses = [],
    containerClasses = []
  } = options;

  // Create container label
  const container = document.createElement('label');
  container.className = cn(
    'inline-flex',
    'items-center',
    'cursor-pointer',
    'select-none',
    'flex-shrink-0', // Prevent shrinking in flex containers
    disabled && 'opacity-50 cursor-not-allowed',
    ...containerClasses
  );

  // Create hidden input
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'sr-only'; // Screen reader only
  input.checked = checked;
  input.disabled = disabled;
  
  if (id) input.id = id;
  if (name) input.name = name;
  if (value) input.value = value;

  // Create visual element based on variant
  const visualElement = variant === 'switch' 
    ? createSwitchVisual(size, checked, disabled, customClasses)
    : createCheckboxVisual(size, checked, disabled, customClasses);

  // Create label text if provided
  const labelElement = label ? createLabel(label, size) : null;

  // Assemble elements based on label position
  if (labelElement && labelPosition === 'left') {
    container.appendChild(labelElement);
    container.appendChild(createSpacer(size));
  }
  
  container.appendChild(input);
  container.appendChild(visualElement);
  
  if (labelElement && labelPosition === 'right') {
    container.appendChild(createSpacer(size));
    container.appendChild(labelElement);
  }

  // Event handler
  if (onChange && !disabled) {
    input.addEventListener('change', (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      
      // Update visual state
      if (variant === 'switch') {
        updateSwitchState(visualElement, isChecked);
      } else {
        updateCheckboxState(visualElement, isChecked);
      }
      
      onChange(isChecked);
    });
  }

  // Click handler for visual element
  visualElement.addEventListener('click', (e) => {
    if (!disabled) {
      e.preventDefault();
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  return container;
}

/**
 * Create switch visual element
 */
function createSwitchVisual(size: string, checked: boolean, disabled: boolean, customClasses: string[]): HTMLDivElement {
  const switchEl = document.createElement('div');
  
  // Set explicit dimensions based on size
  const dimensions = {
    sm: { width: '48px', height: '28px' },
    md: { width: '56px', height: '32px' },
    lg: { width: '64px', height: '36px' }
  };
  
  const dim = dimensions[size as keyof typeof dimensions] || dimensions.md;
  
  // Apply all critical styles inline to ensure they work
  switchEl.style.position = 'relative';
  switchEl.style.display = 'inline-block';
  switchEl.style.width = dim.width;
  switchEl.style.height = dim.height;
  switchEl.style.borderRadius = '9999px';
  switchEl.style.transition = 'all 200ms ease-in-out';
  switchEl.style.backgroundColor = checked ? '#4A90E2' : '#4B5563';
  switchEl.style.border = '1px solid';
  switchEl.style.borderColor = checked ? '#3A7BC8' : '#374151';
  switchEl.style.cursor = disabled ? 'not-allowed' : 'pointer';
  switchEl.style.opacity = disabled ? '0.5' : '1';
  switchEl.style.flexShrink = '0';
  
  // Add hover effect
  if (!disabled) {
    switchEl.onmouseenter = () => {
      switchEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    };
    switchEl.onmouseleave = () => {
      switchEl.style.boxShadow = '';
    };
  }
  
  switchEl.className = cn(...customClasses);

  // Create thumb
  const thumb = document.createElement('div');
  
  // Set thumb dimensions based on size
  const thumbDimensions = {
    sm: { size: '20px', checkedPos: '22px' },
    md: { size: '24px', checkedPos: '28px' },
    lg: { size: '28px', checkedPos: '34px' }
  };
  
  const thumbDim = thumbDimensions[size as keyof typeof thumbDimensions] || thumbDimensions.md;
  
  // Apply thumb styles inline
  thumb.style.position = 'absolute';
  thumb.style.width = thumbDim.size;
  thumb.style.height = thumbDim.size;
  thumb.style.backgroundColor = 'white';
  thumb.style.borderRadius = '50%';
  thumb.style.border = '1px solid rgba(0, 0, 0, 0.1)';
  thumb.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
  thumb.style.transition = 'all 200ms ease-in-out';
  thumb.style.top = '50%';
  thumb.style.left = '0';
  
  // Position thumb
  const xPos = checked ? thumbDim.checkedPos : '3px';
  thumb.style.transform = `translateY(-50%) translateX(${xPos})`;
  
  switchEl.appendChild(thumb);

  return switchEl;
}

/**
 * Create checkbox visual element
 */
function createCheckboxVisual(size: string, checked: boolean, disabled: boolean, customClasses: string[]): HTMLDivElement {
  const checkboxEl = document.createElement('div');
  
  const checkboxClasses = [
    'relative',
    'inline-block',
    'border-2',
    'transition-all',
    'duration-200',
    checked ? 'bg-primary border-primary' : 'bg-surface-primary border-subtle',
    disabled ? '' : 'hover:border-primary',
    ...getCheckboxSizeClasses(size),
    ...customClasses
  ];

  checkboxEl.className = cn(...checkboxClasses);

  // Create checkmark
  if (checked) {
    const checkmark = document.createElement('div');
    checkmark.className = cn(
      'absolute',
      'inset-0',
      'flex',
      'items-center',
      'justify-center'
    );

    // Create SVG checkmark
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'currentColor');
    const checkmarkClasses = getCheckmarkSizeClasses(size);
    svg.setAttribute('class', cn('text-white', ...checkmarkClasses));

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
    path.setAttribute('clip-rule', 'evenodd');

    svg.appendChild(path);
    checkmark.appendChild(svg);
    checkboxEl.appendChild(checkmark);
  }

  return checkboxEl;
}

/**
 * Create label element
 */
function createLabel(text: string, size: string): HTMLSpanElement {
  const label = document.createElement('span');
  label.textContent = text;
  label.className = cn(
    'text-primary',
    'font-medium',
    getLabelSizeClass(size)
  );
  return label;
}

/**
 * Create spacer between toggle and label
 */
function createSpacer(size: string): HTMLDivElement {
  const spacer = document.createElement('div');
  spacer.className = size === 'sm' ? 'w-2' : size === 'lg' ? 'w-4' : 'w-3';
  return spacer;
}

/**
 * Update switch visual state
 */
function updateSwitchState(switchEl: HTMLElement, checked: boolean): void {
  const thumb = switchEl.querySelector('div') as HTMLDivElement;
  
  // Determine size from switch width
  let size = 'md';
  const width = switchEl.style.width;
  if (width === '48px') size = 'sm';
  else if (width === '64px') size = 'lg';
  
  // Update background and border colors
  switchEl.style.backgroundColor = checked ? '#4A90E2' : '#4B5563';
  switchEl.style.borderColor = checked ? '#3A7BC8' : '#374151';
  
  // Update thumb position
  const thumbPositions = {
    sm: { checkedPos: '22px' },
    md: { checkedPos: '28px' },
    lg: { checkedPos: '34px' }
  };
  
  const pos = thumbPositions[size as keyof typeof thumbPositions] || thumbPositions.md;
  thumb.style.left = '0';
  const xPos = checked ? pos.checkedPos : '3px';
  thumb.style.transform = `translateY(-50%) translateX(${xPos})`;
}

/**
 * Get size from checkbox element
 */
function getCheckboxSize(element: HTMLElement): string {
  if (element.classList.contains('w-4')) return 'sm';
  if (element.classList.contains('w-6')) return 'lg';
  return 'md';
}

/**
 * Update checkbox visual state
 */
function updateCheckboxState(checkboxEl: HTMLElement, checked: boolean): void {
  if (checked) {
    checkboxEl.classList.remove('bg-surface-primary', 'border-subtle');
    checkboxEl.classList.add('bg-primary', 'border-primary');
    
    // Add checkmark if not present
    if (!checkboxEl.querySelector('svg')) {
      const checkmark = document.createElement('div');
      checkmark.className = cn(
        'absolute',
        'inset-0',
        'flex',
        'items-center',
        'justify-center'
      );

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.setAttribute('fill', 'currentColor');
      const checkmarkClasses = getCheckmarkSizeClasses(getCheckboxSize(checkboxEl));
      svg.setAttribute('class', cn('text-white', ...checkmarkClasses));

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
      path.setAttribute('clip-rule', 'evenodd');

      svg.appendChild(path);
      checkmark.appendChild(svg);
      checkboxEl.appendChild(checkmark);
    }
  } else {
    checkboxEl.classList.remove('bg-primary', 'border-primary');
    checkboxEl.classList.add('bg-surface-primary', 'border-subtle');
    
    // Remove checkmark
    const checkmark = checkboxEl.querySelector('div');
    if (checkmark) {
      checkmark.remove();
    }
  }
}


/**
 * Size classes for checkbox
 */
function getCheckboxSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['w-4', 'h-4', 'rounded'];
    case 'lg':
      return ['w-6', 'h-6', 'rounded-md'];
    default: // md
      return ['w-5', 'h-5', 'rounded'];
  }
}


/**
 * Size classes for checkmark SVG
 */
function getCheckmarkSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['w-3', 'h-3'];
    case 'lg':
      return ['w-4', 'h-4'];
    default: // md
      return ['w-3.5', 'h-3.5'];
  }
}

/**
 * Size class for label text
 */
function getLabelSizeClass(size: string): string {
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
 * Utility function to create a switch toggle
 */
export function createSwitchToggle(options: Partial<CreateToggleOptions> = {}): HTMLLabelElement {
  return createToggle({
    variant: 'switch',
    ...options
  });
}

/**
 * Utility function to create a checkbox toggle
 */
export function createCheckboxToggle(options: Partial<CreateToggleOptions> = {}): HTMLLabelElement {
  return createToggle({
    variant: 'checkbox',
    ...options
  });
}