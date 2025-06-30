import React, { forwardRef, HTMLAttributes } from 'react';
import { CloseButton } from './Button';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  icon?: IconType | React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'primary' | 'secondary' | 'compact';
  alignment?: 'left' | 'center' | 'right';
}

const variantStyles = {
  default: {
    container: 'px-4 py-3 border-b border-ui-border-subtle text-ui-text-primary',
  },
  primary: {
    container: 'bg-button-primary text-white px-4 py-3',
  },
  secondary: {
    container: 'bg-ui-bg-secondary text-ui-text-primary px-4 py-3 border-b border-ui-border-subtle',
  },
  compact: {
    container: 'px-3 py-2 text-ui-text-primary',
  },
};

const alignmentStyles = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
};

const titleSizes = {
  1: 'text-2xl',
  2: 'text-xl',
  3: 'text-lg',
  4: 'text-base',
  5: 'text-sm',
  6: 'text-xs',
};

export const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      icon,
      showCloseButton = true,
      onClose,
      level = 2,
      variant = 'default',
      alignment = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
    const variantConfig = variantStyles[variant];
    const alignmentClass = alignmentStyles[alignment];
    const titleSize = titleSizes[level];

    const renderIcon = () => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return <div className="header-icon mr-3">{icon}</div>;
      }

      return (
        <div className="header-icon mr-3 flex-shrink-0">
          <Icon type={icon as IconType} size={level <= 2 ? 24 : level <= 4 ? 20 : 16} />
        </div>
      );
    };

    return (
      <header
        ref={ref}
        className={cn(
          'flex items-center',
          variantConfig.container,
          alignmentClass,
          className
        )}
        {...props}
      >
        <div className="header-content flex-1 flex items-center">
          {renderIcon()}
          
          <div className="header-titles">
            <HeadingTag className={cn('header-title font-semibold', titleSize)}>
              {title}
            </HeadingTag>
            
            {subtitle && (
              <p className="header-subtitle text-sm text-ui-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {showCloseButton && onClose && (
          <CloseButton onClick={onClose} className="ml-auto" />
        )}

        {children}
      </header>
    );
  }
);

Header.displayName = 'Header';

// Utility components for common use cases
export const DialogHeader = forwardRef<
  HTMLElement,
  Omit<HeaderProps, 'variant' | 'level' | 'showCloseButton'> & { onClose: () => void }
>(({ ...props }, ref) => (
  <Header
    ref={ref}
    variant="compact"
    level={2}
    showCloseButton={true}
    {...props}
  />
));

DialogHeader.displayName = 'DialogHeader';

export const CompactHeader = forwardRef<
  HTMLElement,
  Omit<HeaderProps, 'variant' | 'level' | 'showCloseButton'>
>(({ ...props }, ref) => (
  <Header
    ref={ref}
    variant="compact"
    level={3}
    showCloseButton={false}
    {...props}
  />
));

CompactHeader.displayName = 'CompactHeader';