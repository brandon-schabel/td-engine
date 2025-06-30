import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Define TransitionType enum locally
export enum TransitionType {
  FADE = 'fade',
  SLIDE_LEFT = 'slide-left',
  SLIDE_RIGHT = 'slide-right',
  SLIDE_UP = 'slide-up',
  SLIDE_DOWN = 'slide-down',
  NONE = 'none'
}
import { cn } from '@/lib/utils';

interface SceneTransitionProps {
  children: ReactNode;
  transitionType?: TransitionType;
  duration?: number;
  isActive: boolean;
  onTransitionComplete?: () => void;
}

const transitionVariants = {
  [TransitionType.FADE]: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  [TransitionType.SLIDE_LEFT]: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  },
  [TransitionType.SLIDE_RIGHT]: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '100%' }
  },
  [TransitionType.SLIDE_UP]: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '-100%' }
  },
  [TransitionType.SLIDE_DOWN]: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  },
  [TransitionType.NONE]: {
    initial: {},
    animate: {},
    exit: {}
  }
};

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  transitionType = TransitionType.FADE,
  duration = 0.3,
  isActive,
  onTransitionComplete
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const variants = transitionVariants[transitionType];

  useEffect(() => {
    if (transitionType === TransitionType.FADE && isActive) {
      setShowOverlay(true);
      const timer = setTimeout(() => setShowOverlay(false), duration * 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, transitionType, duration]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key="scene"
            className={cn(
              'absolute',
              'inset-0',
              'w-full',
              'h-full',
              'flex',
              'flex-col'
            )}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration,
              ease: 'easeInOut'
            }}
            onAnimationComplete={() => {
              if (onTransitionComplete) {
                onTransitionComplete();
              }
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade overlay */}
      <AnimatePresence>
        {showOverlay && transitionType === TransitionType.FADE && (
          <motion.div
            className={cn(
              'fixed',
              'inset-0',
              'bg-black',
              'pointer-events-none',
              'z-[9999]'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 2 }}
          />
        )}
      </AnimatePresence>
    </>
  );
};