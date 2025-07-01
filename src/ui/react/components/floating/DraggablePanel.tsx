import React from 'react';
import { SimpleDraggableWrapper, SimpleDraggableWrapperProps } from './SimpleDraggableWrapper';
import { FloatingPortal } from './FloatingPortal';
import { cn } from '@/lib/utils';

export interface DraggablePanelProps extends Omit<SimpleDraggableWrapperProps, 'children'> {
  /** Panel content */
  children: React.ReactNode;
  /** Whether to use FloatingPortal (can cause drag issues) */
  usePortal?: boolean;
  /** Drag handle element (not yet implemented) */
  dragHandle?: React.ReactNode;
  /** Glass effect variant */
  variant?: 'glass' | 'glass-dark' | 'none';
}

/**
 * Draggable panel component that can be moved around the screen
 * Now uses SimpleDraggableWrapper for reliable drag functionality
 */
export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  children,
  usePortal = false,
  dragHandle,
  variant = 'none',
  className,
  ...wrapperProps
}) => {
  const variantClasses = {
    'glass': 'glass rounded-lg',
    'glass-dark': 'glass-dark rounded-lg',
    'none': ''
  };

  const content = (
    <SimpleDraggableWrapper
      className={cn(
        variantClasses[variant],
        className
      )}
      {...wrapperProps}
    >
      {dragHandle ? (
        <>
          <div data-drag-handle className="cursor-grab select-none">
            {dragHandle}
          </div>
          {children}
        </>
      ) : (
        children
      )}
    </SimpleDraggableWrapper>
  );

  // Optionally wrap in portal
  if (usePortal) {
    return <FloatingPortal>{content}</FloatingPortal>;
  }

  return content;
};

/**
 * Hook to reset saved positions for draggable panels
 */
export function useResetDraggablePositions() {
  const reset = (ids?: string[]) => {
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
  };

  return reset;
}