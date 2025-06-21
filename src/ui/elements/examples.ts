/**
 * Examples of using the UI element abstractions
 * This file demonstrates how to use each of the new UI components
 */

import {
  createButton,
  createCard,
  createStructuredCard,
  createHeader,
  createDialogHeader,
  createStatDisplay,
  createStatGrid,
  createTabBar,
  createResourceDisplay,
  createCurrencyDisplay,
  createIconContainer,
  createIconWithBadge,
  type Stat,
  type Tab
} from './index';
import { IconType } from '@/ui/icons/SvgIcons';

// Button examples
export function buttonExamples() {
  // Primary button with icon
  const saveButton = createButton({
    text: 'Save Game',
    icon: IconType.CHECKMARK,
    variant: 'primary',
    onClick: () => console.log('Game saved!')
  });

  // Icon-only button
  const settingsButton = createButton({
    icon: IconType.SETTINGS,
    variant: 'ghost',
    ariaLabel: 'Settings'
  });

  // Danger button
  const deleteButton = createButton({
    text: 'Delete Save',
    variant: 'danger',
    icon: IconType.CANCEL,
    iconPosition: 'right'
  });

  return { saveButton, settingsButton, deleteButton };
}

// Card examples
export function cardExamples() {
  // Simple card
  const basicCard = createCard({
    variant: 'elevated',
    padding: 'lg',
    hoverable: true
  });
  basicCard.innerHTML = '<h3>Tower Stats</h3><p>Damage: 50</p>';

  // Structured card with sections
  const towerCard = createStructuredCard({
    header: '<h3>Sniper Tower</h3>',
    body: '<p>Long range precision tower</p>',
    footer: createButton({ text: 'Upgrade', variant: 'primary' }),
    variant: 'outlined'
  });

  // Clickable card
  const enemyCard = createCard({
    clickable: true,
    hoverable: true,
    onClick: () => console.log('Enemy selected')
  });

  return { basicCard, towerCard, enemyCard };
}

// Header examples
export function headerExamples() {
  // Dialog header with close button
  const dialogHeader = createDialogHeader(
    'Tower Upgrades',
    () => console.log('Dialog closed')
  );

  // Custom header with subtitle and icon
  const customHeader = createHeader({
    title: 'Game Settings',
    subtitle: 'Configure your gameplay experience',
    icon: createIconContainer({ icon: IconType.SETTINGS }),
    showCloseButton: true,
    onClose: () => console.log('Settings closed'),
    variant: 'primary'
  });

  // Compact header
  const compactHeader = createHeader({
    title: 'Player Stats',
    variant: 'compact',
    showCloseButton: false
  });

  return { dialogHeader, customHeader, compactHeader };
}

// Stat display examples
export function statDisplayExamples() {
  const playerStats: Stat[] = [
    { label: 'Health', value: 100, icon: IconType.HEART, valueColor: 'success' },
    { label: 'Damage', value: 50, icon: IconType.DAMAGE, valueColor: 'danger' },
    { label: 'Speed', value: 75, icon: IconType.SPEED },
    { label: 'Level', value: 12, icon: IconType.STAR, valueColor: 'primary' }
  ];

  // Grid layout
  const statGrid = createStatGrid(playerStats);

  // Inline stats
  const inlineStats = createStatDisplay({
    stats: playerStats.slice(0, 2),
    layout: 'inline',
    variant: 'minimal'
  });

  // Large stat display
  const largeStats = createStatDisplay({
    stats: [{ label: 'Score', value: '1,234,567', icon: IconType.TROPHY }],
    variant: 'large'
  });

  return { statGrid, inlineStats, largeStats };
}

// Tab bar examples
export function tabBarExamples() {
  const tabs: Tab[] = [
    {
      id: 'towers',
      label: 'Towers',
      icon: IconType.TOWER,
      content: '<p>Tower management content</p>'
    },
    {
      id: 'upgrades',
      label: 'Upgrades',
      icon: IconType.UPGRADE,
      badge: 3,
      content: '<p>Available upgrades</p>'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: IconType.SETTINGS,
      content: '<p>Game settings</p>'
    }
  ];

  // Default tab bar
  const defaultTabs = createTabBar({
    tabs,
    onChange: (tabId) => console.log(`Switched to ${tabId}`)
  });

  // Pills variant
  const pillTabs = createTabBar({
    tabs: tabs.slice(0, 2),
    variant: 'pills',
    showContent: false
  });

  // Vertical tabs
  const verticalTabs = createTabBar({
    tabs,
    orientation: 'vertical',
    variant: 'underline'
  });

  return { defaultTabs, pillTabs, verticalTabs };
}

// Resource display examples
export function resourceDisplayExamples() {
  // Currency display
  const goldDisplay = createCurrencyDisplay(12500);

  // Custom resource with animation
  const energyDisplay = createResourceDisplay({
    value: 450,
    icon: IconType.POWERUP_DAMAGE,
    label: 'Energy',
    showLabel: true,
    variant: 'large',
    color: 'primary',
    suffix: ' / 500'
  });

  // Compact resources
  const waveDisplay = createResourceDisplay({
    value: 15,
    icon: IconType.WAVE,
    variant: 'compact',
    prefix: 'Wave '
  });

  // Resource badge
  const scoreBadge = createResourceDisplay({
    value: '99+',
    variant: 'badge',
    color: 'danger',
    showIcon: false
  });

  return { goldDisplay, energyDisplay, waveDisplay, scoreBadge };
}

// Icon container examples
export function iconContainerExamples() {
  // Basic icon
  const basicIcon = createIconContainer({
    icon: IconType.HEART,
    size: 'md'
  });

  // Filled icon with color
  const filledIcon = createIconContainer({
    icon: IconType.SHIELD,
    variant: 'filled',
    color: 'primary',
    size: 'lg'
  });

  // Icon with badge
  const notificationIcon = createIconWithBadge(
    IconType.INFO,
    5,
    {
      variant: 'outlined',
      color: 'danger',
      interactive: true,
      onClick: () => console.log('Notifications clicked')
    }
  );

  // Custom sized icon
  const customIcon = createIconContainer({
    icon: IconType.TOWER,
    size: 48,
    shape: 'circle',
    variant: 'filled',
    backgroundColor: '#4a5568'
  });

  return { basicIcon, filledIcon, notificationIcon, customIcon };
}

// Complete UI example combining multiple elements
export function createUpgradeDialog() {
  const dialog = createCard({
    variant: 'elevated',
    padding: 'none'
  });

  // Header
  const header = createDialogHeader(
    'Tower Upgrades',
    () => console.log('Close dialog')
  );

  // Tab content
  const upgradeTabs: Tab[] = [
    {
      id: 'damage',
      label: 'Damage',
      icon: IconType.DAMAGE,
      content: () => {
        const stats: Stat[] = [
          { label: 'Current', value: 50, valueColor: 'default' },
          { label: 'After Upgrade', value: 75, valueColor: 'success' },
          { label: 'Cost', value: 100, icon: IconType.COINS }
        ];
        return createStatGrid(stats);
      }
    },
    {
      id: 'range',
      label: 'Range',
      icon: IconType.RANGE,
      content: () => {
        const stats: Stat[] = [
          { label: 'Current', value: 100, valueColor: 'default' },
          { label: 'After Upgrade', value: 150, valueColor: 'success' },
          { label: 'Cost', value: 150, icon: IconType.COINS }
        ];
        return createStatGrid(stats);
      }
    }
  ];

  const tabBar = createTabBar({
    tabs: upgradeTabs,
    variant: 'underline',
    fullWidth: true
  });

  // Footer with resource display and buttons
  const footer = document.createElement('div');
  footer.className = 'flex items-center justify-between p-4 border-t border-surface-border';
  
  const currencyDisplay = createCurrencyDisplay(500);
  const upgradeButton = createButton({
    text: 'Upgrade',
    variant: 'primary',
    icon: IconType.UPGRADE
  });

  footer.appendChild(currencyDisplay);
  footer.appendChild(upgradeButton);

  // Assemble dialog
  dialog.appendChild(header);
  dialog.appendChild(tabBar);
  dialog.appendChild(footer);

  return dialog;
}