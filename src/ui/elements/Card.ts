/**
 * Card Element Abstraction
 * Provides a declarative API for creating card elements with consistent styling
 */

import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateCardOptions {
  id?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  customClasses?: string[];
  ariaLabel?: string;
  role?: string;
}

/**
 * Creates a card element with consistent styling
 */
export function createCard(options: CreateCardOptions = {}): HTMLDivElement {
  const {
    id,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    clickable = false,
    onClick,
    customClasses = [],
    ariaLabel,
    role
  } = options;

  const card = document.createElement('div');
  
  if (id) {
    card.id = id;
  }

  // Base classes for all cards
  const classes = ['card-base'];

  // Variant-specific classes
  const variantClasses = getVariantClasses(variant);
  classes.push(...variantClasses);

  // Padding classes
  const paddingClasses = getPaddingClasses(padding);
  classes.push(...paddingClasses);

  // Interactive states
  if (hoverable || clickable) {
    classes.push('transition-all', 'duration-200');
    
    if (hoverable) {
      classes.push('hover:shadow-lg', 'hover:scale-[1.02]');
    }
    
    if (clickable) {
      classes.push('cursor-pointer', 'active:scale-[0.98]');
    }
  }

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  // Apply all classes
  card.className = cn(...classes);

  // Add click handler
  if (onClick && clickable) {
    card.addEventListener('click', onClick);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', role || 'button');
    
    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });
  }

  // Accessibility
  if (ariaLabel) {
    card.setAttribute('aria-label', ariaLabel);
  }
  
  if (role && !onClick) {
    card.setAttribute('role', role);
  }

  return card;
}

/**
 * Get variant-specific utility classes
 */
function getVariantClasses(variant: string): string[] {
  switch (variant) {
    case 'elevated':
      return [
        'bg-surface',
        'border-surface-border',
        'shadow-md'
      ];
    
    case 'outlined':
      return [
        'bg-transparent',
        'border-2',
        'border-surface-border'
      ];
    
    case 'filled':
      return [
        'bg-surface-secondary',
        'border-surface-border'
      ];
    
    default: // 'default'
      return [
        'bg-surface',
        'border-surface-border',
        'shadow-sm'
      ];
  }
}

/**
 * Get padding-specific utility classes
 */
function getPaddingClasses(padding: string): string[] {
  switch (padding) {
    case 'none':
      return [];
    case 'sm':
      return ['p-2'];
    case 'lg':
      return ['p-6'];
    default: // 'md'
      return ['p-4'];
  }
}

/**
 * Creates a card with header, body, and optional footer sections
 */
export interface CreateStructuredCardOptions extends CreateCardOptions {
  header?: HTMLElement | string;
  body?: HTMLElement | string;
  footer?: HTMLElement | string;
  headerClasses?: string[];
  bodyClasses?: string[];
  footerClasses?: string[];
}

export function createStructuredCard(options: CreateStructuredCardOptions): HTMLDivElement {
  const {
    header,
    body,
    footer,
    headerClasses = [],
    bodyClasses = [],
    footerClasses = [],
    ...cardOptions
  } = options;

  const card = createCard(cardOptions);

  // Header
  if (header) {
    const headerEl = document.createElement('div');
    headerEl.className = cn('card-header', ...headerClasses);
    
    if (typeof header === 'string') {
      headerEl.innerHTML = header;
    } else {
      headerEl.appendChild(header);
    }
    
    card.appendChild(headerEl);
  }

  // Body
  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = cn('card-body', ...bodyClasses);
    
    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else {
      bodyEl.appendChild(body);
    }
    
    card.appendChild(bodyEl);
  }

  // Footer
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = cn('card-footer', ...footerClasses);
    
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
    
    card.appendChild(footerEl);
  }

  return card;
}

/**
 * Utility function to create a clickable card
 */
export function createClickableCard(
  onClick: () => void,
  options: Partial<CreateCardOptions> = {}
): HTMLDivElement {
  return createCard({
    clickable: true,
    hoverable: true,
    onClick,
    ...options
  });
}