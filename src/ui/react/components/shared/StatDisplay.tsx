import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface Stat {
  label: string;
  value: string | number;
  icon?: IconType | ReactNode;
  valueColor?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'muted' | 'foreground';
  labelColor?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'muted' | 'foreground';
  suffix?: string;
  prefix?: string;
  tooltip?: string;
}

export interface StatDisplayProps extends HTMLAttributes<HTMLDivElement> {
  stats: Stat[];
  layout?: 'grid' | 'list' | 'inline';
  columns?: 1 | 2 | 3 | 4 | 'auto';
  variant?: 'default' | 'compact' | 'large' | 'minimal';
  showLabels?: boolean;
  showIcons?: boolean;
  gap?: 'sm' | 'md' | 'lg';
}

const layoutStyles = {
  grid: {
    container: 'grid',
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      auto: 'grid-cols-[repeat(auto-fit,minmax(150px,1fr))]',
    },
  },
  list: {
    container: 'flex flex-col',
  },
  inline: {
    container: 'flex flex-wrap',
  },
};

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const variantStyles = {
  default: {
    item: 'flex items-start gap-3',
    iconSize: 20,
    iconClass: 'w-5 h-5',
    labelClass: 'text-sm',
    valueClass: 'text-lg font-semibold',
  },
  compact: {
    item: 'flex items-center gap-2',
    iconSize: 16,
    iconClass: 'w-4 h-4',
    labelClass: 'text-sm',
    valueClass: 'text-base font-medium',
  },
  large: {
    item: 'text-center p-4',
    iconSize: 32,
    iconClass: 'w-8 h-8',
    labelClass: 'text-base',
    valueClass: 'text-2xl font-bold',
  },
  minimal: {
    item: 'flex items-baseline gap-1',
    iconSize: 14,
    iconClass: 'w-3.5 h-3.5',
    labelClass: 'text-xs',
    valueClass: 'text-sm font-medium',
  },
};

const colorStyles = {
  default: '',
  primary: 'text-ui-text-primary',
  secondary: 'text-ui-text-secondary',
  success: 'text-success-DEFAULT',
  danger: 'text-danger-DEFAULT',
  warning: 'text-warning-DEFAULT',
  muted: 'text-ui-text-muted',
  foreground: 'text-ui-text-primary',
};

interface StatItemProps {
  stat: Stat;
  variant: keyof typeof variantStyles;
  showLabels: boolean;
  showIcons: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ stat, variant, showLabels, showIcons }) => {
  const variantConfig = variantStyles[variant];

  const renderIcon = () => {
    if (!showIcons || !stat.icon) return null;

    if (React.isValidElement(stat.icon)) {
      return (
        <div className={cn('stat-icon flex-shrink-0', variantConfig.iconClass)}>
          {stat.icon}
        </div>
      );
    }

    return (
      <div className={cn('stat-icon flex-shrink-0', variantConfig.iconClass)}>
        <Icon type={stat.icon as IconType} size={variantConfig.iconSize} />
      </div>
    );
  };

  const valueText = [stat.prefix, stat.value, stat.suffix].filter(Boolean).join('');
  const valueColorClass = stat.valueColor ? colorStyles[stat.valueColor] : colorStyles.primary;
  const labelColorClass = stat.labelColor ? colorStyles[stat.labelColor] : colorStyles.secondary;

  return (
    <div className={cn('stat-item', variantConfig.item)} title={stat.tooltip}>
      {renderIcon()}
      
      <div className="stat-content">
        {showLabels && (
          <div className={cn('stat-label', variantConfig.labelClass, labelColorClass)}>
            {stat.label}
          </div>
        )}
        
        <div className={cn('stat-value', variantConfig.valueClass, valueColorClass)}>
          {valueText}
        </div>
      </div>
    </div>
  );
};

export const StatDisplay = forwardRef<HTMLDivElement, StatDisplayProps>(
  (
    {
      className,
      stats,
      layout = 'grid',
      columns = 'auto',
      variant = 'default',
      showLabels = true,
      showIcons = true,
      gap = 'md',
      ...props
    },
    ref
  ) => {
    const gapClass = gapStyles[gap];
    
    const getLayoutClasses = () => {
      if (layout === 'grid') {
        const columnsClass = layoutStyles.grid.columns[columns];
        return cn(layoutStyles.grid.container, columnsClass, gapClass);
      }
      
      return cn(layoutStyles[layout].container, gapClass);
    };

    return (
      <div
        ref={ref}
        className={cn('stat-display', getLayoutClasses(), className)}
        {...props}
      >
        {stats.map((stat, index) => (
          <StatItem
            key={`${stat.label}-${index}`}
            stat={stat}
            variant={variant}
            showLabels={showLabels}
            showIcons={showIcons}
          />
        ))}
      </div>
    );
  }
);

StatDisplay.displayName = 'StatDisplay';

// Utility components
export const StatGrid = forwardRef<HTMLDivElement, Omit<StatDisplayProps, 'layout'>>(
  ({ columns = 2, ...props }, ref) => (
    <StatDisplay ref={ref} layout="grid" columns={columns} {...props} />
  )
);

StatGrid.displayName = 'StatGrid';

export const InlineStats = forwardRef<HTMLDivElement, Omit<StatDisplayProps, 'layout' | 'variant' | 'gap'>>(
  (props, ref) => (
    <StatDisplay
      ref={ref}
      layout="inline"
      variant="minimal"
      gap="sm"
      {...props}
    />
  )
);

InlineStats.displayName = 'InlineStats';