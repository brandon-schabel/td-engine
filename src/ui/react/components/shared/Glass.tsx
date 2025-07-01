import React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'colored';
  blur?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  border?: boolean;
  glow?: boolean;
}

// GlassPanel Header Component
interface GlassPanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
}

const GlassPanelHeader: React.FC<GlassPanelHeaderProps> = ({
  children,
  className,
  noBorder = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4',
        !noBorder && 'border-b border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// GlassPanel Body Component
const GlassPanelBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

// GlassPanel Footer Component
const GlassPanelFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4',
        'border-t border-white/10',
        'bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassPanel: React.FC<GlassPanelProps> & {
  Header: typeof GlassPanelHeader;
  Body: typeof GlassPanelBody;
  Footer: typeof GlassPanelFooter;
} = ({
  children,
  className,
  variant = 'dark',
  blur = 'md',
  opacity = 90,
  border = true,
  glow = false,
  ...props
}) => {
  const blurClasses = {
    xs: 'backdrop-blur-xs',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const variantClasses = {
    light: `bg-white/${opacity}`,
    dark: `bg-black/${opacity}`,
    colored: `bg-ui-bg-primary/${opacity}`,
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        blurClasses[blur],
        variantClasses[variant],
        border && 'border border-white/10',
        glow && 'shadow-[0_0_20px_rgba(255,255,255,0.1)]',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Attach compound components
GlassPanel.Header = GlassPanelHeader;
GlassPanel.Body = GlassPanelBody;
GlassPanel.Footer = GlassPanelFooter;

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  blur?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'ghost',
  size = 'md',
  active = false,
  blur = 'sm',
  disabled,
  ...props
}) => {
  const blurClasses = {
    xs: 'backdrop-blur-xs',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  const variantClasses = {
    primary: cn(
      'bg-primary/20 hover:bg-primary/30',
      'border border-primary/30 hover:border-primary/50',
      'text-primary-foreground',
      active && 'bg-primary/40 border-primary/60'
    ),
    secondary: cn(
      'bg-white/10 hover:bg-white/20',
      'border border-white/20 hover:border-white/30',
      'text-white',
      active && 'bg-white/30 border-white/40'
    ),
    ghost: cn(
      'bg-transparent hover:bg-white/10',
      'border border-transparent hover:border-white/20',
      'text-white/80 hover:text-white',
      active && 'bg-white/20 border-white/30 text-white'
    ),
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-lg',
        'font-medium transition-all duration-200',
        'flex items-center justify-center gap-2',
        blurClasses[blur],
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        'before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/0 before:to-white/5',
        'active:scale-95',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'colored';
  blur?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

// GlassCard Header Component
const GlassCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-4 py-3',
        'border-b border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// GlassCard Body Component
const GlassCardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

// GlassCard Footer Component
const GlassCardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-4 py-3',
        'border-t border-white/10',
        'bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassCard: React.FC<GlassCardProps> & {
  Header: typeof GlassCardHeader;
  Body: typeof GlassCardBody;
  Footer: typeof GlassCardFooter;
} = ({
  children,
  className,
  variant = 'dark',
  blur = 'md',
  padding = 'md',
  hover = false,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <GlassPanel
      variant={variant}
      blur={blur}
      className={cn(
        'rounded-xl',
        paddingClasses[padding],
        hover && 'hover:bg-white/5 hover:border-white/20 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

// Attach compound components
GlassCard.Header = GlassCardHeader;
GlassCard.Body = GlassCardBody;
GlassCard.Footer = GlassCardFooter;

interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  blur?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  className,
  size = 'md',
  active = false,
  blur = 'sm',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <GlassButton
      variant="ghost"
      size={size}
      active={active}
      blur={blur}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        'p-0 rounded-lg',
        className
      )}
      {...props}
    >
      {icon}
    </GlassButton>
  );
};

interface GlassDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'light' | 'dark';
}

export const GlassDivider: React.FC<GlassDividerProps> = ({
  orientation = 'horizontal',
  variant = 'light',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        variant === 'light' ? 'bg-white/10' : 'bg-black/10',
        className
      )}
      {...props}
    />
  );
};