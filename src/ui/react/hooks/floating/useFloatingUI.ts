import { useMemo } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  size,
  limitShift,
  hide,
  UseFloatingOptions,
  Middleware,
  Placement,
  Strategy,
  FloatingContext,
} from '@floating-ui/react';

export interface FloatingUIOptions extends Omit<UseFloatingOptions, 'middleware'> {
  /** Distance between the reference and floating element */
  offset?: number | { mainAxis?: number; crossAxis?: number };
  /** Whether to flip the placement when there's not enough space */
  flip?: boolean;
  /** Whether to shift the floating element to stay in view */
  shift?: boolean;
  /** Padding from the viewport edges */
  padding?: number;
  /** Whether to hide the floating element when the reference is hidden */
  hideWhenDetached?: boolean;
  /** Whether to match the width of the reference element */
  matchWidth?: boolean;
  /** Custom middleware to add */
  middleware?: Middleware[];
  /** Whether to use autoUpdate for position updates */
  enableAutoUpdate?: boolean;
  /** Auto update options */
  autoUpdateOptions?: Parameters<typeof autoUpdate>[2];
}

/**
 * Enhanced wrapper around Floating UI's useFloating hook
 * Provides sensible defaults and common middleware configurations
 */
export function useFloatingUI({
  offset: offsetValue = 8,
  flip: enableFlip = true,
  shift: enableShift = true,
  padding = 8,
  hideWhenDetached = true,
  matchWidth = false,
  middleware: customMiddleware = [],
  enableAutoUpdate = true,
  autoUpdateOptions,
  placement = 'bottom',
  strategy = 'absolute',
  ...options
}: FloatingUIOptions = {}) {
  // Build middleware array based on options
  const middleware = useMemo(() => {
    const middlewareArray: Middleware[] = [];

    // Offset
    middlewareArray.push(offset(offsetValue));

    // Flip placement when there's not enough space
    if (enableFlip) {
      middlewareArray.push(flip({ padding }));
    }

    // Shift to keep in view
    if (enableShift) {
      middlewareArray.push(
        shift({
          padding,
          limiter: limitShift(),
        })
      );
    }

    // Match reference width
    if (matchWidth) {
      middlewareArray.push(
        size({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`,
            });
          },
        })
      );
    }

    // Hide when reference is detached
    if (hideWhenDetached) {
      middlewareArray.push(hide());
    }

    // Add custom middleware
    middlewareArray.push(...customMiddleware);

    return middlewareArray;
  }, [offsetValue, enableFlip, enableShift, padding, matchWidth, hideWhenDetached, customMiddleware]);

  // Use floating with configured middleware
  const floating = useFloating({
    placement,
    strategy,
    middleware,
    whileElementsMounted: enableAutoUpdate ? (...args) => autoUpdate(...args, autoUpdateOptions) : undefined,
    ...options,
  });

  return {
    ...floating,
    // Additional utilities
    floatingStyles: {
      ...floating.floatingStyles,
      visibility: floating.middlewareData.hide?.referenceHidden ? 'hidden' : 'visible',
    },
  };
}

/**
 * Common preset configurations
 */
export const floatingPresets = {
  tooltip: {
    placement: 'top' as Placement,
    offset: 8,
    flip: true,
    shift: true,
    padding: 8,
  },
  dropdown: {
    placement: 'bottom-start' as Placement,
    offset: 4,
    flip: true,
    shift: true,
    matchWidth: true,
  },
  popover: {
    placement: 'bottom' as Placement,
    offset: 8,
    flip: true,
    shift: true,
    padding: 16,
  },
  contextMenu: {
    placement: 'bottom-start' as Placement,
    offset: 0,
    flip: true,
    shift: true,
    strategy: 'fixed' as Strategy,
  },
} as const;