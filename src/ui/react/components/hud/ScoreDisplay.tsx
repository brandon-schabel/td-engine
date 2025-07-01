import React from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { ResourceDisplay, IconType } from '../index';

/**
 * Score display HUD component
 */
export const ScoreDisplay: React.FC = () => {
  const { score } = useGameStore();
  
  return (
    <ResourceDisplay
      value={score}
      label="Score"
      icon={IconType.STAR}
      variant="large"
      showLabel={true}
      format="number"
      className="glass-dark rounded-lg pointer-events-auto !bg-transparent"
    />
  );
};