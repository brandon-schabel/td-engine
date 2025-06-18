// Final camera centering fix
// The issue: Canvas pixel dimensions vs CSS dimensions mismatch

export class CameraFix {
  static getConsistentDimensions(canvas: HTMLCanvasElement) {
    const pixelRatio = window.devicePixelRatio || 1;
    
    // These are the dimensions we should use for ALL camera calculations
    // because the canvas context is scaled by pixelRatio
    const logicalWidth = canvas.width / pixelRatio;
    const logicalHeight = canvas.height / pixelRatio;
    
    return {
      width: logicalWidth,
      height: logicalHeight,
      pixelRatio
    };
  }
  
  static fixCamera(camera: any, canvas: HTMLCanvasElement) {
    const dims = this.getConsistentDimensions(canvas);
    camera.updateViewport(dims.width, dims.height);
  }
  
  static debugDimensions(canvas: HTMLCanvasElement) {
    const dims = this.getConsistentDimensions(canvas);
    console.log("=== DIMENSION FIX ===");
    console.log("Canvas pixels:", canvas.width, "x", canvas.height);
    console.log("Logical dimensions to use:", dims.width, "x", dims.height);
    console.log("Pixel ratio:", dims.pixelRatio);
  }
}