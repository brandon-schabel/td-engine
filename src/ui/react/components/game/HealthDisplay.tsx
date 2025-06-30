import React from 'react';
import { ResourceDisplay } from '../shared/ResourceDisplay';
import { IconType } from '@/ui/icons/SvgIcons';

interface HealthDisplayProps {
  value: number;
  maxValue?: number;
  className?: string;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = ({ value, maxValue, className }) => {
  const displayValue = maxValue ? `${value}/${maxValue}` : value;
  
  return (
    <ResourceDisplay
      value={displayValue}
      icon={IconType.HEART}
      variant="compact"
      showIcon={true}
      color={value <= 10 ? 'danger' : 'default'}
      className={className}
    />
  );
};