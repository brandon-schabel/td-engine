import React from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '../../hooks/useGameStore';
import { HealthDisplay } from './HealthDisplay';
import { CurrencyDisplay } from './CurrencyDisplay';
import { WaveDisplay } from './WaveDisplay';
import { ScoreDisplay } from './ScoreDisplay';

/**
 * Main HUD component that displays game status information
 */
export const GameHUD: React.FC = () => {
  const { isPaused } = useGameStore();
  
  // Hide HUD when game is paused
  if (isPaused) return null;
  
  return (
    <div className={cn(
      'fixed',
      'top-0',
      'left-0',
      'right-0',
      'p-4',
      'pointer-events-none',
      'z-10'
    )}>
      {/* Top bar with game stats */}
      <div className={cn(
        'flex',
        'justify-between',
        'items-start',
        'max-w-7xl',
        'mx-auto'
      )}>
        {/* Left side - Health and Currency */}
        <div className={cn('flex', 'flex-col', 'gap-2')}>
          <HealthDisplay />
          <CurrencyDisplay />
        </div>
        
        {/* Center - Wave info */}
        <div className={cn('flex-1', 'flex', 'justify-center')}>
          <WaveDisplay />
        </div>
        
        {/* Right side - Score */}
        <div>
          <ScoreDisplay />
        </div>
      </div>
    </div>
  );
};