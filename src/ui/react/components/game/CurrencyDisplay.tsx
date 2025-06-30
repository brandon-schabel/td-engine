import React from 'react';
import { ResourceDisplay } from '../shared/ResourceDisplay';
import { IconType } from '@/ui/icons/SvgIcons';

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ value, className }) => {
  return (
    <ResourceDisplay
      value={value}
      icon={IconType.COINS}
      variant="compact"
      showIcon={true}
      className={className}
    />
  );
};