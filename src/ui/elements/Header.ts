/**
 * Header Element Abstraction
 * Provides a declarative API for creating consistent dialog headers with close buttons
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { createCloseButton } from './Button';
import type { CreateButtonOptions } from './Button';

export interface CreateHeaderOptions {
  title: string;
  id?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  closeButtonOptions?: Partial<CreateButtonOptions>;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'primary' | 'secondary' | 'compact';
  alignment?: 'left' | 'center' | 'right';
  customClasses?: string[];
  subtitle?: string;
  icon?: HTMLElement | string;
}

/**
 * Creates a header element with consistent styling and optional close button
 */
export function createHeader(options: CreateHeaderOptions): HTMLElement {
  const {
    title,
    id,
    showCloseButton = true,
    onClose,
    closeButtonOptions = {},
    level = 2,
    variant = 'default',
    alignment = 'left',
    customClasses = [],
    subtitle,
    icon
  } = options;

  const header = document.createElement('header');
  
  if (id) {
    header.id = id;
  }

  // Base classes
  const classes = ['header-base'];

  // Variant-specific classes
  const variantClasses = getVariantClasses(variant);
  classes.push(...variantClasses);

  // Alignment classes
  const alignmentClasses = getAlignmentClasses(alignment);
  classes.push(...alignmentClasses);

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  // Apply all classes
  header.className = cn(...classes);

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = cn('header-content', 'flex-1');

  // Add icon if provided
  if (icon) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = cn('header-icon', 'mr-3');
    
    if (typeof icon === 'string') {
      iconWrapper.innerHTML = icon;
    } else {
      iconWrapper.appendChild(icon);
    }
    
    contentWrapper.appendChild(iconWrapper);
  }

  // Create title container
  const titleContainer = document.createElement('div');
  titleContainer.className = cn('header-titles');

  // Create title element
  const HeadingTag = `h${level}` as keyof HTMLElementTagNameMap;
  const titleEl = document.createElement(HeadingTag);
  titleEl.className = cn('header-title', getTitleSizeClass(level));
  titleEl.textContent = title;
  titleContainer.appendChild(titleEl);

  // Add subtitle if provided
  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = cn('header-subtitle', 'text-sm', 'text-muted', 'mt-1');
    subtitleEl.textContent = subtitle;
    titleContainer.appendChild(subtitleEl);
  }

  contentWrapper.appendChild(titleContainer);
  header.appendChild(contentWrapper);

  // Add close button if requested
  if (showCloseButton && onClose) {
    const closeBtn = createCloseButton({
      onClick: onClose,
      customClasses: ['ml-auto'],
      ...closeButtonOptions
    });
    header.appendChild(closeBtn);
  }

  return header;
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
        'px-4',
        'py-3'
      ];
    
    case 'secondary':
      return [
        'bg-surface-secondary',
        'text-foreground',
        'px-4',
        'py-3',
        'border-b',
        'border-surface-border'
      ];
    
    case 'compact':
      return [
        'px-3',
        'py-2'
      ];
    
    default: // 'default'
      return [
        'px-4',
        'py-3',
        'border-b',
        'border-surface-border'
      ];
  }
}

/**
 * Get alignment-specific utility classes
 */
function getAlignmentClasses(alignment: string): string[] {
  switch (alignment) {
    case 'center':
      return ['justify-center', 'text-center'];
    case 'right':
      return ['justify-end', 'text-right'];
    default: // 'left'
      return ['justify-start', 'text-left'];
  }
}

/**
 * Get title size class based on heading level
 */
function getTitleSizeClass(level: number): string {
  switch (level) {
    case 1:
      return 'text-2xl';
    case 2:
      return 'text-xl';
    case 3:
      return 'text-lg';
    case 4:
      return 'text-base';
    case 5:
      return 'text-sm';
    case 6:
      return 'text-xs';
    default:
      return 'text-xl';
  }
}

/**
 * Creates a dialog header with standard styling
 */
export function createDialogHeader(
  title: string,
  onClose: () => void,
  options: Partial<CreateHeaderOptions> = {}
): HTMLElement {
  return createHeader({
    title,
    showCloseButton: true,
    onClose,
    variant: 'default',
    level: 2,
    ...options
  });
}

/**
 * Creates a compact header for smaller UI elements
 */
export function createCompactHeader(
  title: string,
  options: Partial<CreateHeaderOptions> = {}
): HTMLElement {
  return createHeader({
    title,
    variant: 'compact',
    level: 3,
    showCloseButton: false,
    ...options
  });
}