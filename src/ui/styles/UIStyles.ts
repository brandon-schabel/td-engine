import { styleManager } from './StyleManager';

const baseUIStyles = `
  /* Base resets and defaults */
  .ui-element {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Button Control Style - Specific game control button */

  .ui-button-control {
    width: clamp(40px, 8vw, 48px);
    height: clamp(40px, 8vw, 48px);
    border-radius: 50%;
    background: var(--color-surface-secondary);
    border-color: var(--color-button-primary);
  }

  /* Dialog/Popup styles */
  .ui-dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 10000;
  }

  .ui-dialog-container > * {
    pointer-events: auto;
  }

  .ui-dialog {
    position: relative;
    background-color: var(--color-surface-primary);
    border: var(--border-width-thick) solid var(--color-border-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    color: var(--color-text-primary);
    max-width: 90vw;
    max-height: 85vh;
    margin: var(--spacing-5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    will-change: transform, opacity;
    transition: all var(--duration-dialogOpen) var(--easing-smooth);
    z-index: var(--z-modal);
  }

  .ui-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-background-overlay);
    z-index: calc(var(--z-modal) - 1);
    transition: opacity var(--duration-dialogOpen) var(--easing-smooth);
    pointer-events: auto;
  }


  .ui-dialog-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ui-dialog-title {
    font-size: var(--font-lg);
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
  }

  .ui-dialog-content {
    padding: var(--spacing-md);
    overflow-y: auto;
    flex: 1;
  }

  .ui-dialog-footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
    flex-shrink: 0;
  }


  .ui-dialog-build-menu {
    min-width: 400px;
  }

  @media (max-width: 768px) {
    .ui-dialog-build-menu {
      min-width: 320px;
    }
  }


  /* Form elements */
  .ui-input {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-surface-secondary);
    border: var(--border-width-thick) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-base);
    transition: border-color var(--duration-buttonHover) var(--easing-smooth);
    width: 100%;
  }

  .ui-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .ui-select {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-surface-secondary);
    border: var(--border-width-thick) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-base);
    transition: border-color var(--duration-buttonHover) var(--easing-smooth);
    cursor: pointer;
  }

  .ui-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .ui-label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
  }

  .ui-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    user-select: none;
  }

  .ui-toggle-switch {
    width: 48px;
    height: 24px;
    background-color: var(--color-surface-secondary);
    border: var(--border-width-thick) solid var(--color-border-primary);
    border-radius: var(--radius-full);
    position: relative;
    transition: all var(--duration-toggle) var(--easing-smooth);
  }

  .ui-toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: var(--color-border-primary);
    border-radius: 50%;
    transition: all var(--duration-toggle) var(--easing-smooth);
  }

  .ui-toggle.checked .ui-toggle-switch {
    background-color: var(--color-status-success);
    border-color: var(--color-status-success);
  }

  .ui-toggle.checked .ui-toggle-switch::after {
    transform: translateX(24px);
    background-color: white;
  }

  /* Slider styles */
  .ui-slider-container {
    flex: 1;
    min-width: 200px;
  }

  .ui-slider {
    width: 100%;
  }

  .ui-slider-track {
    height: 6px;
    background-color: var(--color-surface-secondary);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
  }

  .ui-slider-fill {
    height: 100%;
    background-color: var(--color-button-primary);
    border-radius: 3px;
    transition: width var(--duration-sliderChange) var(--easing-smooth);
  }

  .ui-slider-thumb {
    width: 20px;
    height: 20px;
    background-color: var(--color-button-primary);
    border: 2px solid white;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform var(--duration-buttonHover) var(--easing-smooth);
  }

  .ui-slider-thumb:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }

  .ui-slider-thumb:active {
    cursor: grabbing;
  }

  /* Grid layout */
  .ui-grid {
    display: grid;
    gap: var(--spacing-md);
  }

  .ui-grid.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .ui-grid.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .ui-grid.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }


  /* State classes */
  .ui-loading {
    position: relative;
    pointer-events: none;
    opacity: 0.7;
  }

  .ui-loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid var(--color-border-primary);
    border-top-color: var(--color-button-primary);
    border-radius: 50%;
    animation: ui-spin 0.8s linear infinite;
  }

  @keyframes ui-spin {
    to { transform: rotate(360deg); }
  }

  .ui-error {
    color: var(--color-status-error);
  }

  .ui-success {
    color: var(--color-status-success);
  }

  .ui-warning {
    color: var(--color-status-warning);
  }

  /* Responsive utilities */
  @media (max-width: 768px) {
    .ui-hide-mobile {
      display: none !important;
    }

    .ui-grid.cols-3,
    .ui-grid.cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }

    .ui-dialog {
      max-width: 95vw;
      max-height: 95vh;
    }
  }

  @media (min-width: 769px) {
    .ui-hide-desktop {
      display: none !important;
    }
  }

  /* Scrollbar styling */
  .ui-scrollable {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-subtle) transparent;
  }

  .ui-scrollable::-webkit-scrollbar {
    width: 8px;
  }

  .ui-scrollable::-webkit-scrollbar-track {
    background: transparent;
  }

  .ui-scrollable::-webkit-scrollbar-thumb {
    background-color: var(--color-border-subtle);
    border-radius: 4px;
  }

  .ui-scrollable::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-border-primary);
  }

  /* Tooltip base styles */
  .ui-tooltip {
    position: absolute;
    background-color: var(--color-surface-tooltip);
    color: var(--color-text-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
    pointer-events: none;
    z-index: var(--z-tooltip);
    box-shadow: var(--shadow-md);
    white-space: nowrap;
  }

  /* Animation state class */
  .off-screen {
    visibility: hidden !important;
    opacity: 0 !important;
  }

  /* Animation classes */
  .ui-fade-in {
    animation: ui-fade-in var(--duration-dialogOpen) var(--easing-smooth);
  }

  @keyframes ui-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ui-slide-up {
    animation: ui-slide-up var(--duration-dialogOpen) var(--easing-smooth);
  }

  @keyframes ui-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ui-scale-in {
    animation: ui-scale-in var(--duration-dialogOpen) var(--easing-bounce);
  }

  @keyframes ui-scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Control bar */
  .ui-control-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: clamp(50px, 10vh, 60px);
    background: linear-gradient(to top, rgba(10, 10, 20, 0.9), rgba(10, 10, 20, 0.7));
    border-top: var(--border-width-thick) solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(var(--spacing-2), 2vw, var(--spacing-3));
    padding: 0 clamp(var(--spacing-2), 2vw, var(--spacing-5));
    z-index: var(--z-hud);
  }

  /* Placement indicator */
  .ui-placement-indicator {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    display: none;
    pointer-events: none;
    z-index: 1100;
    box-shadow: var(--shadow-md);
    transition: opacity 0.3s ease;
  }

  @media (max-width: 768px) {
    .ui-placement-indicator {
      font-size: 14px;
      padding: 10px 20px;
    }
  }
`;

// Additional utility classes for common patterns
const utilityStyles = `
  
  
  
  
  
  
  
  
  
  
  /* Level indicator pattern - Keep for complex pseudo-element styling */
  .ui-level-indicator {
    display: flex;
    gap: 4px;
    justify-content: center;
  }
  
  .ui-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: var(--transition-hover);
  }
  
  .ui-level-dot.filled {
    background: var(--color-status-success);
    box-shadow: 0 0 4px var(--color-status-success);
  }
  
  /* Shimmer effect for cards */
  .ui-shimmer::before {
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
  
  .ui-shimmer:hover::before {
    transform: rotate(45deg) translateX(100%);
  }
  
  /* Gradient text utility */
  .ui-gradient-text {
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  
  /* Pulse animation utility */
  .ui-pulse {
    animation: ui-pulse-animation 2s ease-in-out infinite;
  }
  
  @keyframes ui-pulse-animation {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  /* Glow effect utility */
  .ui-glow {
    filter: drop-shadow(0 0 8px var(--color-primary));
  }
  
  
`;

export function initializeUIStyles(): void {
  styleManager.addStyles('ui-base', baseUIStyles);
  styleManager.addStyles('ui-utilities', utilityStyles);
}