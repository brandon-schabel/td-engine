import React from 'react';
import { Scene } from './Scene';
import { useScene } from './SceneContext';
import { Button } from '../components/shared/Button';
import { Icon } from '../components/shared/Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { TransitionType } from './SceneTransition';
import { cn } from '@/lib/utils';
import styles from './MainMenu.module.css';
import type { AudioManager } from '@/audio/AudioManager';

interface MainMenuProps {
  audioManager?: AudioManager;
}

export const MainMenu: React.FC<MainMenuProps> = ({ audioManager }) => {
  const { switchToScene } = useScene();

  const handleStartGame = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    switchToScene('preGameConfig', {
      type: TransitionType.SLIDE_LEFT
    });
  };

  const handleSettings = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    switchToScene('settings', {
      type: TransitionType.SLIDE_UP
    });
  };

  const handleLeaderboard = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    switchToScene('leaderboard', {
      type: TransitionType.SLIDE_LEFT
    });
  };

  return (
    <Scene className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className={cn(
          'absolute inset-0 w-full h-full',
          styles.backgroundGradient
        )} 
      />

      {/* Particle overlay */}
      <div 
        className={cn(
          'absolute inset-0 w-full h-full',
          styles.particleOverlay
        )}
      />

      {/* Menu content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-8 w-full h-full">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo section */}
          <div className="text-center mb-8">
            {/* Logo icon */}
            <div className={cn('mb-4 relative', styles.logoFloat)}>
              {/* Glow background */}
              <div 
                className={cn(
                  'absolute inset-0 rounded-full',
                  styles.glowPulse
                )} 
              />
              <Icon type={IconType.TOWER} size={96} />
            </div>

            {/* Game title */}
            <div>
              <h1 
                className={cn(
                  'text-5xl sm:text-6xl font-bold mb-2',
                  styles.titleGradient
                )}
              >
                Tower Defense
              </h1>
              <p 
                className={cn(
                  'text-xl sm:text-2xl text-text-secondary mt-2',
                  styles.subtitleAnimate
                )}
              >
                Defend your base!
              </p>
            </div>
          </div>

          {/* Button container */}
          <div 
            className={cn(
              'flex flex-col gap-4 w-full max-w-xs',
              styles.buttonContainer
            )}
          >
            {/* Start Game button */}
            <Button
              size="lg"
              variant="primary"
              icon={IconType.PLAY}
              onClick={handleStartGame}
              className={cn('w-full', styles.primaryButton)}
            >
              Start Game
            </Button>

            {/* Settings button */}
            <Button
              size="lg"
              variant="secondary"
              icon={IconType.SETTINGS}
              onClick={handleSettings}
              className={cn('w-full', styles.secondaryButton)}
            >
              Settings
            </Button>

            {/* Leaderboard button */}
            <Button
              size="lg"
              variant="secondary"
              icon={IconType.CROWN}
              onClick={handleLeaderboard}
              className={cn('w-full', styles.secondaryButton)}
            >
              Leaderboard
            </Button>
          </div>
        </div>
      </div>

      {/* Version info */}
      <div className={cn(
        'absolute bottom-4 left-4',
        'text-xs text-text-tertiary opacity-50'
      )}>
        v1.0.0
      </div>
    </Scene>
  );
};