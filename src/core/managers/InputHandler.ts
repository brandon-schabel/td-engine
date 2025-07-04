import type { Vector2 } from "@/utils/Vector2";
import type { Camera } from "@/systems/Camera";
import type { Game } from "@/core/Game";
import { TowerType } from "@/entities/Tower";
import { GameState } from "@/core/GameState";

/**
 * Callback interface for input events
 */
export interface InputCallbacks {
  onPlayerClicked?: () => void;
  onTowerSelected?: (tower: any) => void;
  onTowerDeselected?: () => void;
  onTowerPlaced?: () => void;
  onProjectileFired?: (projectile: any) => void;
  onTowerTypeSelected?: (type: TowerType | null) => void;
  onDebugModeToggled?: (enabled: boolean) => void;
  onVisualDebugToggled?: (enabled: boolean) => void;
}

/**
 * Handles all input events for the game including mouse and keyboard interactions
 */
export class InputHandler {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private game: Game;
  private callbacks: InputCallbacks;

  // Input state
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private debugMode: boolean = false;

  constructor(canvas: HTMLCanvasElement, camera: Camera, game: Game, callbacks: InputCallbacks = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.game = game;
    this.callbacks = callbacks;
  }

  /**
   * Get current mouse position in world coordinates
   */
  getMousePosition(): Vector2 {
    return { ...this.mousePosition };
  }

  /**
   * Get current debug mode state
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown(event: MouseEvent): void {
    // Get mouse position accounting for pixel ratio
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Calculate position relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to actual canvas coordinates (accounting for CSS scaling)
    const screenPos = {
      x: x * (this.canvas.width / pixelRatio) / rect.width,
      y: y * (this.canvas.height / pixelRatio) / rect.height
    };

    const worldPos = this.camera.screenToWorld(screenPos);

    if (this.game.getEngine().getState() !== GameState.PLAYING) {
      return;
    }

    const player = this.game.getPlayer();
    const towers = this.game.getTowers();
    const selectedTowerType = this.game.getSelectedTowerType();
    const selectedTower = this.game.getSelectedTower();

    // Check if clicking on player
    if (player.distanceTo(worldPos) <= player.radius) {
      // Trigger player upgrade panel
      if (this.callbacks.onPlayerClicked) {
        this.callbacks.onPlayerClicked();
      } else {
        // Fallback to custom event
        const playerClickEvent = new CustomEvent("playerClicked");
        document.dispatchEvent(playerClickEvent);
      }
      return;
    }

    // Check if clicking on existing tower - use larger click radius for easier selection
    const CLICK_RADIUS_MULTIPLIER = 1.5; // Make towers easier to click
    const clickedTower = towers.find(
      (tower) => tower.distanceTo(worldPos) <= tower.radius * CLICK_RADIUS_MULTIPLIER
    );

    if (clickedTower) {
      // Toggle tower selection
      if (selectedTower === clickedTower) {
        this.game.deselectTower();
        if (this.callbacks.onTowerDeselected) {
          this.callbacks.onTowerDeselected();
        }
      } else {
        this.game.selectTower(clickedTower);
        if (this.callbacks.onTowerSelected) {
          this.callbacks.onTowerSelected(clickedTower);
        }
        this.game.setJustSelectedTower(true);
        // Clear the flag after a short delay
        setTimeout(() => {
          this.game.setJustSelectedTower(false);
        }, 500);
      }
      this.game.setSelectedTowerType(null); // Clear tower placement mode
      return; // Important: return early to prevent deselection logic
    } else if (selectedTowerType && !this.game.isJustSelectedTowerType()) {
      // Place new tower (only if we didn't just select from menu)
      if (this.game.placeTower(selectedTowerType, worldPos)) {
        // Clear selection after successful placement
        this.game.setSelectedTowerType(null);
        if (this.callbacks.onTowerPlaced) {
          this.callbacks.onTowerPlaced();
        } else {
          // Fallback to custom event
          const towerPlacedEvent = new CustomEvent('towerPlaced');
          document.dispatchEvent(towerPlacedEvent);
        }
      } else {
        // Provide feedback for failed placement
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]); // Error vibration pattern
        }
      }
    } else {
      // Manual shooting - start click and hold
      const projectile = player.handleMouseDown(worldPos);
      if (projectile && this.callbacks.onProjectileFired) {
        this.callbacks.onProjectileFired(projectile);
      }

      // Only deselect tower if we didn't just select one
      if (selectedTower && !this.game.isJustSelectedTower()) {
        this.game.deselectTower();
        if (this.callbacks.onTowerDeselected) {
          this.callbacks.onTowerDeselected();
        }
      }
    }
  }

  /**
   * Handle mouse up event
   */
  handleMouseUp(_event: MouseEvent): void {
    const player = this.game.getPlayer();
    player.handleMouseUp();
  }

  /**
   * Handle mouse move event
   */
  handleMouseMove(event: MouseEvent): void {
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();

    // Calculate position relative to canvas in CSS pixels
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // The camera expects logical coordinates (CSS pixels), not physical pixels
    // This matches how touch coordinates are handled in TouchInputManager
    const screenPos = { x, y };

    const worldPos = this.camera.screenToWorld(screenPos);

    // Debug logging
    if (this.debugMode) {
      console.log('[Mouse] Screen pos:', screenPos, 'World pos:', worldPos);
    }

    // Update mouse position for ghost tower rendering
    this.mousePosition = worldPos;

    // Update player aim position
    const player = this.game.getPlayer();
    player.handleMouseMove(worldPos);

    // Find tower under mouse for range display
    const towers = this.game.getTowers();
    const hoverTower = towers.find((tower) => tower.distanceTo(worldPos) <= tower.radius) || null;
    this.game.setHoverTower(hoverTower);
  }

  /**
   * Handle mouse click event (alias for backward compatibility)
   */
  handleMouseClick(event: MouseEvent): void {
    this.handleMouseDown(event);
  }

  /**
   * Handle mouse wheel event for zooming
   */
  handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    // Determine zoom direction
    const zoomIn = event.deltaY < 0;

    // Use camera controller methods through game
    if (zoomIn) {
      this.game.zoomIn();
    } else {
      this.game.zoomOut();
    }
  }

  /**
   * Handle keyboard down event
   */
  handleKeyDown(key: string): void {
    const player = this.game.getPlayer();

    // Forward movement keys to player
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(key)
    ) {
      player.handleKeyDown(key);
    }

    // Handle zoom controls
    switch (key) {
      case "=":
      case "+":
        this.game.zoomIn();
        break;
      case "-":
      case "_":
        this.game.zoomOut();
        break;
      case "0":
        this.game.setZoom(1.0); // Reset to default zoom
        break;
      case "f":
      case "F":
        this.game.zoomToFit();
        break;
      case "c":
      case "C":
        this.game.toggleCameraFollow();
        break;
      case "b":
      case "B":
        // Check camera
        this.game.checkCamera();
        break;

      case "n":
      case "N":
        // Fix camera
        this.game.fixCamera();
        break;
      case "d":
      case "D":
        // Debug camera (only when combined with Shift)
        if (key === "D") {
          this.game.debugCamera();
        }
        break;
      case "v":
      case "V":
        // Toggle visual debug mode
        const visualDebugEnabled = key === "V";
        this.game.getRenderer().setDebugMode(visualDebugEnabled);
        console.log(`Visual debug mode: ${visualDebugEnabled ? "ON" : "OFF"}`);
        if (this.callbacks.onVisualDebugToggled) {
          this.callbacks.onVisualDebugToggled(visualDebugEnabled);
        }
        break;

      case "m":
      case "M":
        // Toggle mouse/coordinate debug mode
        this.debugMode = !this.debugMode;
        console.log(`Coordinate debug mode: ${this.debugMode ? "ON" : "OFF"}`);
        if (this.debugMode) {
          console.log("Mouse coordinates will be logged to console");
        }
        if (this.callbacks.onDebugModeToggled) {
          this.callbacks.onDebugModeToggled(this.debugMode);
        }
        break;

      // Tower selection hotkeys
      case "1":
        this.game.setSelectedTowerType(TowerType.BASIC);
        if (this.callbacks.onTowerTypeSelected) {
          this.callbacks.onTowerTypeSelected(TowerType.BASIC);
        }
        console.log('[InputHandler] Selected tower: BASIC');
        break;
      case "2":
        this.game.setSelectedTowerType(TowerType.SNIPER);
        if (this.callbacks.onTowerTypeSelected) {
          this.callbacks.onTowerTypeSelected(TowerType.SNIPER);
        }
        console.log('[InputHandler] Selected tower: SNIPER');
        break;
      case "3":
        this.game.setSelectedTowerType(TowerType.RAPID);
        if (this.callbacks.onTowerTypeSelected) {
          this.callbacks.onTowerTypeSelected(TowerType.RAPID);
        }
        console.log('[InputHandler] Selected tower: RAPID');
        break;
      case "4":
        this.game.setSelectedTowerType(TowerType.WALL);
        if (this.callbacks.onTowerTypeSelected) {
          this.callbacks.onTowerTypeSelected(TowerType.WALL);
        }
        console.log('[InputHandler] Selected tower: WALL');
        break;
      // Pathfinding debug controls
      case "p":
        const PathfindingDebugP = (window as any).PathfindingDebug;
        if (PathfindingDebugP) {
          PathfindingDebugP.togglePaths();
        }
        break;
      case "g":
        const PathfindingDebugG = (window as any).PathfindingDebug;
        if (PathfindingDebugG) {
          PathfindingDebugG.toggleNavGrid();
        }
        break;
      case "escape":
        // Clear tower selection
        if (this.game.getSelectedTowerType()) {
          this.game.setSelectedTowerType(null);
          if (this.callbacks.onTowerTypeSelected) {
            this.callbacks.onTowerTypeSelected(null);
          }
          console.log('[InputHandler] Cleared tower selection');
        }
        break;
    }
  }

  /**
   * Handle keyboard up event
   */
  handleKeyUp(key: string): void {
    const player = this.game.getPlayer();

    // Forward movement keys to player
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(key)
    ) {
      player.handleKeyUp(key);
    }
  }
}