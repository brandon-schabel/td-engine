/**
 * StatDisplay Element Abstraction
 * Provides a declarative API for creating reusable stat grids and displays
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface Stat {
  label: string;
  value: string | number;
  icon?: IconType;
  iconHtml?: string;
  valueColor?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  suffix?: string;
  prefix?: string;
  tooltip?: string;
}

export interface CreateStatDisplayOptions {
  stats: Stat[];
  id?: string;
  layout?: 'grid' | 'list' | 'inline';
  columns?: 1 | 2 | 3 | 4 | 'auto';
  variant?: 'default' | 'compact' | 'large' | 'minimal';
  showLabels?: boolean;
  showIcons?: boolean;
  gap?: 'sm' | 'md' | 'lg';
  customClasses?: string[];
}

/**
 * Creates a stat display element with consistent styling
 */
export function createStatDisplay(options: CreateStatDisplayOptions): HTMLDivElement {
  const {
    stats,
    id,
    layout = 'grid',
    columns = 'auto',
    variant = 'default',
    showLabels = true,
    showIcons = true,
    gap = 'md',
    customClasses = []
  } = options;

  const container = document.createElement('div');
  
  if (id) {
    container.id = id;
  }

  // Base classes
  const classes = ['stat-display'];

  // Layout-specific classes
  const layoutClasses = getLayoutClasses(layout, columns, gap);
  classes.push(...layoutClasses);

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  // Apply all classes
  container.className = cn(...classes);

  // Create stat items
  stats.forEach((stat) => {
    const statItem = createStatItem(stat, { variant, showLabels, showIcons });
    container.appendChild(statItem);
  });

  return container;
}

/**
 * Creates an individual stat item
 */
function createStatItem(
  stat: Stat,
  options: {
    variant: string;
    showLabels: boolean;
    showIcons: boolean;
  }
): HTMLDivElement {
  const { variant, showLabels, showIcons } = options;
  
  const item = document.createElement('div');
  item.className = cn('stat-item', ...getVariantClasses(variant));

  // Add tooltip if provided
  if (stat.tooltip) {
    item.setAttribute('title', stat.tooltip);
  }

  // Icon
  if (showIcons && (stat.icon || stat.iconHtml)) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = cn('stat-icon', getIconSizeClass(variant));
    
    if (stat.iconHtml) {
      iconWrapper.innerHTML = stat.iconHtml;
    } else if (stat.icon) {
      iconWrapper.innerHTML = createSvgIcon(stat.icon, { 
        size: getIconSize(variant) 
      });
    }
    
    item.appendChild(iconWrapper);
  }

  // Content wrapper
  const content = document.createElement('div');
  content.className = cn('stat-content');

  // Label
  if (showLabels) {
    const label = document.createElement('div');
    label.className = cn('stat-label', getLabelSizeClass(variant));
    label.textContent = stat.label;
    content.appendChild(label);
  }

  // Value
  const valueWrapper = document.createElement('div');
  valueWrapper.className = cn('stat-value', getValueSizeClass(variant));

  // Build value with prefix/suffix
  const valueParts: string[] = [];
  if (stat.prefix) valueParts.push(stat.prefix);
  valueParts.push(String(stat.value));
  if (stat.suffix) valueParts.push(stat.suffix);

  valueWrapper.textContent = valueParts.join('');
  
  // Apply value color
  if (stat.valueColor && stat.valueColor !== 'default') {
    valueWrapper.classList.add(getValueColorClass(stat.valueColor));
  }

  content.appendChild(valueWrapper);
  item.appendChild(content);

  return item;
}

/**
 * Get layout-specific utility classes
 */
function getLayoutClasses(layout: string, columns: number | 'auto', gap: string): string[] {
  const gapClass = getGapClass(gap);
  
  switch (layout) {
    case 'list':
      return ['flex', 'flex-col', gapClass];
    
    case 'inline':
      return ['flex', 'flex-wrap', gapClass];
    
    default: // 'grid'
      const gridCols = getGridColumnsClass(columns);
      return ['grid', gridCols, gapClass];
  }
}

/**
 * Get grid columns class
 */
function getGridColumnsClass(columns: number | 'auto'): string {
  if (columns === 'auto') {
    return 'grid-cols-auto-fit';
  }
  
  switch (columns) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-3';
    case 4:
      return 'grid-cols-4';
    default:
      return 'grid-cols-2';
  }
}

/**
 * Get gap class
 */
function getGapClass(gap: string): string {
  switch (gap) {
    case 'sm':
      return 'gap-2';
    case 'lg':
      return 'gap-6';
    default: // 'md'
      return 'gap-4';
  }
}

/**
 * Get variant-specific classes for stat items
 */
function getVariantClasses(variant: string): string[] {
  switch (variant) {
    case 'compact':
      return ['flex', 'items-center', 'gap-2'];
    
    case 'large':
      return ['text-center', 'p-4'];
    
    case 'minimal':
      return ['flex', 'items-baseline', 'gap-1'];
    
    default: // 'default'
      return ['flex', 'items-start', 'gap-3'];
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
      return 32;
    case 'minimal':
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
      return 'w-8 h-8';
    case 'minimal':
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
      return 'text-base';
    case 'minimal':
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
      return 'text-base font-medium';
    case 'large':
      return 'text-2xl font-bold';
    case 'minimal':
      return 'text-sm font-medium';
    default:
      return 'text-lg font-semibold';
  }
}

/**
 * Get value color class
 */
function getValueColorClass(color: string): string {
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
      return 'text-foreground';
  }
}

/**
 * Utility function to create a simple stat grid
 */
export function createStatGrid(
  stats: Stat[],
  options: Partial<CreateStatDisplayOptions> = {}
): HTMLDivElement {
  return createStatDisplay({
    stats,
    layout: 'grid',
    columns: 2,
    ...options
  });
}

/**
 * Utility function to create an inline stat display
 */
export function createInlineStats(
  stats: Stat[],
  options: Partial<CreateStatDisplayOptions> = {}
): HTMLDivElement {
  return createStatDisplay({
    stats,
    layout: 'inline',
    variant: 'minimal',
    gap: 'sm',
    ...options
  });
}