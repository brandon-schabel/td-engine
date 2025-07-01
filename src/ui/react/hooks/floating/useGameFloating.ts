import { useEffect, useRef, useCallback } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  size,
  UseFloatingOptions,
  Middleware,
  Placement,
} from '@floating-ui/react';
import type { Game } from '@/core/Game';

export interface GameFloatingOptions extends Omit<UseFloatingOptions, 'middleware'> {
  /** Track a world position and convert to screen coordinates */
  trackWorldPosition?: { x: number; y: number };
  /** Additional middleware to apply */
  middleware?: Middleware[];
  /** Default offset from the reference element */
  offsetDistance?: number;
  /** Padding from viewport edges */
  viewportPadding?: number;
  /** Whether to show an arrow pointing to the reference */
  showArrow?: boolean;
  /** Update strategy for world position tracking */
  updateStrategy?: 'raf' | 'auto' | 'manual';
}

/**
 * Hook that integrates Floating UI with the game's coordinate system
 * Handles world-to-screen conversions and game-specific positioning
 */
export function useGameFloating(options: GameFloatingOptions = {}) {
  const {
    trackWorldPosition,
    middleware = [],
    offsetDistance = 8,
    viewportPadding = 8,
    showArrow = false,
    updateStrategy = 'auto',
    placement = 'top',
    ...floatingOptions
  } = options;

  // Get game instance
  const game = (window as any).currentGame as Game | undefined;
  const camera = game?.getCamera();
  
  // Reference to virtual element for world position tracking
  const virtualEl = useRef<HTMLElement | null>(null);
  const rafId = useRef<number | null>(null);

  // Build middleware array
  const defaultMiddleware: Middleware[] = [
    offset(offsetDistance),
    flip({
      padding: viewportPadding,
    }),
    shift({
      padding: viewportPadding,
    }),
  ];

  if (showArrow) {
    defaultMiddleware.push(arrow({ padding: 8 }));
  }

  // Use Floating UI
  const floating = useFloating({
    placement,
    middleware: [...defaultMiddleware, ...middleware],
    whileElementsMounted: trackWorldPosition ? undefined : autoUpdate,
    ...floatingOptions,
  });

  // Update virtual element position based on world coordinates
  const updateWorldPosition = useCallback(() => {
    if (!trackWorldPosition || !camera || !virtualEl.current) return;

    const screenPos = camera.worldToScreen(trackWorldPosition);
    
    // Update virtual element's getBoundingClientRect
    (virtualEl.current as any).getBoundingClientRect = () => ({
      x: screenPos.x,
      y: screenPos.y,
      width: 0,
      height: 0,
      top: screenPos.y,
      left: screenPos.x,
      right: screenPos.x,
      bottom: screenPos.y,
    });

    // Trigger position update
    floating.update();
  }, [trackWorldPosition, camera, floating]);

  // Create virtual element for world position tracking
  useEffect(() => {
    if (!trackWorldPosition) return;

    // Create a virtual element that provides getBoundingClientRect
    virtualEl.current = {
      getBoundingClientRect() {
        const screenPos = camera?.worldToScreen(trackWorldPosition) || { x: 0, y: 0 };
        return {
          x: screenPos.x,
          y: screenPos.y,
          width: 0,
          height: 0,
          top: screenPos.y,
          left: screenPos.x,
          right: screenPos.x,
          bottom: screenPos.y,
        };
      },
    } as any;

    // Set as reference
    floating.refs.setReference(virtualEl.current);
  }, [trackWorldPosition, camera, floating.refs]);

  // Handle position updates based on strategy
  useEffect(() => {
    if (!trackWorldPosition || updateStrategy === 'manual') return;

    if (updateStrategy === 'raf') {
      // Use requestAnimationFrame for smooth updates
      const updateLoop = () => {
        updateWorldPosition();
        rafId.current = requestAnimationFrame(updateLoop);
      };
      rafId.current = requestAnimationFrame(updateLoop);

      return () => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
      };
    } else if (updateStrategy === 'auto') {
      // Use autoUpdate for efficient updates
      const cleanup = autoUpdate(
        virtualEl.current!,
        floating.refs.floating.current!,
        updateWorldPosition,
        {
          animationFrame: true,
        }
      );
      return cleanup;
    }
  }, [trackWorldPosition, updateStrategy, updateWorldPosition, floating.refs.floating]);

  // Check if position is visible on screen
  const isVisible = useCallback(() => {
    if (!floating.x || !floating.y) return false;
    
    const { innerWidth, innerHeight } = window;
    return (
      floating.x >= -100 &&
      floating.x <= innerWidth + 100 &&
      floating.y >= -100 &&
      floating.y <= innerHeight + 100
    );
  }, [floating.x, floating.y]);

  return {
    ...floating,
    isVisible,
    updateWorldPosition,
    game,
    camera,
  };
}