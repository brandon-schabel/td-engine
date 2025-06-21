/**
 * TabBar Element Abstraction
 * Provides a declarative API for creating tab navigation components
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';

export interface Tab {
  id: string;
  label: string;
  icon?: IconType;
  iconHtml?: string;
  disabled?: boolean;
  badge?: string | number;
  content?: HTMLElement | string | (() => HTMLElement | string);
}

export interface CreateTabBarOptions {
  tabs: Tab[];
  id?: string;
  defaultTabId?: string;
  variant?: 'default' | 'pills' | 'underline' | 'contained';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  onChange?: (tabId: string, previousTabId: string | null) => void;
  customClasses?: string[];
  tabClasses?: string[];
  contentClasses?: string[];
  showContent?: boolean;
}

/**
 * Creates a tab bar element with consistent styling and behavior
 */
export function createTabBar(options: CreateTabBarOptions): HTMLDivElement {
  const {
    tabs,
    id,
    defaultTabId,
    variant = 'default',
    size = 'md',
    orientation = 'horizontal',
    fullWidth = false,
    onChange,
    customClasses = [],
    tabClasses = [],
    contentClasses = [],
    showContent = true
  } = options;

  const container = document.createElement('div');
  
  if (id) {
    container.id = id;
  }

  // Container classes
  const containerClassList = ['tab-container'];
  if (orientation === 'vertical') {
    containerClassList.push('flex', 'gap-4');
  }
  if (customClasses.length > 0) {
    containerClassList.push(...customClasses);
  }
  container.className = cn(...containerClassList);

  // Create tab list
  const tabList = document.createElement('div');
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-orientation', orientation);
  
  // Tab list classes
  const tabListClasses = ['tab-list'];
  const variantClasses = getVariantClasses(variant);
  tabListClasses.push(...variantClasses);
  
  if (orientation === 'horizontal') {
    tabListClasses.push('flex', 'flex-row');
    if (fullWidth) {
      tabListClasses.push('w-full');
    }
  } else {
    tabListClasses.push('flex', 'flex-col', 'min-w-[200px]');
  }
  
  tabList.className = cn(...tabListClasses);

  // Create content container
  let contentContainer: HTMLDivElement | null = null;
  if (showContent) {
    contentContainer = document.createElement('div');
    contentContainer.className = cn('tab-content', 'flex-1', ...contentClasses);
  }

  // Track active tab
  let activeTabId = defaultTabId || (tabs.length > 0 && !tabs[0].disabled ? tabs[0].id : null);

  // Create tab buttons
  const tabElements: Map<string, HTMLButtonElement> = new Map();
  const contentElements: Map<string, HTMLElement> = new Map();

  tabs.forEach((tab) => {
    // Create tab button
    const tabButton = createTabButton(tab, {
      variant,
      size,
      isActive: tab.id === activeTabId,
      fullWidth: fullWidth && orientation === 'horizontal',
      customClasses: tabClasses
    });

    // Handle tab click
    if (!tab.disabled) {
      addClickAndTouchSupport(tabButton, () => {
        if (activeTabId === tab.id) return;

        const previousTabId = activeTabId;
        activeTabId = tab.id;

        // Update all tabs
        updateTabStates(tabElements, contentElements, activeTabId);

        // Call onChange callback
        if (onChange) {
          onChange(tab.id, previousTabId);
        }
      });
    }

    tabElements.set(tab.id, tabButton);
    tabList.appendChild(tabButton);

    // Create content panel if needed
    if (showContent && contentContainer && tab.content) {
      const panel = createTabPanel(tab, tab.id === activeTabId);
      contentElements.set(tab.id, panel);
      contentContainer.appendChild(panel);
    }
  });

  // Assemble container
  container.appendChild(tabList);
  if (contentContainer) {
    container.appendChild(contentContainer);
  }

  // Set initial tab states
  updateTabStates(tabElements, contentElements, activeTabId);

  return container;
}

/**
 * Creates a tab button element
 */
function createTabButton(
  tab: Tab,
  options: {
    variant: string;
    size: string;
    isActive: boolean;
    fullWidth: boolean;
    customClasses: string[];
  }
): HTMLButtonElement {
  const { variant, size, isActive, fullWidth, customClasses } = options;
  
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', String(isActive));
  button.setAttribute('aria-controls', `tabpanel-${tab.id}`);
  button.id = `tab-${tab.id}`;
  
  if (tab.disabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  // Base classes
  const classes = ['tab-button'];
  
  // Size classes
  const sizeClasses = getSizeClasses(size);
  classes.push(...sizeClasses);

  // Variant-specific button classes
  const buttonVariantClasses = getTabButtonVariantClasses(variant, isActive);
  classes.push(...buttonVariantClasses);

  // Full width
  if (fullWidth) {
    classes.push('flex-1');
  }

  // Disabled state
  if (tab.disabled) {
    classes.push('opacity-50', 'cursor-not-allowed');
  }

  // Custom classes
  if (customClasses.length > 0) {
    classes.push(...customClasses);
  }

  button.className = cn(...classes);

  // Build content
  const content = buildTabContent(tab, size);
  button.innerHTML = content;

  return button;
}

/**
 * Creates a tab panel element
 */
function createTabPanel(tab: Tab, isActive: boolean): HTMLElement {
  const panel = document.createElement('div');
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
  panel.id = `tabpanel-${tab.id}`;
  panel.className = cn('tab-panel');
  
  if (!isActive) {
    panel.style.display = 'none';
  }

  // Add content
  if (tab.content) {
    if (typeof tab.content === 'function') {
      const contentResult = tab.content();
      if (typeof contentResult === 'string') {
        panel.innerHTML = contentResult;
      } else {
        panel.appendChild(contentResult);
      }
    } else if (typeof tab.content === 'string') {
      panel.innerHTML = tab.content;
    } else {
      panel.appendChild(tab.content);
    }
  }

  return panel;
}

/**
 * Build tab button content
 */
function buildTabContent(tab: Tab, size: string): string {
  const parts: string[] = [];
  
  // Icon
  if (tab.icon || tab.iconHtml) {
    const iconSize = getIconSize(size);
    if (tab.iconHtml) {
      parts.push(`<span class="tab-icon">${tab.iconHtml}</span>`);
    } else if (tab.icon) {
      parts.push(`<span class="tab-icon">${createSvgIcon(tab.icon, { size: iconSize })}</span>`);
    }
  }

  // Label
  parts.push(`<span class="tab-label">${tab.label}</span>`);

  // Badge
  if (tab.badge !== undefined && tab.badge !== null) {
    const badgeClass = cn('tab-badge', 'ml-2', getBadgeSizeClass(size));
    parts.push(`<span class="${badgeClass}">${tab.badge}</span>`);
  }

  return parts.join('');
}

/**
 * Update tab states
 */
function updateTabStates(
  tabElements: Map<string, HTMLButtonElement>,
  contentElements: Map<string, HTMLElement>,
  activeTabId: string | null
): void {
  tabElements.forEach((button, tabId) => {
    const isActive = tabId === activeTabId;
    button.setAttribute('aria-selected', String(isActive));
    
    // Update classes based on variant
    const variant = button.dataset.variant || 'default';
    const activeClasses = getActiveClasses(variant);
    const inactiveClasses = getInactiveClasses(variant);
    
    if (isActive) {
      inactiveClasses.forEach(cls => button.classList.remove(cls));
      activeClasses.forEach(cls => button.classList.add(cls));
    } else {
      activeClasses.forEach(cls => button.classList.remove(cls));
      inactiveClasses.forEach(cls => button.classList.add(cls));
    }
  });

  contentElements.forEach((panel, tabId) => {
    panel.style.display = tabId === activeTabId ? 'block' : 'none';
  });
}

/**
 * Get variant-specific classes for tab list
 */
function getVariantClasses(variant: string): string[] {
  switch (variant) {
    case 'pills':
      return ['gap-2', 'p-1', 'bg-surface-secondary', 'rounded-lg'];
    
    case 'underline':
      return ['border-b', 'border-surface-border'];
    
    case 'contained':
      return ['bg-surface', 'border', 'border-surface-border', 'rounded-lg', 'p-1'];
    
    default: // 'default'
      return ['gap-1'];
  }
}

/**
 * Get variant-specific classes for tab buttons
 */
function getTabButtonVariantClasses(variant: string, isActive: boolean): string[] {
  const button = document.createElement('button');
  button.dataset.variant = variant;
  
  const baseClasses = ['transition-all', 'duration-200'];
  const activeClasses = getActiveClasses(variant);
  const inactiveClasses = getInactiveClasses(variant);
  
  return [...baseClasses, ...(isActive ? activeClasses : inactiveClasses)];
}

/**
 * Get active state classes
 */
function getActiveClasses(variant: string): string[] {
  switch (variant) {
    case 'pills':
      return ['bg-primary', 'text-on-primary', 'shadow-sm'];
    
    case 'underline':
      return ['text-primary', 'border-b-2', 'border-primary'];
    
    case 'contained':
      return ['bg-primary', 'text-on-primary'];
    
    default:
      return ['text-primary', 'font-semibold'];
  }
}

/**
 * Get inactive state classes
 */
function getInactiveClasses(variant: string): string[] {
  switch (variant) {
    case 'pills':
      return ['text-muted', 'hover:bg-surface-hover'];
    
    case 'underline':
      return ['text-muted', 'border-b-2', 'border-transparent', 'hover:text-foreground'];
    
    case 'contained':
      return ['text-muted', 'hover:bg-surface-hover'];
    
    default:
      return ['text-muted', 'hover:text-foreground'];
  }
}

/**
 * Get size-specific classes
 */
function getSizeClasses(size: string): string[] {
  switch (size) {
    case 'sm':
      return ['px-3', 'py-1.5', 'text-sm', 'gap-1'];
    case 'lg':
      return ['px-5', 'py-3', 'text-lg', 'gap-3'];
    default: // 'md'
      return ['px-4', 'py-2', 'text-base', 'gap-2'];
  }
}

/**
 * Get icon size based on tab size
 */
function getIconSize(size: string): number {
  switch (size) {
    case 'sm':
      return 14;
    case 'lg':
      return 20;
    default:
      return 16;
  }
}

/**
 * Get badge size class
 */
function getBadgeSizeClass(size: string): string {
  switch (size) {
    case 'sm':
      return 'text-xs px-1.5';
    case 'lg':
      return 'text-base px-2.5';
    default:
      return 'text-sm px-2';
  }
}

/**
 * Utility function to create a simple tab bar
 */
export function createSimpleTabBar(
  tabs: Array<{ id: string; label: string; content: HTMLElement | string }>,
  options: Partial<CreateTabBarOptions> = {}
): HTMLDivElement {
  return createTabBar({
    tabs,
    variant: 'underline',
    ...options
  });
}