/**
 * IconContainer Element Abstraction
 * Provides a declarative API for creating icon wrappers with consistent styling
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface CreateIconContainerOptions {
  icon?: IconType;
  iconHtml?: string;
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'default' | 'outlined' | 'filled' | 'ghost';
  shape?: 'square' | 'circle';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'muted';
  backgroundColor?: string;
  borderColor?: string;
  onClick?: () => void;
  tooltip?: string;
  customClasses?: string[];
  ariaLabel?: string;
  interactive?: boolean;
  badge?: string | number;
  badgeColor?: 'default' | 'primary' | 'danger' | 'success';
}

/**
 * Creates an icon container element with consistent styling
 */
export function createIconContainer(options: CreateIconContainerOptions): HTMLDivElement {
  const {
    icon,
    iconHtml,
    id,
    size = 'md',
    variant = 'default',
    shape = 'square',
    color = 'default',
    backgroundColor,
    borderColor,
    onClick,
    tooltip,
    customClasses = [],
    ariaLabel,
    interactive = !!onClick,
    badge,
    badgeColor = 'default'
  } = options;

  const container = document.createElement('div');
  
  if (id) {
    container.id = id;
  }

  // Base classes
  const classes = ['icon-container', 'relative', 'inline-flex', 'items-center', 'justify-center'];

  // Size classes
  const sizeClasses = getSizeClasses(size);
  classes.push(...sizeClasses);

  // Shape classes
  if (shape === 'circle') {
    classes.push('rounded-full');
  } else {
    classes.push(getRoundedClass(size));
  }

  // Variant classes
  const variantClasses = getVariantClasses(variant, color);
  classes.push(...variantClasses);

  // Interactive states
  if (interactive) {
    classes.push('cursor-pointer', 'transition-all', 'duration-200');
    
    if (variant === 'ghost') {
      classes.push('hover:bg-surface-hover');
    } else {
      classes.push('hover:scale-110', 'active:scale-95');
    }
  }

  // Custom background/border colors
  if (backgroundColor) {
    container.style.backgroundColor = backgroundColor;
  }
  if (borderColor) {
    container.style.borderColor = borderColor;
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

  // Accessibility
  if (ariaLabel) {
    container.setAttribute('aria-label', ariaLabel);
  }

  if (interactive) {
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'button');
    
    // Click handler
    if (onClick) {
      container.addEventListener('click', onClick);
      
      // Keyboard support
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      });
    }
  }

  // Add icon
  if (icon || iconHtml) {
    const iconElement = document.createElement('span');
    iconElement.className = cn('icon-content', getIconColorClass(color));
    
    const iconSize = getIconSize(size);
    
    if (iconHtml) {
      iconElement.innerHTML = iconHtml;
    } else if (icon) {
      iconElement.innerHTML = createSvgIcon(icon, { size: iconSize });
    }
    
    container.appendChild(iconElement);
  }

  // Add badge if provided
  if (badge !== undefined && badge !== null) {
    const badgeEl = createBadge(badge, badgeColor, size);
    container.appendChild(badgeEl);
  }

  return container;
}

/**
 * Get size-specific classes
 */
function getSizeClasses(size: string | number): string[] {
  if (typeof size === 'number') {
    // Custom size - use inline styles
    return [`w-[${size}px]`, `h-[${size}px]`];
  }

  switch (size) {
    case 'xs':
      return ['w-6', 'h-6'];
    case 'sm':
      return ['w-8', 'h-8'];
    case 'lg':
      return ['w-12', 'h-12'];
    case 'xl':
      return ['w-16', 'h-16'];
    default: // 'md'
      return ['w-10', 'h-10'];
  }
}

/**
 * Get icon size in pixels
 */
function getIconSize(size: string | number): number {
  if (typeof size === 'number') {
    return Math.floor(size * 0.6); // 60% of container size
  }

  switch (size) {
    case 'xs':
      return 14;
    case 'sm':
      return 18;
    case 'lg':
      return 28;
    case 'xl':
      return 36;
    default: // 'md'
      return 24;
  }
}

/**
 * Get rounded class based on size
 */
function getRoundedClass(size: string | number): string {
  if (typeof size === 'number') {
    return 'rounded-md';
  }

  switch (size) {
    case 'xs':
    case 'sm':
      return 'rounded';
    case 'lg':
    case 'xl':
      return 'rounded-lg';
    default:
      return 'rounded-md';
  }
}

/**
 * Get variant-specific classes
 */
function getVariantClasses(variant: string, color: string): string[] {
  switch (variant) {
    case 'outlined':
      return [
        'border-2',
        getBorderColorClass(color),
        'bg-transparent'
      ];
    
    case 'filled':
      return [
        'border',
        'border-transparent',
        getBackgroundColorClass(color)
      ];
    
    case 'ghost':
      return [
        'border',
        'border-transparent',
        'bg-transparent'
      ];
    
    default: // 'default'
      return [
        'border',
        'border-surface-border',
        'bg-surface-secondary'
      ];
  }
}

/**
 * Get icon color class
 */
function getIconColorClass(color: string): string {
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
    case 'muted':
      return 'text-muted';
    default:
      return 'text-foreground';
  }
}

/**
 * Get background color class
 */
function getBackgroundColorClass(color: string): string {
  switch (color) {
    case 'primary':
      return 'bg-primary text-on-primary';
    case 'secondary':
      return 'bg-secondary text-on-secondary';
    case 'success':
      return 'bg-success text-on-success';
    case 'danger':
      return 'bg-danger text-on-danger';
    case 'warning':
      return 'bg-warning text-on-warning';
    case 'muted':
      return 'bg-muted text-on-muted';
    default:
      return 'bg-surface-secondary';
  }
}

/**
 * Get border color class
 */
function getBorderColorClass(color: string): string {
  switch (color) {
    case 'primary':
      return 'border-primary';
    case 'secondary':
      return 'border-secondary';
    case 'success':
      return 'border-success';
    case 'danger':
      return 'border-danger';
    case 'warning':
      return 'border-warning';
    case 'muted':
      return 'border-muted';
    default:
      return 'border-surface-border';
  }
}

/**
 * Create badge element
 */
function createBadge(
  value: string | number,
  color: string,
  containerSize: string | number
): HTMLSpanElement {
  const badge = document.createElement('span');
  
  const badgeClasses = [
    'absolute',
    'rounded-full',
    'flex',
    'items-center',
    'justify-center',
    'font-semibold'
  ];

  // Position and size based on container size
  const positionClasses = getBadgePositionClasses(containerSize);
  badgeClasses.push(...positionClasses);

  // Color classes
  const colorClasses = getBadgeColorClasses(color);
  badgeClasses.push(...colorClasses);

  badge.className = cn(...badgeClasses);
  badge.textContent = String(value);

  return badge;
}

/**
 * Get badge position and size classes
 */
function getBadgePositionClasses(containerSize: string | number): string[] {
  if (typeof containerSize === 'number') {
    return ['-top-1', '-right-1', 'text-xs', 'min-w-[18px]', 'h-[18px]', 'px-1'];
  }

  switch (containerSize) {
    case 'xs':
      return ['-top-1', '-right-1', 'text-xs', 'min-w-[16px]', 'h-[16px]', 'px-0.5'];
    case 'sm':
      return ['-top-1', '-right-1', 'text-xs', 'min-w-[18px]', 'h-[18px]', 'px-1'];
    case 'lg':
      return ['-top-2', '-right-2', 'text-sm', 'min-w-[22px]', 'h-[22px]', 'px-1.5'];
    case 'xl':
      return ['-top-2', '-right-2', 'text-base', 'min-w-[24px]', 'h-[24px]', 'px-2'];
    default: // 'md'
      return ['-top-1', '-right-1', 'text-xs', 'min-w-[20px]', 'h-[20px]', 'px-1'];
  }
}

/**
 * Get badge color classes
 */
function getBadgeColorClasses(color: string): string[] {
  switch (color) {
    case 'primary':
      return ['bg-primary', 'text-on-primary'];
    case 'danger':
      return ['bg-danger', 'text-on-danger'];
    case 'success':
      return ['bg-success', 'text-on-success'];
    default:
      return ['bg-foreground', 'text-background'];
  }
}

/**
 * Utility function to create an icon button
 */
export function createIconButton(
  icon: IconType,
  onClick: () => void,
  options: Partial<CreateIconContainerOptions> = {}
): HTMLDivElement {
  return createIconContainer({
    icon,
    onClick,
    interactive: true,
    variant: 'ghost',
    ...options
  });
}

/**
 * Utility function to create an icon with badge
 */
export function createIconWithBadge(
  icon: IconType,
  badge: string | number,
  options: Partial<CreateIconContainerOptions> = {}
): HTMLDivElement {
  return createIconContainer({
    icon,
    badge,
    ...options
  });
}