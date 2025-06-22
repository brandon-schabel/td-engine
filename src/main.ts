import { AudioManager } from "./audio/AudioManager";
import { injectResponsiveStyles } from "./ui/styles/generateResponsiveStyles";
import { SceneManager } from "./scenes/SceneManager";
import {
  MainMenuScene,
  PreGameConfigScene,
  GameScene,
  GameOverScene,
  LeaderboardScene,
  SettingsScene
} from "./scenes/gameScenes";
import { styleManager } from "./ui/styles/StyleManager";
import { initializeUIStyles } from "./ui/styles/UIStyles";
import { initializeUtilityStyles } from "./ui/styles/UtilityStyles";
import { initializeComponentStyles } from "./ui/styles/ComponentStyles";

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
let sceneManager: SceneManager;
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

  // Initialize audio manager
  audioManager = new AudioManager();

  // Initialize scene manager
  sceneManager = new SceneManager(appContainer as HTMLDivElement, audioManager);

  // Register all scenes
  sceneManager.registerScene('mainMenu', new MainMenuScene(sceneManager));
  sceneManager.registerScene('preGameConfig', new PreGameConfigScene(sceneManager));
  sceneManager.registerScene('game', new GameScene(sceneManager));
  sceneManager.registerScene('gameOver', new GameOverScene(sceneManager));
  sceneManager.registerScene('leaderboard', new LeaderboardScene(sceneManager));
  sceneManager.registerScene('settings', new SettingsScene(sceneManager));

  // Start with main menu
  sceneManager.switchTo('mainMenu');

  // Make scene manager globally available for debugging
  if (typeof window !== 'undefined') {
    (window as any).sceneManager = sceneManager;
  }
}


// Start the application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Debug shortcut to quickly test game
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1' && sceneManager) {
    // Quick start game with default config
    (window as any).__preGameConfig = {
      mapSize: 'MEDIUM',
      difficulty: 'MEDIUM',
      biome: 'FOREST'
    };
    sceneManager.switchTo('game');
  }
});

// Handle browser back button
window.addEventListener('popstate', () => {
  if (sceneManager) {
    const currentScene = sceneManager.getCurrentSceneName();
    if (currentScene === 'game') {
      // If in game, go to game over
      sceneManager.switchTo('gameOver');
    } else if (currentScene !== 'mainMenu') {
      // Otherwise go to main menu
      sceneManager.switchTo('mainMenu');
    }
  }
});
