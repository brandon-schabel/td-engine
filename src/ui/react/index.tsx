import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppUI } from './AppUI';

const mountReactUI = () => {
  const uiRoot = document.getElementById('react-ui-root');
  if (uiRoot) {
    // Set styles for the React root
    uiRoot.style.position = 'fixed';
    uiRoot.style.inset = '0';
    uiRoot.style.pointerEvents = 'none';
    uiRoot.style.zIndex = '1000';
    
    ReactDOM.createRoot(uiRoot).render(
      <React.StrictMode>
        <AppUI />
      </React.StrictMode>
    );
  }
};

// Export the mount function so it can be called from main.ts
export { mountReactUI };