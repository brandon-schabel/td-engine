import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Modal, Button } from "./shared";
import { GlassPanel } from "./shared/Glass";
import { cn } from "@/lib/utils";
import {
  useScore,
  useCurrentWave,
  useGameStats,
} from "@/stores/hooks/useGameStore";
import { uiStore, UIPanelType } from "@/stores/uiStore";
import { resetGame, getCurrentGame } from "@/core/gameManagement";
import { IconType } from "@/ui/icons/SvgIcons";
import { SoundType } from "@/audio/AudioManager";

/**
 * GameOver React component - Shows game over screen with stats
 */
export const GameOver: React.FC = () => {
  const score = useScore();
  const currentWave = useCurrentWave();
  const stats = useGameStats();
  const navigate = useNavigate();

  // Get game instance
  const game = (window as any).currentGame;

  const handleRestart = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    
    // Use centralized reset function
    resetGame(getCurrentGame());
    
    uiStore.getState().closePanel(UIPanelType.GAME_OVER);
    // Navigate back to pre-game config
    navigate({ to: "/pre-game" });
  };

  const handleMainMenu = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    uiStore.getState().closePanel(UIPanelType.GAME_OVER);
    // Navigate to main menu
    navigate({ to: "/" });
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal isOpen={true} closeOnOverlayClick={false}>
      <GlassPanel
        variant="dark"
        blur="xl"
        opacity={90}
        border={true}
        glow={true}
        className={cn(
          "p-8",
          "rounded-2xl",
          "shadow-2xl",
          "text-center",
          "min-w-[400px]",
          "max-w-[500px]"
        )}
      >
        {/* Title */}
        <h1
          className={cn("text-4xl", "font-bold", "text-danger-DEFAULT", "mb-6")}
        >
          GAME OVER
        </h1>

        {/* Score Display */}
        <div className={cn("mb-6")}>
          <div className={cn("text-5xl", "font-bold", "text-white", "mb-2")}>
            {score.toLocaleString()}
          </div>
          <div className={cn("text-lg", "text-ui-text-secondary")}>
            Final Score
          </div>
        </div>

        {/* Stats Grid */}
        <StatsDisplay
          stats={[
            { label: "Waves Survived", value: currentWave.toString() },
            { label: "Enemies Killed", value: stats.enemiesKilled.toString() },
            { label: "Towers Built", value: stats.towersBuilt.toString() },
            {
              label: "Total Damage",
              value: Math.floor(stats.totalDamageDealt).toLocaleString(),
            },
            {
              label: "Currency Earned",
              value: `$${stats.totalCurrencyEarned.toLocaleString()}`,
            },
            { label: "Time Played", value: formatTime(stats.gameTime) },
          ]}
        />

        {/* Action Buttons */}
        <div className={cn("flex", "flex-col", "gap-3", "mt-6")}>
          <Button
            icon={IconType.RESTART}
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleRestart}
          >
            Try Again
          </Button>

          <Button
            icon={IconType.HOME}
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleMainMenu}
          >
            Main Menu
          </Button>
        </div>
      </GlassPanel>
    </Modal>
  );
};

/**
 * Stats display grid
 */
const StatsDisplay: React.FC<{
  stats: Array<{ label: string; value: string }>;
}> = ({ stats }) => {
  return (
    <div className={cn("grid", "grid-cols-2", "gap-4", "mb-6")}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "bg-white/5",
            "backdrop-blur-sm",
            "border",
            "border-white/10",
            "p-3",
            "rounded-lg"
          )}
        >
          <div className={cn("text-sm", "text-ui-text-secondary", "mb-1")}>
            {stat.label}
          </div>
          <div
            className={cn("text-lg", "font-semibold", "text-ui-text-primary")}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};
