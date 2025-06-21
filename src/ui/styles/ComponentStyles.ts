import { styleManager } from './StyleManager';

const componentStyles = `
  /* Tower Card Styles */
  .tower-card {
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.95) 0%, rgba(40, 44, 48, 0.95) 100%);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all var(--duration-cardHover) var(--easing-smooth);
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .tower-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 70%
    );
    transform: rotate(45deg) translateX(-100%);
    transition: transform 0.6s ease;
  }

  .tower-card:hover::before {
    transform: rotate(45deg) translateX(100%);
  }

  .tower-card:hover {
    border-color: var(--color-button-primary);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, rgba(40, 44, 48, 0.98) 0%, rgba(48, 52, 56, 0.98) 100%);
  }

  .tower-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  .tower-card.disabled:hover {
    border-color: var(--color-border-subtle);
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.95) 0%, rgba(40, 44, 48, 0.95) 100%);
  }

  .tower-card.disabled::before {
    display: none;
  }

  .tower-card-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-sm);
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: transform var(--duration-cardHover) var(--easing-smooth);
  }

  .tower-card:hover .tower-card-icon {
    transform: scale(1.1) rotate(5deg);
  }

  /* Tower type specific colors */
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

  .tower-card-name {
    font-size: var(--font-base);
    font-weight: 600;
    text-align: center;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    transition: color var(--duration-cardHover) var(--easing-smooth);
  }

  .tower-card:hover .tower-card-name {
    color: var(--color-button-primary);
  }

  .tower-card-cost {
    font-size: var(--font-sm);
    text-align: center;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-sm);
    margin: 0 auto;
    width: fit-content;
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .tower-card:hover .tower-card-cost {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.05);
  }

  .tower-card-stats {
    margin-top: var(--spacing-sm);
    font-size: var(--font-xs);
    color: var(--color-text-secondary);
  }

  /* Health Bar Styles */
  .health-bar-container {
    position: absolute;
    width: 100%;
    height: 4px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  /* Floating Health Bar Styles */
  .floating-healthbar,
  .entity-healthbar {
    pointer-events: none;
    z-index: 100;
  }

  .floating-healthbar .healthbar-container,
  .entity-healthbar .healthbar-container {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .health-bar-fill {
    height: 100%;
    background-color: var(--color-game-health-high);
    transition: width var(--duration-healthChange) var(--easing-smooth);
  }

  .health-bar-fill.medium {
    background-color: var(--color-game-health-medium);
  }

  .health-bar-fill.low {
    background-color: var(--color-game-health-low);
  }

  /* Inventory Styles */
  .inventory-dialog {
    padding: var(--spacing-lg);
    background: var(--color-surface-secondary);
    border: 2px solid var(--color-border-default);
    border-radius: 8px;
    width: 600px;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .inventory-title {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-text-primary);
  }
  
  .inventory-close {
    background: var(--color-button-danger) !important;
    color: white !important;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .inventory-close:hover {
    opacity: 0.8;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--spacing-sm);
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  .inventory-grid[data-columns="4"] {
    grid-template-columns: repeat(4, 1fr);
  }

  .inventory-grid[data-columns="6"] {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    .inventory-grid {
      max-height: calc(100vh - 300px);
    }
  }

  .inventory-tabs {
    display: flex;
    background: rgba(40, 40, 40, 0.8);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .inventory-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .inventory-tab {
    flex: 1;
    min-width: clamp(60px, 15vw, 100px);
    padding: 12px 8px;
    background: transparent;
    border: none;
    color: #CCCCCC;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: clamp(10px, 2.5vw, 12px);
  }
  
  .inventory-tab.active {
    background: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
  }
  
  .inventory-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border-default);
  }
  
  .inventory-stats {
    color: #CCCCCC;
    font-size: clamp(12px, 3vw, 14px);
  }
  
  .inventory-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .action-button {
    padding: var(--spacing-sm) var(--spacing-md) !important;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }
  
  .action-button.use-button {
    background: #2196F3 !important;
  }
  
  .action-button.upgrade-button {
    background: #FFC107 !important;
  }

  .inventory-slot {
    width: 60px;
    height: 60px;
    aspect-ratio: 1;
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--duration-buttonHover) var(--easing-smooth);
    position: relative;
  }

  .inventory-slot:hover {
    border-color: #FFD700;
    background-color: var(--color-surface-hover);
    transform: scale(1.05);
  }

  .inventory-slot.selected {
    border-color: var(--color-button-primary);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
  }

  .inventory-slot.drag-over {
    border-color: #4CAF50;
  }

  /* Rarity variants */
  .inventory-slot.rarity-common {
    border-color: #CCCCCC;
  }

  .inventory-slot.rarity-rare {
    border-color: #4169E1;
  }

  .inventory-slot.rarity-epic {
    border-color: #9370DB;
  }

  .inventory-slot.rarity-legendary {
    border-color: #FFD700;
  }

  .inventory-item {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .inventory-count {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 10px;
    font-weight: bold;
    color: #FFD700;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 2px 4px;
    border-radius: 2px;
  }

  .inventory-item-icon {
    width: 32px;
    height: 32px;
    background: var(--color-border-primary);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .rarity-common .inventory-item-icon {
    background: #CCCCCC;
  }

  .rarity-rare .inventory-item-icon {
    background: #4169E1;
  }

  .rarity-epic .inventory-item-icon {
    background: #9370DB;
  }

  .rarity-legendary .inventory-item-icon {
    background: #FFD700;
  }

  /* Player Stats Styles */
  .player-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    background: rgba(255, 255, 255, 0.02);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .stat-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .stat-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .stat-value {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .stat-item[data-stat="health"] .stat-value {
    color: var(--color-status-success);
  }

  .stat-item[data-stat="shield"] .stat-value {
    color: #00BCD4;
  }

  .stat-item[data-stat="speed"] .stat-value {
    color: var(--color-status-warning);
  }

  .stat-bar {
    width: 100%;
    height: 8px;
    background-color: var(--color-surface-secondary);
    border-radius: 4px;
    overflow: hidden;
    margin-top: var(--spacing-xs);
  }

  .stat-bar-fill {
    height: 100%;
    background-color: var(--color-button-primary);
    transition: width var(--duration-statChange) var(--easing-smooth);
  }

  /* Wave Info Styles */
  .wave-info {
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    text-align: center;
  }

  .wave-number {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .wave-timer {
    font-size: var(--font-base);
    color: var(--color-text-secondary);
  }

  .wave-enemies {
    margin-top: var(--spacing-md);
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
  }

  .enemy-preview {
    width: 32px;
    height: 32px;
    background-color: var(--color-surface-primary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-xs);
    color: var(--color-text-secondary);
  }

  /* Game HUD Styles */
  .game-hud {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
    pointer-events: none;
    z-index: var(--z-hud);
  }

  .game-hud > * {
    pointer-events: auto;
  }

  .hud-resources {
    display: flex;
    gap: var(--spacing-lg);
    justify-content: center;
    flex-wrap: wrap;
  }

  .resource-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: rgba(0, 0, 0, 0.6);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    backdrop-filter: blur(10px);
    border: 2px solid var(--color-border-primary);
    font-weight: bold;
    font-size: 16px;
    width: fit-content;
    min-width: 120px;
    max-width: 200px;
  }

  .resource-icon {
    width: 24px;
    height: 24px;
    font-size: 20px;
  }

  .resource-value {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  /* Build Menu Specific Styles */
  .build-menu-ui .ui-card {
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.98) 0%, rgba(40, 44, 48, 0.98) 100%);
    border: 2px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.3s ease-out;
    min-width: 320px;
    max-width: 400px;
  }
  
  /* Ensure build menu appears above control bar */
  .floating-popup.build-menu-ui {
    bottom: auto !important;
    transform-origin: bottom center;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .build-menu-ui .ui-dialog-title {
    background: linear-gradient(90deg, var(--color-button-primary) 0%, #5a7fdb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    font-size: var(--font-xl);
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .build-menu-ui .resource-item {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    margin: var(--spacing-md) auto;
    width: fit-content;
    min-width: 200px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .build-menu-ui .resource-value {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--color-text-success);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

  /* Health states */
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

  /* Floating Damage Numbers */
  .damage-number {
    position: absolute;
    font-size: var(--font-base);
    font-weight: 700;
    pointer-events: none;
    z-index: var(--z-floatingText);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
    animation: damage-float 1s ease-out forwards;
  }

  /* Damage tiers based on value */
  .damage-number.damage-tier-1 {
    color: #FFFFFF; /* White for 1-10 damage */
  }

  .damage-number.damage-tier-2 {
    color: #7FFF00; /* Chartreuse (green-yellow) for 10-30 damage */
  }

  .damage-number.damage-tier-3 {
    color: #FFA500; /* Orange for 30-50 damage */
  }

  .damage-number.damage-tier-4 {
    color: #FF0000; /* Red for 50-90 damage */
  }

  .damage-number.damage-tier-5 {
    color: #FF69B4; /* Hot pink for 90-150 damage */
    font-size: calc(var(--font-base) * 1.1);
  }

  .damage-number.damage-tier-6 {
    color: #0080FF; /* Blue for 150-250 damage */
    font-size: calc(var(--font-base) * 1.15);
    filter: drop-shadow(0 0 3px #0080FF);
  }

  .damage-number.damage-tier-7 {
    color: #9400D3; /* Purple for 250+ damage */
    font-size: calc(var(--font-base) * 1.2);
    filter: drop-shadow(0 0 4px #9400D3);
    animation: damage-float-epic 1s ease-out forwards;
  }

  /* Special case for healing */
  .damage-number.heal {
    color: #00FF00 !important; /* Bright green for healing */
  }

  /* Critical hits get larger size and special animation */
  .damage-number.critical {
    font-size: calc(var(--font-lg) * 1.1);
    animation: damage-float-critical 1s ease-out forwards;
  }

  @keyframes damage-float {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 1;
    }
    100% {
      transform: translateY(-40px) scale(1);
      opacity: 0;
    }
  }

  @keyframes damage-float-critical {
    0% {
      transform: translateY(0) scale(0.8) rotate(-5deg);
      opacity: 1;
    }
    20% {
      transform: translateY(-10px) scale(1.3) rotate(5deg);
    }
    100% {
      transform: translateY(-50px) scale(1.1) rotate(0deg);
      opacity: 0;
    }
  }

  @keyframes damage-float-epic {
    0% {
      transform: translateY(0) scale(0.5);
      opacity: 0.8;
    }
    15% {
      transform: translateY(-15px) scale(1.4);
      opacity: 1;
    }
    30% {
      transform: translateY(-25px) scale(1.2);
    }
    100% {
      transform: translateY(-60px) scale(1);
      opacity: 0;
    }
  }

  /* Tooltip Styles */
  .game-tooltip {
    background-color: var(--color-surface-tooltip);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-sm);
    padding: var(--spacing-sm);
    max-width: 250px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .tooltip-title {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .tooltip-description {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .tooltip-stats {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border-subtle);
    font-size: var(--font-xs);
  }

  .tooltip-stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .tooltip-stat-label {
    color: var(--color-text-secondary);
  }

  .tooltip-stat-value {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  /* Upgrade UI Styles */
  .player-upgrade-ui {
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.98) 0%, rgba(40, 44, 48, 0.98) 100%);
  }

  .player-upgrade-ui .ui-dialog-title {
    background: linear-gradient(90deg, var(--color-status-success) 0%, #45a049 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .upgrade-tree {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    position: relative;
  }

  .upgrade-tree::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(circle at 50% 50%, rgba(76, 175, 80, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .upgrade-node {
    background: linear-gradient(135deg, rgba(40, 44, 48, 0.9) 0%, rgba(48, 52, 56, 0.9) 100%);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    text-align: center;
    cursor: pointer;
    transition: all var(--duration-cardHover) var(--easing-smooth);
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .upgrade-node::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity var(--duration-cardHover) var(--easing-smooth);
  }

  .upgrade-node:hover:not(.locked)::before {
    opacity: 1;
  }

  .upgrade-node:hover:not(.locked) {
    border-color: var(--color-button-primary);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .upgrade-node.unlocked {
    border-color: var(--color-status-success);
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%);
    box-shadow: 0 0 20px rgba(52, 211, 153, 0.3);
  }

  .upgrade-node.unlocked::after {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: var(--color-status-success);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .upgrade-node.locked {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(0.7);
  }

  .upgrade-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-sm);
    opacity: 0.8;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .upgrade-node:hover:not(.locked) .upgrade-icon {
    transform: scale(1.1) rotate(5deg);
    opacity: 1;
  }

  .upgrade-node.unlocked .upgrade-icon {
    opacity: 1;
    filter: drop-shadow(0 0 8px var(--color-status-success));
  }

  .upgrade-name {
    font-size: var(--font-base);
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    transition: color var(--duration-cardHover) var(--easing-smooth);
  }

  .upgrade-node:hover:not(.locked) .upgrade-name {
    color: var(--color-button-primary);
  }

  .upgrade-description {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
    line-height: 1.4;
  }

  .upgrade-cost {
    font-size: var(--font-sm);
    color: var(--color-text-warning);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 152, 0, 0.1);
    border: 1px solid rgba(255, 152, 0, 0.3);
    border-radius: var(--radius-sm);
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .upgrade-node:hover:not(.locked) .upgrade-cost {
    background: rgba(255, 152, 0, 0.2);
    border-color: rgba(255, 152, 0, 0.5);
    transform: scale(1.05);
  }

  /* Progress indicator for upgrade levels */
  .upgrade-level-indicator {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-top: var(--spacing-sm);
  }

  .upgrade-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .upgrade-level-dot.filled {
    background: var(--color-status-success);
    box-shadow: 0 0 4px var(--color-status-success);
  }

  /* Menu and Settings Styles */
  .game-menu {
    background-color: var(--color-surface-primary);
    border: 2px solid var(--color-border-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    min-width: 300px;
  }

  .menu-title {
    font-size: var(--font-xl);
    font-weight: 700;
    text-align: center;
    margin-bottom: var(--spacing-lg);
    color: var(--color-text-primary);
  }

  .menu-section {
    margin-bottom: var(--spacing-lg);
  }

  .menu-section:last-child {
    margin-bottom: 0;
  }

  .menu-section-title {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
  }

  .setting-label {
    font-size: var(--font-base);
    color: var(--color-text-primary);
  }

  /* Game Over Screen */
  .game-over-screen {
    background-color: rgba(0, 0, 0, 0.9);
    color: var(--color-text-primary);
    text-align: center;
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
  }

  .game-over-title {
    font-size: var(--font-xxl);
    font-weight: 700;
    margin-bottom: var(--spacing-md);
    color: var(--color-status-error);
  }

  .game-over-stats {
    margin: var(--spacing-lg) 0;
    font-size: var(--font-lg);
  }

  .game-over-stat {
    margin-bottom: var(--spacing-sm);
  }

  .game-over-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    margin-top: var(--spacing-lg);
  }

  /* Mobile Controls */
  .mobile-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: var(--z-controls);
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-controls {
      display: block;
    }
  }

  .mobile-joystick {
    position: absolute;
    width: 120px;
    height: 120px;
    background: var(--color-controls-joystick-base);
    border: 3px solid var(--color-controls-joystick-baseBorder);
    border-radius: 50%;
    opacity: 0.6;
    pointer-events: auto;
    transition: opacity var(--duration-fast) var(--easing-smooth);
  }

  .mobile-joystick.active {
    opacity: 0.8;
  }

  .mobile-joystick-knob {
    position: absolute;
    width: 50px;
    height: 50px;
    background: var(--color-controls-joystick-knob);
    border: 2px solid var(--color-controls-joystick-knobBorder);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: none;
    pointer-events: none;
  }

  .aim-joystick {
    background: rgba(220, 53, 69, 0.2) !important;
    border-color: rgba(220, 53, 69, 0.5) !important;
  }

  .aim-joystick-knob {
    background: rgba(220, 53, 69, 0.5) !important;
  }

  .mobile-joystick-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.7;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.9);
  }

  /* Touch Indicators */
  .touch-indicator {
    position: fixed;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
    border: 2px solid rgba(255, 255, 255, 0.6);
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: touchPulse 0.5s ease-out;
    z-index: 10000;
  }

  @keyframes touchPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0;
    }
  }

  .touch-ripple {
    position: fixed;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: rippleEffect 0.6s ease-out forwards;
    z-index: 10000;
  }

  @keyframes rippleEffect {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
    }
  }

  /* Simple Game UI Build Menu */
  .build-menu-simple {
    width: 100%;
  }

  .build-menu-simple-title {
    margin: 0 0 var(--spacing-lg) 0;
    color: var(--color-text-primary);
    text-align: center;
    font-size: var(--font-xl);
  }

  .build-menu-simple-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .build-menu-simple-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-sm);
  }

  /* Settings Dialog Sections */
  .settings-dialog {
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.98) 0%, rgba(40, 44, 48, 0.98) 100%);
  }

  .settings-section {
    margin-bottom: var(--spacing-xl);
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .settings-section:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .settings-section-title {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .settings-section-title svg {
    width: 24px;
    height: 24px;
    color: var(--color-button-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    min-height: 48px;
  }

  .settings-label {
    flex: 1;
    color: var(--color-text-primary);
    font-size: var(--font-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .settings-control {
    flex: 0 0 auto;
  }

  .settings-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--color-border-subtle) 20%, var(--color-border-subtle) 80%, transparent 100%);
    margin: var(--spacing-lg) 0;
  }

  /* Custom Toggle Switch for Settings */
  .settings-row .ui-toggle-switch {
    width: 56px;
    height: 28px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    position: relative;
    transition: all var(--duration-toggle) var(--easing-smooth);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .settings-row .ui-toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
    border-radius: 50%;
    transition: all var(--duration-toggle) var(--easing-smooth);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .settings-row .ui-toggle.checked .ui-toggle-switch {
    background: linear-gradient(135deg, var(--color-status-success) 0%, #45a049 100%);
    border-color: var(--color-status-success);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .settings-row .ui-toggle.checked .ui-toggle-switch::after {
    transform: translateX(28px);
  }

  /* Custom Slider for Settings */
  .settings-row .ui-slider-track {
    height: 8px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-row .ui-slider-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-button-primary) 0%, #5a7fdb 100%);
    border-radius: 4px;
    transition: width var(--duration-sliderChange) var(--easing-smooth);
    box-shadow: 0 0 8px rgba(74, 144, 226, 0.5);
  }

  .settings-row .ui-slider-thumb {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
    border: 3px solid var(--color-button-primary);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    transition: all var(--duration-buttonHover) var(--easing-smooth);
  }

  .settings-row .ui-slider-thumb:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .settings-row .ui-slider-thumb:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Difficulty Badge */
  .difficulty-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-buttonHover) var(--easing-smooth);
  }

  .difficulty-badge:hover {
    background: var(--color-surface-hover);
    transform: translateY(-1px);
  }

  .difficulty-badge.easy {
    border-color: var(--color-status-success);
    color: var(--color-status-success);
  }

  .difficulty-badge.normal {
    border-color: var(--color-status-warning);
    color: var(--color-status-warning);
  }

  .difficulty-badge.hard {
    border-color: var(--color-status-error);
    color: var(--color-status-error);
  }

  /* Settings Dialog Styles */
  .settings-content {
    padding-right: 8px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .settings-content::-webkit-scrollbar {
    width: 8px;
  }

  .settings-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .settings-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .settings-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    .settings-content {
      padding-right: 0;
      max-height: 50vh;
    }
  }

  .settings-mobile-title {
    text-align: center;
    color: var(--color-text-success);
    font-size: clamp(24px, 6vw, 32px);
    margin: 0 0 20px 0;
    font-weight: bold;
  }

  .settings-preset-container {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .difficulty-preset-button {
    flex: 1;
    min-width: clamp(80px, 20vw, 120px);
    padding: 12px;
    border: 2px solid #444;
    background: #333;
    color: white;
    border-radius: 6px;
    font-size: clamp(12px, 2.5vw, 14px);
    transition: all 0.2s;
    min-height: 44px;
  }

  .difficulty-preset-button.active {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
  }

  .settings-description {
    font-size: clamp(11px, 2.5vw, 12px);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .settings-select {
    min-width: clamp(100px, 25vw, 150px);
    font-size: clamp(12px, 3vw, 14px);
  }

  /* Game Over UI Styles */
  .game-over-dialog {
    min-width: 500px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .game-over-dialog {
      min-width: 320px;
    }
  }

  .game-over-dialog .dialog-title {
    font-size: var(--font-xxl);
    color: var(--color-status-error);
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 768px) {
    .game-over-dialog .dialog-title {
      font-size: 28px;
    }
  }

  .game-over-content {
    padding: var(--spacing-lg) 0;
  }

  .game-over-stats {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
  }

  .game-over-score {
    margin-bottom: var(--spacing-lg);
    animation: pulse 2s ease-in-out infinite;
  }

  .game-over-score-label {
    font-size: var(--font-lg);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: var(--spacing-sm);
  }

  .game-over-score-value {
    font-size: 48px;
    font-weight: bold;
    color: var(--color-text-success);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    display: block;
  }

  @media (max-width: 768px) {
    .game-over-score-label {
      font-size: var(--font-base);
    }
    .game-over-score-value {
      font-size: 32px;
    }
  }

  .game-over-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
  }

  .game-over-stat {
    background: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-md);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .game-over-stat-icon {
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .game-over-stat-value {
    font-size: var(--font-xl);
    font-weight: bold;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .game-over-stat-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  @media (max-width: 768px) {
    .game-over-stat-value {
      font-size: 20px;
    }
    .game-over-stat-label {
      font-size: var(--font-xs);
    }
  }

  .game-over-buttons {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .game-over-button-restart,
  .game-over-button-menu {
    text-transform: uppercase;
    letter-spacing: 1px;
    min-width: 180px;
  }

  @media (max-width: 768px) {
    .game-over-button-restart,
    .game-over-button-menu {
      min-width: 140px;
    }
  }

  .game-over-button-restart {
    background-color: var(--color-status-success);
    border-color: var(--color-status-success);
  }

  .game-over-button-restart:hover {
    filter: brightness(1.1);
  }

  .game-over-message {
    font-size: var(--font-base);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-lg);
    font-style: italic;
  }

  @media (max-width: 768px) {
    .game-over-message {
      font-size: var(--font-sm);
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* Tower Upgrade UI Styles */
  .tower-upgrade-panel {
    background: rgba(33, 37, 41, 0.95);
    border: 2px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .tower-upgrade-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .tower-upgrade-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-secondary);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-primary);
  }

  /* Tower type specific icon colors */
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

  .tower-upgrade-title {
    flex: 1;
  }

  .tower-upgrade-name {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .tower-upgrade-level {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  .tower-upgrade-sell-value {
    font-size: var(--font-sm);
    color: var(--color-status-warning);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tower-upgrade-currency {
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .tower-upgrade-currency-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .tower-upgrade-currency .currency-value {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-success);
  }

  .tower-upgrade-currency .currency-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  .tower-upgrade-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
  }

  .tower-stat-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .tower-stat-icon {
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
  }

  .tower-stat-label {
    flex: 1;
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  .tower-stat-value {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .tower-bulk-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm);
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
  }

  .bulk-selector-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    margin-right: var(--spacing-xs);
  }

  .bulk-selector-button {
    padding: var(--spacing-xs) var(--spacing-sm) !important;
    font-size: var(--font-sm) !important;
    min-width: 50px;
  }

  .bulk-selector-button.active {
    background-color: var(--color-button-primary) !important;
    border-color: var(--color-button-primary) !important;
  }

  .tower-upgrade-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .tower-upgrade-card {
    background: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all var(--duration-cardHover) var(--easing-smooth);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .tower-upgrade-card.can-afford:hover {
    border-color: var(--color-button-primary);
    background: var(--color-surface-hover);
    transform: translateX(4px);
  }

  .tower-upgrade-card.maxed {
    opacity: 0.6;
    cursor: default;
  }

  .tower-upgrade-card.maxed:hover {
    transform: none;
    border-color: var(--color-border-subtle);
    background: var(--color-surface-secondary);
  }

  .upgrade-card-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
  }

  .upgrade-card-info {
    flex: 1;
  }

  .upgrade-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .upgrade-card-name {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .upgrade-card-name.maxed {
    color: var(--color-text-secondary);
  }

  .upgrade-card-level {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  .upgrade-card-description {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }

  .upgrade-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .upgrade-card-effect {
    font-size: var(--font-xs);
    color: var(--color-status-success);
  }

  .upgrade-card-cost {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .upgrade-card-cost.affordable {
    color: var(--color-text-success);
  }

  .tower-upgrade-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
  }

  .tower-sell-button {
    background-color: var(--color-button-danger) !important;
    border-color: var(--color-button-danger) !important;
    color: white !important;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .tower-sell-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tower-sell-button:hover:not(.disabled) {
    filter: brightness(1.1);
  }

  /* Compact Tower Upgrade UI Styles */
  .tower-upgrade-ui.compact {
    min-width: 280px;
    max-width: 320px;
  }

  .tower-upgrade-panel.compact {
    padding: var(--spacing-md);
    background: rgba(33, 37, 41, 0.98);
  }

  .tower-upgrade-header.compact {
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .tower-upgrade-header.compact .close-button {
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.5);
    color: #F44336;
    padding: 4px;
    border-radius: var(--radius-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--duration-fast) var(--easing-smooth);
    flex-shrink: 0;
  }

  .tower-upgrade-header.compact .close-button:hover {
    background: rgba(244, 67, 54, 0.3);
    border-color: #F44336;
    transform: scale(1.1);
  }

  .tower-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .tower-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-sm);
    border: 2px solid var(--color-border-subtle);
    transition: all var(--duration-fast) var(--easing-smooth);
  }

  .tower-icon[data-tower-type="basic"] {
    border-color: var(--color-game-tower-basic);
    color: var(--color-game-tower-basic);
  }

  .tower-icon[data-tower-type="sniper"] {
    border-color: var(--color-game-tower-frost);
    color: var(--color-game-tower-frost);
  }

  .tower-icon[data-tower-type="rapid"] {
    border-color: var(--color-game-tower-artillery);
    color: var(--color-game-tower-artillery);
  }

  .tower-icon[data-tower-type="wall"] {
    border-color: var(--color-game-tower-wall);
    color: var(--color-game-tower-wall);
  }

  .tower-details {
    flex: 1;
    min-width: 0;
  }

  .tower-name {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tower-stats {
    font-size: var(--font-xs);
    color: var(--color-text-secondary);
    margin-top: 2px;
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .tower-stats > span {
    white-space: nowrap;
  }

  .tower-currency {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-success);
    font-size: var(--font-sm);
    font-weight: 600;
    padding: 4px 8px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }

  .tower-upgrade-cards.compact {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }

  .tower-upgrade-card.compact {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--easing-smooth);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    position: relative;
    overflow: hidden;
  }

  .tower-upgrade-card.compact::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05));
    transform: translateX(-100%);
    transition: transform var(--duration-cardHover) var(--easing-smooth);
  }

  .tower-upgrade-card.compact.can-afford:hover {
    border-color: var(--color-button-primary);
    background: rgba(74, 144, 226, 0.1);
    transform: translateX(2px);
  }

  .tower-upgrade-card.compact.can-afford:hover::before {
    transform: translateX(0);
  }

  .tower-upgrade-card.compact.maxed {
    opacity: 0.5;
    cursor: default;
  }

  .tower-upgrade-card.compact.maxed:hover {
    transform: none;
    border-color: var(--color-border-subtle);
    background: rgba(0, 0, 0, 0.3);
  }

  .upgrade-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-xs);
    flex-shrink: 0;
  }

  .tower-upgrade-card.compact.can-afford .upgrade-icon {
    color: var(--color-text-primary);
  }

  .upgrade-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .upgrade-name {
    font-size: var(--font-sm);
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tower-upgrade-card.compact.maxed .upgrade-name {
    color: var(--color-text-secondary);
  }

  .upgrade-cost {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .upgrade-cost.affordable {
    color: var(--color-text-success);
    font-weight: 600;
  }

  .upgrade-maxed {
    font-size: var(--font-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .tower-upgrade-actions.compact {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .tower-upgrade-actions.compact .tower-sell-button {
    flex: 1;
    max-width: 200px;
    justify-content: center;
  }

  /* Icon Button Styles */
  .icon-button {
    background: none;
    border: none;
    color: var(--color-controls-joystick-knobBorder);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 4px;
    border-radius: 4px;
  }

  .icon-button:hover {
    background: rgba(0, 188, 212, 0.2);
    transform: scale(1.1);
  }

  .icon-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button.disabled:hover {
    background: none;
    transform: none;
  }

  /* Custom color support via data attributes */
  .icon-button[data-base-color] {
    color: var(--custom-color, #00BCD4);
  }

  /* Power-Up Display Styles */
  .powerup-display-container {
    position: fixed;
    top: 80px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    pointer-events: none;
    z-index: 800;
  }

  .powerup-item {
    position: fixed;
    right: 20px;
    background: rgba(33, 37, 41, 0.9);
    border: 2px solid #4CAF50;
    border-radius: 8px;
    padding: 8px 12px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
    pointer-events: none;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .powerup-item.warning {
    border-color: #FF9800;
  }

  .powerup-item.critical {
    border-color: #F44336;
  }

  .powerup-item-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .powerup-item-name {
    flex: 1;
  }

  .powerup-item-timer {
    color: #FFD700;
    margin-left: auto;
    font-weight: bold;
  }

  .powerup-item.warning .powerup-item-content {
    color: #FF9800;
  }

  .powerup-item.critical .powerup-item-content {
    color: #F44336;
  }

  /* Power-Up Notifications */
  .powerup-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #4CAF50, #45a049);
    border: 3px solid #fff;
    border-radius: 12px;
    padding: 16px 20px;
    color: white;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
    animation: powerupNotification 2s ease-out forwards;
    z-index: 1500;
    pointer-events: none;
  }

  @keyframes powerupNotification {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    40% {
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -70%) scale(0.8);
    }
  }

  .powerup-notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .powerup-notification-info {
    display: flex;
    flex-direction: column;
  }

  .powerup-notification-name {
    font-size: 18px;
  }

  .powerup-notification-duration {
    font-size: 14px;
    opacity: 0.9;
  }

  /* Item Pickup Notification */
  .item-pickup-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #76C7C0, #4CAF50);
    border: 2px solid #fff;
    border-radius: 8px;
    padding: 12px 16px;
    color: white;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
    animation: slideDownAndUp 3s ease-out forwards;
    z-index: 1500;
    pointer-events: none;
  }

  /* Inventory Full Notification */
  .inventory-full-notification {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #FF9800, #F57C00);
    border: 2px solid #fff;
    border-radius: 8px;
    padding: 12px 16px;
    color: white;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
    animation: slideDownAndUp 4s ease-out forwards;
    z-index: 1500;
    pointer-events: none;
  }

  @keyframes slideDownAndUp {
    0% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    15%, 85% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }

  /* Item Tooltip Styles */
  .item-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid #FFD700;
    border-radius: 8px;
    padding: 12px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: white;
    z-index: 10000;
    pointer-events: none;
    display: none;
    min-width: 200px;
    max-width: 300px;
  }

  .item-tooltip.visible {
    display: block;
  }

  .item-tooltip-name {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .item-tooltip-type {
    font-size: 10px;
    margin-bottom: 8px;
  }

  /* Rarity colors */
  .item-tooltip-name[data-rarity="common"],
  .item-tooltip-type[data-rarity="common"] {
    color: #CCCCCC;
  }

  .item-tooltip-name[data-rarity="rare"],
  .item-tooltip-type[data-rarity="rare"] {
    color: #4169E1;
  }

  .item-tooltip-name[data-rarity="epic"],
  .item-tooltip-type[data-rarity="epic"] {
    color: #9370DB;
  }

  .item-tooltip-name[data-rarity="legendary"],
  .item-tooltip-type[data-rarity="legendary"] {
    color: #FFD700;
  }

  .item-tooltip-description {
    margin-bottom: 8px;
  }

  .item-tooltip-quantity {
    color: #FFD700;
  }

  .item-tooltip-action {
    color: #87CEEB;
    margin-top: 8px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .tower-card {
      padding: var(--spacing-sm);
    }

    .tower-card-icon {
      width: 36px;
      height: 36px;
    }

    .upgrade-tree {
      grid-template-columns: 1fr;
    }

    .game-hud {
      padding: var(--spacing-sm);
    }

    .hud-resources {
      gap: var(--spacing-sm);
    }

    .resource-item {
      padding: var(--spacing-xs) var(--spacing-sm);
    }

    .settings-row {
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .settings-label {
      flex: 1 1 100%;
    }

    .settings-control {
      flex: 1 1 100%;
    }
  }

  /* Floating UI Styles */
  .floating-ui-container {
    pointer-events: none;
  }

  .floating-ui-element {
    pointer-events: auto;
  }

  /* Ensure specific floating UI types also receive pointer events */
  .floating-healthbar,
  .floating-tooltip,
  .floating-popup,
  .floating-dialog,
  .floating-custom {
    pointer-events: auto;
  }

  /* Ensure all content inside floating UI elements can receive events */
  .floating-ui-element > * {
    pointer-events: auto;
  }

  /* Specific UI components inside floating elements */
  .build-menu-ui,
  .tower-upgrade-ui,
  .inventory-ui,
  .player-upgrade-ui,
  .settings-menu {
    pointer-events: auto;
  }

  /* Ensure buttons and interactive elements are always clickable */
  .floating-ui-element button,
  .floating-ui-element .tower-card,
  .floating-ui-element .ui-button,
  .floating-ui-element input,
  .floating-ui-element select,
  .floating-ui-element textarea {
    pointer-events: auto !important;
    cursor: pointer;
  }

  .floating-ui-element button:disabled,
  .floating-ui-element .tower-card.disabled {
    cursor: not-allowed;
  }

  /* Build Menu UI */
  .build-menu-ui {
    pointer-events: auto;
  }

  /* Tower Upgrade UI */
  .tower-upgrade-ui {
    pointer-events: auto;
  }

  /* Other floating UI components */
  .inventory-dialog,
  .pause-menu-ui,
  .settings-ui,
  .game-over-ui {
    pointer-events: auto;
  }

  /* Camera Controls Styles */
  .camera-controls-container {
    background: linear-gradient(135deg, rgba(33, 37, 41, 0.98) 0%, rgba(40, 44, 48, 0.98) 100%);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    min-width: 140px;
  }

  .camera-controls-container:hover {
    border-color: rgba(var(--color-primary-rgb), 0.5);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  .camera-zoom-display {
    color: var(--color-text-primary);
    font-size: var(--font-sm);
    font-weight: 600;
    text-align: center;
    margin-bottom: var(--spacing-xs);
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .camera-controls-buttons {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: center;
    align-items: center;
  }

  .camera-control-button {
    background: linear-gradient(135deg, rgba(48, 52, 56, 0.9) 0%, rgba(56, 60, 64, 0.9) 100%);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-xs);
    cursor: pointer;
    transition: all var(--duration-buttonHover) var(--easing-smooth);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    position: relative;
    overflow: hidden;
  }

  .camera-control-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(var(--color-primary-rgb), 0.3) 0%, transparent 70%);
    transition: width var(--duration-buttonHover) ease, height var(--duration-buttonHover) ease;
    transform: translate(-50%, -50%);
  }

  .camera-control-button:hover::before {
    width: 100%;
    height: 100%;
  }

  .camera-control-button:hover {
    background: linear-gradient(135deg, rgba(56, 60, 64, 0.95) 0%, rgba(64, 68, 72, 0.95) 100%);
    border-color: var(--color-button-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .camera-control-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .camera-control-button svg {
    width: 20px;
    height: 20px;
    color: var(--color-text-secondary);
    transition: color var(--duration-buttonHover) ease;
    z-index: 1;
    position: relative;
  }

  .camera-control-button:hover svg {
    color: var(--color-text-primary);
  }

  .camera-control-button.zoom-in svg,
  .camera-control-button.zoom-out svg {
    width: 22px;
    height: 22px;
  }

  .camera-control-button[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  .camera-control-button[disabled] svg {
    color: var(--color-text-muted);
  }

  /* Tooltip for camera controls */
  .camera-control-button[title] {
    position: relative;
  }

  .camera-control-button[title]:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 4px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    font-size: var(--font-xs);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    animation: tooltip-fade-in 0.2s ease forwards;
    animation-delay: 0.5s;
    z-index: 1000;
  }

  @keyframes tooltip-fade-in {
    to {
      opacity: 1;
      margin-bottom: 8px;
    }
  }

  .settings-ui,
  .game-over-ui {
    pointer-events: auto;
  }

  /* Settings Dialog Styles */
  .settings-dialog {
    min-width: 500px;
    max-width: 90vw;
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    .settings-dialog {
      min-width: 320px;
    }
  }

  .settings-dialog-content {
    background: var(--color-surface-primary);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-default);
  }

  .settings-title {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0;
  }

  @media (max-width: 768px) {
    .settings-title {
      font-size: 18px;
    }
  }

  .settings-close {
    background: var(--color-button-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    color: var(--color-text-primary);
    cursor: pointer;
    padding: var(--spacing-xs);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .settings-close:hover {
    background: var(--color-button-danger);
    transform: scale(1.1);
  }

  .settings-close svg {
    width: 20px;
    height: 20px;
  }

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
  }

  .settings-content {
    padding: var(--spacing-md) 0;
  }

  .settings-section {
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .settings-section-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  @media (max-width: 768px) {
    .settings-section-title {
      font-size: 16px;
    }
  }

  .settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: var(--spacing-md) 0;
    padding: var(--spacing-sm) 0;
  }

  .settings-label {
    color: var(--color-text-secondary);
    font-size: 16px;
    flex: 1;
  }

  @media (max-width: 768px) {
    .settings-label {
      font-size: 14px;
    }
  }

  .settings-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .slider-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 150px;
  }

  @media (max-width: 768px) {
    .slider-container {
      min-width: 120px;
    }
  }

  .slider {
    flex: 1;
    height: 6px;
    background: var(--color-surface-primary);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--color-button-primary);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: var(--color-button-success);
  }

  .slider-value {
    min-width: 40px;
    text-align: right;
    color: var(--color-text-primary);
    font-weight: bold;
  }

  .toggle-switch {
    position: relative;
    width: 60px;
    height: 30px;
    background: var(--color-surface-primary);
    border-radius: 15px;
    cursor: pointer;
    transition: background 0.3s;
  }

  .toggle-switch.active {
    background: var(--color-button-success);
  }

  .toggle-switch-handle {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }

  .toggle-switch.active .toggle-switch-handle {
    transform: translateX(30px);
  }

  .difficulty-buttons {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .difficulty-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-button-secondary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .difficulty-button {
      font-size: 12px;
    }
  }

  .difficulty-button:hover {
    opacity: 0.8;
  }

  .difficulty-button.active {
    background: var(--color-button-primary);
  }

  .difficulty-button.easy {
    background: #4CAF50;
  }

  .difficulty-button.normal.active {
    background: #2196F3;
  }

  .difficulty-button.hard {
    background: #FF9800;
  }

  .difficulty-button.expert {
    background: #F44336;
  }

  .settings-footer {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xl);
  }

  .settings-button {
    flex: 1;
    padding: var(--spacing-md);
    background: var(--color-button-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .settings-button {
      font-size: 14px;
    }
  }

  .settings-button:hover {
    opacity: 0.8;
  }

  .settings-button.save {
    background: var(--color-button-success);
  }

  .settings-button.reset {
    background: var(--color-button-danger);
  }

  /* Settings Modal Overlay */
  .settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 398;
    backdrop-filter: blur(4px);
  }

  /* Main Menu Styles */
  .main-menu-dialog {
    min-width: 400px;
  }

  @media (max-width: 480px) {
    .main-menu-dialog {
      min-width: 90vw;
    }
  }

  .main-menu-content {
    padding: var(--spacing-xl);
    text-align: center;
  }

  @media (max-width: 480px) {
    .main-menu-content {
      padding: var(--spacing-lg);
    }
  }

  .main-menu-logo {
    margin-bottom: var(--spacing-xl);
  }

  .logo-icon {
    margin-bottom: var(--spacing-md);
    color: var(--color-button-primary);
  }

  .logo-text {
    font-size: var(--font-3xl);
    font-weight: bold;
    margin: 0 0 var(--spacing-xs) 0;
    background: linear-gradient(45deg, var(--color-button-primary), var(--color-button-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-subtitle {
    font-size: var(--font-lg);
    color: var(--color-text-secondary);
  }

  .main-menu-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    max-width: 300px;
    margin: 0 auto;
  }

  .main-menu-buttons .ui-button {
    width: 100%;
    justify-content: center;
  }

  /* Pause Menu Styles */
  .pause-menu-dialog {
    min-width: 400px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .pause-menu-dialog {
      min-width: 280px;
    }
  }

  .pause-menu-dialog .dialog-title {
    font-size: 32px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  @media (max-width: 768px) {
    .pause-menu-dialog .dialog-title {
      font-size: 24px;
    }
  }

  .pause-menu-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg) 0;
  }

  .pause-menu-button {
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--color-button-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  @media (max-width: 768px) {
    .pause-menu-button {
      font-size: 16px;
    }
  }

  .pause-menu-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .pause-menu-button.resume {
    background: var(--color-button-success);
  }

  .pause-menu-button.restart {
    background: var(--color-button-danger);
  }

  .pause-menu-button.settings {
    background: var(--color-button-secondary);
  }

  .pause-info {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  @media (max-width: 768px) {
    .pause-info {
      font-size: 12px;
    }
  }

  .pause-info-item {
    display: flex;
    justify-content: space-between;
    margin: var(--spacing-sm) 0;
  }

  .pause-info-label {
    color: var(--color-text-primary);
  }

  .pause-info-value {
    font-weight: bold;
    color: var(--color-text-success);
  }

  /* Health Bar Helper Styles */
  .health-bar-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .health-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .health-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: white;
    text-shadow: 0 0 2px rgba(0,0,0,0.8);
    pointer-events: none;
  }

  /* Damage Number Animation */
  .damage-number {
    position: absolute;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
    animation: damage-float 1s ease-out forwards;
    z-index: 1000;
  }

  .damage-number.critical {
    font-size: 24px;
    color: #ff0000;
  }

  .damage-number.normal {
    font-size: 18px;
    color: #ffcc00;
  }

  @keyframes damage-float {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateY(-30px) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translateY(-50px) scale(0.8);
      opacity: 0;
    }
  }

  /* Tooltip Helper Styles */
  .tooltip-title {
    font-weight: bold;
    margin-bottom: 4px;
  }

  /* Popup Helper Styles */
  .popup-title {
    margin: 0 0 12px 0;
    font-size: 18px;
  }

  .popup-content {
    margin-bottom: 16px;
  }

  .popup-button-container {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .popup-button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  .popup-button.primary {
    background: #4CAF50;
    color: white;
  }

  .popup-button.secondary {
    background: #ddd;
    color: #333;
  }

  .popup-button.danger {
    background: #f44336;
    color: white;
  }

  .popup-button.default {
    background: #2196F3;
    color: white;
  }

  /* Fallback Item Pickup Notification */
  .item-pickup-notification-fallback {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    pointer-events: none;
    animation: slideDown 0.3s ease-out;
    border: 1px solid #4CAF50;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }

  /* Fallback Inventory Full Notification */
  .inventory-full-notification-fallback {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 193, 7, 0.9);
    color: #000;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    pointer-events: none;
    animation: slideDown 0.3s ease-out;
    border: 1px solid #FFC107;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  /* Slide up animation for notifications */
  .item-pickup-notification-fallback.slide-up,
  .inventory-full-notification-fallback.slide-up {
    animation: slideUp 0.3s ease-in forwards;
  }

  /* Tower placement indicator */
  .ui-placement-indicator {
    display: none;
  }

  .ui-placement-indicator.visible {
    display: block;
  }

  /* Camera controls positioning */
  .camera-controls-positioned {
    position: fixed !important;
    top: 120px !important;
    right: 10px !important;
  }

  /* Mobile controls visibility */
  .mobile-controls {
    display: none;
    visibility: hidden;
  }

  .mobile-controls.visible {
    display: block !important;
    visibility: visible !important;
  }

  .mobile-controls.hidden {
    display: none !important;
    visibility: hidden !important;
  }

  /* Disabled button state */
  .ui-button-control.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Health bar helper styles */
  .health-bar-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    width: var(--bar-width, 60px);
    height: var(--bar-height, 8px);
  }

  .health-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 0.3s ease;
    background: var(--fill-color, #4CAF50);
    width: var(--fill-percentage, 0%);
  }

  .health-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-size: var(--text-size, 10px);
  }

  /* Damage number styles */
  .damage-number {
    position: absolute;
    font-weight: bold;
    pointer-events: none;
    z-index: 1000;
  }

  .damage-number.normal {
    color: #ffcc00;
    font-size: 18px;
    animation: damage-float 1s ease-out forwards;
  }

  .damage-number.critical {
    color: #ff4444;
    font-size: 24px;
    animation: damage-float-critical 1s ease-out forwards;
  }

  /* Tooltip helper styles */
  .tooltip-helper {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .tooltip-title {
    font-weight: bold;
    margin-bottom: 4px;
    color: #ffd700;
  }

  /* Popup helper styles */
  .popup-helper {
    background: var(--color-surface-primary);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .popup-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--color-text-primary);
  }

  .popup-content {
    margin-bottom: 16px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .popup-button-container {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .popup-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .popup-button.default {
    background: var(--color-button-secondary);
    color: var(--color-text-primary);
  }

  .popup-button.primary {
    background: var(--color-button-primary);
    color: white;
  }

  .popup-button.secondary {
    background: var(--color-button-secondary);
    color: var(--color-text-primary);
  }

  .popup-button.danger {
    background: var(--color-button-danger);
    color: white;
  }

  .popup-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

export function initializeComponentStyles(): void {
  styleManager.addStyles('game-components', componentStyles);
}