/**
 * Button Element Abstraction
 * Provides a declarative API for creating buttons with consistent styling
 */

import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';
import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateButtonOptions {
  text?: string;
  id?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  customClasses?: string[];
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Creates a button element with consistent styling and behavior
 */
export function createButton(options: CreateButtonOptions): HTMLButtonElement {
  const {
    text,
    id,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    iconSize,
    onClick,
    disabled = false,
    fullWidth = false,
    ariaLabel,
    customClasses = [],
    type = 'button'
  } = options;

  const button = document.createElement('button');
  button.type = type;
  
  if (id) {
    button.id = id;
  }

  // Base classes for all buttons
  const classes = ['btn-base'];

  // Variant-specific classes
  const variantClasses = getVariantClasses(variant);
  classes.push(...variantClasses);

  // Size-specific classes
  const sizeClasses = getSizeClasses(size, !!icon && !text);
  classes.push(...sizeClasses);

  // Width classes
  if (fullWidth) {
    classes.push('w-full');
  }

  // State classes
  if (disabled) {
    classes.push('disabled:opacity-50', 'disabled:cursor-not-allowed');
  }

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  // Apply all classes
  button.className = cn(...classes);

  // Build content
  const content = buildButtonContent(text, icon, iconPosition, iconSize || getIconSizeForButtonSize(size));
  if (content) {
    button.innerHTML = content;
  }

  // Add click handler
  if (onClick && !disabled) {
    addClickAndTouchSupport(button, onClick);
  }

  // Accessibility
  if (disabled) {
    button.disabled = true;
  }
  
  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  } else if (text) {
    button.setAttribute('aria-label', text);
  }

  return button;
}

/**
 * Get variant-specific utility classes
 */
function getVariantClasses(variant: string): string[] {
  switch (variant) {
    case 'primary':
      return [
        'bg-primary',
        'text-on-primary',
        'border-primary-dark',
        'hover:bg-primary-dark',
        'active:scale-95'
      ];
    
    case 'secondary':
      return [
        'bg-secondary',
        'text-on-secondary',
        'border-secondary-dark',
        'hover:bg-secondary-dark',
        'active:scale-95'
      ];
    
    case 'danger':
      return [
        'bg-danger',
        'text-on-danger',
        'border-danger-dark',
        'hover:bg-danger-dark',
        'active:scale-95'
      ];
    
    case 'success':
      return [
        'bg-success',
        'text-on-success',
        'border-success-dark',
        'hover:bg-success-dark',
        'active:scale-95'
      ];
    
    case 'outline':
      return [
        'bg-transparent',
        'text-primary',
        'border-primary',
        'hover:bg-primary',
        'hover:text-on-primary',
        'active:scale-95'
      ];
    
    case 'ghost':
      return [
        'bg-transparent',
        'text-primary',
        'border-transparent',
        'hover:bg-surface-hover',
        'active:scale-95'
      ];
    
    default:
      return [];
  }
}

/**
 * Get size-specific utility classes
 */
function getSizeClasses(size: string, isIconOnly: boolean): string[] {
  if (isIconOnly) {
    // Icon-only buttons have equal padding
    switch (size) {
      case 'sm':
        return ['p-2', 'text-sm', 'rounded'];
      case 'lg':
        return ['p-4', 'text-lg', 'rounded-lg'];
      default: // md
        return ['p-3', 'text-base', 'rounded-md'];
    }
  }

  // Text or text+icon buttons
  switch (size) {
    case 'sm':
      return ['px-3', 'py-2', 'text-sm', 'gap-1', 'rounded'];
    case 'lg':
      return ['px-6', 'py-3', 'text-lg', 'gap-3', 'rounded-lg'];
    default: // md
      return ['px-4', 'py-2', 'text-base', 'gap-2', 'rounded-md'];
  }
}

/**
 * Get appropriate icon size for button size
 */
function getIconSizeForButtonSize(size: string): number {
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
 * Build button content HTML
 */
function buildButtonContent(
  text?: string,
  icon?: IconType,
  iconPosition: 'left' | 'right' = 'left',
  iconSize: number = 20
): string {
  const parts: string[] = [];
  
  const iconHtml = icon ? createSvgIcon(icon, { size: iconSize }) : '';
  const textHtml = text ? `<span>${text}</span>` : '';

  if (icon && text) {
    if (iconPosition === 'left') {
      parts.push(iconHtml, textHtml);
    } else {
      parts.push(textHtml, iconHtml);
    }
  } else if (icon) {
    parts.push(iconHtml);
  } else if (text) {
    parts.push(textHtml);
  }

  return parts.join('');
}

/**
 * Utility function to create a close button
 */
export function createCloseButton(options: Partial<CreateButtonOptions> = {}): HTMLButtonElement {
  return createButton({
    icon: IconType.CLOSE,
    variant: 'ghost',
    size: 'sm',
    ariaLabel: 'Close',
    ...options
  });
}

/**
 * Utility function to create an icon-only button
 */
export function createIconButton(
  icon: IconType,
  options: Partial<CreateButtonOptions> = {}
): HTMLButtonElement {
  return createButton({
    icon,
    ariaLabel: options.ariaLabel || icon,
    ...options
  });
}