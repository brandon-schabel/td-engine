/**
 * MobileControls.ts
 * 
 * Recent changes:
 * 1. Added passive: false to touch event listeners for better performance
 * 2. Fixed touch event handling to use window for mouse move/up events
 * 3. Added touch ID tracking for proper multi-touch support
 * 4. Improved joystick movement logic for smooth diagonal movement
 * 5. Fixed getEventPosition to handle changedTouches for touchend/touchcancel
 */

import type { Game } from '@/core/Game';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';
import { RESPONSIVE_CONFIG, getBreakpoint } from '@/config/ResponsiveConfig';
import { cn } from '@/ui/elements';

export interface MobileControlsOptions {
  game: Game;
  container: HTMLElement;
  onShootStart?: () => void;
  onShootEnd?: () => void;
  enableHaptic?: boolean;
}

export class MobileControls {
  private game: Game;
  private container: HTMLElement;
  private controlsElement: HTMLElement;
  private aimJoystick: HTMLElement;
  private aimJoystickKnob: HTMLElement;
  private moveJoystick: HTMLElement;
  private joystickKnob: HTMLElement;

  private isAimActive = false;
  private isMoveActive = false;
  private moveStartPos = { x: 0, y: 0 };
  private aimStartPos = { x: 0, y: 0 };
  private moveTouchId: number | null = null;
  private aimTouchId: number | null = null;
  private joystickRadius = 60;
  private knobRadius = 25;
  private controlsHeight = 200;
  private safeAreaBottom = 0;

  private options: MobileControlsOptions;
  
  /**
   * Check if any joystick is currently active
   */
  public isJoystickActive(): boolean {
    return this.isAimActive || this.isMoveActive;
  }
  
  /**
   * Get active touch IDs for joysticks
   */
  public getActiveTouchIds(): number[] {
    const ids: number[] = [];
    if (this.moveTouchId !== null) ids.push(this.moveTouchId);
    if (this.aimTouchId !== null) ids.push(this.aimTouchId);
    return ids;
  }
  
  /**
   * Notify touch gesture manager about joystick state changes
   */
  private notifyGestureManager(): void {
    const touchGestureManager = this.game.getTouchGestureManager();
    if (touchGestureManager) {
      // Disable gestures when any joystick is active
      touchGestureManager.setEnabled(!this.isJoystickActive());
    }
  }

  constructor(options: MobileControlsOptions) {
    this.options = options;
    this.game = options.game;
    this.container = options.container;

    this.controlsElement = this.createControls();
    this.aimJoystick = this.controlsElement.querySelector('.aim-joystick') as HTMLElement;
    this.aimJoystickKnob = this.controlsElement.querySelector('.aim-joystick-knob') as HTMLElement;
    this.moveJoystick = this.controlsElement.querySelector('.move-joystick') as HTMLElement;
    this.joystickKnob = this.controlsElement.querySelector('.move-joystick .mobile-joystick-knob') as HTMLElement;

    // Validate that all elements were found
    if (!this.aimJoystick || !this.aimJoystickKnob || !this.moveJoystick || !this.joystickKnob) {
      console.error('MobileControls: Failed to find required joystick elements');
      return;
    }

    this.setupEventListeners();
    this.show();

    // Handle orientation changes and window resizes
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => this.handleResize());
  }

  private createControls(): HTMLElement {
    // Calculate responsive sizes based on viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // const baseSize = Math.min(vw, vh) * 0.15; // 15% of smallest dimension

    this.joystickRadius = UI_CONSTANTS.mobileControls.button.size;
    this.knobRadius = this.joystickRadius * 0.4;
    // const buttonSize = UI_CONSTANTS.mobileControls.button.size;

    // Get safe area insets
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom') || '0');
    this.safeAreaBottom = Math.max(RESPONSIVE_CONFIG.safeAreas.bottom, safeAreaBottom);

    // Adjust control height for smaller screens and account for control bar
    const controlBarHeight = vh < 768 ? 48 : 60; // Match control bar responsive heights
    this.controlsHeight = vh < RESPONSIVE_CONFIG.breakpoints.landscape.mobile ? 120 : 150;

    const controls = document.createElement('div');
    controls.className = cn(
      'mobile-controls',
      'fixed',
      'bottom-0',
      'left-0',
      'right-0',
      'pointer-events-none',
      'z-50',
      'block' // Always show by default, let show/hide methods control visibility
    );
    controls.style.height = `${this.controlsHeight + this.safeAreaBottom + controlBarHeight}px`;
    controls.style.paddingBottom = `${this.safeAreaBottom + controlBarHeight}px`;

    // Movement joystick (left side)
    const moveJoystick = document.createElement('div');
    moveJoystick.className = cn(
      'mobile-joystick',
      'move-joystick',
      'absolute',
      'bg-controls-joystick-base',
      'border-2',
      'border-controls-joystick-baseBorder',
      'rounded-full',
      'opacity-60',
      'pointer-events-auto',
      'transition-opacity',
      'active:opacity-80'
    );
    const breakpoint = getBreakpoint(vw);
    const layoutConfig = breakpoint === 'mobile' ? RESPONSIVE_CONFIG.layout.hud.mobile :
      breakpoint === 'tablet' ? RESPONSIVE_CONFIG.layout.hud.tablet :
        RESPONSIVE_CONFIG.layout.hud.desktop;
    const joystickMargin = layoutConfig.sideMargin;
    const bottomOffset = layoutConfig.bottomOffset;
    moveJoystick.style.bottom = `${this.safeAreaBottom + bottomOffset}px`;
    moveJoystick.style.left = `${joystickMargin}px`;
    moveJoystick.style.width = `${this.joystickRadius * 2}px`;
    moveJoystick.style.height = `${this.joystickRadius * 2}px`;

    const joystickKnob = document.createElement('div');
    joystickKnob.className = cn(
      'mobile-joystick-knob',
      'absolute',
      'top-1/2',
      'left-1/2',
      'transform',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'bg-controls-joystick-knob',
      'border-2',
      'border-controls-joystick-knobBorder',
      'rounded-full',
      'flex',
      'items-center',
      'justify-center',
      'shadow-md',
      'pointer-events-none'
    );
    joystickKnob.style.width = `${this.knobRadius * 2}px`;
    joystickKnob.style.height = `${this.knobRadius * 2}px`;

    const moveIcon = document.createElement('div');
    moveIcon.className = cn('mobile-joystick-icon', 'text-on-primary');
    moveIcon.innerHTML = createSvgIcon(IconType.ARROW_UP, { size: 24 });

    joystickKnob.appendChild(moveIcon);
    moveJoystick.appendChild(joystickKnob);

    // Aim joystick (right side)
    const aimJoystick = document.createElement('div');
    aimJoystick.className = cn(
      'mobile-joystick',
      'aim-joystick',
      'absolute',
      'bg-danger/20',
      'border-2',
      'border-danger/50',
      'rounded-full',
      'opacity-60',
      'pointer-events-auto',
      'transition-opacity',
      'active:opacity-80'
    );
    const aimJoystickMargin = Math.max(20, vw * 0.05); // 5% of viewport width
    aimJoystick.style.bottom = `${this.safeAreaBottom + bottomOffset}px`;
    aimJoystick.style.right = `${aimJoystickMargin}px`;
    aimJoystick.style.width = `${this.joystickRadius * 2}px`;
    aimJoystick.style.height = `${this.joystickRadius * 2}px`;

    const aimJoystickKnob = document.createElement('div');
    aimJoystickKnob.className = cn(
      'mobile-joystick-knob',
      'aim-joystick-knob',
      'absolute',
      'top-1/2',
      'left-1/2',
      'transform',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'bg-danger/50',
      'rounded-full',
      'flex',
      'items-center',
      'justify-center',
      'shadow-md',
      'pointer-events-none'
    );
    aimJoystickKnob.style.width = `${this.knobRadius * 2}px`;
    aimJoystickKnob.style.height = `${this.knobRadius * 2}px`;

    const aimIcon = document.createElement('div');
    aimIcon.className = cn('mobile-joystick-icon', 'text-on-danger');
    aimIcon.innerHTML = createSvgIcon(IconType.CROSSHAIR, { size: 24 });

    aimJoystickKnob.appendChild(aimIcon);
    aimJoystick.appendChild(aimJoystickKnob);

    // Add all elements
    controls.appendChild(moveJoystick);
    controls.appendChild(aimJoystick);
    this.container.appendChild(controls);


    // Remove style injection - styles are now in ComponentStyles.ts

    return controls;
  }

  private setupEventListeners(): void {
    // Aim joystick events - start events on the joystick elements
    this.aimJoystick.addEventListener('touchstart', this.handleAimStart.bind(this), { passive: false });
    this.moveJoystick.addEventListener('touchstart', this.handleMoveStart.bind(this), { passive: false });

    // Global touch events on window for better multi-touch tracking
    window.addEventListener('touchmove', (e: TouchEvent) => {
      // Don't handle if we're in tower placement mode
      if (this.game.getSelectedTowerType()) {
        return;
      }

      if (this.isAimActive) {
        this.handleAimUpdate(e);
      }
      if (this.isMoveActive) {
        this.handleMoveUpdate(e);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e: TouchEvent) => {
      if (this.isAimActive) {
        this.handleAimEnd(e);
      }
      if (this.isMoveActive) {
        this.handleMoveEnd(e);
      }
    }, { passive: false });

    window.addEventListener('touchcancel', (e: TouchEvent) => {
      if (this.isAimActive) {
        this.handleAimEnd(e);
      }
      if (this.isMoveActive) {
        this.handleMoveEnd(e);
      }
    }, { passive: false });

    // Mouse events for testing on desktop
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.aimJoystick.addEventListener('mousedown', this.handleAimStart.bind(this));
      this.moveJoystick.addEventListener('mousedown', this.handleMoveStart.bind(this));

      // Use window for mousemove to track movement outside joystick bounds
      window.addEventListener('mousemove', (e: MouseEvent) => {
        if (this.isAimActive) {
          this.handleAimUpdate(e as any);
        }
        if (this.isMoveActive) {
          this.handleMoveUpdate(e as any);
        }
      });

      window.addEventListener('mouseup', (e: MouseEvent) => {
        if (this.isAimActive || this.isMoveActive) {
          this.handleAimEnd(e);
          this.handleMoveEnd(e);
        }
      });
    }
  }

  private handleAimStart(e: TouchEvent | MouseEvent): void {
    // Don't start aiming if we're in tower placement mode
    if (this.game.getSelectedTowerType()) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Track touch ID for multi-touch support
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      this.aimTouchId = e.changedTouches[0].identifier;
    }

    this.isAimActive = true;
    
    // Notify touch gesture manager to disable gestures
    this.notifyGestureManager();
    this.aimJoystick.classList.add('active', 'opacity-80');
    this.aimJoystick.classList.remove('opacity-60');

    const rect = this.aimJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    this.aimStartPos = { x: centerX, y: centerY };

    // Get initial touch/mouse position
    const pos = this.getEventPosition(e);
    this.updateAimJoystickPosition(pos.x, pos.y);

    // Haptic feedback
    if (this.options.enableHaptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Start continuous shooting on the player
    const player = this.game.getPlayer();
    if (player) {
      player.startShooting();
    }

    if (this.options.onShootStart) {
      this.options.onShootStart();
    }
  }

  private handleAimUpdate(e: TouchEvent | MouseEvent): void {
    if (!this.isAimActive) return;

    e.preventDefault();

    // For touch events, only process the correct touch
    if ('touches' in e && this.aimTouchId !== null) {
      let found = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.aimTouchId) {
          const touch = e.touches[i];
          this.updateAimJoystickPosition(touch.clientX, touch.clientY);
          found = true;
          break;
        }
      }
      if (!found) return;
    } else {
      const pos = this.getEventPosition(e);
      this.updateAimJoystickPosition(pos.x, pos.y);
    }
  }

  private handleAimEnd(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    // For touch events, only process the correct touch
    if ('changedTouches' in e && this.aimTouchId !== null) {
      let found = false;
      const touchEvent = e as TouchEvent;
      for (let i = 0; i < touchEvent.changedTouches.length; i++) {
        if (touchEvent.changedTouches[i].identifier === this.aimTouchId) {
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    this.isAimActive = false;
    this.aimTouchId = null;
    
    // Re-enable gestures if no joysticks are active
    this.notifyGestureManager();
    this.aimJoystick.classList.remove('active', 'opacity-80');
    this.aimJoystick.classList.add('opacity-60');

    // Reset joystick position with smooth transition
    this.aimJoystickKnob.style.transition = `transform ${ANIMATION_CONFIG.durations.uiTransition}ms ease-out`;
    this.aimJoystickKnob.style.transform = 'translate(-50%, -50%)';

    // Reset transition after animation
    setTimeout(() => {
      this.aimJoystickKnob.style.transition = 'none';
    }, ANIMATION_CONFIG.durations.uiTransition);

    // Stop continuous shooting on the player
    const player = this.game.getPlayer();
    if (player) {
      player.stopShooting();
    }

    if (this.options.onShootEnd) {
      this.options.onShootEnd();
    }
  }

  private updateAimJoystickPosition(touchX: number, touchY: number): void {
    const dx = touchX - this.aimStartPos.x;
    const dy = touchY - this.aimStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit to joystick radius
    const limitedDistance = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;

    // Update knob position
    this.aimJoystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Update player aim direction based on joystick position
    const player = this.game.getPlayer();
    if (player && distance > this.joystickRadius * 0.2) {
      // Only update aim if joystick is moved significantly
      player.setAimDirection(angle);
    }
  }

  private handleMoveStart(e: TouchEvent | MouseEvent): void {
    // Don't start movement if we're in tower placement mode
    if (this.game.getSelectedTowerType()) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Track touch ID for multi-touch support
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      this.moveTouchId = e.changedTouches[0].identifier;
    }

    this.isMoveActive = true;
    
    // Notify touch gesture manager to disable gestures
    this.notifyGestureManager();
    this.moveJoystick.classList.add('active', 'opacity-80');
    this.moveJoystick.classList.remove('opacity-60');

    const rect = this.moveJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    this.moveStartPos = { x: centerX, y: centerY };

    // Get initial touch/mouse position
    const pos = this.getEventPosition(e);
    this.updateJoystickPosition(pos.x, pos.y);
  }

  private handleMoveUpdate(e: TouchEvent | MouseEvent): void {
    if (!this.isMoveActive) return;

    e.preventDefault();

    // For touch events, only process the correct touch
    if ('touches' in e && this.moveTouchId !== null) {
      let found = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.moveTouchId) {
          const touch = e.touches[i];
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          found = true;
          break;
        }
      }
      if (!found) return;
    } else {
      const pos = this.getEventPosition(e);
      this.updateJoystickPosition(pos.x, pos.y);
    }
  }

  private handleMoveEnd(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    // For touch events, only process the correct touch
    if ('changedTouches' in e && this.moveTouchId !== null) {
      let found = false;
      const touchEvent = e as TouchEvent;
      for (let i = 0; i < touchEvent.changedTouches.length; i++) {
        if (touchEvent.changedTouches[i].identifier === this.moveTouchId) {
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    this.isMoveActive = false;
    this.moveTouchId = null;
    
    // Re-enable gestures if no joysticks are active
    this.notifyGestureManager();
    this.moveJoystick.classList.remove('active', 'opacity-80');
    this.moveJoystick.classList.add('opacity-60');

    // Reset joystick position with smooth transition
    this.joystickKnob.style.transition = `transform ${ANIMATION_CONFIG.durations.uiTransition}ms ease-out`;
    this.joystickKnob.style.transform = 'translate(-50%, -50%)';

    // Reset transition after animation
    setTimeout(() => {
      this.joystickKnob.style.transition = 'none';
    }, ANIMATION_CONFIG.durations.uiTransition);

    // Stop player movement
    const player = this.game.getPlayer();
    ['w', 'a', 's', 'd'].forEach(key => player.handleKeyUp(key));
  }

  private updateJoystickPosition(touchX: number, touchY: number): void {
    const dx = touchX - this.moveStartPos.x;
    const dy = touchY - this.moveStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit to joystick radius
    const limitedDistance = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;

    // Update knob position
    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Convert to movement input
    const threshold = this.joystickRadius * 0.2; // Lower threshold for better responsiveness
    const player = this.game.getPlayer();

    // Reset all movement keys
    ['w', 'a', 's', 'd'].forEach(key => player.handleKeyUp(key));

    // Apply movement based on joystick position
    if (distance > threshold) {
      // Normalize the input
      const normalizedX = dx / this.joystickRadius;
      const normalizedY = dy / this.joystickRadius;

      // Apply movement for all active directions
      // This allows smooth diagonal movement
      const directionThreshold = 0.3; // Threshold for activating a direction

      // Horizontal movement
      if (Math.abs(normalizedX) > directionThreshold) {
        if (normalizedX > 0) {
          player.handleKeyDown('d');
        } else {
          player.handleKeyDown('a');
        }
      }

      // Vertical movement
      if (Math.abs(normalizedY) > directionThreshold) {
        if (normalizedY > 0) {
          player.handleKeyDown('s');
        } else {
          player.handleKeyDown('w');
        }
      }
    }
  }

  private getEventPosition(e: TouchEvent | MouseEvent): { x: number; y: number } {
    if ('touches' in e) {
      // For touch events, use changedTouches for touchend/touchcancel
      const touches = e.touches.length > 0 ? e.touches : e.changedTouches;
      if (touches && touches.length > 0) {
        return { x: touches[0].clientX, y: touches[0].clientY };
      }
    } else if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }

  public show(): void {
    this.controlsElement.classList.remove('hidden', 'opacity-0');
    this.controlsElement.classList.add('block', 'opacity-100');
    this.controlsElement.style.display = 'block'; // Force display as fallback
  }

  public hide(): void {
    this.controlsElement.classList.remove('block', 'opacity-100');
    this.controlsElement.classList.add('hidden', 'opacity-0');
    this.controlsElement.style.display = 'none'; // Force hide as fallback
  }

  private handleResize(): void {
    // Recalculate sizes based on new viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // const baseSize = Math.min(vw, vh) * 0.15;

    this.joystickRadius = UI_CONSTANTS.mobileControls.button.size;
    this.knobRadius = this.joystickRadius * 0.4;
    // const buttonSize = UI_CONSTANTS.mobileControls.button.size;
    const margin = Math.max(20, vw * 0.05);

    // Update control height and account for control bar
    const controlBarHeight = vh < 768 ? 48 : 60;
    this.controlsHeight = vh < 600 ? 120 : 150;

    // Update element sizes and positions
    if (this.controlsElement) {
      this.controlsElement.style.height = `${this.controlsHeight + this.safeAreaBottom + controlBarHeight}px`;
      this.controlsElement.style.paddingBottom = `${this.safeAreaBottom + controlBarHeight}px`;
    }

    if (this.moveJoystick) {
      this.moveJoystick.style.width = `${this.joystickRadius * 2}px`;
      this.moveJoystick.style.height = `${this.joystickRadius * 2}px`;
      this.moveJoystick.style.bottom = `${this.safeAreaBottom + margin}px`;
      this.moveJoystick.style.left = `${margin}px`;
    }

    if (this.joystickKnob) {
      this.joystickKnob.style.width = `${this.knobRadius * 2}px`;
      this.joystickKnob.style.height = `${this.knobRadius * 2}px`;
    }

    if (this.aimJoystick) {
      this.aimJoystick.style.width = `${this.joystickRadius * 2}px`;
      this.aimJoystick.style.height = `${this.joystickRadius * 2}px`;
      this.aimJoystick.style.bottom = `${this.safeAreaBottom + margin}px`;
      this.aimJoystick.style.right = `${margin}px`;
    }

    if (this.aimJoystickKnob) {
      this.aimJoystickKnob.style.width = `${this.knobRadius * 2}px`;
      this.aimJoystickKnob.style.height = `${this.knobRadius * 2}px`;
    }
  }

  public destroy(): void {
    // Remove all event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('orientationchange', this.handleResize.bind(this));

    // Remove touch event listeners from window
    const touchMoveHandler = (e: TouchEvent) => {
      if (this.isAimActive) this.handleAimUpdate(e);
      if (this.isMoveActive) this.handleMoveUpdate(e);
    };
    const touchEndHandler = (e: TouchEvent) => {
      if (this.isAimActive) this.handleAimEnd(e);
      if (this.isMoveActive) this.handleMoveEnd(e);
    };

    window.removeEventListener('touchmove', touchMoveHandler);
    window.removeEventListener('touchend', touchEndHandler);
    window.removeEventListener('touchcancel', touchEndHandler);

    // Remove mouse event listeners if applicable
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.removeEventListener('mousemove', () => { });
      window.removeEventListener('mouseup', () => { });
    }

    this.controlsElement.remove();
  }
}