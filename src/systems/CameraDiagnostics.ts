// CameraDiagnostics.ts - Enhanced camera debugging and visualization
// Changes:
// 1. Added visual debug overlay with crosshair and player indicator
// 2. Updated to work with new camera API (center property)
// 3. Enhanced diagnostic information display
// 4. Added keyboard controls for camera debugging
// 5. Improved test methods for camera centering

import type { Camera } from './Camera';
import type { Player } from '@/entities/Player';

export class CameraDiagnostics {
  private camera: Camera;
  private visualDebugEnabled: boolean = false;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  // Toggle visual debug mode
  toggleVisualDebug(): void {
    this.visualDebugEnabled = !this.visualDebugEnabled;
    console.log(`Camera visual debug: ${this.visualDebugEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  isVisualDebugEnabled(): boolean {
    return this.visualDebugEnabled;
  }

  // Check if player is centered on screen
  checkCentering(player: Player, canvas: HTMLCanvasElement): {
    isCentered: boolean;
    distance: number;
    playerScreenPos: { x: number; y: number };
  } {
    const playerScreenPos = this.camera.worldToScreen(player.position);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const distanceX = Math.abs(playerScreenPos.x - centerX);
    const distanceY = Math.abs(playerScreenPos.y - centerY);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // Consider centered if within 5 pixels
    const isCentered = distance < 5;
    
    return {
      isCentered,
      distance,
      playerScreenPos
    };
  }

  // One-time diagnostic check
  diagnose(player: Player, canvas: HTMLCanvasElement): void {
    console.group("🔍 CAMERA DIAGNOSTIC REPORT");
    
    const cameraInfo = this.camera.getCameraInfo();
    const centeringCheck = this.checkCentering(player, canvas);
    
    // Basic info
    console.log("📊 Basic Info:");
    console.log("- Canvas size:", canvas.width, "x", canvas.height);
    console.log("- Viewport size:", cameraInfo.viewportSize.width, "x", cameraInfo.viewportSize.height);
    console.log("- World bounds:", this.camera.getVisibleBounds());
    
    // Camera state
    console.log("\n📷 Camera State:");
    console.log("- Position (top-left):", cameraInfo.position);
    console.log("- Center:", cameraInfo.center);
    console.log("- Zoom:", cameraInfo.zoom);
    console.log("- Target Zoom:", cameraInfo.targetZoom);
    console.log("- Following enabled:", cameraInfo.followTarget);
    
    // Player state
    console.log("\n👤 Player State:");
    console.log("- World position:", player.position);
    console.log("- Screen position:", centeringCheck.playerScreenPos);
    console.log("- Is alive:", player.isAlive);
    console.log("- Is moving:", player.isMoving());
    
    // Centering analysis
    console.log("\n📐 Centering Analysis:");
    console.log("- Distance from center:", centeringCheck.distance.toFixed(2), "pixels");
    console.log("- Is centered:", centeringCheck.isCentered ? "✅ YES" : "❌ NO");
    
    if (!centeringCheck.isCentered) {
      console.log("- Expected screen position:", canvas.width / 2, canvas.height / 2);
      console.log("- Actual screen position:", centeringCheck.playerScreenPos);
    }
    
    // Diagnosis
    console.log("\n🏥 Diagnosis:");
    
    if (!cameraInfo.followTarget) {
      console.error("❌ Camera following is DISABLED!");
      console.log("   Fix: camera.setFollowTarget(true)");
    }
    
    if (!centeringCheck.isCentered) {
      console.error("❌ Player is NOT centered! Distance:", centeringCheck.distance.toFixed(2));
      console.log("   Fix: camera.centerOnTarget(player.position)");
    } else {
      console.log("✅ Player is properly centered");
    }
    
    // Camera bounds check
    const bounds = cameraInfo.visibleBounds;
    if (bounds.min.x < 0 || bounds.min.y < 0) {
      console.warn("⚠️ Camera is showing area outside world bounds");
    }
    
    console.groupEnd();
  }

  // Render visual debug overlay
  renderDebug(ctx: CanvasRenderingContext2D, player: Player): void {
    if (!this.visualDebugEnabled) return;

    const cameraInfo = this.camera.getCameraInfo();
    const playerScreenPos = this.camera.worldToScreen(player.position);
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;

    // Draw center crosshair
    ctx.save();
    
    // Green crosshair at center
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY);
    ctx.lineTo(centerX + 20, centerY);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX, centerY + 20);
    ctx.stroke();

    // Circle at center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Player position indicator
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(playerScreenPos.x, playerScreenPos.y, player.radius * this.camera.getZoom(), 0, Math.PI * 2);
    ctx.stroke();

    // Line from center to player
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(playerScreenPos.x, playerScreenPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance from center
    const distanceFromCenter = Math.sqrt(
      Math.pow(playerScreenPos.x - centerX, 2) + 
      Math.pow(playerScreenPos.y - centerY, 2)
    );

    // Debug info panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 350, 200);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    const lines = [
      `Camera Following: ${cameraInfo.followTarget ? 'YES' : 'NO'}`,
      `Camera Pos: (${Math.round(cameraInfo.position.x)}, ${Math.round(cameraInfo.position.y)})`,
      `Camera Center: (${Math.round(cameraInfo.center.x)}, ${Math.round(cameraInfo.center.y)})`,
      `Player World: (${Math.round(player.position.x)}, ${Math.round(player.position.y)})`,
      `Player Screen: (${Math.round(playerScreenPos.x)}, ${Math.round(playerScreenPos.y)})`,
      `Viewport Center: (${Math.round(centerX)}, ${Math.round(centerY)})`,
      `Distance from Center: ${Math.round(distanceFromCenter)}px`,
      `Zoom: ${cameraInfo.zoom.toFixed(2)}`,
      `Player Moving: ${player.isMoving() ? 'YES' : 'NO'}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 30 + i * 20);
    });

    ctx.restore();
  }

  // Test camera centering
  testCentering(player: Player): void {
    console.log("🧪 Testing camera centering...");
    
    // Test 1: centerOnTarget method
    console.log("\nTest 1: centerOnTarget method");
    this.camera.centerOnTarget(player.position);
    const afterCenter = this.camera.getCameraInfo();
    console.log("- Camera center after centerOnTarget:", afterCenter.center);
    console.log("- Player position:", player.position);
    console.log("- Match:", 
      Math.abs(afterCenter.center.x - player.position.x) < 1 && 
      Math.abs(afterCenter.center.y - player.position.y) < 1 ? "✅" : "❌"
    );
    
    // Test 2: enableFollowingAndCenter method
    console.log("\nTest 2: enableFollowingAndCenter method");
    this.camera.setFollowTarget(false); // Disable first
    this.camera.enableFollowingAndCenter(player.position);
    const afterEnable = this.camera.getCameraInfo();
    console.log("- Following enabled:", afterEnable.followTarget ? "✅" : "❌");
    console.log("- Centered:", 
      Math.abs(afterEnable.center.x - player.position.x) < 1 && 
      Math.abs(afterEnable.center.y - player.position.y) < 1 ? "✅" : "❌"
    );
    
    // Test 3: Update with following
    console.log("\nTest 3: Update with following");
    for (let i = 0; i < 10; i++) {
      this.camera.update(player.position);
    }
    const afterUpdate = this.camera.getCameraInfo();
    console.log("- Camera converged to player:", 
      Math.abs(afterUpdate.center.x - player.position.x) < 1 && 
      Math.abs(afterUpdate.center.y - player.position.y) < 1 ? "✅" : "❌"
    );
    
    console.log("\n✅ Test complete");
  }

  // Quick fix camera
  fixCamera(player: Player): void {
    console.log("🔧 Fixing camera...");
    this.camera.enableFollowingAndCenter(player.position);
    console.log("✅ Camera fixed - following enabled and centered on player");
  }
}