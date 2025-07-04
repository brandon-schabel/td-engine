import React from 'react';
import { useGameStore } from '@/stores/hooks/useGameStore';
import { CurrencyDisplay as CurrencyDisplayComponent, IconType } from '../index';

/**
 * Currency display HUD component
 */
export const CurrencyDisplay: React.FC = () => {
  const currency = useGameStore((state) => state.currency);
  
  return (
    <CurrencyDisplayComponent
      value={currency}
      label="Coins"
      variant="large"
      showLabel={true}
      className="glass-dark rounded-lg pointer-events-auto !bg-transparent"
    />
  );
};