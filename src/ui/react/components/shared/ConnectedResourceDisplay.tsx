/**
 * Connected versions of ResourceDisplay components that automatically
 * subscribe to game store values
 */

import React from 'react';
import { ResourceDisplay, ResourceDisplayProps, CurrencyDisplay, ResourceBadge } from './ResourceDisplay';
import { IconType } from '@/ui/icons/SvgIcons';
import { 
  useCurrency, 
  useLives, 
  useScore,
  useCurrentWave,
  useEnemiesRemaining,
  usePlayerLevel,
  usePlayerExperience
} from '@/stores/hooks/useGameStore';

// Connected Currency Display
export const ConnectedCurrencyDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon' | 'format'>> = (props) => {
  const currency = useCurrency();
  return <CurrencyDisplay value={currency} {...props} />;
};

// Connected Lives Display
export const ConnectedLivesDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const lives = useLives();
  return <ResourceDisplay value={lives} icon={IconType.HEART} format="number" {...props} />;
};

// Connected Score Display
export const ConnectedScoreDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const score = useScore();
  return <ResourceDisplay value={score} icon={IconType.STAR} format="number" {...props} />;
};

// Connected Wave Display
export const ConnectedWaveDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const currentWave = useCurrentWave();
  return <ResourceDisplay value={currentWave} icon={IconType.WAVE} format="number" label="Wave" {...props} />;
};

// Connected Enemies Remaining Display
export const ConnectedEnemiesDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const enemiesRemaining = useEnemiesRemaining();
  return <ResourceDisplay value={enemiesRemaining} icon={IconType.ENEMY} format="number" label="Enemies" {...props} />;
};

// Connected Player Level Display
export const ConnectedPlayerLevelDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const playerLevel = usePlayerLevel();
  return <ResourceDisplay value={playerLevel} icon={IconType.PLAYER} format="number" label="Level" {...props} />;
};

// Connected Player Experience Display
export const ConnectedPlayerExpDisplay: React.FC<Omit<ResourceDisplayProps, 'value' | 'icon'>> = (props) => {
  const experience = usePlayerExperience();
  return <ResourceDisplay value={experience} icon={IconType.XP} format="number" label="XP" {...props} />;
};

// Game Header Component using connected displays
export interface GameHeaderProps {
  className?: string;
  variant?: ResourceDisplayProps['variant'];
}

export const GameHeader: React.FC<GameHeaderProps> = ({ className, variant = 'compact' }) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <ConnectedCurrencyDisplay variant={variant} />
        <ConnectedLivesDisplay variant={variant} />
        <ConnectedScoreDisplay variant={variant} />
        <ConnectedWaveDisplay variant={variant} showLabel />
        <ConnectedEnemiesDisplay variant={variant} showLabel />
      </div>
    </div>
  );
};

// Compact Game Status Bar
export const GameStatusBar: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ConnectedCurrencyDisplay variant="inline" />
          <span className="text-ui-text-muted">•</span>
          <ConnectedLivesDisplay variant="inline" />
        </div>
        <div className="flex items-center gap-2">
          <ConnectedWaveDisplay variant="inline" />
          <span className="text-ui-text-muted">•</span>
          <ConnectedEnemiesDisplay variant="inline" />
        </div>
      </div>
    </div>
  );
};