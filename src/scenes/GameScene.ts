/**
 * Game scene - wraps the actual game play
 */

import { Scene } from './Scene';
import { GameWithEvents } from '@/core/GameWithEvents';
import { setupGameUI } from '@/ui/setupGameUI';
import { cn } from '@/ui/styles/UtilityStyles';
import { TransitionType } from './SceneTransition';
import { applySettingsToGame } from '@/config/SettingsIntegration';
import {
  type MapGenerationConfig,
  BiomeType,
  DecorationLevel,
  MapDifficulty,
} from '@/types/MapData';
import { RESPONSIVE_CONFIG, isMobile } from '@/config/ResponsiveConfig';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export class GameScene extends Scene {
  private canvas: HTMLCanvasElement | null = null;
  private game: GameWithEvents | null = null;
  private resizeTimeout: number | null = null;
  private gameEndHandler: ((e: Event) => void) | null = null;
  private canvasEventHandlers: {
    mousedown?: (e: MouseEvent) => void;
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
    wheel?: (e: WheelEvent) => void;
    contextmenu?: (e: MouseEvent) => void;
    mouseleave?: () => void;
    globalMouseup?: () => void;
    windowBlur?: () => void;
  } = {};

  protected async onEnter(): Promise<void> {
    this.createGameCanvas();
    await this.initializeGame();
  }

  protected async onExit(): Promise<void> {
    // Remove canvas event listeners
    this.removeCanvasEventListeners();
    
    // Stop and clean up game
    if (this.game) {
      this.game.stop();
      this.game = null;
    }

    // Remove event listener
    if (this.gameEndHandler) {
      document.removeEventListener('gameEnd', this.gameEndHandler);
      this.gameEndHandler = null;
    }

    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  protected onUpdate(_deltaTime: number): void {
    // Game has its own update loop
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (!this.game || !this.canvas) return;

    // Handle keyboard events
    if (event instanceof KeyboardEvent) {
      if (event.type === 'keydown') {
        // Note: Escape key is handled by the game for tower placement cancellation
        // Pause functionality is available via the pause button in the UI
        
        // Forward all other keys to game
        this.game.handleKeyDown(event.key.toLowerCase());
      } else if (event.type === 'keyup') {
        this.game.handleKeyUp(event.key.toLowerCase());
      }
    }
    
    // Handle mouse events (from SceneManager's global handlers)
    else if (event instanceof MouseEvent && event.type === 'click') {
      // Convert to canvas-relative coordinates
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Create a synthetic mouse event with canvas-relative coordinates
      const canvasEvent = new MouseEvent('mousedown', {
        clientX: x,
        clientY: y,
        button: event.button,
        buttons: event.buttons,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      });
      
      this.game.handleMouseClick(canvasEvent);
    }
  }

  protected onDestroy(): void {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }

  private createGameCanvas(): void {
    // Clear container
    this.container.innerHTML = '';

    // Update container styles for game
    this.container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full'
    );

    // Create a fresh game container inside the scene container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'scene-game-container';
    gameContainer.className = cn('w-full', 'h-full', 'relative');
    
    // Create the game structure
    gameContainer.innerHTML = `
      <div id="canvas-container" class="w-full h-full relative bg-black">
        <canvas id="game-canvas" class="absolute inset-0 w-full h-full block"></canvas>
      </div>
      <div id="ui-container" class="absolute inset-0 pointer-events-none z-10"></div>
      <div id="bottom-ui-container" class="absolute bottom-0 left-0 right-0 h-[60px] z-20"></div>
    `;
    
    this.container.appendChild(gameContainer);

    // Get canvas reference
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Failed to create game canvas');
    }

    // Get the 2D context and configure it
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Set up resize handler
    this.setupResizeHandler();
    
    // Initial resize to set proper dimensions
    this.resizeCanvas();
    
    // Log canvas info for debugging
    console.log('[GameScene] Canvas created:', {
      canvas: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      styleWidth: this.canvas.style.width,
      styleHeight: this.canvas.style.height,
      context: ctx
    });
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = window.setTimeout(() => {
        this.resizeCanvas();
      }, ANIMATION_CONFIG.durations.fast);
    };

    window.addEventListener('resize', handleResize);
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;

    const container = this.canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;

      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      // Only resize if dimensions have actually changed
      const needsResize = this.canvas.width !== width * pixelRatio || 
                         this.canvas.height !== height * pixelRatio;

      if (needsResize) {
        // Set canvas resolution
        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;

        // Set canvas display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // Scale the drawing context
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          // Reset transform before scaling
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(pixelRatio, pixelRatio);
        }

        console.log('[GameScene] Canvas resized:', {
          width: width,
          height: height,
          pixelRatio: pixelRatio,
          canvasWidth: this.canvas.width,
          canvasHeight: this.canvas.height
        });
      }

      // Update camera viewport if game exists
      if (this.game) {
        const camera = this.game.getCamera();
        camera.updateViewport(width, height);

        // Adjust zoom for mobile
        const isMobileDevice = isMobile(window.innerWidth) || 'ontouchstart' in window;
        if (isMobileDevice) {
          const baseZoom = Math.min(width / 1200, height / 800) * RESPONSIVE_CONFIG.scaling.ui.mobile;
          camera.setZoom(Math.max(RESPONSIVE_CONFIG.scaling.game.minZoom, baseZoom));
        }
      }
    }
  }

  private async initializeGame(): Promise<void> {
    if (!this.canvas) {
      console.error('[GameScene] No canvas available for game initialization');
      return;
    }

    // Ensure canvas is properly sized before creating game
    this.resizeCanvas();

    // Wait a frame to ensure DOM is ready
    await new Promise(resolve => requestAnimationFrame(resolve));

    console.log('[GameScene] Initializing game with canvas:', {
      canvas: this.canvas,
      dimensions: {
        width: this.canvas.width,
        height: this.canvas.height,
        displayWidth: this.canvas.style.width,
        displayHeight: this.canvas.style.height
      }
    });

    // Get pre-game config
    const preGameConfig = (window as any).__preGameConfig;
    delete (window as any).__preGameConfig;

    // Create map generation config
    let mapGenConfig: MapGenerationConfig;

    if (preGameConfig) {
      const sizePresets = {
        SMALL: { width: 20, height: 20 },
        MEDIUM: { width: 30, height: 30 },
        LARGE: { width: 40, height: 40 },
        HUGE: { width: 50, height: 50 }
      };

      const preset = sizePresets[preGameConfig.mapSize as keyof typeof sizePresets] || sizePresets.MEDIUM;

      mapGenConfig = {
        width: preset.width,
        height: preset.height,
        cellSize: 32,
        biome: preGameConfig.biome,
        difficulty: preGameConfig.difficulty,
        seed: Date.now(),
        pathComplexity: 0.7,
        obstacleCount: Math.floor(preset.width * preset.height * 0.1),
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: 3,
        openAreaCount: 2,
        playerAdvantageSpots: 2,
      };
    } else {
      // Fallback config
      const gameConfig = applySettingsToGame((window as any).gameSettings || {
        difficulty: "NORMAL",
        masterVolume: 0.7,
        soundEnabled: true,
        visualQuality: "MEDIUM",
        showFPS: false,
        mapSize: "MEDIUM",
        terrain: "FOREST",
        pathComplexity: "SIMPLE",
      });

      mapGenConfig = {
        width: gameConfig.mapConfig.width,
        height: gameConfig.mapConfig.height,
        cellSize: gameConfig.mapConfig.cellSize,
        biome: gameConfig.mapConfig.biome.toUpperCase() as BiomeType,
        difficulty: MapDifficulty.MEDIUM, // Default to medium
        seed: Date.now(),
        pathComplexity: gameConfig.mapConfig.pathComplexity,
        obstacleCount: Math.floor(
          gameConfig.mapConfig.width * gameConfig.mapConfig.height * 0.1
        ),
        decorationLevel: DecorationLevel.DENSE,
        enableWater: true,
        enableAnimations: true,
        chokePointCount: 3,
        openAreaCount: 2,
        playerAdvantageSpots: 2,
      };
    }

    // Create game instance
    this.game = new GameWithEvents(this.canvas, mapGenConfig);

    // Store globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).game = this.game;
    }
    
    // Set up canvas event listeners now that game is initialized
    this.setupCanvasEventListeners();

    // Set up game end handler
    this.gameEndHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { victory, stats } = customEvent.detail;
      
      // Store game stats for game over scene
      if (this.game) {
        (window as any).__gameStats = {
          score: stats?.score || this.game.getScore(),
          wave: stats?.wave || 1,
          enemiesKilled: stats?.enemiesKilled || 0,
          towersBuilt: stats?.towersBuilt || 0,
          timeSurvived: stats?.timeSurvived || 0,
          victory: victory || false
        };
      }
      
      // Switch to game over scene
      this.manager.switchTo('gameOver', {
        type: TransitionType.FADE
      });
    };
    document.addEventListener('gameEnd', this.gameEndHandler);

    // Set up game UI - pass the game container, not document.body
    const gameContainer = document.getElementById('scene-game-container');
    if (!gameContainer) {
      throw new Error('Game container not found');
    }
    
    const audioManager = this.manager.getAudioManager();
    await setupGameUI({
      game: this.game,
      container: gameContainer,
      canvas: this.canvas,
      audioManager: audioManager || undefined,
      showInstructions: true,
      enableTouch: 'ontouchstart' in window || isMobile(window.innerWidth),
      enableHapticFeedback: true,
      debugMode: false,
    });

    // Ensure canvas is properly sized before starting
    this.resizeCanvas();

    // Start the game
    this.game.start();
    
    // Log for debugging
    console.log('[GameScene] Game started', {
      canvas: this.canvas,
      dimensions: {
        width: this.canvas.width,
        height: this.canvas.height,
        displayWidth: this.canvas.style.width,
        displayHeight: this.canvas.style.height
      },
      game: this.game,
      gameState: this.game.getGameState(),
      isPaused: this.game.isPaused()
    });

    // Force an initial render after a short delay
    setTimeout(() => {
      if (this.game) {
        console.log('[GameScene] Forcing initial render');
        const camera = this.game.getCamera();
        const player = this.game.getPlayer();
        if (camera && player) {
          camera.centerOnTarget(player.position);
        }
      }
    }, 100);
  }
  
  private setupCanvasEventListeners(): void {
    if (!this.canvas || !this.game) return;
    
    // Mouse down handler
    this.canvasEventHandlers.mousedown = (e: MouseEvent) => {
      if (!this.game) return;
      e.preventDefault();
      this.game.handleMouseDown(e);
    };
    
    // Mouse up handler
    this.canvasEventHandlers.mouseup = (e: MouseEvent) => {
      if (!this.game) return;
      e.preventDefault();
      this.game.handleMouseUp(e);
    };
    
    // Mouse move handler
    this.canvasEventHandlers.mousemove = (e: MouseEvent) => {
      if (!this.game) return;
      e.preventDefault();
      this.game.handleMouseMove(e);
    };
    
    // Wheel handler for zooming
    this.canvasEventHandlers.wheel = (e: WheelEvent) => {
      if (!this.game) return;
      e.preventDefault();
      this.game.handleMouseWheel(e);
    };
    
    // Prevent context menu
    this.canvasEventHandlers.contextmenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // Mouse leave handler - stop shooting when cursor leaves canvas
    this.canvasEventHandlers.mouseleave = () => {
      if (!this.game) return;
      this.game.handleMouseUp(new MouseEvent('mouseup'));
    };
    
    // Add all event listeners to canvas
    this.canvas.addEventListener('mousedown', this.canvasEventHandlers.mousedown);
    this.canvas.addEventListener('mouseup', this.canvasEventHandlers.mouseup);
    this.canvas.addEventListener('mousemove', this.canvasEventHandlers.mousemove);
    this.canvas.addEventListener('wheel', this.canvasEventHandlers.wheel);
    this.canvas.addEventListener('contextmenu', this.canvasEventHandlers.contextmenu);
    this.canvas.addEventListener('mouseleave', this.canvasEventHandlers.mouseleave);
    
    // Make canvas focusable and focus it
    this.canvas.tabIndex = 1;
    this.canvas.focus();
    
    // Global event handlers to stop shooting when mouse is released outside canvas
    this.canvasEventHandlers.globalMouseup = () => {
      if (!this.game) return;
      this.game.handleMouseUp(new MouseEvent('mouseup'));
    };
    
    // Window blur handler - stop shooting when window loses focus
    this.canvasEventHandlers.windowBlur = () => {
      if (!this.game) return;
      this.game.handleMouseUp(new MouseEvent('mouseup'));
    };
    
    // Add global event listeners
    window.addEventListener('mouseup', this.canvasEventHandlers.globalMouseup);
    window.addEventListener('blur', this.canvasEventHandlers.windowBlur);
    
    console.log('[GameScene] Canvas event listeners set up');
  }
  
  private removeCanvasEventListeners(): void {
    if (!this.canvas) return;
    
    // Remove all canvas event listeners
    if (this.canvasEventHandlers.mousedown) {
      this.canvas.removeEventListener('mousedown', this.canvasEventHandlers.mousedown);
    }
    if (this.canvasEventHandlers.mouseup) {
      this.canvas.removeEventListener('mouseup', this.canvasEventHandlers.mouseup);
    }
    if (this.canvasEventHandlers.mousemove) {
      this.canvas.removeEventListener('mousemove', this.canvasEventHandlers.mousemove);
    }
    if (this.canvasEventHandlers.wheel) {
      this.canvas.removeEventListener('wheel', this.canvasEventHandlers.wheel);
    }
    if (this.canvasEventHandlers.contextmenu) {
      this.canvas.removeEventListener('contextmenu', this.canvasEventHandlers.contextmenu);
    }
    if (this.canvasEventHandlers.mouseleave) {
      this.canvas.removeEventListener('mouseleave', this.canvasEventHandlers.mouseleave);
    }
    
    // Remove global event listeners
    if (this.canvasEventHandlers.globalMouseup) {
      window.removeEventListener('mouseup', this.canvasEventHandlers.globalMouseup);
    }
    if (this.canvasEventHandlers.windowBlur) {
      window.removeEventListener('blur', this.canvasEventHandlers.windowBlur);
    }
    
    this.canvasEventHandlers = {};
  }
}