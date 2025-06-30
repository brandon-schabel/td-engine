import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SceneProps {
  children: ReactNode;
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

export const Scene: React.FC<SceneProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col',
      'bg-ui-bg-primary',
      className
    )}>
      {children}
    </div>
  );
};

interface SceneContainerProps {
  children: ReactNode;
  centered?: boolean;
  padded?: boolean;
  className?: string;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  centered = false,
  padded = true,
  className
}) => {
  return (
    <div className={cn(
      'flex-1',
      'flex',
      'flex-col',
      centered && 'items-center justify-center',
      padded && 'p-4 sm:p-8',
      className
    )}>
      {children}
    </div>
  );
};

interface SceneHeaderProps {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  title,
  leftAction,
  rightAction,
  className
}) => {
  return (
    <div className={cn(
      'flex',
      'items-center',
      'justify-between',
      'p-4',
      'bg-ui-bg-secondary',
      'border-b',
      'border-ui-border-subtle',
      className
    )}>
      <div className="flex-1">
        {leftAction}
      </div>
      
      {title && (
        <h1 className={cn(
          'text-2xl',
          'font-bold',
          'text-ui-text-primary',
          'text-center',
          'flex-shrink-0'
        )}>
          {title}
        </h1>
      )}
      
      <div className="flex-1 flex justify-end">
        {rightAction}
      </div>
    </div>
  );
};