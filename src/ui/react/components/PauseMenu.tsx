import React, { useState } from "react";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { uiStore, UIPanelType } from "@/stores/uiStore";
import { gameStore } from "@/stores/gameStore";
import { resetGame, getCurrentGame } from "@/core/gameManagement";
import { Button, IconType } from "./index";
import { GlassPanel } from "./shared/Glass";
import { SoundType } from "@/audio/AudioManager";

/**
 * PauseMenu React component - A declarative replacement for PauseMenuUI class
 * Maintains visual consistency with the existing UI while using React patterns
 */
export const PauseMenu: React.FC = () => {
  const { currentWave, score, lives, stats } = useGameStore();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Get the game instance from window (set in Game.ts)
  const game = (window as any).currentGame;

  const handleResume = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    gameStore.getState().resumeGame();
    uiStore.getState().closePanel(UIPanelType.PAUSE_MENU);
  };

  const handleSettings = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    uiStore.getState().openPanel(UIPanelType.SETTINGS);
  };

  const handleRestart = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    if (
      confirm("Are you sure you want to restart? All progress will be lost.")
    ) {
      // Use centralized reset function
      resetGame(getCurrentGame());
      
      uiStore.getState().closePanel(UIPanelType.PAUSE_MENU);
      
      // Set game state to playing after reset
      gameStore.getState().setGameState('PLAYING');
    }
  };

  const handleMainMenu = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    // TODO: Implement main menu navigation
    uiStore.getState().closePanel(UIPanelType.PAUSE_MENU);
  };

  const handleSaveGame = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    if (game) {
      game.saveGameState();
      setSaveMessage("Game saved successfully!");
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSaveAndQuit = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    if (game) {
      game.saveGameState();
      // Navigate to main menu
      window.location.href = '/';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000]"
      style={{ pointerEvents: "auto" }}
    >
      <GlassPanel
        variant="dark"
        blur="xl"
        opacity={75}
        border={true}
        glow={true}
        className="p-8 rounded-2xl text-center min-w-[400px] sm:min-w-[280px] shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-white text-shadow-md mb-6">
          Game Paused
        </h1>

        {/* Buttons container */}
        <div className="flex flex-col gap-4 py-5">
          <Button
            onClick={handleResume}
            icon={IconType.PLAY}
            variant="primary"
            size="lg"
            fullWidth
          >
            Resume Game
          </Button>

          <Button
            onClick={handleSaveGame}
            icon={IconType.SAVE}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Save Game
          </Button>

          <Button
            onClick={handleSettings}
            icon={IconType.SETTINGS}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Settings
          </Button>

          <Button
            onClick={handleRestart}
            icon={IconType.RESTART}
            variant="danger"
            size="lg"
            fullWidth
          >
            Restart Game
          </Button>

          <Button
            onClick={handleSaveAndQuit}
            icon={IconType.HOME}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Save & Quit
          </Button>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div className="mt-2 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
            <span className="text-sm text-green-400">{saveMessage}</span>
          </div>
        )}

        {/* Game info */}
        <div className="mt-5 p-4 rounded-lg text-sm text-ui-text-secondary text-shadow-sm bg-white/5 border border-white/10">
          <InfoItem label="Current Wave" value={currentWave} />
          <InfoItem label="Score" value={score.toLocaleString()} />
          <InfoItem label="Lives" value={lives} />
          <InfoItem label="Enemies Killed" value={stats.enemiesKilled} />
          <InfoItem
            label="Time Played"
            value={formatTime(stats.gameTime / 1000)}
          />
        </div>
      </GlassPanel>
    </div>
  );
};

/**
 * Info item component for displaying game stats
 */
const InfoItem: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between my-2 text-white">
    <span className="text-ui-text-primary text-shadow-sm">{label}:</span>
    <span className="font-bold text-status-success text-shadow-sm">
      {value}
    </span>
  </div>
);
