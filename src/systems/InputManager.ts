/**
 * Input Manager
 * Centralized input handling system extracted from Game.ts
 * Handles mouse and keyboard input with proper event delegation
 */

import type { Vector2 } from '@/utils/Vector2';
import { Camera } from './Camera';

export interface InputEvents {
  onMouseDown: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => void;
  onMouseUp: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => void;
  onMouseMove: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => void;
  onMouseClick: (worldPos: Vector2, screenPos: Vector2, event: MouseEvent) => void;
  onKeyDown: (key: string, event: KeyboardEvent) => void;
  onKeyUp: (key: string, event: KeyboardEvent) => void;
  onWheel: (delta: number, worldPos: Vector2, event: WheelEvent) => void;
}

export interface InputState {
  isMouseDown: boolean;
  mousePosition: Vector2;
  pressedKeys: Set<string>;
  mouseButton: number;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private events: Partial<InputEvents>;
  private state: InputState;
  private isEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement, camera: Camera, events: Partial<InputEvents> = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.events = events;
    
    this.state = {
      isMouseDown: false,
      mousePosition: { x: 0, y: 0 },
      pressedKeys: new Set(),
      mouseButton: -1
    };

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard events (need to be on document for global capture)
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent default behavior for game keys
    this.preventDefaultBehavior();
  }

  private preventDefaultBehavior(): void {
    const gameKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    
    document.addEventListener('keydown', (event) => {
      if (gameKeys.includes(event.key.toLowerCase()) && this.isEnabled) {
        event.preventDefault();
      }
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { screenPos, worldPos } = this.getMousePositions(event);
    
    this.state.isMouseDown = true;
    this.state.mouseButton = event.button;
    this.state.mousePosition = worldPos;
    
    this.events.onMouseDown?.(worldPos, screenPos, event);
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { screenPos, worldPos } = this.getMousePositions(event);
    
    this.state.isMouseDown = false;
    this.state.mouseButton = -1;
    this.state.mousePosition = worldPos;
    
    this.events.onMouseUp?.(worldPos, screenPos, event);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { screenPos, worldPos } = this.getMousePositions(event);
    this.state.mousePosition = worldPos;
    
    this.events.onMouseMove?.(worldPos, screenPos, event);
  }

  private handleMouseClick(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { screenPos, worldPos } = this.getMousePositions(event);
    this.events.onMouseClick?.(worldPos, screenPos, event);
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;

    event.preventDefault();
    const { screenPos, worldPos } = this.getMousePositions(event);
    const delta = event.deltaY > 0 ? 1 : -1;
    
    this.events.onWheel?.(delta, worldPos, event);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = event.key.toLowerCase();
    this.state.pressedKeys.add(key);
    
    this.events.onKeyDown?.(key, event);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = event.key.toLowerCase();
    this.state.pressedKeys.delete(key);
    
    this.events.onKeyUp?.(key, event);
  }

  private getMousePositions(event: MouseEvent | WheelEvent): { screenPos: Vector2; worldPos: Vector2 } {
    const rect = this.canvas.getBoundingClientRect();
    const screenPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    const worldPos = this.camera.screenToWorld(screenPos);
    
    return { screenPos, worldPos };
  }

  // Public API

  /**
   * Get current input state
   */
  getState(): Readonly<InputState> {
    return { ...this.state };
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.state.pressedKeys.has(key.toLowerCase());
  }

  /**
   * Check if any of the provided keys are pressed
   */
  isAnyKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.state.pressedKeys.has(key.toLowerCase()));
  }

  /**
   * Get current mouse position in world coordinates
   */
  getMouseWorldPosition(): Vector2 {
    return { ...this.state.mousePosition };
  }

  /**
   * Check if mouse is currently pressed
   */
  isMousePressed(button?: number): boolean {
    if (button !== undefined) {
      return this.state.isMouseDown && this.state.mouseButton === button;
    }
    return this.state.isMouseDown;
  }

  /**
   * Enable or disable input processing
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      // Clear state when disabled
      this.state.isMouseDown = false;
      this.state.pressedKeys.clear();
      this.state.mouseButton = -1;
    }
  }

  /**
   * Update event handlers
   */
  setEventHandlers(events: Partial<InputEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Add event handler for specific event
   */
  addEventListener<K extends keyof InputEvents>(event: K, handler: InputEvents[K]): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  removeEventListener<K extends keyof InputEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Get movement vector from WASD/Arrow keys
   */
  getMovementVector(): Vector2 {
    let x = 0;
    let y = 0;

    if (this.isAnyKeyPressed(['w', 'arrowup'])) y -= 1;
    if (this.isAnyKeyPressed(['s', 'arrowdown'])) y += 1;
    if (this.isAnyKeyPressed(['a', 'arrowleft'])) x -= 1;
    if (this.isAnyKeyPressed(['d', 'arrowright'])) x += 1;

    // Normalize diagonal movement
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0) {
      return { x: x / magnitude, y: y / magnitude };
    }

    return { x, y };
  }

  /**
   * Handle input combo detection
   */
  onCombo(keys: string[], callback: () => void, requireOrder: boolean = false): void {
    if (requireOrder) {
      // Check if keys are pressed in sequence
      // This would require more complex state tracking
      console.warn('Sequential combo detection not yet implemented');
    } else {
      // Check if all keys are currently pressed
      if (keys.every(key => this.state.pressedKeys.has(key.toLowerCase()))) {
        callback();
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('click', this.handleMouseClick.bind(this));
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  /**
   * Debug information
   */
  getDebugInfo(): {
    enabled: boolean;
    pressedKeys: string[];
    mousePosition: Vector2;
    isMouseDown: boolean;
    mouseButton: number;
  } {
    return {
      enabled: this.isEnabled,
      pressedKeys: Array.from(this.state.pressedKeys),
      mousePosition: this.state.mousePosition,
      isMouseDown: this.state.isMouseDown,
      mouseButton: this.state.mouseButton
    };
  }
}