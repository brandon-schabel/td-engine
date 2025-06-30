import React from 'react';
import { Scene } from './Scene';
import { GameOver } from '../components/GameOver';
import { cn } from '@/lib/utils';
import type { AudioManager } from '@/audio/AudioManager';

interface GameOverSceneProps {
  audioManager?: AudioManager;
  score?: number;
  wave?: number;
  enemiesKilled?: number;
  gameTime?: number;
}

export const GameOverScene: React.FC<GameOverSceneProps> = () => {
  // Get game stats from window if available
  // const gameStats = typeof window !== 'undefined' ? (window as any).__gameOverStats : null;

  return (
    <Scene className="overflow-y-auto">
      <div className={cn(
        'flex-1',
        'flex',
        'items-center',
        'justify-center',
        'p-4'
      )}>
        <GameOver />
      </div>
    </Scene>
  );
};