/**
 * setupGameUI - Initialize the complete game UI system
 * Coordinates all UI components and sets up the game interface
 */

import { GameWithEvents } from '../core/GameWithEvents';
import { GameUIManager } from './GameUIManager';
import { AudioManager } from '../audio/AudioManager';
import { ResponsiveUtils } from './components/Layout';

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
 * Initialize the complete game UI system
 */
export async function setupGameUI(options: GameUIOptions): Promise<GameUIManager> {
  const {
    game,
    container,
    canvas,
    audioManager,
    showInstructions = true,
    enableTouch = ResponsiveUtils.isMobile(),
    enableHapticFeedback = true,
    debugMode = false
  } = options;
  
  // Ensure container has proper styling
  setupContainerStyles(container);
  
  // Create UI manager
  const uiManager = new GameUIManager(game, {
    enableTouchControls: enableTouch,
    enableHapticFeedback,
    showInstructions,
    autoHideInstructions: true,
    debugMode
  });
  
  // Initialize UI system
  try {
    await uiManager.initialize();
    
    // Set up responsive handling
    setupResponsiveHandling(container, canvas, uiManager);
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts(game, uiManager);
    
    // Set up touch input if enabled
    if (enableTouch) {
      setupTouchInput(canvas, game, uiManager);
    }
    
    // Connect audio manager if provided
    if (audioManager) {
      connectAudioManager(audioManager, uiManager);
    }
    
    // Add initial UI feedback
    showWelcomeMessage(uiManager, enableTouch);
    
    return uiManager;
    
  } catch (error) {
    console.error('Failed to initialize game UI:', error);
    throw error;
  }
}

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function connectUIEvents(uiManager: GameUIManager, game: GameWithEvents, audioManager: AudioManager): void {
  // Tower selection
  uiManager.on('tower-type-selected', (type) => {
    audioManager.playUISound(type ? 'SELECT' : 'DESELECT');
    game.setSelectedTowerType(type);
  });
  
  // Tower selection (clicking on tower)
  uiManager.on('tower-selected', (tower) => {
    audioManager.playUISound('SELECT');
    // Game already handles this internally
  });
  
  // Start wave
  uiManager.on('start-wave', () => {
    audioManager.playUISound('BUTTON_CLICK');
    game.startNextWave();
  });
  
  // Pause toggle
  uiManager.on('pause-toggle', () => {
    audioManager.playUISound('BUTTON_CLICK');
    if (game.isPaused()) {
      game.resume();
    } else {
      game.pause();
    }
  });
  
  // Player upgrade
  uiManager.on('player-upgrade', (type) => {
    audioManager.playUISound('BUTTON_CLICK');
    const success = game.upgradePlayer(type);
    if (!success) {
      audioManager.playUISound('ERROR');
    }
  });
  
  // Tower upgrade
  uiManager.on('tower-upgrade', (tower, type) => {
    audioManager.playUISound('BUTTON_CLICK');
    const success = game.upgradeTower(tower, type);
    if (!success) {
      audioManager.playUISound('ERROR');
    }
  });
  
  // Audio settings
  uiManager.on('audio-settings-changed', (settings) => {
    audioManager.setMasterVolume(settings.volume);
    audioManager.setEnabled(!settings.muted);
    game.getAudioManager().setMasterVolume(settings.volume);
    game.getAudioManager().setEnabled(!settings.muted);
  });
}

/**
 * Setup container styles and viewport
 */
function setupContainerStyles(container: HTMLElement): void {
  // Ensure container has proper styling for full-screen UI
  Object.assign(container.style, {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'none',
    webkitUserSelect: 'none',
    webkitTouchCallout: 'none'
  });
  
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewport);
  }
  
  // Inject base UI styles
  injectUIStyles();
}

/**
 * Setup responsive handling for canvas and UI
 */
function setupResponsiveHandling(container: HTMLElement, canvas: HTMLCanvasElement, uiManager: GameUIManager): void {
  const handleResize = () => {
    // Update canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Notify UI manager of size change
    uiManager.handleResize(rect.width, rect.height);
  };
  
  // Initial resize
  handleResize();
  
  // Listen for window resize
  window.addEventListener('resize', handleResize);
  
  // Listen for orientation change on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
  });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts(game: GameWithEvents, uiManager: GameUIManager): void {
  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Digit1':
        event.preventDefault();
        uiManager.emit('tower-type-selected', 'BASIC');
        break;
      case 'Digit2':
        event.preventDefault();
        uiManager.emit('tower-type-selected', 'SNIPER');
        break;
      case 'Digit3':
        event.preventDefault();
        uiManager.emit('tower-type-selected', 'RAPID');
        break;
      case 'Escape':
        event.preventDefault();
        uiManager.emit('tower-type-selected', null);
        break;
      case 'KeyP':
      case 'Space':
        if (event.code === 'Space' && event.target === document.body) {
          event.preventDefault();
          uiManager.emit('pause-toggle');
        } else if (event.code === 'KeyP') {
          event.preventDefault();
          uiManager.emit('pause-toggle');
        }
        break;
      case 'KeyH':
        event.preventDefault();
        uiManager.toggleInstructions();
        break;
      case 'KeyM':
        event.preventDefault();
        uiManager.toggleAudioPanel();
        break;
    }
  });
}

/**
 * Setup touch input handling
 */
function setupTouchInput(canvas: HTMLCanvasElement, game: GameWithEvents, uiManager: GameUIManager): void {
  // Prevent default touch behaviors
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  
  // Listen for custom gamepad events from touch controls
  canvas.addEventListener('gamepadmove', (event) => {
    handleVirtualControlEvent({
      type: 'joystick',
      action: 'move',
      data: (event as CustomEvent).detail
    }, game, uiManager);
  });
  
  canvas.addEventListener('gamepadbutton', (event) => {
    const detail = (event as CustomEvent).detail;
    handleVirtualControlEvent({
      type: 'button',
      action: detail.pressed ? 'start' : 'end',
      data: { button: detail.button }
    }, game, uiManager);
  });
}

/**
 * Connect audio manager to UI events
 */
function connectAudioManager(audioManager: AudioManager, uiManager: GameUIManager): void {
  connectUIEvents(uiManager, uiManager.game, audioManager);
}

/**
 * Show welcome message
 */
function showWelcomeMessage(uiManager: GameUIManager, enableTouch: boolean): void {
  const message = enableTouch 
    ? "Welcome! Use touch controls to play. Tap the ? icon for help."
    : "Welcome! Use WASD to move, click to shoot. Press H for help.";
  
  uiManager.showNotification(message, 'info', 4000);
}

/**
 * Inject base UI styles
 */
function injectUIStyles(): void {
  if (document.getElementById('game-ui-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'game-ui-styles';
  style.textContent = `
    /* Game UI Base Styles */
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
    }
    
    /* Safe area support for notched devices */
    @supports (padding: max(0px)) {
      .safe-area-inset-top { padding-top: max(20px, env(safe-area-inset-top)); }
      .safe-area-inset-bottom { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
      .safe-area-inset-left { padding-left: max(20px, env(safe-area-inset-left)); }
      .safe-area-inset-right { padding-right: max(20px, env(safe-area-inset-right)); }
    }
    
    /* Disable text selection and context menus on game elements */
    .game-container, .game-container * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Custom scrollbar for UI panels */
    .ui-panel::-webkit-scrollbar {
      width: 6px;
    }
    
    .ui-panel::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .ui-panel::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .ui-panel::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    /* Animation utilities */
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    
    .fade-out {
      animation: fadeOut 0.3s ease-in-out;
    }
    
    .slide-up {
      animation: slideUp 0.3s ease-out;
    }
    
    .slide-down {
      animation: slideDown 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    /* Utility classes */
    .pointer-events-none { pointer-events: none; }
    .pointer-events-auto { pointer-events: auto; }
    .no-select { user-select: none; }
    .no-scroll { overflow: hidden; }
  `;
  
  document.head.appendChild(style);
}

/**
 * Cleanup function for UI system
 */
export function cleanupGameUI(uiManager: GameUIManager): void {
  // Remove event listeners
  window.removeEventListener('resize', () => {});
  window.removeEventListener('orientationchange', () => {});
  
  // Cleanup UI manager
  uiManager.cleanup();
  
  // Remove injected styles
  const styleElement = document.getElementById('game-ui-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

function connectUIEvents(uiManager: GameUIManager, game: GameWithEvents, audioManager: AudioManager): void {
  // Tower selection
  uiManager.on('tower-type-selected', (type) => {
    audioManager.playUISound(type ? 'SELECT' : 'DESELECT');
    game.setSelectedTowerType(type);
  });
  
  // Tower selection (clicking on tower)
  uiManager.on('tower-selected', (tower) => {
    audioManager.playUISound('SELECT');
    // Game already handles this internally
  });
  
  // Start wave
  uiManager.on('start-wave', () => {
    audioManager.playUISound('BUTTON_CLICK');
    game.startNextWave();
  });
  
  // Pause toggle
  uiManager.on('pause-toggle', () => {
    audioManager.playUISound('BUTTON_CLICK');
    if (game.isPaused()) {
      game.resume();
    } else {
      game.pause();
    }
  });
  
  // Player upgrade
  uiManager.on('player-upgrade', (type) => {
    audioManager.playUISound('BUTTON_CLICK');
    const success = game.upgradePlayer(type);
    if (!success) {
      audioManager.playUISound('ERROR');
    }
  });
  
  // Tower upgrade
  uiManager.on('tower-upgrade', (tower, type) => {
    audioManager.playUISound('BUTTON_CLICK');
    const success = game.upgradeTower(tower, type);
    if (!success) {
      audioManager.playUISound('ERROR');
    }
  });
  
  // Audio settings
  uiManager.on('audio-settings-changed', (settings) => {
    audioManager.setMasterVolume(settings.volume);
    audioManager.setEnabled(!settings.muted);
    game.getAudioManager().setMasterVolume(settings.volume);
    game.getAudioManager().setEnabled(!settings.muted);
  });
}

function handleVirtualControlEvent(event: any, game: GameWithEvents, uiManager: GameUIManager): void {
  switch (event.type) {
    case 'joystick':
      if (event.action === 'move') {
        const { direction, magnitude } = event.data;
        if (magnitude > 0.1) {
          const angle = direction;
          const threshold = Math.PI / 4;
          
          // Determine primary direction
          if (angle >= -threshold && angle <= threshold) {
            game.handleKeyDown('d'); // Right
          } else if (angle >= threshold && angle <= 3 * threshold) {
            game.handleKeyDown('s'); // Down
          } else if (angle >= 3 * threshold || angle <= -3 * threshold) {
            game.handleKeyDown('a'); // Left
          } else {
            game.handleKeyDown('w'); // Up
          }
        }
      }
      break;
      
    case 'button':
      switch (event.data.button) {
        case 'shoot':
          if (event.action === 'start') {
            const canvas = game.getCanvas();
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: centerX,
              clientY: centerY,
              button: 0
            });
            Object.defineProperty(mouseEvent, 'offsetX', { value: centerX });
            Object.defineProperty(mouseEvent, 'offsetY', { value: centerY });
            game.handleMouseDown(mouseEvent);
          } else if (event.action === 'end') {
            const mouseEvent = new MouseEvent('mouseup', { button: 0 });
            game.handleMouseUp(mouseEvent);
          }
          break;
          
        case 'pause':
          uiManager.emit('pause-toggle');
          break;
      }
      break;
  }
}