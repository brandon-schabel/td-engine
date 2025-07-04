import React from "react";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { ResourceDisplay, IconType } from "../index";
import { DraggablePanel } from "../floating";
import {
  useMobileLayout,
  adjustForMobileSafeArea,
} from "../../hooks/useMobileLayout";
import { cn } from "@/lib/utils";

export interface DraggableScoreDisplayProps {
  /** Whether the display can be dragged */
  draggable?: boolean;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Additional class names */
  className?: string;
}

/**
 * Draggable score display that shows the player's score
 */
export const DraggableScoreDisplay: React.FC<DraggableScoreDisplayProps> = ({
  draggable = true,
  defaultPosition,
  className,
}) => {
  const score = useGameStore((state) => state.score);
  const layoutInfo = useMobileLayout();

  // Calculate default position with mobile safe area
  const calculatedDefaultPosition = defaultPosition || {
    x: window.innerWidth - (layoutInfo.isMobile ? 110 : 220),
    y: adjustForMobileSafeArea(layoutInfo.isMobile ? 110 : 20, layoutInfo),
  };

  return (
    <DraggablePanel
      id="score-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="glass-dark"
      className={cn(layoutInfo.isMobile ? "p-1" : "p-3", className)}
      zIndex={500}
    >
      <ResourceDisplay
        value={score}
        label="Score"
        icon={IconType.STAR}
        variant={layoutInfo.isMobile ? "compact" : "large"}
        showLabel={!layoutInfo.isMobile}
        format="number"
        tooltip="Your total score"
      />
    </DraggablePanel>
  );
};
