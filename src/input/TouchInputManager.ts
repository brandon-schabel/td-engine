import type { Game } from '@/core/Game';
import type { Vector2 as Point } from '@/utils/Vector2';
import { SettingsManager } from '@/config/GameSettings';

export interface TouchState {
  id: number;
  startPoint: Point;
  currentPoint: Point;
  startTime: number;
  type: 'movement' | 'shooting' | 'ui';
}

export class TouchInputManager {
  private game: Game;
  private touches: Map<number, TouchState> = new Map();
  private shootingTouch: TouchState | null = null;
  private movementTouch: TouchState | null = null;
  private lastTapTime = 0;
  private tapTimeout: number | null = null;
  private canvas: HTMLCanvasElement;
  private settings = SettingsManager.getInstance();
  
  // Touch detection thresholds
  private readonly TAP_THRESHOLD = 200; // ms
  private readonly TAP_DISTANCE = 10; // pixels
  private readonly DOUBLE_TAP_THRESHOLD = 300; // ms
  
  constructor(game: Game, canvas: HTMLCanvasElement) {
    this.game = game;
    this.canvas = canvas;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    const player = this.game.getPlayer();
    if (!player) return;
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const point = this.getTouchPoint(touch);
      
      // Determine touch type based on location and current state
      const touchType = this.determineTouchType(point);
      
      const touchState: TouchState = {
        id: touch.identifier,
        startPoint: point,
        currentPoint: point,
        startTime: Date.now(),
        type: touchType
      };
      
      this.touches.set(touch.identifier, touchState);
      
      if (touchType === 'shooting' && !this.shootingTouch) {
        this.shootingTouch = touchState;
        this.startShooting(point);
      } else if (touchType === 'movement' && !this.movementTouch) {
        this.movementTouch = touchState;
      }
    }
    
    this.triggerHapticFeedback('light');
  }
  
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    const player = this.game.getPlayer();
    if (!player) return;
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchState = this.touches.get(touch.identifier);
      
      if (touchState) {
        const point = this.getTouchPoint(touch);
        touchState.currentPoint = point;
        
        if (touchState === this.shootingTouch) {
          // Update aim direction while shooting
          this.updateAimDirection(point);
        }
      }
    }
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchState = this.touches.get(touch.identifier);
      
      if (touchState) {
        const duration = Date.now() - touchState.startTime;
        const distance = this.getDistance(touchState.startPoint, touchState.currentPoint);
        
        // Check for tap
        if (duration < this.TAP_THRESHOLD && distance < this.TAP_DISTANCE) {
          this.handleTap(touchState.currentPoint);
        }
        
        if (touchState === this.shootingTouch) {
          this.stopShooting();
          this.shootingTouch = null;
        } else if (touchState === this.movementTouch) {
          this.movementTouch = null;
        }
        
        this.touches.delete(touch.identifier);
      }
    }
  }
  
  private handleTouchCancel(event: TouchEvent): void {
    // Handle touch cancel same as touch end
    this.handleTouchEnd(event);
  }
  
  private getTouchPoint(touch: Touch): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  private determineTouchType(point: Point): 'movement' | 'shooting' | 'ui' {
    // If virtual joystick is enabled and touch is in joystick area
    const settings = this.settings.getSettings();
    if (settings.mobileJoystickEnabled) {
      const joystickArea = this.getJoystickArea();
      if (this.isPointInArea(point, joystickArea)) {
        return 'movement';
      }
    }
    
    // Check if touch is on UI elements
    if (this.isTouchOnUI(point)) {
      return 'ui';
    }
    
    // Default to shooting
    return 'shooting';
  }
  
  private getJoystickArea(): { x: number; y: number; width: number; height: number } {
    const settings = this.settings.getSettings();
    const isLefty = settings.touchControlsLayout === 'lefty';
    
    return {
      x: isLefty ? this.canvas.width - 200 : 0,
      y: this.canvas.height - 200,
      width: 200,
      height: 200
    };
  }
  
  private isPointInArea(point: Point, area: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= area.x && 
           point.x <= area.x + area.width &&
           point.y >= area.y && 
           point.y <= area.y + area.height;
  }
  
  private isTouchOnUI(_point: Point): boolean {
    // Check if touch is on any UI element
    // This would be expanded based on actual UI layout
    return false;
  }
  
  private handleTap(point: Point): void {
    const now = Date.now();
    
    // Check for double tap
    if (now - this.lastTapTime < this.DOUBLE_TAP_THRESHOLD) {
      this.handleDoubleTap(point);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
      
      // Single tap - fire once
      const player = this.game.getPlayer();
      if (player) {
        this.updateAimDirection(point);
        player.tryShoot();
        this.triggerHapticFeedback('medium');
      }
    }
  }
  
  private handleDoubleTap(point: Point): void {
    // Double tap could trigger special ability or toggle auto-fire
    console.log('Double tap at', point);
  }
  
  private startShooting(point: Point): void {
    const player = this.game.getPlayer();
    if (!player) return;
    
    this.updateAimDirection(point);
    player.startShooting();
  }
  
  private stopShooting(): void {
    const player = this.game.getPlayer();
    if (player) {
      player.stopShooting();
    }
  }
  
  private updateAimDirection(point: Point): void {
    const player = this.game.getPlayer();
    if (!player) return;
    
    // Convert canvas coordinates to world coordinates
    const camera = this.game.getCamera();
    const worldPoint = camera.screenToWorld(point);
    
    // Calculate angle from player to touch point
    const dx = worldPoint.x - player.position.x;
    const dy = worldPoint.y - player.position.y;
    const angle = Math.atan2(dy, dx);
    
    player.setAimDirection(angle);
  }
  
  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    const settings = this.settings.getSettings();
    if (!settings.hapticFeedbackEnabled) return;
    
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 25 : 50;
      navigator.vibrate(duration);
    }
  }
  
  public destroy(): void {
    this.touches.clear();
    this.shootingTouch = null;
    this.movementTouch = null;
    
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
  }
  
  // Public API for virtual joystick to report movement
  public updateMovement(direction: Point | null): void {
    const player = this.game.getPlayer();
    if (!player) return;
    
    if (direction) {
      player.setVelocity(direction.x, direction.y);
    } else {
      player.setVelocity(0, 0);
    }
  }
}