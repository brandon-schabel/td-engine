import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FloatingPortal } from './FloatingPortal';

export interface DraggablePanelProps {
  /** Unique ID for saving position */
  id: string;
  /** Panel content */
  children: React.ReactNode;
  /** Initial position if no saved position */
  defaultPosition?: { x: number; y: number };
  /** Whether dragging is enabled */
  draggable?: boolean;
  /** Whether to save position to localStorage */
  persistent?: boolean;
  /** Callback when panel is dragged */
  onDrag?: (position: { x: number; y: number }) => void;
  /** Class name for the panel */
  className?: string;
  /** Drag handle element (defaults to entire panel) */
  dragHandle?: React.ReactNode;
  /** Whether to constrain to viewport */
  constrainToViewport?: boolean;
  /** Z-index for stacking */
  zIndex?: number;
}

/**
 * Draggable panel component that can be moved around the screen
 * Saves position to localStorage and constrains to viewport
 */
export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  children,
  defaultPosition = { x: 20, y: 20 },
  draggable = true,
  persistent = true,
  onDrag,
  className,
  dragHandle,
  constrainToViewport = true,
  zIndex = 100,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    if (persistent) {
      const savedPosition = localStorage.getItem(`draggable-${id}`);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          setPosition(parsed);
        } catch (e) {
          console.error('Failed to parse saved position:', e);
        }
      }
    }
  }, [id, persistent]);

  // Save position to localStorage
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    if (persistent) {
      localStorage.setItem(`draggable-${id}`, JSON.stringify(pos));
    }
  }, [id, persistent]);

  // Constrain position to viewport
  const constrainPosition = useCallback((x: number, y: number) => {
    if (!constrainToViewport || !panelRef.current) return { x, y };

    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }, [constrainToViewport]);

  // Handle drag end
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newPosition = constrainPosition(
      position.x + info.offset.x,
      position.y + info.offset.y
    );
    
    setPosition(newPosition);
    savePosition(newPosition);
    setIsDragging(false);
    
    if (onDrag) {
      onDrag(newPosition);
    }
  }, [position, constrainPosition, savePosition, onDrag]);

  // Create drag constraints element
  useEffect(() => {
    if (constrainToViewport && dragConstraintsRef.current) {
      // Set constraints to viewport size with padding
      const padding = 0;
      dragConstraintsRef.current.style.position = 'fixed';
      dragConstraintsRef.current.style.top = `${padding}px`;
      dragConstraintsRef.current.style.left = `${padding}px`;
      dragConstraintsRef.current.style.right = `${padding}px`;
      dragConstraintsRef.current.style.bottom = `${padding}px`;
      dragConstraintsRef.current.style.pointerEvents = 'none';
    }
  }, [constrainToViewport]);

  // Update position on window resize
  useEffect(() => {
    if (!constrainToViewport) return;

    const handleResize = () => {
      setPosition(prev => constrainPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport, constrainPosition]);

  const dragProps = draggable ? {
    drag: true,
    dragMomentum: false,
    dragElastic: 0,
    dragConstraints: constrainToViewport ? dragConstraintsRef : undefined,
    onDragStart: () => setIsDragging(true),
    onDragEnd: handleDragEnd,
    whileDrag: { scale: 1.02 },
    dragListener: !dragHandle, // Only drag from handle if provided
  } : {};

  return (
    <FloatingPortal>
      {constrainToViewport && <div ref={dragConstraintsRef} />}
      <motion.div
        ref={panelRef}
        initial={position}
        animate={position}
        style={{
          position: 'fixed',
          x: position.x,
          y: position.y,
          zIndex,
        }}
        className={cn(
          'glass-dark rounded-lg',
          isDragging && 'cursor-grabbing',
          !isDragging && draggable && !dragHandle && 'cursor-grab',
          className
        )}
        {...dragProps}
      >
        {dragHandle && draggable && (
          <motion.div
            className={cn(
              'cursor-grab',
              isDragging && 'cursor-grabbing'
            )}
            onPointerDown={(e) => {
              if (panelRef.current) {
                const dragControls = (panelRef.current as any).dragControls;
                if (dragControls) {
                  dragControls.start(e);
                }
              }
            }}
          >
            {dragHandle}
          </motion.div>
        )}
        {children}
      </motion.div>
    </FloatingPortal>
  );
};

/**
 * Hook to reset saved positions for draggable panels
 */
export function useResetDraggablePositions() {
  const reset = useCallback((ids?: string[]) => {
    if (ids) {
      ids.forEach(id => {
        localStorage.removeItem(`draggable-${id}`);
      });
    } else {
      // Reset all draggable positions
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('draggable-')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  return reset;
}