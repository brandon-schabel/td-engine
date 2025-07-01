import React from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { ResourceDisplay, IconType } from '../index';
import { DraggablePanel } from '../floating';
import { cn } from '@/lib/utils';

export interface DraggableCurrencyDisplayProps {
  /** Whether the display can be dragged */
  draggable?: boolean;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Additional class names */
  className?: string;
}

/**
 * Draggable currency display that shows the player's coins
 * Replaces the FloatingUIManager-based currency display
 */
export const DraggableCurrencyDisplay: React.FC<DraggableCurrencyDisplayProps> = ({
  draggable = true,
  defaultPosition = { x: 20, y: 100 },
  className,
}) => {
  const { currency } = useGameStore();

  return (
    <DraggablePanel
      id="currency-display"
      draggable={draggable}
      defaultPosition={defaultPosition}
      persistent={true}
      className={cn('!p-0', className)}
      style={{ backgroundColor: 'transparent' }}
      zIndex={500}
    >
      <ResourceDisplay
        value={currency}
        icon={IconType.COINS}
        label="Coins"
        variant="large"
        showLabel={true}
        format="currency"
        className="glass-dark rounded-lg"
        tooltip="Your currency"
      />
    </DraggablePanel>
  );
};