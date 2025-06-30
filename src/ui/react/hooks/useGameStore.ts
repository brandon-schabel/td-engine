import { useState, useEffect } from 'react';
import { gameStore } from '@/stores/gameStore';

/**
 * React hook for subscribing to the vanilla Zustand game store
 * This allows React components to reactively update when game state changes
 */
export const useGameStore = () => {
  const [state, setState] = useState(gameStore.getState());

  useEffect(() => {
    // Subscribe to all state changes
    const unsubscribe = gameStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
};

/**
 * Selective subscription hook for better performance
 * Only re-renders when the selected part of state changes
 */
export const useGameStoreSelector = <T>(selector: (state: ReturnType<typeof gameStore.getState>) => T) => {
  const [selectedState, setSelectedState] = useState(selector(gameStore.getState()));

  useEffect(() => {
    // Subscribe only to selected state changes
    const unsubscribe = gameStore.subscribe((state) => {
      const newSelectedState = selector(state);
      setSelectedState(newSelectedState);
    });
    return unsubscribe;
  }, [selector]);

  return selectedState;
};