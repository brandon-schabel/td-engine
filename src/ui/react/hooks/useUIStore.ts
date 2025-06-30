import { useState, useEffect } from 'react';
import { uiStore, UIPanelType } from '@/stores/uiStore';

/**
 * React hook for subscribing to the vanilla Zustand UI store
 * This allows React components to reactively update when UI state changes
 */
export const useUIStore = () => {
  const [state, setState] = useState(uiStore.getState());

  useEffect(() => {
    // Subscribe to all state changes
    const unsubscribe = uiStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
};

/**
 * Selective subscription hook for better performance
 * Only re-renders when the selected part of state changes
 */
export const useUIStoreSelector = <T>(selector: (state: ReturnType<typeof uiStore.getState>) => T) => {
  const [selectedState, setSelectedState] = useState(selector(uiStore.getState()));

  useEffect(() => {
    // Subscribe only to selected state changes
    const unsubscribe = uiStore.subscribe((state) => {
      const newSelectedState = selector(state);
      setSelectedState(newSelectedState);
    });
    return unsubscribe;
  }, [selector]);

  return selectedState;
};

/**
 * Hook specifically for checking if a panel is open
 * More efficient than subscribing to the entire store
 */
export const useIsPanelOpen = (panel: UIPanelType): boolean => {
  const [isOpen, setIsOpen] = useState(uiStore.getState().isPanelOpen(panel));

  useEffect(() => {
    // Subscribe to specific panel state changes
    const unsubscribe = uiStore.subscribe(
      (state) => state.panels[panel].isOpen,
      (newIsOpen) => setIsOpen(newIsOpen)
    );
    return unsubscribe;
  }, [panel]);

  return isOpen;
};