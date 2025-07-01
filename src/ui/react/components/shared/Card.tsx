import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  asChild?: boolean;
}

const cardVariants = {
  default: [
    'bg-ui-bg-secondary',
    'border border-ui-border-subtle',
    'shadow-sm',
  ],
  elevated: [
    'bg-ui-bg-secondary',
    'border border-ui-border-subtle',
    'shadow-md',
  ],
  outlined: [
    'bg-transparent',
    'border-2 border-ui-border-DEFAULT',
  ],
  filled: [
    'bg-ui-bg-secondary',
    'border border-ui-border-subtle',
  ],
  glass: [
    'bg-white/10',
    'backdrop-blur-md',
    'border border-white/20',
    'shadow-lg',
  ],
};

const paddingSizes = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      onClick,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isInteractive = hoverable || clickable || !!onClick;

    const classes = cn(
      // Base styles
      'rounded-md overflow-hidden',
      
      // Variant styles
      cardVariants[variant],
      
      // Padding
      paddingSizes[padding],
      
      // Interactive states
      isInteractive && 'transition-all duration-200',
      hoverable && 'hover:shadow-lg hover:scale-[1.02]',
      clickable && 'cursor-pointer active:scale-[0.98]',
      
      // Focus styles for clickable cards
      clickable && 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary',
      
      className
    );

    const Component = asChild ? 'div' : 'div';
    const interactiveProps = clickable ? {
      tabIndex: 0,
      role: 'button',
      onKeyDown: (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick(e as any);
        }
      },
    } : {};

    return (
      <Component
        ref={ref}
        className={classes}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for structured cards
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, noBorder = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-4 py-3',
        !noBorder && 'border-b border-ui-border-subtle',
        className
      )}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4', className)}
      {...props}
    />
  )
);

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-4 py-3',
        'border-t border-ui-border-subtle',
        'bg-black/20',
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// Utility components
export const ClickableCard = forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'clickable' | 'hoverable'> & { onClick: () => void }
>(({ ...props }, ref) => (
  <Card ref={ref} clickable hoverable {...props} />
));

ClickableCard.displayName = 'ClickableCard';

// Compound component for better composition
export interface StructuredCardProps extends CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const StructuredCard = forwardRef<HTMLDivElement, StructuredCardProps>(
  ({ header, footer, children, padding = 'none', ...props }, ref) => (
    <Card ref={ref} padding={padding} {...props}>
      {header && <CardHeader>{header}</CardHeader>}
      {children && <CardBody>{children}</CardBody>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
);

StructuredCard.displayName = 'StructuredCard';