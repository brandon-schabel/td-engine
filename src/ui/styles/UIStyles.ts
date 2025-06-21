import { styleManager } from './StyleManager';

const baseUIStyles = `
  /* Base resets and defaults */
  .ui-element {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Button styles */
  .ui-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: linear-gradient(135deg, var(--color-button-primary) 0%, #5a7fdb 100%);
    color: var(--color-text-primary);
    border: 2px solid var(--color-button-primary);
    border-radius: var(--radius-md);
    font-size: var(--font-base);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-buttonHover) var(--easing-smooth);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .ui-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  .ui-button:hover:not(:disabled)::before {
    width: 100%;
    height: 100%;
  }

  .ui-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .ui-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .ui-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  .ui-button.secondary {
    background: linear-gradient(135deg, var(--color-button-secondary) 0%, #6c757d 100%);
    border-color: var(--color-button-secondary);
    color: var(--color-text-primary);
  }

  .ui-button.secondary:hover:not(:disabled) {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    border-color: #5a6268;
  }

  .ui-button.danger {
    background: linear-gradient(135deg, var(--color-status-error) 0%, #dc3545 100%);
    border-color: var(--color-status-error);
  }

  .ui-button.danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    border-color: #c82333;
  }

  .ui-button.outline {
    background-color: transparent;
    color: var(--color-button-primary);
  }

  .ui-button.outline:hover:not(:disabled) {
    background-color: var(--color-button-primary);
    color: var(--color-text-primary);
  }

  .ui-button.small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-sm);
  }

  .ui-button.large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-lg);
  }

  .ui-button-icon-only {
    padding: var(--spacing-sm);
    aspect-ratio: 1;
  }

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
    border: 2px solid var(--color-border-primary);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    color: var(--color-text-primary);
    max-width: 90vw;
    max-height: 85vh;
    margin: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    will-change: transform, opacity;
    transition: all var(--duration-dialogOpen) var(--easing-smooth);
    z-index: 9999;
  }

  .ui-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9998;
    transition: opacity var(--duration-dialogOpen) var(--easing-smooth);
    pointer-events: auto;
  }

  .ui-button-close {
    width: 32px;
    height: 32px;
    padding: 0;
    min-width: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .ui-dialog-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color var(--duration-buttonHover) var(--easing-smooth);
  }

  .ui-dialog-close:hover {
    color: var(--color-text-primary);
  }

  .ui-dialog-build-menu {
    min-width: 400px;
  }

  @media (max-width: 768px) {
    .ui-dialog-build-menu {
      min-width: 320px;
    }
  }

  /* Card styles */
  .ui-card {
    background-color: var(--color-surface-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    transition: all var(--duration-cardHover) var(--easing-smooth);
  }

  .ui-card.interactive {
    cursor: pointer;
  }

  .ui-card.interactive:hover {
    border-color: var(--color-border-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Form elements */
  .ui-input {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-base);
    transition: border-color var(--duration-buttonHover) var(--easing-smooth);
    width: 100%;
  }

  .ui-input:focus {
    outline: none;
    border-color: var(--color-button-primary);
  }

  .ui-select {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-surface-secondary);
    border: 2px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-base);
    transition: border-color var(--duration-buttonHover) var(--easing-smooth);
    cursor: pointer;
  }

  .ui-select:focus {
    outline: none;
    border-color: var(--color-button-primary);
  }

  .ui-label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-sm);
    font-weight: 600;
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
    border: 2px solid var(--color-border-primary);
    border-radius: 12px;
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

  /* Utility classes */
  .ui-text-center {
    text-align: center;
  }

  .ui-text-right {
    text-align: right;
  }

  .ui-flex {
    display: flex;
  }

  .ui-flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ui-flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ui-gap-xs {
    gap: var(--spacing-xs);
  }

  .ui-gap-sm {
    gap: var(--spacing-sm);
  }

  .ui-gap-md {
    gap: var(--spacing-md);
  }

  .ui-gap-lg {
    gap: var(--spacing-lg);
  }

  /* Spacing utilities */
  .ui-p-xs { padding: var(--spacing-xs); }
  .ui-p-sm { padding: var(--spacing-sm); }
  .ui-p-md { padding: var(--spacing-md); }
  .ui-p-lg { padding: var(--spacing-lg); }

  .ui-m-xs { margin: var(--spacing-xs); }
  .ui-m-sm { margin: var(--spacing-sm); }
  .ui-m-md { margin: var(--spacing-md); }
  .ui-m-lg { margin: var(--spacing-lg); }

  .ui-mt-xs { margin-top: var(--spacing-xs); }
  .ui-mt-sm { margin-top: var(--spacing-sm); }
  .ui-mt-md { margin-top: var(--spacing-md); }
  .ui-mt-lg { margin-top: var(--spacing-lg); }

  .ui-mb-xs { margin-bottom: var(--spacing-xs); }
  .ui-mb-sm { margin-bottom: var(--spacing-sm); }
  .ui-mb-md { margin-bottom: var(--spacing-md); }
  .ui-mb-lg { margin-bottom: var(--spacing-lg); }

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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
  }

  /* Visibility utilities */
  .hidden {
    display: none !important;
  }

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
    border-top: 2px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 2vw, 12px);
    padding: 0 clamp(10px, 2vw, 20px);
    z-index: 1000;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: opacity 0.3s ease;
  }

  @media (max-width: 768px) {
    .ui-placement-indicator {
      font-size: 14px;
      padding: 10px 20px;
    }
  }
`;

export function initializeUIStyles(): void {
  styleManager.addStyles('ui-base', baseUIStyles);
}