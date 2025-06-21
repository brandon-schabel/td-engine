export { styleManager } from './StyleManager';
export { initializeUIStyles } from './UIStyles';
export { initializeComponentStyles } from './ComponentStyles';

import { styleManager } from './StyleManager';
import { initializeUIStyles } from './UIStyles';
import { initializeComponentStyles } from './ComponentStyles';

export function initializeAllStyles(): void {
  // Initialize base UI styles
  initializeUIStyles();
  
  // Initialize game component styles
  initializeComponentStyles();
  
  // Inject all styles into the DOM
  styleManager.inject();
}