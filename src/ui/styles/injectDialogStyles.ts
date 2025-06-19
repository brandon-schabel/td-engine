/**
 * Injects dialog-specific CSS fixes into the document
 * This ensures dialogs work properly across all browsers and devices
 */

export function injectDialogStyles(): void {
  const styleId = 'dialog-system-fixes';
  
  // Check if styles already injected
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  
  style.textContent = `
    /* Dialog System CSS Fixes */
    
    /* Prevent scrolling when dialog is open */
    body.dialog-open {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    
    /* Ensure dialog containers are properly layered */
    .dialog-container {
      position: fixed !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto !important;
    }
    
    /* Dialog panel fixes */
    .dialog-panel {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0);
      -webkit-transform: translate3d(-50%, -50%, 0);
      will-change: transform, opacity;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Fix for Safari mobile */
    @supports (-webkit-touch-callout: none) {
      .dialog-panel {
        -webkit-transform: translate3d(-50%, -50%, 0);
        transform: translate3d(-50%, -50%, 0);
      }
      
      .dialog-container {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
    }
    
    /* Mobile fullscreen dialog fixes */
    @media (max-width: 768px) {
      /* Let BaseDialog handle positioning */
      .dialog-panel {
        /* Remove forced positioning that conflicts with BaseDialog */
      }
      
      .dialog-content {
        /* Ensure content scrolls properly */
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        min-height: 0;
      }
      
      /* Ensure touch targets are large enough */
      .dialog-button,
      button,
      input[type="checkbox"],
      input[type="range"],
      select {
        min-height: 44px;
      }
    }
    
    /* Prevent text selection during swipe */
    .dialog-header {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Improve button touch feedback */
    .dialog-button:active,
    button:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
    
    /* Ensure dialogs are above everything else */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    
    /* Animation performance improvements */
    .dialog-panel,
    .dialog-overlay {
      will-change: opacity, transform;
    }
    
    /* Prevent double-tap zoom on buttons */
    button,
    input,
    select,
    textarea {
      touch-action: manipulation;
    }
    
    /* Fix for landscape mobile */
    @media (max-width: 768px) and (orientation: landscape) {
      .dialog-content {
        max-height: calc(100vh - 100px);
      }
      
      .dialog-footer {
        padding: 8px 16px;
      }
    }
  `;
  
  document.head.appendChild(style);
}