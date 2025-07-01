import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface SimpleDraggableWrapperProps {
  /** Unique ID for the draggable */
  id: string;
  /** Content to make draggable */
  children: React.ReactNode;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Whether dragging is enabled */
  draggable?: boolean;
  /** Whether to save position to localStorage */
  persistent?: boolean;
  /** Callback when dragged */
  onDrag?: (position: { x: number; y: number }) => void;
  /** Class name for the wrapper */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Z-index for stacking */
  zIndex?: number;
  /** Whether to constrain to viewport */
  constrainToViewport?: boolean;
}

/**
 * Simple draggable wrapper that works reliably
 * Based on the working SimpleDraggable implementation
 */
export const SimpleDraggableWrapper: React.FC<SimpleDraggableWrapperProps> = ({
  id,
  children,
  defaultPosition = { x: 20, y: 20 },
  draggable = true,
  persistent = true,
  onDrag,
  className,
  style: customStyle,
  zIndex = 1000,
  constrainToViewport = true,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  
  // Keep position ref in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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
  const savePosition = (pos: { x: number; y: number }) => {
    if (persistent) {
      localStorage.setItem(`draggable-${id}`, JSON.stringify(pos));
    }
  };

  // Constrain position to viewport
  const constrainPosition = (x: number, y: number) => {
    if (!constrainToViewport || !elementRef.current) return { x, y };

    const rect = elementRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };

  useEffect(() => {
    if (!draggable || !elementRef.current) return;

    const element = elementRef.current;
    let startX = 0;
    let startY = 0;
    let startPosX = 0;
    let startPosY = 0;
    let dragging = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag with left mouse button
      if (e.button !== 0) return;
      
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPosX = positionRef.current.x;
      startPosY = positionRef.current.y;
      setIsDragging(true);

      // Add listeners to document for better capture
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newPosition = constrainPosition(
        startPosX + deltaX,
        startPosY + deltaY
      );
      
      setPosition(newPosition);
      
      if (onDrag) {
        onDrag(newPosition);
      }
    };

    const handleMouseUp = () => {
      if (!dragging) return;
      
      dragging = false;
      setIsDragging(false);
      
      // Save final position
      savePosition(positionRef.current);
      
      // Remove document listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Add mousedown listener to element
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggable, constrainToViewport, onDrag]); // No position dependency!

  const style: CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex,
    cursor: isDragging ? 'grabbing' : (draggable ? 'grab' : 'default'),
    userSelect: 'none',
    touchAction: 'none',
    pointerEvents: 'auto',
    ...customStyle,
  };

  return (
    <div
      ref={elementRef}
      id={id}
      style={style}
      className={cn(
        isDragging && 'opacity-90',
        className
      )}
    >
      {children}
    </div>
  );
};