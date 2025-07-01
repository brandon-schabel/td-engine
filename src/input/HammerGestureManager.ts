/**
 * HammerGestureManager.ts - Hammer.js-based gesture management
 * Replaces the custom TouchGestureManager with a more robust solution
 */

import Hammer from 'hammerjs';
import type { Game } from '@/core/Game';
import type { Camera } from '@/systems/Camera';
import type { Vector2 } from '@/utils/Vector2';
import { EventEmitter } from '@/utils/EventEmitter';
import { 
  GestureConfig, 
  DEFAULT_GESTURE_CONFIG, 
  MOBILE_GESTURE_CONFIG,
  mergeGestureConfig
} from '@/config/GestureConfig';
import { gsap } from '@/utils/AnimationUtils';

export interface GestureAction {
  type: string;
  data: any;
}

export class HammerGestureManager extends EventEmitter {
  private game: Game;
  private camera: Camera;
  private config: GestureConfig;
  private hammer: HammerManager;
  private canvas: HTMLCanvasElement;
  
  // State tracking
  private isEnabled = true;
  private gestureInProgress = false;
  private cameraStartPosition: Vector2 | null = null;
  private momentum: Vector2 = { x: 0, y: 0 };
  private momentumTween: gsap.core.Tween | null = null;
  
  // Pinch state
  private initialZoom = 1;
  private pinchActive = false;
  
  // Auto-follow state
  private lastGestureTime = 0;
  
  // Dead zone elements
  private uiElements: HTMLElement[] = [];
  
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
    
    // Initialize Hammer.js
    this.hammer = new Hammer.Manager(canvas);
    this.setupHammerRecognizers();
    this.setupHammerHandlers();
  }
  
  private setupHammerRecognizers(): void {
    // Configure recognizers based on our config
    const { thresholds } = this.config;
    
    // Pan gesture (for camera panning)
    this.hammer.add(new Hammer.Pan({
      direction: Hammer.DIRECTION_ALL,
      threshold: thresholds.pan.minDistance,
      pointers: 1
    }));
    
    // Pinch gesture (for zooming)
    this.hammer.add(new Hammer.Pinch({
      threshold: 0.1 // Start detecting at 10% scale change
    }));
    
    // Tap gesture
    this.hammer.add(new Hammer.Tap({
      event: 'tap',
      taps: 1,
      threshold: thresholds.tap.maxDistance,
      time: thresholds.tap.maxDuration
    }));
    
    // Double tap gesture
    this.hammer.add(new Hammer.Tap({
      event: 'doubletap',
      taps: 2,
      interval: thresholds.tap.doubleTapDelay,
      threshold: thresholds.tap.maxDistance
    }));
    
    // Long press gesture
    this.hammer.add(new Hammer.Press({
      time: thresholds.longPress.minDuration,
      threshold: thresholds.longPress.maxDistance
    }));
    
    // Swipe gesture
    this.hammer.add(new Hammer.Swipe({
      direction: Hammer.DIRECTION_ALL,
      threshold: thresholds.swipe.minDistance,
      velocity: thresholds.swipe.minVelocity
    }));
    
    // Enable multi-touch for pinch
    this.hammer.get('pinch').set({ enable: true });
    
    // Recognize tap and double tap together
    const doubleTapRecognizer = this.hammer.get('doubletap');
    const tapRecognizer = this.hammer.get('tap');
    if (doubleTapRecognizer && tapRecognizer) {
      doubleTapRecognizer.recognizeWith(tapRecognizer);
    }
    
    // Pan should wait for tap/press to fail
    const panRecognizer = this.hammer.get('pan');
    const pressRecognizer = this.hammer.get('press');
    if (panRecognizer && tapRecognizer && pressRecognizer) {
      panRecognizer.requireFailure([tapRecognizer, pressRecognizer]);
    }
  }
  
  private setupHammerHandlers(): void {
    // Pan events
    this.hammer.on('panstart', this.handlePanStart.bind(this));
    this.hammer.on('panmove', this.handlePanMove.bind(this));
    this.hammer.on('panend pancancel', this.handlePanEnd.bind(this));
    
    // Pinch events
    this.hammer.on('pinchstart', this.handlePinchStart.bind(this));
    this.hammer.on('pinchmove', this.handlePinchMove.bind(this));
    this.hammer.on('pinchend pinchcancel', this.handlePinchEnd.bind(this));
    
    // Tap events
    this.hammer.on('tap', this.handleTap.bind(this));
    this.hammer.on('doubletap', this.handleDoubleTap.bind(this));
    
    // Press events
    this.hammer.on('press', this.handlePress.bind(this));
    
    // Swipe events
    this.hammer.on('swipe', this.handleSwipe.bind(this));
  }
  
  private handlePanStart(event: HammerInput): void {
    if (!this.isEnabled || this.shouldIgnoreGesture(event)) return;
    
    this.gestureInProgress = true;
    this.cameraStartPosition = this.camera.getPosition();
    this.camera.setFollowTarget(false);
    this.lastGestureTime = Date.now();
    
    // Kill any existing momentum
    if (this.momentumTween) {
      this.momentumTween.kill();
      this.momentumTween = null;
    }
  }
  
  private handlePanMove(event: HammerInput): void {
    if (!this.isEnabled || !this.cameraStartPosition) return;
    
    const sensitivity = this.config.camera.swipePanMultiplier;
    const zoom = this.camera.getZoom();
    
    // Calculate camera movement (inverted for natural feel)
    const cameraOffset = {
      x: -event.deltaX / zoom * sensitivity,
      y: -event.deltaY / zoom * sensitivity
    };
    
    // Apply camera movement
    this.camera.setPosition({
      x: this.cameraStartPosition.x + cameraOffset.x,
      y: this.cameraStartPosition.y + cameraOffset.y
    });
    
    // Track momentum
    this.momentum = {
      x: event.velocityX * sensitivity * 20,
      y: event.velocityY * sensitivity * 20
    };
    
    this.emit('pan', { delta: { x: event.deltaX, y: event.deltaY } });
  }
  
  private handlePanEnd(_event: HammerInput): void {
    if (!this.isEnabled) return;
    
    this.gestureInProgress = false;
    
    // Apply momentum with GSAP
    if (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1) {
      const currentPos = this.camera.getPosition();
      const targetPos = {
        x: currentPos.x - this.momentum.x,
        y: currentPos.y - this.momentum.y
      };
      
      this.momentumTween = gsap.to(currentPos, {
        x: targetPos.x,
        y: targetPos.y,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          this.camera.setPosition(currentPos);
        },
        onComplete: () => {
          this.checkAutoFollow();
        }
      });
    } else {
      this.checkAutoFollow();
    }
  }
  
  private handlePinchStart(event: HammerInput): void {
    if (!this.isEnabled || this.shouldIgnoreGesture(event)) return;
    
    this.pinchActive = true;
    this.initialZoom = this.camera.getZoom();
    this.camera.setFollowTarget(false);
    this.lastGestureTime = Date.now();
  }
  
  private handlePinchMove(event: HammerInput): void {
    if (!this.isEnabled || !this.pinchActive) return;
    
    const scale = event.scale;
    const center = { x: event.center.x, y: event.center.y };
    
    // Different sensitivity for zoom in vs out
    const sensitivity = scale > 1 
      ? this.config.camera.pinchZoomMultiplier 
      : this.config.camera.pinchZoomOutMultiplier;
    
    // Calculate target zoom
    const targetZoom = this.initialZoom * Math.pow(scale, sensitivity);
    
    // Clamp zoom
    const finalZoom = Math.max(
      this.config.camera.minZoomGesture,
      Math.min(this.config.camera.maxZoomGesture, targetZoom)
    );
    
    // Apply zoom with focal point
    if ('zoomAtPoint' in this.camera && typeof this.camera.zoomAtPoint === 'function') {
      this.camera.zoomAtPoint(finalZoom, center);
    } else {
      this.camera.setZoom(finalZoom);
    }
    
    this.emit('pinch', { scale, center });
  }
  
  private handlePinchEnd(_event: HammerInput): void {
    if (!this.isEnabled) return;
    
    this.pinchActive = false;
    this.checkAutoFollow();
  }
  
  private handleTap(event: HammerInput): void {
    if (!this.isEnabled || this.shouldIgnoreGesture(event)) return;
    
    const worldPos = this.camera.screenToWorld({
      x: event.center.x,
      y: event.center.y
    });
    
    this.emit('tap', { position: worldPos });
    this.triggerHaptic('light');
  }
  
  private handleDoubleTap(event: HammerInput): void {
    if (!this.isEnabled || this.shouldIgnoreGesture(event)) return;
    
    // Center camera on player
    const player = this.game.getPlayer();
    if (player) {
      const currentZoom = this.camera.getZoom();
      const targetZoom = currentZoom < 1.5 ? 2 : 1;
      
      // Animate to player position with zoom
      gsap.to(this.camera, {
        zoom: targetZoom,
        duration: 0.3,
        ease: 'power2.inOut'
      });
      
      this.camera.setFollowTarget(true);
    }
    
    this.emit('doubleTap', { position: { x: event.center.x, y: event.center.y } });
    this.triggerHaptic('medium');
  }
  
  private handlePress(event: HammerInput): void {
    if (!this.isEnabled || this.shouldIgnoreGesture(event)) return;
    
    const worldPos = this.camera.screenToWorld({
      x: event.center.x,
      y: event.center.y
    });
    
    this.emit('longPress', { position: worldPos });
    this.triggerHaptic('heavy');
  }
  
  private handleSwipe(event: HammerInput): void {
    if (!this.isEnabled) return;
    
    const direction = this.getSwipeDirection(event.direction || 0);
    const velocity = { x: event.velocityX || 0, y: event.velocityY || 0 };
    
    // Quick camera pan based on swipe
    const multiplier = this.config.camera.swipePanMultiplier * 100;
    const currentPos = this.camera.getPosition();
    const targetPos = {
      x: currentPos.x - velocity.x * multiplier,
      y: currentPos.y - velocity.y * multiplier
    };
    
    // Animate camera to target position
    gsap.to(currentPos, {
      x: targetPos.x,
      y: targetPos.y,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        this.camera.setPosition(currentPos);
      }
    });
    
    this.emit('swipe', { direction, velocity });
    this.triggerHaptic('medium');
  }
  
  private getSwipeDirection(hammerDirection: number): string {
    switch (hammerDirection) {
      case Hammer.DIRECTION_UP: return 'up';
      case Hammer.DIRECTION_DOWN: return 'down';
      case Hammer.DIRECTION_LEFT: return 'left';
      case Hammer.DIRECTION_RIGHT: return 'right';
      default: return 'none';
    }
  }
  
  private shouldIgnoreGesture(event: HammerInput): boolean {
    const point = { x: event.center.x, y: event.center.y };
    
    // Check custom dead zones
    for (const zone of this.config.deadZones.customAreas) {
      if (point.x >= zone.x && point.x <= zone.x + zone.width &&
          point.y >= zone.y && point.y <= zone.y + zone.height) {
        return true;
      }
    }
    
    // Check UI elements
    for (const element of this.uiElements) {
      const rect = element.getBoundingClientRect();
      if (point.x >= rect.left && point.x <= rect.right &&
          point.y >= rect.top && point.y <= rect.bottom) {
        return true;
      }
    }
    
    // Check if mobile controls are being used
    const mobileControls = this.game.getMobileControls();
    if (mobileControls?.isJoystickActive()) {
      return true;
    }
    
    return false;
  }
  
  private checkAutoFollow(): void {
    const timeSinceGesture = Date.now() - this.lastGestureTime;
    
    if (timeSinceGesture >= this.config.camera.autoFollowDelay) {
      this.camera.setFollowTarget(true);
    } else {
      // Check again after remaining delay
      const remainingDelay = this.config.camera.autoFollowDelay - timeSinceGesture;
      setTimeout(() => this.checkAutoFollow(), remainingDelay);
    }
  }
  
  private triggerHaptic(style: 'light' | 'medium' | 'heavy'): void {
    if (!this.config.feedback.haptic) return;
    
    // Use the Vibration API if available
    if ('vibrate' in navigator) {
      // Define haptic durations
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(durations[style]);
    }
  }
  
  // Public API
  
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      // Kill any ongoing animations
      if (this.momentumTween) {
        this.momentumTween.kill();
        this.momentumTween = null;
      }
    }
  }
  
  public isGestureInProgress(): boolean {
    return this.gestureInProgress || this.pinchActive;
  }
  
  public shouldAutoFollow(): boolean {
    if (!this.config.camera.autoFollowOnMovement) return false;
    
    const timeSinceGesture = Date.now() - this.lastGestureTime;
    return timeSinceGesture > this.config.camera.autoFollowDelay;
  }
  
  public registerUIElement(element: HTMLElement): void {
    if (!this.uiElements.includes(element)) {
      this.uiElements.push(element);
    }
  }
  
  public unregisterUIElement(element: HTMLElement): void {
    const index = this.uiElements.indexOf(element);
    if (index > -1) {
      this.uiElements.splice(index, 1);
    }
  }
  
  public updateConfig(config: Partial<GestureConfig>): void {
    this.config = mergeGestureConfig(this.config, config);
    // Re-setup Hammer with new config
    this.hammer.destroy();
    this.hammer = new Hammer.Manager(this.canvas);
    this.setupHammerRecognizers();
    this.setupHammerHandlers();
  }
  
  public destroy(): void {
    if (this.momentumTween) {
      this.momentumTween.kill();
      this.momentumTween = null;
    }
    
    this.hammer.destroy();
    this.removeAllListeners();
  }
}