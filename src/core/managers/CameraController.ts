import type { Camera } from "@/systems/Camera";
import type { CameraDiagnostics } from "@/systems/CameraDiagnostics";
import type { Player } from "@/entities/Player";
import type { Renderer } from "@/systems/Renderer";
import { CAMERA_CONFIG } from "@/config/UIConfig";

/**
 * Manages camera controls and diagnostics for the game
 */
export class CameraController {
  private camera: Camera;
  private cameraDiagnostics: CameraDiagnostics;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;

  constructor(
    camera: Camera,
    cameraDiagnostics: CameraDiagnostics,
    renderer: Renderer,
    canvas: HTMLCanvasElement
  ) {
    this.camera = camera;
    this.cameraDiagnostics = cameraDiagnostics;
    this.renderer = renderer;
    this.canvas = canvas;
  }

  /**
   * Zoom the camera in
   * @param factor Optional zoom factor, defaults to configured zoom speed
   */
  zoomIn(factor?: number): void {
    this.camera.zoomIn(factor);
  }

  /**
   * Zoom the camera out
   * @param factor Optional zoom factor, defaults to configured zoom speed
   */
  zoomOut(factor?: number): void {
    this.camera.zoomOut(factor);
  }

  /**
   * Set the camera zoom level
   * @param zoom The zoom level to set
   */
  setZoom(zoom: number): void {
    this.camera.setZoom(zoom);
  }

  /**
   * Get the current zoom level
   * @returns The current zoom level
   */
  getZoom(): number {
    return this.camera.getZoom();
  }

  /**
   * Zoom to fit the entire world in view
   */
  zoomToFit(): void {
    this.camera.zoomToFit();
  }

  /**
   * Toggle camera following of the player
   * @returns The new follow state
   */
  toggleCameraFollow(): boolean {
    const newFollowState = !this.camera.isFollowingTarget();
    this.camera.setFollowTarget(newFollowState);
    return newFollowState;
  }

  /**
   * Reset camera to follow the player
   */
  resetCameraToPlayer(): void {
    this.camera.setFollowTarget(true);
  }

  /**
   * Pan the camera by the specified amount
   * @param deltaX Horizontal pan amount
   * @param deltaY Vertical pan amount
   */
  panCamera(deltaX: number, deltaY: number): void {
    this.camera.pan(deltaX, deltaY);
  }

  /**
   * Run camera diagnostics
   * @param player The player entity
   */
  runCameraDiagnostics(player: Player): void {
    this.cameraDiagnostics.diagnose(player, this.canvas);
  }

  /**
   * Test camera centering on the player
   * @param player The player entity
   */
  testCameraCentering(player: Player): void {
    this.cameraDiagnostics.testCentering(player);
  }

  /**
   * Toggle visual debug mode
   */
  toggleVisualDebug(): void {
    this.cameraDiagnostics.toggleVisualDebug();
    const enabled = this.cameraDiagnostics.isVisualDebugEnabled();

    // Also toggle renderer debug mode
    this.renderer.setDebugMode(enabled);

    console.log(`Camera visual debug: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    if (enabled) {
      console.log("Green crosshair = screen center, Yellow circle = player position");
      console.log("Red dashed line = distance from center to player");
    }
  }

  /**
   * Check camera positioning and log diagnostic information
   * @param player The player entity
   */
  checkCamera(player: Player): void {
    const cameraInfo = this.camera.getCameraInfo();
    const cameraPos = cameraInfo.position;
    const playerPos = player.position;
    const zoom = cameraInfo.zoom;
    const isFollowing = cameraInfo.followTarget;

    // Get canvas dimensions from renderer's viewport
    const canvasWidth = this.renderer.getViewportWidth();
    const canvasHeight = this.renderer.getViewportHeight();

    // Calculate where player appears on screen
    const playerScreenX = (playerPos.x - cameraPos.x) * zoom;
    const playerScreenY = (playerPos.y - cameraPos.y) * zoom;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Distance from center
    const distance = Math.sqrt(
      Math.pow(playerScreenX - centerX, 2) +
      Math.pow(playerScreenY - centerY, 2)
    );

    console.log("=== CAMERA DIAGNOSTIC ===");
    console.log("Canvas Info:", {
      actualSize: { width: this.canvas.width, height: this.canvas.height },
      cssSize: { width: this.canvas.offsetWidth, height: this.canvas.offsetHeight },
      pixelRatio: window.devicePixelRatio || 1
    });
    console.log("Camera Info:", {
      following: isFollowing,
      position: cameraPos,
      center: cameraInfo.center,
      zoom: zoom.toFixed(2),
      viewport: cameraInfo.viewportSize
    });
    console.log("Player Info:", {
      worldPos: playerPos,
      screenPos: { x: playerScreenX.toFixed(0), y: playerScreenY.toFixed(0) },
      velocity: player.getVelocity(),
      isMoving: player.isMoving()
    });
    console.log(`Expected center: (${centerX}, ${centerY})`);
    console.log(`Distance from center: ${distance.toFixed(1)}px`);
    console.log(`Status: ${distance < 10 ? "✅ CENTERED" : "❌ OFF-CENTER"}`);

    if (distance > 10) {
      console.log("\nTo fix, camera should be at:");
      console.log({
        x: playerPos.x - centerX / zoom,
        y: playerPos.y - centerY / zoom,
      });
    }
  }

  /**
   * Fix camera positioning by centering on player
   * @param player The player entity
   */
  fixCamera(player: Player): void {
    console.log("Fixing camera...");

    // Log current state before fix
    const beforeInfo = this.camera.getCameraInfo();
    console.log("Before fix:", {
      following: beforeInfo.followTarget,
      cameraPos: beforeInfo.position,
      playerPos: player.position
    });

    // Force enable following and center
    this.camera.enableFollowingAndCenter(player.position);

    // Log state after fix
    const afterInfo = this.camera.getCameraInfo();
    console.log("After fix:", {
      following: afterInfo.followTarget,
      cameraPos: afterInfo.position,
      playerPos: player.position
    });

    console.log("Camera fixed! Following enabled and centered on player.");
    this.checkCamera(player); // Run check to verify
  }

  /**
   * Debug camera following behavior
   * @param player The player entity
   */
  debugCamera(player: Player): void {
    console.log("=== CAMERA DEBUG MODE ===");

    // Log current state
    const cameraInfo = this.camera.getCameraInfo();
    console.log("Current camera state:", cameraInfo);

    // Test player movement
    const startPos = { ...player.position };
    console.log("Testing player movement...");

    // Move player a bit
    player.position.x += 100;
    player.position.y += 100;

    // Update camera
    this.camera.update(player.position);

    const newCameraInfo = this.camera.getCameraInfo();
    console.log("After moving player +100,+100:");
    console.log("  Player moved from", startPos, "to", player.position);
    console.log("  Camera moved from", cameraInfo.position, "to", newCameraInfo.position);

    // Restore player position
    player.position = startPos;

    // Test instant centering
    console.log("\nTesting instant centering...");
    this.camera.centerOnTarget(player.position);
    const centeredInfo = this.camera.getCameraInfo();
    console.log("  Camera after centerOnTarget:", centeredInfo.position);

    this.checkCamera(player);
  }

  /**
   * Handle mouse wheel for zooming
   * @param event The wheel event
   */
  handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    // Determine zoom direction and factor from configuration
    const zoomIn = event.deltaY < 0;
    const zoomFactor = CAMERA_CONFIG.zoomSpeed;

    // Simple zoom without center point for now (can be enhanced later)
    if (zoomIn) {
      this.camera.zoomIn(zoomFactor);
    } else {
      this.camera.zoomOut(zoomFactor);
    }
  }
}