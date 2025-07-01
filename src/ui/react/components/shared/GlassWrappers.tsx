import React from 'react';
import { Modal, type ModalProps } from './Modal';
import { GlassPanel } from './Glass';
import { cn } from '@/lib/utils';

/**
 * Glass Modal wrapper with consistent styling
 */
export interface GlassModalProps extends Omit<ModalProps, 'children'> {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  title,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  className,
  ...modalProps
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Modal {...modalProps} onClose={onClose} isOpen={modalProps.isOpen}>
      <GlassPanel
        variant="dark"
        blur="xl"
        opacity={90}
        border={true}
        glow={true}
        className={cn(
          sizeClasses[size],
          'w-full',
          'rounded-2xl',
          'overflow-hidden',
          'shadow-2xl',
          className
        )}
      >
        {title && (
          <GlassPanel.Header className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </GlassPanel.Header>
        )}
        <GlassPanel.Body>{children}</GlassPanel.Body>
      </GlassPanel>
    </Modal>
  );
};

/**
 * Glass Dialog - A simpler modal pattern
 */
export interface GlassDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
}) => {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {description && (
          <p className="text-ui-text-secondary">{description}</p>
        )}
        {children}
        {actions && (
          <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
            {actions}
          </div>
        )}
      </div>
    </GlassModal>
  );
};

/**
 * Glass Menu - For floating menus with glass styling
 */
export interface GlassMenuProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassMenu: React.FC<GlassMenuProps> = ({ children, className }) => {
  return (
    <GlassPanel
      variant="dark"
      blur="lg"
      opacity={85}
      border={true}
      className={cn(
        'rounded-lg',
        'p-2',
        'min-w-[180px]',
        className
      )}
    >
      {children}
    </GlassPanel>
  );
};

/**
 * Glass Menu Item
 */
export interface GlassMenuItemProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

export const GlassMenuItem: React.FC<GlassMenuItemProps> = ({
  onClick,
  icon,
  children,
  disabled = false,
  destructive = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full',
        'flex items-center gap-3',
        'px-3 py-2',
        'rounded-md',
        'text-left',
        'transition-colors',
        'hover:bg-white/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        destructive && 'text-status-error hover:bg-status-error/20'
      )}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
};

/**
 * Glass Alert - For important messages
 */
export interface GlassAlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const GlassAlert: React.FC<GlassAlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className,
}) => {
  const variantClasses = {
    info: 'border-primary/30 text-primary',
    warning: 'border-status-warning/30 text-status-warning',
    error: 'border-status-error/30 text-status-error',
    success: 'border-status-success/30 text-status-success',
  };

  return (
    <GlassPanel
      variant="dark"
      blur="sm"
      opacity={60}
      border={true}
      className={cn(
        'rounded-lg p-4',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </GlassPanel>
  );
};