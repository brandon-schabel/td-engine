/**
 * Touch-first unified input system
 * Handles mouse, touch, and pointer events with a consistent API
 */

import { EventEmitter } from './EventEmitter';
import type { UnifiedPointerEvent, GestureEvent } from './types';

export interface InputSystemOptions {
  element: HTMLElement;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  passive?: boolean;
  capturePhase?: boolean;
}

export class InputSystem extends EventEmitter {
  private element: HTMLElement;
  private options: InputSystemOptions;
  private activePointers = new Map<number, UnifiedPointerEvent>();
  private gestureState: GestureState;
  private isEnabled = true;

  constructor(options: InputSystemOptions) {
    super();
    this.element = options.element;
    this.options = options;
    
    this.gestureState = {
      startTime: 0,
      startPointers: [],
      lastPointers: [],
      lastTap: 0,
      isPanning: false,
      isPressed: false,
      pressTimer: null,
    };

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const eventOptions = {
      passive: this.options.passive ?? true,
      capture: this.options.capturePhase ?? false,
    };

    // Pointer events (preferred)
    if ('PointerEvent' in window) {
      this.element.addEventListener('pointerdown', this.handlePointerDown, eventOptions);
      this.element.addEventListener('pointermove', this.handlePointerMove, eventOptions);
      this.element.addEventListener('pointerup', this.handlePointerUp, eventOptions);
      this.element.addEventListener('pointercancel', this.handlePointerCancel, eventOptions);
    } else {
      // Touch events
      this.element.addEventListener('touchstart', this.handleTouchStart, eventOptions);
      this.element.addEventListener('touchmove', this.handleTouchMove, eventOptions);
      this.element.addEventListener('touchend', this.handleTouchEnd, eventOptions);
      this.element.addEventListener('touchcancel', this.handleTouchCancel, eventOptions);
      
      // Mouse events
      this.element.addEventListener('mousedown', this.handleMouseDown, eventOptions);
      this.element.addEventListener('mousemove', this.handleMouseMove, eventOptions);
      this.element.addEventListener('mouseup', this.handleMouseUp, eventOptions);
    }

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', this.handleContextMenu);
  }

  /**
   * Handle pointer down
   */
  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.isEnabled) return;
    this.processPointerDown(this.createUnifiedEvent(event));
  };

  /**
   * Handle touch start
   */
  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.isEnabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.processPointerDown(this.createUnifiedEvent(touch, event));
    });
  };

  /**
   * Handle mouse down
   */
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.isEnabled) return;
    this.processPointerDown(this.createUnifiedEvent(event));
  };

  /**
   * Process pointer down
   */
  private processPointerDown(pointer: UnifiedPointerEvent): void {
    this.handleOptions(pointer.originalEvent);
    
    // Add to active pointers
    this.activePointers.set(pointer.identifier, pointer);
    
    // Update gesture state
    this.gestureState.startTime = Date.now();
    this.gestureState.startPointers = Array.from(this.activePointers.values());
    this.gestureState.lastPointers = [...this.gestureState.startPointers];
    this.gestureState.isPressed = true;
    
    // Emit pointer event
    this.emit('pointerdown', pointer);
    
    // Start press detection
    this.startPressDetection();
    
    // Check for multi-touch gestures
    if (this.activePointers.size === 2) {
      this.startPinchRotateDetection();
    }
  }

  /**
   * Handle pointer move
   */
  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.isEnabled) return;
    this.processPointerMove(this.createUnifiedEvent(event));
  };

  /**
   * Handle touch move
   */
  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.isEnabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.processPointerMove(this.createUnifiedEvent(touch, event));
    });
  };

  /**
   * Handle mouse move
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isEnabled) return;
    if (event.buttons > 0) {
      this.processPointerMove(this.createUnifiedEvent(event));
    }
  };

  /**
   * Process pointer move
   */
  private processPointerMove(pointer: UnifiedPointerEvent): void {
    this.handleOptions(pointer.originalEvent);
    
    // Update active pointer
    if (this.activePointers.has(pointer.identifier)) {
      this.activePointers.set(pointer.identifier, pointer);
      
      // Emit pointer event
      this.emit('pointermove', pointer);
      
      // Detect pan gesture
      this.detectPan();
      
      // Update pinch/rotate if two pointers
      if (this.activePointers.size === 2) {
        this.updatePinchRotate();
      }
    }
  }

  /**
   * Handle pointer up
   */
  private handlePointerUp = (event: PointerEvent): void => {
    if (!this.isEnabled) return;
    this.processPointerUp(this.createUnifiedEvent(event));
  };

  /**
   * Handle touch end
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.isEnabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.processPointerUp(this.createUnifiedEvent(touch, event));
    });
  };

  /**
   * Handle mouse up
   */
  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.isEnabled) return;
    this.processPointerUp(this.createUnifiedEvent(event));
  };

  /**
   * Process pointer up
   */
  private processPointerUp(pointer: UnifiedPointerEvent): void {
    this.handleOptions(pointer.originalEvent);
    
    // Remove from active pointers
    this.activePointers.delete(pointer.identifier);
    
    // Emit pointer event
    this.emit('pointerup', pointer);
    
    // Detect tap/double tap
    const now = Date.now();
    const duration = now - this.gestureState.startTime;
    const distance = this.getDistance(
      pointer,
      this.gestureState.startPointers.find(p => p.identifier === pointer.identifier) || pointer
    );
    
    if (duration < 250 && distance < 10 && !this.gestureState.isPanning) {
      // Tap detected
      if (now - this.gestureState.lastTap < 300) {
        this.emitGesture('doubletap', pointer);
      } else {
        this.emitGesture('tap', pointer);
      }
      this.gestureState.lastTap = now;
    }
    
    // Clean up gesture state
    if (this.activePointers.size === 0) {
      this.cleanupGestureState();
    }
  }

  /**
   * Handle pointer cancel
   */
  private handlePointerCancel = (event: PointerEvent): void => {
    this.processPointerCancel(event.pointerId);
  };

  /**
   * Handle touch cancel
   */
  private handleTouchCancel = (event: TouchEvent): void => {
    Array.from(event.changedTouches).forEach(touch => {
      this.processPointerCancel(touch.identifier);
    });
  };

  /**
   * Process pointer cancel
   */
  private processPointerCancel(identifier: number): void {
    this.activePointers.delete(identifier);
    if (this.activePointers.size === 0) {
      this.cleanupGestureState();
    }
  }

  /**
   * Handle context menu
   */
  private handleContextMenu = (event: Event): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }
  };

  /**
   * Create unified pointer event
   */
  private createUnifiedEvent(
    event: MouseEvent | Touch | PointerEvent,
    originalEvent?: TouchEvent
  ): UnifiedPointerEvent {
    const rect = this.element.getBoundingClientRect();
    
    if ('touches' in event) {
      // Touch event
      const touch = event as Touch;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY,
        identifier: touch.identifier,
        type: 'touch',
        pressure: 1,
        isPrimary: true,
        button: 0,
        buttons: 1,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        originalEvent: originalEvent || (event as any),
      };
    } else if ('pointerId' in event) {
      // Pointer event
      const pointer = event as PointerEvent;
      return {
        x: pointer.clientX - rect.left,
        y: pointer.clientY - rect.top,
        clientX: pointer.clientX,
        clientY: pointer.clientY,
        pageX: pointer.pageX,
        pageY: pointer.pageY,
        identifier: pointer.pointerId,
        type: pointer.pointerType as any,
        pressure: pointer.pressure,
        isPrimary: pointer.isPrimary,
        button: pointer.button,
        buttons: pointer.buttons,
        altKey: pointer.altKey,
        ctrlKey: pointer.ctrlKey,
        metaKey: pointer.metaKey,
        shiftKey: pointer.shiftKey,
        originalEvent: pointer,
      };
    } else {
      // Mouse event
      const mouse = event as MouseEvent;
      return {
        x: mouse.clientX - rect.left,
        y: mouse.clientY - rect.top,
        clientX: mouse.clientX,
        clientY: mouse.clientY,
        pageX: mouse.pageX,
        pageY: mouse.pageY,
        identifier: 0,
        type: 'mouse',
        pressure: mouse.buttons > 0 ? 1 : 0,
        isPrimary: true,
        button: mouse.button,
        buttons: mouse.buttons,
        altKey: mouse.altKey,
        ctrlKey: mouse.ctrlKey,
        metaKey: mouse.metaKey,
        shiftKey: mouse.shiftKey,
        originalEvent: mouse,
      };
    }
  }

  /**
   * Handle event options
   */
  private handleOptions(event: Event): void {
    if (this.options.preventDefault) {
      event.preventDefault();
    }
    if (this.options.stopPropagation) {
      event.stopPropagation();
    }
  }

  /**
   * Start press detection
   */
  private startPressDetection(): void {
    if (this.gestureState.pressTimer) {
      clearTimeout(this.gestureState.pressTimer);
    }
    
    this.gestureState.pressTimer = setTimeout(() => {
      if (this.gestureState.isPressed && !this.gestureState.isPanning) {
        const pointer = Array.from(this.activePointers.values())[0];
        if (pointer) {
          this.emitGesture('press', pointer);
        }
      }
    }, 500);
  }

  /**
   * Detect pan gesture
   */
  private detectPan(): void {
    if (this.activePointers.size !== 1) return;
    
    const pointer = Array.from(this.activePointers.values())[0];
    const startPointer = this.gestureState.startPointers[0];
    
    if (!pointer || !startPointer) return;
    
    const distance = this.getDistance(pointer, startPointer);
    
    if (distance > 10 && !this.gestureState.isPanning) {
      this.gestureState.isPanning = true;
    }
    
    if (this.gestureState.isPanning) {
      this.emitGesture('pan', pointer);
    }
  }

  /**
   * Start pinch/rotate detection
   */
  private startPinchRotateDetection(): void {
    // Implementation for pinch/rotate gestures
  }

  /**
   * Update pinch/rotate
   */
  private updatePinchRotate(): void {
    // Implementation for pinch/rotate updates
  }

  /**
   * Emit gesture event
   */
  private emitGesture(type: GestureEvent['type'], pointer: UnifiedPointerEvent): void {
    const pointers = Array.from(this.activePointers.values());
    const center = this.getCenter(pointers.length > 0 ? pointers : [pointer]);
    const startCenter = this.getCenter(this.gestureState.startPointers);
    
    const gesture: GestureEvent = {
      type,
      center,
      deltaX: center.x - startCenter.x,
      deltaY: center.y - startCenter.y,
      distance: 0,
      angle: 0,
      velocity: 0,
      velocityX: 0,
      velocityY: 0,
      direction: this.getDirection(center.x - startCenter.x, center.y - startCenter.y),
      scale: 1,
      rotation: 0,
      target: pointer.originalEvent.target as HTMLElement,
      pointers: pointers.length > 0 ? pointers : [pointer],
    };
    
    this.emit(type, gesture);
  }

  /**
   * Get distance between two points
   */
  private getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center of pointers
   */
  private getCenter(pointers: Array<{ x: number; y: number }>): { x: number; y: number } {
    if (pointers.length === 0) return { x: 0, y: 0 };
    
    const sum = pointers.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    
    return {
      x: sum.x / pointers.length,
      y: sum.y / pointers.length,
    };
  }

  /**
   * Get direction from delta
   */
  private getDirection(deltaX: number, deltaY: number): GestureEvent['direction'] {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX < 10 && absY < 10) return 'none';
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Clean up gesture state
   */
  private cleanupGestureState(): void {
    if (this.gestureState.pressTimer) {
      clearTimeout(this.gestureState.pressTimer);
      this.gestureState.pressTimer = null;
    }
    
    this.gestureState.isPanning = false;
    this.gestureState.isPressed = false;
  }

  /**
   * Enable/disable input system
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.activePointers.clear();
      this.cleanupGestureState();
    }
  }

  /**
   * Destroy input system
   */
  destroy(): void {
    // Remove all event listeners
    const eventOptions = {
      passive: this.options.passive ?? true,
      capture: this.options.capturePhase ?? false,
    };

    if ('PointerEvent' in window) {
      this.element.removeEventListener('pointerdown', this.handlePointerDown, eventOptions);
      this.element.removeEventListener('pointermove', this.handlePointerMove, eventOptions);
      this.element.removeEventListener('pointerup', this.handlePointerUp, eventOptions);
      this.element.removeEventListener('pointercancel', this.handlePointerCancel, eventOptions);
    } else {
      this.element.removeEventListener('touchstart', this.handleTouchStart, eventOptions);
      this.element.removeEventListener('touchmove', this.handleTouchMove, eventOptions);
      this.element.removeEventListener('touchend', this.handleTouchEnd, eventOptions);
      this.element.removeEventListener('touchcancel', this.handleTouchCancel, eventOptions);
      this.element.removeEventListener('mousedown', this.handleMouseDown, eventOptions);
      this.element.removeEventListener('mousemove', this.handleMouseMove, eventOptions);
      this.element.removeEventListener('mouseup', this.handleMouseUp, eventOptions);
    }

    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    
    this.cleanupGestureState();
    this.activePointers.clear();
    this.removeAllListeners();
  }
}

interface GestureState {
  startTime: number;
  startPointers: UnifiedPointerEvent[];
  lastPointers: UnifiedPointerEvent[];
  lastTap: number;
  isPanning: boolean;
  isPressed: boolean;
  pressTimer: NodeJS.Timeout | null;
}