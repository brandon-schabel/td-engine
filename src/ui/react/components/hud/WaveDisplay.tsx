import React from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '../../hooks/useGameStore';
import { Card, CardHeader } from '../shared/Card';
import { Header } from '../shared/Header';
import { IconType } from '@/ui/icons/SvgIcons';

/**
 * Wave display HUD component
 */
export const WaveDisplay: React.FC = () => {
  const { currentWave, waveInProgress, enemiesRemaining } = useGameStore();
  
  return (
    <Card 
      variant="elevated"
      className={cn(
        'min-w-[200px]',
        'bg-ui-bg-secondary',
        'border',
        'border-ui-border-DEFAULT',
        'shadow-md',
        'pointer-events-auto'
      )}
    >
      <Header
        title={`Wave ${currentWave}`}
        subtitle={waveInProgress 
          ? `${enemiesRemaining} enemies remaining`
          : 'Prepare for next wave'}
        icon={IconType.WAVE}
        variant="compact"
        showCloseButton={false}
      />
    </Card>
  );
};