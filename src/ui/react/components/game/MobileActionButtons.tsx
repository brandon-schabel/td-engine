import React from 'react';
import { cn } from '@/lib/utils';
import { MobileActionButton } from './MobileActionButton';
import { IconType } from '@/ui/icons/SvgIcons';

interface ActionButtonConfig {
  icon: IconType;
  onTap?: () => void;
  onHold?: () => void;
  label?: string;
  disabled?: boolean;
  glowColor?: string;
}

interface MobileActionButtonsProps {
  position?: 'left' | 'right';
  buttons: ActionButtonConfig[];
  className?: string;
  buttonSize?: number;
}

export const MobileActionButtons: React.FC<MobileActionButtonsProps> = ({
  position = 'right',
  buttons,
  className,
  buttonSize = 60
}) => {
  return (
    <div 
      className={cn(
        'absolute bottom-20',
        position === 'right' ? 'right-4' : 'left-4',
        'flex flex-col gap-3',
        className
      )}
    >
      {buttons.map((button, index) => (
        <MobileActionButton
          key={index}
          icon={button.icon}
          size={buttonSize}
          onTap={button.onTap}
          onHold={button.onHold}
          label={button.label}
          disabled={button.disabled}
          glowColor={button.glowColor}
          className={cn(
            'animate-fade-in-scale',
            `animation-delay-${index * 50}`
          )}
        />
      ))}
    </div>
  );
};