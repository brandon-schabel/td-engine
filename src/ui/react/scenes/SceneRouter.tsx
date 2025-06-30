import React, { useEffect } from 'react';
import { useScene } from './SceneContext';
import { SceneTransition } from './SceneTransition';
import { TransitionType } from './SceneTransition';
import { cn } from '@/lib/utils';
import type { AudioManager } from '@/audio/AudioManager';

export interface SceneConfig {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface SceneRouterProps {
  scenes: Record<string, SceneConfig>;
  audioManager?: AudioManager;
  className?: string;
}

export const SceneRouter: React.FC<SceneRouterProps> = ({
  scenes,
  audioManager,
  className
}) => {
  const { currentScene, isTransitioning, transitionOptions } = useScene();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pass keyboard events to the current scene if it has a handler
      const sceneConfig = currentScene ? scenes[currentScene] : null;
      if (sceneConfig?.props?.onKeyDown) {
        sceneConfig.props.onKeyDown(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScene, scenes]);

  if (!currentScene || !scenes[currentScene]) {
    return (
      <div className={cn(
        'absolute',
        'inset-0',
        'flex',
        'items-center',
        'justify-center',
        'bg-surface-primary',
        'text-text-primary'
      )}>
        <p>Loading...</p>
      </div>
    );
  }

  const { component: SceneComponent, props = {} } = scenes[currentScene];

  return (
    <div className={cn(
      'relative',
      'w-full',
      'h-full',
      'overflow-hidden',
      className
    )}>
      <SceneTransition
        transitionType={transitionOptions?.type || TransitionType.FADE}
        duration={transitionOptions?.duration ? transitionOptions.duration / 1000 : 0.3}
        isActive={!isTransitioning}
      >
        <SceneComponent
          {...props}
          audioManager={audioManager}
          key={currentScene}
        />
      </SceneTransition>
    </div>
  );
};

// Helper hook for scene components
export const useSceneProps = <T extends Record<string, any>>() => {
  return {} as T & { audioManager?: AudioManager };
};