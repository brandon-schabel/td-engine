import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { GameOver } from '@/ui/react/components/GameOver';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/game-over')({
  component: GameOverScene,
});

function GameOverScene() {
  // Get game stats from window if available
  // const gameStats = typeof window !== 'undefined' ? (window as any).__gameOverStats : null;

  return (
    <div className="relative w-full h-full overflow-y-auto">
      <div className={cn(
        'flex-1',
        'flex',
        'items-center',
        'justify-center',
        'p-4',
        'min-h-full'
      )}>
        <GameOver />
      </div>
    </div>
  );
}