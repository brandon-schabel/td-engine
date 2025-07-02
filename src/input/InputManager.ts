import type { Vector2 } from '@/utils/Vector2';
import type { InputState } from '@/systems/logic/types';
import type { Camera } from '@/systems/Camera';

export class InputManager {
  private keys: Set<string> = new Set();
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private worldMousePosition: Vector2 = { x: 0, y: 0 };
  private isMouseDown: boolean = false;
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private mobileInput: Vector2 | undefined;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Touch events are handled by TouchInputManager separately
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.key.toLowerCase());
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    // Convert to world coordinates
    this.worldMousePosition = this.camera.screenToWorld(this.mousePosition);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Left click
      this.isMouseDown = true;
      this.handleMouseMove(event); // Update position
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // Left click
      this.isMouseDown = false;
    }
  }

  private handleMouseLeave(): void {
    this.isMouseDown = false;
  }

  // Called by mobile controls to set directional input
  setMobileInput(input: Vector2 | undefined): void {
    this.mobileInput = input;
  }

  // Get current input state for logic systems
  getInputState(): InputState {
    return {
      keys: new Set(this.keys),
      mousePosition: { ...this.worldMousePosition },
      isMouseDown: this.isMouseDown,
      mobileInput: this.mobileInput ? { ...this.mobileInput } : undefined
    };
  }

  // Helper methods for common checks
  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMousePosition(): Vector2 {
    return { ...this.worldMousePosition };
  }

  getScreenMousePosition(): Vector2 {
    return { ...this.mousePosition };
  }

  isMousePressed(): boolean {
    return this.isMouseDown;
  }

  // Clean up event listeners
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}