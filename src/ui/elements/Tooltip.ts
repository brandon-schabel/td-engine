/**
 * Tooltip Element Abstraction
 * Provides a declarative API for creating tooltips with consistent styling
 */

import { cn } from '@/ui/styles/UtilityStyles';

export interface CreateTooltipOptions {
  content: string | HTMLElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  offset?: number;
  maxWidth?: number;
  trigger?: 'hover' | 'click' | 'focus';
  showArrow?: boolean;
  customClasses?: string[];
  containerClasses?: string[];
}

export interface TooltipInstance {
  container: HTMLDivElement;
  show: () => void;
  hide: () => void;
  updateContent: (content: string | HTMLElement) => void;
  destroy: () => void;
}

/**
 * Creates a tooltip for an element
 */
export function createTooltip(
  targetElement: HTMLElement,
  options: CreateTooltipOptions
): TooltipInstance {
  const {
    content,
    position = 'top',
    delay = 500,
    offset = 8,
    maxWidth = 200,
    trigger = 'hover',
    showArrow = true,
    customClasses = [],
    containerClasses = []
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = cn(
    'relative',
    'inline-block',
    ...containerClasses
  );

  // Wrap target element
  if (targetElement.parentNode) {
    targetElement.parentNode.insertBefore(container, targetElement);
  }
  container.appendChild(targetElement);

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = cn(
    'absolute',
    'z-50',
    'pointer-events-none',
    'opacity-0',
    'transition-opacity',
    'duration-200',
    'invisible',
    ...customClasses
  );
  
  tooltip.style.maxWidth = `${maxWidth}px`;

  // Create tooltip content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = cn(
    'px-3',
    'py-2',
    'text-sm',
    'text-white',
    'bg-gray-900',
    'rounded-md',
    'shadow-lg',
    'whitespace-normal',
    'break-words'
  );

  // Set initial content
  updateTooltipContent(contentWrapper, content);

  // Create arrow if needed
  let arrow: HTMLDivElement | null = null;
  if (showArrow) {
    arrow = createArrow(position);
    tooltip.appendChild(arrow);
  }

  tooltip.appendChild(contentWrapper);
  container.appendChild(tooltip);

  // Position the tooltip
  let showTimeout: NodeJS.Timeout | null = null;
  let hideTimeout: NodeJS.Timeout | null = null;

  const positionTooltip = () => {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Reset position classes
    tooltip.className = cn(
      'absolute',
      'z-50',
      'pointer-events-none',
      'transition-opacity',
      'duration-200',
      tooltip.classList.contains('opacity-100') ? 'opacity-100' : 'opacity-0',
      tooltip.classList.contains('visible') ? 'visible' : 'invisible',
      ...customClasses
    );

    // Calculate position
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = -(tooltipRect.height + offset);
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      
      case 'bottom':
        top = targetRect.height + offset;
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      
      case 'left':
        top = (targetRect.height - tooltipRect.height) / 2;
        left = -(tooltipRect.width + offset);
        break;
      
      case 'right':
        top = (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.width + offset;
        break;
    }

    // Apply position
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Check if tooltip goes outside viewport and adjust
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const absoluteRect = {
      top: containerRect.top + top,
      left: containerRect.left + left,
      right: containerRect.left + left + tooltipRect.width,
      bottom: containerRect.top + top + tooltipRect.height
    };

    // Adjust horizontal position if needed
    if (absoluteRect.left < 0) {
      tooltip.style.left = `${left - absoluteRect.left + 10}px`;
    } else if (absoluteRect.right > viewportWidth) {
      tooltip.style.left = `${left - (absoluteRect.right - viewportWidth) - 10}px`;
    }

    // Adjust vertical position if needed
    if (absoluteRect.top < 0 && (position === 'top' || position === 'left' || position === 'right')) {
      // Flip to bottom
      tooltip.style.top = `${targetRect.height + offset}px`;
      if (arrow) {
        arrow.className = cn(...getArrowClasses('bottom'));
      }
    } else if (absoluteRect.bottom > viewportHeight && (position === 'bottom' || position === 'left' || position === 'right')) {
      // Flip to top
      tooltip.style.top = `${-(tooltipRect.height + offset)}px`;
      if (arrow) {
        arrow.className = cn(...getArrowClasses('top'));
      }
    }
  };

  const show = () => {
    if (showTimeout) clearTimeout(showTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);

    showTimeout = setTimeout(() => {
      positionTooltip();
      tooltip.classList.remove('opacity-0', 'invisible');
      tooltip.classList.add('opacity-100', 'visible');
    }, delay);
  };

  const hide = () => {
    if (showTimeout) clearTimeout(showTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);

    hideTimeout = setTimeout(() => {
      tooltip.classList.remove('opacity-100', 'visible');
      tooltip.classList.add('opacity-0', 'invisible');
    }, 100);
  };

  // Event handlers based on trigger
  if (trigger === 'hover') {
    targetElement.addEventListener('mouseenter', show);
    targetElement.addEventListener('mouseleave', hide);
    targetElement.addEventListener('focus', show);
    targetElement.addEventListener('blur', hide);
  } else if (trigger === 'click') {
    targetElement.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tooltip.classList.contains('opacity-100')) {
        hide();
      } else {
        show();
      }
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        hide();
      }
    });
  } else if (trigger === 'focus') {
    targetElement.addEventListener('focus', show);
    targetElement.addEventListener('blur', hide);
  }

  // Update content function
  const updateContent = (newContent: string | HTMLElement) => {
    updateTooltipContent(contentWrapper, newContent);
    if (tooltip.classList.contains('opacity-100')) {
      positionTooltip();
    }
  };

  // Destroy function
  const destroy = () => {
    if (showTimeout) clearTimeout(showTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);
    
    // Remove event listeners
    targetElement.removeEventListener('mouseenter', show);
    targetElement.removeEventListener('mouseleave', hide);
    targetElement.removeEventListener('focus', show);
    targetElement.removeEventListener('blur', hide);
    
    // Restore original DOM structure
    if (container.parentNode) {
      container.parentNode.insertBefore(targetElement, container);
      container.remove();
    }
  };

  return {
    container,
    show,
    hide,
    updateContent,
    destroy
  };
}

/**
 * Update tooltip content
 */
function updateTooltipContent(wrapper: HTMLElement, content: string | HTMLElement): void {
  if (typeof content === 'string') {
    wrapper.textContent = content;
  } else {
    wrapper.innerHTML = '';
    wrapper.appendChild(content);
  }
}

/**
 * Create arrow element
 */
function createArrow(position: string): HTMLDivElement {
  const arrow = document.createElement('div');
  arrow.className = cn(...getArrowClasses(position));
  return arrow;
}

/**
 * Get arrow classes based on position
 */
function getArrowClasses(position: string): string[] {
  const baseClasses = [
    'absolute',
    'w-0',
    'h-0',
    'border-transparent',
    'border-solid'
  ];

  switch (position) {
    case 'top':
      return [
        ...baseClasses,
        'bottom-[-8px]',
        'left-1/2',
        '-translate-x-1/2',
        'border-t-gray-900',
        'border-t-8',
        'border-x-8'
      ];
    
    case 'bottom':
      return [
        ...baseClasses,
        'top-[-8px]',
        'left-1/2',
        '-translate-x-1/2',
        'border-b-gray-900',
        'border-b-8',
        'border-x-8'
      ];
    
    case 'left':
      return [
        ...baseClasses,
        'right-[-8px]',
        'top-1/2',
        '-translate-y-1/2',
        'border-l-gray-900',
        'border-l-8',
        'border-y-8'
      ];
    
    case 'right':
      return [
        ...baseClasses,
        'left-[-8px]',
        'top-1/2',
        '-translate-y-1/2',
        'border-r-gray-900',
        'border-r-8',
        'border-y-8'
      ];
    
    default:
      return baseClasses;
  }
}

/**
 * Utility function to add tooltip to an element
 */
export function addTooltip(
  element: HTMLElement,
  content: string,
  options: Partial<CreateTooltipOptions> = {}
): TooltipInstance {
  return createTooltip(element, {
    content,
    ...options
  });
}

/**
 * Utility function to create a help tooltip
 */
export function createHelpTooltip(
  element: HTMLElement,
  helpText: string,
  options: Partial<CreateTooltipOptions> = {}
): TooltipInstance {
  return createTooltip(element, {
    content: helpText,
    position: 'top',
    delay: 300,
    ...options
  });
}

/**
 * Utility function to create a tooltip with custom content
 */
export function createRichTooltip(
  element: HTMLElement,
  contentBuilder: () => HTMLElement,
  options: Partial<CreateTooltipOptions> = {}
): TooltipInstance {
  return createTooltip(element, {
    content: contentBuilder(),
    maxWidth: 300,
    ...options
  });
}