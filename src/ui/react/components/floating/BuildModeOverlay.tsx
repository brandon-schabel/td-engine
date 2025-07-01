import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FloatingPortal } from './FloatingPortal';

export interface BuildModeOverlayProps {
  /** Message to display */
  message?: string;
  /** Position of the overlay */
  position?: 'top' | 'center' | 'bottom';
  /** Additional class names */
  className?: string;
  /** Callback when cancel is clicked (mobile only) */
  onCancel?: () => void;
}

/**
 * Overlay that shows build mode instructions
 * Replaces the legacy DOM-based build indicator
 */
export const BuildModeOverlay: React.FC<BuildModeOverlayProps> = ({
  message = 'Tap to place tower',
  position = 'top',
  className,
  onCancel,
}) => {
  const positionStyles = {
    top: 'top-20',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-20',
  };

  const isMobile = 'ontouchstart' in window;

  return (
    <FloatingPortal>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed left-1/2 -translate-x-1/2',
          positionStyles[position],
          'z-[200]',
          isMobile ? 'pointer-events-auto' : 'pointer-events-none',
          className
        )}
      >
        <div className={cn(
          'glass-dark rounded-lg px-6 py-3',
          'text-white text-center font-medium',
          'animate-pulse',
          'flex items-center gap-3'
        )}>
          <span>{isMobile ? message : 'Place tower or press ESC to cancel'}</span>
          {isMobile && onCancel && (
            <button
              onClick={onCancel}
              className={cn(
                'bg-status-error text-white px-3 py-1 rounded',
                'text-sm font-medium',
                'hover:bg-status-error/90',
                'active:scale-95 transition-transform'
              )}
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </FloatingPortal>
  );
};

/**
 * Hook to manage build mode overlay state
 */
export function useBuildModeOverlay() {
  const [isActive, setIsActive] = React.useState(false);
  const [message, setMessage] = React.useState('Tap to place tower');

  const show = React.useCallback((customMessage?: string) => {
    if (customMessage) {
      setMessage(customMessage);
    }
    setIsActive(true);
  }, []);

  const hide = React.useCallback(() => {
    setIsActive(false);
  }, []);

  const BuildOverlay = React.useCallback(({ onCancel }: { onCancel?: () => void }) => 
    isActive ? <BuildModeOverlay message={message} onCancel={onCancel} /> : null
  , [isActive, message]);

  return {
    show,
    hide,
    isActive,
    BuildOverlay,
  };
}