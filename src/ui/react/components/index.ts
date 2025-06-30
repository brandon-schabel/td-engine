// Core components
export { Button, CloseButton, IconButton } from './shared/Button';
export type { ButtonProps } from './shared/Button';

export { Icon, MemoizedIcon } from './shared/Icon';
export type { IconProps } from './shared/Icon';

export { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  ClickableCard, 
  StructuredCard 
} from './shared/Card';
export type { 
  CardProps, 
  CardHeaderProps, 
  StructuredCardProps 
} from './shared/Card';

// Form components
export { Input, SearchInput, PasswordInput } from './shared/Input';
export type { InputProps } from './shared/Input';

export { Select, GroupedSelect } from './shared/Select';
export type { SelectProps, SelectOption, GroupedSelectProps, SelectGroup } from './shared/Select';

export { Toggle, Switch, Checkbox } from './shared/Toggle';
export type { ToggleProps } from './shared/Toggle';

export { Slider } from './shared/Slider';
export type { SliderProps } from './shared/Slider';

// Display components
export { 
  ResourceDisplay, 
  CurrencyDisplay, 
  CompactResource, 
  ResourceBadge 
} from './shared/ResourceDisplay';
export type { ResourceDisplayProps } from './shared/ResourceDisplay';

export { Header, DialogHeader, CompactHeader } from './shared/Header';
export type { HeaderProps } from './shared/Header';

export { StatDisplay, StatGrid, InlineStats } from './shared/StatDisplay';
export type { StatDisplayProps, Stat } from './shared/StatDisplay';

export { IconContainer, IconButton as IconContainerButton, IconWithBadge } from './shared/IconContainer';
export type { IconContainerProps } from './shared/IconContainer';

export { TabBar, SimpleTabBar } from './shared/TabBar';
export type { TabBarProps, Tab } from './shared/TabBar';

export { ProgressBar, TimerProgressBar, SegmentedProgressBar } from './shared/ProgressBar';
export type { ProgressBarProps, TimerProgressBarProps, SegmentedProgressBarProps } from './shared/ProgressBar';

export { Tooltip, HelpTooltip, ClickTooltip, InfoTooltip } from './shared/Tooltip';
export type { TooltipProps } from './shared/Tooltip';

// Re-export icon types for convenience
export { IconType } from '@/ui/icons/SvgIcons';