import React from 'react';
import { cn } from '@/lib/utils';
import { IconType } from '@/ui/icons/SvgIcons';
import { Header } from '../index';

interface PanelProps {
  title?: string;
  icon?: IconType;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onClose?: () => void;
}

/**
 * Panel component for floating UI elements
 * Used for inventory, build menus, etc.
 */
export const Panel: React.FC<PanelProps> = ({
  title,
  icon,
  children,
  className,
  headerClassName,
  contentClassName,
  onClose
}) => {
  return (
    <div 
      className={cn(
        'bg-ui-bg-secondary',
        'rounded-lg',
        'shadow-xl',
        'border',
        'border-white/10',
        className
      )}
      style={{ pointerEvents: 'auto' }}
    >
      {title && (
        <Header
          title={title}
          icon={icon}
          onClose={onClose}
          showCloseButton={!!onClose}
          variant="default"
          className={cn('border-b', 'border-white/10', headerClassName)}
        />
      )}
      <div className={cn('p-4', contentClassName)}>
        {children}
      </div>
    </div>
  );
};