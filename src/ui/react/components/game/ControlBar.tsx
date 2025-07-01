import React from 'react';
import { GlassPanel, GlassIconButton, GlassDivider } from '../shared/Glass';
import { Icon } from '../shared/Icon';
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
    <GlassPanel
      variant="dark"
      blur="lg"
      opacity={85}
      border={true}
      glow={true}
      className={cn(
        'h-[60px]',
        'border-t-0 border-l-0 border-r-0',
        'border-b border-white/20',
        'flex items-center justify-center gap-3 px-6',
        'flex-shrink-0',
        'rounded-t-2xl',
        'relative',
        'before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/20 before:to-transparent before:pointer-events-none',
        'shadow-[0_-10px_30px_rgba(0,0,0,0.3)]'
      )}
    >
      <GlassIconButton
        icon={<Icon type={IconType.BUILD} size={24} />}
        size="lg"
        blur="md"
        onClick={handleBuild}
        title="Build Menu (B)"
        className="hover:scale-110 hover:bg-primary/20 hover:border-primary/40"
      />

      <GlassIconButton
        icon={<Icon type={IconType.PLAYER} size={24} />}
        size="lg"
        blur="md"
        onClick={handlePlayerUpgrade}
        title="Player Upgrades (U)"
        className="hover:scale-110 hover:bg-primary/20 hover:border-primary/40"
      />

      <GlassIconButton
        icon={<Icon type={IconType.INVENTORY} size={24} />}
        size="lg"
        blur="md"
        onClick={handleInventory}
        title="Inventory (E)"
        className="hover:scale-110 hover:bg-primary/20 hover:border-primary/40"
      />

      <GlassDivider orientation="vertical" className="h-8 mx-2" />

      <GlassIconButton
        icon={<Icon type={IconType.PLAY} size={24} />}
        size="lg"
        blur="md"
        onClick={handleStartWave}
        disabled={!isWaveComplete}
        title="Start Next Wave (Enter)"
        className={cn(
          'hover:scale-110',
          isWaveComplete && 'animate-pulse bg-success/20 border-success/40 hover:bg-success/30'
        )}
      />

      <GlassIconButton
        icon={<Icon type={IconType.PAUSE} size={24} />}
        size="lg"
        blur="md"
        onClick={handlePause}
        title="Pause/Resume (Space)"
        className="hover:scale-110 hover:bg-primary/20 hover:border-primary/40"
      />

      <GlassDivider orientation="vertical" className="h-8 mx-2" />

      <GlassIconButton
        icon={<Icon type={IconType.SETTINGS} size={24} />}
        size="lg"
        blur="md"
        onClick={handleSettings}
        title="Settings"
        className="hover:scale-110 hover:bg-primary/20 hover:border-primary/40"
      />
    </GlassPanel>
  );
};