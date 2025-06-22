import { styleManager } from './StyleManager';

const componentStyles = `
  /* Tower Card Styles - Tower type specific colors */
  .tower-card-icon[data-tower-type="basic"] {
    color: var(--color-game-tower-basic);
  }

  .tower-card-icon[data-tower-type="sniper"] {
    color: var(--color-game-tower-frost);
  }

  .tower-card-icon[data-tower-type="rapid"] {
    color: var(--color-game-tower-artillery);
  }

  .tower-card-icon[data-tower-type="wall"] {
    color: var(--color-game-tower-wall);
  }

  .tower-card:hover .tower-card-name {
    color: var(--color-primary);
  }

  .tower-card:hover .tower-card-cost {
    background: rgba(0, 0, 0, var(--opacity-50));
    transform: scale(1.05);
  }

  /* Floating Health Bar Styles */
  .floating-healthbar .healthbar-container,
  .entity-healthbar .healthbar-container {
    box-shadow: var(--shadow-sm);
  }

  /* Inventory Grid responsive columns */
  .inventory-grid[data-columns="4"] {
    grid-template-columns: repeat(4, 1fr);
  }

  .inventory-grid[data-columns="6"] {
    grid-template-columns: repeat(6, 1fr);
  }

  /* Inventory Tabs scrollbar */
  .inventory-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .inventory-tab.active {
    background: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
  }

  /* Inventory Slot hover and states */
  .inventory-slot:hover {
    border-color: #FFD700;
    background-color: var(--color-surface-hover);
    transform: scale(1.05);
  }

  .inventory-slot.selected {
    border-color: var(--color-button-primary);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
  }

  /* Rarity colors for inventory */
  .rarity-common .inventory-item-icon { background: #CCCCCC; }
  .rarity-rare .inventory-item-icon { background: #4169E1; }
  .rarity-epic .inventory-item-icon { background: #9370DB; }
  .rarity-legendary .inventory-item-icon { background: #FFD700; }

  /* Player Stats - data attribute specific colors */
  .stat-item[data-stat="health"] .stat-value {
    color: var(--color-status-success);
  }

  .stat-item[data-stat="shield"] .stat-value {
    color: #00BCD4;
  }

  .stat-item[data-stat="speed"] .stat-value {
    color: var(--color-status-warning);
  }

  /* Build Menu specific gradient title */
  .build-menu-ui .ui-dialog-title {
    background: linear-gradient(90deg, var(--color-button-primary) 0%, #5a7fdb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Resource item variants */
  .resource-item.currency {
    border-color: var(--color-button-primary);
    color: var(--color-button-primary);
  }

  .resource-item.wave-info {
    border-color: #00BCD4;
    color: #00BCD4;
  }

  /* Health state variants */
  .resource-item.critical {
    border-color: #ff0000;
    color: #ff0000;
  }

  .resource-item.low {
    border-color: #F44336;
    color: #F44336;
  }

  .resource-item.medium {
    border-color: #FF9800;
    color: #FF9800;
  }

  /* Tower type specific icon colors for upgrade UI */
  .tower-upgrade-icon[data-tower-type="basic"] {
    border-color: var(--color-game-tower-basic);
    color: var(--color-game-tower-basic);
  }

  .tower-upgrade-icon[data-tower-type="sniper"] {
    border-color: var(--color-game-tower-frost);
    color: var(--color-game-tower-frost);
  }

  .tower-upgrade-icon[data-tower-type="rapid"] {
    border-color: var(--color-game-tower-artillery);
    color: var(--color-game-tower-artillery);
  }

  .tower-upgrade-icon[data-tower-type="wall"] {
    border-color: var(--color-game-tower-wall);
    color: var(--color-game-tower-wall);
  }

  /* Mobile joystick active state */
  .mobile-joystick.active {
    opacity: 0.8;
  }

  /* Aim joystick variant */
  .aim-joystick {
    background: rgba(220, 53, 69, 0.2) !important;
    border-color: rgba(220, 53, 69, 0.5) !important;
  }

  .aim-joystick-knob {
    background: rgba(220, 53, 69, 0.5) !important;
  }

  /* Icon button hover states */
  .icon-button:hover {
    background: rgba(0, 188, 212, 0.2);
    transform: scale(1.1);
  }

  .icon-button.disabled:hover {
    background: none;
    transform: none;
  }

  /* Power-up item state variants */
  .powerup-item.warning {
    border-color: #FF9800;
  }

  .powerup-item.critical {
    border-color: #F44336;
  }

  /* Mobile controls visibility states */
  .mobile-controls.visible {
    display: block !important;
    visibility: visible !important;
  }

  .mobile-controls.hidden {
    display: none !important;
    visibility: hidden !important;
  }

  /* Health bar dynamic styles using CSS variables */
  .health-fill {
    background: var(--fill-color, #4CAF50);
    width: var(--fill-percentage, 0%);
  }

  .health-text {
    font-size: var(--text-size, 10px);
  }
`;

export function initializeComponentStyles(): void {
  styleManager.addStyles('game-components', componentStyles);
}