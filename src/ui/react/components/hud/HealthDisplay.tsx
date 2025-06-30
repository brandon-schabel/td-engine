import React from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { ResourceDisplay, IconType } from '../index';

/**
 * Health display HUD component
 */
export const HealthDisplay: React.FC = () => {
  const { playerHealth, playerMaxHealth } = useGameStore();
  
  // Get player instance for accurate health
  const game = (window as any).currentGame;
  const player = game?.getPlayer();
  const currentHealth = player?.health ?? playerHealth;
  const maxHealth = player?.maxHealth ?? playerMaxHealth;
  
  return (
    <ResourceDisplay
      value={`${Math.ceil(currentHealth)}/${maxHealth}`}
      label="Health"
      icon={IconType.HEALTH}
      variant="large"
      showLabel={true}
      color={currentHealth <= maxHealth * 0.3 ? 'danger' : 'primary'}
      className="bg-ui-bg-secondary border border-ui-border-DEFAULT shadow-md pointer-events-auto"
    />
  );
};