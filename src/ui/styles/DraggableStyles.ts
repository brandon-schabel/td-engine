/**
 * Draggable UI Styles
 * Provides visual feedback for draggable UI elements
 */

import { styleManager } from './StyleManager';

export function initializeDraggableStyles(): void {
  // Register draggable styles
  styleManager.registerStyles('draggable', `
    /* Draggable element hover state */
    .floating-ui-element[data-draggable="true"]:hover {
      cursor: move;
    }

    /* Active dragging state */
    .floating-ui-element.dragging {
      opacity: 0.8 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      transition: none !important;
      z-index: 9999 !important;
    }

    /* Drag handle specific styles */
    .drag-handle {
      cursor: move;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    /* Prevent text selection during drag */
    .floating-ui-container.dragging-active {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    /* Visual indicator for draggable elements */
    .floating-ui-element[data-draggable="true"] {
      transition: transform 0.1s ease-out, box-shadow 0.2s ease-out;
    }

    .floating-ui-element[data-draggable="true"]:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    /* Reset position animation */
    .floating-ui-element.position-reset {
      transition: left 0.3s ease-out, top 0.3s ease-out !important;
    }

    /* Boundary violation indicator */
    .floating-ui-element.out-of-bounds {
      border: 2px solid #ff4444 !important;
      animation: boundary-pulse 0.5s ease-in-out;
    }

    @keyframes boundary-pulse {
      0% { border-color: #ff4444; }
      50% { border-color: #ff8888; }
      100% { border-color: #ff4444; }
    }

    /* Mobile touch adjustments */
    @media (hover: none) and (pointer: coarse) {
      .floating-ui-element[data-draggable="true"] {
        /* Larger touch target on mobile */
        min-width: 44px;
        min-height: 44px;
      }
      
      .drag-handle {
        /* Ensure adequate touch target size */
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  `);
}