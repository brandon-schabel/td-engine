import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
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
  closeOnOverlayClick = true
}) => {
  if (!isOpen) return null;
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };
  
  return (
    <div 
      className={cn(
        'fixed', 
        'inset-0', 
        'bg-black/70', 
        'flex', 
        'items-center', 
        'justify-center', 
        'z-[10000]',
        overlayClassName
      )}
      style={{ pointerEvents: 'auto' }}
      onClick={handleOverlayClick}
    >
      <div className={cn('relative', className)}>
        {children}
      </div>
    </div>
  );
};