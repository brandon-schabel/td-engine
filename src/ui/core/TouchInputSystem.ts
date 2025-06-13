/**
 * Enhanced Touch Input System for Game Canvas Integration
 * Bridges the modern InputSystem with the game's mouse event handlers
 */

import { InputSystem } from './InputSystem';
import { EventEmitter } from './EventEmitter';
import type { UnifiedPointerEvent, GestureEvent } from './types';

export interface TouchInputSystemOptions {
  canvas: HTMLCanvasElement;
  game: any; // Game instance - we'll keep it generic for now
  enableVirtualControls?: boolean;
  enableGestures?: boolean;
  hapticFeedback?: boolean;
}

export interface VirtualControlEvent {
  type: 'joystick' | 'button';
  action: 'start' | 'move' | 'end';
  data: any;
}

export class TouchInputSystem extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private game: any;
  private inputSystem: InputSystem;
  private options: TouchInputSystemOptions;
  
  // Touch state
  private primaryTouch: UnifiedPointerEvent | null = null;
  private secondaryTouch: UnifiedPointerEvent | null = null;
  private isGameActive: boolean = false;
  
  // Virtual controls
  private virtualJoystick: VirtualJoystick | null = null;
  private actionButtons: Map<string, VirtualButton> = new Map();
  
  // Gesture handling
  private lastTapTime: number = 0;
  private tapCount: number = 0;
  private gestureState: any = {};
  
  constructor(options: TouchInputSystemOptions) {
    super();
    this.canvas = options.canvas;
    this.game = options.game;
    this.options = options;
    
    // Create InputSystem for the canvas
    this.inputSystem = new InputSystem({
      element: this.canvas,
      preventDefault: true,
      stopPropagation: false,
      passive: false
    });
    
    this.setupEventListeners();
    this.setupVirtualControls();
    this.addCanvasTouchStyles();
  }

  /**
   * Setup event listeners for the InputSystem
   */
  private setupEventListeners(): void {
    // Basic pointer events
    this.inputSystem.on('pointerdown', this.handlePointerDown.bind(this));
    this.inputSystem.on('pointermove', this.handlePointerMove.bind(this));
    this.inputSystem.on('pointerup', this.handlePointerUp.bind(this));
    
    // Gesture events
    this.inputSystem.on('tap', this.handleTap.bind(this));
    this.inputSystem.on('doubletap', this.handleDoubleTap.bind(this));
    this.inputSystem.on('press', this.handlePress.bind(this));
    this.inputSystem.on('pan', this.handlePan.bind(this));
    
    // Listen for game state changes
    if (this.game.engine) {
      this.game.engine.on('stateChange', (state: any) => {
        this.isGameActive = state === 'PLAYING';
      });
    }
  }

  /**
   * Handle pointer down events
   */
  private handlePointerDown(pointer: UnifiedPointerEvent): void {
    // Trigger haptic feedback
    this.triggerHapticFeedback('light');
    
    // Check if this is a virtual control interaction
    if (this.handleVirtualControlInteraction(pointer, 'down')) {
      return;
    }
    
    // Store primary/secondary touches
    if (!this.primaryTouch) {
      this.primaryTouch = pointer;
    } else if (!this.secondaryTouch) {
      this.secondaryTouch = pointer;
      // Two finger gesture detected
      this.handleTwoFingerGesture('start');
      return;
    }
    
    // Convert to mouse event and forward to game
    const mouseEvent = this.createMouseEvent('mousedown', pointer);
    if (this.game.handleMouseDown) {
      this.game.handleMouseDown(mouseEvent);
    }
  }

  /**
   * Handle pointer move events
   */
  private handlePointerMove(pointer: UnifiedPointerEvent): void {
    // Update virtual controls
    if (this.handleVirtualControlInteraction(pointer, 'move')) {
      return;
    }
    
    // Handle two-finger gestures
    if (this.primaryTouch && this.secondaryTouch) {
      this.handleTwoFingerGesture('move');
      return;
    }
    
    // Update primary touch
    if (this.primaryTouch && pointer.identifier === this.primaryTouch.identifier) {
      this.primaryTouch = pointer;
    }
    
    // Convert to mouse event and forward to game
    const mouseEvent = this.createMouseEvent('mousemove', pointer);
    if (this.game.handleMouseMove) {
      this.game.handleMouseMove(mouseEvent);
    }
  }

  /**
   * Handle pointer up events
   */
  private handlePointerUp(pointer: UnifiedPointerEvent): void {
    // Handle virtual control interaction
    if (this.handleVirtualControlInteraction(pointer, 'up')) {
      return;
    }
    
    // Clear touch references
    if (this.primaryTouch && pointer.identifier === this.primaryTouch.identifier) {
      this.primaryTouch = null;
    } else if (this.secondaryTouch && pointer.identifier === this.secondaryTouch.identifier) {
      this.secondaryTouch = null;
    }
    
    // Convert to mouse event and forward to game
    const mouseEvent = this.createMouseEvent('mouseup', pointer);
    if (this.game.handleMouseUp) {
      this.game.handleMouseUp(mouseEvent);
    }
  }

  /**
   * Handle tap gestures
   */
  private handleTap(gesture: GestureEvent): void {
    const now = Date.now();
    
    // Multi-tap detection
    if (now - this.lastTapTime < 300) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = now;
    
    // Emit tap events
    this.emit('tap', {
      position: gesture.center,
      tapCount: this.tapCount,
      originalGesture: gesture
    });
    
    // Trigger haptic feedback for multiple taps
    if (this.tapCount > 1) {
      this.triggerHapticFeedback('medium');
    }
  }

  /**
   * Handle double tap gestures (zoom or special action)
   */
  private handleDoubleTap(gesture: GestureEvent): void {
    this.triggerHapticFeedback('medium');
    this.emit('doubletap', {
      position: gesture.center,
      originalGesture: gesture
    });
  }

  /**
   * Handle long press gestures
   */
  private handlePress(gesture: GestureEvent): void {
    this.triggerHapticFeedback('heavy');
    this.emit('press', {
      position: gesture.center,
      originalGesture: gesture
    });
  }

  /**
   * Handle pan gestures
   */
  private handlePan(gesture: GestureEvent): void {
    this.emit('pan', {
      position: gesture.center,
      delta: { x: gesture.deltaX, y: gesture.deltaY },
      direction: gesture.direction,
      originalGesture: gesture
    });
  }

  /**
   * Handle two-finger gestures (pinch, rotate, two-finger tap)
   */
  private handleTwoFingerGesture(phase: 'start' | 'move' | 'end'): void {
    if (!this.primaryTouch || !this.secondaryTouch) return;
    
    if (phase === 'start') {
      this.gestureState.initialDistance = this.getDistance(this.primaryTouch, this.secondaryTouch);
      this.gestureState.initialAngle = this.getAngle(this.primaryTouch, this.secondaryTouch);
      this.gestureState.initialCenter = this.getCenter([this.primaryTouch, this.secondaryTouch]);
    } else if (phase === 'move') {
      const currentDistance = this.getDistance(this.primaryTouch, this.secondaryTouch);
      const currentAngle = this.getAngle(this.primaryTouch, this.secondaryTouch);
      const currentCenter = this.getCenter([this.primaryTouch, this.secondaryTouch]);
      
      // Calculate pinch scale
      const scale = currentDistance / this.gestureState.initialDistance;
      
      // Calculate rotation
      const rotation = currentAngle - this.gestureState.initialAngle;
      
      this.emit('pinch', {
        scale,
        rotation,
        center: currentCenter,
        delta: {
          x: currentCenter.x - this.gestureState.initialCenter.x,
          y: currentCenter.y - this.gestureState.initialCenter.y
        }
      });
    }
  }

  /**
   * Handle virtual control interactions
   */
  private handleVirtualControlInteraction(pointer: UnifiedPointerEvent, phase: 'down' | 'move' | 'up'): boolean {
    if (!this.options.enableVirtualControls) return false;
    
    // Check virtual joystick
    if (this.virtualJoystick && this.virtualJoystick.containsPoint(pointer.x, pointer.y)) {
      this.virtualJoystick.handleInput(pointer, phase);
      return true;
    }
    
    // Check action buttons
    for (const [id, button] of this.actionButtons) {
      if (button.containsPoint(pointer.x, pointer.y)) {
        button.handleInput(pointer, phase);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Create a MouseEvent from a UnifiedPointerEvent
   */
  private createMouseEvent(type: string, pointer: UnifiedPointerEvent): MouseEvent {
    const rect = this.canvas.getBoundingClientRect();
    
    // Create a synthetic MouseEvent
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: pointer.clientX,
      clientY: pointer.clientY,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
      altKey: pointer.altKey,
      ctrlKey: pointer.ctrlKey,
      metaKey: pointer.metaKey,
      shiftKey: pointer.shiftKey
    });
    
    // Add offsetX/Y properties for compatibility
    Object.defineProperty(event, 'offsetX', {
      value: pointer.x,
      writable: false
    });
    Object.defineProperty(event, 'offsetY', {
      value: pointer.y,
      writable: false
    });
    
    return event;
  }

  /**
   * Setup virtual controls
   */
  private setupVirtualControls(): void {
    if (!this.options.enableVirtualControls) return;
    
    // Create virtual joystick for movement
    this.virtualJoystick = new VirtualJoystick({
      x: 100,
      y: this.canvas.height - 100,
      radius: 50,
      onMove: (direction, magnitude) => {
        this.emit('virtualcontrol', {
          type: 'joystick',
          action: 'move',
          data: { direction, magnitude }
        });
      }
    });
    
    // Create action buttons
    this.actionButtons.set('shoot', new VirtualButton({
      x: this.canvas.width - 80,
      y: this.canvas.height - 80,
      radius: 35,
      label: '🎯',
      onPress: () => {
        this.emit('virtualcontrol', {
          type: 'button',
          action: 'start',
          data: { button: 'shoot' }
        });
      },
      onRelease: () => {
        this.emit('virtualcontrol', {
          type: 'button',
          action: 'end',
          data: { button: 'shoot' }
        });
      }
    }));
    
    this.actionButtons.set('pause', new VirtualButton({
      x: this.canvas.width - 40,
      y: 40,
      radius: 25,
      label: '⏸️',
      onPress: () => {
        this.emit('virtualcontrol', {
          type: 'button',
          action: 'start',
          data: { button: 'pause' }
        });
      }
    }));
  }

  /**
   * Add touch-specific CSS styles to canvas
   */
  private addCanvasTouchStyles(): void {
    const style = this.canvas.style;
    style.touchAction = 'none';
    style.userSelect = 'none';
    style.webkitUserSelect = 'none';
    style.webkitTouchCallout = 'none';
    style.webkitTapHighlightColor = 'transparent';
  }

  /**
   * Trigger haptic feedback if available
   */
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    if (!this.options.hapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[intensity]);
  }

  /**
   * Utility methods
   */
  private getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private getCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  /**
   * Enable/disable touch input
   */
  setEnabled(enabled: boolean): void {
    this.inputSystem.setEnabled(enabled);
  }

  /**
   * Show/hide virtual controls
   */
  setVirtualControlsVisible(visible: boolean): void {
    if (this.virtualJoystick) {
      this.virtualJoystick.setVisible(visible);
    }
    
    this.actionButtons.forEach(button => {
      button.setVisible(visible);
    });
  }

  /**
   * Get the current InputSystem for advanced usage
   */
  getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  /**
   * Destroy the touch input system
   */
  destroy(): void {
    this.inputSystem.destroy();
    
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }
    
    this.actionButtons.forEach(button => button.destroy());
    this.actionButtons.clear();
    
    this.removeAllListeners();
  }
}

/**
 * Virtual Joystick for mobile controls
 */
class VirtualJoystick {
  private element: HTMLElement;
  private options: any;
  private isActive: boolean = false;
  private centerX: number;
  private centerY: number;
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(options: any) {
    this.options = options;
    this.centerX = options.x;
    this.centerY = options.y;
    this.createElement();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: absolute;
      left: ${this.options.x - this.options.radius}px;
      top: ${this.options.y - this.options.radius}px;
      width: ${this.options.radius * 2}px;
      height: ${this.options.radius * 2}px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 40%, transparent 60%);
      pointer-events: none;
      z-index: 1000;
      transition: opacity 0.2s ease;
    `;
    
    document.body.appendChild(this.element);
  }

  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt((x - this.centerX) ** 2 + (y - this.centerY) ** 2);
    return distance <= this.options.radius;
  }

  handleInput(pointer: UnifiedPointerEvent, phase: 'down' | 'move' | 'up'): void {
    if (phase === 'down') {
      this.isActive = true;
      this.element.style.opacity = '1';
    } else if (phase === 'up') {
      this.isActive = false;
      this.element.style.opacity = '0.5';
      this.currentX = 0;
      this.currentY = 0;
      this.options.onMove?.(0, 0);
      return;
    }

    if (this.isActive) {
      const deltaX = pointer.x - this.centerX;
      const deltaY = pointer.y - this.centerY;
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), this.options.radius);
      const angle = Math.atan2(deltaY, deltaX);
      
      this.currentX = Math.cos(angle) * distance;
      this.currentY = Math.sin(angle) * distance;
      
      const magnitude = distance / this.options.radius;
      this.options.onMove?.(angle, magnitude);
    }
  }

  setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }

  destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Virtual Button for mobile controls
 */
class VirtualButton {
  private element: HTMLElement;
  private options: any;
  private isPressed: boolean = false;

  constructor(options: any) {
    this.options = options;
    this.createElement();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: absolute;
      left: ${this.options.x - this.options.radius}px;
      top: ${this.options.y - this.options.radius}px;
      width: ${this.options.radius * 2}px;
      height: ${this.options.radius * 2}px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${this.options.radius * 0.7}px;
      pointer-events: none;
      z-index: 1000;
      transition: all 0.1s ease;
      backdrop-filter: blur(10px);
    `;
    
    this.element.textContent = this.options.label;
    document.body.appendChild(this.element);
  }

  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt((x - this.options.x) ** 2 + (y - this.options.y) ** 2);
    return distance <= this.options.radius;
  }

  handleInput(pointer: UnifiedPointerEvent, phase: 'down' | 'move' | 'up'): void {
    if (phase === 'down' && !this.isPressed) {
      this.isPressed = true;
      this.element.style.transform = 'scale(0.95)';
      this.element.style.background = 'rgba(255, 255, 255, 0.2)';
      this.options.onPress?.();
    } else if (phase === 'up' && this.isPressed) {
      this.isPressed = false;
      this.element.style.transform = 'scale(1)';
      this.element.style.background = 'rgba(255, 255, 255, 0.1)';
      this.options.onRelease?.();
    }
  }

  setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'flex' : 'none';
  }

  destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}