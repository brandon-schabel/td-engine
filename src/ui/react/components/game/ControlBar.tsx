import React from 'react';
import { Button } from '../shared/Button';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';
import type { Game } from '@/core/Game';
import { getUIState, UIPanelType } from '@/stores/uiStore';
import { SoundType } from '@/audio/AudioManager';

interface ControlBarProps {
  game: Game;
  onBuildMenu: () => void;
  onPlayerUpgrade: () => void;
  onInventory: () => void;
  onStartWave: () => void;
  onPause: () => void;
  isWaveComplete: boolean;
  isPaused: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  game,
  onBuildMenu,
  onPlayerUpgrade,
  onInventory,
  onStartWave,
  onPause,
  isWaveComplete
}) => {
  const audioManager = game.getAudioManager();

  const handleBuild = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onBuildMenu();
  };

  const handlePlayerUpgrade = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onPlayerUpgrade();
  };

  const handleInventory = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onInventory();
  };

  const handleStartWave = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (isWaveComplete && !game.isGameOverPublic()) {
      onStartWave();
    }
  };

  const handlePause = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onPause();
  };

  const handleSettings = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    getUIState().openPanel(UIPanelType.SETTINGS);
  };

  return (
    <div className={cn(
      'h-[60px]',
      'bg-ui-bg-secondary/90 backdrop-blur-sm',
      'border-t border-ui-border-DEFAULT',
      'flex items-center justify-center gap-2 px-4',
      'flex-shrink-0'
    )}>
      <Button
        variant="primary"
        size="md"
        icon={IconType.BUILD}
        onClick={handleBuild}
        title="Build Menu (B)"
        className="ui-button-control border-2 hover:scale-105 transition-transform"
      />

      <Button
        variant="primary"
        size="md"
        icon={IconType.PLAYER}
        onClick={handlePlayerUpgrade}
        title="Player Upgrades (U)"
        className="ui-button-control border-2 hover:scale-105 transition-transform"
      />

      <Button
        variant="primary"
        size="md"
        icon={IconType.INVENTORY}
        onClick={handleInventory}
        title="Inventory (E)"
        className="ui-button-control border-2 hover:scale-105 transition-transform"
      />

      <Button
        variant="primary"
        size="md"
        icon={IconType.PLAY}
        onClick={handleStartWave}
        disabled={!isWaveComplete}
        title="Start Next Wave (Enter)"
        className={cn(
          'ui-button-control border-2 hover:scale-105 transition-transform',
          isWaveComplete && 'animate-pulse'
        )}
      />

      <Button
        variant="primary"
        size="md"
        icon={IconType.PAUSE}
        onClick={handlePause}
        title="Pause/Resume (Space)"
        className="ui-button-control border-2 hover:scale-105 transition-transform"
      />

      <Button
        variant="primary"
        size="md"
        icon={IconType.SETTINGS}
        onClick={handleSettings}
        title="Settings"
        className="ui-button-control border-2 hover:scale-105 transition-transform"
      />
    </div>
  );
};