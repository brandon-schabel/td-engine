import type { Point } from '@/types/geometry';
import { SettingsManager } from '@/config/GameSettings';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface JoystickEvent {
  direction: Point | null;
  magnitude: number;
}

export class VirtualJoystick {
  private container: HTMLElement;
  private base: HTMLElement;
  private knob: HTMLElement;
  private isActive = false;
  private touchId: number | null = null;
  
  // Configuration from UI_CONSTANTS
  private readonly baseSize = UI_CONSTANTS.virtualJoystick.base.size;
  private readonly knobSize = UI_CONSTANTS.virtualJoystick.knob.size;
  private readonly maxDistance = UI_CONSTANTS.virtualJoystick.knob.maxDistance;
  private readonly deadZone = 0.2;
  
  private onMove: (event: JoystickEvent) => void;
  private settings = SettingsManager.getInstance();
  
  constructor(container: HTMLElement, onMove: (event: JoystickEvent) => void) {
    this.container = container;
    this.onMove = onMove;
    
    this.createElements();
    this.setupEventListeners();
    this.updateVisibility();
  }
  
  private createElements(): void {
    // Create base
    this.base = document.createElement('div');
    this.base.className = 'virtual-joystick-base';
    this.base.style.cssText = `
      position: absolute;
      width: ${this.baseSize}px;
      height: ${this.baseSize}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
      opacity: ${UI_CONSTANTS.virtualJoystick.base.opacity};
      transition: opacity ${ANIMATION_CONFIG.durations.uiTransition}ms;
      pointer-events: auto;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    `;
    
    // Create knob
    this.knob = document.createElement('div');
    this.knob.className = 'virtual-joystick-knob';
    this.knob.style.cssText = `
      position: absolute;
      width: ${this.knobSize}px;
      height: ${this.knobSize}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.8);
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      transition: none;
      pointer-events: none;
    `;
    
    this.base.appendChild(this.knob);
    this.container.appendChild(this.base);
    
    this.updatePosition();
  }
  
  private setupEventListeners(): void {
    // Touch events
    this.base.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
    this.base.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
    this.base.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
    this.base.addEventListener('touchcancel', this.handleEnd.bind(this), { passive: false });
    
    // Mouse events for testing
    this.base.addEventListener('mousedown', this.handleMouseStart.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseEnd.bind(this));
  }
  
  private handleStart(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.touchId !== null) return;
    
    const touch = event.changedTouches[0];
    this.touchId = touch.identifier;
    this.isActive = true;
    
    this.base.style.opacity = String(UI_CONSTANTS.virtualJoystick.base.activeOpacity);
    
    const point = this.getTouchPoint(touch);
    this.updateKnobPosition(point);
    
    this.triggerHapticFeedback('light');
  }
  
  private handleMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (!this.isActive) return;
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.touchId) {
        const point = this.getTouchPoint(touch);
        this.updateKnobPosition(point);
        break;
      }
    }
  }
  
  private handleEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.touchId) {
        this.reset();
        break;
      }
    }
  }
  
  // Mouse handlers for testing
  private handleMouseStart(event: MouseEvent): void {
    event.preventDefault();
    this.isActive = true;
    this.base.style.opacity = String(UI_CONSTANTS.virtualJoystick.base.activeOpacity);
    
    const point = this.getMousePoint(event);
    this.updateKnobPosition(point);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const point = this.getMousePoint(event);
    this.updateKnobPosition(point);
  }
  
  private handleMouseEnd(): void {
    if (this.isActive) {
      this.reset();
    }
  }
  
  private getTouchPoint(touch: Touch): Point {
    const rect = this.base.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left - this.baseSize / 2,
      y: touch.clientY - rect.top - this.baseSize / 2
    };
  }
  
  private getMousePoint(event: MouseEvent): Point {
    const rect = this.base.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - this.baseSize / 2,
      y: event.clientY - rect.top - this.baseSize / 2
    };
  }
  
  private updateKnobPosition(point: Point): void {
    const distance = Math.sqrt(point.x * point.x + point.y * point.y);
    const maxDist = this.maxDistance;
    
    let knobX = point.x;
    let knobY = point.y;
    
    // Constrain to max distance
    if (distance > maxDist) {
      const ratio = maxDist / distance;
      knobX *= ratio;
      knobY *= ratio;
    }
    
    // Update knob visual position
    this.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Calculate normalized direction
    if (distance > this.deadZone * maxDist) {
      const normalizedMagnitude = Math.min(distance / maxDist, 1);
      const direction = {
        x: knobX / maxDist,
        y: knobY / maxDist
      };
      
      this.onMove({
        direction,
        magnitude: normalizedMagnitude
      });
    } else {
      // In dead zone
      this.onMove({
        direction: null,
        magnitude: 0
      });
    }
  }
  
  private reset(): void {
    this.isActive = false;
    this.touchId = null;
    this.base.style.opacity = String(UI_CONSTANTS.virtualJoystick.base.opacity);
    
    // Animate knob back to center
    this.knob.style.transition = `transform ${ANIMATION_CONFIG.durations.uiTransition}ms ease-out`;
    this.knob.style.transform = 'translate(-50%, -50%)';
    
    setTimeout(() => {
      this.knob.style.transition = 'none';
    }, ANIMATION_CONFIG.durations.uiTransition);
    
    // Send null direction
    this.onMove({
      direction: null,
      magnitude: 0
    });
  }
  
  private updatePosition(): void {
    const settings = this.settings.getSettings();
    const isLefty = settings.touchControlsLayout === 'lefty';
    
    // Position in bottom corner using UI_CONSTANTS
    this.base.style.left = isLefty ? 'auto' : `${UI_CONSTANTS.virtualJoystick.position.left}px`;
    this.base.style.right = isLefty ? `${UI_CONSTANTS.virtualJoystick.position.left}px` : 'auto';
    this.base.style.bottom = `${UI_CONSTANTS.virtualJoystick.position.bottom}px`;
  }
  
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    const settings = this.settings.getSettings();
    if (!settings.hapticFeedbackEnabled) return;
    
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 25 : 50;
      navigator.vibrate(duration);
    }
  }
  
  public updateVisibility(): void {
    const settings = this.settings.getSettings();
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (settings.mobileJoystickEnabled && isTouch) {
      this.base.style.display = 'block';
      this.updatePosition();
    } else {
      this.base.style.display = 'none';
    }
  }
  
  public destroy(): void {
    this.reset();
    this.base.remove();
    
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('mouseup', this.handleMouseEnd.bind(this));
  }
}