export { styleManager } from './StyleManager';

import { styleManager } from './StyleManager';

import { initializeDraggableStyles } from './DraggableStyles';

export function initializeAllStyles(): void {
  // Initialize draggable UI styles
  initializeDraggableStyles();

  // Inject all styles into the DOM
  styleManager.inject();
}