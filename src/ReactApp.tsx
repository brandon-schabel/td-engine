import React from 'react';
import { SceneProvider, SceneRouter, useScene } from '@/ui/react/scenes';
import { MainMenu, PreGameConfig, SettingsScene, Leaderboard, GameOverScene } from '@/ui/react/scenes';
import { GameScene } from '@/ui/react/scenes/GameScene';
import { AppUI } from '@/ui/react/AppUI';
import type { AudioManager } from '@/audio/AudioManager';
import { TransitionType } from '@/ui/react/scenes';

interface ReactAppProps {
  audioManager: AudioManager;
}

// Inner component that has access to scene context
const AppContent: React.FC<ReactAppProps> = ({ audioManager }) => {
  const { switchToScene } = useScene();
  
  // Handle quick start game event (F1 key)
  React.useEffect(() => {
    const handleQuickStart = () => {
      console.log('[ReactApp] Quick start game triggered');
      switchToScene('game', { type: TransitionType.FADE });
    };
    
    window.addEventListener('quickStartGame', handleQuickStart);
    return () => window.removeEventListener('quickStartGame', handleQuickStart);
  }, [switchToScene]);

  // Define all available scenes
  const scenes = {
    mainMenu: { 
      component: MainMenu,
      props: { audioManager }
    },
    preGameConfig: { 
      component: PreGameConfig,
      props: { audioManager }
    },
    settings: { 
      component: SettingsScene,
      props: { audioManager }
    },
    leaderboard: { 
      component: Leaderboard,
      props: { audioManager }
    },
    game: { 
      component: GameScene,
      props: { audioManager }
    },
    gameOver: { 
      component: GameOverScene,
      props: { audioManager }
    }
  };

  return (
    <>
      {/* Scene system handles full-screen scenes */}
      <SceneRouter 
        scenes={scenes} 
        audioManager={audioManager}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Game UI panels overlay on top */}
      <AppUI />
    </>
  );
};

export const ReactApp: React.FC<ReactAppProps> = ({ audioManager }) => {
  return (
    <SceneProvider 
      initialScene="mainMenu"
      onSceneChange={(from, to) => {
        console.log(`[ReactApp] Scene change: ${from} → ${to}`);
      }}
    >
      <AppContent audioManager={audioManager} />
    </SceneProvider>
  );
};