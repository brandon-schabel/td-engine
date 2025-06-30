import React from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { CurrencyDisplay as CurrencyDisplayComponent, IconType } from '../index';

/**
 * Currency display HUD component
 */
export const CurrencyDisplay: React.FC = () => {
  const { currency } = useGameStore();
  
  return (
    <CurrencyDisplayComponent
      value={currency}
      label="Coins"
      variant="large"
      showLabel={true}
      className="bg-ui-bg-secondary border border-ui-border-DEFAULT shadow-md pointer-events-auto"
    />
  );
};