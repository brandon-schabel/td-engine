/**
 * ResourceDisplay Element Abstraction
 * Provides a declarative API for creating currency/resource displays
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface CreateResourceDisplayOptions {
  value: number | string;
  id?: string;
  icon?: IconType;
  iconHtml?: string;
  label?: string;
  variant?: 'default' | 'compact' | 'large' | 'inline' | 'badge';
  showLabel?: boolean;
  showIcon?: boolean;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percent' | 'custom';
  formatter?: (value: number | string) => string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  customClasses?: string[];
  tooltip?: string;
  onChange?: (oldValue: number | string, newValue: number | string) => void;
}

/**
 * Creates a resource display element with consistent styling
 */
export function createResourceDisplay(options: CreateResourceDisplayOptions): HTMLDivElement {
  const {
    value,
    id,
    icon = IconType.COINS,
    iconHtml,
    label = 'Coins',
    variant = 'default',
    showLabel = false,
    showIcon = true,
    prefix,
    suffix,
    format = 'number',
    formatter,
    color = 'default',
    customClasses = [],
    tooltip,
    onChange
  } = options;

  const container = document.createElement('div');
  
  if (id) {
    container.id = id;
  }

  // Store current value for change detection
  container.dataset.currentValue = String(value);

  // Base classes
  const classes = ['resource-display'];

  // Variant-specific classes
  const variantClasses = getVariantClasses(variant);
  classes.push(...variantClasses);

  // Color classes
  if (color !== 'default') {
    classes.push(getColorClass(color));
  }

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  // Apply all classes
  container.className = cn(...classes);

  // Add tooltip
  if (tooltip) {
    container.setAttribute('title', tooltip);
  }

  // Build content
  updateResourceContent(container, {
    value,
    icon,
    iconHtml,
    label,
    variant,
    showLabel,
    showIcon,
    prefix,
    suffix,
    format,
    formatter
  });

  // Create update method
  (container as any).updateValue = (newValue: number | string) => {
    const oldValue = container.dataset.currentValue;
    if (String(newValue) !== oldValue) {
      container.dataset.currentValue = String(newValue);
      
      updateResourceContent(container, {
        value: newValue,
        icon,
        iconHtml,
        label,
        variant,
        showLabel,
        showIcon,
        prefix,
        suffix,
        format,
        formatter
      });

      // Trigger change callback
      if (onChange) {
        onChange(oldValue || '', newValue);
      }

      // Add animation class
      container.classList.add('resource-updated');
      setTimeout(() => container.classList.remove('resource-updated'), 300);
    }
  };

  return container;
}

/**
 * Update resource display content
 */
function updateResourceContent(
  container: HTMLDivElement,
  options: {
    value: number | string;
    icon?: IconType;
    iconHtml?: string;
    label?: string;
    variant: string;
    showLabel: boolean;
    showIcon: boolean;
    prefix?: string;
    suffix?: string;
    format: string;
    formatter?: (value: number | string) => string;
  }
): void {
  const {
    value,
    icon,
    iconHtml,
    label,
    variant,
    showLabel,
    showIcon,
    prefix,
    suffix,
    format,
    formatter
  } = options;

  // Clear existing content
  container.innerHTML = '';

  // Icon
  if (showIcon && (icon || iconHtml)) {
    const iconWrapper = document.createElement('span');
    iconWrapper.className = cn('resource-icon', getIconSizeClass(variant));
    
    if (iconHtml) {
      iconWrapper.innerHTML = iconHtml;
    } else if (icon) {
      iconWrapper.innerHTML = createSvgIcon(icon, { 
        size: getIconSize(variant) 
      });
    }
    
    container.appendChild(iconWrapper);
  }

  // Label
  if (showLabel && label) {
    const labelEl = document.createElement('span');
    labelEl.className = cn('resource-label', getLabelSizeClass(variant));
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  // Value
  const valueEl = document.createElement('span');
  valueEl.className = cn('resource-value', getValueSizeClass(variant));
  
  // Format value
  let formattedValue: string;
  if (formatter) {
    formattedValue = formatter(value);
  } else {
    formattedValue = formatValue(value, format);
  }

  // Add prefix/suffix
  const valueParts: string[] = [];
  if (prefix) valueParts.push(prefix);
  valueParts.push(formattedValue);
  if (suffix) valueParts.push(suffix);

  valueEl.textContent = valueParts.join('');
  container.appendChild(valueEl);
}

/**
 * Format value based on format type
 */
function formatValue(value: number | string, format: string): string {
  // For custom format, return the value as-is
  if (format === 'custom') {
    return String(value);
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check for NaN and handle it gracefully
  if (isNaN(numValue)) {
    return String(value);
  }
  
  switch (format) {
    case 'currency':
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    
    case 'percent':
      return `${(numValue * 100).toFixed(1)}%`;
    
    case 'number':
    default:
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(1)}K`;
      }
      return String(numValue);
  }
}

/**
 * Get variant-specific classes
 */
function getVariantClasses(variant: string): string[] {
  switch (variant) {
    case 'compact':
      return [
        'flex', 
        'items-center', 
        'gap-1',
        'px-3',
        'py-1.5',
        'bg-surface-secondary',
        'rounded-md',
        'border',
        'border-surface-border'
      ];
    
    case 'large':
      return [
        'flex', 
        'items-center', 
        'gap-3', 
        'p-3',
        'bg-surface-secondary',
        'rounded-lg',
        'border',
        'border-surface-border'
      ];
    
    case 'inline':
      return ['inline-flex', 'items-baseline', 'gap-1'];
    
    case 'badge':
      return [
        'inline-flex',
        'items-center',
        'gap-1',
        'px-2',
        'py-1',
        'rounded-full',
        'bg-surface-secondary',
        'border',
        'border-surface-border'
      ];
    
    default: // 'default'
      return [
        'flex', 
        'items-center', 
        'gap-2',
        'px-3',
        'py-2',
        'bg-surface-secondary',
        'rounded-md',
        'border',
        'border-surface-border'
      ];
  }
}

/**
 * Get color class
 */
function getColorClass(color: string): string {
  switch (color) {
    case 'primary':
      return 'text-primary';
    case 'secondary':
      return 'text-secondary';
    case 'success':
      return 'text-success';
    case 'danger':
      return 'text-danger';
    case 'warning':
      return 'text-warning';
    default:
      return '';
  }
}

/**
 * Get icon size based on variant
 */
function getIconSize(variant: string): number {
  switch (variant) {
    case 'compact':
      return 16;
    case 'large':
      return 28;
    case 'inline':
      return 14;
    case 'badge':
      return 14;
    default:
      return 20;
  }
}

/**
 * Get icon size class
 */
function getIconSizeClass(variant: string): string {
  switch (variant) {
    case 'compact':
      return 'w-4 h-4';
    case 'large':
      return 'w-7 h-7';
    case 'inline':
      return 'w-3.5 h-3.5';
    case 'badge':
      return 'w-3.5 h-3.5';
    default:
      return 'w-5 h-5';
  }
}

/**
 * Get label size class
 */
function getLabelSizeClass(variant: string): string {
  switch (variant) {
    case 'large':
      return 'text-base font-medium';
    case 'inline':
    case 'badge':
      return 'text-xs';
    default:
      return 'text-sm';
  }
}

/**
 * Get value size class
 */
function getValueSizeClass(variant: string): string {
  switch (variant) {
    case 'compact':
      return 'text-base font-semibold';
    case 'large':
      return 'text-2xl font-bold';
    case 'inline':
      return 'text-sm font-medium';
    case 'badge':
      return 'text-xs font-semibold';
    default:
      return 'text-lg font-semibold';
  }
}

/**
 * Utility function to create a currency display
 */
export function createCurrencyDisplay(
  value: number,
  options: Partial<CreateResourceDisplayOptions> = {}
): HTMLDivElement {
  return createResourceDisplay({
    value,
    icon: IconType.COINS,
    format: 'currency',
    showIcon: true,
    ...options
  });
}

/**
 * Utility function to create a compact resource display
 */
export function createCompactResource(
  value: number,
  icon: IconType,
  options: Partial<CreateResourceDisplayOptions> = {}
): HTMLDivElement {
  return createResourceDisplay({
    value,
    icon,
    variant: 'compact',
    showIcon: true,
    ...options
  });
}

/**
 * Utility function to create a resource badge
 */
export function createResourceBadge(
  value: number,
  label: string,
  options: Partial<CreateResourceDisplayOptions> = {}
): HTMLDivElement {
  return createResourceDisplay({
    value,
    label,
    variant: 'badge',
    showLabel: true,
    showIcon: false,
    ...options
  });
}