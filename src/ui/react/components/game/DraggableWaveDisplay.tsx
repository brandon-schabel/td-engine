import React from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { Card } from "../shared/Card";
import { Header } from "../shared/Header";
import { IconType } from "@/ui/icons/SvgIcons";
import { DraggablePanel } from "../floating";
import {
  useMobileLayout,
  adjustForMobileSafeArea,
} from "../../hooks/useMobileLayout";

export interface DraggableWaveDisplayProps {
  /** Whether the display can be dragged */
  draggable?: boolean;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Additional class names */
  className?: string;
}

/**
 * Draggable wave display that shows the current wave information
 */
export const DraggableWaveDisplay: React.FC<DraggableWaveDisplayProps> = ({
  draggable = true,
  defaultPosition,
  className,
}) => {
  const currentWave = useGameStore((state) => state.currentWave);
  const waveInProgress = useGameStore((state) => state.waveInProgress);
  const enemiesRemaining = useGameStore((state) => state.enemiesRemaining);
  const layoutInfo = useMobileLayout();

  // Calculate default position with mobile safe area
  const calculatedDefaultPosition = defaultPosition || {
    x: (window.innerWidth - (layoutInfo.isMobile ? 120 : 200)) / 2,
    y: adjustForMobileSafeArea(layoutInfo.isMobile ? 110 : 20, layoutInfo),
  };

  return (
    <DraggablePanel
      id="wave-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="none"
      className={className}
      zIndex={500}
    >
      <Card
        variant="elevated"
        className={cn(
          layoutInfo.isMobile ? "min-w-[120px]" : "min-w-[200px]",
          "glass-dark",
          "rounded-lg",
          "!bg-transparent",
          layoutInfo.isMobile ? "p-1" : "p-3"
        )}
      >
        <Header
          title={`Wave ${currentWave}`}
          subtitle={
            waveInProgress
              ? `${enemiesRemaining} enemies`
              : "Prepare for next wave"
          }
          icon={IconType.WAVE}
          variant="compact"
          showCloseButton={false}
          className={layoutInfo.isMobile ? "text-xs" : ""}
        />
      </Card>
    </DraggablePanel>
  );
};
