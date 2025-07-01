import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGameFloating } from "../../hooks/floating";
import { FloatingPortal } from "./FloatingPortal";

export interface FloatingDamageNumberProps {
  /** World position where the damage occurred */
  worldPosition: { x: number; y: number };
  /** Damage value to display */
  value: number;
  /** Type of damage for styling */
  type?: "physical" | "magical" | "critical" | "heal";
  /** Duration in milliseconds before auto-removing */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

const damageTypeStyles = {
  physical: "text-game-damage-physical",
  magical: "text-game-damage-magical",
  critical: "text-game-damage-critical text-2xl font-bold",
  heal: "text-game-health-high",
};

/**
 * Floating damage number that appears at a world position and animates upward
 * Uses Floating UI for positioning and Framer Motion for animation
 */
export const FloatingDamageNumber: React.FC<FloatingDamageNumberProps> = ({
  worldPosition,
  value,
  type = "physical",
  duration = 1500,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use game floating for world-to-screen positioning
  const {
    x,
    y,
    isVisible: isOnScreen,
  } = useGameFloating({
    trackWorldPosition: worldPosition,
    updateStrategy: "raf",
  });

  // Auto-hide after duration
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, duration - 200); // Start fade slightly before duration ends

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  // Handle animation complete
  const handleAnimationComplete = () => {
    if (!isVisible && onComplete) {
      onComplete();
    }
  };

  // Don't render if off-screen
  if (!isOnScreen()) return null;

  const displayValue = type === "heal" ? `+${value}` : `-${value}`;

  return (
    <FloatingPortal>
      <AnimatePresence onExitComplete={handleAnimationComplete}>
        {isVisible && (
          <motion.div
            initial={{
              x,
              y,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x,
              y: y - 50, // Float upward
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.2 },
            }}
            transition={{
              duration: duration / 1000,
              ease: "easeOut",
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            style={{
              position: "fixed",
              pointerEvents: "none",
            }}
            className={cn(
              "font-bold text-lg drop-shadow-lg",
              damageTypeStyles[type]
            )}
          >
            {displayValue}
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
};

/**
 * Hook to manage multiple floating damage numbers
 */
export function useFloatingDamageNumbers() {
  const [damageNumbers, setDamageNumbers] = useState<
    Array<{
      id: string;
      props: FloatingDamageNumberProps;
    }>
  >([]);

  const showDamage = (props: Omit<FloatingDamageNumberProps, "onComplete">) => {
    const id = `damage-${Date.now()}-${Math.random()}`;

    setDamageNumbers((prev) => [
      ...prev,
      {
        id,
        props: {
          ...props,
          onComplete: () => {
            setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
          },
        },
      },
    ]);
  };

  const DamageNumbers = () => (
    <>
      {damageNumbers.map(({ id, props }) => (
        <FloatingDamageNumber key={id} {...props} />
      ))}
    </>
  );

  return { showDamage, DamageNumbers };
}
