// Canvas scaling fix for proper camera centering

export interface CanvasInfo {
  width: number;          // Actual canvas width in pixels
  height: number;         // Actual canvas height in pixels
  cssWidth: number;       // CSS width
  cssHeight: number;      // CSS height
  pixelRatio: number;     // Device pixel ratio
}

export class CanvasScalingFix {
  static getCanvasInfo(canvas: HTMLCanvasElement): CanvasInfo {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    
    return {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height,
      pixelRatio
    };
  }
  
  static fixCameraForScaling(camera: any, canvas: HTMLCanvasElement) {
    const info = this.getCanvasInfo(canvas);
    
    // Camera should use CSS dimensions for viewport calculations
    // because the context is scaled by pixelRatio
    camera.updateViewport(info.cssWidth, info.cssHeight);
  }
  
  static debugCanvasScaling(canvas: HTMLCanvasElement) {
    const info = this.getCanvasInfo(canvas);
    console.log("=== CANVAS SCALING DEBUG ===");
    console.log("Canvas actual size:", info.width, "x", info.height);
    console.log("Canvas CSS size:", info.cssWidth, "x", info.cssHeight);
    console.log("Pixel ratio:", info.pixelRatio);
    console.log("Expected scaling:", info.width / info.cssWidth);
  }
}