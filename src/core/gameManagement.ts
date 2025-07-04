/**
 * Central game management utilities
 * Handles game instance lifecycle and state management
 */

import { gameStore } from '@/stores/gameStore';
import { utilizeEntityStore } from '@/stores/entityStore';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import type { GameWithEvents } from './GameWithEvents';

/**
 * Reset the entire game state including all stores and the game instance
 */
export function resetGame(gameInstance?: GameWithEvents | null): void {
  console.log('[GameManagement] Starting complete game reset...');
  
  // Reset the game instance if provided
  if (gameInstance && typeof gameInstance.reset === 'function') {
    gameInstance.reset();
  } else {
    // If no game instance, manually reset stores
    // This handles the store reset that would normally be done by game.reset()
    gameStore.getState().resetGame();
  }
  
  // Ensure entity store is cleared (redundant if game.reset() was called, but safe)
  utilizeEntityStore.getState().clearAllEntities();
  
  // Close all UI panels including persistent ones
  uiStore.getState().closeAllPanels(true);
  
  console.log('[GameManagement] Game reset complete');
}

/**
 * Clean up game instance and prepare for disposal
 */
export function cleanupGame(gameInstance?: GameWithEvents | null): void {
  if (!gameInstance) return;
  
  console.log('[GameManagement] Cleaning up game instance...');
  
  // Stop the game
  if (typeof gameInstance.stop === 'function') {
    gameInstance.stop();
  }
  
  // Clear global reference
  if ((window as any).currentGame === gameInstance) {
    delete (window as any).currentGame;
  }
  
  // Clear all stores
  utilizeEntityStore.getState().clearAllEntities();
  uiStore.getState().closeAllPanels(true);
  
  console.log('[GameManagement] Game cleanup complete');
}

/**
 * Check if a game instance is currently active
 */
export function isGameActive(): boolean {
  return !!(window as any).currentGame;
}

/**
 * Get the current game instance if available
 */
export function getCurrentGame(): GameWithEvents | null {
  return (window as any).currentGame || null;
}