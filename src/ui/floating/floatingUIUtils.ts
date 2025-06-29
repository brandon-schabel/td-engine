import { cn } from '@/ui/styles/UtilityStyles';
import { createButton } from '@/ui/elements';

/**
 * Calculate the optimal position for a floating menu, constraining it to the screen bounds.
 */
export function calculateMenuPosition(
  x: number, 
  y: number, 
  menuWidth: number, 
  menuHeight: number,
  padding: number = 10
): { x: number; y: number } {
  let finalX = x;
  let finalY = y;
  
  // Constrain to right edge
  if (x + menuWidth > window.innerWidth - padding) {
    finalX = window.innerWidth - menuWidth - padding;
  }
  
  // Constrain to bottom edge
  if (y + menuHeight > window.innerHeight - padding) {
    finalY = window.innerHeight - menuHeight - padding;
  }
  
  // Constrain to left edge
  finalX = Math.max(padding, finalX);
  
  // Constrain to top edge
  finalY = Math.max(padding, finalY);
  
  return { x: finalX, y: finalY };
}

/**
 * Constrain a position to screen bounds with optional anchor element.
 */
export function constrainToScreen(
  position: { x: number; y: number },
  size: { width: number; height: number },
  anchor?: HTMLElement,
  offset: number = 10
): { x: number; y: number } {
  let { x, y } = position;
  
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    x = rect.left;
    y = rect.bottom + offset;
  }
  
  return calculateMenuPosition(x, y, size.width, size.height);
}

/**
 * Create a smart updater function that only updates DOM when values change.
 * @param getValues - Function that returns current values
 * @param updateFns - Object mapping keys to update functions
 * @returns Update function that should be called periodically
 */
export function createSmartUpdater<T extends Record<string, any>>(
  getValues: () => T,
  updateFns: Partial<{ [K in keyof T]: (value: T[K]) => void }>
): () => void {
  let lastValues: T | null = null;
  
  return () => {
    const currentValues = getValues();
    
    if (!lastValues) {
      // Initial update - call all functions
      Object.entries(updateFns).forEach(([key, fn]) => {
        if (fn && key in currentValues) {
          (fn as (value: any) => void)(currentValues[key]);
        }
      });
    } else {
      // Update only changed values
      Object.entries(updateFns).forEach(([key, fn]) => {
        if (fn && key in currentValues && lastValues && currentValues[key] !== lastValues[key]) {
          (fn as (value: any) => void)(currentValues[key]);
        }
      });
    }
    
    lastValues = { ...currentValues };
  };
}

/**
 * Check if a value has changed between updates.
 */
export function hasValueChanged(oldVal: any, newVal: any): boolean {
  // Handle objects and arrays with JSON comparison
  if (typeof oldVal === 'object' && oldVal !== null) {
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  }
  return oldVal !== newVal;
}

/**
 * Create an action button with consistent styling.
 */
export function createActionButton(
  text: string,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  enabled: boolean = true
): HTMLElement {
  return createButton({
    text,
    onClick: enabled ? onClick : undefined,
    variant: enabled ? variant : 'secondary',
    disabled: !enabled
  });
}

/**
 * Create a section container with title and content area.
 */
export function createSectionContainer(
  title: string,
  className?: string
): {
  container: HTMLElement;
  content: HTMLElement;
} {
  const container = document.createElement('div');
  container.className = cn('space-y-2', className);
  
  const header = document.createElement('h3');
  header.className = cn('text-sm', 'font-semibold', 'text-white/80');
  header.textContent = title;
  
  const content = document.createElement('div');
  content.className = cn('space-y-2');
  
  container.appendChild(header);
  container.appendChild(content);
  
  return { container, content };
}

/**
 * Create a standard dialog options object.
 */
export interface StandardDialogOptions {
  title: string;
  content: HTMLElement;
  actions?: Array<{
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    enabled?: boolean;
  }>;
  modal?: boolean;
  closeable?: boolean;
  className?: string;
}

/**
 * Create a standard dialog content with optional action buttons.
 */
export function createStandardDialog(options: StandardDialogOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = cn('space-y-4');
  
  // Add content
  container.appendChild(options.content);
  
  // Add action buttons if provided
  if (options.actions && options.actions.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = cn('flex', 'gap-2', 'justify-end', 'pt-2');
    
    options.actions.forEach(action => {
      const button = createActionButton(
        action.text,
        action.onClick,
        action.variant || 'primary',
        action.enabled !== false
      );
      buttonContainer.appendChild(button);
    });
    
    container.appendChild(buttonContainer);
  }
  
  return container;
}

/**
 * Format a number for display with appropriate precision.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (decimals === 0) {
    return Math.floor(value).toString();
  }
  return value.toFixed(decimals);
}

/**
 * Format a percentage value for display.
 */
export function formatPercentage(value: number, includeSign: boolean = true): string {
  const percentage = Math.round(value * 100);
  return includeSign ? `${percentage}%` : percentage.toString();
}

/**
 * Debounce a function to limit how often it can be called.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}