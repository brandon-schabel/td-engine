/**
 * Virtual Joystick Component
 * Touch-friendly joystick for mobile game controls
 */

import { Component } from '../core/Component';
import type { ComponentProps, ComponentState } from '../core/types';
import { StyleSystem } from '../core/StyleSystem';
import type { UnifiedPointerEvent } from '../core/types';

export interface VirtualJoystickProps extends ComponentProps {
  size?: number;
  innerSize?: number;
  position?: { x: number; y: number };
  deadzone?: number;
  sensitivity?: number;
  visible?: boolean;
  snapToCenter?: boolean;
  followTouch?: boolean;
  onMove?: (direction: number, magnitude: number, normalizedX: number, normalizedY: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VirtualJoystickState extends ComponentState {
  isActive: boolean;
  currentPosition: { x: number; y: number };
  touchId: number | null;
  magnitude: number;
  angle: number;
}

/**
 * VirtualJoystick - Mobile-friendly directional control
 */
export class VirtualJoystick extends Component<VirtualJoystickProps, VirtualJoystickState> {
  private centerX: number = 0;
  private centerY: number = 0;
  private knobElement: HTMLElement | null = null;
  private boundaryElement: HTMLElement | null = 0;
  private animationFrame: number | null = null;
  
  protected getDefaultProps(): Partial<VirtualJoystickProps> {
    return {
      size: 100,
      innerSize: 40,
      position: { x: 100, y: window.innerHeight - 120 },
      deadzone: 0.1,
      sensitivity: 1.0,
      visible: true,
      snapToCenter: true,
      followTouch: false
    };
  }

  protected getInitialState(): VirtualJoystickState {
    return {
      isActive: false,
      currentPosition: { x: 0, y: 0 },
      touchId: null,
      magnitude: 0,
      angle: 0
    };
  }

  protected render(): string {
    const { size, position, visible } = this.mergedProps;
    const { isActive } = this.state;
    
    if (!visible) return '';
    
    const styles = this.getJoystickStyles();
    
    return `
      <div class="${styles.container}" data-joystick="boundary">
        <div class="${styles.knob}" data-joystick="knob"></div>
        <div class="${styles.centerDot}"></div>
      </div>
    `;
  }

  protected afterMount(): void {
    this.setupEventListeners();
    this.updatePosition();
    this.startRenderLoop();
    
    // Store references to elements
    this.boundaryElement = this.element?.querySelector('[data-joystick="boundary"]') as HTMLElement;
    this.knobElement = this.element?.querySelector('[data-joystick="knob"]') as HTMLElement;
    
    // Set initial position
    const { position, size } = this.mergedProps;
    if (position) {
      this.centerX = position.x;
      this.centerY = position.y;
      this.updateElementPosition();
    }
  }

  private getJoystickStyles() {
    const { size, innerSize, position } = this.mergedProps;
    const { isActive } = this.state;
    const theme = StyleSystem.getInstance().getTheme();
    
    const radius = size! / 2;
    const knobRadius = innerSize! / 2;
    
    return StyleSystem.getInstance().createStyles({
      container: {
        position: 'fixed',
        left: `${position!.x - radius}px`,
        top: `${position!.y - radius}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: theme.touch.virtualControls.joystick.background,
        border: theme.touch.virtualControls.joystick.border,
        backdropFilter: 'blur(10px)',
        zIndex: theme.zIndex.virtualControls,
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s ease, transform 0.1s ease',
        opacity: isActive ? '1' : '0.7',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        boxShadow: theme.shadows.lg,
        
        // Safe area support
        '@media (max-height: 700px)': {
          transform: `translateY(-${theme.touch.safeAreas.bottom})`,
        },
      },
      
      knob: {
        position: 'absolute',
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryLight})`,
        border: `2px solid ${theme.colors.primaryText}`,
        boxShadow: `${theme.shadows.md}, inset 0 1px 0 rgba(255,255,255,0.3)`,
        transition: isActive ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'grab',
        
        '&:active': {
          cursor: 'grabbing',
          transform: 'scale(0.95)',
        },
        
        // Add subtle animation when idle
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        
        animation: !isActive ? 'pulse 2s ease-in-out infinite' : 'none',
      },
      
      centerDot: {
        position: 'absolute',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: theme.colors.textSecondary,
        opacity: 0.5,
        pointerEvents: 'none',
      },
    });
  }

  private setupEventListeners(): void {
    if (!this.element) return;
    
    // Use pointer events for better cross-platform support
    this.element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    document.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
    
    // Fallback to touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Prevent context menu
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.startJoystick(event.pointerId, event.clientX, event.clientY);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.state.touchId === event.pointerId) {
      event.preventDefault();
      this.updateJoystick(event.clientX, event.clientY);
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (this.state.touchId === event.pointerId) {
      this.endJoystick();
    }
  }

  private handlePointerCancel(event: PointerEvent): void {
    if (this.state.touchId === event.pointerId) {
      this.endJoystick();
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (this.state.touchId !== null) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    this.startJoystick(touch.identifier, touch.clientX, touch.clientY);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.state.touchId === null) return;
    
    const touch = Array.from(event.touches).find(t => t.identifier === this.state.touchId);
    if (touch) {
      event.preventDefault();
      this.updateJoystick(touch.clientX, touch.clientY);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touch = Array.from(event.changedTouches).find(t => t.identifier === this.state.touchId);
    if (touch) {
      this.endJoystick();
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    const touch = Array.from(event.changedTouches).find(t => t.identifier === this.state.touchId);
    if (touch) {
      this.endJoystick();
    }
  }

  private startJoystick(touchId: number, clientX: number, clientY: number): void {
    const { followTouch, onStart } = this.mergedProps;
    
    // If followTouch is enabled, move the joystick to touch position
    if (followTouch) {
      this.centerX = clientX;
      this.centerY = clientY;
      this.updateElementPosition();
    }
    
    this.setState({
      isActive: true,
      touchId: touchId,
      currentPosition: { x: 0, y: 0 }
    });
    
    // Trigger haptic feedback
    this.triggerHapticFeedback('light');
    
    onStart?.();
  }

  private updateJoystick(clientX: number, clientY: number): void {
    const { size, deadzone, sensitivity, onMove } = this.mergedProps;
    const radius = size! / 2;
    
    // Calculate relative position from center
    const deltaX = clientX - this.centerX;
    const deltaY = clientY - this.centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clamp to circle boundary
    const clampedDistance = Math.min(distance, radius);
    const angle = Math.atan2(deltaY, deltaX);
    
    // Calculate normalized position (-1 to 1)
    const normalizedX = clampedDistance * Math.cos(angle) / radius;
    const normalizedY = clampedDistance * Math.sin(angle) / radius;
    
    // Apply deadzone
    const magnitude = clampedDistance / radius;
    const adjustedMagnitude = magnitude > deadzone! ? 
      (magnitude - deadzone!) / (1 - deadzone!) : 0;
    
    // Update visual position
    const visualX = normalizedX * radius;
    const visualY = normalizedY * radius;
    
    this.setState({
      currentPosition: { x: visualX, y: visualY },
      magnitude: adjustedMagnitude,
      angle: angle
    });
    
    // Update knob visual position
    this.updateKnobPosition(visualX, visualY);
    
    // Trigger callback with adjusted values
    if (onMove && adjustedMagnitude > 0) {
      const finalX = normalizedX * sensitivity!;
      const finalY = normalizedY * sensitivity!;
      onMove(angle, adjustedMagnitude, finalX, finalY);
    }
  }

  private endJoystick(): void {
    const { snapToCenter, onEnd } = this.mergedProps;
    
    this.setState({
      isActive: false,
      touchId: null,
      currentPosition: { x: 0, y: 0 },
      magnitude: 0,
      angle: 0
    });
    
    // Animate back to center if enabled
    if (snapToCenter) {
      this.updateKnobPosition(0, 0);
    }
    
    // Trigger haptic feedback
    this.triggerHapticFeedback('light');
    
    onEnd?.();
  }

  private updateKnobPosition(x: number, y: number): void {
    if (this.knobElement) {
      this.knobElement.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  private updateElementPosition(): void {
    if (this.element) {
      const { size } = this.mergedProps;
      const radius = size! / 2;
      this.element.style.left = `${this.centerX - radius}px`;
      this.element.style.top = `${this.centerY - radius}px`;
    }
  }

  private startRenderLoop(): void {
    const render = () => {
      // Continuous rendering for smooth updates
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    if (!navigator.vibrate) return;
    
    const theme = StyleSystem.getInstance().getTheme();
    const pattern = theme.touch.haptics[intensity];
    navigator.vibrate(pattern);
  }

  /**
   * Public Methods
   */
  
  public setPosition(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.updateElementPosition();
    this.forceUpdate();
  }

  public setVisible(visible: boolean): void {
    this.updateProps({ visible });
  }

  public getCurrentInput(): { x: number; y: number; magnitude: number; angle: number } {
    const { magnitude, angle } = this.state;
    const { sensitivity } = this.mergedProps;
    
    return {
      x: Math.cos(angle) * magnitude * sensitivity!,
      y: Math.sin(angle) * magnitude * sensitivity!,
      magnitude,
      angle
    };
  }

  public reset(): void {
    this.endJoystick();
  }

  protected beforeUnmount(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clean up event listeners
    document.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    document.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    document.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }
}

/**
 * Utility function to create a joystick with common game presets
 */
export class VirtualJoystickFactory {
  /**
   * Create a movement joystick for player control
   */
  static createMovementJoystick(onMove: VirtualJoystickProps['onMove']): VirtualJoystick {
    return new VirtualJoystick({
      size: 120,
      innerSize: 50,
      position: { x: 100, y: window.innerHeight - 120 },
      deadzone: 0.15,
      sensitivity: 1.0,
      snapToCenter: true,
      onMove
    });
  }

  /**
   * Create a camera control joystick
   */
  static createCameraJoystick(onMove: VirtualJoystickProps['onMove']): VirtualJoystick {
    return new VirtualJoystick({
      size: 100,
      innerSize: 40,
      position: { x: window.innerWidth - 100, y: window.innerHeight - 120 },
      deadzone: 0.1,
      sensitivity: 0.8,
      snapToCenter: true,
      onMove
    });
  }

  /**
   * Create a floating joystick that appears where touched
   */
  static createFloatingJoystick(onMove: VirtualJoystickProps['onMove']): VirtualJoystick {
    return new VirtualJoystick({
      size: 100,
      innerSize: 40,
      deadzone: 0.1,
      sensitivity: 1.0,
      visible: false,
      followTouch: true,
      snapToCenter: true,
      onMove,
      onStart: function() {
        this.setVisible(true);
      },
      onEnd: function() {
        this.setVisible(false);
      }
    });
  }
}