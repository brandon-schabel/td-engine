/**
 * TouchGestureManager.ts - Manages touch gestures and maps them to game actions
 * Integrates with the game's camera, UI, and existing touch systems
 */

import type { Game } from '@/core/Game';
import type { Camera } from '@/systems/Camera';
import type { Vector2 } from '@/utils/Vector2';
import { GestureRecognizer, GestureType, GestureEvent } from './GestureRecognizer';
import { 
  GestureConfig, 
  DEFAULT_GESTURE_CONFIG, 
  MOBILE_GESTURE_CONFIG,
  mergeGestureConfig,
  isInDeadZone
} from '@/config/GestureConfig';
import { EventEmitter } from '@/utils/EventEmitter';

export interface GestureAction {
  type: string;
  data: any;
}

export class TouchGestureManager extends EventEmitter {
  private game: Game;
  private camera: Camera;
  private config: GestureConfig;
  private recognizer: GestureRecognizer;
  private canvas: HTMLCanvasElement;
  
  // State tracking
  private isEnabled = true;
  private activeTouches = new Map<number, Touch>();
  private gestureInProgress = false;
  // private lastPinchScale = 1; // Removed - unused
  private cameraStartPosition: Vector2 | null = null;
  private momentum: Vector2 = { x: 0, y: 0 };
  private momentumAnimationId: number | null = null;
  
  // Pinch state
  private initialZoom = 1;
  private pinchActive = false;
  private zoomVelocity = 0;
  private zoomMomentumId: number | null = null;
  
  // Auto-follow state
  private lastGestureTime = 0;
  private movementCheckInterval: number | null = null;
  
  // Dead zone elements
  private uiElements: HTMLElement[] = [];
  
  // Debug visualization
  private debugCanvas: HTMLCanvasElement | null = null;
  private debugCtx: CanvasRenderingContext2D | null = null;
  
  constructor(game: Game, canvas: HTMLCanvasElement, config?: Partial<GestureConfig>) {
    super();
    this.game = game;
    this.camera = game.getCamera();
    this.canvas = canvas;
    
    // Merge config with defaults and mobile overrides if on mobile
    const baseConfig = 'ontouchstart' in window 
      ? mergeGestureConfig(DEFAULT_GESTURE_CONFIG, MOBILE_GESTURE_CONFIG)
      : DEFAULT_GESTURE_CONFIG;
    
    this.config = config ? mergeGestureConfig(baseConfig, config) : baseConfig;
    
    // Create gesture recognizer
    this.recognizer = new GestureRecognizer(this.config);
    this.recognizer.addListener(this.handleGesture.bind(this));
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up debug visualization if enabled
    if (this.config.feedback.debugMode) {
      this.setupDebugVisualization();
    }
  }
  
  private setupEventListeners(): void {
    // Touch event listeners with passive: false for better control
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Prevent default touch behaviors
    this.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    this.canvas.addEventListener('gesturechange', (e) => e.preventDefault());
    this.canvas.addEventListener('gestureend', (e) => e.preventDefault());
  }
  
  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    // Check if mobile controls are active (joysticks being used)
    const mobileControls = this.game.getMobileControls();
    if (mobileControls && mobileControls.isJoystickActive()) {
      // Check if any of the touches belong to joysticks
      const joystickTouchIds = mobileControls.getActiveTouchIds();
      for (let i = 0; i < event.changedTouches.length; i++) {
        if (joystickTouchIds.includes(event.changedTouches[i].identifier)) {
          return; // Don't process this touch for gestures
        }
      }
    }
    
    event.preventDefault();
    
    // Update active touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }
    
    // Check if any touch is in a dead zone
    const touchArray = Array.from(event.touches);
    const touchPoint = { x: touchArray[0].clientX, y: touchArray[0].clientY };
    
    if (isInDeadZone(touchPoint, this.config, this.uiElements)) {
      return;
    }
    
    // Forward to gesture recognizer
    this.recognizer.onTouchStart(touchArray);
    
    // Store camera position for pan/zoom gestures
    if (touchArray.length >= 1) {
      this.cameraStartPosition = this.camera.getPosition();
      this.stopMomentum();
    }
    
    // Haptic feedback
    this.triggerHaptic('light');
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    // Check if mobile controls are active
    const mobileControls = this.game.getMobileControls();
    if (mobileControls && mobileControls.isJoystickActive()) {
      // Filter out touches that belong to joysticks
      const joystickTouchIds = mobileControls.getActiveTouchIds();
      const hasJoystickTouch = Array.from(event.touches).some(touch => 
        joystickTouchIds.includes(touch.identifier)
      );
      
      if (hasJoystickTouch) {
        // If any touch belongs to a joystick, don't process gestures
        return;
      }
    }
    
    event.preventDefault();
    
    // Update active touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }
    
    // Forward to gesture recognizer
    this.recognizer.onTouchMove(Array.from(event.touches));
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    
    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }
    
    // Forward to gesture recognizer
    this.recognizer.onTouchEnd(Array.from(event.changedTouches));
    
    // Handle pinch end
    if (this.pinchActive) {
      this.handlePinchEnd();
    }
    
    // Start momentum if gesture was active
    if (this.gestureInProgress && this.momentum.x !== 0 || this.momentum.y !== 0) {
      this.startMomentum();
    }
    
    this.gestureInProgress = false;
    this.lastGestureTime = Date.now();
  }
  
  private handleTouchCancel(event: TouchEvent): void {
    // Treat cancel as end
    this.handleTouchEnd(event);
    this.recognizer.cancel();
  }
  
  private handleGesture(event: GestureEvent): void {
    const { type, gesture } = event;
    
    switch (type) {
      case GestureType.SWIPE:
        this.handleSwipe(gesture);
        break;
        
      case GestureType.PINCH:
        this.handlePinch(gesture);
        break;
        
      case GestureType.PAN:
        this.handlePan(gesture);
        break;
        
      case GestureType.TAP:
        this.handleTap(gesture);
        break;
        
      case GestureType.DOUBLE_TAP:
        this.handleDoubleTap(gesture);
        break;
        
      case GestureType.LONG_PRESS:
        this.handleLongPress(gesture);
        break;
    }
    
    // Emit gesture event for external listeners
    this.emit('gesture', { type, gesture });
  }
  
  private handleSwipe(gesture: any): void {
    if (!gesture.swipeDirection || !gesture.swipeVelocity) return;
    
    const multiplier = this.config.camera.swipePanMultiplier;
    const velocity = gesture.swipeVelocity;
    
    // Calculate pan distance based on swipe velocity
    const panDistance = {
      x: -velocity.x * multiplier * 100, // Negative to move camera opposite to swipe
      y: -velocity.y * multiplier * 100
    };
    
    // Set momentum for smooth deceleration
    this.momentum = {
      x: panDistance.x / 10,
      y: panDistance.y / 10
    };
    
    // Start panning with momentum
    this.startMomentum();
    
    // Haptic feedback
    this.triggerHaptic('medium');
    
    // Emit swipe event
    this.emit('swipe', {
      direction: gesture.swipeDirection,
      velocity: gesture.swipeVelocity
    });
  }
  
  private handlePinch(gesture: any): void {
    if (!gesture.pinchScale || !gesture.pinchCenter) return;
    
    this.gestureInProgress = true;
    
    // Initialize on gesture start
    if (!this.pinchActive) {
      this.pinchActive = true;
      this.initialZoom = this.camera.getZoom();
      // Reset scale tracking
      // Disable camera following during pinch
      this.camera.setFollowTarget(false);
    }
    
    const scale = gesture.pinchScale;
    
    // Use logarithmic scaling for more natural feel
    const logScale = Math.log2(scale);
    
    // Different sensitivity for zoom in vs out
    const sensitivity = scale > 1 
      ? this.config.camera.pinchZoomMultiplier 
      : this.config.camera.pinchZoomOutMultiplier;
    
    // Calculate target zoom multiplicatively
    const targetZoom = this.initialZoom * Math.pow(2, logScale * sensitivity);
    
    // Apply smoothing
    const currentZoom = this.camera.getZoom();
    const zoomDelta = targetZoom - currentZoom;
    const smoothedZoom = currentZoom + zoomDelta * this.config.thresholds.pinch.smoothing;
    
    // Clamp zoom
    const finalZoom = Math.max(
      this.config.camera.minZoomGesture,
      Math.min(this.config.camera.maxZoomGesture, smoothedZoom)
    );
    
    // Track velocity for momentum
    this.zoomVelocity = zoomDelta;
    
    // Apply zoom with focal point using the camera's new method
    if ('zoomAtPoint' in this.camera && typeof this.camera.zoomAtPoint === 'function') {
      this.camera.zoomAtPoint(finalZoom, gesture.pinchCenter);
    } else {
      // Fallback for cameras without zoomAtPoint
      this.camera.setZoom(finalZoom);
    }
    
    // Emit pinch event
    this.emit('pinch', { scale, center: gesture.pinchCenter });
  }
  
  private handlePan(gesture: any): void {
    if (!gesture.panDelta || !this.cameraStartPosition) return;
    
    this.gestureInProgress = true;
    
    // Disable camera following during pan
    this.camera.setFollowTarget(false);
    
    // Calculate camera movement (inverted for natural feel)
    const sensitivity = this.config.camera.swipePanMultiplier;
    const zoom = this.camera.getZoom();
    
    const cameraOffset = {
      x: -gesture.panDelta.x / zoom * sensitivity,
      y: -gesture.panDelta.y / zoom * sensitivity
    };
    
    // Apply camera movement
    this.camera.setPosition({
      x: this.cameraStartPosition.x + cameraOffset.x,
      y: this.cameraStartPosition.y + cameraOffset.y
    });
    
    // Update momentum for when gesture ends
    if (gesture.panVelocity) {
      this.momentum = {
        x: -gesture.panVelocity.x * sensitivity * 20,
        y: -gesture.panVelocity.y * sensitivity * 20
      };
    }
    
    // Emit pan event
    this.emit('pan', { delta: gesture.panDelta, velocity: gesture.panVelocity });
  }
  
  private handleTap(gesture: any): void {
    // Forward tap to game for normal interactions
    const touch = gesture.startTouches[0];
    if (touch) {
      const worldPos = this.camera.screenToWorld(touch.position);
      
      // Create synthetic mouse event
      const mouseEvent = new MouseEvent('click', {
        clientX: touch.position.x,
        clientY: touch.position.y,
        button: 0
      });
      
      // Let game handle the tap as a click
      this.game.handleMouseClick(mouseEvent);
      
      // Haptic feedback
      this.triggerHaptic('light');
      
      // Emit tap event
      this.emit('tap', { position: worldPos });
    }
  }
  
  private handleDoubleTap(gesture: any): void {
    // Center camera on player on double tap
    const player = this.game.getPlayer();
    if (player) {
      this.camera.setFollowTarget(true);
      this.camera.centerOnTarget(player.position);
      
      // Haptic feedback
      this.triggerHaptic('medium');
      
      // Emit double tap event
      this.emit('doubleTap', { position: gesture.startTouches[0].position });
    }
  }
  
  private handleLongPress(gesture: any): void {
    const touch = gesture.startTouches[0];
    if (touch) {
      const worldPos = this.camera.screenToWorld(touch.position);
      
      // Could show context menu or info panel
      // For now, just emit event
      this.emit('longPress', { position: worldPos });
      
      // Haptic feedback
      this.triggerHaptic('heavy');
    }
  }
  
  private startMomentum(): void {
    if (!this.config.camera.momentumDuration) return;
    
    const startTime = Date.now();
    const duration = this.config.camera.momentumDuration;
    const deceleration = this.config.camera.swipePanMultiplier;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out deceleration
      const factor = 1 - Math.pow(progress, deceleration);
      
      if (progress < 1 && (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1)) {
        // Apply momentum
        this.camera.pan(
          this.momentum.x * factor,
          this.momentum.y * factor
        );
        
        // Decay momentum
        this.momentum.x *= this.config.thresholds.pan.deceleration;
        this.momentum.y *= this.config.thresholds.pan.deceleration;
        
        this.momentumAnimationId = requestAnimationFrame(animate);
      } else {
        this.stopMomentum();
      }
    };
    
    this.momentumAnimationId = requestAnimationFrame(animate);
  }
  
  private stopMomentum(): void {
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
      this.momentumAnimationId = null;
    }
    this.momentum = { x: 0, y: 0 };
  }
  
  private handlePinchEnd(): void {
    this.pinchActive = false;
    
    // Start zoom momentum if velocity is significant
    if (Math.abs(this.zoomVelocity) > this.config.thresholds.pinch.velocityThreshold) {
      this.startZoomMomentum();
    }
  }
  
  private startZoomMomentum(): void {
    const animate = () => {
      // Apply zoom velocity with decay
      if (Math.abs(this.zoomVelocity) > 0.001) {
        const currentZoom = this.camera.getZoom();
        const targetZoom = currentZoom + this.zoomVelocity;
        
        // Clamp zoom
        const finalZoom = Math.max(
          this.config.camera.minZoomGesture,
          Math.min(this.config.camera.maxZoomGesture, targetZoom)
        );
        
        this.camera.setZoom(finalZoom);
        
        // Decay velocity
        this.zoomVelocity *= this.config.thresholds.pinch.momentumDecay;
        
        this.zoomMomentumId = requestAnimationFrame(animate);
      } else {
        this.stopZoomMomentum();
      }
    };
    
    this.zoomMomentumId = requestAnimationFrame(animate);
  }
  
  private stopZoomMomentum(): void {
    if (this.zoomMomentumId) {
      cancelAnimationFrame(this.zoomMomentumId);
      this.zoomMomentumId = null;
    }
    this.zoomVelocity = 0;
  }
  
  /**
   * Check if enough time has passed since last gesture for auto-follow
   */
  public shouldAutoFollow(): boolean {
    if (!this.config.camera.autoFollowOnMovement) return false;
    
    const timeSinceGesture = Date.now() - this.lastGestureTime;
    return timeSinceGesture > this.config.camera.autoFollowDelay;
  }
  
  /**
   * Get time since last gesture
   */
  public getTimeSinceLastGesture(): number {
    return Date.now() - this.lastGestureTime;
  }
  
  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy'): void {
    if (!this.config.feedback.haptic) return;
    
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 25 : 50;
      navigator.vibrate(duration);
    }
  }
  
  /**
   * Enable or disable gesture recognition
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.recognizer.cancel();
      this.stopMomentum();
    }
  }
  
  /**
   * Add UI element to dead zones
   */
  public addUIElement(element: HTMLElement): void {
    if (!this.uiElements.includes(element)) {
      this.uiElements.push(element);
    }
  }
  
  /**
   * Remove UI element from dead zones
   */
  public removeUIElement(element: HTMLElement): void {
    const index = this.uiElements.indexOf(element);
    if (index !== -1) {
      this.uiElements.splice(index, 1);
    }
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GestureConfig>): void {
    this.config = mergeGestureConfig(this.config, config);
    this.recognizer = new GestureRecognizer(this.config);
    this.recognizer.addListener(this.handleGesture.bind(this));
  }
  
  /**
   * Set up debug visualization
   */
  private setupDebugVisualization(): void {
    this.debugCanvas = document.createElement('canvas');
    this.debugCanvas.style.position = 'absolute';
    this.debugCanvas.style.top = '0';
    this.debugCanvas.style.left = '0';
    this.debugCanvas.style.pointerEvents = 'none';
    this.debugCanvas.style.zIndex = '9999';
    this.debugCanvas.width = this.canvas.width;
    this.debugCanvas.height = this.canvas.height;
    
    this.canvas.parentElement?.appendChild(this.debugCanvas);
    this.debugCtx = this.debugCanvas.getContext('2d');
    
    // Update debug canvas on gesture
    this.on('gesture', (event) => {
      this.renderDebugInfo(event);
    });
  }
  
  private renderDebugInfo(event: any): void {
    if (!this.debugCtx || !this.debugCanvas) return;
    
    // Clear canvas
    this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    
    // Draw gesture info
    this.debugCtx.fillStyle = '#00FF00';
    this.debugCtx.font = '16px monospace';
    this.debugCtx.fillText(`Gesture: ${event.type}`, 10, 30);
    
    // Draw touch points
    this.activeTouches.forEach((touch) => {
      this.debugCtx!.beginPath();
      this.debugCtx!.arc(touch.clientX, touch.clientY, 30, 0, Math.PI * 2);
      this.debugCtx!.strokeStyle = '#FF0000';
      this.debugCtx!.lineWidth = 2;
      this.debugCtx!.stroke();
    });
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    this.stopMomentum();
    this.stopZoomMomentum();
    this.recognizer.removeListener(this.handleGesture.bind(this));
    
    if (this.debugCanvas) {
      this.debugCanvas.remove();
    }
    
    if (this.movementCheckInterval) {
      clearInterval(this.movementCheckInterval);
    }
    
    this.removeAllListeners();
  }
}