// Simple camera centering test

export function testCameraCenter(game: any) {
  console.log("=== SIMPLE CAMERA TEST ===");
  
  const camera = game.getCamera();
  const player = game.getPlayer();
  const canvas = game.canvas;
  
  // Get all the info
  const cameraInfo = camera.getCameraInfo();
  const playerWorld = player.position;
  const playerScreen = camera.worldToScreen(playerWorld);
  
  // What's the actual center of the screen?
  const pixelRatio = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / pixelRatio;
  const cssHeight = canvas.height / pixelRatio;
  
  console.log("1. Canvas actual pixels:", canvas.width, "x", canvas.height);
  console.log("2. Canvas CSS size:", cssWidth, "x", cssHeight);
  console.log("3. Pixel ratio:", pixelRatio);
  console.log("4. Camera viewport thinks it is:", cameraInfo.viewportSize.width, "x", cameraInfo.viewportSize.height);
  console.log("5. Player world position:", playerWorld);
  console.log("6. Player screen position:", playerScreen);
  console.log("7. Expected screen center:", cssWidth / 2, ",", cssHeight / 2);
  console.log("8. Offset from center:", playerScreen.x - cssWidth / 2, ",", playerScreen.y - cssHeight / 2);
  
  // The fix
  console.log("\n--- THE FIX ---");
  console.log("Camera should use CSS dimensions:", cssWidth, "x", cssHeight);
  console.log("NOT canvas pixel dimensions:", canvas.width, "x", canvas.height);
  
  return {
    playerScreen,
    expectedCenter: { x: cssWidth / 2, y: cssHeight / 2 },
    offset: {
      x: playerScreen.x - cssWidth / 2,
      y: playerScreen.y - cssHeight / 2
    }
  };
}