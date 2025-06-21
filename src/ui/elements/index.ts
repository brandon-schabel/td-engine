/**
 * UI Elements - High-level abstractions for creating UI components
 * Export all element creation functions and types
 */

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