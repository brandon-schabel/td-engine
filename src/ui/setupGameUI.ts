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
  const cleanup = await setupSimpleGameUI(game, audioManager || new AudioManager());
  
  // Store cleanup function globally for cleanup
  (window as any).gameUICleanup = cleanup;
  
  // No periodic updates needed for simple UI
  
  return cleanup;
}

/**
 * Cleanup function for UI system
 */
export function cleanupGameUI(cleanup: any): void {
  // Call the cleanup function if it exists
  if (typeof cleanup === 'function') {
    cleanup();
  }
  console.log('UI cleanup complete');
}