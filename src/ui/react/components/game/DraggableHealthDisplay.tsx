import React from "react";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { ResourceDisplay, IconType } from "../index";
import { DraggablePanel } from "../floating";
import {
  useMobileLayout,
  adjustForMobileSafeArea,
} from "../../hooks/useMobileLayout";
import { cn } from "@/lib/utils";

export interface DraggableHealthDisplayProps {
  /** Whether the display can be dragged */
  draggable?: boolean;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Additional class names */
  className?: string;
}

/**
 * Draggable health display that shows the player's health
 */
export const DraggableHealthDisplay: React.FC<DraggableHealthDisplayProps> = ({
  draggable = true,
  defaultPosition,
  className,
}) => {
  const { playerHealth, playerMaxHealth } = useGameStore();
  const layoutInfo = useMobileLayout();

  // Calculate default position with mobile safe area
  const calculatedDefaultPosition = defaultPosition || {
    x: layoutInfo.isMobile ? 10 : 20,
    y: adjustForMobileSafeArea(layoutInfo.isMobile ? 110 : 20, layoutInfo),
  };

  // Get player instance for accurate health
  const game = (window as any).currentGame;
  const player = game?.getPlayer();
  const currentHealth = player?.health ?? playerHealth;
  const maxHealth = player?.maxHealth ?? playerMaxHealth;

  return (
    <DraggablePanel
      id="health-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="glass-dark"
      className={cn(layoutInfo.isMobile ? "p-1" : "p-3", className)}
      zIndex={500}
    >
      <ResourceDisplay
        value={`${Math.ceil(currentHealth)}/${maxHealth}`}
        label="Health"
        icon={IconType.HEALTH}
        variant={layoutInfo.isMobile ? "compact" : "large"}
        showLabel={!layoutInfo.isMobile}
        color={currentHealth <= maxHealth * 0.3 ? "danger" : "primary"}
        tooltip="Your health points"
      />
    </DraggablePanel>
  );
};
