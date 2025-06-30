import React from 'react';
import { Scene, SceneHeader } from './Scene';
import { useScene } from './SceneContext';
import { Settings } from '../components/Settings';
import { Button } from '../components/shared/Button';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { cn } from '@/lib/utils';
import type { AudioManager } from '@/audio/AudioManager';

interface SettingsSceneProps {
  audioManager?: AudioManager;
}

export const SettingsScene: React.FC<SettingsSceneProps> = ({ audioManager }) => {
  const { goBack } = useScene();

  const handleBack = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    goBack();
  };

  return (
    <Scene className="overflow-y-auto">
      <SceneHeader
        title="Settings"
        leftAction={
          <Button
            variant="ghost"
            size="sm"
            icon={IconType.ARROW_LEFT}
            onClick={handleBack}
          >
            Back
          </Button>
        }
      />

      <div className={cn(
        'flex-1',
        'flex',
        'items-center',
        'justify-center',
        'p-4'
      )}>
        <div className="w-full max-w-2xl">
          <Settings />
        </div>
      </div>
    </Scene>
  );
};