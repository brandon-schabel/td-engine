import { styleManager } from './StyleManager';

const componentStyles = `
  /* Tower Card Styles */
  .tower-card {
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all var(--duration-cardHover) var(--easing-smooth);
    position: relative;
    overflow: hidden;
  }

  .tower-card:hover {
    border-color: var(--color-button-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .tower-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .tower-card.disabled:hover {
    border-color: var(--color-border-subtle);
    transform: none;
    box-shadow: none;
  }

  .tower-card-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-sm);
    display: block;
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
  }

  .tower-card-cost {
    font-size: var(--font-sm);
    text-align: center;
    color: var(--color-text-secondary);
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
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .stat-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
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
    font-size: clamp(14px, 3vw, 18px);
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
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: damage-float 1s ease-out forwards;
  }

  .damage-number.physical {
    color: var(--color-game-damage-physical);
  }

  .damage-number.magical {
    color: var(--color-game-damage-magical);
  }

  .damage-number.critical {
    color: var(--color-game-damage-critical);
    font-size: var(--font-lg);
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
  .upgrade-tree {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
  }

  .upgrade-node {
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    text-align: center;
    cursor: pointer;
    transition: all var(--duration-cardHover) var(--easing-smooth);
    position: relative;
  }

  .upgrade-node:hover:not(.locked) {
    border-color: var(--color-button-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .upgrade-node.unlocked {
    border-color: var(--color-status-success);
    background-color: rgba(52, 211, 153, 0.1);
  }

  .upgrade-node.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upgrade-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-sm);
    opacity: 0.8;
  }

  .upgrade-node.unlocked .upgrade-icon {
    opacity: 1;
  }

  .upgrade-name {
    font-size: var(--font-base);
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
  }

  .upgrade-description {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .upgrade-cost {
    font-size: var(--font-sm);
    color: var(--color-text-warning);
    font-weight: 600;
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
  .settings-section {
    margin-bottom: var(--spacing-xl);
  }

  .settings-section-title {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border-subtle);
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
    background: var(--color-border-subtle);
    margin: var(--spacing-lg) 0;
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
  }

  @media (max-width: 768px) {
    .settings-content {
      padding-right: 0;
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
    backdrop-filter: blur(10px);
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
`;

export function initializeComponentStyles(): void {
  styleManager.addStyles('game-components', componentStyles);
}