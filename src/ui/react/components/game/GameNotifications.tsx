import React, { createContext, useContext } from 'react';
import { useToastNotifications } from '../floating';

// Create a context for the notifications
const NotificationsContext = createContext<ReturnType<typeof useToastNotifications> | null>(null);

/**
 * Global notifications provider for the game
 */
export const GameNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notifications = useToastNotifications();
  
  return (
    <NotificationsContext.Provider value={notifications}>
      {children}
      <notifications.ToastContainer position="top" />
    </NotificationsContext.Provider>
  );
};

/**
 * Hook to access game notifications from any component
 */
export function useGameNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useGameNotifications must be used within GameNotificationsProvider');
  }
  return context;
}