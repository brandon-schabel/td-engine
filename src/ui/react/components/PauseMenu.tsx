import React from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { gameStore } from '@/stores/gameStore';
import { Button, IconType } from './index';
import { SoundType } from '@/audio/AudioManager';

/**
 * PauseMenu React component - A declarative replacement for PauseMenuUI class
 * Maintains visual consistency with the existing UI while using React patterns
 */
export const PauseMenu: React.FC = () => {
  const { currentWave, score, lives, stats } = useGameStore();
  
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
    if (confirm('Are you sure you want to restart? All progress will be lost.')) {
      // TODO: Implement restart logic when Game.ts is updated
      gameStore.getState().resetGame();
      uiStore.getState().closePanel(UIPanelType.PAUSE_MENU);
    }
  };
  
  const handleMainMenu = () => {
    game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    // TODO: Implement main menu navigation
    uiStore.getState().closePanel(UIPanelType.PAUSE_MENU);
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="bg-ui-bg-secondary p-8 rounded-lg shadow-xl text-center min-w-[400px] sm:min-w-[280px]">
        <h1 className="text-3xl font-bold text-white mb-6">
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
            onClick={handleMainMenu}
            icon={IconType.HOME}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Main Menu
          </Button>
        </div>
        
        {/* Game info */}
        <div className="mt-5 p-4 rounded-md text-sm text-ui-text-secondary bg-black/30">
          <InfoItem label="Current Wave" value={currentWave} />
          <InfoItem label="Score" value={score.toLocaleString()} />
          <InfoItem label="Lives" value={lives} />
          <InfoItem label="Enemies Killed" value={stats.enemiesKilled} />
          <InfoItem label="Time Played" value={formatTime(stats.gameTime / 1000)} />
        </div>
      </div>
    </div>
  );
};

/**
 * Info item component for displaying game stats
 */
const InfoItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between my-2">
    <span className="text-ui-text-primary">{label}:</span>
    <span className="font-bold text-status-success">{value}</span>
  </div>
);