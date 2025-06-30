/**
 * Game Store Event Bridge
 * Subscribes to store changes and dispatches DOM events for UI compatibility
 */

import { gameStore } from './gameStore';

export function setupGameStoreEventBridge(): () => void {
  let previousCurrency = gameStore.getState().currency;
  let previousLives = gameStore.getState().lives;
  let previousScore = gameStore.getState().score;
  
  // Subscribe to currency changes
  const unsubCurrency = gameStore.subscribe(
    (state) => state.currency,
    (currency) => {
      const change = currency - previousCurrency;
      if (change !== 0) {
        previousCurrency = currency;
        
        const event = new CustomEvent('currencyChanged', { 
          detail: { currency, change } 
        });
        document.dispatchEvent(event);
      }
    }
  );
  
  // Subscribe to lives changes
  const unsubLives = gameStore.subscribe(
    (state) => state.lives,
    (lives) => {
      const change = lives - previousLives;
      if (change !== 0) {
        previousLives = lives;
        
        const event = new CustomEvent('livesChanged', { 
          detail: { lives, change } 
        });
        document.dispatchEvent(event);
      }
    }
  );
  
  // Subscribe to score changes
  const unsubScore = gameStore.subscribe(
    (state) => state.score,
    (score) => {
      const change = score - previousScore;
      if (change !== 0) {
        previousScore = score;
        
        const event = new CustomEvent('scoreChanged', { 
          detail: { score, change } 
        });
        document.dispatchEvent(event);
      }
    }
  );
  
  // Subscribe to game over state
  const unsubGameOver = gameStore.subscribe(
    (state) => state.isGameOver,
    (isGameOver) => {
      if (isGameOver) {
        const event = new CustomEvent('gameOver');
        document.dispatchEvent(event);
      }
    }
  );
  
  // Subscribe to wave changes
  const unsubWave = gameStore.subscribe(
    (state) => state.currentWave,
    (currentWave) => {
      const event = new CustomEvent('waveChanged', { 
        detail: { wave: currentWave } 
      });
      document.dispatchEvent(event);
    }
  );
  
  // Return cleanup function
  return () => {
    unsubCurrency();
    unsubLives();
    unsubScore();
    unsubGameOver();
    unsubWave();
  };
}