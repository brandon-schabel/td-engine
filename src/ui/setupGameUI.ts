/**
 * setupGameUI - Initialize the simple game UI system
 * Uses the SimpleGameUI implementation for a clean, straightforward interface
 */

import { GameWithEvents } from '../core/GameWithEvents';
import { AudioManager } from '../audio/AudioManager';
import { setupSimpleGameUI } from './SimpleGameUI';

export interface GameUIOptions {
  game: GameWithEvents;
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  audioManager?: AudioManager;
  showInstructions?: boolean;
  enableTouch?: boolean;
  enableHapticFeedback?: boolean;
  debugMode?: boolean;
}

/**
 * Initialize the game UI system with the simple implementation
 */
export async function setupGameUI(options: GameUIOptions): Promise<any> {
  const { game, audioManager } = options;
  
  console.log('Initializing simple UI system...');
  
  // Use the simple UI implementation
  const ui = setupSimpleGameUI(game, audioManager || new AudioManager());
  
  // Store UI reference globally for keyboard access
  (window as any).gameUI = ui;
  
  // Update control buttons periodically
  setInterval(() => {
    if (ui?.updateControlButtons) {
      ui.updateControlButtons();
    }
  }, 100);
  
  return ui;
}

/**
 * Cleanup function for UI system
 */
export function cleanupGameUI(ui: any): void {
  // Clean up any intervals or event listeners
  // The simple UI doesn't need much cleanup
  console.log('UI cleanup complete');
}