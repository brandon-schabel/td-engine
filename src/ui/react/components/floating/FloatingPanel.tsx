import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useDismiss,
  useRole,
  useInteractions,
  FloatingOverlay,
  FloatingFocusManager,
} from '@floating-ui/react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '../shared/Glass';
import { useFloatingUI, floatingPresets } from '../../hooks/floating';
import { FloatingPortal } from './FloatingPortal';

export interface FloatingPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback when panel should close */
  onOpenChange: (open: boolean) => void;
  /** Panel content */
  children: React.ReactNode;
  /** Reference element or position for anchoring */
  anchor?: HTMLElement | { x: number; y: number } | null;
  /** Placement relative to anchor */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Whether to show overlay backdrop */
  modal?: boolean;
  /** Whether to trap focus inside panel */
  trapFocus?: boolean;
  /** Whether to close on outside click */
  closeOnOutsideClick?: boolean;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** Class name for the panel */
  className?: string;
  /** Class name for the overlay */
  overlayClassName?: string;
  /** Animation variant */
  animation?: 'fade' | 'scale' | 'slide' | 'none';
  /** Z-index for stacking */
  zIndex?: number;
}

const animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  slide: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

/**
 * Floating panel component for menus, dialogs, and popovers
 * Provides consistent floating behavior with animations
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  open,
  onOpenChange,
  children,
  anchor,
  placement = 'center',
  modal = false,
  trapFocus = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  animation = 'scale',
  zIndex = 1000,
}) => {
  const isPositionAnchor = anchor && 'x' in anchor;
  const virtualRef = useRef<HTMLElement | null>(null);

  // Create virtual element for position anchors
  useEffect(() => {
    if (isPositionAnchor && anchor) {
      virtualRef.current = {
        getBoundingClientRect() {
          return {
            x: anchor.x,
            y: anchor.y,
            width: 0,
            height: 0,
            top: anchor.y,
            left: anchor.x,
            right: anchor.x,
            bottom: anchor.y,
          };
        },
      } as any;
    }
  }, [anchor, isPositionAnchor]);

  const {
    refs,
    floatingStyles,
    context,
  } = useFloatingUI({
    ...floatingPresets.popover,
    placement: placement === 'center' ? 'bottom' : placement,
    open,
    onOpenChange,
    strategy: 'fixed',
  });

  // Set reference based on anchor type
  useEffect(() => {
    if (anchor) {
      if (isPositionAnchor) {
        refs.setReference(virtualRef.current);
      } else {
        refs.setReference(anchor as HTMLElement);
      }
    }
  }, [anchor, refs, isPositionAnchor]);

  // Set up interactions
  const dismiss = useDismiss(context, {
    outsidePress: closeOnOutsideClick,
    escapeKey: closeOnEscape,
  });

  const role = useRole(context);

  const { getFloatingProps } = useInteractions([dismiss, role]);

  // Center positioning for modal-like behavior
  const centerStyles = placement === 'center' ? {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  } : {};

  const finalStyles = placement === 'center' ? centerStyles : floatingStyles as React.CSSProperties;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={refs.setFloating}
          style={{
            ...finalStyles,
            zIndex,
          }}
          className={cn(
            'max-w-[90vw] max-h-[90vh]',
            'overflow-hidden',
            className
          )}
          {...animations[animation]}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          {...getFloatingProps()}
        >
          <GlassPanel
            variant="dark"
            blur="xl"
            opacity={90}
            border={true}
            glow={true}
            className="rounded-lg h-full"
          >
            {children}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (modal) {
    return (
      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <>
              <FloatingOverlay
                className={cn(
                  'bg-black/50 z-[999]',
                  overlayClassName
                )}
                onClick={() => closeOnOutsideClick && onOpenChange(false)}
              />
              {trapFocus ? (
                <FloatingFocusManager context={context}>
                  {content}
                </FloatingFocusManager>
              ) : (
                content
              )}
            </>
          )}
        </AnimatePresence>
      </FloatingPortal>
    );
  }

  return <FloatingPortal>{content}</FloatingPortal>;
};

/**
 * Simplified modal variant of FloatingPanel
 */
export const Modal: React.FC<Omit<FloatingPanelProps, 'modal' | 'placement'>> = (props) => (
  <FloatingPanel {...props} modal placement="center" />
);

/**
 * Simplified popover variant of FloatingPanel
 */
export const Popover: React.FC<Omit<FloatingPanelProps, 'modal' | 'trapFocus'>> = (props) => (
  <FloatingPanel {...props} modal={false} trapFocus={false} />
);