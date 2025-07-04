import React from "react";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { ResourceDisplay, IconType } from "../index";
import { DraggablePanel } from "../floating";
import {
  useMobileLayout,
  adjustForMobileSafeArea,
} from "../../hooks/useMobileLayout";
import { cn } from "@/lib/utils";

export interface DraggableCurrencyDisplayProps {
  /** Whether the display can be dragged */
  draggable?: boolean;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Additional class names */
  className?: string;
}

/**
 * Draggable currency display that shows the player's coins
 * Replaces the FloatingUIManager-based currency display
 */
export const DraggableCurrencyDisplay: React.FC<
  DraggableCurrencyDisplayProps
> = ({ draggable = true, defaultPosition, className }) => {
  const { currency } = useGameStore();
  const layoutInfo = useMobileLayout();

  // Calculate default position with mobile safe area
  const calculatedDefaultPosition = defaultPosition || {
    x: layoutInfo.isMobile ? 10 : 20,
    y: adjustForMobileSafeArea(layoutInfo.isMobile ? 160 : 100, layoutInfo),
  };

  return (
    <DraggablePanel
      id="currency-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="glass-dark"
      className={cn(layoutInfo.isMobile ? "p-1" : "p-3", className)}
      zIndex={500}
    >
      <ResourceDisplay
        value={currency}
        icon={IconType.COINS}
        label="Coins"
        variant={layoutInfo.isMobile ? "compact" : "large"}
        showLabel={!layoutInfo.isMobile}
        format="currency"
        tooltip="Your currency"
      />
    </DraggablePanel>
  );
};
