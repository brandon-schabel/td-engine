// Immediate camera debugging helper
export class CameraDebugger {
  static logCameraState(camera: any, player: any, canvas: HTMLCanvasElement) {
    const cameraInfo = camera.getCameraInfo();
    const playerScreenPos = camera.worldToScreen(player.position);
    const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    
    console.log("=== CAMERA DEBUG STATE ===");
    console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
    console.log("Canvas center:", canvasCenter);
    console.log("Player world position:", player.position);
    console.log("Player screen position:", playerScreenPos);
    console.log("Camera position (top-left):", cameraInfo.position);
    console.log("Camera center:", cameraInfo.center);
    console.log("Zoom:", cameraInfo.zoom);
    console.log("Following:", cameraInfo.followTarget);
    
    // Calculate expected camera position for perfect centering
    const expectedCameraX = player.position.x - (canvas.width / 2) / cameraInfo.zoom;
    const expectedCameraY = player.position.y - (canvas.height / 2) / cameraInfo.zoom;
    console.log("Expected camera position for centering:", { x: expectedCameraX, y: expectedCameraY });
    
    // Calculate offset
    const offsetX = playerScreenPos.x - canvasCenter.x;
    const offsetY = playerScreenPos.y - canvasCenter.y;
    console.log("Player offset from center:", { x: offsetX, y: offsetY });
    console.log("Distance from center:", Math.sqrt(offsetX * offsetX + offsetY * offsetY));
    
    return {
      playerScreenPos,
      canvasCenter,
      offset: { x: offsetX, y: offsetY },
      distance: Math.sqrt(offsetX * offsetX + offsetY * offsetY)
    };
  }
}