export { styleManager } from './StyleManager';
export { initializeUIStyles } from './UIStyles';
export { initializeComponentStyles } from './ComponentStyles';
export { initializeUtilityStyles, cn } from './UtilityStyles';

import { styleManager } from './StyleManager';
import { initializeUIStyles } from './UIStyles';
import { initializeComponentStyles } from './ComponentStyles';
import { initializeUtilityStyles } from './UtilityStyles';

export function initializeAllStyles(): void {
  // Initialize utility classes (should come first for proper cascade)
  initializeUtilityStyles();
  
  // Initialize base UI styles
  initializeUIStyles();
  
  // Initialize game component styles
  initializeComponentStyles();
  
  // Inject all styles into the DOM
  styleManager.inject();
}