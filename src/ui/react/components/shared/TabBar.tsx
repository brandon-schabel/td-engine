import React, { forwardRef, HTMLAttributes, ReactNode, useState, useCallback, useEffect } from 'react';
import { Icon } from './Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: IconType | ReactNode;
  disabled?: boolean;
  badge?: string | number;
  content?: ReactNode;
}

export interface TabBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: Tab[];
  defaultTabId?: string;
  activeTabId?: string;
  variant?: 'default' | 'pills' | 'underline' | 'contained';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  onChange?: (tabId: string, previousTabId: string | null) => void;
  showContent?: boolean;
  tabClassName?: string;
  contentClassName?: string;
}

const variantStyles = {
  default: {
    list: 'gap-1',
    active: 'text-button-primary font-semibold',
    inactive: 'text-ui-text-muted hover:text-ui-text-primary',
  },
  pills: {
    list: 'gap-2 p-1 bg-ui-bg-secondary rounded-lg',
    active: 'bg-button-primary text-white shadow-sm',
    inactive: 'text-ui-text-muted hover:bg-ui-bg-hover',
  },
  underline: {
    list: 'border-b border-ui-border-subtle',
    active: 'text-button-primary border-b-2 border-button-primary',
    inactive: 'text-ui-text-muted border-b-2 border-transparent hover:text-ui-text-primary',
  },
  contained: {
    list: 'bg-ui-bg-primary border border-ui-border-DEFAULT rounded-lg p-1',
    active: 'bg-button-primary text-white',
    inactive: 'text-ui-text-muted hover:bg-ui-bg-hover',
  },
};

const sizeStyles = {
  sm: { button: 'px-3 py-1.5 text-sm gap-1', icon: 14, badge: 'text-xs px-1.5' },
  md: { button: 'px-4 py-2 text-base gap-2', icon: 16, badge: 'text-sm px-2' },
  lg: { button: 'px-5 py-3 text-lg gap-3', icon: 20, badge: 'text-base px-2.5' },
};

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  variant: keyof typeof variantStyles;
  size: keyof typeof sizeStyles;
  fullWidth: boolean;
  tabClassName?: string;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ 
  tab, 
  isActive, 
  variant, 
  size, 
  fullWidth, 
  tabClassName,
  onClick 
}) => {
  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  const renderIcon = () => {
    if (!tab.icon) return null;

    if (React.isValidElement(tab.icon)) {
      return <span className="tab-icon">{tab.icon}</span>;
    }

    return (
      <span className="tab-icon">
        <Icon type={tab.icon as IconType} size={sizeConfig.icon} />
      </span>
    );
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
      disabled={tab.disabled}
      onClick={onClick}
      className={cn(
        'tab-button transition-all duration-200',
        sizeConfig.button,
        isActive ? variantConfig.active : variantConfig.inactive,
        fullWidth && 'flex-1',
        tab.disabled && 'opacity-50 cursor-not-allowed',
        tabClassName
      )}
    >
      {renderIcon()}
      <span className="tab-label">{tab.label}</span>
      {tab.badge !== undefined && tab.badge !== null && (
        <span className={cn('tab-badge ml-2', sizeConfig.badge)}>
          {tab.badge}
        </span>
      )}
    </button>
  );
};

interface TabPanelProps {
  tab: Tab;
  isActive: boolean;
  contentClassName?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ tab, isActive, contentClassName }) => {
  if (!tab.content) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      id={`tabpanel-${tab.id}`}
      className={cn('tab-panel', contentClassName)}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      {tab.content}
    </div>
  );
};

export const TabBar = forwardRef<HTMLDivElement, TabBarProps>(
  (
    {
      className,
      tabs,
      defaultTabId,
      activeTabId: controlledActiveTabId,
      variant = 'default',
      size = 'md',
      orientation = 'horizontal',
      fullWidth = false,
      onChange,
      showContent = true,
      tabClassName,
      contentClassName,
      ...props
    },
    ref
  ) => {
    const [internalActiveTabId, setInternalActiveTabId] = useState(() => {
      const initialTab = defaultTabId || (tabs.length > 0 && !tabs[0].disabled ? tabs[0].id : null);
      return initialTab;
    });

    const activeTabId = controlledActiveTabId !== undefined ? controlledActiveTabId : internalActiveTabId;
    const variantConfig = variantStyles[variant];

    const handleTabClick = useCallback((tabId: string) => {
      if (activeTabId === tabId) return;

      const previousTabId = activeTabId;
      
      if (controlledActiveTabId === undefined) {
        setInternalActiveTabId(tabId);
      }

      onChange?.(tabId, previousTabId);
    }, [activeTabId, controlledActiveTabId, onChange]);

    // Update internal state if controlled value changes
    useEffect(() => {
      if (controlledActiveTabId !== undefined && controlledActiveTabId !== internalActiveTabId) {
        setInternalActiveTabId(controlledActiveTabId);
      }
    }, [controlledActiveTabId, internalActiveTabId]);

    return (
      <div
        ref={ref}
        className={cn(
          'tab-container',
          orientation === 'vertical' && 'flex gap-4',
          className
        )}
        {...props}
      >
        <div
          role="tablist"
          aria-orientation={orientation}
          className={cn(
            'tab-list',
            variantConfig.list,
            orientation === 'horizontal' ? [
              'flex flex-row',
              fullWidth && 'w-full',
            ] : [
              'flex flex-col min-w-[200px]',
            ]
          )}
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTabId === tab.id}
              variant={variant}
              size={size}
              fullWidth={fullWidth && orientation === 'horizontal'}
              tabClassName={tabClassName}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
            />
          ))}
        </div>

        {showContent && (
          <div className={cn('tab-content flex-1', contentClassName)}>
            {tabs.map((tab) => (
              <TabPanel
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
                contentClassName={contentClassName}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

TabBar.displayName = 'TabBar';

// Utility component for simple use cases
export const SimpleTabBar = forwardRef<HTMLDivElement, Omit<TabBarProps, 'variant'>>(
  (props, ref) => <TabBar ref={ref} variant="underline" {...props} />
);

SimpleTabBar.displayName = 'SimpleTabBar';