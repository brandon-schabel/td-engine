/**
 * UI Elements - High-level abstractions for creating UI components
 * Export all element creation functions and types
 */

// Utility exports
export { cn } from '@/ui/styles/UtilityStyles';

// Button exports
export { createButton, createCloseButton, createIconButton } from './Button';
export type { CreateButtonOptions } from './Button';

// Card exports
export { createCard, createStructuredCard, createClickableCard } from './Card';
export type { CreateCardOptions, CreateStructuredCardOptions } from './Card';

// Header exports
export { createHeader, createDialogHeader, createCompactHeader } from './Header';
export type { CreateHeaderOptions } from './Header';

// StatDisplay exports
export { createStatDisplay, createStatGrid, createInlineStats } from './StatDisplay';
export type { CreateStatDisplayOptions, Stat } from './StatDisplay';

// TabBar exports
export { createTabBar, createSimpleTabBar } from './TabBar';
export type { CreateTabBarOptions, Tab } from './TabBar';

// ResourceDisplay exports
export { createResourceDisplay, createCurrencyDisplay, createCompactResource, createResourceBadge } from './ResourceDisplay';
export type { CreateResourceDisplayOptions } from './ResourceDisplay';

// IconContainer exports
export { createIconContainer, createIconButton as createIconContainerButton, createIconWithBadge } from './IconContainer';
export type { CreateIconContainerOptions } from './IconContainer';

// Input exports
export { createInput, createSearchInput, createPasswordInput } from './Input';
export type { CreateInputOptions } from './Input';

// Select exports
export { createSelect, createGroupedSelect } from './Select';
export type { CreateSelectOptions, SelectOption } from './Select';

// Toggle exports
export { createToggle, createSwitchToggle, createCheckboxToggle } from './Toggle';
export type { CreateToggleOptions } from './Toggle';

// Slider exports
export { createSlider, createVolumeSlider, createPercentageSlider } from './Slider';
export type { CreateSliderOptions } from './Slider';

// Tooltip exports
export { createTooltip, addTooltip, createHelpTooltip, createRichTooltip } from './Tooltip';
export type { CreateTooltipOptions, TooltipInstance } from './Tooltip';

// ProgressBar exports
export { createProgressBar, createTimerProgressBar, createSegmentedProgressBar } from './ProgressBar';
export type { CreateProgressBarOptions, CreateTimerProgressBarOptions } from './ProgressBar';