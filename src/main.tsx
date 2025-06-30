import React from 'react';
import ReactDOM from 'react-dom/client';
import './app.css';
import { AudioManager } from "./audio/AudioManager";
import { injectResponsiveStyles } from "./ui/styles/generateResponsiveStyles";
import { styleManager } from "./ui/styles/StyleManager";
import { initializeUIStyles } from "./ui/styles/UIStyles";
import { initializeUtilityStyles } from "./ui/styles/UtilityStyles";
import { initializeComponentStyles } from "./ui/styles/ComponentStyles";
import { ReactApp } from './ReactApp';

// Initialize all styles in the correct order
function initializeStyles() {
  console.log('[Main] Initializing styles...');

  // Initialize utility styles first (they provide base classes)
  initializeUtilityStyles();

  // Initialize UI styles (they depend on utilities)
  initializeUIStyles();

  // Initialize component styles (they depend on both)
  initializeComponentStyles();

  // Inject responsive styles
  injectResponsiveStyles();

  // Inject all styles into the DOM
  styleManager.inject();

  // Debug: Log the injected styles
  const injectedStyles = styleManager.getStyles();
  console.log('[Main] Styles initialized and injected');
  console.log('[Main] Total CSS length:', injectedStyles.length);

  // Debug: Check if key classes exist
  const testClasses = ['bg-surface-primary', 'text-primary', 'border-white\\/10'];
  testClasses.forEach(className => {
    const exists = injectedStyles.includes(`.${className}`);
    console.log(`[Main] Class .${className}:`, exists ? '✅ Found' : '❌ Missing');
  });
}

// Initialize styles immediately
initializeStyles();

// Global variables
let audioManager: AudioManager;

// Initialize the application
function initializeApp() {
  // Create root container if it doesn't exist
  let appContainer = document.getElementById('app-container');
  if (!appContainer) {
    appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    appContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    `;
    document.body.appendChild(appContainer);
  }

  // Create React UI root if it doesn't exist
  let reactRoot = document.getElementById('react-ui-root');
  if (!reactRoot) {
    reactRoot = document.createElement('div');
    reactRoot.id = 'react-ui-root';
    reactRoot.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(reactRoot);
  }

  // Initialize audio manager
  audioManager = new AudioManager();

  // Mount React app
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <ReactApp audioManager={audioManager} />
    </React.StrictMode>
  );

  console.log('[Main] React app mounted successfully');

  // Make audio manager globally available for debugging
  if (typeof window !== 'undefined') {
    (window as any).audioManager = audioManager;
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Debug shortcut to quickly test game (F1)
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    // Set default config for quick testing
    (window as any).__preGameConfig = {
      mapSize: 'MEDIUM',
      difficulty: 'MEDIUM',
      biome: 'FOREST'
    };
    
    // Trigger scene change via custom event
    window.dispatchEvent(new CustomEvent('quickStartGame'));
  }
});