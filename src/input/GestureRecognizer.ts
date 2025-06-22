/**
 * GestureRecognizer.ts - Core gesture recognition system
 * Identifies and classifies touch gestures from raw touch events
 */

import type { Vector2 } from '@/utils/Vector2';
import type { GestureConfig } from '@/config/GestureConfig';
import { DEFAULT_GESTURE_CONFIG } from '@/config/GestureConfig';

export enum GestureType {
  NONE = 'none',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  PAN = 'pan',
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press'
}

export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

export interface GestureState {
  type: GestureType;
  startTime: number;
  startTouches: TouchData[];
  currentTouches: TouchData[];
  
  // Swipe specific
  swipeDirection?: SwipeDirection;
  swipeVelocity?: Vector2;
  
  // Pinch specific
  pinchScale?: number;
  pinchCenter?: Vector2;
  initialDistance?: number;
  previousDistance?: number;
  scaleVelocity?: number;
  lastUpdateTime?: number;
  
  // Pan specific
  panDelta?: Vector2;
  panVelocity?: Vector2;
  
  // Tap specific
  tapCount?: number;
  lastTapTime?: number;
}

export interface TouchData {
  id: number;
  position: Vector2;
  timestamp: number;
}

export interface GestureEvent {
  type: GestureType;
  gesture: GestureState;
  timestamp: number;
}

export class GestureRecognizer {
  private config: GestureConfig;
  private currentGesture: GestureState | null = null;
  private touchHistory: Map<number, TouchData[]> = new Map();
  private gestureListeners: ((event: GestureEvent) => void)[] = [];
  private lastTapTime = 0;
  private longPressTimeout: number | null = null;
  
  constructor(config: GestureConfig = DEFAULT_GESTURE_CONFIG) {
    this.config = config;
  }
  
  /**
   * Process touch start event
   */
  public onTouchStart(touches: Touch[]): void {
    const timestamp = Date.now();
    const touchData: TouchData[] = [];
    
    // Convert touches to TouchData
    for (const touch of touches) {
      const data: TouchData = {
        id: touch.identifier,
        position: { x: touch.clientX, y: touch.clientY },
        timestamp
      };
      touchData.push(data);
      
      // Initialize touch history
      this.touchHistory.set(touch.identifier, [data]);
    }
    
    // Handle different touch counts
    if (touches.length === 1) {
      this.startSingleTouchGesture(touchData[0]);
    } else if (touches.length === 2) {
      this.startMultiTouchGesture(touchData);
    }
  }
  
  /**
   * Process touch move event
   */
  public onTouchMove(touches: Touch[]): void {
    if (!this.currentGesture) return;
    
    const timestamp = Date.now();
    const touchData: TouchData[] = [];
    
    // Update touch data and history
    for (const touch of touches) {
      const data: TouchData = {
        id: touch.identifier,
        position: { x: touch.clientX, y: touch.clientY },
        timestamp
      };
      touchData.push(data);
      
      // Update history
      const history = this.touchHistory.get(touch.identifier);
      if (history) {
        history.push(data);
        // Keep only recent history (last 100ms)
        const cutoff = timestamp - 100;
        while (history.length > 0 && history[0].timestamp < cutoff) {
          history.shift();
        }
      }
    }
    
    this.currentGesture.currentTouches = touchData;
    
    // Process ongoing gesture
    if (touches.length === 1) {
      this.processSingleTouchMove(touchData[0]);
    } else if (touches.length === 2) {
      this.processMultiTouchMove(touchData);
    }
  }
  
  /**
   * Process touch end event
   */
  public onTouchEnd(touches: Touch[]): void {
    if (!this.currentGesture) return;
    
    // Clear long press timeout
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    
    // Remove ended touches from history
    for (const touch of touches) {
      this.touchHistory.delete(touch.identifier);
    }
    
    // Complete gesture if all touches ended
    if (this.touchHistory.size === 0) {
      this.completeGesture();
    }
  }
  
  /**
   * Cancel current gesture
   */
  public cancel(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    
    this.currentGesture = null;
    this.touchHistory.clear();
  }
  
  /**
   * Add gesture event listener
   */
  public addListener(listener: (event: GestureEvent) => void): void {
    this.gestureListeners.push(listener);
  }
  
  /**
   * Remove gesture event listener
   */
  public removeListener(listener: (event: GestureEvent) => void): void {
    const index = this.gestureListeners.indexOf(listener);
    if (index !== -1) {
      this.gestureListeners.splice(index, 1);
    }
  }
  
  private startSingleTouchGesture(touch: TouchData): void {
    this.currentGesture = {
      type: GestureType.NONE,
      startTime: touch.timestamp,
      startTouches: [touch],
      currentTouches: [touch]
    };
    
    // Start long press timer
    const thresholds = this.config.thresholds;
    this.longPressTimeout = window.setTimeout(() => {
      if (this.currentGesture && this.currentGesture.type === GestureType.NONE) {
        const movement = this.getMovementDistance(
          this.currentGesture.startTouches[0],
          this.currentGesture.currentTouches[0]
        );
        
        if (movement <= thresholds.longPress.maxDistance) {
          this.currentGesture.type = GestureType.LONG_PRESS;
          this.emitGesture();
        }
      }
    }, thresholds.longPress.minDuration);
  }
  
  private startMultiTouchGesture(touches: TouchData[]): void {
    if (touches.length !== 2) return;
    
    const distance = this.getDistance(touches[0].position, touches[1].position);
    const center = this.getCenter(touches[0].position, touches[1].position);
    
    this.currentGesture = {
      type: GestureType.NONE,
      startTime: touches[0].timestamp,
      startTouches: touches,
      currentTouches: touches,
      initialDistance: distance,
      pinchCenter: center,
      pinchScale: 1
    };
  }
  
  private processSingleTouchMove(touch: TouchData): void {
    if (!this.currentGesture) return;
    
    const startTouch = this.currentGesture.startTouches[0];
    const movement = this.getMovementDistance(startTouch, touch);
    const thresholds = this.config.thresholds;
    
    // Determine gesture type if not yet identified
    if (this.currentGesture.type === GestureType.NONE) {
      if (movement > thresholds.pan.minDistance) {
        // Cancel long press
        if (this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }
        
        // Check if it's a swipe or pan based on velocity
        const velocity = this.calculateVelocity(startTouch, touch);
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed >= thresholds.swipe.minVelocity) {
          this.currentGesture.type = GestureType.SWIPE;
          this.currentGesture.swipeVelocity = velocity;
          this.currentGesture.swipeDirection = this.getSwipeDirection(velocity);
        } else {
          this.currentGesture.type = GestureType.PAN;
        }
      }
    }
    
    // Update pan gesture
    if (this.currentGesture.type === GestureType.PAN) {
      this.currentGesture.panDelta = {
        x: touch.position.x - startTouch.position.x,
        y: touch.position.y - startTouch.position.y
      };
      
      const history = this.touchHistory.get(touch.id);
      if (history && history.length >= 2) {
        const recent = history[history.length - 1];
        const previous = history[history.length - 2];
        this.currentGesture.panVelocity = this.calculateVelocity(previous, recent);
      }
      
      this.emitGesture();
    }
  }
  
  private processMultiTouchMove(touches: TouchData[]): void {
    if (!this.currentGesture || touches.length !== 2) return;
    
    const distance = this.getDistance(touches[0].position, touches[1].position);
    const center = this.getCenter(touches[0].position, touches[1].position);
    const thresholds = this.config.thresholds;
    
    // Determine gesture type if not yet identified
    if (this.currentGesture.type === GestureType.NONE) {
      const distanceChange = Math.abs(distance - (this.currentGesture.initialDistance || 0));
      
      if (distanceChange > thresholds.pinch.minDistance) {
        this.currentGesture.type = GestureType.PINCH;
        this.currentGesture.previousDistance = this.currentGesture.initialDistance;
        this.currentGesture.lastUpdateTime = Date.now();
      }
    }
    
    // Update pinch gesture
    if (this.currentGesture.type === GestureType.PINCH) {
      const now = Date.now();
      const deltaTime = now - (this.currentGesture.lastUpdateTime || now);
      
      // Calculate scale and velocity
      this.currentGesture.pinchScale = distance / (this.currentGesture.initialDistance || 1);
      this.currentGesture.pinchCenter = center;
      
      // Calculate scale velocity
      if (this.currentGesture.previousDistance && deltaTime > 0) {
        const distanceChange = distance - this.currentGesture.previousDistance;
        this.currentGesture.scaleVelocity = distanceChange / deltaTime;
      }
      
      this.currentGesture.previousDistance = distance;
      this.currentGesture.lastUpdateTime = now;
      
      this.emitGesture();
    }
  }
  
  private completeGesture(): void {
    if (!this.currentGesture) return;
    
    const gesture = this.currentGesture;
    const duration = Date.now() - gesture.startTime;
    const thresholds = this.config.thresholds;
    
    // Check for tap
    if (gesture.type === GestureType.NONE) {
      const movement = this.getMovementDistance(
        gesture.startTouches[0],
        gesture.currentTouches[0]
      );
      
      if (duration <= thresholds.tap.maxDuration && movement <= thresholds.tap.maxDistance) {
        // Check for double tap
        const timeSinceLastTap = Date.now() - this.lastTapTime;
        
        if (timeSinceLastTap <= thresholds.tap.doubleTapDelay) {
          gesture.type = GestureType.DOUBLE_TAP;
          gesture.tapCount = 2;
        } else {
          gesture.type = GestureType.TAP;
          gesture.tapCount = 1;
        }
        
        this.lastTapTime = Date.now();
        this.emitGesture();
      }
    }
    
    // Emit final state for ongoing gestures
    else if (gesture.type === GestureType.SWIPE) {
      // Verify swipe completed successfully
      const startTouch = gesture.startTouches[0];
      const endTouch = gesture.currentTouches[0];
      const distance = this.getMovementDistance(startTouch, endTouch);
      
      if (distance >= thresholds.swipe.minDistance && duration <= thresholds.swipe.maxDuration) {
        this.emitGesture();
      }
    }
    
    this.currentGesture = null;
  }
  
  private emitGesture(): void {
    if (!this.currentGesture || this.currentGesture.type === GestureType.NONE) return;
    
    const event: GestureEvent = {
      type: this.currentGesture.type,
      gesture: this.currentGesture,
      timestamp: Date.now()
    };
    
    for (const listener of this.gestureListeners) {
      listener(event);
    }
  }
  
  private getMovementDistance(start: TouchData, end: TouchData): number {
    const dx = end.position.x - start.position.x;
    const dy = end.position.y - start.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private getDistance(p1: Vector2, p2: Vector2): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private getCenter(p1: Vector2, p2: Vector2): Vector2 {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }
  
  private calculateVelocity(start: TouchData, end: TouchData): Vector2 {
    const dt = end.timestamp - start.timestamp;
    if (dt === 0) return { x: 0, y: 0 };
    
    return {
      x: (end.position.x - start.position.x) / dt,
      y: (end.position.y - start.position.y) / dt
    };
  }
  
  private getSwipeDirection(velocity: Vector2): SwipeDirection {
    const angle = Math.atan2(velocity.y, velocity.x);
    const absAngle = Math.abs(angle);
    const tolerance = this.config.thresholds.swipe.directionTolerance;
    
    if (absAngle < tolerance) {
      return SwipeDirection.RIGHT;
    } else if (absAngle > Math.PI - tolerance) {
      return SwipeDirection.LEFT;
    } else if (angle > 0 && angle < Math.PI / 2 + tolerance && angle > Math.PI / 2 - tolerance) {
      return SwipeDirection.DOWN;
    } else {
      return SwipeDirection.UP;
    }
  }
  
  /**
   * Get current gesture type
   */
  public getCurrentGestureType(): GestureType {
    return this.currentGesture?.type || GestureType.NONE;
  }
  
  /**
   * Check if a gesture is active
   */
  public isGestureActive(): boolean {
    return this.currentGesture !== null && this.currentGesture.type !== GestureType.NONE;
  }
}