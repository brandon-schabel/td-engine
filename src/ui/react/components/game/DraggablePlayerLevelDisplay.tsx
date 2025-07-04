import React, { useState, useEffect, useCallback } from "react";
import { ProgressBar } from "../shared/ProgressBar";
import { DraggablePanel } from "../floating";
import { useGameNotifications } from "./GameNotifications";
import { cn } from "@/lib/utils";
import type { Game } from "@/core/Game";
import { SoundType } from "@/audio/AudioManager";
import { IconType } from "@/ui/icons/SvgIcons";
import {
  useMobileLayout,
  adjustForMobileSafeArea,
} from "../../hooks/useMobileLayout";
import { usePlayerStats } from '@/stores/hooks/useGameStore';
import { usePlayer } from '@/stores/entityStore';

interface DraggablePlayerLevelDisplayProps {
  game: Game;
  visible?: boolean;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
}

/**
 * Draggable player level display with experience progress
 * Replaces the FloatingUIManager-based level display
 */
export const DraggablePlayerLevelDisplay: React.FC<
  DraggablePlayerLevelDisplayProps
> = ({ game, visible = true, draggable = true, defaultPosition }) => {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [showGlow, setShowGlow] = useState(false);

  const { success: showNotification } = useGameNotifications();
  const layoutInfo = useMobileLayout();
  const playerStats = usePlayerStats();
  const player = usePlayer();
  
  // Calculate values from store
  const level = playerStats.level;
  const experience = playerStats.experience;
  const experienceToNext = playerStats.nextLevelExp;
  const progress = experienceToNext > 0 ? (experience / experienceToNext) * 100 : 0;
  const isMaxLevel = level >= 50;

  // Calculate default position if not provided
  const calculatedDefaultPosition = defaultPosition || {
    x: window.innerWidth - (layoutInfo.isMobile ? 110 : 240),
    y: adjustForMobileSafeArea(layoutInfo.isMobile ? 160 : 50, layoutInfo),
  };

  // Show level up notification
  const showLevelUpNotification = useCallback(
    (newLevel: number, pointsEarned: number) => {
      // Show toast notification
      showNotification(`LEVEL ${newLevel}`, {
        icon: IconType.STAR,
        duration: 3000,
        action:
          pointsEarned > 0
            ? {
                label: `+${pointsEarned} Point${pointsEarned > 1 ? "s" : ""}`,
                onClick: () => {
                  // Could open upgrade menu here
                },
              }
            : undefined,
      });

      // Play level up sound
      try {
        game.getAudioManager().playSound(SoundType.PLAYER_LEVEL_UP, 1);
      } catch (error) {
        console.debug("Level up sound could not be played:", error);
      }

      // Add glow effect
      setShowGlow(true);
      setTimeout(() => setShowGlow(false), 3000);
    },
    [game, showNotification]
  );

  // Connect to game for level up notifications
  useEffect(() => {
    game.setPlayerLevelDisplay({
      showLevelUpNotification,
    });
  }, [game, showLevelUpNotification]);

  // Update available points from player level system
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (player) {
        const levelSystem = player.getPlayerLevelSystem();
        setAvailablePoints(levelSystem.getAvailableUpgradePoints());
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [player]);

  if (!visible) return null;

  return (
    <DraggablePanel
      id="player-level-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="glass-dark"
      className={cn(
        layoutInfo.isMobile ? "p-1" : "p-3",
        showGlow && "animate-golden-pulse"
      )}
      zIndex={500}
    >
      <div
        className={cn(layoutInfo.isMobile ? "min-w-[100px]" : "min-w-[200px]")}
      >
        {/* Level header */}
        <div className="flex items-center justify-between mb-1">
          <div
            className={cn(
              layoutInfo.isMobile ? "text-xs" : "text-lg",
              "font-bold text-white"
            )}
          >
            Level {level}
          </div>

          {availablePoints > 0 && (
            <div
              className={cn(
                layoutInfo.isMobile ? "text-xs" : "text-sm",
                "text-status-success font-medium"
              )}
            >
              {availablePoints} Points
            </div>
          )}
        </div>

        {/* Experience progress bar */}
        <div className="mb-1">
          <ProgressBar
            progress={progress}
            className={cn("w-full", layoutInfo.isMobile ? "h-1" : "h-3")}
            fillColor="primary"
            animated
          />
        </div>

        {/* Experience text */}
        <div
          className={cn(
            layoutInfo.isMobile ? "text-xs" : "text-xs",
            "text-center",
            isMaxLevel ? "text-status-warning font-bold" : "text-white/80"
          )}
        >
          {isMaxLevel
            ? "MAX LEVEL"
            : `${Math.floor(experience)} / ${experienceToNext} XP`}
        </div>
      </div>
    </DraggablePanel>
  );
};
