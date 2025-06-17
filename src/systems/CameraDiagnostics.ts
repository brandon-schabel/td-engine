// Add this diagnostic class to help identify the issue

export class CameraDiagnostics {
  private game: any;
  private logInterval: number | null = null;

  constructor(game: any) {
    this.game = game;
  }

  // Start continuous logging
  startDiagnostics(): void {
    console.log("=== CAMERA DIAGNOSTICS STARTED ===");

    this.logInterval = window.setInterval(() => {
      this.logCameraState();
    }, 500); // Log every 500ms
  }

  // Stop logging
  stopDiagnostics(): void {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
      console.log("=== CAMERA DIAGNOSTICS STOPPED ===");
    }
  }

  // One-time diagnostic check
  diagnose(): void {
    console.group("🔍 CAMERA DIAGNOSTIC REPORT");

    const camera = this.game.getCamera();
    const player = this.game.getPlayer();
    const canvas = this.game.canvas;

    // Basic info
    console.log("📊 Basic Info:");
    console.log("- Canvas size:", canvas.width, "x", canvas.height);
    console.log(
      "- World size:",
      this.game.grid.width * this.game.grid.cellSize,
      "x",
      this.game.grid.height * this.game.grid.cellSize
    );
    console.log("- Cell size:", this.game.grid.cellSize);

    // Camera state
    const cameraPos = camera.getPosition();
    const zoom = camera.getZoom();
    const isFollowing = camera.isFollowingTarget();

    console.log("\n📷 Camera State:");
    console.log("- Position:", cameraPos);
    console.log("- Zoom:", zoom);
    console.log("- Following enabled:", isFollowing);

    // Player state
    const playerPos = player.position;
    console.log("\n👤 Player State:");
    console.log("- Position:", playerPos);
    console.log("- Is alive:", player.isAlive);

    // Calculate where player should appear on screen
    const expectedScreenX = (playerPos.x - cameraPos.x) * zoom;
    const expectedScreenY = (playerPos.y - cameraPos.y) * zoom;

    console.log("\n📐 Calculations:");
    console.log("- Player screen position:", {
      x: expectedScreenX,
      y: expectedScreenY,
    });
    console.log("- Canvas center:", {
      x: canvas.width / 2,
      y: canvas.height / 2,
    });

    // Distance from center
    const distanceX = Math.abs(expectedScreenX - canvas.width / 2);
    const distanceY = Math.abs(expectedScreenY - canvas.height / 2);
    const totalDistance = Math.sqrt(
      distanceX * distanceX + distanceY * distanceY
    );

    console.log("- Distance from center:", {
      x: distanceX,
      y: distanceY,
      total: totalDistance,
    });

    // Diagnosis
    console.log("\n🏥 Diagnosis:");

    if (!isFollowing) {
      console.error("❌ Camera following is DISABLED!");
      console.log("   Fix: game.getCamera().setFollowTarget(true)");
    }

    if (totalDistance > 50) {
      console.error("❌ Player is NOT centered! Distance:", totalDistance);
      console.log("   Expected camera position for centered player:", {
        x: playerPos.x - canvas.width / (2 * zoom),
        y: playerPos.y - canvas.height / (2 * zoom),
      });
    } else {
      console.log("✅ Player is properly centered");
    }

    // Check if camera update is being called
    console.log("\n🔄 Update Check:");
    const oldPos = { ...cameraPos };
    camera.update(playerPos);
    const newPos = camera.getPosition();

    if (oldPos.x === newPos.x && oldPos.y === newPos.y) {
      console.warn("⚠️ Camera position did not change after update()");
    } else {
      console.log("✅ Camera position changed after update()");
    }

    console.groupEnd();
  }

  // Log current state
  private logCameraState(): void {
    const camera = this.game.getCamera();
    const player = this.game.getPlayer();
    const canvas = this.game.canvas;

    const cameraPos = camera.getPosition();
    const playerPos = player.position;
    const zoom = camera.getZoom();

    const screenX = (playerPos.x - cameraPos.x) * zoom;
    const screenY = (playerPos.y - cameraPos.y) * zoom;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const distance = Math.sqrt(
      Math.pow(screenX - centerX, 2) + Math.pow(screenY - centerY, 2)
    );

    console.log(
      `[CAM] Pos:(${cameraPos.x.toFixed(0)},${cameraPos.y.toFixed(0)}) | ` +
        `Player:(${playerPos.x.toFixed(0)},${playerPos.y.toFixed(0)}) | ` +
        `Screen:(${screenX.toFixed(0)},${screenY.toFixed(0)}) | ` +
        `Dist:${distance.toFixed(0)}px | ` +
        `Follow:${camera.isFollowingTarget()}`
    );
  }

  // Test camera centering
  testCentering(): void {
    console.log("🧪 Testing camera centering...");

    const camera = this.game.getCamera();
    const player = this.game.getPlayer();

    // Save current state
    const originalPos = camera.getPosition();
    const originalFollow = camera.isFollowingTarget();

    // Test 1: Direct position setting
    console.log("\nTest 1: Direct position setting");
    const targetPos = {
      x: player.position.x - this.game.canvas.width / (2 * camera.getZoom()),
      y: player.position.y - this.game.canvas.height / (2 * camera.getZoom()),
    };
    camera.setPosition(targetPos);
    console.log("- Set position to:", targetPos);
    console.log("- Actual position:", camera.getPosition());

    // Test 2: centerOnTarget method
    console.log("\nTest 2: centerOnTarget method");
    camera.centerOnTarget(player.position);
    console.log("- After centerOnTarget:", camera.getPosition());

    // Test 3: Enable following and update
    console.log("\nTest 3: Following + update");
    camera.setFollowTarget(true);
    camera.update(player.position);
    console.log("- After update:", camera.getPosition());

    // Restore original state
    camera.setPosition(originalPos);
    camera.setFollowTarget(originalFollow);

    console.log("\n✅ Test complete - original state restored");
  }
}

// Usage in your Game class:
// Add this property to Game class:
// private cameraDiagnostics: CameraDiagnostics;

// In constructor after creating camera:
// this.cameraDiagnostics = new CameraDiagnostics(this);

// Add these methods to Game class:
/*
public runCameraDiagnostics(): void {
  this.cameraDiagnostics.diagnose();
}

public startCameraLogging(): void {
  this.cameraDiagnostics.startDiagnostics();
}

public stopCameraLogging(): void {
  this.cameraDiagnostics.stopDiagnostics();
}

public testCameraCentering(): void {
  this.cameraDiagnostics.testCentering();
}
*/

// In your UI or console:
// game.runCameraDiagnostics();     // One-time diagnostic
// game.startCameraLogging();       // Start continuous logging
// game.testCameraCentering();      // Test centering functions
