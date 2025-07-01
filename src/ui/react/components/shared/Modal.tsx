import React from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  blurOverlay?: boolean;
}

/**
 * Modal component with overlay
 * Provides consistent modal behavior across all dialogs
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  blurOverlay = true
}) => {
  if (!isOpen) return null;
  
  const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };
  
  return (
    <div 
      className={cn(
        'fixed', 
        'inset-0', 
        'bg-black/50',
        blurOverlay && 'backdrop-blur-sm', 
        'flex', 
        'items-center', 
        'justify-center', 
        'z-[10000]',
        overlayClassName
      )}
      style={{ pointerEvents: 'auto' }}
      onClick={handleOverlayClick}
      onTouchEnd={handleOverlayClick}
    >
      <div className={cn('relative', className)}>
        {children}
      </div>
    </div>
  );
};