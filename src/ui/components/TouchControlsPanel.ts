/**
 * TouchControlsPanel Component
 * Virtual controls for touch devices
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from './GameComponent';
import { VirtualJoystick } from './VirtualJoystick';
import { TouchButton } from './TouchButton';
import { styled } from '../core/styled';

interface TouchControlsProps extends GameComponentProps {
  canvas: HTMLCanvasElement;
}

interface TouchControlsState extends GameComponentState {
  enabled: boolean;
  showHints: boolean;
}

export class TouchControlsPanel extends GameComponent<TouchControlsProps, TouchControlsState> {
  private joystick: VirtualJoystick | null = null;
  private shootButton: TouchButton | null = null;
  private pauseButton: TouchButton | null = null;
  
  override getInitialState(): TouchControlsState {
    return {
      visible: this.isMobile,
      loading: false,
      error: null,
      enabled: this.isMobile,
      showHints: true
    };
  }

  onMount(): void {
    super.onMount();
    
    // Set up game event listeners
    this.game.on('gamePaused', () => {
      this.updatePauseButton(true);
    });
    
    this.game.on('gameResumed', () => {
      this.updatePauseButton(false);
    });
    
    // Hide hints after 5 seconds
    setTimeout(() => {
      this.setState({ showHints: false });
    }, 5000);
  }
  
  protected renderContent(): HTMLElement {
    if (!this.state.enabled || !this.isMobile) {
      return this.createElement(styled.div`display: none;`);
    }

    const Container = this.createContainer('touch-controls-panel', {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 900,
      touchAction: 'none'
    });

    const container = this.createElement(Container);
    
    // Create control areas using styled components
    const ControlsArea = styled.div`
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    
    const controlsArea = this.createElement(ControlsArea);
    
    // Virtual joystick (bottom-left)
    const joystickContainer = this.createJoystickContainer();
    controlsArea.appendChild(joystickContainer);
    
    // Action buttons (bottom-right)
    const actionsContainer = this.createActionsContainer();
    controlsArea.appendChild(actionsContainer);
    
    // Pause button (top-center)
    const pauseContainer = this.createPauseContainer();
    controlsArea.appendChild(pauseContainer);
    
    // Touch hints overlay
    if (this.state.showHints) {
      const hintsContainer = this.createTouchHints();
      controlsArea.appendChild(hintsContainer);
    }
    
    container.appendChild(controlsArea);
    
    return container;
  }
  
  private createJoystickContainer(): HTMLElement {
    const JoystickArea = styled.div`
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 140px;
      height: 140px;
      pointer-events: auto;
      z-index: 910;
      
      /* Safe area for notched devices */
      bottom: max(20px, env(safe-area-inset-bottom, 20px));
      left: max(20px, env(safe-area-inset-left, 20px));
    `;
    
    const joystickArea = this.createElement(JoystickArea);
    
    // Create virtual joystick
    this.joystick = new VirtualJoystick({
      id: 'movement-joystick',
      position: { x: 70, y: 70 },
      size: 120,
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    });
    
    // Connect joystick events
    this.joystick.on('move', (data) => {
      this.handleJoystickMove(data);
    });
    
    this.joystick.on('release', () => {
      this.handleJoystickRelease();
    });
    
    this.joystick.mount(joystickArea);
    
    // Add label
    const JoystickLabel = styled.div`
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      text-align: center;
      pointer-events: none;
      opacity: 0.8;
    `;
    
    const label = this.createElement(JoystickLabel, {}, 'Move');
    joystickArea.appendChild(label);
    
    return joystickArea;
  }
  
  private createActionsContainer(): HTMLElement {
    const ActionsArea = styled.div`
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 100px;
      height: 100px;
      pointer-events: auto;
      z-index: 910;
      
      /* Safe area for notched devices */
      bottom: max(20px, env(safe-area-inset-bottom, 20px));
      right: max(20px, env(safe-area-inset-right, 20px));
    `;
    
    const actionsArea = this.createElement(ActionsArea);
    
    // Shoot button
    this.shootButton = new TouchButton({
      id: 'shoot-button',
      text: '🎯',
      size: 'large',
      variant: 'primary',
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        fontSize: '28px',
        background: 'rgba(76, 175, 80, 0.9)',
        border: '2px solid rgba(76, 175, 80, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }
    });
    
    // Connect shoot button events
    this.shootButton.on('press', () => {
      this.handleShootStart();
    });
    
    this.shootButton.on('release', () => {
      this.handleShootEnd();
    });
    
    this.shootButton.mount(actionsArea);
    
    // Add label
    const ShootLabel = styled.div`
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      text-align: center;
      pointer-events: none;
      opacity: 0.8;
    `;
    
    const label = this.createElement(ShootLabel, {}, 'Shoot');
    actionsArea.appendChild(label);
    
    return actionsArea;
  }
  
  private createPauseContainer(): HTMLElement {
    const PauseArea = styled.div`
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 60px;
      pointer-events: auto;
      z-index: 910;
      
      /* Safe area for notched devices */
      top: max(60px, env(safe-area-inset-top, 60px));
    `;
    
    const pauseArea = this.createElement(PauseArea);
    
    // Pause button
    this.pauseButton = new TouchButton({
      id: 'pause-button',
      text: '⏸️',
      size: 'medium',
      variant: 'secondary',
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '50px',
        height: '50px',
        borderRadius: '25px',
        fontSize: '16px',
        background: 'rgba(97, 97, 97, 0.9)',
        border: '2px solid rgba(117, 117, 117, 1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }
    });
    
    // Connect pause button events
    this.pauseButton.on('tap', () => {
      this.handlePauseToggle();
    });
    
    this.pauseButton.mount(pauseArea);
    
    return pauseArea;
  }
  
  private createTouchHints(): HTMLElement {
    const HintsContainer = styled.div`
      position: absolute;
      bottom: 180px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: ${(props: { theme: any }) => props.theme.colors.text};
      padding: ${(props: { theme: any }) => props.theme.spacing.sm} ${(props: { theme: any }) => props.theme.spacing.md};
      border-radius: 20px;
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      pointer-events: none;
      text-align: center;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: opacity 1s ease;
      max-width: 280px;
      z-index: 920;
      
      /* Safe area for notched devices */
      bottom: max(180px, calc(env(safe-area-inset-bottom, 0px) + 180px));
    `;
    
    const hintsContainer = this.createElement(HintsContainer, { className: 'touch-hints' });
    
    const HintsTitle = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.semibold};
      margin-bottom: 4px;
      color: ${(props: { theme: any }) => props.theme.colors.primary};
    `;
    
    const HintsText = styled.div`
      opacity: 0.9;
      line-height: 1.3;
    `;
    
    const title = this.createElement(HintsTitle, {}, '📱 Touch Controls Active');
    const text = this.createElement(HintsText, {}, 'Use joystick to move • Tap shoot button • Tap pause to pause');
    
    hintsContainer.appendChild(title);
    hintsContainer.appendChild(text);
    
    return hintsContainer;
  }
  
  /**
   * Event handlers for touch controls
   */
  private handleJoystickMove(data: { direction: number; magnitude: number }): void {
    // Convert joystick data to game movement
    const moveX = Math.cos(data.direction) * data.magnitude;
    const moveY = Math.sin(data.direction) * data.magnitude;
    
    // Send movement data to game through input system
    if (this.props.canvas) {
      const event = new CustomEvent('gamepadmove', {
        detail: { x: moveX, y: moveY, magnitude: data.magnitude }
      });
      this.props.canvas.dispatchEvent(event);
    }
  }
  
  private handleJoystickRelease(): void {
    // Stop movement
    if (this.props.canvas) {
      const event = new CustomEvent('gamepadmove', {
        detail: { x: 0, y: 0, magnitude: 0 }
      });
      this.props.canvas.dispatchEvent(event);
    }
  }
  
  private handleShootStart(): void {
    // Start shooting
    if (this.props.canvas) {
      const event = new CustomEvent('gamepadbutton', {
        detail: { button: 'shoot', pressed: true }
      });
      this.props.canvas.dispatchEvent(event);
    }
    
    // Visual feedback
    this.addRippleEffect(this.shootButton?.getElement());
  }
  
  private handleShootEnd(): void {
    // Stop shooting
    if (this.props.canvas) {
      const event = new CustomEvent('gamepadbutton', {
        detail: { button: 'shoot', pressed: false }
      });
      this.props.canvas.dispatchEvent(event);
    }
  }
  
  private handlePauseToggle(): void {
    // Toggle pause state
    if (this.game.isPaused()) {
      this.game.resume();
    } else {
      this.game.pause();
    }
    
    // Visual feedback
    this.addRippleEffect(this.pauseButton?.getElement());
  }
  
  private updatePauseButton(isPaused: boolean): void {
    if (this.pauseButton) {
      const element = this.pauseButton.getElement();
      if (element) {
        // Update button text/icon
        const textElement = element.querySelector('.button-text');
        if (textElement) {
          textElement.textContent = isPaused ? '▶️' : '⏸️';
        }
        
        // Update button style
        element.style.background = isPaused ? 
          'rgba(76, 175, 80, 0.9)' : 'rgba(97, 97, 97, 0.9)';
      }
    }
  }
  
  /**
   * Add visual ripple effect to button
   */
  private addRippleEffect(element: HTMLElement | null): void {
    if (!element) return;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin-top: -10px;
      margin-left: -10px;
    `;
    
    element.appendChild(ripple);
    
    // Add ripple animation if not already added
    if (!document.getElementById('touch-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'touch-ripple-styles';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove ripple after animation
    setTimeout(() => ripple.remove(), 600);
  }
  
  /**
   * Public API methods
   */
  public setEnabled(enabled: boolean): void {
    this.setState({ enabled });
  }
  
  public toggleEnabled(): void {
    this.setState({ enabled: !this.state.enabled });
  }
  
  /**
   * Called after state updates to refresh display
   */
  onStateUpdate(): void {
    super.onStateUpdate();
    
    // Hide hints after state change if needed
    if (!this.state.showHints) {
      const hintsElement = this.getElement()?.querySelector('.touch-hints') as HTMLElement;
      if (hintsElement) {
        hintsElement.style.opacity = '0';
        setTimeout(() => hintsElement.remove(), 1000);
      }
    }
  }
}