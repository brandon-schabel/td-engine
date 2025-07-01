import React, { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GameWithEvents } from "@/core/GameWithEvents";
import { GameUI, GameOverlayUI } from "@/ui/react/components/game/GameUI";
import { GameNotificationsProvider } from "@/ui/react/components/game/GameNotifications";
import { cn } from "@/lib/utils";
import type { MapGenerationConfig } from "@/types/MapData";
import {
  BiomeType,
  MapDifficulty,
  MapSize,
  DecorationLevel,
} from "@/types/MapData";

export const Route = createFileRoute("/game")({
  component: GameScene,
  validateSearch: (search) => ({
    resume: search.resume === true,
  }),
});

function GameScene() {
  const navigate = useNavigate();
  const { resume } = Route.useSearch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameWithEvents | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);

  // Initialize game when component mounts
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const initGame = async () => {
      try {
        console.log("[GameScene] Initializing game...");

        // Get pre-game config
        const preGameConfig = (window as any).__preGameConfig || {
          mapSize: MapSize.MEDIUM,
          difficulty: MapDifficulty.MEDIUM,
          biome: BiomeType.FOREST,
        };

        console.log("[GameScene] Pre-game config:", preGameConfig);

        // Create map config
        const mapConfig: MapGenerationConfig = {
          width: getMapDimensions(preGameConfig.mapSize),
          height: getMapDimensions(preGameConfig.mapSize),
          cellSize: 32,
          seed: Date.now(),
          biome: preGameConfig.biome,
          difficulty: preGameConfig.difficulty,
          decorationLevel: DecorationLevel.MODERATE,
          pathComplexity: 0.5,
          obstacleCount: 20,
          enableWater: false,
          enableAnimations: true,
          chokePointCount: 3,
          openAreaCount: 2,
          playerAdvantageSpots: 2,
        };

        console.log("[GameScene] Map config:", mapConfig);

        // Set up canvas dimensions BEFORE creating game
        const rect = containerRef.current!.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;

        console.log("[GameScene] Container dimensions:", {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          containerElement: containerRef.current,
        });

        // Set canvas pixel dimensions
        canvasRef.current!.width = rect.width * pixelRatio;
        canvasRef.current!.height = rect.height * pixelRatio;

        // Set canvas CSS dimensions
        canvasRef.current!.style.width = rect.width + "px";
        canvasRef.current!.style.height = rect.height + "px";

        // Log canvas dimensions after setup
        console.log("[GameScene] Canvas setup complete:", {
          pixelWidth: canvasRef.current!.width,
          pixelHeight: canvasRef.current!.height,
          cssWidth: rect.width,
          cssHeight: rect.height,
          pixelRatio: pixelRatio,
          containerRect: rect,
          canvasElement: canvasRef.current,
        });

        // Create game instance
        const game = new GameWithEvents(canvasRef.current!, mapConfig);
        gameRef.current = game;

        // Store game instance globally for debugging
        (window as any).currentGame = game;

        // Start the game
        game.start();
        
        // Load saved game if resuming
        if (resume) {
          console.log("[GameScene] Resuming saved game...");
          const loaded = game.loadGameState();
          if (!loaded) {
            console.error("[GameScene] Failed to load saved game");
            // Optional: Navigate back to main menu or show error
          }
        }
        
        setIsGameInitialized(true);

        console.log("[GameScene] Game initialized successfully");

        // Set up input event listeners
        const handleKeyDown = (e: KeyboardEvent) => {
          // Don't handle input if typing in an input field
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          ) {
            return;
          }
          game.handleKeyDown(e.key);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          // Don't handle input if typing in an input field
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          ) {
            return;
          }
          game.handleKeyUp(e.key);
        };

        const handleWheel = (e: WheelEvent) => {
          // Only handle wheel events on the canvas
          if (e.target === canvasRef.current) {
            e.preventDefault();
            game.handleMouseWheel(e);
          }
        };

        const handleMouseDown = (e: MouseEvent) => {
          if (e.target === canvasRef.current) {
            game.handleMouseDown(e);
          }
        };

        const handleMouseUp = (e: MouseEvent) => {
          if (e.target === canvasRef.current) {
            game.handleMouseUp(e);
          }
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (e.target === canvasRef.current) {
            game.handleMouseMove(e);
          }
        };

        // Attach event listeners
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        canvasRef?.current?.addEventListener("wheel", handleWheel, {
          passive: false,
        });
        canvasRef?.current?.addEventListener("mousedown", handleMouseDown);
        canvasRef?.current?.addEventListener("mouseup", handleMouseUp);
        canvasRef?.current?.addEventListener("mousemove", handleMouseMove);

        // Store cleanup function
        (window as any).__gameInputCleanup = () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
          if (canvasRef.current) {
            canvasRef.current.removeEventListener("wheel", handleWheel);
            canvasRef.current.removeEventListener("mousedown", handleMouseDown);
            canvasRef.current.removeEventListener("mouseup", handleMouseUp);
            canvasRef.current.removeEventListener("mousemove", handleMouseMove);
          }
        };

        // Canvas is already sized properly, just ensure camera is centered
        const camera = game.getCamera();
        const player = game.getPlayer();
        if (camera && player) {
          // Force immediate camera centering on player
          camera.centerOnTarget(player.position);
          console.log(
            "[GameScene] Camera centered on player at:",
            player.position
          );
        }
      } catch (error) {
        console.error("[GameScene] Failed to initialize game:", error);
      }
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        console.log("[GameScene] Cleaning up game...");
        gameRef.current.stop();
        gameRef.current = null;
        setIsGameInitialized(false);
      }

      // Clean up input event listeners
      if ((window as any).__gameInputCleanup) {
        (window as any).__gameInputCleanup();
        delete (window as any).__gameInputCleanup;
      }
    };
  }, []);

  // Handle game end
  useEffect(() => {
    const handleGameEnd = (e: Event) => {
      const event = e as CustomEvent;
      console.log("[GameScene] Game ended:", event.detail);

      // Pass game stats to game over route
      if (typeof window !== "undefined") {
        (window as any).__gameOverStats = event.detail;
      }

      // Navigate to game over route
      navigate({
        to: "/game-over",
      });
    };

    document.addEventListener("gameEnded", handleGameEnd);
    return () => document.removeEventListener("gameEnded", handleGameEnd);
  }, [navigate]);

  // Handle window resize
  useEffect(() => {
    let resizeTimeout: number;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const pixelRatio = window.devicePixelRatio || 1;

          console.log(
            "[GameScene] Resizing canvas to:",
            rect.width,
            "x",
            rect.height
          );
          console.log("[GameScene] Pixel ratio:", pixelRatio);

          // Set canvas CSS dimensions
          canvasRef.current.style.width = rect.width + "px";
          canvasRef.current.style.height = rect.height + "px";

          if (gameRef.current) {
            // Use renderer's updateCanvasSize to handle dimension changes properly
            const renderer = gameRef.current.getRenderer();
            if (renderer) {
              renderer.updateCanvasSize(
                rect.width * pixelRatio,
                rect.height * pixelRatio
              );
            }

            // Update camera viewport with logical dimensions
            const camera = gameRef.current.getCamera();
            if (camera) {
              camera.updateViewport(rect.width, rect.height);
            }
          }
        }
      }, 250); // Debounce resize
    };

    // Wait for DOM to be ready
    setTimeout(() => {
      handleResize(); // Initial size
    }, 100);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isGameInitialized]); // Run when game is initialized

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Canvas container - absolute positioned to fill scene minus control bar */}
      <div
        ref={containerRef}
        id="canvas-container"
        className={cn(
          "absolute",
          "top-0 left-0 right-0",
          "bg-black" // Add background to see if container is visible
        )}
        style={{
          bottom: `calc(60px + env(safe-area-inset-bottom, 0))`,
        }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full",
            "block touch-none",
            "image-crisp-edges"
          )}
        />
      </div>

      {/* Game UI overlay elements */}
      {isGameInitialized && gameRef.current && (
        <GameNotificationsProvider>
          <GameOverlayUI game={gameRef.current} />

          {/* Game UI with control bar */}
          <GameUI game={gameRef.current} />
        </GameNotificationsProvider>
      )}
    </div>
  );
}

// Helper function to get map dimensions based on size
function getMapDimensions(size: MapSize): number {
  switch (size) {
    case MapSize.SMALL:
      return 20;
    case MapSize.MEDIUM:
      return 30;
    case MapSize.LARGE:
      return 40;
    case MapSize.HUGE:
      return 50;
    default:
      return 30;
  }
}
