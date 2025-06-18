import { COLOR_THEME } from '@/config/ColorTheme';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export class TouchIndicator {
  private container: HTMLElement;
  private indicators: Map<number, HTMLElement> = new Map();
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupStyles();
  }
  
  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .touch-indicator {
        position: fixed;
        width: ${UI_CONSTANTS.mobileControls.button.size}px;
        height: ${UI_CONSTANTS.mobileControls.button.size}px;
        border-radius: 50%;
        background: radial-gradient(circle, ${COLOR_THEME.ui.text.primary}4d, transparent);
        border: 2px solid ${COLOR_THEME.ui.text.primary}99;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: touchPulse ${ANIMATION_CONFIG.durations.powerUpCollect}ms ease-out;
        z-index: 10000;
      }
      
      @keyframes touchPulse {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0;
        }
      }
      
      .touch-ripple {
        position: fixed;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${COLOR_THEME.ui.text.primary}66;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: rippleEffect ${ANIMATION_CONFIG.particles.explosionDuration * 0.6}ms ease-out forwards;
        z-index: 10000;
      }
      
      @keyframes rippleEffect {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.6;
        }
        100% {
          transform: translate(-50%, -50%) scale(3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  showTouch(touchId: number, x: number, y: number): void {
    // Remove existing indicator if any
    this.hideTouch(touchId);
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'touch-indicator';
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    
    this.container.appendChild(indicator);
    this.indicators.set(touchId, indicator);
    
    // Auto-remove after animation
    setTimeout(() => {
      this.hideTouch(touchId);
    }, ANIMATION_CONFIG.durations.powerUpCollect);
  }
  
  showRipple(x: number, y: number): void {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    this.container.appendChild(ripple);
    
    // Remove after animation
    setTimeout(() => {
      ripple.remove();
    }, ANIMATION_CONFIG.particles.explosionDuration * 0.6);
  }
  
  updateTouch(touchId: number, x: number, y: number): void {
    const indicator = this.indicators.get(touchId);
    if (indicator) {
      indicator.style.left = `${x}px`;
      indicator.style.top = `${y}px`;
    }
  }
  
  hideTouch(touchId: number): void {
    const indicator = this.indicators.get(touchId);
    if (indicator) {
      indicator.remove();
      this.indicators.delete(touchId);
    }
  }
  
  hideAllTouches(): void {
    this.indicators.forEach((indicator) => indicator.remove());
    this.indicators.clear();
  }
}