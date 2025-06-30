import React from 'react';
import { ResourceDisplay } from '../shared/ResourceDisplay';
import { IconType } from '@/ui/icons/SvgIcons';

interface ScoreDisplayProps {
  value: number;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ value, className }) => {
  return (
    <ResourceDisplay
      value={value}
      icon={IconType.STAR}
      variant="compact"
      showIcon={true}
      format="number"
      className={className}
    />
  );
};